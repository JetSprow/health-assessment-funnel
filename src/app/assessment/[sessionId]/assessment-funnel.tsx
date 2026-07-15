"use client";

import { createClientRequestId } from "@/lib/client-request-id";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Gender = "MALE" | "FEMALE";
type Goal = "LOSE_WEIGHT" | "GAIN_WEIGHT" | "MAINTAIN_WEIGHT";
type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";

type Profile = {
  gender: Gender | null;
  goal: Goal | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  activityLevel: ActivityLevel | null;
};

type Progress = {
  id: string;
  status: "DRAFT" | "READY_TO_SUBMIT" | "COMPLETED";
  currentStep: number;
  version: number;
  profile: Profile | null;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: { code: string; message: string };
};

type StepKey = "gender" | "goal" | "age" | "height" | "weight" | "target-weight" | "activity";

type Step = {
  key: StepKey;
  eyebrow: string;
  title: string;
  description: string;
};

const EMPTY_PROFILE: Profile = {
  gender: null,
  goal: null,
  age: null,
  heightCm: null,
  weightKg: null,
  targetWeightKg: null,
  activityLevel: null,
};

const STEPS: Step[] = [
  { key: "gender", eyebrow: "关于你", title: "你的生理性别是？", description: "这能帮助我们更贴近你的身体状态。" },
  { key: "goal", eyebrow: "你的方向", title: "这次最想实现什么？", description: "不用追求标准答案，选择此刻最重要的方向。" },
  { key: "age", eyebrow: "关于你", title: "你今年多大？", description: "请输入 18–80 岁之间的年龄。" },
  { key: "height", eyebrow: "身体状态", title: "你的身高是多少？", description: "填写最近一次测量的数据即可。" },
  { key: "weight", eyebrow: "身体状态", title: "你现在的体重是？", description: "数字只是起点，我们更关注长期趋势。" },
  { key: "target-weight", eyebrow: "你的目标", title: "你的目标体重是？", description: "设定一个让你感到踏实、愿意长期坚持的目标。" },
  { key: "activity", eyebrow: "生活节奏", title: "你平时的活动水平？", description: "选择最接近最近四周平均状态的一项。" },
];

const goalOptions: Array<{ value: Goal; label: string; detail: string }> = [
  { value: "LOSE_WEIGHT", label: "健康减重", detail: "循序渐进，找回轻盈状态" },
  { value: "GAIN_WEIGHT", label: "稳步增重", detail: "增加能量，建立更有力量的状态" },
  { value: "MAINTAIN_WEIGHT", label: "保持状态", detail: "维持当下，优化生活节奏" },
];

const activityOptions: Array<{ value: ActivityLevel; label: string; detail: string }> = [
  { value: "SEDENTARY", label: "久坐为主", detail: "日常以坐着为主，很少主动运动" },
  { value: "LIGHT", label: "轻度活动", detail: "每周轻松活动或运动 1–3 天" },
  { value: "MODERATE", label: "中度活动", detail: "每周规律运动 3–5 天" },
  { value: "ACTIVE", label: "高度活动", detail: "大多数日子都有较高强度运动" },
  { value: "VERY_ACTIVE", label: "非常活跃", detail: "体力工作或几乎每天高强度训练" },
];

function firstIncompleteStep(profile: Profile): number {
  const values = [profile.gender, profile.goal, profile.age, profile.heightCm, profile.weightKg, profile.targetWeightKg, profile.activityLevel];
  const index = values.findIndex((value) => value === null);
  return index === -1 ? STEPS.length - 1 : index;
}

function clientValidation(profile: Profile, stepIndex: number): string | null {
  switch (STEPS[stepIndex].key) {
    case "gender":
      return profile.gender ? null : "请选择你的生理性别。";
    case "goal":
      return profile.goal ? null : "请选择一个最重要的目标。";
    case "age":
      return profile.age !== null && Number.isInteger(profile.age) && profile.age >= 18 && profile.age <= 80 ? null : "请输入 18–80 之间的整数年龄。";
    case "height":
      return profile.heightCm !== null && profile.heightCm >= 120 && profile.heightCm <= 230 ? null : "请输入 120–230 cm 之间的身高。";
    case "weight":
      return profile.weightKg !== null && profile.weightKg >= 35 && profile.weightKg <= 300 ? null : "请输入 35–300 kg 之间的体重。";
    case "target-weight": {
      const { goal, weightKg, targetWeightKg } = profile;
      if (targetWeightKg === null || targetWeightKg < 35 || targetWeightKg > 300) return "请输入 35–300 kg 之间的目标体重。";
      if (weightKg === null || goal === null) return "请先补全前面的信息。";
      if (goal === "LOSE_WEIGHT" && targetWeightKg >= weightKg) return "减重目标需要低于当前体重。";
      if (goal === "GAIN_WEIGHT" && targetWeightKg <= weightKg) return "增重目标需要高于当前体重。";
      if (goal === "MAINTAIN_WEIGHT" && Math.abs(targetWeightKg - weightKg) > 2) return "保持状态时，目标与当前体重建议相差不超过 2 kg。";
      return null;
    }
    case "activity":
      return profile.activityLevel ? null : "请选择最接近你的活动水平。";
  }
}

function payloadForStep(profile: Profile, stepKey: StepKey): Record<string, unknown> {
  switch (stepKey) {
    case "gender": return { gender: profile.gender };
    case "goal": return { goal: profile.goal };
    case "age": return { age: profile.age };
    case "height": return { heightCm: profile.heightCm };
    case "weight": return { weightKg: profile.weightKg };
    case "target-weight": return { targetWeightKg: profile.targetWeightKg };
    case "activity": return { activityLevel: profile.activityLevel };
  }
}

function ArrowIcon({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`size-5 ${back ? "rotate-180" : ""}`}>
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
      <path d="m5 10 3 3 7-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function OptionButton({ selected, label, detail, onClick }: { selected: boolean; label: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-[1.35rem] border p-4 text-left transition duration-300 sm:p-5 ${
        selected
          ? "border-[#10231d] bg-[#10231d] text-white shadow-[0_18px_45px_rgba(16,35,29,.16)]"
          : "border-[#10231d]/10 bg-white/70 hover:-translate-y-1 hover:border-[#10231d]/25 hover:bg-white hover:shadow-[0_16px_40px_rgba(16,35,29,.08)]"
      }`}
    >
      <span>
        <span className="block font-semibold tracking-[-0.02em]">{label}</span>
        <span className={`mt-1.5 block text-sm leading-6 ${selected ? "text-white/48" : "text-[#6b7771]"}`}>{detail}</span>
      </span>
      <span className={`ml-4 grid size-8 shrink-0 place-items-center rounded-full border transition duration-300 ${selected ? "border-[#c8f25f] bg-[#c8f25f] text-[#10231d]" : "border-[#10231d]/15 text-transparent group-hover:border-[#10231d]/35"}`}>
        <CheckIcon />
      </span>
    </button>
  );
}

export function AssessmentFunnel({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [version, setVersion] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "saving" | "submitting" | "error">("loading");
  const [message, setMessage] = useState("正在回到上次的位置…");

  const restoreProgress = useCallback(async () => {
    const response = await fetch(`/api/sessions/${sessionId}/progress`, { cache: "no-store" });
    const payload = (await response.json()) as ApiEnvelope<Progress>;
    if (!response.ok || !payload.data) throw new Error("暂时无法读取进度，请稍后再试。");

    if (payload.data.status === "COMPLETED") {
      router.replace(`/assessment/${sessionId}/result`);
      return;
    }

    const restoredProfile = { ...EMPTY_PROFILE, ...(payload.data.profile ?? {}) };
    setProfile(restoredProfile);
    setVersion(payload.data.version);
    setStepIndex(firstIncompleteStep(restoredProfile));
    setPhase("ready");
    setMessage(payload.data.version > 0 ? "已恢复上次保存的进度" : "你的回答会自动保存");
  }, [router, sessionId]);

  useEffect(() => {
    // Progress is loaded after the external request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restoreProgress().catch(() => {
      setPhase("error");
      setMessage("暂时无法读取进度，请刷新后重试。");
    });
  }, [restoreProgress]);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const validationMessage = useMemo(() => clientValidation(profile, stepIndex), [profile, stepIndex]);

  function setNumeric(field: "age" | "heightCm" | "weightKg" | "targetWeightKg", rawValue: string) {
    setProfile((current) => ({ ...current, [field]: rawValue === "" ? null : Number(rawValue) }));
    if (phase === "error") setPhase("ready");
  }

  async function submitAssessment(nextVersion: number) {
    setPhase("submitting");
    setMessage("正在整理你的专属报告…");
    const response = await fetch(`/api/sessions/${sessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: nextVersion }),
    });
    const payload = (await response.json()) as ApiEnvelope<{ version: number }>;

    if (response.status === 409) {
      await restoreProgress();
      setMessage("已同步最新进度，请再次生成报告。");
      return;
    }
    if (!response.ok || !payload.data) throw new Error("报告暂时没有生成成功，请再试一次。");

    router.push(`/assessment/${sessionId}/result`);
  }

  async function saveAndContinue() {
    if (validationMessage) {
      setPhase("error");
      setMessage(validationMessage);
      return;
    }

    setPhase("saving");
    setMessage("正在保存…");

    try {
      const response = await fetch(`/api/sessions/${sessionId}/steps/${currentStep.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: `${currentStep.key}-${createClientRequestId()}`,
          version,
          data: payloadForStep(profile, currentStep.key),
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<{ version: number }>;

      if (response.status === 409) {
        await restoreProgress();
        setMessage("已为你同步最新进度。");
        return;
      }
      if (!response.ok || !payload.data) throw new Error("暂时没有保存成功，请再试一次。");

      setVersion(payload.data.version);
      if (stepIndex === STEPS.length - 1) {
        await submitAssessment(payload.data.version);
      } else {
        setStepIndex((current) => current + 1);
        setPhase("ready");
        setMessage("已保存");
      }
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "暂时没有保存成功，请再试一次。");
    }
  }

  if (phase === "loading") {
    return (
      <main className="surface-noise grid min-h-screen place-items-center bg-[#10231d] px-5 text-white">
        <div className="text-center">
          <div className="relative mx-auto size-16">
            <span className="absolute inset-0 rounded-full border border-white/15" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#c8f25f]" />
            <span className="pulse-soft absolute inset-[38%] rounded-full bg-[#c8f25f]" />
          </div>
          <p className="mt-6 text-sm text-white/55">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="surface-noise min-h-screen bg-[#10231d] px-4 py-4 text-white sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex items-center justify-between px-1 py-2 sm:px-2">
          <button type="button" onClick={() => router.push("/")} className="text-sm font-semibold tracking-[-0.02em] text-white transition hover:text-[#c8f25f]">BETTER SELF</button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-medium text-white/55 backdrop-blur">
            <span className={`size-1.5 rounded-full ${phase === "error" ? "bg-[#ff795c]" : "bg-[#c8f25f]"}`} />
            {phase === "saving" ? "正在保存" : phase === "submitting" ? "正在生成报告" : "私密填写 · 自动保存"}
          </div>
        </header>

        <div className="mt-4 overflow-hidden rounded-[2rem] bg-[#f3f1eb] text-[#10231d] shadow-[0_30px_100px_rgba(0,0,0,.32)] sm:mt-6 lg:min-h-[calc(100vh-112px)] lg:rounded-[2.5rem]">
          <div className="h-1.5 bg-[#dfe2dc]">
            <div className="h-full rounded-r-full bg-[#c8f25f] transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid lg:min-h-[calc(100vh-118px)] lg:grid-cols-[310px_1fr] xl:grid-cols-[350px_1fr]">
            <aside className="relative hidden overflow-hidden bg-[#dfe9d8] p-8 lg:flex lg:flex-col xl:p-10">
              <div className="absolute -bottom-32 -left-32 size-80 rounded-full border-[58px] border-[#10231d]" />
              <div className="absolute bottom-20 left-20 size-20 rounded-full border-[16px] border-[#ff795c]" />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#68766f]">你的进度</p>
                <p className="mt-5 text-5xl font-medium tracking-[-0.07em]">{String(stepIndex + 1).padStart(2, "0")}<span className="text-[#9aa69f]"> / 07</span></p>
                <ol className="mt-10 space-y-1.5">
                  {STEPS.map((step, index) => (
                    <li key={step.key} className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition duration-500 ${index === stepIndex ? "bg-[#10231d] font-semibold text-white" : index < stepIndex ? "text-[#40594f]" : "text-[#89958f]"}`}>
                      <span className={`grid size-6 place-items-center rounded-full text-[10px] ${index < stepIndex ? "bg-[#c8f25f] text-[#10231d]" : index === stepIndex ? "bg-[#c8f25f] text-[#10231d]" : "border border-[#10231d]/10"}`}>
                        {index < stepIndex ? <CheckIcon /> : index + 1}
                      </span>
                      {step.eyebrow}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="relative mt-auto rounded-[1.5rem] bg-white/55 p-5 text-xs leading-6 text-[#64716b] backdrop-blur">
                你的填写内容仅用于生成本次健康趋势参考。我们尊重并保护你的隐私。
              </div>
            </aside>

            <section className="flex min-h-[680px] flex-col p-5 sm:p-9 lg:min-h-0 lg:p-12 xl:p-16">
              <div className="flex items-center justify-between border-b border-[#10231d]/10 pb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6c7972]">{currentStep.eyebrow}</p>
                <p className="text-xs font-semibold text-[#7b8781]">{Math.round(progress)}%</p>
              </div>

              <div key={currentStep.key} className="step-enter mt-9 max-w-3xl sm:mt-12">
                <h1 className="text-balance text-4xl font-medium leading-[1.03] tracking-[-0.06em] sm:text-6xl">{currentStep.title}</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#68756f] sm:text-base">{currentStep.description}</p>

                <div className="mt-8 sm:mt-10">
                  {currentStep.key === "gender" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OptionButton selected={profile.gender === "FEMALE"} label="女性" detail="帮助我们更贴近你的身体状态" onClick={() => setProfile((p) => ({ ...p, gender: "FEMALE" }))} />
                      <OptionButton selected={profile.gender === "MALE"} label="男性" detail="帮助我们更贴近你的身体状态" onClick={() => setProfile((p) => ({ ...p, gender: "MALE" }))} />
                    </div>
                  ) : null}

                  {currentStep.key === "goal" ? (
                    <div className="grid gap-3">
                      {goalOptions.map((option) => <OptionButton key={option.value} selected={profile.goal === option.value} label={option.label} detail={option.detail} onClick={() => setProfile((p) => ({ ...p, goal: option.value }))} />)}
                    </div>
                  ) : null}

                  {currentStep.key === "age" ? <NumberField value={profile.age} onChange={(value) => setNumeric("age", value)} min={18} max={80} step={1} unit="岁" placeholder="28" /> : null}
                  {currentStep.key === "height" ? <NumberField value={profile.heightCm} onChange={(value) => setNumeric("heightCm", value)} min={120} max={230} step={0.1} unit="cm" placeholder="168" /> : null}
                  {currentStep.key === "weight" ? <NumberField value={profile.weightKg} onChange={(value) => setNumeric("weightKg", value)} min={35} max={300} step={0.1} unit="kg" placeholder="65" /> : null}
                  {currentStep.key === "target-weight" ? (
                    <div>
                      <NumberField value={profile.targetWeightKg} onChange={(value) => setNumeric("targetWeightKg", value)} min={35} max={300} step={0.1} unit="kg" placeholder="58" />
                      {profile.weightKg !== null ? <p className="mt-4 text-sm text-[#76827c]">当前体重 {profile.weightKg} kg</p> : null}
                    </div>
                  ) : null}

                  {currentStep.key === "activity" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activityOptions.map((option) => <OptionButton key={option.value} selected={profile.activityLevel === option.value} label={option.label} detail={option.detail} onClick={() => setProfile((p) => ({ ...p, activityLevel: option.value }))} />)}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-auto flex flex-col-reverse gap-5 pt-10 sm:flex-row sm:items-end sm:justify-between">
                <button
                  type="button"
                  disabled={stepIndex === 0 || phase === "saving" || phase === "submitting"}
                  onClick={() => { setStepIndex((current) => Math.max(0, current - 1)); setPhase("ready"); setMessage("你可以修改之前的回答"); }}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#5e6d65] transition hover:bg-white disabled:invisible"
                >
                  <ArrowIcon back />
                  上一步
                </button>
                <div className="flex flex-col items-stretch gap-3 sm:items-end">
                  <button
                    type="button"
                    onClick={saveAndContinue}
                    disabled={phase === "saving" || phase === "submitting"}
                    className="group inline-flex min-w-52 items-center justify-between gap-6 rounded-full bg-[#10231d] px-6 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(16,35,29,.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#1b4235] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70"
                  >
                    {phase === "saving" ? "正在保存…" : phase === "submitting" ? "正在生成报告…" : stepIndex === STEPS.length - 1 ? "生成我的报告" : "保存并继续"}
                    <span className="grid size-8 place-items-center rounded-full bg-[#c8f25f] text-[#10231d] transition duration-300 group-hover:translate-x-1">
                      {phase === "saving" || phase === "submitting" ? <span className="size-3 animate-spin rounded-full border-2 border-[#10231d]/25 border-t-[#10231d]" /> : <ArrowIcon />}
                    </span>
                  </button>
                  <p role={phase === "error" ? "alert" : "status"} className={`min-h-4 text-center text-xs sm:text-right ${phase === "error" ? "text-[#c84c36]" : "text-[#7a8780]"}`}>{message}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function NumberField({ value, onChange, min, max, step, unit, placeholder }: { value: number | null; onChange: (value: string) => void; min: number; max: number; step: number; unit: string; placeholder: string }) {
  return (
    <label className="block max-w-xl">
      <span className="flex items-end border-b-2 border-[#10231d]/18 pb-3 transition duration-300 focus-within:border-[#10231d]">
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent py-2 text-6xl font-medium tracking-[-0.075em] outline-none placeholder:text-[#c3c9c4] sm:text-8xl"
        />
        <span className="mb-3 ml-4 text-base font-semibold text-[#6f7b75] sm:mb-5">{unit}</span>
      </span>
      <span className="mt-4 block text-xs text-[#85908a]">请输入数字</span>
    </label>
  );
}

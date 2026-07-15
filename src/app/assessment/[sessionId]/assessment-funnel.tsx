"use client";

import { createClientRequestId } from "@/lib/client-request-id";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  nav: string;
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
  { key: "gender", eyebrow: "关于你", nav: "性别", title: "你的生理性别是？", description: "这能帮助我们更贴近你的身体状态。" },
  { key: "goal", eyebrow: "你的方向", nav: "目标", title: "这次最想实现什么？", description: "不用追求标准答案，选择此刻最重要的方向。" },
  { key: "age", eyebrow: "关于你", nav: "年龄", title: "你今年多大？", description: "请输入 18–80 岁之间的年龄。" },
  { key: "height", eyebrow: "身体状态", nav: "身高", title: "你的身高是多少？", description: "填写最近一次测量的数据即可。" },
  { key: "weight", eyebrow: "身体状态", nav: "体重", title: "你现在的体重是？", description: "数字只是起点，我们更关注长期趋势。" },
  { key: "target-weight", eyebrow: "你的目标", nav: "目标体重", title: "你的目标体重是？", description: "设定一个让你感到踏实、愿意长期坚持的目标。" },
  { key: "activity", eyebrow: "生活节奏", nav: "活动水平", title: "你平时的活动水平？", description: "选择最接近最近四周平均状态的一项。" },
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

function OptionButton({ index, selected, label, detail, onClick }: { index: number; selected: boolean; label: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-[1.35rem] border p-4 text-left transition duration-300 sm:p-5 ${
        selected
          ? "border-[#071c16] bg-[#071c16] text-white shadow-[0_18px_45px_rgba(7,28,22,.18)]"
          : "border-[#071c16]/10 bg-white/70 hover:-translate-y-1 hover:border-[#071c16]/25 hover:bg-white hover:shadow-[0_16px_40px_rgba(7,28,22,.08)]"
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold transition duration-300 ${
          selected ? "bg-[var(--lime)] text-[#071c16]" : "bg-[#eef0ea] text-[#8a948e] group-hover:bg-[#e3e7de]"
        }`}
        aria-hidden="true"
      >
        {index}
      </span>
      <span className="flex-1">
        <span className="block font-semibold tracking-[-0.02em]">{label}</span>
        <span className={`mt-1 block text-sm leading-6 ${selected ? "text-white/50" : "text-[#6b7771]"}`}>{detail}</span>
      </span>
      <span className={`grid size-8 shrink-0 place-items-center rounded-full border transition duration-300 ${selected ? "border-[var(--lime)] bg-[var(--lime)] text-[#071c16]" : "border-[#071c16]/15 text-transparent group-hover:border-[#071c16]/35"}`}>
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

  const submitAssessment = useCallback(
    async (nextVersion: number) => {
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
    },
    [restoreProgress, router, sessionId],
  );

  const saveAndContinue = useCallback(async () => {
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
  }, [currentStep.key, profile, restoreProgress, sessionId, stepIndex, submitAssessment, validationMessage, version]);

  function chooseOption(index: number) {
    switch (currentStep.key) {
      case "gender": {
        const gender: Gender | null = index === 0 ? "FEMALE" : index === 1 ? "MALE" : null;
        if (gender) setProfile((p) => ({ ...p, gender }));
        break;
      }
      case "goal": {
        const option = goalOptions[index];
        if (option) setProfile((p) => ({ ...p, goal: option.value }));
        break;
      }
      case "activity": {
        const option = activityOptions[index];
        if (option) setProfile((p) => ({ ...p, activityLevel: option.value }));
        break;
      }
      default:
        break;
    }
  }

  // Keyboard: Enter continues; number keys pick options on choice steps.
  // The handler is refreshed after every render so the listener (attached
  // once) always calls the latest closure over state and callbacks.
  const keyHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});

  useEffect(() => {
    keyHandlerRef.current = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
      if (phase === "saving" || phase === "submitting" || phase === "loading") return;
      const tag = document.activeElement?.tagName;

      if (event.key === "Enter") {
        if (tag === "BUTTON" || tag === "A") return;
        event.preventDefault();
        void saveAndContinue();
        return;
      }

      if (tag === "INPUT") return;
      if (currentStep.key === "gender" || currentStep.key === "goal" || currentStep.key === "activity") {
        const numeric = Number(event.key);
        if (Number.isInteger(numeric) && numeric >= 1) chooseOption(numeric - 1);
      }
    };
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandlerRef.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  if (phase === "loading") {
    return (
      <main className="surface-noise relative grid min-h-screen place-items-center overflow-hidden bg-[#071c16] px-5 text-white">
        <div className="aurora" aria-hidden="true">
          <span className="aurora-blob aurora-1" />
          <span className="aurora-blob aurora-2" />
        </div>
        <div className="relative text-center">
          <div className="relative mx-auto size-16">
            <span className="absolute inset-0 rounded-full border border-white/15" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--lime)]" />
            <span className="pulse-soft absolute inset-[38%] rounded-full bg-[var(--lime)]" />
          </div>
          <p className="mt-6 text-sm text-white/55">{message}</p>
        </div>
      </main>
    );
  }

  const isBusy = phase === "saving" || phase === "submitting";
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <main className="surface-noise relative min-h-screen overflow-hidden bg-[#071c16] px-4 py-4 text-white sm:px-6 sm:py-6 lg:px-8">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-blob aurora-1" />
        <span className="aurora-blob aurora-2" />
        <span className="aurora-blob aurora-3" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px]">
        <header className="flex items-center justify-between px-1 py-2 sm:px-2">
          <button type="button" onClick={() => router.push("/")} className="text-sm font-semibold tracking-[-0.02em] text-white transition hover:text-[var(--lime)]">
            BETTER SELF
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-medium text-white/60 backdrop-blur">
            <span className={`size-1.5 rounded-full ${phase === "error" ? "bg-[var(--coral)]" : "bg-[var(--lime)]"} ${isBusy ? "animate-pulse" : ""}`} />
            {phase === "saving" ? "正在保存" : phase === "submitting" ? "正在生成报告" : "私密填写 · 自动保存"}
          </div>
        </header>

        <div className="mt-4 overflow-hidden rounded-[2rem] bg-[var(--paper)] text-[#071c16] shadow-[0_40px_120px_rgba(0,0,0,.45)] sm:mt-6 lg:min-h-[calc(100vh-112px)] lg:rounded-[2.5rem]">
          <div className="h-1.5 bg-[#dfe2dc]">
            <div className="h-full rounded-r-full bg-gradient-to-r from-[var(--teal)] via-[var(--lime)] to-[var(--lime-bright)] transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid lg:min-h-[calc(100vh-118px)] lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
            {/* Side rail (desktop) */}
            <aside className="surface-noise relative hidden overflow-hidden bg-[#0c2820] p-8 text-white lg:flex lg:flex-col xl:p-10">
              <div className="aurora opacity-80" aria-hidden="true">
                <span className="aurora-blob aurora-1" style={{ opacity: 0.3 }} />
                <span className="aurora-blob aurora-3" style={{ opacity: 0.25 }} />
              </div>
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">你的进度</p>
                <div className="mt-6 flex items-center gap-5">
                  <ProgressRing value={progress} label={`${String(stepIndex + 1).padStart(2, "0")}`} total="07" />
                  <div>
                    <p className="text-3xl font-medium tracking-[-0.05em]">{Math.round(progress)}%</p>
                    <p className="mt-1 text-xs text-white/50">已完成</p>
                  </div>
                </div>

                <ol className="mt-10 space-y-1">
                  {STEPS.map((step, index) => {
                    const done = index < stepIndex;
                    const active = index === stepIndex;
                    return (
                      <li key={step.key} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition duration-500 ${active ? "bg-white/10 font-semibold text-white" : done ? "text-white/70" : "text-white/38"}`}>
                        <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] transition ${done || active ? "bg-[var(--lime)] text-[#071c16]" : "border border-white/20"}`}>
                          {done ? <CheckIcon className="size-3.5" /> : index + 1}
                        </span>
                        {step.nav}
                      </li>
                    );
                  })}
                </ol>
              </div>
              <div className="relative mt-auto rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-xs leading-6 text-white/55 backdrop-blur">
                你的填写内容仅用于生成本次健康趋势参考。我们尊重并保护你的隐私。
              </div>
            </aside>

            {/* Content */}
            <section className="flex min-h-[680px] flex-col p-5 sm:p-9 lg:min-h-0 lg:p-12 xl:p-16">
              <div className="flex items-center justify-between border-b border-[#071c16]/10 pb-5">
                <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#6c7972]">
                  <span className="lg:hidden">{String(stepIndex + 1).padStart(2, "0")} / 07 ·</span>
                  {currentStep.eyebrow}
                </p>
                <p className="text-xs font-semibold text-[#7b8781]">{Math.round(progress)}%</p>
              </div>

              <div key={currentStep.key} className="step-enter mt-9 max-w-3xl sm:mt-12">
                <h1 className="text-balance text-4xl font-medium leading-[1.03] tracking-[-0.06em] sm:text-6xl">{currentStep.title}</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#68756f] sm:text-base">{currentStep.description}</p>

                <div className="mt-8 sm:mt-10">
                  {currentStep.key === "gender" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OptionButton index={1} selected={profile.gender === "FEMALE"} label="女性" detail="帮助我们更贴近你的身体状态" onClick={() => setProfile((p) => ({ ...p, gender: "FEMALE" }))} />
                      <OptionButton index={2} selected={profile.gender === "MALE"} label="男性" detail="帮助我们更贴近你的身体状态" onClick={() => setProfile((p) => ({ ...p, gender: "MALE" }))} />
                    </div>
                  ) : null}

                  {currentStep.key === "goal" ? (
                    <div className="grid gap-3">
                      {goalOptions.map((option, index) => (
                        <OptionButton key={option.value} index={index + 1} selected={profile.goal === option.value} label={option.label} detail={option.detail} onClick={() => setProfile((p) => ({ ...p, goal: option.value }))} />
                      ))}
                    </div>
                  ) : null}

                  {currentStep.key === "age" ? <NumberField value={profile.age} onChange={(value) => setNumeric("age", value)} min={18} max={80} step={1} unit="岁" placeholder="28" /> : null}
                  {currentStep.key === "height" ? <NumberField value={profile.heightCm} onChange={(value) => setNumeric("heightCm", value)} min={120} max={230} step={0.1} unit="cm" placeholder="168" /> : null}
                  {currentStep.key === "weight" ? <NumberField value={profile.weightKg} onChange={(value) => setNumeric("weightKg", value)} min={35} max={300} step={0.1} unit="kg" placeholder="65" /> : null}
                  {currentStep.key === "target-weight" ? (
                    <div>
                      <NumberField value={profile.targetWeightKg} onChange={(value) => setNumeric("targetWeightKg", value)} min={35} max={300} step={0.1} unit="kg" placeholder="58" />
                      {profile.weightKg !== null ? <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#eef0ea] px-4 py-2 text-sm text-[#5f6d65]">当前体重 <strong className="font-semibold text-[#071c16]">{profile.weightKg} kg</strong></p> : null}
                    </div>
                  ) : null}

                  {currentStep.key === "activity" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activityOptions.map((option, index) => (
                        <OptionButton key={option.value} index={index + 1} selected={profile.activityLevel === option.value} label={option.label} detail={option.detail} onClick={() => setProfile((p) => ({ ...p, activityLevel: option.value }))} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-auto flex flex-col-reverse gap-5 pt-10 sm:flex-row sm:items-end sm:justify-between">
                <button
                  type="button"
                  disabled={stepIndex === 0 || isBusy}
                  onClick={() => {
                    setStepIndex((current) => Math.max(0, current - 1));
                    setPhase("ready");
                    setMessage("你可以修改之前的回答");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#5e6d65] transition hover:bg-white disabled:invisible"
                >
                  <ArrowIcon className="size-4" back />
                  上一步
                </button>
                <div className="flex flex-col items-stretch gap-3 sm:items-end">
                  <button
                    type="button"
                    onClick={saveAndContinue}
                    disabled={isBusy}
                    className="group inline-flex min-w-56 items-center justify-between gap-6 rounded-full bg-[#071c16] px-6 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(7,28,22,.24)] transition duration-300 hover:-translate-y-1 hover:bg-[#0f3527] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70"
                  >
                    {phase === "saving" ? "正在保存…" : phase === "submitting" ? "正在生成报告…" : isLastStep ? "生成我的报告" : "保存并继续"}
                    <span className="grid size-8 place-items-center rounded-full bg-[var(--lime)] text-[#071c16] transition duration-300 group-hover:translate-x-1">
                      {isBusy ? <span className="size-3 animate-spin rounded-full border-2 border-[#071c16]/25 border-t-[#071c16]" /> : <ArrowIcon />}
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

function ProgressRing({ value, label, total }: { value: number; label: string; total: string }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="relative grid size-20 place-items-center">
      <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="5" />
        <circle
          className="gauge-arc"
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="var(--lime)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-center leading-none">
        <span className="text-lg font-semibold tracking-[-0.04em]">{label}</span>
        <span className="block text-[10px] text-white/45">/ {total}</span>
      </div>
    </div>
  );
}

function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  unit,
  placeholder,
}: {
  value: number | null;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  placeholder: string;
}) {
  const rangeValue = value ?? min;
  const rangeProgress = ((Math.min(max, Math.max(min, rangeValue)) - min) / (max - min)) * 100;

  return (
    <div className="max-w-xl">
      <label className="block">
        <span className="flex items-end border-b-2 border-[#071c16]/18 pb-3 transition duration-300 focus-within:border-[#071c16]">
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
      </label>

      <div className="mt-8">
        <input
          type="range"
          aria-label={`拖动调整数值（单位 ${unit}）`}
          min={min}
          max={max}
          step={step}
          value={rangeValue}
          onChange={(event) => onChange(event.target.value)}
          className="range-lime"
          style={{ "--range-progress": `${rangeProgress}%` } as React.CSSProperties}
        />
        <div className="mt-3 flex justify-between text-xs text-[#8a948e]">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>

      <p className="mt-5 text-xs text-[#85908a]">直接输入数字，或拖动滑杆快速调整</p>
    </div>
  );
}

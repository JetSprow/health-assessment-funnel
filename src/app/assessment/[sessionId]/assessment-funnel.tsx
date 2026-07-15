"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Gender = "MALE" | "FEMALE";
type Goal = "LOSE_WEIGHT" | "GAIN_WEIGHT" | "MAINTAIN_WEIGHT";
type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";

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

type StepKey =
  | "gender"
  | "goal"
  | "age"
  | "height"
  | "weight"
  | "target-weight"
  | "activity";

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
  { key: "gender", eyebrow: "基础信息", title: "你的生理性别是？", description: "用于估算基础代谢，仅参与本次演示算法。" },
  { key: "goal", eyebrow: "你的方向", title: "这次最想实现什么？", description: "我们会据此调整热量建议与预测速度。" },
  { key: "age", eyebrow: "基础信息", title: "你今年多大？", description: "支持 18–80 岁的成年人测评。" },
  { key: "height", eyebrow: "身体数据", title: "你的身高是多少？", description: "请输入 120–230 cm 之间的数值。" },
  { key: "weight", eyebrow: "身体数据", title: "你现在的体重是？", description: "请输入 35–300 kg 之间的数值。" },
  { key: "target-weight", eyebrow: "目标设定", title: "你的目标体重是？", description: "请让目标体重与你选择的方向保持一致。" },
  { key: "activity", eyebrow: "生活方式", title: "你平时的活动水平？", description: "选择最接近最近 4 周平均状态的一项。" },
];

const goalOptions: Array<{ value: Goal; label: string; detail: string }> = [
  { value: "LOSE_WEIGHT", label: "健康减重", detail: "稳步降低体重与体脂" },
  { value: "GAIN_WEIGHT", label: "科学增重", detail: "逐步增加体重与能量摄入" },
  { value: "MAINTAIN_WEIGHT", label: "保持状态", detail: "维持当前体重与生活节奏" },
];

const activityOptions: Array<{ value: ActivityLevel; label: string; detail: string }> = [
  { value: "SEDENTARY", label: "久坐", detail: "几乎不运动，以坐着为主" },
  { value: "LIGHT", label: "轻度活动", detail: "每周运动 1–3 天" },
  { value: "MODERATE", label: "中度活动", detail: "每周运动 3–5 天" },
  { value: "ACTIVE", label: "高度活动", detail: "每周高强度运动 6–7 天" },
  { value: "VERY_ACTIVE", label: "非常活跃", detail: "体力工作或每日高强度训练" },
];

function firstIncompleteStep(profile: Profile): number {
  const values = [
    profile.gender,
    profile.goal,
    profile.age,
    profile.heightCm,
    profile.weightKg,
    profile.targetWeightKg,
    profile.activityLevel,
  ];
  const index = values.findIndex((value) => value === null);
  return index === -1 ? STEPS.length - 1 : index;
}

function clientValidation(profile: Profile, stepIndex: number): string | null {
  switch (STEPS[stepIndex].key) {
    case "gender":
      return profile.gender ? null : "请选择生理性别。";
    case "goal":
      return profile.goal ? null : "请选择本次测评目标。";
    case "age":
      return profile.age !== null && Number.isInteger(profile.age) && profile.age >= 18 && profile.age <= 80
        ? null
        : "年龄需要是 18–80 之间的整数。";
    case "height":
      return profile.heightCm !== null && profile.heightCm >= 120 && profile.heightCm <= 230
        ? null
        : "身高需要在 120–230 cm 之间。";
    case "weight":
      return profile.weightKg !== null && profile.weightKg >= 35 && profile.weightKg <= 300
        ? null
        : "当前体重需要在 35–300 kg 之间。";
    case "target-weight": {
      const { goal, weightKg, targetWeightKg } = profile;
      if (targetWeightKg === null || targetWeightKg < 35 || targetWeightKg > 300) {
        return "目标体重需要在 35–300 kg 之间。";
      }
      if (weightKg === null || goal === null) return "请先补全目标与当前体重。";
      if (goal === "LOSE_WEIGHT" && targetWeightKg >= weightKg) return "减重目标需要低于当前体重。";
      if (goal === "GAIN_WEIGHT" && targetWeightKg <= weightKg) return "增重目标需要高于当前体重。";
      if (goal === "MAINTAIN_WEIGHT" && Math.abs(targetWeightKg - weightKg) > 2) {
        return "保持体重时，目标与当前体重差值不能超过 2kg。";
      }
      return null;
    }
    case "activity":
      return profile.activityLevel ? null : "请选择活动水平。";
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

function OptionButton({ selected, label, detail, onClick }: { selected: boolean; label: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition sm:p-5 ${
        selected
          ? "border-[#19382e] bg-[#eef5da] shadow-[0_10px_24px_rgba(25,56,46,0.08)]"
          : "border-[#dfe5df] bg-white hover:-translate-y-0.5 hover:border-[#9eada5]"
      }`}
    >
      <span>
        <span className="block font-semibold text-[#19382e]">{label}</span>
        <span className="mt-1 block text-sm text-[#6a7771]">{detail}</span>
      </span>
      <span className={`ml-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? "border-[#19382e] bg-[#19382e]" : "border-[#b8c3bd]"}`}>
        {selected ? <span className="h-2 w-2 rounded-full bg-[#c8e76b]" /> : null}
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
  const [message, setMessage] = useState("正在恢复你的进度…");

  const restoreProgress = useCallback(async () => {
    const response = await fetch(`/api/sessions/${sessionId}/progress`, { cache: "no-store" });
    const payload = (await response.json()) as ApiEnvelope<Progress>;
    if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "恢复进度失败");

    if (payload.data.status === "COMPLETED") {
      router.replace(`/assessment/${sessionId}/result`);
      return;
    }

    const restoredProfile = { ...EMPTY_PROFILE, ...(payload.data.profile ?? {}) };
    setProfile(restoredProfile);
    setVersion(payload.data.version);
    setStepIndex(firstIncompleteStep(restoredProfile));
    setPhase("ready");
    setMessage(payload.data.version > 0 ? "已恢复上次保存的进度" : "每一步都会自动保存");
  }, [router, sessionId]);

  useEffect(() => {
    // Progress is loaded from an external API; state updates happen after the promise resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restoreProgress().catch((error: unknown) => {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "恢复进度失败");
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
    setMessage("正在生成你的专属报告…");
    const response = await fetch(`/api/sessions/${sessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: nextVersion }),
    });
    const payload = (await response.json()) as ApiEnvelope<{ version: number }>;

    if (response.status === 409) {
      await restoreProgress();
      setMessage("检测到其他页面更新，已恢复最新进度，请再次提交。");
      return;
    }
    if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "生成报告失败");

    router.push(`/assessment/${sessionId}/result`);
  }

  async function saveAndContinue() {
    if (validationMessage) {
      setPhase("error");
      setMessage(validationMessage);
      return;
    }

    setPhase("saving");
    setMessage("正在安全保存…");

    try {
      const response = await fetch(`/api/sessions/${sessionId}/steps/${currentStep.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: `${currentStep.key}-${crypto.randomUUID()}`,
          version,
          data: payloadForStep(profile, currentStep.key),
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<{ version: number }>;

      if (response.status === 409) {
        await restoreProgress();
        setMessage("检测到其他页面更新，已恢复最新进度。");
        return;
      }
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "保存失败");

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
      setMessage(error instanceof Error ? error.message : "保存失败，请重试");
    }
  }

  if (phase === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1e9] px-5 text-[#19382e]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#dfe6dc] border-t-[#19382e]" />
          <p className="mt-5 text-sm text-[#66736d]">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-4 py-5 text-[#19382e] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center justify-between px-1 sm:mb-8">
          <button type="button" onClick={() => router.push("/")} className="text-sm font-bold tracking-[-0.02em]">BETTER SELF LAB</button>
          <span className="rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-[#6d7a74]">匿名测评 · 自动保存</span>
        </header>

        <div className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_30px_80px_rgba(31,48,41,0.11)] sm:rounded-[2.25rem]">
          <div className="h-2 bg-[#e9eee9]">
            <div className="h-full rounded-r-full bg-[#c8e76b] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid lg:grid-cols-[260px_1fr]">
            <aside className="hidden border-r border-[#edf0ed] bg-[#f8faf6] p-7 lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#89958f]">测评进度</p>
              <ol className="mt-7 space-y-5">
                {STEPS.map((step, index) => (
                  <li key={step.key} className={`flex items-center gap-3 text-sm ${index === stepIndex ? "font-semibold text-[#19382e]" : index < stepIndex ? "text-[#527060]" : "text-[#9ba69f]"}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs ${index < stepIndex ? "bg-[#19382e] text-white" : index === stepIndex ? "bg-[#c8e76b] text-[#19382e]" : "bg-[#e8ece8]"}`}>
                      {index < stepIndex ? "✓" : index + 1}
                    </span>
                    {step.eyebrow}
                  </li>
                ))}
              </ol>
              <div className="mt-10 rounded-2xl bg-white p-4 text-xs leading-5 text-[#728078]">
                你的数据仅用于生成本次演示报告。本产品不提供医疗诊断。
              </div>
            </aside>

            <section className="flex min-h-[620px] flex-col p-6 sm:p-10 lg:p-14">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7b8982]">{currentStep.eyebrow}</p>
                <p className="text-xs font-semibold text-[#89958f]">{stepIndex + 1} / {STEPS.length}</p>
              </div>

              <div className="mt-8 max-w-2xl sm:mt-12">
                <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">{currentStep.title}</h1>
                <p className="mt-4 leading-7 text-[#66736d]">{currentStep.description}</p>

                <div className="mt-8 sm:mt-10">
                  {currentStep.key === "gender" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OptionButton selected={profile.gender === "FEMALE"} label="女性" detail="按女性代谢公式估算" onClick={() => setProfile((p) => ({ ...p, gender: "FEMALE" }))} />
                      <OptionButton selected={profile.gender === "MALE"} label="男性" detail="按男性代谢公式估算" onClick={() => setProfile((p) => ({ ...p, gender: "MALE" }))} />
                    </div>
                  ) : null}

                  {currentStep.key === "goal" ? (
                    <div className="grid gap-3">
                      {goalOptions.map((option) => <OptionButton key={option.value} selected={profile.goal === option.value} label={option.label} detail={option.detail} onClick={() => setProfile((p) => ({ ...p, goal: option.value }))} />)}
                    </div>
                  ) : null}

                  {currentStep.key === "age" ? <NumberField value={profile.age} onChange={(value) => setNumeric("age", value)} min={18} max={80} step={1} unit="岁" placeholder="例如 28" /> : null}
                  {currentStep.key === "height" ? <NumberField value={profile.heightCm} onChange={(value) => setNumeric("heightCm", value)} min={120} max={230} step={0.1} unit="cm" placeholder="例如 168" /> : null}
                  {currentStep.key === "weight" ? <NumberField value={profile.weightKg} onChange={(value) => setNumeric("weightKg", value)} min={35} max={300} step={0.1} unit="kg" placeholder="例如 65" /> : null}
                  {currentStep.key === "target-weight" ? (
                    <div>
                      <NumberField value={profile.targetWeightKg} onChange={(value) => setNumeric("targetWeightKg", value)} min={35} max={300} step={0.1} unit="kg" placeholder="例如 58" />
                      {profile.weightKg !== null ? <p className="mt-3 text-sm text-[#77847d]">当前体重：{profile.weightKg} kg</p> : null}
                    </div>
                  ) : null}

                  {currentStep.key === "activity" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activityOptions.map((option) => <OptionButton key={option.value} selected={profile.activityLevel === option.value} label={option.label} detail={option.detail} onClick={() => setProfile((p) => ({ ...p, activityLevel: option.value }))} />)}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-auto flex flex-col-reverse gap-4 pt-10 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" disabled={stepIndex === 0 || phase === "saving" || phase === "submitting"} onClick={() => { setStepIndex((current) => Math.max(0, current - 1)); setPhase("ready"); setMessage("你可以修改已保存的答案"); }} className="rounded-full px-5 py-3 text-sm font-semibold text-[#5e6d65] hover:bg-[#f2f5f1] disabled:invisible">← 上一步</button>
                <div className="flex flex-col items-stretch gap-3 sm:items-end">
                  <button type="button" onClick={saveAndContinue} disabled={phase === "saving" || phase === "submitting"} className="min-w-44 rounded-2xl bg-[#19382e] px-7 py-4 font-semibold text-white shadow-[0_14px_30px_rgba(25,56,46,0.2)] transition hover:-translate-y-0.5 hover:bg-[#244c3f] disabled:cursor-wait disabled:opacity-70">
                    {phase === "saving" ? "正在保存…" : phase === "submitting" ? "正在生成报告…" : stepIndex === STEPS.length - 1 ? "生成我的报告" : "保存并继续 →"}
                  </button>
                  <p role={phase === "error" ? "alert" : "status"} className={`text-center text-xs sm:text-right ${phase === "error" ? "text-red-700" : "text-[#7a8780]"}`}>{message}</p>
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
    <label className="block max-w-md">
      <span className="flex items-center rounded-2xl border border-[#dbe2dc] bg-[#fbfcfa] px-5 py-2 focus-within:border-[#19382e] focus-within:ring-4 focus-within:ring-[#c8e76b]/30">
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
          className="min-w-0 flex-1 bg-transparent py-4 text-3xl font-semibold tracking-[-0.03em] outline-none placeholder:text-[#c1c9c4]"
        />
        <span className="ml-3 text-sm font-semibold text-[#718078]">{unit}</span>
      </span>
    </label>
  );
}

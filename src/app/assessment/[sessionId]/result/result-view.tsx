"use client";

import { createClientRequestId } from "@/lib/client-request-id";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type BmiCategory = "UNDERWEIGHT" | "NORMAL" | "OVERWEIGHT" | "OBESE";
type ProjectionPoint = { week: number; weightKg: number };

type LockedResult = {
  access: "LOCKED";
  subscriptionStatus: "INACTIVE";
  summary: { bmi: number; category: BmiCategory };
  lockedSections: readonly string[];
};

type FullResult = {
  access: "FULL";
  subscriptionStatus: "ACTIVE";
  result: {
    bmi: number;
    category: BmiCategory;
    recommendedCalories: number;
    targetDate: string;
    projectionCurve: ProjectionPoint[];
    predictionCapped: boolean;
    algorithmVersion: string;
    calculatedAt: string;
  };
};

type ResultAccess = LockedResult | FullResult;
type ApiEnvelope<T> = { data?: T; error?: { code: string; message: string } };

const categoryLabels: Record<BmiCategory, string> = {
  UNDERWEIGHT: "偏轻",
  NORMAL: "理想范围",
  OVERWEIGHT: "略高",
  OBESE: "偏高",
};

const categoryNotes: Record<BmiCategory, string> = {
  UNDERWEIGHT: "可以把重点放在均衡营养与稳定力量上。",
  NORMAL: "你的身体基础处于相对舒适的区间。",
  OVERWEIGHT: "循序调整日常节奏，会比短期冲刺更从容。",
  OBESE: "从温和、可持续的改变开始，更有利于长期坚持。",
};

export function ResultView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const unlockKey = useRef(`report-${createClientRequestId()}`);
  const [result, setResult] = useState<ResultAccess | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "paying" | "error">("loading");
  const [message, setMessage] = useState("正在整理你的报告…");

  const loadResult = useCallback(async () => {
    const response = await fetch(`/api/sessions/${sessionId}/result`, { cache: "no-store" });
    const payload = (await response.json()) as ApiEnvelope<ResultAccess>;

    if (!response.ok || !payload.data) {
      throw new Error("报告暂时没有准备好，请稍后再试。");
    }

    setResult(payload.data);
    setPhase("ready");
    setMessage(payload.data.access === "FULL" ? "完整报告已解锁" : "你的基础报告已生成");
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadResult().catch(() => {
      setPhase("error");
      setMessage("报告暂时没有准备好，请稍后再试。");
    });
  }, [loadResult]);

  async function unlockReport() {
    setPhase("paying");
    setMessage("正在为你解锁完整报告…");

    try {
      const response = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, idempotencyKey: unlockKey.current }),
      });
      const payload = (await response.json()) as ApiEnvelope<{ subscriptionStatus: string }>;

      if (!response.ok || !payload.data) {
        throw new Error("暂时无法解锁，请稍后重试。");
      }

      await loadResult();
    } catch {
      setPhase("error");
      setMessage("暂时无法解锁，请稍后重试。");
    }
  }

  if (phase === "loading") {
    return <ReportLoading message={message} />;
  }

  if (!result) {
    return (
      <main className="surface-noise grid min-h-screen place-items-center bg-[var(--canvas)] px-5 text-[var(--ink)]">
        <div className="motion-rise max-w-md rounded-[2rem] border border-black/5 bg-[var(--paper)] p-8 text-center shadow-[0_28px_80px_rgba(16,35,29,0.1)] sm:p-10">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ffe5de] text-[#a43c27]" aria-hidden="true">!</span>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">还差一点点</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{message}</p>
          <button
            type="button"
            onClick={() => {
              setPhase("loading");
              setMessage("正在重新整理你的报告…");
              loadResult().catch(() => {
                setPhase("error");
                setMessage("报告暂时没有准备好，请稍后再试。");
              });
            }}
            className="mt-7 rounded-full bg-[var(--ink)] px-7 py-3.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--forest)]"
          >
            再试一次
          </button>
        </div>
      </main>
    );
  }

  const summary = result.access === "LOCKED"
    ? result.summary
    : { bmi: result.result.bmi, category: result.result.category };

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <section className="surface-noise relative overflow-hidden bg-[var(--ink)] px-5 pb-28 pt-6 text-white sm:pb-36 sm:pt-8">
        <div className="pointer-events-none absolute -right-40 top-4 h-[30rem] w-[30rem] rounded-full border border-white/8 sm:right-[4%]" />
        <div className="pointer-events-none absolute -right-24 top-20 h-[21rem] w-[21rem] rounded-full border border-[var(--lime)]/25 sm:right-[10%]" />
        <div className="pointer-events-none absolute right-20 top-56 hidden h-2 w-2 rounded-full bg-[var(--orange)] shadow-[0_0_32px_8px_rgba(255,121,92,0.35)] sm:block" />

        <div className="relative mx-auto max-w-6xl">
          <header className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="group flex items-center gap-3 text-left"
              aria-label="返回 Better Self 首页"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 transition duration-300 group-hover:rotate-12 group-hover:border-[var(--lime)]/60">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--lime)]" />
              </span>
              <span className="text-xs font-semibold tracking-[0.2em]">BETTER SELF</span>
            </button>
            <span className={`rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.08em] ${result.access === "FULL" ? "border-[var(--lime)] bg-[var(--lime)] text-[var(--ink)]" : "border-white/15 bg-white/5 text-white/70"}`}>
              {result.access === "FULL" ? "完整报告 · 已解锁" : "基础报告"}
            </span>
          </header>

          <div className="mt-16 grid items-end gap-12 sm:mt-24 lg:grid-cols-[1fr_0.72fr] lg:gap-20">
            <div className="motion-rise">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--lime)]">Your rhythm, revealed</p>
              <h1 className="text-balance mt-5 max-w-3xl text-[clamp(3rem,8vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
                看见状态，<br />找到节奏。
              </h1>
              <p className="mt-7 max-w-xl text-sm leading-7 text-white/58 sm:text-base">
                这不是一份给你贴标签的答案，而是一张帮助你理解当下、从容走向目标的路线图。
              </p>
            </div>

            <ScoreOrbit bmi={summary.bmi} category={summary.category} />
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-16 px-5 pb-20 sm:-mt-20 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard eyebrow="当前指数" value={summary.bmi.toFixed(1)} suffix="BMI" accent />
            <MetricCard eyebrow="状态参考" value={categoryLabels[summary.category]} />
            <article className="motion-rise motion-rise-delay-2 rounded-[1.75rem] border border-black/5 bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(16,35,29,0.07)] sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">给现在的你</p>
              <p className="mt-4 text-lg font-medium leading-7 tracking-[-0.025em]">{categoryNotes[summary.category]}</p>
            </article>
          </div>

          {result.access === "LOCKED" ? (
            <LockedReport phase={phase} message={message} onUnlock={unlockReport} />
          ) : (
            <FullReport result={result.result} />
          )}

          <footer className="mt-16 flex flex-col gap-5 border-t border-black/10 pt-7 text-xs leading-6 text-[var(--muted)] sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-2xl">本报告仅作为一般健康与生活方式参考，不能替代医生、营养师或其他专业人士的诊断与建议。</p>
            <button type="button" onClick={() => router.push("/")} className="w-fit font-semibold text-[var(--ink)] transition hover:opacity-60">返回首页 ↗</button>
          </footer>
        </div>
      </section>
    </main>
  );
}

function ReportLoading({ message }: { message: string }) {
  return (
    <main className="surface-noise grid min-h-screen place-items-center overflow-hidden bg-[var(--ink)] px-5 text-white">
      <div className="relative text-center">
        <div className="orbit-slow mx-auto grid h-28 w-28 place-items-center rounded-full border border-white/15">
          <span className="absolute -top-1 h-3 w-3 rounded-full bg-[var(--lime)] shadow-[0_0_20px_rgba(200,242,95,0.7)]" />
          <span className="h-16 w-16 rounded-full border border-[var(--lime)]/35" />
        </div>
        <p className="mt-7 text-sm tracking-wide text-white/62">{message}</p>
      </div>
    </main>
  );
}

function ScoreOrbit({ bmi, category }: { bmi: number; category: BmiCategory }) {
  return (
    <div className="motion-rise motion-rise-delay-2 relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center lg:mr-0">
      <svg viewBox="0 0 360 360" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="180" cy="180" r="157" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="1" />
        <circle cx="180" cy="180" r="126" fill="none" stroke="rgba(200,242,95,.22)" strokeWidth="1" strokeDasharray="4 9" />
        <path className="chart-line" d="M 43 211 A 143 143 0 0 1 300 92" fill="none" stroke="#c8f25f" strokeWidth="5" strokeLinecap="round" />
        <circle cx="302" cy="94" r="7" fill="#ff795c" />
      </svg>
      <div className="text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">Body index</span>
        <strong className="mt-2 block text-7xl font-semibold tracking-[-0.08em] sm:text-8xl">{bmi.toFixed(1)}</strong>
        <span className="mt-3 inline-flex rounded-full bg-white/8 px-4 py-2 text-xs text-white/70">{categoryLabels[category]}</span>
      </div>
    </div>
  );
}

function MetricCard({ eyebrow, value, suffix, accent = false }: { eyebrow: string; value: string; suffix?: string; accent?: boolean }) {
  return (
    <article className={`motion-rise rounded-[1.75rem] border p-6 shadow-[0_24px_70px_rgba(16,35,29,0.07)] sm:p-7 ${accent ? "border-[var(--lime)] bg-[var(--lime)]" : "border-black/5 bg-[var(--paper)]"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{eyebrow}</p>
      <div className="mt-5 flex items-end gap-3">
        <strong className="text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-none tracking-[-0.065em]">{value}</strong>
        {suffix ? <span className="pb-1 text-xs font-semibold text-[var(--muted)]">{suffix}</span> : null}
      </div>
    </article>
  );
}

function LockedReport({ phase, message, onUnlock }: { phase: "loading" | "ready" | "paying" | "error"; message: string; onUnlock: () => void }) {
  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] bg-[var(--ink)] text-white shadow-[0_28px_90px_rgba(16,35,29,0.14)] sm:rounded-[2.5rem]">
      <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative overflow-hidden p-7 sm:p-11 lg:p-14">
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full border border-[var(--lime)]/20" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--lime)]">Your complete view</p>
          <h2 className="text-balance mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl">把数字，变成下一步。</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/58">
            查看每日能量参考、目标节奏与逐周趋势，把想法整理成更容易坚持的行动方向。
          </p>

          <ul className="mt-9 space-y-4 text-sm text-white/76">
            {["每日能量摄入参考", "预计目标日期", "逐周体重趋势", "三条轻量行动建议"].map((item, index) => (
              <li key={item} className="flex items-center gap-4">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-[10px] text-[var(--lime)]">{String(index + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onUnlock}
            disabled={phase === "paying"}
            className="group mt-10 flex w-full items-center justify-between rounded-full bg-[var(--lime)] px-6 py-4 text-sm font-semibold text-[var(--ink)] transition duration-300 hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-72"
          >
            <span>{phase === "paying" ? "正在解锁…" : "免费解锁完整报告"}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--ink)] text-white transition duration-300 group-hover:translate-x-1">→</span>
          </button>
          {phase === "error" ? <p className="mt-4 text-xs text-[#ffad9a]" role="alert">{message}</p> : <p className="mt-4 text-xs text-white/38">无需付款，立即查看完整内容</p>}
        </div>

        <div className="relative min-h-[31rem] overflow-hidden border-t border-white/10 bg-[#18342b] p-6 sm:p-10 lg:border-l lg:border-t-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(200,242,95,0.13),transparent_44%)]" />
          <div className="relative space-y-4 blur-[6px] opacity-55" aria-hidden="true">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 rounded-[1.5rem] bg-white/10 p-5"><span className="block h-2 w-16 rounded bg-white/30" /><span className="mt-8 block h-8 w-24 rounded bg-white/45" /></div>
              <div className="h-32 rounded-[1.5rem] bg-[var(--lime)]/35 p-5"><span className="block h-2 w-20 rounded bg-white/30" /><span className="mt-8 block h-8 w-28 rounded bg-white/45" /></div>
            </div>
            <div className="h-64 rounded-[1.75rem] bg-white/8 p-6">
              <span className="block h-2 w-28 rounded bg-white/30" />
              <svg viewBox="0 0 420 150" className="mt-8 w-full"><path d="M10 125 C80 115 86 60 150 78 S245 30 410 20" fill="none" stroke="#c8f25f" strokeWidth="8" strokeLinecap="round" /></svg>
            </div>
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-[var(--ink)]/65 backdrop-blur-xl">
              <LockIcon />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FullReport({ result }: { result: FullResult["result"] }) {
  const start = result.projectionCurve.at(0);
  const end = result.projectionCurve.at(-1);

  return (
    <section className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="motion-rise rounded-[2rem] border border-black/5 bg-[var(--paper)] p-7 shadow-[0_24px_70px_rgba(16,35,29,0.07)] sm:p-9">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.21em] text-[var(--muted)]">Daily energy</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.035em]">每日能量参考</h2>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--lime-soft)]"><EnergyIcon /></span>
          </div>
          <div className="mt-10 flex items-end gap-3">
            <strong className="text-6xl font-semibold tracking-[-0.07em] sm:text-7xl">{result.recommendedCalories}</strong>
            <span className="pb-2 text-sm text-[var(--muted)]">千卡 / 天</span>
          </div>
          <p className="mt-6 max-w-lg text-sm leading-6 text-[var(--muted)]">作为安排日常饮食的起点，根据饥饿感、活动量和身体反馈灵活调整。</p>
        </article>

        <article className="motion-rise motion-rise-delay-1 relative overflow-hidden rounded-[2rem] bg-[var(--lime)] p-7 sm:p-9">
          <div className="absolute -bottom-20 -right-14 h-56 w-56 rounded-full border border-[var(--ink)]/12" />
          <div className="absolute -bottom-8 -right-2 h-36 w-36 rounded-full border border-[var(--ink)]/10" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.21em] text-[var(--muted)]">Your horizon</p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.035em]">目标时间参考</h2>
          <p className="mt-10 text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-none tracking-[-0.065em]">{formatDate(result.targetDate)}</p>
          <p className="mt-6 max-w-md text-sm leading-6 text-[var(--ink)]/65">让变化自然发生，不需要用极端方式赶时间。稳定本身，就是进步。</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.42fr_0.78fr]">
        <article className="rounded-[2rem] border border-black/5 bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(16,35,29,0.07)] sm:p-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.21em] text-[var(--muted)]">Weight rhythm</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">逐周体重趋势</h2>
            </div>
            {start && end ? <p className="rounded-full bg-[var(--canvas)] px-4 py-2 text-xs font-semibold text-[var(--muted)]">{start.weightKg} kg <span className="mx-2 text-[var(--ink)]">→</span> {end.weightKg} kg</p> : null}
          </div>
          <ProjectionChart points={result.projectionCurve} />
          <p className="mt-4 text-xs leading-6 text-[var(--muted)]">趋势会受到饮食、睡眠、活动和个体差异影响。关注长期方向，不必被单日波动打乱节奏。</p>
          {result.predictionCapped ? <p className="mt-2 text-xs leading-6 text-[var(--muted)]">为保持参考区间合理，当前趋势展示至未来两年。</p> : null}
        </article>

        <aside className="surface-noise relative overflow-hidden rounded-[2rem] bg-[var(--ink)] p-7 text-white shadow-[0_28px_80px_rgba(16,35,29,0.14)] sm:p-9">
          <span className="inline-flex rounded-full border border-[var(--lime)]/25 bg-[var(--lime)]/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--lime)]">Start gently</span>
          <h2 className="text-balance mt-6 text-3xl font-semibold leading-[1.05] tracking-[-0.045em]">从轻一点的行动开始。</h2>
          <ol className="mt-9 space-y-7">
            <ActionItem number="01" title="观察真实饮食" text="先记录一周，不急着追求完美。" />
            <ActionItem number="02" title="守住基本节奏" text="优先保证规律睡眠与稳定活动。" />
            <ActionItem number="03" title="看长期方向" text="每 2–4 周复盘一次整体趋势。" />
          </ol>
          <p className="mt-10 border-t border-white/10 pt-5 text-[11px] text-white/36">更新于 {formatDateTime(result.calculatedAt)}</p>
        </aside>
      </div>
    </section>
  );
}

function ActionItem({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li className="flex gap-4">
      <span className="pt-0.5 text-xs font-semibold text-[var(--lime)]">{number}</span>
      <div>
        <strong className="text-sm font-semibold">{title}</strong>
        <p className="mt-1 text-xs leading-5 text-white/52">{text}</p>
      </div>
    </li>
  );
}

function ProjectionChart({ points }: { points: ProjectionPoint[] }) {
  if (points.length < 2) {
    return <div className="mt-8 grid h-64 place-items-center rounded-[1.5rem] bg-[var(--canvas)] text-sm text-[var(--muted)]">当前目标以保持稳定为主</div>;
  }

  const width = 760;
  const height = 280;
  const padding = 30;
  const minWeight = Math.min(...points.map((point) => point.weightKg));
  const maxWeight = Math.max(...points.map((point) => point.weightKg));
  const range = Math.max(1, maxWeight - minWeight);
  const maxWeek = Math.max(1, points.at(-1)?.week ?? 1);
  const coordinates = points.map((point) => ({
    x: padding + (point.week / maxWeek) * (width - padding * 2),
    y: padding + ((maxWeight - point.weightKg) / range) * (height - padding * 2),
  }));
  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding},${height - padding} ${polyline} ${width - padding},${height - padding}`;
  const first = coordinates[0];
  const last = coordinates.at(-1);

  return (
    <div className="mt-7 overflow-hidden rounded-[1.5rem] bg-[var(--canvas)] p-2 sm:p-4">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="预计体重趋势折线图" className="h-auto w-full overflow-visible">
        <defs>
          <linearGradient id="report-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8f25f" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#c8f25f" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1={padding} x2={width - padding} y1={padding + ratio * (height - padding * 2)} y2={padding + ratio * (height - padding * 2)} stroke="rgba(16,35,29,.11)" strokeDasharray="4 9" />
        ))}
        <polygon points={area} fill="url(#report-chart-fill)" />
        <polyline className="chart-line" points={polyline} fill="none" stroke="#10231d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {first ? <circle cx={first.x} cy={first.y} r="7" fill="#fbfaf7" stroke="#10231d" strokeWidth="4" /> : null}
        {last ? <circle cx={last.x} cy={last.y} r="8" fill="#c8f25f" stroke="#10231d" strokeWidth="4" /> : null}
      </svg>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="#c8f25f" strokeWidth="1.7" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="#c8f25f" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EnergyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m13.5 2-8 12h6l-1 8 8-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

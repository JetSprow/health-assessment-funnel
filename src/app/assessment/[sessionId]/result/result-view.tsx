"use client";

import { useRouter } from "next/navigation";
import { createClientRequestId } from "@/lib/client-request-id";
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
  NORMAL: "正常范围",
  OVERWEIGHT: "偏高",
  OBESE: "肥胖范围",
};

export function ResultView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const paymentKey = useRef(`mock-pay-${createClientRequestId()}`);
  const [result, setResult] = useState<ResultAccess | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "paying" | "error">("loading");
  const [message, setMessage] = useState("正在读取报告…");

  const loadResult = useCallback(async () => {
    const response = await fetch(`/api/sessions/${sessionId}/result`, { cache: "no-store" });
    const payload = (await response.json()) as ApiEnvelope<ResultAccess>;
    if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "读取报告失败");
    setResult(payload.data);
    setPhase("ready");
    setMessage(payload.data.access === "FULL" ? "完整报告已解锁" : "基础结果已生成");
  }, [sessionId]);

  useEffect(() => {
    // Result access is resolved by the server after this external request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadResult().catch((error: unknown) => {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "读取报告失败");
    });
  }, [loadResult]);

  async function unlockReport() {
    setPhase("paying");
    setMessage("正在完成演示支付…");

    try {
      const response = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, idempotencyKey: paymentKey.current }),
      });
      const payload = (await response.json()) as ApiEnvelope<{ subscriptionStatus: string }>;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "解锁失败");
      await loadResult();
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "解锁失败，请重试");
    }
  }

  if (phase === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#19382e] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#c8e76b]" />
          <p className="mt-5 text-sm text-white/70">{message}</p>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1e9] px-5 text-[#19382e]">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="text-sm text-red-700">{message}</p>
          <button type="button" onClick={() => { setPhase("loading"); loadResult().catch((error: unknown) => { setPhase("error"); setMessage(error instanceof Error ? error.message : "读取报告失败"); }); }} className="mt-5 rounded-full bg-[#19382e] px-6 py-3 text-sm font-semibold text-white">重新加载</button>
        </div>
      </main>
    );
  }

  const summary = result.access === "LOCKED"
    ? result.summary
    : { bmi: result.result.bmi, category: result.result.category };

  return (
    <main className="min-h-screen bg-[#f4f1e9] text-[#19382e]">
      <section className="bg-[#19382e] px-5 pb-28 pt-6 text-white sm:pb-36 sm:pt-9">
        <div className="mx-auto max-w-6xl">
          <header className="flex items-center justify-between">
            <button type="button" onClick={() => router.push("/")} className="text-sm font-bold">BETTER SELF LAB</button>
            <span className={`rounded-full px-3 py-2 text-xs font-bold ${result.access === "FULL" ? "bg-[#c8e76b] text-[#19382e]" : "bg-white/10 text-white/80"}`}>
              {result.access === "FULL" ? "会员报告 · 已解锁" : "基础报告"}
            </span>
          </header>

          <div className="mt-16 max-w-3xl sm:mt-24">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8e76b]">Your assessment</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-7xl">你的健康趋势报告<br />已经准备好了</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">基于你填写的身体数据、目标与活动水平生成。它是生活方式参考，不是医疗诊断。</p>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-16 max-w-6xl px-4 pb-20 sm:-mt-20 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard eyebrow="身体质量指数" value={summary.bmi.toFixed(1)} suffix="BMI" detail={categoryLabels[summary.category]} highlight />
          {result.access === "FULL" ? (
            <>
              <MetricCard eyebrow="每日建议摄入" value={result.result.recommendedCalories.toLocaleString("zh-CN")} suffix="kcal" detail="按当前活动水平估算" />
              <MetricCard eyebrow="预计目标日期" value={formatDate(result.result.targetDate)} suffix="" detail={result.result.predictionCapped ? "预测周期已按 260 周封顶" : "按健康变化速度估算"} />
            </>
          ) : (
            <>
              <LockedMetric eyebrow="每日建议摄入" fakeValue="1,8•• kcal" />
              <LockedMetric eyebrow="预计目标日期" fakeValue="•••• 年 •• 月" />
            </>
          )}
        </div>

        {result.access === "LOCKED" ? (
          <LockedReport onUnlock={unlockReport} paying={phase === "paying"} message={message} hasError={phase === "error"} />
        ) : (
          <FullReport result={result.result} />
        )}

        <footer className="mt-8 rounded-3xl border border-[#dfe4df] bg-white/60 p-6 text-sm leading-7 text-[#6b7771] sm:p-8">
          <strong className="text-[#19382e]">重要提示：</strong> 本报告仅用于技术挑战演示和一般健康教育，不能替代医生、营养师或其他专业人士的诊断与建议。如有不适或特殊健康状况，请及时咨询专业人员。
        </footer>
      </div>
    </main>
  );
}

function MetricCard({ eyebrow, value, suffix, detail, highlight = false }: { eyebrow: string; value: string; suffix: string; detail: string; highlight?: boolean }) {
  return (
    <article className={`rounded-[1.75rem] p-6 shadow-[0_20px_60px_rgba(31,48,41,0.10)] sm:p-8 ${highlight ? "bg-[#c8e76b]" : "bg-white"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#647169]">{eyebrow}</p>
      <div className="mt-6 flex min-h-14 items-end gap-2">
        <strong className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{value}</strong>
        {suffix ? <span className="pb-1 text-sm font-semibold text-[#66736d]">{suffix}</span> : null}
      </div>
      <p className="mt-4 text-sm text-[#5f6d65]">{detail}</p>
    </article>
  );
}

function LockedMetric({ eyebrow, fakeValue }: { eyebrow: string; fakeValue: string }) {
  return (
    <article className="relative overflow-hidden rounded-[1.75rem] bg-white p-6 shadow-[0_20px_60px_rgba(31,48,41,0.10)] sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8780]">{eyebrow}</p>
      <p className="mt-7 select-none text-4xl font-semibold tracking-[-0.05em] text-[#8e9993] blur-[5px]">{fakeValue}</p>
      <span className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#f0f3ef] text-sm">🔒</span>
      <p className="mt-5 text-sm text-[#7b8780]">会员专属内容</p>
    </article>
  );
}

function LockedReport({ onUnlock, paying, message, hasError }: { onUnlock: () => void; paying: boolean; message: string; hasError: boolean }) {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(31,48,41,0.08)] sm:p-10">
      <div className="pointer-events-none grid gap-5 opacity-35 blur-[7px] md:grid-cols-2" aria-hidden="true">
        <div className="h-72 rounded-3xl bg-gradient-to-br from-[#dce8d4] to-[#f1f4ef]" />
        <div className="space-y-4 pt-5"><div className="h-5 w-1/3 rounded bg-[#bbc7bf]" /><div className="h-8 w-2/3 rounded bg-[#a8b7ad]" /><div className="h-4 rounded bg-[#d0d8d2]" /><div className="h-4 w-4/5 rounded bg-[#d0d8d2]" /></div>
      </div>
      <div className="absolute inset-0 grid place-items-center bg-white/45 p-6 backdrop-blur-[2px]">
        <div className="max-w-xl text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#19382e] text-xl">🔐</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">解锁完整趋势与行动数据</h2>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-[#65726b]">查看每日热量建议、预计目标日期、逐周体重趋势，以及可刷新保留的会员报告。</p>
          <button type="button" onClick={onUnlock} disabled={paying} className="mt-7 rounded-2xl bg-[#19382e] px-8 py-4 font-semibold text-white shadow-[0_14px_30px_rgba(25,56,46,0.22)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70">
            {paying ? "正在演示支付…" : "模拟支付并解锁 · ¥0"}
          </button>
          <p role={hasError ? "alert" : "status"} className={`mt-3 text-xs ${hasError ? "text-red-700" : "text-[#7a8780]"}`}>{message}</p>
        </div>
      </div>
    </section>
  );
}

function FullReport({ result }: { result: FullResult["result"] }) {
  const start = result.projectionCurve.at(0);
  const end = result.projectionCurve.at(-1);

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
      <article className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(31,48,41,0.08)] sm:p-9">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8780]">Weight projection</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">逐周体重趋势</h2>
          </div>
          {start && end ? <p className="text-sm font-semibold text-[#607068]">{start.weightKg} kg → {end.weightKg} kg</p> : null}
        </div>
        <ProjectionChart points={result.projectionCurve} />
        <p className="mt-3 text-xs leading-5 text-[#859089]">曲线采用固定的演示变化速度生成，实际变化会受饮食、睡眠、运动和个体差异影响。</p>
      </article>

      <aside className="rounded-[2rem] bg-[#19382e] p-7 text-white shadow-[0_20px_60px_rgba(31,48,41,0.14)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8e76b]">下一步建议</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">从可持续的小行动开始</h2>
        <ol className="mt-7 space-y-5 text-sm leading-6 text-white/75">
          <li className="flex gap-3"><span className="font-bold text-[#c8e76b]">01</span><span>记录一周真实饮食，不急着追求完美。</span></li>
          <li className="flex gap-3"><span className="font-bold text-[#c8e76b]">02</span><span>优先保证规律睡眠与每周稳定活动。</span></li>
          <li className="flex gap-3"><span className="font-bold text-[#c8e76b]">03</span><span>每 2–4 周复盘趋势，而不是关注单日波动。</span></li>
        </ol>
        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-white/45">算法版本 {result.algorithmVersion}<br />生成于 {formatDateTime(result.calculatedAt)}</div>
      </aside>
    </section>
  );
}

function ProjectionChart({ points }: { points: ProjectionPoint[] }) {
  if (points.length < 2) {
    return <div className="mt-8 grid h-64 place-items-center rounded-2xl bg-[#f5f7f4] text-sm text-[#758179]">保持体重目标暂无变化曲线</div>;
  }

  const width = 760;
  const height = 280;
  const padding = 28;
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

  return (
    <div className="mt-7 overflow-hidden rounded-2xl bg-[#f5f7f4] p-2 sm:p-4">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="预计体重趋势折线图" className="h-auto w-full">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8e76b" stopOpacity="0.55" /><stop offset="100%" stopColor="#c8e76b" stopOpacity="0.04" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => <line key={ratio} x1={padding} x2={width - padding} y1={padding + ratio * (height - padding * 2)} y2={padding + ratio * (height - padding * 2)} stroke="#dfe5df" strokeDasharray="5 7" />)}
        <polygon points={area} fill="url(#chart-fill)" />
        <polyline points={polyline} fill="none" stroke="#19382e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={coordinates[0].x} cy={coordinates[0].y} r="7" fill="#c8e76b" stroke="#19382e" strokeWidth="4" />
        <circle cx={coordinates.at(-1)?.x} cy={coordinates.at(-1)?.y} r="7" fill="#c8e76b" stroke="#19382e" strokeWidth="4" />
      </svg>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

import {
  ArrowIcon,
  BoltIcon,
  BrandMark,
  CompassIcon,
  LeafIcon,
  PulseIcon,
  ShieldIcon,
  SparkIcon,
} from "@/components/icons";
import { AssessmentEntryLink } from "@/components/assessment-entry-link";
import { Marquee } from "@/components/marquee";
import { CountUp, Reveal } from "@/components/motion";

const stats: Array<{ to: number; suffix?: string; label: string }> = [
  { to: 7, label: "个简单问题" },
  { to: 3, label: "分钟即可完成" },
  { to: 4, label: "步看清方向" },
  { to: 100, suffix: "%", label: "数据私密保护" },
];

const marqueeItems = ["了解当下", "找到节奏", "持续向前", "由你定义", "从容改变", "更好的自己"];

const journey: Array<{ step: string; title: string; detail: string }> = [
  { step: "01", title: "身体信息", detail: "从身高、体重与年龄出发，看见此刻的真实基础。" },
  { step: "02", title: "生活节奏", detail: "结合日常活动与状态，理解你独有的生活方式。" },
  { step: "03", title: "个人目标", detail: "把想要的改变，拆解成清晰、可坚持的方向。" },
  { step: "04", title: "趋势报告", detail: "获得一份专属趋势参考，带着方向从容出发。" },
];

function HeroScene() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      {/* concentric rings */}
      <div className="absolute inset-[3%] rounded-full border border-white/12" />
      <div className="orbit-slow absolute inset-[3%] rounded-full border border-dashed border-[var(--lime)]/35">
        <span className="absolute left-[10%] top-[12%] size-3 rounded-full bg-[var(--lime)] shadow-[0_0_30px_rgba(196,242,75,0.9)]" />
      </div>
      <div className="orbit-reverse absolute inset-[16%] rounded-full border border-white/8">
        <span className="absolute bottom-[6%] right-[16%] size-2.5 rounded-full bg-[var(--coral)] shadow-[0_0_22px_rgba(255,106,69,0.8)]" />
      </div>

      {/* drawn progress arc */}
      <svg viewBox="0 0 560 560" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
        <path d="M70 470C120 330 210 150 430 70" fill="none" stroke="rgba(255,255,255,.1)" strokeLinecap="round" strokeWidth="64" />
        <path className="chart-line" d="M70 470C120 330 210 150 430 70" fill="none" stroke="var(--lime)" strokeLinecap="round" strokeWidth="3" />
        <circle cx="70" cy="470" r="9" fill="var(--coral)" />
        <circle cx="430" cy="70" r="9" fill="var(--lime)" />
      </svg>

      {/* glass status card */}
      <div className="float-soft absolute left-[2%] top-[14%] w-[52%] rounded-[1.75rem] border border-white/12 bg-white/[0.07] p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,.3)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
          <span>今日状态</span>
          <span className="pulse-soft size-2 rounded-full bg-[var(--lime)]" />
        </div>
        <p className="mt-7 text-6xl font-medium tracking-[-0.08em]">82</p>
        <p className="mt-1.5 text-sm text-white/55">稳步向前</p>
        <div className="mt-6 flex h-10 items-end gap-1.5">
          {[34, 56, 42, 70, 58, 82, 68, 94, 76, 100].map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="flex-1 rounded-full bg-[var(--lime)]"
              style={{ height: `${height}%`, opacity: 0.3 + index * 0.06 }}
            />
          ))}
        </div>
      </div>

      {/* rhythm card */}
      <div className="float-slow absolute bottom-[10%] right-[1%] w-[55%] rounded-[1.75rem] bg-[var(--paper)] p-5 text-[#071c16] shadow-[0_30px_90px_rgba(0,0,0,.32)] sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6c7872]">你的节奏</p>
          <span className="rounded-full bg-[var(--lime-soft)] px-2.5 py-1 text-[10px] font-bold">平衡</span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-medium tracking-[-0.07em] sm:text-5xl">3<span className="text-2xl"> min</span></p>
            <p className="mt-2 text-xs text-[#6c7872]">完成一次自我了解</p>
          </div>
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#071c16] text-[var(--lime)]">
            <ArrowIcon />
          </span>
        </div>
      </div>

      {/* floating trend chip */}
      <div className="pulse-soft absolute right-[6%] top-[6%] hidden rounded-2xl border border-[var(--lime)]/30 bg-[#071c16]/70 px-4 py-3 text-white backdrop-blur-md sm:block">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--lime)]">趋势</p>
        <p className="mt-0.5 text-lg font-semibold tracking-[-0.03em]">＋ 稳定</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[var(--canvas)] text-[#071c16]">
      {/* ============================ HERO ============================ */}
      <section className="surface-noise relative min-h-[820px] overflow-hidden bg-[#071c16] px-5 pb-16 pt-5 text-white sm:px-8 lg:min-h-screen lg:px-12 lg:pb-12">
        <div className="aurora" aria-hidden="true">
          <span className="aurora-blob aurora-1" />
          <span className="aurora-blob aurora-2" />
          <span className="aurora-blob aurora-3" />
        </div>
        <div className="grid-overlay pointer-events-none absolute inset-0" aria-hidden="true" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-5">
          <BrandMark light />
          <div className="flex items-center gap-5">
            <span className="hidden text-xs text-white/48 md:block">更了解自己，才能走得更远</span>
            <AssessmentEntryLink
              defaultLabel="开始测评"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold transition duration-300 hover:border-[var(--lime)] hover:bg-[var(--lime)] hover:text-[#071c16]"
              iconClassName="size-4"
            />
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-14">
          <div className="pb-4 lg:pb-10">
            <p className="motion-rise inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lime)] backdrop-blur">
              <span className="pulse-soft size-1.5 rounded-full bg-[var(--lime)]" />
              Move with intention
            </p>
            <h1 className="motion-rise motion-rise-delay-1 mt-7 max-w-4xl text-balance text-[3.4rem] font-medium leading-[0.9] tracking-[-0.075em] sm:text-7xl lg:text-[6.6rem]">
              更好的状态，
              <br />
              从<span className="gradient-text">了解自己</span>开始。
            </h1>
            <p className="motion-rise motion-rise-delay-2 mt-8 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
              用几分钟梳理身体信息、生活节奏与个人目标，获得一份清晰、易懂、真正属于你的趋势参考。
            </p>
            <div className="motion-rise motion-rise-delay-3 mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <AssessmentEntryLink
                defaultLabel="开始我的测评"
                className="group inline-flex min-w-56 items-center justify-between gap-8 rounded-full bg-[var(--lime)] px-6 py-4 font-semibold text-[#071c16] shadow-[0_18px_55px_rgba(196,242,75,.22)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--lime-bright)]"
                iconContainerClassName="grid size-8 place-items-center rounded-full bg-[#071c16] text-[var(--lime)] transition duration-300 group-hover:translate-x-1"
              />
              <div className="flex items-center gap-3 text-sm text-white/55">
                <span className="flex -space-x-2">
                  {["#ff6a45", "#d8ff5c", "#6fe4be"].map((color) => (
                    <span key={color} className="size-7 rounded-full border-2 border-[#071c16]" style={{ backgroundColor: color }} />
                  ))}
                </span>
                约 3 分钟 · 无需注册
              </div>
            </div>
          </div>
          <div className="motion-rise motion-rise-delay-2 lg:self-end">
            <HeroScene />
          </div>
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <section className="border-y border-[#071c16]/10 bg-[#071c16] py-6 text-white sm:py-7">
        <Marquee
          items={marqueeItems}
          className="text-3xl font-medium tracking-[-0.04em] text-white/85 sm:text-5xl"
        />
      </section>

      {/* ============================ STATS ============================ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <Reveal className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] border border-[#071c16]/10 bg-[#071c16]/10 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="bg-[var(--paper)] p-7 sm:p-9">
                <p className="text-5xl font-medium tracking-[-0.06em] sm:text-6xl">
                  <CountUp to={item.to} suffix={item.suffix} />
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">{item.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============================ BENTO FEATURES ============================ */}
      <section className="px-5 pb-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#68766f]">
                <SparkIcon className="size-4 text-[var(--teal)]" />
                Your pace, your way
              </p>
              <h2 className="mt-5 text-balance text-4xl font-medium leading-[1.02] tracking-[-0.06em] sm:text-6xl">
                每一次改变，
                <br className="hidden sm:block" />
                都应该适合你的节奏。
              </h2>
            </div>
          </Reveal>

          <Reveal className="mt-12" delay={80}>
            <div className="grid gap-4 md:grid-cols-6">
              {/* 01 — dark, ring */}
              <article className="surface-noise group relative col-span-1 flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[2rem] bg-[#071c16] p-8 text-white md:col-span-2">
                <div className="aurora opacity-70" aria-hidden="true">
                  <span className="aurora-blob aurora-1" style={{ opacity: 0.35 }} />
                </div>
                <div className="relative flex items-center justify-between">
                  <span className="text-xs font-bold text-white/40">01</span>
                  <span className="grid size-9 place-items-center rounded-full border border-white/15 text-[var(--lime)] transition duration-500 group-hover:rotate-45 group-hover:bg-[var(--lime)] group-hover:text-[#071c16]">
                    <ArrowIcon className="size-4" />
                  </span>
                </div>
                <div className="relative mx-auto my-6 grid size-32 place-items-center">
                  <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
                    <circle className="chart-line" cx="60" cy="60" r="52" fill="none" stroke="var(--lime)" strokeWidth="8" strokeLinecap="round" strokeDasharray="326" strokeDashoffset="70" />
                  </svg>
                  <span className="text-3xl font-medium tracking-[-0.05em]">82</span>
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-medium tracking-[-0.04em]">了解当下</h3>
                  <p className="mt-3 text-sm leading-7 text-white/55">从身体数据、目标和日常活动出发，看见此刻更真实的状态。</p>
                </div>
              </article>

              {/* 02 — wide, bars */}
              <article className="group relative col-span-1 flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[2rem] border border-[#071c16]/8 bg-[var(--paper)] p-8 md:col-span-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#68766f]">02</span>
                  <span className="grid size-9 place-items-center rounded-full border border-[#071c16]/10 transition duration-500 group-hover:rotate-45 group-hover:bg-[var(--lime)]">
                    <PulseIcon className="size-4" />
                  </span>
                </div>
                <div className="my-8 flex h-40 items-end gap-2 sm:gap-3">
                  {[38, 52, 44, 66, 58, 74, 63, 88, 79, 96, 84, 100].map((height, index) => (
                    <span
                      key={`${height}-${index}`}
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-[var(--lime)]/30 to-[var(--lime)]"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-md">
                    <h3 className="text-2xl font-medium tracking-[-0.04em]">找到节奏</h3>
                    <p className="mt-3 text-sm leading-7 text-[#68766f]">将目标拆成清晰的趋势与时间，让改变更有方向，也更从容。</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--lime-soft)] px-4 py-2 text-xs font-semibold">
                    <CompassIcon className="size-4" />
                    循序渐进
                  </span>
                </div>
              </article>

              {/* 03 — paper */}
              <article className="group relative col-span-1 flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[2rem] border border-[#071c16]/8 bg-[var(--paper)] p-8 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#68766f]">03</span>
                  <span className="grid size-9 place-items-center rounded-full border border-[#071c16]/10 transition duration-500 group-hover:rotate-45 group-hover:bg-[var(--lime)]">
                    <LeafIcon className="size-4" />
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-medium tracking-[-0.04em]">持续向前</h3>
                  <p className="mt-3 text-sm leading-7 text-[#68766f]">从简单、可执行的小行动开始，把更好的状态带进每一天。</p>
                </div>
              </article>

              {/* 04 — lime accent */}
              <article className="relative col-span-1 flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[2rem] bg-[var(--lime)] p-8 text-[#071c16] md:col-span-2">
                <div className="absolute -bottom-16 -right-12 size-48 rounded-full border-[26px] border-[#071c16]/10" />
                <BoltIcon className="size-7" />
                <div className="relative">
                  <p className="text-5xl font-medium tracking-[-0.06em]">0 元</p>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#0c2820]/70">无需注册、无需付款，即可解锁属于你的完整趋势报告。</p>
                </div>
              </article>

              {/* 05 — dark small */}
              <article className="surface-noise relative col-span-1 flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[2rem] bg-[#0c2820] p-8 text-white md:col-span-2">
                <ShieldIcon className="size-7 text-[var(--mint)]" />
                <div>
                  <h3 className="text-2xl font-medium tracking-[-0.04em]">数据私密</h3>
                  <p className="mt-3 text-sm leading-7 text-white/55">填写内容仅用于生成本次报告，被妥善保护，尊重你的隐私。</p>
                </div>
              </article>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ JOURNEY ============================ */}
      <section className="px-5 py-24 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#68766f]">The journey</p>
                <h2 className="mt-5 text-balance text-4xl font-medium leading-[1.04] tracking-[-0.06em] sm:text-5xl">简单四步，看见方向。</h2>
              </div>
              <p className="max-w-sm text-sm leading-7 text-[var(--muted)]">
                不追求标准答案，只帮你找到更适合自己的答案。你的进度会自动保存，随时离开、随时继续。
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-[#071c16]/10 bg-[#071c16]/10 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map((item, index) => (
              <Reveal key={item.step} delay={index * 90}>
                <article className="group h-full min-h-[240px] bg-[var(--paper)] p-8 transition duration-500 hover:bg-white">
                  <div className="flex items-baseline justify-between">
                    <span className="text-5xl font-medium tracking-[-0.06em] text-[#071c16]/15 transition duration-500 group-hover:text-[var(--lime)]">
                      {item.step}
                    </span>
                    <span className="mt-1 h-2 w-2 rounded-full bg-[var(--coral)]" />
                  </div>
                  <h3 className="mt-16 text-xl font-semibold tracking-[-0.03em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="px-5 pb-24 sm:px-8 sm:pb-32 lg:px-12">
        <Reveal className="mx-auto max-w-7xl">
          <div className="surface-noise relative overflow-hidden rounded-[2.5rem] bg-[#071c16] px-8 py-16 text-white sm:px-14 sm:py-24 lg:px-20">
            <div className="aurora" aria-hidden="true">
              <span className="aurora-blob aurora-1" />
              <span className="aurora-blob aurora-2" />
            </div>
            <div className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full border border-[var(--lime)]/15" />
            <div className="pointer-events-none absolute -right-10 top-10 size-[280px] rounded-full border border-[var(--lime)]/10" />

            <div className="relative max-w-3xl">
              <BrandMark light wordmark={false} />
              <h2 className="mt-8 text-balance text-4xl font-medium leading-[1.02] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                现在，给自己
                <br />
                <span className="gradient-text">三分钟</span>的时间。
              </h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/60">
                认真听听身体的声音，找到属于你的健康节奏。一切从这里开始。
              </p>
              <AssessmentEntryLink
                defaultLabel="现在开始"
                className="group mt-10 inline-flex items-center gap-5 rounded-full bg-[var(--lime)] px-7 py-4 text-lg font-semibold text-[#071c16] shadow-[0_18px_55px_rgba(196,242,75,.22)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--lime-bright)]"
                iconContainerClassName="grid size-9 place-items-center rounded-full bg-[#071c16] text-[var(--lime)] transition duration-300 group-hover:translate-x-1"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="bg-[#071c16] px-5 py-10 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark light />
          <p className="max-w-xl text-xs leading-6 text-white/42">
            健康趋势仅作为生活方式参考，不替代医生、营养师或其他专业人士的诊断与建议。
          </p>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";

const benefits = [
  {
    number: "01",
    title: "了解当下",
    description: "从身体数据、目标和日常活动出发，看见此刻更真实的状态。",
  },
  {
    number: "02",
    title: "找到节奏",
    description: "将目标拆成清晰的趋势与时间，让改变更有方向，也更从容。",
  },
  {
    number: "03",
    title: "持续向前",
    description: "从简单、可执行的小行动开始，把更好的状态带进每一天。",
  },
];

const journey = ["身体信息", "生活节奏", "个人目标", "趋势报告"];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className={`relative grid size-10 place-items-center overflow-hidden rounded-full ${light ? "bg-white text-[#10231d]" : "bg-[#10231d] text-white"}`}>
        <span className="absolute h-8 w-3 rotate-[32deg] rounded-full bg-[#c8f25f]" />
        <span className="absolute h-3 w-3 -translate-x-2 translate-y-2 rounded-full border-2 border-current" />
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em]">BETTER SELF</span>
    </span>
  );
}

function HeroMotionGraphic() {
  return (
    <div className="relative mx-auto aspect-[0.92] w-full max-w-[560px]">
      <div className="absolute inset-[8%] rounded-full border border-white/14" />
      <div className="orbit-slow absolute inset-[2%] rounded-full border border-dashed border-[#c8f25f]/35">
        <span className="absolute left-[12%] top-[12%] size-3 rounded-full bg-[#c8f25f] shadow-[0_0_30px_rgba(200,242,95,0.9)]" />
      </div>
      <svg viewBox="0 0 560 610" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
        <path d="M72 508C118 372 198 190 394 82" fill="none" stroke="rgba(255,255,255,.12)" strokeLinecap="round" strokeWidth="72" />
        <path d="M72 508C118 372 198 190 394 82" fill="none" stroke="#c8f25f" strokeLinecap="round" strokeWidth="3" />
        <circle cx="72" cy="508" r="10" fill="#ff795c" />
        <circle cx="394" cy="82" r="10" fill="#c8f25f" />
      </svg>
      <div className="float-soft absolute left-[4%] top-[16%] w-[48%] rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,.24)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
          <span>今日状态</span>
          <span className="size-2 rounded-full bg-[#c8f25f]" />
        </div>
        <p className="mt-8 text-5xl font-medium tracking-[-0.08em] sm:text-6xl">82</p>
        <p className="mt-2 text-sm text-white/55">稳步向前</p>
        <div className="mt-7 flex h-10 items-end gap-1.5">
          {[34, 56, 42, 70, 58, 82, 68, 94, 76, 100].map((height, index) => (
            <span key={`${height}-${index}`} className="flex-1 rounded-full bg-[#c8f25f]" style={{ height: `${height}%`, opacity: 0.28 + index * 0.065 }} />
          ))}
        </div>
      </div>
      <div className="absolute bottom-[10%] right-[2%] w-[54%] rounded-[2rem] bg-[#f7f5ef] p-5 text-[#10231d] shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6c7872]">你的节奏</p>
          <span className="rounded-full bg-[#e6f7b2] px-2.5 py-1 text-[10px] font-bold">平衡</span>
        </div>
        <div className="mt-7 flex items-end justify-between gap-5">
          <div>
            <p className="text-4xl font-medium tracking-[-0.07em] sm:text-5xl">3 min</p>
            <p className="mt-2 text-xs text-[#6c7872]">完成一次自我了解</p>
          </div>
          <div className="grid size-14 place-items-center rounded-full bg-[#10231d] text-[#c8f25f]">
            <ArrowIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f3f1eb] text-[#10231d]">
      <section className="surface-noise relative min-h-[760px] overflow-hidden bg-[#10231d] px-5 pb-16 pt-5 text-white sm:px-8 lg:min-h-screen lg:px-12 lg:pb-10">
        <div className="pointer-events-none absolute -left-48 top-1/3 size-[520px] rounded-full bg-[#1d5b46]/40 blur-[120px]" />
        <div className="pointer-events-none absolute -right-48 -top-32 size-[560px] rounded-full bg-[#c8f25f]/10 blur-[120px]" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-5">
          <BrandMark light />
          <div className="flex items-center gap-5">
            <span className="hidden text-xs text-white/48 sm:block">更了解自己，才能走得更远</span>
            <Link href="/assessment" className="group inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold transition duration-300 hover:border-[#c8f25f] hover:bg-[#c8f25f] hover:text-[#10231d]">
              开始测评
              <ArrowIcon />
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 pt-14 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:pt-16">
          <div className="pb-4 lg:pb-14">
            <p className="motion-rise text-xs font-semibold uppercase tracking-[0.28em] text-[#c8f25f]">Move with intention</p>
            <h1 className="motion-rise motion-rise-delay-1 mt-7 max-w-4xl text-balance text-[3.45rem] font-medium leading-[0.92] tracking-[-0.075em] sm:text-7xl lg:text-[6.4rem]">
              更好的状态，<br />从了解自己开始。
            </h1>
            <p className="motion-rise motion-rise-delay-2 mt-8 max-w-xl text-base leading-8 text-white/58 sm:text-lg">
              用几分钟梳理身体信息、生活节奏与个人目标，获得一份清晰、易懂、真正属于你的趋势参考。
            </p>
            <div className="motion-rise motion-rise-delay-3 mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link href="/assessment" className="group inline-flex min-w-48 items-center justify-between gap-8 rounded-full bg-[#c8f25f] px-6 py-4 font-semibold text-[#10231d] shadow-[0_18px_55px_rgba(200,242,95,.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#d8ff75]">
                开始我的测评
                <span className="grid size-8 place-items-center rounded-full bg-[#10231d] text-[#c8f25f] transition duration-300 group-hover:translate-x-1"><ArrowIcon /></span>
              </Link>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <span className="flex -space-x-2">
                  {["#ff795c", "#dff5a0", "#9ad9c0"].map((color) => <span key={color} className="size-7 rounded-full border-2 border-[#10231d]" style={{ backgroundColor: color }} />)}
                </span>
                约 3 分钟 · 无需注册
              </div>
            </div>
          </div>
          <div className="motion-rise motion-rise-delay-2 lg:self-end">
            <HeroMotionGraphic />
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#68766f]">Your pace, your way</p>
              <h2 className="mt-5 text-balance text-4xl font-medium leading-[1.02] tracking-[-0.06em] sm:text-6xl">每一次改变，都应该适合你的节奏。</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[2rem] border border-[#10231d]/10 bg-[#10231d]/10 sm:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit.number} className="group min-h-80 bg-[#f8f7f3] p-7 transition duration-500 hover:bg-white sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#68766f]">{benefit.number}</span>
                    <span className="grid size-9 place-items-center rounded-full border border-[#10231d]/10 transition duration-500 group-hover:rotate-45 group-hover:bg-[#c8f25f]"><ArrowIcon /></span>
                  </div>
                  <h3 className="mt-28 text-2xl font-medium tracking-[-0.04em]">{benefit.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#68766f]">{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 sm:pb-32 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#dfe9d8]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 sm:p-12 lg:p-16">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/65 px-4 py-2 text-xs font-semibold">
                <span className="size-2 rounded-full bg-[#ff795c]" />
                简单四步，看见方向
              </span>
              <h2 className="mt-8 max-w-xl text-balance text-4xl font-medium leading-[1.04] tracking-[-0.06em] sm:text-6xl">不追求标准答案，只找到更适合你的答案。</h2>
              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {journey.map((item, index) => (
                  <div key={item} className="flex items-center gap-4 border-t border-[#10231d]/15 py-4">
                    <span className="text-xs font-bold text-[#68766f]">0{index + 1}</span>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[420px] overflow-hidden bg-[#c8f25f] p-8 sm:p-12 lg:min-h-full">
              <div className="absolute -bottom-40 -right-32 size-[480px] rounded-full border-[80px] border-[#10231d] opacity-95" />
              <div className="absolute bottom-20 right-24 size-32 rounded-full border-[26px] border-[#ff795c]" />
              <div className="relative flex h-full flex-col justify-between">
                <BrandMark />
                <div className="max-w-sm">
                  <p className="text-sm leading-7 text-[#32463f]">你的答案会被妥善保存，离开后再次回来，也可以从上次的位置继续。</p>
                  <Link href="/assessment" className="group mt-8 inline-flex items-center gap-4 text-lg font-semibold">
                    现在开始
                    <span className="grid size-11 place-items-center rounded-full bg-[#10231d] text-[#c8f25f] transition duration-300 group-hover:translate-x-1"><ArrowIcon /></span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#10231d] px-5 py-8 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark light />
          <p className="max-w-xl text-xs leading-6 text-white/42">健康趋势仅作为生活方式参考，不替代医生、营养师或其他专业人士的诊断与建议。</p>
        </div>
      </footer>
    </main>
  );
}

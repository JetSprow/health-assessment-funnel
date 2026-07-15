import Link from "next/link";

const foundations = [
  ["01", "Persistence", "匿名 Session、增量保存、刷新恢复与乐观锁。"],
  ["02", "Core logic", "服务端 BMI、摄入量、目标日期与预测曲线。"],
  ["03", "Access", "非会员脱敏、模拟支付以及完整结果解锁。"],
  ["04", "Proof", "单元、集成、端到端测试和持续集成。"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f1e9] text-[#19382e]">
      <section className="relative px-5 pb-20 pt-6 sm:px-8 lg:px-12 lg:pb-28">
        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-[#d9ef98]/60 blur-3xl" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-bold tracking-[-0.02em]">
            <span className="grid size-9 place-items-center rounded-full bg-[#19382e] text-[#dff58d]">B</span>
            Better Self Lab
          </div>
          <span className="rounded-full border border-[#c8d0c8] bg-white/50 px-4 py-2 text-xs font-semibold text-[#52635c]">
            Full-stack demo · Ready
          </span>
        </nav>

        <div className="relative mx-auto grid max-w-7xl gap-14 pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-28">
          <div>
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.28em] text-[#66776f]">
              A healthier plan, built around you
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.065em] sm:text-7xl lg:text-[6.4rem]">
              用三分钟，找到更适合你的下一步。
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#53635d] sm:text-xl">
              七步问卷支持中断恢复，由服务端生成个性化趋势；先查看基础结果，再通过演示支付解锁完整报告。
            </p>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/assessment"
                className="inline-flex rounded-2xl bg-[#19382e] px-7 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(25,56,46,0.22)] transition hover:-translate-y-0.5 hover:bg-[#244c3f]"
              >
                开始测评
              </Link>
              <span className="text-sm text-[#66736d]">无需注册 · 进度自动保存</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_30px_90px_rgba(33,52,45,0.12)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7d8c84]">System status</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">完整闭环已接通</h2>
              </div>
              <span className="size-3 rounded-full bg-[#9ac43c] shadow-[0_0_0_7px_rgba(154,196,60,0.16)]" />
            </div>
            <div className="mt-8 space-y-3">
              {[
                "七步问卷与刷新恢复",
                "服务端健康趋势计算",
                "结果脱敏与权限控制",
                "幂等支付与自动化测试",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f3f6f1] px-4 py-3 text-sm font-medium">
                  <span className="grid size-6 place-items-center rounded-full bg-[#dff58d] text-xs">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="bg-[#19382e] px-5 py-20 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b9c9c0]">Architecture first</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">四条纵向切片，组成完整闭环。</h2>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {foundations.map(([number, title, description]) => (
              <article key={number} className="min-h-64 bg-[#19382e] p-7 transition hover:bg-[#20463a]">
                <span className="text-sm font-bold text-[#dff58d]">{number}</span>
                <h3 className="mt-16 text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#b9c9c0]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

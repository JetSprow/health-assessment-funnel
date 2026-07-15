import Link from "next/link";
import { AssessmentStarter } from "./assessment-starter";

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
      <path d="M15 10H4m4-4-4 4 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export default function AssessmentPage() {
  return (
    <main className="surface-noise relative min-h-screen overflow-hidden bg-[#10231d] px-5 py-5 text-white sm:px-8 sm:py-8 lg:px-12">
      <div className="pointer-events-none absolute -left-52 top-1/3 size-[520px] rounded-full bg-[#246049]/35 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 -top-40 size-[560px] rounded-full bg-[#c8f25f]/10 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col sm:min-h-[calc(100vh-64px)]">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white">
            <BackIcon />
            返回
          </Link>
          <span className="text-sm font-semibold tracking-[-0.02em]">BETTER SELF</span>
        </header>

        <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <section className="motion-rise max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c8f25f]">A moment for yourself</p>
            <h1 className="mt-7 text-balance text-5xl font-medium leading-[0.96] tracking-[-0.07em] sm:text-7xl lg:text-[5.6rem]">
              先留几分钟，<br />认真听听身体。
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/55 sm:text-lg">
              回答七个简单问题，我们会根据你的身体信息、生活节奏与目标，整理一份专属趋势参考。
            </p>
            <div className="mt-10">
              <AssessmentStarter />
            </div>
          </section>

          <section className="motion-rise motion-rise-delay-2 relative mx-auto w-full max-w-xl lg:justify-self-end">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#f3f1eb] p-7 text-[#10231d] shadow-[0_40px_120px_rgba(0,0,0,.3)] sm:p-10">
              <div className="absolute -right-16 -top-16 size-52 rounded-full border-[34px] border-[#c8f25f]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#6a7770]">你的专属旅程</span>
                  <span className="grid size-10 place-items-center rounded-full bg-white">
                    <span className="size-2.5 rounded-full bg-[#ff795c]" />
                  </span>
                </div>
                <div className="mt-16 space-y-3">
                  {[
                    ["01", "身体信息", "了解当下"],
                    ["02", "生活节奏", "找到平衡"],
                    ["03", "个人目标", "明确方向"],
                    ["04", "趋势报告", "轻松行动"],
                  ].map(([number, title, detail], index) => (
                    <div key={number} className={`flex items-center gap-4 rounded-2xl p-4 ${index === 0 ? "bg-[#10231d] text-white" : "border border-[#10231d]/10 bg-white/60"}`}>
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-[#c8f25f] text-[#10231d]" : "bg-[#e8ebe5] text-[#67736d]"}`}>{number}</span>
                      <div>
                        <p className="font-semibold">{title}</p>
                        <p className={`mt-0.5 text-xs ${index === 0 ? "text-white/48" : "text-[#7a857f]"}`}>{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex items-center gap-3 border-t border-[#10231d]/10 pt-6 text-xs leading-6 text-[#68756f]">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0 text-[#245a47]"><path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>
                  你的填写内容仅用于生成本次报告，并会被妥善保护。
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

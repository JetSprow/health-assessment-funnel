import Link from "next/link";
import { AssessmentStarter } from "./assessment-starter";
import { ArrowIcon, CheckIcon, ShieldIcon } from "@/components/icons";

const steps: Array<[string, string, string]> = [
  ["01", "身体信息", "了解当下"],
  ["02", "生活节奏", "找到平衡"],
  ["03", "个人目标", "明确方向"],
  ["04", "趋势报告", "轻松行动"],
];

export default function AssessmentPage() {
  return (
    <main className="surface-noise relative min-h-screen overflow-hidden bg-[#071c16] px-5 py-5 text-white sm:px-8 sm:py-8 lg:px-12">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-blob aurora-1" />
        <span className="aurora-blob aurora-2" />
        <span className="aurora-blob aurora-3" />
      </div>
      <div className="grid-overlay pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col sm:min-h-[calc(100vh-64px)]">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white">
            <ArrowIcon className="size-4" back />
            返回
          </Link>
          <span className="text-sm font-semibold tracking-[-0.02em]">BETTER SELF</span>
        </header>

        <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <section className="motion-rise max-w-2xl">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lime)] backdrop-blur">
              <span className="pulse-soft size-1.5 rounded-full bg-[var(--lime)]" />
              A moment for yourself
            </p>
            <h1 className="mt-7 text-balance text-5xl font-medium leading-[0.94] tracking-[-0.07em] sm:text-7xl lg:text-[5.6rem]">
              先留几分钟，
              <br />
              认真<span className="gradient-text">听听身体</span>。
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
              回答七个简单问题，我们会根据你的身体信息、生活节奏与目标，整理一份专属趋势参考。
            </p>
            <div className="mt-10">
              <AssessmentStarter />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/45">
              {["约 3 分钟", "无需注册", "随时保存进度", "结果即时生成"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckIcon className="size-3.5 text-[var(--lime)]" />
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="motion-rise motion-rise-delay-2 relative mx-auto w-full max-w-xl lg:justify-self-end">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[var(--paper)] p-7 text-[#071c16] shadow-[0_40px_120px_rgba(0,0,0,.4)] sm:p-10">
              <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full border-[30px] border-[var(--lime)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#6a7770]">你的专属旅程</span>
                  <span className="grid size-10 place-items-center rounded-full bg-white">
                    <span className="pulse-soft size-2.5 rounded-full bg-[var(--coral)]" />
                  </span>
                </div>

                <div className="mt-14 space-y-3">
                  {steps.map(([number, title, detail], index) => (
                    <div
                      key={number}
                      className={`flex items-center gap-4 rounded-2xl p-4 transition ${
                        index === 0 ? "bg-[#071c16] text-white shadow-[0_18px_40px_rgba(7,28,22,.24)]" : "border border-[#071c16]/10 bg-white/60"
                      }`}
                    >
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          index === 0 ? "bg-[var(--lime)] text-[#071c16]" : "bg-[#e8ebe5] text-[#67736d]"
                        }`}
                      >
                        {number}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold">{title}</p>
                        <p className={`mt-0.5 text-xs ${index === 0 ? "text-white/50" : "text-[#7a857f]"}`}>{detail}</p>
                      </div>
                      {index === 0 ? (
                        <span className="rounded-full bg-[var(--lime)]/15 px-3 py-1 text-[10px] font-semibold text-[var(--lime)]">从这里开始</span>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-3 border-t border-[#071c16]/10 pt-6 text-xs leading-6 text-[#68756f]">
                  <ShieldIcon className="size-5 shrink-0 text-[var(--teal)]" />
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

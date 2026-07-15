import Link from "next/link";
import { AssessmentStarter } from "./assessment-starter";

export default function AssessmentPage() {
  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-10 text-[#19382e] sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-[#52635c] hover:text-[#19382e]">
          ← 返回首页
        </Link>
        <section className="mt-8 rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_30px_80px_rgba(31,48,41,0.10)] sm:p-12">
          <div className="mb-8 h-2 overflow-hidden rounded-full bg-[#e9eee9]">
            <div className="h-full w-[8%] rounded-full bg-[#c8e76b]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#7c8b84]">
            Before we begin
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            先创建一个安全的匿名测评会话
          </h1>
          <p className="mt-5 text-base leading-8 text-[#5c6963] sm:text-lg">
            后端会为你生成匿名身份和 Session。之后每一步答案都会增量保存，刷新或暂时离开也不会丢失进度。
          </p>
          <div className="mt-10">
            <AssessmentStarter />
          </div>
        </section>
      </div>
    </main>
  );
}

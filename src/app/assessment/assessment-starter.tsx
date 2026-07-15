"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CreateSessionResponse = {
  data?: { sessionId: string };
  error?: { message: string };
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export function AssessmentStarter() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startAssessment() {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", { method: "POST" });
      const payload = (await response.json()) as CreateSessionResponse;

      if (!response.ok || !payload.data) {
        throw new Error("暂时无法开始，请稍后再试。");
      }

      router.push(`/assessment/${payload.data.sessionId}`);
    } catch {
      setError("暂时无法开始，请检查网络后重试。");
      setIsStarting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startAssessment}
        disabled={isStarting}
        className="group inline-flex w-full items-center justify-between gap-8 rounded-full bg-[#c8f25f] px-6 py-4 font-semibold text-[#10231d] shadow-[0_18px_45px_rgba(200,242,95,.15)] transition duration-300 hover:-translate-y-1 hover:bg-[#d8ff75] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70 sm:w-auto sm:min-w-60"
      >
        {isStarting ? "正在为你准备…" : "开始我的测评"}
        <span className="grid size-8 place-items-center rounded-full bg-[#10231d] text-[#c8f25f] transition duration-300 group-hover:translate-x-1">
          {isStarting ? <span className="size-3 animate-spin rounded-full border-2 border-[#c8f25f]/35 border-t-[#c8f25f]" /> : <ArrowIcon />}
        </span>
      </button>
      <p role={error ? "alert" : "status"} className={`mt-4 text-sm ${error ? "text-[#ff9a83]" : "text-white/45"}`}>
        {error ?? "约 3 分钟 · 可随时离开并继续"}
      </p>
    </div>
  );
}

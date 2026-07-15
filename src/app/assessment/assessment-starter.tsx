"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowIcon } from "@/components/icons";

type CreateSessionResponse = {
  data?: { sessionId: string };
  error?: { message: string };
};

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
        className="group relative inline-flex w-full items-center justify-between gap-8 overflow-hidden rounded-full bg-[var(--lime)] px-6 py-4 font-semibold text-[#071c16] shadow-[0_18px_55px_rgba(196,242,75,.22)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--lime-bright)] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70 sm:w-auto sm:min-w-64"
      >
        <span className="relative z-10">{isStarting ? "正在为你准备…" : "开始我的测评"}</span>
        <span className="relative z-10 grid size-8 place-items-center rounded-full bg-[#071c16] text-[var(--lime)] transition duration-300 group-hover:translate-x-1">
          {isStarting ? (
            <span className="size-3 animate-spin rounded-full border-2 border-[var(--lime)]/35 border-t-[var(--lime)]" />
          ) : (
            <ArrowIcon />
          )}
        </span>
      </button>
      <p role={error ? "alert" : "status"} className={`mt-4 text-sm ${error ? "text-[#ff9a83]" : "text-white/45"}`}>
        {error ?? "约 3 分钟 · 可随时离开并继续"}
      </p>
    </div>
  );
}

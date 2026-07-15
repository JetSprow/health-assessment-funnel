"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
        throw new Error(payload.error?.message ?? "创建会话失败");
      }

      router.push(`/assessment/${payload.data.sessionId}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "创建会话失败");
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={startAssessment}
        disabled={isStarting}
        className="w-full rounded-2xl bg-[#19382e] px-6 py-4 text-base font-semibold text-white shadow-[0_14px_30px_rgba(25,56,46,0.22)] transition hover:-translate-y-0.5 hover:bg-[#244c3f] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-52"
      >
        {isStarting ? "正在创建测评…" : "开始我的测评"}
      </button>
      {error ? (
        <p role="alert" className="max-w-md text-center text-sm text-red-700">
          {error}
        </p>
      ) : (
        <p className="text-center text-sm text-[#66736d]">约 3 分钟，可随时中断并恢复</p>
      )}
    </div>
  );
}

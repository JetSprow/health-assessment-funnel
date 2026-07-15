"use client";

import { ArrowIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SessionStatus = "DRAFT" | "COMPLETED";

type CurrentSession = {
  id: string;
  status: SessionStatus;
  currentStep: number;
};

type CurrentSessionResponse = {
  data?: { currentSession: CurrentSession | null };
};

type CreateSessionResponse = {
  data?: { sessionId: string; status: SessionStatus; resumed?: boolean };
  error?: { message: string };
};

export function AssessmentStarter() {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findCurrentSession = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions/current", {
        cache: "no-store",
      });
      const payload = (await response.json()) as CurrentSessionResponse;

      if (response.ok && payload.data) {
        setCurrentSession(payload.data.currentSession);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void findCurrentSession();
  }, [findCurrentSession]);

  function openSession(session: CurrentSession) {
    router.push(
      session.status === "COMPLETED"
        ? `/assessment/${session.id}/result`
        : `/assessment/${session.id}`,
    );
  }

  async function startAssessment() {
    setError(null);

    if (currentSession) {
      openSession(currentSession);
      return;
    }

    setIsStarting(true);

    try {
      const response = await fetch("/api/sessions", { method: "POST" });
      const payload = (await response.json()) as CreateSessionResponse;

      if (!response.ok || !payload.data) {
        throw new Error("暂时无法开始，请稍后再试。");
      }

      openSession({
        id: payload.data.sessionId,
        status: payload.data.status,
        currentStep: 0,
      });
    } catch {
      setError("暂时无法开始，请检查网络后重试。");
      setIsStarting(false);
    }
  }

  const isBusy = isChecking || isStarting;
  const buttonLabel = isChecking
    ? "正在寻找上次进度…"
    : isStarting
      ? "正在为你准备…"
      : currentSession?.status === "COMPLETED"
        ? "查看我的报告"
        : currentSession
          ? "继续上次测评"
          : "开始我的测评";
  const helperText = currentSession?.status === "COMPLETED"
    ? "你的报告仍然保留在这里"
    : currentSession
      ? `已为你保留到第 ${Math.min(currentSession.currentStep + 1, 7)} 步`
      : "约 3 分钟 · 可随时离开并继续";

  return (
    <div>
      <button
        type="button"
        onClick={startAssessment}
        disabled={isBusy}
        className="group relative inline-flex w-full items-center justify-between gap-8 overflow-hidden rounded-full bg-[var(--lime)] px-6 py-4 font-semibold text-[#071c16] shadow-[0_18px_55px_rgba(196,242,75,.22)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--lime-bright)] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70 sm:w-auto sm:min-w-64"
      >
        <span className="relative z-10">{buttonLabel}</span>
        <span className="relative z-10 grid size-8 place-items-center rounded-full bg-[#071c16] text-[var(--lime)] transition duration-300 group-hover:translate-x-1">
          {isBusy ? (
            <span className="size-3 animate-spin rounded-full border-2 border-[var(--lime)]/35 border-t-[var(--lime)]" />
          ) : (
            <ArrowIcon />
          )}
        </span>
      </button>
      <p role={error ? "alert" : "status"} className={`mt-4 text-sm ${error ? "text-[#ff9a83]" : "text-white/45"}`}>
        {error ?? helperText}
      </p>
    </div>
  );
}

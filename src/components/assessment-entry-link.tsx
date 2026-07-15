"use client";

import { ArrowIcon } from "@/components/icons";
import Link from "next/link";
import { useEffect, useState } from "react";

type CurrentSession = {
  id: string;
  status: "DRAFT" | "COMPLETED";
};

type CurrentSessionResponse = {
  data?: { currentSession: CurrentSession | null };
};

type AssessmentEntryLinkProps = {
  className: string;
  defaultLabel: string;
  iconClassName?: string;
  iconContainerClassName?: string;
};

export function AssessmentEntryLink({
  className,
  defaultLabel,
  iconClassName,
  iconContainerClassName,
}: AssessmentEntryLinkProps) {
  const [session, setSession] = useState<CurrentSession | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/sessions/current", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as CurrentSessionResponse;
        if (active && response.ok && payload.data) {
          setSession(payload.data.currentSession);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const href = session
    ? session.status === "COMPLETED"
      ? `/assessment/${session.id}/result`
      : `/assessment/${session.id}`
    : "/assessment";
  const label = session?.status === "COMPLETED"
    ? "查看我的报告"
    : session
      ? "继续上次测评"
      : defaultLabel;

  return (
    <Link href={href} className={className}>
      {label}
      {iconContainerClassName ? (
        <span className={iconContainerClassName}>
          <ArrowIcon className={iconClassName} />
        </span>
      ) : (
        <ArrowIcon className={iconClassName} />
      )}
    </Link>
  );
}

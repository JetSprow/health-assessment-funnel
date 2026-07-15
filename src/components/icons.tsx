/**
 * Pure, stateless SVG icons and the Better Self brand mark.
 *
 * No "use client" directive: these render on the server and can be imported
 * by both Server and Client Components without turning callers into client
 * bundles. Every icon is decorative and marked aria-hidden.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function base(className = "size-5"): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    className,
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function ArrowIcon({ className = "size-5", back = false }: { className?: string; back?: boolean }) {
  return (
    <svg {...base(`${className} ${back ? "rotate-180" : ""}`)}>
      <path d="M5 12h13m-5-5 5 5-5 5" />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg {...base(className)} strokeWidth={2.2}>
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

export function SparkIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...base(className)}>
      <path d="M12 3v4m0 10v4m9-9h-4M7 12H3m13.5-6.5-2.8 2.8M8.3 15.7l-2.8 2.8m13 0-2.8-2.8M8.3 8.3 5.5 5.5" />
    </svg>
  );
}

export function BoltIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...base(className)}>
      <path d="M13.5 2 5.5 14h6l-1 8 8-12h-6l1-8Z" />
    </svg>
  );
}

export function CompassIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

export function PulseIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...base(className)}>
      <path d="M3 12h4l2 6 4-14 2 8h6" />
    </svg>
  );
}

export function ShieldIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...base(className)}>
      <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function LockIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...base(className)}>
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  );
}

export function TargetIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function LeafIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...base(className)}>
      <path d="M20 4C9 4 4 10 4 20c10 0 16-5 16-16Z" />
      <path d="M4 20C8 14 12 11 18 8" />
    </svg>
  );
}

/**
 * The Better Self brand mark: a lime kinetic stroke inside a disc, paired with
 * the wordmark. `light` flips it for use on dark surfaces.
 */
export function BrandMark({
  light = false,
  className = "",
  wordmark = true,
}: {
  light?: boolean;
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`relative grid size-10 place-items-center overflow-hidden rounded-2xl ${
          light ? "bg-white text-[#071c16]" : "bg-[#071c16] text-white"
        }`}
      >
        <span className="absolute h-7 w-2.5 rotate-[30deg] rounded-full bg-[var(--lime)]" />
        <span className="absolute h-2.5 w-2.5 -translate-x-1.5 translate-y-1.5 rounded-full border-2 border-current" />
      </span>
      {wordmark ? <span className="text-sm font-semibold tracking-[-0.02em]">BETTER SELF</span> : null}
    </span>
  );
}

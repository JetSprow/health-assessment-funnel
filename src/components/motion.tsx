"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scroll-reveal wrapper. Server + first client render both emit
 * data-shown="false" (identical → no hydration mismatch); an
 * IntersectionObserver flips it to "true" once the block scrolls into view.
 * Under reduced motion the CSS forces the revealed state immediately.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Animated number that counts up from `from` to `to` the first time it enters
 * the viewport. Initial render shows `from`, matching SSR, so hydration stays
 * clean. Cancels its rAF on unmount to avoid setState-after-unmount warnings.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1500,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const startedRef = useRef(false);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      if (prefersReducedMotion()) {
        setValue(to);
        return;
      }

      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      let startTs = 0;
      const tick = (ts: number) => {
        if (!startTs) startTs = ts;
        const progress = Math.min(1, (ts - startTs) / duration);
        setValue(from + (to - from) * ease(progress));
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [to, from, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

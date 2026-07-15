/**
 * Seamless CSS marquee. The track is duplicated so translateX(-50%) loops
 * without a visible seam. Pure CSS, no client bundle. Pauses on hover.
 */
export function Marquee({
  items,
  reverse = false,
  className = "",
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
}) {
  const sequence = [...items, ...items];
  return (
    <div className={`marquee ${reverse ? "marquee-reverse" : ""} ${className}`}>
      <div className="marquee-track" aria-hidden="true">
        {sequence.map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex items-center gap-10">
            <span>{item}</span>
            <span className="inline-block size-2 shrink-0 rounded-full bg-[var(--lime)]" />
          </span>
        ))}
      </div>
    </div>
  );
}

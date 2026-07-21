import type { CSSProperties } from "react";

/**
 * Flat loading placeholder. Used in place of bare "Loading…" text so a loading
 * page keeps the shape of the content that's about to arrive (#7). Decorative —
 * always aria-hidden; the surrounding region should carry its own status text
 * for assistive tech where needed.
 */
export function Skeleton({
  w = "100%",
  h = 12,
  r,
  circle = false,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  circle?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`ss-skeleton${circle ? " circle" : ""}`}
      style={{ width: w, height: h, ...(r !== undefined ? { borderRadius: r } : {}), ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * A stack of avatar + two-line rows that mirrors the widget list rows
 * (pipeline, tasks, onboarding, alerts). Widths vary per row so it reads as
 * real content rather than a repeating bar.
 */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div className="ss-skel-row" key={i}>
          <Skeleton w={28} h={28} circle />
          <span className="lines">
            <Skeleton w={`${55 + ((i * 13) % 30)}%`} h={11} />
            <Skeleton w={`${30 + ((i * 17) % 25)}%`} h={9} />
          </span>
        </div>
      ))}
    </div>
  );
}

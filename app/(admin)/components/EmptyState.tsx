import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The shared "nothing here yet" / "couldn't load" panel: an icon badge, a
 * heading, optional guidance, and an optional action (e.g. a retry button).
 * `tone="danger"` tints the badge and marks the region as an alert for
 * assistive tech — use it when a load failed, not for a genuine empty result.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "neutral",
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  tone?: "neutral" | "danger";
  action?: ReactNode;
}) {
  const danger = tone === "danger";
  return (
    <div className="ss-empty" role={danger ? "alert" : undefined}>
      <span className={`ss-empty-badge${danger ? " is-danger" : ""}`}>
        <Icon />
      </span>
      <h3>{title}</h3>
      {description ? <p className="ss-meta">{description}</p> : null}
      {action}
    </div>
  );
}

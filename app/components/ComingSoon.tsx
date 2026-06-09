import type { LucideIcon } from "lucide-react";

/**
 * Placeholder page for admin routes that don't yet have a design.
 * Uses the design-system shell + a calm empty-state card.
 */
export default function ComingSoon({
  title,
  Icon,
  description,
}: {
  title: string;
  Icon: LucideIcon;
  description: string;
}) {
  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>{title}</h1>
        </div>
      </div>
      <div className="adm-content">
        <div
          className="ss-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-8) var(--space-5)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--r-md)",
              background: "var(--bg-secondary)",
              color: "var(--fg-secondary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: 22, height: 22 }} />
          </span>
          <h2>{title}</h2>
          <p className="ss-meta" style={{ maxWidth: 420 }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

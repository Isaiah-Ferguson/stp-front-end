import { Loader2 } from "lucide-react";

/**
 * Route-level loading UI for the admin portal (#19). Shown via Suspense while a
 * segment's data resolves, instead of a frozen blank screen.
 */
export default function AdminLoading() {
  return (
    <div className="adm-main">
      <div className="adm-content">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-3)",
            minHeight: "60vh",
            color: "var(--fg-secondary)",
          }}
        >
          <Loader2
            style={{ width: 28, height: 28, animation: "spin 1s linear infinite" }}
          />
          <p className="ss-meta">Loading…</p>
        </div>
      </div>
    </div>
  );
}

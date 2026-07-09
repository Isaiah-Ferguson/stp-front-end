"use client";

import { AlertTriangle } from "lucide-react";
import { ApiError } from "@/lib/api/client";

/**
 * Distinct error state for failed data loads (#35) — "the backend is unreachable"
 * must never render as an innocent empty list. Shows the backend's message when
 * available and offers a retry.
 */
export default function LoadError({
  title = "Couldn't load this data",
  error,
  onRetry,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const detail =
    error instanceof ApiError && error.detail
      ? error.detail
      : "The server may be unreachable. Check your connection and try again.";

  return (
    <div
      role="alert"
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
          background: "var(--danger-fill, var(--bg-secondary))",
          color: "var(--danger, var(--fg-secondary))",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertTriangle style={{ width: 22, height: 22 }} />
      </span>
      <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)" }}>{title}</h3>
      <p className="ss-meta" style={{ maxWidth: 340 }}>{detail}</p>
      {onRetry && (
        <button className="ss-btn ss-btn-primary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

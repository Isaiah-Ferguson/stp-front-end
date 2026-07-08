"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Error boundary for the admin portal (#19). Catches unhandled render/data errors
 * within any /(admin) route and shows a recoverable fallback instead of white-screening
 * the whole app. Note: in Next 16 the retry callback prop is `unstable_retry`.
 */
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Surface the error in the console / error reporting.
    console.error(error);
  }, [error]);

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Something went wrong</h1>
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
            <AlertTriangle style={{ width: 22, height: 22 }} />
          </span>
          <h2>This page hit an error</h2>
          <p className="ss-meta" style={{ maxWidth: 420 }}>
            The page couldn&apos;t be displayed. Your data is safe — try again, and if it
            keeps happening let an administrator know.
          </p>
          {error.digest && (
            <p className="ss-meta" style={{ opacity: 0.6, fontSize: 12 }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            className="ss-btn ss-btn-primary justify-center"
            onClick={() => unstable_retry()}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

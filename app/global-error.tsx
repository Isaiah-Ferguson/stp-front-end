"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

/**
 * Last-resort error boundary (#19). Catches errors thrown in the root layout itself,
 * which the per-segment error.tsx cannot handle. It replaces the root layout when active,
 * so it must render its own <html> and <body>. Kept dependency-free (no design-system
 * classes) so it works even if global styles failed to load.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          background: "#f7f7f8",
          color: "#1a1a1a",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h2 style={{ margin: "0 0 8px" }}>Something went wrong</h2>
          <p style={{ color: "#666", margin: "0 0 20px", lineHeight: 1.5 }}>
            The application hit an unexpected error. Please try again.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              background: "#378add",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

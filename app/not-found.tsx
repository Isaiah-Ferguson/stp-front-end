import Link from "next/link";

/**
 * App-wide 404 page (#19). Rendered inside the root layout for unmatched routes and
 * any `notFound()` calls that aren't caught by a nearer not-found.tsx.
 */
export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 style={{ fontSize: 48, margin: "0 0 8px" }}>404</h1>
        <h2 style={{ margin: "0 0 12px" }}>Page not found</h2>
        <p className="ss-meta" style={{ margin: "0 0 20px" }}>
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link href="/dashboard" className="ss-btn ss-btn-primary justify-center">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

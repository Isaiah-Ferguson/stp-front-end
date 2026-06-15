"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

/**
 * Gates its children behind authentication. While the session is resolving it
 * shows a centered spinner; if there is no authenticated user it redirects to
 * the login page.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/");
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: "100vh", color: "var(--fg-tertiary)" }}>
        <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}

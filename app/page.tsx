"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. returning with a valid token) → go straight in.
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace("/dashboard");
  }, [authLoading, isAuthenticated, router]);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.replace("/dashboard");
    } catch {
      setError("Invalid email or password.");
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      {/* ---- Brand panel (desktop left) ---- */}
      <div className="login-brand">
        <div>
          <div className="mb-12">
            <div className="login-logo-wrap">
              <Image src="/logo.png" alt="The Shining Stars Project" width={128} height={128} />
            </div>
          </div>

          <h1 className="login-headline">
            The CRM built for performing arts programs.
          </h1>

          <div>
            <p className="login-mission">
              “Empowering individuals of all abilities through inclusive performing arts, creative expression, and a community where everyone has the opportunity to shine.”
            </p>
          </div>
        </div>

        <p className="login-footer-note">
          © 2026 Shining Stars Project. Internal use only.
        </p>
      </div>

      {/* ---- Form panel (right / full on mobile) ---- */}
      <div className="login-form-panel">
        <div className="login-form-inner">

          {/* Mobile-only brand mark */}
          <div className="login-mobile-brand mb-8">
            <Image src="/logo.png" alt="The Shining Stars Project" width={96} height={96} />
          </div>

          <h2 className="text-xl font-medium text-fg mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-fg-secondary mb-8">
            Sign in to your account to continue
          </p>

          <form className="flex flex-col" style={{ gap: 18 }} onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="ss-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="you@shiningstarsprogram.org"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <div className="login-field-row">
                <label className="ss-label" htmlFor="password">Password</label>
                <a href="#" className="text-primary font-medium text-xs" style={{ textDecoration: "none" }}>Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--danger-fill, #fce8e8)", color: "var(--danger)", fontSize: 13 }}>
                <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="ss-btn ss-btn-primary justify-center"
              style={{ height: 44, fontSize: 14 }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} />
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </form>

          <p style={{
            marginTop: 32, fontSize: 12, color: "var(--fg-tertiary)",
            textAlign: "center", lineHeight: 1.5,
          }}>
            This is an internal portal. Contact your administrator if you
            need access.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

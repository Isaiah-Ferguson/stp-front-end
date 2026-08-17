"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

// ── Mirrors of backend constants ──────────────────────────────────────────────
//
// The challenge cookie is httpOnly and every failed code gets the identical 401 — the
// backend refuses to say whether a code was wrong, expired, or the last one allowed, because
// telling an attacker how much of the challenge is left is free reconnaissance. That is the
// right call server-side and it leaves the user with nothing to act on, so the screen keeps
// its own count from the two published limits: MfaChallenge.MaxAttempts and
// AuthService.ChallengeMinutes. They are a UX estimate, never a control — the server decides,
// and if these ever drift the worst case is an offer to retry that the backend then refuses.
const MAX_CODE_ATTEMPTS = 5;
const CHALLENGE_MS = 5 * 60 * 1000;

/** How the challenge died. Either way the only way forward is the password again. */
type ChallengeEnd = "attempts" | "expired";

const errorBoxStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
  borderRadius: "var(--r-md)", background: "var(--danger-fill, #fce8e8)",
  color: "var(--danger)", fontSize: 13,
};

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" style={errorBoxStyle}>
      <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
      {children}
    </div>
  );
}

/** Strips the spaces and dashes authenticator apps and printed codes put between groups. */
function normalizeCode(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyMfa, isAuthenticated, loading: authLoading } = useAuth();

  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Code step
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_CODE_ATTEMPTS);
  const [expiresAt, setExpiresAt] = useState(0);
  const [remainingMs, setRemainingMs] = useState(CHALLENGE_MS);
  const [challengeEnd, setChallengeEnd] = useState<ChallengeEnd | null>(null);

  // Already signed in (e.g. returning with a valid token) → go straight in.
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace("/dashboard");
  }, [authLoading, isAuthenticated, router]);

  // Count the challenge down so an expired one says so instead of silently rejecting
  // everything the user types.
  useEffect(() => {
    if (step !== "code" || challengeEnd !== null) return;
    const tick = () => {
      const left = expiresAt - Date.now();
      setRemainingMs(left);
      if (left <= 0) setChallengeEnd("expired");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, challengeEnd, expiresAt]);

  function backToCredentials() {
    setStep("credentials");
    setCode("");
    setUseRecoveryCode(false);
    setError(null);
    setChallengeEnd(null);
    setAttemptsLeft(MAX_CODE_ATTEMPTS);
    setSubmitting(false);
  }

  async function handleCredentials(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { mfaRequired } = await login({ email: email.trim(), password });
      if (!mfaRequired) {
        router.replace("/dashboard");
        return;
      }
      // The challenge cookie is the credential from here on, so the password has no further
      // use — drop it rather than leave it sitting in component state. Coming back means
      // typing it again, which also gets a fresh challenge and supersedes this one.
      setPassword("");
      setExpiresAt(Date.now() + CHALLENGE_MS);
      setRemainingMs(CHALLENGE_MS);
      setAttemptsLeft(MAX_CODE_ATTEMPTS);
      setChallengeEnd(null);
      setStep("code");
      setSubmitting(false);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      setError(
        status === 429
          ? "Too many sign-in attempts from this network. Wait a minute and try again."
          : "Invalid email or password."
      );
      setSubmitting(false);
    }
  }

  async function handleCode(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyMfa(normalizeCode(code));
      router.replace("/dashboard");
    } catch (err) {
      const status = (err as { status?: number })?.status;

      if (status === 429) {
        // Rate-limited before the challenge ever saw the code, so this did not cost an attempt.
        setError("Too many attempts from this network. Wait a minute and try again.");
        setSubmitting(false);
        return;
      }

      if (status !== 401) {
        setError("Couldn't reach the server. Check your connection and try again.");
        setSubmitting(false);
        return;
      }

      const left = attemptsLeft - 1;
      setAttemptsLeft(left);
      setCode("");
      setSubmitting(false);
      if (left <= 0) {
        setChallengeEnd("attempts");
        return;
      }
      setError(
        useRecoveryCode
          ? "That recovery code wasn't accepted. Each one works only once."
          : "That code wasn't accepted. Check your authenticator app and try again."
      );
    }
  }

  const normalized = normalizeCode(code);
  const codeLooksComplete = useRecoveryCode
    ? normalized.length === 16
    : /^\d{6}$/.test(normalized);

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

          {step === "credentials" ? (
            <>
              <h2 className="text-xl font-medium text-fg mb-1">
                Welcome back!
              </h2>
              <p className="text-sm text-fg-secondary mb-8">
                Sign in to your account to continue
              </p>

              <form className="flex flex-col" style={{ gap: 18 }} onSubmit={handleCredentials}>
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

                {error && <ErrorNote>{error}</ErrorNote>}

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
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <ShieldCheck style={{ width: 18, height: 18, color: "var(--primary)" }} />
                <h2 className="text-xl font-medium text-fg" style={{ margin: 0 }}>
                  Two-step verification
                </h2>
              </div>
              <p className="text-sm text-fg-secondary mb-8">
                {challengeEnd !== null
                  ? "You'll need to start over."
                  : useRecoveryCode
                    ? "Enter one of the recovery codes you saved when you set up two-factor authentication."
                    : "Enter the 6-digit code from your authenticator app."}
              </p>

              {challengeEnd !== null ? (
                <div className="flex flex-col" style={{ gap: 18 }}>
                  <ErrorNote>
                    {challengeEnd === "attempts"
                      ? "Too many incorrect codes. For your security this sign-in has been cancelled."
                      : "This sign-in request expired. Codes have to be entered within five minutes."}
                  </ErrorNote>
                  <button
                    type="button"
                    className="ss-btn ss-btn-primary justify-center"
                    style={{ height: 44, fontSize: 14 }}
                    onClick={backToCredentials}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form className="flex flex-col" style={{ gap: 18 }} onSubmit={handleCode}>
                  <div className="login-field">
                    <div className="login-field-row">
                      <label className="ss-label" htmlFor="mfa-code">
                        {useRecoveryCode ? "Recovery code" : "Authentication code"}
                      </label>
                      <span style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
                        Expires in {mmss(remainingMs)}
                      </span>
                    </div>
                    <input
                      id="mfa-code"
                      key={useRecoveryCode ? "recovery" : "totp"}
                      type="text"
                      className="login-input"
                      style={{ letterSpacing: useRecoveryCode ? "0.08em" : "0.35em", fontVariantNumeric: "tabular-nums" }}
                      placeholder={useRecoveryCode ? "XXXX-XXXX-XXXX-XXXX" : "000000"}
                      inputMode={useRecoveryCode ? "text" : "numeric"}
                      autoComplete="one-time-code"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={useRecoveryCode ? 19 : 7}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      autoFocus
                      required
                    />
                    <span style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
                      {attemptsLeft === 1
                        ? "1 attempt left before you have to sign in again."
                        : `${attemptsLeft} attempts left.`}
                    </span>
                  </div>

                  {error && <ErrorNote>{error}</ErrorNote>}

                  <button
                    type="submit"
                    className="ss-btn ss-btn-primary justify-center"
                    style={{ height: 44, fontSize: 14 }}
                    disabled={submitting || !codeLooksComplete}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} />
                        Verifying…
                      </>
                    ) : "Verify"}
                  </button>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <button
                      type="button"
                      onClick={backToCredentials}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--fg-tertiary)" }}
                    >
                      <ArrowLeft style={{ width: 13, height: 13 }} />
                      Back to sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUseRecoveryCode((v) => !v); setCode(""); setError(null); }}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--primary)" }}
                    >
                      {useRecoveryCode ? "Use your authenticator app" : "Use a recovery code instead"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <p style={{
            marginTop: 32, fontSize: 12, color: "var(--fg-tertiary)",
            textAlign: "center", lineHeight: 1.5,
          }}>
            {step === "code"
              ? "Lost your phone? An administrator can reset two-factor authentication on your account."
              : "This is an internal portal. Contact your administrator if you need access."}
          </p>
        </div>
      </div>

    </main>
  );
}

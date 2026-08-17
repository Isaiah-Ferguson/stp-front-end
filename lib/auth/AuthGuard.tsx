"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "./AuthProvider";

/** Where enrollment lives. The one admin page a not-yet-enrolled user is allowed to sit on. */
const ENROLLMENT_PATH = "/account";

/**
 * Gates its children behind authentication. While the session is resolving it
 * shows a centered spinner; if there is no authenticated user it redirects to
 * the login page.
 *
 * It also handles the second gate: when mandatory MFA is on and this account has no
 * authenticator, the backend refuses every endpoint bar a handful, so rendering a page would
 * produce nothing but "couldn't load" panels. Those users get one explanation and a trip to
 * the account page instead. The backend's MfaEnforcementFilter is the control; this is the
 * difference between a locked door and a locked door with a sign on it.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, mfaEnrollmentRequired } = useAuth();

  const sessionReady = !loading && isAuthenticated;
  const needsEnrollment =
    sessionReady && mfaEnrollmentRequired && pathname !== ENROLLMENT_PATH;

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (needsEnrollment) router.replace(ENROLLMENT_PATH);
  }, [needsEnrollment, router]);

  if (loading || !isAuthenticated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: "100vh", color: "var(--fg-tertiary)" }}>
        <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (needsEnrollment) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: "100vh", padding: "var(--space-4)" }}>
        <div className="ss-card" style={{ maxWidth: 420, padding: "var(--space-5)", textAlign: "center" }}>
          <span style={{ display: "inline-flex", width: 40, height: 40, borderRadius: "50%", background: "var(--warning-fill)", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-3)" }}>
            <ShieldAlert style={{ width: 20, height: 20, color: "#9a6a12" }} />
          </span>
          <h2 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>
            Set up two-factor authentication
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-secondary)", lineHeight: 1.6, margin: "0 0 var(--space-4)" }}>
            This CRM holds participant health and guardian information, so every account needs
            an authenticator app before it can be used. It takes about a minute — you&apos;ll
            scan a code with your phone.
          </p>
          <Link href={ENROLLMENT_PATH} className="ss-btn ss-btn-primary" style={{ justifyContent: "center", width: "100%" }}>
            <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} />
            Taking you to setup…
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

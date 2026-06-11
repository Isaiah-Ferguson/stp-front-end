import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const DEMO_ROLES = [
  { init: "JD", cls: "admin",       role: "Admin",       desc: "Full access — all programs" },
  { init: "RM", cls: "teacher",     role: "Teacher",     desc: "Attendance & student notes" },
  { init: "JK", cls: "coordinator", role: "Coordinator", desc: "Program coordination" },
];

export default function LoginPage() {
  return (
    <>
      {/* Styles moved to app/styles/login.css and imported in globals.css */}

      <main className="login-shell">
        {/* ---- Brand panel (desktop left) ---- */}
        <div className="login-brand">
          <div>
            {/* Logo */}
            <div className="mb-12">
              <div className="login-logo-wrap">
                <Image src="/logo.png" alt="The Shining Stars Project" width={128} height={128} />
              </div>
            </div>

            {/* Headline */}
            <h1 className="login-headline">
              The CRM built for performing arts programs.
            </h1>

            {/* Mission statement */}
            <div>
              <p className="login-mission">
                “Empowering individuals of all abilities through inclusive performing arts, creative expression, and a community where everyone has the opportunity to shine.”
              </p>
            </div>
          </div>

          {/* Footer */}
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

            {/* Heading */}
            <h2 className="text-xl font-medium text-fg mb-1">
              Welcome back
            </h2>
            <p className="text-sm text-fg-secondary mb-8">
              Sign in to your account to continue
            </p>

            {/* Form */}
            <form className="flex flex-col" style={{ gap: 18 }}>
              <div className="login-field">
                <label className="ss-label" htmlFor="email">Email address</label>
                <input id="email" type="email" className="login-input" placeholder="you@shiningstarsprogram.org" autoComplete="email" />
              </div>

              <div className="login-field">
                <div className="login-field-row">
                  <label className="ss-label" htmlFor="password">Password</label>
                  <a href="#" className="text-primary font-medium text-xs" style={{ textDecoration: 'none' }}>Forgot password?</a>
                </div>
                <input id="password" type="password" className="login-input" placeholder="••••••••" autoComplete="current-password" />
              </div>

              <Link href="/dashboard" className="ss-btn ss-btn-primary justify-center" style={{ height: 44, fontSize: 14 }}>
                Sign in
              </Link>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <hr />
              <span>or continue as demo</span>
              <hr />
            </div>

            {/* Demo role buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEMO_ROLES.map((r) => (
                <Link key={r.role} href="/dashboard" className="login-role-btn">
                  <span className={`ss-avatar ${r.cls} sm`}>{r.init}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.role}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-tertiary)", marginTop: 1 }}>
                      {r.desc}
                    </div>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }} />
                </Link>
              ))}
            </div>

            <p style={{
              marginTop: 32, fontSize: 12, color: "var(--fg-tertiary)",
              textAlign: "center", lineHeight: 1.5,
            }}>
              This is an internal portal. Contact your administrator if you
              need access.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

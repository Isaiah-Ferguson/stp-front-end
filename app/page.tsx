import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";

const DEMO_ROLES = [
  { init: "JD", cls: "admin",       role: "Admin",       desc: "Full access — all programs" },
  { init: "RM", cls: "teacher",     role: "Teacher",     desc: "Attendance & student notes" },
  { init: "JK", cls: "coordinator", role: "Coordinator", desc: "Program coordination" },
];

export default function LoginPage() {
  return (
    <>
      <style>{`
        .login-shell {
          min-height: 100vh;
          display: flex;
          background: var(--bg);
          font-family: var(--font-sans);
        }
        .login-brand {
          flex: 1;
          background: var(--fg);
          color: #fff;
          padding: 48px 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100vh;
        }
        .login-form-panel {
          width: 460px;
          flex-shrink: 0;
          min-height: 100vh;
          background: var(--surface);
          border-left: var(--bw) solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 44px;
        }
        .login-form-inner { max-width: 360px; width: 100%; margin: 0 auto; }
        .login-field { display: flex; flex-direction: column; gap: 6px; }
        .login-field-row { display: flex; align-items: center; justify-content: space-between; }
        .login-input {
          width: 100%; box-sizing: border-box;
          height: 42px; padding: 0 var(--space-3);
          font-family: var(--font-sans); font-size: var(--fs-body); color: var(--fg);
          background: var(--surface); border: var(--bw) solid var(--border);
          border-radius: var(--r-md); outline: none;
        }
        .login-input:focus { border-color: var(--border-hover); }
        .login-input::placeholder { color: var(--fg-tertiary); }
        .login-divider {
          display: flex; align-items: center; gap: 12;
          margin: 24px 0; color: var(--fg-tertiary); font-size: 12px;
        }
        .login-divider hr { flex: 1; border: none; border-top: var(--bw) solid var(--border); }
        .login-role-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: var(--r-md);
          border: var(--bw) solid var(--border); background: var(--surface);
          text-decoration: none; color: var(--fg); cursor: pointer;
          transition: border-color 80ms;
        }
        .login-role-btn:hover { border-color: var(--border-hover); background: var(--bg); }
        /* mobile: hide brand panel, form fills screen */
        @media (max-width: 768px) {
          .login-brand { display: none; }
          .login-form-panel {
            width: 100%; border-left: none;
            padding: 40px 24px;
          }
          .login-mobile-brand { display: flex !important; }
        }
        .login-mobile-brand { display: none; }
      `}</style>

      <main className="login-shell">
        {/* ---- Brand panel (desktop left) ---- */}
        <div className="login-brand">
          <div>
            {/* Logo row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6,
                background: "var(--productions)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <Star style={{ width: 16, height: 16, color: "#fff" }} />
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em" }}>
                Shining Stars CRM
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 30, fontWeight: 500, lineHeight: 1.25,
              color: "#fff", marginBottom: 14, maxWidth: 340,
            }}>
              The CRM built for performing arts programs.
            </h1>

            {/* Mission statement */}
            <div style={{ maxWidth: 380, marginTop: 24 }}>
              <p style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.72)",
                fontStyle: "italic",
              }}>
                “Empowering individuals of all abilities through inclusive performing arts, creative expression, and a community where everyone has the opportunity to shine.”
              </p>
            </div>
          </div>

          {/* Footer */}
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 32 }}>
            © 2026 Shining Stars Project. Internal use only.
          </p>
        </div>

        {/* ---- Form panel (right / full on mobile) ---- */}
        <div className="login-form-panel">
          <div className="login-form-inner">

            {/* Mobile-only brand mark */}
            <div className="login-mobile-brand" style={{
              alignItems: "center", gap: 8, marginBottom: 32,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 6,
                background: "var(--productions)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <Star style={{ width: 14, height: 14, color: "#fff" }} />
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>
                Shining Stars CRM
              </span>
            </div>

            {/* Heading */}
            <h2 style={{ fontSize: 22, fontWeight: 500, color: "var(--fg)", marginBottom: 6 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: "var(--fg-secondary)", marginBottom: 32 }}>
              Sign in to your account to continue
            </p>

            {/* Form */}
            <form style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="login-field">
                <label className="ss-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  placeholder="you@shiningstarsprogram.org"
                  autoComplete="email"
                />
              </div>

              <div className="login-field">
                <div className="login-field-row">
                  <label className="ss-label" htmlFor="password">Password</label>
                  <a href="#" style={{
                    fontSize: 12, color: "var(--primary)",
                    textDecoration: "none", fontWeight: 500,
                  }}>
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Link
                href="/dashboard"
                className="ss-btn ss-btn-primary"
                style={{ justifyContent: "center", height: 44, fontSize: 14 }}
              >
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

"use client";

import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Download,
  RefreshCw,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { parseApiTimestamp } from "@/lib/format";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { MfaStatusDto, MfaSetupResultDto } from "@/lib/types/api";

// ── Shared bits ───────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)",
  padding: "8px 12px", fontSize: 13, color: "var(--fg)",
  background: "var(--surface)", outline: "none",
};

const monoStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums",
};

const errorBoxStyle: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 6, padding: "8px 12px",
  borderRadius: "var(--r-md)", background: "var(--danger-fill, #fce8e8)",
  color: "var(--danger)", fontSize: 12,
};

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" style={errorBoxStyle}>
      <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
      {children}
    </div>
  );
}

/**
 * The backend hands back genuinely user-facing text on 400/409 ("Current password is
 * incorrect.", "That code is not valid…"), so those are worth showing verbatim. A 429 has an
 * empty body — every MFA endpoint shares the sign-in rate limiter — so it needs its own line.
 */
function mfaErrorMessage(err: unknown, fallback: string): string {
  const { status, detail } = (err ?? {}) as { status?: number; detail?: string };
  if (status === 429) return "Too many attempts from this network. Wait a minute and try again.";
  if ((status === 400 || status === 409) && detail) return detail;
  return fallback;
}

/** Strips the grouping characters authenticator apps display between digits. */
const normalizeCode = (raw: string) => raw.replace(/[\s-]/g, "");
const isSixDigits = (raw: string) => /^\d{6}$/.test(normalizeCode(raw));

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      className="ss-btn"
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => setCopied(true),
          // Clipboard access can be refused (insecure context, permissions). Say nothing
          // rather than claim a copy that did not happen — the text is on screen to select.
          () => setCopied(false),
        );
      }}
    >
      {copied ? <Check className="ss-btn-icon" /> : <Copy className="ss-btn-icon" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function PasswordField({
  id, label, value, onChange,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="ss-label" htmlFor={id} style={{ display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="current-password"
          style={{ ...inputStyle, paddingRight: 38 }}
        />
        <button type="button" onClick={() => setShow((v) => !v)} tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, display: "inline-flex" }}>
          {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
        </button>
      </div>
    </div>
  );
}

/**
 * A 6-digit field. Deliberately does NOT offer a recovery code: only /login/mfa accepts one.
 * Every endpoint on this page validates the TOTP secret directly, so a recovery code typed
 * here would just be rejected with no explanation of why.
 */
function TotpField({
  id, label, value, onChange, hint,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; hint?: string;
}) {
  return (
    <div>
      <label className="ss-label" htmlFor={id} style={{ display: "block", marginBottom: 6 }}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        spellCheck={false}
        maxLength={7}
        placeholder="000000"
        style={{ ...inputStyle, ...monoStyle, letterSpacing: "0.3em", maxWidth: 180 }}
      />
      {hint && <div style={{ marginTop: 4, fontSize: 11, color: "var(--fg-tertiary)" }}>{hint}</div>}
    </div>
  );
}

// ── QR code ───────────────────────────────────────────────────────────────────

/**
 * Renders the otpauth:// URI as a scannable QR code.
 *
 * Painted into a canvas rather than an <img src="data:…"> so nothing depends on the CSP's
 * data: allowance, and loaded on demand because the encoder is dead weight for every user
 * who is not mid-enrollment. The colours are pinned to black-on-white in both themes: a
 * dark-mode QR with inverted modules does not scan on most phones.
 *
 * Mount this keyed on the URI: the effect only ever moves to the failed state, so a remount
 * is what clears it.
 */
function QrCode({ uri }: { uri: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((qrcode) => {
        if (cancelled || !canvasRef.current) return;
        return qrcode.toCanvas(canvasRef.current, uri, {
          width: 176,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#ffffff" },
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [uri]);

  if (failed) {
    return (
      <div style={{ fontSize: 12, color: "var(--fg-tertiary)", maxWidth: 190, lineHeight: 1.5 }}>
        The QR code couldn&apos;t be drawn. Use the setup key below — it does exactly the same
        job, typed instead of scanned.
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", padding: 10, borderRadius: "var(--r-md)", border: "0.5px solid var(--border)", lineHeight: 0 }}>
      <canvas ref={canvasRef} role="img" aria-label="QR code for setting up your authenticator app" />
    </div>
  );
}

// ── Recovery codes, shown exactly once ────────────────────────────────────────

function downloadRecoveryCodes(codes: string[], email: string) {
  const body = [
    "Shining Stars CRM — two-factor recovery codes",
    `Account: ${email}`,
    `Issued:  ${new Date().toLocaleString()}`,
    "",
    "Each code signs you in once, if you lose your phone. Cross one off as you use it.",
    "Keep this file somewhere only you can reach. Anyone holding it plus your password",
    "can sign in as you.",
    "",
    ...codes,
    "",
  ].join("\n");

  const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "shining-stars-recovery-codes.txt";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * The one and only showing of a user's recovery codes.
 *
 * This panel REPLACES the enroll panel — including the submit button that had focus when the
 * user pressed Enter — so without the effect below, document.activeElement falls back to
 * <body>: nothing is announced, the next Tab restarts from the top of the document, and a
 * screen-reader user has no indication that ten single-use credentials which can never be
 * retrieved are currently on screen.
 *
 * Deliberately NOT useDialogFocus, which the modals in users/_modals.tsx use. That hook traps
 * Tab inside its element, which is right for a modal and wrong here: this is an inline region
 * of the account page, and trapping would strand a keyboard user inside it with no way back to
 * the navigation. Moving focus in and announcing the panel is the part that applies.
 */
function RecoveryCodesPanel({
  codes, email, onDone,
}: {
  codes: string[]; email: string; onDone: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* tabIndex -1 makes the heading programmatically focusable without adding a tab stop. */}
      <h4
        ref={headingRef}
        tabIndex={-1}
        style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--fg)", outline: "none" }}
      >
        Your recovery codes
      </h4>

      {/* role="status" so the warning is announced when the panel appears, the way ErrorNote
          elsewhere in this file uses role="alert". */}
      <div className="ss-alert is-warning" role="status">
        <ShieldAlert />
        <span className="ss-alert-text">
          <strong>Save these now.</strong> This is the only time they will ever be shown —
          there is no way to look them up again, only to replace the whole set.
        </span>
      </div>

      <p style={{ fontSize: 13, color: "var(--fg-secondary)", lineHeight: 1.6, margin: 0 }}>
        Each code signs you in once if you don&apos;t have your phone. Store them the way you
        would store a spare key: somewhere you can reach, and nobody else can.
      </p>

      {/* An ordered list rather than bare spans: a screen reader announces the count and lets
          the user step through the codes one at a time, which is how somebody copying them
          onto paper actually reads them. The grid is kept via list-style/padding resets. */}
      <ol
        aria-label={`${codes.length} recovery codes`}
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8,
          padding: "var(--space-3)", margin: 0, listStyle: "none",
          background: "var(--bg)", borderRadius: "var(--r-md)",
          border: "0.5px solid var(--border)",
        }}
      >
        {codes.map((c) => (
          <li key={c} style={{ ...monoStyle, fontSize: 13, letterSpacing: "0.02em" }}>{c}</li>
        ))}
      </ol>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <CopyButton value={codes.join("\n")} label="Copy all" />
        <button type="button" className="ss-btn" onClick={() => downloadRecoveryCodes(codes, email)}>
          <Download className="ss-btn-icon" />
          Download .txt
        </button>
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--fg-secondary)", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        I have saved these codes somewhere safe.
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {/* Gated on the acknowledgement so a stray click cannot destroy the one copy. */}
        <button type="button" className="ss-btn ss-btn-primary" disabled={!acknowledged} onClick={onDone}>
          <Check className="ss-btn-icon" />
          Done
        </button>
      </div>
    </div>
  );
}

// ── Enrollment ────────────────────────────────────────────────────────────────

function EnrollPanel({
  setup, onEnabled, onCancel,
}: {
  setup: MfaSetupResultDto;
  onEnabled: (codes: string[]) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await authApi.mfaEnable({ code: normalizeCode(code) });
      onEnabled(result.recoveryCodes);
    } catch (err) {
      setError(mfaErrorMessage(err, "Couldn't turn on two-factor authentication — try again."));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>1. Scan this with your authenticator app</div>
        <p style={{ fontSize: 12, color: "var(--fg-tertiary)", margin: "0 0 var(--space-3)", lineHeight: 1.5 }}>
          Google Authenticator, Microsoft Authenticator, 1Password, Authy — any of them work.
        </p>
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-start" }}>
          <QrCode key={setup.otpAuthUri} uri={setup.otpAuthUri} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="ss-label" style={{ marginBottom: 6 }}>Or enter this key by hand</div>
            <div style={{
              ...monoStyle, fontSize: 13, wordBreak: "break-all", lineHeight: 1.6,
              padding: "8px 12px", background: "var(--bg)", borderRadius: "var(--r-md)",
              border: "0.5px solid var(--border)", marginBottom: 8,
            }}>
              {setup.secret}
            </div>
            <CopyButton value={setup.secret} label="Copy key" />
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>2. Enter the code it shows you</div>
        <TotpField
          id="mfa-enroll-code"
          label="6-digit code"
          value={code}
          onChange={setCode}
          hint="The code changes every 30 seconds. If it's rejected, wait for the next one."
        />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="ss-alert is-info">
        <AlertCircle />
        <span className="ss-alert-text">
          Turning this on signs out your other devices — none of them proved a second factor.
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="ss-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="ss-btn ss-btn-primary" disabled={!isSixDigits(code) || saving}>
          {saving ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <ShieldCheck className="ss-btn-icon" />}
          {saving ? "Turning on…" : "Turn on two-factor"}
        </button>
      </div>
    </form>
  );
}

// ── Regenerate recovery codes ─────────────────────────────────────────────────

function RegeneratePanel({
  onIssued, onCancel,
}: {
  onIssued: (codes: string[]) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await authApi.mfaRegenerateRecoveryCodes({ code: normalizeCode(code) });
      onIssued(result.recoveryCodes);
    } catch (err) {
      setError(mfaErrorMessage(err, "Couldn't issue new recovery codes — try again."));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <p style={{ fontSize: 13, color: "var(--fg-secondary)", lineHeight: 1.6, margin: 0 }}>
        You&apos;ll get ten new codes and the old ten stop working immediately — including any
        you have written down.
      </p>
      <TotpField
        id="mfa-regen-code"
        label="Code from your authenticator app"
        value={code}
        onChange={setCode}
      />
      {error && <ErrorNote>{error}</ErrorNote>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="ss-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="ss-btn ss-btn-primary" disabled={!isSixDigits(code) || saving}>
          {saving ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw className="ss-btn-icon" />}
          {saving ? "Issuing…" : "Issue new codes"}
        </button>
      </div>
    </form>
  );
}

// ── Reset the authenticator (the backend's mfa/disable) ───────────────────────

/**
 * The backend calls this endpoint "disable", and its own doc comment is emphatic that the UI
 * must not: while two-factor is required, clearing the enrollment does not switch anything
 * off — the very next request is refused and the user is confined to this page until they
 * set up a new authenticator. "Reset" is what actually happens, and it is what this is for:
 * a new phone.
 */
function ResetAuthenticatorPanel({
  onReset, onCancel,
}: {
  onReset: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authApi.mfaDisable({ currentPassword: password, code: normalizeCode(code) });
      onReset();
    } catch (err) {
      setError(mfaErrorMessage(err, "Couldn't remove your authenticator — try again."));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="ss-alert is-warning">
        <ShieldAlert />
        <span className="ss-alert-text">
          This removes the authenticator currently on your account and destroys your recovery
          codes. Because two-factor is required here, you&apos;ll be asked to set up a new one
          straight away — you will not be able to use the rest of the CRM until you do.
        </span>
      </div>

      <PasswordField id="mfa-reset-pw" label="Your password" value={password} onChange={setPassword} />
      <TotpField
        id="mfa-reset-code"
        label="Code from your current authenticator app"
        value={code}
        onChange={setCode}
        hint="Still need your old phone for this. If you no longer have it, ask an administrator to reset your account."
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="ss-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="ss-btn" disabled={password.length === 0 || !isSixDigits(code) || saving}
          style={{ background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }}>
          {saving ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <RotateCcw className="ss-btn-icon" />}
          {saving ? "Removing…" : "Reset authenticator"}
        </button>
      </div>
    </form>
  );
}

// ── The section ───────────────────────────────────────────────────────────────

type Panel = "none" | "enroll" | "regenerate" | "reset";

export function MfaSection() {
  const { user, mfaEnrollmentRequired, refreshUser } = useAuth();
  const enabled = user?.mfaEnabled ?? false;

  const [status, setStatus] = useState<MfaStatusDto | null>(null);
  const [panel, setPanel] = useState<Panel>("none");
  const [setup, setSetup] = useState<MfaSetupResultDto | null>(null);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Refresh after anything that changes enrollment or burns a recovery code.
  async function reloadStatus() {
    try {
      setStatus(await authApi.mfaStatus());
    } catch {
      // The badge degrades to whatever /me said; not worth an error panel of its own.
      setStatus(null);
    }
  }

  useEffect(() => {
    let active = true;
    authApi.mfaStatus().then(
      (s) => { if (active) setStatus(s); },
      () => { if (active) setStatus(null); },
    );
    return () => { active = false; };
  }, []);

  async function startEnrollment() {
    setStarting(true);
    setError(null);
    try {
      // Re-running setup replaces any half-finished secret from an abandoned attempt, so a
      // cancelled enrollment leaves nothing behind that a later one has to clean up.
      setSetup(await authApi.mfaSetup());
      setPanel("enroll");
    } catch (err) {
      setError(mfaErrorMessage(err, "Couldn't start setup — try again."));
    } finally {
      setStarting(false);
    }
  }

  async function handleEnabled(codes: string[]) {
    setSetup(null);
    setPanel("none");
    setFreshCodes(codes);
    setNotice("Two-factor authentication is on.");
    // /me now reports mfaEnabled, which is what clears the enrollment gate app-wide.
    await refreshUser();
    await reloadStatus();
  }

  async function handleRegenerated(codes: string[]) {
    setPanel("none");
    setFreshCodes(codes);
    setNotice("New recovery codes issued.");
    await reloadStatus();
  }

  async function handleReset() {
    setPanel("none");
    setNotice("Your authenticator has been removed. Set up a new one to keep using the CRM.");
    await refreshUser();
    await reloadStatus();
  }

  const lowOnCodes = enabled && status !== null && status.recoveryCodesRemaining <= 3;

  return (
    <div className="widget">
      <div className="widget-head">
        {enabled
          ? <ShieldCheck className="ico" style={{ color: "var(--success, #1d9e75)" }} />
          : <ShieldAlert className="ico" style={{ color: "var(--danger)" }} />}
        <h3>Two-factor authentication</h3>
        <span className={`ss-badge ${enabled ? "is-active" : "is-attention"}`}>
          {enabled ? "On" : "Off"}
        </span>
      </div>

      <div className="widget-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", paddingTop: "var(--space-3)", paddingBottom: "var(--space-4)" }}>
        {notice && freshCodes === null && (
          <div className="ss-alert" style={{ background: "var(--success-fill)", borderColor: "var(--success-border)", color: "var(--success-text)" }}>
            <CheckCircle2 />
            <span className="ss-alert-text">{notice}</span>
          </div>
        )}

        {freshCodes !== null ? (
          <RecoveryCodesPanel
            codes={freshCodes}
            email={user?.email ?? ""}
            onDone={() => setFreshCodes(null)}
          />
        ) : panel === "enroll" && setup !== null ? (
          <EnrollPanel
            setup={setup}
            onEnabled={handleEnabled}
            onCancel={() => { setSetup(null); setPanel("none"); }}
          />
        ) : panel === "regenerate" ? (
          <RegeneratePanel onIssued={handleRegenerated} onCancel={() => setPanel("none")} />
        ) : panel === "reset" ? (
          <ResetAuthenticatorPanel onReset={handleReset} onCancel={() => setPanel("none")} />
        ) : enabled ? (
          <>
            <div style={{ fontSize: 13, color: "var(--fg-secondary)", lineHeight: 1.6 }}>
              Your account asks for a code from your authenticator app every time you sign in.
              {status?.enabledAt && (
                // Through parseApiTimestamp, not new Date(): backend instants round-trip
                // through SQL Server kind-less and arrive with no trailing "Z", so new Date()
                // reads them as local time. Enrolling at 19:30 in California showed "Turned on"
                // as the NEXT day — on the page a user checks to see whether an enrollment they
                // did not make has happened.
                <> Turned on {parseApiTimestamp(status.enabledAt).toLocaleDateString()}.</>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ color: "var(--fg-secondary)" }}>Recovery codes left:</span>
              <strong style={monoStyle}>{status?.recoveryCodesRemaining ?? "—"}</strong>
              {lowOnCodes && (
                <span className="ss-badge is-attention">Running low</span>
              )}
            </div>

            {lowOnCodes && (
              <div className="ss-alert is-warning">
                <ShieldAlert />
                <span className="ss-alert-text">
                  Issue a new set before you run out — without a code and without your phone,
                  only an administrator can get you back in.
                </span>
              </div>
            )}

            {error && <ErrorNote>{error}</ErrorNote>}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="ss-btn" onClick={() => { setError(null); setPanel("regenerate"); }}>
                <RefreshCw className="ss-btn-icon" />
                New recovery codes
              </button>
              <button type="button" className="ss-btn" onClick={() => { setError(null); setPanel("reset"); }}>
                <RotateCcw className="ss-btn-icon" />
                Reset authenticator app
              </button>
            </div>
          </>
        ) : (
          <>
            {mfaEnrollmentRequired && (
              <div className="ss-alert is-warning">
                <ShieldAlert />
                <span className="ss-alert-text">
                  <strong>Required before you can use the CRM.</strong> This system holds
                  participant health details and guardian contacts, so every account needs a
                  second factor. The rest of the app stays locked until this is done.
                </span>
              </div>
            )}

            <div style={{ fontSize: 13, color: "var(--fg-secondary)", lineHeight: 1.6 }}>
              Add a code from your phone to your password. It takes about a minute, and you
              only do it once per device you sign in from.
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            <div>
              <button type="button" className="ss-btn ss-btn-primary" onClick={startEnrollment} disabled={starting}>
                {starting ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <Smartphone className="ss-btn-icon" />}
                {starting ? "Starting…" : "Set up authenticator app"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  ShieldCheck,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { initialsOf } from "@/lib/format";
import type { ChangePasswordDto } from "@/lib/types/api";

const MIN_PASSWORD = 8;

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)",
  padding: "8px 12px", fontSize: 13, color: "var(--fg)",
  background: "var(--surface)", outline: "none",
};

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="ss-label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          style={{ ...inputStyle, paddingRight: 38 }}
        />
        <button type="button" onClick={() => setShow((v) => !v)} tabIndex={-1}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, display: "inline-flex" }}>
          {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
        </button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, loading } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const lenOk = next.length >= MIN_PASSWORD;
  const matchOk = next === confirm;
  const distinctOk = next !== current || next.length === 0;
  const canSubmit =
    current.length > 0 && lenOk && matchOk && next !== current;

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setSaving(true);
    const dto: ChangePasswordDto = { currentPassword: current, newPassword: next };
    try {
      await authApi.changePassword(dto);
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      const status = (err as { status?: number })?.status;
      setError(
        status === 400
          ? "Your current password is incorrect."
          : "Could not change your password — please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="adm-main">
        <div className="adm-topbar">
          <div className="titles">
            <h1>Account</h1>
            <span className="date">Your profile and sign-in</span>
          </div>
        </div>

        <div className="adm-content" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 560 }}>
          {/* Profile summary */}
          <div className="widget">
            <div className="widget-head">
              <UserIcon className="ico" style={{ color: "var(--primary)" }} />
              <h3>Profile</h3>
            </div>
            <div className="widget-body">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className={`ss-avatar ${user?.role === "Admin" ? "admin" : "teacher"}`} style={{ width: 44, height: 44, fontSize: 15 }}>
                  {user ? initialsOf(user.fullName) : "?"}
                </span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{loading ? "…" : user?.fullName ?? "—"}</div>
                  <div style={{ fontSize: 13, color: "var(--fg-secondary)" }}>{user?.email}</div>
                </div>
                {user && (
                  <span className={`ss-badge ${user.role === "Admin" ? "is-attention" : ""}`} style={{ marginLeft: "auto" }}>
                    {user.role === "Admin" ? <ShieldCheck /> : <UserIcon />}
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="widget">
            <div className="widget-head">
              <KeyRound className="ico" style={{ color: "var(--primary)" }} />
              <h3>Change password</h3>
            </div>
            <div className="widget-body">
              {done && (
                <div className="ss-alert" style={{ marginBottom: "var(--space-3)", background: "var(--success-fill)", borderColor: "var(--success-border)", color: "var(--success-text)" }}>
                  <CheckCircle2 />
                  <span className="ss-alert-text">Your password has been updated.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />

                <div>
                  <PasswordField label="New password" value={next} onChange={setNext} autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD} characters`} />
                  {next.length > 0 && !lenOk && (
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--danger)" }}>Must be at least {MIN_PASSWORD} characters.</div>
                  )}
                  {next.length > 0 && lenOk && !distinctOk && (
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--danger)" }}>Choose a password different from your current one.</div>
                  )}
                </div>

                <div>
                  <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
                  {confirm.length > 0 && !matchOk && (
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--danger)" }}>Passwords don&apos;t match.</div>
                  )}
                </div>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--danger-fill, #fce8e8)", color: "var(--danger)", fontSize: 13 }}>
                    <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="ss-btn ss-btn-primary" type="submit" disabled={!canSubmit || saving}>
                    {saving ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <KeyRound className="ss-btn-icon" />}
                    {saving ? "Updating…" : "Update password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

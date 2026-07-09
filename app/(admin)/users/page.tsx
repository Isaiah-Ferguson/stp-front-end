"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Pencil,
  KeyRound,
  Trash2,
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { staffApi } from "@/lib/api/staff";
import { useAuth } from "@/lib/auth/AuthProvider";
import { initialsOf } from "@/lib/format";
import type {
  UserDto,
  StaffSummaryDto,
  RegisterUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  UserRole,
} from "@/lib/types/api";

// ── Shared modal primitives ─────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(43,42,38,.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 200, padding: "var(--space-4)",
};
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)",
  padding: "8px 12px", fontSize: 13, color: "var(--fg)",
  background: "var(--surface)", outline: "none",
};
const errorBoxStyle: React.CSSProperties = {
  margin: "0 var(--space-4)", padding: "8px 12px", borderRadius: "var(--r-md)",
  background: "var(--danger-fill, #fce8e8)", color: "var(--danger)", fontSize: 12,
  display: "flex", alignItems: "flex-start", gap: 6,
};
const iconBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 28, height: 28, borderRadius: "var(--r-sm)", border: "0.5px solid transparent",
  background: "none", cursor: "pointer", color: "var(--fg-secondary)",
};

function apiErrorMessage(e: unknown, fallback: string): string {
  const status = (e as { status?: number })?.status;
  if (status === 409 || status === 400) {
    // Backend sends a human-readable guard message; surface a sensible default.
    return "That change isn't allowed — you can't remove the last admin or lock yourself out.";
  }
  return fallback;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Create User Modal ───────────────────────────────────────────────────────────

type CreateForm = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  staffMemberId: string;
};
const EMPTY_FORM: CreateForm = { fullName: "", email: "", password: "", role: "Staff", staffMemberId: "" };

const MIN_PASSWORD = 8;

function CreateUserModal({
  staff,
  onClose,
  onCreated,
}: {
  staff: StaffSummaryDto[];
  onClose: () => void;
  onCreated: (u: UserDto) => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const pwValid = form.password.length >= MIN_PASSWORD;
  const canSubmit = form.fullName.trim().length > 0 && emailValid && pwValid;

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)",
    padding: "8px 12px", fontSize: 13, color: "var(--fg)",
    background: "var(--surface)", outline: "none",
  };

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    const dto: RegisterUserDto = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      staffMemberId: form.staffMemberId || undefined,
    };
    try {
      const created = await authApi.register(dto);
      onCreated(created);
    } catch (e) {
      const status = (e as { status?: number })?.status;
      setError(
        status === 409
          ? "An account with that email already exists."
          : "Could not create the account — make sure the backend is running and you are signed in as an admin."
      );
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "var(--space-4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(460px, 100%)", display: "flex", flexDirection: "column", border: "0.5px solid var(--border-hover)", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Create user</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>They can sign in with this email and password</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, borderRadius: "var(--r-sm)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto" }}>
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Full name <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <input type="text" placeholder="e.g. Jamie Diaz" value={form.fullName}
              onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
              style={inputStyle} autoFocus />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Email <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <input type="email" placeholder="you@shiningstarsprogram.org" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle} />
            {form.email.length > 0 && !emailValid && (
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--danger)" }}>Enter a valid email address.</div>
            )}
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Temporary password <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} placeholder="At least 8 characters" value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ ...inputStyle, paddingRight: 38 }} />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, display: "inline-flex" }}>
                {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
            {form.password.length > 0 && !pwValid && (
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--danger)" }}>Must be at least {MIN_PASSWORD} characters.</div>
            )}
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Role</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["Staff", "Admin"] as const).map((r) => {
                const sel = form.role === r;
                const Icon = r === "Admin" ? ShieldCheck : UserIcon;
                return (
                  <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                    style={{
                      flex: 1, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 12px",
                      borderRadius: "var(--r-md)", cursor: "pointer", fontSize: 13, textAlign: "left",
                      border: `0.5px solid ${sel ? "var(--primary, #378add)" : "var(--border)"}`,
                      background: sel ? "var(--bg)" : "var(--surface)",
                      color: sel ? "var(--fg)" : "var(--fg-secondary)",
                    }}>
                    <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{r}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>
                        {r === "Admin" ? "Full access + user mgmt" : "Standard access"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {staff.length > 0 && (
            <div>
              <div className="ss-label" style={{ marginBottom: 6 }}>
                Link to staff record <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional</span>
              </div>
              <select value={form.staffMemberId}
                onChange={(e) => setForm(f => ({ ...f, staffMemberId: e.target.value }))}
                style={{ ...inputStyle, appearance: "auto" }}>
                <option value="">Not linked</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} — {s.role}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div style={{ margin: "0 var(--space-4)", padding: "8px 12px", borderRadius: "var(--r-md)", background: "var(--danger-fill, #fce8e8)", color: "var(--danger)", fontSize: 12, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="ss-btn" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ss-btn ss-btn-primary" type="button" disabled={!canSubmit || saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus className="ss-btn-icon" />}
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit User Modal ─────────────────────────────────────────────────────────────

function EditUserModal({
  target,
  isSelf,
  onClose,
  onSaved,
}: {
  target: UserDto;
  isSelf: boolean;
  onClose: () => void;
  onSaved: (u: UserDto) => void;
}) {
  const [fullName, setFullName] = useState(target.fullName);
  const [role, setRole] = useState<UserRole>(target.role);
  const [isActive, setIsActive] = useState(target.isActive);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = fullName.trim() !== target.fullName || role !== target.role || isActive !== target.isActive;
  const canSubmit = fullName.trim().length > 0 && dirty;

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    const dto: UpdateUserDto = { fullName: fullName.trim(), role, isActive };
    try {
      const updated = await authApi.update(target.id, dto);
      onSaved(updated);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not save changes — try again."));
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(440px, 100%)", display: "flex", flexDirection: "column", border: "0.5px solid var(--border-hover)", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Edit user</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>{target.email}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, borderRadius: "var(--r-sm)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto" }}>
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Full name</div>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Role</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["Staff", "Admin"] as const).map((r) => {
                const sel = role === r;
                const Icon = r === "Admin" ? ShieldCheck : UserIcon;
                return (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    style={{
                      flex: 1, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 12px",
                      borderRadius: "var(--r-md)", cursor: "pointer", fontSize: 13,
                      border: `0.5px solid ${sel ? "var(--primary, #378add)" : "var(--border)"}`,
                      background: sel ? "var(--bg)" : "var(--surface)",
                      color: sel ? "var(--fg)" : "var(--fg-secondary)",
                    }}>
                    <Icon style={{ width: 16, height: 16 }} />
                    {r}
                  </button>
                );
              })}
            </div>
            {isSelf && role !== "Admin" && target.role === "Admin" && (
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--danger)" }}>You can&apos;t remove your own admin access.</div>
            )}
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Account status</div>
            <button type="button" onClick={() => setIsActive((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                borderRadius: "var(--r-md)", cursor: "pointer", fontSize: 13, textAlign: "left",
                border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--fg)",
              }}>
              <span style={{
                width: 36, height: 20, borderRadius: 999, flexShrink: 0, position: "relative",
                background: isActive ? "var(--success, #1d9e75)" : "var(--border-strong, #ccc)", transition: "background 120ms",
              }}>
                <span style={{ position: "absolute", top: 2, left: isActive ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 120ms" }} />
              </span>
              <span>
                <div style={{ fontWeight: 500 }}>{isActive ? "Active" : "Disabled"}</div>
                <div style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>
                  {isActive ? "Can sign in" : "Blocked from signing in"}
                </div>
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div style={errorBoxStyle}>
            <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="ss-btn" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ss-btn ss-btn-primary" type="button" disabled={!canSubmit || saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <Check className="ss-btn-icon" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ─────────────────────────────────────────────────────────

function ResetPasswordModal({
  target,
  onClose,
  onDone,
}: {
  target: UserDto;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const valid = password.length >= MIN_PASSWORD;

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    const dto: ResetPasswordDto = { newPassword: password };
    try {
      await authApi.resetPassword(target.id, dto);
      onDone();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not reset the password — try again."));
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(420px, 100%)", display: "flex", flexDirection: "column", border: "0.5px solid var(--border-hover)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Reset password</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>{target.fullName} · {target.email}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4)" }}>
          <div className="ss-label" style={{ marginBottom: 6 }}>New password</div>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} placeholder="At least 8 characters" value={password}
              onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 38 }} autoFocus />
            <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, display: "inline-flex" }}>
              {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            </button>
          </div>
          {password.length > 0 && !valid && (
            <div style={{ marginTop: 4, fontSize: 11, color: "var(--danger)" }}>Must be at least {MIN_PASSWORD} characters.</div>
          )}
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--fg-tertiary)" }}>
            The user should change this after their next sign-in.
          </div>
        </div>

        {error && <div style={{ ...errorBoxStyle, marginBottom: 0 }}><AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />{error}</div>}

        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="ss-btn" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ss-btn ss-btn-primary" type="button" disabled={!valid || saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <KeyRound className="ss-btn-icon" />}
            {saving ? "Resetting…" : "Set password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ─────────────────────────────────────────────────────────

function DeleteUserModal({
  target,
  onClose,
  onDeleted,
}: {
  target: UserDto;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await authApi.remove(target.id);
      onDeleted();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not delete this user — try again."));
      setDeleting(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(400px, 100%)", display: "flex", flexDirection: "column", border: "0.5px solid var(--border-hover)" }}>
        <div style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ display: "inline-flex", width: 32, height: 32, borderRadius: "50%", background: "var(--danger-fill, #fce8e8)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 style={{ width: 16, height: 16, color: "var(--danger)" }} />
            </span>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Delete user?</h3>
          </div>
          <p style={{ fontSize: 13, color: "var(--fg-secondary)", lineHeight: 1.5, margin: 0 }}>
            <strong>{target.fullName}</strong> ({target.email}) will permanently lose access. This can&apos;t be undone.
          </p>
        </div>

        {error && <div style={{ ...errorBoxStyle, marginBottom: 0 }}><AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />{error}</div>}

        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="ss-btn" type="button" onClick={onClose} disabled={deleting}>Cancel</button>
          <button className="ss-btn" type="button" disabled={deleting} onClick={handleDelete}
            style={{ background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }}>
            {deleting ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 className="ss-btn-icon" />}
            {deleting ? "Deleting…" : "Delete user"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { isAdmin, loading: authLoading, user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [staff, setStaff] = useState<StaffSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [resetting, setResetting] = useState<UserDto | null>(null);
  const [deleting, setDeleting] = useState<UserDto | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    setLoading(true);
    Promise.all([authApi.listUsers(), staffApi.getAll().catch(() => [])])
      .then(([u, s]) => { setUsers(u); setStaff(s); })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [authLoading, isAdmin]);

  // Non-admins never see the roster.
  if (!authLoading && !isAdmin) {
    return (
      <div className="adm-main">
        <div className="adm-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", gap: 8 }}>
          <ShieldCheck style={{ width: 28, height: 28, color: "var(--fg-tertiary)" }} />
          <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Admins only</h2>
          <p style={{ fontSize: 13, color: "var(--fg-tertiary)", maxWidth: 320 }}>
            You need an administrator account to manage users.
          </p>
        </div>
      </div>
    );
  }

  const adminCount = users.filter((u) => u.role === "Admin").length;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="adm-main">
        <div className="adm-topbar">
          <div className="titles">
            <h1>Users</h1>
            <span className="date">{users.length} account{users.length === 1 ? "" : "s"} · {adminCount} admin{adminCount === 1 ? "" : "s"}</span>
          </div>
          <div className="right">
            <button className="ss-btn ss-btn-primary" type="button" onClick={() => setModalOpen(true)}>
              <UserPlus className="ss-btn-icon" />
              Create user
            </button>
          </div>
        </div>

        <div className="adm-content">
          {notice && (
            <div className="ss-alert" style={{ marginBottom: "var(--space-4)", background: "var(--success-fill)", borderColor: "var(--success-border)", color: "var(--success-text)" }}>
              <CheckCircle2 />
              <span className="ss-alert-text">{notice}</span>
              <button type="button" onClick={() => setNotice(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", display: "inline-flex" }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
          <div className="tbl-card">
            <div className="tbl-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ width: 120, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>
                        Loading users…
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>
                        No users yet — create one to get started.
                      </td>
                    </tr>
                  ) : users.map((u) => {
                    const isMe = currentUser?.id === u.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="cell-student">
                            <span className={`ss-avatar sm ${u.role === "Admin" ? "admin" : "teacher"}`}>
                              {initialsOf(u.fullName)}
                            </span>
                            <div>
                              <div className="nm">
                                {u.fullName}
                                {isMe && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--fg-tertiary)" }}>(you)</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="ss-meta">{u.email}</td>
                        <td>
                          <span className={`ss-badge ${u.role === "Admin" ? "is-attention" : ""}`}>
                            {u.role === "Admin" ? <ShieldCheck /> : <UserIcon />}
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.isActive ? (
                            <span className="ss-badge is-active"><CheckCircle2 />Active</span>
                          ) : (
                            <span className="ss-badge">Disabled</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                            <button type="button" className="ss-icon-btn" title="Edit user"
                              onClick={() => setEditing(u)} style={iconBtnStyle}>
                              <Pencil style={{ width: 15, height: 15 }} />
                            </button>
                            <button type="button" className="ss-icon-btn" title="Reset password"
                              onClick={() => setResetting(u)} style={iconBtnStyle}>
                              <KeyRound style={{ width: 15, height: 15 }} />
                            </button>
                            <button type="button" className="ss-icon-btn" title={isMe ? "You can't delete your own account" : "Delete user"}
                              onClick={() => setDeleting(u)} disabled={isMe}
                              style={{ ...iconBtnStyle, color: isMe ? "var(--fg-tertiary)" : "var(--danger)", opacity: isMe ? 0.4 : 1, cursor: isMe ? "not-allowed" : "pointer" }}>
                              <Trash2 style={{ width: 15, height: 15 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="tbl-foot">
              <span className="info">Showing {users.length} user{users.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <CreateUserModal
          staff={staff}
          onClose={() => setModalOpen(false)}
          onCreated={(u) => {
            setUsers((prev) => [u, ...prev]);
            setNotice(`Created account for ${u.fullName}.`);
            setModalOpen(false);
          }}
        />
      )}

      {editing && (
        <EditUserModal
          target={editing}
          isSelf={currentUser?.id === editing.id}
          onClose={() => setEditing(null)}
          onSaved={(u) => {
            setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
            setNotice(`Updated ${u.fullName}.`);
            setEditing(null);
          }}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          target={resetting}
          onClose={() => setResetting(null)}
          onDone={() => {
            setNotice(`Password reset for ${resetting.fullName}.`);
            setResetting(null);
          }}
        />
      )}

      {deleting && (
        <DeleteUserModal
          target={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setUsers((prev) => prev.filter((x) => x.id !== deleting.id));
            setNotice(`Deleted ${deleting.fullName}.`);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

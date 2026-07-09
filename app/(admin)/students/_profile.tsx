"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Check,
  X,
  Trash2,
  Loader2,
  CalendarDays,
  User as UserIcon,
  GraduationCap,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MinusCircle,
  type LucideIcon,
} from "lucide-react";
import { participantsApi } from "@/lib/api/participants";
import { usePrograms } from "@/lib/api/hooks";
import ArtsProfileWidget from "./_arts_profile";
import TrackerWidget from "./_tracker";
import type {
  ParticipantDetailDto,
  ProgramSummaryDto,
  UpdateParticipantDto,
  ParticipantStatus,
} from "@/lib/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUSES: ParticipantStatus[] = ["Active", "Prospective", "Attention", "Former"];

const STATUS_BADGE: Record<ParticipantStatus, { cls: string; icon: LucideIcon; label: string }> = {
  Active:      { cls: "is-active",      icon: CheckCircle2, label: "Active" },
  Prospective: { cls: "is-prospective", icon: Clock,        label: "Prospective" },
  Attention:   { cls: "is-attention",   icon: AlertCircle,  label: "Needs attention" },
  Former:      { cls: "is-former",      icon: MinusCircle,  label: "Former" },
};

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtDate(s: string): string {
  if (!s) return "—";
  return new Date(s + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)",
  padding: "8px 12px", fontSize: 13, color: "var(--fg)",
  background: "var(--surface)", outline: "none",
};

type Form = { fullName: string; status: ParticipantStatus; programId: string; birthYear: string; sc: string };

// ── Component ─────────────────────────────────────────────────────────────────

export default function ParticipantProfile({ id }: { id: string }) {
  const router = useRouter();

  const [detail, setDetail] = useState<ParticipantDetailDto | null>(null);
  // Cached + shared via React Query (#34).
  const programs: ProgramSummaryDto[] = usePrograms().data ?? [];
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form>({ fullName: "", status: "Active", programId: "", birthYear: "", sc: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    participantsApi.getById(id)
      .then((d) => {
        if (!active) return;
        setDetail(d);
        setForm(formFrom(d));
      })
      .catch(() => { if (active) setMissing(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  function formFrom(d: ParticipantDetailDto): Form {
    return {
      fullName: d.fullName,
      status: d.status,
      programId: d.programId,
      birthYear: d.birthYear != null ? String(d.birthYear) : "",
      sc: d.serviceCoordinator ?? "",
    };
  }

  function startEdit() { if (detail) setForm(formFrom(detail)); setError(null); setEditing(true); }
  function cancelEdit() { if (detail) setForm(formFrom(detail)); setError(null); setEditing(false); }

  const canSave = form.fullName.trim().length > 0 && form.programId !== "";

  async function save() {
    if (!detail || !canSave) return;
    setSaving(true);
    setError(null);
    const dto: UpdateParticipantDto = {
      fullName: form.fullName.trim(),
      initials: toInitials(form.fullName),
      programId: form.programId,
      status: form.status,
      birthYear: form.birthYear ? parseInt(form.birthYear, 10) : undefined,
      serviceCoordinator: form.sc.trim(),
    };
    try {
      const updated = await participantsApi.update(id, dto);
      setDetail(updated);
      setForm(formFrom(updated));
      setEditing(false);
    } catch {
      setError("Could not save changes — make sure the backend is running and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await participantsApi.remove(id);
      router.push("/students");
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
      setError("Could not delete this participant — try again.");
    }
  }

  // ── Loading / missing states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="adm-main">
        <div className="adm-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "var(--fg-tertiary)" }}>
          <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (missing || !detail) {
    return (
      <div className="adm-main">
        <div className="adm-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 10, textAlign: "center" }}>
          <AlertCircle style={{ width: 26, height: 26, color: "var(--fg-tertiary)" }} />
          <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Participant not found</h2>
          <p style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>This participant may have been removed.</p>
          <Link href="/students" className="ss-btn"><ArrowLeft className="ss-btn-icon" />Back to participants</Link>
        </div>
      </div>
    );
  }

  const slug = detail.programSlug;
  const badge = STATUS_BADGE[detail.status];
  const BadgeIcon = badge.icon;

  // ── View / edit fields ──────────────────────────────────────────────────────
  const field = (label: string, view: React.ReactNode, edit: React.ReactNode) => (
    <div>
      <div className="ss-label" style={{ marginBottom: 6 }}>{label}</div>
      {editing ? edit : <div style={{ fontSize: 14, color: "var(--fg)" }}>{view}</div>}
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="adm-main">
        <div className="adm-topbar">
          <div className="titles">
            <Link href="/students" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--fg-tertiary)", textDecoration: "none", marginBottom: 2 }}>
              <ArrowLeft style={{ width: 13, height: 13 }} />Participants
            </Link>
            <h1>{detail.fullName}</h1>
          </div>
          <div className="right" style={{ display: "flex", gap: 8 }}>
            {editing ? (
              <>
                <button className="ss-btn" type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
                <button className="ss-btn ss-btn-primary" type="button" onClick={save} disabled={!canSave || saving}>
                  {saving ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <Check className="ss-btn-icon" />}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </>
            ) : (
              <>
                <button className="ss-btn" type="button" onClick={() => setDeleteOpen(true)} style={{ color: "var(--danger)" }}>
                  <Trash2 className="ss-btn-icon" />Delete
                </button>
                <button className="ss-btn ss-btn-primary" type="button" onClick={startEdit}>
                  <Pencil className="ss-btn-icon" />Edit profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="adm-content" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 760 }}>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--danger-fill, #fce8e8)", color: "var(--danger)", fontSize: 13 }}>
              <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />{error}
            </div>
          )}

          {/* identity header */}
          <div className="widget">
            <div className="widget-body" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span className="ss-avatar" style={{ width: 52, height: 52, fontSize: 17, background: `var(--${slug}-fill)`, color: `var(--${slug})`, border: `0.5px solid var(--${slug}-border)`, flexShrink: 0 }}>
                {detail.initials}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 500 }}>{detail.fullName}</div>
                <div style={{ fontSize: 13, color: "var(--fg-secondary)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span className={`ss-dot ${slug}`} />{detail.programName}
                </div>
              </div>
              <span className={`ss-badge ${badge.cls}`} style={{ flexShrink: 0 }}>
                <BadgeIcon />{badge.label}
              </span>
            </div>
          </div>

          {/* details */}
          <div className="widget">
            <div className="widget-head">
              <UserIcon className="ico" style={{ color: "var(--primary)" }} />
              <h3>Participant details</h3>
            </div>
            <div className="widget-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              {field(
                "Full name",
                detail.fullName,
                <input type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} style={inputStyle} />
              )}

              {field(
                "Status",
                <span className={`ss-badge ${badge.cls}`}><BadgeIcon />{badge.label}</span>,
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STATUSES.map((s) => (
                    <button key={s} type="button" className={`ss-chip${form.status === s ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setForm((f) => ({ ...f, status: s }))}>
                      {STATUS_BADGE[s].label}
                    </button>
                  ))}
                </div>
              )}

              {field(
                "Program",
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className={`ss-dot ${slug}`} />{detail.programName}</span>,
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {programs.map((p) => {
                    const sel = form.programId === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => setForm((f) => ({ ...f, programId: p.id }))}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: "var(--r-pill)", cursor: "pointer", fontSize: 13,
                          border: `0.5px solid ${sel ? `var(--${p.slug}-border)` : "var(--border)"}`,
                          background: sel ? `var(--${p.slug}-fill)` : "var(--surface)",
                          color: sel ? `var(--${p.slug})` : "var(--fg-secondary)" }}>
                        <span className={`ss-dot ${p.slug}`} />{p.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {field(
                "Birth year",
                detail.birthYear ?? "—",
                <input type="number" min={1940} max={2020} value={form.birthYear} placeholder="e.g. 1998" onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value }))} style={{ ...inputStyle, width: "60%" }} />
              )}

              {field(
                "Service coordinator",
                detail.serviceCoordinator || "—",
                <input type="text" value={form.sc} placeholder="e.g. R. Alvarez" onChange={(e) => setForm((f) => ({ ...f, sc: e.target.value }))} style={inputStyle} />
              )}

              {/* read-only facts */}
              <div>
                <div className="ss-label" style={{ marginBottom: 6 }}>Start date</div>
                <div style={{ fontSize: 14, color: "var(--fg)", display: "flex", alignItems: "center", gap: 6 }}>
                  <CalendarDays style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }} />{fmtDate(detail.startDate)}
                </div>
              </div>

              <div>
                <div className="ss-label" style={{ marginBottom: 6 }}>Attendance</div>
                <div style={{ fontSize: 14, color: "var(--fg)", display: "flex", alignItems: "center", gap: 6 }}>
                  <GraduationCap style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }} />{detail.attendancePct}%
                </div>
              </div>
            </div>
          </div>

          {/* arts profile (Student Frame) */}
          <ArtsProfileWidget participantId={id} />

          {/* weekly tracker (monthly data + month-end levels) */}
          <TrackerWidget participantId={id} />

          {/* documents (read-only) */}
          <div className="widget">
            <div className="widget-head">
              <FileText className="ico" style={{ color: "var(--primary)" }} />
              <h3>Documents</h3>
            </div>
            <div className="widget-body">
              {detail.documents.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", fontSize: 13, color: "var(--fg-tertiary)" }}>
                  No documents on file yet.
                </div>
              ) : (
                detail.documents.map((d) => (
                  <div className="list-row" key={d.id}>
                    <div className="grow">
                      <div className="nm">{d.documentType}</div>
                      <div className="sub">{d.expiryDate ? `Expires ${fmtDate(d.expiryDate)}` : "No expiry"}</div>
                    </div>
                    <span className={`ss-badge ${d.isComplete ? "is-active" : "is-attention"}`}>
                      {d.isComplete ? <><CheckCircle2 />Complete</> : <><AlertCircle />Incomplete</>}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* delete confirm */}
      {deleteOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "var(--space-4)" }}
        >
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(400px, 100%)", border: "0.5px solid var(--border-hover)" }}>
            <div style={{ padding: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ display: "inline-flex", width: 32, height: 32, borderRadius: "50%", background: "var(--danger-fill, #fce8e8)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Trash2 style={{ width: 16, height: 16, color: "var(--danger)" }} />
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Delete participant?</h3>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-secondary)", lineHeight: 1.5, margin: 0 }}>
                <strong>{detail.fullName}</strong> will be permanently removed, along with their attendance records. This can&apos;t be undone.
              </p>
            </div>
            <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="ss-btn" type="button" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button>
              <button className="ss-btn" type="button" onClick={doDelete} disabled={deleting} style={{ background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }}>
                {deleting ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 className="ss-btn-icon" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

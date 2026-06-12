"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserPlus,
  Download,
  AlertTriangle,
  Check,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  MinusCircle,
  FileX,
  X,
  type LucideIcon,
} from "lucide-react";
import { participantsApi } from "@/lib/api/participants";
import { programsApi } from "@/lib/api/programs";
import type {
  ParticipantSummaryDto,
  ProgramSummaryDto,
  CreateParticipantDto,
  ParticipantStatus,
} from "@/lib/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "active" | "prospective" | "attention" | "former";
type AlertKind = "expiring" | "overdue" | "missing";
type ExpKind = "red" | "amber" | "green";

const STATUS_BADGE: Record<Status, { cls: string; icon: LucideIcon; label: string }> = {
  active:      { cls: "is-active",      icon: CheckCircle2, label: "Active" },
  prospective: { cls: "is-prospective", icon: Clock,        label: "Prospective" },
  attention:   { cls: "is-attention",   icon: AlertCircle,  label: "Needs attention" },
  former:      { cls: "is-former",      icon: MinusCircle,  label: "Former" },
};

const ALERT_ICON: Record<AlertKind, { icon: LucideIcon; cls: string }> = {
  expiring: { icon: AlertTriangle, cls: "ai-expiring" },
  overdue:  { icon: Clock,         cls: "ai-overdue" },
  missing:  { icon: FileX,         cls: "ai-missing" },
};

const EXP_ICON: Record<ExpKind, LucideIcon> = {
  red:   AlertCircle,
  amber: Clock,
  green: Check,
};

type Student = {
  id: string;
  init: string;
  nm: string;
  dob: string;
  prog: string;
  progName: string;
  status: Status;
  alerts: AlertKind[];
  att: number;
  exp: { kind: ExpKind; label: string };
  sc: string;
  start: string;
};

// ── DTO → local type ──────────────────────────────────────────────────────────

function dtoToStudent(dto: ParticipantSummaryDto): Student {
  const d = new Date(dto.startDate + "T12:00:00");
  const startLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return {
    id: dto.id,
    init: dto.initials,
    nm: dto.fullName,
    dob: "—",
    prog: dto.programSlug,
    progName: dto.programName,
    status: dto.status.toLowerCase() as Status,
    alerts: dto.hasDocAlerts ? ["expiring"] : [],
    att: dto.attendancePct,
    exp: { kind: "amber", label: "—" },
    sc: "—",
    start: startLabel,
  };
}

// ── Add Student Modal ─────────────────────────────────────────────────────────

type AddStudentForm = {
  nm: string;
  birthYear: string;
  programId: string;
  status: "active" | "prospective";
  sc: string;
};

const EMPTY_FORM: AddStudentForm = { nm: "", birthYear: "", programId: "", status: "prospective", sc: "" };

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function currentMonthYear(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function AddStudentModal({
  programs,
  form,
  setForm,
  onClose,
  onSubmit,
  error,
}: {
  programs: ProgramSummaryDto[];
  form: AddStudentForm;
  setForm: React.Dispatch<React.SetStateAction<AddStudentForm>>;
  onClose: () => void;
  onSubmit: () => void;
  error?: string | null;
}) {
  const canSubmit = form.nm.trim().length > 0 && form.programId !== "";

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)",
    padding: "8px 12px", fontSize: 13, color: "var(--fg)",
    background: "var(--surface)", outline: "none",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "var(--space-4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(480px, 100%)", display: "flex", flexDirection: "column", border: "0.5px solid var(--border-hover)", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Add participant</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>New participant will appear in the roster</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, borderRadius: "var(--r-sm)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto" }}>
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Full name <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <input type="text" placeholder="e.g. Jordan Rivera" value={form.nm} onChange={(e) => setForm((f) => ({ ...f, nm: e.target.value }))} style={inputStyle} autoFocus />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Birth year <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional</span></div>
            <input type="number" min={1940} max={2015} placeholder="e.g. 1998" value={form.birthYear} onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value }))} style={{ ...inputStyle, width: "40%" }} />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Program <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {programs.map((p) => {
                const selected = form.programId === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setForm((f) => ({ ...f, programId: p.id }))}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: "var(--r-pill)", border: `0.5px solid ${selected ? `var(--${p.slug}-border)` : "var(--border)"}`, background: selected ? `var(--${p.slug}-fill)` : "var(--surface)", color: selected ? `var(--${p.slug})` : "var(--fg-secondary)", cursor: "pointer", fontSize: 13 }}>
                    <span className={`ss-dot ${p.slug}`} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Status</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["prospective", "active"] as const).map((s) => (
                <button key={s} type="button" className={`ss-chip${form.status === s ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setForm((f) => ({ ...f, status: s }))}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Service coordinator <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional</span></div>
            <input type="text" placeholder="e.g. R. Alvarez" value={form.sc} onChange={(e) => setForm((f) => ({ ...f, sc: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{ margin: "0 var(--space-4)", padding: "8px 12px", borderRadius: "var(--r-md)", background: "var(--danger-fill, #fce8e8)", color: "var(--danger)", fontSize: 12, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}
        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="ss-btn" type="button" onClick={onClose}>Cancel</button>
          <button className="ss-btn ss-btn-primary" type="button" onClick={onSubmit} disabled={!canSubmit}>
            <UserPlus className="ss-btn-icon" />
            Add participant
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [data, setData] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<ProgramSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddStudentForm>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([participantsApi.getAll(), programsApi.getAll()])
      .then(([pts, progs]) => {
        setData(pts.map(dtoToStudent));
        setPrograms(progs);
      })
      .catch(() => {
        setData([]);
        setPrograms([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    all:         data.length,
    active:      data.filter((d) => d.status === "active").length,
    prospective: data.filter((d) => d.status === "prospective").length,
    attention:   data.filter((d) => d.status === "attention").length,
    former:      data.filter((d) => d.status === "former").length,
  };

  const alertStudentCount = data.filter((d) => d.alerts.length > 0).length;

  function openModal() { setForm(EMPTY_FORM); setSubmitError(null); setModalOpen(true); }
  function closeModal() { setSubmitError(null); setModalOpen(false); }

  async function handleSubmit() {
    const statusMap: Record<string, ParticipantStatus> = { active: "Active", prospective: "Prospective" };
    const dto: CreateParticipantDto = {
      fullName: form.nm.trim(),
      initials: toInitials(form.nm),
      programId: form.programId,
      status: statusMap[form.status] ?? "Prospective",
      birthYear: form.birthYear ? parseInt(form.birthYear) : undefined,
      serviceCoordinator: form.sc.trim() || undefined,
    };

    try {
      const created = await participantsApi.create(dto);
      setData((prev) => [dtoToStudent(created), ...prev]);
      closeModal();
    } catch {
      setSubmitError("Could not save participant — check that the backend is running and try again.");
    }
  }

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Participants</h1>
        </div>
        <div className="right">
          <button className="ss-btn ss-btn-primary" type="button" onClick={openModal}>
            <UserPlus className="ss-btn-icon" />
            Add participant
          </button>
          <button className="ss-btn" type="button">
            <Download className="ss-btn-icon" />
            Export
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* stat tabs */}
        <div className="stat-tabs">
          <button className="stat-tab is-active">
            <span className="num">{counts.all}</span>
            <span className="label">All Participants</span>
          </button>
          <button className="stat-tab green">
            <span className="num">{counts.active}</span>
            <span className="label">Active</span>
          </button>
          <button className="stat-tab amber">
            <span className="num">{counts.prospective}</span>
            <span className="label">Prospective</span>
          </button>
          <button className="stat-tab red">
            <span className="num">{counts.attention}</span>
            <span className="label">Needs Attention</span>
          </button>
          <button className="stat-tab gray">
            <span className="num">{counts.former}</span>
            <span className="label">Former</span>
          </button>
        </div>

        {/* alert banner */}
        {alertStudentCount > 0 && (
          <div className="ss-alert is-danger">
            <AlertTriangle />
            <span className="ss-alert-text">
              <strong>{alertStudentCount} participant{alertStudentCount > 1 ? "s" : ""} require action</strong> — expiring POS, missing intake docs, or overdue follow-up.
            </span>
            <a className="ss-alert-action" href="#">View all alerts →</a>
          </div>
        )}

        {/* filter bar */}
        <div className="filter-bar">
          <span className="ss-chip is-active" style={{ cursor: "pointer" }}>All</span>
          {programs.map((p) => (
            <span key={p.id} className="ss-chip" style={{ cursor: "pointer" }}>
              <span className={`ss-dot ${p.slug}`} />
              {p.name}
            </span>
          ))}
          <span className="sep" />
          <span className="ss-chip is-active" style={{ background: "var(--success-fill)", color: "var(--success-text)", borderColor: "var(--success-border)" }}>
            <Check style={{ width: 12, height: 12 }} />Active
          </span>
          <span className="ss-chip is-active" style={{ background: "var(--warning-fill)", color: "var(--warning-text)", borderColor: "var(--warning-border)" }}>
            <Check style={{ width: 12, height: 12 }} />Prospective
          </span>
          <span className="ss-chip">Former</span>
          <span className="sep" />
          <span className="ss-chip" style={{ background: "var(--danger-fill)", color: "var(--danger-text)", borderColor: "var(--danger-border)" }}>
            <AlertCircle style={{ width: 12, height: 12 }} />Alerts only
          </span>
          <div className="search">
            <Search />
            <input type="text" placeholder="Search participants…" />
          </div>
        </div>

        {/* data table */}
        <div className="tbl-card">
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 36 }}><span className="chk" /></th>
                  <th className="sortable">Participant <span className="caret"><ChevronDown /></span></th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Alerts</th>
                  <th className="sortable">Attendance</th>
                  <th className="sortable">POS / IPP Expiry</th>
                  <th>Service Coord</th>
                  <th className="sortable">Started</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "32px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>
                      Loading participants…
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>
                      No participants yet — add one to get started.
                    </td>
                  </tr>
                ) : data.map((d) => {
                  const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.active;
                  const BadgeIcon = badge.icon;
                  const ExpIcon = EXP_ICON[d.exp.kind];
                  return (
                    <tr key={d.id}>
                      <td><span className="chk" /></td>
                      <td>
                        <div className="cell-student">
                          <span className="ss-avatar sm" style={{ background: `var(--${d.prog}-fill)`, color: `var(--${d.prog})`, border: `0.5px solid var(--${d.prog}-border)` }}>
                            {d.init}
                          </span>
                          <div>
                            <Link href={`/students/${d.id}`} className="nm" style={{ color: "inherit", textDecoration: "none" }}>{d.nm}</Link>
                            <div className="dob">{d.dob}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cell-prog">
                          <span className={`ss-dot ${d.prog}`} />
                          {d.progName}
                        </span>
                      </td>
                      <td>
                        <span className={`ss-badge ${badge.cls}`}>
                          <BadgeIcon />
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        {d.alerts.length ? (
                          <span className="alert-icons">
                            {d.alerts.map((a) => {
                              const Ai = ALERT_ICON[a].icon;
                              return <Ai key={a} className={ALERT_ICON[a].cls} />;
                            })}
                          </span>
                        ) : (
                          <span className="ss-meta" style={{ color: "var(--fg-tertiary)" }}>—</span>
                        )}
                      </td>
                      <td>
                        {d.att > 0 ? (
                          <span className="att-mini">
                            <span className="ss-progress">
                              <span className={`ss-progress-fill ${d.prog}`} style={{ width: `${d.att}%` }} />
                            </span>
                            <span className="pct">{d.att}%</span>
                          </span>
                        ) : (
                          <span className="ss-meta" style={{ color: "var(--fg-tertiary)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`exp ${d.exp.kind}`}>
                          <ExpIcon />
                          {d.exp.label}
                        </span>
                      </td>
                      <td className="ss-meta">{d.sc}</td>
                      <td className="ss-meta">{d.start}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="tbl-foot">
            <span className="info">Showing {Math.min(data.length, 10)} of {data.length} participants</span>
            <span className="info">· Active &amp; Prospective · all programs</span>
            <div className="rpp">
              Rows per page
              <select defaultValue="10">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
            <div className="pager">
              <span className="pg"><ChevronLeft style={{ width: 14, height: 14 }} /></span>
              <span className="pg is-active">1</span>
              <span className="pg">2</span>
              <span className="pg">3</span>
              <span className="pg" style={{ cursor: "default" }}>…</span>
              <span className="pg">5</span>
              <span className="pg"><ChevronRight style={{ width: 14, height: 14 }} /></span>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <AddStudentModal
          programs={programs}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
          error={submitError}
        />
      )}
    </div>
  );
}

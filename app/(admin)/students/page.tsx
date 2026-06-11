"use client";

import { useState } from "react";
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

type Status = "active" | "prospective" | "attention" | "former";
type Program = "mjc" | "pathways" | "manteca";
type AlertKind = "expiring" | "overdue" | "missing";
type ExpKind = "red" | "amber" | "green";

const PROGRAMS: Record<Program, { name: string; role: string }> = {
  mjc: { name: "MJC", role: "admin" },
  pathways: { name: "Pathways", role: "teacher" },
  manteca: { name: "Manteca PT", role: "coordinator" },
};

const STATUS_BADGE: Record<Status, { cls: string; icon: LucideIcon; label: string }> = {
  active: { cls: "is-active", icon: CheckCircle2, label: "Active" },
  prospective: { cls: "is-prospective", icon: Clock, label: "Prospective" },
  attention: { cls: "is-attention", icon: AlertCircle, label: "Needs attention" },
  former: { cls: "is-former", icon: MinusCircle, label: "Former" },
};

const ALERT_ICON: Record<AlertKind, { icon: LucideIcon; cls: string }> = {
  expiring: { icon: AlertTriangle, cls: "ai-expiring" },
  overdue: { icon: Clock, cls: "ai-overdue" },
  missing: { icon: FileX, cls: "ai-missing" },
};

const EXP_ICON: Record<ExpKind, LucideIcon> = {
  red: AlertCircle,
  amber: Clock,
  green: Check,
};

type Student = {
  init: string;
  nm: string;
  dob: string;
  prog: Program;
  status: Status;
  alerts: AlertKind[];
  att: number;
  exp: { kind: ExpKind; label: string };
  sc: string;
  start: string;
};

const INITIAL_DATA: Student[] = [
  { init: "MT", nm: "Marcus T.", dob: "b. 1994", prog: "pathways", status: "attention", alerts: ["expiring"], att: 62, exp: { kind: "red", label: "6 days" }, sc: "R. Alvarez", start: "Mar 2022" },
  { init: "SR", nm: "Sofia R.", dob: "b. 1999", prog: "mjc", status: "attention", alerts: ["missing"], att: 0, exp: { kind: "amber", label: "22 days" }, sc: "D. Kwan", start: "May 2026" },
  { init: "BL", nm: "Bianca L.", dob: "b. 1991", prog: "pathways", status: "active", alerts: [], att: 95, exp: { kind: "green", label: "Safe" }, sc: "R. Alvarez", start: "Sep 2021" },
  { init: "CM", nm: "Carlos M.", dob: "b. 1997", prog: "manteca", status: "attention", alerts: ["overdue", "missing"], att: 71, exp: { kind: "red", label: "11 days" }, sc: "T. Cho", start: "Jan 2024" },
  { init: "DW", nm: "Dana W.", dob: "b. 2000", prog: "pathways", status: "active", alerts: [], att: 88, exp: { kind: "green", label: "Safe" }, sc: "R. Alvarez", start: "Feb 2025" },
  { init: "EH", nm: "Eli H.", dob: "b. 1993", prog: "mjc", status: "active", alerts: ["expiring"], att: 90, exp: { kind: "amber", label: "28 days" }, sc: "D. Kwan", start: "Aug 2023" },
  { init: "AT", nm: "Aaron T.", dob: "b. 1996", prog: "mjc", status: "prospective", alerts: ["overdue"], att: 0, exp: { kind: "amber", label: "Pending" }, sc: "D. Kwan", start: "Apr 2026" },
  { init: "PG", nm: "Priya G.", dob: "b. 1998", prog: "manteca", status: "active", alerts: [], att: 84, exp: { kind: "green", label: "Safe" }, sc: "T. Cho", start: "Oct 2022" },
  { init: "JK", nm: "Joss K.", dob: "b. 1995", prog: "manteca", status: "active", alerts: ["expiring"], att: 79, exp: { kind: "amber", label: "19 days" }, sc: "T. Cho", start: "Jun 2023" },
  { init: "NR", nm: "Noah R.", dob: "b. 2001", prog: "pathways", status: "prospective", alerts: [], att: 0, exp: { kind: "amber", label: "Pending" }, sc: "R. Alvarez", start: "May 2026" },
];

// ── Add Student Modal ─────────────────────────────────────────────────────────

type AddStudentForm = {
  nm: string;
  birthYear: string;
  prog: Program | "";
  status: "active" | "prospective";
  sc: string;
};

const EMPTY_FORM: AddStudentForm = {
  nm: "",
  birthYear: "",
  prog: "",
  status: "prospective",
  sc: "",
};

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function currentMonthYear(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function AddStudentModal({
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  form: AddStudentForm;
  setForm: React.Dispatch<React.SetStateAction<AddStudentForm>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = form.nm.trim().length > 0 && form.prog !== "";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "0.5px solid var(--border-hover)",
    borderRadius: "var(--r-md)",
    padding: "8px 12px",
    fontSize: 13,
    color: "var(--fg)",
    background: "var(--surface)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,42,38,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "var(--space-4)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-lg)",
          width: "min(480px, 100%)",
          display: "flex",
          flexDirection: "column",
          border: "0.5px solid var(--border-hover)",
          maxHeight: "90vh",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--space-4)",
            borderBottom: "0.5px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Add student</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
              New student will appear in the roster
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-tertiary)",
              padding: 4,
              borderRadius: "var(--r-sm)",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* body */}
        <div
          style={{
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            overflowY: "auto",
          }}
        >
          {/* Full name */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Full name <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Jordan Rivera"
              value={form.nm}
              onChange={(e) => setForm((f) => ({ ...f, nm: e.target.value }))}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Birth year */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Birth year{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Optional
              </span>
            </div>
            <input
              type="number"
              min={1940}
              max={2015}
              placeholder="e.g. 1998"
              value={form.birthYear}
              onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value }))}
              style={{ ...inputStyle, width: "40%" }}
            />
          </div>

          {/* Program */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>
              Program <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["mjc", "pathways", "manteca"] as Program[]).map((p) => {
                const selected = form.prog === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, prog: p }))}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: "var(--r-pill)",
                      border: `0.5px solid ${selected ? `var(--${p}-border)` : "var(--border)"}`,
                      background: selected ? `var(--${p}-fill)` : "var(--surface)",
                      color: selected ? `var(--${p}-text)` : "var(--fg-secondary)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    <span className={`ss-dot ${p}`} />
                    {PROGRAMS[p].name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Status</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["prospective", "active"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`ss-chip${form.status === s ? " is-active" : ""}`}
                  style={{ cursor: "pointer", textTransform: "capitalize" }}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Service Coordinator */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Service coordinator{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Optional
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. R. Alvarez"
              value={form.sc}
              onChange={(e) => setForm((f) => ({ ...f, sc: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderTop: "0.5px solid var(--border)",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button className="ss-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ss-btn ss-btn-primary"
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            <UserPlus className="ss-btn-icon" />
            Add student
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [data, setData] = useState<Student[]>(INITIAL_DATA);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddStudentForm>(EMPTY_FORM);

  function openModal() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleSubmit() {
    const newStudent: Student = {
      init: toInitials(form.nm),
      nm: form.nm.trim(),
      dob: form.birthYear ? `b. ${form.birthYear}` : "—",
      prog: form.prog as Program,
      status: form.status,
      alerts: [],
      att: 0,
      exp: { kind: "amber", label: "Pending" },
      sc: form.sc.trim() || "—",
      start: currentMonthYear(),
    };
    setData((prev) => [newStudent, ...prev]);
    closeModal();
  }

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Students</h1>
        </div>
        <div className="right">
          <button className="ss-btn ss-btn-primary" type="button" onClick={openModal}>
            <UserPlus className="ss-btn-icon" />
            Add student
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
            <span className="num">50</span>
            <span className="label">All Students</span>
          </button>
          <button className="stat-tab green">
            <span className="num">43</span>
            <span className="label">Active</span>
          </button>
          <button className="stat-tab amber">
            <span className="num">4</span>
            <span className="label">Prospective</span>
          </button>
          <button className="stat-tab red">
            <span className="num">3</span>
            <span className="label">Needs Attention</span>
          </button>
          <button className="stat-tab gray">
            <span className="num">12</span>
            <span className="label">Former</span>
          </button>
        </div>

        {/* alert banner */}
        <div className="ss-alert is-danger">
          <AlertTriangle />
          <span className="ss-alert-text">
            <strong>3 students require action</strong> — expiring POS, missing intake docs, or
            overdue follow-up.
          </span>
          <a className="ss-alert-action" href="#">
            View all alerts →
          </a>
        </div>

        {/* filter bar */}
        <div className="filter-bar">
          <span className="ss-chip is-active mjc" style={{ cursor: "pointer" }}>
            All
          </span>
          <span className="ss-chip">
            <span className="ss-dot mjc" />
            MJC
          </span>
          <span className="ss-chip">
            <span className="ss-dot pathways" />
            Pathways
          </span>
          <span className="ss-chip">
            <span className="ss-dot manteca" />
            Manteca PT
          </span>
          <span className="sep" />
          <span
            className="ss-chip is-active"
            style={{
              background: "var(--success-fill)",
              color: "var(--success-text)",
              borderColor: "var(--success-border)",
            }}
          >
            <Check style={{ width: 12, height: 12 }} />
            Active
          </span>
          <span
            className="ss-chip is-active"
            style={{
              background: "var(--warning-fill)",
              color: "var(--warning-text)",
              borderColor: "var(--warning-border)",
            }}
          >
            <Check style={{ width: 12, height: 12 }} />
            Prospective
          </span>
          <span className="ss-chip">Former</span>
          <span className="sep" />
          <span
            className="ss-chip"
            style={{
              background: "var(--danger-fill)",
              color: "var(--danger-text)",
              borderColor: "var(--danger-border)",
            }}
          >
            <AlertCircle style={{ width: 12, height: 12 }} />
            Alerts only
          </span>
          <div className="search">
            <Search />
            <input type="text" placeholder="Search students…" />
          </div>
        </div>

        {/* data table */}
        <div className="tbl-card">
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <span className="chk" />
                  </th>
                  <th className="sortable">
                    Student{" "}
                    <span className="caret">
                      <ChevronDown />
                    </span>
                  </th>
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
                {data.map((d) => {
                  const p = PROGRAMS[d.prog];
                  const badge = STATUS_BADGE[d.status];
                  const BadgeIcon = badge.icon;
                  const ExpIcon = EXP_ICON[d.exp.kind];
                  return (
                    <tr key={d.nm}>
                      <td>
                        <span className="chk" />
                      </td>
                      <td>
                        <div className="cell-student">
                          <span className={`ss-avatar ${p.role} sm`}>{d.init}</span>
                          <div>
                            <div className="nm">{d.nm}</div>
                            <div className="dob">{d.dob}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cell-prog">
                          <span className={`ss-dot ${d.prog}`} />
                          {p.name}
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
                          <span className="ss-meta" style={{ color: "var(--fg-tertiary)" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        {d.att ? (
                          <span className="att-mini">
                            <span className="ss-progress">
                              <span
                                className={`ss-progress-fill ${d.prog}`}
                                style={{ width: `${d.att}%` }}
                              />
                            </span>
                            <span className="pct">{d.att}%</span>
                          </span>
                        ) : (
                          <span className="ss-meta" style={{ color: "var(--fg-tertiary)" }}>
                            —
                          </span>
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
            <span className="info">Showing {Math.min(data.length, 10)} of {data.length} students</span>
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
              <span className="pg">
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </span>
              <span className="pg is-active">1</span>
              <span className="pg">2</span>
              <span className="pg">3</span>
              <span className="pg" style={{ cursor: "default" }}>
                …
              </span>
              <span className="pg">5</span>
              <span className="pg">
                <ChevronRight style={{ width: 14, height: 14 }} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <AddStudentModal
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

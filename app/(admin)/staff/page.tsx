"use client";

import { useState } from "react";
import {
  Download,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Loader,
  CircleDot,
  ChevronDown,
  Check,
  RefreshCw,
  AlertCircle,
  Upload,
  ListChecks,
  Pencil,
  X,
} from "lucide-react";

// ── Shared helpers ────────────────────────────────────────────────────────────

type StaffProg = "mjc" | "pathways" | "manteca";

const PROG_NAMES: Record<StaffProg, string> = {
  mjc: "MJC",
  pathways: "Pathways",
  manteca: "Manteca PT",
};

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildHireLabel(dateStr: string): string {
  const d = dateStr
    ? new Date(dateStr + "T12:00:00")
    : new Date();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const prefix = d > today ? "Start date" : "Hired";
  return `${prefix} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

// ── Checklist data for Joss K.'s expanded body ───────────────────────────────

type CheckItem = { label: string; date: string; dateCls?: string };
type CheckSection = { label: string; items: CheckItem[] };

const JOSS_SECTIONS: CheckSection[] = [
  {
    label: "Documents & agreements",
    items: [
      { label: "Signed offer letter", date: "Feb 3" },
      { label: "Employee handbook acknowledgment", date: "Feb 4" },
      { label: "Confidentiality & ethics agreement", date: "Feb 4" },
    ],
  },
  {
    label: "Background & clearances",
    items: [
      { label: "Live Scan fingerprinting", date: "Feb 6" },
      { label: "CACI check", date: "Feb 7" },
      { label: "TB clearance", date: "Exp Feb 2028", dateCls: "var(--success-text)" },
    ],
  },
  {
    label: "Systems setup",
    items: [
      { label: "Email & calendar account", date: "Feb 5" },
      { label: "CRM access & role assigned", date: "Feb 5" },
      { label: "Remind teacher account", date: "Feb 6" },
      { label: "Building keycard & access", date: "Feb 6" },
      { label: "Payroll & direct deposit", date: "Feb 7" },
      { label: "Benefits enrollment", date: "Feb 9" },
    ],
  },
];

// ── Add Staff Modal ───────────────────────────────────────────────────────────

type StaffRole = "Teacher" | "Coordinator" | "Admin";

type AddStaffForm = {
  nm: string;
  role: StaffRole | "";
  programs: StaffProg[];
  startDate: string;
};

const EMPTY_STAFF_FORM: AddStaffForm = {
  nm: "",
  role: "",
  programs: [],
  startDate: "",
};

function AddStaffModal({
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  form: AddStaffForm;
  setForm: React.Dispatch<React.SetStateAction<AddStaffForm>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = form.nm.trim().length > 0 && form.role !== "" && form.programs.length > 0;
  const allSelected = form.programs.length === 3;

  function toggleAll() {
    setForm((f) => ({
      ...f,
      programs: allSelected ? [] : ["mjc", "pathways", "manteca"],
    }));
  }

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
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>
              Add staff member
            </h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
              New member will be added to the onboarding queue
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

          {/* Role */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>
              Role <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["Teacher", "Coordinator", "Admin"] as StaffRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`ss-chip${form.role === r ? " is-active" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>
              Programs <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`ss-chip${allSelected ? " is-active" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={toggleAll}
              >
                All programs
              </button>
              {(["mjc", "pathways", "manteca"] as StaffProg[]).map((p) => {
                const checked = form.programs.includes(p);
                return (
                  <label
                    key={p}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 11px",
                      borderRadius: "var(--r-pill)",
                      border: `0.5px solid ${checked ? `var(--${p}-border)` : "var(--border)"}`,
                      background: checked ? `var(--${p}-fill)` : "var(--surface)",
                      color: checked ? `var(--${p}-text)` : "var(--fg-secondary)",
                      cursor: "pointer",
                      fontSize: 13,
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ display: "none" }}
                      checked={checked}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          programs: e.target.checked
                            ? [...f.programs, p]
                            : f.programs.filter((x) => x !== p),
                        }))
                      }
                    />
                    <span className={`ss-dot ${p}`} />
                    {PROG_NAMES[p]}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Start date */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Start date{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Leave blank to use today
              </span>
            </div>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              style={{ ...inputStyle, width: "60%" }}
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
            Add staff member
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New staff member type (added via modal) ───────────────────────────────────

type NewStaffMember = {
  key: string;
  init: string;
  nm: string;
  avatarRole: string;
  title: string;
  programLabel: string;
  hireLabel: string;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  // accordion: keyed by name so new entries don't shift indices
  const [expanded, setExpanded] = useState<string | null>("Joss K.");
  const toggle = (nm: string) => setExpanded((cur) => (cur === nm ? null : nm));

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddStaffForm>(EMPTY_STAFF_FORM);
  const [newStaff, setNewStaff] = useState<NewStaffMember[]>([]);

  function openModal() {
    setForm(EMPTY_STAFF_FORM);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleSubmit() {
    const progLabel =
      form.programs.length === 3
        ? "All programs"
        : form.programs.map((p) => PROG_NAMES[p]).join(", ");

    const avatarRole =
      form.role === "Teacher"
        ? "teacher"
        : form.role === "Coordinator"
        ? "coordinator"
        : "admin";

    const member: NewStaffMember = {
      key: form.nm.trim() + Date.now(),
      init: toInitials(form.nm),
      nm: form.nm.trim(),
      avatarRole,
      title: form.role,
      programLabel: progLabel,
      hireLabel: buildHireLabel(form.startDate),
    };

    setNewStaff((prev) => [member, ...prev]);
    closeModal();
  }

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Staff Onboarding</h1>
        </div>
        <div className="right">
          <button className="ss-btn" type="button">
            <Download className="ss-btn-icon" />
            Export
          </button>
          <button className="ss-btn ss-btn-primary" type="button" onClick={openModal}>
            <UserPlus className="ss-btn-icon" />
            Add staff member
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* stat row */}
        <div className="board-stats">
          <div className="board-stat"><span className="num">18</span><span className="label">Active Staff</span></div>
          <div className="board-stat"><span className="num green">13</span><span className="label">Fully Complete</span></div>
          <div className="board-stat"><span className="num amber">3</span><span className="label">In Progress</span></div>
          <div className="board-stat"><span className="num red">4</span><span className="label">Renewals Due</span></div>
        </div>

        {/* filter bar */}
        <div className="row tight" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ss-chip is-active mjc">All staff</span>
          <span className="ss-chip">Complete</span>
          <span className="ss-chip">In progress</span>
          <span className="ss-chip">New hires</span>
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <span className="ss-chip" style={{ background: "var(--danger-fill)", color: "var(--danger-text)", borderColor: "var(--danger-border)" }}>
            <AlertCircle style={{ width: 12, height: 12 }} />
            Renewals due
          </span>
        </div>

        <div className="staff-layout">
          {/* STAFF LIST */}
          <div className="staff-main">

            {/* newly added staff members */}
            {newStaff.map((s) => (
              <div key={s.key} className="sacc is-collapsed">
                <div className="sacc-head">
                  <span className={`ss-avatar ${s.avatarRole}`}>{s.init}</span>
                  <div className="sacc-id" style={{ display: "block" }}>
                    <div className="nm">
                      {s.nm} <span className="newhire-tag">New hire</span>
                    </div>
                    <div className="sub">
                      {s.title} · {s.programLabel} · {s.hireLabel}
                    </div>
                  </div>
                  <div className="sacc-prog">
                    <div className="ss-progress">
                      <div className="ss-progress-fill danger" style={{ width: "0%" }} />
                    </div>
                    <span className="pct">0%</span>
                  </div>
                  <span className="ss-badge is-attention">
                    <CircleDot />
                    Just started
                  </span>
                  <span className="sacc-chev">
                    <ChevronDown />
                  </span>
                </div>
              </div>
            ))}

            {/* Rachel M. — complete */}
            <div className={`sacc${expanded === "Rachel M." ? "" : " is-collapsed"}`}>
              <div className="sacc-head" onClick={() => toggle("Rachel M.")}>
                <span className="ss-avatar teacher">RM</span>
                <div className="sacc-id" style={{ display: "block" }}>
                  <div className="nm">Rachel M.</div>
                  <div className="sub">Teacher · MJC · Hired Jan 10, 2026</div>
                </div>
                <div className="sacc-prog">
                  <div className="ss-progress">
                    <div className="ss-progress-fill success" style={{ width: "100%" }} />
                  </div>
                  <span className="pct">100%</span>
                </div>
                <span className="ss-badge is-active">
                  <CheckCircle2 />
                  Complete
                </span>
                <span className="sacc-chev">
                  <ChevronDown />
                </span>
              </div>
            </div>

            {/* Joss K. — expanded, renewal due */}
            <div className={`sacc${expanded === "Joss K." ? "" : " is-collapsed"}`}>
              <div className="sacc-head" onClick={() => toggle("Joss K.")}>
                <span className="ss-avatar coordinator">JK</span>
                <div className="sacc-id" style={{ display: "block" }}>
                  <div className="nm">Joss K.</div>
                  <div className="sub">Teacher · MJC · Hired Feb 3, 2026</div>
                </div>
                <div className="sacc-prog">
                  <div className="ss-progress">
                    <div className="ss-progress-fill warning" style={{ width: "100%" }} />
                  </div>
                  <span className="pct">100%</span>
                </div>
                <span className="ss-badge is-prospective">
                  <AlertTriangle />
                  Renewal due
                </span>
                <span className="sacc-chev">
                  <ChevronDown />
                </span>
              </div>
              <div className="sacc-body">
                {JOSS_SECTIONS.slice(0, 2).map((sec) => (
                  <div className="check-sec" key={sec.label}>
                    <div className="check-sec-label">{sec.label}</div>
                    {sec.items.map((it) => (
                      <div className="ss-checkrow is-done" key={it.label}>
                        <span className="ss-checkbox is-checked">
                          <Check />
                        </span>
                        <span className="ss-checkrow-label">{it.label}</span>
                        <span
                          className="ss-checkrow-date"
                          style={it.dateCls ? { color: it.dateCls } : undefined}
                        >
                          {it.date}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="check-sec">
                  <div className="check-sec-label">Training &amp; certifications</div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">Mandated reporter training</span>
                    <span className="ss-checkrow-date">Feb 10</span>
                  </div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">
                      CPR / First Aid certification{" "}
                      <span className="refresh-amber">
                        <RefreshCw />
                      </span>
                    </span>
                    <span className="ss-date-expired" style={{ marginLeft: "auto" }}>
                      <AlertCircle />
                      Exp Jun 1, 2026
                    </span>
                    <button className="ss-upload" style={{ marginLeft: 10 }}>
                      <Upload />
                      Upload renewal
                    </button>
                  </div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">Sexual harassment prevention</span>
                    <span className="ss-checkrow-date">Feb 11</span>
                  </div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">Safety &amp; emergency procedures</span>
                    <span className="ss-checkrow-date">Feb 12</span>
                  </div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">Incident reporting protocol</span>
                    <span className="ss-checkrow-date">Feb 12</span>
                  </div>
                </div>

                <div className="check-sec">
                  <div className="check-sec-label">{JOSS_SECTIONS[2].label}</div>
                  {JOSS_SECTIONS[2].items.map((it) => (
                    <div className="ss-checkrow is-done" key={it.label}>
                      <span className="ss-checkbox is-checked"><Check /></span>
                      <span className="ss-checkrow-label">{it.label}</span>
                      <span className="ss-checkrow-date">{it.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Maria S. — in progress */}
            <div className={`sacc${expanded === "Maria S." ? "" : " is-collapsed"}`}>
              <div className="sacc-head" onClick={() => toggle("Maria S.")}>
                <span className="ss-avatar staff" style={{ background: "var(--staff)" }}>MS</span>
                <div className="sacc-id" style={{ display: "block" }}>
                  <div className="nm">Maria S.</div>
                  <div className="sub">Coordinator · All programs · Hired Apr 14, 2026</div>
                </div>
                <div className="sacc-prog">
                  <div className="ss-progress">
                    <div className="ss-progress-fill warning" style={{ width: "72%" }} />
                  </div>
                  <span className="pct">72%</span>
                </div>
                <span className="ss-badge is-prospective">
                  <Loader />
                  In progress
                </span>
                <span className="sacc-chev">
                  <ChevronDown />
                </span>
              </div>
            </div>

            {/* Casey T. — new hire */}
            <div className={`sacc${expanded === "Casey T." ? "" : " is-collapsed"}`}>
              <div className="sacc-head" onClick={() => toggle("Casey T.")}>
                <span className="ss-avatar admin">CT</span>
                <div className="sacc-id" style={{ display: "block" }}>
                  <div className="nm">
                    Casey T. <span className="newhire-tag">New hire</span>
                  </div>
                  <div className="sub">Teacher · Manteca PT · Start date Jun 18, 2026</div>
                </div>
                <div className="sacc-prog">
                  <div className="ss-progress">
                    <div className="ss-progress-fill danger" style={{ width: "17%" }} />
                  </div>
                  <span className="pct">17%</span>
                </div>
                <span className="ss-badge is-attention">
                  <CircleDot />
                  Just started
                </span>
                <span className="sacc-chev">
                  <ChevronDown />
                </span>
              </div>
            </div>

            <button className="create-proj" type="button" onClick={openModal}>
              <UserPlus />
              Add new staff member
            </button>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="staff-side">
            <div className="section">
              <div className="sec-head">
                <h3>Renewals &amp; Alerts</h3>
              </div>
              {[
                { dot: "red", txt: "Joss K. — CPR expired", sub: "Jun 1 · upload renewal" },
                { dot: "amber", txt: "Rachel M. — CPR expiring", sub: "Jul 1 · 26 days" },
                { dot: "amber", txt: "Maria S. — CACI pending", sub: "Background clearance" },
                { dot: "amber", txt: "Maria S. — benefits deadline", sub: "Enroll by Jun 14" },
              ].map((a) => (
                <div className="alert-row" key={a.txt}>
                  <span className={`dot ${a.dot}`} />
                  <div className="body">
                    <div className="txt">{a.txt}</div>
                    <div className="sub">{a.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="sec-head">
                <h3>Upcoming Renewals</h3>
              </div>
              {[
                { nm: "Joss K.", it: "CPR / First Aid", dt: "Jun 1", dtCls: "amber" },
                { nm: "Rachel M.", it: "CPR / First Aid", dt: "Jul 1", dtCls: "amber" },
                { nm: "Devon P.", it: "TB clearance", dt: "Sep 2026", dtCls: "green" },
                { nm: "Nina S.", it: "Mandated reporter", dt: "Nov 2026", dtCls: "green" },
              ].map((r) => (
                <div className="ren-row" key={r.nm}>
                  <div className="grow">
                    <div className="nm">{r.nm}</div>
                    <div className="it">{r.it}</div>
                  </div>
                  <span className={`dt ${r.dtCls}`}>{r.dt}</span>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="info-note">
                <ListChecks />
                <span>
                  Every staff member completes 18 items across 4 sections before
                  they&apos;re cleared to work with participants.
                </span>
              </div>
              <button className="btn-dashed" type="button">
                <Pencil />
                Edit checklist template
              </button>
            </div>

            <div className="section">
              <div className="sec-head">
                <h3>Overall Compliance</h3>
              </div>
              <div className="cbar">
                <div className="top">
                  <span>Complete</span>
                  <span className="pct" style={{ color: "var(--success-text)" }}>72%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill success" style={{ width: "72%" }} />
                </div>
              </div>
              <div className="cbar">
                <div className="top">
                  <span>In progress</span>
                  <span className="pct" style={{ color: "#9a6a12" }}>17%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill warning" style={{ width: "17%" }} />
                </div>
              </div>
              <div className="cbar">
                <div className="top">
                  <span>Renewals due</span>
                  <span className="pct" style={{ color: "var(--danger-text)" }}>11%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill danger" style={{ width: "11%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <AddStaffModal
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

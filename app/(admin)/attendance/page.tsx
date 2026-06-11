"use client";

import { useMemo, useState } from "react";
import {
  Users,
  UserX,
  CalendarCheck,
  Search,
  Check,
  X,
  Download,
  MessageSquare,
  MessageSquareText,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

type StatusKey = "present" | "absent";
type Program = "mjc" | "pathways" | "manteca";

const PROG_LABEL: Record<Program, string> = {
  mjc: "MJC",
  pathways: "Pathways",
  manteca: "Manteca PT",
};

const ATT_OPTS: { key: StatusKey; icon: LucideIcon; label: string }[] = [
  { key: "present", icon: Check, label: "Present" },
  { key: "absent", icon: X, label: "Absent" },
];

type Student = {
  init: string;
  nm: string;
  role: string;
  program: Program;
  group: string;
  allergy: boolean;
  status: StatusKey | null;
  note: boolean;
};

const INITIAL: Student[] = [
  { init: "KM", nm: "Kezia Morales", role: "admin", program: "mjc", group: "A", allergy: true, status: "present", note: false },
  { init: "MT", nm: "Marcus T.", role: "teacher", program: "mjc", group: "A", allergy: false, status: null, note: true },
  { init: "SR", nm: "Sofia Reyes", role: "coordinator", program: "mjc", group: "A", allergy: false, status: "present", note: false },
  { init: "BL", nm: "Bianca Lopez", role: "teacher", program: "pathways", group: "B", allergy: false, status: "absent", note: false },
  { init: "EH", nm: "Eli Hart", role: "admin", program: "mjc", group: "A", allergy: false, status: "present", note: false },
  { init: "DW", nm: "Dana Wells", role: "coordinator", program: "pathways", group: "B", allergy: false, status: null, note: true },
  { init: "AT", nm: "Aaron Torres", role: "admin", program: "mjc", group: "A", allergy: false, status: "present", note: false },
  { init: "CM", nm: "Carlos Mesa", role: "teacher", program: "manteca", group: "C", allergy: false, status: "present", note: false },
  { init: "NR", nm: "Nina Ruiz", role: "coordinator", program: "mjc", group: "A", allergy: false, status: "present", note: false },
  { init: "TJ", nm: "Tariq James", role: "admin", program: "pathways", group: "B", allergy: false, status: "present", note: false },
  { init: "PG", nm: "Priya Gupta", role: "teacher", program: "manteca", group: "C", allergy: false, status: "present", note: false },
  { init: "LW", nm: "Leo Walsh", role: "coordinator", program: "mjc", group: "A", allergy: false, status: "absent", note: false },
];

const FILTERS = ["all", "present", "absent", "unmarked"] as const;
type Filter = (typeof FILTERS)[number];

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>(INITIAL);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [noteFor, setNoteFor] = useState<string | null>(null);

  const total = students.length;
  const counts = useMemo(() => {
    const c: Record<StatusKey, number> = { present: 0, absent: 0 };
    students.forEach((s) => {
      if (s.status) c[s.status] += 1;
    });
    return c;
  }, [students]);
  const marked = students.filter((s) => s.status !== null).length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");

  const setStatus = (i: number, status: StatusKey) =>
    setStudents((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, status: s.status === status ? null : status } : s))
    );

  const visible = (s: Student) => {
    if (filter !== "all") {
      if (filter === "unmarked" && s.status !== null) return false;
      if (filter !== "unmarked" && s.status !== filter) return false;
    }
    if (query && !s.nm.toLowerCase().includes(query.toLowerCase().trim())) return false;
    return true;
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "9px 16px",
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: ".04em",
    color: "var(--fg-tertiary)",
    whiteSpace: "nowrap",
  };

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Attendance</h1>
          <span className="date">Thursday, June 5, 2026</span>
        </div>
        <div className="right">
          <div className="seg">
            <button className="is-active">Morning</button>
            <button>Afternoon</button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="ss-chip is-active mjc" style={{ cursor: "pointer" }}>
              All programs
            </span>
            <span className="ss-chip" style={{ cursor: "pointer" }}>
              <span className="ss-dot mjc" />
              MJC
            </span>
            <span className="ss-chip" style={{ cursor: "pointer" }}>
              <span className="ss-dot pathways" />
              Pathways
            </span>
            <span className="ss-chip" style={{ cursor: "pointer" }}>
              <span className="ss-dot manteca" />
              Manteca PT
            </span>
          </div>
        </div>
      </div>

      <div className="adm-content">
        {/* stat strip */}
        <div className="adm-statgrid">
          <div className="adm-stat">
            <span className="label">Present</span>
            <span className="num" style={{ color: "var(--success)" }}>{counts.present}</span>
            <span className="delta muted">
              <Users />
              {pct(counts.present)} of roster
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Absent</span>
            <span className="num" style={{ color: "var(--danger)" }}>{counts.absent}</span>
            <span className="delta danger">
              <UserX />
              {pct(counts.absent)} of roster
            </span>
          </div>
        </div>

        {/* roster card */}
        <div className="widget">
          <div className="widget-head" style={{ flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <CalendarCheck className="ico" style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0 }}>MJC — Group A · FH 152 · Rachel M.</h3>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {FILTERS.map((f) => (
                <span
                  key={f}
                  className={`ss-chip${filter === f ? " is-active" : ""}`}
                  style={{ cursor: "pointer", textTransform: "capitalize" }}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="search" style={{ display: "flex", alignItems: "center", gap: 6, border: "0.5px solid var(--border-hover)", borderRadius: 8, padding: "5px 10px", background: "var(--surface)" }}>
              <Search style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }} />
              <input
                type="text"
                placeholder="Search students…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", width: 150 }}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <th style={th}>Student</th>
                  <th style={th}>Program</th>
                  <th style={th}>Group</th>
                  <th style={{ ...th, textAlign: "center" }}>Status</th>
                  <th style={{ ...th, textAlign: "center" }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) =>
                  visible(s) ? (
                    <tr key={s.nm} style={{ borderBottom: "0.5px solid var(--border)" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className={`ss-avatar ${s.role} sm`}>{s.init}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{s.nm}</div>
                            {s.allergy ? (
                              <span style={{ fontSize: 11, color: "var(--danger)", display: "flex", alignItems: "center", gap: 3 }}>
                                <AlertTriangle style={{ width: 11, height: 11 }} />
                                Anaphylactic
                              </span>
                            ) : (
                              <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
                                {PROG_LABEL[s.program]} · Group {s.group}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span className={`ss-program ${s.program}`}>{PROG_LABEL[s.program]}</span>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--fg-tertiary)" }}>
                        Group {s.group}
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: 3 }}>
                          {ATT_OPTS.map((o) => {
                            const Icon = o.icon;
                            return (
                              <button
                                key={o.key}
                                className={`ss-att-btn ${o.key}${s.status === o.key ? " is-selected" : ""}`}
                                title={o.label}
                                onClick={() => setStatus(i, o.key)}
                              >
                                <Icon />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <button
                          onClick={() => setNoteFor(s.nm)}
                          style={{
                            background: "none",
                            border: `0.5px solid ${s.note ? "var(--border-hover)" : "var(--border)"}`,
                            borderRadius: 8,
                            padding: "5px 9px",
                            cursor: "pointer",
                            color: s.note ? "var(--primary)" : "var(--fg-tertiary)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.note ? (
                            <MessageSquareText style={{ width: 13, height: 13 }} />
                          ) : (
                            <MessageSquare style={{ width: 13, height: 13 }} />
                          )}
                          {s.note ? "View note" : "Add note"}
                        </button>
                      </td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "0.5px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--fg-secondary)" }}>
                {marked} of {total} marked
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ss-btn">
                <Download className="ss-btn-icon" />
                Export
              </button>
              <button className="ss-btn ss-btn-primary" disabled={marked < total}>
                <Check className="ss-btn-icon" />
                Submit attendance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* note modal */}
      {noteFor ? (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setNoteFor(null);
          }}
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
        >
          <div style={{ background: "var(--surface)", borderRadius: 12, padding: 24, width: "min(460px, calc(100vw - 32px))", display: "flex", flexDirection: "column", gap: 16, border: "0.5px solid var(--border-hover)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 3px" }}>{noteFor}</h3>
                <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>Thu, Jun 5 · MJC · Group A</div>
              </div>
              <button onClick={() => setNoteFor(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 2 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div>
              <div className="ss-label" style={{ marginBottom: 6 }}>Note</div>
              <textarea rows={3} placeholder="Add a note about today…" style={{ width: "100%" }} />
            </div>
            <div>
              <div className="ss-label" style={{ marginBottom: 8 }}>Note type</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="ss-notetag observation">Observation</span>
                <span className="ss-notetag concern">Concern</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="ss-btn" onClick={() => setNoteFor(null)}>
                Cancel
              </button>
              <button className="ss-btn ss-btn-primary" onClick={() => setNoteFor(null)}>
                <Check className="ss-btn-icon" />
                Save note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

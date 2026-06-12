"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserX,
  CalendarCheck,
  Search,
  Check,
  X,
  MessageSquare,
  MessageSquareText,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { attendanceApi } from "@/lib/api/attendance";
import { programsApi } from "@/lib/api/programs";
import type {
  AttendanceRosterEntryDto,
  AttendanceStatus,
  ProgramSummaryDto,
} from "@/lib/types/api";

const ATT_OPTS: { key: AttendanceStatus; icon: LucideIcon; label: string; cls: string }[] = [
  { key: "Present", icon: Check, label: "Present", cls: "present" },
  { key: "Absent", icon: X, label: "Absent", cls: "absent" },
];

const FILTERS = ["all", "present", "absent", "unmarked"] as const;
type Filter = (typeof FILTERS)[number];

export default function AttendancePage() {
  const [roster, setRoster] = useState<AttendanceRosterEntryDto[]>([]);
  const [programs, setPrograms] = useState<ProgramSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [programFilter, setProgramFilter] = useState<string>("all"); // "all" or a program slug
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const [noteFor, setNoteFor] = useState<string | null>(null); // recordId
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<"observation" | "concern">("observation");
  const [savingNote, setSavingNote] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([attendanceApi.getTodayRoster(), programsApi.getAll().catch(() => [])])
      .then(([r, p]) => { setRoster(r); setPrograms(p); })
      .catch(() => setRoster([]))
      .finally(() => setLoading(false));
  }, []);

  const programChips = useMemo(
    () => [{ key: "all", label: "All programs", slug: "" }, ...programs.map((p) => ({ key: p.slug, label: p.name, slug: p.slug }))],
    [programs]
  );

  // Roster scoped to the selected program — stats reflect this set.
  const scoped = useMemo(
    () => roster.filter((r) => programFilter === "all" || r.programSlug === programFilter),
    [roster, programFilter]
  );
  const total = scoped.length;
  const presentCount = scoped.filter((r) => r.status === "Present").length;
  const absentCount = scoped.filter((r) => r.status === "Absent").length;
  const marked = scoped.filter((r) => r.status !== "Unmarked").length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");

  const visible = (r: AttendanceRosterEntryDto) => {
    if (programFilter !== "all" && r.programSlug !== programFilter) return false;
    if (filter === "present" && r.status !== "Present") return false;
    if (filter === "absent" && r.status !== "Absent") return false;
    if (filter === "unmarked" && r.status !== "Unmarked") return false;
    if (query && !r.fullName.toLowerCase().includes(query.toLowerCase().trim())) return false;
    return true;
  };
  const anyVisible = roster.some(visible);

  async function mark(recordId: string, target: AttendanceStatus) {
    const entry = roster.find((r) => r.recordId === recordId);
    if (!entry) return;
    const prev = entry.status;
    const next: AttendanceStatus = prev === target ? "Unmarked" : target;
    setRoster((rs) => rs.map((r) => (r.recordId === recordId ? { ...r, status: next } : r)));
    setSubmitted(false);
    try {
      await attendanceApi.updateRecord(recordId, { status: next });
    } catch {
      // revert on failure
      setRoster((rs) => rs.map((r) => (r.recordId === recordId ? { ...r, status: prev } : r)));
    }
  }

  function openNote(recordId: string) {
    setNoteText("");
    setNoteType("observation");
    setNoteFor(recordId);
  }

  async function saveNote() {
    if (!noteFor || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const created = await attendanceApi.addNote(noteFor, { content: noteText.trim(), noteType });
      setRoster((rs) => rs.map((r) => (r.recordId === noteFor ? { ...r, notes: [...r.notes, created] } : r)));
      setNoteFor(null);
    } catch {
      // keep modal open on failure
    } finally {
      setSavingNote(false);
    }
  }

  const noteEntry = noteFor ? roster.find((r) => r.recordId === noteFor) ?? null : null;

  const th: React.CSSProperties = {
    textAlign: "left", padding: "9px 16px", fontSize: 11, fontWeight: 500,
    textTransform: "uppercase", letterSpacing: ".04em", color: "var(--fg-tertiary)", whiteSpace: "nowrap",
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="adm-main">
        <div className="adm-topbar">
          <div className="titles">
            <h1>Attendance</h1>
            <span className="date">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div className="right">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {programChips.map((p) => (
                <span
                  key={p.key}
                  className={`ss-chip${programFilter === p.key ? " is-active" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setProgramFilter(p.key)}
                >
                  {p.slug && <span className={`ss-dot ${p.slug}`} />}
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="adm-content">
          {/* stat strip */}
          <div className="adm-statgrid">
            <div className="adm-stat">
              <span className="label">Present</span>
              <span className="num" style={{ color: "var(--success)" }}>{presentCount}</span>
              <span className="delta muted"><Users />{pct(presentCount)} of roster</span>
            </div>
            <div className="adm-stat">
              <span className="label">Absent</span>
              <span className="num" style={{ color: "var(--danger)" }}>{absentCount}</span>
              <span className="delta danger"><UserX />{pct(absentCount)} of roster</span>
            </div>
          </div>

          {/* roster card */}
          <div className="widget">
            <div className="widget-head" style={{ flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <CalendarCheck className="ico" style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0 }}>
                {programFilter === "all" ? "All programs" : (programs.find((p) => p.slug === programFilter)?.name ?? programFilter)} · Today&apos;s roster
              </h3>
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
                  placeholder="Search participants…"
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
                    <th style={th}>Participant</th>
                    <th style={th}>Program</th>
                    <th style={{ ...th, textAlign: "center" }}>Status</th>
                    <th style={{ ...th, textAlign: "center" }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "32px 16px", color: "var(--fg-tertiary)", fontSize: 13 }}>
                        Loading roster…
                      </td>
                    </tr>
                  ) : !anyVisible ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "32px 16px", color: "var(--fg-tertiary)", fontSize: 13 }}>
                        {roster.length === 0 ? "No active participants to take attendance for." : "No participants match this filter."}
                      </td>
                    </tr>
                  ) : roster.map((r) =>
                    visible(r) ? (
                      <tr key={r.recordId} style={{ borderBottom: "0.5px solid var(--border)" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="ss-avatar sm" style={{ background: `var(--${r.programSlug}-fill)`, color: `var(--${r.programSlug})`, border: `0.5px solid var(--${r.programSlug}-border)` }}>
                              {r.initials}
                            </span>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.fullName}</div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span className="cell-prog" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                            <span className={`ss-dot ${r.programSlug}`} />
                            {r.programName}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 3 }}>
                            {ATT_OPTS.map((o) => {
                              const Icon = o.icon;
                              return (
                                <button
                                  key={o.key}
                                  className={`ss-att-btn ${o.cls}${r.status === o.key ? " is-selected" : ""}`}
                                  title={o.label}
                                  onClick={() => mark(r.recordId, o.key)}
                                >
                                  <Icon />
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <button
                            onClick={() => openNote(r.recordId)}
                            style={{
                              background: "none",
                              border: `0.5px solid ${r.notes.length ? "var(--border-hover)" : "var(--border)"}`,
                              borderRadius: 8, padding: "5px 9px", cursor: "pointer",
                              color: r.notes.length ? "var(--primary)" : "var(--fg-tertiary)",
                              display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap",
                            }}
                          >
                            {r.notes.length ? <MessageSquareText style={{ width: 13, height: 13 }} /> : <MessageSquare style={{ width: 13, height: 13 }} />}
                            {r.notes.length ? `Notes (${r.notes.length})` : "Add note"}
                          </button>
                        </td>
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "0.5px solid var(--border)", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13, color: "var(--fg-secondary)" }}>
                <span>{marked} of {total} marked</span>
                <span style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>· changes save automatically</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {submitted && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--success-text, var(--success))" }}>
                    <Check style={{ width: 14, height: 14 }} />Attendance saved
                  </span>
                )}
                <button
                  className="ss-btn ss-btn-primary"
                  disabled={total === 0 || marked < total}
                  onClick={() => setSubmitted(true)}
                >
                  <Check className="ss-btn-icon" />
                  Submit attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* note modal */}
      {noteEntry ? (
        <div
          onClick={(e) => { if (e.target === e.currentTarget && !savingNote) setNoteFor(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "var(--space-4)" }}
        >
          <div style={{ background: "var(--surface)", borderRadius: 12, padding: 24, width: "min(460px, calc(100vw - 32px))", display: "flex", flexDirection: "column", gap: 16, border: "0.5px solid var(--border-hover)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 3px" }}>{noteEntry.fullName}</h3>
                <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {noteEntry.programName}
                </div>
              </div>
              <button onClick={() => setNoteFor(null)} disabled={savingNote} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 2 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {noteEntry.notes.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="ss-label">Existing notes</div>
                {noteEntry.notes.map((n) => (
                  <div key={n.id} style={{ border: "0.5px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>
                    <span className={`ss-notetag ${n.noteType}`} style={{ marginBottom: 4, display: "inline-block" }}>{n.noteType}</span>
                    <div style={{ fontSize: 13, color: "var(--fg)" }}>{n.content}</div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="ss-label" style={{ marginBottom: 6 }}>Add a note</div>
              <textarea
                rows={3}
                placeholder="What happened today…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", border: "0.5px solid var(--border-hover)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", resize: "vertical", background: "var(--surface)", color: "var(--fg)", outline: "none" }}
                autoFocus
              />
            </div>
            <div>
              <div className="ss-label" style={{ marginBottom: 8 }}>Note type</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["observation", "concern"] as const).map((t) => (
                  <span
                    key={t}
                    className={`ss-notetag ${t}`}
                    style={{ cursor: "pointer", opacity: noteType === t ? 1 : 0.45, outline: noteType === t ? "1.5px solid currentColor" : "none", outlineOffset: 1 }}
                    onClick={() => setNoteType(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="ss-btn" onClick={() => setNoteFor(null)} disabled={savingNote}>Cancel</button>
              <button className="ss-btn ss-btn-primary" onClick={saveNote} disabled={!noteText.trim() || savingNote}>
                {savingNote ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <Check className="ss-btn-icon" />}
                {savingNote ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

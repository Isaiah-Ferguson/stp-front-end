"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Users,
  UserX,
  Search,
  Check,
  X,
  MessageSquare,
  MessageSquareText,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Clock,
  MapPin,
  Plus,
  Lock,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { attendanceApi } from "@/lib/api/attendance";
import { programsApi } from "@/lib/api/programs";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import type {
  ScheduledSessionDto,
  SessionRosterDto,
  AttendanceStatus,
  ProgramSummaryDto,
} from "@/lib/types/api";

const ATT_OPTS: { key: AttendanceStatus; icon: LucideIcon; label: string; cls: string }[] = [
  { key: "Present", icon: Check, label: "Present", cls: "present" },
  { key: "Absent", icon: X, label: "Absent", cls: "absent" },
];

const FILTERS = ["all", "present", "absent", "unmarked"] as const;
type Filter = (typeof FILTERS)[number];

const CARD_STATUS: Record<
  ScheduledSessionDto["status"],
  { label: string; bg: string; color: string; border: string }
> = {
  "not-started": { label: "Not started", bg: "var(--neutral-fill)", color: "var(--neutral-text)", border: "var(--border)" },
  "in-progress": { label: "In progress", bg: "var(--warning-fill)", color: "var(--warning-text)", border: "var(--warning-border)" },
  submitted:     { label: "Submitted",   bg: "var(--success-fill)", color: "var(--success-text)", border: "var(--success-border)" },
};

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function prettyDate(yyyyMMdd: string) {
  const d = new Date(yyyyMMdd + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function AttendancePage() {
  const { isAdmin } = useAuth();

  const [date, setDate] = useState<string>(todayStr());
  const [cards, setCards] = useState<ScheduledSessionDto[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  const [selected, setSelected] = useState<SessionRosterDto | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // note modal
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<"observation" | "concern">("observation");
  const [savingNote, setSavingNote] = useState(false);

  // submit
  const [submitting, setSubmitting] = useState(false);

  // ad-hoc
  const [programs, setPrograms] = useState<ProgramSummaryDto[]>([]);
  const [adhocId, setAdhocId] = useState<string>("");
  const [adhocOpen, setAdhocOpen] = useState(false);

  const loadCards = useCallback((d: string) => {
    setLoadingCards(true);
    attendanceApi.getScheduled(d)
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setLoadingCards(false));
  }, []);

  useEffect(() => { loadCards(date); }, [date, loadCards]);
  useEffect(() => { programsApi.getAll().then(setPrograms).catch(() => setPrograms([])); }, []);

  function changeDate(d: string) {
    setSelected(null);
    setError(null);
    setAdhocOpen(false);
    setDate(d);
  }

  async function openSession(programId: string) {
    setError(null);
    setLoadingRoster(true);
    setFilter("all");
    setQuery("");
    try {
      const roster = await attendanceApi.getProgramSession(programId, date);
      setSelected(roster);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError("You're not assigned to that program.");
      } else {
        setError("Couldn't open that session. Try again.");
      }
    } finally {
      setLoadingRoster(false);
    }
  }

  function backToList() {
    setSelected(null);
    setError(null);
    loadCards(date); // refresh counts/status
  }

  const refreshSelected = useCallback(async () => {
    if (!selected) return;
    try {
      const roster = await attendanceApi.getProgramSession(selected.programId, date);
      setSelected(roster);
    } catch { /* leave as-is */ }
  }, [selected, date]);

  async function mark(recordId: string, target: AttendanceStatus) {
    if (!selected || selected.status === "submitted") return;
    const entry = selected.entries.find((e) => e.recordId === recordId);
    if (!entry) return;
    const prev = entry.status;
    const next: AttendanceStatus = prev === target ? "Unmarked" : target;

    setSelected((s) =>
      s ? { ...s, entries: s.entries.map((e) => (e.recordId === recordId ? { ...e, status: next } : e)) } : s
    );
    try {
      await attendanceApi.updateRecord(recordId, { status: next });
    } catch (e) {
      setSelected((s) =>
        s ? { ...s, entries: s.entries.map((en) => (en.recordId === recordId ? { ...en, status: prev } : en)) } : s
      );
      if (e instanceof ApiError && e.status === 409) {
        setError("This session was submitted and is now locked.");
        refreshSelected();
      }
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
      setSelected((s) =>
        s ? { ...s, entries: s.entries.map((e) => (e.recordId === noteFor ? { ...e, notes: [...e.notes, created] } : e)) } : s
      );
      setNoteFor(null);
    } catch {
      /* keep modal open */
    } finally {
      setSavingNote(false);
    }
  }

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await attendanceApi.submitSession(selected.sessionId);
      setSelected((s) => (s ? { ...s, status: "submitted" } : s));
    } catch {
      setError("Couldn't submit attendance. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const entries = selected?.entries ?? [];
  const total = entries.length;
  const present = entries.filter((e) => e.status === "Present").length;
  const absent = entries.filter((e) => e.status === "Absent").length;
  const marked = entries.filter((e) => e.status !== "Unmarked").length;
  const locked = selected?.status === "submitted";

  const visibleEntries = useMemo(
    () =>
      entries.filter((e) => {
        if (filter === "present" && e.status !== "Present") return false;
        if (filter === "absent" && e.status !== "Absent") return false;
        if (filter === "unmarked" && e.status !== "Unmarked") return false;
        if (query && !e.fullName.toLowerCase().includes(query.toLowerCase().trim())) return false;
        return true;
      }),
    [entries, filter, query]
  );

  const noteEntry = noteFor ? entries.find((e) => e.recordId === noteFor) ?? null : null;

  // programs available for an ad-hoc session (those not already shown as cards today)
  const cardProgramIds = useMemo(() => new Set(cards.map((c) => c.programId)), [cards]);
  const adhocOptions = useMemo(
    () => programs.filter((p) => !cardProgramIds.has(p.id)),
    [programs, cardProgramIds]
  );

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
            <span className="date">{prettyDate(date)}</span>
          </div>
          <div className="right">
            <div
              style={{
                display: "flex", alignItems: "center", gap: 6,
                border: "0.5px solid var(--border-hover)", borderRadius: 8,
                padding: "5px 10px", background: "var(--surface)",
              }}
            >
              <CalendarDays style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }} />
              <input
                type="date"
                value={date}
                onChange={(e) => changeDate(e.target.value || todayStr())}
                style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--fg)" }}
              />
            </div>
          </div>
        </div>

        <div className="adm-content">
          {error && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--space-4)",
                padding: "9px 12px", borderRadius: "var(--r-md)", fontSize: 13,
                background: "var(--danger-fill)", color: "var(--danger-text)",
                border: "0.5px solid var(--danger-border)",
              }}
            >
              <X style={{ width: 14, height: 14 }} />
              {error}
            </div>
          )}

          {selected ? (
            // ── ROSTER VIEW ──────────────────────────────────────────────────
            <RosterView
              selected={selected}
              locked={locked}
              total={total}
              present={present}
              absent={absent}
              marked={marked}
              filter={filter}
              setFilter={setFilter}
              query={query}
              setQuery={setQuery}
              visibleEntries={visibleEntries}
              loadingRoster={loadingRoster}
              onBack={backToList}
              onMark={mark}
              onOpenNote={openNote}
              onSubmit={submit}
              submitting={submitting}
              th={th}
            />
          ) : (
            // ── LANDING: SESSION CARDS ───────────────────────────────────────
            <>
              <div style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                  {isAdmin ? "Sessions" : "Your sessions"} for this day
                </h3>
                <span className="ss-meta">
                  {loadingRoster ? "Opening…" : `${cards.length} session${cards.length !== 1 ? "s" : ""}`}
                </span>
              </div>

              {loadingCards ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>
                  Loading sessions…
                </div>
              ) : (
                <>
                  {cards.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "var(--space-4)",
                      }}
                    >
                      {cards.map((c) => (
                        <SessionCard key={c.programId} card={c} onOpen={() => openSession(c.programId)} />
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)",
                        padding: "var(--space-8) var(--space-5)", textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--bg-secondary)",
                          color: "var(--fg-secondary)", display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <CalendarDays style={{ width: 22, height: 22 }} />
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)" }}>No sessions scheduled</h3>
                      <p className="ss-meta" style={{ maxWidth: 340 }}>
                        No programs meet on this day. Pick another date, or start an ad-hoc session below.
                      </p>
                    </div>
                  )}

                  {/* ad-hoc */}
                  <AdHocStarter
                    open={adhocOpen}
                    setOpen={setAdhocOpen}
                    options={adhocOptions}
                    value={adhocId}
                    setValue={setAdhocId}
                    onStart={() => { if (adhocId) openSession(adhocId); }}
                  />
                </>
              )}
            </>
          )}
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
                  {prettyDate(date)} · {noteEntry.programName}
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

// ── Session card (landing) ──────────────────────────────────────────────────

function SessionCard({ card, onOpen }: { card: ScheduledSessionDto; onOpen: () => void }) {
  const st = CARD_STATUS[card.status];
  const pct = card.totalCount > 0 ? Math.round((card.markedCount / card.totalCount) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="ss-card"
      style={{
        display: "flex", flexDirection: "column", padding: 0, overflow: "hidden",
        textAlign: "left", cursor: "pointer", border: "0.5px solid var(--border)", background: "var(--surface)",
      }}
    >
      <div style={{ background: `var(--${card.programSlug}-fill)`, padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: "var(--space-2)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>
            <span className={`ss-dot ${card.programSlug}`} />
            {card.programName}
          </span>
          <span
            style={{
              fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-sm)", whiteSpace: "nowrap",
              background: st.bg, color: st.color, border: `0.5px solid ${st.border}`,
            }}
          >
            {st.label}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--fg-secondary)" }}>
          {card.timeRange && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Clock style={{ width: 12, height: 12 }} />{card.timeRange}
            </span>
          )}
          {card.room && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <MapPin style={{ width: 12, height: 12 }} />{card.room}
            </span>
          )}
          {card.isAdHoc && (
            <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>Ad-hoc</span>
          )}
        </div>
      </div>

      <div style={{ padding: "var(--space-3) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--fg-secondary)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Users style={{ width: 12, height: 12 }} />
            {card.markedCount} / {card.totalCount} marked
          </span>
          <span style={{ color: "var(--primary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 2 }}>
            {card.status === "submitted" ? "Review" : card.status === "not-started" ? "Take attendance" : "Continue"}
            <ChevronRight style={{ width: 13, height: 13 }} />
          </span>
        </div>
        <div className="ss-progress">
          <div className={`ss-progress-fill ${card.status === "submitted" ? "success" : "warning"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </button>
  );
}

// ── Ad-hoc starter ────────────────────────────────────────────────────────────

function AdHocStarter({
  open, setOpen, options, value, setValue, onStart,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  options: ProgramSummaryDto[];
  value: string;
  setValue: (v: string) => void;
  onStart: () => void;
}) {
  if (!open) {
    return (
      <button
        type="button"
        className="ss-btn"
        style={{ marginTop: "var(--space-4)" }}
        onClick={() => setOpen(true)}
      >
        <Plus className="ss-btn-icon" />
        Start another session
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: "var(--space-4)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "var(--space-3)", border: "0.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)",
      }}
    >
      <span className="ss-label" style={{ marginRight: 2 }}>Start an off-schedule session for</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)", padding: "6px 10px",
          fontSize: 13, color: "var(--fg)", background: "var(--surface)", outline: "none",
        }}
      >
        <option value="">Select a program…</option>
        {options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button type="button" className="ss-btn ss-btn-primary" disabled={!value} onClick={onStart}>
        <Plus className="ss-btn-icon" />Start
      </button>
      <button type="button" className="ss-btn" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}

// ── Roster view ────────────────────────────────────────────────────────────────

function RosterView({
  selected, locked, total, present, absent, marked,
  filter, setFilter, query, setQuery, visibleEntries, loadingRoster,
  onBack, onMark, onOpenNote, onSubmit, submitting, th,
}: {
  selected: SessionRosterDto;
  locked: boolean;
  total: number; present: number; absent: number; marked: number;
  filter: Filter; setFilter: (f: Filter) => void;
  query: string; setQuery: (q: string) => void;
  visibleEntries: SessionRosterDto["entries"];
  loadingRoster: boolean;
  onBack: () => void;
  onMark: (recordId: string, target: AttendanceStatus) => void;
  onOpenNote: (recordId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  th: React.CSSProperties;
}) {
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5, marginBottom: "var(--space-3)",
          background: "none", border: "none", cursor: "pointer", color: "var(--fg-secondary)", fontSize: 13, padding: 0,
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        All sessions
      </button>

      {/* session header */}
      <div
        style={{
          background: `var(--${selected.programSlug}-fill)`, borderRadius: "var(--r-lg)",
          padding: "var(--space-4)", marginBottom: "var(--space-4)", border: "0.5px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span className={`ss-dot ${selected.programSlug}`} />
              {selected.programName}
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--fg-secondary)" }}>
              {selected.timeRange && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock style={{ width: 12, height: 12 }} />{selected.timeRange}
                </span>
              )}
              {selected.room && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPin style={{ width: 12, height: 12 }} />{selected.room}
                </span>
              )}
            </div>
          </div>
          {locked && (
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500,
                padding: "4px 10px", borderRadius: "var(--r-pill)",
                background: "var(--success-fill)", color: "var(--success-text)", border: "0.5px solid var(--success-border)",
              }}
            >
              <Lock style={{ width: 12, height: 12 }} />Submitted
            </span>
          )}
        </div>
      </div>

      {/* stats */}
      <div className="adm-statgrid" style={{ marginBottom: "var(--space-4)" }}>
        <div className="adm-stat">
          <span className="label">Present</span>
          <span className="num" style={{ color: "var(--success)" }}>{present}</span>
          <span className="delta muted"><Users />{pct(present)} of roster</span>
        </div>
        <div className="adm-stat">
          <span className="label">Absent</span>
          <span className="num" style={{ color: "var(--danger)" }}>{absent}</span>
          <span className="delta danger"><UserX />{pct(absent)} of roster</span>
        </div>
      </div>

      {/* roster card */}
      <div className="widget">
        <div className="widget-head" style={{ flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Roster</h3>
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
                <th style={{ ...th, textAlign: "center" }}>Status</th>
                <th style={{ ...th, textAlign: "center" }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {loadingRoster ? (
                <tr><td colSpan={3} style={{ textAlign: "center", padding: "32px 16px", color: "var(--fg-tertiary)", fontSize: 13 }}>Loading roster…</td></tr>
              ) : visibleEntries.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: "center", padding: "32px 16px", color: "var(--fg-tertiary)", fontSize: 13 }}>
                  {total === 0 ? "No active participants in this program." : "No participants match this filter."}
                </td></tr>
              ) : visibleEntries.map((r) => (
                <tr key={r.recordId} style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="ss-avatar sm" style={{ background: `var(--${r.programSlug}-fill)`, color: `var(--${r.programSlug})`, border: `0.5px solid var(--${r.programSlug}-border)` }}>
                        {r.initials}
                      </span>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.fullName}</div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", gap: 3 }}>
                      {ATT_OPTS.map((o) => {
                        const Icon = o.icon;
                        return (
                          <button
                            key={o.key}
                            className={`ss-att-btn ${o.cls}${r.status === o.key ? " is-selected" : ""}`}
                            title={locked ? "Session submitted — locked" : o.label}
                            disabled={locked}
                            style={locked ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                            onClick={() => onMark(r.recordId, o.key)}
                          >
                            <Icon />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button
                      onClick={() => onOpenNote(r.recordId)}
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
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "0.5px solid var(--border)", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13, color: "var(--fg-secondary)" }}>
            <span>{marked} of {total} marked</span>
            {!locked && <span style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>· changes save automatically</span>}
          </div>
          {locked ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--success-text, var(--success))" }}>
              <Check style={{ width: 14, height: 14 }} />Attendance submitted
            </span>
          ) : (
            <button
              className="ss-btn ss-btn-primary"
              disabled={total === 0 || marked < total || submitting}
              onClick={onSubmit}
            >
              {submitting ? <Loader2 className="ss-btn-icon" style={{ animation: "spin 1s linear infinite" }} /> : <Check className="ss-btn-icon" />}
              {submitting ? "Submitting…" : "Submit attendance"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

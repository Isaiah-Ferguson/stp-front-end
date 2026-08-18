"use client";

import { useEffect, useMemo, useState } from "react";
import { PenLine, Check, X } from "lucide-react";
import { useMyPrograms, useParticipants, useObjectiveAreas, useStaff } from "@/lib/api/hooks";
import { progressApi } from "@/lib/api/progress";
import { rosterApi } from "@/lib/api/roster";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Skeleton } from "../components/Skeleton";
import type {
  ProgramSummaryDto,
  ParticipantSummaryDto,
  ObjectiveAreaDto,
  WeeklyFocusSkillDto,
  StarMonthDto,
  DataScore,
  StaffSummaryDto,
  RosterEntryDto,
} from "@/lib/types/api";

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/**
 * When weekly data is due for a programme: its LAST meeting day of the week.
 *
 * The client stated the rule as "Part-time each Wednesday (or last day of class for the
 * week), Full-time Fridays" — and their programmes meet Mon–Wed and Mon–Fri respectively, so
 * deriving it from the schedule reproduces both answers exactly and stays correct if the
 * timetable ever changes. Hardcoding the two weekdays would silently go wrong the first time
 * a class moves.
 */
function dueDayFor(meetingDays: string | undefined): (typeof DAY_ORDER)[number] | null {
  if (!meetingDays || meetingDays === "None") return null;
  const days = meetingDays.split(",").map((d) => d.trim());
  for (let i = DAY_ORDER.length - 1; i >= 0; i--) {
    if (days.includes(DAY_ORDER[i])) return DAY_ORDER[i];
  }
  return null;
}

// The term the roster is keyed by. Assignments are set per quarter, so the filter reads
// the current one — the same convention the Roster page uses.
function currentTerm() {
  const now = new Date();
  return { year: now.getFullYear(), quarter: Math.floor(now.getMonth() / 3) + 1 };
}

const WEEKS = [1, 2, 3, 4, 5];
const SCORES: { value: DataScore; short: string }[] = [
  { value: "Refusal", short: "0" },
  { value: "FullPrompts", short: "1" },
  { value: "MinimalPrompts", short: "2" },
  { value: "Independent", short: "3" },
  { value: "NotApplicable", short: "N/A" },
];

const cellSelect: React.CSSProperties = {
  border: "0.5px solid var(--border)", borderRadius: "var(--r-sm)",
  padding: "4px 6px", fontSize: 12, color: "var(--fg)", background: "var(--surface)", outline: "none", width: 56,
};

export default function WeeklyDataPage() {
  // Cached + shared via React Query (#34).
  const programs: ProgramSummaryDto[] = useMyPrograms().data ?? [];
  const allParticipants: ParticipantSummaryDto[] = useParticipants().data ?? [];
  const areas: ObjectiveAreaDto[] = useObjectiveAreas().data ?? [];
  const staff: StaffSummaryDto[] = useStaff().data ?? [];
  const { user } = useAuth();

  // Staff filter (#R5). "" means everyone; otherwise a staffMemberId. A teacher lands on
  // their own assigned Stars — the app already knows which staff member is signed in — with
  // the option to switch to another staff member or view all.
  const [staffFilterRaw, setStaffFilterRaw] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<RosterEntryDto[] | null>(null); // null = not loaded yet
  const term = useMemo(currentTerm, []);

  // Default to the signed-in staff member ONLY once the roster has loaded and actually has
  // stars assigned to them. Applying it eagerly emptied the grid for every staff-linked user
  // in any term nobody had filled in yet — including the first week of every new quarter —
  // with no way back, because the reset chip only rendered when assignments existed.
  const defaultStaffFilter =
    assignments && user?.staffMemberId &&
    assignments.some((a) => a.assignedStaffId === user.staffMemberId)
      ? user.staffMemberId
      : "";
  const staffFilter = staffFilterRaw ?? defaultStaffFilter;

  // Defaults to the user's first program once the list arrives; explicit choice wins.
  const [programIdRaw, setProgramIdRaw] = useState<string>("");
  const programId = programIdRaw || (programs[0]?.id ?? "");
  const setProgramId = setProgramIdRaw;
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [week, setWeek] = useState(1);

  const [focus, setFocus] = useState<WeeklyFocusSkillDto[]>([]);
  const [scores, setScores] = useState<Map<string, DataScore>>(new Map()); // `${participantId}:${subSkillId}:${week}`
  const [loading, setLoading] = useState(false);

  const [editingFocus, setEditingFocus] = useState(false);
  const [focusDraft, setFocusDraft] = useState<Set<string>>(new Set());
  const [savingFocus, setSavingFocus] = useState(false);

  // Bootstrap: programs, participants, taxonomy.
  // Star ids assigned to the chosen staff member this term. Empty filter → no restriction.
  const staffStarIds = useMemo(() => {
    if (!staffFilter || !assignments) return null;
    return new Set(assignments.filter((a) => a.assignedStaffId === staffFilter).map((a) => a.participantId));
  }, [assignments, staffFilter]);

  const participants = useMemo(
    () => allParticipants
      .filter((p) => p.programId === programId || p.secondaryProgramId === programId)
      .filter((p) => staffStarIds === null || staffStarIds.has(p.id))
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [allParticipants, programId, staffStarIds]
  );

  // Staff who actually have an assignment this term, for the picker — no point listing
  // everyone on payroll when only a handful are assigned Stars.
  const assignedStaff = useMemo(() => {
    const ids = new Set((assignments ?? []).map((a) => a.assignedStaffId).filter(Boolean) as string[]);
    return staff.filter((m) => ids.has(m.id) && !m.isFormer).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [assignments, staff]);

  // The term's roster: which staff member each Star is assigned to. Loaded once; a
  // management user sees the whole roster, a teacher sees only their own (the API scopes it).
  useEffect(() => {
    rosterApi.get(term.year, term.quarter)
      .then(setAssignments)
      // An empty array is a real answer ("nobody is assigned yet"); a failure is not. Both
      // used to collapse to [], which silently turned a 500 into an empty roster.
      .catch(() => setAssignments([]));
  }, [term]);

  // Load focus skills + each Star's month data when program/month changes.
  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    const roster = allParticipants.filter((p) => p.programId === programId || p.secondaryProgramId === programId);
    Promise.all([
      progressApi.getFocusSkills(programId, month).catch(() => [] as WeeklyFocusSkillDto[]),
      Promise.all(roster.map((p) => progressApi.getStarMonth(p.id, month).catch(() => null))),
    ])
      .then(([f, months]) => {
        setFocus(f);
        const m = new Map<string, DataScore>();
        for (const sm of months as (StarMonthDto | null)[]) {
          if (!sm) continue;
          for (const e of sm.entries) m.set(`${sm.participantId}:${e.subSkillId}:${e.weekNumber}`, e.score);
        }
        setScores(m);
      })
      .finally(() => setLoading(false));
  }, [programId, month, allParticipants]);

  const weekFocus = useMemo(() => focus.filter((f) => f.weekNumber === week), [focus, week]);

  // Coverage for the week in view (#R4, the cheap half). Answers "who is still missing?"
  // where the work actually happens, rather than as another dashboard line nobody opens.
  // A Star counts as done when every focus skill has a score — N/A counts, since marking a
  // skill not-applicable is a deliberate answer, not a gap.
  const coverage = useMemo(() => {
    if (weekFocus.length === 0 || participants.length === 0) return null;
    let done = 0;
    const missing: string[] = [];
    for (const p of participants) {
      const scored = weekFocus.every((f) => scores.get(`${p.id}:${f.subSkillId}:${week}`));
      if (scored) done++;
      else missing.push(p.fullName);
    }

    // Overdue only for a week that has actually finished — flagging the current week as late
    // on its own due day, before the class has happened, would be nagging rather than useful.
    const due = dueDayFor(programs.find((pr) => pr.id === programId)?.meetingDays);
    const today = new Date();
    const dueIndex = due ? DAY_ORDER.indexOf(due) : -1;
    const pastDue = dueIndex >= 0 && today.getDay() > dueIndex;

    return { done, total: participants.length, missing, due, pastDue };
  }, [participants, weekFocus, scores, week, programs, programId]);

  function recordScore(participantId: string, subSkillId: string, score: DataScore) {
    setScores((prev) => new Map(prev).set(`${participantId}:${subSkillId}:${week}`, score));
    progressApi.recordWeekly({ participantId, subSkillId, monthKey: month, weekNumber: week, score }).catch(() => {});
  }

  function openFocusEditor() {
    setFocusDraft(new Set(weekFocus.map((f) => f.subSkillId)));
    setEditingFocus(true);
  }
  function toggleDraft(id: string) {
    setFocusDraft((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  async function saveFocus() {
    if (!programId) return;
    setSavingFocus(true);
    try {
      await progressApi.setFocusSkills({ programId, monthKey: month, weekNumber: week, subSkillIds: [...focusDraft] });
      const f = await progressApi.getFocusSkills(programId, month);
      setFocus(f);
      setEditingFocus(false);
    } catch { /* leave editor open */ } finally { setSavingFocus(false); }
  }

  // The selected program decides which framework's sections show (Pathways vs part-time).
  const selectedTrack = programs.find((p) => p.id === programId)?.slug === "pathways" ? "Pathways" : "PartTime";
  const sections = areas.filter((a) => a.track === selectedTrack && a.subSkills.length > 0).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles"><h1>Weekly Data</h1></div>
        <div className="right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            style={{ border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)", padding: "6px 8px", fontSize: 12, color: "var(--fg)", background: "var(--surface)", outline: "none" }} />
        </div>
      </div>

      <div className="adm-content">
        {/* Program + week pickers */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span className="ss-label" style={{ color: "var(--fg-tertiary)", marginRight: 2 }}>Program</span>
            {programs.map((p) => {
              const active = programId === p.id;
              return (
                <button key={p.id} type="button" onClick={() => setProgramId(p.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: "var(--r-pill)", cursor: "pointer", fontSize: 13,
                    border: `0.5px solid ${active ? `var(--${p.slug}-border)` : "var(--border)"}`,
                    background: active ? `var(--${p.slug}-fill)` : "var(--surface)",
                    color: active ? `var(--${p.slug})` : "var(--fg-secondary)" }}>
                  <span className={`ss-dot ${p.slug}`} />{p.name}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span className="ss-label" style={{ color: "var(--fg-tertiary)", marginRight: 2 }}>Week</span>
            {WEEKS.map((w) => (
              <button key={w} type="button" className={`ss-chip${week === w ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setWeek(w)}>W{w}</button>
            ))}
          </div>
          {/* Rendered when there is someone to pick OR a filter is active — the "All stars"
              reset must never be unreachable while the grid is filtered. */}
          {(assignedStaff.length > 0 || staffFilter !== "") && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="ss-label" style={{ color: "var(--fg-tertiary)", marginRight: 2 }}>Staff</span>
              <button type="button" className={`ss-chip${staffFilter === "" ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setStaffFilterRaw("")}>All stars</button>
              {assignedStaff.map((m) => (
                <button key={m.id} type="button" className={`ss-chip${staffFilter === m.id ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setStaffFilterRaw(m.id)}>
                  {m.id === user?.staffMemberId ? "My stars" : m.fullName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Focus skills */}
        <div className="widget" style={{ marginBottom: "var(--space-4)" }}>
          <div className="widget-head" style={{ display: "flex", alignItems: "center" }}>
            <PenLine className="ico" style={{ color: "var(--primary)" }} />
            <h3>Focus skills · Week {week}</h3>
            {!editingFocus && (
              <button type="button" className="ss-btn" style={{ marginLeft: "auto" }} onClick={openFocusEditor}>
                <PenLine className="ss-btn-icon" />{weekFocus.length ? "Edit" : "Set focus skills"}
              </button>
            )}
          </div>
          <div className="widget-body">
            {editingFocus ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {sections.map((a) => (
                    <div key={a.id}>
                      <div style={{ fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: `color-mix(in srgb, ${a.colorHex} 55%, var(--fg))`, marginBottom: 4 }}>{a.name}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {a.subSkills.map((s) => {
                          const on = focusDraft.has(s.id);
                          return (
                            <button key={s.id} type="button" onClick={() => toggleDraft(s.id)}
                              style={{ padding: "4px 9px", borderRadius: "var(--r-pill)", cursor: "pointer", fontSize: 12,
                                border: `0.5px solid ${on ? a.colorHex : "var(--border)"}`,
                                background: on ? `color-mix(in srgb, ${a.colorHex} 14%, var(--surface))` : "var(--surface)",
                                color: on ? `color-mix(in srgb, ${a.colorHex} 55%, var(--fg))` : "var(--fg-secondary)" }}>
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
                  <button type="button" className="ss-btn" onClick={() => setEditingFocus(false)} disabled={savingFocus}><X className="ss-btn-icon" />Cancel</button>
                  <button type="button" className="ss-btn ss-btn-primary" onClick={saveFocus} disabled={savingFocus}>
                    <Check className="ss-btn-icon" />{savingFocus ? "Saving…" : `Save ${focusDraft.size} skill${focusDraft.size !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </>
            ) : weekFocus.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>No focus skills set for this week yet — set the 2–4 skills the lesson plan targets.</div>
            ) : (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {weekFocus.map((f) => <span key={f.subSkillId} className="ss-chip is-active">{f.subSkillName}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Week coverage */}
        {!loading && coverage && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              marginBottom: "var(--space-3)", padding: "8px 12px",
              border: "0.5px solid var(--border)", borderRadius: "var(--r-md)",
              background: coverage.done === coverage.total
                ? "var(--success-fill, #e9f1ec)"
                : coverage.pastDue ? "var(--warning-fill, #f7efe2)" : "var(--surface)",
              fontSize: 13,
            }}
          >
            <span style={{ color: coverage.done === coverage.total ? "var(--success-text, var(--success))" : "var(--fg)" }}>
              <strong>Week {week}:</strong> {coverage.done} of {coverage.total} star{coverage.total !== 1 ? "s" : ""} scored
            </span>
            {coverage.due && coverage.done < coverage.total && (
              <span style={{ color: coverage.pastDue ? "var(--warning-text, var(--warning))" : "var(--fg-tertiary)" }}>
                {coverage.pastDue ? `· was due ${coverage.due}` : `· due ${coverage.due}`}
              </span>
            )}
            {coverage.missing.length > 0 && (
              <span style={{ color: "var(--fg-tertiary)" }}>
                still to do: {coverage.missing.slice(0, 4).join(", ")}
                {coverage.missing.length > 4 ? ` +${coverage.missing.length - 4} more` : ""}
              </span>
            )}
          </div>
        )}

        {/* Entry grid */}
        {loading ? (
          <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)", overflow: "hidden" }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: i < 4 ? "0.5px solid var(--border)" : "none" }}>
                <Skeleton w={24} h={24} circle />
                <Skeleton w={120 + ((i * 23) % 40)} h={11} />
                <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <Skeleton w={56} h={24} r={4} />
                  <Skeleton w={56} h={24} r={4} />
                  <Skeleton w={56} h={24} r={4} />
                </span>
              </div>
            ))}
          </div>
        ) : participants.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>
            {staffFilter
              ? "No stars assigned to this staff member for the current term. Set assignments on the Roster page, or choose \u201cAll stars\u201d."
              : "No stars in this program."}
          </div>
        ) : weekFocus.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>Set this week&apos;s focus skills above to start entering data.</div>
        ) : (
          <div style={{ overflowX: "auto", border: "0.5px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "var(--fs-label)", textTransform: "uppercase", letterSpacing: "var(--ls-label)", color: "var(--fg-tertiary)", fontWeight: "var(--w-regular)" }}>Star</th>
                  {weekFocus.map((f) => (
                    <th key={f.subSkillId} style={{ padding: "8px 8px", fontSize: "var(--fs-meta)", color: "var(--fg-secondary)", fontWeight: "var(--w-regular)", textAlign: "center", minWidth: 84 }}>{f.subSkillName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "0.5px solid var(--border)" }}>
                    <td style={{ padding: "6px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span className="ss-avatar teacher sm">{p.initials}</span>
                        <span style={{ fontSize: "var(--fs-body)" }}>{p.fullName}</span>
                      </span>
                    </td>
                    {weekFocus.map((f) => {
                      const key = `${p.id}:${f.subSkillId}:${week}`;
                      return (
                        <td key={f.subSkillId} style={{ padding: "4px 8px", textAlign: "center" }}>
                          <select value={scores.get(key) ?? ""} onChange={(e) => e.target.value && recordScore(p.id, f.subSkillId, e.target.value as DataScore)} style={cellSelect} aria-label={`${p.fullName} — ${f.subSkillName}`}>
                            <option value="">–</option>
                            {SCORES.map((sc) => <option key={sc.value} value={sc.value}>{sc.short}</option>)}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-meta)", color: "var(--fg-tertiary)" }}>
          <strong>0</strong> Refusal · <strong>1</strong> Full prompts · <strong>2</strong> Minimal prompts · <strong>3</strong> Independent · <strong>N/A</strong> not targeted. Scores save as you enter them.
        </div>
      </div>
    </div>
  );
}

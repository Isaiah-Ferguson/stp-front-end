"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Check } from "lucide-react";
import { progressApi, goalBankApi } from "@/lib/api/progress";
import { taxonomyApi } from "@/lib/api/taxonomy";
import type {
  ObjectiveAreaDto,
  StarMonthDto,
  WeeklyDataEntryDto,
  MonthlyProgressSnapshotDto,
  DataScore,
  ProgressLevel,
  GoalBankEntryDto,
  GoalBankKind,
  WeeklyNoteSelectionDto,
  MonthlySummaryDto,
  UpsertMonthlySummaryDto,
} from "@/lib/types/api";

const NOTE_WEEKS = [1, 2, 3, 4];
const NOTE_KINDS: { kind: GoalBankKind; label: string }[] = [
  { kind: "Strength", label: "Strengths observed" },
  { kind: "AreaForImprovement", label: "Areas for improvement" },
  { kind: "NewGoal", label: "New goals for next week" },
];

function sumFrom(s: MonthlySummaryDto | null | undefined): UpsertMonthlySummaryDto {
  return {
    primaryLevel: s?.primaryLevel ?? "NotApplicable",
    progressNarrative: s?.progressNarrative ?? "",
    goalsCarryOver: s?.goalsCarryOver ?? true,
    nextMonthUpdate: s?.nextMonthUpdate ?? "",
  };
}

const WEEKS = [1, 2, 3, 4, 5];

const SCORES: { value: DataScore; short: string }[] = [
  { value: "Refusal", short: "0" },
  { value: "FullPrompts", short: "1" },
  { value: "MinimalPrompts", short: "2" },
  { value: "Independent", short: "3" },
  { value: "NotApplicable", short: "N/A" },
];

const LEVELS: { value: ProgressLevel; label: string }[] = [
  { value: "Novice", label: "Novice" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Expert", label: "Expert" },
  { value: "NotApplicable", label: "N/A" },
];

function levelLabel(l: ProgressLevel): string {
  return l === "NotApplicable" ? "N/A" : l;
}

const cellSelect: React.CSSProperties = {
  border: "0.5px solid var(--border)", borderRadius: "var(--r-sm)",
  padding: "3px 4px", fontSize: 12, color: "var(--fg)", background: "var(--surface)",
  outline: "none", width: 48,
};

export default function TrackerWidget({ participantId }: { participantId: string }) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [areas, setAreas] = useState<ObjectiveAreaDto[]>([]);
  const [data, setData] = useState<StarMonthDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState(false);
  const [goalBank, setGoalBank] = useState<GoalBankEntryDto[]>([]);
  const [summaryForm, setSummaryForm] = useState<UpsertMonthlySummaryDto>(sumFrom(null));
  const [savingSummary, setSavingSummary] = useState(false);
  const [customCells, setCustomCells] = useState<Set<string>>(new Set()); // `${kind}:${week}` in custom-text mode

  useEffect(() => { taxonomyApi.getObjectiveAreas().then(setAreas).catch(() => setAreas([])); }, []);
  useEffect(() => { goalBankApi.get().then(setGoalBank).catch(() => setGoalBank([])); }, []);

  useEffect(() => {
    setLoading(true);
    progressApi.getStarMonth(participantId, month)
      .then((d) => { setData(d); setError(false); setSummaryForm(sumFrom(d.monthlySummary)); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [participantId, month]);

  const entryMap = useMemo(() => {
    const m = new Map<string, WeeklyDataEntryDto>();
    data?.entries.forEach((e) => m.set(`${e.subSkillId}:${e.weekNumber}`, e));
    return m;
  }, [data]);

  const snapMap = useMemo(() => {
    const m = new Map<string, MonthlyProgressSnapshotDto>();
    data?.snapshots.forEach((s) => m.set(s.subSkillId, s));
    return m;
  }, [data]);

  const sections = useMemo(
    () => areas.filter((a) => a.subSkills.length > 0).sort((a, b) => a.sortOrder - b.sortOrder),
    [areas]
  );

  const noteMap = useMemo(() => {
    const m = new Map<string, WeeklyNoteSelectionDto>();
    data?.noteSelections.forEach((n) => m.set(`${n.kind}:${n.weekNumber}`, n));
    return m;
  }, [data]);

  function saveNote(kind: GoalBankKind, week: number, goalBankEntryId: string | null, customText: string | null) {
    progressApi.recordNote(participantId, month, { weekNumber: week, kind, goalBankEntryId, customText })
      .then((saved) => setData((prev) => prev
        ? { ...prev, noteSelections: [...prev.noteSelections.filter((n) => !(n.kind === kind && n.weekNumber === week)), saved] }
        : prev))
      .catch(() => {});
  }

  function saveSummary() {
    setSavingSummary(true);
    progressApi.upsertSummary(participantId, month, summaryForm)
      .then((saved) => setData((prev) => (prev ? { ...prev, monthlySummary: saved } : prev)))
      .catch(() => {})
      .finally(() => setSavingSummary(false));
  }

  function recordScore(subSkillId: string, week: number, score: DataScore) {
    progressApi.recordWeekly({ participantId, subSkillId, monthKey: month, weekNumber: week, score })
      .then((saved) => setData((prev) => prev
        ? { ...prev, entries: [...prev.entries.filter((e) => !(e.subSkillId === subSkillId && e.weekNumber === week)), saved] }
        : prev))
      .catch(() => { /* leave unchanged on failure */ });
  }

  function confirmLevel(subSkillId: string, level: ProgressLevel) {
    progressApi.confirmMonthEnd(participantId, month, { subSkillId, level })
      .then((saved) => setData((prev) => prev
        ? { ...prev, snapshots: [...prev.snapshots.filter((s) => s.subSkillId !== subSkillId), saved] }
        : prev))
      .catch(() => {});
  }

  function recompute() {
    setComputing(true);
    progressApi.computeMonthEnd(participantId, month)
      .then((snaps) => setData((prev) => (prev ? { ...prev, snapshots: snaps } : prev)))
      .catch(() => {})
      .finally(() => setComputing(false));
  }

  return (
    <div className="widget">
      <div className="widget-head" style={{ display: "flex", alignItems: "center" }}>
        <ClipboardList className="ico" style={{ color: "var(--primary)" }} />
        <h3>Weekly tracker</h3>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)", padding: "5px 8px", fontSize: 12, color: "var(--fg)", background: "var(--surface)", outline: "none" }}
          />
          <button type="button" className="ss-btn" onClick={recompute} disabled={computing || loading} title="Recompute suggested month-end levels from the weekly data">
            <RefreshCw className="ss-btn-icon" style={computing ? { animation: "spin 1s linear infinite" } : undefined} />
            {computing ? "Computing…" : "Recompute"}
          </button>
        </div>
      </div>

      <div className="widget-body">
        {loading ? (
          <div style={{ padding: "16px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "16px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>Couldn&apos;t load the tracker — check the API and try again.</div>
        ) : sections.length === 0 ? (
          <div style={{ padding: "16px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>Skill taxonomy unavailable.</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560, fontSize: "var(--fs-body)" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: "var(--w-regular)", color: "var(--fg-tertiary)", fontSize: "var(--fs-label)", textTransform: "uppercase", letterSpacing: "var(--ls-label)" }}>Skill</th>
                    {WEEKS.map((w) => (
                      <th key={w} style={{ padding: "6px 4px", fontWeight: "var(--w-regular)", color: "var(--fg-tertiary)", fontSize: "var(--fs-label)", textTransform: "uppercase" }}>W{w}</th>
                    ))}
                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: "var(--w-regular)", color: "var(--fg-tertiary)", fontSize: "var(--fs-label)", textTransform: "uppercase", letterSpacing: "var(--ls-label)" }}>Month-end</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((area) => (
                    <FragmentSection key={area.id} area={area}
                      entryMap={entryMap} snapMap={snapMap}
                      onScore={recordScore} onConfirm={confirmLevel} />
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-meta)", color: "var(--fg-tertiary)", lineHeight: "var(--lh-body)" }}>
              Data: <strong>0</strong> Refusal · <strong>1</strong> Full prompts · <strong>2</strong> Minimal prompts · <strong>3</strong> Independent · <strong>N/A</strong> not targeted.
              Month-end suggests a level from the average of scored weeks — confirm or override it.
            </div>

            {/* Section 6 — weekly notes */}
            <div style={{ marginTop: "var(--space-5)", borderTop: "0.5px solid var(--border)", paddingTop: "var(--space-4)" }}>
              <div className="ss-label" style={{ marginBottom: "var(--space-3)", color: "var(--fg-secondary)" }}>Section 6 · Weekly notes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {NOTE_KINDS.map(({ kind, label }) => (
                  <div key={kind}>
                    <div style={{ fontSize: "var(--fs-body)", fontWeight: "var(--w-medium)", marginBottom: 6 }}>{label}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-2)" }}>
                      {NOTE_WEEKS.map((w) => {
                        const cellKey = `${kind}:${w}`;
                        const sel = noteMap.get(cellKey);
                        const opts = goalBank.filter((g) => g.kind === kind);
                        const groups = [...new Set(opts.map((g) => `S${g.sectionNumber} · ${levelLabel(g.level)}`))];
                        const inputStyle = { border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)", padding: "6px 8px", fontSize: 12, color: "var(--fg)", background: "var(--surface)", outline: "none", width: "100%" } as React.CSSProperties;
                        const isCustom = customCells.has(cellKey) || (!!sel && !sel.goalBankEntryId && !!sel.customText);
                        return (
                          <label key={w} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <span style={{ fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--fg-tertiary)" }}>Week {w}</span>
                            {isCustom ? (
                              <div style={{ display: "flex", gap: 4 }}>
                                <input defaultValue={sel?.customText ?? ""} placeholder="Type a note…" autoFocus={customCells.has(cellKey)}
                                  onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (sel?.customText ?? null)) saveNote(kind, w, null, v); }}
                                  style={{ ...inputStyle, flex: 1 }} />
                                <button type="button" title="Use a preset instead" onClick={() => { setCustomCells((s) => { const n = new Set(s); n.delete(cellKey); return n; }); if (sel?.customText) saveNote(kind, w, null, null); }}
                                  style={{ background: "none", border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)", cursor: "pointer", color: "var(--fg-tertiary)", padding: "0 8px" }}>✕</button>
                              </div>
                            ) : (
                              <select value={sel?.goalBankEntryId ?? ""}
                                onChange={(e) => { if (e.target.value === "__custom__") setCustomCells((s) => new Set(s).add(cellKey)); else saveNote(kind, w, e.target.value || null, null); }}
                                style={inputStyle}>
                                <option value="">— none —</option>
                                <option value="__custom__">✎ Custom…</option>
                                {groups.map((g) => (
                                  <optgroup key={g} label={g}>
                                    {opts.filter((o) => `S${o.sectionNumber} · ${levelLabel(o.level)}` === g).map((o) => (
                                      <option key={o.id} value={o.id}>{o.text}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly summary */}
            <div style={{ marginTop: "var(--space-5)", borderTop: "0.5px solid var(--border)", paddingTop: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-3)" }}>
                <div className="ss-label" style={{ color: "var(--fg-secondary)" }}>Monthly summary</div>
                <button type="button" className="ss-btn ss-btn-primary" style={{ marginLeft: "auto" }} onClick={saveSummary} disabled={savingSummary}>
                  <Check className="ss-btn-icon" />{savingSummary ? "Saving…" : "Save summary"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 620 }}>
                <div>
                  <div className="ss-label" style={{ marginBottom: 6 }}>Primary level for the month</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {LEVELS.map((l) => (
                      <button key={l.value} type="button" className={`ss-chip${summaryForm.primaryLevel === l.value ? " is-active" : ""}`} style={{ cursor: "pointer" }}
                        onClick={() => setSummaryForm((f) => ({ ...f, primaryLevel: l.value }))}>{l.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="ss-label" style={{ marginBottom: 6 }}>Progress this month</div>
                  <textarea rows={2} value={summaryForm.progressNarrative ?? ""} onChange={(e) => setSummaryForm((f) => ({ ...f, progressNarrative: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)", padding: "8px 12px", fontSize: 13, color: "var(--fg)", background: "var(--surface)", outline: "none", resize: "vertical", lineHeight: "var(--lh-body)" }} />
                </div>
                <div>
                  <div className="ss-label" style={{ marginBottom: 6 }}>Goals carry over to next month?</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className={`ss-chip${summaryForm.goalsCarryOver ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setSummaryForm((f) => ({ ...f, goalsCarryOver: true }))}>Yes — carry over</button>
                    <button type="button" className={`ss-chip${!summaryForm.goalsCarryOver ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setSummaryForm((f) => ({ ...f, goalsCarryOver: false }))}>No — update</button>
                  </div>
                </div>
                {!summaryForm.goalsCarryOver && (
                  <div>
                    <div className="ss-label" style={{ marginBottom: 6 }}>What&apos;s new for next month</div>
                    <textarea rows={2} value={summaryForm.nextMonthUpdate ?? ""} onChange={(e) => setSummaryForm((f) => ({ ...f, nextMonthUpdate: e.target.value }))}
                      style={{ width: "100%", boxSizing: "border-box", border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)", padding: "8px 12px", fontSize: 13, color: "var(--fg)", background: "var(--surface)", outline: "none", resize: "vertical", lineHeight: "var(--lh-body)" }} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FragmentSection({
  area, entryMap, snapMap, onScore, onConfirm,
}: {
  area: ObjectiveAreaDto;
  entryMap: Map<string, WeeklyDataEntryDto>;
  snapMap: Map<string, MonthlyProgressSnapshotDto>;
  onScore: (subSkillId: string, week: number, score: DataScore) => void;
  onConfirm: (subSkillId: string, level: ProgressLevel) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={7} style={{ padding: "8px 8px 4px", fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: `color-mix(in srgb, ${area.colorHex} 55%, var(--fg))`, fontWeight: "var(--w-medium)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: area.colorHex }} />
            {area.name}
          </span>
        </td>
      </tr>
      {[...area.subSkills].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => {
        const snap = snapMap.get(s.id);
        return (
          <tr key={s.id} style={{ borderBottom: "0.5px solid var(--border)" }}>
            <td style={{ padding: "5px 8px", color: "var(--fg)" }}>{s.name}</td>
            {WEEKS.map((w) => {
              const entry = entryMap.get(`${s.id}:${w}`);
              return (
                <td key={w} style={{ padding: "4px 2px", textAlign: "center" }}>
                  <select
                    value={entry?.score ?? ""}
                    onChange={(e) => e.target.value && onScore(s.id, w, e.target.value as DataScore)}
                    style={cellSelect}
                    aria-label={`${s.name} week ${w}`}
                  >
                    <option value="">–</option>
                    {SCORES.map((sc) => <option key={sc.value} value={sc.value}>{sc.short}</option>)}
                  </select>
                </td>
              );
            })}
            <td style={{ padding: "4px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select
                  value={snap && snap.level ? snap.level : ""}
                  onChange={(e) => e.target.value && onConfirm(s.id, e.target.value as ProgressLevel)}
                  style={{ border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-sm)", padding: "3px 6px", fontSize: 12, color: "var(--fg)", background: "var(--surface)", outline: "none" }}
                >
                  <option value="">Set…</option>
                  {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                {snap?.isConfirmed ? (
                  <span title="Confirmed" style={{ display: "inline-flex", alignItems: "center", color: "var(--success)" }}><Check style={{ width: 13, height: 13 }} /></span>
                ) : snap && snap.scoredWeekCount > 0 ? (
                  <span style={{ fontSize: 10, color: "var(--fg-tertiary)" }} title={`Suggested from ${snap.scoredWeekCount} scored week(s)`}>
                    sugg. {levelLabel(snap.suggestedLevel)}
                  </span>
                ) : null}
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

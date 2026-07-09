"use client";

import { useEffect, useMemo, useState } from "react";
import { PenLine, Check, X } from "lucide-react";
import { useMyPrograms, useParticipants, useObjectiveAreas } from "@/lib/api/hooks";
import { progressApi } from "@/lib/api/progress";
import type {
  ProgramSummaryDto,
  ParticipantSummaryDto,
  ObjectiveAreaDto,
  WeeklyFocusSkillDto,
  StarMonthDto,
  DataScore,
} from "@/lib/types/api";

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
  const participants = useMemo(
    () => allParticipants.filter((p) => p.programId === programId).sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [allParticipants, programId]
  );

  // Load focus skills + each Star's month data when program/month changes.
  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    const roster = allParticipants.filter((p) => p.programId === programId);
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

  const sections = areas.filter((a) => a.subSkills.length > 0).sort((a, b) => a.sortOrder - b.sortOrder);

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

        {/* Entry grid */}
        {loading ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>Loading…</div>
        ) : participants.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>No participants in this program.</div>
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

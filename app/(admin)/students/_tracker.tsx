"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Check } from "lucide-react";
import { progressApi } from "@/lib/api/progress";
import { taxonomyApi } from "@/lib/api/taxonomy";
import type {
  ObjectiveAreaDto,
  StarMonthDto,
  WeeklyDataEntryDto,
  MonthlyProgressSnapshotDto,
  DataScore,
  ProgressLevel,
} from "@/lib/types/api";

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

  useEffect(() => { taxonomyApi.getObjectiveAreas().then(setAreas).catch(() => setAreas([])); }, []);

  useEffect(() => {
    setLoading(true);
    progressApi.getStarMonth(participantId, month)
      .then((d) => { setData(d); setError(false); })
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
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

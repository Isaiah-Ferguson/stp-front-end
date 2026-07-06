"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { cohortApi } from "@/lib/api/cohort";
import { programsApi } from "@/lib/api/programs";
import type { CohortRollUpDto, CohortRollUpRowDto, ProgramSummaryDto } from "@/lib/types/api";

// Ordinal "mastery" ramp (light -> dark = more developed). Validated: CVD ΔE 17.2,
// monotonic lightness; the light step's contrast is relieved by direct count labels + gaps.
const LEVEL = {
  Novice:       { color: "#74c49a", label: "Novice" },
  Intermediate: { color: "#369a66", label: "Intermediate" },
  Expert:       { color: "#14683f", label: "Expert" },
} as const;

function DistributionBar({ row }: { row: CohortRollUpRowDto }) {
  const total = row.scoredCount;
  if (total === 0) {
    return <div style={{ height: 10, borderRadius: 5, background: "var(--bg-tertiary)" }} title="No confirmed levels" />;
  }
  const segs: { key: keyof typeof LEVEL; n: number }[] = [
    { key: "Novice", n: row.noviceCount },
    { key: "Intermediate", n: row.intermediateCount },
    { key: "Expert", n: row.expertCount },
  ].filter((s) => s.n > 0) as { key: keyof typeof LEVEL; n: number }[];

  return (
    <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", gap: 2, background: "var(--surface)" }}>
      {segs.map((s) => (
        <div key={s.key} title={`${LEVEL[s.key].label}: ${s.n}`}
          style={{ flex: s.n, background: LEVEL[s.key].color, minWidth: 3 }} />
      ))}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const meta = (LEVEL as Record<string, { color: string; label: string }>)[level];
  if (!meta) return <span style={{ color: "var(--fg-tertiary)", fontSize: "var(--fs-meta)" }}>—</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-meta)", color: `color-mix(in srgb, ${meta.color} 60%, var(--fg))` }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />{meta.label}
    </span>
  );
}

export default function CohortRollUpPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [programId, setProgramId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramSummaryDto[]>([]);
  const [data, setData] = useState<CohortRollUpDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { programsApi.getMine().then(setPrograms).catch(() => setPrograms([])); }, []);

  useEffect(() => {
    setLoading(true);
    cohortApi.getRollUp(month, programId ?? undefined)
      .then((d) => { setData(d); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [month, programId]);

  // Group rows by section (each section = one objective area of the 5 measured ones).
  const sections = useMemo(() => {
    const map = new Map<number, { name: string; color: string; rows: CohortRollUpRowDto[] }>();
    data?.rows.forEach((r) => {
      if (!map.has(r.sectionNumber)) map.set(r.sectionNumber, { name: r.objectiveAreaName, color: r.objectiveAreaColorHex, rows: [] });
      map.get(r.sectionNumber)!.rows.push(r);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([n, v]) => ({ section: n, ...v }));
  }, [data]);

  const totalConfirmed = data?.rows.reduce((n, r) => n + r.scoredCount, 0) ?? 0;
  const skillsWithData = data?.rows.filter((r) => r.scoredCount > 0).length ?? 0;

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles"><h1>Cohort Roll-Up</h1></div>
        <div className="right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            style={{ border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)", padding: "6px 8px", fontSize: 12, color: "var(--fg)", background: "var(--surface)", outline: "none" }} />
        </div>
      </div>

      <div className="adm-content">
        <div className="info-note" style={{ marginBottom: "var(--space-2)" }}>
          <BarChart3 />
          <span>Where the cohort lives this month — how many Stars sit at each level per skill, from <strong>confirmed</strong> month-end levels only. Computed live; confirm levels in each Star&apos;s Weekly tracker to populate it.</span>
        </div>

        {/* program filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
          <span className="ss-label" style={{ color: "var(--fg-tertiary)", marginRight: 2 }}>Program</span>
          <button type="button" className={`ss-chip${programId === null ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setProgramId(null)}>All programs</button>
          {programs.map((p) => (
            <button key={p.id} type="button" onClick={() => setProgramId(p.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: "var(--r-pill)", cursor: "pointer", fontSize: 13,
                border: `0.5px solid ${programId === p.id ? `var(--${p.slug}-border)` : "var(--border)"}`,
                background: programId === p.id ? `var(--${p.slug}-fill)` : "var(--surface)",
                color: programId === p.id ? `var(--${p.slug})` : "var(--fg-secondary)" }}>
              <span className={`ss-dot ${p.slug}`} />{p.name}
            </button>
          ))}
        </div>

        {/* stat tiles */}
        <div className="board-stats">
          <div className="board-stat"><span className="num">{data?.participantCount ?? 0}</span><span className="label">Stars Scored</span></div>
          <div className="board-stat"><span className="num">{skillsWithData}</span><span className="label">Skills With Data</span></div>
          <div className="board-stat"><span className="num">{totalConfirmed}</span><span className="label">Confirmed Levels</span></div>
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 14, margin: "var(--space-3) 0", flexWrap: "wrap" }}>
          {(["Novice", "Intermediate", "Expert"] as const).map((k) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fs-meta)", color: "var(--fg-secondary)" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: LEVEL[k].color }} />{LEVEL[k].label}
            </span>
          ))}
        </div>

        {error ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>Couldn&apos;t load the roll-up — check the API and try again.</div>
        ) : loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>Loading…</div>
        ) : totalConfirmed === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>
            No confirmed levels for {data?.programName ?? "any program"} this month yet. Confirm month-end levels in a Star&apos;s Weekly tracker to see the cohort here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {sections.map((sec) => (
              <div key={sec.section}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--space-2)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: sec.color }} />
                  <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: "var(--w-medium)", margin: 0 }}>{sec.name}</h3>
                </div>
                <div style={{ overflowX: "auto", border: "0.5px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                    <thead>
                      <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                        {["Skill", "Distribution", "Nov", "Int", "Exp", "Scored", "Most common"].map((h, i) => (
                          <th key={h} style={{ textAlign: i > 1 && i < 6 ? "center" : "left", padding: "8px 12px", fontSize: "var(--fs-label)", textTransform: "uppercase", letterSpacing: "var(--ls-label)", color: "var(--fg-tertiary)", fontWeight: "var(--w-regular)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((r) => (
                        <tr key={r.subSkillId} style={{ borderBottom: "0.5px solid var(--border)" }}>
                          <td style={{ padding: "8px 12px", fontSize: "var(--fs-body)", whiteSpace: "nowrap" }}>{r.subSkillName}</td>
                          <td style={{ padding: "8px 12px", minWidth: 160 }}><DistributionBar row={r} /></td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontVariantNumeric: "tabular-nums", color: r.noviceCount ? "var(--fg)" : "var(--fg-tertiary)" }}>{r.noviceCount}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontVariantNumeric: "tabular-nums", color: r.intermediateCount ? "var(--fg)" : "var(--fg-tertiary)" }}>{r.intermediateCount}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontVariantNumeric: "tabular-nums", color: r.expertCount ? "var(--fg)" : "var(--fg-tertiary)" }}>{r.expertCount}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontVariantNumeric: "tabular-nums", color: "var(--fg-secondary)" }}>{r.scoredCount}</td>
                          <td style={{ padding: "8px 12px" }}><LevelBadge level={r.mostCommonLevel} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, CalendarDays } from "lucide-react";
import { yearCalendarApi } from "@/lib/api/yearCalendar";
import type { YearCalendarDto, KeyArtsDateDto, ThemeArc } from "@/lib/types/api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Legend arcs — Green = Foundational Reset, Gold = Spring Show, Rose = Nutcracker.
const ARC: Record<ThemeArc, { label: string; color: string }> = {
  FoundationalReset: { label: "Foundational Reset", color: "#2e9e5b" },
  SpringShow:        { label: "Spring Show",        color: "#e0a021" },
  Nutcracker:        { label: "Nutcracker",         color: "#c2456b" },
};

export default function YearCalendarPage() {
  const [data, setData] = useState<YearCalendarDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    yearCalendarApi.getCalendar()
      .then((d) => { setData(d); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const datesByMonth = useMemo(() => {
    const m = new Map<number, KeyArtsDateDto[]>();
    data?.keyArtsDates.forEach((k) => { (m.get(k.month) ?? m.set(k.month, []).get(k.month)!).push(k); });
    return m;
  }, [data]);

  const themesByMonth = useMemo(() => {
    const m = new Map<number, YearCalendarDto["themes"][number]>();
    data?.themes.forEach((t) => m.set(t.month, t));
    return m;
  }, [data]);

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles"><h1>Year Calendar</h1></div>
        <div className="right" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {(Object.keys(ARC) as ThemeArc[]).map((a) => (
            <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fs-meta)", color: "var(--fg-secondary)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: ARC[a].color }} />{ARC[a].label}
            </span>
          ))}
        </div>
      </div>

      <div className="adm-content">
        <div className="info-note" style={{ marginBottom: "var(--space-3)" }}>
          <CalendarRange />
          <span>The annual programming plan — each month&apos;s theme, featured games, production phase, and the key arts dates to plan around. Staff reference; management maintains it.</span>
        </div>

        {error ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>Couldn&apos;t load the calendar — check the API and try again.</div>
        ) : loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
            {MONTHS.map((name, i) => {
              const month = i + 1;
              const t = themesByMonth.get(month);
              const arc = t?.legendArc ? ARC[t.legendArc] : null;
              const accent = arc?.color ?? "var(--border-strong)";
              const dates = datesByMonth.get(month) ?? [];
              return (
                <div key={month} style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)", borderTop: `2.5px solid ${accent}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "var(--space-3) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {/* header */}
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: "var(--fs-label)", letterSpacing: "var(--ls-label)", textTransform: "uppercase", color: "var(--fg-tertiary)" }}>{name}</span>
                        {arc && (
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: "var(--r-pill)", color: `color-mix(in srgb, ${arc.color} 60%, var(--fg))`, background: `color-mix(in srgb, ${arc.color} 14%, var(--surface))`, border: `0.5px solid color-mix(in srgb, ${arc.color} 35%, var(--border))`, whiteSpace: "nowrap" }}>{arc.label}</span>
                        )}
                      </div>
                      <div style={{ fontSize: "var(--fs-h3)", fontWeight: "var(--w-medium)", marginTop: 2 }}>{t?.themeTitle ?? "—"}</div>
                      {t?.themeSubtitle && <div style={{ fontSize: "var(--fs-meta)", color: "var(--fg-secondary)", marginTop: 1 }}>{t.themeSubtitle}</div>}
                    </div>

                    {t?.productionPhase && (
                      <div style={{ fontSize: "var(--fs-meta)", color: `color-mix(in srgb, ${accent} 55%, var(--fg))`, fontWeight: "var(--w-medium)" }}>{t.productionPhase}</div>
                    )}

                    {/* key arts dates */}
                    {dates.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div className="ss-label" style={{ color: "var(--fg-tertiary)" }}>Key arts dates</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {dates.map((d) => (
                            <span key={d.id} title={d.programmingTieIn ?? undefined}
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 8px", borderRadius: "var(--r-pill)", background: "var(--bg-tertiary)", color: "var(--fg-secondary)" }}>
                              <span style={{ color: "var(--fg-tertiary)", fontVariantNumeric: "tabular-nums" }}>{d.dateText}</span>{d.observance}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {t?.featuredGamesText && (
                      <div>
                        <div className="ss-label" style={{ color: "var(--fg-tertiary)", marginBottom: 2 }}>Featured programming</div>
                        <div style={{ fontSize: "var(--fs-meta)", color: "var(--fg-secondary)", lineHeight: "var(--lh-body)" }}>{t.featuredGamesText}</div>
                      </div>
                    )}

                    {t?.programmingNotes && (
                      <div style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: "var(--fs-meta)", color: "var(--fg-tertiary)", lineHeight: "var(--lh-body)", borderTop: "0.5px solid var(--border)", paddingTop: "var(--space-2)" }}>
                        <CalendarDays style={{ width: 13, height: 13, flexShrink: 0, marginTop: 2 }} />
                        <span>{t.programmingNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

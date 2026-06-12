"use client";

import { useState, useEffect } from "react";
import {
  Users, CalendarCheck, AlertCircle, AlertTriangle,
  Plus, Minus, Check, Clock,
  UserCheck, CheckCircle2,
} from "lucide-react";
import { programsApi } from "@/lib/api/programs";
import type { ProgramDetailDto } from "@/lib/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProgramSlug = string;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProgramHub({ slug }: { slug: ProgramSlug }) {
  const [detail, setDetail] = useState<ProgramDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    programsApi.getDetail(slug)
      .then((d) => { if (active) setDetail(d); })
      .catch(() => { if (active) setDetail(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const colorVar  = `var(--${slug})`;
  const fillVar   = `var(--${slug}-fill)`;
  const borderVar = `var(--${slug}-border)`;

  const label       = detail?.name         ?? slug.toUpperCase();
  const enrolled    = detail?.enrolledCount ?? 0;
  const attPct      = detail?.attendancePct ?? null;
  const alertCount  = detail?.alerts?.length ?? 0;
  const participants = detail?.participants ?? [];
  const events      = detail?.upcomingEvents ?? [];
  const staff       = detail?.staff ?? [];
  const alerts      = detail?.alerts ?? [];

  // derive "next session" label from the nearest upcoming event or sessions
  const nextSessionLabel = "—";
  const nextSessionMeta  = detail?.defaultLocation ?? "";

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>
            <span className={`ss-dot ${slug}`} style={{ marginRight: 8 }} />
            {label}
          </h1>
          <span className="date">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
        <div className="right">
          <button className="ss-btn ss-btn-primary" type="button">
            <Plus className="ss-btn-icon" />
            Add participant
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* stat strip */}
        <div className="adm-statgrid">
          <div className="adm-stat">
            <span className="label">Enrolled</span>
            <span className="num">{enrolled}</span>
            <span className="delta muted">
              <Minus />{detail ? "Current enrollment" : "No data yet"}
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Avg Attendance</span>
            <span className="num">{attPct !== null ? `${attPct}%` : "—"}</span>
            <span className="delta muted">
              <CalendarCheck />{detail?.sessionSchedule ?? "—"}
            </span>
          </div>
          <div className={`adm-stat${alertCount > 0 ? " is-danger" : ""}`}>
            <span className="label">Open Alerts</span>
            <span className="num">{alertCount}</span>
            <span className={`delta ${alertCount > 0 ? "danger" : "muted"}`}>
              {alertCount > 0 ? <AlertCircle /> : <Check />}
              {alertCount > 0 ? "Action required" : "All clear"}
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Next Session</span>
            <span className="num" style={{ fontSize: "var(--fs-h2)" }}>{nextSessionLabel}</span>
            <span className="delta muted">
              <Clock />{nextSessionMeta}
            </span>
          </div>
        </div>

        {/* row 2: participants + this week */}
        <div className="adm-row2">
          <div className="widget">
            <div className="widget-head">
              <Users className="ico" style={{ color: colorVar }} />
              <h3>Participants</h3>
              <a className="link" href="/students">View all</a>
            </div>
            <div className="widget-body">
              {participants.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--fg-tertiary)" }}>
                  No participants yet
                </div>
              ) : participants.map((p) => (
                <div className="list-row" key={p.id}>
                  <span className="ss-avatar sm" style={{ background: `var(--${slug}-fill)`, color: `var(--${slug})`, border: `0.5px solid var(--${slug}-border)` }}>
                    {p.initials}
                  </span>
                  <div className="grow">
                    <div className="nm">{p.fullName}</div>
                    {p.hasDocAlerts ? (
                      <div style={{ fontSize: 11, color: "var(--danger)", display: "flex", alignItems: "center", gap: 3 }}>
                        <AlertCircle style={{ width: 11, height: 11 }} />Document alert
                      </div>
                    ) : (
                      <div className="sub">{p.status}</div>
                    )}
                  </div>
                  <span className={`ss-badge ${p.status === "Active" ? "is-active" : p.status === "Attention" ? "is-attention" : ""}`}>
                    {p.status === "Active" ? <><CheckCircle2 />Active</> : p.status === "Attention" ? <><AlertTriangle />Attention</> : <><Clock />Prospective</>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <CalendarCheck className="ico" style={{ color: colorVar }} />
              <h3>This Week</h3>
              <a className="link" href="/calendar">Calendar</a>
            </div>
            <div className="widget-body">
              {events.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--fg-tertiary)" }}>
                  No upcoming events
                </div>
              ) : (
                <>
                  {events.slice(0, 3).map((e) => {
                    const d = new Date(e.date + "T12:00:00");
                    const day = d.toLocaleDateString("en-US", { weekday: "short" });
                    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <div className="event-row" key={e.id}>
                        <div className="event-date" style={{ background: fillVar, border: `0.5px solid ${borderVar}` }}>
                          <span className="d">{day}</span>
                          <span className="m">{date}</span>
                        </div>
                        <div className="body">
                          <div className="title">{e.title}</div>
                          <div className="meta">
                            <span className={`ss-dot ${slug}`} />{e.meta ?? e.location}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {events.length > 3 && (
                    <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "0.5px solid var(--border)" }}>
                      <div className="ss-label" style={{ marginBottom: 8 }}>More upcoming</div>
                      {events.slice(3).map((e) => {
                        const d = new Date(e.date + "T12:00:00");
                        const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        return (
                          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: "0.5px solid var(--border)" }}>
                            <div>
                              <div style={{ fontSize: 13, color: "var(--fg)" }}>{e.title}</div>
                              <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>{e.meta}</div>
                            </div>
                            <span style={{ fontSize: 12, color: "var(--fg-secondary)", whiteSpace: "nowrap", marginLeft: 12 }}>{date}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* row 3: alerts + staff */}
        <div className="adm-row2">
          <div className="widget">
            <div className="widget-head">
              <AlertTriangle className="ico" style={{ color: "var(--warning)" }} />
              <h3>Alerts</h3>
            </div>
            <div className="widget-body">
              {alerts.length > 0 ? alerts.map((a, i) => (
                <div className="alert-row" key={i}>
                  <AlertCircle style={{ color: "var(--danger)", width: 15, height: 15, flexShrink: 0, marginTop: 2 }} />
                  <div className="body">
                    <div className="txt">{a.message}</div>
                    <div className="sub">{a.severity}</div>
                  </div>
                  <a className="act" href="#">Review</a>
                </div>
              )) : (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <CheckCircle2 style={{ width: 20, height: 20, color: "var(--success)", margin: "0 auto 8px", display: "block" }} />
                  <div style={{ fontSize: 13, color: "var(--fg-secondary)" }}>No open alerts</div>
                </div>
              )}
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <UserCheck className="ico" style={{ color: "var(--primary)" }} />
              <h3>Staff</h3>
            </div>
            <div className="widget-body">
              {staff.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--fg-tertiary)" }}>
                  No staff assigned
                </div>
              ) : staff.map((s) => (
                <div className="list-row" key={s.id}>
                  <span className={`ss-avatar ${s.role.toLowerCase()} sm`}>{s.initials}</span>
                  <div className="grow">
                    <div className="nm">{s.fullName}</div>
                    <div className="sub">{s.role}</div>
                  </div>
                  <span className="ss-badge is-active"><Check />Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!loading && !detail && (
          <div className="ss-alert" style={{ marginTop: "var(--space-4)" }}>
            <AlertCircle />
            <span className="ss-alert-text">
              Could not load live data — make sure the backend is running on port 5208.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

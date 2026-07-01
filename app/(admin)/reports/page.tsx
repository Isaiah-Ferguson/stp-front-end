"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  TrendingUp,
  CalendarCheck,
  CheckSquare,
  AlertTriangle,
  Check,
  GraduationCap,
  Download,
  GitBranch,
} from "lucide-react";
import Widget from "../components/Widget";
import StatCard from "../components/StatCard";
import BarChart from "../components/BarChart";
import StaffList from "../components/StaffList";
import { reportsApi } from "@/lib/api/reports";
import { participantsApi } from "@/lib/api/participants";
import type { ReportsDto } from "@/lib/types/api";

const STATUS_ROWS: { key: "activeParticipants" | "prospective" | "attention" | "former"; label: string; cls: string }[] = [
  { key: "activeParticipants", label: "Active",          cls: "success" },
  { key: "prospective",        label: "Prospective",     cls: "info" },
  { key: "attention",          label: "Needs attention", cls: "danger" },
  { key: "former",             label: "Former",          cls: "neutral" },
];

function EmptyRow({ text }: { text: string }) {
  return <div style={{ padding: "18px 0", textAlign: "center", fontSize: 13, color: "var(--fg-tertiary)" }}>{text}</div>;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    reportsApi.get()
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, []);

  const dash = (v: React.ReactNode) => (loading ? "…" : v);

  const chartColumns = useMemo(
    () =>
      (report?.programs ?? []).map((p) => ({
        dotClass: p.slug,
        label: p.name,
        bars: [{ pct: p.attendancePct, day: "Attend." }],
      })),
    [report]
  );

  const staffItems = useMemo(
    () =>
      (report?.staffOnboarding ?? []).map((s) => ({
        nm: s.name,
        pct: s.pct,
        fill: s.pct === 100 ? "success" : s.pct >= 50 ? "warning" : "danger",
      })),
    [report]
  );

  function downloadCsv(rows: (string | number)[][], filename: string) {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stamp = () => new Date().toISOString().slice(0, 10);

  function exportSummary() {
    if (!report) return;
    downloadCsv(
      [
        ["Program", "Enrolled", "Attendance %", "Sessions"],
        ...report.programs.map((p) => [p.name, p.enrolled, p.attendancePct, p.sessions]),
        [],
        ["Total participants", report.totals.totalParticipants],
        ["Active", report.totals.activeParticipants],
        ["Prospective", report.totals.prospective],
        ["Needs attention", report.totals.attention],
        ["Former", report.totals.former],
        ["Avg attendance %", report.totals.avgAttendancePct],
        ["Marked present rate %", report.attendance.presentRatePct],
        ["Open tasks", report.totals.openTasks],
        ["Overdue tasks", report.totals.overdueTasks],
      ],
      `shining-stars-summary-${stamp()}.csv`
    );
  }

  async function exportRoster() {
    setExporting(true);
    try {
      const ps = await participantsApi.getAll();
      downloadCsv(
        [
          ["Name", "Program", "Status", "Attendance %", "Start Date"],
          ...ps.map((p) => [p.fullName, p.programName, p.status, p.attendancePct, p.startDate]),
        ],
        `participant-roster-${stamp()}.csv`
      );
    } catch {
      /* ignore — leave the page as-is */
    } finally {
      setExporting(false);
    }
  }

  const t = report?.totals;
  const att = report?.attendance;
  const maxStatus = t ? Math.max(t.activeParticipants, t.prospective, t.attention, t.former, 1) : 1;

  const th: React.CSSProperties = {
    textAlign: "left", padding: "8px 16px", fontSize: 11, fontWeight: 500,
    textTransform: "uppercase", letterSpacing: ".04em", color: "var(--fg-tertiary)", whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = { padding: "10px 16px", fontSize: 13 };

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Reports</h1>
          <span className="date">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
        <div className="right">
          <button className="ss-btn" type="button" onClick={exportSummary} disabled={!report}>
            <Download className="ss-btn-icon" />
            Summary CSV
          </button>
          <button className="ss-btn" type="button" onClick={exportRoster} disabled={exporting}>
            <Download className="ss-btn-icon" />
            {exporting ? "Exporting…" : "Roster CSV"}
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* KPI grid */}
        <div className="adm-statgrid">
          <StatCard
            label="Active Participants"
            num={dash(t?.activeParticipants ?? 0)}
            delta={<><Users />{t?.totalParticipants ?? 0} total · {t?.programs ?? 0} programs</>}
            deltaClass="muted"
          />
          <StatCard
            label="Avg Attendance"
            num={dash(t ? `${t.avgAttendancePct}%` : "—")}
            delta={<><TrendingUp />across all participants</>}
            deltaClass="muted"
          />
          <StatCard
            label="Marked Present Rate"
            num={dash(att ? `${att.presentRatePct}%` : "—")}
            delta={<><CalendarCheck />{att?.present ?? 0} present · {att?.absent ?? 0} absent</>}
            deltaClass="muted"
          />
          <StatCard
            label="Open Tasks"
            num={dash(t?.openTasks ?? 0)}
            delta={(t?.overdueTasks ?? 0) > 0 ? <><AlertTriangle />{t?.overdueTasks} overdue</> : <><Check /> on track</>}
            deltaClass={(t?.overdueTasks ?? 0) > 0 ? "warn" : "muted"}
            className={(t?.overdueTasks ?? 0) > 0 ? "is-warn" : undefined}
          />
        </div>

        {/* row 2: attendance-by-program + status breakdown */}
        <div className="adm-row2">
          <Widget id="att-prog-heading" title="Attendance by Program" icon={<BarChart3 className="ico ico--primary" />} bodyClass="widget-body--padded">
            {loading ? <EmptyRow text="Loading…" /> : chartColumns.length ? <BarChart columns={chartColumns} /> : <EmptyRow text="No programs yet" />}
          </Widget>

          <Widget id="status-heading" title="Participants by Status" icon={<GitBranch className="ico ico--primary" />} bodyClass="widget-body--padded">
            {loading || !t ? (
              <EmptyRow text="Loading…" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 0" }}>
                {STATUS_ROWS.map((row) => {
                  const count = t[row.key];
                  return (
                    <div key={row.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <span className={`ss-dot`} style={{ background: `var(--${row.cls})` }} />
                          {row.label}
                        </span>
                        <span style={{ fontWeight: 500 }}>{count}</span>
                      </div>
                      <div className="ss-progress">
                        <div className={`ss-progress-fill ${row.cls}`} style={{ width: `${Math.round((count / maxStatus) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Widget>
        </div>

        {/* enrollment by program table */}
        <Widget id="enroll-heading" title="Enrollment by Program" icon={<Users className="ico ico--primary" />}>
          {loading ? (
            <EmptyRow text="Loading…" />
          ) : report && report.programs.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                    <th style={th}>Program</th>
                    <th style={{ ...th, textAlign: "center" }}>Enrolled</th>
                    <th style={{ ...th, textAlign: "center" }}>Sessions</th>
                    <th style={{ ...th, textAlign: "left", width: "40%" }}>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {report.programs.map((p) => (
                    <tr key={p.slug} style={{ borderBottom: "0.5px solid var(--border)" }}>
                      <td style={td}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span className={`ss-dot ${p.slug}`} />
                          {p.name}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>{p.enrolled}</td>
                      <td style={{ ...td, textAlign: "center", color: "var(--fg-secondary)" }}>{p.sessions}</td>
                      <td style={td}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="ss-progress" style={{ flex: 1 }}>
                            <span className={`ss-progress-fill ${p.slug}`} style={{ width: `${p.attendancePct}%` }} />
                          </span>
                          <span style={{ fontSize: 12, color: "var(--fg-secondary)", minWidth: 34, textAlign: "right" }}>{p.attendancePct}%</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyRow text="No programs yet" />
          )}
        </Widget>

        {/* staff onboarding */}
        <Widget id="onboard-heading" title="Staff Onboarding" icon={<GraduationCap className="ico ico--primary" />}>
          {loading ? (
            <EmptyRow text="Loading…" />
          ) : staffItems.length ? (
            <>
              <div style={{ padding: "6px 16px 2px", fontSize: 12, color: "var(--fg-tertiary)" }}>
                {report?.totals.fullyOnboardedStaff ?? 0} of {report?.totals.staff ?? 0} fully onboarded
              </div>
              <StaffList items={staffItems} />
            </>
          ) : (
            <EmptyRow text="No staff yet" />
          )}
        </Widget>
      </div>
    </div>
  );
}

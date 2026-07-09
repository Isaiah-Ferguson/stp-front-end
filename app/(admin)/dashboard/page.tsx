"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Users,
  AlertTriangle,
  AlertCircle,
  Calendar,
  GitBranch,
  CheckSquare,
  UserCheck,
  BarChart3,
  Check,
} from "lucide-react";
import AlertList from "../components/AlertList";
import PipelineList from "../components/PipelineList";
import TasksList from "../components/TasksList";
import StaffList from "../components/StaffList";
import Widget from "../components/Widget";
import StatCard from "../components/StatCard";
import BarChart from "../components/BarChart";
import { dashboardApi } from "@/lib/api/dashboard";
import type {
  ParticipantSummaryDto,
  AttendanceRosterEntryDto,
  ProjectDto,
  StaffSummaryDto,
  ProgramSummaryDto,
  CalendarEventDto,
  ParticipantStatus,
} from "@/lib/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseDate = (s: string) => new Date(s + "T12:00:00");
const shortDate = (s: string) => parseDate(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const STATUS_BADGE: Record<ParticipantStatus, { type: string; text: string }> = {
  Active:      { type: "active",      text: "Active" },
  Prospective: { type: "prospective", text: "Prospective" },
  Attention:   { type: "attention",   text: "Needs attention" },
  Former:      { type: "info",        text: "Former" },
};
const STATUS_ORDER: Record<ParticipantStatus, number> = { Attention: 0, Prospective: 1, Active: 2, Former: 3 };

function EmptyRow({ text }: { text: string }) {
  return <div style={{ padding: "18px 0", textAlign: "center", fontSize: 13, color: "var(--fg-tertiary)" }}>{text}</div>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantSummaryDto[]>([]);
  const [roster, setRoster] = useState<AttendanceRosterEntryDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [staff, setStaff] = useState<StaffSummaryDto[]>([]);
  const [programs, setPrograms] = useState<ProgramSummaryDto[]>([]);
  const [events, setEvents] = useState<CalendarEventDto[]>([]);

  useEffect(() => {
    dashboardApi.get()
      .then((d) => {
        setParticipants(d.participants);
        setRoster(d.todayRoster);
        setProjects(d.projects);
        setStaff(d.staff);
        setPrograms(d.programs);
        setEvents(d.events);
      })
      .catch(() => { /* leave empty state */ })
      .finally(() => setLoading(false));
  }, []);

  const progSlugById = useMemo(
    () => Object.fromEntries(programs.map((p) => [p.id, p.slug])),
    [programs]
  );

  // ── Stats ────────────────────────────────────────────────────────────────────
  const activeCount = participants.filter((p) => p.status === "Active").length;
  const newThisMonth = useMemo(() => {
    const now = new Date();
    return participants.filter((p) => {
      const d = parseDate(p.startDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [participants]);

  const presentToday = roster.filter((r) => r.status === "Present").length;
  const rosterTotal = roster.length;
  const attPct = rosterTotal ? Math.round((presentToday / rosterTotal) * 100) : 0;

  const allTasks = useMemo(
    () => projects.flatMap((p) => p.tasks.map((t) => ({ t, project: p.title }))),
    [projects]
  );
  const openTasks = allTasks.filter((x) => x.t.taskStatus !== "Done");
  const overdueCount = allTasks.filter((x) => x.t.isOverdue || x.t.taskStatus === "Overdue").length;

  const docAlertParticipants = participants.filter((p) => p.hasDocAlerts);

  // ── Alerts ────────────────────────────────────────────────────────────────────
  const alertItems = useMemo(() => {
    type AlertSev = "danger" | "warning" | "info";
    const items: { severity: AlertSev; txt: string; sub: string; act: string }[] =
      docAlertParticipants.slice(0, 5).map((p) => ({
        severity: "danger",
        txt: `${p.fullName} — document alert`,
        sub: `${p.programName} · review documents`,
        act: "Review",
      }));
    const prospective = participants.filter((p) => p.status === "Prospective");
    if (prospective.length && items.length < 5) {
      items.push({
        severity: "info",
        txt: `${prospective.length} prospective participant${prospective.length > 1 ? "s" : ""} awaiting follow-up`,
        sub: "Assign a coordinator",
        act: "Assign",
      });
    }
    return items;
  }, [docAlertParticipants, participants]);

  // ── Upcoming events ────────────────────────────────────────────────────────────
  const upcoming = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
      .map((e) => {
        const d = parseDate(e.date);
        const slug = e.programId ? progSlugById[e.programId] : undefined;
        return {
          key: e.id,
          d: String(d.getDate()).padStart(2, "0"),
          month: d.toLocaleDateString("en-US", { month: "short" }),
          title: e.title,
          slug,
          meta: [e.programName, e.timeRange, e.location].filter(Boolean).join(" · "),
        };
      });
  }, [events, progSlugById]);

  // ── Pipeline ──────────────────────────────────────────────────────────────────
  const pipeline = useMemo(
    () =>
      participants
        .slice()
        .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
        .slice(0, 5)
        .map((p) => ({
          initials: p.initials,
          name: p.fullName,
          sub: p.programName,
          badge: STATUS_BADGE[p.status],
        })),
    [participants]
  );

  // ── Open tasks list ─────────────────────────────────────────────────────────────
  const taskItems = useMemo(
    () =>
      openTasks
        .slice()
        .sort((a, b) => (b.t.isOverdue ? 1 : 0) - (a.t.isOverdue ? 1 : 0))
        .slice(0, 4)
        .map((x) => ({
          nm: x.t.name,
          sub: x.project,
          due: x.t.isOverdue
            ? "Overdue"
            : x.t.dueDate
              ? `Due ${shortDate(x.t.dueDate)}`
              : x.t.taskStatus,
          overdue: x.t.isOverdue || x.t.taskStatus === "Overdue",
        })),
    [openTasks]
  );

  // ── Staff onboarding ─────────────────────────────────────────────────────────────
  const staffItems = useMemo(
    () =>
      staff
        .slice()
        .sort((a, b) => a.onboardingProgressPct - b.onboardingProgressPct)
        .slice(0, 5)
        .map((s) => ({
          nm: s.fullName,
          pct: s.onboardingProgressPct,
          fill: s.onboardingProgressPct === 100 ? "success" : s.onboardingProgressPct >= 50 ? "warning" : "danger",
        })),
    [staff]
  );

  // ── Attendance today by program (real data; replaces the mock weekly chart) ──────
  const chartColumns = useMemo(() => {
    const by = new Map<string, { name: string; present: number; total: number }>();
    roster.forEach((r) => {
      const cur = by.get(r.programSlug) ?? { name: r.programName, present: 0, total: 0 };
      cur.total += 1;
      if (r.status === "Present") cur.present += 1;
      by.set(r.programSlug, cur);
    });
    return Array.from(by.entries()).map(([slug, v]) => ({
      dotClass: slug,
      label: v.name,
      bars: [{ pct: v.total ? Math.round((v.present / v.total) * 100) : 0, day: "Today" }],
    }));
  }, [roster]);

  const dash = (v: React.ReactNode) => (loading ? "…" : v);

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Dashboard</h1>
          <span className="date">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
        <div className="right">
          <div className="row tight flex items-center gap-1.5">
            {programs.map((p) => (
              <span className="ss-chip ss-chip--static" key={p.id}>
                <span className={`ss-dot ${p.slug}`} />
                {p.name}
              </span>
            ))}
          </div>
          <Link href="/students" className="ss-btn ss-btn-primary">
            <Plus className="ss-btn-icon" />
            Add participant
          </Link>
        </div>
      </div>

      <div className="adm-content">
        {/* stat grid */}
        <div className="adm-statgrid">
          <StatCard
            label="Active Participants"
            num={dash(activeCount)}
            delta={newThisMonth > 0 ? <><TrendingUp /> +{newThisMonth} this month</> : <><Users /> {participants.length} total</>}
            deltaClass={newThisMonth > 0 ? "up" : "muted"}
          />
          <StatCard
            label="Attendance Today"
            num={dash(rosterTotal ? `${attPct}%` : "—")}
            delta={rosterTotal ? <><Users /> {presentToday} of {rosterTotal} present</> : <><Users /> No session today</>}
            deltaClass="muted"
          />
          <StatCard
            label="Open Tasks"
            num={dash(openTasks.length)}
            delta={overdueCount > 0 ? <><AlertTriangle />{overdueCount} overdue</> : <><Check /> On track</>}
            deltaClass={overdueCount > 0 ? "warn" : "muted"}
            className={overdueCount > 0 ? "is-warn" : undefined}
          />
          <StatCard
            label="Document Alerts"
            num={dash(docAlertParticipants.length)}
            delta={docAlertParticipants.length > 0 ? <><AlertCircle /> Need attention</> : <><Check /> All clear</>}
            deltaClass={docAlertParticipants.length > 0 ? "danger" : "muted"}
            className={docAlertParticipants.length > 0 ? "is-danger" : undefined}
          />
        </div>

        {/* row 2: alerts + events */}
        <div className="adm-row2">
          <Widget id="alerts-heading" title="Alerts" icon={<AlertTriangle className="ico ico--warning" />} linkText="View all">
            {loading ? <EmptyRow text="Loading…" /> : alertItems.length ? <AlertList items={alertItems} /> : <EmptyRow text="No open alerts" />}
          </Widget>

          <Widget id="events-heading" title="Upcoming Events" icon={<Calendar className="ico ico--primary" />} linkText="Calendar">
            {loading ? (
              <EmptyRow text="Loading…" />
            ) : upcoming.length ? (
              <div>
                {upcoming.map((e) => (
                  <div className="event-row" key={e.key}>
                    <div className="event-date">
                      <span className="d">{e.d}</span>
                      <span className="m">{e.month}</span>
                    </div>
                    <div className="body">
                      <div className="title">{e.title}</div>
                      <div className="meta">
                        {e.slug && <span className={`ss-dot ${e.slug}`} />}
                        {e.meta}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyRow text="No upcoming events" />
            )}
          </Widget>
        </div>

        {/* row 3: pipeline + tasks + onboarding */}
        <div className="adm-row3">
          <Widget id="pipeline-heading" title="Participant Pipeline" icon={<GitBranch className="ico ico--primary" />}>
            {loading ? <EmptyRow text="Loading…" /> : pipeline.length ? <PipelineList items={pipeline} /> : <EmptyRow text="No participants yet" />}
          </Widget>

          <Widget id="tasks-heading" title="Open Tasks" icon={<CheckSquare className="ico ico--primary" />}>
            {loading ? <EmptyRow text="Loading…" /> : taskItems.length ? <TasksList items={taskItems} /> : <EmptyRow text="No open tasks" />}
          </Widget>

          <Widget id="onboard-heading" title="Staff Onboarding" icon={<UserCheck className="ico ico--primary" />}>
            {loading ? <EmptyRow text="Loading…" /> : staffItems.length ? <StaffList items={staffItems} /> : <EmptyRow text="No staff yet" />}
          </Widget>
        </div>

        {/* attendance today by program */}
        <Widget id="attendance-heading" title="Attendance Today by Program" icon={<BarChart3 className="ico ico--primary" />} bodyClass="widget-body--padded">
          {loading ? (
            <EmptyRow text="Loading…" />
          ) : chartColumns.length ? (
            <BarChart columns={chartColumns} />
          ) : (
            <EmptyRow text="No attendance recorded today" />
          )}
        </Widget>
      </div>
    </div>
  );
}

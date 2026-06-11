import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Users,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  GitBranch,
  Clock,
  CheckCircle2,
  Flag,
  CheckSquare,
  Check,
  UserCheck,
  BarChart3,
} from "lucide-react";
import AlertList from "../components/AlertList";
import PipelineList from "../components/PipelineList";
import TasksList from "../components/TasksList";
import StaffList from "../components/StaffList";
import Widget from "../components/Widget";
import StatCard from "../components/StatCard";
import BarChart from "../components/BarChart";

/**
 * Admin Dashboard — full overview (stats, alerts, events, pipeline,
 * tasks, onboarding, attendance chart). Data is placeholder until APIs exist.
 */
export default function DashboardPage() {
  return (
    <div className="adm-main">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="adm-topbar">
        <div className="titles">
          <h1>Dashboard</h1>
          <span className="date">Thursday, June 5, 2026</span>
        </div>
        <div className="right">
          <div className="row tight flex items-center gap-1.5">
            <span className="ss-chip ss-chip--static">
              <span className="ss-dot mjc" />
              MJC
            </span>
            <span className="ss-chip ss-chip--static">
              <span className="ss-dot pathways" />
              Pathways
            </span>
            <span className="ss-chip ss-chip--static">
              <span className="ss-dot manteca" />
              Manteca PT
            </span>
            <span className="ss-chip ss-chip--static">
              <span className="ss-dot productions" />
              Productions
            </span>
          </div>
          <button className="ss-btn ss-btn-primary">
            <Plus className="ss-btn-icon" />
            Add participant
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* stat grid */}
        <div className="adm-statgrid">
          <StatCard label="Active Participants" num={48} delta={<><TrendingUp /> +3 this month</>} deltaClass="up" />
          <StatCard label="Attendance Today" num="82%" delta={<><Users /> 39 of 48 present</>} deltaClass="muted" />
          <StatCard label="Open Tasks" num={12} delta={<><AlertTriangle />3 overdue</>} deltaClass="warn" className="is-warn" />
          <StatCard label="Expiring Docs" num={5} delta={<><AlertCircle /> Within 30 days</>} deltaClass="danger" className="is-danger" />
        </div>

        {/* row 2: alerts + events */}
        <div className="adm-row2">
          <Widget id="alerts-heading" title="Alerts" icon={<AlertTriangle className="ico ico--warning" />} linkText="View all">
            <AlertList
              items={[
                { severity: "danger", txt: "Marcus T. — POS expires in 6 days", sub: "Pathways · renewal needed", act: "Renew" },
                { severity: "danger", txt: "Sofia R. — intake documents missing", sub: "MJC · blocking enrollment", act: "Upload" },
                { severity: "warning", txt: "Rachel M. — CPR certification expires Jul 1", sub: "Staff · schedule recertification", act: "Schedule" },
                { severity: "warning", txt: "Joss K. — TB clearance due", sub: "Manteca PT · request form", act: "Request" },
                { severity: "info", txt: "2 prospective participants — no follow-up", sub: "MJC, Pathways · assign coordinator", act: "Assign" },
              ]}
            />
          </Widget>

          <Widget id="events-heading" title="Upcoming Events" icon={<Calendar className="ico ico--primary" />} linkText="Calendar">
            <div>
              {[
                {
                  d: "06",
                  title: "Spring Showcase Rehearsal",
                  program: "productions",
                  meta: "Productions · 10:00 AM · Main Stage",
                },
                {
                  d: "09",
                  title: "New Student Orientation",
                  program: "mjc",
                  meta: "MJC · 1:00 PM · Room B",
                },
                {
                  d: "11",
                  title: "Staff CPR Recertification",
                  program: "staff",
                  meta: "Staff · 9:00 AM · Conf. Room",
                },
                {
                  d: "13",
                  title: "Family Open House",
                  program: "pathways",
                  meta: "Pathways · 4:00 PM · Studio 2",
                },
              ].map((e) => (
                <div className="event-row" key={e.title}>
                  <div className="event-date">
                    <span className="d">{e.d}</span>
                    <span className="m">Jun</span>
                  </div>
                  <div className="body">
                    <div className="title">{e.title}</div>
                    <div className="meta">
                      <span className={`ss-dot ${e.program}`} />
                      {e.meta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Widget>
        </div>

        {/* row 3: pipeline + tasks + onboarding */}
        <div className="adm-row3">
          <Widget id="pipeline-heading" title="Student Pipeline" icon={<GitBranch className="ico ico--primary" />}>
            <PipelineList
              items={[
                { initials: "AT", name: "Aaron T.", sub: "MJC", badge: { type: "prospective", text: "Prospective" } },
                { initials: "BL", name: "Bianca L.", sub: "Pathways", badge: { type: "active", text: "Active" } },
                { initials: "CM", name: "Carlos M.", sub: "Manteca PT", badge: { type: "attention", text: "Docs missing" } },
                { initials: "DW", name: "Dana W.", sub: "Pathways", badge: { type: "info", text: "6-week mark" } },
                { initials: "EH", name: "Eli H.", sub: "MJC", badge: { type: "active", text: "Active" } },
              ]}
            />
          </Widget>

          <Widget id="tasks-heading" title="Open Tasks" icon={<CheckSquare className="ico ico--primary" />}>
            <TasksList
              items={[
                { nm: "Submit POS renewal — Marcus T.", sub: "Pathways", due: "2 days overdue", overdue: true },
                { nm: "Collect intake docs — Sofia R.", sub: "MJC", due: "Overdue", overdue: true },
                { nm: "Schedule June assessment", sub: "Manteca PT", due: "Due Jun 9", overdue: false },
                { nm: "Confirm showcase volunteers", sub: "Productions", due: "Due Jun 12", overdue: false },
              ]}
            />
          </Widget>

          <Widget id="onboard-heading" title="Staff Onboarding" icon={<UserCheck className="ico ico--primary" />}>
            <StaffList
              items={[
                { nm: "Rachel M.", pct: 100, fill: "success" },
                { nm: "Devon P.", pct: 80, fill: "warning" },
                { nm: "Nina S.", pct: 60, fill: "warning" },
                { nm: "Omar B.", pct: 40, fill: "warning" },
                { nm: "Tariq J.", pct: 15, fill: "danger" },
              ]}
            />
          </Widget>
        </div>

        {/* attendance chart */}
        <Widget id="attendance-heading" title="Attendance This Week" icon={<BarChart3 className="ico ico--primary" />} bodyClass="widget-body--padded">
              <BarChart
                columns={[
                  { dotClass: "mjc", label: "MJC", bars: [ { pct: 88, day: "Mon" }, { pct: 92, day: "Wed" }, { pct: 79, day: "Fri" } ] },
                  { dotClass: "pathways", label: "Pathways", bars: [ { pct: 95, day: "Tue" }, { pct: 90, day: "Thu" } ] },
                  { dotClass: "manteca", label: "Manteca PT", bars: [ { pct: 74, day: "Mon" }, { pct: 81, day: "Wed" }, { pct: 85, day: "Fri" } ] },
                ]}
              />
        </Widget>
        </div>

        <p className="ss-meta">
          <Link href="/" className="text-primary">
            ← Back to home
          </Link>
        </p>
      </div>
  );
}

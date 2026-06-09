import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Users,
  AlertTriangle,
  AlertCircle,
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

/**
 * Admin Dashboard — full overview (stats, alerts, events, pipeline,
 * tasks, onboarding, attendance chart). Data is placeholder until APIs exist.
 */
export default function DashboardPage() {
  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Dashboard</h1>
          <span className="date">Thursday, June 5, 2026</span>
        </div>
        <div className="right">
          <div className="row tight" style={{ display: "flex", gap: 8 }}>
            <span className="ss-chip is-active mjc" style={{ cursor: "pointer" }}>
              All programs
            </span>
            <span className="ss-chip">
              <span className="ss-dot mjc" />
              MJC
            </span>
            <span className="ss-chip">
              <span className="ss-dot pathways" />
              Pathways
            </span>
            <span className="ss-chip">
              <span className="ss-dot manteca" />
              Manteca PT
            </span>
          </div>
          <button className="ss-btn ss-btn-primary">
            <Plus className="ss-btn-icon" />
            Quick add
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* stat grid */}
        <div className="adm-statgrid">
          <div className="adm-stat">
            <span className="label">Active Students</span>
            <span className="num">48</span>
            <span className="delta up">
              <TrendingUp />
              +3 this month
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Attendance Today</span>
            <span className="num">82%</span>
            <span className="delta muted">
              <Users />
              39 of 48 present
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Open Tasks</span>
            <span className="num">12</span>
            <span className="delta warn">
              <AlertTriangle />3 overdue
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Expiring Docs</span>
            <span className="num">5</span>
            <span className="delta danger">
              <AlertCircle />
              Within 30 days
            </span>
          </div>
        </div>

        {/* row 2: alerts + events */}
        <div className="adm-row2">
          <div className="widget">
            <div className="widget-head">
              <AlertTriangle className="ico" style={{ color: "var(--warning)" }} />
              <h3>Alerts</h3>
              <a className="link" href="#">
                View all
              </a>
            </div>
            <div className="widget-body">
              {[
                {
                  dot: "red",
                  txt: "Marcus T. — POS expires in 6 days",
                  sub: "Pathways · renewal needed",
                  act: "Renew →",
                },
                {
                  dot: "red",
                  txt: "Sofia R. — intake documents missing",
                  sub: "MJC · blocking enrollment",
                  act: "Upload →",
                },
                {
                  dot: "amber",
                  txt: "Rachel M. — CPR certification expires Jul 1",
                  sub: "Staff · schedule recert",
                  act: "Schedule →",
                },
                {
                  dot: "amber",
                  txt: "Joss K. — TB clearance due",
                  sub: "Manteca PT · request form",
                  act: "Request →",
                },
                {
                  dot: "blue",
                  txt: "2 prospective students — no follow-up",
                  sub: "MJC, Pathways · assign coordinator",
                  act: "Assign →",
                },
              ].map((a) => (
                <div className="alert-row" key={a.txt}>
                  <span className={`dot ${a.dot}`} />
                  <div className="body">
                    <div className="txt">{a.txt}</div>
                    <div className="sub">{a.sub}</div>
                  </div>
                  <a className="act" href="#">
                    {a.act}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <Calendar className="ico" style={{ color: "var(--primary)" }} />
              <h3>Upcoming Events</h3>
              <a className="link" href="#">
                Calendar
              </a>
            </div>
            <div className="widget-body">
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
          </div>
        </div>

        {/* row 3: pipeline + tasks + onboarding */}
        <div className="adm-row3">
          <div className="widget">
            <div className="widget-head">
              <GitBranch className="ico" style={{ color: "var(--primary)" }} />
              <h3>Student Pipeline</h3>
            </div>
            <div className="widget-body">
              <div className="list-row">
                <span className="ss-avatar coordinator sm">AT</span>
                <div className="grow">
                  <div className="nm">Aaron T.</div>
                  <div className="sub">MJC</div>
                </div>
                <span className="ss-badge is-prospective">
                  <Clock />
                  Prospective
                </span>
              </div>
              <div className="list-row">
                <span className="ss-avatar teacher sm">BL</span>
                <div className="grow">
                  <div className="nm">Bianca L.</div>
                  <div className="sub">Pathways</div>
                </div>
                <span className="ss-badge is-active">
                  <CheckCircle2 />
                  Active
                </span>
              </div>
              <div className="list-row">
                <span className="ss-avatar admin sm">CM</span>
                <div className="grow">
                  <div className="nm">Carlos M.</div>
                  <div className="sub">Manteca PT</div>
                </div>
                <span className="ss-badge is-attention">
                  <AlertCircle />
                  Docs missing
                </span>
              </div>
              <div className="list-row">
                <span className="ss-avatar teacher sm">DW</span>
                <div className="grow">
                  <div className="nm">Dana W.</div>
                  <div className="sub">Pathways</div>
                </div>
                <span
                  className="ss-badge"
                  style={{ background: "var(--info-fill)", color: "var(--info-text)" }}
                >
                  <Flag />
                  6-week mark
                </span>
              </div>
              <div className="list-row">
                <span className="ss-avatar coordinator sm">EH</span>
                <div className="grow">
                  <div className="nm">Eli H.</div>
                  <div className="sub">MJC</div>
                </div>
                <span className="ss-badge is-active">
                  <CheckCircle2 />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <CheckSquare className="ico" style={{ color: "var(--primary)" }} />
              <h3>Open Tasks</h3>
            </div>
            <div className="widget-body">
              {[
                { nm: "Submit POS renewal — Marcus T.", sub: "Pathways", due: "2 days overdue", overdue: true },
                { nm: "Collect intake docs — Sofia R.", sub: "MJC", due: "Overdue", overdue: true },
                { nm: "Schedule June assessment", sub: "Manteca PT", due: "Due Jun 9", overdue: false },
                { nm: "Confirm showcase volunteers", sub: "Productions", due: "Due Jun 12", overdue: false },
              ].map((t) => (
                <div className="task-row" key={t.nm}>
                  <span className="ss-checkbox">
                    <Check />
                  </span>
                  <div className="grow">
                    <div className="nm">{t.nm}</div>
                    <div className="sub">{t.sub}</div>
                  </div>
                  <span className={`due${t.overdue ? " overdue" : ""}`}>{t.due}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <UserCheck className="ico" style={{ color: "var(--primary)" }} />
              <h3>Staff Onboarding</h3>
            </div>
            <div className="widget-body">
              {[
                { nm: "Rachel M.", pct: 100, fill: "success" },
                { nm: "Devon P.", pct: 80, fill: "warning" },
                { nm: "Nina S.", pct: 60, fill: "warning" },
                { nm: "Omar B.", pct: 40, fill: "warning" },
                { nm: "Tariq J.", pct: 15, fill: "danger" },
              ].map((s) => (
                <div className="staff-row" key={s.nm}>
                  <div className="top">
                    <span className="nm">{s.nm}</span>
                    <span className="pct">{s.pct}%</span>
                  </div>
                  <div className="ss-progress">
                    <div className={`ss-progress-fill ${s.fill}`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* attendance chart */}
        <div className="widget">
          <div className="widget-head">
            <BarChart3 className="ico" style={{ color: "var(--primary)" }} />
            <h3>Attendance This Week</h3>
          </div>
          <div className="widget-body" style={{ padding: "var(--space-5) var(--space-4)" }}>
            <div className="chart3">
              <div className="chart-col">
                <div className="chart-head">
                  <span className="ss-dot mjc" />
                  MJC
                </div>
                <div className="bars">
                  {[
                    { pct: 88, day: "Mon" },
                    { pct: 92, day: "Wed" },
                    { pct: 79, day: "Fri" },
                  ].map((b) => (
                    <div className="bar-wrap" key={b.day}>
                      <span className="bar-pct">{b.pct}%</span>
                      <span className="bar mjc" style={{ height: `${b.pct}%` }} />
                      <span className="bar-day">{b.day}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chart-col">
                <div className="chart-head">
                  <span className="ss-dot pathways" />
                  Pathways
                </div>
                <div className="bars">
                  {[
                    { pct: 95, day: "Tue" },
                    { pct: 90, day: "Thu" },
                  ].map((b) => (
                    <div className="bar-wrap" key={b.day}>
                      <span className="bar-pct">{b.pct}%</span>
                      <span className="bar pathways" style={{ height: `${b.pct}%` }} />
                      <span className="bar-day">{b.day}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chart-col">
                <div className="chart-head">
                  <span className="ss-dot manteca" />
                  Manteca PT
                </div>
                <div className="bars">
                  {[
                    { pct: 74, day: "Mon" },
                    { pct: 81, day: "Wed" },
                    { pct: 85, day: "Fri" },
                  ].map((b) => (
                    <div className="bar-wrap" key={b.day}>
                      <span className="bar-pct">{b.pct}%</span>
                      <span className="bar manteca" style={{ height: `${b.pct}%` }} />
                      <span className="bar-day">{b.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="ss-meta">
          <Link href="/" style={{ color: "var(--primary)" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

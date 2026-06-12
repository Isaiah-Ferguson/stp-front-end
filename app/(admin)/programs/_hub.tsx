import {
  Users,
  CalendarCheck,
  AlertCircle,
  AlertTriangle,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  Clock,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ParticipantStatus = "present" | "absent" | null;

type Participant = {
  init: string; nm: string; role: string; group: string;
  alert: string | null; status: ParticipantStatus;
};
type Session      = { day: string; date: string; label: string; room: string; time: string };
type UpcomingEvent = { label: string; date: string; note: string };
type StaffMember  = { init: string; nm: string; role: string; title: string };
type Alert        = { nm: string; txt: string; sub: string; act: string };

type ProgramData = {
  label: string;
  enrolled: number;
  enrolledTone: "up" | "down" | "muted";
  enrolledDelta: string;
  attendancePct: number;
  sessionSchedule: string;
  alertCount: number;
  nextSession: string;
  nextMeta: string;
  participants: Participant[];
  sessions: Session[];
  upcoming: UpcomingEvent[];
  staff: StaffMember[];
  alerts: Alert[];
};

export type ProgramSlug = "mjc" | "pathways" | "manteca";

// ── Data ──────────────────────────────────────────────────────────────────────

const PROGRAMS: Record<ProgramSlug, ProgramData> = {
  mjc: {
    label: "MJC",
    enrolled: 7, enrolledTone: "up", enrolledDelta: "+1 this semester",
    attendancePct: 86, sessionSchedule: "Mon / Wed / Fri",
    alertCount: 2, nextSession: "Jun 9", nextMeta: "Monday · FH 152",
    participants: [
      { init: "KM", nm: "Kezia Morales", role: "admin",       group: "Group A", alert: null,                    status: "present" },
      { init: "MT", nm: "Marcus T.",      role: "teacher",     group: "Group A", alert: "POS expires in 6 days", status: null      },
      { init: "SR", nm: "Sofia Reyes",    role: "coordinator", group: "Group A", alert: "Intake docs missing",   status: "present" },
      { init: "EH", nm: "Eli Hart",       role: "admin",       group: "Group A", alert: null,                    status: "present" },
      { init: "AT", nm: "Aaron Torres",   role: "admin",       group: "Group B", alert: null,                    status: "present" },
      { init: "NR", nm: "Nina Ruiz",      role: "coordinator", group: "Group B", alert: null,                    status: "present" },
      { init: "LW", nm: "Leo Walsh",      role: "coordinator", group: "Group B", alert: null,                    status: "absent"  },
    ],
    sessions: [
      { day: "Mon", date: "Jun 9",  label: "Session 15", room: "FH 152", time: "9:00–11:30 AM" },
      { day: "Wed", date: "Jun 11", label: "Session 16", room: "FH 152", time: "9:00–11:30 AM" },
      { day: "Fri", date: "Jun 13", label: "Session 17", room: "FH 152", time: "9:00–11:30 AM" },
    ],
    upcoming: [
      { label: "Spring Showcase Rehearsal", date: "Jun 14", note: "Full cast · Main Stage" },
      { label: "End-of-term Assessment",    date: "Jun 20", note: "Room B · Rachel M." },
    ],
    staff: [
      { init: "RM", nm: "Rachel M.", role: "coordinator", title: "Lead Coordinator" },
      { init: "DP", nm: "Devon P.",  role: "teacher",     title: "Teaching Artist"  },
      { init: "NS", nm: "Nina S.",   role: "teacher",     title: "Teaching Artist"  },
    ],
    alerts: [
      { nm: "Marcus T.", txt: "POS expires in 6 days",   sub: "MJC · renewal needed",      act: "Renew"  },
      { nm: "Sofia R.",  txt: "Intake documents missing", sub: "MJC · blocking enrollment", act: "Upload" },
    ],
  },

  pathways: {
    label: "Pathways",
    enrolled: 5, enrolledTone: "muted", enrolledDelta: "Same as last semester",
    attendancePct: 91, sessionSchedule: "Tue / Thu",
    alertCount: 1, nextSession: "Jun 10", nextMeta: "Tuesday · Room C",
    participants: [
      { init: "AC", nm: "Aiden Cole",  role: "admin",       group: "Group A", alert: null,                   status: "present" },
      { init: "MS", nm: "Mia Soto",    role: "teacher",     group: "Group A", alert: null,                   status: "present" },
      { init: "JV", nm: "Jasmine V.",  role: "coordinator", group: "Group A", alert: null,                   status: "present" },
      { init: "TB", nm: "Tyler B.",    role: "admin",       group: "Group A", alert: "Attendance below 75%", status: null      },
      { init: "EG", nm: "Emma G.",     role: "teacher",     group: "Group B", alert: null,                   status: "absent"  },
    ],
    sessions: [
      { day: "Tue", date: "Jun 10", label: "Session 12", room: "Room C", time: "10:00 AM–12:30 PM" },
      { day: "Thu", date: "Jun 12", label: "Session 13", room: "Room C", time: "10:00 AM–12:30 PM" },
      { day: "Tue", date: "Jun 17", label: "Session 14", room: "Room C", time: "10:00 AM–12:30 PM" },
    ],
    upcoming: [
      { label: "Regional Theatre Workshop", date: "Jun 21", note: "All Pathways students · Bus pickup 9 AM" },
      { label: "Mid-term Check-in",         date: "Jun 24", note: "Room C · Joss K." },
    ],
    staff: [
      { init: "JK", nm: "Joss K.",  role: "coordinator", title: "Lead Coordinator" },
      { init: "ML", nm: "Maya L.",  role: "teacher",     title: "Teaching Artist"  },
    ],
    alerts: [
      { nm: "Tyler B.", txt: "Attendance below 75%", sub: "Pathways · at-risk of removal", act: "Review" },
    ],
  },

  manteca: {
    label: "Manteca PT",
    enrolled: 4, enrolledTone: "down", enrolledDelta: "−1 from last semester",
    attendancePct: 78, sessionSchedule: "Mon / Thu",
    alertCount: 0, nextSession: "Jun 12", nextMeta: "Thursday · Gym B",
    participants: [
      { init: "SO", nm: "Sam Obi",   role: "admin",       group: "Group A", alert: null, status: "present" },
      { init: "PK", nm: "Priya K.",  role: "teacher",     group: "Group A", alert: null, status: "present" },
      { init: "JF", nm: "Jordan F.", role: "coordinator", group: "Group A", alert: null, status: "absent"  },
      { init: "LM", nm: "Lucia M.",  role: "admin",       group: "Group A", alert: null, status: "present" },
    ],
    sessions: [
      { day: "Mon", date: "Jun 9",  label: "Session 8",  room: "Gym B", time: "1:00–3:00 PM" },
      { day: "Thu", date: "Jun 12", label: "Session 9",  room: "Gym B", time: "1:00–3:00 PM" },
      { day: "Mon", date: "Jun 16", label: "Session 10", room: "Gym B", time: "1:00–3:00 PM" },
    ],
    upcoming: [
      { label: "Script Reading",     date: "Jun 18", note: "Room A · Devon P." },
      { label: "Parent Observation", date: "Jun 25", note: "Gym B · All families welcome" },
    ],
    staff: [
      { init: "DP", nm: "Devon P.", role: "teacher",     title: "Lead Teaching Artist" },
      { init: "AT", nm: "Alex T.",  role: "coordinator", title: "Program Coordinator"  },
    ],
    alerts: [],
  },
};

const DELTA_ICONS = { up: TrendingUp, down: TrendingDown, muted: Minus };

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProgramHub({ slug }: { slug: ProgramSlug }) {
  const prog      = PROGRAMS[slug];
  const fillVar   = `var(--${slug}-fill)`;
  const borderVar = `var(--${slug}-border)`;
  const colorVar  = `var(--${slug})`;
  const DeltaIcon = DELTA_ICONS[prog.enrolledTone];

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>
            <span className={`ss-dot ${slug}`} style={{ marginRight: 8 }} />
            {prog.label}
          </h1>
          <span className="date">Thursday, June 5, 2026</span>
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
            <span className="num">{prog.enrolled}</span>
            <span className={`delta ${prog.enrolledTone}`}>
              <DeltaIcon />{prog.enrolledDelta}
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Avg Attendance</span>
            <span className="num">{prog.attendancePct}%</span>
            <span className="delta muted">
              <CalendarCheck />{prog.sessionSchedule}
            </span>
          </div>
          <div className={`adm-stat${prog.alertCount > 0 ? " is-danger" : ""}`}>
            <span className="label">Open Alerts</span>
            <span className="num">{prog.alertCount}</span>
            <span className={`delta ${prog.alertCount > 0 ? "danger" : "muted"}`}>
              {prog.alertCount > 0 ? <AlertCircle /> : <Check />}
              {prog.alertCount > 0 ? "Action required" : "All clear"}
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Next Session</span>
            <span className="num" style={{ fontSize: "var(--fs-h2)" }}>{prog.nextSession}</span>
            <span className="delta muted">
              <Clock />{prog.nextMeta}
            </span>
          </div>
        </div>

        {/* row 2: participants + this week */}
        <div className="adm-row2">
          <div className="widget">
            <div className="widget-head">
              <Users className="ico" style={{ color: colorVar }} />
              <h3>Participants</h3>
              <a className="link" href="#">View all</a>
            </div>
            <div className="widget-body">
              {prog.participants.map((p) => (
                <div className="list-row" key={p.nm}>
                  <span className={`ss-avatar ${p.role} sm`}>{p.init}</span>
                  <div className="grow">
                    <div className="nm">{p.nm}</div>
                    {p.alert ? (
                      <div style={{ fontSize: 11, color: "var(--danger)", display: "flex", alignItems: "center", gap: 3 }}>
                        <AlertCircle style={{ width: 11, height: 11 }} />{p.alert}
                      </div>
                    ) : (
                      <div className="sub">{p.group}</div>
                    )}
                  </div>
                  {p.status === "present" ? (
                    <span className="ss-badge is-active"><CheckCircle2 />Present</span>
                  ) : p.status === "absent" ? (
                    <span className="ss-badge is-attention"><AlertTriangle />Absent</span>
                  ) : (
                    <span className="ss-badge"><Clock />Unmarked</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <CalendarCheck className="ico" style={{ color: colorVar }} />
              <h3>This Week</h3>
              <a className="link" href="#">Calendar</a>
            </div>
            <div className="widget-body">
              {prog.sessions.map((s) => (
                <div className="event-row" key={s.label}>
                  <div className="event-date" style={{ background: fillVar, border: `0.5px solid ${borderVar}` }}>
                    <span className="d">{s.day}</span>
                    <span className="m">{s.date}</span>
                  </div>
                  <div className="body">
                    <div className="title">{s.label}</div>
                    <div className="meta">
                      <span className={`ss-dot ${slug}`} />{s.room} · {s.time}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "0.5px solid var(--border)" }}>
                <div className="ss-label" style={{ marginBottom: 8 }}>Upcoming</div>
                {prog.upcoming.map((e) => (
                  <div key={e.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--fg)" }}>{e.label}</div>
                      <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>{e.note}</div>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--fg-secondary)", whiteSpace: "nowrap", marginLeft: 12 }}>{e.date}</span>
                  </div>
                ))}
              </div>
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
              {prog.alerts.length > 0 ? prog.alerts.map((a) => (
                <div className="alert-row" key={a.nm} aria-label={`Urgent: ${a.nm} — ${a.txt}`}>
                  <AlertCircle style={{ color: "var(--danger)", width: 15, height: 15, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  <div className="body">
                    <div className="txt">{a.nm} — {a.txt}</div>
                    <div className="sub">{a.sub}</div>
                  </div>
                  <a className="act" href="#">{a.act}</a>
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
              {prog.staff.map((s) => (
                <div className="list-row" key={s.nm}>
                  <span className={`ss-avatar ${s.role} sm`}>{s.init}</span>
                  <div className="grow">
                    <div className="nm">{s.nm}</div>
                    <div className="sub">{s.title}</div>
                  </div>
                  <span className="ss-badge is-active"><Check />Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

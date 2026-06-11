import {
  Users,
  CalendarCheck,
  AlertCircle,
  AlertTriangle,
  Plus,
  TrendingUp,
  Check,
  Clock,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

type ParticipantStatus = "present" | "absent" | null;

const PARTICIPANTS: {
  init: string;
  nm: string;
  role: string;
  alert: string | null;
  status: ParticipantStatus;
}[] = [
  { init: "KM", nm: "Kezia Morales", role: "admin", alert: null, status: "present" },
  { init: "MT", nm: "Marcus T.", role: "teacher", alert: "POS expires in 6 days", status: null },
  { init: "SR", nm: "Sofia Reyes", role: "coordinator", alert: "Intake docs missing", status: "present" },
  { init: "EH", nm: "Eli Hart", role: "admin", alert: null, status: "present" },
  { init: "AT", nm: "Aaron Torres", role: "admin", alert: null, status: "present" },
  { init: "NR", nm: "Nina Ruiz", role: "coordinator", alert: null, status: "present" },
  { init: "LW", nm: "Leo Walsh", role: "coordinator", alert: null, status: "absent" },
];

const SESSIONS = [
  { day: "Mon", date: "Jun 9", label: "Session 15", room: "FH 152", time: "9:00–11:30 AM" },
  { day: "Wed", date: "Jun 11", label: "Session 16", room: "FH 152", time: "9:00–11:30 AM" },
  { day: "Fri", date: "Jun 13", label: "Session 17", room: "FH 152", time: "9:00–11:30 AM" },
];

const UPCOMING = [
  { label: "Spring Showcase Rehearsal", date: "Jun 14", note: "Full cast · Main Stage" },
  { label: "End-of-term Assessment", date: "Jun 20", note: "Room B · Rachel M." },
];

const STAFF = [
  { init: "RM", nm: "Rachel M.", role: "coordinator", title: "Lead Coordinator" },
  { init: "DP", nm: "Devon P.", role: "teacher", title: "Teaching Artist" },
  { init: "NS", nm: "Nina S.", role: "teacher", title: "Teaching Artist" },
];

const ALERTS = [
  {
    nm: "Marcus T.",
    txt: "POS expires in 6 days",
    sub: "Pathways · renewal needed",
    act: "Renew",
  },
  {
    nm: "Sofia R.",
    txt: "Intake documents missing",
    sub: "MJC · blocking enrollment",
    act: "Upload",
  },
];

export default function MJCProgramPage() {
  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>
            <span className="ss-dot mjc" style={{ marginRight: 8 }} />
            MJC
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
            <span className="num">7</span>
            <span className="delta up">
              <TrendingUp />
              +1 this semester
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Avg Attendance</span>
            <span className="num">86%</span>
            <span className="delta muted">
              <CalendarCheck />
              Mon / Wed / Fri
            </span>
          </div>
          <div className="adm-stat is-danger">
            <span className="label">Open Alerts</span>
            <span className="num">2</span>
            <span className="delta danger">
              <AlertCircle />
              Action required
            </span>
          </div>
          <div className="adm-stat">
            <span className="label">Next Session</span>
            <span className="num" style={{ fontSize: "var(--fs-h2)" }}>Jun 9</span>
            <span className="delta muted">
              <Clock />
              Monday · FH 152
            </span>
          </div>
        </div>

        {/* row 2: roster + schedule */}
        <div className="adm-row2">
          <div className="widget">
            <div className="widget-head">
              <Users className="ico" style={{ color: "var(--mjc)" }} />
              <h3>Participants</h3>
              <a className="link" href="#">View all</a>
            </div>
            <div className="widget-body">
              {PARTICIPANTS.map((p) => (
                <div className="list-row" key={p.nm}>
                  <span className={`ss-avatar ${p.role} sm`}>{p.init}</span>
                  <div className="grow">
                    <div className="nm">{p.nm}</div>
                    {p.alert ? (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--danger)",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <AlertCircle style={{ width: 11, height: 11 }} />
                        {p.alert}
                      </div>
                    ) : (
                      <div className="sub">Group A</div>
                    )}
                  </div>
                  {p.status === "present" ? (
                    <span className="ss-badge is-active">
                      <CheckCircle2 />
                      Present
                    </span>
                  ) : p.status === "absent" ? (
                    <span className="ss-badge is-attention">
                      <AlertTriangle />
                      Absent
                    </span>
                  ) : (
                    <span className="ss-badge">
                      <Clock />
                      Unmarked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <CalendarCheck className="ico" style={{ color: "var(--mjc)" }} />
              <h3>This Week</h3>
              <a className="link" href="#">Calendar</a>
            </div>
            <div className="widget-body">
              {SESSIONS.map((s) => (
                <div className="event-row" key={s.label}>
                  <div
                    className="event-date"
                    style={{
                      background: "var(--mjc-fill)",
                      border: "0.5px solid var(--mjc-border)",
                    }}
                  >
                    <span className="d">{s.day}</span>
                    <span className="m">{s.date}</span>
                  </div>
                  <div className="body">
                    <div className="title">{s.label}</div>
                    <div className="meta">
                      <span className="ss-dot mjc" />
                      {s.room} · {s.time}
                    </div>
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: "var(--space-3)",
                  paddingTop: "var(--space-3)",
                  borderTop: "0.5px solid var(--border)",
                }}
              >
                <div className="ss-label" style={{ marginBottom: 8 }}>Upcoming</div>
                {UPCOMING.map((e) => (
                  <div
                    key={e.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "6px 0",
                      borderBottom: "0.5px solid var(--border)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: "var(--fg)" }}>{e.label}</div>
                      <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>{e.note}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--fg-secondary)",
                        whiteSpace: "nowrap",
                        marginLeft: 12,
                      }}
                    >
                      {e.date}
                    </span>
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
              {ALERTS.map((a) => (
                <div className="alert-row" key={a.nm} aria-label={`Urgent: ${a.nm} — ${a.txt}`}>
                  <AlertCircle
                    style={{
                      color: "var(--danger)",
                      width: 15,
                      height: 15,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                    aria-hidden="true"
                  />
                  <div className="body">
                    <div className="txt">{a.nm} — {a.txt}</div>
                    <div className="sub">{a.sub}</div>
                  </div>
                  <a className="act" href="#">{a.act}</a>
                </div>
              ))}
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <UserCheck className="ico" style={{ color: "var(--primary)" }} />
              <h3>Staff</h3>
            </div>
            <div className="widget-body">
              {STAFF.map((s) => (
                <div className="list-row" key={s.nm}>
                  <span className={`ss-avatar ${s.role} sm`}>{s.init}</span>
                  <div className="grow">
                    <div className="nm">{s.nm}</div>
                    <div className="sub">{s.title}</div>
                  </div>
                  <span className="ss-badge is-active">
                    <Check />
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

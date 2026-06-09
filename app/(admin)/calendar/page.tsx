import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  User,
  Check,
} from "lucide-react";

type Evt = { cls: string; label: string };

function buildEvents(): Record<number, Evt[]> {
  const ev: Record<number, Evt[]> = {};
  const add = (d: number, cls: string, label: string) => {
    (ev[d] = ev[d] || []).push({ cls, label });
  };
  [2, 9, 16, 23, 30].forEach((d) => add(d, "mjc", "MJC · FH 152"));
  [4, 11, 18, 25].forEach((d) => add(d, "mjc", "MJC · FH 152"));
  [6, 13, 20, 27].forEach((d) => add(d, "mjc", "MJC · FH 210"));
  add(5, "mjc", "MJC · FH 152");
  [2, 9, 16, 23, 30].forEach((d) => add(d, "pathways", "Pathways"));
  [4, 11, 18, 25].forEach((d) => add(d, "pathways", "Pathways"));
  [3, 10, 17, 24].forEach((d) => add(d, "manteca", "Manteca PT"));
  [5, 12, 19, 26].forEach((d) => add(d, "manteca", "Manteca PT"));
  add(8, "staff", "Staff meeting");
  add(15, "staff", "New hire");
  add(12, "milestone", "★ Script lock");
  add(19, "milestone", "★ Casting posted");
  add(30, "milestone", "★ Tech week");
  return ev;
}

export default function CalendarPage() {
  const ev = buildEvents();
  const cells: { d: number; other: boolean }[] = [];
  for (let d = 1; d <= 30; d++) cells.push({ d, other: false });
  for (let d = 1; d <= 5; d++) cells.push({ d, other: true });

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Calendar</h1>
        </div>
        <div className="right">
          <div className="seg">
            <button className="is-active">Month</button>
            <button>Week</button>
            <button>Program</button>
          </div>
          <button className="ss-btn ss-btn-primary">
            <Plus className="ss-btn-icon" />
            Add event
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* filter bar */}
        <div className="row tight" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ss-chip is-active mjc">
            <span className="ss-dot mjc" />
            MJC
          </span>
          <span className="ss-chip is-active pathways">
            <span className="ss-dot pathways" />
            Pathways
          </span>
          <span className="ss-chip is-active manteca">
            <span className="ss-dot manteca" />
            Manteca PT
          </span>
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <span className="ss-chip is-active productions">
            <span className="ss-dot productions" />
            Productions
          </span>
          <span className="ss-chip is-active staff">
            <span className="ss-dot staff" />
            Staff
          </span>
        </div>

        <div className="cal-layout">
          {/* calendar area */}
          <div className="cal-area">
            <div className="cal-nav">
              <span className="arrow">
                <ChevronLeft />
              </span>
              <span className="arrow">
                <ChevronRight />
              </span>
              <span className="month">June 2026</span>
              <button className="ss-btn" style={{ marginLeft: 8, height: 32, minHeight: 32, padding: "0 14px" }}>
                Today
              </button>
            </div>

            <div className="cal-grid">
              <div className="cal-dow">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              <div className="cal-weeks">
                {cells.map((c, idx) => {
                  const evs = !c.other && ev[c.d] ? ev[c.d] : [];
                  const shown = evs.slice(0, 3);
                  const extra = evs.length - shown.length;
                  return (
                    <div
                      key={idx}
                      className={`cal-cell ${c.other ? "is-other" : ""} ${!c.other && c.d === 5 ? "is-today" : ""}`}
                    >
                      <span className="dnum">{c.d}</span>
                      {shown.map((e, i) => (
                        <span key={i} className={`evt ${e.cls}`}>
                          {e.label}
                        </span>
                      ))}
                      {extra > 0 ? <span className="more-link">+{extra} more</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* detail panel */}
          <div className="cal-detail">
            <div className="section">
              <div className="detail-h">Today — Jun 5</div>
              <div className="evt-card">
                <div className="et">
                  <span className="ss-dot mjc" />
                  MJC Session
                </div>
                <div className="em">
                  <MapPin />
                  FH 152
                </div>
                <div className="em">
                  <Clock />
                  9:00 – 11:30 AM
                </div>
                <div className="em">
                  <User />
                  Rachel M., Marisol R.
                </div>
              </div>
              <button className="btn-dashed">
                <Plus />
                Add event
              </button>
            </div>

            <div className="section">
              <div className="detail-h">Spring Production 2026</div>
              <div className="ms-row">
                <span className="ss-milestone-dot is-done" style={{ position: "static" }}>
                  <Check />
                </span>
                <span className="ms-l">Auditions</span>
                <span className="ms-d">May 22</span>
              </div>
              <div className="ms-row">
                <span className="ss-milestone-dot is-done" style={{ position: "static" }}>
                  <Check />
                </span>
                <span className="ms-l">Casting posted</span>
                <span className="ms-d">May 30</span>
              </div>
              <div className="ms-row">
                <span className="ss-milestone-dot is-active" style={{ position: "static" }} />
                <span className="ms-l">Script lock</span>
                <span className="ms-d" style={{ color: "#9a6a12", fontWeight: 500 }}>
                  Jun 12
                </span>
              </div>
              <div className="ms-row is-upcoming">
                <span className="ss-milestone-dot is-upcoming" style={{ position: "static" }} />
                <span className="ms-l">Rehearsals begin</span>
                <span className="ms-d">Jun 22</span>
              </div>
              <div className="ms-row is-upcoming">
                <span className="ss-milestone-dot is-upcoming" style={{ position: "static" }} />
                <span className="ms-l">Tech week</span>
                <span className="ms-d">Jun 30</span>
              </div>
              <button className="btn-dashed">
                <Plus />
                Add milestone
              </button>
            </div>

            <div className="section">
              <div className="detail-h">This Month</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div className="evt-card">
                  <div className="et">
                    <span className="ss-dot staff" />
                    All-staff meeting
                  </div>
                  <div className="em">
                    <Clock />
                    Mon Jun 8 · 8:30 AM
                  </div>
                </div>
                <div className="evt-card">
                  <div className="et">
                    <span className="ss-dot staff" />
                    New hire — Tariq J.
                  </div>
                  <div className="em">
                    <Clock />
                    Mon Jun 15 · starts
                  </div>
                </div>
                <div className="evt-card">
                  <div className="et">
                    <span className="ss-dot productions" />
                    Costume fitting
                  </div>
                  <div className="em">
                    <Clock />
                    Mon Jun 22 · 2:00 PM
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

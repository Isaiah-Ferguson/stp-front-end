"use client";

import { useState } from "react";
import {
  Download,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Loader,
  CircleDot,
  ChevronDown,
  Check,
  RefreshCw,
  AlertCircle,
  Upload,
  ListChecks,
  Pencil,
} from "lucide-react";

type CheckItem = { label: string; date: string; dateCls?: string };
type CheckSection = { label: string; items: CheckItem[] };

const JOSS_SECTIONS: CheckSection[] = [
  {
    label: "Documents & agreements",
    items: [
      { label: "Signed offer letter", date: "Feb 3" },
      { label: "Employee handbook acknowledgment", date: "Feb 4" },
      { label: "Confidentiality & ethics agreement", date: "Feb 4" },
    ],
  },
  {
    label: "Background & clearances",
    items: [
      { label: "Live Scan fingerprinting", date: "Feb 6" },
      { label: "CACI check", date: "Feb 7" },
      { label: "TB clearance", date: "Exp Feb 2028", dateCls: "var(--success-text)" },
    ],
  },
  {
    label: "Systems setup",
    items: [
      { label: "Email & calendar account", date: "Feb 5" },
      { label: "CRM access & role assigned", date: "Feb 5" },
      { label: "Remind teacher account", date: "Feb 6" },
      { label: "Building keycard & access", date: "Feb 6" },
      { label: "Payroll & direct deposit", date: "Feb 7" },
      { label: "Benefits enrollment", date: "Feb 9" },
    ],
  },
];

export default function StaffPage() {
  // index of expanded accordion; Joss K. (1) expanded by default
  const [expanded, setExpanded] = useState<number | null>(1);
  const toggle = (i: number) => setExpanded((cur) => (cur === i ? null : i));

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Staff Onboarding</h1>
        </div>
        <div className="right">
          <button className="ss-btn">
            <Download className="ss-btn-icon" />
            Export
          </button>
          <button className="ss-btn ss-btn-primary">
            <UserPlus className="ss-btn-icon" />
            Add staff member
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* stat row */}
        <div className="board-stats">
          <div className="board-stat"><span className="num">18</span><span className="label">Active Staff</span></div>
          <div className="board-stat"><span className="num green">13</span><span className="label">Fully Complete</span></div>
          <div className="board-stat"><span className="num amber">3</span><span className="label">In Progress</span></div>
          <div className="board-stat"><span className="num red">4</span><span className="label">Renewals Due</span></div>
        </div>

        {/* filter bar */}
        <div className="row tight" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ss-chip is-active mjc">All staff</span>
          <span className="ss-chip">Complete</span>
          <span className="ss-chip">In progress</span>
          <span className="ss-chip">New hires</span>
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <span className="ss-chip" style={{ background: "var(--danger-fill)", color: "var(--danger-text)", borderColor: "var(--danger-border)" }}>
            <AlertCircle style={{ width: 12, height: 12 }} />
            Renewals due
          </span>
        </div>

        <div className="staff-layout">
          {/* STAFF LIST */}
          <div className="staff-main">
            {/* Rachel M. — complete */}
            <div className={`sacc${expanded === 0 ? "" : " is-collapsed"}`}>
              <div className="sacc-head" onClick={() => toggle(0)}>
                <span className="ss-avatar teacher">RM</span>
                <div className="sacc-id" style={{ display: "block" }}>
                  <div className="nm">Rachel M.</div>
                  <div className="sub">Teacher · MJC · Hired Jan 10, 2026</div>
                </div>
                <div className="sacc-prog">
                  <div className="ss-progress">
                    <div className="ss-progress-fill success" style={{ width: "100%" }} />
                  </div>
                  <span className="pct">100%</span>
                </div>
                <span className="ss-badge is-active">
                  <CheckCircle2 />
                  Complete
                </span>
                <span className="sacc-chev">
                  <ChevronDown />
                </span>
              </div>
            </div>

            {/* Joss K. — expanded, renewal due */}
            <div className={`sacc${expanded === 1 ? "" : " is-collapsed"}`}>
              <div className="sacc-head" onClick={() => toggle(1)}>
                <span className="ss-avatar coordinator">JK</span>
                <div className="sacc-id" style={{ display: "block" }}>
                  <div className="nm">Joss K.</div>
                  <div className="sub">Teacher · MJC · Hired Feb 3, 2026</div>
                </div>
                <div className="sacc-prog">
                  <div className="ss-progress">
                    <div className="ss-progress-fill warning" style={{ width: "100%" }} />
                  </div>
                  <span className="pct">100%</span>
                </div>
                <span className="ss-badge is-prospective">
                  <AlertTriangle />
                  Renewal due
                </span>
                <span className="sacc-chev">
                  <ChevronDown />
                </span>
              </div>
              <div className="sacc-body">
                {JOSS_SECTIONS.slice(0, 2).map((sec) => (
                  <div className="check-sec" key={sec.label}>
                    <div className="check-sec-label">{sec.label}</div>
                    {sec.items.map((it) => (
                      <div className="ss-checkrow is-done" key={it.label}>
                        <span className="ss-checkbox is-checked">
                          <Check />
                        </span>
                        <span className="ss-checkrow-label">{it.label}</span>
                        <span className="ss-checkrow-date" style={it.dateCls ? { color: it.dateCls } : undefined}>
                          {it.date}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="check-sec">
                  <div className="check-sec-label">Training &amp; certifications</div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">Mandated reporter training</span>
                    <span className="ss-checkrow-date">Feb 10</span>
                  </div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">
                      CPR / First Aid certification{" "}
                      <span className="refresh-amber">
                        <RefreshCw />
                      </span>
                    </span>
                    <span className="ss-date-expired" style={{ marginLeft: "auto" }}>
                      <AlertCircle />
                      Exp Jun 1, 2026
                    </span>
                    <button className="ss-upload" style={{ marginLeft: 10 }}>
                      <Upload />
                      Upload renewal
                    </button>
                  </div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">Sexual harassment prevention</span>
                    <span className="ss-checkrow-date">Feb 11</span>
                  </div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">Safety &amp; emergency procedures</span>
                    <span className="ss-checkrow-date">Feb 12</span>
                  </div>
                  <div className="ss-checkrow is-done">
                    <span className="ss-checkbox is-checked"><Check /></span>
                    <span className="ss-checkrow-label">Incident reporting protocol</span>
                    <span className="ss-checkrow-date">Feb 12</span>
                  </div>
                </div>

                <div className="check-sec">
                  <div className="check-sec-label">{JOSS_SECTIONS[2].label}</div>
                  {JOSS_SECTIONS[2].items.map((it) => (
                    <div className="ss-checkrow is-done" key={it.label}>
                      <span className="ss-checkbox is-checked"><Check /></span>
                      <span className="ss-checkrow-label">{it.label}</span>
                      <span className="ss-checkrow-date">{it.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Maria S. — in progress */}
            <div className={`sacc${expanded === 2 ? "" : " is-collapsed"}`}>
              <div className="sacc-head" onClick={() => toggle(2)}>
                <span className="ss-avatar staff" style={{ background: "var(--staff)" }}>MS</span>
                <div className="sacc-id" style={{ display: "block" }}>
                  <div className="nm">Maria S.</div>
                  <div className="sub">Coordinator · All programs · Hired Apr 14, 2026</div>
                </div>
                <div className="sacc-prog">
                  <div className="ss-progress">
                    <div className="ss-progress-fill warning" style={{ width: "72%" }} />
                  </div>
                  <span className="pct">72%</span>
                </div>
                <span className="ss-badge is-prospective">
                  <Loader />
                  In progress
                </span>
                <span className="sacc-chev">
                  <ChevronDown />
                </span>
              </div>
            </div>

            {/* Casey T. — new hire */}
            <div className={`sacc${expanded === 3 ? "" : " is-collapsed"}`}>
              <div className="sacc-head" onClick={() => toggle(3)}>
                <span className="ss-avatar admin">CT</span>
                <div className="sacc-id" style={{ display: "block" }}>
                  <div className="nm">
                    Casey T. <span className="newhire-tag">New hire</span>
                  </div>
                  <div className="sub">Teacher · Manteca PT · Start date Jun 18, 2026</div>
                </div>
                <div className="sacc-prog">
                  <div className="ss-progress">
                    <div className="ss-progress-fill danger" style={{ width: "17%" }} />
                  </div>
                  <span className="pct">17%</span>
                </div>
                <span className="ss-badge is-attention">
                  <CircleDot />
                  Just started
                </span>
                <span className="sacc-chev">
                  <ChevronDown />
                </span>
              </div>
            </div>

            <button className="create-proj">
              <UserPlus />
              Add new staff member
            </button>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="staff-side">
            <div className="section">
              <div className="sec-head">
                <h3>Renewals &amp; Alerts</h3>
              </div>
              {[
                { dot: "red", txt: "Joss K. — CPR expired", sub: "Jun 1 · upload renewal" },
                { dot: "amber", txt: "Rachel M. — CPR expiring", sub: "Jul 1 · 26 days" },
                { dot: "amber", txt: "Maria S. — CACI pending", sub: "Background clearance" },
                { dot: "amber", txt: "Maria S. — benefits deadline", sub: "Enroll by Jun 14" },
              ].map((a) => (
                <div className="alert-row" key={a.txt}>
                  <span className={`dot ${a.dot}`} />
                  <div className="body">
                    <div className="txt">{a.txt}</div>
                    <div className="sub">{a.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="sec-head">
                <h3>Upcoming Renewals</h3>
              </div>
              {[
                { nm: "Joss K.", it: "CPR / First Aid", dt: "Jun 1", dtCls: "amber" },
                { nm: "Rachel M.", it: "CPR / First Aid", dt: "Jul 1", dtCls: "amber" },
                { nm: "Devon P.", it: "TB clearance", dt: "Sep 2026", dtCls: "green" },
                { nm: "Nina S.", it: "Mandated reporter", dt: "Nov 2026", dtCls: "green" },
              ].map((r) => (
                <div className="ren-row" key={r.nm}>
                  <div className="grow">
                    <div className="nm">{r.nm}</div>
                    <div className="it">{r.it}</div>
                  </div>
                  <span className={`dt ${r.dtCls}`}>{r.dt}</span>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="info-note">
                <ListChecks />
                <span>
                  Every staff member completes 18 items across 4 sections before
                  they&apos;re cleared to work with participants.
                </span>
              </div>
              <button className="btn-dashed">
                <Pencil />
                Edit checklist template
              </button>
            </div>

            <div className="section">
              <div className="sec-head">
                <h3>Overall Compliance</h3>
              </div>
              <div className="cbar">
                <div className="top">
                  <span>Complete</span>
                  <span className="pct" style={{ color: "var(--success-text)" }}>72%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill success" style={{ width: "72%" }} />
                </div>
              </div>
              <div className="cbar">
                <div className="top">
                  <span>In progress</span>
                  <span className="pct" style={{ color: "#9a6a12" }}>17%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill warning" style={{ width: "17%" }} />
                </div>
              </div>
              <div className="cbar">
                <div className="top">
                  <span>Renewals due</span>
                  <span className="pct" style={{ color: "var(--danger-text)" }}>11%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill danger" style={{ width: "11%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

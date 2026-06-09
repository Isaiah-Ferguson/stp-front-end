"use client";

import { useState } from "react";
import {
  FolderPlus,
  Plus,
  AlertCircle,
  Drama,
  UserPlus,
  Shield,
  Calendar,
  ChevronDown,
  Check,
  Loader,
  Lock,
  Circle,
  type LucideIcon,
} from "lucide-react";

type TaskStatus = "done" | "inprogress" | "overdue" | "blocked" | "upcoming";
type Prio = "high" | "med" | "low";

const TAG: Record<TaskStatus, { icon: LucideIcon; label: string }> = {
  done: { icon: Check, label: "Done" },
  inprogress: { icon: Loader, label: "In progress" },
  overdue: { icon: AlertCircle, label: "Overdue" },
  blocked: { icon: Lock, label: "Blocked" },
  upcoming: { icon: Circle, label: "Upcoming" },
};

type Task = {
  name: string;
  ctx?: string;
  ai: string;
  ar: string;
  an: string;
  due: string;
  status: TaskStatus;
  overdue?: boolean;
  prio: Prio;
};

type Project = {
  collapsed: boolean;
  icon: LucideIcon;
  iconcls: string;
  title: string;
  type: [string, string];
  status: [string, string];
  scope: string;
  frac: string;
  pct: number;
  barcls: string;
  alert: string;
  due: string;
  tasks: Task[];
};

const PROJECTS: Project[] = [
  {
    collapsed: false, icon: Drama, iconcls: "amber", title: "Spring Show 2026",
    type: ["production", "Production"], status: ["inprogress", "In progress"], scope: "All programs",
    frac: "9 / 24 done", pct: 38, barcls: "productions", alert: "2 overdue · 1 blocked", due: "Jul 19",
    tasks: [
      { name: "Finalize venue contract", ctx: "Pre-production", ai: "JD", ar: "admin", an: "Jamie D.", due: "May 30", status: "done", prio: "high" },
      { name: "Confirm audition schedule", ctx: "Casting", ai: "RM", ar: "teacher", an: "Rachel M.", due: "May 28", status: "done", prio: "med" },
      { name: "Lock script revisions", ctx: "Script lock — Jun 12", ai: "RM", ar: "teacher", an: "Rachel M.", due: "Jun 12", status: "inprogress", prio: "high" },
      { name: "Order costumes", ctx: "Wardrobe", ai: "JK", ar: "coordinator", an: "Joss K.", due: "Jun 2", status: "overdue", overdue: true, prio: "high" },
      { name: "Book accessible transport", ctx: "Logistics · awaiting budget", ai: "JD", ar: "admin", an: "Jamie D.", due: "Jun 4", status: "blocked", prio: "med" },
      { name: "Design program playbill", ctx: "Marketing", ai: "RM", ar: "teacher", an: "Rachel M.", due: "Jun 26", status: "upcoming", prio: "low" },
    ],
  },
  {
    collapsed: false, icon: UserPlus, iconcls: "gray", title: "New Staff Onboarding — Jun 2026",
    type: ["staff", "Staff task"], status: ["inprogress", "In progress"], scope: "Manteca PT",
    frac: "3 / 8 done", pct: 37, barcls: "", alert: "1 overdue", due: "Jun 25",
    tasks: [
      { name: "Collect signed offer letter", ctx: "Tariq J.", ai: "JD", ar: "admin", an: "Jamie D.", due: "May 29", status: "done", prio: "med" },
      { name: "Set up email & systems access", ctx: "IT", ai: "JD", ar: "admin", an: "Jamie D.", due: "Jun 1", status: "done", prio: "med" },
      { name: "Schedule CPR certification", ctx: "Compliance", ai: "RM", ar: "teacher", an: "Rachel M.", due: "Jun 3", status: "overdue", overdue: true, prio: "high" },
      { name: "Background check clearance", ctx: "HR", ai: "JD", ar: "admin", an: "Jamie D.", due: "Jun 18", status: "inprogress", prio: "high" },
      { name: "First-week shadow schedule", ctx: "Onboarding", ai: "JK", ar: "coordinator", an: "Joss K.", due: "Jun 22", status: "upcoming", prio: "low" },
    ],
  },
  {
    collapsed: true, icon: Shield, iconcls: "blue", title: "Compliance & Document Renewals",
    type: ["admin", "Admin task"], status: ["inprogress", "In progress"], scope: "All programs",
    frac: "2 / 6 done", pct: 33, barcls: "danger", alert: "2 overdue", due: "Jul 3", tasks: [],
  },
  {
    collapsed: true, icon: Calendar, iconcls: "teal", title: "Summer Program Planning",
    type: ["event", "Event planning"], status: ["planning", "Planning"], scope: "MJC, Pathways",
    frac: "0 / 9 done", pct: 0, barcls: "pathways", alert: "", due: "Aug 1", tasks: [],
  },
];

export default function TasksPage() {
  const [collapsed, setCollapsed] = useState<boolean[]>(PROJECTS.map((p) => p.collapsed));
  const [doneTasks, setDoneTasks] = useState<Record<string, boolean>>({});

  const toggleProject = (i: number) =>
    setCollapsed((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  const toggleTask = (key: string) =>
    setDoneTasks((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Tasks &amp; Projects</h1>
        </div>
        <div className="right">
          <div className="seg">
            <button className="is-active">By project</button>
            <button>My tasks</button>
            <button>All tasks</button>
          </div>
          <button className="ss-btn">
            <FolderPlus className="ss-btn-icon" />
            New project
          </button>
          <button className="ss-btn ss-btn-primary">
            <Plus className="ss-btn-icon" />
            New task
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* filter bar */}
        <div className="row tight" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ss-chip is-active mjc">All projects</span>
          <span className="ss-chip">Productions</span>
          <span className="ss-chip">Staff tasks</span>
          <span className="ss-chip">Admin</span>
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <span className="ss-chip is-active mjc">All assignees</span>
          <span className="ss-chip">
            <span className="ss-avatar teacher sm" style={{ width: 18, height: 18, fontSize: 9 }}>RM</span>
            Rachel M.
          </span>
          <span className="ss-chip">
            <span className="ss-avatar coordinator sm" style={{ width: 18, height: 18, fontSize: 9 }}>JK</span>
            Joss K.
          </span>
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <span className="ss-chip" style={{ background: "var(--danger-fill)", color: "var(--danger-text)", borderColor: "var(--danger-border)" }}>
            <AlertCircle style={{ width: 12, height: 12 }} />
            Overdue
          </span>
        </div>

        {/* stat strip */}
        <div className="board-stats">
          <div className="board-stat"><span className="num">4</span><span className="label">Projects</span></div>
          <div className="board-stat"><span className="num">38</span><span className="label">Total Tasks</span></div>
          <div className="board-stat"><span className="num green">14</span><span className="label">Done</span></div>
          <div className="board-stat"><span className="num red">5</span><span className="label">Overdue</span></div>
          <div className="board-stat"><span className="num amber">3</span><span className="label">Blocked</span></div>
        </div>

        {/* projects */}
        {PROJECTS.map((p, idx) => {
          const ProjIcon = p.icon;
          return (
            <div className={`proj${collapsed[idx] ? " is-collapsed" : ""}`} key={p.title}>
              <div className="proj-head" onClick={() => toggleProject(idx)}>
                <span className="proj-chev">
                  <ChevronDown />
                </span>
                <span className={`proj-icon ${p.iconcls}`}>
                  <ProjIcon />
                </span>
                <div className="proj-titlewrap">
                  <div className="proj-titlerow">
                    <span className="proj-title">{p.title}</span>
                    <span className={`tbadge ${p.type[0]}`}>{p.type[1]}</span>
                    <span className={`sbadge ${p.status[0]}`}>{p.status[1]}</span>
                  </div>
                  <div className="proj-sub">
                    <span>{p.scope}</span>
                    {p.alert ? (
                      <>
                        <span className="sep">·</span>
                        <span className="alert-txt">{p.alert}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="proj-progress">
                  <div className="pp-frac">{p.frac}</div>
                  <div className="ss-progress">
                    <div className={`ss-progress-fill ${p.barcls}`} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
                <div className="proj-due">{p.due}</div>
              </div>
              {p.tasks.length ? (
                <div className="proj-body">
                  <table className="tbl">
                    <tbody>
                      {p.tasks.map((t) => {
                        const key = `${p.title}:${t.name}`;
                        const isDone = doneTasks[key] ?? t.status === "done";
                        const Tag = TAG[t.status].icon;
                        return (
                          <tr key={t.name} className={isDone ? "task-row-done" : ""}>
                            <td style={{ width: 34 }}>
                              <span
                                className={`ss-checkbox${isDone ? " is-checked" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTask(key);
                                }}
                              >
                                <Check />
                              </span>
                            </td>
                            <td>
                              <div className="task-name">
                                <span className="tn">{t.name}</span>
                                {t.ctx ? <span className="tc">{t.ctx}</span> : null}
                              </div>
                            </td>
                            <td>
                              <span className="assignee">
                                <span className={`ss-avatar ${t.ar} sm`}>{t.ai}</span>
                                <span>{t.an}</span>
                              </span>
                            </td>
                            <td className={`td-due ${t.overdue ? "overdue" : ""}`}>{t.due}</td>
                            <td>
                              <span className={`tag ${t.status}`}>
                                <Tag />
                                {TAG[t.status].label}
                              </span>
                            </td>
                            <td style={{ width: 40, textAlign: "center" }}>
                              <span className={`prio ${t.prio}`} title={`${t.prio} priority`} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="add-task">
                    <Plus />
                    Add task to {p.title}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        <button className="create-proj">
          <FolderPlus />
          Create new project
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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
  X,
  type LucideIcon,
} from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import { staffApi } from "@/lib/api/staff";
import type {
  ProjectDto,
  ProjectTaskDto,
  StaffSummaryDto,
  ProjectType,
} from "@/lib/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = "done" | "inprogress" | "overdue" | "blocked" | "upcoming";
type Prio = "high" | "med" | "low";

const TAG: Record<TaskStatus, { icon: LucideIcon; label: string }> = {
  done:       { icon: Check,        label: "Done" },
  inprogress: { icon: Loader,       label: "In progress" },
  overdue:    { icon: AlertCircle,  label: "Overdue" },
  blocked:    { icon: Lock,         label: "Blocked" },
  upcoming:   { icon: Circle,       label: "Upcoming" },
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
  id: string;
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

// ── Mapping helpers ───────────────────────────────────────────────────────────

const TYPE_ICON: Record<ProjectType, LucideIcon> = {
  Production: Drama,
  Staff: UserPlus,
  Admin: Shield,
  Event: Calendar,
};

const TYPE_CLS: Record<ProjectType, string> = {
  Production: "amber",
  Staff:      "gray",
  Admin:      "blue",
  Event:      "teal",
};

const TYPE_BARCLS: Record<ProjectType, string> = {
  Production: "productions",
  Staff:      "",
  Admin:      "danger",
  Event:      "pathways",
};

const STATUS_LABEL: Record<string, string> = {
  inprogress: "In progress",
  planning:   "Planning",
  blocked:    "Blocked",
  done:       "Done",
};

const TASK_STATUS_MAP: Record<string, TaskStatus> = {
  Upcoming:   "upcoming",
  InProgress: "inprogress",
  Done:       "done",
  Overdue:    "overdue",
  Blocked:    "blocked",
};

const PRIO_MAP: Record<string, Prio> = {
  High:   "high",
  Medium: "med",
  Low:    "low",
};

const PRIO_API_MAP: Record<Prio, string> = {
  high: "High",
  med:  "Medium",
  low:  "Low",
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.split("T")[0] + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dtoToTask(dto: ProjectTaskDto, staffList: StaffSummaryDto[]): Task {
  const staff = staffList.find((s) => s.id === dto.assignedToId);
  const arole = staff ? staff.role.toLowerCase() : "admin";
  return {
    name: dto.name,
    ctx: dto.context ?? undefined,
    ai: dto.assignedToInitials ?? "?",
    ar: arole,
    an: dto.assignedToName ?? "Unassigned",
    due: formatDueDate(dto.dueDate),
    status: TASK_STATUS_MAP[dto.taskStatus] ?? "upcoming",
    overdue: dto.isOverdue,
    prio: PRIO_MAP[dto.priority] ?? "med",
  };
}

function dtoToProject(dto: ProjectDto, staffList: StaffSummaryDto[]): Project {
  const tasks = dto.tasks.map((t) => dtoToTask(t, staffList));
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => t.overdue || t.status === "overdue").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const alertParts: string[] = [];
  if (overdue > 0) alertParts.push(`${overdue} overdue`);
  if (blocked > 0) alertParts.push(`${blocked} blocked`);

  return {
    id: dto.id,
    collapsed: true,
    icon: TYPE_ICON[dto.type] ?? Drama,
    iconcls: TYPE_CLS[dto.type] ?? "amber",
    title: dto.title,
    type: [dto.type.toLowerCase(), dto.type],
    status: [dto.status, STATUS_LABEL[dto.status] ?? dto.status],
    scope: dto.scope ?? "All programs",
    frac: `${done} / ${tasks.length} done`,
    pct: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
    barcls: TYPE_BARCLS[dto.type] ?? "",
    alert: alertParts.join(" · "),
    due: formatDueDate(dto.dueDate),
    tasks,
  };
}

// ── Add Task Modal ────────────────────────────────────────────────────────────

type AddTaskForm = {
  name: string;
  ctx: string;
  projectIdx: number | null;
  assigneeId: string;
  due: string;
  prio: Prio;
  status: "upcoming" | "inprogress" | "blocked";
};

const EMPTY_TASK_FORM: AddTaskForm = {
  name: "", ctx: "", projectIdx: null, assigneeId: "", due: "", prio: "med", status: "upcoming",
};

function AddTaskModal({
  form,
  setForm,
  projects,
  staffList,
  onClose,
  onSubmit,
}: {
  form: AddTaskForm;
  setForm: React.Dispatch<React.SetStateAction<AddTaskForm>>;
  projects: Project[];
  staffList: StaffSummaryDto[];
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = form.name.trim().length > 0 && form.projectIdx !== null;
  const targetProject = form.projectIdx !== null ? projects[form.projectIdx] : null;
  const TargetIcon = targetProject?.icon;

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)",
    padding: "8px 12px", fontSize: 13, color: "var(--fg)",
    background: "var(--surface)", outline: "none",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "var(--space-4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(500px, 100%)", display: "flex", flexDirection: "column", border: "0.5px solid var(--border-hover)", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>
              {targetProject ? `Add task to ${targetProject.title}` : "Add task"}
            </h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>Task will appear in the project list</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, borderRadius: "var(--r-sm)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto" }}>
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Task name <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <input type="text" placeholder="e.g. Order props for Act 2" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} autoFocus />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Project <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            {targetProject && TargetIcon ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: "var(--r-md)", border: "0.5px solid var(--border)", background: "var(--bg-secondary)", fontSize: 13, color: "var(--fg)" }}>
                <TargetIcon style={{ width: 13, height: 13, color: "var(--fg-secondary)" }} />
                {targetProject.title}
              </div>
            ) : (
              <select value={form.projectIdx ?? ""} onChange={(e) => setForm((f) => ({ ...f, projectIdx: e.target.value === "" ? null : Number(e.target.value) }))} style={inputStyle}>
                <option value="">Select a project…</option>
                {projects.map((p, i) => <option key={p.id} value={i}>{p.title}</option>)}
              </select>
            )}
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Context <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional — e.g. Wardrobe, HR</span></div>
            <input type="text" placeholder="e.g. Wardrobe" value={form.ctx} onChange={(e) => setForm((f) => ({ ...f, ctx: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Assignee <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional</span></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {staffList.map((s) => {
                const selected = form.assigneeId === s.id;
                return (
                  <button key={s.id} type="button" onClick={() => setForm((f) => ({ ...f, assigneeId: f.assigneeId === s.id ? "" : s.id }))}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: "var(--r-pill)", border: `0.5px solid ${selected ? "var(--border-hover)" : "var(--border)"}`, background: selected ? "var(--bg-secondary)" : "var(--surface)", color: selected ? "var(--fg)" : "var(--fg-secondary)", cursor: "pointer", fontSize: 13 }}>
                    <span className={`ss-avatar ${s.role.toLowerCase()} sm`} style={{ width: 20, height: 20, fontSize: 9, flexShrink: 0 }}>{s.initials}</span>
                    {s.fullName}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Due date <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional</span></div>
            <input type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} style={{ ...inputStyle, width: "55%" }} />
          </div>

          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
            <div>
              <div className="ss-label" style={{ marginBottom: 8 }}>Priority</div>
              <div style={{ display: "flex", gap: 5 }}>
                {(["high", "med", "low"] as Prio[]).map((p) => (
                  <button key={p} type="button" className={`ss-chip${form.prio === p ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setForm((f) => ({ ...f, prio: p }))}>
                    <span className={`prio ${p}`} />{p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="ss-label" style={{ marginBottom: 8 }}>Status</div>
              <div style={{ display: "flex", gap: 5 }}>
                {([["upcoming", "Upcoming"], ["inprogress", "In progress"], ["blocked", "Blocked"]] as [AddTaskForm["status"], string][]).map(([s, label]) => (
                  <button key={s} type="button" className={`ss-chip${form.status === s ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setForm((f) => ({ ...f, status: s }))}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="ss-btn" type="button" onClick={onClose}>Cancel</button>
          <button className="ss-btn ss-btn-primary" type="button" onClick={onSubmit} disabled={!canSubmit}>
            <Plus className="ss-btn-icon" />Add task
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<StaffSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<boolean[]>([]);
  const [doneTasks, setDoneTasks] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddTaskForm>(EMPTY_TASK_FORM);

  useEffect(() => {
    Promise.all([tasksApi.getProjects(), staffApi.getAll()])
      .then(([projs, staff]) => {
        const mapped = projs.map((p) => dtoToProject(p, staff));
        setProjects(mapped);
        setCollapsed(mapped.map(() => true));
        setStaffList(staff);
      })
      .catch(() => {
        setProjects([]);
        setCollapsed([]);
        setStaffList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // derived stats
  const allTasks = projects.flatMap((p) => p.tasks);
  const stats = {
    projects: projects.length,
    total:    allTasks.length,
    done:     allTasks.filter((t) => t.status === "done").length,
    overdue:  allTasks.filter((t) => t.overdue || t.status === "overdue").length,
    blocked:  allTasks.filter((t) => t.status === "blocked").length,
  };

  const toggleProject = (i: number) =>
    setCollapsed((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  const toggleTask = (key: string) =>
    setDoneTasks((prev) => ({ ...prev, [key]: !prev[key] }));

  function openModal(targetProjectIdx: number | null = null) {
    setForm({ ...EMPTY_TASK_FORM, projectIdx: targetProjectIdx });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); }

  async function handleSubmit() {
    if (form.projectIdx === null) return;
    const proj = projects[form.projectIdx];
    const assignee = staffList.find((s) => s.id === form.assigneeId);

    const task: Task = {
      name: form.name.trim(),
      ctx: form.ctx.trim() || undefined,
      ai: assignee?.initials ?? "?",
      ar: assignee?.role.toLowerCase() ?? "admin",
      an: assignee?.fullName ?? "Unassigned",
      due: formatDueDate(form.due || null),
      status: form.status,
      overdue: false,
      prio: form.prio,
    };

    // optimistic update
    setProjects((prev) => prev.map((p, i) =>
      i === form.projectIdx ? { ...p, tasks: [...p.tasks, task] } : p
    ));
    if (collapsed[form.projectIdx]) {
      setCollapsed((prev) => prev.map((c, i) => (i === form.projectIdx ? false : c)));
    }
    closeModal();

    // fire and forget to API
    try {
      await tasksApi.addTask(proj.id, {
        projectId: proj.id,
        name: form.name.trim(),
        context: form.ctx.trim() || undefined,
        assignedToId: form.assigneeId || undefined,
        priority: PRIO_API_MAP[form.prio] as "High" | "Medium" | "Low",
        dueDate: form.due || undefined,
      });
    } catch { /* optimistic add already visible */ }
  }

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
          <button className="ss-btn" type="button">
            <FolderPlus className="ss-btn-icon" />New project
          </button>
          <button className="ss-btn ss-btn-primary" type="button" onClick={() => openModal(null)}>
            <Plus className="ss-btn-icon" />New task
          </button>
        </div>
      </div>

      <div className="adm-content">
        <div className="row tight" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ss-chip is-active mjc">All projects</span>
          <span className="ss-chip">Productions</span>
          <span className="ss-chip">Staff tasks</span>
          <span className="ss-chip">Admin</span>
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <span className="ss-chip is-active mjc">All assignees</span>
          {staffList.slice(0, 3).map((s) => (
            <span key={s.id} className="ss-chip">
              <span className={`ss-avatar ${s.role.toLowerCase()} sm`} style={{ width: 18, height: 18, fontSize: 9 }}>{s.initials}</span>
              {s.fullName}
            </span>
          ))}
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <span className="ss-chip" style={{ background: "var(--danger-fill)", color: "var(--danger-text)", borderColor: "var(--danger-border)" }}>
            <AlertCircle style={{ width: 12, height: 12 }} />Overdue
          </span>
        </div>

        <div className="board-stats">
          <div className="board-stat"><span className="num">{stats.projects}</span><span className="label">Projects</span></div>
          <div className="board-stat"><span className="num">{stats.total}</span><span className="label">Total Tasks</span></div>
          <div className="board-stat"><span className="num green">{stats.done}</span><span className="label">Done</span></div>
          <div className="board-stat"><span className="num red">{stats.overdue}</span><span className="label">Overdue</span></div>
          <div className="board-stat"><span className="num amber">{stats.blocked}</span><span className="label">Blocked</span></div>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>
            Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>
            No projects yet — create one to get started.
          </div>
        ) : projects.map((p, idx) => {
          const ProjIcon = p.icon;
          return (
            <div className={`proj${collapsed[idx] ? " is-collapsed" : ""}`} key={p.id}>
              <div className="proj-head" onClick={() => toggleProject(idx)}>
                <span className="proj-chev"><ChevronDown /></span>
                <span className={`proj-icon ${p.iconcls}`}><ProjIcon /></span>
                <div className="proj-titlewrap">
                  <div className="proj-titlerow">
                    <span className="proj-title">{p.title}</span>
                    <span className={`tbadge ${p.type[0]}`}>{p.type[1]}</span>
                    <span className={`sbadge ${p.status[0]}`}>{p.status[1]}</span>
                  </div>
                  <div className="proj-sub">
                    <span>{p.scope}</span>
                    {p.alert ? (
                      <><span className="sep">·</span><span className="alert-txt">{p.alert}</span></>
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
              <div className="proj-body">
                {p.tasks.length > 0 && (
                  <table className="tbl">
                    <tbody>
                      {p.tasks.map((t) => {
                        const key = `${p.id}:${t.name}`;
                        const isDone = doneTasks[key] ?? t.status === "done";
                        const Tag = TAG[t.status].icon;
                        return (
                          <tr key={key} className={isDone ? "task-row-done" : ""}>
                            <td style={{ width: 34 }}>
                              <span className={`ss-checkbox${isDone ? " is-checked" : ""}`} onClick={(e) => { e.stopPropagation(); toggleTask(key); }}>
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
                )}
                <div className="add-task" role="button" tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); openModal(idx); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openModal(idx); }}>
                  <Plus />Add task to {p.title}
                </div>
              </div>
            </div>
          );
        })}

        <button className="create-proj" type="button">
          <FolderPlus />Create new project
        </button>
      </div>

      {modalOpen && (
        <AddTaskModal form={form} setForm={setForm} projects={projects} staffList={staffList} onClose={closeModal} onSubmit={handleSubmit} />
      )}
    </div>
  );
}

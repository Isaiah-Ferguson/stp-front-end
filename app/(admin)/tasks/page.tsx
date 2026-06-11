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
  X,
  type LucideIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Data ──────────────────────────────────────────────────────────────────────

const ASSIGNEES = [
  { key: "JD", init: "JD", role: "admin",       name: "Jamie D." },
  { key: "RM", init: "RM", role: "teacher",      name: "Rachel M." },
  { key: "JK", init: "JK", role: "coordinator",  name: "Joss K." },
] as const;

type AssigneeKey = (typeof ASSIGNEES)[number]["key"] | "";

const INITIAL_PROJECTS: Project[] = [
  {
    collapsed: false, icon: Drama, iconcls: "amber", title: "Spring Show 2026",
    type: ["production", "Production"], status: ["inprogress", "In progress"], scope: "All programs",
    frac: "9 / 24 done", pct: 38, barcls: "productions", alert: "2 overdue · 1 blocked", due: "Jul 19",
    tasks: [
      { name: "Finalize venue contract",   ctx: "Pre-production",               ai: "JD", ar: "admin",       an: "Jamie D.",  due: "May 30", status: "done",       prio: "high" },
      { name: "Confirm audition schedule", ctx: "Casting",                      ai: "RM", ar: "teacher",     an: "Rachel M.", due: "May 28", status: "done",       prio: "med"  },
      { name: "Lock script revisions",     ctx: "Script lock — Jun 12",         ai: "RM", ar: "teacher",     an: "Rachel M.", due: "Jun 12", status: "inprogress", prio: "high" },
      { name: "Order costumes",            ctx: "Wardrobe",                     ai: "JK", ar: "coordinator", an: "Joss K.",   due: "Jun 2",  status: "overdue",   overdue: true, prio: "high" },
      { name: "Book accessible transport", ctx: "Logistics · awaiting budget",  ai: "JD", ar: "admin",       an: "Jamie D.",  due: "Jun 4",  status: "blocked",    prio: "med"  },
      { name: "Design program playbill",   ctx: "Marketing",                    ai: "RM", ar: "teacher",     an: "Rachel M.", due: "Jun 26", status: "upcoming",   prio: "low"  },
    ],
  },
  {
    collapsed: false, icon: UserPlus, iconcls: "gray", title: "New Staff Onboarding — Jun 2026",
    type: ["staff", "Staff task"], status: ["inprogress", "In progress"], scope: "Manteca PT",
    frac: "3 / 8 done", pct: 37, barcls: "", alert: "1 overdue", due: "Jun 25",
    tasks: [
      { name: "Collect signed offer letter",    ctx: "Tariq J.",   ai: "JD", ar: "admin",   an: "Jamie D.",  due: "May 29", status: "done",       prio: "med"  },
      { name: "Set up email & systems access",  ctx: "IT",         ai: "JD", ar: "admin",   an: "Jamie D.",  due: "Jun 1",  status: "done",       prio: "med"  },
      { name: "Schedule CPR certification",     ctx: "Compliance", ai: "RM", ar: "teacher", an: "Rachel M.", due: "Jun 3",  status: "overdue",   overdue: true, prio: "high" },
      { name: "Background check clearance",     ctx: "HR",         ai: "JD", ar: "admin",   an: "Jamie D.",  due: "Jun 18", status: "inprogress", prio: "high" },
      { name: "First-week shadow schedule",     ctx: "Onboarding", ai: "JK", ar: "coordinator", an: "Joss K.", due: "Jun 22", status: "upcoming", prio: "low"  },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDueDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Add Task Modal ────────────────────────────────────────────────────────────

type AddTaskForm = {
  name: string;
  ctx: string;
  projectIdx: number | null;
  assigneeKey: AssigneeKey;
  due: string;
  prio: Prio;
  status: "upcoming" | "inprogress" | "blocked";
};

const EMPTY_TASK_FORM: AddTaskForm = {
  name: "",
  ctx: "",
  projectIdx: null,
  assigneeKey: "",
  due: "",
  prio: "med",
  status: "upcoming",
};

function AddTaskModal({
  form,
  setForm,
  projects,
  onClose,
  onSubmit,
}: {
  form: AddTaskForm;
  setForm: React.Dispatch<React.SetStateAction<AddTaskForm>>;
  projects: Project[];
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = form.name.trim().length > 0 && form.projectIdx !== null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "0.5px solid var(--border-hover)",
    borderRadius: "var(--r-md)",
    padding: "8px 12px",
    fontSize: 13,
    color: "var(--fg)",
    background: "var(--surface)",
    outline: "none",
    boxSizing: "border-box",
  };

  const targetProject = form.projectIdx !== null ? projects[form.projectIdx] : null;
  const TargetIcon = targetProject?.icon;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,42,38,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "var(--space-4)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-lg)",
          width: "min(500px, 100%)",
          display: "flex",
          flexDirection: "column",
          border: "0.5px solid var(--border-hover)",
          maxHeight: "90vh",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--space-4)",
            borderBottom: "0.5px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>
              {targetProject ? `Add task to ${targetProject.title}` : "Add task"}
            </h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
              Task will appear in the project list
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-tertiary)",
              padding: 4,
              borderRadius: "var(--r-sm)",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* body */}
        <div
          style={{
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            overflowY: "auto",
          }}
        >
          {/* Task name */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Task name <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Order props for Act 2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Project */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Project <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            {targetProject && TargetIcon ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 12px",
                  borderRadius: "var(--r-md)",
                  border: "0.5px solid var(--border)",
                  background: "var(--bg-secondary)",
                  fontSize: 13,
                  color: "var(--fg)",
                }}
              >
                <TargetIcon style={{ width: 13, height: 13, color: "var(--fg-secondary)" }} />
                {targetProject.title}
              </div>
            ) : (
              <select
                value={form.projectIdx ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    projectIdx: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                style={inputStyle}
              >
                <option value="">Select a project…</option>
                {projects.map((p, i) => (
                  <option key={p.title} value={i}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Context */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Context{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Optional — e.g. Wardrobe, HR
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Wardrobe"
              value={form.ctx}
              onChange={(e) => setForm((f) => ({ ...f, ctx: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Assignee */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>
              Assignee{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Optional
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ASSIGNEES.map((a) => {
                const selected = form.assigneeKey === a.key;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        assigneeKey: f.assigneeKey === a.key ? "" : a.key,
                      }))
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: "var(--r-pill)",
                      border: `0.5px solid ${selected ? "var(--border-hover)" : "var(--border)"}`,
                      background: selected ? "var(--bg-secondary)" : "var(--surface)",
                      color: selected ? "var(--fg)" : "var(--fg-secondary)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    <span
                      className={`ss-avatar ${a.role} sm`}
                      style={{ width: 20, height: 20, fontSize: 9, flexShrink: 0 }}
                    >
                      {a.init}
                    </span>
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due date */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Due date{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Optional
              </span>
            </div>
            <input
              type="date"
              value={form.due}
              onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
              style={{ ...inputStyle, width: "55%" }}
            />
          </div>

          {/* Priority + Status */}
          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
            <div>
              <div className="ss-label" style={{ marginBottom: 8 }}>Priority</div>
              <div style={{ display: "flex", gap: 5 }}>
                {(["high", "med", "low"] as Prio[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`ss-chip${form.prio === p ? " is-active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setForm((f) => ({ ...f, prio: p }))}
                  >
                    <span className={`prio ${p}`} />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="ss-label" style={{ marginBottom: 8 }}>Status</div>
              <div style={{ display: "flex", gap: 5 }}>
                {(
                  [
                    ["upcoming", "Upcoming"],
                    ["inprogress", "In progress"],
                    ["blocked", "Blocked"],
                  ] as [AddTaskForm["status"], string][]
                ).map(([s, label]) => (
                  <button
                    key={s}
                    type="button"
                    className={`ss-chip${form.status === s ? " is-active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderTop: "0.5px solid var(--border)",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button className="ss-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ss-btn ss-btn-primary"
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            <Plus className="ss-btn-icon" />
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [collapsed, setCollapsed] = useState<boolean[]>(
    INITIAL_PROJECTS.map((p) => p.collapsed)
  );
  const [doneTasks, setDoneTasks] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddTaskForm>(EMPTY_TASK_FORM);

  const toggleProject = (i: number) =>
    setCollapsed((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  const toggleTask = (key: string) =>
    setDoneTasks((prev) => ({ ...prev, [key]: !prev[key] }));

  function openModal(targetProjectIdx: number | null = null) {
    setForm({ ...EMPTY_TASK_FORM, projectIdx: targetProjectIdx });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleSubmit() {
    if (form.projectIdx === null) return;

    const assignee = ASSIGNEES.find((a) => a.key === form.assigneeKey);

    const task: Task = {
      name: form.name.trim(),
      ctx: form.ctx.trim() || undefined,
      ai: assignee?.init ?? "—",
      ar: assignee?.role ?? "admin",
      an: assignee?.name ?? "Unassigned",
      due: formatDueDate(form.due),
      status: form.status,
      overdue: false,
      prio: form.prio,
    };

    setProjects((prev) =>
      prev.map((p, i) =>
        i === form.projectIdx ? { ...p, tasks: [...p.tasks, task] } : p
      )
    );

    // expand the project so the new task is visible
    if (collapsed[form.projectIdx]) {
      setCollapsed((prev) =>
        prev.map((c, i) => (i === form.projectIdx ? false : c))
      );
    }

    closeModal();
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
            <FolderPlus className="ss-btn-icon" />
            New project
          </button>
          <button
            className="ss-btn ss-btn-primary"
            type="button"
            onClick={() => openModal(null)}
          >
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
        {projects.map((p, idx) => {
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
              <div className="proj-body">
                {p.tasks.length > 0 && (
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
                )}
                <div
                  className="add-task"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(idx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openModal(idx);
                  }}
                >
                  <Plus />
                  Add task to {p.title}
                </div>
              </div>
            </div>
          );
        })}

        <button className="create-proj" type="button">
          <FolderPlus />
          Create new project
        </button>
      </div>

      {modalOpen && (
        <AddTaskModal
          form={form}
          setForm={setForm}
          projects={projects}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

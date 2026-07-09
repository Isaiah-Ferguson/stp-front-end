"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Loader,
  CircleDot,
  ChevronDown,
  Check,
  AlertCircle,
  ListChecks,
  Pencil,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { staffApi } from "@/lib/api/staff";
import { useStaff, usePrograms, queryKeys } from "@/lib/api/hooks";
import LoadError from "@/app/components/LoadError";
import { ApiError } from "@/lib/api/client";
import type {
  StaffSummaryDto,
  StaffDetailDto,
  ProgramSummaryDto,
  CreateStaffDto,
  StaffRole,
} from "@/lib/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildHireLabel(dateStr: string): string {
  const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const prefix = d > today ? "Start date" : "Hired";
  return `${prefix} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function isNewHire(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  return (now.getTime() - d.getTime()) < 60 * 24 * 60 * 60 * 1000;
}

function formatShort(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function progressBarCls(pct: number): string {
  if (pct === 100) return "success";
  if (pct === 0)   return "danger";
  return "warning";
}

// Groups onboarding items by section, preserving order of first appearance
function groupBySection(items: StaffDetailDto["onboardingItems"]) {
  const map = new Map<string, typeof items>();
  for (const item of items) {
    if (!map.has(item.section)) map.set(item.section, []);
    map.get(item.section)!.push(item);
  }
  return [...map.entries()];
}

// ── Checklist Template ────────────────────────────────────────────────────────

type TemplateItem = { id: string; label: string };
type TemplateSection = { name: string; items: TemplateItem[] };

const DEFAULT_TEMPLATE: TemplateSection[] = [
  {
    name: "HR & Compliance",
    items: [
      { id: "t1", label: "W-4 / I-9 completed" },
      { id: "t2", label: "Background check cleared" },
      { id: "t3", label: "Emergency contact form submitted" },
    ],
  },
  {
    name: "Training",
    items: [
      { id: "t4", label: "Program overview training" },
      { id: "t5", label: "Child safety & mandated reporter training" },
      { id: "t6", label: "First aid / CPR certification" },
    ],
  },
  {
    name: "Program Requirements",
    items: [
      { id: "t7", label: "Liability waiver signed" },
      { id: "t8", label: "Code of conduct acknowledged" },
      { id: "t9", label: "Media release policy reviewed" },
    ],
  },
  {
    name: "Access & Setup",
    items: [
      { id: "t10", label: "Staff email account created" },
      { id: "t11", label: "Program schedule provided" },
      { id: "t12", label: "Participant roster access granted" },
    ],
  },
];

function EditChecklistModal({
  template,
  onClose,
  onSave,
}: {
  template: TemplateSection[];
  onClose: () => void;
  onSave: (t: TemplateSection[]) => void;
}) {
  const [draft, setDraft] = useState<TemplateSection[]>(() =>
    template.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) }))
  );

  let _nextId = Date.now();
  function uid() { return String(_nextId++); }

  function updateSectionName(si: number, name: string) {
    setDraft((d) => d.map((s, i) => i === si ? { ...s, name } : s));
  }
  function deleteSection(si: number) {
    setDraft((d) => d.filter((_, i) => i !== si));
  }
  function addSection() {
    setDraft((d) => [...d, { name: "", items: [] }]);
  }
  function updateItemLabel(si: number, ii: number, label: string) {
    setDraft((d) => d.map((s, i) =>
      i !== si ? s : { ...s, items: s.items.map((it, j) => j === ii ? { ...it, label } : it) }
    ));
  }
  function deleteItem(si: number, ii: number) {
    setDraft((d) => d.map((s, i) =>
      i !== si ? s : { ...s, items: s.items.filter((_, j) => j !== ii) }
    ));
  }
  function addItem(si: number) {
    setDraft((d) => d.map((s, i) =>
      i !== si ? s : { ...s, items: [...s.items, { id: uid(), label: "" }] }
    ));
  }

  const totalItems = draft.reduce((n, s) => n + s.items.length, 0);

  const secInputStyle: React.CSSProperties = {
    flex: 1,
    border: "none",
    borderBottom: "0.5px solid var(--border-hover)",
    borderRadius: 0,
    padding: "2px 0",
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--fg-secondary)",
    background: "transparent",
    outline: "none",
  };
  const itemInputStyle: React.CSSProperties = {
    flex: 1,
    border: "none",
    padding: "2px 0",
    fontSize: 13,
    color: "var(--fg)",
    background: "transparent",
    outline: "none",
  };
  const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 3,
    borderRadius: "var(--r-sm)",
    color: "var(--fg-tertiary)",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "var(--space-4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(540px, 100%)", display: "flex", flexDirection: "column", border: "0.5px solid var(--border-hover)", maxHeight: "90vh" }}>

        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Edit checklist template</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
              {draft.length} section{draft.length !== 1 ? "s" : ""} · {totalItems} item{totalItems !== 1 ? "s" : ""} · Changes apply to new staff members
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, borderRadius: "var(--r-sm)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* scrollable body */}
        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto" }}>
          {draft.map((sec, si) => (
            <div key={si} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* section header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <input
                  value={sec.name}
                  onChange={(e) => updateSectionName(si, e.target.value)}
                  placeholder="Section name"
                  style={secInputStyle}
                />
                <button
                  type="button"
                  onClick={() => deleteSection(si)}
                  title="Delete section"
                  style={{ ...iconBtnStyle, color: "var(--danger)" }}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>

              {/* items */}
              {sec.items.map((item, ii) => (
                <div
                  key={item.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "0.5px solid var(--border)" }}
                >
                  <span
                    className="ss-checkbox"
                    style={{ cursor: "default", flexShrink: 0, opacity: 0.4 }}
                  />
                  <input
                    value={item.label}
                    onChange={(e) => updateItemLabel(si, ii, e.target.value)}
                    placeholder="Checklist item"
                    style={itemInputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => deleteItem(si, ii)}
                    title="Remove item"
                    style={iconBtnStyle}
                  >
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ))}

              {/* add item */}
              <button
                type="button"
                onClick={() => addItem(si)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--primary)",
                  padding: "6px 0",
                  fontWeight: 500,
                }}
              >
                <Plus style={{ width: 12, height: 12 }} />
                Add item
              </button>
            </div>
          ))}

          {/* add section */}
          <button
            type="button"
            onClick={addSection}
            className="btn-dashed"
            style={{ marginTop: 0 }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Add section
          </button>
        </div>

        {/* footer */}
        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="ss-btn" type="button" onClick={onClose}>Cancel</button>
          <button
            className="ss-btn ss-btn-primary"
            type="button"
            onClick={() => { onSave(draft); onClose(); }}
          >
            <Check className="ss-btn-icon" />
            Save template
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Staff Modal ───────────────────────────────────────────────────────────

type AddStaffForm = {
  nm: string;
  role: StaffRole | "";
  programIds: string[];
  startDate: string;
};

const EMPTY_STAFF_FORM: AddStaffForm = { nm: "", role: "", programIds: [], startDate: "" };

function AddStaffModal({
  programs,
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  programs: ProgramSummaryDto[];
  form: AddStaffForm;
  setForm: React.Dispatch<React.SetStateAction<AddStaffForm>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = form.nm.trim().length > 0 && form.role !== "" && form.programIds.length > 0;
  const allSelected = form.programIds.length === programs.length && programs.length > 0;

  function toggleAll() {
    setForm((f) => ({ ...f, programIds: allSelected ? [] : programs.map((p) => p.id) }));
  }

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
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", width: "min(480px, 100%)", display: "flex", flexDirection: "column", border: "0.5px solid var(--border-hover)", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Add staff member</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>New member will be added to the onboarding queue</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, borderRadius: "var(--r-sm)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto" }}>
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Full name <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <input type="text" placeholder="e.g. Jordan Rivera" value={form.nm} onChange={(e) => setForm((f) => ({ ...f, nm: e.target.value }))} style={inputStyle} autoFocus />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Role <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["Teacher", "Coordinator", "Admin"] as StaffRole[]).map((r) => (
                <button key={r} type="button" className={`ss-chip${form.role === r ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setForm((f) => ({ ...f, role: r }))}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Programs <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" className={`ss-chip${allSelected ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={toggleAll}>
                All programs
              </button>
              {programs.map((p) => {
                const checked = form.programIds.includes(p.id);
                return (
                  <label key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: "var(--r-pill)", border: `0.5px solid ${checked ? `var(--${p.slug}-border)` : "var(--border)"}`, background: checked ? `var(--${p.slug}-fill)` : "var(--surface)", color: checked ? `var(--${p.slug})` : "var(--fg-secondary)", cursor: "pointer", fontSize: 13, userSelect: "none" }}>
                    <input type="checkbox" style={{ display: "none" }} checked={checked}
                      onChange={(e) => setForm((f) => ({ ...f, programIds: e.target.checked ? [...f.programIds, p.id] : f.programIds.filter((x) => x !== p.id) }))} />
                    <span className={`ss-dot ${p.slug}`} />
                    {p.name}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Start date <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Leave blank to use today</span></div>
            <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={{ ...inputStyle, width: "60%" }} />
          </div>
        </div>

        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="ss-btn" type="button" onClick={onClose}>Cancel</button>
          <button className="ss-btn ss-btn-primary" type="button" onClick={onSubmit} disabled={!canSubmit}>
            <UserPlus className="ss-btn-icon" />Add staff member
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  // Cached + shared via React Query (#34).
  const queryClient = useQueryClient();
  const staffQ = useStaff();
  const programsQ = usePrograms();
  const staffList: StaffSummaryDto[] = staffQ.data ?? [];
  const programs: ProgramSummaryDto[] = programsQ.data ?? [];
  const loading = staffQ.isPending || programsQ.isPending;
  // "auto" = expand the first in-progress onboarding once data arrives; explicit
  // values take over as soon as the user toggles anything.
  const [expandedRaw, setExpandedRaw] = useState<string | null | "auto">("auto");
  const expanded = expandedRaw === "auto"
    ? staffList.find((s) => s.onboardingProgressPct > 0 && s.onboardingProgressPct < 100)?.fullName ?? null
    : expandedRaw;
  const [detailCache, setDetailCache] = useState<Record<string, StaffDetailDto>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddStaffForm>(EMPTY_STAFF_FORM);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [template, setTemplate] = useState<TemplateSection[]>(DEFAULT_TEMPLATE);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleToggle(id: string, name: string) {
    const isExpanding = expanded !== name;
    setExpandedRaw(expanded === name ? null : name);
    if (isExpanding && !detailCache[id]) {
      try {
        const detail = await staffApi.getById(id);
        setDetailCache((prev) => ({ ...prev, [id]: detail }));
      } catch { /* show empty state */ }
    }
  }

  function openModal() { setForm(EMPTY_STAFF_FORM); setModalOpen(true); }
  function closeModal() { setModalOpen(false); }

  async function handleSubmit() {
    const dto: CreateStaffDto = {
      fullName: form.nm.trim(),
      initials: toInitials(form.nm),
      role: form.role as StaffRole,
      startDate: form.startDate || undefined,
      programIds: form.programIds,
    };

    setSaveError(null);
    try {
      await staffApi.create(dto);
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    } catch (e) {
      // A failed save must not fabricate a placeholder row (#35).
      setSaveError(e instanceof ApiError && e.detail ? e.detail : "Couldn't add the staff member — try again.");
    }
    closeModal();
  }

  // computed compliance stats from real data
  const complete = staffList.filter((s) => s.onboardingProgressPct === 100).length;
  const inProgress = staffList.filter((s) => s.onboardingProgressPct > 0 && s.onboardingProgressPct < 100).length;
  const compPct = staffList.length > 0 ? Math.round((complete / staffList.length) * 100) : 0;
  const inProgPct = staffList.length > 0 ? Math.round((inProgress / staffList.length) * 100) : 0;

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Staff Onboarding</h1>
        </div>
        <div className="right">
          <button className="ss-btn" type="button">
            <Download className="ss-btn-icon" />Export
          </button>
          <button className="ss-btn ss-btn-primary" type="button" onClick={openModal}>
            <UserPlus className="ss-btn-icon" />Add staff member
          </button>
        </div>
      </div>

      <div className="adm-content">
        <div className="board-stats">
          <div className="board-stat"><span className="num">{staffList.length}</span><span className="label">Active Staff</span></div>
          <div className="board-stat"><span className="num green">{complete}</span><span className="label">Fully Complete</span></div>
          <div className="board-stat"><span className="num amber">{inProgress}</span><span className="label">In Progress</span></div>
          <div className="board-stat"><span className="num red">{staffList.filter(s => s.onboardingProgressPct === 0 && isNewHire(s.startDate)).length}</span><span className="label">Just Started</span></div>
        </div>

        <div className="row tight" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ss-chip is-active mjc">All staff</span>
          <span className="ss-chip">Complete</span>
          <span className="ss-chip">In progress</span>
          <span className="ss-chip">New hires</span>
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <span className="ss-chip" style={{ background: "var(--danger-fill)", color: "var(--danger-text)", borderColor: "var(--danger-border)" }}>
            <AlertCircle style={{ width: 12, height: 12 }} />Renewals due
          </span>
        </div>

        <div className="staff-layout">
          <div className="staff-main">
            {saveError && (
              <div
                role="alert"
                style={{
                  marginBottom: "var(--space-3)", padding: "10px 14px", borderRadius: "var(--r-md)",
                  background: "var(--danger-fill, #fce8e8)", color: "var(--danger)", fontSize: 13,
                }}
              >
                {saveError}
              </div>
            )}
            {loading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>
                Loading staff…
              </div>
            ) : staffQ.isError ? (
              <LoadError
                title="Couldn't load staff"
                error={staffQ.error}
                onRetry={() => staffQ.refetch()}
              />
            ) : staffList.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>
                No staff members yet — add one to get started.
              </div>
            ) : staffList.map((s) => {
              const isExpanded = expanded === s.fullName;
              const pct = s.onboardingProgressPct;
              const barCls = progressBarCls(pct);
              const hireLabel = buildHireLabel(s.startDate);
              const newHire = isNewHire(s.startDate);
              const progLabel = s.programNames.length > 0 ? s.programNames.join(", ") : "No programs";
              const detail = detailCache[s.id];

              const badgeEl = pct === 100 ? (
                <span className="ss-badge is-active"><CheckCircle2 />Complete</span>
              ) : pct === 0 ? (
                <span className="ss-badge is-attention"><CircleDot />Just started</span>
              ) : (
                <span className="ss-badge is-prospective"><Loader />In progress</span>
              );

              return (
                <div key={s.id} className={`sacc${isExpanded ? "" : " is-collapsed"}`}>
                  <div className="sacc-head" onClick={() => handleToggle(s.id, s.fullName)}>
                    <span className={`ss-avatar ${s.role.toLowerCase()}`}>{s.initials}</span>
                    <div className="sacc-id" style={{ display: "block" }}>
                      <div className="nm">
                        {s.fullName}
                        {newHire && <span className="newhire-tag">New hire</span>}
                      </div>
                      <div className="sub">{s.role} · {progLabel} · {hireLabel}</div>
                    </div>
                    <div className="sacc-prog">
                      <div className="ss-progress">
                        <div className={`ss-progress-fill ${barCls}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="pct">{pct}%</span>
                    </div>
                    {badgeEl}
                    <span className="sacc-chev"><ChevronDown /></span>
                  </div>

                  {isExpanded && (
                    <div className="sacc-body">
                      {detail ? (
                        detail.onboardingItems.length === 0 ? (
                          <div style={{ padding: "16px", color: "var(--fg-tertiary)", fontSize: 13 }}>
                            No checklist items yet.
                          </div>
                        ) : groupBySection(detail.onboardingItems).map(([section, items]) => (
                          <div className="check-sec" key={section}>
                            <div className="check-sec-label">{section}</div>
                            {items.map((item) => (
                              <div className={`ss-checkrow${item.isCompleted ? " is-done" : ""}`} key={item.id}>
                                <span className={`ss-checkbox${item.isCompleted ? " is-checked" : ""}`}>
                                  {item.isCompleted && <Check />}
                                </span>
                                <span className="ss-checkrow-label">{item.label}</span>
                                {item.expiryDate ? (
                                  <span className="ss-date-expired" style={{ marginLeft: "auto" }}>
                                    <AlertCircle />Exp {formatShort(item.expiryDate)}
                                  </span>
                                ) : item.completedDate ? (
                                  <span className="ss-checkrow-date">{formatShort(item.completedDate)}</span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "16px", color: "var(--fg-tertiary)", fontSize: 13 }}>
                          Loading checklist…
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button className="create-proj" type="button" onClick={openModal}>
              <UserPlus />Add new staff member
            </button>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="staff-side">
            <div className="section">
              <div className="sec-head"><h3>Renewals &amp; Alerts</h3></div>
              {staffList.filter((s) => s.onboardingProgressPct < 100).slice(0, 4).map((s) => (
                <div className="alert-row" key={s.id}>
                  <span className={`dot ${s.onboardingProgressPct === 0 ? "red" : "amber"}`} />
                  <div className="body">
                    <div className="txt">{s.fullName} — onboarding {s.onboardingProgressPct}%</div>
                    <div className="sub">{s.role} · {s.programNames.join(", ")}</div>
                  </div>
                </div>
              ))}
              {staffList.filter((s) => s.onboardingProgressPct < 100).length === 0 && (
                <div style={{ fontSize: 13, color: "var(--fg-tertiary)", padding: "8px 0" }}>All staff fully onboarded</div>
              )}
            </div>

            <div className="section">
              <div className="sec-head"><h3>Overall Compliance</h3></div>
              <div className="cbar">
                <div className="top">
                  <span>Complete</span>
                  <span className="pct" style={{ color: "var(--success-text)" }}>{compPct}%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill success" style={{ width: `${compPct}%` }} />
                </div>
              </div>
              <div className="cbar">
                <div className="top">
                  <span>In progress</span>
                  <span className="pct" style={{ color: "#9a6a12" }}>{inProgPct}%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill warning" style={{ width: `${inProgPct}%` }} />
                </div>
              </div>
              <div className="cbar">
                <div className="top">
                  <span>Not started</span>
                  <span className="pct" style={{ color: "var(--danger-text)" }}>{Math.max(0, 100 - compPct - inProgPct)}%</span>
                </div>
                <div className="ss-progress">
                  <div className="ss-progress-fill danger" style={{ width: `${Math.max(0, 100 - compPct - inProgPct)}%` }} />
                </div>
              </div>
            </div>

            <div className="section">
              <div className="info-note">
                <ListChecks />
                <span>
                  Every staff member completes a checklist across key sections before they&apos;re cleared to work with participants.
                </span>
              </div>
              <button className="btn-dashed" type="button" onClick={() => setTemplateOpen(true)}>
                <Pencil />Edit checklist template
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <AddStaffModal programs={programs} form={form} setForm={setForm} onClose={closeModal} onSubmit={handleSubmit} />
      )}

      {templateOpen && (
        <EditChecklistModal
          template={template}
          onClose={() => setTemplateOpen(false)}
          onSave={(t) => setTemplate(t)}
        />
      )}
    </div>
  );
}

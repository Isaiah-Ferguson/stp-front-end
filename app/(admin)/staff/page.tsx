"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  UserPlus,
  CheckCircle2,
  Loader,
  CircleDot,
  ChevronDown,
  Check,
  AlertCircle,
  ListChecks,
  Pencil,
} from "lucide-react";
import { staffApi } from "@/lib/api/staff";
import { useStaff, usePrograms, useChecklistTemplate, queryKeys } from "@/lib/api/hooks";
import LoadError from "@/app/components/LoadError";
import { ApiError } from "@/lib/api/client";
import {
  AddStaffModal,
  EditChecklistModal,
  DEFAULT_TEMPLATE,
  type TemplateSection,
  type AddStaffForm,
  EMPTY_STAFF_FORM,
} from "./_modals";
import type {
  StaffSummaryDto,
  StaffDetailDto,
  ProgramSummaryDto,
  CreateStaffDto,
  StaffRole,
  OnboardingItemDto,
  ChecklistTemplateItemDto,
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

// The API stores the template as a flat ordered list; the modal edits it as sections.
function templateToSections(items: ChecklistTemplateItemDto[]): TemplateSection[] {
  const sections: TemplateSection[] = [];
  items.forEach((item, i) => {
    let sec = sections.find((s) => s.name === item.section);
    if (!sec) { sec = { name: item.section, items: [] }; sections.push(sec); }
    sec.items.push({ id: `t${i}`, label: item.label });
  });
  return sections;
}

function sectionsToTemplate(sections: TemplateSection[]): ChecklistTemplateItemDto[] {
  return sections.flatMap((s) =>
    s.items
      .filter((i) => i.label.trim().length > 0)
      .map((i) => ({ section: s.name.trim() || "General", label: i.label.trim() }))
  );
}

type StaffFilter = "all" | "complete" | "inprogress" | "new" | "alerts";

function matchesFilter(s: StaffSummaryDto, filter: StaffFilter): boolean {
  switch (filter) {
    case "complete":   return s.onboardingProgressPct === 100;
    case "inprogress": return s.onboardingProgressPct > 0 && s.onboardingProgressPct < 100;
    case "new":        return isNewHire(s.startDate);
    case "alerts":     return s.onboardingProgressPct < 100;
    default:           return true;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

function StaffPageInner() {
  // Cached + shared via React Query (#34).
  const queryClient = useQueryClient();
  const staffQ = useStaff();
  const programsQ = usePrograms();
  const staffList: StaffSummaryDto[] = staffQ.data ?? [];
  const programs: ProgramSummaryDto[] = programsQ.data ?? [];
  const loading = staffQ.isPending || programsQ.isPending;
  // ?expand=<full name> deep-links straight to a staff member's checklist
  // (e.g. from a program page); it wins over the in-progress default below.
  const expandParam = useSearchParams().get("expand");
  // "auto" = expand the deep-linked row, else the first in-progress onboarding
  // once data arrives; explicit values take over as soon as the user toggles.
  const [expandedRaw, setExpandedRaw] = useState<string | null | "auto">("auto");
  const expanded = expandedRaw === "auto"
    ? (expandParam && staffList.some((s) => s.fullName === expandParam) ? expandParam : null)
      ?? staffList.find((s) => s.onboardingProgressPct > 0 && s.onboardingProgressPct < 100)?.fullName ?? null
    : expandedRaw;
  const [detailCache, setDetailCache] = useState<Record<string, StaffDetailDto>>({});

  // Whatever row is expanded needs its checklist detail loaded.
  const expandedStaff = staffList.find((s) => s.fullName === expanded);
  useEffect(() => {
    const s = expandedStaff;
    if (!s || detailCache[s.id]) return;
    staffApi.getById(s.id)
      .then((d) => setDetailCache((prev) => ({ ...prev, [s.id]: d })))
      .catch(() => { /* row shows its loading state */ });
  }, [expandedStaff, detailCache]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddStaffForm>(EMPTY_STAFF_FORM);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StaffFilter>("all");
  // Item ids with an in-flight toggle request, so a double-click can't race.
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // The checklist template lives on the server; fall back to the built-in
  // default only while it hasn't loaded yet.
  const templateQ = useChecklistTemplate();
  const template: TemplateSection[] = templateQ.data
    ? templateToSections(templateQ.data)
    : DEFAULT_TEMPLATE;

  function handleToggle(_id: string, name: string) {
    // The effect above loads the checklist detail for whichever row is expanded.
    setExpandedRaw(expanded === name ? null : name);
  }

  function openModal() { setForm(EMPTY_STAFF_FORM); setModalOpen(true); }
  function closeModal() { setModalOpen(false); }

  async function handleItemToggle(staffId: string, item: OnboardingItemDto) {
    if (togglingIds.has(item.id)) return;
    setTogglingIds((prev) => new Set(prev).add(item.id));
    setSaveError(null);
    try {
      const updated = await staffApi.setOnboardingItem(staffId, item.id, !item.isCompleted);
      setDetailCache((prev) => ({ ...prev, [staffId]: updated }));
      // The summary list's progress % is served by the backend — refresh it.
      queryClient.invalidateQueries({ queryKey: queryKeys.staff, exact: true });
    } catch (e) {
      setSaveError(e instanceof ApiError && e.detail ? e.detail : "Couldn't update the checklist item — try again.");
    } finally {
      setTogglingIds((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
    }
  }

  async function handleTemplateSave(sections: TemplateSection[]) {
    setSaveError(null);
    try {
      const saved = await staffApi.updateChecklistTemplate(sectionsToTemplate(sections));
      queryClient.setQueryData(queryKeys.checklistTemplate, saved);
    } catch (e) {
      setSaveError(e instanceof ApiError && e.detail ? e.detail : "Couldn't save the checklist template — try again.");
    }
  }

  function handleExport() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Role", "Programs", "Start date", "Onboarding %"],
      ...staffList.map((s) => [s.fullName, s.role, s.programNames.join("; "), s.startDate, String(s.onboardingProgressPct)]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff-onboarding.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

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
      const created = await staffApi.create(dto);
      // The response carries the checklist just issued from the template —
      // cache it and expand the new member so their checklist is visible.
      setDetailCache((prev) => ({ ...prev, [created.id]: created }));
      setExpandedRaw(created.fullName);
      setFilter("all");
      queryClient.invalidateQueries({ queryKey: queryKeys.staff, exact: true });
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
          <button className="ss-btn" type="button" onClick={handleExport} disabled={staffList.length === 0}>
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
          {([["all", "All staff"], ["complete", "Complete"], ["inprogress", "In progress"], ["new", "New hires"]] as [StaffFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`ss-chip${filter === key ? " is-active mjc" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
          <span style={{ width: 1, height: 22, background: "var(--border-strong)", margin: "0 4px" }} />
          <button
            type="button"
            className="ss-chip"
            style={{
              cursor: "pointer",
              background: "var(--danger-fill)", color: "var(--danger-text)", borderColor: "var(--danger-border)",
              ...(filter === "alerts" ? { outline: "1.5px solid var(--danger)" } : {}),
            }}
            onClick={() => setFilter(filter === "alerts" ? "all" : "alerts")}
          >
            <AlertCircle style={{ width: 12, height: 12 }} />Renewals due
          </button>
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
            ) : staffList.filter((s) => matchesFilter(s, filter)).length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-tertiary)", fontSize: 13 }}>
                No staff members match this filter.
              </div>
            ) : staffList.filter((s) => matchesFilter(s, filter)).map((s) => {
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
                                <button
                                  type="button"
                                  className={`ss-checkbox${item.isCompleted ? " is-checked" : ""}`}
                                  style={{ padding: 0, opacity: togglingIds.has(item.id) ? 0.5 : 1 }}
                                  aria-pressed={item.isCompleted}
                                  aria-label={`${item.isCompleted ? "Mark incomplete" : "Mark complete"}: ${item.label}`}
                                  disabled={togglingIds.has(item.id)}
                                  onClick={() => handleItemToggle(s.id, item)}
                                >
                                  {item.isCompleted && <Check />}
                                </button>
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
          onSave={handleTemplateSave}
        />
      )}
    </div>
  );
}

// useSearchParams requires a Suspense boundary for static prerendering.
export default function StaffPage() {
  return (
    <Suspense fallback={null}>
      <StaffPageInner />
    </Suspense>
  );
}


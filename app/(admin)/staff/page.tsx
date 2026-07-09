"use client";

import { useState } from "react";
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
import { useStaff, usePrograms, queryKeys } from "@/lib/api/hooks";
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


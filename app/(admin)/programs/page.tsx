"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ChevronRight, Plus, X } from "lucide-react";
import { programsApi } from "@/lib/api/programs";
import type { ProgramSummaryDto, CreateProgramDto } from "@/lib/types/api";

// ── Color palette ─────────────────────────────────────────────────────────────

type ProgramColor = { key: string; label: string; main: string; fill: string; border: string };

const COLOR_OPTIONS: ProgramColor[] = [
  { key: "blue",   label: "Blue",   main: "#378add", fill: "#e6f1fb", border: "#85b7eb" },
  { key: "teal",   label: "Teal",   main: "#1d9e75", fill: "#e1f5ee", border: "#5dcaa5" },
  { key: "coral",  label: "Coral",  main: "#d85a30", fill: "#faece7", border: "#f0997b" },
  { key: "amber",  label: "Amber",  main: "#ef9f27", fill: "#faeeda", border: "#efcf87" },
  { key: "purple", label: "Purple", main: "#7c6bc4", fill: "#ede9f7", border: "#b5abdf" },
  { key: "rose",   label: "Rose",   main: "#c04a70", fill: "#fae8ef", border: "#e8a0b8" },
];

function colorFromHex(hex: string): ProgramColor {
  const match = COLOR_OPTIONS.find((c) => c.main.toLowerCase() === hex.toLowerCase());
  return match ?? { key: "custom", label: "Custom", main: hex, fill: hex + "22", border: hex + "66" };
}

// ── Local card type ───────────────────────────────────────────────────────────

type ProgramCard = {
  id: string;
  slug: string;
  label: string;
  enrolled: number;
  attendance: number | null;
  schedule: string;
  nextSession: string;
  nextMeta: string;
  alertCount: number;
  color: ProgramColor;
};

function dtoToCard(dto: ProgramSummaryDto): ProgramCard {
  return {
    id: dto.id,
    slug: dto.slug,
    label: dto.name,
    enrolled: dto.enrolledCount,
    attendance: dto.attendancePct ?? null,
    schedule: dto.sessionSchedule ?? "—",
    nextSession: dto.nextSessionDate ?? "TBD",
    nextMeta: dto.nextSessionMeta ?? (dto.defaultLocation ?? ""),
    alertCount: dto.alertCount,
    color: colorFromHex(dto.colorHex),
  };
}

// ── Create Program Modal ──────────────────────────────────────────────────────

type CreateForm = { name: string; colorKey: string; schedule: string; location: string };
const EMPTY_FORM: CreateForm = { name: "", colorKey: "", schedule: "", location: "" };

function CreateProgramModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: CreateForm) => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const canSubmit = form.name.trim().length > 0 && form.colorKey !== "";

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "0.5px solid var(--border-hover)", borderRadius: "var(--r-md)",
    padding: "8px 12px", fontSize: 13, color: "var(--fg)",
    background: "var(--surface)", outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(43,42,38,.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: "var(--space-4)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--surface)", borderRadius: "var(--r-lg)",
        width: "min(480px, 100%)", display: "flex", flexDirection: "column",
        border: "0.5px solid var(--border-hover)", maxHeight: "90vh",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "var(--space-4)", borderBottom: "0.5px solid var(--border)", flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Create program</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>New program will appear on the Programs page</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-tertiary)", padding: 4, borderRadius: "var(--r-sm)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto" }}>
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Program name <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <input type="text" placeholder="e.g. Stockton Drama" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={inputStyle} autoFocus />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>
              Color <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map((c) => {
                const selected = form.colorKey === c.key;
                return (
                  <button key={c.key} type="button" title={c.label}
                    onClick={() => setForm((f) => ({ ...f, colorKey: c.key }))}
                    style={{
                      width: 28, height: 28, borderRadius: "var(--r-circle)",
                      background: c.main, border: selected ? "2.5px solid var(--fg)" : "2.5px solid transparent",
                      cursor: "pointer", outline: selected ? `2px solid ${c.main}` : "none",
                      outlineOffset: 2, flexShrink: 0,
                    }} />
                );
              })}
            </div>
            {form.colorKey && (() => {
              const c = COLOR_OPTIONS.find((o) => o.key === form.colorKey)!;
              return (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--fg-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.main, display: "inline-block", flexShrink: 0 }} />
                  {c.label} selected
                </div>
              );
            })()}
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Schedule <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional — e.g. Mon / Wed / Fri</span>
            </div>
            <input type="text" placeholder="Mon / Wed / Fri" value={form.schedule}
              onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
              style={inputStyle} />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Location <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional — e.g. Room B</span>
            </div>
            <input type="text" placeholder="Room B" value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              style={inputStyle} />
          </div>
        </div>

        <div style={{
          padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)",
          display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0,
        }}>
          <button className="ss-btn" type="button" onClick={onClose}>Cancel</button>
          <button className="ss-btn ss-btn-primary" type="button" disabled={!canSubmit} onClick={() => onSubmit(form)}>
            <Plus className="ss-btn-icon" />
            Create program
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    programsApi.getAll()
      .then((data) => setPrograms(data.map(dtoToCard)))
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(form: CreateForm) {
    const color = COLOR_OPTIONS.find((c) => c.key === form.colorKey)!;
    const dto: CreateProgramDto = {
      name: form.name.trim(),
      colorHex: color.main,
      sessionSchedule: form.schedule.trim() || undefined,
      defaultLocation: form.location.trim() || undefined,
    };

    try {
      const created = await programsApi.create(dto);
      setPrograms((prev) => [dtoToCard(created), ...prev]);
      setModalOpen(false);
      router.push(`/programs/${created.slug}`);
    } catch {
      // fallback: optimistic add + navigate
      const slug = form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      setPrograms((prev) => [{
        id: slug, slug, label: form.name.trim(), enrolled: 0, attendance: null,
        schedule: form.schedule.trim() || "TBD", nextSession: "TBD",
        nextMeta: form.location.trim() || "Location TBD", alertCount: 0, color,
      }, ...prev]);
      setModalOpen(false);
      router.push(`/programs/${slug}`);
    }
  }

  return (
    <>
      <style>{`
        .prog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-4); }
        .prog-card { display: flex; flex-direction: column; background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--r-lg); text-decoration: none; color: var(--fg); overflow: hidden; transition: border-color 100ms; }
        .prog-card:hover { border-color: var(--border-hover); }
        .prog-card-head { padding: 16px 16px 14px; border-bottom: 0.5px solid var(--border); }
        .prog-card-stats { display: flex; flex: 1; padding: 14px 0; }
        .prog-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 0 12px; }
        .prog-stat + .prog-stat { border-left: 0.5px solid var(--border); }
        .prog-stat .num { font-size: 18px; font-weight: 500; color: var(--fg); line-height: 1; }
        .prog-stat .lbl { font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--fg-tertiary); }
        .prog-card-foot { padding: 8px 14px; border-top: 0.5px solid var(--border); background: var(--bg); display: flex; align-items: center; justify-content: space-between; }
        .prog-skeleton { height: 160px; background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--r-lg); animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <div className="adm-main">
        <div className="adm-topbar">
          <div className="titles">
            <h1>Programs</h1>
            <span className="date">Friday, June 12, 2026</span>
          </div>
          <div className="right">
            <button className="ss-btn ss-btn-primary" type="button" onClick={() => setModalOpen(true)}>
              <Plus className="ss-btn-icon" />
              Create program
            </button>
          </div>
        </div>

        <div className="adm-content">
          {loading ? (
            <div className="prog-grid">
              {[1, 2, 3].map((i) => <div key={i} className="prog-skeleton" />)}
            </div>
          ) : (
            <div className="prog-grid">
              {programs.map((p) => (
                <Link key={p.id} href={`/programs/${p.slug}`} className="prog-card">
                  <div className="prog-card-head" style={{ background: p.color.fill }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="ss-dot" style={{ background: p.color.main, flexShrink: 0 }} />
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{p.label}</span>
                      {p.alertCount > 0 && (
                        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--danger)" }}>
                          <AlertCircle style={{ width: 11, height: 11 }} />{p.alertCount}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg-secondary)" }}>
                      {p.enrolled} enrolled · {p.schedule}
                    </div>
                  </div>

                  <div className="prog-card-stats">
                    <div className="prog-stat">
                      <span className="num">{p.attendance !== null ? `${p.attendance}%` : "—"}</span>
                      <span className="lbl">Attendance</span>
                    </div>
                    <div className="prog-stat">
                      <span className="num">{p.nextSession}</span>
                      <span className="lbl">Next Session</span>
                    </div>
                    <div className="prog-stat">
                      <span className="num" style={{ color: p.alertCount > 0 ? "var(--danger)" : "var(--fg)" }}>{p.alertCount}</span>
                      <span className="lbl">Alerts</span>
                    </div>
                  </div>

                  <div className="prog-card-foot">
                    <span style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>{p.nextMeta}</span>
                    <ChevronRight style={{ width: 13, height: 13, color: "var(--fg-tertiary)" }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <CreateProgramModal onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      )}
    </>
  );
}

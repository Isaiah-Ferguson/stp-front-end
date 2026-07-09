"use client";

import { useState, useMemo, useEffect } from "react";
import { scriptsApi } from "@/lib/api/scripts";
import { programsApi } from "@/lib/api/programs";
import { useEscapeKey } from "@/lib/useEscapeKey";
import type {
  ScriptDto,
  ScriptType as ApiScriptType,
  ScriptStatus as ApiScriptStatus,
} from "@/lib/types/api";
import {
  BookOpen,
  Search,
  Download,
  Plus,
  ChevronRight,
  Users,
  Clock,
  Music2,
  FileText,
  X,
  Check,
  Calendar,
  Tag,
} from "lucide-react";

type ScriptType = "musical" | "play" | "scene" | "skit";
type ScriptStatus = "active" | "archived" | "draft";
type Prog = "mjc" | "pathways" | "manteca" | "productions";

const PROG_LABEL: Record<Prog, string> = {
  mjc: "MJC",
  pathways: "Pathways",
  manteca: "Manteca PT",
  productions: "Productions",
};

const TYPE_LABEL: Record<ScriptType, string> = {
  musical: "Musical",
  play: "Full Play",
  scene: "Scene Collection",
  skit: "Skit",
};

const STATUS_STYLE: Record<ScriptStatus, { bg: string; color: string }> = {
  active: { bg: "var(--success-fill)", color: "var(--success-text)" },
  archived: { bg: "var(--neutral-fill)", color: "var(--neutral-text)" },
  draft: { bg: "var(--warning-fill)", color: "var(--warning-text)" },
};

type Script = {
  title: string;
  subtitle?: string;
  type: ScriptType;
  adapted: boolean;
  original: boolean;
  programs: Prog[];
  castMin?: number;
  castMax?: number;
  duration: string;
  lastUsed: string;
  status: ScriptStatus;
};

const INITIAL_SCRIPTS: Script[] = [
  {
    title: "The Magic Garden",
    subtitle: "An original musical in two acts",
    type: "musical",
    adapted: false,
    original: true,
    programs: ["productions", "pathways"],
    castMin: 12,
    castMax: 18,
    duration: "55 min",
    lastUsed: "Spring 2026",
    status: "active",
  },
  {
    title: "Cinderella",
    subtitle: "Adapted for performing arts",
    type: "play",
    adapted: true,
    original: false,
    programs: ["mjc"],
    castMin: 8,
    castMax: 12,
    duration: "40 min",
    lastUsed: "Fall 2025",
    status: "active",
  },
  {
    title: "Under the Sea",
    subtitle: "A musical celebration",
    type: "musical",
    adapted: false,
    original: true,
    programs: ["manteca"],
    castMin: 6,
    castMax: 10,
    duration: "35 min",
    lastUsed: "Spring 2025",
    status: "active",
  },
  {
    title: "The Brave Little Star",
    subtitle: "Scene collection — one act per program group",
    type: "scene",
    adapted: false,
    original: true,
    programs: ["mjc", "pathways", "manteca", "productions"],
    castMin: 4,
    castMax: 8,
    duration: "20 min / scene",
    lastUsed: "Ongoing",
    status: "active",
  },
  {
    title: "Stardust",
    subtitle: "New original musical — in development",
    type: "musical",
    adapted: false,
    original: true,
    programs: ["productions"],
    duration: "TBD",
    lastUsed: "Planned: Fall 2026",
    status: "draft",
  },
  {
    title: "A Midsummer Dream",
    subtitle: "Adapted from Shakespeare",
    type: "play",
    adapted: true,
    original: false,
    programs: ["productions"],
    castMin: 15,
    castMax: 20,
    duration: "60 min",
    lastUsed: "Spring 2025",
    status: "archived",
  },
  {
    title: "Rainbow Road",
    subtitle: "A musical journey",
    type: "musical",
    adapted: false,
    original: true,
    programs: ["mjc", "pathways"],
    castMin: 10,
    castMax: 14,
    duration: "45 min",
    lastUsed: "Spring 2024",
    status: "archived",
  },
  {
    title: "The Lighthouse Keeper",
    type: "play",
    adapted: false,
    original: true,
    programs: ["manteca"],
    castMin: 6,
    castMax: 8,
    duration: "30 min",
    lastUsed: "Fall 2024",
    status: "archived",
  },
];

// ── API ↔ local model mapping (#18) ─────────────────────────────────────────────
// This page keeps its own lowercase unions; the API uses PascalCase enums and program
// GUIDs. These helpers bridge the two so the page can show and persist real data while
// the existing demo (INITIAL_SCRIPTS) remains the fallback if the API is empty/unreachable.

const API_TYPE_TO_LOCAL: Record<ApiScriptType, ScriptType> = {
  Musical: "musical",
  Play: "play",
  Scene: "scene",
  Skit: "skit",
};
const LOCAL_TYPE_TO_API: Record<ScriptType, ApiScriptType> = {
  musical: "Musical",
  play: "Play",
  scene: "Scene",
  skit: "Skit",
};
const API_STATUS_TO_LOCAL: Record<ApiScriptStatus, ScriptStatus> = {
  Active: "active",
  Draft: "draft",
  Archived: "archived",
};
const LOCAL_STATUS_TO_API: Record<ScriptStatus, ApiScriptStatus> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

/** Maps a program's display name to the local Prog tag (best-effort; unknown → productions). */
function progFromName(name: string): Prog {
  const n = name.toLowerCase();
  if (n.includes("mjc")) return "mjc";
  if (n.includes("pathways")) return "pathways";
  if (n.includes("manteca")) return "manteca";
  return "productions";
}

function scriptFromDto(dto: ScriptDto): Script {
  return {
    title: dto.title,
    subtitle: dto.subtitle ?? undefined,
    type: API_TYPE_TO_LOCAL[dto.type] ?? "play",
    adapted: dto.isAdapted,
    original: dto.isOriginal,
    programs: Array.from(new Set((dto.programNames ?? []).map(progFromName))),
    castMin: dto.castMin ?? undefined,
    castMax: dto.castMax ?? undefined,
    duration: dto.duration ?? "TBD",
    lastUsed: dto.lastUsed ?? "—",
    status: API_STATUS_TO_LOCAL[dto.status] ?? "draft",
  };
}

const STATUS_FILTERS = ["all", "active", "archived", "draft"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const PROG_FILTERS: ("all" | Prog)[] = ["all", "mjc", "pathways", "manteca", "productions"];

// ── Form state ────────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  subtitle: string;
  type: ScriptType;
  source: "original" | "adapted";
  programs: Prog[];
  castMin: string;
  castMax: string;
  duration: string;
  status: ScriptStatus;
};

const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  type: "musical",
  source: "original",
  programs: [],
  castMin: "",
  castMax: "",
  duration: "",
  status: "draft",
};

// ── Add Script Modal ──────────────────────────────────────────────────────────

function AddScriptModal({
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = form.title.trim().length > 0 && form.programs.length > 0;
  useEscapeKey(onClose);

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
        role="dialog"
        aria-modal="true"
        aria-label="Add script"
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-lg)",
          width: "min(520px, 100%)",
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
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Add script</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
              Script will be saved to the library
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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

        {/* scrollable body */}
        <div
          style={{
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            overflowY: "auto",
          }}
        >
          {/* Title */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Title{" "}
              <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <input
              type="text"
              placeholder="e.g. The Magic Garden"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Subtitle */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Subtitle{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Optional
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. An original musical in two acts"
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Type */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Type</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {(["musical", "play", "scene", "skit"] as ScriptType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`ss-chip${form.type === t ? " is-active" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>
              Programs{" "}
              <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["mjc", "pathways", "manteca", "productions"] as Prog[]).map((p) => {
                const checked = form.programs.includes(p);
                return (
                  <label
                    key={p}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 11px",
                      borderRadius: "var(--r-pill)",
                      border: `0.5px solid ${checked ? `var(--${p}-border)` : "var(--border)"}`,
                      background: checked ? `var(--${p}-fill)` : "var(--surface)",
                      color: checked ? `var(--${p}-text)` : "var(--fg-secondary)",
                      cursor: "pointer",
                      fontSize: 13,
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ display: "none" }}
                      checked={checked}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          programs: e.target.checked
                            ? [...f.programs, p]
                            : f.programs.filter((x) => x !== p),
                        }))
                      }
                    />
                    <span className={`ss-dot ${p}`} />
                    {PROG_LABEL[p]}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Script origin */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Script origin</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["original", "adapted"] as const).map((s) => (
                <label
                  key={s}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 11px",
                    borderRadius: "var(--r-pill)",
                    border: `0.5px solid ${form.source === s ? "var(--border-hover)" : "var(--border)"}`,
                    background: form.source === s ? "var(--bg-secondary)" : "var(--surface)",
                    color: form.source === s ? "var(--fg)" : "var(--fg-secondary)",
                    cursor: "pointer",
                    fontSize: 13,
                    userSelect: "none",
                  }}
                >
                  <input
                    type="radio"
                    name="source"
                    value={s}
                    checked={form.source === s}
                    onChange={() => setForm((f) => ({ ...f, source: s }))}
                    style={{ display: "none" }}
                  />
                  {s === "original" ? "Original work" : "Adapted from another work"}
                </label>
              ))}
            </div>
          </div>

          {/* Cast size */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Cast size{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Optional
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                min={1}
                placeholder="Min"
                value={form.castMin}
                onChange={(e) => setForm((f) => ({ ...f, castMin: e.target.value }))}
                style={{ ...inputStyle, width: "auto", flex: 1 }}
              />
              <span style={{ fontSize: 13, color: "var(--fg-tertiary)", flexShrink: 0 }}>to</span>
              <input
                type="number"
                min={1}
                placeholder="Max"
                value={form.castMax}
                onChange={(e) => setForm((f) => ({ ...f, castMax: e.target.value }))}
                style={{ ...inputStyle, width: "auto", flex: 1 }}
              />
              <span style={{ fontSize: 12, color: "var(--fg-tertiary)", flexShrink: 0 }}>
                participants
              </span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>
              Duration{" "}
              <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>
                Optional
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. 45 min"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              style={{ ...inputStyle, width: "50%" }}
            />
          </div>

          {/* Status */}
          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Status</div>
            <div style={{ display: "flex", gap: 5 }}>
              {(["draft", "active", "archived"] as ScriptStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`ss-chip${form.status === s ? " is-active" : ""}`}
                  style={{ cursor: "pointer", textTransform: "capitalize" }}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
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
            <Check className="ss-btn-icon" />
            Add script
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Script Detail Panel ───────────────────────────────────────────────────────

function ScriptDetailPanel({ script, onClose }: { script: Script; onClose: () => void }) {
  useEscapeKey(onClose);
  const TypeIcon = script.type === "musical" ? Music2 : FileText;
  const { bg, color } = STATUS_STYLE[script.status];
  const leadProg = script.programs[0];

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "var(--space-3) 0",
    borderBottom: "0.5px solid var(--border)",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--fg-tertiary)",
    width: 96,
    flexShrink: 0,
    paddingTop: 1,
  };
  const valueStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--fg)",
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
    alignItems: "center",
  };

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(43,42,38,.35)",
          zIndex: 200,
        }}
      />
      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={script.title}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 100vw)",
          background: "var(--surface)",
          borderLeft: "0.5px solid var(--border-hover)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 180ms ease-out",
        }}
      >
        {/* colored header */}
        <div
          style={{
            background: `var(--${leadProg}-fill)`,
            padding: "var(--space-4)",
            borderBottom: "0.5px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 8,
              marginBottom: "var(--space-3)",
            }}
          >
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "2px 7px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--surface)",
                  color: "var(--fg-secondary)",
                  border: "0.5px solid var(--border)",
                }}
              >
                <TypeIcon style={{ width: 11, height: 11 }} />
                {TYPE_LABEL[script.type]}
              </span>
              {script.adapted && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 7px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--info-fill)",
                    color: "var(--info-text)",
                    border: "0.5px solid var(--info-border)",
                  }}
                >
                  Adapted
                </span>
              )}
              {script.original && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 7px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--success-fill)",
                    color: "var(--success-text)",
                    border: "0.5px solid var(--success-border)",
                  }}
                >
                  Original
                </span>
              )}
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 7px",
                  borderRadius: "var(--r-sm)",
                  background: bg,
                  color,
                  textTransform: "capitalize",
                }}
              >
                {script.status}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                color: "var(--fg-tertiary)",
                padding: 5,
                display: "flex",
                flexShrink: 0,
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 3px", color: "var(--fg)" }}>
            {script.title}
          </h2>
          {script.subtitle && (
            <div style={{ fontSize: 13, color: "var(--fg-secondary)" }}>{script.subtitle}</div>
          )}
        </div>

        {/* detail rows */}
        <div
          style={{
            padding: "0 var(--space-4)",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* Programs */}
          <div style={rowStyle}>
            <div style={labelStyle}>Programs</div>
            <div style={valueStyle}>
              {script.programs.map((p) => (
                <span key={p} className={`ss-program ${p}`}>
                  {PROG_LABEL[p]}
                </span>
              ))}
            </div>
          </div>

          {/* Cast size */}
          {script.castMin !== undefined && script.castMax !== undefined && (
            <div style={rowStyle}>
              <div style={labelStyle}>Cast size</div>
              <div style={{ ...valueStyle, gap: 4 }}>
                <Users style={{ width: 13, height: 13, color: "var(--fg-tertiary)" }} />
                {script.castMin}–{script.castMax} participants
              </div>
            </div>
          )}

          {/* Duration */}
          <div style={rowStyle}>
            <div style={labelStyle}>Duration</div>
            <div style={{ ...valueStyle, gap: 4 }}>
              <Clock style={{ width: 13, height: 13, color: "var(--fg-tertiary)" }} />
              {script.duration}
            </div>
          </div>

          {/* Last performed */}
          <div style={rowStyle}>
            <div style={labelStyle}>{script.status === "draft" ? "Timeline" : "Last performed"}</div>
            <div style={{ ...valueStyle, gap: 4 }}>
              <Calendar style={{ width: 13, height: 13, color: "var(--fg-tertiary)" }} />
              {script.lastUsed}
            </div>
          </div>

          {/* Type detail */}
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <div style={labelStyle}>Script type</div>
            <div style={{ ...valueStyle, gap: 4 }}>
              <Tag style={{ width: 13, height: 13, color: "var(--fg-tertiary)" }} />
              {TYPE_LABEL[script.type]}
              {script.original ? " · Original work" : script.adapted ? " · Adapted" : ""}
            </div>
          </div>
        </div>

        {/* footer actions */}
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderTop: "0.5px solid var(--border)",
            display: "flex",
            gap: 8,
            flexShrink: 0,
            background: "var(--bg)",
          }}
        >
          <button
            type="button"
            className="ss-btn"
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Download className="ss-btn-icon" />
            Download PDF
          </button>
          <button
            type="button"
            className="ss-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ── Script Card ───────────────────────────────────────────────────────────────

function ScriptCard({ script, onViewDetails }: { script: Script; onViewDetails: () => void }) {
  const TypeIcon = script.type === "musical" ? Music2 : FileText;
  const { bg, color } = STATUS_STYLE[script.status];
  const leadProg = script.programs[0];

  return (
    <div className="ss-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
      <div
        style={{
          background: `var(--${leadProg}-fill)`,
          padding: "var(--space-4)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: "var(--space-2)",
          }}
        >
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: "var(--r-sm)",
                background: "var(--surface)",
                color: "var(--fg-secondary)",
                border: "0.5px solid var(--border)",
              }}
            >
              <TypeIcon style={{ width: 11, height: 11 }} />
              {TYPE_LABEL[script.type]}
            </span>
            {script.adapted && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 7px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--info-fill)",
                  color: "var(--info-text)",
                  border: "0.5px solid var(--info-border)",
                }}
              >
                Adapted
              </span>
            )}
            {script.original && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 7px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--success-fill)",
                  color: "var(--success-text)",
                  border: "0.5px solid var(--success-border)",
                }}
              >
                Original
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 11,
              padding: "2px 7px",
              borderRadius: "var(--r-sm)",
              background: bg,
              color,
              textTransform: "capitalize",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {script.status}
          </span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 3px", color: "var(--fg)" }}>
          {script.title}
        </h3>
        {script.subtitle && (
          <div style={{ fontSize: 12, color: "var(--fg-secondary)" }}>{script.subtitle}</div>
        )}
      </div>

      <div
        style={{
          padding: "var(--space-3) var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {script.programs.map((p) => (
            <span key={p} className={`ss-program ${p}`}>
              {PROG_LABEL[p]}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {script.castMin !== undefined && script.castMax !== undefined && (
            <span
              style={{
                fontSize: 12,
                color: "var(--fg-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Users style={{ width: 12, height: 12 }} />
              {script.castMin}–{script.castMax} participants
            </span>
          )}
          <span
            style={{
              fontSize: 12,
              color: "var(--fg-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Clock style={{ width: 12, height: 12 }} />
            {script.duration}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
          {script.status === "draft" ? script.lastUsed : `Last performed: ${script.lastUsed}`}
        </div>
      </div>

      <div
        style={{
          padding: "var(--space-2) var(--space-4)",
          borderTop: "0.5px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg)",
        }}
      >
        <button
          type="button"
          style={{
            background: "none",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "5px 10px",
            cursor: "pointer",
            color: "var(--fg-secondary)",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
          }}
        >
          <Download style={{ width: 13, height: 13 }} />
          Download PDF
        </button>
        <button
          type="button"
          onClick={onViewDetails}
          style={{
            background: "none",
            border: "none",
            padding: "5px 4px",
            cursor: "pointer",
            color: "var(--primary)",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          View details
          <ChevronRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [scripts, setScripts] = useState<Script[]>(INITIAL_SCRIPTS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [progFilter, setProgFilter] = useState<"all" | Prog>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  // program slug → GUID, so newly-created scripts can be linked to real programs.
  const [progIdBySlug, setProgIdBySlug] = useState<Record<string, string>>({});

  // Load real scripts from the API (#18). If the library is empty or the backend is
  // unreachable, the seeded demo (INITIAL_SCRIPTS) stays on screen so the UI never breaks.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [dtos, programs] = await Promise.all([
          scriptsApi.getAll(),
          programsApi.getAll().catch(() => []),
        ]);
        if (!active) return;
        if (Array.isArray(dtos) && dtos.length > 0) {
          setScripts(dtos.map(scriptFromDto));
        }
        setProgIdBySlug(
          Object.fromEntries((programs ?? []).map((p) => [p.slug, p.id]))
        );
      } catch {
        // Keep the demo data — do not clear the UI on an API error.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(
    () =>
      scripts.filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (progFilter !== "all" && !s.programs.includes(progFilter)) return false;
        if (query && !s.title.toLowerCase().includes(query.toLowerCase().trim())) return false;
        return true;
      }),
    [scripts, query, statusFilter, progFilter]
  );

  function openModal() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleSubmit() {
    const min = form.castMin ? parseInt(form.castMin, 10) : undefined;
    const max = form.castMax ? parseInt(form.castMax, 10) : undefined;
    const year = new Date().getFullYear();

    const newScript: Script = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      type: form.type,
      original: form.source === "original",
      adapted: form.source === "adapted",
      programs: form.programs,
      castMin: min,
      castMax: max,
      duration: form.duration.trim() || "TBD",
      lastUsed: form.status === "draft" ? `Planned: ${year}` : "—",
      status: form.status,
    };

    // Optimistically show it immediately so the demo stays snappy.
    setScripts((prev) => [newScript, ...prev]);
    setStatusFilter(form.status);
    closeModal();

    // Persist to the library (#18), best-effort — a backend error must not lose the UI entry.
    const programIds = form.programs
      .map((p) => progIdBySlug[p])
      .filter((id): id is string => Boolean(id));
    scriptsApi
      .create({
        title: newScript.title,
        subtitle: newScript.subtitle,
        type: LOCAL_TYPE_TO_API[form.type],
        status: LOCAL_STATUS_TO_API[form.status],
        isOriginal: newScript.original,
        isAdapted: newScript.adapted,
        castMin: min,
        castMax: max,
        duration: form.duration.trim() || undefined,
        programIds,
      })
      .catch((err) => console.error("Failed to save script to the library:", err));
  }

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Script Library</h1>
          <span className="date">
            {visible.length} script{visible.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="right">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "0.5px solid var(--border-hover)",
              borderRadius: 8,
              padding: "5px 10px",
              background: "var(--surface)",
            }}
          >
            <Search style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }} />
            <input
              type="text"
              placeholder="Search scripts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: 13,
                background: "transparent",
                width: 160,
              }}
            />
          </div>
          <button className="ss-btn ss-btn-primary" type="button" onClick={openModal}>
            <Plus className="ss-btn-icon" />
            Add script
          </button>
        </div>
      </div>

      <div className="adm-content">
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: "var(--space-5)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 5 }}>
            {STATUS_FILTERS.map((f) => (
              <span
                key={f}
                className={`ss-chip${statusFilter === f ? " is-active" : ""}`}
                style={{ cursor: "pointer", textTransform: "capitalize" }}
                onClick={() => setStatusFilter(f)}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </span>
            ))}
          </div>
          <div
            style={{ width: "0.5px", height: 16, background: "var(--border-strong)", flexShrink: 0 }}
          />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {PROG_FILTERS.map((p) => (
              <span
                key={p}
                className={`ss-chip${progFilter === p ? ` is-active${p !== "all" ? ` ${p}` : ""}` : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => setProgFilter(p)}
              >
                {p === "all" ? (
                  "All programs"
                ) : (
                  <>
                    <span className={`ss-dot ${p}`} />
                    {PROG_LABEL[p]}
                  </>
                )}
              </span>
            ))}
          </div>
        </div>

        {visible.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {visible.map((script) => (
              <ScriptCard
                key={script.title}
                script={script}
                onViewDetails={() => setSelectedScript(script)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-3)",
              padding: "var(--space-8) var(--space-5)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-md)",
                background: "var(--bg-secondary)",
                color: "var(--fg-secondary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen style={{ width: 22, height: 22 }} />
            </span>
            <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)" }}>No scripts found</h3>
            <p className="ss-meta" style={{ maxWidth: 320 }}>
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>

      {modalOpen && (
        <AddScriptModal
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {selectedScript && (
        <ScriptDetailPanel
          script={selectedScript}
          onClose={() => setSelectedScript(null)}
        />
      )}
    </div>
  );
}

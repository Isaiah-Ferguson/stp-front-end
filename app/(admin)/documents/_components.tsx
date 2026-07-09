"use client";

"use client";

import { useEscapeKey } from "@/lib/useEscapeKey";
import {
  Download,
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

import { useDialogFocus } from "@/lib/useDialogFocus";
import {
  type Script,
  type ScriptType,
  type ScriptStatus,
  type Prog,
  type FormState,
  PROG_LABEL,
  TYPE_LABEL,
  STATUS_STYLE,
} from "./_model";

// ── Add Script Modal ──────────────────────────────────────────────────────────

export function AddScriptModal({
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
  const panelRef = useDialogFocus<HTMLDivElement>();

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
        ref={panelRef}
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

export function ScriptDetailPanel({ script, onClose }: { script: Script; onClose: () => void }) {
  useEscapeKey(onClose);
  const panelRef = useDialogFocus<HTMLDivElement>();
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
        ref={panelRef}
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

export function ScriptCard({ script, onViewDetails }: { script: Script; onViewDetails: () => void }) {
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


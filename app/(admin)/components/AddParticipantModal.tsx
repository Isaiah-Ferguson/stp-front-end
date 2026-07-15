"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus, AlertCircle, X } from "lucide-react";
import { participantsApi } from "@/lib/api/participants";
import { queryKeys } from "@/lib/api/hooks";
import type {
  ProgramSummaryDto,
  CreateParticipantDto,
  ParticipantStatus,
} from "@/lib/types/api";

type AddParticipantForm = {
  nm: string;
  birthYear: string;
  programId: string;
  status: "active" | "prospective";
  sc: string;
};

const EMPTY_FORM: AddParticipantForm = { nm: "", birthYear: "", programId: "", status: "prospective", sc: "" };

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AddParticipantModal({
  programs,
  onClose,
  defaultProgramId,
}: {
  programs: ProgramSummaryDto[];
  onClose: () => void;
  defaultProgramId?: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddParticipantForm>({ ...EMPTY_FORM, programId: defaultProgramId ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = form.nm.trim().length > 0 && form.programId !== "" && !saving;

  async function handleSubmit() {
    const statusMap: Record<string, ParticipantStatus> = { active: "Active", prospective: "Prospective" };
    const dto: CreateParticipantDto = {
      fullName: form.nm.trim(),
      initials: toInitials(form.nm),
      programId: form.programId,
      status: statusMap[form.status] ?? "Prospective",
      birthYear: form.birthYear ? parseInt(form.birthYear) : undefined,
      serviceCoordinator: form.sc.trim() || undefined,
    };

    setSaving(true);
    try {
      await participantsApi.create(dto);
      // These caches all hold participant lists — refetch them (#34).
      queryClient.invalidateQueries({ queryKey: queryKeys.participants });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: ["program-detail"] });
      onClose();
    } catch {
      setError("Could not save student — check that the backend is running and try again.");
      setSaving(false);
    }
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
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px" }}>Add student</h3>
            <div style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>New student will appear in the roster</div>
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
            <div className="ss-label" style={{ marginBottom: 6 }}>Birth year <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional</span></div>
            <input type="number" min={1940} max={2015} placeholder="e.g. 1998" value={form.birthYear} onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value }))} style={{ ...inputStyle, width: "40%" }} />
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Program <span style={{ color: "var(--danger)", fontWeight: 400 }}>*</span></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {programs.map((p) => {
                const selected = form.programId === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setForm((f) => ({ ...f, programId: p.id }))}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: "var(--r-pill)", border: `0.5px solid ${selected ? `var(--${p.slug}-border)` : "var(--border)"}`, background: selected ? `var(--${p.slug}-fill)` : "var(--surface)", color: selected ? `var(--${p.slug})` : "var(--fg-secondary)", cursor: "pointer", fontSize: 13 }}>
                    <span className={`ss-dot ${p.slug}`} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 8 }}>Status</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["prospective", "active"] as const).map((s) => (
                <button key={s} type="button" className={`ss-chip${form.status === s ? " is-active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setForm((f) => ({ ...f, status: s }))}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="ss-label" style={{ marginBottom: 6 }}>Service coordinator <span style={{ fontSize: 11, color: "var(--fg-tertiary)", fontWeight: 400 }}>Optional</span></div>
            <input type="text" placeholder="e.g. R. Alvarez" value={form.sc} onChange={(e) => setForm((f) => ({ ...f, sc: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{ margin: "0 var(--space-4)", padding: "8px 12px", borderRadius: "var(--r-md)", background: "var(--danger-fill, #fce8e8)", color: "var(--danger)", fontSize: 12, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}
        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="ss-btn" type="button" onClick={onClose}>Cancel</button>
          <button className="ss-btn ss-btn-primary" type="button" onClick={handleSubmit} disabled={!canSubmit}>
            <UserPlus className="ss-btn-icon" />
            {saving ? "Saving…" : "Add student"}
          </button>
        </div>
      </div>
    </div>
  );
}

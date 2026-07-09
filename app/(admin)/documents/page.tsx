"use client";

import { useState, useMemo, useEffect } from "react";
import { scriptsApi } from "@/lib/api/scripts";
import { programsApi } from "@/lib/api/programs";
import {
  BookOpen,
  Search,
  Plus,
} from "lucide-react";

import { AddScriptModal, ScriptDetailPanel, ScriptCard } from "./_components";
import {
  type Script,
  type Prog,
  type StatusFilter,
  type FormState,
  INITIAL_SCRIPTS,
  STATUS_FILTERS,
  PROG_FILTERS,
  PROG_LABEL,
  EMPTY_FORM,
  LOCAL_TYPE_TO_API,
  LOCAL_STATUS_TO_API,
  scriptFromDto,
} from "./_model";

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


"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useAuditEvents, useUsers } from "@/lib/api/hooks";
import LoadError from "@/app/components/LoadError";
import { Skeleton } from "../components/Skeleton";
import { parseApiTimestamp, timestampLabel } from "@/lib/format";
import type { AuditEventDto, AuditQueryParams } from "@/lib/types/api";

// ── Filter vocabularies ───────────────────────────────────────────────────────
//
// Both lists mirror what the backend actually writes. They are hand-maintained because the
// API has no "distinct actions" endpoint, and deriving them from the current page would be
// worse than useless: the filter would only ever offer the values already on screen.

/**
 * `action` is a PREFIX match server-side, so "auth" pulls auth.login, auth.mfa.verify and
 * auth.password.change in one filter. The entries below are chosen to be useful prefixes
 * rather than an exhaustive list of every key.
 */
const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "",                    label: "All actions" },
  { value: "auth",                label: "Authentication (all)" },
  { value: "auth.login",          label: "· Sign-in" },
  { value: "auth.logout",         label: "· Sign-out" },
  { value: "auth.mfa",            label: "· Two-factor" },
  { value: "auth.password",       label: "· Password changes" },
  { value: "auth.refresh.replay", label: "· Refresh-token replay" },
  { value: "user",                label: "User accounts" },
  { value: "participant",         label: "Stars" },
  { value: "staff",               label: "Staff" },
  { value: "volunteer",           label: "Volunteers" },
  { value: "reports",             label: "Reports" },
  { value: "export",              label: "CSV exports" },
  { value: "audit",               label: "Audit log views" },
];

/** `entityType` is an EXACT match, so these are the stored values verbatim. */
const ENTITY_OPTIONS = [
  "Participant",
  "ParticipantArtsProfile",
  "StaffMember",
  "ChecklistTemplateItem",
  "Volunteer",
  "User",
  "Reports",
  "Export",
  "AuditEvent",
];

const PAGE_SIZES = [25, 50, 100, 200]; // 200 is the server's clamp — asking for more is silently reduced.

// ── Local day → UTC instant ───────────────────────────────────────────────────
//
// The log stores UTC and the endpoint takes instants, but an admin picking "17 Aug" means
// their own 17 August. Sending the bare date would filter on the UTC day, which in
// California starts at 5pm the previous afternoon — so an evening sign-in lands on the
// "wrong" day and a same-day filter appears to lose events. Converting here keeps the
// question the admin asked ("what happened on the 17th, my time") the question we send.

const startOfLocalDayUtc = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00`).toISOString();
/** Inclusive: the backend filters OccurredAt <= to. */
const endOfLocalDayUtc = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T23:59:59.999`).toISOString();

// ── Cell helpers ──────────────────────────────────────────────────────────────

/** Guids are 36 characters and blow the column width apart; the head is enough to eyeball. */
const shortId = (id: string) => `${id.slice(0, 8)}…`;

/** Metadata is server-written JSON, but never assume — a raw string still renders. */
function prettyMetadata(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const monoStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums",
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: "var(--fs-label)",
  textTransform: "uppercase",
  letterSpacing: "var(--ls-label)",
  color: "var(--fg-tertiary)",
  marginBottom: 3,
};

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={detailLabelStyle}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--fg-secondary)", wordBreak: "break-word" }}>{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  // Filters. Each one resets to page 1 when it changes — otherwise narrowing the range
  // while on page 6 shows an empty table that looks like "no results".
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [outcome, setOutcome] = useState<"all" | "success" | "failure">("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [expanded, setExpanded] = useState<string | null>(null);

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); };
  }

  const setFrom = resetPageAnd(setFromDate);
  const setTo = resetPageAnd(setToDate);
  const setActionFilter = resetPageAnd(setAction);
  const setEntityFilter = resetPageAnd(setEntityType);
  const setOutcomeFilter = resetPageAnd(setOutcome);

  // The email box is debounced while every other control applies on the spot. Each request
  // this page makes writes an audit.view row of its own, so a per-keystroke fetch would
  // bury the log it is meant to make readable — twelve rows to type one address.
  useEffect(() => {
    const id = setTimeout(() => {
      setEmailFilter(emailInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [emailInput]);

  const params = useMemo<AuditQueryParams>(
    () => ({
      from: fromDate ? startOfLocalDayUtc(fromDate) : undefined,
      to: toDate ? endOfLocalDayUtc(toDate) : undefined,
      userEmail: emailFilter || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      succeeded: outcome === "all" ? undefined : outcome === "success",
      page,
      pageSize,
    }),
    [fromDate, toDate, emailFilter, action, entityType, outcome, page, pageSize]
  );

  const auditQ = useAuditEvents(params);
  const rows: AuditEventDto[] = auditQ.data?.rows ?? [];
  const total = auditQ.data?.total ?? 0;
  // isPending stays false while keepPreviousData holds the last page on screen; isFetching
  // is what tells the user a newer page is on its way.
  const loading = auditQ.isPending;

  // Known accounts, offered as suggestions on the email box. It stays a free-text field
  // rather than a dropdown because the most interesting rows in this log are failed
  // sign-ins against addresses that have no account — a dropdown could not express them.
  const usersQ = useUsers();
  const knownEmails = useMemo(
    () => Array.from(new Set((usersQ.data ?? []).map((u) => u.email))).sort((a, b) => a.localeCompare(b)),
    [usersQ.data]
  );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;

  const hasFilters = Boolean(fromDate || toDate || emailFilter || action || entityType || outcome !== "all");

  /**
   * First page, last page, and the current page's neighbours, with gaps elided. The Stars
   * table builds this by materializing every page number and filtering it down, which is
   * fine for a hundred participants; this table is append-only with no purge path, so at
   * 200k rows that would allocate an 8,000-entry array on every render to draw five buttons.
   */
  const pageButtons = useMemo<(number | "…")[]>(() => {
    const candidates = [1, currentPage - 1, currentPage, currentPage + 1, pageCount]
      .filter((n, i, all) => n >= 1 && n <= pageCount && all.indexOf(n) === i)
      .sort((a, b) => a - b);
    return candidates.reduce<(number | "…")[]>((acc, n) => {
      const prev = acc[acc.length - 1];
      if (typeof prev === "number" && n - prev > 1) acc.push("…");
      acc.push(n);
      return acc;
    }, []);
  }, [currentPage, pageCount]);

  function clearFilters() {
    setFromDate("");
    setToDate("");
    setEmailInput("");
    setEmailFilter("");
    setAction("");
    setEntityType("");
    setOutcome("all");
    setPage(1);
  }

  const filterSummary = [
    fromDate || toDate ? `${fromDate || "start"} → ${toDate || "now"}` : "all dates",
    // The sub-entries are indented with "· " in the dropdown; that prefix would read as a
    // stray separator once the summary joins everything with the same character.
    action ? (ACTION_OPTIONS.find((o) => o.value === action)?.label ?? action).replace(/^· /, "") : "all actions",
    entityType || "all entities",
    outcome === "all" ? "all outcomes" : outcome === "success" ? "succeeded only" : "failures only",
    ...(emailFilter ? [emailFilter] : []),
  ].join(" · ");

  // NO CSV EXPORT HERE, deliberately.
  //
  // Every export in this product reports itself to POST /api/audit/export, and that endpoint
  // takes a closed set of export kinds (ExportAuditValidation.AllowedKinds) with no entry for
  // the audit log. So a download button on this page could only either go unrecorded, or
  // report itself as one of the existing kinds — filing "somebody exported the audit log" as
  // "somebody exported the roster", which is worse than not recording it at all. Adding the
  // kind is a backend change; until then the log is read here and the database is the export.

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Audit Log</h1>
          <span className="date">Every security-relevant action, newest first</span>
        </div>
        <div className="right">
          <button
            className="ss-btn"
            type="button"
            onClick={() => auditQ.refetch()}
            disabled={auditQ.isFetching}
          >
            <RefreshCw className="ss-btn-icon" />
            {auditQ.isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* filter bar */}
        <div className="filter-bar">
          <label className="ss-label" htmlFor="audit-from" style={{ color: "var(--fg-secondary)" }}>From</label>
          <input
            id="audit-from"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
          <label className="ss-label" htmlFor="audit-to" style={{ color: "var(--fg-secondary)" }}>To</label>
          <input
            id="audit-to"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setTo(e.target.value)}
          />

          <select
            aria-label="Filter by action"
            value={action}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            aria-label="Filter by entity type"
            value={entityType}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <option value="">All entities</option>
            {ENTITY_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            aria-label="Filter by outcome"
            value={outcome}
            onChange={(e) => setOutcomeFilter(e.target.value as "all" | "success" | "failure")}
          >
            <option value="all">All outcomes</option>
            <option value="success">Succeeded</option>
            <option value="failure">Failures only</option>
          </select>

          {hasFilters && (
            <button type="button" className="ss-chip" style={{ cursor: "pointer" }} onClick={clearFilters}>
              <X style={{ width: 12, height: 12 }} />
              Clear
            </button>
          )}

          <div className="search">
            <Search />
            <input
              type="text"
              placeholder="Exact email…"
              aria-label="Filter by user email (exact address)"
              value={emailInput}
              list="audit-known-emails"
              onChange={(e) => setEmailInput(e.target.value)}
            />
            {/* Suggestions only — the backend matches the address exactly, so a partial
                address returns nothing rather than a near miss. */}
            <datalist id="audit-known-emails">
              {knownEmails.map((email) => (
                <option key={email} value={email} />
              ))}
            </datalist>
          </div>
        </div>

        {/* data table */}
        <div className="tbl-card">
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 36 }} aria-label="Details" />
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>IP</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }, (_, i) => (
                    <tr key={`sk-${i}`}>
                      <td><Skeleton w={14} h={14} r={3} /></td>
                      <td><Skeleton w={140} h={11} /></td>
                      <td><Skeleton w={150} h={11} /></td>
                      <td><Skeleton w={120} h={11} /></td>
                      <td><Skeleton w={90} h={11} /></td>
                      <td><Skeleton w={80} h={11} /></td>
                      <td><Skeleton w={62} h={18} r={10} /></td>
                    </tr>
                  ))
                ) : auditQ.isError ? (
                  <tr>
                    <td colSpan={7}>
                      <LoadError
                        title="Couldn't load the audit log"
                        error={auditQ.error}
                        onRetry={() => auditQ.refetch()}
                      />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>
                      {hasFilters ? "No events match the current filters." : "No audit events recorded yet."}
                    </td>
                  </tr>
                ) : rows.map((row) => {
                  const isOpen = expanded === row.id;
                  // Failures carry the tint AND a labelled badge — colour alone would be
                  // invisible to anyone who cannot distinguish it.
                  const failStyle: React.CSSProperties | undefined = row.succeeded
                    ? undefined
                    : { background: "var(--danger-fill)", boxShadow: "inset 3px 0 0 var(--danger)" };
                  return (
                    <Fragment key={row.id}>
                      <tr
                        style={failStyle}
                        onClick={() => setExpanded(isOpen ? null : row.id)}
                      >
                        <td>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Hide event details" : "Show event details"}
                            onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : row.id); }}
                            style={{
                              background: "none", border: "none", cursor: "pointer", padding: 2,
                              display: "inline-flex", color: "var(--fg-tertiary)",
                            }}
                          >
                            {isOpen
                              ? <ChevronDown style={{ width: 14, height: 14 }} />
                              : <ChevronRight style={{ width: 14, height: 14 }} />}
                          </button>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }} title={parseApiTimestamp(row.occurredAt).toISOString()}>
                          {timestampLabel(row.occurredAt)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{row.userEmail || "—"}</div>
                          <div className="ss-meta" style={{ color: "var(--fg-tertiary)" }}>
                            {row.userRole ?? (row.userId ? "" : "no account")}
                          </div>
                        </td>
                        <td>
                          <div style={monoStyle}>{row.action}</div>
                          {row.summary && (
                            <div className="ss-meta" style={{ color: "var(--fg-tertiary)" }}>{row.summary}</div>
                          )}
                        </td>
                        <td>
                          <div>{row.entityType ?? "—"}</div>
                          {row.entityId && (
                            <div className="ss-meta" style={{ ...monoStyle, color: "var(--fg-tertiary)" }} title={row.entityId}>
                              {shortId(row.entityId)}
                            </div>
                          )}
                        </td>
                        <td className="ss-meta" style={monoStyle}>{row.ipAddress ?? "—"}</td>
                        <td>
                          {row.succeeded ? (
                            <span className="ss-badge is-active"><Check />Succeeded</span>
                          ) : (
                            <span className="ss-badge is-attention"><AlertTriangle />Failed</span>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr style={{ cursor: "default", ...(failStyle ?? {}) }}>
                          <td colSpan={7} style={{ background: row.succeeded ? "var(--bg-secondary)" : undefined }}>
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                              gap: "var(--space-4)",
                              padding: "var(--space-2) var(--space-1)",
                            }}>
                              <DetailField label="Event ID"><span style={monoStyle}>{row.id}</span></DetailField>
                              <DetailField label="Occurred (UTC)">
                                <span style={monoStyle}>{parseApiTimestamp(row.occurredAt).toISOString()}</span>
                              </DetailField>
                              <DetailField label="Entity ID">
                                <span style={monoStyle}>{row.entityId ?? "—"}</span>
                              </DetailField>
                              <DetailField label="Account ID">
                                <span style={monoStyle}>{row.userId ?? "no matching account"}</span>
                              </DetailField>
                              <DetailField label="Summary">{row.summary ?? "—"}</DetailField>
                              <DetailField label="User agent">{row.userAgent ?? "—"}</DetailField>
                            </div>
                            {row.metadata && (
                              <div style={{ padding: "var(--space-2) var(--space-1) 0" }}>
                                <div style={detailLabelStyle}>Metadata</div>
                                <pre style={{
                                  ...monoStyle,
                                  fontSize: 11.5,
                                  color: "var(--fg-secondary)",
                                  background: "var(--surface)",
                                  border: "var(--bw) solid var(--border)",
                                  borderRadius: "var(--r-md)",
                                  padding: "var(--space-3)",
                                  margin: 0,
                                  overflowX: "auto",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}>
                                  {prettyMetadata(row.metadata)}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tbl-foot">
            <span className="info">
              Showing {total === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + rows.length, total)} of {total} event{total === 1 ? "" : "s"}
            </span>
            <span className="info">· {filterSummary}</span>
            {auditQ.isFetching && !loading && <span className="info">· updating…</span>}
            <div className="rpp">
              Rows per page
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="pager">
              <button
                type="button"
                className="pg"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft style={{ width: 14, height: 14, opacity: currentPage <= 1 ? 0.35 : 1 }} />
              </button>
              {pageButtons.map((n, i) =>
                n === "…" ? (
                  <span key={`gap-${i}`} className="pg" style={{ cursor: "default" }}>…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    className={`pg${n === currentPage ? " is-active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                className="pg"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight style={{ width: 14, height: 14, opacity: currentPage >= pageCount ? 0.35 : 1 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

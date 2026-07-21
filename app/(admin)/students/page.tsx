"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { parseLocalDate } from "@/lib/format";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Skeleton } from "../components/Skeleton";
import BulkActionsBar from "../components/BulkActionsBar";
import {
  UserPlus,
  Download,
  AlertTriangle,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  CheckCircle2,
  MinusCircle,
  FileX,
  type LucideIcon,
} from "lucide-react";
import { useParticipants, usePrograms } from "@/lib/api/hooks";
import LoadError from "@/app/components/LoadError";
import AddParticipantModal from "../components/AddParticipantModal";
import type {
  ParticipantSummaryDto,
  ProgramSummaryDto,
} from "@/lib/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "active" | "prospective" | "attention" | "former";
type AlertKind = "expiring" | "overdue" | "missing";
type StatusTab = "all" | Status;
type SortKey = "name" | "att" | "start";

const STATUS_BADGE: Record<Status, { cls: string; icon: LucideIcon; label: string }> = {
  active:      { cls: "is-active",      icon: CheckCircle2, label: "Active" },
  prospective: { cls: "is-prospective", icon: Clock,        label: "Prospective" },
  attention:   { cls: "is-attention",   icon: AlertCircle,  label: "Needs attention" },
  former:      { cls: "is-former",      icon: MinusCircle,  label: "Former" },
};

const ALERT_ICON: Record<AlertKind, { icon: LucideIcon; cls: string }> = {
  expiring: { icon: AlertTriangle, cls: "ai-expiring" },
  overdue:  { icon: Clock,         cls: "ai-overdue" },
  missing:  { icon: FileX,         cls: "ai-missing" },
};

type Student = {
  id: string;
  init: string;
  nm: string;
  birthYear: string;
  prog: string;
  progName: string;
  status: Status;
  alerts: AlertKind[];
  att: number;
  sc: string;
  start: string;
  startRaw: string;
};

// ── DTO → local type ──────────────────────────────────────────────────────────

function dtoToStudent(dto: ParticipantSummaryDto): Student {
  const d = parseLocalDate(dto.startDate);
  const startLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return {
    id: dto.id,
    init: dto.initials,
    nm: dto.fullName,
    birthYear: dto.birthYear ? `b. ${dto.birthYear}` : "—",
    prog: dto.programSlug,
    progName: dto.programName,
    status: dto.status.toLowerCase() as Status,
    alerts: dto.hasDocAlerts ? ["expiring"] : [],
    att: dto.attendancePct,
    sc: dto.serviceCoordinator ?? "—",
    start: startLabel,
    startRaw: dto.startDate,
  };
}

function exportCsv(rows: Student[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ["Name", "Birth year", "Program", "Status", "Alerts", "Attendance %", "Service coordinator", "Started"];
  const lines = rows.map((s) =>
    [s.nm, s.birthYear, s.progName, STATUS_BADGE[s.status]?.label ?? s.status, s.alerts.join("; ") || "none", s.att, s.sc, s.startRaw]
      .map(esc)
      .join(",")
  );
  const blob = new Blob([[header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  // Cached + shared across pages via React Query (#34).
  const { isAdmin } = useAuth();
  const participantsQ = useParticipants();
  const programsQ = usePrograms();
  const loading = participantsQ.isPending || programsQ.isPending;
  const data = useMemo(() => (participantsQ.data ?? []).map(dtoToStudent), [participantsQ.data]);
  const programs: ProgramSummaryDto[] = programsQ.data ?? [];
  const [modalOpen, setModalOpen] = useState(false);

  // filters
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [query, setQuery] = useState("");

  // sorting + paging + selection
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const counts = {
    all:         data.length,
    active:      data.filter((d) => d.status === "active").length,
    prospective: data.filter((d) => d.status === "prospective").length,
    attention:   data.filter((d) => d.status === "attention").length,
    former:      data.filter((d) => d.status === "former").length,
  };

  const alertStudentCount = data.filter((d) => d.alerts.length > 0).length;

  // Existing coordinators, for quick-pick when bulk-assigning.
  const coordinators = useMemo(
    () =>
      Array.from(
        new Set((participantsQ.data ?? []).map((p) => p.serviceCoordinator).filter((c): c is string => !!c && c !== "—"))
      ).sort((a, b) => a.localeCompare(b)),
    [participantsQ.data]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = data.filter((d) => {
      if (statusTab !== "all" && d.status !== statusTab) return false;
      if (programFilter !== "all" && d.prog !== programFilter) return false;
      if (alertsOnly && d.alerts.length === 0) return false;
      if (q && !d.nm.toLowerCase().includes(q) && !d.progName.toLowerCase().includes(q) && !d.sc.toLowerCase().includes(q)) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "att") return (a.att - b.att) * dir;
      if (sortKey === "start") return a.startRaw.localeCompare(b.startRaw) * dir;
      return a.nm.localeCompare(b.nm) * dir;
    });
    return rows;
  }, [data, statusTab, programFilter, alertsOnly, query, sortKey, sortDir]);

  // Filters can shrink the result set below the current page — clamp when reading.
  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageRows = filtered.slice(pageStart, pageStart + rowsPerPage);

  const allVisibleSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "att" ? "desc" : "asc"); }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); };
  }

  const setTab = resetPageAnd(setStatusTab);
  const setProg = resetPageAnd(setProgramFilter);
  const setAlerts = resetPageAnd(setAlertsOnly);
  const setSearch = resetPageAnd(setQuery);

  const exportRows = selected.size > 0 ? filtered.filter((r) => selected.has(r.id)) : filtered;

  const sortCaret = (col: SortKey) =>
    sortKey === col ? (
      <span className="caret">{sortDir === "asc" ? <ChevronUp /> : <ChevronDown />}</span>
    ) : (
      <span className="caret" style={{ opacity: 0.35 }}><ChevronDown /></span>
    );

  const ariaSort = (col: SortKey): "ascending" | "descending" | "none" =>
    sortKey === col ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  // Sortable header: the label is a real <button> so it's reachable and
  // operable by keyboard; aria-sort tells assistive tech the current order.
  const sortableTh = (col: SortKey, label: string) => (
    <th className="sortable" aria-sort={ariaSort(col)}>
      <button type="button" className="th-sort" onClick={() => toggleSort(col)}>
        {label} {sortCaret(col)}
      </button>
    </th>
  );

  const filterSummary = [
    statusTab === "all" ? "All statuses" : STATUS_BADGE[statusTab].label,
    programFilter === "all" ? "all programs" : programs.find((p) => p.slug === programFilter)?.name ?? programFilter,
    ...(alertsOnly ? ["alerts only"] : []),
  ].join(" · ");

  const TAB_DEFS: { key: StatusTab; cls: string; label: string; count: number }[] = [
    { key: "all",         cls: "",      label: "All Students",    count: counts.all },
    { key: "active",      cls: "green", label: "Active",          count: counts.active },
    { key: "prospective", cls: "amber", label: "Prospective",     count: counts.prospective },
    { key: "attention",   cls: "red",   label: "Needs Attention", count: counts.attention },
    { key: "former",      cls: "gray",  label: "Former",          count: counts.former },
  ];

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div className="titles">
          <h1>Students</h1>
        </div>
        <div className="right">
          <button className="ss-btn ss-btn-primary" type="button" onClick={() => setModalOpen(true)}>
            <UserPlus className="ss-btn-icon" />
            Add student
          </button>
          <button
            className="ss-btn"
            type="button"
            onClick={() => exportCsv(exportRows)}
            disabled={loading || filtered.length === 0}
          >
            <Download className="ss-btn-icon" />
            Export{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>
      </div>

      <div className="adm-content">
        {/* stat tabs */}
        <div className="stat-tabs">
          {TAB_DEFS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`stat-tab ${t.cls}${statusTab === t.key ? " is-active" : ""}`.trim()}
              onClick={() => setTab(t.key)}
              aria-pressed={statusTab === t.key}
            >
              <span className="num">{t.count}</span>
              <span className="label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* alert banner */}
        {alertStudentCount > 0 && !alertsOnly && (
          <div className="ss-alert is-danger">
            <AlertTriangle />
            <span className="ss-alert-text">
              <strong>{alertStudentCount} student{alertStudentCount > 1 ? "s" : ""} require action</strong> — expiring POS, missing intake docs, or overdue follow-up.
            </span>
            <button
              className="ss-alert-action"
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}
              onClick={() => setAlerts(true)}
            >
              View all alerts →
            </button>
          </div>
        )}

        {/* filter bar */}
        <div className="filter-bar">
          <button
            type="button"
            className={`ss-chip${programFilter === "all" ? " is-active" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => setProg("all")}
          >
            All
          </button>
          {programs.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`ss-chip${programFilter === p.slug ? ` is-active ${p.slug}` : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setProg(programFilter === p.slug ? "all" : p.slug)}
            >
              <span className={`ss-dot ${p.slug}`} />
              {p.name}
            </button>
          ))}
          <span className="sep" />
          <button
            type="button"
            className="ss-chip"
            style={
              alertsOnly
                ? { cursor: "pointer", background: "var(--danger-fill)", color: "var(--danger-text)", borderColor: "var(--danger-border)" }
                : { cursor: "pointer" }
            }
            onClick={() => setAlerts(!alertsOnly)}
            aria-pressed={alertsOnly}
          >
            <AlertCircle style={{ width: 12, height: 12 }} />
            Alerts only
            {alertsOnly && <Check style={{ width: 12, height: 12 }} />}
          </button>
          <div className="search">
            <Search />
            <input
              type="text"
              placeholder="Search students…"
              value={query}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* bulk actions — appear once rows are selected */}
        {selected.size > 0 && (
          <BulkActionsBar
            ids={[...selected]}
            programs={programs}
            coordinators={coordinators}
            isAdmin={isAdmin}
            onClear={() => setSelected(new Set())}
          />
        )}

        {/* data table */}
        <div className="tbl-card">
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <button
                      type="button"
                      className={`chk${allVisibleSelected ? " is-checked" : ""}`}
                      aria-label={allVisibleSelected ? "Deselect all on this page" : "Select all on this page"}
                      onClick={toggleAllVisible}
                    />
                  </th>
                  {sortableTh("name", "Student")}
                  <th>Program</th>
                  <th>Status</th>
                  <th>Alerts</th>
                  {sortableTh("att", "Attendance")}
                  <th>Service Coord</th>
                  {sortableTh("start", "Started")}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: rowsPerPage }, (_, i) => (
                    <tr key={`sk-${i}`}>
                      <td><Skeleton w={14} h={14} r={3} /></td>
                      <td>
                        <div className="cell-student">
                          <Skeleton w={28} h={28} circle />
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <Skeleton w={130} h={11} />
                            <Skeleton w={54} h={9} />
                          </div>
                        </div>
                      </td>
                      <td><Skeleton w={90} h={11} /></td>
                      <td><Skeleton w={72} h={18} r={10} /></td>
                      <td><Skeleton w={16} h={11} /></td>
                      <td><Skeleton w={80} h={11} /></td>
                      <td><Skeleton w={70} h={11} /></td>
                      <td><Skeleton w={60} h={11} /></td>
                    </tr>
                  ))
                ) : participantsQ.isError ? (
                  <tr>
                    <td colSpan={8}>
                      <LoadError
                        title="Couldn't load students"
                        error={participantsQ.error}
                        onRetry={() => participantsQ.refetch()}
                      />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-tertiary)", fontSize: 13 }}>
                      {data.length === 0 ? "No students yet — add one to get started." : "No students match the current filters."}
                    </td>
                  </tr>
                ) : pageRows.map((d) => {
                  const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.active;
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={d.id}>
                      <td>
                        <button
                          type="button"
                          className={`chk${selected.has(d.id) ? " is-checked" : ""}`}
                          aria-label={`Select ${d.nm}`}
                          onClick={() => toggleRow(d.id)}
                        />
                      </td>
                      <td>
                        <div className="cell-student">
                          <span className="ss-avatar sm" style={{ background: `var(--${d.prog}-fill)`, color: `var(--${d.prog})`, border: `0.5px solid var(--${d.prog}-border)` }}>
                            {d.init}
                          </span>
                          <div>
                            <Link href={`/students/${d.id}`} className="nm" style={{ color: "inherit", textDecoration: "none" }}>{d.nm}</Link>
                            <div className="dob">{d.birthYear}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cell-prog">
                          <span className={`ss-dot ${d.prog}`} />
                          {d.progName}
                        </span>
                      </td>
                      <td>
                        <span className={`ss-badge ${badge.cls}`}>
                          <BadgeIcon />
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        {d.alerts.length ? (
                          <span className="alert-icons">
                            {d.alerts.map((a) => {
                              const Ai = ALERT_ICON[a].icon;
                              return <Ai key={a} className={ALERT_ICON[a].cls} />;
                            })}
                          </span>
                        ) : (
                          <span className="ss-meta" style={{ color: "var(--fg-tertiary)" }}>—</span>
                        )}
                      </td>
                      <td>
                        {d.att > 0 ? (
                          <span className="att-mini">
                            <span className="ss-progress">
                              <span className={`ss-progress-fill ${d.prog}`} style={{ width: `${d.att}%` }} />
                            </span>
                            <span className="pct">{d.att}%</span>
                          </span>
                        ) : (
                          <span className="ss-meta" style={{ color: "var(--fg-tertiary)" }}>—</span>
                        )}
                      </td>
                      <td className="ss-meta">{d.sc}</td>
                      <td className="ss-meta">{d.start}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="tbl-foot">
            <span className="info">
              Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + rowsPerPage, filtered.length)} of {filtered.length} student{filtered.length === 1 ? "" : "s"}
            </span>
            <span className="info">· {filterSummary}</span>
            {selected.size > 0 && <span className="info">· {selected.size} selected</span>}
            <div className="rpp">
              Rows per page
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
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
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === pageCount || Math.abs(n - currentPage) <= 1)
                .reduce<(number | "…")[]>((acc, n) => {
                  const prev = acc[acc.length - 1];
                  if (typeof prev === "number" && n - prev > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
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

      {modalOpen && (
        <AddParticipantModal programs={programs} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

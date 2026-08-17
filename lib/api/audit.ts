import { api, apiFetchWithHeaders } from "./client";
import type {
  AuditEventDto,
  AuditPageDto,
  AuditQueryParams,
  RecordExportDto,
} from "../types/api";

/**
 * Only sends the filters that are actually set. An empty string is not the same as an
 * absent filter here: `?userEmail=` would reach the backend as an empty-but-present value,
 * and while it happens to be ignored today, relying on that is how a filter quietly starts
 * matching nothing.
 */
function toQueryString(q: AuditQueryParams): string {
  const params = new URLSearchParams();
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.userId) params.set("userId", q.userId);
  if (q.userEmail?.trim()) params.set("userEmail", q.userEmail.trim());
  if (q.action?.trim()) params.set("action", q.action.trim());
  if (q.entityType?.trim()) params.set("entityType", q.entityType.trim());
  if (q.succeeded !== undefined) params.set("succeeded", String(q.succeeded));
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  return params.toString();
}

export const auditApi = {
  /**
   * Newest first, paged server-side. The row count for the whole filtered set comes back
   * in X-Total-Count rather than the body, so this goes through apiFetchWithHeaders.
   */
  search: async (q: AuditQueryParams = {}): Promise<AuditPageDto> => {
    const qs = toQueryString(q);
    const { data, headers } = await apiFetchWithHeaders<AuditEventDto[]>(
      `/api/audit${qs ? `?${qs}` : ""}`
    );
    const rows = data ?? [];
    // A missing or malformed header must not render "of NaN". Falling back to the page
    // length understates the total, which is visibly wrong rather than silently wrong.
    //
    // Absence is checked separately from parsing, and it has to be: `Number(null)` is 0, not
    // NaN, so reading the header straight into Number() made a MISSING header pass the guard
    // as a legitimate total of zero — the table would render fifty rows under a footer saying
    // "Showing 0–0 of 0 events", with Next page disabled and no hint that the rest of the log
    // existed. That is exactly the silently-wrong outcome the fallback is here to avoid, and
    // it is the likely case: a CDN or reverse proxy in front of the Next.js server drops
    // response headers it does not recognise.
    const raw = headers.get("X-Total-Count");
    const parsed = raw === null ? NaN : Number(raw);
    return { rows, total: Number.isInteger(parsed) && parsed >= 0 ? parsed : rows.length };
  },

  /**
   * Reports a CSV that was built in the browser. The server never sees the file, so this
   * is the only record of what was in it — and it is a self-report, not evidence: the
   * authoritative rows are the server-side ones for the GETs that supplied the data.
   */
  recordExport: (dto: RecordExportDto) => api.post<void>("/api/audit/export", dto),
};

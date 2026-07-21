/** Shared display-formatting helpers. */

/** "Devon P." → "DP", "Cher" → "CH", "" → "?". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Parse a date-only string (e.g. "2026-07-21", or an ISO timestamp we only want
 * the date from) as *local* noon. Anchoring at noon avoids the classic off-by-one
 * where "2026-07-21" parsed as UTC midnight renders as the 20th in western zones.
 * The single source of truth for turning API date strings into Date objects.
 */
export function parseLocalDate(s: string): Date {
  return new Date(s.slice(0, 10) + "T12:00:00");
}

/** "2026-07-21" → "Jul 21". */
export function shortDate(s: string): string {
  return parseLocalDate(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "2026-07-21" → "July 21, 2026". */
export function longDate(s: string): string {
  return parseLocalDate(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

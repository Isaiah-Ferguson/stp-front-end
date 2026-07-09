import { notifyUnauthorized } from "../auth/token";

// All requests go through the same-origin /backend proxy (see next.config.ts rewrites),
// so the httpOnly auth cookies are first-party and sent automatically (#15). The real
// API URL only matters to the proxy; the browser never talks to it directly.
const BASE_URL = "/backend";

/** Default per-request timeout (#36) — a hung backend must not leave pages loading forever. */
const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  /** Human-readable message from the backend (ProblemDetails detail/title or {message}), when present. */
  public detail?: string;

  constructor(public status: number, message: string, detail?: string) {
    super(detail ?? message);
    this.name = "ApiError";
    this.detail = detail;
  }
}

/** Pulls the backend's human-readable error out of a ProblemDetails or {message} body (#37). */
async function readErrorDetail(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as {
      detail?: string;
      title?: string;
      message?: string;
      errors?: Record<string, string[]>;
    };
    // Validation ProblemDetails: flatten the field errors into one line.
    if (body.errors && typeof body.errors === "object") {
      const lines = Object.values(body.errors).flat();
      if (lines.length > 0) return lines.join(" ");
    }
    return body.detail ?? body.message ?? body.title;
  } catch {
    return undefined;
  }
}

// ── Silent session refresh (#17) ────────────────────────────────────────────────
// When the 1-hour JWT expires mid-session, the next call 401s; we exchange the
// refresh cookie for a new JWT and retry once, so a half-marked attendance roster
// survives. Concurrent 401s share one refresh call.

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/** Auth endpoints where a 401 is an answer, not an expired session — never retried. */
function isAuthPath(path: string): boolean {
  return path.startsWith("/api/auth/login")
    || path.startsWith("/api/auth/refresh")
    || path.startsWith("/api/auth/logout");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  const doFetch = async (): Promise<Response> => {
    // Respect a caller-provided signal, otherwise apply the default timeout (#36).
    const signal = init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
    try {
      return await fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: "include", signal });
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError")
        throw new ApiError(0, `API timeout: ${path}`, "The server took too long to respond.");
      throw err;
    }
  };

  let res = await doFetch();

  if (res.status === 401 && !isAuthPath(path)) {
    // Expired JWT? Refresh once and retry before giving up the session (#17).
    if (await refreshSession()) {
      res = await doFetch();
    }
    if (res.status === 401) {
      notifyUnauthorized();
      throw new ApiError(401, `API 401: ${path}`);
    }
  }

  if (!res.ok) {
    const detail = await readErrorDetail(res);
    throw new ApiError(res.status, `API ${res.status}: ${path}`, detail);
  }

  // 204 No Content (and empty bodies) have nothing to parse.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get:    <T>(path: string)               => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: <T>(path: string)               => apiFetch<T>(path, { method: "DELETE" }),
};

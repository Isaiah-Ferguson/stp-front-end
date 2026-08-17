import { notifyUnauthorized, notifyMfaEnrollmentRequired } from "../auth/token";

// All requests go through the same-origin /backend proxy (see next.config.ts rewrites),
// so the httpOnly auth cookies are first-party and sent automatically (#15). The real
// API URL only matters to the proxy; the browser never talks to it directly.
const BASE_URL = "/backend";

/** Default per-request timeout (#36) — a hung backend must not leave pages loading forever. */
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * The backend's machine-readable error code, sent alongside the human message on the
 * errors the frontend has to branch on rather than merely display. Matching on the
 * message string is not a contract; this is.
 */
export const MFA_ENROLLMENT_REQUIRED = "mfa_enrollment_required";

export class ApiError extends Error {
  /** Human-readable message from the backend (ProblemDetails detail/title or {message}), when present. */
  public detail?: string;

  /** Backend error code, e.g. "mfa_enrollment_required". Absent on most responses. */
  public code?: string;

  constructor(public status: number, message: string, detail?: string, code?: string) {
    super(detail ?? message);
    this.name = "ApiError";
    this.detail = detail;
    this.code = code;
  }
}

type BackendError = { detail?: string; code?: string };

/** Pulls the backend's human-readable error and error code out of a ProblemDetails or {message} body (#37). */
async function readError(res: Response): Promise<BackendError> {
  try {
    const body = (await res.json()) as {
      detail?: string;
      title?: string;
      message?: string;
      code?: string;
      errors?: Record<string, string[]>;
    };
    // Validation ProblemDetails: flatten the field errors into one line.
    if (body.errors && typeof body.errors === "object") {
      const lines = Object.values(body.errors).flat();
      if (lines.length > 0) return { detail: lines.join(" "), code: body.code };
    }
    return { detail: body.detail ?? body.message ?? body.title, code: body.code };
  } catch {
    return {};
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

/** A parsed response body plus the headers it came with. */
export interface ApiResult<T> {
  data: T;
  headers: Headers;
}

/**
 * Same request pipeline as `apiFetch` — silent refresh, timeout, error shaping — but hands
 * back the response headers as well. Paged endpoints put their pre-paging total in
 * X-Total-Count, and a body-only helper cannot see it. Reading that header works because
 * every call goes through the same-origin /backend rewrite, so CORS (and its
 * exposed-headers allowlist) never enters into it.
 */
export async function apiFetchWithHeaders<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
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
    const { detail, code } = await readError(res);

    // The mandatory-MFA gate refuses nearly every endpoint until the user enrolls. Relay it
    // once, here, so a signed-in-but-unenrolled user is routed to enrollment instead of
    // every page independently rendering its own "couldn't load" state. The server-side
    // filter is the real control; this only decides what the user is looking at.
    if (res.status === 403 && code === MFA_ENROLLMENT_REQUIRED) {
      notifyMfaEnrollmentRequired();
    }

    throw new ApiError(res.status, `API ${res.status}: ${path}`, detail, code);
  }

  // 204 No Content (and empty bodies) have nothing to parse.
  if (res.status === 204) return { data: undefined as T, headers: res.headers };
  const text = await res.text();
  return { data: (text ? JSON.parse(text) : undefined) as T, headers: res.headers };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return (await apiFetchWithHeaders<T>(path, init)).data;
}

export const api = {
  get:    <T>(path: string)               => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: <T>(path: string)               => apiFetch<T>(path, { method: "DELETE" }),
};

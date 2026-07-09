import { getToken, notifyUnauthorized } from "../auth/token";

// Fail fast in production if the API URL was never configured — a silent localhost
// fallback would make every deployed page "fetch" a server that doesn't exist.
const BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production")
    throw new Error("NEXT_PUBLIC_API_URL must be set in production builds.");
  return "http://localhost:5208";
})();

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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Respect a caller-provided signal, otherwise apply the default timeout (#36).
  const signal = init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers, signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError")
      throw new ApiError(0, `API timeout: ${path}`, "The server took too long to respond.");
    throw err;
  }

  if (res.status === 401) {
    // Token missing/expired/invalid — drop it and let the app redirect to login.
    notifyUnauthorized();
    throw new ApiError(401, `API 401: ${path}`);
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

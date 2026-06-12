// Single source of truth for the JWT. Kept in localStorage so a refresh
// survives, mirrored in memory so reads are synchronous and SSR-safe.

const STORAGE_KEY = "ss_auth_token";

let inMemoryToken: string | null = null;

export function getToken(): string | null {
  if (inMemoryToken !== null) return inMemoryToken;
  if (typeof window === "undefined") return null;
  inMemoryToken = window.localStorage.getItem(STORAGE_KEY);
  return inMemoryToken;
}

export function setToken(token: string | null): void {
  inMemoryToken = token;
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(STORAGE_KEY, token);
  else window.localStorage.removeItem(STORAGE_KEY);
}

// Notifies subscribers (the AuthProvider) when auth is dropped, e.g. on a 401.
type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export function onUnauthorized(fn: Listener): () => void {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

export function notifyUnauthorized(): void {
  setToken(null);
  unauthorizedListeners.forEach((fn) => fn());
}

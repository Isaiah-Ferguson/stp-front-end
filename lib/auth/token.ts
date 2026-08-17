// Auth session signalling. The JWT itself now lives in httpOnly cookies set by the
// backend (#15) — it is deliberately unreadable from JavaScript, so there is no token
// storage here anymore; this module only relays "the session is gone" events.

const LEGACY_STORAGE_KEY = "ss_auth_token";

/**
 * Removes the JWT that pre-cookie builds kept in localStorage — those tokens were
 * readable by any XSS payload and must not linger after the upgrade.
 */
export function purgeLegacyToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

// Notifies subscribers (the AuthProvider) when auth is dropped, e.g. on a 401.
type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export function onUnauthorized(fn: Listener): () => void {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

export function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((fn) => fn());
}

// Notifies subscribers when the backend's mandatory-MFA gate refuses a request because the
// signed-in user has not enrolled a second factor. Separate from the 401 relay because the
// session is perfectly valid — the user is authenticated, just confined to the enrollment
// endpoints until they finish setting up an authenticator.
const mfaEnrollmentListeners = new Set<Listener>();

export function onMfaEnrollmentRequired(fn: Listener): () => void {
  mfaEnrollmentListeners.add(fn);
  return () => mfaEnrollmentListeners.delete(fn);
}

export function notifyMfaEnrollmentRequired(): void {
  mfaEnrollmentListeners.forEach((fn) => fn());
}

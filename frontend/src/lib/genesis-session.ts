import { randomBytes } from "node:crypto";

export const SESSION_COOKIE = "genesis_human_session";
const LIFETIME = 15 * 60 * 1000;
export interface HumanSession { credential: string; proposalId: string; documentId: string; reviewContext: string; expires: number }
// Server process memory only: restarting the frontend deliberately signs everyone out.
const sessions = new Map<string, HumanSession>();
const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
export function backendOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" || !local.has(url.hostname) || url.username || url.password || url.pathname !== "/" || url.search || url.hash)
    throw new Error("Backend must be a plain loopback HTTP origin.");
  return url.origin;
}
export function trustedLocalRequest(request: Request): boolean {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (host) {
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(:[0-9]{1,5})?$/.test(host)) return false;
    url.host = host;
  }
  return url.protocol === "http:" && local.has(url.hostname)
    && request.headers.get("origin") === url.origin
    && !["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "");
}
export function newSession(data: Omit<HumanSession, "expires">, now = Date.now()): string {
  for (const [key, session] of sessions) if (session.expires <= now) sessions.delete(key);
  if (sessions.size >= 100) throw new Error("Local session limit reached.");
  const key = randomBytes(32).toString("hex");
  sessions.set(key, { ...data, expires: now + LIFETIME });
  return key;
}
export function readSession(key: string | undefined, now = Date.now()): HumanSession | null {
  if (!key) return null;
  const session = sessions.get(key);
  if (!session || session.expires <= now) { sessions.delete(key); return null; }
  return session;
}
export function deleteSession(key: string | undefined): void { if (key) sessions.delete(key); }

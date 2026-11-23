import { randomBytes } from "node:crypto";

export const REIMBURSEMENT_SESSION_COOKIE = "genesis_reimbursement_session";
const LIFETIME_MS = 15 * 60 * 1000;
export interface ReimbursementSession {
  credential: string;
  proposalId: string;
  reimbursementId: string;
  reviewContext: string;
  expires: number;
}
// This store is intentionally separate from the document-reviewer session store.
// Restarting this local prototype signs reviewers out; it does not erase backend evidence.
const sessions = new Map<string, ReimbursementSession>();
export function createReimbursementSession(data: Omit<ReimbursementSession, "expires">, now = Date.now()): string {
  for (const [key, value] of sessions) if (value.expires <= now) sessions.delete(key);
  if (sessions.size >= 100) throw new Error("Local reviewer session limit reached.");
  const key = randomBytes(32).toString("hex");
  sessions.set(key, { ...data, expires: now + LIFETIME_MS });
  return key;
}
export function readReimbursementSession(key: string | undefined, now = Date.now()): ReimbursementSession | null {
  if (!key) return null;
  const session = sessions.get(key);
  if (!session || session.expires <= now) { sessions.delete(key); return null; }
  return session;
}
export function deleteReimbursementSession(key: string | undefined): void {
  if (key) sessions.delete(key);
}

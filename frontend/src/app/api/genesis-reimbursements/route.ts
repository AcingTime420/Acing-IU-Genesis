import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { backendOrigin, trustedLocalRequest } from "@/lib/genesis-session";
import {
  createReimbursementSession, deleteReimbursementSession, readReimbursementSession,
  REIMBURSEMENT_SESSION_COOKIE, type ReimbursementSession,
} from "@/lib/genesis-reimbursement-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookiePath = "/api/genesis-reimbursements";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    "Cache-Control": "no-store", "Vary": "Cookie, Origin", "X-Content-Type-Options": "nosniff",
  } });
}
function configured() {
  if (process.env.GENESIS_LOCAL_LIVE !== "1") throw new ApiError(503, "Local live mode is disabled.");
  return backendOrigin(process.env.GENESIS_AUTHORITY_URL ?? "http://127.0.0.1:5088");
}
async function upstream(session: Pick<ReimbursementSession, "credential">, path: string, body?: unknown) {
  const result = await fetch(`${configured()}/v1/authority/reimbursements${path}`, {
    method: body === undefined ? "GET" : "POST", cache: "no-store", redirect: "error",
    headers: { Authorization: `Bearer ${session.credential}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(35000),
  });
  if (!result.ok) {
    const messages: Record<string, string> = {
      unauthorized: "The reviewer credential is invalid or disabled.",
      forbidden: "This credential cannot perform this human-manager action.",
      not_found: "These reimbursement records are unavailable to this manager.",
      proposal_expired: "The proposal expired. Ask the agent for a fresh proposal.",
      proposal_stale: "The reimbursement changed. Ask the agent for a fresh proposal.",
      reimbursement_stale: "The reimbursement changed. Ask the agent for a fresh proposal.",
      proposal_unavailable: "The proposal's agent or organizational scope is no longer available.",
      scope_exceeded: "The reimbursement exceeds this proposal's amount limit. No grant was created.",
      decision_conflict: "A different decision already exists. Refresh to inspect the recorded result.",
      authority_unavailable: "The authority service is unavailable. Refresh before retrying.",
    };
    const error = await result.json().catch(() => null);
    throw new ApiError(result.status, messages[error?.error] ?? `Backend rejected request (${result.status}). Refresh before retrying.`);
  }
  return result.json();
}
function requireId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !uuid.test(value)) throw new ApiError(503, "Backend returned an invalid record identifier.");
}
async function snapshot(session: ReimbursementSession) {
  const proposal = await upstream(session, `/proposals/${session.proposalId}`);
  if (!proposal || proposal.id !== session.proposalId || proposal.reimbursementId !== session.reimbursementId)
    throw new ApiError(409, "The proposal destination changed. Sign in again to review it.");
  const reimbursement = await upstream(session, `/records/${session.reimbursementId}`);
  if (reimbursement?.id !== session.reimbursementId || reimbursement.organizationId !== proposal.organizationId)
    throw new ApiError(409, "The reimbursement scope changed. Sign in again to review it.");
  const evidence = await upstream(session, `/records/${session.reimbursementId}/evidence`);
  if (!Array.isArray(evidence)) throw new ApiError(503, "Backend returned invalid evidence.");
  const event = evidence.find((entry: { proposalId: string; action: string }) =>
    entry.proposalId === session.proposalId && entry.action === "proposal_decided");
  const decision = event ? { decision: event.outcome, grantId: event.grantId ?? null } : null;
  if (decision?.grantId) requireId(decision.grantId);
  const grant = decision?.grantId ? await upstream(session, `/grants/${decision.grantId}`) : null;
  if (grant && (grant.id !== decision?.grantId || grant.proposalId !== session.proposalId))
    throw new ApiError(409, "The grant scope changed. Refresh before deciding.");
  return { proposal, reimbursement, decision, grant, evidence };
}
async function requestBody(request: NextRequest): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "JSON required.");
  const reader = request.body?.getReader();
  let text = "", bytes = 0;
  if (reader) {
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) { await reader.cancel(); throw new ApiError(413, "Request too large."); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  }
  let body;
  try { body = JSON.parse(text); } catch { throw new ApiError(400, "Invalid JSON."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "Invalid request.");
  return body;
}
async function handle(request: NextRequest) {
  let key = request.cookies.get(REIMBURSEMENT_SESSION_COOKIE)?.value;
  try {
    configured();
    const check = request.method === "GET" && !request.headers.has("origin")
      ? new Request(request.url, { headers: { ...Object.fromEntries(request.headers), origin: `http://${request.headers.get("host") ?? new URL(request.url).host}` } }) : request;
    if (!trustedLocalRequest(check)) throw new ApiError(403, "Only same-origin loopback requests are allowed.");
    const body = request.method === "POST" ? await requestBody(request) : {};
    if (body.action === "logout") {
      deleteReimbursementSession(key);
      const out = response({ loggedOut: true });
      out.cookies.set(REIMBURSEMENT_SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: cookiePath, maxAge: 0 });
      return out;
    }
    if (body.action === "login") {
      if (typeof body.credential !== "string" || !/^[A-Za-z0-9_-]{32,256}$/.test(body.credential)
          || typeof body.proposalId !== "string" || !uuid.test(body.proposalId))
        throw new ApiError(400, "A valid human development credential and proposal UUID are required.");
      const provisional = { credential: body.credential };
      const proposal = await upstream(provisional, `/proposals/${body.proposalId}`);
      requireId(proposal?.id); requireId(proposal?.reimbursementId);
      // The record read is manager-only; an agent credential cannot create a browser session.
      await upstream(provisional, `/records/${proposal.reimbursementId}`);
      const session = { credential: body.credential, proposalId: proposal.id, reimbursementId: proposal.reimbursementId,
        reviewContext: randomBytes(32).toString("hex"), expires: Date.now() + 900000 };
      const state = await snapshot(session);
      deleteReimbursementSession(key);
      key = createReimbursementSession(session);
      const out = response({ ...state, reviewContext: session.reviewContext });
      out.cookies.set(REIMBURSEMENT_SESSION_COOKIE, key, { httpOnly: true, sameSite: "strict", path: cookiePath, maxAge: 900 });
      return out;
    }
    const session = readReimbursementSession(key);
    if (!session) throw new ApiError(401, "Sign in to review a reimbursement proposal.");
    if (request.method === "POST") {
      if (!["approve", "reject", "revoke"].includes(String(body.action))) throw new ApiError(400, "Unsupported action.");
      // Shared browser cookies never let a stale tab act on another tab's proposal.
      if (body.reviewContext !== session.reviewContext || body.proposalId !== session.proposalId
          || body.reimbursementId !== session.reimbursementId)
        throw new ApiError(409, "Reviewer context changed. Refresh and review the exact reimbursement before deciding.");
      if (body.action === "approve" || body.action === "reject")
        await upstream(session, `/proposals/${session.proposalId}/decision`, { decision: body.action === "approve" ? "approved" : "rejected" });
      else {
        const state = await snapshot(session);
        if (!state.grant || body.grantId !== state.grant.id) throw new ApiError(409, "The grant changed. Refresh before revoking.");
        await upstream(session, `/grants/${state.grant.id}/revoke`, { reason: "Human withdrew authority through the local reimbursement reviewer." });
      }
    }
    return response({ ...await snapshot(session), reviewContext: session.reviewContext });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 503;
    if (status === 401) deleteReimbursementSession(key);
    return response({ error: error instanceof ApiError ? error.message : "Backend unavailable. A submitted decision may have reached the server; refresh before retrying." }, status);
  }
}
export const GET = handle;
export const POST = handle;

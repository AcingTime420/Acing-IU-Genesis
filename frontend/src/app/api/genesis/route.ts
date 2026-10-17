import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { backendOrigin, deleteSession, newSession, readSession, SESSION_COOKIE, trustedLocalRequest, type HumanSession } from "@/lib/genesis-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "Vary": "Cookie, Origin", "X-Content-Type-Options": "nosniff" } });
}
function configured() {
  if (process.env.GENESIS_LOCAL_LIVE !== "1") throw new ApiError(503, "Local live mode is disabled.");
  return backendOrigin(process.env.GENESIS_AUTHORITY_URL ?? "http://127.0.0.1:5088");
}
async function upstream(session: Pick<HumanSession, "credential">, path: string, body?: unknown) {
  const result = await fetch(`${configured()}/v1/authority${path}`, {
    method: body === undefined ? "GET" : "POST", cache: "no-store", redirect: "error",
    headers: { Authorization: `Bearer ${session.credential}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(35000),
  });
  if (!result.ok) {
    const messages: Record<string, string> = {
      unauthorized: "Session credential is invalid or disabled.",
      forbidden: "This credential cannot perform this human-owner action.",
      not_found: "Proposal or document is unavailable to this owner.",
      proposal_expired: "Proposal expired. Ask the agent for a fresh proposal and review it in a new session.",
      decision_conflict: "A different decision already exists. Refresh to inspect the recorded decision.",
      authority_unavailable: "Authority service unavailable. Refresh to reconcile before retrying.",
    };
    const error = await result.json().catch(() => null);
    throw new ApiError(result.status, messages[error?.error] ?? `Backend rejected request (${result.status}). Refresh before retrying.`);
  }
  return result.json();
}
async function snapshot(session: HumanSession) {
  const proposal = await upstream(session, `/proposals/${session.proposalId}`);
  if (proposal.documentId !== session.documentId) throw new ApiError(409, "Proposal destination changed.");
  const document = await upstream(session, `/documents/${session.documentId}`);
  const evidence = await upstream(session, `/documents/${session.documentId}/evidence`);
  const event = evidence.find((e: { proposalId: string; action: string }) => e.proposalId === session.proposalId && e.action === "proposal_decided");
  const decision = event ? { decision: event.decision, grantId: event.grantId } : null;
  const grant = decision?.grantId ? await upstream(session, `/grants/${decision.grantId}`) : null;
  return { proposal, document, decision, grant, evidence };
}
async function handle(request: NextRequest) {
  let key = request.cookies.get(SESSION_COOKIE)?.value;
  try {
    configured();
    // POST requires exact Origin, including login/logout. GET rejects cross-site reads too.
    const check = request.method === "GET" && !request.headers.has("origin")
      ? new Request(request.url, { headers: { ...Object.fromEntries(request.headers), origin: `http://${request.headers.get("host") ?? new URL(request.url).host}` } }) : request;
    if (!trustedLocalRequest(check)) throw new ApiError(403, "Only same-origin loopback requests are allowed.");
    let body: Record<string, unknown> = {};
    if (request.method === "POST") {
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "JSON required.");
      // Bound streamed input even when Content-Length is absent or incorrect.
      const reader = request.body?.getReader(); let text = ""; let size = 0;
      if (reader) { const decoder = new TextDecoder(); while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 8192) { await reader.cancel(); throw new ApiError(413, "Request too large."); } text += decoder.decode(value, { stream: true }); } text += decoder.decode(); }
      try { body = JSON.parse(text); } catch { throw new ApiError(400, "Invalid JSON."); }
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "Invalid request.");
    }
    if (body.action === "logout") { deleteSession(key); const out = response({ loggedOut: true }); out.cookies.delete(SESSION_COOKIE); return out; }
    if (body.action === "login") {
      if (typeof body.credential !== "string" || !/^[A-Za-z0-9_-]{32,256}$/.test(body.credential) || typeof body.proposalId !== "string" || !uuid.test(body.proposalId)) throw new ApiError(400, "Valid human credential and proposal UUID required.");
      const provisional = { credential: body.credential };
      const proposal = await upstream(provisional, `/proposals/${body.proposalId}`);
      // This endpoint is human-owner-only: agent credentials cannot create a browser session.
      await upstream(provisional, `/documents/${proposal.documentId}`);
      const session = { credential: body.credential, proposalId: body.proposalId, documentId: proposal.documentId, reviewContext: randomBytes(32).toString("hex"), expires: Date.now() + 900000 };
      const state = await snapshot(session);
      deleteSession(key); key = newSession(session);
      const out = response({ ...state, reviewContext: session.reviewContext }); out.cookies.set(SESSION_COOKIE, key, { httpOnly: true, sameSite: "strict", path: "/api/genesis", maxAge: 900 }); return out;
    }
    const session = readSession(key);
    if (!session) throw new ApiError(401, "Sign in to review a proposal.");
    if (request.method === "POST") {
      // Cookies are shared across tabs. Bind the click to the records actually
      // displayed in that tab, rather than silently using another tab's login.
      if (["approve", "reject", "revoke"].includes(String(body.action)) &&
          (body.reviewContext !== session.reviewContext || body.proposalId !== session.proposalId || body.documentId !== session.documentId))
        throw new ApiError(409, "Reviewer context changed. Refresh and review the exact proposal before deciding.");
      if (body.action === "approve" || body.action === "reject") await upstream(session, `/proposals/${session.proposalId}/decision`, { decision: body.action === "approve" ? "approved" : "rejected" });
      else if (body.action === "revoke") { const state = await snapshot(session); if (!state.grant) throw new ApiError(409, "No grant exists."); if (body.grantId !== state.grant.id) throw new ApiError(409, "Grant changed. Refresh and review before revoking."); await upstream(session, `/grants/${state.grant.id}/revoke`, { reason: "Human withdrew authority through local reviewer." }); }
      else throw new ApiError(400, "Unsupported action.");
    }
    return response({ ...await snapshot(session), reviewContext: session.reviewContext });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 503;
    if (status === 401) deleteSession(key);
    return response({ error: error instanceof ApiError ? error.message : "Backend unavailable. The outcome of a submitted decision may be uncertain; refresh before retrying." }, status);
  }
}
export const GET = handle;
export const POST = handle;

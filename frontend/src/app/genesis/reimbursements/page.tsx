"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Evidence = { id: string; action: string; outcome: string; createdAt: string; details: unknown; attemptId: string | null };
type ReviewState = {
  reviewContext: string;
  proposal: { id: string; organizationId: string; reimbursementId: string; agentId: string; managerId: string;
    projectId: string; category: string; amountMinor: number; maxAmountMinor: number; currency: string; expectedVersion: number; expiresAt: string };
  reimbursement: { id: string; organizationId: string; projectId: string; managerId: string; category: string;
    amountMinor: number; currency: string; status: string; version: number };
  decision: { decision: string; grantId: string | null } | null;
  grant: { id: string; proposalId: string; state: string } | null;
  evidence: Evidence[];
};
const panel = "rounded-2xl border border-cyberBorder bg-cyberCard/70 p-5";
const control = "min-h-11 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-50";
const field = "min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300";
const date = (value: string) => new Date(value).toLocaleString();
const money = (minor: number) => Number.isSafeInteger(minor)
  ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(minor / 100) : "Invalid amount";

export default function ReimbursementReviewPage() {
  const [state, setState] = useState<ReviewState | null>(null);
  const [credential, setCredential] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);
  const inFlight = useRef(false);
  const stale = state !== null && (state.proposal.expectedVersion !== state.reimbursement.version || state.reimbursement.status !== "pending");
  const expired = state !== null && Date.parse(state.proposal.expiresAt) <= now;
  const exceeds = state !== null && state.proposal.amountMinor > state.proposal.maxAmountMinor;

  async function request(body?: Record<string, string>) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/genesis-reimbursements", {
        method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
        ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401) setState(null);
        if (response.status === 401 && !body) return;
        throw new Error(typeof payload?.error === "string" ? payload.error : `Request failed (${response.status}).`);
      }
      if (body?.action === "logout") { setState(null); setNotice("Signed out of the reimbursement reviewer."); }
      else {
        if (typeof payload?.reviewContext !== "string" || !payload?.proposal || !payload?.reimbursement || !Array.isArray(payload.evidence))
          throw new Error("Invalid backend response. No successful action is confirmed.");
        setState(payload as ReviewState); setNow(Date.now());
        setNotice("Records loaded through separate reads. Refresh after the separate agent acts; these reads are not an atomic snapshot.");
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Request failed. Refresh before retrying.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  useEffect(() => {
    void request();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || inFlight.current) return;
    const supplied = credential; setCredential("");
    void request({ action: "login", credential: supplied, proposalId: proposalId.trim() });
  }
  function decide(action: "approve" | "reject" | "revoke") {
    if (!state) return;
    void request({ action, reviewContext: state.reviewContext, proposalId: state.proposal.id,
      reimbursementId: state.reimbursement.id,
      ...(action === "revoke" && state.grant ? { grantId: state.grant.id } : {}) });
  }
  return <div className="mx-auto max-w-5xl space-y-6 pb-10" aria-busy={busy}>
    <header className={panel}>
      <p className="text-xs font-bold uppercase tracking-widest text-amber-200">Development/Test prototype · synthetic data · not production</p>
      <h1 className="mt-2 text-3xl font-bold text-white">Reimbursement authority review</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">Review one exact internal reimbursement approval. Approving creates limited authority for the named agent; the agent executes separately. No money is transferred and no payment is initiated.</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">The backend checks manager and agent membership, organization, project, category, amount, version, expiry, and revocation independently. The browser has no agent execution control.</p>
    </header>
    {error && <div role="alert" className="rounded-lg border border-rose-400/50 bg-rose-400/10 p-4 text-sm text-rose-100">{error} A decision response may be uncertain. Refresh to reconcile recorded state before retrying.</div>}
    <p role="status" aria-live="polite" className="text-sm text-slate-300">{busy ? "Contacting the authority service…" : notice}</p>
    {!state ? <form onSubmit={login} className={`${panel} space-y-4`}>
      <h2 className="text-lg font-semibold text-white">Open a manager reviewer session</h2>
      <p className="text-sm text-slate-400">Use the human manager development credential and reimbursement proposal UUID from the isolated local setup. Sessions expire after 15 minutes.</p>
      <div><label htmlFor="reimbursement-proposal" className="mb-2 block text-sm text-slate-200">Proposal UUID</label><input id="reimbursement-proposal" className={field} value={proposalId} onChange={event => setProposalId(event.target.value)} required disabled={busy} autoComplete="off" spellCheck={false} pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" /></div>
      <div><label htmlFor="reimbursement-credential" className="mb-2 block text-sm text-slate-200">Human manager development credential</label><input id="reimbursement-credential" className={field} type="password" value={credential} onChange={event => setCredential(event.target.value)} required disabled={busy} autoComplete="off" /></div>
      <button type="submit" className={`${control} bg-sky-800`} disabled={busy}>Open reviewer session</button>
    </form> : <>
      <div className="flex flex-wrap gap-3"><button type="button" className={control} disabled={busy} onClick={() => void request()}>Refresh backend state</button><button type="button" className={control} disabled={busy} onClick={() => void request({ action: "logout" })}>Sign out</button></div>
      <section className={panel} aria-labelledby="reimbursement-proposal-heading">
        <h2 id="reimbursement-proposal-heading" className="text-xl font-semibold text-white">Review exact proposal</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {[["Proposal", state.proposal.id], ["Organization", state.proposal.organizationId], ["Project", state.proposal.projectId], ["Reimbursement", state.proposal.reimbursementId], ["Designated manager", state.proposal.managerId], ["Requesting agent", state.proposal.agentId], ["Category", state.proposal.category], ["Exact amount", `${money(state.proposal.amountMinor)} (${state.proposal.amountMinor} USD cents)`], ["Maximum permitted amount", `${money(state.proposal.maxAmountMinor)} (${state.proposal.maxAmountMinor} USD cents)`], ["Expected record version", String(state.proposal.expectedVersion)], ["Expires", `${date(state.proposal.expiresAt)} — server decides validity`], ["Use", "One exact internal approval; single use"], ["Human decision", state.decision?.decision ?? "Pending"]].map(([label, value]) => <div key={label}><dt className="text-slate-400">{label}</dt><dd className="mt-1 break-all text-slate-100">{value}</dd></div>)}
        </dl>
        <p className="mt-4 text-sm text-amber-100">Approval is bound to the displayed scope. The agent cannot change the destination, amount, category, limit, or expiry. Category and identifier text are untrusted record data.</p>
        {(stale || expired || exceeds) && !state.decision && <p role="status" className="mt-3 text-sm text-amber-100">{stale ? "The reimbursement changed or is already approved. " : ""}{expired ? "The proposal appears expired. " : ""}{exceeds ? "The amount exceeds this proposal's limit. " : ""}Ask for a fresh valid proposal; rejection remains available.</p>}
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" className={`${control} bg-emerald-800`} disabled={busy || !!state.decision || stale || expired || exceeds} onClick={() => decide("approve")}>Approve exact proposal</button><button type="button" className={`${control} border-rose-400`} disabled={busy || !!state.decision} onClick={() => decide("reject")}>Reject proposal</button></div>
      </section>
      <section className={panel} aria-labelledby="reimbursement-grant-heading">
        <h2 id="reimbursement-grant-heading" className="text-xl font-semibold text-white">Current authority and record</h2>
        <p className="mt-3 break-all text-sm text-slate-200">Grant: {state.grant?.id ?? "Not issued"}</p>
        <p className="mt-2 text-sm text-slate-200">Server-reported grant state: <strong>{state.grant?.state ?? "No grant"}</strong>{expired ? " · proposal appears expired" : ""}</p>
        <p className="mt-2 text-sm text-slate-200">Reimbursement: <strong>{state.reimbursement.status}</strong> · Version {state.reimbursement.version} · {money(state.reimbursement.amountMinor)}</p>
        <p className="mt-3 text-sm text-slate-400">Revocation blocks later protected executions when it commits first. It does not reverse an approval already committed. A historical retry receipt does not create a second approval.</p>
        <button type="button" className={`${control} mt-4 border-rose-400`} disabled={busy || state.grant?.state !== "active"} onClick={() => decide("revoke")}>Revoke unused grant</button>
      </section>
      <section className={panel} aria-labelledby="reimbursement-evidence-heading">
        <h2 id="reimbursement-evidence-heading" className="text-xl font-semibold text-white">Recorded evidence</h2>
        <p className="mt-2 text-sm text-slate-400">Persisted prototype events. These records are not independently authenticated or tamperproof. Check the current record as well as historical receipts.</p>
        {state.evidence.length === 0 ? <p className="mt-4 text-sm text-slate-300">No evidence returned.</p> : <ol className="mt-4 space-y-4">{state.evidence.map(event => <li key={event.id} className="rounded-lg border border-slate-700 p-4"><p className="text-sm font-semibold text-slate-100">{event.action} · {event.outcome}</p><time dateTime={event.createdAt} className="text-xs text-slate-400">{date(event.createdAt)}</time><p className="mt-2 break-all text-xs text-slate-300">Attempt: {event.attemptId ?? "None"}</p><pre className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-300">{JSON.stringify(event.details, null, 2)}</pre></li>)}</ol>}
      </section>
    </>}
  </div>;
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type ReviewState = {
  proposal: { id: string; agentId: string; agentName: string; documentId: string; operation: string; text: string; expectedVersion: number; expiresAt: string; singleUse: boolean };
  document: { id: string; ownerId: string; title: string; content: string; version: number };
  decision: { decision: string; grantId: string | null } | null;
  grant: { id: string; state: string; expiresAt: string; singleUse: boolean } | null;
  evidence: Array<{ id: string; requesterId: string; approverId: string | null; proposalId: string | null; grantId: string | null; attemptId: string | null; action: string; decision: string | null; outcome: string; details: unknown; createdAt: string }>;
};

const control = "min-h-11 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-50";
const panel = "rounded-2xl border border-cyberBorder bg-cyberCard/70 p-5";
const date = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

export default function LiveGenesisPage() {
  const [state, setState] = useState<ReviewState | null>(null);
  const [credential, setCredential] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);

  async function request(body?: Record<string, string>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/genesis", {
        method: body ? "POST" : "GET",
        credentials: "same-origin",
        cache: "no-store",
        ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401) setState(null);
        const message = payload && typeof payload.error === "string" ? payload.error : `Request failed (${response.status}).`;
        if (response.status === 401 && !body) return;
        throw new Error(message);
      }
      if (body?.action === "logout") {
        setState(null);
        setNotice("Signed out of the local reviewer session.");
      } else {
        if (!payload?.proposal || !payload?.document || !Array.isArray(payload.evidence)) {
          throw new Error("The backend returned an invalid review response. No success is confirmed.");
        }
        setState(payload as ReviewState);
        setNotice("Backend records loaded through separate reads, not an atomic snapshot. Refresh after agent activity; this view does not refresh automatically.");
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Request failed. Refresh to reconcile backend state before retrying a decision.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  useEffect(() => { void request(); }, []);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || inFlight.current) return;
    const suppliedCredential = credential;
    setCredential("");
    void request({ action: "login", credential: suppliedCredential, proposalId: proposalId.trim() });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10" aria-busy={busy}>
      <header className={panel}>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-200">Local live prototype — not production</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Genesis human authority review</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">This local interface reads the real prototype backend. Approval and revocation affect its PostgreSQL test records. It never falls back to simulated results.</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">The agent runs separately through the command-line harness. Its credential and execution controls are not available in this browser. Refresh after running the agent to inspect current backend state.</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-400/50 bg-rose-400/10 p-4 text-sm text-rose-100">{error} If a decision response was lost, refresh before retrying; the request may have reached the backend.</div>}
      <p role="status" aria-live="polite" className="text-sm text-slate-300">{busy ? "Contacting the local backend…" : notice}</p>

      {!state ? (
        <form onSubmit={login} className={`${panel} space-y-4`}>
          <h2 className="text-lg font-semibold text-white">Open a human reviewer session</h2>
          <p className="text-sm text-slate-400">Use the human development credential and proposal UUID from your local setup. Do not enter the agent credential.</p>
          <div><label htmlFor="proposal-id" className="mb-2 block text-sm text-slate-200">Proposal UUID</label><input id="proposal-id" value={proposalId} onChange={(event) => setProposalId(event.target.value)} required disabled={busy} autoComplete="off" spellCheck={false} pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" className="min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 font-mono text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300" /></div>
          <div><label htmlFor="human-credential" className="mb-2 block text-sm text-slate-200">Human development credential</label><input id="human-credential" type="password" value={credential} onChange={(event) => setCredential(event.target.value)} required disabled={busy} autoComplete="off" className="min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300" /></div>
          <button type="submit" disabled={busy} className={`${control} bg-sky-800`}>Open reviewer session</button>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => void request()} className={control}>Refresh current backend state</button><button type="button" disabled={busy} onClick={() => void request({ action: "logout" })} className={control}>Sign out</button></div>
          <section className={panel} aria-labelledby="proposal-heading">
            <h2 id="proposal-heading" className="text-xl font-semibold text-white">Review exact proposal</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              {[ ["Proposal", state.proposal.id], ["Requesting agent", `${state.proposal.agentName} (${state.proposal.agentId})`], ["Target document", state.proposal.documentId], ["Operation", state.proposal.operation], ["Expected document version", String(state.proposal.expectedVersion)], ["Expires", `${date(state.proposal.expiresAt)} — server decides validity`], ["Single use", state.proposal.singleUse ? "Yes" : "No"], ["Human decision", state.decision?.decision ?? "Pending"] ].map(([label, value]) => <div key={label}><dt className="text-slate-400">{label}</dt><dd className="mt-1 break-all text-slate-100">{value}</dd></div>)}
            </dl>
            <h3 className="mt-5 text-sm font-semibold text-slate-200">Exact proposed text (untrusted text)</h3>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 font-mono text-sm text-white">{state.proposal.text}</pre>
            <p className="mt-2 text-sm text-amber-100">Append behavior: the backend appends the exact text above followed by one LF newline (U+000A). Approval is bound to the agent, proposal, document, operation, exact text, expected version, expiration, and single-use scope.</p>
            <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={busy || state.decision !== null} onClick={() => void request({ action: "approve" })} className={`${control} bg-emerald-800`}>Approve exact proposal</button><button type="button" disabled={busy || state.decision !== null} onClick={() => void request({ action: "reject" })} className={`${control} border-rose-400`}>Reject proposal</button></div>
          </section>
          <section className={panel} aria-labelledby="grant-heading"><h2 id="grant-heading" className="text-xl font-semibold text-white">Current authority</h2><p className="mt-3 break-all text-sm text-slate-200">Grant: {state.grant?.id ?? "Not issued"}</p><p className="mt-2 text-sm text-slate-200">Server-reported state: <strong>{state.grant?.state ?? "No grant"}</strong></p>{state.grant && <p className="mt-2 text-sm text-slate-300">Expires: {date(state.grant.expiresAt)}</p>}<p className="mt-3 text-sm text-slate-400">Revocation blocks subsequent execution when it takes effect. It does not undo a completed append. Refresh to see changes made by the separate agent.</p><button type="button" disabled={busy || state.grant?.state !== "active"} onClick={() => void request({ action: "revoke" })} className={`${control} mt-4 border-rose-400`}>Revoke grant</button></section>
          <section className={panel} aria-labelledby="document-heading"><h2 id="document-heading" className="text-xl font-semibold text-white">Current document: {state.document.title}</h2><p className="mt-2 break-all text-sm text-slate-400">{state.document.id} · Version {state.document.version}</p><pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-100">{state.document.content}</pre></section>
          <section className={panel} aria-labelledby="evidence-heading"><h2 id="evidence-heading" className="text-xl font-semibold text-white">Backend evidence</h2><p className="mt-2 text-sm text-slate-400">Persisted prototype events; no claim of tamper-proof storage. Historical outcomes do not replace current document or grant state.</p>{state.evidence.length === 0 ? <p className="mt-4 text-sm text-slate-300">No evidence returned.</p> : <ol className="mt-4 space-y-4">{state.evidence.map((event) => <li key={event.id} className="rounded-lg border border-slate-700 p-4"><p className="text-sm font-semibold text-slate-100">{event.action} · {event.outcome}{event.decision ? ` · ${event.decision}` : ""}</p><time dateTime={event.createdAt} className="text-xs text-slate-400">{date(event.createdAt)}</time><dl className="mt-2 space-y-1 break-all text-xs text-slate-300">{[["Requester", event.requesterId], ["Approver", event.approverId], ["Proposal", event.proposalId], ["Grant", event.grantId], ["Attempt", event.attemptId]].map(([label, value]) => <div key={label}><dt className="inline text-slate-400">{label}: </dt><dd className="inline">{value ?? "None"}</dd></div>)}</dl><pre className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-300">{JSON.stringify(event.details, null, 2)}</pre></li>)}</ol>}</section>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowDownToLine, Check, CircleHelp, Clock3, FileText, Fingerprint, History, LockKeyhole, RotateCcw, Shield, ShieldOff, X } from "lucide-react";
import {
  buildExecutionInput,
  MockGenesisAdapter,
  type DemoCondition,
  type PrototypeState,
} from "@/lib/genesis-adapter";

const time = (value: string) => new Date(value).toLocaleString();
const badge: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  revoked: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  expired: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  consumed: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  denied: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  uncertain: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  idle: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  pendingExecution: "border-sky-400/30 bg-sky-400/10 text-sky-200",
};

function Status({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${badge[value] ?? badge.idle}`}>{value === "pendingExecution" ? "pending" : value.replaceAll("-", " ")}</span>;
}

export default function GenesisPage() {
  const [adapter] = useState(() => new MockGenesisAdapter());
  const [state, setState] = useState<PrototypeState>(() => adapter.getState());
  const [condition, setCondition] = useState<DemoCondition>("normal");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const attemptKey = useRef<string | null>(null);
  const currentAttemptKey = () => {
    if (!attemptKey.current) attemptKey.current = globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return attemptKey.current;
  };

  useEffect(() => {
    setState(adapter.refreshFixtureClock());
  }, [adapter]);

  async function run(action: () => Promise<PrototypeState>, message?: string) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      setState(await action());
      if (message) setNotice(message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Request failed. No successful outcome was reported.");
    } finally {
      setBusy(false);
    }
  }

  const executeExact = () => run(
    () => adapter.execute(buildExecutionInput(state, currentAttemptKey()), condition),
  );
  const tryChanged = (kind: "text" | "destination") => {
    const key = globalThis.crypto?.randomUUID?.() ?? `changed-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const changed = kind === "text"
      ? { text: `${state.proposal.text} (changed after review)` }
      : { documentId: "doc-other-destination" };
    return run(() => adapter.execute(buildExecutionInput(state, key, changed), "normal"));
  };

  const executeAllowed = state.decision === "approved" && state.grant.state === "active" && state.execution.state !== "pending";
  const expiresAt = time(state.proposal.expiresAt);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="rounded-2xl border border-amber-400/40 bg-amber-300/5 p-4" role="status" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <p className="font-bold text-amber-100">MOCK MODE — local fixtures only</p>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">No Genesis authority API contract is available. This interface does not authenticate a human, issue real grants, enforce authorization, persist audit evidence, or modify a live document. The fixture service imitates example decisions for demonstration only.</p>
            </div>
          </div>
          <span className="rounded border border-amber-300/30 px-2 py-1 text-xs font-bold text-amber-100">NOT LIVE / NOT ENFORCED</span>
        </div>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300"><Shield className="h-4 w-4" /> Genesis prototype</div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Human authority review</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Review one named agent’s request to append exact text to one application-managed test document.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-cyberBorder bg-cyberCard px-3 py-2 text-sm">
          <Fingerprint className="h-4 w-4 text-sky-300" aria-hidden="true" />
          <span className="text-slate-300">Human:</span><strong>{state.human.displayName}</strong>
          <span className="ml-1 rounded bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">mock identity · unauthenticated</span>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]" aria-label="Document and proposal review">
        <article className="rounded-2xl border border-cyberBorder bg-cyberCard/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-sky-300" aria-hidden="true" /><div><h2 className="font-semibold text-white">Test document</h2><p className="text-xs text-slate-400">Application-managed mock content · no filesystem access</p></div></div>
            <span className="rounded-md border border-cyberBorder px-2.5 py-1 text-xs text-slate-300">Version {state.document.version}</span>
          </div>
          <dl className="mb-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Identifier</dt><dd className="break-all font-mono text-xs text-slate-300">{state.document.id}</dd></div><div><dt className="text-xs text-slate-500">Document</dt><dd className="text-slate-200">{state.document.title}</dd></div></dl>
          <div className="max-h-56 overflow-auto rounded-xl border border-cyberBorder bg-[#0b0f19] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Current content · untrusted text</p>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-slate-200">{state.document.content}</pre>
          </div>
        </article>

        <article className="rounded-2xl border border-sky-400/25 bg-cyberCard/70 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div><p className="text-xs font-bold uppercase tracking-wider text-sky-300">Agent proposal</p><h2 className="mt-1 text-lg font-semibold text-white">Review before authorizing</h2></div>
            <Status value={state.decision} />
          </div>
          <dl className="space-y-3 text-sm">
            <div className="grid grid-cols-[105px_1fr] gap-2"><dt className="text-slate-500">Requester</dt><dd className="text-slate-200">{state.proposal.agentName}<span className="block break-all font-mono text-xs text-slate-500">{state.proposal.agentId}</span></dd></div>
            <div className="grid grid-cols-[105px_1fr] gap-2"><dt className="text-slate-500">Target</dt><dd className="break-all font-mono text-xs text-slate-200">{state.proposal.documentId}</dd></div>
            <div className="grid grid-cols-[105px_1fr] gap-2"><dt className="text-slate-500">Operation</dt><dd className="font-semibold text-slate-200">Append once</dd></div>
            <div className="grid grid-cols-[105px_1fr] gap-2"><dt className="text-slate-500">Expected</dt><dd className="text-slate-200">Document version {state.proposal.expectedVersion}</dd></div>
            <div className="grid grid-cols-[105px_1fr] gap-2"><dt className="text-slate-500">Expires</dt><dd className="text-slate-200">{expiresAt} <span className="text-xs text-slate-500">(display only; server decides)</span></dd></div>
            <div className="grid grid-cols-[105px_1fr] gap-2"><dt className="text-slate-500">Scope</dt><dd className="text-slate-200">Named agent + this document + append + exact text + expected version · single use</dd></div>
          </dl>
          <div className="mt-4 rounded-xl border border-cyberBorder bg-[#0b0f19] p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Exact proposed text · untrusted text</p><blockquote className="whitespace-pre-wrap break-words border-l-2 border-sky-400 pl-3 text-sm leading-6 text-white">{state.proposal.text}</blockquote></div>
          {state.decision === "pending" && <div className="mt-4 rounded-lg bg-slate-800/60 p-3 text-sm text-slate-300"><strong>Effect if approved:</strong> the mock service will demonstrate one append of the exact text above to the named test document. This is not a live change.</div>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => run(() => adapter.decide("approved"))} disabled={busy || state.decision !== "pending"} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"><Check className="h-4 w-4" aria-hidden="true" />Approve exact proposal</button>
            <button type="button" onClick={() => run(() => adapter.decide("rejected"))} disabled={busy || state.decision !== "pending"} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-not-allowed disabled:opacity-45"><X className="h-4 w-4" aria-hidden="true" />Reject proposal</button>
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]" aria-label="Authority and execution">
        <article className="rounded-2xl border border-cyberBorder bg-cyberCard/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-violet-300" aria-hidden="true" /><div><h2 className="font-semibold text-white">Authority state</h2><p className="text-xs text-slate-400">Mock server-reported fixture state</p></div></div><Status value={state.grant.state} /></div>
          <p className="mt-4 text-sm text-slate-300">Grant identifier: <code className="break-all text-xs text-slate-200">{state.grant.id ?? "not issued"}</code></p>
          <p className="mt-3 text-xs leading-5 text-slate-400">Revoking authority prevents subsequent authorized execution; it does not reverse a completed change. Any displayed expiration is informational only. The real server must decide whether authority remains valid.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => run(() => adapter.revoke())} disabled={busy || state.grant.state !== "active"} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-sm text-rose-200 hover:bg-rose-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-not-allowed disabled:opacity-45"><ShieldOff className="h-4 w-4" aria-hidden="true" />Revoke mock grant</button>
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-cyberBorder px-3 py-2 text-sm text-slate-300">Demo condition
              <select aria-label="Mock execution condition" value={condition} onChange={(event) => setCondition(event.target.value as DemoCondition)} className="max-w-[180px] bg-transparent text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">
                <option value="normal">Normal result</option><option value="stale-version">Stale version</option><option value="expired">Expired grant</option><option value="network-uncertain">Connection uncertain</option>
              </select>
            </label>
          </div>
        </article>

        <article className="rounded-2xl border border-cyberBorder bg-cyberCard/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-white">Execution result</h2><p className="text-xs text-slate-400">No success is displayed before the result state</p></div><Status value={state.execution.state === "pending" ? "pendingExecution" : state.execution.state} /></div>
          <p className="mt-4 min-h-12 text-sm leading-6 text-slate-200" role="status" aria-live="polite">{state.execution.message}</p>
          {state.execution.attemptId && <p className="break-all font-mono text-xs text-slate-500">Attempt: {state.execution.attemptId}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={executeExact} disabled={busy || !executeAllowed || state.execution.state === "completed" || state.execution.state === "denied" || state.execution.state === "failed"} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-45"><ArrowDownToLine className="h-4 w-4" aria-hidden="true" />Execute exact approved append</button>
            {(state.execution.state === "uncertain" || state.execution.state === "completed") && <button type="button" onClick={() => run(() => adapter.inspectAttempt(currentAttemptKey()))} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-300/40 px-3 py-2 text-sm text-amber-100 hover:bg-amber-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-45"><RotateCcw className="h-4 w-4" aria-hidden="true" />Check same attempt</button>}
          </div>
          <div className="mt-4 border-t border-cyberBorder pt-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400"><CircleHelp className="h-4 w-4" aria-hidden="true" />Adversarial demo probes (mock only)</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => tryChanged("text")} disabled={busy} className="rounded-md border border-cyberBorder px-3 py-2 text-xs text-slate-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-45">Try changed text</button>
              <button type="button" onClick={() => tryChanged("destination")} disabled={busy} className="rounded-md border border-cyberBorder px-3 py-2 text-xs text-slate-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-45">Try changed destination</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Each probe uses a fresh fixture attempt key. A different action requires fresh human review; a frontend denial is a demonstration, not proof of backend enforcement.</p>
          </div>
        </article>
      </section>

      {notice && <div className="rounded-lg border border-amber-300/30 bg-amber-300/5 px-4 py-3 text-sm text-amber-100" role="alert">{notice}</div>}

      <section className="rounded-2xl border border-cyberBorder bg-cyberCard/70 p-5" aria-labelledby="evidence-heading">
        <div className="mb-4 flex items-center gap-3"><History className="h-5 w-5 text-sky-300" aria-hidden="true" /><div><h2 id="evidence-heading" className="font-semibold text-white">Evidence timeline</h2><p className="text-xs text-slate-400">Local illustrative events; not durable or tamper-proof audit evidence</p></div></div>
        <ol className="space-y-3">
          {state.timeline.map((event) => <li key={event.id} className="grid gap-2 border-l border-cyberBorder pl-4 sm:grid-cols-[170px_1fr_auto] sm:items-start">
            <div><span className="text-xs font-semibold text-slate-300">{event.actor}</span><span className="ml-2 inline-flex rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">{event.kind}</span></div>
            <p className="text-sm text-slate-200">{event.message}</p>
            <time className="flex items-center gap-1 text-xs text-slate-500" dateTime={event.timestamp}><Clock3 className="h-3 w-3" aria-hidden="true" />{time(event.timestamp)}</time>
          </li>)}
        </ol>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-cyberBorder pt-3 text-xs text-slate-400"><span>Proposal: <code>{state.proposal.id}</code></span><span>Requester: {state.proposal.agentId}</span><span>Approving human: {state.decision === "approved" || state.decision === "rejected" ? state.human.displayName : "none"}</span></div>
      </section>

      <p className="text-xs leading-5 text-slate-500"><span className="font-semibold text-slate-400">Prototype boundary:</span> mock fixtures do not prove authentication, grant issuance, revocation, persistence, concurrency safety, idempotency enforcement, or audit integrity. See <code>docs/prototypes/genesis-human-authority.md</code> for setup and proposed integration requirements.</p>
    </div>
  );
}

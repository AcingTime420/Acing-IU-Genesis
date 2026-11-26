import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExecutionInput,
  MockGenesisAdapter,
  UnconfiguredLiveGenesisAdapter,
} from "../src/lib/genesis-adapter.ts";

async function approved(adapter = new MockGenesisAdapter()) {
  await adapter.decide("approved");
  return adapter;
}

function input(adapter, key = "attempt-0001", overrides = {}) {
  return buildExecutionInput(adapter.getState(), key, overrides);
}

test("mock mode is explicit and proposal binds agent, document, append, exact text, version, expiry and one use", () => {
  const adapter = new MockGenesisAdapter();
  const state = adapter.getState();
  assert.equal(state.mode, "mock");
  assert.equal(state.decision, "pending");
  assert.equal(state.proposal.operation, "append");
  assert.equal(state.proposal.documentId, state.document.id);
  assert.equal(state.proposal.expectedVersion, state.document.version);
  assert.equal(state.proposal.singleUse, true);
  assert.ok(state.proposal.expiresAt);
  assert.equal(state.grant.state, "not-issued");
});

test("rejecting leaves the document unchanged and execution without active authority is denied", async () => {
  const adapter = new MockGenesisAdapter();
  const before = adapter.getState().document.content;
  await adapter.decide("rejected");
  const result = await adapter.execute(input(adapter), "normal");
  assert.equal(result.execution.state, "denied");
  assert.equal(result.document.content, before);
  assert.match(result.execution.message, /denied|rejected|grant/i);
});

test("exact approval appends once and same idempotency key returns the existing result", async () => {
  const adapter = await approved();
  const request = input(adapter, "exact-attempt-1");
  const first = await adapter.execute(request, "normal");
  assert.equal(first.execution.state, "completed");
  assert.equal(first.document.content.split(adapter.getState().proposal.text).length - 1, 1);
  const retry = await adapter.execute(request, "normal");
  assert.equal(retry.execution.state, "completed");
  assert.equal(retry.document.content.split(retry.proposal.text).length - 1, 1);
  assert.match(retry.execution.message, /not repeated/i);
});

test("changed text and changed destination are denied and do not mutate the document", async () => {
  for (const changed of [{ text: "different content" }, { documentId: "other-doc" }]) {
    const adapter = await approved();
    const before = adapter.getState().document.content;
    const result = await adapter.execute(input(adapter, `changed-${Math.random()}`, changed), "normal");
    assert.equal(result.execution.state, "denied");
    assert.equal(result.document.content, before);
    assert.match(result.execution.message, /changed|scope|approval/i);
  }
});

test("an idempotency key cannot be reused for materially different inputs after a denial", async () => {
  const adapter = await approved();
  const key = "bound-even-after-denial";
  const changedText = input(adapter, key, { text: "altered after review" });
  const first = await adapter.execute(changedText, "normal");
  assert.equal(first.execution.state, "denied");
  const original = await adapter.execute(input(adapter, key), "normal");
  assert.equal(original.execution.state, "denied");
  assert.match(original.execution.message, /idempotency key.*different inputs/i);
  assert.equal(original.document.content.includes(original.proposal.text), false);
});

test("revocation and expiry block the following execution", async () => {
  const revoked = await approved();
  await revoked.revoke();
  const revokedResult = await revoked.execute(input(revoked, "revoked-attempt"), "normal");
  assert.equal(revokedResult.grant.state, "revoked");
  assert.equal(revokedResult.execution.state, "denied");

  const expired = await approved();
  const expiredResult = await expired.execute(input(expired, "expired-attempt"), "expired");
  assert.equal(expiredResult.grant.state, "expired");
  assert.equal(expiredResult.execution.state, "denied");
});

test("stale document version denies and reports fresh review requirement", async () => {
  const adapter = await approved();
  const result = await adapter.execute(input(adapter, "stale-attempt"), "stale-version");
  assert.equal(result.execution.state, "denied");
  assert.equal(result.document.content.includes(result.proposal.text), false);
  assert.match(result.execution.message, /stale|fresh approval/i);
});

test("uncertain network result is distinct and attempt inspection does not submit a duplicate", async () => {
  const adapter = await approved();
  const request = input(adapter, "uncertain-attempt");
  const result = await adapter.execute(request, "network-uncertain");
  assert.equal(result.execution.state, "uncertain");
  const inspected = await adapter.inspectAttempt(request.idempotencyKey);
  assert.equal(inspected.execution.state, "uncertain");
  assert.equal(inspected.timeline.filter((event) => event.message.includes("submitted")).length, 1);
});

test("live adapter fails explicitly; it never falls back to mock success", async () => {
  const mock = new MockGenesisAdapter();
  const adapter = new UnconfiguredLiveGenesisAdapter(mock.getState());
  assert.equal(adapter.getState().mode, "live");
  await assert.rejects(adapter.execute(input(mock), "normal"), /no mock fallback/i);
});

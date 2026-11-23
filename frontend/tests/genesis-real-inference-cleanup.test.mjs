// No database, model, native process or browser is started by these regressions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanupOwnedResources, runWithConfirmedCleanup} from './genesis-real-inference-connected.mjs';

const pending = () => new Promise(() => {});
const deadlines = {browserTimeoutMs: 10, graceTimeoutMs: 10, killTimeoutMs: 10};
function deferred() {
  let resolve;
  const promise = new Promise(done => {resolve = done;});
  return {promise, resolve};
}
function browserFixture() {
  return {connected: true, calls: 0, isConnected() {return this.connected;},
    async close() {this.calls++; this.connected = false;}};
}
function frontendFixture() {
  const closed = deferred();
  const frontend = {exitCode: null, signalCode: null, signals: [], kill(signal) {
    this.signals.push(signal); this.signalCode = signal; closed.resolve(); return true;
  }};
  return {frontend, frontendClosed: closed.promise, close: closed.resolve};
}

test('browser rejection still attempts and confirms frontend cleanup', async () => {
  const browser = browserFixture(), process = frontendFixture();
  browser.close = async () => {browser.calls++; throw new Error('Browser close rejected.');};
  await assert.rejects(cleanupOwnedResources({...process, browser, ...deadlines}), error => {
    assert.ok(error instanceof AggregateError); assert.equal(error.errors.length, 1); return true;
  });
  assert.equal(browser.calls, 1); assert.deepEqual(process.frontend.signals, ['SIGTERM']);
});

test('hanging browser cleanup is bounded while frontend escalates independently', async () => {
  const browser = browserFixture(), process = frontendFixture();
  browser.close = () => {browser.calls++; return pending();};
  process.frontend.kill = function(signal) {
    this.signals.push(signal);
    if (signal === 'SIGKILL') {this.signalCode = signal; process.close();}
    return true;
  };
  await assert.rejects(cleanupOwnedResources({...process, browser, ...deadlines}), AggregateError);
  assert.equal(browser.calls, 1); assert.deepEqual(process.frontend.signals, ['SIGTERM', 'SIGKILL']);
});

test('resolved close without browser disconnection cannot confirm cleanup', async () => {
  const browser = browserFixture(), process = frontendFixture();
  browser.close = async () => {browser.calls++;};
  await assert.rejects(cleanupOwnedResources({...process, browser, ...deadlines}), AggregateError);
  assert.deepEqual(process.frontend.signals, ['SIGTERM']);
});

test('process exit and successful signals do not substitute for its close event', async () => {
  const browser = browserFixture();
  const frontend = {exitCode: null, signalCode: null, signals: [], kill(signal) {
    this.signals.push(signal); if (signal === 'SIGKILL') this.exitCode = 0; return true;
  }};
  await assert.rejects(cleanupOwnedResources({browser, frontend, frontendClosed: pending(), ...deadlines}), AggregateError);
  assert.equal(browser.connected, false); assert.deepEqual(frontend.signals, ['SIGTERM', 'SIGKILL']);
});

test('an exited frontend requires close confirmation and is never signalled again', async () => {
  const browser = browserFixture(), frontend = {exitCode: 0, signalCode: null,
    kill() {assert.fail('An exited process must not receive a signal.');}};
  await assert.rejects(cleanupOwnedResources({browser, frontend, frontendClosed: pending(), ...deadlines}), AggregateError);
  assert.equal(browser.connected, false);
});

test('frontend failure cannot bypass browser cleanup or be hidden as a close event', async () => {
  const browser = browserFixture(), process = frontendFixture();
  const rejectedClose = Promise.reject(new Error('Not a confirmed close.'));
  await assert.rejects(cleanupOwnedResources({...process, browser, frontendClosed: rejectedClose, ...deadlines}), AggregateError);
  assert.equal(browser.connected, false);
});

test('both resource failures are reported and both cleanup operations are attempted', async () => {
  const browser = browserFixture(), process = frontendFixture();
  browser.close = async () => {browser.calls++; throw new Error('Browser failure.');};
  process.frontend.kill = function(signal) {this.signals.push(signal); throw new Error('Signal failure.');};
  await assert.rejects(cleanupOwnedResources({...process, browser, ...deadlines}), error => {
    assert.ok(error instanceof AggregateError); assert.equal(error.errors.length, 2); return true;
  });
  assert.equal(browser.calls, 1); assert.deepEqual(process.frontend.signals, ['SIGTERM', 'SIGKILL']);
});

test('confirmed escalation succeeds even when the graceful signal failed', async () => {
  const browser = browserFixture(), process = frontendFixture();
  process.frontend.kill = function(signal) {
    this.signals.push(signal); if (signal === 'SIGTERM') throw new Error('Graceful signal failed.');
    this.signalCode = signal; process.close(); return true;
  };
  await cleanupOwnedResources({...process, browser, ...deadlines});
  assert.equal(browser.connected, false); assert.deepEqual(process.frontend.signals, ['SIGTERM', 'SIGKILL']);
});

test('already disconnected browser still requires a successful close operation', async () => {
  const browser = browserFixture(); browser.connected = false;
  browser.close = async () => {browser.calls++; throw new Error('Close still failed.');};
  await assert.rejects(cleanupOwnedResources({browser, ...deadlines}), AggregateError);
  assert.equal(browser.calls, 1);
});

test('completion is published only after successful work and confirmed cleanup', async () => {
  const order = [];
  const result = await runWithConfirmedCleanup({perform: async () => {order.push('work'); return {value: 1};},
    cleanup: async () => {order.push('cleanup');}, completed: async value => {order.push('completed'); value.result = 'passed';},
    failed: async () => {assert.fail('Successful cleanup must not mark failure.');}});
  assert.deepEqual(order, ['work', 'cleanup', 'completed']); assert.equal(result.result, 'passed');
});

test('successful work followed by cleanup failure never publishes passed or completed', async () => {
  const order = [];
  await assert.rejects(runWithConfirmedCleanup({perform: async () => {order.push('work'); return {};},
    cleanup: async () => {order.push('cleanup'); throw new Error('Not closed.');},
    completed: async () => {assert.fail('No passing result may be published.');},
    failed: async () => {order.push('failed');}}), AggregateError);
  assert.deepEqual(order, ['work', 'cleanup', 'failed']);
});

test('failed work still runs cleanup and records failure without a completion marker', async () => {
  const order = [];
  await assert.rejects(runWithConfirmedCleanup({perform: async () => {order.push('work'); throw new Error('Work failed.');},
    cleanup: async () => {order.push('cleanup');}, completed: async () => {assert.fail('No completion allowed.');},
    failed: async () => {order.push('failed');}}), AggregateError);
  assert.deepEqual(order, ['work', 'cleanup', 'failed']);
});

test('work and cleanup failures are both retained', async () => {
  const failures = [new Error('Work failed.'), new Error('Cleanup failed.')];
  await assert.rejects(runWithConfirmedCleanup({perform: async () => {throw failures[0];},
    cleanup: async () => {throw failures[1];}, completed: async () => {assert.fail('No completion allowed.');},
    failed: async () => {}}), error => {
    assert.ok(error instanceof AggregateError); assert.deepEqual(error.errors, failures); return true;
  });
});

test('completion-marker failure also prevents a returned passing result', async () => {
  let failed = false;
  await assert.rejects(runWithConfirmedCleanup({perform: async () => ({}), cleanup: async () => {},
    completed: async () => {throw new Error('Completion marker failed.');}, failed: async () => {failed = true;}}), AggregateError);
  assert.equal(failed, true);
});

#!/usr/bin/env node
/** Local inference stages a proposal only. Human decisions/execution stay separate. */
import {execFile} from 'node:child_process';
import {open} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {parseArgs, promisify} from 'node:util';
import {createOllamaProvider} from '../backend/LocalInference/ollama.mjs';
import {proposeReimbursement} from '../backend/LocalInference/proposer.mjs';
const run = promisify(execFile);
const authorityCLI = fileURLToPath(new URL('./genesis-reimbursements.py', import.meta.url));
function integer(value, name) {
  if (typeof value !== 'string' || !/^[0-9]+$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new Error('Invalid integer option: ' + name);
  return Number(value);
}
function origin(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname)
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('Use a literal loopback HTTP authority origin.');
  return url.origin;
}
async function main() {
  const {values} = parseArgs({strict: true, allowPositionals: false, options: {
    credentials: {type: 'string'}, url: {type: 'string', default: 'http://127.0.0.1:5088'},
    'reimbursement-id': {type: 'string'}, 'max-amount-minor': {type: 'string'},
    'ttl-seconds': {type: 'string', default: '300'}, 'intent-file': {type: 'string'},
    out: {type: 'string'}, help: {type: 'boolean'},
  }});
  if (values.help) {
    console.log('Node 24+ local proposal bridge. Requires an installed local Ollama model selected by GENESIS_MODEL.');
    console.log('Required: --credentials PATH --reimbursement-id UUID --max-amount-minor INTEGER --intent-file PATH --out NEW_PRIVATE_PATH');
    console.log('Optional: --url LOOPBACK_ORIGIN --ttl-seconds 1..600. Set ASPNETCORE_ENVIRONMENT=Development or Test.');
    console.log('Creates an unapproved proposal only; abstention/failure never approves or executes. No model is downloaded.');
    return;
  }
  if (!['Development', 'Test'].includes(process.env.ASPNETCORE_ENVIRONMENT)
      || !values.credentials || !values.out || !values['intent-file'])
    throw new Error('Explicit local Development/Test configuration and private paths are required.');
  const backend = origin(values.url);
  const maxAmountMinor = integer(values['max-amount-minor'], 'max-amount-minor');
  const ttlSeconds = integer(values['ttl-seconds'], 'ttl-seconds');
  const handle = await open(values['intent-file'], 'r');
  let intent;
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > 16000) throw new Error('A bounded regular intent file is required.');
    const bytes = Buffer.alloc(16001);
    const {bytesRead} = await handle.read(bytes, 0, bytes.length, 0);
    if (bytesRead === bytes.length) throw new Error('Intent file exceeds its limit.');
    intent = new TextDecoder('utf-8', {fatal: true}).decode(bytes.subarray(0, bytesRead));
  } finally { await handle.close(); }
  const provider = createOllamaProvider({model: process.env.GENESIS_MODEL});
  const invoke = async args => {
    try {
      const result = await run(process.env.GENESIS_PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3'),
        [authorityCLI, '--url', backend, '--credentials', values.credentials, ...args],
        {encoding: 'utf8', timeout: 45000, maxBuffer: 131072, windowsHide: true, shell: false});
      return JSON.parse(result.stdout);
    } catch {
      throw new Error('Authority client failed. Staging may be uncertain; inspect server records before retrying.');
    }
  };
  const client = Object.freeze({
    context: id => invoke(['context', '--reimbursement-id', id]),
    propose: body => invoke(['propose', '--reimbursement-id', body.reimbursementId,
      '--expected-version', String(body.expectedVersion), '--max-amount-minor', String(body.maxAmountMinor),
      '--ttl-seconds', String(body.ttlSeconds), '--out', values.out]),
  });
  const result = await proposeReimbursement({client, provider, reimbursementId: values['reimbursement-id'],
    maxAmountMinor, ttlSeconds, intent});
  console.log(JSON.stringify({mode: 'Development/Test local inference proposal bridge', ...result,
    warning: 'Model rationale is untrusted. No approval or execution is performed by this command.'}, null, 2));
}
main().catch(() => {
  console.error('Local proposal command failed. Check private local setup. No approval or execution was performed; inspect records before retrying staging.');
  process.exitCode = 1;
});

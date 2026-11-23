// Real loopback HTTP sockets, explicitly simulated model output. No inference weights.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createServer} from 'node:http';
import test from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {promisify} from 'node:util';
const run = promisify(execFile);
await test('local inference bypasses environment and global-agent proxies', async () => {
  let proxyCalls = 0, localCalls = 0;
  const model = 'genesis-fixture:local';
  const proxy = createServer((request, response) => {
    proxyCalls++;
    response.writeHead(502); response.end('Simulated proxy must never receive local prompts.');
  });
  proxy.on('connect', (request, socket) => { proxyCalls++; socket.end(); });
  const local = createServer(async (request, response) => {
    let text = '';
    for await (const chunk of request) text += chunk;
    const body = JSON.parse(text);
    assert.equal(request.headers.authorization, undefined);
    assert.equal(body.model, model);
    localCalls++;
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/show') response.end(JSON.stringify({model_info: {architecture: 'simulated-test'}}));
    else {
      assert.equal(request.url, '/api/chat');
      response.end(JSON.stringify({model, done: true, done_reason: 'stop',
        message: {role: 'assistant', content: JSON.stringify({recommendation: 'abstain', rationale: 'Simulated transport test only.'})}}));
    }
  });
  try {
    await new Promise((resolve, reject) => { proxy.once('error', reject); proxy.listen(0, '127.0.0.1', resolve); });
    await new Promise((resolve, reject) => { local.once('error', reject); local.listen(11434, '127.0.0.1', resolve); });
    const address = 'http://127.0.0.1:' + proxy.address().port;
    const moduleURL = pathToFileURL(fileURLToPath(new URL('../ollama.mjs', import.meta.url))).href;
    const script = `import {createOllamaProvider} from ${JSON.stringify(moduleURL)};
      const result = await createOllamaProvider({model:${JSON.stringify(model)}}).recommend({
        intent:'Simulated private request',context:{category:'supplies',amountMinor:12500,currency:'USD',maxAmountMinor:50000}});
      console.log(JSON.stringify(result));`;
    const {stdout} = await run(process.execPath, ['--input-type=module', '--eval', script], {
      env: {...process.env, NODE_USE_ENV_PROXY: '1', HTTP_PROXY: address, http_proxy: address,
        HTTPS_PROXY: address, https_proxy: address, ALL_PROXY: address, all_proxy: address, NO_PROXY: '', no_proxy: ''},
      encoding: 'utf8', timeout: 15000, maxBuffer: 131072,
    });
    assert.equal(JSON.parse(stdout).recommendation, 'abstain');
    assert.equal(localCalls, 2);
    assert.equal(proxyCalls, 0, 'Model payload must never reach the configured proxy.');
  } finally {
    if (local.listening) await new Promise(resolve => local.close(resolve));
    if (proxy.listening) await new Promise(resolve => proxy.close(resolve));
  }
});

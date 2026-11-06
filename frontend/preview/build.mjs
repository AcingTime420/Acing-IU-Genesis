import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Dependency-free preview build. Requires Node 24+. Never contacts a live API.
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'dist');
try {
  const commit = process.env.GENESIS_SOURCE_SHA || execFileSync('git', ['rev-parse', 'HEAD'], {cwd: here, encoding: 'utf8'}).trim();
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Expected a full Genesis source commit SHA.');
  const source = await readFile(path.join(here, '../src/lib/genesis-adapter.ts'), 'utf8');
  const compiled = stripTypeScriptTypes(source, {mode: 'strip'});
  await rm(out, {recursive: true, force: true});
  await mkdir(out, {recursive: true});
  for (const name of ['index.html', 'app.mjs']) await copyFile(path.join(here, name), path.join(out, name));
  await writeFile(path.join(out, 'genesis-adapter.mjs'), compiled);
  await writeFile(path.join(out, 'provenance.json'), JSON.stringify({repository: 'AcingTime420/Acing-IU-Genesis', commit, mode: 'mock'}, null, 2) + '\n');
  console.log(`Built repository mock preview at ${out} from ${commit}`);
} catch (error) {
  console.error(`Preview build failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}

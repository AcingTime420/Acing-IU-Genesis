import assert from 'node:assert/strict';
import test from 'node:test';
import { ESLint } from 'eslint';

const eslint = new ESLint();
const linkRule = '@next/next/no-html-link-for-pages';
const locationRule = '@next/next/no-location-assign-relative-destination';
const cases = [
  ['app-route anchor', 'export default function Page(){return <a href="/devices">Devices</a>}', linkRule, true],
  ['external anchor', 'export default function Page(){return <a href="https://example.invalid">External</a>}', linkRule, false],
  ['download anchor', 'export default function Page(){return <a download href="/devices">Save</a>}', linkRule, false],
  ['new-tab anchor', 'export default function Page(){return <a target="_blank" rel="noreferrer" href="/devices">Open</a>}', linkRule, false],
  ['relative location.assign', 'window.location.assign("/devices");', locationRule, true],
  ['relative location.href', 'window.location.href = "/devices";', locationRule, true],
  ['constant relative destination', 'const destination = "/devices"; window.location.assign(destination);', locationRule, true],
  ['external location.assign', 'window.location.assign("https://example.invalid");', locationRule, false],
  ['protocol-relative location', 'window.location.assign("//example.invalid");', locationRule, false],
  ['shadowed local object', 'function navigate(window: {location: {assign: (s: string) => void}}){window.location.assign("/devices");} navigate({location:{assign(){}}});', locationRule, false],
];
for (const [name, code, rule, expected] of cases) {
  test(`native Next lint: ${name}`, async () => {
    const [result] = await eslint.lintText(code, { filePath: 'src/app/lint-validation.tsx' });
    assert.equal(result.messages.some(message => message.fatal), false, 'fixture must parse');
    assert.equal(result.messages.some(message => message.ruleId === rule), expected, name);
  });
}

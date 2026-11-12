import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main, parseArgs, packageManager } from '../bin/vanilla-motion.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vm-cli-'));
  const registry = path.join(root, 'r');
  fs.mkdirSync(registry);
  fs.writeFileSync(path.join(registry, 'demo-fx.json'), JSON.stringify({
    name: 'demo-fx',
    title: 'Demo FX',
    type: 'registry:lib',
    dependencies: ['gsap@^3.15.0'],
    files: [
      { path: 'registry/demo-fx/demo-fx.ts', type: 'registry:file', target: 'lib/vanilla-motion/demo-fx/demo-fx.ts', content: 'export function mount() {}\n' },
      { path: 'registry/demo-fx/params.ts', type: 'registry:file', target: 'lib/vanilla-motion/demo-fx/params.ts', content: 'export const defaults = {};\n' },
    ],
    meta: { version: '1.0.0', entry: 'demo-fx.ts', docs: 'https://vanilla-motion.com/demo-fx/skill.md' },
  }));
  fs.writeFileSync(path.join(registry, 'registry.json'), JSON.stringify({ items: [{ name: 'demo-fx', description: 'A demo.' }] }));
  const cwd = path.join(root, 'project');
  fs.mkdirSync(cwd);
  return { registry, cwd };
}

test('parseArgs', () => {
  assert.deepEqual(parseArgs(['add', 'a', 'b', '--dir', 'x', '--force']).slugs, ['a', 'b']);
  assert.equal(parseArgs(['add', 'a', '--dir=src/fx']).dir, 'src/fx');
  assert.throws(() => parseArgs(['add', '--nope']), /unknown option/);
  assert.throws(() => parseArgs(['add', 'a', '--dir']), /needs a value/);
});

test('add writes the files under <dir>/<slug>/ and prints deps + usage', async () => {
  const { registry, cwd } = fixture();
  fs.writeFileSync(path.join(cwd, 'pnpm-lock.yaml'), '');
  const out = [];
  await main(['add', 'demo-fx', '--registry', registry], { cwd, log: (s) => out.push(s) });
  assert.equal(fs.readFileSync(path.join(cwd, 'vanilla-motion/demo-fx/demo-fx.ts'), 'utf8'), 'export function mount() {}\n');
  assert.ok(fs.existsSync(path.join(cwd, 'vanilla-motion/demo-fx/params.ts')));
  const text = out.join('\n');
  assert.match(text, /pnpm add gsap@\^3\.15\.0/);
  assert.match(text, /import \{ mount \} from "\.\/vanilla-motion\/demo-fx\/demo-fx"/);
});

test('add refuses to overwrite without --force', async () => {
  const { registry, cwd } = fixture();
  const log = () => {};
  await main(['add', 'demo-fx', '--registry', registry], { cwd, log });
  await assert.rejects(main(['add', 'demo-fx', '--registry', registry], { cwd, log }), /--force/);
  await main(['add', 'demo-fx', '--registry', registry, '--force'], { cwd, log });
});

test('unknown slug and bad slug', async () => {
  const { registry, cwd } = fixture();
  await assert.rejects(main(['add', 'nope', '--registry', registry], { cwd, log: () => {} }), /no effect "nope"/);
  await assert.rejects(main(['add', '../etc', '--registry', registry], { cwd, log: () => {} }), /not an effect slug/);
});

test('list', async () => {
  const { registry, cwd } = fixture();
  const out = [];
  await main(['list', '--registry', registry], { cwd, log: (s) => out.push(s) });
  assert.match(out[0], /demo-fx\s+A demo\./);
});

test('packageManager defaults to npm', () => {
  assert.equal(packageManager(fs.mkdtempSync(path.join(os.tmpdir(), 'vm-pm-'))), 'npm install');
});

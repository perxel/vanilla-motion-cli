#!/usr/bin/env node
// npx vanilla-motion add <slug> — copy a Vanilla Motion effect's source into any project (plan 003, A8).
// Reads the same registry JSON the shadcn CLI reads (https://vanilla-motion.com/r/<slug>.json), so
// there is one source of truth and no separate build. No dependencies: Node 18+ only.

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_REGISTRY = 'https://vanilla-motion.com/r';
const HELP = `vanilla-motion: copy an effect's source into your project

Usage
  npx vanilla-motion add <slug> [<slug>…] [--dir <path>] [--force]
  npx vanilla-motion list

Options
  --dir <path>       where effects go (default ./vanilla-motion); each one in <path>/<slug>/
  --force            overwrite files that already exist
  --registry <url>   registry root (default ${DEFAULT_REGISTRY}); a local folder works too

Browse the effects at https://vanilla-motion.com`;

export function parseArgs(argv) {
  const opts = { command: null, slugs: [], dir: 'vanilla-motion', force: false, registry: DEFAULT_REGISTRY, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--force' || a === '-f') opts.force = true;
    else if (a === '--dir' || a === '--registry') {
      const v = argv[++i];
      if (!v || v.startsWith('-')) throw new Error(`${a} needs a value`);
      opts[a.slice(2)] = v;
    } else if (a.startsWith('--dir=')) opts.dir = a.slice(6);
    else if (a.startsWith('--registry=')) opts.registry = a.slice(11);
    else if (a.startsWith('-')) throw new Error(`unknown option ${a}`);
    else if (!opts.command) opts.command = a;
    else opts.slugs.push(a);
  }
  return opts;
}

async function readJson(registry, name) {
  if (/^https?:\/\//.test(registry)) {
    const url = `${registry.replace(/\/$/, '')}/${name}`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  }
  const file = path.join(registry, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

/** Which package manager the project uses, from its lockfile. */
export function packageManager(cwd) {
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm add';
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn add';
  if (fs.existsSync(path.join(cwd, 'bun.lockb')) || fs.existsSync(path.join(cwd, 'bun.lock'))) return 'bun add';
  return 'npm install';
}

/** Write one registry item's files under <dir>/<slug>/. Returns what was written. */
export function writeItem(item, { dir, force, cwd }) {
  const target = path.resolve(cwd, dir, item.name);
  const files = item.files.map((f) => {
    const name = path.basename(f.target ?? f.path);
    if (!name || name.includes('..')) throw new Error(`${item.name}: bad file name "${name}"`);
    return { file: path.join(target, name), content: f.content };
  });
  const existing = files.filter((f) => fs.existsSync(f.file));
  if (existing.length && !force) {
    throw new Error(`${path.relative(cwd, target)}/ already has ${existing.map((f) => path.basename(f.file)).join(', ')}; use --force to overwrite`);
  }
  fs.mkdirSync(target, { recursive: true });
  for (const f of files) fs.writeFileSync(f.file, f.content);
  return { target, files: files.map((f) => f.file) };
}

function usage(item, target, cwd) {
  const rel = `./${path.relative(cwd, path.join(target, item.meta?.entry ?? `${item.name}.ts`)).replace(/\\/g, '/').replace(/\.ts$/, '')}`;
  return `  import { mount } from "${rel}";

  const fx = mount(document.querySelector("#my-effect"), { /* params */ });
  fx.setParams({ /* change any param later */ });
  fx.dispose(); // stops it and restores the element`;
}

export async function main(argv, { cwd = process.cwd(), log = console.log } = {}) {
  const opts = parseArgs(argv);
  if (opts.help || !opts.command) {
    log(HELP);
    return 0;
  }
  if (opts.command === 'list') {
    const index = await readJson(opts.registry, 'registry.json');
    if (!index) throw new Error('registry.json not found');
    for (const it of index.items) log(`${it.name.padEnd(28)} ${it.description}`);
    return 0;
  }
  if (opts.command !== 'add') throw new Error(`unknown command "${opts.command}" (add | list)`);
  if (!opts.slugs.length) throw new Error('add needs at least one effect slug, e.g. npx vanilla-motion add ice-logo');

  const deps = new Set();
  for (const slug of opts.slugs) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`"${slug}" is not an effect slug`);
    const item = await readJson(opts.registry, `${slug}.json`);
    if (!item) throw new Error(`no effect "${slug}" (see npx vanilla-motion list)`);
    const { target, files } = writeItem(item, { dir: opts.dir, force: opts.force, cwd });
    log(`✓ ${item.title} ${item.meta?.version ?? ''} → ${path.relative(cwd, target) || '.'}/ (${files.length} files)`);
    log(usage(item, target, cwd));
    if (item.meta?.docs) log(`  Params and how it works: ${item.meta.docs}\n`);
    for (const d of item.dependencies ?? []) deps.add(d);
  }
  if (deps.size) log(`Install its dependencies:\n  ${packageManager(cwd)} ${[...deps].join(' ')}`);
  log('The files are TypeScript; any bundler (Vite, Next.js, Astro, webpack…) compiles them.');
  return 0;
}

const isCli = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname);
if (isCli) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`✗ ${err.message}`);
      process.exit(1);
    },
  );
}

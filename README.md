<p align="center">
  <a href="https://vanilla-motion.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/perxel/vanilla-motion-cli/main/.github/assets/logo-white.svg">
      <img src="https://raw.githubusercontent.com/perxel/vanilla-motion-cli/main/.github/assets/logo.svg" alt="Vanilla Motion" width="160">
    </picture>
  </a>
</p>

<h1 align="center">vanilla-motion</h1>

<p align="center">
  Copy a <a href="https://vanilla-motion.com">Vanilla Motion</a> effect's source into your project.<br>
  No runtime package: the effect's TypeScript files become yours.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vanilla-motion"><img src="https://img.shields.io/npm/v/vanilla-motion?color=111111" alt="npm version"></a>
  <a href="https://github.com/perxel/vanilla-motion-cli/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/vanilla-motion?color=111111" alt="license"></a>
  <img src="https://img.shields.io/node/v/vanilla-motion?color=111111" alt="node version">
</p>

---

## Quick start

```sh
npx vanilla-motion list                 # every public effect, with a one-line description
npx vanilla-motion add ice-logo         # → ./vanilla-motion/ice-logo/
```

The CLI copies the files, then prints the npm packages the effect needs (if any) and how to start it:

```ts
import { mount } from "./vanilla-motion/ice-logo/ice-logo";

const fx = mount(document.querySelector("#logo"), { maxBroken: 20 });
fx.setParams({ reach: 4 }); // change params live
fx.dispose();               // remove listeners, canvases and timers
```

Every effect has the same shape: `mount(container, options)` returns `{ setParams, dispose }`.

## Usage

```sh
npx vanilla-motion add <slug> [<slug>…] [--dir <path>] [--force]
npx vanilla-motion list
npx vanilla-motion --version
```

| Option             | What it does                                                                         |
|--------------------|--------------------------------------------------------------------------------------|
| `--dir <path>`     | Where effects go (default `./vanilla-motion`); each one lands in `<path>/<slug>/`    |
| `--force`          | Overwrite files that already exist                                                   |
| `--registry <url>` | Registry root (default `https://vanilla-motion.com/r`); a local folder works too     |

Examples:

```sh
npx vanilla-motion add ice-logo --dir src/effects
npx vanilla-motion add ripple-reveal venetian-blind
```

## Finding the right params

- Each effect page on [vanilla-motion.com](https://vanilla-motion.com) lists its params, defaults and ranges, with a live
  panel to tune them.
- `https://vanilla-motion.com/<slug>/skill.md` explains the code, written for AI agents.
- The [Vanilla Motion MCP](https://mcp.vanilla-motion.com) (`https://mcp.vanilla-motion.com/mcp`) lets Claude, Cursor,
  ChatGPT or VS Code find an effect and wire it up for you.

## shadcn

Projects that use shadcn can pull the same files from the same registry:

```sh
npx shadcn@latest add https://vanilla-motion.com/r/<slug>.json
```

## Release

Publish a GitHub release tagged `v<version>` (e.g. `v0.2.0`). `.github/workflows/publish.yml` sets `package.json` to
that version, runs the tests and publishes to npm through OIDC trusted publishing (`phucbm/publish-npm-action`, no npm
token). The registry it reads is built by [perxel/vanilla-motion](https://github.com/perxel/vanilla-motion)
(`/r/<slug>.json`).

## License

MIT © [Perxel](https://perxel.com)

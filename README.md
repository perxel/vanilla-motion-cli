# vanilla-motion

Copy a [Vanilla Motion](https://vanilla-motion.com) effect's source into your project. No runtime package: the
effect's TypeScript files become yours.

```sh
npx vanilla-motion add ice-logo          # → ./vanilla-motion/ice-logo/
npx vanilla-motion add ice-logo --dir src/effects
npx vanilla-motion list
```

It prints the npm packages the effect needs (if any) and how to start it:

```ts
import { mount } from "./vanilla-motion/ice-logo/ice-logo";

const fx = mount(document.querySelector("#logo"), { maxBroken: 20 });
fx.setParams({ reach: 4 });
fx.dispose();
```

Every effect page on vanilla-motion.com lists its params; `https://vanilla-motion.com/<slug>/skill.md` explains the
code. Projects that use shadcn can run `npx shadcn@latest add https://vanilla-motion.com/r/<slug>.json` instead: it
reads the same registry file.

## Release

Publish a GitHub release tagged `v<version>` (e.g. `v0.2.0`). `.github/workflows/publish.yml` sets
`package.json` to that version, runs the tests and publishes to npm through OIDC trusted publishing
(`phucbm/publish-npm-action`, no npm token). The registry it reads is built by
[perxel/vanilla-motion](https://github.com/perxel/vanilla-motion) (`/r/<slug>.json`).

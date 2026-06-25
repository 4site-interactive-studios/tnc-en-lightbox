# stream-a — Build pipeline & core lightbox

**Wave:** 0 · **Branch:** `feat/wave-0-core` · **Depends on:** none ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-0 README](./README.md), this brief.
**Status:** implemented — core open/close lifecycle, a11y, and Vitest suite landed on `feat/wave-0-core`; build, bundle contract, and all SDD gates green in CI (PR #2).

## Goal
Stand up the toolchain and ship a walking-skeleton lightbox. After this lands, the repo builds a
single, minified, dependency-free JS file (with SCSS **inlined into the JS**) into `dist/`, runs a
Vitest + jsdom suite, and CI gates are green. The runtime artifact reads a global config object and
renders an overlay + 2-column dialog that a user can close three ways (ESC, the top-right X button,
an overlay click), with focus trapped while open and restored on close. This is the substrate every
later wave (triggers, theming, EN integration) builds on.

## In scope
- **Toolchain:** `package.json` (npm), `tsconfig.json` (strict), `vite.config.ts` for a **single-file**
  library build — IIFE/UMD output, SCSS compiled and **inlined into the JS** (no emitted `.css`),
  minified, zero runtime deps.
- **npm scripts:** `build` (vite build), `test` (`vitest run`), `typecheck` (`tsc --noEmit`),
  `lint` (ESLint). `npm test` runs headless (jsdom environment).
- **Config types + reader:** `src/config.ts` — a TypeScript interface for the global config object a
  page editor sets (e.g. `window.ENLightbox = {…}`), plus a normalizer with sane defaults. Wave-0
  only needs the fields the core uses (content: header / body / image / CTA; behavior:
  `closeOnOverlay`, `closeOnEsc`). Trigger/theme fields are typed as optional placeholders for later
  waves.
- **Core lightbox:** `src/core/lightbox.ts` — a `Lightbox` class with `open()` / `close()` /
  `destroy()`. Builds DOM: overlay, dialog (`role="dialog"`, `aria-modal="true"`, labelled by the
  header), 2-column layout (image left / content right), top-right close (X) button. Class-prefix all
  nodes (e.g. `enlb-`).
- **Close paths:** ESC key, X-button click, overlay (backdrop) click all close; clicks **inside** the
  dialog do not.
- **A11y:** focus moves into the dialog on open, is trapped (Tab / Shift+Tab cycle), and is restored
  to the previously-focused element on close.
- **Styles:** `src/styles/lightbox.scss` — overlay + 2-col layout + mobile-stacking baseline,
  imported from TS so Vite inlines it.
- **Entry/bootstrap:** `src/index.ts` — public API export + optional auto-init that instantiates from
  the global config when present (a page editor sets the global and loads the script).
- **Bundle-freshness contract:** add a `bundle` entry to `.agentic/contracts/registry.json`
  (generate: `npm run build`; check: `npm run build && git add -AN && git diff --exit-code dist/`)
  **and** add `actions/setup-node` + `npm ci` to the `contracts-check` job in
  `.github/workflows/sdd-gates.yml` so the check can run. Commit the built `dist/` artifact.

## Out of scope
- Triggers (time / scroll / inactivity / exit-intent) — **wave-1**.
- Multiple themes / full visual customization beyond the baseline 2-col layout — **wave-2**.
- EN page-type / page-ID detection and CTA redirect-vs-close semantics — **wave-3**.
- Editor-facing + advanced-customization README — **wave-3** (a short dev/build note now is fine).
- release-please configuration — set up when the first release is cut.

## Deliverables
- `package.json`, `tsconfig.json`, `vite.config.ts`, ESLint config.
- `src/index.ts`, `src/config.ts`, `src/core/lightbox.ts`, `src/styles/lightbox.scss`.
- `dist/en-lightbox.js` — committed, minified, self-contained (styles inlined).
- Vitest suite under `src/**` (e.g. `src/core/lightbox.test.ts`, `src/config.test.ts`).
- `.agentic/contracts/registry.json` with the `bundle` contract; `sdd-gates.yml` `contracts-check`
  job gains Node setup.
- A short **Development** section in the root `README.md` (how to build/test).

## Acceptance criteria
- [x] `npm install && npm run build` produces **one** minified JS file in `dist/` with **no** emitted
      `.css` and **no** runtime dependencies (verify: a single JS artifact; styles present inside it).
- [x] `npm test` green in jsdom; suite covers render, all three close paths, the inside-click
      no-close case, and focus trap + restore.
- [x] Negative test: a click **inside** the dialog does not close it; with `closeOnOverlay:false`, an
      overlay click does not close.
- [x] `destroy()` removes all DOM and listeners — opening/closing repeatedly leaks nothing.
- [x] `python3 tools/sdd/check_contracts.py` passes with the new `bundle` contract (dist matches src).
- [x] All SDD gates green in CI; `npm run typecheck` and `npm run lint` clean.
- [x] Mutation-verify: break one load-bearing line (e.g. the ESC handler), show the **named** test go
      red (cite file:line, before→after), then revert.

## First action
Write the failing test `src/core/lightbox.test.ts` asserting that `new Lightbox(config).open()` mounts
an overlay + dialog into `document.body`, and that pressing `Escape` removes them. Red first, then
make it green.

## Gotchas
- **Inline the SCSS into the JS.** Vite's library mode emits a separate `.css` by default; configure
  it to inject styles at runtime from within the JS (e.g. `cssCodeSplit:false` + a style-injection
  approach). The "single self-contained artifact" NFR fails the moment a `.css` is emitted.
- **Contract CI needs Node.** The scaffolded `contracts-check` job only sets up Python. The `bundle`
  contract's check runs `npm run build`, so add `actions/setup-node` + `npm ci` to that job or the
  gate fails in CI.
- **Deletion-blindness in the bundle check.** Use the staged form
  `npm run build && git add -AN && git diff --exit-code dist/` — a plain `git diff` misses a
  newly-emitted untracked bundle file.
- **Don't pollute the host page.** Prefix every class, never leave global listeners alive after
  `close()`, and assume nothing about the page's framework — this drops onto arbitrary EN pages.
- **Focus restore.** Capture `document.activeElement` before opening and restore it on close, or
  keyboard users get dumped to the top of the page.
- **jsdom limits.** jsdom does not lay out or animate; assert behavior / DOM / attributes / listeners,
  not pixel geometry. Leave visual + responsive verification to manual cross-browser QA.

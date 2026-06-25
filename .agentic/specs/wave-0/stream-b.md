# stream-b — wave-0 backfill: config seam, foundation contracts & a11y/UX hardening

**Wave:** 0 · **Branch:** `feat/wave-0-backfill` · **Depends on:** wave-0/stream-a (merged) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-0 README](./README.md), this brief, [`ROADMAP.md`](../ROADMAP.md) (the master plan — esp. **B1–B5**, Decisions **D2/D8/D14**, **Risk R1**), and the [wave-0/stream-a brief](./stream-a.md) (the shipped core).

## Goal
Harden the wave-0 foundation so every later wave extends it additively. Establish the **compilable**
config-extension seam that all later config fields plug into (proven with `tsc`), lock three
foundation contracts as green baselines before wave-1 perturbs the config type, and close the unowned
modal-a11y defects (accessible name, background isolation, scroll-lock, initial-focus) on the core.
This is the substrate the ROADMAP's additive design depends on; landing it unblocks wave-1.

## In scope
- **B1 — config extension seam (Decision D2 / Risk R1).** In `src/config.ts`:
  - Replace `triggers?: unknown` and `theme?: unknown` with **empty extensible base interfaces** plus
    fields typed to them: `export interface TriggersConfigBase {}` + `triggers?: TriggersConfigBase`;
    `export interface ThemeConfigBase {}` + `theme?: ThemeConfigBase`.
  - Add the new optional top-level fields `layout?: LayoutConfigBase` and `en?: ENIntegrationConfigBase`
    with their empty base interfaces (placeholders later waves populate; `en?` stays minimal — EN
    targeting is done by the editor placing the config per page, not by detection).
  - **Prove the seam compiles**: add a type-level fixture (e.g. `src/config.augment-check.ts` and/or a
    `*.test-d`/test) where a *separate* module adds a member via
    `declare module '../config' { interface TriggersConfigBase { time?: number } }` and a usage asserts
    the member resolves; `npm run typecheck` (`tsc --noEmit`, strict) passes. Document in the PR that the
    rejected `unknown`-narrowing form does NOT compile (do not commit the broken form).
  - `config.ts` must NOT import any feature directory (dependency direction preserved).
- **B2 — `no-css-emitted` contract** in `.agentic/contracts/registry.json`:
  `npm run build && git add -AN && if find dist -name '*.css' -type f | grep -q .; then echo 'ERROR: .css emitted'; exit 1; fi`
  (CI job `contracts-check`, which already runs `npm ci`).
- **B3 — `api-surface` contract.** Committed snapshot `.agentic/contracts/snapshots/api-surface.txt` =
  deterministic, sorted `export name : type signature` of the public `src/index.ts` surface + the IIFE
  global name string. Generator under `tools/sdd/` (a dev-only tool such as ts-morph is fine — runtime
  stays zero-dep) exposed as an `npm run` alias; check regenerates and
  `… && git add -AN && git diff --exit-code` the snapshot. Green baseline now.
- **B4 — `config-schema` contract.** Committed snapshot of the **current (wave-0)** composed
  `ENLightboxConfig`/`NormalizedConfig` shape + each default; generator + staged-diff check; green
  baseline now. (Per-bucket sub-normalizer composition, Decision D8, arrives with each feature wave —
  **not here**; do NOT create feature dirs/normalizers for it.)
- **B5 — core a11y/UX additive slice** in `src/core/lightbox.ts` (additive; wave-0's 20 tests stay green):
  - **Accessible name (N11):** when `header` is empty, the dialog still has a non-empty accessible name
    (e.g. an `aria-label` fallback); test asserts the computed name is non-empty.
  - **Background isolation (N15):** on `open()`, set `inert` + `aria-hidden` on the body's other
    children (saving prior values); restore exactly on `close()`; test.
  - **Scroll-lock (N16):** lock body scroll on `open()`, restore scroll position on `close()`/`destroy()`;
    document the iOS overscroll approach; test.
  - **Initial-focus (N18):** focus the labelled dialog root by default (not the X button); test.

## Out of scope
- Trigger / theme / EN feature logic — later waves (only the empty config base interfaces land now).
- Per-bucket sub-normalizers (`src/<bucket>/normalize.ts`) and creating `src/triggers|themes|en/` dirs —
  with their waves (Decision D8/D9).
- The other contracts (`bundle-size`, `no-runtime-deps`, `no-runtime-fetch`, `reduced-motion-guard`,
  `dist-single-file`, `a11y-audit`, `cross-browser-smoke`) — wave-1+ per the ROADMAP.
- The CTA `<a>`→`<button>` element change — wave-2 (Decision D6).

## Deliverables
- `src/config.ts` — empty extensible base interfaces; `triggers?/theme?/layout?/en?` typed to them;
  `unknown` removed. Compile-proof fixture for the seam.
- `.agentic/contracts/registry.json` — `no-css-emitted`, `api-surface`, `config-schema` entries;
  generators under `tools/sdd/` + `npm run` aliases; committed snapshots under
  `.agentic/contracts/snapshots/`.
- `src/core/lightbox.ts` — accessible-name fallback, background inert, scroll-lock, initial-focus;
  tests under `src/core/`.
- `.agentic/specs/wave-0/stream-a.md` — a short "Backfill (stream-b) amendments" note (spec-coupling).
- Refreshed `dist/en-lightbox.js`.

## Acceptance criteria
- [ ] `npm run typecheck` passes with the new seam; the compile-proof fixture shows a feature module
      *adding* a member to a base interface resolving; wave-0's 20 tests still pass.
- [ ] `no-css-emitted`, `api-surface`, `config-schema` contracts present and **green**
      (`python3 tools/sdd/check_contracts.py` OK); each `git diff` check uses `git add -AN`.
- [ ] B5 tests prove: non-empty accessible name when `header` is empty; body siblings inert/`aria-hidden`
      on open and **restored** on close; body scroll locked on open and **restored** on close/destroy;
      initial focus on the dialog root. `destroy()` leaves nothing behind.
- [ ] `npm run build` still emits **one** minified, dependency-free JS file with SCSS inlined; the
      `bundle` contract is green.
- [ ] All four SDD gates green in CI; `npm run typecheck` and `npm run lint` clean.
- [ ] Mutation-verify: break one load-bearing line (e.g. the inert-restore or the scroll-restore), show
      the **named** test go red (cite file:line, before→after), then revert.

## First action
Write the failing test `src/core/lightbox.a11y.test.ts` asserting that on `open()` the other body
children become `inert`/`aria-hidden` and are restored on `close()`. Red first, then green. (The B1
typecheck-proof fixture can land alongside.)

## Gotchas
- **R1 is the whole point.** Declaration merging *adds* members to an interface; it **cannot** narrow an
  existing `unknown` (errors: "Subsequent property declarations must have the same type"). Use empty base
  interfaces; augment from the feature module with the correct relative specifier (`'../config'`); prove
  with `tsc --noEmit --strict`.
- **Don't create feature dirs yet.** Only `config.ts` base interfaces land now; `src/triggers/` etc.
  arrive with their waves (and get ownership carve-outs then, D9).
- **spec-coupling.** `src/config.ts` and `src/core/lightbox.ts` are owned by `wave-0/stream-a.md`
  (`src/**` rule), so this PR must also add the "Backfill (stream-b) amendments" note to `stream-a.md`
  (or carry `[no-spec: backfill of wave-0 core, tracked by wave-0/stream-b.md]`). The
  contracts/tools/snapshots files are not under `src/`, so they don't trip spec-coupling.
- **test-coupling** is satisfied by the B5 tests (the PR changes test files); B1's type fixture also counts.
- **a11y restore must be exact.** Save and restore prior `inert`/`aria-hidden`/`tabindex`/body `overflow`/
  scroll position — never clobber attributes the host page already set. Test the restore path.
- **`inert` in jsdom.** jsdom may not enforce real `inert` focus-blocking — assert the attribute is
  set/removed (and `aria-hidden` for SR), not real focus containment; leave behavior to cross-browser QA.
- **Deterministic generators.** `api-surface`/`config-schema` output must be sorted/stable so the snapshot
  diff is reproducible across machines (matches the byte-identical-bundle invariant).
- **One artifact, zero runtime deps.** Everything still compiles into the single `dist/en-lightbox.js`;
  use the staged bundle check (`npm run build && git add -AN && git diff --exit-code dist/`).

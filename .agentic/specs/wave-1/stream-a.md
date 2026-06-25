# stream-a — Trigger dispatcher, trigger set, frequency-capped dismissal & composition

**Wave:** 1 · **Branch:** `feat/wave-1-triggers` · **Depends on:** wave-0 (core lightbox) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the
[wave-1 README](./README.md), this brief, [`ROADMAP.md`](../ROADMAP.md) (wave-1 section +
amendments).

## Goal

Deliver the behavior-triggered lightbox: a `src/triggers/` dispatcher that arms four trigger
implementations (time-on-page, scroll-depth, inactivity, exit-intent), fires `open()` exactly once
on the first match (any-of semantics, first-to-fire wins, others disarm), and enforces
frequency-capped dismissal via `localStorage` so the lightbox never nags. The wiring lives in
`src/index.ts` as thin call-through only; the dispatcher, normalizer, and dismissal logic live in
governed `src/triggers/` modules.

## In scope

- **`src/triggers/` dispatcher + 4 triggers:** time-on-page, scroll-depth, inactivity, exit-intent
  behind a common `Trigger` interface (`arm(onFire)`, `disarm()`). First-to-fire opens ONCE via
  `ENLightboxAPI.getInstance().open()`; all others disarm immediately.
- **Frequency-capped dismissal:** `localStorage`, keyed per `location.pathname`; page-editor
  `frequencyDays` (default 7; 0 = every load); eligible iff no record or
  `Date.now() - stored >= frequencyDays * 86_400_000`; stamp on show (refresh on dismiss); storage
  unavailable → fail OPEN, never throw. Single key-derivation function (`enlb:shown:${pathname}`).
- **Config typing:** augment `TriggersConfigBase` via `declare module '../config'` from
  `src/triggers/` (don't widen the base-interface body). B1 backfill: replace `triggers?: unknown`
  with `export interface TriggersConfigBase {}` + `triggers?: TriggersConfigBase` in `config.ts`.
- **Wiring from `src/index.ts`:** frequency gate + arm triggers from `window.ENLightbox`; API
  `armTriggers` / `disarmTriggers` / `isEligible` / `open` / `close`. Minimal additive `enlb:dismiss`
  `CustomEvent` on the core (`Lightbox.close()` dispatches `{ detail: { pathname } }`).
- **Contracts:** add `bundle-size` (gzip-gated; committed budget in
  `.agentic/contracts/budgets.json`, baseline from current dist) and `no-runtime-deps` to
  `registry.json`.
- **Ownership:** `src/triggers/**` → `.agentic/specs/wave-1/stream-a.md` added to
  `ownership.json.rules{}` as the first commit (Decision D9).

## Out of scope

- EN detection / `canArm` hook / `ENPageContext` — editor places config by hand; no canArm hook this
  stream.
- Theming — wave-2.
- Analytics / A-B / video-progress trigger — BACKLOG.
- `sessionStorage`-based session dismissal — superseded by `localStorage` frequency-capped dismissal
  (this stream's JIT authority).
- Per-bucket sub-normalizer composition for theme/layout/en — their waves.

## Deliverables

- `src/triggers/types.ts` — common `Trigger` interface.
- `src/triggers/config.ts` — trigger config types, `TriggersConfigBase` augmentation via
  `declare module '../config'`, `normalizeTriggers()`.
- `src/triggers/dismissal.ts` — frequency-capped dismissal: key derivation, `isEligible()`, `stamp()`.
- `src/triggers/dispatcher.ts` — trigger dispatcher (arm/disarm, first-to-fire wins).
- `src/triggers/time-on-page.ts`, `src/triggers/scroll-depth.ts`, `src/triggers/inactivity.ts`,
  `src/triggers/exit-intent.ts` — 4 trigger implementations.
- `src/triggers/index.ts` — barrel re-exports (spec-exempt).
- `src/triggers/dispatcher.test.ts` + per-trigger and dismissal test files.
- `src/config.ts` — `TriggersConfigBase` empty interface (B1 backfill; `[no-spec: additive config
  field for wave-1]`).
- `src/core/lightbox.ts` — additive `enlb:dismiss` `CustomEvent` on `close()` (`[no-spec: additive
  dismiss signal for wave-1]`).
- `src/index.ts` — API methods + auto-init trigger arming + `enlb:dismiss` listener (spec-exempt).
- `.agentic/contracts/registry.json` — `bundle-size` + `no-runtime-deps` entries.
- `.agentic/contracts/budgets.json` — gzip budget.
- `tools/sdd/check_size.mjs` — bundle-size check tool.
- `.agentic/ownership.json` — `src/triggers/**` rule.
- `.agentic/specs/wave-1/README.md` + `.agentic/specs/wave-1/stream-a.md` — this spec.
- Refreshed `dist/en-lightbox.js`.

## Acceptance criteria

- [ ] `npm test` green: dispatcher, all 4 triggers, frequency-capped dismissal (eligible + blocked +
      storage-unavailable fail-open), composition (first-to-fire wins, others disarm) covered.
- [ ] `npm run typecheck` passes with the `TriggersConfigBase` augmentation; `npm run lint` clean;
      `npm run build` emits one dependency-free JS file.
- [ ] `bundle-size` and `no-runtime-deps` contracts green (`python3 tools/sdd/check_contracts.py`).
- [ ] All four SDD gates green in CI.
- [ ] Mutation-verify: break one load-bearing line (e.g. the frequency-window comparison), show the
      named test go red (file:line, before→after), revert.
- [ ] Negative test: a fresh `enlb:shown` localStorage record inside `frequencyDays` blocks arming.
- [ ] Storage-unavailable path fails OPEN (never throws).

## First action

Write the failing test `src/triggers/dispatcher.test.ts`: (a) arming a time-on-page trigger opens
`ENLightboxAPI.getInstance()` after the delay (fake timers) and NOT before; (b) with a fresh
`enlb:shown` localStorage record inside `frequencyDays`, arming does NOT open. Red first, then green.

## Gotchas

- **B1 backfill is folded here.** The wave-0 backfill (stream-b) was scaffolded but not implemented.
  `config.ts` still has `triggers?: unknown` — replace with `TriggersConfigBase` (empty interface +
  field). Declaration merging *adds* members; it cannot narrow `unknown` (Risk R1). Prove with
  `tsc --noEmit`.
- **`declare module '../config'` specifier.** From `src/triggers/config.ts`, the relative specifier
  to `src/config.ts` is `'../config'`, not `'./config'`. Get this wrong and the augmentation silently
  targets nothing.
- **`verbatimModuleSyntax: true`.** Use `import type` for type-only imports; the augmentation
  `declare module` block is ambient and does not need a runtime import of `'../config'`.
- **Frequency-capped dismissal uses `localStorage`, not `sessionStorage`.** This stream's JIT brief
  supersedes the ROADMAP's session-discipline design. Key: `enlb:shown:${pathname}`. Stamp on show,
  refresh on dismiss (same key, same operation).
- **Storage unavailable → fail OPEN.** Safari private mode can throw on `localStorage` writes. Wrap
  in try/catch; treat unavailable as eligible (never throw, never block the host page).
- **`enlb:dismiss` is additive on the core.** `Lightbox.close()` dispatches a `CustomEvent` on
  `document`; the dismissal listener in `index.ts` catches it and refreshes the stamp. Core→feature
  decoupling via events, never direct imports from `src/triggers/` into `src/core/`.
- **`src/index.ts` is spec-exempt but holds no logic.** The dispatcher, normalizer, and dismissal
  logic live in governed `src/triggers/` modules. `index.ts` is a thin call-through (Decision D8).
- **CI does NOT run the vitest suite.** Run `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build` GREEN locally before the PR. CI runs the 4 SDD gates only.
- **`exit-intent` on touch = no-op.** No mouse events on touch; the trigger simply won't fire. No
  special handling needed.
- **Passive listeners.** Scroll/mousemove listeners use `{ passive: true }` (N3 non-intrusive NFR).
- **Single dependency-free artifact.** Everything compiles into `dist/en-lightbox.js`; zero runtime
  deps (the `no-runtime-deps` contract asserts `package.json` `dependencies` is empty/absent).

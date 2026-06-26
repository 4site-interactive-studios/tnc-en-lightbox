# stream-a — Behavior triggers, frequency-capped dismissal & composition

**Wave:** 1 · **Branch:** `feat/wave-1-triggers` · **Depends on:** wave-0 (core + backfill) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-1 README](./README.md), this brief, [`ROADMAP.md`](../ROADMAP.md) (the wave-1 section **and the "Amendments — wave-1 entry"** section, which governs), and the wave-0 config seam (`src/config.ts` base interfaces).

## Goal
Make the lightbox fire itself and respect a per-page display frequency. A trigger engine opens the
auto-instantiated lightbox when a configured behavior trigger fires (time-on-page, scroll-depth,
inactivity, exit-intent), composes multiple triggers (first-to-fire wins, the rest disarm), and
enforces a persistent, page-editor-configurable display frequency (default: once every 7 days) via
localStorage so the user isn't nagged. All work is deferred until a trigger is armed.

## In scope
- **`src/triggers/` dispatcher + four triggers + composition:** a dispatcher that arms the configured
  triggers and, on the first to fire, calls `ENLightboxAPI.getInstance()?.open()` exactly once, then
  disarms the rest. Triggers: **time-on-page** (after N ms), **scroll-depth** (≥ X%), **inactivity**
  (after N ms idle; input resets the timer), **exit-intent** (desktop pointer-out-top; touch = no-op).
- **Frequency-capped dismissal (the wave-1 dismissal model):**
  - **localStorage**, keyed per `location.pathname` (e.g. `enlb:shown:${pathname}` = a timestamp).
  - Page-editor field **`frequencyDays?: number`** (default **7**; `0` = show every load): "show at most
    once per `frequencyDays` on a given page."
  - Eligible to open iff no stored timestamp **or** `Date.now() - stored ≥ frequencyDays·86 400 000`.
    Stamp the timestamp when the lightbox is shown (`open()`); refresh on dismiss. (Stamp-on-show
    semantics — confirmed with the owner.)
  - localStorage unavailable/throwing (Safari private mode, disabled) ⇒ **fail open** (treat as
    eligible) and **never throw** on the host page; unit-test a throwing storage.
  - A single internal key/derivation function used by both the writer and the eligibility check.
- **Trigger + frequency config typing** owned in `src/triggers/`: augment `TriggersConfigBase` via the
  proven wave-0 seam (`declare module '../config'`) — do NOT widen the base-interface body in
  `config.ts`. Export the concrete `TriggersConfig`/`frequencyDays` types for docs.
- **Wiring in `src/index.ts`** (exempt from spec-coupling): after auto-init instantiates the Lightbox
  from `window.ENLightbox`, apply the frequency gate and arm triggers from the config. Public API:
  `ENLightboxAPI.armTriggers(config?)`, `disarmTriggers()`, `isEligible()`/`isDismissed()`, `open()`,
  `close()`.
- **Minimal additive `enlb:dismiss` CustomEvent** dispatched by `Lightbox.close()` (the backfill did
  NOT add it) so the frequency guard records/refreshes the timestamp. Keep the core change tiny/additive.
- **No `canArm()` hook** (dropped — see ROADMAP Amendments; EN targeting is by-hand).
- **Contracts (wave-1, per ROADMAP):** add **`bundle-size`** (gzip-gated; budget in
  `.agentic/contracts/budgets.json`, baseline from current `dist/`) and **`no-runtime-deps`** to
  `registry.json`, both green.
- **Ownership carve-out** `src/triggers/** → .agentic/specs/wave-1/stream-a.md` added to
  `ownership.json.rules{}` as the **first commit** of this PR (Decision D9), before any `src/triggers/`
  file lands.
- **Tests** under `src/triggers/**` (Vitest + jsdom; fake timers; mocked `localStorage`; controlled
  `Date`): each trigger arms/fires under its condition and not before; composition (first-to-fire opens
  once, others disarm); the frequency gate (within window suppressed, past window/no-record shown,
  default 7, `frequencyDays` honored, storage-throw → fail open); deferral (no listeners/timers before
  arm; removed on fire/disarm).

## Out of scope
- EN page-type/page-ID detection, `canArm`, `ENPageContext` — **not needed** (editor places config by
  hand); wave-3 EN is CTA semantics + non-interference + docs only.
- Theming / layout — **wave-2**.
- Analytics/lifecycle hooks, A/B, video-progress trigger — **deferred** ([`BACKLOG.md`](../../BACKLOG.md)).

## Deliverables
- `src/triggers/` — dispatcher, the four triggers, the frequency-capped dismissal guard, the config
  typer (augmenting the seam).
- `src/index.ts` — frequency gate + trigger arming from the global config; `ENLightboxAPI` controls.
- `src/core/lightbox.ts` — minimal additive `enlb:dismiss` signal.
- `.agentic/contracts/registry.json` (+ `budgets.json`) — `bundle-size` + `no-runtime-deps` contracts.
- `.agentic/ownership.json` — the `src/triggers/**` carve-out.
- Vitest suite under `src/triggers/**`; refreshed `dist/en-lightbox.js`.
- This brief trued-up at the end.

## Acceptance criteria
- [x] Each trigger fires under its condition and NOT before; exit-intent desktop-only (touch no-op,
      documented).
- [x] Composition: the first to fire opens the lightbox exactly once; the rest are disarmed.
- [x] Frequency: within the window → not shown; past the window / no record → shown; default 7 days;
      `frequencyDays` honored (incl. `0` = every load); storage unavailable → fail open, never throws;
      corrupt localStorage value → fail open. **Negative test:** re-arming within the window does not re-open.
- [x] Deferral: no listeners/timers added at import or before arm; removed on fire/disarm. Sync fire
      (scroll-depth on an already-scrolled page) does not leak later triggers' listeners/timers.
- [x] `bundle-size` (gzip-gated, 3085B / 3100B budget) + `no-runtime-deps` contracts added and **green**;
      bundle stays ONE minified, dependency-free JS file with SCSS inlined; wave-0's tests still pass
      (65 total); all four SDD gates green; typecheck + lint clean.
- [x] Mutation-verify: broke `src/triggers/dismissal.ts:13` (`>=`→`<`), named test
      `isEligible returns false when a fresh record is inside frequencyDays`
      (`src/triggers/dismissal.test.ts:26`) went red; 7 tests failed; reverted to green.
- [x] Ownership rule `src/triggers/** → wave-1/stream-a.md` is the first commit.

## First action
Write the failing test `src/triggers/dispatcher.test.ts`: (a) arming a time-on-page trigger opens
`ENLightboxAPI.getInstance()` after the configured delay (fake timers) and **not** before; (b) with a
fresh `enlb:shown` localStorage record inside `frequencyDays`, arming does **not** open. Red first,
then green.

## Gotchas
- **Open the singleton via the API — never `new Lightbox()`.** Auto-init already created it and does
  NOT open (wave-0 flag #2).
- **Frequency:** localStorage + per-`pathname` key; default 7 days; `frequencyDays` configurable;
  stamp-on-show (refresh on dismiss); `Date.now()` is fine at runtime; **fail open** if storage throws
  OR if the stored value is corrupt/non-numeric (Number.isFinite guard); never throw on the host page.
  localStorage is functional storage (low consent risk) — document it.
- **Config typing:** augment `TriggersConfigBase` from `src/triggers/` via `declare module '../config'`
  (the proven B1 seam); don't widen the base-interface body in `config.ts`. If a brand-new top-level
  field is unavoidable, that edit lands in `config.ts` (carry `[no-spec: additive config field for
  wave-1]`) — prefer augmenting the base interface.
- **spec-coupling:** `src/triggers/**` is owned by THIS spec (rule added as the first commit). The
  `src/core/lightbox.ts` change (the `enlb:dismiss` signal) is owned by `wave-0/stream-a.md` → carry
  `[no-spec: additive dismiss signal for wave-1]` (the surviving cross-spec waiver). `src/index.ts` is
  exempt. **Waiver audit:** the original commit also carried `[no-spec: additive config field for
  wave-1]` for a `config.ts` edit that was superseded when main's backfill (which already had
  `TriggersConfigBase`) was merged — that waiver is now moot; the only cross-spec change that survived
  the merge is the `enlb:dismiss` signal in `src/core/lightbox.ts`.
- **Defer everything:** add document listeners/timers only on `armTriggers`; remove on fire/disarm so a
  fired/ineligible lightbox leaves no live listeners (non-intrusive NFR). **Sync-fire leak:** when a
  trigger fires synchronously at arm time (scroll-depth on an already-scrolled page), `fire()` runs
  `disarmAll()` mid-iteration — bail with `if (fired) break` so later triggers are never armed.
- **exit-intent is desktop-only** (`mouseout` toward the top); document the touch fallback rather than
  faking it.
- **Contracts:** `registry.json`/`budgets.json` changes are reviewed as CI config (owner reviews
  gate-arming files, Q11). Keep `bundle-size` gzip-gated with a committed budget.
- **jsdom limits:** mock `localStorage` + use fake timers/controlled `Date`; assert behavior/DOM/events,
  not layout. Real cross-browser exit-intent/scroll QA is the committed cross-browser mini-stream.

## wave-4 hardening amendments

- `src/triggers/config.ts` — `normalizeTriggers` guards `triggers.list` with `Array.isArray` so a
  non-iterable `list` (e.g. `{ list: 123 }`) degrades to no list-triggers instead of throwing —
  `triggers.push(...src.list)` on a non-iterable was the one `init()` path that actually threw
  pre-hardening. Valid configs are unaffected. Tracked by the wave-4/stream-a dispatch (the wave-4
  spec directory is authored in stream-b).

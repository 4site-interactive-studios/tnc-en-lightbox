# stream-a — Behavior triggers, session dismissal & composition

**Wave:** 1 · **Branch:** `feat/wave-1-triggers` · **Depends on:** wave-0/stream-a ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-1 README](./README.md), this brief, and the [wave-0 stream-a brief](../wave-0/stream-a.md) (the `ENLightboxAPI` surface + cross-stream flags).

## Goal
Make the lightbox fire itself. Build a trigger engine that opens the auto-instantiated lightbox when
any configured behavior trigger fires — time-on-page, scroll-depth, inactivity, exit-intent —
composes multiple triggers (first-to-fire wins, the rest disarm), and enforces session discipline:
once the user dismisses it, no trigger re-opens it in that page/session. All work is deferred until a
trigger is armed; nothing runs at import beyond registration. This lands the behavior layer every
campaign needs on top of wave-0's open/close lifecycle.

## In scope
- **Trigger module — `src/triggers/`:**
  - A **dispatcher** (`src/triggers/dispatcher.ts`) that arms a set of configured triggers and, on
    the first to fire, calls `ENLightboxAPI.getInstance()?.open()` exactly once, then disarms the rest.
  - **Four trigger types** (e.g. `time.ts`, `scroll.ts`, `inactivity.ts`, `exitIntent.ts`):
    - **time-on-page** — fire after N ms.
    - **scroll-depth** — fire once the document is scrolled ≥ X%.
    - **inactivity** — fire after N ms with no user input; mousemove/keydown/scroll/touch reset the timer.
    - **exit-intent** — desktop: pointer leaves the viewport toward the top (`mouseout`, no
      relatedTarget / negative `clientY`). Touch: documented no-op (rely on the other triggers).
  - **Manual multi-trigger composition** — accept an array of trigger configs; arm all; first-to-fire
    opens and disarms the others.
  - **Session dismissal (once-per-session, per-page)** — when the lightbox is dismissed via any close
    path, record it in `sessionStorage` under a key scoped to `location.pathname`. Guard both at
    arm-time (don't arm if already dismissed) and fire-time (don't open if dismissed).
  - **Trigger config typing + normalization** owned inside `src/triggers/` (e.g. `config.ts`): read
    the raw triggers config as `unknown`, validate + normalize with sane defaults there. Export a
    `TriggersConfig` type for documentation.
- **Wiring — `src/index.ts`** (exempt from spec-coupling): after auto-init instantiates the Lightbox
  from `window.ENLightbox`, arm triggers from `window.ENLightbox.triggers`. Expose manual control on
  the public API: `ENLightboxAPI.armTriggers(config)` and a disarm/teardown.
- **Dismissal signal from the core** — the core must announce a dismissal so the session guard can
  record it. Prefer a minimal, additive hook: have `Lightbox.close()` dispatch an `enlb:dismiss`
  CustomEvent (e.g. on `document`) that the triggers module listens for. Keep the core change tiny and
  additive; wave-0's 20 tests must stay green.
- **Tests — `src/triggers/**`** (Vitest + jsdom, fake timers): each trigger arms/fires under its
  condition and not before; composition (first-to-fire + others disarm, single open); session
  dismissal suppresses re-trigger; deferral (no listeners/timers before arm; removed on fire/disarm).
- **Bundle** — triggers compile into the SAME single `dist/en-lightbox.js`; rebuild and let the
  `bundle` contract enforce freshness. No new output files, no runtime deps.

## Out of scope
- Theming / visual customization — **wave-2**.
- EN page-type / page-ID detection, CTA redirect-vs-close — **wave-3**.
- Cross-session / cross-page dismissal suppression (cookie/localStorage for N days) — **deferred**
  (see [`BACKLOG.md`](../../BACKLOG.md)).
- Public analytics / lifecycle event hooks (`onShow`/`onDismiss`/`dataLayer`) — **deferred**
  (BACKLOG.md). An internal dismissal signal is fine; a public analytics API is not.
- Video-progress trigger — **deferred** (BACKLOG.md).

## Deliverables
- `src/triggers/` — dispatcher, the four triggers, the session guard, the config typer/normalizer.
- `src/index.ts` — arms triggers from the global config; `ENLightboxAPI` trigger controls.
- `src/core/lightbox.ts` — minimal additive dismissal signal (if needed).
- Vitest suite under `src/triggers/**`.
- Refreshed `dist/en-lightbox.js` — one minified file, styles inlined, zero runtime deps.
- This brief trued-up (acceptance criteria checked) at the end.

## Acceptance criteria
- [ ] Each trigger fires under its condition and NOT before: time-on-page (fake timers), scroll-depth
      (stubbed scroll metrics), inactivity (timer resets on input), exit-intent (synthetic
      pointer-out-top; documented touch behavior).
- [ ] Composition: arming multiple triggers opens the lightbox exactly once on the first to fire; the
      others are disarmed (no double-open) — asserted by a test.
- [ ] Session dismissal: after a dismiss (ESC / X / overlay), no armed trigger re-opens the lightbox
      in the same page/session. **Negative test:** re-arming in the same session does not re-open.
- [ ] Deferral / non-intrusive: no trigger work at import; listeners/timers added only on arm and
      removed on fire/disarm (assert no live listeners remain after fire).
- [ ] `npm run build` still emits ONE minified, dependency-free JS file with SCSS inlined; the
      `bundle` contract passes (dist matches src). Wave-0's 20 tests still pass.
- [ ] All SDD gates green in CI; `npm test`, `npm run typecheck`, `npm run lint` clean.
- [ ] Mutation-verify: break one load-bearing line (e.g. the session-dismissal guard or a trigger's
      fire condition), show the NAMED test go red (cite file:line, before→after), then revert.

## First action
Write the failing test `src/triggers/dispatcher.test.ts` asserting that arming a time-on-page trigger
opens `ENLightboxAPI.getInstance()` after the configured delay (Vitest fake timers) and does NOT open
before it. Red first, then green.

## Gotchas
- **Open the singleton via the API — never `new Lightbox()`.** Auto-init already created the instance
  (`ENLightboxAPI.getInstance()`), and it instantiates but does NOT open (wave-0 flag #2). Triggers
  open THAT instance.
- **One artifact, zero deps still hold.** Everything compiles into `dist/en-lightbox.js`; no new
  files, no runtime deps. Use the staged bundle check: `npm run build && git add -AN && git diff --exit-code dist/`.
- **Session key is per-page.** Scope the `sessionStorage` key to `location.pathname` — dismissal on
  one page must not suppress another (cross-page suppression is deferred, BACKLOG.md).
- **Defer everything.** Don't add document listeners/timers until `armTriggers` runs; remove them on
  fire/disarm so a fired or dismissed lightbox leaves no live listeners (non-intrusive NFR).
- **exit-intent is desktop-only.** Use `mouseout` toward the top of the viewport; there's no reliable
  touch equivalent — document the fallback rather than faking it.
- **spec-coupling.** `src/triggers/**` is owned by THIS brief. Keep trigger config typing in
  `src/triggers/` and leave `src/config.ts` (`triggers?: unknown`) untouched to avoid coupling
  friction; wire from `src/index.ts` (exempt). If you must touch `src/core/` for the dismissal hook,
  keep it minimal/additive and carry `[no-spec: minimal dismissal hook for wave-1, tracked by wave-1/stream-a.md]`
  (the core's owning spec is wave-0/stream-a.md).
- **jsdom limits.** No real layout/scroll/pointer — assert via dispatched events, fake timers, and
  stubbed scroll metrics (set `documentElement.scrollTop`/`scrollHeight` or inject a helper). Leave
  real cross-browser exit-intent/scroll QA to manual testing.

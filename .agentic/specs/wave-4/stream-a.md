# stream-a — Production hardening (error isolation, config tolerance, ordering, idempotency)

**Wave:** 4 · **Branch:** `feat/wave-4-hardening` · **Depends on:** wave-3 ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-4 README](./README.md), this brief.

## Goal

Make the "never break the host page" guarantee that EDITOR.md already promises **true in code**. Today the auto-init IIFE calls `init(cfg)` synchronously with no error boundary, `open()` is unguarded, and `normalizeConfig` does no runtime type validation — so a wrong-typed, hand-authored config on a live EN page can throw and disrupt the host (including the donation form). This stream wraps those paths, makes config handling fault-tolerant, makes auto-init ordering-robust, and guards against double injection — all **behavior-preserving on valid config**, with no public API or contract change.

## In scope

- `src/index.ts`:
  - Wrap the auto-init IIFE body so any throw from `init(cfg)` / `armTriggers()` is caught and swallowed (with a single `console.warn` for debuggability). The script must never throw at evaluation time.
  - Add a load-once sentinel (e.g. `globalThis.__ENLightboxLoaded`) so a second evaluation of the script is a no-op — it must NOT re-`init()`, destroy the existing instance, or re-arm triggers.
  - Ordering robustness: if `document.readyState === 'loading'` and no config is present yet, defer the auto-init read to `DOMContentLoaded` and re-read `globalThis.ENLightbox` then (single deferral, no polling). The existing inline-config-then-`async`-script pattern must keep working; a reasonably-reordered config must not silently no-op.
  - Preserve the existing guard that ignores the API object as config (`!('Lightbox' in cfg) && !('getInstance' in cfg)`).
- `src/core/lightbox.ts`:
  - Guard the public `open()` (and the DOM-construction path it drives) so a render-time throw fails **closed** (the lightbox does not open) rather than propagating into a host EN event handler. Additive `try/catch` only; no change to valid-config behavior.
- `src/config.ts` (`normalizeConfig`):
  - Defensive runtime tolerance: wrong-typed top-level fields degrade to defaults instead of throwing — at minimum non-object `theme` / `theme.colors`, `image` that is not an object or lacks a string `src`, non-object `cta` / `secondaryCta`, and non-object `triggers`. Omitted fields already default; this extends "never throw" to malformed fields.
- `EDITOR.md`:
  - State explicitly that `window.ENLightbox` must be set before (or on the same page as) the script, and document the ordering behavior now that auto-init defers when the DOM is still loading.
- Tests (TDD, red→green):
  - `src/index.robustness.test.ts` (new): malformed/wrong-typed config does not throw and degrades; a forced throw inside init is swallowed (spy on `console.warn`); a second script evaluation is a no-op (sentinel); deferred init fires on `DOMContentLoaded` when `readyState==='loading'`.
  - `src/config.test.ts`: add wrong-typed-field cases asserting defaults, no throw.
  - a core test (`src/core/lightbox.*.test.ts`): assert `open()` fails closed on a forced render throw.
  - `e2e/smoke.spec.ts`: a real-browser case that a malformed config does not throw a page error and the host form stays interactive.
- Rebuild `dist/en-lightbox.js`.

## Out of scope

- Release/packaging, LICENSE, versioning, hosting, CI wiring, `release-please`, ROADMAP dismissal reconciliation — all wave-4/stream-b.
- `theme.customCss` injection — remains a type-only, security-gated placeholder (Risk R2); do NOT implement or apply it.
- CSP `style` nonce support — logged to BACKLOG (revisit: a target EN page enforces a strict `style-src` without `'unsafe-inline'`); not in this stream.
- New config fields or features beyond defensive handling; no new public API, events, or `ENLightboxAPI` methods.
- `src/triggers/**` and `src/themes/**` — do not widen; touch only if a defensive default strictly requires it (prefer not).

## Deliverables

- Modified `src/index.ts`, `src/core/lightbox.ts`, `src/config.ts`, `EDITOR.md`.
- New `src/index.robustness.test.ts`; additions to `src/config.test.ts`, a core test, and `e2e/smoke.spec.ts`.
- Rebuilt `dist/en-lightbox.js` (within the gzip budget).
- New `.agentic/specs/wave-4/README.md`, this brief, and `stream-b.md` (scaffolded by the coordinator).
- If the `config-schema`/`api-surface` snapshots change (they should NOT — no new fields/methods), regenerate them; otherwise they stay byte-identical.

## Acceptance criteria

- [ ] `npm test` green; new robustness tests pass.
- [ ] Negative test: a config with wrong-typed fields (e.g. `theme.colors: null`, `image: "url"`) does NOT throw and renders with defaults.
- [ ] Negative test: a forced throw inside `init`/`open` is caught — the host page sees no uncaught exception (asserted via `console.warn` spy and/or no thrown error).
- [ ] Idempotency: evaluating the bundle twice does not create a second instance or double-arm triggers (assert single instance / single arm).
- [ ] `npm run typecheck` and `npm run lint` clean.
- [ ] `npm run build` produces a fresh `dist/en-lightbox.js` that stays within the `bundle-size` gzip budget (headroom is ~400 B — keep the additions lean).
- [ ] `npm run e2e` green, including the new malformed-config real-browser case.
- [ ] `api-surface` and `config-schema` contracts green (unchanged — this stream adds no public surface).
- [ ] Mutation-verify: remove the auto-init `try/catch` and show the named "never throws on malformed config" test red; remove the sentinel and show the double-init test red; revert.

## First action

Write the failing test `src/index.robustness.test.ts` asserting that evaluating auto-init with a wrong-typed config (e.g. `window.ENLightbox = { theme: { colors: null } }`) does NOT throw and produces a default-themed instance. Red first, then green by adding the guard.

## Guardrails

- **Behavior-preserving on valid config.** Every existing test (cta, en-interference, a11y, dispatcher, themes) must stay green unchanged. Error isolation is additive.
- **Never silently swallow without a trace.** Caught errors emit exactly one `console.warn` (debuggable) — but never re-throw.
- **Watch the byte budget.** The bundle has ~400 B gzip headroom; `try/catch` + validation must not bust the `bundle-size` contract. Keep validation lean (guard clauses, not a schema library).
- **No new public surface.** No new config fields, no new `ENLightboxAPI` methods, no new events. `api-surface`/`config-schema` snapshots stay byte-identical.
- **`globalThis` safety.** Preserve the existing no-`window` tolerance; the sentinel and deferral must not assume a browser at module-eval time.
- **Single deferral, not a loop.** Auto-init may defer once to `DOMContentLoaded`; do not add a polling/retry loop or a `MutationObserver`.

## Gotchas

- **The auto-init guard distinguishes config from the API object** via `!('Lightbox' in cfg) && !('getInstance' in cfg)`. Preserve it, or the sentinel/deferral could re-process the API global as config.
- **Double-arm risk.** The sentinel must guard BOTH `init()` and `armTriggers()`; guarding only init still lets a re-eval re-arm triggers.
- **jsdom can't see real throws across script boundaries.** The "host stays interactive after a malformed config" proof needs the Playwright e2e case; jsdom assertions are necessary but not sufficient (same lesson as wave-3's `inert`).
- **`normalizeConfig` is shared by auto-init AND `ENLightboxAPI.init()`/`normalizeConfig()`** — tolerance changes apply to the programmatic path too; assert both.
- **Don't mask real bugs.** Tests must be able to detect that the catch fired (spy on `console.warn`), so a future regression that throws inside isn't hidden by the very guard that's supposed to be a last resort.
- **`open()` fail-closed, not fail-silent-forever.** A render throw should prevent that one open and warn; a later valid `open()` must still work (don't latch the instance into a broken state).

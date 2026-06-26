# stream-a — EN CTA semantics, no-form-interference & editor docs

**Wave:** 3 · **Branch:** `feat/wave-3-en` · **Depends on:** wave-2 ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-3 README](./README.md), this brief.

## Goal

Finalize the library's behavior on Engaging Networks pages by collapsing CTA routing to a single source of truth (`cta.action`), proving that the lightbox does not interfere with EN forms, and shipping the editor-facing advanced-customization README.

## In scope

- `src/config.ts` — add `action?: "redirect" | "close"` to `ENLightboxCta` and `ENLightboxSecondaryCta`.
- `src/config.ts` — remove the inert `ENIntegrationConfigBase`, `en?`, and `NormalizedConfig.en` placeholder.
- `src/core/lightbox.ts` — route CTA clicks by resolved action:
  - `redirect` (explicit or inferred from `href`) renders as a native `<a href>`.
  - `close` (explicit or inferred from absent `href`) renders as a `<button>` and calls `Lightbox.close()`.
  - `secondaryCta` and `dismissLabel` follow the same rules.
- `src/core/lightbox.en-interference.test.ts` — committed test that mounts the lightbox over an EN-shaped form and verifies:
  - submission/validation/focus work,
  - form is isolated (`inert`/`aria-hidden`/`tabindex`) while the lightbox is open,
  - all isolation attributes and scroll-lock are restored after close,
  - focus is restored,
  - both redirect and close CTA paths are covered.
- `src/config.test.ts` — remove the `en` default assertion.
- `.agentic/contracts/snapshots/config-schema.txt` — regenerate (the two `en` lines drop).
- `EDITOR.md` — editor-facing README with the full config schema, examples, dismissal behavior, and the `customCss` not-yet-available note.

## Out of scope

- EN page-type / page-ID detection, `ENPageContext`, `ENPageType`, include/exclude page IDs — dropped per wave-3 amendment.
- `cta.action: "submit"` — deferred to a later wave (D5b).
- `theme.customCss` injection — deferred to wave-2 security review / later wave.
- Release/packaging — wave-4.
- Creating a `src/en/` directory — no EN-specific code module is needed; the non-interference test lives under `src/core`.

## Deliverables

- Modified `src/config.ts`, `src/core/lightbox.ts`, `src/config.test.ts`.
- New `src/core/lightbox.en-interference.test.ts`.
- New `EDITOR.md`.
- New `.agentic/specs/wave-3/README.md` and this brief.
- Regenerated `config-schema` snapshot.
- Committed `dist/en-lightbox.js` (rebuilt from source).

## Acceptance criteria

- [ ] `npm test` green; new CTA routing tests and the EN non-interference test pass.
- [ ] `npm run typecheck` and `npm run lint` clean.
- [ ] `npm run build` produces a fresh `dist/en-lightbox.js`.
- [ ] `npm run e2e` green locally.
- [ ] The `config-schema` contract is green after regenerating the snapshot.
- [ ] The inert `en` placeholder is removed from `src/config.ts` and the config test.
- [ ] Mutation-verify: break one load-bearing line in the close-CTA routing and show the named test red.

## First action

Write the failing test `src/core/lightbox.cta.test.ts` asserting that a CTA with `action: "close"` closes the lightbox and records dismissal via the `enlb:dismiss` event. Red first, then green.

## Gotchas

- **Navigating CTAs must stay native anchors.** The redirect path must render as `<a href>` and never use `<button>` + `location.assign`. This preserves middle/⌘-click, copy-link, and link role for assistive tech (see `LEARNINGS.md`).
- **Single source of truth.** `cta.action` is the canonical router; do not add a separate `en.ctaBehavior` or similar config field.
- **Inert `en` placeholder.** Removing it from `src/config.ts` also requires updating `NormalizedConfig`, the normalizer, and the config-schema snapshot; otherwise the contract check fails.
- **Re-arming after close.** The lightbox dispatches `enlb:dismiss` on any close path; the API's `open()` path already consults the dismissal guard. The close-CTA test verifies the event is fired; the API test verifies the guard suppresses re-open.
- **EN form fixture.** The non-interference test should use a real `<form>` with required inputs and a submit handler, and assert the rendered isolation state (not just class names) so regressions in `inert`/`aria-hidden` restore are caught.

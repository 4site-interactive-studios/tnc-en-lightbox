# stream-c — Style isolation (Shadow DOM) + visual/layout polish

**Wave:** 4 · **Branch:** `feat/wave-4-isolation` · **Depends on:** wave-4/stream-a (merged, PR #28) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-4 README](./README.md), this brief, [`EDITOR.md`](../../../EDITOR.md).

## Goal

Make the lightbox **style-isolated** so its CSS can never conflict with the host Engaging Networks page, and fix the visual/layout defects seen on the first live render. Today styles are injected into `document.head` and the DOM is appended to `document.body` with **no Shadow DOM**, so the host page's CSS cascades straight in — on a live TNC page the `<h2>` title rendered in the host's serif and a stray focus border appeared on the dialog, and a portrait image drove the dialog height leaving a large empty area. Render the whole lightbox inside a **Shadow DOM** root with styles scoped inside (+ a `:host` reset), and rebalance the layout — behavior-preserving for the public API, config, events, and a11y semantics.

## In scope

- `src/core/lightbox.ts`:
  - Create a host element (e.g. `<div data-enlb-root>`), `attachShadow({ mode: 'open' })`, and build the overlay + dialog **inside the shadow root** instead of in `document.body`. Append the host element to `document.body`.
  - Move style injection from `document.head` into the shadow root (a `<style>` in the shadow, or `adoptedStyleSheets`). Add a `:host` reset of inheritable properties (`all: initial` on the root wrapper, or explicit `font`/`color`/`line-height`/`box-sizing`) so host inheritance can't bleed in.
  - Fix the focus trap to use the shadow root: `document.activeElement` returns the host element, so read `shadowRoot.activeElement` and query focusables within the shadow root. Outer focus save/restore via `document.activeElement` stays as-is.
  - Keep `aria-labelledby`/title-id resolution inside the shadow (ids are shadow-scoped; dialog + title share the root — verify the accessible name still resolves).
  - `setTheme`: apply the `.enlb-theme-*` class + token overrides to an element **inside** the shadow (the dialog or a shadow wrapper), not `document.body`.
- `src/styles/lightbox.scss`:
  - `:root` → `:host`; add the inheritable-property reset.
  - **Layout fix:** cap the dialog height (`max-height` + internal scroll), make `.enlb-image` cover a **bounded** box so the image no longer dictates dialog height (`min-height: 0` + `object-fit: cover` in a defined-height context), and balance the content so there is no large empty area. Make the default proportions look professional.
  - The dialog must look correct with **zero** host CSS (the shadow blocks it).
- Background isolation (`inert`/`aria-hidden` on `document.body` children) stays in the **light DOM** (it isolates the host page's own elements). The host element itself must NOT be inerted. Verify it still targets body siblings, not shadow contents.
- Tests:
  - `e2e/smoke.spec.ts` (or a new spec): a **hostile-host-stylesheet** case — inject `h2 { font-family: serif !important }`, `:focus { outline: 4px solid red }`, `* { box-sizing: content-box }` into the harness page and assert the lightbox's computed `font-family`/border/box-sizing are **unaffected** (proves isolation). Verify existing `.enlb-*` locators still resolve through the open shadow root; adjust piercing where needed.
  - A layout assertion: the dialog height is bounded and content fills it (no large empty region) with a portrait image.
  - Unit tests (jsdom supports `attachShadow`): the lightbox mounts into a shadow root; focus moves into the shadow on open; `setTheme` applies inside the shadow.
  - `tools/sdd/check_a11y.mjs` (axe): ensure the audit still reaches the lightbox now that it is in a shadow root (point axe at the shadow root/host). a11y MUST still pass on the shipped artifact — do not let coverage silently drop to zero.
- `EDITOR.md`: note that the lightbox renders in a Shadow DOM (fully style-isolated; host CSS does not affect it; theme only via the documented token surface). Remove any implication that host CSS can style it.
- `.agentic/contracts/budgets.json`: **re-baseline `maxGzipBytes`** if the isolation code pushes the bundle over 5000B (current headroom ≈ 92B, so this is likely). Set a new minimal ceiling with a `_doc` note. **GATE-ARMING — owner-reviewed (Decision D13).**
- Rebuild `dist/en-lightbox.js`.

## Out of scope

- `theme.customCss` injection — still a type-only, security-gated placeholder (Risk R2). Do NOT implement.
- Release/packaging, LICENSE, versioning, hosting — wave-4/stream-b.
- New config fields / public API / event changes — `api-surface` + `config-schema` snapshots must stay byte-identical. The ONLY sanctioned contract change is the `budgets.json` ceiling.
- Visual redesign / new theme presets — polish the EXISTING look to professional; do not invent a new design language.
- CSP `style`-nonce — still BACKLOG (note if Shadow DOM changes the CSP picture, but add no nonce hook).

## Deliverables

- Modified `src/core/lightbox.ts`, `src/styles/lightbox.scss`, `EDITOR.md`, and `.agentic/contracts/budgets.json` (if re-baselined).
- New/updated tests: e2e hostile-host-stylesheet + layout; unit shadow-mount/focus/setTheme; a11y harness update.
- Rebuilt `dist/en-lightbox.js`.
- This brief + the wave-4 README streams update (scaffolded by the coordinator).

## Acceptance criteria

- [ ] `npm test` green; `npm run typecheck` + `npm run lint` clean; `npm run build` no-drift.
- [ ] e2e proves isolation: with a hostile host stylesheet (`h2{}`, `:focus{}`, `*{box-sizing}`), the lightbox's computed styles are unaffected. Passes on all 4 browser projects.
- [ ] e2e proves the layout fix: dialog height bounded, no large empty area with a portrait image.
- [ ] Focus trap works across the shadow boundary (Tab/Shift+Tab cycle within the dialog; focus restored to the trigger on close) — real-browser e2e.
- [ ] `setTheme` re-themes the open lightbox (inside the shadow).
- [ ] a11y audit (`check_a11y.mjs`) still passes against the shadow-rendered artifact.
- [ ] Background `inert`/`aria-hidden` still isolates the host page; the host element is not inerted; all restored on close.
- [ ] `api-surface` + `config-schema` snapshots byte-identical (no public surface change).
- [ ] Bundle within budget — if `budgets.json` was re-baselined, the new ceiling is minimal, documented, and owner-approved.
- [ ] Mutation-verify: remove the `:host` reset (or the shadow attach) and show the named isolation test go red; revert.

## First action

Write the failing e2e test that injects a hostile host stylesheet (`h2 { font-family: serif }`, `:focus { border: 4px solid red }`) into the harness page and asserts the lightbox title's computed `font-family` is the lightbox's own sans-serif and the dialog has no host border. Red against the current head-DOM rendering, green after Shadow DOM.

## Guardrails

- **No public API / config / event change.** `api-surface` + `config-schema` snapshots stay byte-identical. The only sanctioned contract change is the `budgets.json` ceiling (gate-arming → owner review).
- **a11y must not regress.** The shadow boundary must not break the accessible name, `role=dialog`/`aria-modal`, focus trap, or the axe audit. If axe can't traverse the shadow in `check_a11y.mjs`, update that harness to audit the shadow content — never weaken the audit.
- **Background isolation stays in the light DOM.** `inert`/`aria-hidden` on `document.body` siblings isolates the HOST page; keep it there; don't inert the host element.
- **The dialog must look right with ZERO host CSS.** Assume the host has no helpful styles; every needed style lives inside the shadow.
- **Watch the budget.** Re-baseline `budgets.json` by the minimal amount; document the new ceiling. Don't let the bundle balloon.
- **Behavior-preserving:** open/close/3 close paths, triggers, dismissal, themes, secondary CTA — all existing tests stay green (adjusted only for shadow-piercing selectors where required).

## Gotchas

- **`document.activeElement` returns the shadow HOST, not the focused inner element.** The focus trap must read `shadowRoot.activeElement` and query focusables within the shadow root. Outer focus save/restore via `document.activeElement` is still correct.
- **Inheritable props + custom properties pierce the shadow boundary** from the host's `:root`/`body`. Shadow DOM blocks selector rules (`h2{}`, `:focus{}`) but NOT inheritance — so a `:host` reset of `font`/`color`/`line-height` (or `all: initial` on the root wrapper) is REQUIRED. This reset is the actual fix for the serif bleed.
- **Playwright pierces open shadow roots** for most locators; verify existing `.enlb-overlay`/`.enlb-dialog` locators still resolve, and pierce explicitly only where needed. `mode: 'open'` is required (for tests and axe).
- **axe + jsdom + shadow:** `check_a11y.mjs` runs axe on `document`; point it at the shadow root/host so it actually inspects the dialog. Confirm the audit still covers the lightbox; do not let it pass vacuously.
- **`position: fixed` inside a shadow root** is still viewport-relative (the backdrop still covers the page). Ensure the host element creates no containing block (`transform`/`filter`/`contain`) that would break `position: fixed`.
- **The layout void** comes from `.enlb-image { flex: 0 0 40% }` + `.enlb-img { height: 100% }` with a portrait image dictating row height. Fix via a bounded dialog height + bounded image box (`min-height: 0`, `object-fit: cover`), not by letting the image's intrinsic aspect drive height.
- **`enlb:dismiss` CustomEvent** is dispatched on `document` — it still composes/bubbles out of the shadow; verify the dismissal flow is intact.

# LEARNINGS.md — durable, human-curated institutional memory

This is the **sole** durable memory tier for tnc-en-lightbox: invariants that must never be violated,
gotchas that have bitten the project, and historical fixes worth remembering. It is written through
normal PR review — never machine-injected, never edited by an autonomous agent.

How to use it:

- A lesson starts life in a PR's "What was hard / non-obvious" section. Promoting it here is a
  reviewed change like any other.
- Keep entries specific and load-bearing: cite file:line where placement matters; state the
  invariant *and* why violating it breaks something.
- Reviewers check that every relevant invariant here is preserved by the PR under review.

A freshness check (`tools/sdd/check_learnings_freshness.py`) warns in CI when this file has gone
dormant while source is actively changing. The warning is advisory — it never blocks a PR — but it
surfaces the silent rot of uncaptured lessons.

## Invariants (NEVER violate)

- **Navigating CTAs are native anchors, never `<button>` + `location.assign`.** A redirect/navigating
  CTA renders as `<a href>` (`src/core/lightbox.ts` `buildCtaRow`); `<button>` is reserved for
  non-navigating actions (close / submit / decline). A `<button>` + `location.assign` redirect loses
  native open-in-new-tab (middle/⌘-click), copy-link, and the link role for assistive tech.
  (wave-2/stream-a, PR #17.)

- **The lightbox renders inside an open Shadow DOM for style isolation — preserve the boundary's rules.**
  Background `inert`/`aria-hidden` stays in the LIGHT DOM (on `document.body` siblings); NEVER inert the
  shadow host element (`[data-enlb-root]`) — that would disable the lightbox itself. The focus trap reads
  `shadowRoot.activeElement`, NOT `document.activeElement` (which returns the host element). `aria-labelledby`
  and the `aria-label='Dialog'` fallback are mutually exclusive — a labelledby pointing at an empty title
  yields NO accessible name. (wave-4/stream-c, PR #32.)
- **`:host { all: initial }` does NOT reset CSS custom properties.** Inheritable props are reset, but
  `--enlb-*` tokens inherit through the shadow boundary from the host `:root`, so every token the styles
  consume MUST have a `:host` default — otherwise a host page's `:root { --enlb-* }` bleeds in. (wave-4/stream-c, PR #32.)
- **The asset must never throw on the host page.** Auto-init and `open()` are wrapped (try/catch → one
  `console.warn`, never re-throw); `normalizeConfig`/`normalizeTriggers` degrade wrong-typed or unknown
  input to defaults rather than throwing (e.g. unknown `triggers.list` types are dropped before reaching
  the default-less `createTrigger`). EDITOR.md promises this — keep it true. (wave-4/stream-a, PR #28.)

## Gotchas (have bitten us)

- **Don't double-reverse a flex layout, and test the RENDERED effect — not DOM order or class presence.**
  Flip image/content with EITHER DOM order OR `flex-direction: row-reverse`, never both: a `row-reverse`
  on a DOM-swapped layout cancels out, so `imagePosition:'right'` rendered identically to `'left'`. It
  slipped through two fix attempts because the tests asserted class strings / DOM order — which stayed
  "correct" while the visual was wrong. Assert the real rendered position (e.g. bounding-box `x` in a
  real browser via `e2e/smoke.spec.ts`). (wave-2/stream-a, PR #17.)

- **An `overflow:auto` container clips an absolutely-positioned "outside" close button.** The dialog uses
  `overflow:visible` + an inner `.enlb-scroll` (`overflow:auto`) for bounded-height scrolling, so the
  outside × (positioned above the dialog at a negative `top`) isn't clipped; `.enlb-scroll` carries the
  `border-radius` so flush images still get rounded corners. Test it in a real browser (jsdom computes no
  clipping). (wave-4/stream-c + polish, PRs #32/#37.)
- **The browser's native focus ring renders on the programmatically-focused dialog container.** On open the
  dialog (`tabindex=-1`) is `.focus()`'d, so the browser draws its default outline around the whole modal
  (looks like a stray border, in the user's OS focus-ring colour). Suppress it
  (`.enlb-dialog:focus { outline: none }` — the container is never keyboard-navigated) and give the
  interactive elements explicit `:focus-visible` rings with a ≥3:1-contrast token (NOT `--enlb-border`
  #e0e0e0, which fails WCAG 1.4.11 — use `--enlb-cta-bg`). (wave-4 polish, PR #37.)

## Historical fixes / non-obvious code

_None yet._

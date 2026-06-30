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
  consume MUST have a `:host` default — otherwise a host page's `:root { --enlb-* }` bleeds in. Later
  wave additions go in the same `:host` block (`src/styles/lightbox.scss:5-32`); wave-5 added
  `--enlb-eyebrow` (line 14), `--enlb-close-bg` (line 20), `--enlb-close-color` (line 21),
  `--enlb-focus-ring` (line 22). Adding a token the styles consume WITHOUT a `:host` default
  silently breaks for any host page that happens to set that custom property. (wave-4/stream-c, PR #32;
  wave-5 recurrence, PR #41.)
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
- **Focus rings must clear WCAG 1.4.11 (≥3:1) against BOTH the surface AND any element backing the
  focused control.** The close button sits on its own `--enlb-close-bg` box, so the ring has to clear
  contrast against TWO backgrounds at once (the dialog surface AND the close-box backing). Reusing
  `--enlb-cta-bg` as the ring colour breaks when it collides with either — proven in wave-5: `forest`
  has cta-bg `#fff` AND close-bg `#fff`, so a default ring is invisible on the white close box; only
  `#000000` clears both the green surface (~3.23:1) and the white box (21:1). `sky` has dark close-bg
  `#16181d` which equals the default ring at 1:1, so it overrides to `#2b6da6` (3.23:1 surface /
  3.25:1 box). Use the dedicated `--enlb-focus-ring` token (default `var(--enlb-cta-bg)`, preserving
  light/dark/brand; `src/styles/lightbox.scss:22`, forest override line 78, sky override line 93) and
  apply it to EVERY `:focus-visible` rule on `.enlb-cta` / `.enlb-cta--secondary` / `.enlb-close`
  (`src/styles/lightbox.scss:305-309`). NEVER use `--enlb-border` `#e0e0e0` (fails the 1.4.11 floor).
  Separately suppress `.enlb-dialog:focus { outline: none }` (scss:301-303) so the programmatically
  focused container never paints the OS focus ring around the whole modal (the container is not
  keyboard-navigated). (wave-4 polish base, PR #37; dual-contrast rule and `--enlb-focus-ring`
  token, wave-5, PR #41.)

- **jsdom does NOT apply the shadow-root stylesheet to `getComputedStyle`.** Calling
  `getComputedStyle(el)` on an element inside the open Shadow DOM returns UA defaults (e.g.
  `width: "auto"`, `backgroundColor: "rgba(0, 0, 0, 0)"`), NOT the rules from the injected `<style>`
  block — so any assertion that reads computed style (size, backing colour, focus-ring colour, etc.)
  must be verified in a REAL browser via Playwright e2e, not in unit tests. Unit tests cover only
  what jsdom CAN see: rendered DOM presence/class, aria/labels, and the non-style aspects of the
  contract. Wave-5 added three e2e assertions in `e2e/smoke.spec.ts` — close button `boundingBox()` ≥
  44×44, non-transparent rounded `backgroundColor`/`borderRadius`, plus per-theme
  `getComputedStyle(dialog).backgroundColor` for `forest` (`rgb(13, 107, 78)`) and `sky`
  (`rgb(167, 204, 227)`) — because no jsdom unit test could prove the shadow stylesheet applied.
  Don't add a unit test for a styled effect; if jsdom can't read it, e2e is the only honest proof.
  (wave-5, PR #41.)

## Historical fixes / non-obvious code

_None yet._

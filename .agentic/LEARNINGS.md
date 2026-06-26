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

## Gotchas (have bitten us)

- **Don't double-reverse a flex layout, and test the RENDERED effect — not DOM order or class presence.**
  Flip image/content with EITHER DOM order OR `flex-direction: row-reverse`, never both: a `row-reverse`
  on a DOM-swapped layout cancels out, so `imagePosition:'right'` rendered identically to `'left'`. It
  slipped through two fix attempts because the tests asserted class strings / DOM order — which stayed
  "correct" while the visual was wrong. Assert the real rendered position (e.g. bounding-box `x` in a
  real browser via `e2e/smoke.spec.ts`). (wave-2/stream-a, PR #17.)

## Historical fixes / non-obvious code

_None yet._

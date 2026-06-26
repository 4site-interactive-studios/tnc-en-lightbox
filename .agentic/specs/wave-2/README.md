# wave-2 — Theming & layout

## Goal

Make the lightbox visually customizable per campaign, on top of wave-0's core and wave-1's behavior.
**stream-a** hardens and parameterizes the layout and establishes the `--enlb-*` design-token surface
(+ a11y/motion hardening, the CTA `<button>` change, and the secondary/decline CTA); **stream-b**
delivers the selectable theme set + full customization that consume that token contract. Landing
wave-2 makes the lightbox campaign-ready visually; wave-3 then wires EN CTA semantics.

## Dependencies

- **Depends on:** wave-0 (core, config seam, a11y slice) + wave-1 (triggers / frequency dismissal) +
  the committed cross-browser smoke net (real-browser regression safety for the responsive/visual work).
- **Unlocks:** per-campaign visual customization. wave-3 adds EN CTA routing + non-interference.

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — Layout, responsive contract, token surface & a11y/motion hardening | [stream-a](./stream-a.md) | merged (PR #17) |
| stream-b — Theme set + full UI customization | [stream-b](./stream-b.md) | merged (PR #21) |

## Exit criteria

- [x] `--enlb-*` token surface with documented defaults; `layout` config
      (variant/imagePosition/imageRatio/hideImageOnMobile/closeButton) honored; image-absent ⇒
      single-column. (`stackBreakpoint` + `centered`/`banner` deferred — BACKLOG.)
- [x] CTA renders as a native `<a>` for redirect and a `<button>` for close/decline; secondary/decline
      CTA with correct focus-trap order.
- [x] Motion gated by `prefers-reduced-motion`; `a11y-audit` (axe) green; `reduced-motion-guard` /
      `no-runtime-fetch` / `dist-single-file` contracts green; `bundle-size` re-baselined.
- [x] Multiple selectable themes (light/dark/brand) + per-token customization (stream-b); `customCss`
      deferred to a security review (Risk R2).
- [x] All SDD gates + the cross-browser smoke green; bundle stays one dependency-free file with SCSS
      inlined.

## Retrospective

- **What worked:** the pre-review verification caught real, CI-invisible issues in stream-a (3 inert
  layout fields; a *backwards* reduced-motion rule; the `imagePosition` double-reverse that survived two
  fix attempts because tests asserted DOM/class, not rendered effect) and confirmed stream-b clean
  (`customCss` secure, no preset drift). Verification-then-independent-review layering paid off.
- **What didn't:** stream-a was broad + HIGH-blast-radius and shipped a partly-inert contract → two
  coordinator fix cycles; the breadth hid the gaps. An inert `en` config placeholder also lingered from
  the pre-by-hand plan (being removed in wave-3).
- **What to change next wave:** for broad streams on hardened core, mandate **rendered-effect** tests
  (not class/DOM-order) up front, and reference the new LEARNINGS invariants (navigating-CTA-is-`<a>`;
  don't double-reverse) in any layout/visual brief.

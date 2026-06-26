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
| stream-b — Theme set + full UI customization | [stream-b](./stream-b.md) | in progress |

## Exit criteria

- [ ] `--enlb-*` token surface with documented defaults; `layout` config
      (variant/imagePosition/imageRatio/hideImageOnMobile/stackBreakpoint/closeButton) honored;
      image-absent ⇒ single-column.
- [ ] CTA renders as a `<button>` (redirect intact); secondary/decline CTA renders with correct
      focus-trap order.
- [ ] Motion gated by `prefers-reduced-motion`; `a11y-audit` (axe) green; `reduced-motion-guard` /
      `no-runtime-fetch` / `dist-single-file` contracts green; `bundle-size` re-baselined.
- [ ] Multiple selectable themes + per-token customization (stream-b); `customCss` only after a
      security review (Risk R2).
- [ ] All SDD gates + the cross-browser smoke green; bundle stays one dependency-free file with SCSS
      inlined.

## Retrospective (complete at wave exit)

- **What worked:** (1-2 bullets)
- **What didn't:** (1-2 bullets)
- **What to change next wave:** (1 bullet, actionable)

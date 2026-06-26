# wave-3 — Engaging Networks integration

## Goal

Make the lightbox a safe, EN-aware drop-in on the small surface that remains after the master-plan amendment dropped EN page detection: CTA semantics (`redirect`/`close`), provable non-interference with Engaging Networks form submission / focus / handlers, and the editor-facing advanced-customization README. This wave closes the highest-risk NFR (no EN form interference) and the editor-usability use-case for the completed config surface.

## Dependencies

- **Depends on:** wave-0 (core lightbox, build pipeline, contracts), wave-1 (triggers, dismissal), and wave-2 (theming, layout, a11y/motion hardening, secondary CTA element shape).
- **Unlocks:** a library that campaigns can safely drop onto EN pages without breaking forms, with documented editor config.

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — EN CTA semantics, no-form-interference & editor docs | [stream-a](./stream-a.md) | in progress |

## Exit criteria

- [ ] `cta.action` is the single routing source of truth: `redirect` renders as a native `<a href>`; `close` closes the lightbox and records dismissal; default is inferred from `href`.
- [ ] `secondaryCta` follows the same routing rules; `dismissLabel` remains a close button.
- [ ] A committed test mounts the lightbox over an EN-shaped form and proves submission/validation/focus proceed, the form is isolated while the lightbox is open, and `inert`/`aria-hidden`/`tabindex`/`overflow` are fully restored on close (both X-button and close-CTA paths), with focus restored.
- [ ] The inert `en` placeholder is removed from `src/config.ts` and `NormalizedConfig`; the `config-schema` snapshot is regenerated.
- [ ] An editor-facing README documents the config schema, examples, dismissal behavior, and current customization limits.
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and the e2e smoke suite are green locally.

## Retrospective (complete at wave exit)

- **What worked:**
- **What didn't:**
- **What to change:**

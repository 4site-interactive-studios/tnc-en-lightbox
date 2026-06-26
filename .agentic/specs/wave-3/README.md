# wave-3 — EN integration

## Goal

Make the lightbox a safe, EN-aware drop-in **without page detection** (the editor places
`window.ENLightbox` on the specific pages it wants). Finalize CTA action semantics (`cta.action`
redirect/close; submit deferred), **prove non-interference** with EN form submission/focus, ship the
**editor/advanced-customization README**, and **remove the inert `en` config placeholder**. This is the
last functional wave; after it the library is EN-complete and documented for editors.

## Dependencies

- **Depends on:** wave-0/1/2 (core, triggers + frequency dismissal, layout + themes — all on `main`).
- **Unlocks:** a documented, EN-safe drop-in. The optional wave-4 packages/releases it.

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — EN CTA semantics, no-form-interference & editor docs | [stream-a](./stream-a.md) | planned |

## Exit criteria

- [ ] `cta.action` is the single routing source of truth (`redirect`/`close`; inferred default;
      `secondaryCta` routes the same way); `submit` deferred (D5b).
- [ ] A committed test proves the lightbox does **not** interfere with EN form submission/validation/
      focus (open *and* closed; focus restored on close).
- [ ] The inert `en?`/`ENIntegrationConfigBase` placeholder is **removed** (a minimal `en?` is added
      back only if `respectFormFocus` is genuinely needed; default: none); **no** page detection.
- [ ] Editor/advanced-customization README lets a campaign editor configure + host the lightbox from it
      alone.
- [ ] Bundle stays one dependency-free file, SCSS inlined; all SDD gates + cross-browser smoke green;
      wave-0/1/2 tests still pass.

## Retrospective (complete at wave exit)

- **What worked:** (1-2 bullets)
- **What didn't:** (1-2 bullets)
- **What to change next wave:** (1 bullet, actionable)

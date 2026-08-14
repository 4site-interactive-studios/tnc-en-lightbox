# stream-c — EN reference-field writer

## Wave / branch / dependency

- **Wave:** 6
- **Stream:** c (`en-reference-field`)
- **Branch:** `feat/wave-6-stream-c`
- **Depends on:** stream-a lifecycle events (`enlb-lifecycle-events` v1)
- **Tracker:** GitHub stream issue #58, wave issue #55

## Goal

Record lightbox accept and decline outcomes in an Engaging Networks reference field without
interfering with the host form. The integration is opt-in through `en.referenceField` and remains
inert until Membership designates the deployed field.

## Scope

### In scope

- `src/en/config.ts`: defensive normalization and safe reference-field-name validation.
- `src/en/reference-field.ts`: document-only lifecycle readers, same-page hidden-input writes,
  session-scoped redirect carry-over, and `enlb:field-write` observability events.
- `src/index.ts`: thin guarded installation alongside the existing lifecycle readers.
- Unit, EN-interference, and Playwright coverage for accept/decline precedence, safe DOM writes,
  storage replay, no-op degradation, and form submission.
- Additive `en` config schema snapshot, editor/client documentation, and rebuilt distribution.

### Out of scope

- Changes to `src/core/lightbox.ts`, lifecycle event writers, analytics payloads, server behavior,
  or public API exports.
- A default EN field, cross-session persistence, custom form selectors, validation handlers, or
  submit interception.

## Produced contract: `en-reference-field-value` v1

- Primary `enlb:cta` writes the frozen value `lightbox_accepted`.
- `enlb:dismiss` reasons `close-button`, `esc`, `overlay`, `cta-secondary`, `cta-dismiss`, and
  `api` write the frozen value `lightbox_declined`.
- `cta-primary` writes nothing, because the preceding primary CTA owns the outcome.
- Each successful same-page write or replay dispatches `enlb:field-write` on `document` with exact
  detail `{ action: 'write' | 'replay', field, value }`.
- A single session-scoped pending record is last-write-wins. It is cleared only after a matching
  configured field is successfully written on a destination page.

## Safety and degradation

The configured field must match a bounded identifier allowlist (`[A-Za-z_][A-Za-z0-9_]*`) and must
not be a form-clobbering name such as `submit` or `action`. No untrusted field name is interpolated
into a selector or markup. The writer only finds an existing hidden input or creates a new hidden
input, always removes `required`, and never changes form validation or submit listeners. Every
document, DOM, and storage boundary is guarded so malformed config, unavailable storage, missing
forms, or host errors cannot escape the asset.

## Verification record

- `npm ci` before implementation.
- Targeted reference-field tests captured RED before implementation, then GREEN.
- Full unit, typecheck, lint, build, contract, bundle-size, targeted e2e, and full e2e runs are
  required before handoff.
- Mutation verification breaks one load-bearing write line, demonstrates the named unit test going
  red, restores the line, and reruns the test green.

# wave-6 — Analytics & EN reference-field tracking

## Wave/Branch/Depends-on

- **Wave:** 6
- **Branch:** `feat/wave-6-stream-a`
- **Depends-on:** wave-5

## Goal

Make lightbox engagement measurable through a reserved lifecycle-event seam, Tealium/Adobe analytics, EN reference-field values, and optional diagnostics without expanding the public API.

## In scope

- Stream-a lands the zero-consumer `enlb:` lifecycle-event seam and wave governance scaffold.
- Later sequential streams consume the seam for analytics, EN reference-field writing, and diagnostics.

## Out of scope

- Public callbacks, exports, or a new configuration block in stream-a.
- Consumers of the lifecycle events in stream-a.
- Changes to frozen `enlb:dismiss.detail.pathname`.

## Deliverables

- `enlb-lifecycle-events` v1, documented as an internal, integration-observable seam.
- Stream briefs and ownership mappings for the sequential wave.

## Acceptance criteria

- All lifecycle events are `document`-dispatched, `enlb:`-namespaced `CustomEvent`s with `bubbles: true`.
- Stream-a has zero consumers and preserves the API-surface snapshot.
- Wave streams remain strictly sequential: a → b → c → d.

## First action

Write the failing event tests for successful-mount open emission, CTA role/order, and role-qualified dismissal reasons.

## Gotchas

- Host-page listeners can observe `document` events by design; this does not make them public API or add exports.
- The asset must never throw on the host page, including from lifecycle event dispatch.
- `enlb:dismiss.detail.pathname` is frozen; future detail additions are additive only.

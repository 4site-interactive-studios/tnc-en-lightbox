# stream-a — Lifecycle event seam

## Wave/Branch/Depends-on

- **Wave:** 6
- **Branch:** `feat/wave-6-stream-a`
- **Depends-on:** wave-5

## Goal

Emit reserved lifecycle `CustomEvent`s from `Lightbox` so later wave-6 streams can observe engagement without directly coupling to core rendering logic.

## In scope

- Emit `enlb:open` exactly once after a successful mount and focus.
- Emit `enlb:cta` synchronously inside CTA handling before native routing with role `primary`, `secondary`, or `dismiss`.
- Add role-qualified `enlb:dismiss.detail.reason` while preserving frozen `detail.pathname`.
- Build role tags into CTA elements and land the wave-6 governance/docs scaffold.

## Out of scope

- Lifecycle-event consumers, analytics calls, EN field writes, diagnostics, exports, and config changes.
- Changes to `src/index.ts`, `src/config.ts`, or contract snapshots.

## Deliverables

- `src/core/lightbox.ts` lifecycle writer and unit/e2e coverage.
- `enlb-lifecycle-events` v1 documented in ROADMAP and EDITOR guidance.
- Rebuilt `dist/en-lightbox.js` and planned-reader ownership mappings.

## Acceptance criteria

- `enlb:open` is emitted once per successful mount and never from `abortOpen`.
- Redirect anchors retain native navigation while `enlb:cta` emits synchronously first.
- Dismissal reasons are `close-button`, `esc`, `overlay`, `cta-primary`, `cta-secondary`, `cta-dismiss`, or `api`; pathname is unchanged.
- API snapshot remains byte-identical; no lifecycle consumer lands here.

## First action

Add failing unit tests in `lightbox.events.test.ts`, `lightbox.cta.test.ts`, and `lightbox.close.test.ts` before editing `Lightbox`.

## Gotchas

- Dispatch on shared `document` is intentional: host-page listeners may observe the seam, but it is not a public API or export.
- Never let `CustomEvent` construction or dispatch break the host-page never-throw invariant.
- Redirect CTAs are native anchors; do not call `preventDefault` on them.

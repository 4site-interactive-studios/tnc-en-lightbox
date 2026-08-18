# wave-6 — Analytics & EN reference-field tracking

## Wave/Branch/Depends-on

- **Wave:** 6
- **Branch:** `feat/wave-6-stream-d`
- **Depends-on:** wave-5

## Goal

Make lightbox engagement measurable through a reserved lifecycle-event seam, Tealium/Adobe analytics,
EN reference-field values, and optional URL-query diagnostics without expanding the public API.

## In scope

- Stream-a lands the zero-consumer `enlb:` lifecycle-event seam and wave governance scaffold.
- Stream-b consumes the seam for the pure-builder-backed Tealium reader.
- Stream-c consumes the seam for opt-in EN reference-field writes and replay observability.
- Stream-d consumes all landed seams for URL-query-only console diagnostics and the wave-exit docs/
  budget review.

## Out of scope

- Public callbacks, exports, or a debug configuration block.
- Changes to the frozen lifecycle event shapes or `enlb:dismiss.detail.pathname`.
- Tealium queues/retries, EN submit interception, an in-page diagnostics panel, or new dependencies.

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — Lifecycle event seam | [stream-a](./stream-a.md) | approved |
| stream-b — Tealium analytics reader | [stream-b](./stream-b.md) | approved |
| stream-c — EN reference-field writer | [stream-c](./stream-c.md) | approved |
| stream-d — URL-query diagnostics reader | [stream-d](./stream-d.md) | reviewed & approved (rounds=1, repair R1) |

## Deliverables

- [x] **a** — `enlb-lifecycle-events` v1, documented as an internal, integration-observable seam.
- [x] **b** — `tealium-utag-event-payload` v1 and the guarded document-only analytics reader.
- [x] **c** — `en-reference-field-value` v1 with safe writes, replay, and `enlb:field-write` detail.
- [x] **d** — URL-query diagnostics, wave-tail documentation, and the conditional D13 budget review.

## Acceptance criteria

- [x] All lifecycle events are `document`-dispatched, `enlb:`-namespaced `CustomEvent`s with
      `bubbles: true`, and preserve the frozen pathname/detail ordering contracts.
- [x] Analytics and EN readers remain guarded, non-intrusive, and preserve the public API and
      config/schema snapshots.
- [x] `?debug=true` and `?debug=log` alone activate console diagnostics; all other/malformed query
      states remain silent, and hostile URL/console/document boundaries never throw.
- [x] Diagnostics log lifecycle details, builder-derived wire payloads (including the absent-utag
      QA line), and reference-field writes/replays without a panel or runtime dependency.
- [x] Wave streams remain strictly sequential: a → b → c → d; the wave README, learnings, docs audit,
      editor/client guidance, and conditional D13 budget decision are reviewed at exit.

## First action

Write the failing event tests for successful-mount open emission, CTA role/order, and role-qualified
dismissal reasons before adding any lifecycle consumer.

## Gotchas

- Host-page listeners can observe `enlb:` events by design; this does not make them public API or add
  exports.
- The asset must never throw on the host page, including from lifecycle dispatch, optional Tealium,
  EN form/storage boundaries, URL parsing, or console access.
- `enlb:dismiss.detail.pathname` is frozen; future detail additions are additive only.
- Diagnostics must import and call the same pure payload builder that feeds the wire; never copy its
  frozen strings or add a debug config block.

## Retrospective (wave exit — final)

- **What worked:** streams a–c were approved by independent reviewers without block rounds (a:
  coding-medium/reviewer-medium; b,c: coding-frontend/reviewer-frontend); the a-landed event seam let
  b/c/d attach via document listeners without touching core again; per-stream D13 budget raises
  (6000→6300→7000→7400) were measured + owner-reviewed at each merge gate instead of one blind raise;
  stream-d measured 7216B gzip (+362B) and retained 184B of headroom.
- **What didn't:** stream-d's independent review found documentation truthfulness, historical
  attribution, live approval-state, and malformed-event coverage gaps, so stream-d approval and wave
  exit remain pending after repair R1. PR #62 hit the spec-coupling gate — the sealed plan gave stream-a no [no-spec] waiver
  for the src/core edit although the gate's owning spec for src/** is wave-0's; the first remedy
  (PR-body edit + same-head rerun) failed because the gate reads the PR-CREATION event payload, so the
  waiver had to ride an empty commit; the sealed plan also predicted budget pressure only in stream-d,
  but stream-a consumed the entire 6000B ceiling, forcing mid-wave HITL re-planning of the budget-raise
  owner.
  Wave review also caught a documented-head carry-over replay-timing defect and public-boundary/debug
  coverage gaps, requiring remediation R1 before wave exit.
- **What to change:** sealed plans should pre-declare waiver tokens for every governed-path edit (as
  stream-c's did) and pre-authorize measured per-stream budget raises when the ceiling headroom is
  smaller than the wave's expected growth; put waiver tokens in commit messages from the start (git log
  is read fresh; event payloads are not).
- **Wave exit:** round-0 BLOCK (carry-over replay timing under the documented head embed + journey-coverage gaps) → remediation PR #67 → round-1 APPROVED.
- **Remediation R2:** real EN fixture markup exposed that dotted field paths and page-builder form detection had not been exercised; the writer now preserves visible same-name EN inputs while retaining the legacy fallback.

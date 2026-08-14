# stream-d — URL-query diagnostics reader

## Wave/Branch/Depends-on

- **Wave:** 6
- **Branch:** `feat/wave-6-stream-d`
- **Depends-on:** stream-a lifecycle events, stream-b Tealium payload builder, and stream-c
  `enlb:field-write` observability

## Goal

Provide an opt-in, console-only diagnostics reader for QA and campaign debugging without adding a
configuration block, public export, runtime dependency, or in-page panel.

## In scope

- Parse the current page query defensively; activate only for exactly `debug=true` or `debug=log`.
- Install document listeners once from the guarded, load-once `src/index.ts` bootstrap for
  `enlb:open`, `enlb:cta`, `enlb:dismiss`, and `enlb:field-write`.
- Preserve lifecycle detail in console output, including CTA role, dismiss reason, and frozen
  pathname, plus field write/replay detail.
- Import and call `buildTealiumPayload` from `src/analytics/payloads.ts` for exact payload logging;
  report `utag absent — would fire:` when no callable `utag.link` exists.
- Add unit and Playwright console-capture coverage, editor/client guidance, wave-tail records, and
  the conditional D13 bundle-budget decision.

## Out of scope

- Changes to `src/core/lightbox.ts`, `src/analytics/*`, `src/en/*`, lifecycle writers, payload
  constants, field writers, or contract snapshots.
- Any public API/export, debug config field, console table/panel, queue/replay, network request, or
  new dependency.
- Any output when the query is absent, malformed, `debug=false`, `debug=1`, or another value.

## Deliverables

- `src/debug/diagnostics.ts` with guarded URL parsing, document readers, builder-backed payload logs,
  and resilient console access.
- `src/debug/diagnostics.test.ts` and `e2e/debug.spec.ts` covering activation, output, degradation,
  utag-absent QA mode, and normal-flow silence.
- Thin `src/index.ts` wiring and rebuilt `dist/en-lightbox.js`.
- Updated `EDITOR.md`, `CLIENT_GUIDE.md`, `.agentic/specs/wave-6/README.md`, this brief,
  `.agentic/LEARNINGS.md`, and `DOCS_AUDIT.md`.

## Acceptance criteria

- [ ] `?debug=true` and `?debug=log` activate diagnostics; every other query state, including a
      malformed or hostile URL, produces zero console output.
- [ ] Console output includes lifecycle events/details, exact payload objects from the imported wire
      builder, and `enlb:field-write` write/replay entries; absent `utag` uses the concise QA line.
- [ ] Frozen, missing, or hostile console access and malformed host events never throw; diagnostics
      remain console-only.
- [ ] The API/config snapshots remain byte-identical, the bundle remains a single self-contained
      artifact, and the full unit/type/lint/build/size/e2e/contract checks are green.
- [ ] The wave-6 README retrospective, durable learning promotions, docs audit, and conditional D13
      budget review are complete.

## First action

Add named failing console-spy tests for the two accepted query values and every required silent query
case before writing the diagnostics module.

## Gotchas

- URL activation is query-only; do not infer debug mode from hash, referrer, config, or script URL.
- Diagnostics must reuse `buildTealiumPayload` rather than duplicate frozen event names or lightbox
  names, so the logged object cannot diverge from the wire payload.
- `enlb:cta` role is observed before routing by the landed seam; `enlb:dismiss.detail.pathname` is
  frozen and must be logged exactly as received.
- `utag` is optional; diagnostics never queues, retries, or sends anything and must treat a missing,
  malformed, or throwing host integration as a no-throw boundary.
- The default output is completely silent. Any visual/in-page debug panel remains deferred to BACKLOG.

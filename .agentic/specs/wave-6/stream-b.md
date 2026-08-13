# stream-b — Tealium analytics reader

## Wave / branch / dependency

- **Wave:** 6
- **Stream:** b (`tealium-analytics`)
- **Branch:** `feat/wave-6-stream-b`
- **Depends on:** stream-a lifecycle events (`enlb-lifecycle-events` v1)
- **Tracker:** GitHub stream issue #57, wave issue #55

## Goal

Consume the document lifecycle seam without coupling to lightbox rendering. Translate `enlb:open`
and the primary `enlb:cta` interaction into the frozen Tealium event payloads for Adobe/Tealium
integration, while remaining inert when the optional host integration is unavailable.

## Scope

### In scope

- `src/analytics/payloads.ts`: pure, module-exported payload builder using only frozen constants.
- `src/analytics/tealium.ts`: document-only lifecycle listeners and a guarded `utag.link` call-through.
- `src/index.ts`: thin, unconditional listener installation; no new public exports or config fields.
- Unit coverage for exact payloads, primary close-action semantics, negative dismissal paths, and all
  absent/wrong-shape/throwing `utag` cases.
- Playwright coverage for exact payloads, native primary navigation, negative close matrix, and the
  no-`utag` degraded journey.
- Editor documentation and this governing stream specification.
- Rebuilt `dist/en-lightbox.js`.

### Out of scope

- Any change to `src/core/lightbox.ts`, lifecycle event writers, or dismissal semantics.
- Any Tealium queue, replay, retry, network request, or configuration block.
- Any PII, dynamic payload values, EN field writes, diagnostics, or public API additions.
- Contract snapshot changes, dependency changes, or changes outside the sealed write whitelist.

## Consumed contract: `enlb-lifecycle-events` v1

Listeners consume `document` events only:

- `enlb:open`: emitted once after each successful mount.
- `enlb:cta`: emitted synchronously before CTA routing with `detail.role` equal to `primary`,
  `secondary`, or `dismiss`.
- `enlb:dismiss`: emitted on close paths with role-qualified `detail.reason` and frozen
  `detail.pathname`. This stream observes dismissals only to preserve the negative click matrix; it
  does not send a dismissal payload.

## Produced contract: `tealium-utag-event-payload` v1

Payload keys are additive-only and values are frozen constants:

| Source event / condition | Exact payload |
|---|---|
| `enlb:open` | `{ event_name: 'lightbox_impression', lightbox_name: 'inactivity-exit' }` |
| `enlb:cta` with `detail.role === 'primary'` | `{ event_name: 'lightbox_click', lightbox_name: 'inactivity-exit' }` |

The builder contains no URL, pathname, CTA label, or visitor data. A primary CTA is an accept even
when its action is `close`; the synchronous primary CTA event owns the click outcome. Secondary,
dismiss, close-button, Escape, overlay, and API paths produce zero click calls.

## Runtime behavior and safety

- Tracking is always-on (D3); no config block or opt-out is introduced.
- Listener installation happens unconditionally from `src/index.ts` and does not alter the frozen
  API export surface.
- The sender calls only when `typeof window.utag?.link === 'function'`.
- The sender wraps host-provided access and invocation in a guard. Absent, malformed, or throwing
  `utag` values are silent no-ops; no error propagates to the host page (D6).
- There is no queue or replay for a late-loading Tealium integration.

## Acceptance criteria

1. Exactly one impression payload is sent per successful display.
2. Exactly one click payload is sent for a primary CTA, including a close-action primary, and native
   browser navigation remains intact for redirect CTAs.
3. X/close-button, Escape, overlay, decline/`cta-dismiss`, secondary/`cta-secondary`, and API
   dismissal paths send zero click payloads.
4. Absent, wrong-shaped, or throwing `utag` values are silent no-ops; unit and degraded e2e tests
   prove the page never errors.
5. Always-on behavior has no config block; config-schema and API-surface snapshots remain
   byte-identical.
6. Analytics logic lives in named `src/analytics/*` modules and `src/index.ts` remains a thin
   call-through.

## Verification record

Required checks for this stream, run serially from the assigned worktree:

- `npm ci` before implementation.
- Targeted `npm test -- src/analytics/tealium.test.ts` red before implementation, then green.
- `npm test`, `npm run typecheck`, and `npm run lint`.
- `npm run build` before browser tests.
- `npm run contracts:generate && git add -AN && git diff --exit-code .agentic/contracts/snapshots/`.
- `node tools/sdd/check_size.mjs`.
- `npm run e2e -- e2e/analytics.spec.ts e2e/degraded.spec.ts` and the full `npm run e2e` suite.
- Final `git diff --name-only` and `git diff --check`; changed paths must remain within the sealed
  whitelist.

Mutation verification must break exactly one load-bearing analytics line, run the named targeted
test to red, then restore the line and rerun green. If the measured post-build gzip exceeds 6000B,
only the authorized D13 budget gate may be armed by a minimal `.agentic/contracts/budgets.json`
change recording the measured size, delta, old/new ceiling, headroom, and owner-review narrative.

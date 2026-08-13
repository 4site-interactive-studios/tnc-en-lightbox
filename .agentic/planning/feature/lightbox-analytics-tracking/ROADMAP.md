# ROADMAP — wave-6: Analytics & EN reference-field tracking

Feature: Adobe Analytics (via Tealium `utag.link`) impression + acceptance tracking for the
Inactivity & Exit Intent Lightbox, EN reference-field writes (`lightbox_accepted` /
`lightbox_declined`), and `?debug=true|log` console diagnostics. Promotes BACKLOG "Analytics /
lifecycle event hooks" (revisit trigger fired). Decisions: DECISIONS.md (D1–D8). Evidence:
RESEARCH.md.

> **Generation 2 (review remediation).** Reopened after the independent readiness review (BLOCKED,
> round 1) and corrected: R1 accept/decline write-ordering (D8 precedence rule + role-qualified
> dismiss reasons), R2 degraded-mode e2e ownership, R3 config-schema gate handling in stream-c,
> R4 docs ownership in stream-c, stream-d observation mechanism, carry-over deployment
> precondition. Scope unchanged; no new streams.

## Completeness checklist

- **Outcome / users** — Marketing measures lightbox impressions + CTA accepts in Adobe Analytics; Membership segments accept/decline in Engaging Networks; QA validates via `?debug=true|log`.
- **Interfaces + versioning** — 3 owned contracts, all v1 additive-only: `enlb-lifecycle-events`, `tealium-utag-event-payload`, `en-reference-field-value`. `api-surface` snapshot stays byte-identical; `config-schema` snapshot CHURNS ADDITIVELY in stream-c only (new optional `en` block — regenerated snapshot reviewed as part of that PR, with the `[no-spec: additive config field owned by wave-6 module]` waiver per specs/ROADMAP.md:224).
- **Authorization / privacy** — No PII anywhere: payloads and field values are constant strings by construction (D3); field name is integrator config validated before DOM insertion; no new data beyond interaction state.
- **Data / migrations** — N/A — no schema/migrations; persistence is EN-side via the page's existing form submission; carry-over is session-scoped `sessionStorage`, additive and self-clearing (D1).
- **Idempotency / recovery** — Impression fires once per mount (existing `open()` guard). **Accept owns the outcome:** a primary-CTA accept writes `lightbox_accepted`, and the `enlb:dismiss` that a close-action accept CTA subsequently emits (reason `cta-primary`) NEVER writes `lightbox_declined` (D8 — fixes the review's R1 ordering contradiction); otherwise last-write-wins across separate interactions. Carry-over replay is idempotent (write-if-form-present, then clear). utag absent/throwing ⇒ silent no-op, never throws (D6).
- **Observability** — `?debug=true`/`?debug=log` logs lifecycle events, exact wire payloads, field writes, and carry-over replays (D5; field-write signal reaches debug via `enlb:field-write`, D8); silent without the param; QA also validates via Tealium/Adobe debugger per stakeholder QA steps.
- **Rollout / rollback** — Ships inside `dist/en-lightbox.js` via release-please (semver minor); pages pin embeds by `?v=`, so rollback = re-point to the prior release; reference-field writer is inert until Membership configures the field (D2); Tealium-side mapping is owned by the Analytics team. **Deployment precondition:** the redirect carry-over half of D1 requires the destination EN page to also embed `dist/en-lightbox.js` (same-page writes are unaffected).
- **Tests incl. negative cases** — jsdom unit: payload exactness, once-per-open, ZERO events on every close path, accept-owns-outcome (close-action primary CTA leaves the field at `lightbox_accepted`), utag absent/wrong-shape/throwing, field find-or-create + never-`required`, debug silence for `false`/`1`/malformed. Playwright public-boundary, mapped 1:1 to epic journeys: `j_impression` + `j_accept`'s analytics half + `j_decline`'s zero-call assertion → `e2e/analytics.spec.ts` (stream-b); `j_accept` + `j_decline` field values + carry-over → `e2e/reference-field.spec.ts` (stream-c); `j_debug` → `e2e/debug.spec.ts` (stream-d); `j_degraded` → `e2e/degraded.spec.ts` (stream-b).

## Wave graph (acyclic; one wave, four sequential streams)

### wave-6 — Analytics & EN reference-field tracking
**Goal:** Make lightbox engagement measurable (Marketing: Adobe Analytics via Tealium; Membership:
EN reference field) with QA-debuggable diagnostics, honoring zero-runtime-deps, never-throw,
no-EN-interference NFRs. **Independently valuable:** each stream merges green on its own.
**Chain:** `stream-a → stream-b → stream-c → stream-d` (strict order; shared write set:
`dist/en-lightbox.js`, `src/index.ts`, docs; `concurrent_streams = 1`. b/c mutually independent —
order chosen to soak the seam before the N3-risk stream).

#### stream-a `event-seam` — lifecycle event seam (medium, not security-critical)
- **Scope:** dispatch `enlb:open` (once per successful mount, never from `abortOpen`), `enlb:cta`
  synchronous in `onCtaClick` before routing/navigation with additive `role:
  'primary'|'secondary'|'dismiss'`, and additive `enlb:dismiss` `detail.reason` — **role-qualified
  (D8):** `'close-button' | 'esc' | 'overlay' | 'cta-primary' | 'cta-secondary' | 'cta-dismiss' |
  'api'`. `detail.pathname` frozen (D15). Zero consumers. Implementation note: CTA elements need a
  build-time role tag (e.g. `data-enlb-role`) so `onCtaClick`/`close()` can qualify the reason;
  `dismissLabel` renders the `cta-dismiss` role.
- **Also carries (wave scaffold):** `.agentic/specs/wave-6/README.md` + `stream-a.md`,
  ROADMAP.md events-table + line-266 "not a public analytics hook" stance amendment, BACKLOG
  promotion, specs index row, `ownership.json` rules (`src/analytics/**`, `src/en/**`, `src/debug/**`
  → wave-6 stream specs), EDITOR.md events section, dist rebuild.
- **Acceptance:** full existing suite green unchanged; `api-surface` byte-identical; unit tests
  assert once-per-mount, dispatch-before-navigation ordering (no `preventDefault` on redirect),
  reason correctness per close path INCLUDING that a close-action primary CTA yields
  `cta-primary`, a close-action secondary yields `cta-secondary`, and the decline/dismissLabel
  button yields `cta-dismiss`; e2e listener smoke.
- **Produces:** contract `enlb-lifecycle-events` v1.

#### stream-b `tealium-analytics` — impression + accept tracking (medium, not security-critical)
- **Scope:** `src/analytics/tealium.ts` + pure payload builder; always-on (D3): `enlb:open` →
  `utag.link({event_name:'lightbox_impression', lightbox_name:'inactivity-exit'})`; primary
  `enlb:cta` → `utag.link({event_name:'lightbox_click', lightbox_name:'inactivity-exit'})`;
  guarded silent no-op when utag absent/wrong-shape/throwing (D6). Logic in named modules (D8
  precedent — `index.ts` thin, ownership-exempt).
- **Owns journey `j_degraded` / `e2e/degraded.spec.ts` (R2 fix):** e2e proves the page runs
  open/accept/close with NO `window.utag` present — zero page errors, zero thrown exceptions.
- **Acceptance:** unit — exact payload equality, once per display, ZERO calls on X/ESC/overlay/
  decline/secondary (explicit negative), no-throw matrix; e2e — utag recording stub on harness;
  accept click fires AND navigation still happens; `e2e/degraded.spec.ts` green;
  `config-schema`/`api-surface` byte-identical (no config added per D3).
- **Produces:** contract `tealium-utag-event-payload` v1.

#### stream-c `en-reference-field` — accept/decline into EN (medium, not security-critical)
- **Scope:** `src/en/reference-field.ts`; config `en: { referenceField?: string }` — inert when
  unconfigured (D2, Membership designates later). **Precedence (D8):** `enlb:cta` role `primary` ⇒
  write `lightbox_accepted`; `enlb:dismiss` with reason ∈ {`close-button`, `esc`, `overlay`,
  `cta-secondary`, `cta-dismiss`, `api`} ⇒ write `lightbox_declined`; `enlb:dismiss` reason
  `cta-primary` ⇒ **no write** (accept owns the outcome — a close-action primary CTA must leave the
  field at `lightbox_accepted`). BOTH mechanisms (D1): immediate find-or-create hidden input write
  on the current page's EN form + session-scoped carry-over replay on the next page
  (write-if-form-present, then clear). Never `required`, never touches validation/submit handlers
  (NFR N3; extends `lightbox.en-interference.test.ts`); field name validated before DOM insertion.
  **Observability emission (R6 fix):** after each write/replay the module dispatches
  `enlb:field-write` on `document`, detail `{action:'write'|'replay', field, value}` — additive
  diagnostics signal consumed by stream-d; declared on the `en-reference-field-value` contract.
- **Gates carried (R3 fix):** regenerated `config-schema` snapshot lands in this PR as a reviewed
  additive diff, and the `src/config.ts` edit carries `[no-spec: additive config field owned by
  wave-6 module]` per specs/ROADMAP.md:224; `ownership.json` rule for `src/en/**` (from stream-a)
  points here.
- **Docs carried (R4 fix):** `CLIENT_GUIDE.md:312-316` FAQ rewrite (EN reference-field recording is
  now supported, config-gated) + EDITOR.md `en.referenceField` section incl. Membership-designation
  note and the **deployment precondition** (carry-over replay requires the destination page to also
  embed `dist/en-lightbox.js`).
- **Acceptance:** unit — write/reuse/create, **accept-owns-outcome (close-action primary CTA leaves
  `lightbox_accepted`)**, last-write-wins across separate interactions, no-form/no-field no-op,
  `enlb:field-write` emitted per write/replay, en-interference suite extended; e2e
  (`e2e/reference-field.spec.ts`, journeys `j_accept`/`j_decline`) — harness `#en-form` value after
  accept and after each close path, second harness page proves carry-over replay, form still
  submits; `config-schema` diff present and additive-only.
- **Produces:** contract `en-reference-field-value` v1.

#### stream-d `debug-mode` — `?debug=true|log` diagnostics (low-medium, not security-critical)
- **Scope:** `src/debug/diagnostics.ts`; active on `debug=true` or `debug=log` (D5, ENgrid
  convention); logs lifecycle events (`enlb:open`, `enlb:cta`, `enlb:dismiss` with role-qualified
  reason), exact utag payloads (same pure builder — no drift), and EN field writes/replays **via
  the `enlb:field-write` event (R6 fix — no direct import into `src/en/**`)** through
  `console.info('[ENLightbox]', …)`; never throws. Console-only — in-page panel deferred to BACKLOG.
- **Also carries (wave tail):** wave-6 retro, LEARNINGS promotion candidates, DOCS_AUDIT re-true,
  conditional `budgets.json` gzip re-baseline (GATE-ARMING D13, owner-reviewed on this stream).
- **Acceptance:** unit — console spy sees exact payload objects + field-write entries under both
  param values; SILENCE for absent/`false`/`1`/malformed (load-bearing); e2e
  (`e2e/debug.spec.ts`, journey `j_debug`) — Playwright console capture incl. a run with utag
  absent.
- **Produces:** none (observes contracts; owns no writer path).

## Post-seal backlog notes (growth bound — NOT new streams)
- Hardcoded `lightbox_name: 'inactivity-exit'` (D3): a second campaign needing a different name, or
  a page needing tracking off, requires a code change → revisit: "second campaign needs analytics
  with a different `lightbox_name`, or a page needs an opt-out."
- In-page debug panel (deferred from D5) → revisit: "QA asks for on-screen diagnostics without
  devtools."
- Cross-session attribution for carry-over (D1 is session-scoped) → revisit: "Membership asks for
  cross-session lightbox attribution."
- Queue-and-replay for late-loading Tealium (D6 rejected) → revisit: "QA observes missed events
  from slow/blocked Tealium in the field."

## Tracker
`github-sync` (no `productive.json`) — repo `4site-interactive-studios/tnc-en-lightbox`, base
`main`, close keyword `Closes`. Wave issue #55; stream sub-issues #56 (stream-a), #57 (stream-b),
#58 (stream-c), #59 (stream-d).

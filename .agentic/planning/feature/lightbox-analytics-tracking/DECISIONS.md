# DECISIONS — Lightbox analytics tracking

Decisions D1–D7 accepted by the owner (Fernando Santos) in one batched block, 2026-08-12.
D8 added in generation 2 as review remediation (planning-reviewer round 1, BLOCKED → remediated);
it corrects an internal contradiction the reviewer proved against the sealed D1/D4 wording and is
the only coherent reading of the owner's approved acceptance criteria — no scope change.

## D1 — EN reference-field mechanism: BOTH same-page write AND redirect carry-over
- **Accepted:** (C) Both. (a) On accept/decline, find-or-create a `type="hidden"` input named per
  config inside the current page's EN form and set the value immediately (upsell-pattern same-page
  write). (b) ALSO persist the value session-scoped (`sessionStorage`, single key) and replay it
  into a matching EN form on the next page load in the same tab/session, clearing after a
  successful write — so a navigating accept CTA (native `<a href>`, LEARNINGS.md:21-25) still lands
  the value on the destination page's form. **Deployment precondition (review R7): the destination
  page must also embed `dist/en-lightbox.js` for replay; same-page writes are unaffected.**
- **Rejected:** (A) same-page only — fails when the accept CTA redirects cross-page (decomposer's
  pivotal unknown; the owner confirmed both shapes must work). (B) carry-over only — loses the
  immediate-write simplicity of the upsell pattern for same-page forms.
- **Evidence:** CLIENT_GUIDE.md:312-316 (no EN field writes today); requirement Test Cases 5-7.
- **Edges:** stream-c implements both; stream-d logs write and replay (via `enlb:field-write`, D8).
- **Risks:** a decline carried into a later unrelated submission could mis-segment — mitigated by
  session-scoped storage + clear-on-write; cross-session carry explicitly NOT supported (backlog
  trigger: Membership asks for cross-session attribution). Replay is idempotent.
  **Write-ordering within an accept interaction is governed by D8, not naive last-write-wins.**
- **Owner:** Fernando Santos.

## D2 — Reference field name: Membership designates later; code ships configurable, inert by default
- **Accepted:** (C) The writer activates only when the integrator configures a field name
  (e.g. `en: { referenceField: 'en_txn3' }`); with no field configured the writer is fully inert.
  EDITOR.md documents that Membership designates the deployed value (recommendation noted: avoid
  `en_txn2` to prevent collision with the annual upsell on pages running both). **Docs ownership:
  stream-c (review R4).**
- **Rejected:** (A) default `en_txn3` — hardcodes an unconfirmed EN field. (B) `en_txn2` — collision
  risk with the annual upsell wherever both campaigns run.
- **Evidence:** requirement says "an available Engaging Networks reference field" (designation is a
  Membership-side action, not a code fact).
- **Edges:** stream-c's public-boundary tests use a harness-configured field name; deployment
  validation (Test Cases 5-7) happens after Membership designates the real field.
- **Risks:** shipping inert means no production effect until configuration — intentional.
- **Owner:** Fernando Santos (code), Membership (deployed field value).

## D3 — Tracking enablement: ALWAYS-ON, hardcoded payloads (owner override of recommendation)
- **Accepted:** (B) The Tealium adapter is wired unconditionally: every lightbox display fires
  `utag.link({ event_name: 'lightbox_impression', lightbox_name: 'inactivity-exit' })` and every
  primary-CTA accept fires `utag.link({ event_name: 'lightbox_click', lightbox_name:
  'inactivity-exit' })`, with the strings frozen as module constants. No `analytics` config block.
- **Rejected:** (A) opt-in `analytics` config block (my recommendation) — the owner accepted the
  stated trade-off: this bakes the campaign's tracking into every page running this library version,
  with no per-page opt-out; the library currently serves this campaign. (C) generic callbacks —
  payload drift risk stands.
- **Evidence:** requirement fixes exact event names/values; owner's deployment reality.
- **Edges:** stream-b has NO config-schema churn for analytics (simpler than the recommended
  option); stream-a seam unchanged. **Growth bound:** a future campaign needing a different
  `lightbox_name` or an opt-out requires a code change — logged as a post-seal backlog note.
- **Risks:** pages with Tealium that run the library for non-campaign purposes will emit these
  events — accepted by owner. Mitigation for QA: debug mode (D5) shows every payload.
- **Owner:** Fernando Santos.

## D4 — Decline definition: ALL close paths — qualified by D8 precedence
- **Accepted:** (A) X button, ESC, overlay click, decline/`dismissLabel` button, and secondary close
  CTA all count as decline ⇒ write `lightbox_declined` (same-page + carry-over per D1). No
  analytics event on any of them (explicit negative requirement). **Qualification (D8): the
  `enlb:dismiss` emitted as a side-effect of a close-action PRIMARY accept CTA (reason
  `cta-primary`) is NOT a decline and writes nothing — accept owns the outcome.**
- **Rejected:** (B) explicit decline controls only — X/ESC/overlay users would be invisible to
  Membership segmentation, contradicting Test Case 6 ("Close, dismiss, or decline").
- **Evidence:** `Lightbox.close()` is the single convergence point (`src/core/lightbox.ts:132`);
  stream-a adds role-qualified `enlb:dismiss` `detail.reason` (D8) so paths stay distinguishable.
- **Edges:** stream-c consumes `enlb:dismiss` per the D8 reason table; stream-b asserts zero utag
  calls on every close path.
- **Risks:** none beyond D1's carry-over note.
- **Owner:** Fernando Santos.

## D5 — Debug mode: console-only, triggered by `?debug=true` OR `?debug=log` (ENgrid convention)
- **Accepted:** modified (A). When the URL query contains `debug=true` or `debug=log`, the library
  logs lifecycle events (`enlb:open`, `enlb:cta` with role, `enlb:dismiss` with reason), the exact
  utag payload objects (same pure payload builder the adapter uses — log and wire cannot drift),
  EN field writes, and carry-over replays (observed via `enlb:field-write`, D8) via
  `console.info('[ENLightbox]', …)`. Console-only; an in-page diagnostics panel is deferred to
  BACKLOG. Zero output otherwise — `?debug=false`, `?debug=1`, other values, malformed query ⇒
  silent (load-bearing negative tests).
- **Rejected:** (B) namespaced `?enlb_debug=true` — the owner standardized on `debug` with the
  ENgrid `=log` convention. (C) config-only — QA needs a URL switch, no page edits.
- **Evidence:** user's original ask (`?debug=true`); owner amendment adding ENgrid's `?debug=log`.
- **Edges:** stream-d ships LAST (observes all signal sources); gzip budget re-baseline, if needed,
  is reviewed on this stream alone (GATE-ARMING D13). Never throws (bad URL, frozen console).
- **Risks:** debug output could echo page-context strings — payloads are constant strings by
  construction (D3), so no PII path; reviewer confirms.
- **Owner:** Fernando Santos.

## D6 — utag absent/blocked/throwing: guarded silent no-op
- **Accepted:** (A) Fire only when `typeof utag?.link === 'function'`; swallow utag-side throws
  (never-throw-on-host-page invariant, LEARNINGS.md:41-44). In debug mode, log
  "utag absent — would fire: {payload}" so QA can validate payloads without Tealium loaded.
- **Rejected:** (B) queue-and-replay — late-loading Tealium is not an observed deployment reality
  (lightbox fires on inactivity/exit-intent, well after load); adds polling machinery and a second
  timing contract. Backlog trigger: QA observes missed events from slow Tealium in the field.
- **Evidence:** LEARNINGS invariant; `no-runtime-deps` / `no-runtime-fetch` contracts.
- **Edges:** stream-b unit tests cover absent / wrong-shape / throwing utag; e2e degraded spec
  (`e2e/degraded.spec.ts`, journey `j_degraded`) owned by stream-b (review R2).
- **Risks:** events silently lost if Tealium is blocked — accepted; visible in debug mode.
- **Owner:** Fernando Santos.

## D7 — Plan shape
- **Accepted:** wave-6 with four strictly-sequential streams (decomposer-verified, triage-scored
  medium/medium/medium/low-medium, none security-critical): `event-seam` → `tealium-analytics` →
  `en-reference-field` → `debug-mode`. Detail per stream lives in ROADMAP.md (generation 2).
- **Dependency edges:** a → b, a → c, {a,b,c} → d. Strict linear chain (shared write set:
  `dist/en-lightbox.js`, `src/index.ts`, docs; `concurrent_streams = 1`).
- **Owner:** Fernando Santos.

## D8 — Accept-owns-the-outcome precedence + role-qualified dismiss reasons (REVIEW REMEDIATION, gen 2)
- **Context (review finding R1, BLOCKING):** a non-navigating primary accept CTA is necessarily
  `action:'close'` (`src/core/lightbox.ts:269-299` `resolveCtaAction`), so `onCtaClick`
  (`lightbox.ts:46-57`) calls `close()`, which dispatches `enlb:dismiss` (`lightbox.ts:154-159`)
  AFTER the `enlb:cta` event. Under the generation-1 wording ("any close path ⇒
  `lightbox_declined`, last-write-wins"), a same-page accept would deterministically store
  `lightbox_declined` — contradicting epic criterion 4 and journey `j_accept`. Compounding:
  gen-1's reason enum collapsed all CTA closes into one `'cta'` value, making disambiguation
  impossible downstream.
- **Accepted:** (i) stream-a's `enlb:dismiss` `detail.reason` is role-qualified:
  `'close-button' | 'esc' | 'overlay' | 'cta-primary' | 'cta-secondary' | 'cta-dismiss' | 'api'`
  (CTA elements carry a build-time role tag so the reason can be qualified). (ii) stream-c's write
  rule: `enlb:cta` role `primary` ⇒ `lightbox_accepted`; `enlb:dismiss` reason ∈ {`close-button`,
  `esc`, `overlay`, `cta-secondary`, `cta-dismiss`, `api`} ⇒ `lightbox_declined`; reason
  `cta-primary` ⇒ **no write**. Across separate interactions, last-write-wins stands. (iii) New
  additive observability emission (review R6): `src/en/reference-field.ts` dispatches
  `enlb:field-write` on `document`, detail `{action:'write'|'replay', field, value}`, consumed by
  stream-d — declared on the `en-reference-field-value` contract (same writer module). (iv) Tests:
  unit + `e2e/reference-field.spec.ts` assert "primary CTA with `action:'close'` leaves the field
  at `lightbox_accepted`".
- **Rejected:** same-tick correlation heuristic ("dismiss reason 'cta' never writes declined when
  preceded by a primary enlb:cta in the same tick") — timing-coupled and fragile vs. an explicit
  reason vocabulary; the role-qualified enum is deterministic and independently useful.
- **Also remediated in this generation (same review):** R2 — `j_degraded`/`e2e/degraded.spec.ts`
  assigned to stream-b; R3 — stream-c carries the `config-schema` snapshot regen + `[no-spec:
  additive config field owned by wave-6 module]` waiver and the checklist line corrected; R4 —
  CLIENT_GUIDE FAQ + EDITOR.md `en.referenceField` docs assigned to stream-c; R5 — RESEARCH.md
  superseded paragraphs annotated; R7 — carry-over deployment precondition stated; R8 — citation
  line fixed; R9 — tracker IDs recorded in the manifest (post-review step).
- **Owner:** Fernando Santos (plan intent approved in the D1–D7 batch; D8 is the review-mandated
  correction toward that intent).

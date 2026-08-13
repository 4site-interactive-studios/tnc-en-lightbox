# RESEARCH — Lightbox analytics tracking (Tealium/Adobe + EN reference field)

Feature ask: capture lightbox impressions + acceptance clicks in Adobe Analytics via Tealium
(`utag.link`), write `lightbox_accepted`/`lightbox_declined` into a designated Engaging Networks
reference field (same pattern as the external annual-upsell `en_txn2` solution), and provide a
QA-debuggable way to validate tracking (user suggested `?debug=true` console output).

> **Generation 2 note (review remediation R5/R8):** this file preserves the pre-decision research
> record. Where the decomposition below says "opt-in `analytics` config block" for stream-b or
> "(pending Q4)" for stream-c, it is **SUPERSEDED** — D3 decided always-on hardcoded payloads (NO
> analytics config block; no config-schema churn from stream-b), D4 resolved Q4 (all close paths,
> qualified by D8's accept-owns-the-outcome precedence), and D2 resolved the field name
> (config-gated `en.referenceField`, inert by default). The only config-schema churn in the wave is
> stream-c's additive `en` block. DECISIONS.md is authoritative. The `ownership.json` exemption
> citation below is corrected to line 18 (was cited as :16).

## Codebase evidence (all citations verified 2026-08-12 against base 20efb1b)

### What exists today
- **No analytics/Tealium/utag code anywhere in the repo.** Grep for `utag|tealium|adobe|analytics`
  across `*.{ts,md,js,json}` hits only planning/docs files. No `debug` flag in `src/`.
- **The lightbox exists and ships as v1.1.0** (`package.json`, `CHANGELOG.md`): triggers include
  `inactivity` and `exit-intent` (`src/triggers/inactivity.ts`, `src/triggers/exit-intent.ts`) —
  the two triggers this campaign uses.
- **Single choke point for display:** `Lightbox.open()` (`src/core/lightbox.ts:88-118`) is reached
  by every path (dispatcher-fired triggers `src/index.ts:37-42` and manual `open()`
  `src/index.ts:59-66`). It is idempotent per mount (`if (this.host) return`, line 89) and
  failure-proof (try/catch → `abortOpen()` + one `console.warn`, never re-throw, lines 114-117).
  Impression-once semantics fall out of this guard.
- **Close paths:** X button (`onCloseClick` line 41), ESC (`onKeydown` line 28), overlay click
  (`onOverlayClick` line 35), decline/close CTAs (`onCtaClick` line 46 with
  `data-enlb-action="close"`). ALL converge on `Lightbox.close()` (line 132), which dispatches the
  existing `enlb:dismiss` CustomEvent on `document` with frozen `detail.pathname` (lines 154-159;
  ROADMAP.md:266, Decision D15). **`enlb:dismiss` currently cannot distinguish WHY it closed** —
  and a close-action CTA close cannot be told apart from a decline close (the review's R1 finding;
  remediated by D8's role-qualified reasons).
- **CTA clicks:** `onCtaClick` (lines 46-57). Redirect CTAs are native `<a href>` (LEARNINGS.md:21-25
  invariant, PR #17) — navigation proceeds natively, so accept-tracking must fire synchronously in
  the click handler before navigation. `close()` is NOT called on the redirect path; it IS called
  on the close-action path (R1).
- **CTA routing is binary today:** `resolveCtaAction` (`lightbox.ts:269-299`) resolves every CTA to
  `redirect` (`<a href>`) or `close` (`<button data-enlb-action="close">`); `buildCtaRow`
  (lines 301-327) renders primary `cta`, `secondaryCta`, and `dismissLabel` with distinct classes
  (`enlb-cta`, `enlb-cta--secondary`) — so role tagging for D8 is a build-time additive change.

### The deferred-hooks backlog item — revisit trigger has FIRED
- `.agentic/BACKLOG.md:23-27` — "Analytics / lifecycle event hooks (deferred)": optional
  `onShow`/`onDismiss`/`onCTA` callbacks and/or dataLayer/custom-event emissions.
  **Revisit trigger: "A campaign needs conversion/impression tracking, or an analytics target is
  chosen."** This feature request is exactly that trigger; stream-a marks this entry PROMOTED.
- `.agentic/specs/ROADMAP.md:257-266` already reserves (unshipped) lifecycle events as the
  core↔feature decoupling seam: `enlb:open` (wave-1, optional, never shipped — `lightbox.ts` does
  not dispatch it) and `enlb:cta` (wave-3, detail `{action, href?}` — which **cannot distinguish
  accept from decline**; D8 adds the `role` member and role-qualified dismiss reasons). The
  line-266 "internal decoupling signal, not a public analytics hook" stance is amended in stream-a.
- `CLIENT_GUIDE.md:312-316` FAQ says recording interactions into EN reference fields is "Not yet —
  on the roadmap as a planned future enhancement." Stream-c closes that FAQ gap (R4).

### Extension seam for new config (architecturally blessed path)
- `src/config.ts:21-25` declares empty extensible base interfaces (`TriggersConfigBase`,
  `ThemeConfigBase`, `LayoutConfigBase`); owning modules add members via TypeScript declaration
  merging (ROADMAP.md:222-224, Decision D2/B1). Stream-c's `en?: ENIntegrationConfigBase` follows
  the same additive pattern (wave-3's inert `en` placeholder was deliberately removed; re-adding is
  additive, not a revert) with an `ownership.json` rule `src/en/** → .agentic/specs/wave-6/stream-c.md`
  and the `[no-spec: additive config field owned by wave-6 module]` waiver on the `config.ts` edit
  (specs/ROADMAP.md:224). **D3 removed the analytics config block — stream-b adds NO config.**
- Governance trap (decomposer finding): `ownership.json:18` exempts `**/index.ts` from
  spec-coupling — logic must live in named modules (`src/analytics/tealium.ts`,
  `src/en/reference-field.ts`), with `index.ts` a thin call-through (Decision D8 precedent).
- Machine-checked contract impact: `config-schema` snapshot churns additively in **stream-c only**
  (regenerated snapshot reviewed in that PR — R3); `api-surface` stays byte-identical all wave;
  `bundle-size` budget is 6000 B gzip with wave-5 measured at 5458 B — debug string literals are
  the most likely budget pressure (isolated in stream-d, GATE-ARMING D13).

### NFRs / invariants that constrain the design (LEARNINGS.md)
- **Zero runtime dependencies** — `window.utag` is host-page-provided (Tealium loader), called
  guarded; never imported. The `no-runtime-fetch` contract greps `dist/` for `fetch(`/XHR — our
  code makes no network calls (Tealium's own loader does).
- **Never throw on the host page** (LEARNINGS.md:41-44) — `utag` absent / wrong shape / `link`
  throwing ⇒ silent no-op. Same for missing EN form / missing field.
- **No EN form interference** (NFR N3, highest-risk) — reference-field writing must reuse an
  existing input of the configured name or create a `type="hidden"` input; never `required`, never
  touch validation/submit handlers. Extend `src/core/lightbox.en-interference.test.ts`.
- **jsdom cannot read shadow-DOM computed styles** — rendered-style assertions belong in Playwright
  e2e only. Analytics/DOM-field assertions ARE jsdom-testable; public-boundary evidence is the
  Playwright harness per repo convention.

### Test infrastructure available
- Unit: Vitest + jsdom (`npm test`); `window.utag = { link: spy }` stubs cleanly in jsdom.
- E2E: Playwright (`npm run e2e`) against `e2e/harness.html`, which already contains a **mock EN
  form** (`#en-form`, `data-en-component="form"`, lines 23-27) — ready-made for reference-field
  tests. Config is passed base64url via `?cfg=` (`e2e/helpers.ts`); a `window.utag` recording stub
  can be injected via `page.addInitScript` or a harness addition. Playwright captures console
  output natively (`page.on('console')`) for debug-mode assertions. A second harness page
  (`e2e/carry-over.html`) proves the D1 carry-over replay.
- CI: GitHub Actions; gates in `.agentic/WORKFLOW.md`; contracts registry
  `.agentic/contracts/registry.json` (config-schema check at registry.json:26-31 — R3).

### What is NOT in the repo (external evidence)
- **The annual-upsell `en_txn2` reference-field solution is NOT in this repository** (grep for
  `en_txn|upsell|reference.?field` finds only docs saying it's deferred). It lives in an external
  4Site/EN page-template codebase that could not be searched from this planning session (filesystem
  permission boundary). The requirement states the pattern; the owner confirmed BOTH the same-page
  and redirect shapes must work (D1).

## Decomposition (decomposer-verified, triage-scored) — SUPERSEDED markers applied
Four sequential streams in one wave-6 (strict linear chain: every stream touches
`dist/en-lightbox.js`, `src/index.ts`, docs — `concurrent_streams = 1`):
- **stream-a `event-seam`** (medium, not security-critical): emit `enlb:open`, `enlb:cta` with
  `role`, and role-qualified `enlb:dismiss` `detail.reason` (**D8 gen-2 wording**). Carries the
  wave-6 scaffold (specs, BACKLOG promotion, ownership rules, EDITOR.md events section).
- **stream-b `tealium-analytics`** (medium, not security-critical): ~~opt-in `analytics` config
  block~~ **SUPERSEDED by D3 — always-on, hardcoded payloads, NO config block**; guarded utag-absent
  no-op (D6); owns `j_degraded` / `e2e/degraded.spec.ts` (R2).
- **stream-c `en-reference-field`** (medium, not security-critical): configurable field name,
  inert by default (D2); accept ⇒ `lightbox_accepted`, decline ⇒ `lightbox_declined`
  ~~(pending Q4)~~ **resolved by D4 + D8 precedence**; both D1 mechanisms; carries config-schema
  regen + waiver (R3), CLIENT_GUIDE/EDITOR docs (R4), and emits `enlb:field-write` (R6).
- **stream-d `debug-mode`** (low-medium, not security-critical): `?debug=true|log` console
  diagnostics (D5) observing lifecycle + payloads + `enlb:field-write`; wave tail (retro,
  LEARNINGS promotion, DOCS_AUDIT re-true, conditional budget re-baseline).

Streams b and c are mutually independent given the seam and may swap order; recommended order keeps
the N3-risk (EN-form touch) stream after one merge cycle of seam soak.

## Triage
Per-stream: medium / medium / medium / low-medium; **none security-critical** (payloads are
constant strings by construction; field name is integrator config, validated before DOM insertion —
reviewer confirms). Overall epic: **medium, not security-critical**. A readiness review was
nonetheless run (tracker preapproval gate) — round 1 BLOCKED, remediated in generation 2 (D8).

## Tracker selection
No `productive.json` at repo root → tracker = **github-sync** (repo:
`4site-interactive-studios/tnc-en-lightbox`, base branch `main`, close keyword `Closes`).

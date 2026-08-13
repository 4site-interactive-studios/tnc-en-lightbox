# OPEN QUESTIONS — Lightbox analytics tracking

Batched human decisions. Each lists evidence, recommended default (first), alternatives with
tradeoffs, and what it unlocks/invalidates. Seal approval for the whole plan rides on the final
question. Research citations in RESEARCH.md. **All questions were answered 2026-08-12 — see
DECISIONS.md D1–D7 (and D8, added in generation 2 as review remediation). This file is the
historical record of what was asked.**

> **Generation 2 correction (review R2):** Q7's seal text said "4 public-boundary journeys"; the
> sealed epic actually carries FIVE — `j_impression`, `j_accept`, `j_decline`, `j_debug`,
> `j_degraded` — with `j_degraded` (utag-absent page never breaks) owned by stream-b. The Q7 answer
> ("Approve & seal") covered the whole plan including the degraded journey; only the count in this
> file's wording was wrong.

## Q1 — How does the accept interaction reach Engaging Networks? (pivotal) → ANSWERED: (C) Both (D1)
**Evidence:** the annual-upsell `en_txn2` solution is external to this repo and could not be read;
the mechanism is asserted only by the requirement text ("values passed and stored within Engaging
Networks", "complete any required submission process"). If the accept CTA navigates away (native
`<a href>`, LEARNINGS invariant), a value written to the *current* page's form never submits —
decomposer flagged this as materially changing stream-c's acceptance criteria.

- (A) Same-page hidden field. Library find-or-creates a `type="hidden"` input named per config
  inside the page's EN form and sets its value at interaction time; the value rides the supporter's
  next submission. Matches the upsell pattern as described.
- (B) Redirect carry-over. Persist the value (sessionStorage) and write it into the EN form on the
  *destination* page at next load. Needed only if the accept CTA redirects cross-page.
- **(C) Both: same-page write + carry-over fallback. ← CHOSEN.** Covers every campaign shape;
  deployment precondition (destination page must also embed dist/en-lightbox.js) recorded in D1.

## Q2 — Which EN reference field? → ANSWERED: (C) Membership designates later (D2)
**Evidence:** requirement says "an available Engaging Networks reference field", similar to the
annual upsell's `en_txn2`. Running both lightboxes on one page with the same field would collide.

- (A) `en_txn3` — avoids collision with the annual upsell's `en_txn2`.
- (B) `en_txn2` — exactly mirrors the upsell; collision risk.
- **(C) Membership designates later — code ships configurable (`en.referenceField`), inert by
  default. ← CHOSEN.** Recommendation to avoid `en_txn2` noted for the deploy docs.

## Q3 — How is tracking enabled/configured? → ANSWERED: (B) Always-on, hardcoded (D3)
**Evidence:** the library serves multiple campaigns from one artifact; hardcoding one campaign's
events affects every page. Requirement names Tealium/`utag.link` explicitly with exact payloads.

- (A) Opt-in `analytics` config block (my recommendation) — off by default, existing pages
  byte-behaviour-identical.
- **(B) Always-on, hardcoded. ← CHOSEN (owner override).** Smallest code; accepted trade-off: the
  campaign's tracking is baked into every page running this library version, no per-page opt-out.
  Growth-bound backlog note logged.
- (C) Generic lifecycle callbacks only — payload drift risk.

## Q4 — What counts as "decline" for the reference field? → ANSWERED: (A) All close paths (D4, qualified by D8)
**Evidence:** QA Test Case 6 says "Close, dismiss, or decline the lightbox" → `lightbox_declined`.

- **(A) All close paths. ← CHOSEN.** X, ESC, overlay click, decline/`dismissLabel` button,
  secondary close CTA ⇒ `lightbox_declined`. **Qualification added in gen 2 (D8): the dismiss
  side-effect of a close-action PRIMARY accept CTA (reason `cta-primary`) writes nothing — accept
  owns the outcome.**
- (B) Explicit decline controls only — X/ESC/overlay users invisible to segmentation.

## Q5 — Debug mode shape → ANSWERED: console-only, `?debug=true` AND `?debug=log` (D5)
**Evidence:** user asked for `?debug=true` console output; owner added the ENgrid `?debug=log`
convention. Decomposer: console-only scope; debug ships last.

- **(A) `?debug=true` URL param, console-only. ← CHOSEN with amendment: `?debug=log` also
  activates (ENgrid convention).** Logs lifecycle, exact utag payloads (same builder as the wire),
  field writes/replays. Zero output otherwise.
- (B) Namespaced `?enlb_debug=true`.
- (C) Config-only.

## Q6 — Behavior when Tealium/utag is absent or slow → ANSWERED: (A) Guarded silent no-op (D6)
- **(A) Guarded silent no-op. ← CHOSEN.** Fire only when `typeof utag?.link === 'function'`;
  swallow utag-side throws; debug mode logs "utag absent — would fire: {payload}".
- (B) Queue and replay when utag arrives.

## Q7 — Seal the plan? → ANSWERED: (A) Approve & seal (D7)
- **(A) Approve decisions as recommended and SEAL. ← CHOSEN** (sealed gen 1, hash
  11f54ac1dba8f57e368d0a6d8d45a1116213ef7638f4f52ab7e514995d47c037; reopened for review remediation
  and re-sealed in generation 2 — the remediation corrects internal contradictions toward the
  approved intent without scope change).
- (B) Approve with changes.

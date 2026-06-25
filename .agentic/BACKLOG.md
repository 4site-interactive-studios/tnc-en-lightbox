# BACKLOG.md — deferred ideas

A lightweight holding pen for ideas that are sound but not yet committed. The discipline: every entry
records **why it's deferred** and a **concrete revisit trigger**, so the idea is recoverable without
re-deriving it — and so "deferred" never quietly means "forgotten."

## Template for an entry

```
### <Idea> (deferred)
- **Status:** Deferred — <one-line reason>. **Date:** YYYY-MM-DD.
- **Idea:** What it is, in two sentences.
- **Why deferred:** The blocking foundations / prerequisites.
- **Revisit trigger:** The concrete condition under which this becomes worth doing.
```

### Cross-session / cross-page dismissal suppression (deferred)
- **Status:** Deferred — out of scope by decision (dismissal is per-page, per-session only). **Date:** 2026-06-25.
- **Idea:** Persist a dismissal (cookie / localStorage) so the lightbox stays hidden for N days or across pages of the same campaign, not just the current session.
- **Why deferred:** The brief's Q&A explicitly scopes dismissal to the current page/session; cross-session suppression is a different product decision and adds storage/consent considerations.
- **Revisit trigger:** A campaign owner asks for "don't show again for X days" or campaign-wide suppression.

### Analytics / lifecycle event hooks (deferred)
- **Status:** Deferred — no consumer for metrics yet. **Date:** 2026-06-25.
- **Idea:** Optional callbacks (`onShow`, `onDismiss`, `onCTA`) and/or `dataLayer`/custom-event emissions so campaigns can measure impressions and conversions.
- **Why deferred:** Core behavior must land first; the brief doesn't yet require measurement, and the integration target (GA/EN/dataLayer) is unspecified.
- **Revisit trigger:** A campaign needs conversion/impression tracking, or an analytics target is chosen.

### A/B variant testing (deferred)
- **Status:** Deferred — premature before the core is in production. **Date:** 2026-06-25.
- **Idea:** Configure multiple copy/image/CTA variants and split traffic to compare performance.
- **Why deferred:** Needs the analytics hooks above plus a bucketing mechanism; not in the acceptance criteria.
- **Revisit trigger:** Stakeholders want to optimize conversion and analytics hooks exist.

### Video-progress trigger (deferred)
- **Status:** Deferred — beyond the four configured triggers. **Date:** 2026-06-25.
- **Idea:** Fire the lightbox when an embedded video reaches X% watched (use-case 1 mentions "while watching a video").
- **Why deferred:** Requires hooking arbitrary embedded players (YouTube/Vimeo/native) with no third-party deps; the time/scroll/inactivity/exit-intent triggers cover the stated cases.
- **Revisit trigger:** A campaign specifically needs video-completion-based triggering.

### Rich-text body content (deferred)
- **Status:** Deferred — body is plain-text (`textContent`) by decision (ROADMAP Open Q9). **Date:** 2026-06-25.
- **Idea:** An opt-in, sanitized `bodyHtml?` (or `htmlAllowed?`) path so a campaign can use multiple paragraphs, inline links, or bold in the dialog body instead of routing rich content through the CTA link.
- **Why deferred:** Rich text adds an HTML-injection/sanitization surface (same trust boundary as `customCss`, Risk R2), and current campaigns are served by plain text + a CTA. It is additively recoverable — a new optional field that does not break the wave-0-frozen content shape.
- **Revisit trigger:** A campaign needs more than one paragraph, or an inline link/bold, in the body.

### Refined dismissal scoping (`campaignKey`) (deferred)
- **Status:** Deferred — wave-1 dismissal is keyed on `location.pathname` per the NFR (per-page, per-session). **Date:** 2026-06-25.
- **Idea:** An optional `campaignKey` (surfaced as an additive `enlb:dismiss` `detail.key`) so dismissal can be scoped to a campaign identity rather than the URL path — for EN flows that share one pathname across steps, or where one path serves multiple EN pages by `pageId`.
- **Why deferred:** `location.pathname` is the literal NFR and the common case; richer page identity isn't known until wave-3 establishes EN detection. Key-derivation is isolated to one internal function and the `detail.key` escape hatch is additive, so re-keying later is non-breaking (Risk R-N4key).
- **Revisit trigger:** wave-3 shows `pathname` is the wrong granularity (multi-step EN flow re-shows, or pathname collisions), or a campaign requests campaign-wide dismissal scoping.

### CTA `submit` action (deferred — conditional) (deferred)
- **Status:** Deferred — conditional on a committed EN-form contract (Decision D5b). **Date:** 2026-06-25.
- **Idea:** A `cta.action: 'submit'` that submits the host Engaging Networks form (rather than redirecting or closing), routing through EN's native submit/validation.
- **Why deferred:** It sits on the highest-risk NFR (no EN form interference); a half-specified submit action is dangerous. It ships only if wave-3 commits which form it targets, that it routes through EN's native submit/validation, and its behavior on non-form pages.
- **Revisit trigger:** wave-3 commits the concrete EN-form contract, or a campaign needs the lightbox CTA to submit the page's EN form.

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

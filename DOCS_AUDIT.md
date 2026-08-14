# DOCS_AUDIT.md — documentation sync status

Audit date: 2026-08-13 (stream-d repair R1 — diagnostics implementation)
Branch: `feat/wave-6-stream-d`
Scope: all Markdown documentation files plus the SDD tool README, wave-6 specs, and contract registry.

## Legend

| Status | Meaning |
|--------|---------|
| **current** | Accurate against shipped code, the authoritative specs/contracts, and the Amendments that override stale body text. |
| **stale** | A stable doc contains a fact that is wrong today; fix is allowed and noted. |
| **pending** | Doc is owned by an in-flight stream/wave and should be trued up when that work lands. |

## Audit table

| File | Status | Notes |
|------|--------|-------|
| `README.md` | **stale** | The locked root guide predates stream-d and still states a 6000B gzip budget while `.agentic/contracts/budgets.json` sets the measured stream-d ceiling to 7400B. The earlier rewrite predates stream-d, and this file is outside the stream-d whitelist, so the discrepancy remains unresolved. |
| `EDITOR.md` | **current** | Editor config/schema/examples, lifecycle/analytics/EN guidance, and URL-only `?debug=true|log` diagnostics with absent-utag QA mode and the zero-output rule. |
| `CLIENT_GUIDE.md` | **current** | Campaign setup guide now documents URL-only diagnostics, lifecycle/field-write output, absent-utag QA mode, and silent non-activation values. |
| `.agentic/AGENTS.md` | **current** | Dismissal NFR matches the persistent localStorage frequency cap; that governance correction predates stream-d and this file is outside the stream-d write scope. |
| `.agentic/WORKFLOW.md` | **current** | GATES and delivery loop match current practice. |
| `.agentic/REVIEWING.md` | **current** | Independent-reviewer protocol is unchanged. |
| `.agentic/LEARNINGS.md` | **current** | Invariants/gotchas include the wave-4 safety rules plus wave-6 event-seam, accept-precedence, utag-guard, builder-reuse, and spec-coupling invariants. |
| `.agentic/BACKLOG.md` | **current** | Entries correctly record what was promoted into earlier waves and what remains deferred with revisit triggers. |
| `.agentic/specs/ROADMAP.md` | **current** (reconciled) | The stale `sessionStorage`/`enlb:dismissed:` body references are authoritatively superseded by the "Amendments — wave-4 entry" dismissal correction, marked **RECONCILED** at closeout (shipped: **localStorage**, key `enlb:shown:${pathname}`, `frequencyDays`). The frozen body / Decision D15 / NFR N4 lines are retained verbatim as the historical record (rewriting frozen decisions would erase what changed); the amendment + code + EDITOR.md govern. Wave 4 shipped as three streams (a/c/b). |
| `.agentic/specs/README.md` | **stale** | The wave index still says wave-3 is in progress and wave-6 streams b–d are planned/in progress, and it omits later waves. This file is outside the stream-d whitelist, so the discrepancy remains explicitly unresolved here. |
| `.agentic/specs/AGENT_LAUNCH_PROMPT.md` | **current** | Template matches the current GATES block. |
| `.agentic/specs/BRIEF_TEMPLATE.md` | **current** | Standard brief template. |
| `.agentic/specs/cross-browser-smoke.md` | **current** | Acceptance criteria are checked, and the committed mini-stream has landed: `e2e/smoke.spec.ts`, `e2e/harness.html`, `playwright.config.ts`, and `.github/workflows/cross-browser.yml` exist and run in CI. |
| `.agentic/specs/wave-0/README.md` | **current** | Stream-b is recorded as merged (PR #8), and the wave exit criteria are checked. |
| `.agentic/specs/wave-0/stream-a.md` | **current** | Acceptance criteria are checked and the "Backfill (stream-b) amendments" note is present. |
| `.agentic/specs/wave-0/stream-b.md` | **current** | Acceptance criteria are checked; the backfill landed (PR #8) and the contracts/config seam/a11y slice are in `src/**`. |
| `.agentic/specs/wave-1/README.md` | **current** | Correctly marks stream-a as complete (PR #11). |
| `.agentic/specs/wave-1/stream-a.md` | **current** | Acceptance criteria are checked and match shipped code. |
| `.agentic/specs/wave-2/README.md` | **current** | Correctly marks stream-a (PR #17) and stream-b (PR #21) as complete. |
| `.agentic/specs/wave-2/stream-a.md` | **current** | Acceptance criteria are checked; the stream is merged (PR #17) and the token surface/layout/a11y changes are in `src/**`. |
| `.agentic/specs/wave-2/stream-b.md` | **current** | Acceptance criteria are checked and match shipped code. |
| `.agentic/specs/wave-3/README.md` | **current** | Wave-3 merged (PR #24); retro is filled and reflects the 2026-06-26 exit. |
| `.agentic/specs/wave-3/stream-a.md` | **current** | Wave-3/stream-a merged with PR #24. Acceptance criteria match shipped code. |
| `.agentic/specs/wave-4/README.md` | **current** | Three streams (a → c → b) all merged; retro filled at exit (v1.0.0). |
| `.agentic/specs/wave-4/stream-a.md` | **current** | Merged (PR #28): production hardening (error isolation, config tolerance, ordering, idempotency). |
| `.agentic/specs/wave-4/stream-c.md` | **current** | Merged (PR #32) + polish (PR #37): open Shadow-DOM isolation, `:host` reset, layout fix, focus-ring + image-top flush. |
| `.agentic/specs/wave-4/stream-b.md` | **current** | Merged (PR #35): MIT license, versioning, release-please, EN-hosting docs + `RELEASE.md`, CI. **v1.0.0 released** (tag + GitHub Release + dist asset). |
| `.agentic/specs/wave-6/README.md` | **current** | Streams a–c are approved; stream-d implementation and deliverables are complete, with independent review pending after repair R1. The checklist records implementation completion, not reviewer approval. |
| `.agentic/specs/wave-6/stream-a.md` | **current** | Lifecycle seam brief matches the landed document events and frozen detail ordering. |
| `.agentic/specs/wave-6/stream-b.md` | **current** | Tealium reader brief matches the pure payload builder, guarded utag call-through, and no-queue behavior. |
| `.agentic/specs/wave-6/stream-c.md` | **current** | EN reference-field brief matches accepted/declined precedence and `enlb:field-write` observability. |
| `.agentic/specs/wave-6/stream-d.md` | **current** | Diagnostics brief matches query-only activation, builder reuse, no-throw boundaries, and wave-tail scope. |
| `.agentic/contracts/budgets.json` | **current** | D13 ceiling decision is reviewed against the stream-d post-build gzip measurement; changed only if the measured artifact exceeds 7000B. |
| `.agentic/contracts/snapshots/api-surface.txt` | **current** | Regenerated and byte-identical; diagnostics add no public exports. |
| `.agentic/contracts/snapshots/config-schema.txt` | **current** | Regenerated and byte-identical; diagnostics add no configuration block. |
| `tools/sdd/README.md` | **current** | Accurately describes the four gates and how to run them. |
| `.agentic/decisions/0001-record-architecture-decisions.md` | **current** | Accepted ADR template. |
| `.agentic/decisions/TEMPLATE.md` | **current** | Standard ADR template. |
| `.agentic/contracts/registry.json` | **current** | Contract list matches the machine-checked guarantees referenced in `README.md` and `ROADMAP.md`. |

## Discrepancies — resolved or explicitly noted at stream-d repair R1

| Topic | Resolution |
|-------|------------|
| Hosting / CDN / versioning / license / embed | Shipped in wave-4/stream-b (PR #35): MIT `LICENSE`, v1.0.0, release-please + GitHub Release with the dist asset, EN-upload hosting flow in `EDITOR.md` + `RELEASE.md`. |
| Visual appearance / Shadow-DOM / isolation internals | Shipped in wave-4/stream-c (PR #32) + polish (PR #37): open Shadow DOM, `:host` reset, layout fix, focus-ring + image-top flush. |
| Full editor-guide polish (concrete embed, cache-busting) | Done in `EDITOR.md` (wave-4/stream-b): EN-upload flow + `?v=` cache-busting + per-page update note. |
| Plan-body cleanup in `ROADMAP.md` | Reconciled via the "Amendments — wave-4 entry" dismissal correction (authoritative supersession, marked RECONCILED); frozen body retained as the historical record by design. |
| Wave-6 diagnostics docs and contract scope | Resolved here: `EDITOR.md`, `CLIENT_GUIDE.md`, wave-6 briefs/README, learnings, budget narrative, and both contract snapshot rows now describe landed behavior; no debug panel or config block is documented. |
| Wave index status | `.agentic/specs/README.md` remains stale as described in the audit table; it is outside the stream-d whitelist and was not edited to make this audit appear current. |
| Root README budget | `README.md` remains stale on its 6000B budget statement; it is outside the stream-d whitelist and was not edited to make this audit appear current. |

## Verification commands run

- `python3 tools/sdd/check_spec_coupling.py --base main`
- `python3 tools/sdd/check_contracts.py`
- `python3 tools/sdd/check_test_coupling.py --base main`
- `npm run typecheck`
- `npm run lint`

(See PR body for results.)

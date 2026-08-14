# DOCS_AUDIT.md — documentation sync status

Audit date: 2026-08-14 (wave-6 close-out)
Branch: `docs/wave-6`
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
| `README.md` | **current** | The developer guide now describes the bundle-size budget as CI-enforced in `.agentic/contracts/budgets.json`, currently 7400B gzip. |
| `EDITOR.md` | **current** | Editor config/schema/examples, lifecycle/analytics/EN guidance, and URL-only `?debug=true|log` diagnostics with absent-utag QA mode and the zero-output rule. |
| `CLIENT_GUIDE.md` | **current** | Campaign setup guide now documents URL-only diagnostics, lifecycle/field-write output, absent-utag QA mode, and silent non-activation values. |
| `.agentic/AGENTS.md` | **current** | Dismissal NFR matches the persistent localStorage frequency cap; that governance correction predates stream-d and this file is outside the stream-d write scope. |
| `.agentic/WORKFLOW.md` | **current** | GATES and delivery loop match current practice. |
| `.agentic/REVIEWING.md` | **current** | Independent-reviewer protocol is unchanged. |
| `.agentic/LEARNINGS.md` | **current** | Invariants/gotchas include the wave-4 safety rules plus wave-6 event-seam, accept-precedence, utag-guard, builder-reuse, and spec-coupling invariants. |
| `.agentic/BACKLOG.md` | **current** | Entries correctly record what was promoted into earlier waves and what remains deferred with revisit triggers. |
| `.agentic/specs/ROADMAP.md` | **current** (reconciled) | The stale `sessionStorage`/`enlb:dismissed:` body references are authoritatively superseded by the "Amendments — wave-4 entry" dismissal correction, marked **RECONCILED** at closeout (shipped: **localStorage**, key `enlb:shown:${pathname}`, `frequencyDays`). The frozen body / Decision D15 / NFR N4 lines are retained verbatim as the historical record (rewriting frozen decisions would erase what changed); the amendment + code + EDITOR.md govern. Wave 4 shipped as three streams (a/c/b). |
| `.agentic/specs/README.md` | **current** | The wave index records wave-3 as complete, includes wave-5 with its implementation-landed/retro-pending status, and records wave-6 as delivered after review approval. |
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
| `.agentic/specs/wave-5/README.md` | **stale** | The wave-5 README identifies the post-1.0 client design-feedback wave, but its wave-exit retrospective is still a TODO even though the implementation landed. |
| `.agentic/specs/wave-5/design-refresh.md` | **current** | The initial design-refresh brief is retained as the historical wave-5 brief; its forest/sky treatment is superseded by the correction brief below. |
| `.agentic/specs/wave-5/forest-sky-spec-correction.md` | **current** | The correction brief records the forest/sky campaign layout, corrected tokens, responsive behavior, and close-button treatment used by the landed wave-5 implementation. |
| `.agentic/specs/wave-5/release-dist-sync.md` | **current** | The release-dist-sync brief matches the landed release-PR rebuild workflow, branch guardrails, and committed-dist behavior. |
| `.agentic/specs/wave-6/README.md` | **current** | Streams a–d are approved after repair R1; the wave-level review is approved, and the README records the final exit outcome. |
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
| Wave index status | `.agentic/specs/README.md` now records wave-3 as complete, wave-5 as implementation landed with its README retro pending, and wave-6 as delivered after review approval. |
| Root README budget | The developer guide now points to the CI-enforced `.agentic/contracts/budgets.json` budget, currently 7400B gzip. |
| Wave-6 close-out | Round-0 wave review was BLOCKED on documented-head carry-over replay timing and journey-coverage gaps; remediation PR #67 landed, and round-1 was APPROVED. |

## Verification commands run

- `python3 tools/sdd/check_spec_coupling.py --base main`
- `python3 tools/sdd/check_contracts.py`
- `python3 tools/sdd/check_test_coupling.py --base main`
- `npm run typecheck`
- `npm run lint`

(See PR body for results.)

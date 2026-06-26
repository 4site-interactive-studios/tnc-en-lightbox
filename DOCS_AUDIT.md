# DOCS_AUDIT.md — documentation sync status

Audit date: 2026-06-26 (re-trued at wave-4 closeout — **v1.0.0 shipped**)  
Branch: `docs/wave-4-closeout`  
Scope: all Markdown documentation files plus the SDD tool README and the contract registry.

## Legend

| Status | Meaning |
|--------|---------|
| **current** | Accurate against shipped code, the authoritative specs/contracts, and the Amendments that override stale body text. |
| **stale** | A stable doc contains a fact that is wrong today; fix is allowed and noted. |
| **pending** | Doc is owned by an in-flight stream/wave and should be trued up when that work lands. |

## Audit table

| File | Status | Notes |
|------|--------|-------|
| `README.md` | **current** | Rewritten in this PR; claims trace to `.agentic/specs/ROADMAP.md` (Public contract / NFR matrix), `.agentic/contracts/registry.json`, and `src/**`. |
| `EDITOR.md` | **current** | Editor config/schema/examples. The "never throw on the host page" guarantee is now true in code (wave-4/stream-a, PR #28); the placeholder CDN URL was replaced with the EN-upload flow + the v1.0.0 embed (wave-4/stream-b, PR #35); a Shadow-DOM isolation note was added (stream-c, PR #32). |
| `.agentic/AGENTS.md` | **current** | Corrected in this PR: dismissal NFR now matches the persistent localStorage frequency cap. |
| `.agentic/AGENTS.md` | **stale** | NFR line still says dismissal is "scoped per-page, per-session". Amendment (wave-1 entry) and shipped code (`src/triggers/dismissal.ts`) use **localStorage** with `frequencyDays` (default 7). Fix applied in this PR. |
| `.agentic/WORKFLOW.md` | **current** | GATES and delivery loop match current practice. |
| `.agentic/REVIEWING.md` | **current** | Independent-reviewer protocol is unchanged. |
| `.agentic/LEARNINGS.md` | **current** | Invariants/gotchas now include the wave-4 Shadow-DOM + never-throw invariants and the outside-close-clip / focus-ring gotchas (promoted at closeout). |
| `.agentic/BACKLOG.md` | **current** | Entries correctly record what was promoted into earlier waves and what remains deferred with revisit triggers. |
| `.agentic/specs/ROADMAP.md` | **current** (reconciled) | The stale `sessionStorage`/`enlb:dismissed:` body references are authoritatively superseded by the "Amendments — wave-4 entry" dismissal correction, marked **RECONCILED** at closeout (shipped: **localStorage**, key `enlb:shown:${pathname}`, `frequencyDays`). The frozen body / Decision D15 / NFR N4 lines are retained verbatim as the historical record (rewriting frozen decisions would erase what changed); the amendment + code + EDITOR.md govern. Wave 4 shipped as three streams (a/c/b). |
| `.agentic/specs/README.md` | **current** | Wave index correctly lists wave-0 stream-b as merged (PR #8), wave-3 merged, and wave-4 in progress. |
| `.agentic/specs/AGENT_LAUNCH_PROMPT.md` | **current** | Template matches the current GATES block. |
| `.agentic/specs/BRIEF_TEMPLATE.md` | **current** | Standard brief template. |
| `.agentic/specs/cross-browser-smoke.md` | **stale** | Brief still shows unchecked acceptance-criteria boxes, but the committed mini-stream has landed: `e2e/smoke.spec.ts`, `e2e/harness.html`, `playwright.config.ts`, and `.github/workflows/cross-browser.yml` exist and run in CI. Fix applied in this PR. |
| `.agentic/specs/wave-0/README.md` | **stale** | Stream-b status is "planned"; it is merged (PR #8). Fix applied in this PR. |
| `.agentic/specs/wave-0/stream-a.md` | **current** | Acceptance criteria are checked and the "Backfill (stream-b) amendments" note is present. |
| `.agentic/specs/wave-0/stream-b.md` | **stale** | Acceptance-criteria boxes are unchecked even though the backfill landed (PR #8) and the contracts/config seam/a11y slice are in `src/**`. Fix applied in this PR. |
| `.agentic/specs/wave-1/README.md` | **current** | Correctly marks stream-a as complete (PR #11). |
| `.agentic/specs/wave-1/stream-a.md` | **current** | Acceptance criteria are checked and match shipped code. |
| `.agentic/specs/wave-2/README.md` | **current** | Correctly marks stream-a (PR #17) and stream-b (PR #21) as complete. |
| `.agentic/specs/wave-2/stream-a.md` | **stale** | Acceptance-criteria boxes are unchecked even though the stream is merged (PR #17) and the token surface/layout/a11y changes are in `src/**`. Fix applied in this PR. |
| `.agentic/specs/wave-2/stream-b.md` | **current** | Acceptance criteria are checked and match shipped code. |
| `.agentic/specs/wave-3/README.md` | **current** | Wave-3 merged (PR #24); retro is filled and reflects the 2026-06-26 exit. |
| `.agentic/specs/wave-3/stream-a.md` | **current** | Wave-3/stream-a merged with PR #24. Acceptance criteria match shipped code. |
| `.agentic/specs/wave-4/README.md` | **current** | Three streams (a → c → b) all merged; retro filled at exit (v1.0.0). |
| `.agentic/specs/wave-4/stream-a.md` | **current** | Merged (PR #28): production hardening (error isolation, config tolerance, ordering, idempotency). |
| `.agentic/specs/wave-4/stream-c.md` | **current** | Merged (PR #32) + polish (PR #37): open Shadow-DOM isolation, `:host` reset, layout fix, focus-ring + image-top flush. |
| `.agentic/specs/wave-4/stream-b.md` | **current** | Merged (PR #35): MIT license, versioning, release-please, EN-hosting docs + `RELEASE.md`, CI. **v1.0.0 released** (tag + GitHub Release + dist asset). |
| `tools/sdd/README.md` | **current** | Accurately describes the four gates and how to run them. |
| `.agentic/decisions/0001-record-architecture-decisions.md` | **current** | Accepted ADR template. |
| `.agentic/decisions/TEMPLATE.md` | **current** | Standard ADR template. |
| `.agentic/contracts/registry.json` | **current** | Contract list matches the machine-checked guarantees referenced in `README.md` and `ROADMAP.md`. |

## Discrepancies — all RESOLVED at wave-4 closeout

| Topic | Resolution |
|-------|------------|
| Hosting / CDN / versioning / license / embed | Shipped in wave-4/stream-b (PR #35): MIT `LICENSE`, v1.0.0, release-please + GitHub Release with the dist asset, EN-upload hosting flow in `EDITOR.md` + `RELEASE.md`. |
| Visual appearance / Shadow-DOM / isolation internals | Shipped in wave-4/stream-c (PR #32) + polish (PR #37): open Shadow DOM, `:host` reset, layout fix, focus-ring + image-top flush. |
| Full editor-guide polish (concrete embed, cache-busting) | Done in `EDITOR.md` (wave-4/stream-b): EN-upload flow + `?v=` cache-busting + per-page update note. |
| Plan-body cleanup in `ROADMAP.md` | Reconciled via the "Amendments — wave-4 entry" dismissal correction (authoritative supersession, marked RECONCILED); frozen body retained as the historical record by design. |

## Verification commands run

- `python3 tools/sdd/check_spec_coupling.py --base main`
- `python3 tools/sdd/check_contracts.py`
- `python3 tools/sdd/check_test_coupling.py --base main`
- `npm run typecheck`
- `npm run lint`

(See PR body for results.)

# DOCS_AUDIT.md — documentation sync status

Audit date: 2026-06-26  
Branch: `docs/wave-4-readme`  
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
| `EDITOR.md` | **current** | Contains the current editor config/schema/examples. The "never throw on the host page" guarantee is documented here; wave-4/stream-a is making it true in code. Wave-4/stream-b will replace the placeholder CDN URL with a concrete versioned embed. |
| `.agentic/AGENTS.md` | **current** | Corrected in this PR: dismissal NFR now matches the persistent localStorage frequency cap. |
| `.agentic/AGENTS.md` | **stale** | NFR line still says dismissal is "scoped per-page, per-session". Amendment (wave-1 entry) and shipped code (`src/triggers/dismissal.ts`) use **localStorage** with `frequencyDays` (default 7). Fix applied in this PR. |
| `.agentic/WORKFLOW.md` | **current** | GATES and delivery loop match current practice. |
| `.agentic/REVIEWING.md` | **current** | Independent-reviewer protocol is unchanged. |
| `.agentic/LEARNINGS.md` | **current** | Invariants and gotchas reflect wave-2/stream-a and stream-b learnings. |
| `.agentic/BACKLOG.md` | **current** | Entries correctly record what was promoted into earlier waves and what remains deferred with revisit triggers. |
| `.agentic/specs/ROADMAP.md` | **stale** (recorded, not edited) | Body contains superseded text that the Amendments override: references to `sessionStorage` and key `enlb:dismissed:${pathname}` — shipped code uses **localStorage** and key `enlb:shown:${pathname}`. The "Amendments — wave-4 entry" section explicitly records this supersession and makes the in-place reconciliation a **wave-4/stream-b** item. Wave 4 is confirmed (not optional) and split into stream-a (hardening) and stream-b (release). The discrepancies are recorded here rather than silently rewritten. |
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
| `.agentic/specs/wave-4/README.md` | **current** | New from PR #26. Confirms wave-4 is split into stream-a (hardening) and stream-b (release); exit criteria and retros are incomplete by design. |
| `.agentic/specs/wave-4/stream-a.md` | **current** | New from PR #26. In-flight code stream (PR #28): production hardening of auto-init, config tolerance, ordering, idempotency. |
| `.agentic/specs/wave-4/stream-b.md` | **current** | New from PR #26. Planned post-stream-a: LICENSE, versioning, hosting, release automation, CI/QA, ROADMAP dismissal reconciliation. |
| `tools/sdd/README.md` | **current** | Accurately describes the four gates and how to run them. |
| `.agentic/decisions/0001-record-architecture-decisions.md` | **current** | Accepted ADR template. |
| `.agentic/decisions/TEMPLATE.md` | **current** | Standard ADR template. |
| `.agentic/contracts/registry.json` | **current** | Contract list matches the machine-checked guarantees referenced in `README.md` and `ROADMAP.md`. |

## Discrepancies that must wait (not editable in this docs-only stream)

| Topic | Why it waits | Where it lands |
|-------|--------------|----------------|
| Hosting, CDN, cache-busting, versioning, license, embed instructions | Out of scope per stream brief; requires release tooling decisions. | `wave-4/stream-b` |
| Visual appearance, screenshots, Shadow-DOM / isolation internals | The look and isolation approach are still changing. | `wave-4/stream-c` |
| Full editor-guide polish (concrete versioned embed, cache-busting + SRI guidance, how-to-update note) | Currently owned by wave-4/stream-b; placeholders in `EDITOR.md` will be replaced after owner decisions on hosting target. | `wave-4/stream-b` |
| Plan-body cleanup in `ROADMAP.md` | ROADMAP is a historical master plan with explicit amendment sections; rewriting its body would erase the record of what changed. The Amendments remain authoritative. | `wave-4/stream-b` (reconciliation is an explicit exit criterion) |

## Verification commands run

- `python3 tools/sdd/check_spec_coupling.py --base main`
- `python3 tools/sdd/check_contracts.py`
- `python3 tools/sdd/check_test_coupling.py --base main`
- `npm run typecheck`
- `npm run lint`

(See PR body for results.)

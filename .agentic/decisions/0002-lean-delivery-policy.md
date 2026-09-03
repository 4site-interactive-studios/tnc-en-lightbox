# 0002 - Lean delivery policy

**Date:** 2026-09-03
**Status:** Approved by Fernando Santos on 2026-09-03
**Supersedes:** The delivery-process requirements in `.agentic/WORKFLOW.md`,
`.agentic/REVIEWING.md`, `.agentic/AGENTS.md`, `.agentic/specs/AGENT_LAUNCH_PROMPT.md`, and the
`README.md` contributing summary before this decision.

## Context

The project was scaffolded with strict universal ceremony: one issue per stream, red-first testing
plus mutation proof, independent review for every pull request, per-PR owner merge approval, and a
wave retrospective. A documentation-only request demonstrated that these controls add material
latency even when no runtime behavior or hard-risk surface changes.

The global OpenCode fleet now uses a lean coordinator canon with risk-based review, bounded repair,
and automatic integration for green reversible work. Project policy must agree with the active fleet
instead of forcing a hybrid workflow.

## Decision

Classify each stream as docs-only, default, or hard. Eligible docs-only work follows the globally
loaded exact-scope, one-scribe, one-generation contract. Other ordinary reversible work is default.
Concurrency, state machines, migrations, performance-critical work, broad cross-cutting changes,
durable LEARNINGS invariants, and security-sensitive trust boundaries are hard.

Tests are required when behavior changes and may be written before or after implementation. A
change with no behavior change uses `[no-test: <reason>]`. Default and docs-only streams skip
independent review. Hard streams receive one blocker-only independent review and at most one repair.

Pull requests still require configured CI. Green reversible work integrates automatically. Human
approval is required only immediately before destructive schema or data migrations, deploys,
publishes, releases, external service cutovers, secret rotation, force operations, or data deletion.

Link an existing issue when one exists, but do not create an issue only to satisfy process. Remove
mandatory retrospectives, review-audit branches, mutation proof, and universal owner merge approval
from current guidance. Keep the coordinator's worktree, Git identity, non-force, exact-verification,
and cleanup responsibilities.

## Historical Records

Completed wave specifications, roadmap entries, retrospectives, pull-request evidence, and planning
artifacts remain unchanged. Their strict workflow language records how that work was delivered; it
does not instruct new work after this decision.

## Consequences

- Routine documentation and default work have one bounded delivery path.
- Review effort is reserved for hard risks where mistakes compound.
- Green reversible work no longer waits for routine merge approval.
- CI, contracts, technical LEARNINGS invariants, release controls, and irreversible-action approval
  remain intact.
- `sdd.config.json` keeps `team.concurrent_streams: 1`; this decision changes ceremony, not project
  parallelism.

# WORKFLOW.md - lean delivery loop and gates

## Delivery loop

```text
ask -> classify docs-only | default | hard -> isolated worktree -> implement -> verify
    -> hard only: one blocker-only review, at most one repair
    -> pull request -> configured CI green -> automatic reversible merge -> cleanup
```

The coordinator owns worktrees, branches, staging, commits, pushes, merge serialization, configured
Git identity, and cleanup. Editing agents stay in the assigned worktree and leave an
edited-but-uncommitted tree.

Link an existing issue when one exists. Do not create an issue solely to satisfy ceremony.

## Classification

- **docs-only:** Every intended write is human-authored documentation or an already-required
  generated documentation artifact. Follow the globally loaded exact-scope, one-scribe,
  one-generation contract. Governance, tooling, source comments, configuration, CI, code, tests,
  runtime assets, and distribution output do not qualify.
- **default:** Ordinary reversible features, fixes, refactors, configuration, UI, and maintenance.
- **hard:** Concurrency, state machines, ordering-sensitive work, schema or data migrations,
  performance-critical paths, broad cross-cutting changes, durable `LEARNINGS.md` invariants, and
  security-sensitive trust boundaries. When uncertain, choose hard.

Split independently integrable work only when write paths are disjoint. Honor
`sdd.config.json` `team.concurrent_streams`; overlapping paths serialize. A fourth batch or
remediation-on-remediation stops and asks the owner before scope grows again.

## Gates

- **WORKTREE:** The coordinator creates and assigns an isolated worktree. Editing agents verify the
  absolute cwd and branch, never mutate Git, and never touch `main` or another worktree.
- **IDENTITY:** The coordinator uses the repository's configured `user.name` and `user.email`, then
  verifies the commit with `git log -1 --format='%an <%ae>'`. Never bypass hooks or add generated
  co-author trailers.
- **BEHAVIOR COVERAGE:** Tests are required when behavior changes and may be written before or after
  implementation. A no-behavior change uses `[no-test: <reason>]`; a bare waiver is invalid.
- **CONTRACTS:** Regenerate and check committed artifacts from their source of truth. Diff-based
  checks include untracked output.
- **SANDBOX EVIDENCE:** Green claims require the exact verification command under the stream's real
  sandbox profile.
- **REPORT:** Return changed files, exact verification evidence, classification, cross-stream flags,
  and any earned `LEARNINGS.md` entry in one message.

## Review hard streams only

Default and docs-only streams receive no independent review. A hard stream receives one independent
blocker-only review under `.agentic/REVIEWING.md`. One blocker may receive one fresh same-lane repair
and one re-review. A remaining blocker becomes a separate fix-forward stream or a human decision;
never grow a review loop.

## Integration

Before checks, capture the immutable target-base SHA used by diff-based gates. The coordinator
commits, pushes, opens a conventional pull request, and runs configured CI. Include `Closes #N` only
when an existing issue is linked. The body records `How tested`, `[no-test: <reason>]` when
applicable, and `What was hard / non-obvious`.

Red CI receives one fix round only when the failure belongs to the stream. If it remains red, stop
and ask. Never weaken or remove a failing gate.

Green reversible work merges automatically with a merge commit. Human approval is required only
immediately before destructive schema or data migrations, deploys, publishes, releases, external
service cutovers, secret rotation, force operations, or data deletion. Approval covers only the
named irreversible action.

## Cleanup and completion

Verify `mergedAt` before cleanup. Fetch and fast-forward `main`, remove the exact merged worktree,
delete the merged local and remote branch without force, prune, and confirm any linked issue closed.
Never modify a live worktree.

End the ask with one summary of merged work, CI state, deferred findings, fallbacks, and anything
requiring human attention. There is no mandatory retrospective, review-audit branch, lessons sweep,
or documentation sweep.

## Historical guidance

Process instructions in completed wave, roadmap, retrospective, and planning records describe their
historical delivery. Decision 0002 and this file govern new work.

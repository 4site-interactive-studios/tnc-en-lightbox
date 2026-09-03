# Agent launch prompt

Paste-ready prompt for a default or hard stream. The coordinator creates the worktree and supplies
the exact values before dispatch. Eligible docs-only work uses the globally loaded scribe contract
instead.

```text
STREAM: <stream id> - <name>
CLASSIFICATION: default | hard
WORKTREE: <absolute assigned worktree>
BRANCH: <assigned branch>

GATES:
- Verify cwd and HEAD match the assigned worktree and branch. Never touch main, another worktree, or
  Git state.
- Read `.agentic/AGENTS.md`, `.agentic/WORKFLOW.md`, relevant `LEARNINGS.md` entries, and the brief.
- Test every behavior change before or after implementation. If behavior does not change, report
  `[no-test: <reason>]`.
- Run the exact verification command under the real sandbox profile.
- Never bypass hooks, weaken a gate, force-push, or add co-author trailers.

GOAL: <exact requested outcome>
CONSTRAINTS: <exact scope and invariants>
ACCEPTANCE: <observable acceptance criteria>
VERIFY: <literal command>

REPORT: classification, changed files, exact verification output, sandbox profile, cross-stream
flags, and any earned `LEARNINGS.md` entry. Leave the tree edited but uncommitted.
```

For a hard stream, the coordinator sends this report and the risky-path focus to the independent
reviewer. Default work proceeds directly to coordinator verification and integration.

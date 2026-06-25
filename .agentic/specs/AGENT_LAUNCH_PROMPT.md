# Agent launch prompt

Paste-ready prompt for dispatching a coding agent against a stream brief. Fill the brackets; keep the
GATES block verbatim.

```
========================================================
STREAM: <stream id> — <name>
========================================================

GATES (self-check BEFORE any work):
- WORKTREE: git worktree add ../.worktrees/<name> -b feat/<slug> main
  — verify HEAD == branch; never touch main or another worktree.
- IDENTITY: git config user.email fern@ndo.io && git config user.name "Fernando Santos";
  export the GIT_AUTHOR_*/GIT_COMMITTER_* vars; verify `git var GIT_AUTHOR_IDENT` shows
  fern@ndo.io. No Co-Authored-By. Never bypass hooks.
- TDD + mutation-verify: red->green per behavior; then break ONE load-bearing line, show the NAMED
  test that reds (file:line, before->after), revert. CI green (`npm test`) before the PR.
- PR: conventional title; `Closes #<issue>` in the BODY; --force-with-lease only.
  Body has "How tested" + "What was hard / non-obvious".
- (Add AUTHZ / MIGRATION lines from WORKFLOW.md if this stream touches those surfaces.)

REQUIRED READING (in order): .agentic/AGENTS.md, .agentic/WORKFLOW.md, the wave README, this brief.

SCOPE: <paste the brief's In scope / Out of scope>.

FIRST ACTION: <the brief's first action — usually the failing test>.

REPORT BACK (one message): branch, PR#, what shipped, the mutation-verify line (named test +
file:line), CI status, cross-stream flags.
========================================================
```

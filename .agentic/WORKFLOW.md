# WORKFLOW.md — the delivery loop and the GATES

## The delivery loop

```
Stream -> Coding Agent -> Pull Request -> Independent Reviewer -> (Changes -> re-review) -> Merge -> Cleanup
```

- **One tracking issue per stream**, linked from the PR body with `Closes #N`.
- **Every PR gets an independent reviewer** (an agent that did NOT write it). See `REVIEWING.md`.
- **Merge only on explicit, per-PR authorization** from the project owner or a recorded delegate.
  No delegates configured — the principal authorizes every merge. Approval of one PR does not extend to the next.
- Release tooling: **release-please**. HOLD for one consolidated release after a batch of PRs settles; vet every proposed version bump against the current manifest before merging — a bump proposing an already-released version is the tell that it's stale.
- **Retrospective at wave exit.** Before starting the next wave, answer in the wave README: what
  worked, what didn't, what to change. Lessons about *process* go here, not in `LEARNINGS.md` (which
  is for technical invariants).

## The GATES — self-check BEFORE and DURING every task

A GATE is a precondition you verify yourself, baked into the top of every dispatch. The point is to
make expensive failures impossible by construction, not to catch them in review.

- **WORKTREE.** Work in an isolated worktree off the base branch:
  `git worktree add ../.worktrees/<name> -b feat/<slug> main`. Verify HEAD is the
  new branch; never edit `main` directly or touch another worktree.
- **IDENTITY.** Set and verify the commit identity before every commit (agent runtimes often inject
  a wrong default):
  ```
  git config user.email fern@ndo.io && git config user.name "Fernando Santos"
  export GIT_AUTHOR_NAME="Fernando Santos" GIT_AUTHOR_EMAIL=fern@ndo.io \
         GIT_COMMITTER_NAME="Fernando Santos" GIT_COMMITTER_EMAIL=fern@ndo.io
  ```
  Then confirm `git var GIT_AUTHOR_IDENT` shows fern@ndo.io. No `Co-Authored-By` trailers.
- **TDD + mutation-verify.** Red -> green -> refactor (history visible). Then prove the test bites:
  break ONE load-bearing line, show the NAMED test going red (cite it file:line, before->after),
  revert to green. CI green (`npm test`) before opening the PR.
- **PR discipline.** Conventional-style title; body with a "How tested" section (command output) and
  a "What was hard / non-obvious" section; `Closes #N` in the BODY (not the title); push with
  `--force-with-lease` only, never plain `--force`; never bypass commit hooks.
- **REPORT BACK in one message:** branch, PR number, what shipped, the mutation-verify line,
  CI status, cross-stream flags.

## Merge & cleanup discipline

- `--force-with-lease` only. Never bypass hooks — fix the cause or stash; don't work around it.
- Audit branches (the reviewer's `*-review-audit`) are append-only, never force-pushed.
- **Cleanup is gated on VERIFIED merge state**, never on the merge command having returned. Confirm
  the PR's merged timestamp is non-null before deleting any branch or worktree.
- The full close-out, every time: verify merged -> delete the remote branch -> remove the merged
  worktree -> delete the local branch -> prune -> confirm the linked issue actually closed.
- **Live worktrees are off-limits** — never run worktree surgery while an agent may be running in
  one; confirm it's stopped first. A *merged* PR's worktree must be cleaned up.

## Standing canon

- **No estimates.** Never estimate time/effort/duration. Factual progress ("5 of 8 done") and
  calculated cost (tokens x rate) are fine; invented durations are not.
- **Stay inside the stack** (ADR required to change it).
- If blocked on an architectural decision outside your task's scope, stop and ask — don't guess.

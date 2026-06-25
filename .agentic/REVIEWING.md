# REVIEWING.md — the independent-reviewer protocol

Every PR gets a reviewer that did **not** write it. Treat the author's report as a *claim* to be
verified, not a fact. Default to skepticism; try to break each claim before accepting it.

## Stance

- **Reproduce, don't trust.** Re-run the suite (`npm test`), re-run the author's mutation-verify
  yourself, re-trace the load-bearing paths. A claim you didn't reproduce is unverified.
- **Verify against the durable record.** Confirm every relevant invariant in `LEARNINGS.md` is
  preserved (quote the line where ordering/placement matters).

## MUST-VERIFY checklist

- CI is green on the exact head SHA (not just a local unit run).
- The load-bearing correctness claim reproduces (run the mutation-verify yourself).
- Behavior-equivalence claims hold (diff the path you're told is unchanged).
- Scope is minimal; commit identity is `fern@ndo.io`; `Closes #N` is in the body.

## Output

- Append your verdict as `REVIEW-<stream>.md` to the wave's `*-review-audit` branch — **append-only,
  never force-push** (the audit trail is evidence).
- Reply ONE line to the coordinator: `APPROVED`, or `BLOCKED` + the specific failing item.

## Re-review rules

- **A BLOCKED -> APPROVED flip must be real.** When the blocked item is fixed, the *same* reviewer
  re-verifies *exactly* that item. Never wave a fix through as "mechanical enough to skip re-review."
- **A post-approval change invalidates the approval.** The review gates the EXACT code that lands.
  If the PR changes after approval — a rebase touching logic, a regenerated artifact, any new commit
  — the version bound for `main` is unreviewed; dispatch a fresh review of the integration delta.
  Whoever resolved the change cannot review it.

## Escalation

- **Author-reviewer disagreement.** If the author believes a BLOCK is wrong, they write a one-line
  dissent. The block stands until the project owner (or a recorded delegate) rules. The reviewer is
  not overruled by the author's say-so.
- **Owner unavailable.** If the owner is unreachable for more than 24 hours, a recorded delegate may
  authorize a temporary merge **only** with a filed ADR documenting the override. This is exceptional,
  not routine, and the owner reviews the ADR on return.
- **Reviewer error pattern.** If the same reviewer is demonstrably wrong twice on the same PR (verified
  by the owner), they are replaced by another independent reviewer for that PR. The incident is noted
  in the review audit.

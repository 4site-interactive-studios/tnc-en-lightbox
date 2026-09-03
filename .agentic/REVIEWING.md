# REVIEWING.md - hard-stream review contract

Only hard streams receive independent review. The reviewer did not write the change, treats the
author's report as a claim, and verifies the risky path under the real sandbox profile.

## Verify

- Re-run the exact focused verification and confirm CI state on the reviewed head.
- Trace the hard-risk path and every relevant `LEARNINGS.md` invariant.
- Confirm scope, generated artifacts, and behavior-equivalence claims.
- Report blocker findings only when the change is unsafe to integrate. Major and minor findings are
  follow-up notes and do not block green reversible integration.

## Output

Return exactly one canonical block:

```text
VERDICT: APPROVED|BLOCKED
FINDINGS:
- severity: blocker|major|minor | claim: <what is wrong> | evidence: <command and file:line>
```

`VERDICT: BLOCKED` requires at least one blocker finding. `VERDICT: APPROVED` uses `FINDINGS: NONE`.
Do not create review-audit branches or edit the worktree.

## Repair bound

A blocker receives at most one fresh same-lane repair followed by one re-review. If a blocker
remains, the coordinator chooses a separate fix-forward stream or asks the owner. A post-review
change to the risky path requires that one allowed re-review; never start another repair loop.

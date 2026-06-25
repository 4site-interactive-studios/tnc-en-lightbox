# LEARNINGS.md — durable, human-curated institutional memory

This is the **sole** durable memory tier for tnc-en-lightbox: invariants that must never be violated,
gotchas that have bitten the project, and historical fixes worth remembering. It is written through
normal PR review — never machine-injected, never edited by an autonomous agent.

How to use it:

- A lesson starts life in a PR's "What was hard / non-obvious" section. Promoting it here is a
  reviewed change like any other.
- Keep entries specific and load-bearing: cite file:line where placement matters; state the
  invariant *and* why violating it breaks something.
- Reviewers check that every relevant invariant here is preserved by the PR under review.

A freshness check (`tools/sdd/check_learnings_freshness.py`) warns in CI when this file has gone
dormant while source is actively changing. The warning is advisory — it never blocks a PR — but it
surfaces the silent rot of uncaptured lessons.

## Invariants (NEVER violate)

_None yet — this project hasn't earned its first invariant. Add them as concurrency/correctness
rules are discovered, each with a file:line anchor and the failure it prevents._

## Gotchas (have bitten us)

_None yet._

## Historical fixes / non-obvious code

_None yet._

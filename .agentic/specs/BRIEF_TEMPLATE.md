# <Stream ID> — <Stream Name>

**Wave:** <N> · **Branch:** `feat/<id>-<slug>` · **Depends on:** <streams/waves> ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), this brief.

## Goal
One paragraph: why this stream exists and what landing it unlocks. Concrete enough that an agent can
scope the work without re-reading the whole plan.

## In scope
Bullets: exactly what to build. Name filenames, modules, migrations.

## Out of scope
Bullets: what NOT to touch. A definite list prevents scope creep.

## Deliverables
Bullets: concrete artifacts (files, migrations, tests, docs).

## Acceptance criteria
- [ ] Each item checkable by reading the diff or running a command.
- [ ] Include a negative test (security/correctness).
- [ ] Include the test command: `npm test`.

## First action
The literal first commit instruction — almost always "write the failing test for X".

## Gotchas
Non-obvious traps, prior incidents, stream interactions. This becomes institutional memory — don't
skimp.

# wave-0 — Foundation

## Goal

Stand up the project foundation: a Vite build that compiles the TypeScript source plus inlined SCSS
into a single, minified, dependency-free JS file (committed to `dist/` for hosting), a Vitest + jsdom
test harness, npm scripts for test/lint/typecheck, and green SDD gates in CI. On top of that
skeleton, ship a minimal but real lightbox walking skeleton that mounts an overlay + 2-column dialog
from a global config object and closes via the ESC key, the top-right X button, and an overlay click,
with correct focus handling. Landing this unlocks the trigger, theming, and EN-integration waves,
since every later feature builds on this build pipeline, test harness, and core open/close lifecycle.

## Dependencies

- **Depends on:** none — this is the first wave.
- **Unlocks:** a buildable, testable, hostable lightbox core. wave-1 attaches behavior triggers to
  it, wave-2 themes/customizes its UI, wave-3 wires it into Engaging Networks page types and CTA
  routing.

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — Build pipeline & core lightbox | [stream-a](./stream-a.md) | merged (PR #2) |
| stream-b — Backfill: config seam, foundation contracts & a11y hardening | [stream-b](./stream-b.md) | merged (PR #8) |

> stream-b is the **wave-0 backfill** the master-plan gap audit surfaced (config-extension seam,
> `no-css-emitted`/`api-surface`/`config-schema` contracts, core a11y/UX slice). It must land before
> wave-1. See [ROADMAP.md](../ROADMAP.md) B1–B5.

## Exit criteria

- [x] `npm run build` emits a single minified, dependency-free JS file in `dist/` with SCSS inlined
      (no separate `.css`).
- [x] The core lightbox instantiates from the global config and closes via ESC, the X button, and an
      overlay click; focus is trapped while open and restored on close.
- [x] Vitest + jsdom suite is green and covers render, all three close paths, the inside-click
      no-close case, and focus trap/restore.
- [x] The `bundle` freshness contract is green (committed `dist/` matches source) and all SDD gates
      pass in CI.

## Retrospective

- **What worked:** TDD plus the `bundle` freshness contract did their job — the walking skeleton
  landed green with real, non-vacuous coverage (20 tests), and the independent-reviewer protocol
  caught a genuine integration discrepancy instead of rubber-stamping the author's report.
- **What didn't:** The coordinator merged a side governance PR (#3, the merge-commit policy) into
  `main` while the feature PR (#2) was still open off older `main`. The moved base made stream-a's
  diff-vs-main look like it *deleted* an out-of-scope rule, producing a false-positive review BLOCK
  that cost a full review cycle. (Also: the merge method wasn't in the canon at first — fixed by #3.)
- **What to change next wave:** Don't move the base under an open PR — land governance/docs PRs
  before opening feature PRs, or sync the feature branch with `main` (merge, not rebase) before
  dispatching review; and when the base has advanced, review the real 3-way merge result, not a
  two-dot `branch..main` diff.

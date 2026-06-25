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
| stream-a — Build pipeline & core lightbox | [stream-a](./stream-a.md) | planned |

## Exit criteria

- [ ] `npm run build` emits a single minified, dependency-free JS file in `dist/` with SCSS inlined
      (no separate `.css`).
- [ ] The core lightbox instantiates from the global config and closes via ESC, the X button, and an
      overlay click; focus is trapped while open and restored on close.
- [ ] Vitest + jsdom suite is green and covers render, all three close paths, the inside-click
      no-close case, and focus trap/restore.
- [ ] The `bundle` freshness contract is green (committed `dist/` matches source) and all SDD gates
      pass in CI.

## Retrospective (complete at wave exit)

- **What worked:** (1-2 bullets)
- **What didn't:** (1-2 bullets)
- **What to change next wave:** (1 bullet, actionable)

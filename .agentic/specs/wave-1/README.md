# wave-1 — Triggers

## Goal

Make the auto-instantiated (not-yet-opened) lightbox appear in response to user behavior and ensure
it never nags. A `src/triggers/` dispatcher reads trigger config, arms the requested triggers, fires
`open()` exactly once on the first match (any-of semantics, first-to-fire wins), then tears down all
listeners. Four trigger implementations (time-on-page, scroll-depth, inactivity, exit-intent) behind a
common interface. Frequency-capped dismissal via `localStorage` keyed per `location.pathname` with a
page-editor `frequencyDays` setting prevents re-showing within the cooldown window.

## Dependencies

- **Depends on:** wave-0 (core lightbox + build pipeline + test harness). The wave-0 backfill B1
  (config extension seam) is folded into this stream — `config.ts` carries empty extensible base
  interfaces that `src/triggers/` populates via declaration merging.
- **Unlocks:** wave-2 (theming) can assume triggers exist; wave-3 (EN integration) can gate trigger
  arming via EN eligibility (future `canArm` hook, not in this stream).

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — Trigger dispatcher, trigger set, frequency-capped dismissal & composition | [stream-a](./stream-a.md) | in progress |

## Exit criteria

- [ ] `npm test` green: dispatcher, all 4 triggers, frequency-capped dismissal, and composition
      (first-to-fire wins) covered by unit tests in jsdom.
- [ ] `npm run typecheck` and `npm run lint` clean; `npm run build` emits a single dependency-free
      JS file.
- [ ] `bundle-size` and `no-runtime-deps` contracts green.
- [ ] All four SDD gates green in CI.
- [ ] Mutation-verify: break one load-bearing line, show the named test go red, revert.

## Retrospective

_To be filled at wave exit._

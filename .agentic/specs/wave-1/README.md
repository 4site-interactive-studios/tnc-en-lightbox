# wave-1 — Triggers

## Goal

Make the lightbox fire itself on user behavior and respect a per-page display frequency, on top of
wave-0's core + backfill. A trigger engine opens the auto-instantiated lightbox when a configured
trigger fires (time-on-page, scroll-depth, inactivity, exit-intent), composes multiple triggers
(first-to-fire wins), and enforces a persistent, page-editor-configurable display frequency (default
once every 7 days) via localStorage so users aren't nagged. All work is deferred until a trigger is
armed. Landing this turns the static core into a campaign-ready behavioral overlay; wave-2 themes it,
wave-3 adds EN CTA semantics.

## Dependencies

- **Depends on:** wave-0 — the core `Lightbox` + `ENLightboxAPI` singleton, the config-extension seam
  (`TriggersConfigBase` etc., backfill stream-b), the a11y slice, and the foundation contracts.
  Triggers open the auto-instantiated instance; they never construct their own.
- **Unlocks:** behavior-driven display with frequency control. wave-2 themes the UI; wave-3 adds EN
  CTA routing + non-interference.

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — Behavior triggers, frequency-capped dismissal & composition | [stream-a](./stream-a.md) | merged (PR #11) |

## Exit criteria

- [x] Each of the four triggers opens the lightbox under its condition and not before (jsdom + fake
      timers / stubbed metrics / synthetic events).
- [x] Multiple triggers compose: first-to-fire opens once; the rest disarm.
- [x] Frequency cap enforced: localStorage, per `location.pathname`, configurable `frequencyDays`
      (default 7); within the window → not shown; past it / no record → shown; storage unavailable →
      fail open, never throws.
- [x] `bundle-size` (gzip-gated) and `no-runtime-deps` contracts added and green; bundle stays one
      dependency-free file with SCSS inlined; wave-0's tests stay green; all SDD gates green.

## Retrospective

- **What worked:** The coordinator's pre-review adversarial verification (5 lenses) caught a **HIGH**
  defect (sync-fire listener/timer leak) and a **MEDIUM** (corrupt-storage fail-closed) that CI *and*
  the author's 62 tests missed — both fixed before review, so the independent review was a clean
  confirm. The frequency-cap dismissal + trigger engine landed solid (65 tests, real mutation-verify).
- **What didn't:** The coding agent branched off a **stale `main`** (pre-backfill / pre-wave-1-entry)
  and had to merge `main` + resolve 5 conflicts — avoidable churn and risk (the merge verified clean,
  but it was an unnecessary hazard).
- **What to change next wave:** Strengthen the launch GATE from "branch off main" to "**`git fetch
  origin` && branch off `origin/main`**," and have the coordinator confirm the agent's reported base
  SHA == current `origin/main` *before* review — catch a stale base at dispatch, not in conflict
  resolution.

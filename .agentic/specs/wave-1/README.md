# wave-1 — Triggers

## Goal

Make the lightbox fire itself. On top of wave-0's open/close core, attach a behavior-trigger engine
that opens the auto-instantiated lightbox when a configured trigger fires — time-on-page,
scroll-depth, inactivity, or exit-intent — composes multiple triggers (first-to-fire wins), and
enforces session discipline so a dismissed lightbox never re-triggers in the same page/session. All
work is deferred until a trigger is armed. Landing this turns the static core into a campaign-ready
behavioral overlay; wave-2 then themes it and wave-3 wires it into Engaging Networks.

## Dependencies

- **Depends on:** wave-0/stream-a — the core `Lightbox` lifecycle and the `ENLightboxAPI` singleton
  (`getInstance()`/`init()`). Triggers open the auto-instantiated instance; they never construct
  their own.
- **Unlocks:** behavior-driven display. wave-2 customizes the UI of whatever the triggers open;
  wave-3 adds EN page-type / CTA semantics around it.

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — Behavior triggers, session dismissal & composition | [stream-a](./stream-a.md) | planned |

## Exit criteria

- [ ] Each of the four triggers (time-on-page, scroll-depth, inactivity, exit-intent) opens the
      lightbox under its condition and not before, verified in jsdom with fake timers / stubbed
      metrics / dispatched events.
- [ ] Multiple triggers compose: the first to fire opens the lightbox exactly once and the rest are
      disarmed (no double-open).
- [ ] Session dismissal is enforced: after any close path, no trigger re-opens the lightbox in the
      same page/session (`sessionStorage`, per-`pathname` key); a negative test proves re-arming
      in-session does not re-open.
- [ ] The build still emits one minified, dependency-free JS file with SCSS inlined; the `bundle`
      contract is green; wave-0's suite still passes; all SDD gates green in CI.

## Retrospective (complete at wave exit)

- **What worked:** (1-2 bullets)
- **What didn't:** (1-2 bullets)
- **What to change next wave:** (1 bullet, actionable)

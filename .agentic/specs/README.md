# Specs

One folder per **wave**; each wave has a `README.md` (goal, dependencies, exit criteria, retro) plus
one brief per **stream**. A brief follows `BRIEF_TEMPLATE.md`. To dispatch a coding agent against a
stream, use `AGENT_LAUNCH_PROMPT.md`.

Specs are governed by the `specs-must-change-with-src` gate via `../ownership.json`: changing
governed source requires changing its owning spec (or carrying the `[no-spec: <reason>]` waiver with
a reason). Keep status lines factual and minimal — the gate catches source-vs-spec drift, not stale
prose.

## Wave index

| Wave | Streams | Status |
|------|---------|--------|
| [wave-0](./wave-0/README.md) — Foundation | stream-a (build pipeline + core lightbox) | complete (PR #2) |
| [wave-1](./wave-1/README.md) — Triggers | time-on-page · scroll-depth · inactivity · exit-intent; dismiss-once-per-session; manual multi-trigger composition | in progress |
| wave-2 — Theming & layout | 2-col image+content, mobile stacking, hide-image-on-mobile toggle, multiple themes, full UI customization | planned |
| wave-3 — EN integration | page-type/page-ID detection, CTA redirect vs. close, no form interference, editor + advanced README | planned |

wave-0 is complete; wave-1 is scheduled (folder created). Later waves' folders are created when each
is scheduled (one wave at a time); the rows above are the roadmap.

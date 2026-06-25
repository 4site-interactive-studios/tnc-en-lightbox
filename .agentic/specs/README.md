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
| [wave-0](./wave-0/README.md) — Foundation | stream-a (core, PR #2) + stream-b (backfill) | stream-a merged; backfill planned |
| wave-1 — Triggers | time-on-page · scroll-depth · inactivity · exit-intent; dismiss-once-per-session; manual multi-trigger composition | planned |
| wave-2 — Theming & layout | 2-col image+content, mobile stacking, hide-image-on-mobile toggle, multiple themes, full UI customization | planned |
| wave-3 — EN integration | page-type/page-ID detection, CTA redirect vs. close, no form interference, editor + advanced README | planned |

wave-0 is complete. The full waves-1–4 **master plan** — decomposition, the holistic config +
`ENLightboxAPI` contract, the machine-checked contracts, and the NFR/use-case coverage matrix — lives
in [ROADMAP.md](./ROADMAP.md) (gap-audited; owner decisions recorded). Per-wave folders
(`wave-N/{README,stream-*}.md`) are scaffolded just-in-time at each wave entry per the plan.

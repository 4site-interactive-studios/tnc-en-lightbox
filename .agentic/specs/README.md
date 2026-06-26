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
| [wave-0](./wave-0/README.md) — Foundation | stream-a (core, PR #2) + stream-b (backfill, PR #8) | complete |
| [wave-1](./wave-1/README.md) — Triggers | time-on-page · scroll-depth · inactivity · exit-intent; frequency-capped dismissal (localStorage, default 7d); manual multi-trigger composition | complete (PR #11) |
| [wave-2](./wave-2/README.md) — Theming & layout | stream-a (layout + `--enlb-*` tokens + a11y/motion + secondary-CTA, PR #17) · stream-b (theme set + customization, PR #21) | complete |
| [wave-3](./wave-3/README.md) — EN integration | CTA redirect/close semantics (submit deferred) · no EN-form interference · editor + advanced README · remove inert `en` placeholder (by-hand targeting — no page detection) | in progress |

wave-0 is complete. The full waves-1–4 **master plan** — decomposition, the holistic config +
`ENLightboxAPI` contract, the machine-checked contracts, and the NFR/use-case coverage matrix — lives
in [ROADMAP.md](./ROADMAP.md) (gap-audited; owner decisions recorded). Per-wave folders
(`wave-N/{README,stream-*}.md`) are scaffolded just-in-time at each wave entry per the plan.

A committed **cross-browser-smoke mini-stream** (Playwright; NFR N5, Decision D3) runs **between
wave-1 and wave-2** — it validates the cumulative core + triggers in real browsers before theming
lands. See [cross-browser-smoke.md](./cross-browser-smoke.md).

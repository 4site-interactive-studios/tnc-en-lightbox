# wave-4 — Production hardening & release

## Goal

Take the functionally-complete library from "all features shipped" to "safe to deploy on live Engaging Networks pages, licensed, versioned, and hosted." A multi-lens release-readiness audit of the merged `main` (2026-06-26) found the build, bundle budget, and QA depth in good shape, but surfaced two classes of gap: (1) the "never break the host form / never throw" guarantee is **documented in EDITOR.md but not enforced in code**, and (2) standard release/packaging is absent (no LICENSE, version `0.0.0`, no tag/release, placeholder host URL). This wave closes both.

## Dependencies

- **Depends on:** wave-0 (core, build, contracts), wave-1 (triggers, dismissal), wave-2 (theming, layout, a11y), wave-3 (EN CTA semantics, non-interference, editor docs).
- **Unlocks:** a production-deployable release of the hardened artifact — licensed, versioned, hosted, and QA-gated at release time.

## Streams

| Stream | Brief | Status |
|--------|-------|--------|
| stream-a — Production hardening (error isolation, config tolerance, ordering, idempotency) | [stream-a](./stream-a.md) | in progress |
| stream-b — Release & packaging (LICENSE, versioning, hosting, release automation, CI/QA) | [stream-b](./stream-b.md) | planned (JIT after stream-a; needs owner decisions) |

**Sequencing:** stream-a (harden) **then** stream-b (release the hardened artifact). Don't cut a release before the hardening lands.

## Exit criteria

- [ ] The auto-init path and `open()` are wrapped so a malformed or hostile config can **never throw on the host page** (EDITOR.md's guarantee becomes true), proven by tests that feed wrong-typed configs and a forced throw.
- [ ] `normalizeConfig` degrades wrong-typed fields to defaults instead of throwing.
- [ ] A re-evaluated script (double injection) is a no-op — no destroy/recreate, no double-armed triggers — via a load-once sentinel, with a test.
- [ ] Auto-init tolerates reasonable config/script ordering and does not silently no-op; EDITOR.md states the ordering requirement explicitly.
- [ ] A LICENSE file exists and `package.json` license/version are real (off `UNLICENSED`/`0.0.0`); distribution terms match the hosted-asset model.
- [ ] A first version tag + GitHub Release ship `dist/en-lightbox.js` as a versioned, identifiable asset; EDITOR.md gives a concrete (non-placeholder) versioned embed.
- [ ] `release-please` is either implemented or its dangling reference removed from `sdd.config.json`/`WORKFLOW.md`.
- [ ] typecheck/lint/unit-tests run in CI; release-time QA re-runs build + smoke + a11y on the tagged ref.
- [ ] Stale `sessionStorage`/`enlb:dismissed:` references in the ROADMAP body are reconciled to the shipped `localStorage`/`enlb:shown:` reality.
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, e2e smoke all green; bundle stays within the gzip budget.

## Retrospective (complete at wave exit)

- **What worked:**
- **What didn't:**
- **What to change:**

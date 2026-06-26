# stream-b — Release & packaging (LICENSE, versioning, hosting, release automation, CI/QA)

**Wave:** 4 · **Branch:** `feat/wave-4-release` · **Depends on:** wave-4/stream-a (hardened artifact) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-4 README](./README.md), this brief.

> **Dispatched JIT after stream-a merges, and after the owner resolves the decision points below.** Several items are gate-arming (CI workflows, `.agentic/contracts/registry.json`, `sdd.config.json`) ⇒ the owner is a required reviewer (Decision D13), and release-config-only PRs touching `src/` carry `[no-test: release config]` (Decision D11).

## Owner decisions required before dispatch

- **License:** proprietary (keep `UNLICENSED` + add a proprietary copyright header naming the holder) **or** open (e.g. MIT / Apache-2.0 with a copyright line + valid SPDX id, flip `private:false`)?
- **Hosting target:** GitHub Release download URL, jsDelivr/unpkg pinned to a tag, or upload to the EN asset library?
- **release-please:** implement the declared automation, or drop the reference and keep a manual runbook?
- **npm publish:** out of scope unless the owner explicitly wants registry distribution.

## Goal

Cut the first production release of the hardened artifact: licensed, versioned, hosted at a concrete URL, and QA-gated at release time — replacing today's `0.0.0` / `UNLICENSED` / placeholder-URL state.

## In scope

- **License:** top-level `LICENSE` file + `package.json` `license` (valid SPDX or `UNLICENSED` with a proprietary header), per the owner decision.
- **Versioning:** set a real `package.json` version (off `0.0.0`); inject a `/*! tnc-en-lightbox vX.Y.Z | <license> */` banner into `dist/en-lightbox.js` via the Vite build so the deployed file is self-identifying; cut the first annotated git tag.
- **Release:** a GitHub Release on the tag with `dist/en-lightbox.js` attached as a versioned asset; a short `RELEASE.md` runbook.
- **Hosting docs:** replace the `cdn.example.com` placeholders in `EDITOR.md` with the chosen concrete versioned embed; add cache-busting + optional SRI guidance and a "how to update N pages" note.
- **release-please reconciliation:** implement (`release-please-config.json` + manifest + `.github/workflows/release.yml`) OR remove the dangling reference from `sdd.config.json` + `WORKFLOW.md:13`.
- **CI hardening:** wire `npm test` / `npm run typecheck` / `npm run lint` into CI; add a release-time job that re-runs build + cross-browser smoke + a11y on the tagged ref; add a real-browser axe scan (covers contrast/focus-visible the jsdom audit can't); give the `cross-browser-smoke` contract a non-empty `check` or document the required-status expectation.
- **Docs reconciliation:** update the stale `sessionStorage` / `enlb:dismissed:` references in the ROADMAP body to the shipped `localStorage` / `enlb:shown:` reality (per the wave-4 amendment).

## Out of scope

- npm registry publish (unless owner opts in).
- CSP `style` nonce support (BACKLOG).
- Visual / screenshot regression (BACKLOG).
- Any change to runtime behavior — stream-a owns hardening; this stream is packaging/docs/CI only.

## Deliverables

- `LICENSE`, updated `package.json`, `dist` version banner, first tag + GitHub Release, `RELEASE.md`, updated `EDITOR.md`, CI workflow changes, optional `release-please` config, ROADMAP dismissal reconciliation.

## Acceptance criteria

- [ ] `LICENSE` present; `package.json` license/version are real and consistent with the tag.
- [ ] `dist/en-lightbox.js` carries a version banner; bundle stays within budget.
- [ ] A GitHub Release exists with the versioned asset; `EDITOR.md` embed is concrete (no placeholder host).
- [ ] CI runs typecheck/lint/unit-tests; a release-time QA run is green on the tagged ref.
- [ ] `release-please` is implemented or its references removed (no dangling contradiction).
- [ ] ROADMAP body no longer contradicts the shipped dismissal mechanism.
- [ ] All contracts green; gate-arming changes reviewed by the owner.

## First action

Confirm the four owner decisions above are resolved, then add the `LICENSE` file and bump `package.json` version as the first commit (release-config; `[no-test: release config]` if it touches `src/`).

## Gotchas

- **Gate-arming files need owner review.** `.github/workflows/*`, `.agentic/contracts/registry.json`, `sdd.config.json`, `ownership.json` — registry checks run `shell=True` in CI (Decision D13).
- **The `bundle` contract rebuilds `dist` and diffs it.** A version banner changes `dist`; regenerate and commit it so the contract stays green, and keep the banner inside the gzip budget.
- **Don't reintroduce a runtime fetch.** SRI/hosting guidance is docs-only; the `no-runtime-fetch` contract still holds.
- **N5 independence (Decision D3).** The committed cross-browser smoke already satisfies the cross-browser NFR; release-time QA is a supplement, not a dependency — don't make N5 depend on wave-4.

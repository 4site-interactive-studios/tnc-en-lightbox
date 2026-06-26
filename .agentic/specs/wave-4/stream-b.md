# stream-b — Release & packaging (MIT license, versioning, EN hosting, release-please, CI/QA)

**Wave:** 4 · **Branch:** `feat/wave-4-release` · **Depends on:** wave-4/stream-a + stream-c (both merged) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-4 README](./README.md), this brief.

> **Decisions resolved (2026-06-26); ready to dispatch.** The artifact is hardened (stream-a) and Shadow-DOM isolated (stream-c). Several items here are GATE-ARMING (the new `.github/workflows/release.yml`, CI edits, `release-please` config) ⇒ the owner is a required reviewer (Decision D13). Release-config-only PRs touching `src/` carry `[no-test: release config]` (Decision D11).

## Owner decisions (RESOLVED 2026-06-26)

- **License: MIT.** Top-level `LICENSE` (MIT + copyright line); `package.json` `license: "MIT"`. **Keep `private: true`** — no npm publish; distribution is the GitHub Release + manual EN upload. (Repo is public, so the MIT license is consistent.)
- **Hosting: manual upload to the EN asset library.** The tagged GitHub Release holds the versioned `dist/en-lightbox.js` as the source-of-truth artifact; the editor downloads it and uploads to EN, then references the EN-hosted URL. (jsDelivr/raw on the public repo works as a fallback, but EN-manual is the chosen path.)
- **release-please: IMPLEMENT.** GitHub Release only — **no npm publish**.
- **npm publish: NO.**

## Goal

Cut the first production release of the hardened, isolated artifact: MIT-licensed, versioned, attached to a GitHub Release for manual EN upload, and QA-gated at release time — replacing today's `0.0.0` / `UNLICENSED` / placeholder-URL state.

## In scope

- **License (MIT):** top-level `LICENSE` (MIT + copyright line); `package.json` `license: "MIT"`; keep `private: true` (no npm).
- **Versioning:** set a real `package.json` version (e.g. `1.0.0`); inject a `/*! tnc-en-lightbox vX.Y.Z | MIT */` banner into `dist/en-lightbox.js` via the Vite build so the deployed file is self-identifying.
- **release-please (implement):** `release-please-config.json` + `.release-please-manifest.json` + `.github/workflows/release.yml` — on push to `main`, open a release PR (version bump + CHANGELOG); on merge, tag + create a GitHub Release with `dist/en-lightbox.js` attached. **GitHub Release only, no npm.** Satisfies the `sdd.config.json` `release_tool: release-please` declaration + the `WORKFLOW.md:13` manifest reference (no longer dangling).
- **EN hosting docs:** in `EDITOR.md`, replace the `cdn.example.com` placeholder with the real flow — download the versioned `dist/en-lightbox.js` from the GitHub Release, upload to the EN asset library, reference the EN-hosted URL; document per-release update + cache-busting (versioned filename or `?v=` query) and a "how to update across pages" note. Add a short `RELEASE.md` runbook (tag/release → download → upload to EN → update embeds).
- **CI hardening:** wire `npm test` / `npm run typecheck` / `npm run lint` into CI (a `ci.yml` on pull_request, or fold into existing); add a release-time job that re-runs build + cross-browser smoke + a11y on the tagged ref; optionally a real-browser axe scan; give the `cross-browser-smoke` contract a non-empty `check` or document the required-status expectation.

## Out of scope

- npm registry publish.
- CSP `style` nonce (BACKLOG).
- Visual / screenshot regression (BACKLOG).
- Any runtime behavior change — stream-a/c own the code; this stream is packaging/docs/CI only (`[no-test: release config]` for any `src/` touch such as the Vite banner).
- **Wave-exit governance docs** — handled by the coordinator after this merges (see below), NOT by this stream.

## Deliverables

- `LICENSE` (MIT), updated `package.json` (license + version, `private` kept), Vite version banner in `dist`, `release-please-config.json` + `.release-please-manifest.json` + `.github/workflows/release.yml`, CI test-wiring, updated `EDITOR.md` (EN hosting), `RELEASE.md`.

## Acceptance criteria

- [ ] `LICENSE` (MIT) present; `package.json` `license: "MIT"` + real version; `private: true` kept.
- [ ] `dist/en-lightbox.js` carries a `vX.Y.Z | MIT` banner; bundle stays within the 5200 B gzip budget.
- [ ] `release-please` config + manifest + `release.yml` present, configured for GitHub Release (no npm); workflow YAML is valid.
- [ ] `EDITOR.md` documents the real EN-upload flow + versioning/cache-busting (no `cdn.example.com` placeholder); `RELEASE.md` runbook present.
- [ ] CI runs typecheck/lint/unit-tests; a release-time QA path re-runs build + smoke + a11y.
- [ ] `api-surface` + `config-schema` snapshots byte-identical (no public surface change); all contracts green.
- [ ] Gate-arming changes (`release.yml`, CI, release-please config) reviewed by the owner.

## First action

Add the MIT `LICENSE` file and set `package.json` `license: "MIT"` + `version: "1.0.0"` as the first commit (release-config; `[no-test: release config]`).

## Gotchas

- **Gate-arming files need owner review.** `.github/workflows/*`, `release-please-config.json`, `.agentic/contracts/registry.json`, `sdd.config.json`, `ownership.json` (Decision D13).
- **The `bundle` contract rebuilds `dist` and diffs it.** The Vite version banner changes `dist`; regenerate + commit so the contract stays green, and keep the banner inside the **5200 B** gzip budget (currently 5055 B → ~145 B headroom; a short banner fits).
- **Don't reintroduce a runtime fetch.** Hosting/cache-busting guidance is docs-only; `no-runtime-fetch` still holds.
- **N5 independence (Decision D3).** The committed cross-browser smoke already satisfies the cross-browser NFR; release-time QA is a supplement, not a dependency.
- **release-please version source.** Bump `package.json` to the intended first version and set the release-please manifest to match, so its first release PR is consistent (a bump proposing an already-released version is the stale tell — WORKFLOW.md:13).

## Wave exit (coordinator, after this merges — NOT this stream)

The coordinator authors the wave-4 closeout docs PR: the wave-4 retro (in this README); promote the Shadow-DOM durable invariants to `LEARNINGS.md` (Decision D12 — background `inert` stays light-DOM / never inert the host; `:host{all:initial}` does NOT reset custom props so every consumed `--enlb-*` needs a `:host` default; focus trap reads `shadowRoot.activeElement`; dialog `overflow:visible` + inner `.enlb-scroll` so the outside abspos close isn't clipped; aria-labelledby/aria-label mutually exclusive); the ROADMAP dismissal-body reconciliation (`sessionStorage`/`enlb:dismissed:` → `localStorage`/`enlb:shown:`); `DOCS_AUDIT.md` re-true; README finale touch.

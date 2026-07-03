# release-dist-sync — Automate committed-dist rebuild on release PR

**Wave:** 5 · **Branch:** `ci/release-dist-sync` · **Depends on:** release-please workflow + committed-dist contract ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), [`REVIEWING.md`](../../REVIEWING.md), [`LEARNINGS.md`](../../LEARNINGS.md), [`RELEASE.md`](../../../RELEASE.md), this brief.

## Goal

Fix the release drift tracked in issue #53: release-please bumps `package.json` and `CHANGELOG.md`, but the committed `dist/en-lightbox.js` keeps the previous build-time version banner until a human rebuilds it. Landing this stream makes the open release PR carry the rebuilt, version-bannered dist artifact before merge, so `main` stays consistent with the existing `npm run build && git diff --exit-code dist/` contract while the existing release-time QA/upload job remains the source of the GitHub Release asset.

## In scope

- Modify `.github/workflows/release.yml` in the `release-please` job only: after `googleapis/release-please-action@v4`, add guarded steps that run only when `steps.rp.outputs.pr` is non-empty.
- Add `actions/checkout@v4` guarded by `if: ${{ steps.rp.outputs.pr }}` to check out the release PR head branch with `ref: ${{ fromJson(steps.rp.outputs.pr).headBranchName }}` and `token: ${{ secrets.GITHUB_TOKEN }}`.
- Add guarded Node setup (`actions/setup-node@v4`, Node 22, npm cache), `npm ci`, git identity setup (`Fernando Santos <fern@ndo.io>`), and a call to a local sync script.
- Create `tools/sdd/sync_release_dist.sh` containing the load-bearing logic: run `npm run build`, inspect `git diff --quiet -- dist/`, support a local `--check`/`--dry-run` mode that never commits or pushes, and in CI mode commit changed `dist/en-lightbox.js` with a `chore:` message and push only to the release-please PR branch.
- Add branch-safety checks in the script/workflow so push mode refuses `main`, detached HEAD, or a branch that does not match `fromJson(steps.rp.outputs.pr).headBranchName`.
- Add a workflow comment explaining why this exists: release-please updates version/changelog via API, but committed dist must be rebuilt on the release PR branch so the banner matches `package.json` after merge.
- Update `RELEASE.md` to document that the release PR is expected to include the auto-rebuilt committed dist, and that `release-qa` still rebuilds/tests/uploads the Release asset from the tag.
- Optional only: if evidence shows `contracts-check` still does not run on release-please PRs, note a safety-net follow-up or minimal existing-CI adjustment; do not make that the primary fix.

## Out of scope

- Do not change `vite.config.ts`, `versionBanner()`, banner semantics, package versioning, or the fact that `dist/en-lightbox.js` is committed.
- Do not change application source, runtime behavior, tests, SCSS, themes, public API, or bundle contents beyond generated release-PR dist rebuilds.
- Do not push to `main` from CI; this stream must push only to the release-please PR branch.
- Do not add new secrets, PATs, apps, or broader workflow permissions; keep the existing `GITHUB_TOKEN` and current `contents: write` / `pull-requests: write` scope.
- Do not add a `pull_request` trigger to `.github/workflows/release.yml` or otherwise create a workflow loop.
- Do not change `release-qa` behavior except to preserve it; it must still check out the tag, build, run e2e/a11y, and upload `dist/en-lightbox.js` as the Release asset.
- No migrations, auth systems, deployment targets, package-manager changes, or new runtime dependencies.

## Deliverables

- Modified `.github/workflows/release.yml` with release-PR-only checkout/setup/build/sync steps and an explanatory comment.
- New executable `tools/sdd/sync_release_dist.sh` with strict shell behavior, `--check`/`--dry-run`, branch guardrails, conditional `chore: rebuild dist banner for release` commit, and release-PR-branch push logic.
- Updated `RELEASE.md` release runbook section describing the committed-dist sync on release PRs.
- PR body with `Closes #53`, local dry-run/drift-detection evidence, actionlint evidence, normal test output, and a note that end-to-end verification completes on the next real release.
- No committed changes outside the workflow, script, and release docs unless the optional safety-net is explicitly justified in the PR body.

## Acceptance criteria

- [ ] GATES are satisfied: work stays on the orchestrator-provided `ci/release-dist-sync` branch with no new branch/worktree created by the coder; commit identity is verified as `Fernando Santos <fern@ndo.io>`; no `Co-Authored-By` trailers; PR body includes `Closes #53`; mutation-verify/dry-run evidence is recorded in the PR body; reviewer-security is expected because this is release infrastructure.
- [ ] `.github/workflows/release.yml` keeps `on: push` to `main` only, keeps job permissions minimal/unchanged, keeps `release-please` outputs/`release-qa` behavior intact, and adds no new `pull_request` trigger or loop.
- [ ] New release-please-job steps are all guarded with `if: ${{ steps.rp.outputs.pr }}` and use `fromJson(steps.rp.outputs.pr).headBranchName` for checkout/push targeting; on the merge run where `release_created == true` but `pr` is empty, the sync steps no-op.
- [ ] `tools/sdd/sync_release_dist.sh --check` is locally runnable and proves drift detection: mutate only the committed `dist/en-lightbox.js` banner, run the script, confirm it reports a dist diff/non-zero check without committing or pushing, then revert the mutation.
- [ ] Negative/security check: push mode refuses to operate on `main`, detached HEAD, or a branch mismatch; dry-run/check mode never commits or pushes even when `dist/` differs.
- [ ] Workflow YAML validates with `actionlint .github/workflows/release.yml` (or the exact project-equivalent actionlint command cited in the PR), and the shell script syntax validates with `bash -n tools/sdd/sync_release_dist.sh`.
- [ ] Project checks are green: `npm test` (required project test command), `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] `RELEASE.md` documents the new release-PR dist-sync step without changing the manual EN upload flow.
- [ ] The PR explains that the next real release is the final end-to-end proof, while local dry-run evidence verifies the load-bearing detect/build/commit path now.

## First action

First commit: create `tools/sdd/sync_release_dist.sh` with `--check`/`--dry-run` and branch-guard scaffolding, lint it with `bash -n tools/sdd/sync_release_dist.sh`, then prove the correctness check bites locally by temporarily mutating the committed `dist/en-lightbox.js` banner, running the script to see a reported dist diff/non-zero check, reverting the mutation, and committing only the script scaffold/evidence-ready behavior before touching `.github/workflows/release.yml`.

## Gotchas

- `release-please-action@v4` exposes `steps.rp.outputs.pr` as a JSON string for an open/updated release PR, with fields including `headBranchName`, `number`, and `baseBranchName`; it is empty when no release PR is open. Guard every new step with `if: ${{ steps.rp.outputs.pr }}` before using `fromJson(...)`.
- The release action currently needs no checkout because it uses the GitHub API. The new rebuild needs a checkout of the release PR head branch, not `main` and not the eventual tag.
- No CI loop: `release.yml` triggers on pushes to `main` only. Pushing a dist commit to the release-please branch should not re-trigger `release.yml`; do not add a `pull_request` trigger to this workflow.
- release-please may force-push/regenerate its branch on later runs. That is acceptable because the rebuild step runs after release-please in the same job and can recreate the dist commit as the branch tip each time.
- On the actual release merge run, `release_created == true` can coincide with no open release PR (`pr` empty). Do not depend on the sync step running then; the dist must already have been merged through the release PR.
- Use only the existing `GITHUB_TOKEN`; add no new secrets. `contents: write` is already present for release-please and is enough for the branch push. Do not broaden permissions.
- Security reviewers will scrutinize branch targeting. Never push to `main`; pushing to the release-please branch avoids branch-protection risk and keeps the dist rebuild reviewable in the release PR.
- `npm ci` + `npm run build` runs first-party code from the release PR branch. That is the intended supply-chain surface; keep action versions at their current major pins (`@v4`) and do not introduce unpinned third-party actions.
- The sync commit message must be `chore:` (for example, `chore: rebuild dist banner for release`) so release-please does not interpret it as a feature/fix bump.
- If release-please PRs still show no checks (historical evidence: PR #42 had no checks reported), treat CI-on-release-PR as an optional safety net or follow-up. The primary fix in this stream is the auto-rebuild on the release PR branch.

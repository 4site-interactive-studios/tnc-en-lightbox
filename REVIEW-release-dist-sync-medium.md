# REVIEW — wave-5 release-dist-sync (PR #54)

- **Reviewer:** independent (medium stream — correctness + release hygiene)
- **Review date:** 2026-07-02
- **PR:** #54 · `ci/release-dist-sync` · base `main` · `Closes #53`
- **Reviewed head:** `70821aa1e0ba6781d3210ef9c76d29296cafdd12` (70821aa)
- **Commits in range:** `ec56328` docs(spec) · `c753922` **feat(ci)** · `70821aa` ci(release)
- **Audit branch:** `wave-5-review-audit`
- **Verdict:** **BLOCKED** — spurious-version-bump hygiene defect (commit type `feat(ci):`)

Stance: reproduced every claim in my own workspace checkout — re-ran the suite
(205/205), re-ran the author's drift-detection mutation-verify myself, exercised the
script's branch-safety guards (detached HEAD + branch-mismatch), diffed the workflow's
`permissions:`/trigger against `main`, and inspected `release-please-config.json`. The
load-bearing script logic is **correct and verified**. One release-hygiene defect blocks.

---

## 0. BLOCKER — `feat(ci):` commit forces a spurious 1.2.0 release

**This is item #1 of the brief and it reproduces.**

- Commit `c753922` is titled **`feat(ci): add sync_release_dist.sh for release-PR dist rebuild`**.
- `release-please-config.json` is `release-type: node`, lists `feat` in `changelog-sections`,
  and has **NO scope-ignore / bump-suppression rules** (`grep -iE "scope|ignore|bump|separate"`
  → none). release-please uses Conventional Commits: any `feat:` → **MINOR** bump,
  **regardless of scope** (`(ci)` is irrelevant to the bump decision).
- This repo merges via **merge commits**, not squash — proven by `git log --merges --oneline
  -5 main` (`Merge pull request #52`, `…#42`, `…#50`, `…#48`, `…#46`). So the `feat(ci):`
  commit lands on `main`'s history verbatim, not absorbed into a re-titled squash.
- Consequence: the next `push: [main]` after this PR merges makes release-please scan
  `c753922 feat(ci): …` since tag `v1.1.0` → propose **v1.2.0** even though the shipped
  library (`dist/en-lightbox.js`) is byte-identical — pure CI tooling. This is exactly the
  version-banner/release-drift class of problem the PR exists to prevent; shipping a
  spurious minor would be self-defeating.

**Required fix (non-bumping):** retile the commit type to `ci:` or `chore:`. The other two
commits in the PR (`docs(spec):`, `ci(release):`) are already non-bumping, so only `c753922`
needs to change. This is a history rewrite of an unmerged PR branch — safe.

---

## 1. Setup / reproducibility

| Check | Result | Evidence / Command |
|-------|--------|--------------------|
| PR head is exactly the reviewed SHA | PASS | `git log main..70821aa --oneline` → ec56328, c753922, 70821aa |
| CI green on head 70821aa | PASS | `gh pr checks 54` → 6/6 pass (check, contracts, cross-browser-smoke, learnings-freshness, spec-coupling, test-coupling) |
| Commit identity `fern@ndo.io` | PASS | `gh pr view 54 --json commits` → all three authored `fern@ndo.io` / fernanDOTdo |
| `Closes #53` in body | PASS | PR body line 12 |

---

## 2. Base verification (re-run by reviewer in local workspace)

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` | PASS | 20 files, **205/205 passed** |
| `python3 tools/sdd/check_contracts.py` | PASS | all contracts OK (1 promise, no gate failures) |
| `bash -n tools/sdd/sync_release_dist.sh` | PASS | syntax OK |
| Committed dist fresh at v1.1.0 | PASS | `--check` baseline → exit 0, "dist is up-to-date" |

---

## 3. Drift-detection mutation-verify — REPRODUCED

Re-ran the author's exact proof on a non-`main` test branch (script refuses `main` by design).

1. **Baseline** (package.json `1.1.0`): `tools/sdd/sync_release_dist.sh --check` →
   `dist is up-to-date — no changes.` **exit 0** ✓
2. **Mutate** (`sed s/"1.1.0"/"9.9.9"/` package.json): `--check` →
   `dist has changed after rebuild.` + `::error::dist drift detected — run 'npm run build'
   and commit the result` **exit 1** ✓ (no commit, no push in `--check` mode — confirmed)
3. **Revert** package.json → `1.1.0`; rebuilt; `git diff --quiet -- dist/` clean ✓

The `git diff --quiet -- dist/` (worktree vs HEAD) detection path is sound and the
check-mode never reaches the `git add`/`commit`/`push` block (guarded by `if MODE==check`).
Mutation-verify holds.

---

## 4. Branch-safety guards — exercised

| Guard | Trigger | Result |
|-------|---------|--------|
| Detached HEAD | `git checkout --detach` then `--check` | `::error::refusing to operate on a detached HEAD` exit 1 ✓ |
| Branch mismatch | `--check --expected-branch main` on a feature branch | `::error::branch mismatch: on 'review-test-sync', expected 'main'` exit 1 ✓ |
| Refuse `main` | static: `if [[ "$CURRENT_BRANCH" == "main" ]]` (script L57-60) | code path verified; both modes run guards BEFORE build (L49-65 precede MODE branch) ✓ |

Guards run in **both** modes (they precede the build step), as the author claims.

---

## 5. Workflow logic correctness (release.yml)

- **Trigger unchanged / no loop:** `on: push: branches: [main]` only — diff vs `main` shows
  **no `pull_request` trigger added**. Pushing dist to the release-PR branch
  (`release-please--…`) does NOT re-trigger `release.yml`. ✓ (item 3)
- **Step guards:** all four new steps carry `if: ${{ steps.rp.outputs.pr }}`. On the merge
  run (`release_created==true`, no open PR) `steps.rp.outputs.pr` is empty → steps no-op
  cleanly (empty string is falsy in Actions `if:`). ✓ (items 2, 5)
- **`fromJson(...).headBranchName`:** correct field for `release-please-action@v4`'s `pr`
  output (a JSON string whose object carries `headBranchName`). Checkout + push both
  resolve the same branch name. ✓
- **Auth:** `token: ${{ secrets.GITHUB_TOKEN }}` on checkout so the subsequent `git push`
  is authenticated (the default `GITHUB_TOKEN` has `contents: write` + `pull-requests: write`
  per the job's `permissions:` block). ✓
- **Ordering:** new steps run AFTER `release-please-action@v4` in the same job, so
  `steps.rp.outputs.pr` is populated. ✓
- **Permissions unchanged:** job `permissions:` is `contents: write, pull-requests: write`
  — byte-identical to `main`'s `release.yml` (diff confirmed; not broadened). ✓ (item 6)
- **Never targets `main`:** checkout ref is the PR's `headBranchName`; script refuses `main`
  at L57. ✓
- **WHY comment present** (L23-30) referencing the drift + issue #53. ✓ (item 8)

---

## 6. Script push-mode correctness

- Builds → `git diff --quiet -- dist/` (no-op if clean) → `git add dist/en-lightbox.js` →
  `git commit -m "chore: rebuild dist banner for release"` → `git push origin "$CURRENT_BRANCH"`.
- Commit message is `chore:` (non-bumping) — so even when this commit lands on the
  release-please branch and is later merged, it contributes no version bump. ✓
- `set -euo pipefail` — fail-fast on any error. ✓

---

## 7. RELEASE.md / docs (item 8)

`RELEASE.md` updated (+2 lines) to reflect the auto-rebuild. Spec brief
`.agentic/specs/wave-5/release-dist-sync.md` present (+66 lines). WHY comment in workflow
present. ✓

---

## 8. Security flags (for the security-review pass; not blockers in this stream)

- No new secrets — only `GITHUB_TOKEN`. ✓
- Push target is the release-please PR branch only (script refuses main/detached/mismatch).
- Actions pinned to `@v4` (not floating `@main`/SHA-less). Note for the security pass:
  these are major-version tags, not SHA-pinned — confirm against the project's pinning policy.
- First-party code only; `npm ci` (not `npm install`) in CI. ✓

---

## 9. Non-blocking notes / end-to-end caveat

- The author and the brief both acknowledge end-to-end proof awaits the next real
  release-please run (the `--check` mutation-verify is the accepted substitute per brief
  item 9 — NOT a block).
- `actions/checkout@v4` with `ref: <branch>` leaves HEAD **attached** to that branch (the
  standard "checkout PR branch → commit → push" pattern), so the script's
  `git rev-parse --abbrev-ref HEAD` resolves to the branch name, not `HEAD`. The detached-HEAD
  guard will therefore not spuriously fire in CI. (Verified by reasoning from the ubiquitous
  checkout-and-push pattern; not a concern.)

---

## Verdict

**BLOCKED** on item #1 (release hygiene): commit `c753922` is `feat(ci):`, which under this
repo's `release-please-config.json` (node, no scope-ignore) and merge-commit strategy forces
a spurious **v1.2.0** release of a byte-identical library. **Required fix: retitle the commit
to `ci:` or `chore:` (non-bumping).** Everything else — workflow logic, script correctness,
drift-detection mutation-verify (reproduced), branch-safety guards (exercised), permissions,
no-loop trigger, CI green 6/6, 205/205 tests — is correct and verified. Re-review on the
flipped item only.

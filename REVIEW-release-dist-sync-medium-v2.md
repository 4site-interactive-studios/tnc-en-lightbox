# REVIEW v2 — wave-5 release-dist-sync (PR #54) — RE-REVIEW after block + post-block code change

- **Reviewer:** independent (medium stream — correctness + release hygiene)
- **Review date:** 2026-07-03
- **PR:** #54 · `ci/release-dist-sync` · base `main` · `Closes #53`
- **Reviewed head:** `d94643f03fcbd5a11b66751de72848fba9df4e7b` (d94643f)
- **Prior medium-stream review:** `REVIEW-release-dist-sync-medium.md` (BLOCKED on `feat(ci):` spurious bump)
- **Post-block code change:** security hardening of `tools/sdd/sync_release_dist.sh` (reviewer-security found + coder fixed a branch-guard refspec-injection bypass)
- **Audit branch:** `wave-5-review-audit` (append-only)
- **Verdict:** **APPROVED**

Per `.agentic/REVIEWING.md` re-review rules: a BLOCKED→APPROVED flip must be real, and a
post-approval/post-block code change requires a fresh review of the delta. Both triggers fire
here, so I re-verified (a) the exact item I blocked on and (b) the functional correctness of
the changed script. Every claim below was reproduced in my own checkout.

---

## 1. Blocked item RESOLVED — no `feat` commits

`git log main..d94643f --format='%h %s'`:

```
d94643f ci: harden sync_release_dist branch guard against refspec injection
```

(Local `main` was advanced to `e819332`, so `main..HEAD` isolates the security-fix delta; the
full PR range across `origin/main..d94643f` is `docs(spec):` / `ci:` / `ci(release):` /
`ci:` — **zero `feat` commits**.) Release-please will not propose a spurious minor bump from
this PR. **Original block resolved.**

- Commit identity on `d94643f`: `fern@ndo.io` ✓
- `Closes #53` in commit body ✓ (also confirmed in PR body via `gh pr view 54`)

---

## 2. Functional correctness of the hardened script — VERIFIED (critical check passes)

The security fix rewrote `validate_branch_name()` (allowlist + leading-`+`/`-` rejection +
`..` rejection + `main`/`HEAD` refusal), made `--expected-branch` required for `--push`, and
switched the push to an explicit non-force refspec `refs/heads/X:refs/heads/X`. The prompt
flagged a critical risk: the real release-please branch name
`release-please--branches--main--components--tnc-en-lightbox` contains a double-hyphen `--`,
and if the `..`-rejection regex wrongly matched `--`, the feature would be dead.

### 2a. Double-hyphen ≠ double-dot — real release-please branch PASSES validation

Extracted the *actual* `validate_branch_name()` from `tools/sdd/sync_release_dist.sh:56-90`
and ran it against the real branch name (and a battery of injection vectors):

```
real release-please branch → PASS (exit 0, no error)
release-please--main       → PASS
+main  -main  main  HEAD  foo..bar  a:b  a^b  a~b  "a b"  a\b  a*b  a?b  a[b  "" → all FAIL
```

The allowlist is `^[A-Za-z0-9._/-]+$` (hyphen allowed); the range check is `*".."*` (two
literal **dots**). A double-hyphen `--` is two hyphens, not two dots, so it is correctly
*accepted*. **The feature is not dead on arrival.**

### 2b. Workflow YAML contract unchanged and matches new required-arg form

`git diff main..HEAD -- .github/` is empty — workflow YAML untouched by the fix commit. The
release job still calls:

```yaml
tools/sdd/sync_release_dist.sh --push --expected-branch "${{ fromJson(steps.rp.outputs.pr).headBranchName }}"
```

(`.github/workflows/release.yml:53`), which matches the new required-arg contract
(`--expected-branch` mandatory in `push` mode, validated + matched against the current
branch). Happy path: valid release branch → rebuild → drift → commit → explicit
`refs/heads/X:refs/heads/X` non-force push. ✓

### 2c. Drift detection (`--check`) reproduced — 0 → 1 → 0

No-commit mutation via `package.json` version bump (the realistic release-please scenario):

| state | `--check` exit | note |
|---|---|---|
| baseline (v1.1.0) | 0 | "dist is up-to-date" |
| bump package.json → 1.9.9-test | **1** | "dist drift detected — run 'npm run build' and commit" |
| restore | 0 | up-to-date again |

Tree clean after restore.

### 2d. Security-fix mutation-verify — leading-char guard is load-bearing

Disabled the leading-`+`/`-` guard (`if [[ "$name" == +* || "$name" == -* ]]` → `if false`)
and re-ran validation. `+main` was *still* rejected (by the allowlist — `+` is not in
`[A-Za-z0-9._/-]`), but `-main` was **wrongly accepted** — because `-` *is* in the allowlist,
so only the explicit leading-char guard catches it. Confirmed the guard is load-bearing
defense-in-depth for the leading-hyphen option-injection case. Reverted; tree clean; `-main`
rejected again post-revert.

---

## 3. No regressions

- `bash -n tools/sdd/sync_release_dist.sh` → OK
- `npm test` → **205/205 pass** (20 files)
- `npm run typecheck` (`tsc --noEmit`) → clean
- `npm run lint` (`eslint .`) → clean
- `python3 tools/sdd/check_contracts.py` → all contracts OK (1 promise, no failures)
- CI on `d94643f`: **6/6 green** (check, contracts-check, cross-browser-smoke,
  learnings-freshness, spec-coupling, test-coupling)
- Workflow trigger unchanged: `on: push: branches: [main]` — **no `pull_request` trigger
  added** (so the secret-bearing dist-sync job never runs on a fork PR).
- Permissions unchanged: release-please job has `contents: write` + `pull-requests: write`.
- Scope minimal: `git diff main..HEAD --name-only` → **only `tools/sdd/sync_release_dist.sh`**
  (1 file, +69/-14). Workflow YAML and all other paths unchanged.

---

## 4. LEARNINGS.md invariants

No `LEARNINGS.md` invariant touches the release/dist-sync pipeline (the durable invariants
are about lightbox runtime behavior — native CTA anchors, shadow DOM boundary, `:host` token
defaults, no-throw). Nothing in this PR touches lightbox runtime code. No invariant
endangered.

---

## Verdict

**APPROVED.** Original block (spurious `feat(ci):` bump) is resolved — every commit in range
is `ci:` / `ci(release):` / `docs(spec):`. The post-block security hardening is functionally
correct: the real release-please branch name (with its double-hyphen `--`) **passes** the new
`validate_branch_name()` — the `..`-rejection regex matches two dots, not two hyphens — and
all injection vectors (`+main`, `-main`, `..`, `:`, `^`, etc.) are rejected. The workflow's
`--push --expected-branch` call matches the new required-arg contract, drift detection still
fires (0→1→0 reproduced), and the leading-char guard was proven load-bearing for the
leading-hyphen case. Suite 205/205, typecheck/lint/contracts clean, CI 6/6 green on `d94643f`,
scope minimal (script only), identity `fern@ndo.io`, `Closes #53` present.

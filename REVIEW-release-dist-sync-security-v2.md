# Security re-review v2 — release dist sync branch guard

Verdict: APPROVED

Head reviewed: `d94643f03fcbd5a11b66751de72848fba9df4e7b` (`ci: harden sync_release_dist branch guard against refspec injection`).

Scope: re-verified the prior BLOCK on `tools/sdd/sync_release_dist.sh` branch/refspec injection and probed adjacent bypasses.

Evidence:

- Read `.agentic/REVIEWING.md`, `.agentic/LEARNINGS.md`, `.agentic/WORKFLOW.md` before review.
- `bash -n tools/sdd/sync_release_dist.sh` exited 0.
- CI on PR #54 head `d94643f03fcbd5a11b66751de72848fba9df4e7b`: 6/6 green (`check`, `cross-browser-smoke`, `spec-coupling`, `contracts-check`, `test-coupling`, `learnings-freshness`).
- Commit identity verified: Fernando Santos `<fern@ndo.io>`; body includes `Closes #53`; fix commit changes only `tools/sdd/sync_release_dist.sh`.
- Reproduced the old failure in an isolated local bare remote: the parent script at `e819332` on branch `+main` with a distinct local `main` sentinel exited 0 and `git push origin "+main"` force-updated remote `main` to the local sentinel.
- Re-ran the same exploit against `d94643f`: branch `+main` with `--expected-branch "+main"` exited 1 on the leading-`+` guard; remote `main` and local `main` remained unchanged.
- Confirmed layered refspec defense in the same harness: direct `git push origin "refs/heads/+main:refs/heads/+main"` pushed `+main` as its own branch and did not touch `main`.
- Probed invalid expected-branch values in push mode: empty, leading `+`, leading `-`, `:`, `~`, `^`, `*`, `?`, `[`, backslash, whitespace, tab/control, `..`, exact `main`, exact `HEAD`, `@`, `{`, unicode, and embedded refspec-like `x:refs/heads/main`; all exited non-zero before build/push.
- Verified `--push` without `--expected-branch` exits non-zero and spoofed valid expected branch exits non-zero on exact-match mismatch.
- Verified `main` and detached `HEAD` are rejected in `--check`; verified current/expected `+main` are rejected in `--check` too.
- Probed names called out for bypass attempts: `refs/heads/main` and `heads/main` do not touch `main` (API-style expected names mismatch; spoofed abbrev names still fail without touching `main`); `main-suffix`, `release-please--main`, `tags/main`, `feature/mainish`, and a 180-character branch component pushed only to their own fully-qualified `refs/heads/...` branch and left `main` unchanged; `tags/main` did not create/update `refs/tags/main`.
- Traced `sync_release_dist.sh`: only one git write path after validation (`git add`, `git commit`, `git push origin "refs/heads/${CURRENT_BRANCH}:refs/heads/${CURRENT_BRANCH}"`); no bare `$CURRENT_BRANCH` push remains.
- Rechecked release workflow security properties: `release.yml` triggers only `on: push` to `[main]`; no `pull_request`/`pull_request_target`; secrets are only `${{ secrets.GITHUB_TOKEN }}`; job permissions remain scoped as before; actions are pinned `@v4`/`@v5`; pushing the release PR branch does not re-trigger `release.yml`.

No residual path found to push to `main`, force-push, skip validation, or push to an unintended remote ref under the workflow threat model.

# Security review — PR #54 release-dist-sync

Verdict: **BLOCKED** (head `e819332908bb82f2a7be58daabd055bea45a6c6a`).

Finding: push-target guard is bypassable because the script pushes with a caller/current-branch refspec:

```bash
git push origin "$CURRENT_BRANCH"
```

A valid branch name beginning with `+` is interpreted by `git push` as refspec syntax, not as the current branch name.  Therefore a current branch named `+main` passes the script's guards (`CURRENT_BRANCH != main`, expected branch matches `+main`) but `git push origin '+main'` force-pushes local `main` to remote `main` instead of pushing the current branch/HEAD.

Reproduced safely against a temporary bare remote:

1. Created a temp bare remote/work clone from PR #54.
2. Created a sentinel local `main` commit (`c77110e`) that was not on remote `main`.
3. Checked out a branch named `+main` at PR head `e819332`.
4. Mutated `package.json` version to `9.9.9` to force a dist diff.
5. Ran:

```bash
tools/sdd/sync_release_dist.sh --push --expected-branch '+main'
```

Observed output:

```text
sync_release_dist: pushing to '+main'…
To /var/.../pr54-plusmain-remote.git
   91de27c..c77110e  main -> main
sync_release_dist: pushed.
```

Afterward the temp remote's `main` was `c77110e`, while the current `+main` branch tip was the separate dist-sync commit `e9beef0`.  This proves a path that passes the branch guard can push to `main`, violating the security must-verify push-target invariant.  The push needs an explicit destination that cannot be parsed as caller-controlled refspec syntax (for example `HEAD:refs/heads/<validated-release-branch>`) and/or a stricter release-branch allowlist before this is safe.

Other checks performed before blocking: PR head/CI verified (`gh pr checks 54`: 6/6 pass on `e819332`), `release.yml` remains `on: push` to `main` only, no new secrets beyond `GITHUB_TOKEN`, workflow permissions remain `contents: write` / `pull-requests: write`, `bash -n` and `actionlint` passed, `npm test` / `npm run typecheck` / `npm run lint` passed, `--check` drift detection went red when `package.json` version was mutated and returned clean after restore, and the `main`, detached-HEAD, and branch-mismatch guards were reproduced (including mutation-proving the mismatch/main/detached guards are load-bearing).  These do not override the push-target bypass above.

# REVIEW — docs(agents): correct mobile-image default to off (PR #52)

- **Reviewer:** independent
- **Review date:** 2026-07-02
- **PR:** #52 · `docs/agents-mobile-default` · base `main`
- **Reviewed head:** `85e954c2f15b8213c2e3868ec860626ae05f8a7f` (85e954c)
- **Audit branch:** `wave-5-review-audit`
- **Verdict:** BLOCKED

---

## 1. Change verification

| Check | Result | Evidence |
|-------|--------|----------|
| PR diff is exactly one line in `.agentic/AGENTS.md` | PASS | `gh pr diff 52` shows `+1 / -1` only: `(on by default)` → `(off by default)` |
| Factual accuracy: `hideImageOnMobile` defaults to `false` | PASS | `src/config.ts:61` `src.hideImageOnMobile ?? false`; `src/themes/config.ts:99` `src.hideImageOnMobile ?? topLevelHideImageOnMobile` |
| EDITOR.md / CLIENT_GUIDE.md consistency | PASS | EDITOR.md:62/84/175 and CLIENT_GUIDE.md:133/331 all state default `false` / image shows on mobile |
| `Closes #51` in PR body | PASS | `gh pr view 52 --json body` |
| Commit identity is `fern@ndo.io` | PASS | `git log -1 --format='%ae' 85e954c` → `fern@ndo.io` |
| Scope minimal (docs-only) | PASS | Only `.agentic/AGENTS.md` touched; no code/test/bundle changes in PR |

---

## 2. Why BLOCKED

### 2a. CI is not green on the exact head SHA

`gh pr view 52 --json statusCheckRollup` reports `mergeStateStatus: UNSTABLE` and the `contracts-check` gate completed with `FAILURE`.

Reproduced locally with `python3 tools/sdd/check_contracts.py`:

```
FAIL      bundle (`npm run build && git add -AN && git diff --exit-code dist/`)
```

The drift is a stale version banner in the committed artifact:

- `package.json` version is `1.1.0`.
- Committed `dist/en-lightbox.js` banner reads `/*! tnc-en-lightbox v1.0.0 | MIT */`.
- Running `npm run build` regenerates the banner to `v1.1.0`, producing a diff.

This failure is **not caused by the doc edit itself** (the PR touches only `.agentic/AGENTS.md`), but it makes the head SHA red. Per `.agentic/REVIEWING.md` the reviewer must see CI green on the exact head SHA; that gate is not met.

### 2b. `sdd.config.json` still says `(on by default)`

`stack.nfrs` in `sdd.config.json` duplicates the responsive NFR and still reads:

> with an optional toggle to hide the image on mobile (on by default)

This contradicts the corrected `.agentic/AGENTS.md` and leaves agent-facing configuration inconsistent.

---

## 3. Reproduction commands

```bash
gh pr diff 52
gh pr view 52 --json statusCheckRollup,mergeStateStatus
python3 tools/sdd/check_contracts.py
grep -n "on by default" sdd.config.json
```

---

## 4. Path to approval

Either:

1. Fix the pre-existing bundle drift on `main` (rebuild `dist/en-lightbox.js` so its banner matches `package.json` `1.1.0`) and rebase this docs branch, **or**
2. Regenerate `dist/en-lightbox.js` on this branch (accepting that the PR will no longer be strictly docs-only) and also update `sdd.config.json` `stack.nfrs` to match `(off by default)`.

After the head SHA is green and `sdd.config.json` is consistent, re-request review.

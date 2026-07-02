# RE-REVIEW — docs/agents): correct mobile-image default to off (PR #52)

- **Reviewer:** independent
- **Review date:** 2026-07-02
- **PR:** #52 · `docs/agents-mobile-default` · base `main`
- **Reviewed head:** `c9340e8bd1b7aee0af0f1c45a9f31e13dadff6c3` (c9340e8)
- **Audit branch:** `wave-5-review-audit`
- **Verdict:** APPROVED

---

## 1. Re-verification of prior block items

| Check | Result | Evidence |
|-------|--------|----------|
| Bundle drift resolved | PASS | `npm run build && git diff --exit-code dist/` produces no diff; committed `dist/en-lightbox.js` banner is `/*! tnc-en-lightbox v1.1.0 \| MIT */` |
| `bundle` contract passes | PASS | `python3 tools/sdd/check_contracts.py` reports `OK bundle` and all other gates green |
| CI `contracts-check` green on exact head | PASS | `gh pr checks 52` shows `contracts-check pass` for `c9340e8` |
| `sdd.config.json` NFRs consistent | PASS | `stack.nfrs` now reads `(off by default)`; `node -e "JSON.parse(...)"` validates |
| `sdd.config.json` matches AGENTS.md | PASS | Both state the mobile image toggle is `(off by default)` |

---

## 2. Additional verification

| Check | Result | Evidence |
|-------|--------|----------|
| AGENTS.md factual accuracy | PASS | `src/config.ts:61` `src.hideImageOnMobile ?? false`; `.agentic/AGENTS.md:16` says `(off by default)` |
| Scope minimal | PASS | `git diff --stat main...c9340e8` shows exactly 3 files: `.agentic/AGENTS.md`, `dist/en-lightbox.js`, `sdd.config.json` |
| CI all green on exact head | PASS | `gh pr checks 52` reports 6/6 checks passing |
| Commit identity | PASS | `git log -3 --format='%ae' c9340e8` → `fern@ndo.io` for all three commits |
| PR body close keyword | PASS | `gh pr view 52 --json body` contains `Closes #51` |
| Dist commit conventional type | PASS | `e8cf623` message is `chore: rebuild dist with v1.1.0 banner (post-release sync)` — will not trigger a release bump |

---

## 3. Reproduction commands

```bash
git checkout c9340e8
npm run build
git diff --exit-code dist/
python3 tools/sdd/check_contracts.py
node -e "JSON.parse(require('fs').readFileSync('sdd.config.json','utf8')); console.log('valid')"
grep -n "off by default" sdd.config.json .agentic/AGENTS.md
git diff --stat main...c9340e8
gh pr checks 52
gh pr view 52 --json body
```

---

## 4. Notes

- This review is the re-review required by `.agentic/REVIEWING.md` after the prior BLOCKED verdict on `85e954c`. The two blocked items (bundle freshness and `sdd.config.json` inconsistency) were fixed in `e8cf623` and `c9340e8` respectively and have been independently reproduced above.
- No mutation-verify was required: the changes are docs/config text plus a mechanical dist rebuild.

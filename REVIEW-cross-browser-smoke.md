# REVIEW — cross-browser-smoke mini-stream (PR #14)

- **Reviewer:** independent
- **Review date:** 2026-06-25
- **PR:** #14 · `feat/cross-browser-smoke`
- **Reviewed head:** `4ff1d2670c16dad1f377c91d32b8c2f4b35f7d7f`
- **Worktree:** `/Users/fernando/sites/.worktrees/xbrowser-review` (detached HEAD)
- **Base:** `origin/main` (`5dc52e2`)
- **Verdict:** APPROVED

---

## 1. Setup / reproducibility

| Check | Result | Evidence |
|-------|--------|----------|
| Detached worktree at exact head | PASS | `git worktree add --detach ../.worktrees/xbrowser-review 4ff1d26`; `git rev-parse HEAD` = `4ff1d2670c16dad1f377c91d32b8c2f4b35f7d7f` |
| Clean dependency install | PASS | `npm ci` completed, 0 vulnerabilities |

---

## 2. Unit / build untouched

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` | PASS | 10 test files, 65 tests passed (vitest run) |
| `npm run typecheck` | PASS | `tsc --noEmit` clean, exit 0 |
| `npm run lint` | PASS | `eslint .` clean, exit 0 |
| `npm run build` | PASS | single artifact `dist/en-lightbox.js`; 8.93 kB raw / 3.09 kB gzip; exit 0 |
| Build output byte-identical | PASS | `git status` clean after build — committed `dist/` unchanged (no src/ changes) |
| `python3 tools/sdd/check_contracts.py` | PASS | 6 OK (bundle, no-css-emitted, api-surface, config-schema, bundle-size, no-runtime-deps) + 1 PROMISE |
| cross-browser-smoke is a PROMISE | PASS | `PROMISE cross-browser-smoke (no check command)` — reported not run; `check` field is `""` in registry.json |

---

## 3. e2e actually runs + bites

| Check | Result | Evidence |
|-------|--------|----------|
| `npx playwright install --with-deps` | PASS | browsers installed for chromium, firefox, webkit |
| `npm run e2e` — full matrix | PASS | 35 passed, 1 skipped (exit 0); 36 tests = 9 specs × 4 projects |
| chromium | PASS | 9/9 passed |
| firefox | PASS | 9/9 passed |
| webkit (Safari) | PASS | 9/9 passed |
| Mobile Chrome (Pixel 5) | PASS | 8/9 passed, 1 skipped (exit-intent desktop-only) |
| exit-intent skipped on Mobile Chrome WITH reason | PASS | `test.skip(testInfo.project.name === 'Mobile Chrome', 'exit-intent is desktop-only')`; output: `- [Mobile Chrome] exit-intent trigger opens in desktop browsers` |

### 3a. Mutation verification — spec bites

| Check | Result | Evidence |
|-------|--------|----------|
| Removed `triggers: { time: 50 }` from "lightbox opens on time trigger" spec (no trigger → lightbox never opens) | RED as required | `expect(locator).toBeVisible() failed` — `element(s) not found`, timeout 5000ms, exit 1 |
| Reverted mutation | GREEN | `1 passed` on chromium, exit 0 |

The smoke is NOT vacuous: removing the trigger causes the "opens" assertion to fail.

---

## 4. CI verification

| Check | Result | Evidence |
|-------|--------|----------|
| `gh pr checks 14` — all 5 green on 4ff1d26 | PASS | contracts-check (pass), cross-browser-smoke (pass), learnings-freshness (pass), spec-coupling (pass), test-coupling (pass) |
| Dedicated `cross-browser-smoke` workflow exists | PASS | `.github/workflows/cross-browser.yml`: own job, steps: checkout → setup-node → `npm ci` → `npm run build` → `npx playwright install --with-deps` → `npm run e2e` |
| Playwright NOT in contracts-check job | PASS | `sdd-gates.yml` contracts-check: `npm ci` + `python3 tools/sdd/check_contracts.py` only — no browser install; registry entry `check` is `""` so check_contracts.py skips it |

---

## 5. No src/ changes / zero runtime deps / snapshots untouched

| Check | Result | Evidence |
|-------|--------|----------|
| No src/ changes | PASS | `git diff --name-only origin/main...HEAD -- 'src/*'` → empty |
| Shipped bundle behavior unchanged | PASS | build produces byte-identical `dist/en-lightbox.js`; `git status` clean post-build |
| Snapshots untouched | PASS | `git diff --name-only origin/main...HEAD -- '.agentic/contracts/snapshots/*'` → empty |
| Zero runtime deps | PASS | `package.json` has no `dependencies` field; `@playwright/test` in `devDependencies` only |

---

## 6. Harness verification

| Check | Result | Evidence |
|-------|--------|----------|
| Harness loads BUILT dist | PASS | `e2e/harness.html:43` — `<script src="/dist/en-lightbox.js"></script>`; server.mjs serves from repo root |
| `window.ENLightbox` set BEFORE dist script | PASS | `e2e/harness.html:24-42` inline `<script>` sets `window.ENLightbox` before line 43 `<script src>` — correct auto-init ordering |
| Config via cfg query param | PASS | `harness.html:25-33` reads `params.get('cfg')`, `atob` + `JSON.parse`; `helpers.ts` provides `encodeConfig` (base64url) + `harnessUrl` |
| Server has path-traversal protection | PASS | `e2e/server.mjs:24-28` — `fullPath.startsWith(root)` guard |

---

## 7. Spec coverage (9 specs)

| # | Spec | Behavior | Assertion type |
|---|------|----------|---------------|
| 1 | lightbox opens on time trigger | trigger open | `toBeVisible()` on `.enlb-overlay` |
| 2 | renders overlay, dialog, two-column layout and close button | render + mobile hide-image | `toBeVisible`, `toHaveAttribute('role','dialog')`, `toHaveAttribute('aria-modal','true')`, `toBeVisible`/`toBeHidden` on image (project-aware) |
| 3 | closes via Escape key | close path 1 (ESC) | `toHaveCount(0)` on overlay after `keyboard.press('Escape')` |
| 4 | closes via close button | close path 2 (X) | `toHaveCount(0)` after `.enlb-close` click |
| 5 | closes via overlay click | close path 3 (backdrop) | `toHaveCount(0)` after overlay click at position |
| 6 | focus moves inside dialog when opened | focus-in | `toBeFocused()` on `.enlb-dialog` |
| 7 | frequency dismissal suppresses re-open within window | frequency suppression across reload | `toBeVisible` → ESC → `toHaveCount(0)` → reload → `toBeHidden` |
| 8 | exit-intent trigger opens in desktop browsers | exit-intent desktop-only | `toBeVisible` after `mouseout` dispatch; skipped on Mobile Chrome with reason |
| 9 | scroll-depth trigger opens after scrolling | scroll-depth | `toBeVisible` after `scrollTo(0, maxScroll * 0.5)` |

All 9 specs assert real visibility/attributes, not trivially-true conditions.

---

## 8. Config changes scoped

| Check | Result | Evidence |
|-------|--------|----------|
| tsconfig adds e2e to typecheck only | PASS | `include` adds `"playwright.config.ts"`, `"e2e/**/*.ts"`; vite lib entry unchanged (`./src/index.ts`) → e2e never bundled |
| eslint change scoped | PASS | added `'**/*.spec.ts'` to test rules block; added `'e2e/**/*.mjs'` to mjs languageOptions; added `URL: 'readonly'` global (needed by server.mjs) |
| .gitignore ignores playwright artifacts | PASS | added `playwright-report/` + `test-results/` under "# Playwright" |

---

## 9. Hygiene

| Check | Result | Evidence |
|-------|--------|----------|
| CI green on exact head SHA | PASS | `gh pr checks 14` — all 5 pass on `4ff1d26` |
| `Closes #13` in PR body | PASS | PR body first line: `Closes #13` |
| Both commits fern@ndo.io (author+committer) | PASS | `git log --format=full`: both commits `Author: Fernando Santos <fern@ndo.io>` / `Commit: Fernando Santos <fern@ndo.io>` |
| No Co-Authored-By | PASS | full commit log shows no trailers; commit bodies empty |
| TDD red→green | PASS | `16d9a4f` (RED): single spec with no trigger → fails; `4ff1d26` (GREEN): adds triggers + full 9-spec matrix + CI + registry |
| Base was current origin/main | PASS | `git merge-base --is-ancestor origin/main HEAD` = exit 0; only 2 commits between origin/main and HEAD |
| Scope minimal — no bug fixes smuggled | PASS | no src/ changes; all diffs are additive (new e2e/ files + scoped config additions); brief says "file+flag, don't fix" — honored |

---

## Verdict

**APPROVED**

All MUST-VERIFY checklist items from REVIEWING.md pass:
- CI is green on the exact head SHA (`4ff1d26`).
- The load-bearing correctness claim reproduces (mutation-verify: removing trigger → spec FAILS → revert → PASS).
- Behavior-equivalence claims hold (no src/ changes; build byte-identical; snapshots untouched).
- Scope is minimal; commit identity is `fern@ndo.io`; `Closes #13` is in the body.

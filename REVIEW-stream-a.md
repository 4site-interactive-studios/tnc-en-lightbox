# REVIEW — wave-1 / stream-a triggers + frequency dismissal (PR #11)

- **Reviewer:** independent
- **Review date:** 2026-06-25
- **PR:** #11 · `feat/wave-1-triggers`
- **Reviewed head:** `ed7da7fe010fa18714550531aaacd510347227cd`
- **Worktree:** `/Users/fernando/sites/.worktrees/wave-1-review`
- **Verdict:** APPROVED

---

## 1. Setup / reproducibility

| Check | Result | Evidence |
|-------|--------|----------|
| Detached worktree at exact head | PASS | `git worktree add --detach ../.worktrees/wave-1-review ed7da7f`; `git rev-parse HEAD` = `ed7da7fe010fa18714550531aaacd510347227cd` |
| Clean dependency install | PASS | `npm ci` completed with 0 vulnerabilities |

---

## 2. Base verification

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` | PASS | 10 test files passed, 65 tests passed |
| `npm run typecheck` | PASS | `tsc --noEmit` clean, no errors |
| `npm run lint` | PASS | `eslint .` clean, no errors |
| `npm run build` | PASS | single artifact `dist/en-lightbox.js`; 8.93 kB raw / 3.09 kB gzip |

---

## 3. Mutation verification (load-bearing fixes)

### 3a. Dismissal frequency guard

| Check | Result | Evidence |
|-------|--------|----------|
| `>=` → `<` at `src/triggers/dismissal.ts:15` | RED as required | `isEligible returns false when a fresh record is inside frequencyDays` failed: expected `false`, got `true` |
| Reverted to original `>=` | GREEN | full suite back to 65/65 |

### 3b. Sync-fire leak bail in dispatcher

| Check | Result | Evidence |
|-------|--------|----------|
| Removed `if (fired) break` from `src/triggers/dispatcher.ts:48` | RED as required | `sync fire from scroll-depth does not leak the inactivity timer after disarm` failed: `onFire` called 2 times, expected 1 |
| Restored `if (fired) break` | GREEN | full suite back to 65/65 |

### 3c. Fail-open on corrupt stored value

| Check | Result | Evidence |
|-------|--------|----------|
| Removed `Number.isFinite(parsed)` guard at `src/triggers/dismissal.ts:14` | RED as required | `isEligible fails OPEN when the stored value is corrupt (non-numeric)` failed: expected `true`, got `false` |
| Restored guard | GREEN | full suite back to 65/65 |

---

## 4. Contracts / NFR verification

| Check | Result | Evidence |
|-------|--------|----------|
| `python3 tools/sdd/check_contracts.py` | PASS | 6/6 OK: bundle, no-css-emitted, api-surface, config-schema, bundle-size, no-runtime-deps |
| Bundle-size gate | PASS | gzip 3085 B / budget 3100 B (`budgets.json`) |
| no-runtime-deps gate | PASS | `package.json` has no `dependencies`; verified gate fails when a dummy `dependencies` entry is injected |
| Single dist artifact, no CSS | PASS | `dist/` contains only `en-lightbox.js`; `find dist -name '*.css'` returns nothing |
| Spec-coupling gate | PASS | `python3 tools/sdd/check_spec_coupling.py --base main` → OK (41 files checked) |
| Test-coupling gate | PASS | `python3 tools/sdd/check_test_coupling.py --base main` → OK |
| Cross-spec waiver for `src/core/lightbox.ts` | PASS | `[no-spec: additive dismiss signal for wave-1]` present in commit messages `fed0a92`, `57bb687`, `7316a6b`, `62a88b0`, `ed7da7f` |
| Ownership carve-out | PASS | `.agentic/ownership.json` rule `src/triggers/**` → `.agentic/specs/wave-1/stream-a.md` |
| Config seam | PASS | `config.ts` declares empty `TriggersConfigBase`; `src/triggers/config.ts` augments via `declare module '../config'` |
| No `canArm` hook | PASS | grep for `canArm` returns only spec/ROADMAP prose, no source usage |
| `enlb:dismiss` event | PASS | `src/core/lightbox.ts:103-108` dispatches `CustomEvent('enlb:dismiss', { detail: { pathname: location.pathname }, bubbles: true })` |
| Frequency cap behavior | PASS | `src/triggers/dismissal.ts`: key `enlb:shown:${pathname}`, default 7 days via `src/triggers/config.ts:28`, `0` short-circuits to eligible, storage throw and non-finite parse fail open, stamp on show |
| Singleton opened once | PASS | dispatcher `onFire` calls `activeInstance?.open()`; tests assert only one `.enlb-overlay` |
| No listener/timer leaks | PASS | `disarmAll()` clears triggers on fire and on `disarm()`; sync-fire bail prevents later triggers from arming |
| Exit-intent desktop-only | PASS | `src/triggers/exit-intent.ts` only listens to `mouseout`; no touch/pointer handlers |

---

## 5. Hygiene

| Check | Result | Evidence |
|-------|--------|----------|
| CI green on exact head SHA | PASS | GitHub run `28189690675` conclusion `success`, headSha `ed7da7fe010fa18714550531aaacd510347227cd`; all 4 SDD gates + contracts pass |
| `Closes #10` in PR body | PASS | PR #11 body ends with `Closes #10` |
| Commit identity | PASS | All PR-unique commits (`ed7da7f...ec79fce`) authored/committed by `Fernando Santos <fern@ndo.io>` |
| No `Co-Authored-By` | PASS | `git log --format=%B ed7da7f --not main` contains no `Co-Authored-By` |
| TDD red → green | PASS | Checked out `8f35495` ("write failing dispatcher test (TDD red)") → 2 tests failed (`mod.armTriggers is not a function`); current head green |
| `dist/` freshness | PASS | `check_contracts.py` bundle check passes (`git diff --exit-code dist/`) |
| `LEARNINGS.md` | ADVISORY | File unchanged in this PR; `check_learnings_freshness.py` warns (35 commits, threshold 20). Recommend promoting the sync-fire bail and fail-open patterns in a follow-up. |

---

## 6. Low findings accepted

Per review brief, the following are known and accepted:

1. **Exit-intent has no explicit pointer/touch guard.** The implementation relies on `mouseout` only, which is effectively desktop-only; accepted as implicit.
2. **Scroll percent is unclamped.** A `scroll: 0` trigger fires immediately on load because the check is `>= percent`; accepted.
3. **Redundant eligibility re-check in `src/index.ts:37`.** The dispatcher callback re-checks eligibility immediately after `armTriggers()` already gated it. Harmless and defensive; accepted.

---

## 7. Ruling

All required checks pass, the load-bearing mutation-verified fixes reproduce as claimed, CI is green on the exact head SHA, and the brief/NFR requirements are met. No blockers.

**APPROVED**

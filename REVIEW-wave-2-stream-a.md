# REVIEW — wave-2 / stream-a layout, tokens & a11y/motion (PR #17)

- **Reviewer:** independent
- **Review date:** 2026-06-25
- **PR:** #17 · `feat/wave-2-layout`
- **Reviewed head:** `d1c59588315d902261ce0de6458b0b11fbb8aef4` (d1c5958)
- **Audit worktree:** `/Users/fernando/sites/.worktrees/wave-2-review-audit` (branch `wave-2-review-audit` off `main` @ d9205b3)
- **Repro worktree:** `/Users/fernando/sites/.worktrees/wave-2a-review` (detached at d1c5958)
- **Verdict:** APPROVED

Stance: reproduced every claim; mutation-verified the load-bearing lines myself; diffed the hardened core against `main`. The PR modifies hardened `src/core/lightbox.ts` — audited for regressions adversarially. No blocker found. Non-blocking notes recorded in §9.

---

## 1. Setup / reproducibility

| Check | Result | Evidence |
|-------|--------|----------|
| Detached repro worktree at exact head | PASS | `git worktree add --detach ../.worktrees/wave-2a-review d1c5958`; `git rev-parse HEAD` = `d1c59588315d902261ce0de6458b0b11fbb8aef4` |
| Clean dependency install | PASS | `npm ci` → 188 packages, 0 vulnerabilities |
| Audit branch off main, main checkout left on main | PASS | `wave-2-review-audit` branched from `main` @ d9205b3; main checkout still on `main` |

---

## 2. Base verification

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` | PASS | 13 test files, **85 tests passed** |
| `npm run typecheck` | PASS | `tsc --noEmit` clean |
| `npm run lint` | PASS | `eslint .` clean |
| `npm run build` | PASS | ONE dist file: `dist/en-lightbox.js` (13.18 kB raw / 4.08 kB gzip) |
| `python3 tools/sdd/check_contracts.py` | PASS | all 11 green — 10 gates OK (bundle, no-css-emitted, api-surface, config-schema, bundle-size, no-runtime-deps, no-runtime-fetch, dist-single-file, reduced-motion-guard, a11y-audit) + 1 promise (cross-browser-smoke) |
| `npm run e2e` | PASS | **45 passed, 3 skipped** (Mobile Chrome skips exit-intent + imagePosition left/right — desktop-only specs) across chromium/firefox/webkit/Mobile Chrome |
| Build byte-reproducibility (flag #3) | PASS | `git checkout -- dist && npm run build && git add -AN && git diff --exit-code dist/` → exit 0; fresh build byte-identical to committed `dist/` |

---

## 3. Mutation verification (load-bearing fixes — re-run by reviewer)

### 3a. Image-absent single-column guard (D18)

| Check | Result | Evidence |
|-------|--------|----------|
| `enlb-layout--single-column` → `enlb-layout--broken` at `src/core/lightbox.ts:212` | RED as required | named test `renders single-column when variant is two-column but no image is provided` (`src/core/lightbox.layout.test.ts:27`) failed: `expected false to be true` |
| Reverted | GREEN | full suite back to 85/85 |

### 3b. reduced-motion-guard — default motion removed

| Check | Result | Evidence |
|-------|--------|----------|
| Removed the default `transition` block (`src/styles/lightbox.scss:158-161`), rebuilt | GUARD FAILS | `reduced-motion-guard FAIL: no motion rules exist outside the prefers-reduced-motion media query` (exit 1) — `defaultMotion == 0` branch of `check_reduced_motion.mjs:39-42` |
| Reverted | GREEN | `reduced-motion-guard OK: 1 default motion rule(s), 1 disabled under reduce` |

### 3c. reduced-motion-guard — reduce override removed

| Check | Result | Evidence |
|-------|--------|----------|
| Removed the `@media (prefers-reduced-motion: reduce)` block (`src/styles/lightbox.scss:163-168`), rebuilt | GUARD FAILS | `reduced-motion-guard FAIL: no motion rules are disabled inside the prefers-reduced-motion media query` (exit 1) — `guardedMotion == 0` branch of `check_reduced_motion.mjs:44-47` |
| Reverted | GREEN | guard OK; full suite 85/85; worktree `git status` clean |

The guard (`tools/sdd/check_reduced_motion.mjs`) requires motion to exist BOTH in the default path AND disabled under reduce — both halves bite, confirming fix [2]'s "requires BOTH and bites" claim.

---

## 4. No-regression in hardened core (blast radius)

| Check | Result | Evidence |
|-------|--------|----------|
| `src/core/lightbox.test.ts` unchanged vs main | PASS | `git diff d9205b3..d1c5958 -- src/core/lightbox.test.ts` → empty |
| wave-0 a11y slice intact | PASS | `lightbox.a11y.test.ts` (9 tests, green): inert+aria-hidden+tabindex save/restore on body siblings (open→set, close→restore, pre-existing values restored exactly); non-empty accessible-name fallback when header empty; body scroll-lock + overflow restore; scroll-position restore on close; initial-focus on dialog root across `closeButton` inside/outside/none (N18) |
| Focus restored to prior element | PASS | `lightbox.test.ts:134-149` — focus moves into dialog on open, restored to `#trigger` on close |
| Focus trap cycles through new CTA `<a>` + close/secondary/decline `<button>`s | PASS | `lightbox.cta.test.ts:75-94` — focusable order `[close, primary-cta(A), secondary(BUTTON)]`; Tab wrap (`lightbox.test.ts:101-116`) + Shift+Tab wrap (`:118-132`) green with `cta:{href:'#go'}` (anchor is `a[href]`-focusable) |
| 3 close paths hold | PASS | Escape (`:48-57`), X button (`:69-75`), overlay backdrop (`:77-83`) all close; `closeOnEsc:false` (`:59-67`) + `closeOnOverlay:false` (`:93-99`) no-close |
| Inside-click does not close | PASS | `lightbox.test.ts:85-91` — click `.enlb-content` leaves overlay mounted; primary-CTA handler `onCtaClick` only `stopPropagation` (no close, no JS routing) |
| wave-1 triggers + frequency dismissal | PASS | unit suites green (dispatcher 9, dismissal 10, exit-intent 6, scroll 5, inactivity 4, time 4); e2e `frequency dismissal suppresses re-open within window`, `exit-intent`, `scroll-depth`, `time trigger` all green cross-browser |

---

## 5. The fixes (this PR's reason to exist)

### [1] Redirect CTA is a native `<a href>`, not a button calling location.assign

| Check | Result | Evidence |
|-------|--------|----------|
| Primary CTA is `<a>` with `href` | PASS | `src/core/lightbox.ts:237-241` — `createElement('a')`; `if (cta.href) cta.href = cta.href` (link role, native middle-click/ctrl-click new-tab) |
| No JS routing on primary CTA | PASS | `onCtaClick` (`:43-46`) only `e.stopPropagation()`; `lightbox.cta.test.ts:24-38` spies `location.assign` → NOT called on primary click |
| close/submit/decline are `<button>` | PASS | secondary + decline use `createElement('button')` (`:245`, `:255`); decline sets `data-enlb-action='close'` |
| e2e native navigation | PASS | `e2e/smoke.spec.ts:87-93` — CTA has `href='#cta-navigated'`; click → `page.toHaveURL(/#cta-navigated$/)` |

### [2] Entrance motion in DEFAULT path, disabled under reduced-motion; guard requires both

| Check | Result | Evidence |
|-------|--------|----------|
| Motion in default CSS path | PASS | `src/styles/lightbox.scss:158-161` — `.enlb-overlay,.enlb-dialog { transition: opacity .2s, transform .2s }` |
| Disabled under `@media (prefers-reduced-motion: reduce)` | PASS | `:163-168` — `transition: none` |
| Guard requires BOTH and bites each way | PASS | §3b (remove default → FAIL) + §3c (remove reduce override → FAIL) |

### [3] imagePosition 'right' via DOM order, no row-reverse; 'left' un-regressed

| Check | Result | Evidence |
|-------|--------|----------|
| 'right' = DOM order `[content, image]` + plain row | PASS | `src/core/lightbox.ts:298-300` appends `content` then `imageWrap` when `imagePosition==='right'`; `:301-304` appends image first for left/top |
| NO `row-reverse` anywhere | PASS | `grep -rn "row-reverse" src/ dist/` → NONE |
| e2e asserts real bounding-box x | PASS | `e2e/smoke.spec.ts:95-109` 'right' → `imageBox.x > contentBox.x`; `:111-125` 'left' → `imageBox.x < contentBox.x`; both green on chromium/firefox/webkit |
| DOM-order unit test | PASS | `lightbox.layout.test.ts:63-77` — `children[0]=enlb-content`, `children[1]=enlb-image` for 'right' |

### [4] LayoutConfig scoped: no stackBreakpoint/centered/banner; fixed 640px; no inert fields

| Check | Result | Evidence |
|-------|--------|----------|
| `variant` is `'two-column'` only | PASS | `src/themes/config.ts:3` — `export type LayoutVariant = 'two-column'`; no `'centered'`/`'banner'` in src (`grep` NONE) |
| No `stackBreakpoint` field | PASS | `NormalizedLayout` (`:7-13`) + `LayoutConfigBase` augmentation (`:15-23`) carry only variant/imagePosition/imageRatio/hideImageOnMobile/closeButton |
| No `--enlb-stack-breakpoint` CSS var | PASS | `grep -rn "stack-breakpoint" src/ dist/` → NONE (only spec/ROADMAP prose) |
| 640px breakpoint is fixed | PASS | `src/styles/lightbox.scss:143` — `@media (max-width: 640px)` |
| No inert config fields | PASS | every `LayoutConfigBase`/`NormalizedLayout` member is consumed (variant→class `:209`, imagePosition→class+DOM order, imageRatio→custom prop `:272`, hideImageOnMobile→class `:200`, closeButton→buildCloseButton `:218`) |

### [5] config-schema captures NormalizedLayout

| Check | Result | Evidence |
|-------|--------|----------|
| Snapshot includes resolved `NormalizedLayout` | PASS | `.agentic/contracts/snapshots/config-schema.txt:33-40` — `interface NormalizedLayout { variant: "two-column"; imagePosition; imageRatio; hideImageOnMobile?; closeButton }`; contract guards via `git diff --exit-code` |
| Schema diff vs main is the intended layout shape | PASS | added `secondaryCta`/`dismissLabel`; `layout: NormalizedLayout` (was `LayoutConfigBase`); `hideImageOnMobile` default → `topLevelHideImageOnMobile`; NormalizedLayout block added |

---

## 6. Contracts / NFR

| Check | Result | Evidence |
|-------|--------|----------|
| 4 new contracts are real gates that bite | PASS | `reduced-motion-guard` (§3b/3c bit); `a11y-audit` runs axe-core over a JSDOM fixture exercising the built dist via `ENLightboxAPI.open()` — fails on any violation (`tools/sdd/check_a11y.mjs:38-44`); `no-runtime-fetch` greps dist for `fetch(`/`XMLHttpRequest`/`import(http`/`url(http` (`check_no_runtime_fetch.mjs:6-18`); `dist-single-file` asserts `dist/` == `['en-lightbox.js']` exactly (`check_dist_single_file.mjs`) |
| New contracts run in CI | PASS | `gh pr checks 17` → `contracts-check` pass (26s) |
| bundle-size re-baselined deliberately | PASS | `.agentic/contracts/budgets.json` `maxGzipBytes: 4500`; `_doc` records baseline 3058B → measured ~4100B, headroom documented; measured here 4.08 kB gzip < 4500 |
| api-surface not polluted | PASS | `git diff d9205b3..d1c5958 -- .agentic/contracts/snapshots/api-surface.txt` → empty (ENLightboxAPI public surface unchanged) |
| Zero runtime deps | PASS | `package.json` has only `devDependencies` (axe-core, jsdom, sass, ts-morph, tsx, vite, vitest, playwright, eslint, typescript) — no `dependencies` field |
| Single dist, SCSS inlined, no `.css` | PASS | `no-css-emitted` OK; `dist/` contains only `en-lightbox.js` |
| ownership carve-out is first commit | PASS | commit `82c707d` `chore: carve out src/themes/** ownership` touches ONLY `.agentic/ownership.json` (1 insertion); precedes any `src/themes/**` governed file; rule `src/themes/** → .agentic/specs/wave-2/stream-a.md` |
| `[no-spec]` waivers reasonable | PASS | `[no-spec: wave-2 layout/a11y changes to core]` (lightbox.ts, wave-0-owned); `[no-spec: additive config field owned by wave-2 module]` (config.ts); `[no-spec: registry/budget changes are CI config]` |
| normalizeLayout composed in config.ts (D8) | PASS | `src/config.ts:2,75` imports + calls `normalizeLayout` from `./themes/config`; `src/index.ts` holds no default/resolution logic (thin call-through) |

---

## 7. Hygiene

| Check | Result | Evidence |
|-------|--------|----------|
| CI green on exact head | PASS | `gh pr checks 17` → contracts-check, cross-browser-smoke, learnings-freshness, spec-coupling, test-coupling all **pass** on d1c5958 |
| `Closes #16` in body | PASS | `gh pr view 17` body starts `Closes #16` |
| Commit author = fern@ndo.io | PASS | all 9 PR commits authored by `fern@ndo.io` |
| Commit committer = fern@ndo.io | PASS-with-note | 8/9 PR commits committer=fern@ndo.io; the merge commit `771bbfb` (PR #15 `feat/wave-2-entry` merge) has committer=`noreply@github.com` — standard GitHub merge-button artifact (author is fern@ndo.io); no foreign author |
| No Co-Authored-By | PASS | `git log --format='%b' d9205b3..d1c5958 | grep -i co-authored` → NONE |
| TDD red→green | PASS | `fd727cc` test → `b2a3407` feat; `12f2b7e` test → `33397e3` feat (test commits precede their feat commits) |
| spec-coupling gate | PASS | `check_spec_coupling.py --base origin/main` → OK (23 files) |
| test-coupling gate | PASS | `check_test_coupling.py --base origin/main` → OK (4 source files, 6 test files changed) |
| LEARNINGS.md invariants preserved | PASS (N/A) | `LEARNINGS.md` is empty ("None yet" across invariants/gotchas/historical-fixes); nothing to preserve; `git diff d9205b3..d1c5958 -- .agentic/LEARNINGS.md` → empty |

---

## 8. LEARNINGS.md — promotion candidates (non-blocking, per review brief)

`LEARNINGS.md` was not updated by this PR (still empty). Two durable lessons emerged that are worth promoting in a follow-up (the review brief asked me to "note any worth promoting"):

1. **Don't double-reverse (DOM swap + `row-reverse`).** `d1c5958` dropped `flex-direction: row-reverse` and instead orders the DOM `[content, image]` for `imagePosition:'right'`. Combining a DOM swap WITH `row-reverse` would double-reverse; the single-source-of-truth is DOM order + plain `row`.
2. **Assert the rendered effect, not the DOM order.** The e2e specs assert real `boundingBox().x` (`imageBox.x > contentBox.x`), not DOM child index — jsdom can't compute layout, so the cross-browser net is what proves the visual. The DOM-order unit test is a complement, not a substitute.

Neither is a blocker; promoting them is a separate reviewed change (Decision D12: durable invariants → `LEARNINGS.md` via a reviewed PR).

---

## 9. Notes (non-blocking, do not gate the merge)

1. **Brief/PR-body staleness vs final code.** The JIT brief (`.agentic/specs/wave-2/stream-a.md`) and the PR body describe an *earlier* iteration superseded by the later fix commits (`9a12257`, `d1c5958`):
   - Brief `:27` says the CTA renders as a `<button>`; final code is a native `<a href>` (fix [1]).
   - Brief `:21`,`:64`,`:75` + `wave-2/README.md:27` still list `stackBreakpoint` as in-scope/acceptance; final code dropped it (fix [4]).
   - PR body says "primary CTA as `<button>`", lists `stackBreakpoint` as shipped, "84 tests" (actual 85), and mutation at `lightbox.ts:216` (actual line 212).
   The review coordinator's directive (this review task) accurately describes the final code and endorses these divergences as the intended fixes; the ROADMAP `stackBreakpoint` mention is a known deferred post-merge amendment. **Recommend a post-merge true-up of the brief + PR body** so the durable record matches the code that landed.
2. **Secondary-CTA redirect uses `location.assign` on a `<button>`.** `src/core/lightbox.ts:57-60` — secondary CTA with `href` does `location.assign(href)` from a `<button>`, which lacks the native new-tab/middle-click semantics the primary `<a href>` has. In practice secondary/decline is a `close` action; not a regression to hardened core and not in the review brief's [1] scope (which concerns the primary redirect CTA). Worth a note for stream-b/wave-3 if secondary-redirect becomes a real use case.
3. **Guard regex caveat (not exploited here).** `check_reduced_motion.mjs:28-31` uses `css.indexOf(block)` to locate the reduce block; if an identical CSS substring appeared twice the membership test could misattribute. The current CSS is unique, so the gate is sound on this head — flagged only as a future hardening opportunity.

None of the above is a blocker. The code matches the coordinator-endorsed fixes, all gates (local + CI) are green, the hardened core is regression-free (`lightbox.test.ts` byte-identical to main), and the load-bearing lines all mutation-verify red.

---

**Verdict: APPROVED**

# REVIEW — wave-3 / stream-a EN CTA semantics, no-form-interference & editor docs (PR #24)

- **Reviewer:** independent
- **Review date:** 2026-06-26
- **PR:** #24 · `feat/wave-3-en` · base `main`
- **Reviewed head:** `f71e90805c2d9d68f7ab236e39dccab5ac0748bf` (f71e908) — the exact commit that lands
- **Audit worktree:** `/Users/fernando/sites/.worktrees/wave-3-review-audit` (branch `wave-3-review-audit`, off `main` @ `7791a17`)
- **Repro worktree:** `/Users/fernando/sites/.worktrees/wave-3-review` (detached at `f71e908`)
- **Verdict:** APPROVED

Stance: reproduced every claim in my own detached checkout; mutation-verified the load-bearing close-routing line myself; hammered the EN-form non-interference NFR (the highest-risk item) at both the jsdom unit level and the real-browser e2e level across the full matrix. The hardened `src/core/lightbox.ts` change was audited line-by-line. No blocker found. Non-blocking notes in §9.

---

## 1. Setup / reproducibility

| Check | Result | Evidence |
|-------|--------|----------|
| PR head is exactly the reviewed SHA | PASS | `gh pr view 24 --json headRefOid` → `f71e90805c2d9d68f7ab236e39dccab5ac0748bf` |
| Detached repro worktree at exact head | PASS | `git worktree add --detach ../.worktrees/wave-3-review f71e908`; `git rev-parse HEAD` = `f71e908…` |
| Clean dependency install | PASS | `npm ci` → 0 vulnerabilities (install-script warnings only) |
| Audit branch off main; main checkout left on main | PASS | `wave-3-review-audit` @ `7791a17`; main checkout `/Users/fernando/sites/tnc-en-lightbox` on `main` @ `7791a17` throughout |
| No new commit after review start | PASS | head stayed `f71e908` for the duration |

---

## 2. Base verification (all re-run by reviewer in the detached worktree)

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` | PASS | 16 files, **129 tests passed** |
| `npm run typecheck` | PASS | `tsc --noEmit` clean |
| `npm run lint` | PASS | `eslint .` clean |
| `npm run build` | PASS | ONE dist file: `dist/en-lightbox.js` (14.67 kB raw / 4.59 kB gzip) |
| `python3 tools/sdd/check_contracts.py` | PASS | 10 gates OK (bundle, no-css-emitted, api-surface, config-schema, bundle-size, no-runtime-deps, no-runtime-fetch, dist-single-file, reduced-motion-guard, a11y-audit) + 1 promise (cross-browser-smoke) = 11 contracts green |
| `npm run e2e` | PASS | **73 passed, 3 skipped** across chromium/firefox/webkit/Mobile Chrome (3 skips are Mobile Chrome desktop-only tests) |
| CI green on exact head | PASS | `gh pr checks 24` → all 5 pass (contracts-check, cross-browser-smoke, learnings-freshness, spec-coupling, test-coupling) on `f71e908` |
| Build byte-reproducibility | PASS | `git checkout -- dist && npm run build && git add -AN && git diff --exit-code dist/` → exit 0; committed `dist/` matches fresh build |
| Snapshot sync | PASS | `npm run contracts:config-schema` and `contracts:api-surface` regenerate byte-identical to the committed snapshots (`git diff --exit-code` → 0) |
| spec-coupling / test-coupling | PASS | `check_spec_coupling.py --base main` → OK (13 files); `check_test_coupling.py --base main` → OK (2 source files, 5 test files) |
| Bundle budget | PASS | `node tools/sdd/check_size.mjs` → gzip 4587B / budget 5000B (headroom) |

---

## 3. Mutation verification (load-bearing line — re-run by reviewer)

Broken line: `src/core/lightbox.ts:47` — `if (action === 'close')` → `if (action === 'cloze')` (typo). The close branch of `onCtaClick` no longer matches.

| Check | Result | Evidence |
|-------|--------|----------|
| Named test red | RED as required | `closes the lightbox and records dismissal when a CTA with action:"close" is clicked` (`src/core/lightbox.cta.test.ts:128`) — overlay not removed, `enlb:dismiss` not fired |
| EN-interference close-CTA test red | RED as required | `isolates the EN form while open and fully restores it after close via close CTA` (`src/core/lightbox.en-interference.test.ts:153`) — `assertFormRestored` fails at :93 (form still isolated because close CTA didn't close) |
| Additional coupled reds (expected) | RED | `closes the lightbox when a secondary close CTA is clicked` (`cta.test.ts:77`); `does not re-open via API after a close CTA dismisses the lightbox` (`index.test.ts`) — both depend on the close-CTA routing |
| X-button path stays GREEN | GREEN (expected) | `isolates the EN form while open and fully restores it after close via X button` stayed green — the X button uses `onCloseClick` (`lightbox.ts:39`), not the CTA-action routing, confirming the mutation is targeted |
| Reverted | GREEN | `git checkout -- src/core/lightbox.ts`; full suite back to **129/129** |

Total: 4 failed / 125 passed under mutation; 129/129 after revert. The mutation isolates the close-CTA routing and does not ripple into the X-button or overlay close paths.

---

## 4. CTA routing (D5 — single source of truth)

| Check | Result | Evidence |
|-------|--------|----------|
| `cta.action` is the single routing source | PASS | `resolveCtaAction` (`lightbox.ts:238-245`) is the only router; `buildCtaElement` (`:247-268`) renders from the resolved action |
| `'redirect'` ⇒ native `<a href>` | PASS | `buildCtaElement:254-261` creates `<a>`; sets `href` only if present; `data-enlb-action='redirect'` |
| `'close'` ⇒ `<button>` that closes + records dismissal | PASS | `buildCtaElement:262-267` creates `<button type=button>`; `onCtaClick:47-51` calls `close()`; `close()` (`:123-128`) dispatches `enlb:dismiss` |
| Re-arm within window doesn't re-open | PASS | `src/index.test.ts` "does not re-open via API after a close CTA dismisses the lightbox" — after close-CTA, `open()` is suppressed by the dismissal guard |
| Inferred default (`href`⇒redirect, else close) | PASS | `resolveCtaAction:244` — `return href ? 'redirect' : 'close'`; `cta.test.ts:13` (href, no action ⇒ `<a>`) |
| Explicit action wins over co-present href | PASS (code) | `resolveCtaAction:242-243` returns on explicit action before the href fallback at `:244`. *Coverage note in §9.* |
| `secondaryCta` routes the same way | PASS | `buildCtaRow:284-287` passes secondary `action`/`href` into `buildCtaElement`; `cta.test.ts:61` (secondary close ⇒ `<button>`), `:40` (secondary redirect ⇒ `<a>`) |
| `dismissLabel` is always close | PASS | `buildCtaRow:289-293` calls `buildCtaElement(…, 'close')` unconditionally |
| No `'submit'` behavior (D5b deferred) | PASS | action type is `'redirect' \| 'close' \| undefined` only (`config.ts:12,18`); no submit branch anywhere |
| No competing `ctaBehavior`/`redirectUrl` | PASS | `rg "ctaBehavior\|redirectUrl" src/` → none |
| LEARNINGS invariant: navigating CTA is `<a>`, never `<button>`+`location.assign` | PASS — strengthened | `rg "location.assign" src/` → none (only a negative-assertion test at `cta.test.ts:24`); the PR **removes** the prior `onSecondaryCtaClick` `location.assign(href)` and makes the secondary redirect CTA a native `<a>` (on `main` it was a `<button>` + `location.assign`). See §8. |

---

## 5. Non-interference — U12 / the highest-risk NFR (verified adversarially)

### 5a. The lightbox attaches no form interceptor

| Check | Result | Evidence |
|-------|--------|----------|
| No submit listener on document/form/body | PASS | `open()` (`lightbox.ts:84-103`) attaches: document `keydown` (Escape only, `:94`), overlay `click` (`:95`), dialog `keydown` (Tab/focus-trap, `:96`), close-btn `click` (`:98`), `.enlb-cta` `click` (`:99-101`). No `submit`/`focus`/document-level `click`. `rg "addEventListener\(['\"]submit" src/` → only the test's own listener |
| Only the Escape keydown at document level | PASS | `onKeydown:27` — `if (e.key === 'Escape' …)`; no `preventDefault` for non-Escape keys |
| `location.assign`/`innerHTML`/`insertAdjacentHTML`/`document.write`/`eval`/`new Function` absent from production | PASS | `rg` over `src/` → only test-file cleanup (`innerHTML=''`) and the negative `location.assign` assertion |

### 5b. The unit test PROVES it (not a proxy) — `src/core/lightbox.en-interference.test.ts`

| Required assertion | Result | Evidence |
|-------|--------|----------|
| Submission proven by `defaultPrevented === false` (not just a listener fired) | PASS | `assertFormSubmits:73-84` dispatches a `SubmitEvent` and asserts both `lastSubmit.event` not null AND `lastSubmit.event!.defaultPrevented === false` (`:83`) |
| `checkValidity()` empty ⇒ false, filled ⇒ true | PASS | `assertFormInvalid:62` (`toBe(false)`); `assertFormValid:70` (`toBe(true)`) |
| WHILE OPEN: form asserted isolated (inert/aria-hidden/tabindex) | PASS | `assertFormIsolated:98-102` (inert true, aria-hidden 'true', tabindex '-1'); called while open at `:139, :162, :183, :206` |
| submit/validate/focus assertions are AFTER-CLOSE for all 3 paths | PASS | X-button `:142` close → asserts `:147-150`; close-CTA `:164` close → asserts `:166-171`; redirect `:187` click (overlay stays, `:189`) → X-close `:192` → asserts `:194-198`. All post-close. |
| Pre-existing aria-hidden/tabindex restored after close | PASS (with note) | `:201-212` mounts with `preExistingAttrs` and asserts `assertPreExistingAttributesRestored:104-108`. *Note in §9: attrs are on a form field, not the form element.* |
| Focus restored to prior element | PASS | `:146, :167, :195` — `expect(document.activeElement).toBe(trigger)`; backed by `close():119-122` |
| No orphaned attrs across open/close cycles | PASS | `:214-226` — two open/close cycles, `assertFormRestored` + `form.hasAttribute('aria-hidden')` false |
| `inert`/`aria-hidden`/`tabindex`/`overflow` fully release on close | PASS | `assertFormRestored:92-96` (form attrs gone); body overflow 'hidden' while open (`:140`) → '' after close (`:145`); `restoreBackground:171-187` removes/restores each attr; `window.scrollTo` restores scroll (`:176`) |

### 5c. Real-browser proof — `e2e/smoke.spec.ts` (4 EN-form cases, green across the matrix)

| Test | Line | Result |
|-------|------|--------|
| EN form is isolated while lightbox is open | `:217` | PASS (chromium/firefox/webkit/Mobile Chrome) |
| EN form submits and validates after close via X button | `:223` | PASS (all 4) |
| EN form submits and validates after close via close CTA | `:231` | PASS (all 4) |
| EN form submits and validates after redirect CTA | `:239` | PASS (all 4) — redirect click keeps overlay open (`:250`), form stays isolated (`:251`), then X-close, then asserts |

`assertFormSubmitsAndValidates` (`smoke.spec.ts:205-215`) asserts `fired === true` AND `defaultPrevented === false` in a real browser — the same adversarial standard as the unit test. CI `cross-browser-smoke` is green on `f71e908`. The e2e harness gained a real `<form id="en-form">` with required email/name inputs + submit (`e2e/harness.html`).

**Conclusion:** non-interference is proven at both layers with real behavioral assertions (`defaultPrevented`, `checkValidity`, `activeElement`, attribute presence), not proxies. The form is provably inert while open and provably functional after close across X / close-CTA / redirect paths.

---

## 6. EN removal + no regression

| Check | Result | Evidence |
|-------|--------|----------|
| `ENIntegrationConfigBase` gone | PASS | `git diff main -- src/config.ts` removes the interface, `en?` field, `NormalizedConfig.en`, and `en: src.en ?? {}` normalizer line |
| Nothing reads `config.en` | PASS | `rg "config\.en\|\.en\b\|src\.en" src/` → none |
| `config-schema` snapshot dropped ONLY the en lines | PASS | `git diff main -- …/config-schema.txt` removes exactly the two `en` lines (`en?: ENIntegrationConfigBase \| undefined` and `en: ENIntegrationConfigBase // default src.en ?? {}`); snapshot regenerates byte-identical |
| `config.test.ts` updated | PASS | removes `expect(c.en).toEqual({})` |
| No `ENPageType`/`ENPageContext`/`canArm`/page detection | PASS | `rg` over `src/` → none (Amendments honored) |
| Wave-0 a11y slice + 3 close paths + focus trap intact | PASS | `git diff main -- src/core/lightbox.a11y.test.ts src/core/lightbox.test.ts` → empty; isolation/restore/focus logic in `lightbox.ts` unchanged (see §8) |
| Wave-1 triggers/frequency intact | PASS | `git diff main` for `src/triggers/**` and `src/triggers/*.test.ts` → empty |
| Wave-2 themes/layout intact | PASS | `git diff main` for `src/themes/**`, `lightbox.theme.test.ts`, `lightbox.layout.test.ts` → empty |
| api-surface snapshot unchanged | PASS | `git diff main -- …/api-surface.txt` → 0 lines |
| No production `lightbox.ts` change for the non-interference fix | PASS | the `lightbox.ts` diff is **only** CTA routing (see §8); the isolation/restore/scroll-lock/focus mechanism is byte-identical to `main` |

---

## 7. Editor docs + governance

| Check | Result | Evidence |
|-------|--------|----------|
| EDITOR.md field names map 1:1 to shipped config | PASS | content/behavior/cta/secondaryCta/dismissLabel match `config.ts`; triggers match `src/triggers/config.ts` (`frequencyDays`/`time`/`scroll`/`inactivity`/`exitIntent`/`list`); layout match `src/themes/config.ts` (`variant`/`imagePosition`/`imageRatio`/`hideImageOnMobile`/`closeButton`); theme match (`preset`/`colors`/`radius`/`maxWidth`/`fontFamily`). No fictional field. |
| `customCss`-not-yet-available stated | PASS | `EDITOR.md:98` and `:188`; the type still carries `customCss?: string` (`themes/config.ts:40`) but `normalizeTheme` never reads it — zero runtime behavior (consistent with wave-2 review) |
| Auto-init ordering (config before script) | PASS | `EDITOR.md:9-17` sets `window.ENLightbox` before the async `<script src>`; `index.ts:85-93` auto-inits from `globalThis.ENLightbox` |
| Dismissal-frequency behavior stated | PASS | `EDITOR.md:112-119` — `frequencyDays` default 7, `0`=every load, localStorage keyed by `location.pathname`, fails open |
| `ENLightboxAPI` surface real (not a fiction) | PASS | vite `lib.name: 'ENLightboxAPI'`, IIFE — `window.ENLightboxAPI` exposes `open`/`close`/`getInstance`/`setTheme` from `index.ts`; `dist` contains `ENLightboxAPI` |
| Zero runtime deps; single dist; SCSS inlined | PASS | no-runtime-deps OK, no-runtime-fetch OK, dist-single-file OK, no-css-emitted OK; `EDITOR.md:176` states it |
| `[no-spec]` reasonable | PASS | waiver `[no-spec: remove inert en placeholder / wave-3 CTA routing]` (commit `fe34e47`) is PR-level per `check_spec_coupling.py:41-52` (scans all commit messages in `main..HEAD`); covers both wave-0-owned changes (`config.ts` en removal + `lightbox.ts` CTA routing) exactly as `stream-a.md` prescribed |
| Bundle gzip ~4.6k under 5000 | PASS | 4587B / 5000B budget |
| wave-3 README: Retrospective stub + wave-0/1/2 deps | PASS | `.agentic/specs/wave-3/README.md:9` deps, `:27-31` retro stub |
| stream-a guardrails present | PASS | `stream-a.md:59-76` — no-src/en, no-detection, no-submit, no-triggers/themes, bundle-budget, jsdom-inert-e2e. *Wording nit in §9.* |

---

## 8. Hardened core audit — `src/core/lightbox.ts`

The `lightbox.ts` diff vs `main` is **minimal and CTA-only**:
- `onCtaClick` + `onSecondaryCtaClick` collapsed into one `onCtaClick` that routes by `data-enlb-action` (`:44-55`).
- `location.assign(href)` **removed** (was in the old `onSecondaryCtaClick`).
- `resolveCtaAction` (`:238-245`) + `buildCtaElement` (`:247-268`) added; `buildCtaRow` (`:270-296`) refactored to route all three CTAs (primary/secondary/decline) through `buildCtaElement`.
- CTA listener attach/detach simplified (`open()`/`close()` no longer branch on `enlb-cta--secondary`).

**Untouched (byte-identical to main):** `onKeydown` (Escape), `onOverlayClick`, `onCloseClick`, `onDialogKeydown` (focus trap), `isolateBackground`/`restoreBackground`/`lockBackground`, the `close()` focus-restore + `enlb:dismiss` dispatch, and `buildDom` structure. The non-interference NFR is therefore proven by the **new test exercising existing wave-0 logic** — no new isolation/restore code was needed.

**LEARNINGS invariant strengthened:** on `main` the secondary redirect CTA was a `<button>` + `location.assign` (a latent violation of "navigating CTAs are native anchors"). This PR makes both primary and secondary redirect CTAs native `<a href>` and deletes `location.assign` entirely. The invariant is now fully satisfied.

---

## 9. Non-blocking notes

1. **PR body test counts are stale.** Body says "128 tests pass" / "57 passed e2e"; actual is **129 unit / 73 e2e** (4 EN-form e2e tests × 4 browsers = +16; one unit test added). Counts grew after the body was written; all green and actual ≥ claimed. Cosmetic.

2. **`stream-a.md:66` guardrail wording is internally inconsistent.** It reads "No production change in `lightbox.ts` is expected… the only code changes are test/docs/spec files," which conflicts with `stream-a.md:14-17` (lightbox.ts routes CTA clicks) and the actual CTA-routing change to `lightbox.ts`. The intent is clear — the *non-interference fix* needed no `lightbox.ts` change; only the planned CTA routing did — but the literal wording could mislead a future reader. Suggest rewording to: "No further production change in `lightbox.ts` was needed for the non-interference fix; the only `lightbox.ts` change is the planned CTA routing."

3. **Minor CTA test-coverage gaps (code is correct).** No dedicated test for (a) `action:'close'` + co-present `href` ⇒ renders `<button>` (explicit-wins-over-href), and (b) inferred close (no `action`, no `href`) ⇒ `<button>`. `resolveCtaAction:242-244` handles both correctly; the redirect-with-href inference and explicit-close paths are covered. Optional follow-up.

4. **Pre-existing-attrs test targets a form field, not the form element.** `en-interference.test.ts:201-212` sets pre-existing `aria-hidden`/`tabindex` on the email input (not the `<form>`). The lightbox's `isolateBackground` only mutates body-direct-children (the form), so the field's attrs are trivially preserved; this doesn't directly exercise form-element pre-existing-attr restore. The code handles it (`restoreBackground:178-183` saves and restores prior values for each sibling), and `assertFormRestored` covers form-level clearance. Optional: add a case where the `<form>` itself pre-sets attrs.

---

## 10. Hygiene

| Check | Result | Evidence |
|-------|--------|----------|
| CI green on exact head `f71e908` | PASS | `gh pr checks 24` → 5/5 pass |
| `Closes #23` in PR body | PASS | body opens with `Closes #23` |
| Commit identity `fern@ndo.io` | PASS | all 9 commits: author AND committer `fern@ndo.io` |
| No `Co-Authored-By` | PASS | `git log main..f71e908 --format=%B \| rg co-authored` → none |
| TDD red → green | PASS | `8eaac7d test(red): failing tests for CTA close routing` precedes `d2b573e feat: implement single-source CTA action routing` |
| Scope minimal | PASS | 13 files; only `src/core/lightbox.ts` + `src/config.ts` are production source (both wave-0-owned, waivered); rest are tests/docs/spec/dist |

---

## 11. LEARNINGS invariants + candidates to promote

- **Preserved:** "Navigating CTAs are native anchors, never `<button>` + `location.assign`" — now fully satisfied for primary *and* secondary CTAs; `location.assign` deleted.
- **Worth promoting (per the review brief's hint):**
  - *"Assert submission proceeds, not that a listener fired."* To prove no-EN-form-interference, assert `event.defaultPrevented === false` (the submit event is not cancelled), not merely that a submit listener fired. (`en-interference.test.ts:83`, `smoke.spec.ts:214`.)
  - *"jsdom ignores `inert`; a real-browser e2e is required to prove non-interactivity while open."* jsdom-only isolation assertions are necessary but not sufficient; the Playwright suite is the real proof. (`stream-a.md:75`.)

---

## Verdict

**APPROVED.** Every MUST-VERIFY item reproduced; the load-bearing close-routing line mutation-verified; the EN-form non-interference NFR proven adversarially at jsdom and real-browser layers with `defaultPrevented===false`, `checkValidity`, `activeElement`, and attribute-state assertions across X / close-CTA / redirect paths; the hardened `lightbox.ts` change is CTA-only with the isolation mechanism untouched; the inert `en` is fully gone; EDITOR.md maps 1:1 to the shipped config; governance gates green on `f71e908`; hygiene clean. Notes in §9 are non-blocking. Per protocol, **not merged** — verdict filed for the owner's authorization.

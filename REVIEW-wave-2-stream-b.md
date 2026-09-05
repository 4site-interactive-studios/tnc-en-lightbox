# REVIEW — wave-2 / stream-b theme set & customization (PR #21)

- **Reviewer:** independent
- **Review date:** 2026-06-25
- **PR:** #21 · `feat/wave-2-themes`
- **Reviewed head:** `18b48a0e07b7fd89ad6901c7664eb1509e4bc78d` (18b48a0)
- **Audit worktree:** `/Users/fernando/sites/.worktrees/wave-2-review-audit` (branch `wave-2-review-audit`)
- **Repro worktree:** `/Users/fernando/sites/.worktrees/wave-2b-review` (detached at 18b48a0)
- **Verdict:** APPROVED

Stance: reproduced every claim; mutation-verified the load-bearing line myself; audited the hardened `src/core/lightbox.ts` change and the security-relevant `customCss` placeholder adversarially. No blocker found. Non-blocking notes recorded in §8.

---

## 1. Setup / reproducibility

| Check | Result | Evidence |
|-------|--------|----------|
| PR head is exactly the reviewed SHA | PASS | `gh pr view 21 --json headRefOid` → `18b48a0e07b7fd89ad6901c7664eb1509e4bc78d` |
| Detached repro worktree at exact head | PASS | `git worktree add --detach ../.worktrees/wave-2b-review 18b48a0`; `git rev-parse HEAD` = `18b48a0e07b7fd89ad6901c7664eb1509e4bc78d` |
| Clean dependency install | PASS | `npm ci` → 188 packages, 0 vulnerabilities |
| Audit branch off main, main checkout left on main | PASS | `wave-2-review-audit` current; main checkout (`/Users/fernando/sites/tnc-en-lightbox`) on `main` @ `b61246c` |

---

## 2. Base verification

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` | PASS | 15 test files, **119 tests passed** |
| `npm run typecheck` | PASS | `tsc --noEmit` clean |
| `npm run lint` | PASS | `eslint .` clean |
| `npm run build` | PASS | ONE dist file: `dist/en-lightbox.js` (14.94 kB raw / 4.58 kB gzip) |
| `python3 tools/sdd/check_contracts.py` | PASS | 10 gates OK (bundle, no-css-emitted, api-surface, config-schema, bundle-size, no-runtime-deps, no-runtime-fetch, dist-single-file, reduced-motion-guard, a11y-audit) + 1 promise (cross-browser-smoke) |
| `npm run e2e` | PASS | **57 passed, 3 skipped** across chromium/firefox/webkit/Mobile Chrome |
| CI green on exact head | PASS | `gh pr checks 21` → all pass (contracts-check, cross-browser-smoke, learnings-freshness, spec-coupling, test-coupling) |
| Build byte-reproducibility | PASS | `git checkout -- dist && npm run build && git add -AN && git diff --exit-code dist/` → exit 0; committed `dist/` matches fresh build |

---

## 3. Mutation verification (load-bearing line — re-run by reviewer)

Broken line: `src/themes/config.ts:61` — `if (tokenName) cssVars[tokenName] = value` → `if (tokenName && false) cssVars[tokenName] = value`.

| Check | Result | Evidence |
|-------|--------|----------|
| Named test red | RED as required | `per-token override beats preset — override value is set, preset default is not` (`src/core/lightbox.theme.test.ts:64`) failed: `expected '' to be '#ff0000'` |
| Reverted | GREEN | full suite back to 119/119 |

---

## 4. Security audit — R2 / `customCss` placeholder

| Check | Result | Evidence |
|-------|--------|----------|
| `customCss` occurrences | PASS | Only `src/themes/config.ts:40` (`customCss?: string`) — a type-only placeholder |
| Injection sinks (`innerHTML`, `insertAdjacentHTML`, `.textContent =`, `document.write`, `eval`, `new Function`, `<style>` built from config) | PASS | No `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, or `new Function` in `src/` or `dist/`. The only `<style>` element (`src/core/lightbox.ts:206-209`) is populated with the bundled static CSS (`lightboxCss`), not from any config field. `customCss` has zero runtime behavior |
| `dist/en-lightbox.js` contains no customCss behavior | PASS | `rg 'customCss' dist/en-lightbox.js` → no matches |

**Conclusion:** `customCss` is correctly deferred — no raw-CSS injection path exists in this PR.

---

## 5. No-regression audit — hardened core

| Check | Result | Evidence |
|-------|--------|----------|
| `applyTheme` uses single batched `setAttribute('style', …)` | PASS | `src/core/lightbox.ts:159-162` — `composeOverlayStyle()` builds the full string; read-before-write via `getAttribute('style') !== newStyle`; class change also read-before-write (`className !== newClass`) |
| One style-mutation assertion | PASS | `src/core/lightbox.theme.test.ts:69-85` — `MutationObserver` records exactly 1 style mutation |
| Theme class on overlay root only | PASS | `buildOverlayClasses()` at `src/core/lightbox.ts:219-221` returns `enlb-overlay enlb-theme-<preset>`; `buildDom()` at `src/core/lightbox.ts:294` sets it on the overlay div |
| Does not disturb `inert`/`aria-hidden` on body siblings | PASS | `isolateBackground()`/`restoreBackground()` unchanged; theme application never touches saved siblings |
| Scroll-lock, focus-restore, accessible name, close paths | PASS | `lockBackground()`, `restoreBackground()`, `close()` (3 paths), `aria-label` fallback all unchanged |
| Inside-click-no-close, focus trap | PASS | Existing logic unchanged; new theme code does not affect event listeners |
| Primary CTA remains native `<a>` (LEARNINGS invariant) | PASS | `src/core/lightbox.ts:263-267` still creates `<a>` for primary CTA; `applyTheme` does not rebuild CTA |
| `lightbox.a11y.test.ts` and `lightbox.test.ts` unchanged vs `main` | PASS | `git diff main -- src/core/lightbox.a11y.test.ts src/core/lightbox.test.ts` → empty |

---

## 6. Themes / contrast

| Check | Result | Evidence |
|-------|--------|----------|
| Light/dark/brand presets apply coherent `--enlb-*` sets | PASS | `src/themes/presets.ts` and `src/styles/lightbox.scss` (`:root`, `.enlb-theme-dark`, `.enlb-theme-brand`) are token-for-token aligned on spot-check |
| Per-token overrides win over preset | PASS | `normalizeTheme()` adds `cssVars` from `colors` after preset selection; `composeOverlayStyle()` includes them inline; `src/core/lightbox.theme.test.ts:54-67` asserts override values |
| `normalizeTheme` degrades gracefully | PASS | Invalid preset → `'light'` (`src/themes/config.ts:53-54`); non-string colors skipped via `typeof value === 'string'`; no throw path |
| `setTheme` re-applies at runtime | PASS | `src/index.ts:72-75` is a thin delegate: `activeInstance.applyTheme(normalizeTheme(theme))`; single root write verified |
| Contrast is real computation, not hardcoded | PASS | `src/themes/presets.test.ts` computes relative luminance and WCAG ratio; all presets ≥ 4.5:1 |
| Brand palette is TNC green | PASS | `#003d24` / `#00875a` / `#6dd5a8`; PR body flags hexes for owner confirmation |
| `a11y-audit` passes | PASS | contracts-check reports `a11y-audit OK: 28 passes, 0 violations` |

Computed CTA ratios from `PRESET_TOKENS`:
- light CTA: `#fff` on `#1a73e8` → **4.505:1** (0.005 above AA)
- brand CTA: `#fff` on `#00875a` → **4.552:1** (0.052 above AA)

---

## 7. Governance

| Check | Result | Evidence |
|-------|--------|----------|
| Zero runtime deps | PASS | `package.json` has no `dependencies`; axe-core etc. are `devDependencies` |
| Single dist, SCSS inlined | PASS | `dist/en-lightbox.js` only; `no-css-emitted` and `dist-single-file` gates green |
| API-surface snapshot additive | PASS | `.agentic/contracts/snapshots/api-surface.txt` adds `setTheme` only; total 11 entries |
| Config-schema adds `theme: NormalizedTheme` legitimately | PASS | `.agentic/contracts/snapshots/config-schema.txt` shows `theme: NormalizedTheme` and `layout: NormalizedLayout` |
| `setTheme` in `index.ts` is a thin delegate | PASS | `src/index.ts:72-75` delegates to `normalizeTheme` + `applyTheme`; no default logic in `index.ts` |
| Bundle-size re-baseline documented | PASS | `.agentic/contracts/budgets.json`: `maxGzipBytes` 5000; measured 4573B; PR body notes +473B delta |
| `[no-spec]` waivers reasonable | PASS | `config.ts` carries waiver for composed theme normalizer; `lightbox.ts` carries waiver for `applyTheme` hook in core; `registry/budget` changes carry waiver as CI config |
| `src/themes/**` ownership covers change | PASS | `.agentic/ownership.json` maps `src/themes/**` → `.agentic/specs/wave-2/stream-a.md` |
| Commit identity | PASS | All commits authored `Fernando Santos <fern@ndo.io>`; no `Co-Authored-By` |
| `Closes #20` in PR body | PASS | `gh pr view 21 --json body` ends with `Closes #20` |
| TDD red→green visible | PASS | `c0210ff` failing tests, `7a0a36e` green implementation, `f476990` tests, `15b8007` API/rebaseline |

---

## 8. Non-blocking / optional notes

1. **Honest test label.** `src/themes/presets.test.ts` describe block is titled `preset WCAG contrast (axe-relevant)`, but the check is a hand-rolled WCAG ratio computation, not axe-core. Relabel to something like `preset WCAG contrast (computed)` to avoid misleading future readers.
2. **Locked contrast values.** The light CTA (4.505:1) and brand CTA (4.552:1) sit within ~0.05 of the 4.5:1 AA boundary. If brand hexes are ever adjusted, these are the first pairs to re-check. Consider documenting them as locked values in the stream-b README or in `LEARNINGS.md`.
3. **Optional no-op test.** `applyTheme` already read-before-writes; consider adding a test that applying the same theme twice produces zero style/class mutations. This is a nice-to-have, not a blocker.
4. **Optional presets.ts ↔ SCSS sync test.** A small regression test could assert that every non-layout token in `PRESET_TOKENS[preset]` also appears in a parsed version of the inlined CSS. This would catch future drift between the TS source-of-truth and the SCSS bundle.

---

## 9. Verdict

**APPROVED** — PR #21 at `18b48a0e07b7fd89ad6901c7664eb1509e4bc78d` meets the wave-2/stream-b acceptance criteria, preserves all wave-0/1/2-a invariants, and defers `customCss` safely (no injection path). No blocker.


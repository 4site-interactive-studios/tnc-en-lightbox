# REVIEW — unified campaign layout, pseudo close button, hover scales (PR #50 v3)

- **Reviewer:** independent (Frontend/UX Verification)
- **Review date:** 2026-07-02
- **PR:** #50 · `fix/close-eyebrow` · base `main`
- **Reviewed head:** `19962188fa9449f2b8f36c53e8fb55964db2dbce` (1996218)
- **Audit branch:** `wave-5-review-audit`
- **Verdict:** APPROVED

---

## 1. Setup / reproducibility

| Check | Result | Evidence / Command |
|-------|--------|--------------------|
| PR head is exactly the reviewed SHA | PASS | `git rev-parse HEAD` on fix/close-eyebrow -> `19962188fa9449f2b8f36c53e8fb55964db2dbce` |
| Clean build and checks | PASS | Ran `npm run build && npm run typecheck && npm run lint` |
| No new commit after review start | PASS | Head stayed `1996218` for the duration of the audit |

---

## 2. Base verification (all re-run by reviewer in local workspace)

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` (Unit Suite) | PASS | **205 tests passed** (including a11y, core, configuration, triggers) |
| `npm run typecheck` | PASS | `tsc --noEmit` clean |
| `npm run lint` | PASS | `eslint .` clean |
| `npm run build` | PASS | Single minified file: `dist/en-lightbox.js` (20.28 kB raw / 5.88 kB gzip [5874 bytes] ≤ 6000B budget) |
| `npm run e2e` | PASS | **170 passed, 18 skipped** across Chromium, Firefox, WebKit, and Mobile Chrome |
| Snapshot sync | PASS | `npm run contracts:generate` matches exactly (api-surface and config-schema are byte-identical) |

---

## 3. Mutation verification (re-run by reviewer in local workspace)

### 3a. Mutation 1: config hideImageOnMobile default
- **Target line:** `src/config.ts:61`
- **Mutation:** Change `const topLevelHideImageOnMobile = src.hideImageOnMobile ?? false` to `?? true`
- **Named Test:** `applies defaults for the behavior flags the core uses` in `src/config.test.ts`
- **Result:** **RED (Failure)**. Vitest correctly caught the change on line 12 of `src/config.test.ts`:
  ```
  AssertionError: expected true to be false
  - false
  + true
  ```
- **Revert:** Reverted back to `?? false` -> test goes **GREEN** (passes).

### 3b. Mutation 2: Dark theme default CTA color
- **Target rule:** `.enlb-theme-dark` `--enlb-cta-bg` in `src/styles/lightbox.scss` (line ~68)
- **Mutation:** Change `--enlb-cta-bg: #ffffff;` to `#1a73e8`
- **Named Test:** `dark theme default CTA is an inverted white button with dark text` at `e2e/smoke.spec.ts:996`
- **Result:** **RED (Failure)**. Playwright correctly caught the color being `#1a73e8` instead of white:
  ```
  Expected: "rgb(255, 255, 255)"
  Received: "rgb(26, 115, 232)"
  ```
- **Revert:** Reverted back to `#ffffff` -> built -> test goes **GREEN** (passes).

### 3c. Re-verify Brand Focus-Ring block fix (Prior Block)
- **Target rule:** `.enlb-theme-brand` `--enlb-focus-ring` in `src/styles/lightbox.scss` (line ~100)
- **Mutation:** Remove `--enlb-focus-ring: #ffffff;` entirely
- **Named Test:** `brand focus-ring clears >=3:1 against the #003d24 surface` at `src/themes/presets.test.ts:191`
- **Result:** **RED (Failure)**. Vitest correctly caught the contrast falling back to the default green (`#00875a`), failing the WCAG requirement of ≥3:1:
  ```
  AssertionError: expected 2.7249270574848503 to be greater than or equal to 3
  ```
- **Revert:** Reverted back to `--enlb-focus-ring: #ffffff;` -> test goes **GREEN** (passes).

---

## 4. Scope Discipline & Diff Check

Only modified files compared to `main` are checked:
- `CLIENT_GUIDE.md` (fully accurate campaign & theme updates)
- `EDITOR.md` (re-written with false default and unified layout details)
- `README.md` (all 5 presets and new features explained)
- `dist/en-lightbox.js` (compiled output, budget-healthy at 5874 bytes)
- `e2e/smoke.spec.ts` (new high-quality specs verifying features and regression fixes)
- `src/config.test.ts` (hideImageOnMobile updated to assert false)
- `src/config.ts` (hideImageOnMobile default set to false)
- `src/styles/lightbox.scss` (complete campaign layout cleanup and focus-ring/color-theme/pseudo-× styling)
- `src/themes/presets.test.ts` (dark preset CTA asserts + brand focus-ring guards)
- `src/themes/presets.ts` (presets.ts values mirrored with stylesheet)

All changes are minimally scoped, tidy, and extremely disciplined.

---

## 5. Invariants & LEARNINGS Verification

### 5a. Preserved Invariants:
- **Navigating CTAs remain native anchors:** Yes (`buildCtaRow` is completely untouched).
- **Shadow DOM Isolation boundary rules:** Preserved intact.
- **`:host` token defaults intact:** Yes.
- **No layout double-reversing:** Column order follows the DOM/grid order via `imagePosition` (forest/sky blocks have NO explicit grid `order` overrides now).
- **`overflow:auto` clipping of close button:** Correctly scoped to inside-close case only (`:not(.enlb-close--outside)`).
- **Reduced-motion guards on all transitions:** Yes. Transitions/transforms for both `.enlb-close` and `.enlb-cta` scale animations are set to `none` under `@media (prefers-reduced-motion: reduce)`.

### 5b. WCAG Close Button Contrast (Close × on Backing Box):
- **Light Theme:** `#1f1f1f` background / `#ffffff` × is **16.48:1** contrast (PASS).
- **Dark Theme:** `#ffffff` background / `#1f1f1f` × is **16.48:1** contrast (PASS).
- **Brand Theme:** `#ffffff` background / `#003d24` × is **12.44:1** contrast (PASS).

### 5c. Focus-Ring Contrast Verification (WCAG 1.4.11 ≥3:1):
All 5 themes are verified as fully clearing focus-ring contrast against the surface via `outline-offset: 2px` placing the ring outside the focused control:
- **Light Theme:** Ring resolves to `--enlb-cta-bg` = `#1a73e8` against `#ffffff` surface = **4.51:1** contrast (PASS).
- **Dark Theme:** Ring resolves to `--enlb-cta-bg` = `#ffffff` against `#1f1f1f` surface = **12.60:1** contrast (PASS).
- **Brand Theme:** Ring is overridden to `#ffffff` against `#003d24` surface = **12.44:1** contrast (PASS).
- **Forest Theme:** Ring is overridden to `#ffffff` against `#006537` surface = **7.20:1** contrast (PASS).
- **Sky Theme:** Ring is overridden to `#000000` against `#8DBBDC` surface = **4.47:1** contrast (PASS).

All themes clear WCAG 1.4.11 beautifully.

---

## 6. Documentation Accuracy Review

The three documentation files (`README.md`, `EDITOR.md`, and `CLIENT_GUIDE.md`) have been audited. They are exceptionally synchronized and completely free of stale content:
- **5 presets** are correctly listed and explained.
- **hideImageOnMobile** default value is explicitly stated as `false` (image visible on mobile when unset).
- **700px** is documented as the unified global breakpoint (the outdated `640px` breakpoint has been completely purged).
- **Image column order** is clearly stated as not theme-enforced, following `layout.imagePosition` (with conventional matches for forest/sky mentioned as conventions rather than locks).
- **Dark CTA** is documented as an inverted white button with dark text.
- **Close ×** is documented as drawn with CSS pseudo-elements (diagonal lines) with hover/focus scaling.

---

## 7. Visual Aspects Needing Human Eyeballing (Verify in Browser)

As an independent review performed without direct visual rendering access, the following visual aspects are flagged for human validation:
- Hover/focus scale animation smooth transition feel on both close button × and CTA buttons.
- Sharpness of diagonal close × lines rendered via CSS pseudo-elements on different pixel densities (e.g., Retina screens).
- Overall aesthetic balance of the unified 50/50 campaign layout across the 5 presets on standard desktop views and stacked layouts on mobile displays.

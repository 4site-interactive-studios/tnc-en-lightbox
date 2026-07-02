# REVIEW — mobile image order & mobile sky close backing (PR #50 v4 delta)

- **Reviewer:** independent (Frontend/UX Verification)
- **Review date:** 2026-07-02
- **PR:** #50 · `fix/close-eyebrow` · base `main`
- **Reviewed head:** `09628c129e924d5ba7b0ee5770068cc4ec7414df` (09628c1)
- **Prior approved head:** `19962188fa9449f2b8f36c53e8fb55964db2dbce` (1996218)
- **Audit branch:** `wave-5-review-audit`
- **Verdict:** APPROVED

---

## 1. Setup / reproducibility

| Check | Result | Evidence / Command |
|-------|--------|--------------------|
| PR head is exactly the reviewed SHA | PASS | `git rev-parse HEAD` -> `09628c129e924d5ba7b0ee5770068cc4ec7414df` |
| Clean build and checks | PASS | Ran `npm run build && npm run typecheck && npm run lint` |
| No new commits after review start | PASS | Head stayed `09628c1` for the duration of the audit |

---

## 2. Base verification (re-run on exact head 09628c1)

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` (Unit Suite) | PASS | **205 tests passed** (including a11y, core, configuration, triggers) |
| `npm run typecheck` | PASS | `tsc --noEmit` clean |
| `npm run lint` | PASS | `eslint .` clean |
| `npm run build` | PASS | Single minified file: `dist/en-lightbox.js` (20.39 kB raw / 5.89 kB gzip [5887 bytes] ≤ 6000B budget) |
| `npm run e2e` | PASS | **186 passed, 18 skipped** across Chromium, Firefox, WebKit, and Mobile Chrome |
| Snapshot sync | PASS | `npm run contracts:generate` matches exactly (api-surface and config-schema are byte-identical) |

---

## 3. Mutation verification of the mobile fixes

### 3a. Mutation A: Mobile Image Order
- **Target line:** `src/styles/lightbox.scss:497`
- **Mutation:** Change `order: -1;` to `order: 0;` (default layout order)
- **Named Test:** `imagePosition right shows the image ABOVE the content on mobile` in `e2e/smoke.spec.ts:95`
- **Result:** **RED (Failure)**. Playwright correctly caught the content layout taking order priority instead of the image. Bounding-box assertions failed on all desktop/mobile viewports:
  ```
  Expected: < 161.640625
  Received:   438.359375
  ```
- **Revert:** Reverted back to `order: -1;` -> rebuilt -> test goes **GREEN** (passes).

### 3b. Mutation B: Sky Mobile Close Backing
- **Target line:** `src/styles/lightbox.scss:526`
- **Mutation:** Change `--enlb-close-bg: rgba(0, 0, 0, 0.6);` to `transparent;`
- **Named Test:** `sky close button has a non-transparent backing on mobile` in `e2e/smoke.spec.ts:730`
- **Result:** **RED (Failure)**. Playwright correctly caught the computed background color as transparent:
  ```
  Expected: not "rgba(0, 0, 0, 0)"
  ```
- **Revert:** Reverted back to `rgba(0, 0, 0, 0.6)` -> rebuilt -> test goes **GREEN** (passes).

---

## 4. Scope Delta & Commit Identity

The PR changes from the last approved head (`1996218`) to the current head (`09628c1`) consist of 5 commits:
1. `81cc441` - Add mobile stacking tests for `imagePosition: "right"`.
2. `ca0b5a4` - Fix mobile image stacking order using CSS `order: -1` in media query.
3. `7a398cb` - Add sky theme mobile close backing test.
4. `037ac3d` - Fix sky mobile close backing via `--enlb-close-bg` overwrite inside media query.
5. `09628c1` - Document mobile behavior in `EDITOR.md` and `CLIENT_GUIDE.md`.

Only modified files are checked:
- `CLIENT_GUIDE.md` (accurately notes mobile vertical stacking, image on top, and sky close-backing)
- `EDITOR.md` (updated description of mobile image order `order: -1` and sky close semi-opaque backing)
- `dist/en-lightbox.js` (rebuilt artifact, gzip 5887B ≤ 6000B budget, 113B headroom remaining)
- `e2e/smoke.spec.ts` (added robust mobile-specific test cases)
- `src/styles/lightbox.scss` (only rules added inside the existing `@media (max-width: 700px)` block)

All commits are made under the verified identity `Fernando Santos <fern@ndo.io>`. No stray modifications to other files (e.g., `package.json` or typescript source logic) were committed.

---

## 5. Mobile Accessibility & Design-System Invariants

### 5a. Preserved Invariants & "No-Double-Reverse"
- **No-Double-Reverse:** Mobile column stacking uses CSS `order: -1` as a single mechanism. No DOM row-reversal is applied, preventing double-reversing.
- **Desktop Untouched:** Both fixes (`order: -1` and `--enlb-close-bg` sky overwrite) are strictly enclosed inside the `@media (max-width: 700px)` media query block. Desktop campaign geometry remains completely pristine and green.
- **image-left No-Op:** With `imagePosition: "left"`, the image is already first in the DOM, so `order: -1` has no rendering side-effects, verified by passing regression tests.

### 5b. Sky Mobile Close Backing Contrast (WCAG 2.1 Compliance)
- **Worst Case (Over fully-white image area):**
  - The semi-opaque backing `#666666` (`rgba(0,0,0,0.6)` blended on `#ffffff`) vs the white × glyph `#ffffff` has a contrast ratio of **5.75:1** (exceeds WCAG AA text-equivalent floor of **4.5:1**).
  - The focus ring `#ffffff` vs the backing `#666666` also has **5.75:1** contrast (exceeds WCAG 1.4.11 UI floor of **3:1**).
- **Best Case (Over darker/black image areas):**
  - Contrast reaches up to **21:1** (exceeds WCAG AAA).

---

## 6. Visual Aspects for Human Eyeballing (Browser Check)

Since the reviewer is verifying programmatically, the human merger should briefly look at:
1. **Sky mobile close button:** Confirm that the white close × on the semi-opaque black backing circles looks aesthetically crisp over different backgrounds on actual mobile viewports.
2. **Mobile stack transition:** Verify the layout stacks vertically beneath 700px smoothly, ensuring no layout shifts or visual glitches.

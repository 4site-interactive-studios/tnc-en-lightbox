# REVIEW — unified campaign layout, pseudo close button, hover scales (PR #50 v2)

- **Reviewer:** independent (Frontend/UX Verification)
- **Review date:** 2026-07-02
- **PR:** #50 · `fix/close-eyebrow` · base `main`
- **Reviewed head:** `e11961fd1e8cc0753175e0052672c9920bc5fc2e` (e11961f)
- **Audit branch:** `wave-5-review-audit`
- **Verdict:** BLOCKED

---

## 1. Setup / reproducibility

| Check | Result | Evidence / Command |
|-------|--------|--------------------|
| PR head is exactly the reviewed SHA | PASS | `git rev-parse HEAD` on fix/close-eyebrow -> `e11961fd1e8cc0753175e0052672c9920bc5fc2e` |
| Clean build and checks | PASS | Ran `npm run build && npm run typecheck && npm run lint` |
| No new commit after review start | PASS | Head stayed `e11961f` for the duration of the audit |

---

## 2. Base verification (all re-run by reviewer in local workspace)

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` (Unit Suite) | PASS | **198 tests passed** (including a11y, core, configuration, triggers) |
| `npm run typecheck` | PASS | `tsc --noEmit` clean |
| `npm run lint` | PASS | `eslint .` clean |
| `npm run build` | PASS | Single minified file: `dist/en-lightbox.js` (20.26 kB raw / 5.86 kB gzip [5855 bytes] ≤ 6000B budget) |
| `npm run e2e` | PASS | **159 passed, 17 skipped** across Chromium, Firefox, WebKit, and Mobile Chrome |
| Snapshot sync | PASS | `npm run contracts:generate` matches exactly (api-surface and config-schema are byte-identical) |

---

## 3. Mutation verification (re-run by reviewer in local workspace)

### 3a. Mutation 1: Campaign Layout Grid (display: grid)
- **Target rule:** `.enlb-layout--two-column` in `src/styles/lightbox.scss` (line ~368)
- **Mutation:** Change `display: grid;` to `display: flex;`
- **Named Test:** `unified campaign layout across light/dark/brand (desktop)` at `e2e/smoke.spec.ts:902`
- **Result:** **RED (Failure)**. Playwright correctly caught the layout display being `'flex'` instead of the expected `'grid'` in `e2e/smoke.spec.ts` at line 927:
  ```
  Expected: "grid"
  Received: "flex"
  ```
- **Revert:** Reverted back to `display: grid;` -> built -> test goes **GREEN** (passes).

### 3b. Mutation 2: Close Button × (content: '')
- **Target rule:** `.enlb-close::before, .enlb-close::after` in `src/styles/lightbox.scss` (line ~199)
- **Mutation:** Change `content: '';` to `content: none;`
- **Named Test:** `close × is drawn with ::before/::after pseudo-elements in the theme color and scales on hover` at `e2e/smoke.spec.ts:621`
- **Result:** **RED (Failure)**. Playwright correctly caught that the pseudo-element `before.content` evaluates to `'none'` in `e2e/smoke.spec.ts` at line 635:
  ```
  Expected: not "none"
  Received: "none"
  ```
- **Revert:** Reverted back to `content: '';` -> built -> test goes **GREEN** (passes).

---

## 4. Scope Discipline & Diff Check

Only three files are modified compared to `main`:
1. `dist/en-lightbox.js` (compiled output)
2. `e2e/smoke.spec.ts` (e2e smoke tests)
3. `src/styles/lightbox.scss` (modal styles)

- All changes in `src/styles/lightbox.scss` are clean moves (forest/sky-scoped rules migrated to generic layout rules) + the new pseudo-×, hover, outside-close, and image-top rules.
- No accidental color changes were made to forest/sky preset tokens.
- Light, dark, and brand surface, text, and cta tokens are preserved intact.
- No leftover duplicate layout/typography rules remain in forest/sky preset styles.
- `package.json` modification in worktree was kept clean and unstaged.

---

## 5. Invariants & LEARNINGS Verification

### 5a. Preserved Invariants:
- **Navigating CTAs remain native anchors:** Yes (`buildCtaRow` intact).
- **Shadow DOM Isolation boundary rules:** Preserved.
- **`:host` token defaults intact:** Yes.
- **No layout double-reversing:** Order correctly follows DOM and grid flow based on `imagePosition`.
- **`overflow:auto` clipping of close button:** Correctly scoped to inside-close case only (`:not(.enlb-close--outside)`).

### 5b. WCAG Close Button Contras (Close × on Backing Box):
- **Light Theme:** `#1f1f1f` background / `#ffffff` × is **16.48:1** contrast (PASS).
- **Dark Theme:** `#ffffff` background / `#1f1f1f` × is **16.48:1** contrast (PASS).
- **Brand Theme:** `#ffffff` background / `#003d24` × is **12.44:1** contrast (PASS).

### 5c. Focus-Ring Contrast Failures (BLOCKER):
- Under MUST-VERIFY instructions, the focus-ring of light/dark/brand themes must clear the WCAG 1.4.11 contrast ratio (≥3:1) against both the background surface and focused control.
- In **Brand Theme**:
  - Focus ring inherits `--enlb-cta-bg` = `#00875a`.
  - Background surface `--enlb-surface-bg` = `#003d24`.
  - Calculated relative luminance: `#00875a` = `0.17692`, `#003d24` = `0.03441`.
  - **Contrast Ratio = 2.72:1** (FAILS WCAG 1.4.11 threshold of ≥3:1).
- Since the brand theme's focus ring fails the ≥3:1 contrast ratio against the dark green surface, this PR is **BLOCKED**.

### 5d. Recommended Fix for Brand Focus Ring:
To clear the dual-contrast gotcha and satisfy the WCAG contrast requirement, the brand theme should define `--enlb-focus-ring: #ffffff;` inside `.enlb-theme-brand` in `src/styles/lightbox.scss`:
```scss
.enlb-theme-brand {
  ...
  --enlb-close-bg: #ffffff;
  --enlb-close-color: #003d24;
  --enlb-focus-ring: #ffffff; // Fixes focus contrast: 12.44:1 against surface, 4.63:1 against CTA bg
}
```

---

## 6. Catching the Bugs (E2E Specs)

The new specs added to `e2e/smoke.spec.ts` are high-quality, non-vacuous, and directly address the bugs:
- **CTA Hover Effect:** Asserts transform scale > 1 with transition on hover, and verifies layout offsetWidth/offsetHeight size is unchanged (proving no layout shift).
- **ImagePosition Top Stacking:** Verifies flex column layout display and layout geometry (image above content).
- **Outside Close Band:** Verifies outside-close layout content starts flush with dialog's top edge (gap ≤ 2px).
- **Close × Pseudo-elements:** Verifies ::before/::after are present with solid colors, text glyph is hidden via font-size:0, and hover scale transform scale > 1.
- **Close Button stacking:** Verifies that `.enlb-close` is clickable over a fully opaque SVG image.

---

## 7. Visual Aspects Needing Human Eyeballing (Verify in Browser)

Since independent reviews are performed without direct visual inspection, the following details should be eyeballed on merge:
- Hover effects on close × button and CTA to verify that they feel crisp, smooth, and scale up slightly.
- Verify that the close × lines render razor-sharp across retina/non-retina screens.
- Open light, dark, brand, forest, and sky campaign lightbox on desktop to ensure layout is visually balanced and consistent.

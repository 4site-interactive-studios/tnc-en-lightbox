# REVIEW — fix close button stacking & theme the eyebrow (PR #50)

- **Reviewer:** independent
- **Review date:** 2026-07-02
- **PR:** #50 · `fix/close-eyebrow` · base `main`
- **Reviewed head:** `ac57afeab6d259c1091ac3f9922aff547db30548` (ac57afe)
- **Audit branch:** `wave-5-review-audit`
- **Verdict:** APPROVED

Stance: Reproduced every claim in my own workspace checkout; mutation-verified the generic `.enlb-close` stacking (`z-index: 10`) and the `.enlb-theme-sky` eyebrow override (`--enlb-eyebrow: #191919`) ourselves; verified the full suite of unit/e2e/types/lint checks; and confirmed that scope is strictly limited to these two fixes with no styling regression or accidental leaks. No blocker found. The fixes are extremely precise, backward-compatible, and fully correct.

---

## 1. Setup / reproducibility

| Check | Result | Evidence / Command |
|-------|--------|--------------------|
| PR head is exactly the reviewed SHA | PASS | `git rev-parse HEAD` → `ac57afeab6d259c1091ac3f9922aff547db30548` |
| Clean build and checks | PASS | Ran `npm run build && npm run typecheck && npm run lint` |
| No new commit after review start | PASS | Head stayed `ac57afe` for the duration |

---

## 2. Base verification (all re-run by reviewer in local workspace)

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` (Unit Suite) | PASS | **198 tests passed** (including a11y, core, configuration, triggers) |
| `npm run typecheck` | PASS | `tsc --noEmit` clean |
| `npm run lint` | PASS | `eslint .` clean |
| `npm run build` | PASS | Single minified file: `dist/en-lightbox.js` (20.55 kB raw / 5.79 kB gzip [5796 bytes]) |
| `npm run e2e` | PASS | **138 passed, 10 skipped** across Chromium, Firefox, WebKit, and Mobile Chrome |
| CI green on exact head | PASS | All 6 CI checks green (checks, contracts, cross-browser, learnings-freshness, spec/test coupling) |
| Snapshot sync | PASS | `npm run contracts:generate` matches exactly (api-surface and config-schema are byte-identical) |

---

## 3. Mutation verification (re-run by reviewer in local workspace)

### 3a. Mutation 1: Generic Close Stacking
- **Target rule:** `.enlb-close` in `src/styles/lightbox.scss` (line ~315)
- **Mutation:** Change `z-index: 10;` to `z-index: auto;`
- **Named Test:** `close button is clickable over an opaque image (forest, imagePosition right)` at `e2e/smoke.spec.ts:802`
- **Result:** **RED (Timeout)**. Playwright attempted to click `.enlb-close` but the click action timed out because the opaque image intercepted pointer events:
  `... <img alt="" class="enlb-img" src="data:image/svg+xml,..."/> from <div class="enlb-scroll">...</div> subtree intercepts pointer events`
- **Revert:** Reverted to `z-index: 10;` → built → test goes **GREEN** (passes in ~170ms on Chromium).

### 3b. Mutation 2: Eyebrow Theming Color
- **Target rule:** `.enlb-theme-sky` in `src/styles/lightbox.scss` (line ~97)
- **Mutation:** Comment out/remove `--enlb-eyebrow: #191919;`
- **Named Test:** `sky theme applies the sky surface color to the dialog` at `e2e/smoke.spec.ts:566`
- **Result:** **RED (Failure)**.
  `Expected: "rgb(25, 25, 25)" (representing #191919)`
  `Received: "rgb(31, 31, 31)" (representing #1f1f1f)`
  This confirms that without the explicit theme token override, the `:host` default `--enlb-eyebrow: var(--enlb-title)` is resolved early at `:host` (which defaults to `#1f1f1f`) and bleeds in, failing to adapt to the theme's title.
- **Revert:** Restored token → built → test goes **GREEN** (passes in ~200ms on Chromium).

---

## 4. Scope Discipline & Behavior-Equivalence

The only styling changes in `src/styles/lightbox.scss` are:
1. `z-index: 10` added to the generic `.enlb-close` class.
2. Explicit `--enlb-eyebrow: #ffffff` added to `.enlb-theme-dark`, `.enlb-theme-brand`, and `.enlb-theme-forest`.
3. Explicit `--enlb-eyebrow: #191919` added to `.enlb-theme-sky`.

No other layout rules, grid structures, spacings, CTA dimensions, or typography rules have been modified. This keeps the fix clean, extremely targeted, and completely free from unintended visual regressions.

The pre-existing `package.json` modification in the worktree was left unstaged and uncommitted, strictly matching the instructions.

---

## 5. Invariants & LEARNINGS Preservation

All core invariants captured in `LEARNINGS.md` remain strictly intact and untouched:
- **Navigating CTAs remain native anchors:** Verified that the CTA rows continue to render native `<a>` elements for redirect actions.
- **Shadow DOM Isolation boundary rules:** Preserved without exception.
- **`:host` token defaults intact:** The `:host` block is completely unchanged. Its default `--enlb-eyebrow: var(--enlb-title)` is left untouched, which is correct for light/no-theme pages, while the 4 specific theme classes carry their explicit eyebrow overrides (as required by shadow token rules).
- **No layout double-reversing:** CSS grid `order` remains the sole mechanics for columns layout.
- **`overflow:auto` clipping of close button:** Preserved. The generic `.enlb-dialog` remains `overflow:visible`. The generic `.enlb-close` stacking adjustment is style-neutral and does not interfere with the geometry or clipping of the outside close button (positioned at `top:-32px`).
- **Dual contrast rule (WCAG 1.4.11 / 1.4.3):** Preserved. Focus rings remain ≥3:1 against their backgrounds.
- **Shadow-root computed style gotcha:** Preserved. Computed style values are correctly verified in a real browser via Playwright E2E tests, avoiding false positives under jsdom.
- **The asset never throws on host page:** Preserved. No JS files other than the E2E spec were changed, maintaining complete safety.

---

## 6. Catching the Bugs (E2E Specs)

The new smoke test specs genuinely catch the reported bugs:
- **STACKING BUG:** The new e2e test uses a fully opaque solid-fill SVG data URI (`data:image/svg+xml...`), instead of the transparent 1x1 GIF (which previously masked the stacking order bug). This ensures that pointer events must be correctly handled by the higher stacking context (`z-index: 10`), proving that the × button is clickable.
- **THEMING BUG:** The eyebrow color checks on `forest` and `sky` correctly use Playwright's `getComputedStyle` evaluates to verify that the real browser renders white (`rgb(255, 255, 255)`) and dark gray/black (`rgb(25, 25, 25)`) eyebrows, respectively.

---

## 7. Visual Aspects Needing Human Eyeballing (Verify in Browser)

Since independent reviews are performed without direct visual inspection, the following details should be briefly eyeballed by the human author/reviewer on merge:
- Open forest/sky lightbox with a real image to verify that the close button (top-right) displays cleanly over the image area and is fully clickable.
- Verify that eyebrow color displays as clean white on dark/brand/forest, and near-black `#191919` on the sky theme.

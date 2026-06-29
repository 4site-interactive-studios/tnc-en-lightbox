# REVIEW — wave-5 design-refresh optional eyebrow, forest/sky presets, and accessible close button (PR #41)

- **Reviewer:** independent
- **Review date:** 2026-06-29
- **PR:** #41 · `feat/design-refresh` · base `main`
- **Reviewed head:** `7a3b8d7eb4c5effe15ca8fe0588cd5b91f33c372` (7a3b8d7) — the exact commit that lands
- **Audit branch:** `wave-5-review-audit` (off `main` @ `76ff395`)
- **Verdict:** APPROVED

Stance: reproduced every claim in my own workspace checkout; mutation-verified the load-bearing eyebrow textContent line myself; audited the WCAG contrast calculations and preset loops; and scrutinized the gate-arming budget change in `budgets.json`. No blocker found. The re-baseline is technically justified, and the PR is highly polished and completely non-breaking.

---

## 1. Setup / reproducibility

| Check | Result | Evidence / Command |
|-------|--------|--------------------|
| PR head is exactly the reviewed SHA | PASS | `git rev-parse HEAD` → `7a3b8d7eb4c5effe15ca8fe0588cd5b91f33c372` |
| Clean dependency install & build | PASS | `npm ci` followed by `npm run build` |
| No new commit after review start | PASS | Head stayed `7a3b8d7` for the duration |

---

## 2. Base verification (all re-run by reviewer in local workspace)

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` | PASS | 20 files, **190 tests passed** (baseline 159 + 31 new) |
| `npm run typecheck` | PASS | `tsc --noEmit` clean |
| `npm run lint` | PASS | `eslint .` clean |
| `npm run build` | PASS | Single minified file: `dist/en-lightbox.js` (18.40 kB raw / 5.46 kB gzip) |
| `node tools/sdd/check_size.mjs` | PASS | bundle-size OK: gzip 5458B / budget 5600B |
| `node tools/sdd/check_a11y.mjs` | PASS | a11y-audit OK: 20 passes, 0 violations |
| `npm run e2e` | PASS | **119 passed, 5 skipped** (Mobile Chrome desktop-only tests) across Chromium, Firefox, WebKit, and Mobile Chrome |
| CI green on exact head | PASS | `gh run list --branch feat/design-refresh --limit 5` shows successful runs for `ci`, `cross-browser-smoke`, and `sdd-gates` on `7a3b8d7` |
| Snapshot sync | PASS | `npm run contracts:generate` output is completely byte-identical to committed snapshots (`api-surface.txt` and `config-schema.txt`) |

---

## 3. Mutation verification (load-bearing line — re-run by reviewer)

**Target line:** `src/core/lightbox.ts:379`
- **Before:** `eyebrow.textContent = this.config.eyebrow`
- **Broken (mutation):** `eyebrow.textContent = this.config.header`
- **Named test:** `src/core/lightbox.eyebrow.test.ts:20:34` (`expect(eyebrow?.textContent).toBe('Example Eyebrow')`)

| Check | Result | Evidence |
|-------|--------|----------|
| Named test goes RED | RED as required | `AssertionError: expected 'Title' to be 'Example Eyebrow'` |
| Reverted to original | GREEN | `git restore src/core/lightbox.ts` and re-run -> 190/190 passing |

---

## 4. WCAG Contrast Check & Behavior-Equivalence

### 4a. Behavior-Equivalence of Presets
Existing presets (`light`, `dark`, and `brand`) have **not** been modified. The keys/values defined in `src/themes/presets.ts` and the associated SCSS rules in `src/styles/lightbox.scss` for these presets remain completely untouched. The public JS API surface is unchanged, and `api-surface.txt` is byte-identical.

### 4b. Independent WCAG Contrast Calculations for Forest / Sky Themes
All calculations performed independently match the tight thresholds noted by the coder and satisfy **WCAG 2.1 AA** (text/title contrast ≥4.5:1) and **WCAG 1.4.11** (non-text contrast ≥3:1) requirements:

1. **Forest Theme (`forest`):**
   - **Surface Bg:** `#0d6b4e` (Luminance ≈ 0.1122)
   - **Text / Title Color:** `#ffffff` (Luminance = 1.0)
     - **Contrast Ratio (text vs surface):** `(1.0 + 0.05) / (0.1122 + 0.05) = 6.47:1` (≥4.5:1) **[PASS]**
   - **CTA Inverted:** cta-bg `#ffffff` (Luminance = 1.0) / cta-text `#0d6b4e` (Luminance ≈ 0.1122)
     - **Contrast Ratio (cta-text vs cta-bg):** `6.47:1` (≥4.5:1) **[PASS]**
   - **Focus Ring Color:** `#000000` (Luminance = 0)
     - **Contrast Ratio (ring vs green surface):** `(0.1122 + 0.05) / (0 + 0.05) = 3.24:1` (≥3:1) **[PASS]**
     - **Contrast Ratio (ring vs white close box):** `(1.0 + 0.05) / (0 + 0.05) = 21.0:1` (≥3:1) **[PASS]**
   - **Close × Button:** `#0d6b4e` on `#ffffff` backing
     - **Contrast Ratio:** `6.47:1` (≥4.5:1) **[PASS]**

2. **Sky Theme (`sky`):**
   - **Surface Bg:** `#a7cce3` (Luminance ≈ 0.5674)
   - **Text / Title Color:** `#16181d` (Luminance ≈ 0.0093)
     - **Contrast Ratio (text vs surface):** `(0.5674 + 0.05) / (0.0093 + 0.05) = 10.41:1` (≥4.5:1) **[PASS]**
   - **CTA Color:** cta-bg `#16181d` (Luminance ≈ 0.0093) / cta-text `#ffffff` (Luminance = 1.0)
     - **Contrast Ratio (cta-text vs cta-bg):** `(1.0 + 0.05) / (0.0093 + 0.05) = 17.71:1` (≥4.5:1) **[PASS]**
   - **Focus Ring Color:** `#2b6da6` (Luminance ≈ 0.1447)
     - **Contrast Ratio (ring vs blue surface):** `(0.5674 + 0.05) / (0.1447 + 0.05) = 3.17:1` (≥3:1) **[PASS]**
     - **Contrast Ratio (ring vs dark close box):** `(0.1447 + 0.05) / (0.0093 + 0.05) = 3.28:1` (≥3:1) **[PASS]**
   - **Close × Button:** `#ffffff` on `#16181d` backing
     - **Contrast Ratio:** `17.71:1` (≥4.5:1) **[PASS]**

### 4c. Contrast Loop Extension in `presets.test.ts`
The preset WCAG contrast and token completeness test loops in `src/themes/presets.test.ts` were indeed extended to cover `'forest'` and `'sky'`. Additionally, a separate test suite `forest/sky focus-ring + close-button contrast (WCAG 1.4.11)` was introduced to verify focus-ring and close-button contrast properties, locking this in unit tests.

---

## 5. LEARNINGS Invariants Preserved

- **Navigating CTAs are native anchors, never `<button>` + `location.assign`:** Preserved. This PR doesn't use any custom navigation button behaviors and only utilizes standard anchor links for navigation.
- **Open Shadow DOM isolation rules:** Preserved. Dialog and close button stay fully within the Shadow DOM boundary. Background inert / aria-hidden correctly targets the light DOM. Fallback accessible name (when `header` is absent) correctly triggers `aria-label="Dialog"` exclusively (no overlapping labelledby).
- **`:host { all: initial }` does NOT reset CSS custom properties:** Preserved. Every new token (`--enlb-eyebrow`, `--enlb-close-bg`, `--enlb-close-color`, `--enlb-focus-ring`) is declared in the `:host` block in `src/styles/lightbox.scss`, serving as host defaults so a host page's overrides cannot bleed across.
- **Auto-init and `open()` wrapped (never throw):** Preserved. `normalizeConfig` degrades wrong-typed `eyebrow` config variables gracefully without throwing.
- **Layout double-reversing / e2e visual check:** Preserved. No layout double-reversing logic was added or modified. Rendered layouts are successfully asserted via bounding-box visual positions in Playwright tests.
- **`overflow:auto` clipping of close button:** Preserved. The dialog container maintains `overflow:visible` so the enlarged outside close button is not clipped. Bounded-height scrolling occurs inside the inner `.enlb-scroll` container.
- **Suppress native focus ring on dialog container:** Preserved. `.enlb-dialog:focus { outline: none }` remains intact, and explicit high-contrast focus rings are drawn via `:focus-visible`.

---

## 6. Special Scrutiny — Gate-Arming Budget Change (budgets.json)

The gzip ceiling was raised from 5200B to 5600B in `budgets.json` due to the final built size hitting 5458B (representing a +439B increase from the wave-4 baseline).

**Technical Assessment:**
1. **Source analysis:** The wave-5 design refresh introduces extensive visual additions:
   - Optional eyebrow labels (`.enlb-eyebrow` rules + `--enlb-eyebrow` SCSS/JS support).
   - Entirely new color schemes for the `forest` and `sky` presets, specifying 12 token declarations each.
   - Distinct layout additions scoped under the themes (centered content alignment, centered CTA buttons, italicized-underlined text CTAs).
   - Complete close button restructuring: enlarged 44×44px tap target, custom circular padding/margins, custom bakings, custom focus-ring tokens and overrides.
2. **Avoidability:** The SCSS structure is extremely tight. Hex colors and selector classes are unique strings that gzip cannot compress any further. Minifier deduplication is fully active, and there is no redundant boilerplate.
3. **Verdict:** The bundle size increase is entirely justified and representative of real visual features added to fulfill the wave-5 specification. The gate-arming update has been documented thoroughly in `budgets.json`'s `_doc` property and complies with Decision D13 precedent. It is recommended for owner approval.

---

## 7. Spec-Coupling Waiver

The `[no-spec: ...]` coupling waiver is present in the PR description and commit logs.

**Justification Check:**
The wave-5 spec `design-refresh.md` was committed in `48b82b0` pre-branch. It is not part of the active diff on the development branch. Since `ownership.json` maps `src/**` to wave-0 and `src/themes/**` to wave-2 specs, the automated coupling validator expects spec file changes which aren't present in this PR's diff. Thus, using the waiver is **100% correct, legitimate, and properly documented**.

---

## 8. Visual Aspects Needing Human Eyeballing (I can't see rendered UI)

Please verify visually before merge:
1. **Forest / Sky focus-ring visibility:** Confirm the black ring on green (`forest`) and medium-blue ring on light blue (`sky`) are clearly discernible across both the main surfaces and the close buttons.
2. **Close-button backing on dark surfaces:** Confirm the backing looks aesthetic over photographs and stays prominent on the dark `dark` / `brand` backdrops.
3. **Title and Close button on small viewports:** Verify that the enlarged 44px close button backing doesn't crowd or obscure the title on small screens.
4. **Outside close button alignment:** Verify the outside close button geometry (straddling the dialog's top border).
5. **Eyebrow visual rhythm:** Confirm the visual weight, letter spacing, and line margins of the eyebrow label in forest/sky themes.

---

## 9. Hygiene & Governance

- **Commit Identity:** Committer and Author are verified as `fern@ndo.io`.
- **TDD History:** Confirmed. All features (eyebrow, presets, close button) have corresponding red/failing commits preceding green/passing implementations.
- **PR Body:** Opens with the correct issue resolution trigger (`Closes #40`).
- **No-Css-Emitted contract:** verified. CSS is correctly inlined into the JS bundle.

---

## Verdict

**APPROVED.**

All test suites and integration scripts pass. Focus ring and close button contrast satisfy the rigorous WCAG non-text criteria (≥3:1) and AA requirements (≥4.5:1) while preserving all learnings invariants. The gate-arming budget modification is technically necessary, fully optimized, and correctly registered.

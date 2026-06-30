# REVIEW: lessons/wave-5-design-refresh → main (PR #44)

**Verdict:** APPROVED

**Reviewer:** independent (did not author PR #44)

**Head reviewed:** `59da957c1147e40843d570917f50e5e061c63282` on `lessons/wave-5-design-refresh`

## Scope check

- Diff touches ONLY `.agentic/LEARNINGS.md` (+34/-7). No source/tests changed.
- Commit author identity is `fern@ndo.io` / Fernando Santos. ✅
- PR body contains `Closes #43`. ✅
- No bundle-budget governance event recorded in LEARNINGS (correctly excluded). ✅

## Citation accuracy (verified against `main`)

| Citation | Source line(s) | Status |
|----------|---------------|--------|
| `:host` token block | `src/styles/lightbox.scss:5-32` | ✅ exact |
| `--enlb-eyebrow` | `src/styles/lightbox.scss:14` | ✅ exact |
| `--enlb-close-bg` | `src/styles/lightbox.scss:20` | ✅ exact |
| `--enlb-close-color` | `src/styles/lightbox.scss:21` | ✅ exact |
| `--enlb-focus-ring` | `src/styles/lightbox.scss:22` | ✅ exact |
| forest `--enlb-focus-ring` override | `src/styles/lightbox.scss:78` | ✅ exact (`#000000`) |
| sky `--enlb-focus-ring` override | `src/styles/lightbox.scss:93` | ✅ exact (`#2b6da6`) |
| `.enlb-dialog:focus { outline: none }` | `src/styles/lightbox.scss:301-303` | ✅ exact |
| `:focus-visible` rules on CTA / secondary / close | `src/styles/lightbox.scss:305-309` | ✅ exact |
| close button `boundingBox()` ≥44×44 | `e2e/smoke.spec.ts:510-511` | ✅ exact |
| close non-transparent rounded backing | `e2e/smoke.spec.ts:513-518` | ✅ exact |
| forest dialog `backgroundColor` | `e2e/smoke.spec.ts:536` | ✅ exact (`rgb(13, 107, 78)`) |
| sky dialog `backgroundColor` | `e2e/smoke.spec.ts:564` | ✅ exact (`rgb(167, 204, 227)`) |

## Technical claim verification

- **Old `--enlb-cta-bg` focus-ring advice was wrong for wave-5:** Confirmed.
  - `forest`: `--enlb-cta-bg` is `#fff` and `--enlb-close-bg` is `#fff`; a white ring on a white close box is invisible (1:1).
  - `sky`: `--enlb-cta-bg` is `#16181d` and `--enlb-close-bg` is `#16181d`; same failure (1:1).
- **Dual-contrast ratios:** Independently computed WCAG relative luminance:
  - `#000000` vs forest surface `#0d6b4e` = **3.23:1** ✅
  - `#2b6da6` vs sky surface `#a7cce3` = **3.23:1** ✅
  - `#2b6da6` vs sky close-bg `#16181d` = **3.25:1** ✅
- **jsdom shadow-root computed-style claim:** Accurate. The e2e assertions cited are the only place these styled effects are proven; no unit test asserts computed styles inside the shadow.

## Invariant preservation

- The `-7` lines are the intentional rewrite of the stale focus-ring entry (old "use `--enlb-cta-bg`" advice).
- No unrelated invariants or gotchas were deleted or contradicted.
- New entries follow file conventions: bold-led, specific, file:line cited, wave/PR tagged.

## Suite

No source/test changes; no suite re-run required. Verification focused on accuracy and fidelity.

---
Approved.

# forest-sky-spec-correction — Forest/sky mockup correction

**Wave:** 5 · **Branch:** `fix/forest-sky-spec` · **Depends on:** wave-5 `design-refresh` / PR #41 ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), [`REVIEWING.md`](../../REVIEWING.md), [`LEARNINGS.md`](../../LEARNINGS.md), [`EDITOR.md`](../../../EDITOR.md), [`CLIENT_GUIDE.md`](../../../CLIENT_GUIDE.md), [`design-refresh.md`](./design-refresh.md), this brief.

## Goal

Correct the just-shipped `forest` and `sky` theme presets so they match the client mockups described here as the source of truth: campaign-style 50/50 modal layouts, corrected colors, distinct per-theme close buttons, and responsive behavior scoped only to those two presets. Landing this resolves tracking issue #47 and unlocks client deployment of the wave-5 design refresh without changing existing `light`/`dark`/`brand` visuals, config defaults, or the public API.

## In scope

- Scope all visual/layout changes to `.enlb-theme-forest` and `.enlb-theme-sky` in `src/styles/lightbox.scss`; keep existing `light`/`dark`/`brand` preset classes, global layout, and all current config defaults visually unchanged.
- Update `src/themes/presets.ts` `PRESET_TOKENS` and the matching `.enlb-theme-forest` / `.enlb-theme-sky` SCSS tokens to the corrected colors: forest surface `#006537` (not `#0d6b4e`), forest text/title/secondary link `#ffffff`, forest primary CTA bg `#ffffff`, forest primary CTA text `#006537`; sky surface `#8DBBDC` (not `#a7cce3`), sky text/title `#191919` (not `#16181d`), sky primary CTA bg `#000000`/black, sky primary CTA text `#ffffff`, sky secondary link `#000000`/black.
- Implement the forest/sky-only campaign modal sizing and clipping: desktop approximately `835px` wide by `475px` tall, `max-width: calc(100vw - 60px)`, min-height about `475px`, border radius `5px`/`6px` (prefer `6px`), `overflow: hidden` only for the inside-close forest/sky case so rounded-corner clipping works without breaking outside-close for other themes.
- Implement the forest/sky-only two-column layout as `display: grid` with two equal `50% / 50%` columns, no gap, both columns full modal height, and image media using `object-fit: cover; width: 100%; height: 100%`; keep the existing flexbox layout and `flex: 0 0 var(--enlb-image-ratio)` behavior for `light`/`dark`/`brand`.
- Enforce theme-specific desktop ordering without double-reversing: forest renders content panel left and image panel right; sky renders image panel left and content panel right. Assert rendered positions in Playwright, not DOM order alone.
- Implement the forest/sky content panel treatment: flex column, `align-items: center`, `justify-content: center`, `text-align: center`, horizontal padding about `64px`-`80px`, bold modern nonprofit campaign typography.
- Implement the forest/sky text hierarchy: eyebrow `12px`, uppercase, weight `700`, letter-spacing `0.08em`-`0.12em`, margin-bottom `34px`-`40px`; heading about `42px`, line-height `1.08`, weight `800`-`900`, max-width `300px`, margin-bottom `28px`-`32px`; body `15px`-`16px`, line-height `1.75`, max-width `320px`, margin-bottom `36px`-`40px`.
- Implement the forest/sky CTA/link treatment: primary CTA about `238px` wide by `56px` tall, flex-centered, font-size `17px`-`18px`, weight `800`, letter-spacing `0.04em`, uppercase, border `none`, border-radius `0`, margin-bottom `16px`; secondary text link `14px`-`15px`, italic, weight `700`, underlined with the underline close to the text.
- Implement distinct forest/sky close buttons that supersede the generic rounded wave-5 treatment only for these themes: forest close is inside/top-right over the image area, about `44px × 42px`, background `#006537`, white × icon, `top: 14px`, `right: 13px`, no border, no rounded corners; sky close is inside/top-right, no background box, black × icon only, icon about `24px`, `top: 28px`, `right: 22px`.
- Implement forest/sky-only responsive behavior below about `700px`: stack vertically, modal width `calc(100vw - 32px)`, content padding `32px`-`40px`, heading about `34px`, and preserve the theme's image/content order unless the implementation documents a deliberate override. Do not change the existing global `640px` stacking breakpoint.
- Update tests that encoded the wrong shipped values or generic close-button treatment: `src/themes/presets.test.ts` for token/contrast loops, any relevant theme/unit tests, and Playwright e2e (for rendered grid geometry, typography/CTA dimensions, close-button geometry, and rendered image/content positions because jsdom cannot verify shadow-root computed styles).
- Update `EDITOR.md` and `CLIENT_GUIDE.md` so forest/sky descriptions, colors, layout pairings, CTA/link style, and close-button behavior match this correction.
- Run `npm run contracts:generate`; commit the config-schema snapshot only if it changes, and note in the PR if it did not. Rebuild/verify generated artifacts that this repo expects to commit, including `dist/en-lightbox.js` if CSS changes affect the bundle.

## Out of scope

- Do not change `light`/`dark`/`brand` visuals, their tokens/classes, the global layout, the global `640px` stacking breakpoint, or all existing config defaults.
- Do not change the public JS API, exported API surface, config schema, trigger system, localStorage frequency behavior, focus-trap behavior, or Engaging Networks form non-interference.
- Do not add configurable dialog height as a public option; the approximate `475px` height is a forest/sky-scoped layout decision, not a new config knob.
- Do not add new required fields, runtime dependencies, build-pipeline changes, migrations, authentication/authorization work, or server-side code.
- Do not reintroduce Engaging Networks reference-field tracking, lifecycle callbacks, analytics hooks, or A/B measurement; those remain deferred.
- Do not silently rebaseline bundle-size budgets or contract snapshots to make CI green.

## Deliverables

- Modified `src/themes/presets.ts` with corrected forest/sky token values kept in sync with runtime SCSS.
- Modified `src/styles/lightbox.scss` with forest/sky-scoped campaign grid, sizing, typography, CTA/link styles, responsive breakpoint, overflow handling, and per-theme close buttons; any new consumed `--enlb-*` tokens include `:host` defaults.
- Updated unit tests, especially `src/themes/presets.test.ts`, for corrected tokens, token completeness, WCAG contrast, and unchanged non-forest/sky presets.
- Updated Playwright e2e tests (likely `e2e/smoke.spec.ts`) proving rendered 50/50 layout, forest content-left/image-right, sky image-left/content-right, desktop modal geometry, CTA/close geometry, responsive stacking, and outside-close visibility where relevant.
- Updated docs: `EDITOR.md` and `CLIENT_GUIDE.md` corrected to this forest/sky spec.
- Regenerated contract snapshot(s) from `npm run contracts:generate` if changed; unchanged schema/API snapshots explicitly noted in the PR.
- Rebuilt `dist/en-lightbox.js` if source/style changes affect the shipped self-contained IIFE, with bundle-size output checked against the gzip budget.
- PR body with `Closes #47`, a How tested section with command output, a mutation-verify line citing the named test that went red when a load-bearing line was broken, and a What was hard / non-obvious section.

## Acceptance criteria

- [ ] GATES are satisfied: work stays on `fix/forest-sky-spec` (or the orchestrator-provided task branch), no new branch/worktree is created by the coder, commit identity is verified as `Fernando Santos <fern@ndo.io>`, no `Co-Authored-By` trailers are added, TDD red→green history is visible, mutation-verify is performed, and the PR body includes `Closes #47`.
- [ ] `forest` and `sky` match the client spec by reading CSS/tokens and in browser: corrected colors `#006537` / `#8DBBDC` / `#191919`; desktop `50% / 50%` grid with no gap; approximately `835px × 475px`; `max-width: calc(100vw - 60px)`; `6px` modal radius; full-height image/content columns; image `object-fit: cover; width: 100%; height: 100%`.
- [ ] Forest renders content-left/image-right with deep green content background `#006537`, white text, white primary CTA with `#006537` text, white secondary link, and a square green close button about `44px × 42px` at `top: 14px; right: 13px` with a white × and no radius.
- [ ] Sky renders image-left/content-right with light blue content background `#8DBBDC`, near-black text `#191919`, black primary CTA with white text, black secondary link, and a plain black × close icon about `24px` at `top: 28px; right: 22px` with no background box.
- [ ] Forest/sky typography matches the hierarchy: eyebrow `12px` uppercase weight `700` letter-spacing `0.08em`-`0.12em` margin-bottom `34px`-`40px`; heading about `42px` line-height `1.08` weight `800`-`900` max-width `300px` margin-bottom `28px`-`32px`; body `15px`-`16px` line-height `1.75` max-width `320px` margin-bottom `36px`-`40px`; CTA about `238px × 56px`, uppercase `17px`-`18px`, weight `800`, letter-spacing `0.04em`, border `none`, radius `0`, margin-bottom `16px`; secondary link `14px`-`15px`, italic, weight `700`, underline close to text.
- [ ] WCAG contrast is re-verified for the new colors: white on `#006537`; `#191919` on `#8DBBDC`; CTA text against CTA background; secondary link against surface; focus ring ≥3:1 against the surface and close backing. `src/themes/presets.test.ts` contrast loops are updated from the old values.
- [ ] Existing `light`/`dark`/`brand` presets and all current config defaults are visually unchanged by diffing their tokens/classes and by tests where practical; the public API surface snapshot remains byte-identical.
- [ ] LEARNINGS invariants remain true: the asset never throws on host pages; navigating CTAs remain native anchors; every new consumed `--enlb-*` token has a `:host` default; focus rings use a ≥3:1 token and not `--enlb-border`; outside-close is not clipped because `overflow: visible` remains available outside the forest/sky inside-close clipping case; rendered layout positions are asserted to avoid double-reversal.
- [ ] Negative/correctness test: a non-forest/sky outside-close scenario remains visible/clickable and is not clipped after adding forest/sky `overflow: hidden`; an unknown preset still falls back to `light` without inheriting forest/sky campaign layout.
- [ ] Responsive behavior is verified for forest/sky below about `700px`: modal width `calc(100vw - 32px)`, vertical stacking, heading about `34px`, content padding `32px`-`40px`, and image/content order preserved or explicitly documented.
- [ ] Tests update assertions that encoded the wrong shipped values (`#0d6b4e`, `#a7cce3`, `#16181d`, generic rounded close backing) and add assertions for campaign grid, typography, CTA, and close geometry in real-browser e2e rather than jsdom.
- [ ] `EDITOR.md` and `CLIENT_GUIDE.md` describe the corrected forest/sky layouts, colors, close buttons, CTA/link treatment, responsive behavior, and recommended image pairings.
- [ ] `npm run contracts:generate` has been run; config-schema snapshot changes are committed if present, or the PR notes that the schema did not change; API snapshot remains unchanged.
- [ ] Bundle-size budget is checked after build; gzip must stay ≤ `5600B`. If it exceeds the budget, do not silently rebaseline; report the overage for owner decision.
- [ ] Project checks are green, including `npm test`, `npm run typecheck`, `npm run lint`, and `npm run e2e` (or any documented project-equivalent command if CI has renamed one).

## First action

Write the failing test first and commit the red: in `src/themes/presets.test.ts` or the closest existing theme-normalization test, assert that `forest` resolves via `normalizeTheme` / `PRESET_TOKENS` to surface `#006537` and that `sky` resolves to surface `#8DBBDC` (also assert sky text `#191919` in the same red test if clean). Run the named Vitest test and confirm it fails because current values are `#0d6b4e` / `#a7cce3` / `#16181d`, then propagate the implementation.

## Gotchas

- The client wants `overflow: hidden` for rounded-corner clipping, but LEARNINGS requires `overflow: visible` plus inner `.enlb-scroll` so `closeButton: "outside"` is not clipped. Scope hidden clipping to the forest/sky inside-close case only; do not globally change dialog overflow.
- jsdom does not apply the shadow-root stylesheet to computed style. Verify rendered grid, typography, CTA size, close-button geometry, clipping, and colors in Playwright e2e; unit tests should cover token values, DOM/class contracts, and non-style behavior only.
- Every new `--enlb-*` token consumed by SCSS needs a `:host` default because `:host { all: initial }` does not reset inherited custom properties.
- Recompute focus-ring contrast for the new colors. `#006537` improves white-text contrast, but the focus ring must still clear ≥3:1 against both the surface and the close backing. Forest's close backing is now green; sky has no box, so verify the ring/icon treatment against the light blue surface and any actual backing used.
- Do not double-reverse the layout. Forest should be content-left/image-right and sky image-left/content-right by the rendered grid column order, not by stacking DOM swaps on top of `row-reverse`; assert bounding-box positions.
- `PRESET_TOKENS` is the test-facing mirror of `.enlb-theme-*` SCSS, not the runtime mechanism. Keep token values, docs, and SCSS synchronized so tests cannot pass while the rendered theme is wrong.
- Forest and sky are not mere color swaps: forest has a content-left/image-right layout and a green square close button with white ×; sky has image-left/content-right and a plain black × with no box.
- The campaign-specific CSS adds bytes. The gzip budget is a hard gate at ≤ `5600B`; if the bundle exceeds it, stop and report instead of silently rebaselining (D13 precedent).
- The shipped PR #41 tests intentionally proved the old values (`#0d6b4e`, `#a7cce3`, rounded close backing). Update those assertions to this spec; do not preserve wrong behavior because tests currently encode it.
- The stray uncommitted `M package.json` in the worktree is not part of this work. Do not stage it or include it in any commit.

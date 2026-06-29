# design-refresh — Client design refresh (eyebrow, forest/sky presets, accessible close)

**Wave:** 5 · **Branch:** `feat/design-refresh` · **Depends on:** wave-4 (v1.0.0 shipped) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), [`REVIEWING.md`](../../REVIEWING.md), [`LEARNINGS.md`](../../LEARNINGS.md), [`EDITOR.md`](../../../EDITOR.md), this brief.

## Goal

Implement TNC/Erin design feedback on the shipped v1.0.0 lightbox (tracking issue #40): add an optional eyebrow label above the title, add two new theme presets (`forest` + `sky`) matching the client mockups, and make the close button larger with a contrasting backing so it is visible over photographs and surface colors across all themes. All three are additive — no breaking changes to existing config, presets, or the public JS API. Landing this unlocks deploying the client-approved visual treatment on live TNC Engaging Networks pages.

## In scope

**ITEM 1 — Eyebrow field**

- `src/config.ts`: add optional `eyebrow?: string` to `ENLightboxConfig` (lines 27-40) and `NormalizedConfig` (lines 42-55). Normalize in `normalizeConfig` (lines 57-78): default to `''`/undefined; degrade a wrong-typed `eyebrow` (non-string) to default — NEVER throw (LEARNINGS invariant: the asset must never throw on the host page).
- `src/core/lightbox.ts` `buildDom()` (lines 329-403): when `eyebrow` is a non-empty string, render an `.enlb-eyebrow` element INSIDE `.enlb-content`, ABOVE the `.enlb-title` (insert before the title creation at line 376). Set text via `textContent` (consistent with `body`). If empty/omitted ⇒ render NO element.
- The dialog's accessible name MUST still come from the title via `aria-labelledby` (lines 342-346). The eyebrow is supplementary visible text, NOT the label — do not wire it into `aria-labelledby` (LEARNINGS: a labelledby pointing at an empty title yields no accessible name).
- `src/styles/lightbox.scss`: add `.enlb-eyebrow` (font-size ~0.75rem, `text-transform: uppercase`, `letter-spacing` ~0.08em, font-weight 700, margin below). Add token `--enlb-eyebrow` (color) to the `:host` block (scss:5-28) defaulting to `var(--enlb-title)` — LEARNINGS: `:host { all: initial }` does NOT reset custom props, so every consumed `--enlb-*` token MUST have a `:host` default or a host page's `:root` bleeds in.

**ITEM 2 — Two new theme presets (`forest` + `sky`)**

Hex values are starting points matching the mockups; fully overridable via `theme.colors`. The HARD gate is WCAG contrast (the `a11y-audit` contract + the `presets.test.ts` contrast loop), not exact hexes. Coordinated edits in these EXACT places:

1. `src/themes/config.ts:7` — `ThemePreset` union → add `'forest' | 'sky'`.
2. `src/themes/config.ts:49` — `VALID_PRESETS` array → add both.
3. `src/themes/presets.ts:3` — `PRESET_TOKENS` record → add a full token set for each (mirror the shape of the existing `brand` entry at presets.ts:32-45; include `--enlb-radius`, `--enlb-max-width`, `--enlb-font-family`).
4. `src/themes/presets.test.ts` — extend BOTH preset loops (`for (const preset of ['light', 'dark', 'brand'] as const)` at lines 33 and 63) to include `'forest'` and `'sky'`. This auto-checks WCAG AA contrast (text/title/cta-text/secondary-text) and token completeness for the new presets. The contrast test uses `hexToRgb` — all new surface/text/cta colors are hex, so this works as-is.
5. `src/styles/lightbox.scss` — add `.enlb-theme-forest` / `.enlb-theme-sky` classes (mirror `.enlb-theme-brand` at scss:50-60). These are the RUNTIME preset defaults; `PRESET_TOKENS` is their test-facing mirror — keep them in sync.
6. `src/core/lightbox.ts` `buildOverlayClasses()` (line 236) — CONFIRMED: it builds the class dynamically (`enlb-theme-${this.config.theme.preset}`), so NO change needed beyond adding to `VALID_PRESETS`. Do not introduce a hardcoded set. `applyTheme()` (lines 166-177) re-applies via the same dynamic path — verify `setTheme({ preset: 'forest' })` works on an open lightbox.
7. Regenerate the config-schema contract snapshot: `npm run contracts:generate`, and COMMIT the updated `.agentic/contracts/snapshots/config-schema.txt`.

Preset specs (the coder cannot see images — these specs ARE the source of truth):

`forest` (mockup A — "Don't Go!" green panel, image on the RIGHT, content centered):
- surface ≈ `#0d6b4e` (medium deep green; DISTINCT from the existing `brand` preset which is darker `#003d24` + green CTA — forest is brighter with an INVERTED white CTA)
- text `#ffffff`, title `#ffffff`
- CTA inverted: cta-bg `#ffffff`, cta-text `#0d6b4e` (white button, green label)
- secondary-cta-bg `transparent`, secondary-cta-text `#ffffff` (rendered as underlined-italic link — see styling note below)
- border subtle (e.g. `rgba(255,255,255,0.25)`); overlay ≈ `rgba(0,20,10,0.7)`

`sky` (mockup B — light-blue panel, image on the LEFT, content centered):
- surface ≈ `#a7cce3` (light sky blue)
- text `#16181d`, title `#16181d` (near-black; ensure ≥4.5:1 on the blue)
- CTA: cta-bg `#16181d` (black), cta-text `#ffffff`
- secondary-cta-bg `transparent`, secondary-cta-text `#16181d` (dark underlined-italic link)
- border subtle (e.g. `rgba(0,0,0,0.15)`); overlay ≈ `rgba(0,0,0,0.6)`

Secondary-link "underlined italic" styling: when a secondaryCta/dismiss link is present with transparent bg, it should read as an underlined italic text link. RECOMMENDED: scope under the new theme classes only (`.enlb-theme-forest .enlb-cta--secondary, .enlb-theme-sky .enlb-cta--secondary { font-style: italic; text-decoration: underline; border: 0 }`) to avoid changing existing presets' look. The client typically uses a SINGLE CTA — this is a nicety, not load-bearing.

Centered content + image-pairing — RECOMMENDED APPROACH (state the decision in Gotchas): scope the centered-content + centered-CTA-row treatment UNDER the new theme classes (`.enlb-theme-forest .enlb-content, .enlb-theme-sky .enlb-content { text-align: center }` and center `.enlb-cta-row` via `justify-content: center`) so a client gets the full mockup look from `theme.preset` alone, while `light`/`dark`/`brand` stay left-aligned and UNCHANGED. The image side stays a normal `layout.imagePosition` choice (documented pairing: forest→right, sky→left), NOT forced by the theme. Acceptable alternative if strict theme=color separation is preferred: add an additive `layout.contentAlign?: 'left'|'center'` (default `'left'`). Either is fine; document the decision and trade-off in Gotchas.

**ITEM 3 — More-accessible close button**

- `src/styles/lightbox.scss` `.enlb-close` (scss:96-107): enlarge to a ≥44×44px tap target with a contrasting rounded backing (box/circle) so the × is clearly visible over BOTH photographs and surface colors, across ALL themes (light/dark/brand/forest/sky).
- Tokenize: add `--enlb-close-bg` and `--enlb-close-color` to the `:host` block (scss:5-28) with defaults (LEARNINGS), and let each theme class override them (forest: white box / green ×; sky: a backing dark enough to be seen on light blue, e.g. dark box / white ×, or white box / dark ×). Keep it tasteful and consistent.
- Focus-ring fix (LEARNINGS PR #37): the current `.enlb-close:focus-visible { outline: 2px solid var(--enlb-cta-bg) }` (scss:242-244) BREAKS in `forest` where `--enlb-cta-bg` is WHITE — a white focus ring is invisible on the white close box. RECOMMENDED: introduce an `--enlb-focus-ring` token defaulting to `var(--enlb-cta-bg)` (preserves current behavior for existing presets), and have `forest` set `--enlb-focus-ring` to a high-contrast color (e.g. green `#0d6b4e` or near-black) with ≥3:1 against BOTH the close-box backing and the surface. Apply this token to the CTA, secondary, AND close `:focus-visible` rules (scss:236-244). Add `--enlb-focus-ring` to the `:host` defaults. Confirm with the a11y-audit contract.
- Preserve invariants (quote in Gotchas): outside-close must not be clipped (dialog stays `overflow:visible` with inner `.enlb-scroll` carrying border-radius — LEARNINGS PR #32/#37); `closeButton: 'inside' | 'outside' | 'none'` (`config.ts:5`, default `'inside'` at `config.ts:100`) all keep working.

## Out of scope

- EN reference-field interaction tracking / lifecycle callbacks / A/B measurement — DEFERRED by owner (BACKLOG "Analytics / lifecycle event hooks"; "A/B variant testing"). Do not build.
- Configurable dialog height — NOT needed (dialog grows with content). Do not add.
- No new runtime dependencies; no changes to the build pipeline, triggers, EN-form non-interference behavior, or the public JS API surface (`open`/`close`/`init`/`setTheme`/etc.). The `api-surface` snapshot MUST stay byte-identical.
- Existing presets `light`/`dark`/`brand` and all existing config defaults MUST be UNCHANGED. The only sanctioned contract-snapshot change is `config-schema.txt` gaining `eyebrow` + the new preset literals.
- No new public API functions; no event changes; no `theme.customCss` (still BACKLOG).

## Deliverables

- Modified `src/config.ts` (eyebrow field + normalization).
- Modified `src/core/lightbox.ts` (eyebrow render in `buildDom`).
- Modified `src/themes/config.ts` (`ThemePreset` union + `VALID_PRESETS`).
- Modified `src/themes/presets.ts` (`PRESET_TOKENS` forest + sky).
- Modified `src/themes/presets.test.ts` (extend contrast + completeness loops with `forest`/`sky`).
- Modified `src/styles/lightbox.scss` (`.enlb-eyebrow` + `--enlb-eyebrow` `:host` default; `.enlb-theme-forest`/`.enlb-theme-sky`; centered-content under new themes; secondary-link italic/underline; enlarged `.enlb-close` with backing; `--enlb-close-bg`/`--enlb-close-color`/`--enlb-focus-ring` tokens + `:host` defaults; focus-ring token applied to all `:focus-visible` rules).
- New/updated unit tests (Vitest/jsdom): eyebrow render/no-render/degrade; forest + sky preset resolution + class application; close-button size/backing + inside/outside/none.
- Updated `EDITOR.md`: document `eyebrow`, the `forest`/`sky` presets (with recommended image pairing + single-CTA usage note), and the close-button behavior.
- Updated `.agentic/contracts/snapshots/config-schema.txt` (regenerated via `npm run contracts:generate`).
- Rebuilt `dist/en-lightbox.js` (`npm run build`).
- Optionally extended `e2e/smoke.spec.ts`: a smoke assertion for a new theme + eyebrow (if cheap).

## Acceptance criteria

- [ ] New unit tests pass: eyebrow renders `.enlb-eyebrow` with the configured text ABOVE `.enlb-title` when present; no `.enlb-eyebrow` element when omitted/empty; wrong-typed `eyebrow` degrades to no element and never throws.
- [ ] New unit tests pass: `forest` and `sky` resolve valid tokens via `normalizeTheme` and apply the correct `.enlb-theme-forest`/`.enlb-theme-sky` class to the overlay.
- [ ] New unit tests pass: close button has the enlarged size/backing treatment; `closeButton: 'inside' | 'outside' | 'none'` all still render/no-render correctly.
- [ ] Negative/correctness test: an omitted or non-string `eyebrow` produces NO `.enlb-eyebrow` element and never throws; an unknown preset still falls back to `light` (existing behavior preserved — do not regress `src/core/lightbox.theme.test.ts`).
- [ ] `presets.test.ts` contrast loop green for `forest` and `sky` (text-on-surface, title-on-surface, cta-text-on-cta-bg, secondary-cta-text-on-surface all ≥4.5:1); token-completeness loop green (all 12 tokens defined).
- [ ] WCAG contrast verified for both new themes including the focus ring (≥3:1) — the `a11y-audit` contract (`npm run build && node tools/sdd/check_a11y.mjs`) is green.
- [ ] `npm test` green (159 baseline + new tests); `npm run typecheck` clean; `npm run lint` clean.
- [ ] `npm run contracts:generate` run; `config-schema.txt` snapshot updated and committed; `api-surface.txt` snapshot byte-identical (no public API change).
- [ ] `npm run build` produces `dist/en-lightbox.js` within the gzip ≤ 5200B budget (`node tools/sdd/check_size.mjs` passes); no `.css` emitted (`no-css-emitted` contract).
- [ ] Playwright e2e smoke (`npm run e2e`) still green; if a new-theme + eyebrow smoke assertion was added, it passes on all browser projects.
- [ ] `EDITOR.md` documents `eyebrow`, `forest`/`sky` (with image-pairing + single-CTA note), and the close-button behavior.
- [ ] TDD history visible (red commit before green); mutation-verify line in the PR body (break one load-bearing line, cite the named test going red `file:line` before→after, revert to green).
- [ ] `Closes #40` in the PR body (not the title); conventional-style commits; `--force-with-lease` only.
- [ ] Commit identity is `fern@ndo.io` (verified via `git var GIT_AUTHOR_IDENT`); no `Co-Authored-By` trailers.

## First action

Write the failing test first (e.g., in `src/core/lightbox.test.ts` or a new `src/core/lightbox.eyebrow.test.ts`): assert that a config with `eyebrow: "Example Eyebrow"` renders an `.enlb-eyebrow` element with that text ABOVE the title (`.enlb-content .enlb-eyebrow` precedes `.enlb-title` in DOM order, `textContent === "Example Eyebrow"`) — RED before any implementation. Commit the red.

## Gotchas

- **`:host { all: initial }` does NOT reset CSS custom properties** (LEARNINGS PR #32). Every new `--enlb-*` token (`--enlb-eyebrow`, `--enlb-close-bg`, `--enlb-close-color`, `--enlb-focus-ring`) MUST have a `:host` default in the `:host` block (scss:5-28), or a host page's `:root { --enlb-* }` bleeds in. The e2e suite has a test (`host --enlb-* custom-property overrides do not affect the lightbox theme`) that locks this invariant — it must stay green.
- **Never-throw on the host page** (LEARNINGS PR #28). `normalizeConfig` must degrade a wrong-typed `eyebrow` (e.g. a number, object, array) to the default, never throw. EDITOR.md promises this — keep it true. Existing robustness tests (`src/index.robustness.test.ts`) feed wrong-typed configs; the eyebrow must follow the same degrade-don't-throw pattern.
- **The `forest` white-CTA focus-ring trap** (LEARNINGS PR #37). In `forest`, `--enlb-cta-bg` is WHITE, so `outline: 2px solid var(--enlb-cta-bg)` renders a white ring — invisible on the white close box and on a white surface. Solve via `--enlb-focus-ring` (defaults to `var(--enlb-cta-bg)` for existing presets; `forest` overrides to a high-contrast color with ≥3:1 against both the close backing and the surface). Apply it to ALL `:focus-visible` rules (CTA, secondary, close at scss:236-244). The LEARNINGS invariant: focus ring uses a ≥3:1-contrast token and NOT `--enlb-border` (`#e0e0e0` fails WCAG 1.4.11).
- **Don't double-reverse layouts; assert RENDERED effect not class strings** (LEARNINGS PR #17). If touching image-position CSS for the documented pairings (forest→right, sky→left), test the real rendered position (bounding-box `x` in a real browser via `e2e/smoke.spec.ts`), not DOM order or class presence. The image side is a `layout.imagePosition` choice, NOT forced by the theme.
- **Outside-close must not be clipped** (LEARNINGS PR #32/#37). The dialog stays `overflow:visible` with inner `.enlb-scroll` carrying `border-radius`. The bigger close button (esp. `closeButton:'outside'` at negative `top`) must still not be clipped. jsdom computes no clipping — test in a real browser (the e2e `outside close button is visible and clickable` test exists; keep it green, extend if the larger close changes geometry).
- **Bundle-size budget is a hard CI gate** (gzip ≤ 5200B, `.agentic/contracts/budgets.json`). Two theme classes + eyebrow + close styling + new tokens add bytes. Verify `node tools/sdd/check_size.mjs` after build. Current headroom is ~181B from the 5019B baseline — the additions may be tight; prefer compact SCSS. If the budget is exceeded, the only sanctioned path is to re-baseline `budgets.json` with a minimal new ceiling + `_doc` note — that is GATE-ARMING (owner-reviewed, Decision D13 precedent); flag it in the PR rather than silently inflating.
- **Config-schema snapshot is machine-checked** (`npm run contracts:generate` → `git diff --exit-code .agentic/contracts/snapshots/config-schema.txt`). After adding `eyebrow` + the new preset literals to the union, regenerate and commit the diff. The `api-surface.txt` snapshot must NOT change (no new public functions). The `config-schema` contract check runs in CI — an un-regenerated snapshot fails the gate.
- **Centered-content decision (document in PR):** scoping centered text + centered CTA row under the new theme classes keeps `light`/`dark`/`brand` UNCHANGED and gives the client the full mockup look from `theme.preset` alone. Trade-off: theme now carries a small layout opinion (`text-align`), not pure color. The alternative (`layout.contentAlign?: 'left'|'center'`) is cleaner separation but requires the editor to set two fields. Either is acceptable — pick one, document the trade-off.
- **`buildOverlayClasses()` is dynamic** (lightbox.ts:236: `enlb-overlay enlb-theme-${this.config.theme.preset}`). Adding `'forest'`/`'sky'` to `VALID_PRESETS` is sufficient for the class to apply — do NOT introduce a hardcoded set or a switch. `applyTheme()` (lightbox.ts:166-177) re-applies the class at runtime via the same dynamic path; verify `setTheme({ preset: 'forest' })` works on an open lightbox (extend `lightbox.theme.test.ts` if cheap).
- **The dialog's accessible name comes from the title, not the eyebrow** (LEARNINGS PR #32). `aria-labelledby` points at `.enlb-title` when `header` is non-empty; `aria-label='Dialog'` is the fallback when empty. The eyebrow is supplementary visible text — never wire it into `aria-labelledby`. The `a11y-audit` contract (`check_a11y.mjs`) runs axe on the shadow host and will flag an empty accessible name.
- **`PRESET_TOKENS` is the test-facing mirror of the SCSS theme classes, not the runtime mechanism.** Preset defaults are applied at runtime by the `.enlb-theme-*` SCSS classes; `PRESET_TOKENS` exists so `presets.test.ts` can automatedly check WCAG contrast and token completeness. Keep the two in sync — a preset whose SCSS class and `PRESET_TOKENS` entry diverge will pass tests but render wrong. The new `--enlb-close-*`/`--enlb-focus-ring`/`--enlb-eyebrow` tokens are SCSS-only (not `ThemeColors`), so they do NOT go in `PRESET_TOKENS` unless you extend the contrast test to cover them.

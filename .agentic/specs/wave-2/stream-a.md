# stream-a — Layout, responsive contract, token surface & a11y/motion hardening

**Wave:** 2 · **Branch:** `feat/wave-2-layout` · **Depends on:** wave-0 + wave-1 + cross-browser net (all on `main`) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-2 README](./README.md), this brief, [`ROADMAP.md`](../ROADMAP.md) (wave-2/stream-a; Decisions D4/D6/D17/D18; NFR N6/N7/N8/N13/N14/N17/N18; the wave-2 contracts; **the "Amendments — wave-1 entry" section**), and the wave-0 config seam.

## Goal
Harden and parameterize the layout wave-0 stubbed, and establish the **`--enlb-*` design-token
surface** every theme will key off — *without* shipping a theme set (that's stream-b). Land the
a11y/motion hardening, switch the CTA element `<a>`→`<button>` (D6) before wave-3 adds action
semantics, and add the secondary/decline CTA (Q10). The output is a stable token + layout contract for
stream-b to build themes on.

## In scope
- **Token surface** (`src/styles/`): convert hard-coded values (the `#1a73e8` CTA color, the 40/60
  column split, the 640px breakpoint, spacing/radius/maxWidth/fontFamily) into documented `--enlb-*`
  CSS custom properties; the baseline values become the default ("light") theme. **No theme *set*
  yet** (stream-b) — just the variable layer + defaults.
- **Layout config** (augment `LayoutConfigBase` via the wave-0 seam, `declare module '../config'` from
  `src/themes/`): `variant` (`two-column`|`centered`|`banner`, default `two-column`), `imagePosition`
  (`left`|`right`|`top`, default `left`), `imageRatio` (default `40%`), `hideImageOnMobile` (overrides
  top-level when set, D4), `stackBreakpoint` (default `640`), `closeButton` (`inside`|`outside`|`none`,
  default `inside`). Construct-time only (no `setLayout`, D10). Image-absent ⇒ single-column regardless
  of `variant` (D18).
- **Responsive**: 2-col → stacked at the breakpoint; hide-image-on-mobile (default on, D4); **no layout
  thrash** (D17 — apply layout/theme via a **single root class/style write**, read-before-write).
- **CTA element (D6)**: `enlb-cta` renders as a `<button>` (keyboard/SR-correct for the later
  close/submit actions); **`redirect` still works** (`href`-driven click). *Modifies hardened
  `src/core/lightbox.ts`.*
- **Secondary/decline CTA (Q10)**: `secondaryCta?: { label; action?; href? }` and/or `dismissLabel?`;
  a second button in the CTA row; correct focus-trap order; tokenized; the single-CTA case stays intact.
- **a11y/motion**: any entrance motion (fade/scale) wrapped in `@media (prefers-reduced-motion:
  reduce)`; initial-focus on the dialog root consistent across `closeButton` variants (extends backfill
  N18); contrast verified.
- **Contracts (wave-2 per ROADMAP)**: add `reduced-motion-guard` (grep: fail if inlined CSS has a
  `@keyframes`/`transition`/`animation` not wrapped by `prefers-reduced-motion`), `a11y-audit` (axe-core
  over a rendered fixture), `no-runtime-fetch` (grep dist for `fetch(`/`XMLHttpRequest`/`import(\s*['"]http`/`url(http`),
  `dist-single-file` (exactly one `dist/` file). **Re-baseline `bundle-size`** (D-size): bump the gzip
  budget deliberately for the token/layout/secondary-CTA growth; record the delta in the PR.
- **Ownership**: `src/themes/** → .agentic/specs/wave-2/stream-a.md` added to `ownership.json.rules{}`
  as the **first commit** (D9), before any `src/themes/` file lands.
- **Tests** (jsdom for DOM/attr/class + the contracts; real responsive/visual is the cross-browser
  net's job): layout variants, image-absent single-col (D18), hide-image-on-mobile class toggle,
  `closeButton` variants + initial-focus, secondary-CTA render + focus order, token override changes
  rendering, the new contracts.

## Out of scope
- The theme *set* (light/dark/brand) + per-token override **resolution** + `customCss` — **stream-b**
  (`customCss` only after the wave-2 security review, Risk R2/Q4).
- EN integration (wave-3); triggers (done).
- Pixel/visual-diff regression — the cross-browser smoke net covers real-browser; jsdom asserts
  DOM/attr/class/media-query presence.

## Deliverables
- `src/styles/` token surface + documented defaults; `src/themes/` layout config typing/normalizer
  (augmenting `LayoutConfigBase`).
- `src/core/lightbox.ts`: `<a>`→`<button>` CTA + secondary-CTA + `closeButton` variants +
  reduced-motion-gated motion (additive/structural; wave-0-owned — carry the waiver).
- 4 new contracts + the `bundle-size` re-baseline; the `src/themes/**` ownership carve-out.
- Tests under `src/**`; refreshed `dist/en-lightbox.js`; this brief trued-up.

## Acceptance criteria
- [ ] `--enlb-*` token surface with documented defaults (baseline = light); overriding a token changes
      rendering (assert computed style/class).
- [ ] `layout` config honored (variant/imagePosition/imageRatio/hideImageOnMobile/stackBreakpoint/
      closeButton); image-absent ⇒ single-col; hide-image default on.
- [ ] CTA is a `<button>` (redirect still works); secondary/decline CTA renders with correct
      focus-trap order; single-CTA case unbroken.
- [ ] Motion gated by `prefers-reduced-motion` (`reduced-motion-guard` green); `a11y-audit` (axe) green;
      initial-focus correct across `closeButton` variants.
- [ ] `reduced-motion-guard` + `a11y-audit` + `no-runtime-fetch` + `dist-single-file` added & green;
      `bundle-size` re-baselined (delta recorded); bundle still ONE dependency-free file, SCSS inlined;
      the cross-browser smoke still green.
- [ ] wave-0 + wave-1 tests still green; all four SDD gates green; typecheck/lint clean.
- [ ] Mutation-verify on a load-bearing line (e.g. the image-absent single-col guard or the
      stack-breakpoint media query), show the **named** test go red (file:line, before→after), revert.
- [ ] `src/themes/** → wave-2/stream-a.md` is the first commit.

## First action
Write the failing test: `layout.variant:'two-column'` with **no** image renders single-column (no
`.enlb-image` node), per D18. Red first, then green.

## Gotchas
- The **token surface is the contract stream-b builds on** — name `--enlb-*` deliberately and document
  the defaults; a sloppy surface forces rework in stream-b.
- **D17 no-thrash**: apply layout/theme via a SINGLE root class/style write, read-before-write; assert
  one mutation in a test.
- **`<a>`→`<button>`** must keep `redirect` working (button + click→navigate) **and** the focus trap
  intact (button stays focusable).
- **secondary-CTA**: define focus-trap order deliberately; tokenize it; don't break the single-CTA path.
- **spec-coupling**: `src/themes/**` is owned by THIS spec (rule = first commit). The
  `src/core/lightbox.ts` changes (CTA element, secondary-CTA, closeButton, motion) are
  **wave-0-owned** → carry `[no-spec: wave-2 layout/a11y changes to core]` or add an amendment note to
  `wave-0/stream-a.md`. Augment `LayoutConfigBase` via `declare module` (don't widen the base body).
  `src/index.ts` is exempt.
- **`a11y-audit`** needs a rendered fixture (axe-core + jsdom, or reuse the e2e harness) — keep it
  deterministic.
- **`reduced-motion-guard`** greps the inlined CSS — ensure EVERY transition/animation is wrapped.
- **`bundle-size` re-baseline** is a deliberate bump (gzip-gated, baseline + theming allowance) —
  record the delta in the PR; keep the bundle byte-identical mac↔linux (oxc).
- registry/contract changes are reviewed as CI config (Q11). jsdom can't compute layout — assert
  classes/attrs/media-query presence + the contracts; real responsive is the cross-browser net.

## stream-b amendments

stream-b (theme set + full UI customization) builds on stream-a's `--enlb-*` token contract. Files
under `src/themes/**` (owned by this spec) were extended:

- `src/themes/config.ts` — `ThemeConfigBase` augmented via `declare module` with `preset`, `colors`,
  `radius`, `maxWidth`, `fontFamily`, `customCss` (placeholder type only). `NormalizedTheme` type and
  `normalizeTheme` function added (composed into `config.ts`'s normalizer per D8).
- `src/themes/presets.ts` — `PRESET_TOKENS` constant: the single source of truth for preset `--enlb-*`
  values, used by the contrast test. The SCSS classes (`.enlb-theme-dark`, `.enlb-theme-brand`) hold
  the same values for the browser.

The theme class + inline CSS var overrides are applied to the **overlay root** (not the dialog) so
that `--enlb-overlay-bg` is also themed. `applyTheme` does a single style write (D17). These changes
are tracked in detail by `.agentic/specs/wave-2/stream-b.md`.

# stream-b — Theme set & full UI customization

**Wave:** 2 · **Branch:** `feat/wave-2-themes` · **Depends on:** wave-2/stream-a (the `--enlb-*` token surface, `a11y-audit`, the contracts) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-2 README](./README.md), this brief, [`ROADMAP.md`](../ROADMAP.md) (wave-2/b, `ThemeConfig`, Decision **D17** `setTheme`, **Risk R2**/Q4 customCss-deferred), [`LEARNINGS.md`](../../LEARNINGS.md), and the `--enlb-*` token names in `src/styles/lightbox.scss`.

## Goal
Deliver per-campaign visual customization on top of stream-a's token contract: multiple selectable
named themes (`light`/`dark`/`brand`) plus per-token overrides, entirely from the page-editor config —
no per-campaign code edits. A runtime `setTheme` re-applies. `customCss` (raw CSS injection) is **out**
of this cut — it ships only after a dedicated security review (Q4 / Risk R2). Landing this completes
wave-2: the lightbox is visually campaign-ready.

## In scope
- **`ThemeConfig`** (augment `ThemeConfigBase` via `declare module '../config'` from `src/themes/`):
  `preset` (`'light'|'dark'|'brand'`, default `light`); `colors?` (overlay/surface/text/title/ctaBg/
  ctaText/secondaryCtaBg/secondaryCtaText/border → `--enlb-*`); `radius?`/`maxWidth?`/`fontFamily?`.
  Typed + a `normalizeTheme` in `src/themes/` composed into `config.ts`'s normalizer (D8). Close
  `ThemeConfigBase` (B1).
- **Resolution**: `preset` → a set of `--enlb-*` values; **per-token overrides win over the preset**;
  applied to the dialog root via a **single class/style write** (D17, read-before-write).
- **Three preset value-sets in SCSS**, inside the single inlined bundle (no new files, no runtime deps).
  `light` = stream-a's baseline; `dark` and `brand` are new. **`brand` palette:** propose values from
  The Nature Conservancy's public brand (primary green) as a starting default, and flag the exact
  hexes for owner confirmation at review.
- **Runtime API**: `ENLightboxAPI.setTheme(theme)` and `Lightbox.applyTheme(NormalizedTheme)` — single
  root write (D17), re-applies preset/tokens at runtime.
- **a11y/contrast**: every shipped preset (esp. `dark`/`brand`) passes the `a11y-audit` (axe contrast);
  reduced-motion still respected.
- **`bundle-size`**: re-baseline if the presets grow the bundle (deliberate gzip bump, delta recorded).
- **Tests**: preset applies the right token set; per-token override beats preset; `setTheme` re-applies
  at runtime (assert a single mutation); each preset passes axe contrast; invalid/partial theme
  degrades gracefully (skip bad token, never throws on the host page).

## Out of scope
- **`customCss` raw injection** — DEFERRED to a security-reviewed follow-on (Q4 / Risk R2). Do **not**
  implement CSS injection here (a placeholder type is fine; no behavior).
- Layout (stream-a, done); EN integration (wave-3); triggers (wave-1).
- The BACKLOG'd layout fields (`stackBreakpoint`, `centered`/`banner`).

## Deliverables
- `src/themes/` theme typing + `normalizeTheme` + resolution; the 3 preset value-sets in `src/styles/`.
- `src/core/lightbox.ts` `applyTheme` (single root write) — wave-0-owned, carry `[no-spec]` or amend.
- `src/index.ts` / `ENLightboxAPI.setTheme`.
- Tests under `src/**`; refreshed `dist/en-lightbox.js`; this brief trued-up.

## Acceptance criteria
- [x] `preset` `light`/`dark`/`brand` each apply a coherent `--enlb-*` set; per-token overrides
      (`colors`/`radius`/…) win over the preset.
- [x] `ENLightboxAPI.setTheme` re-applies at runtime via a **single** root write (assert one mutation, D17).
- [x] every shipped preset passes the `a11y-audit` (axe contrast); reduced-motion respected.
- [x] invalid/partial theme degrades gracefully (keeps a functional lightbox), never throws on the host.
- [x] bundle stays ONE dependency-free file, SCSS inlined; `bundle-size` green (re-baselined to 5000B
      gzip, +473B delta recorded); all SDD gates + cross-browser smoke green; wave-0/1 + stream-a tests still pass.
- [x] Mutation-verify on a load-bearing line (the override-beats-preset resolution), named test
      reds (file:line, before→after), revert.
- [x] `customCss` is **not** implemented (confirm no raw-CSS injection path exists).

## First action
Write the failing test: `preset:'dark'` applies the dark `--enlb-*` token set to the dialog root
(assert a token value or theme class). Red first, then green.

## Gotchas
- **Consume stream-a's exact `--enlb-*` names** (`src/styles/lightbox.scss` `:root`) — don't rename;
  themes set those vars. (See LEARNINGS for the token-contract intent.)
- **D17 single root write** for `setTheme`/`applyTheme` (read-before-write; assert one mutation; no
  per-property loop).
- **`customCss` is OUT** — do not implement raw CSS injection (security-review gate, R2). A `<button>`/
  `<a>` CTA invariant from LEARNINGS still applies if you touch the CTA.
- **Contrast** is where dark/brand regressions hide — each preset must pass axe; confirm the `brand`
  hexes with the owner at review.
- **spec-coupling**: `src/themes/**` is already owned by wave-2 (stream-a's carve-out) — no new rule
  needed; confirm. `config.ts` theme typing via `declare module` (don't widen the base body). Any
  `src/core/lightbox.ts` change (`applyTheme`) is wave-0-owned → `[no-spec: wave-2 theming hook in core]`
  or amend `wave-0/stream-a.md`. `src/index.ts` exempt.
- Single inlined bundle, zero runtime deps; the `bundle-size` re-baseline is a deliberate, documented bump.

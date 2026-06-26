# stream-a — EN CTA semantics, no-form-interference & editor docs

**Wave:** 3 · **Branch:** `feat/wave-3-en` · **Depends on:** wave-0/1/2 (all on `main`) ·
**Required reading:** [`AGENTS.md`](../../AGENTS.md), [`WORKFLOW.md`](../../WORKFLOW.md), the [wave-3 README](./README.md), this brief, [`ROADMAP.md`](../ROADMAP.md) (wave-3/a; the **"Amendments — wave-1 entry"** section: EN targeting is by-hand, **no** page detection; **D5** `cta.action` single source of truth; **D5b** submit-deferred; the **U12** non-interference test), [`LEARNINGS.md`](../../LEARNINGS.md) (navigating-CTA-is-`<a>`).

## Goal
Make the lightbox a safe, EN-aware drop-in **without page detection** (the editor places
`window.ENLightbox` per page): finalize CTA action semantics, **prove non-interference with EN forms**,
ship the **editor/advanced-customization README**, and **delete the inert `en` config placeholder**.
The last functional wave.

## In scope
- **CTA action semantics (D5)** — `cta.action` is the single routing source of truth: `'redirect'`
  (the existing native `<a href>` nav) and `'close'` (closes the lightbox + records dismissal per the
  frequency cap). Inferred default: `href` ⇒ `'redirect'`, else `'close'`. `secondaryCta`/decline routes
  the same way. No competing `en.ctaBehavior`/`redirectUrl`. **`'submit'` is DEFERRED (D5b) — do NOT
  implement** (no committed EN-form contract).
- **No-EN-form-interference (U12 — the highest-risk NFR)** — a committed test mounting the lightbox over
  an EN-shaped form (inputs + submit) proving: form submission/validation/focus proceed (lightbox open
  *and* closed); `inert`/`aria-hidden`/scroll-lock **fully release** the form on close; focus restores
  to the prior element on close. Cover the redirect + close CTA paths near the form.
- **Remove the inert `en` config (simplification)** — delete the unused `export interface
  ENIntegrationConfigBase {}`, the `en?: ENIntegrationConfigBase` field, the `NormalizedConfig.en`
  field, and the `en: src.en ?? {}` normalizer line from `src/config.ts` (dead scaffolding from the
  pre-by-hand plan; never read at runtime). Regenerate the `config-schema` snapshot; update the
  `config.test.ts` default-assertion. Add a minimal `en?` back **only if** the non-interference work
  genuinely needs a config knob (e.g. `respectFormFocus`) — **default: ship none**. **No** page-type/ID
  detection, `ENPageType`, `include`/`exclude`, or `ENPageContext` (they never existed — keep it that way).
- **Editor + advanced-customization README** — the configuration guide: how to place `window.ENLightbox`
  on an EN page; the full config schema (content / behavior / triggers / `frequencyDays` / layout /
  theme / `cta` + `secondaryCta`); examples (basic campaign, themed campaign, multi-trigger); the
  dismissal-frequency behavior; the `customCss`-not-yet-available note; how to host/load the `dist`.
  **Editor-facing**, not dev-internal.

## Out of scope
- EN page-type/ID detection, `canArm`, `ENPageContext`, include/exclude (dropped — Amendments; they
  don't exist in code).
- `cta.action:'submit'` (deferred, D5b — needs a committed EN-form contract).
- `customCss` injection (security-review-gated, Risk R2).
- release/packaging (wave-4).

## Deliverables
- `src/core/lightbox.ts` — `cta.action` close routing (additive; wave-0-owned → `[no-spec]`).
- `src/config.ts` — **remove** the inert `en` placeholder (+ regenerate the `config-schema` snapshot;
  update `config.test.ts`). Carry `[no-spec: remove inert en placeholder / wave-3 CTA routing]`.
- `README.md` (root) or `docs/` — the editor/advanced-customization guide.
- `src/en/` + the `src/en/** → wave-3/stream-a.md` ownership carve-out **only if** you actually add EN
  config/code (likely not — default is no `src/en/`).
- Tests: `cta.action` routing (redirect/close + inferred default); the non-interference test; refreshed
  `dist/`; this brief trued-up.

## Acceptance criteria
- [ ] `cta.action` single-source routing: `'redirect'` (href nav) + `'close'` (closes + records
      dismissal); inferred default (`href`⇒redirect, else close); `secondaryCta` routes the same way.
      No competing `ctaBehavior`/`redirectUrl`.
- [ ] Non-interference: a committed test mounts the lightbox over an EN-shaped form and proves
      submission/validation/focus proceed (open + closed), `inert`/scroll-lock fully release on close,
      focus restored — across the redirect + close CTA paths. **Make this real + adversarial.**
- [ ] The inert `en` placeholder is removed (config-schema snapshot regenerated; `config.test.ts`
      updated); no page detection; a minimal `en?` exists **only** if `respectFormFocus` was genuinely
      needed.
- [ ] Editor/advanced README lets a campaign editor configure + host the lightbox from it alone (full
      schema + examples + dismissal behavior + `customCss`-deferred note + hosting).
- [ ] Bundle stays ONE dependency-free file, SCSS inlined; `bundle-size` green (re-baseline only if it
      moves); all SDD gates + cross-browser smoke green; wave-0/1/2 tests still pass.
- [ ] Mutation-verify on a load-bearing line (e.g. the `cta.action` close routing), show the **named**
      test go red (file:line, before→after), revert.

## First action
Write the failing test: a CTA with `action:'close'` (or no `href`) closes the lightbox on click and
records dismissal (re-arming within the window doesn't re-open). Red first, then green.

## Gotchas
- **Routing via `cta.action` only (D5)** — don't reintroduce `en.ctaBehavior`/`redirectUrl`. `redirect`
  = the native `<a href>` (LEARNINGS: navigating CTA is `<a>`); `close` = a `<button>` that closes.
- **`'submit'` is DEFERRED** — do not implement (no EN-form contract; D5b).
- **No page detection** — eligibility is config-present + frequency + trigger (by-hand targeting). Don't
  add `ENPageType`/`ENPageContext`/include-exclude.
- **Non-interference is THE risk** — the lightbox must never break the host EN form. Test over an
  EN-shaped form (open + closed); ensure `inert`/`aria-hidden`/scroll-lock are fully removed on close so
  the form works; focus restored. This is U12 — make it concrete + adversarial.
- **Removing `en`** touches `src/config.ts` (wave-0-owned) → carry `[no-spec]`; regenerate the
  `config-schema` snapshot (its two `en` lines drop) and update `config.test.ts`. Confirm nothing reads
  `config.en` anywhere first (it doesn't today).
- **README is EDITOR-facing** (campaign editors, not devs) — full config + examples + how-to-host.
- Only create `src/en/` (+ its ownership carve-out as the first commit) **if** you add EN config/code;
  otherwise don't. `src/index.ts` is exempt. Single inlined bundle, zero runtime deps.

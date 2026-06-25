# tnc-en-lightbox — Master Plan (waves 1–4)

## Overview

This is the higher-altitude planning layer for `tnc-en-lightbox`: a dependency-free, configurable lightbox for Engaging Networks (EN) pages, shipped as one self-contained minified JS file in `dist/`. Wave-0 (build pipeline + core lightbox) is merged to `main`. This plan decomposes the remaining roadmap into waves and streams, fixes the holistic public contract so each wave is purely additive, enumerates the machine-checked contracts and when each lands, and maps every NFR and use-case to an owning stream with its verification method. Per the SDD governance model, detailed per-stream implementation briefs are written just-in-time at each wave entry (informed by the prior wave's retro) and are intentionally **not** included here.

**What changed after the gap audit (read this first).** Six adversarial critics surfaced load-bearing defects in the prior draft. The two most important were corrected outright: (1) the planned extension seam — narrowing `triggers?: unknown` / `theme?: unknown` via TypeScript declaration merging — **does not compile** (declaration merging can *add* interface members but cannot *redeclare* an existing member to a narrower type; it errors with "Subsequent property declarations must have the same type"). The seam is replaced with a one-time wave-0-backfill widening of `config.ts` (Decision D2, Risk R1). (2) The repo enforces **four** CI gates, not two: `spec-coupling`, `contracts-check`, **`test-coupling`**, and **`learnings-freshness`** (verified in `.github/workflows/sdd-gates.yml` and `sdd.config.json gates.test_coupling.enabled=true`). The prior plan was silent on the latter two; both now have governance handling (Governance section, Decision D11–D12). Other corrections: an accessibility decomposition gap (empty accessible name, non-inert background, no scroll-lock, reduced-motion, initial-focus) is now five explicit NFR rows owned by a committed core-additive a11y slice; cross-browser and automated-a11y NFRs are moved off "GAP" onto a committed stream; CTA routing is collapsed to one source of truth and the `<a>`→`<button>` element-shape change is decided now; and the `NormalizedConfig` "single place defaults are applied" claim is made true by defining a composed normalized type.

Governance constraints honored throughout: `concurrent_streams=1` (streams run strictly sequentially; one tracking issue + one PR per stream; independent reviewer; merge-commit only, never squash; merge on per-PR owner authorization). The ownership-map carve-outs (`src/triggers/**`→wave-1, `src/themes/**`→wave-2, `src/en/**`→wave-3) are added to `ownership.json.rules{}` (not the inert `_planned` prose string) as the **literal first commit** of each wave's first stream PR (Decision D9). The `bundle` freshness contract (and every new contract) must stay green, and any `git diff` check uses `git add -AN` to catch newly-emitted untracked files.

The four durable wave-0 cross-stream flags are treated as invariants the entire plan is engineered around:
1. Public API global is `window.ENLightboxAPI`; `window.ENLightbox` is reserved for the page-editor config. Features reach the lightbox via `ENLightboxAPI.getInstance()`/`init()`.
2. Auto-init instantiates but does **not** open. There is no `autoOpen` config field, ever — opening is always a trigger (wave-1) or an explicit manual-open API call.
3. Vite 8 (rolldown + oxc, `minify:'oxc'`) produces byte-identical output mac↔linux; the bundle contract verifies this. No design choice in this plan changes the build shape.
4. `Lightbox`'s constructor takes a `NormalizedConfig` (call `normalizeConfig` first); all DOM/CSS classes are `enlb-`prefixed.

**The governing rule for backward compatibility:** every field added in waves 1–3 is optional on the raw `ENLightboxConfig` and defaulted in normalization. A wave-0 config (`{header, body, image, cta, closeOn*, hideImageOnMobile}`) must continue to produce a valid lightbox forever, unchanged.

---

## Owner decisions — open questions resolved (2026-06-25)

The eleven open questions from the gap audit are resolved as below by the project owner. **This section is authoritative**: where the body still phrases one as an open question, this governs.

- **Q1 — wave-2/wave-3 stream counts:** Accepted as proposed — wave-2 = 2 streams (a: layout + token surface + a11y/motion; b: theme set + customization); wave-3 = 1 stream.
- **Q2 — wave-4 (release/packaging):** Optional and kept separate; decided when the first release is cut. Cross-browser QA (N5) does **not** depend on it (Decision D3).
- **Q3 — placement of committed a11y + cross-browser work:** The B5 core a11y/UX slice lands in the **wave-0 backfill**. `cross-browser-smoke` is its own **committed mini-stream placed immediately before wave-2**.
- **Q4 — theming approach:** Preset + token-override model accepted; starting presets `light`/`dark`/`brand` (the `brand` palette confirmed at wave-2 entry). **`customCss` is deferred out of the first theming cut** — it ships only after token theming lands and passes the wave-2 security review (Risk R2).
- **Q5 — EN detection source:** Deferred to a **wave-3 entry spike** against a live TNC EN page; the named source is committed in the wave-3 brief before `ENPageContext` is frozen (D19). **Fail-safe fallback:** a page is treated as *not* eligible until detection succeeds (don't show on unknown pages).
- **Q6 — bundle-size budget:** gzip is the gating metric; initial ceiling derived from the **1809 B gzip baseline + a per-wave allowance** (≈2.5–3 KB gzip through wave-1), **re-baselined after wave-2 themes**; each retro records the per-wave size delta (D-size).
- **Q7 — CTA `submit` action:** Deferred — `submit` ships only if wave-3 commits the concrete EN-form contract (D5b); wave-3 ships `redirect` + `close`.
- **Q8 — `dist/` commit policy:** Keep committing `dist/en-lightbox.js` **per PR** (status quo; CI verifies freshness; `dist/` is the hosted artifact).
- **Q9 — rich-text body:** Deferred — body stays plain-text (`textContent`); `bodyHtml?` is additively recoverable later (BACKLOG U16).
- **Q10 — secondary / decline CTA:** **Included** — reclassified from deferred **into wave-2/stream-a scope**. The config schema gains `secondaryCta?: { label; action?; href? }` and/or `dismissLabel?`; the button-row layout, focus-trap order, and token surface are owned by wave-2/a. (Supersedes the U17 "deferred" entry below.)
- **Q11 — gate-file review ownership:** The project owner is the **required reviewer** for changes to `ownership.json`, `.agentic/contracts/registry.json`, and `sdd.config.json` (they arm/disarm the gates; `registry.json` `check` commands run `shell=True` in CI). To be codified in `WORKFLOW.md`/`AGENTS.md` (D13).

---

## Governance & enforcement (all four gates)

The repo enforces four CI gates via `.github/workflows/sdd-gates.yml`. This plan must satisfy all four, not the two the prior draft addressed.

1. **`spec-coupling`** (`check_spec_coupling.py`): a PR changing governed `src/` must also change the owning spec, or carry `[no-spec: <reason>]`. `**/index.ts` and `**/index.js` are exempt (Decision D8 constrains how that exemption may be used).
2. **`contracts-check`** (`check_contracts.py`, runs `npm ci` first): every `registry.json` contract's `check` must stay green; `git diff` forms must be paired with `git add -AN`.
3. **`test-coupling`** (`check_test_coupling.py`): a PR changing source under `src/` (and `lib/,app/,cmd/,internal/,pkg/`) must also change a test file (`*.test.*`/`*.spec.*` etc.), or carry `[no-test: <reason>]`. **There is no `index.ts` exemption here** — this gate is stricter than spec-coupling. Pre-authorized `[no-test]` waivers are enumerated per stream below (Decision D11).
4. **`learnings-freshness`** (`check_learnings_freshness.py`, advisory/WARN, threshold ~20 commits): warns when `.agentic/LEARNINGS.md` goes stale. Each wave promotes its durable invariants into `LEARNINGS.md` via a reviewed PR (Decision D12), keeping the gate quiet and the feed-forward bifurcation correct (process lessons → wave README retro; durable technical invariants → `LEARNINGS.md`).

**Governed-but-unowned config files.** `ownership.json`, `.agentic/contracts/registry.json`, and `sdd.config.json` are not matched by `rules{src/**}`, so edits to the gate-arming files themselves pass spec-coupling trivially and pass test-coupling (not under `src/`). This plan does **not** silently rely on that. Decision D13 assigns review ownership of these mutations; `registry.json` check commands run `shell=True` in CI and must be reviewed like CI config.

---

## Wave & Stream decomposition

Sequential merge order (forced by `concurrent_streams=1`): **wave-1/a → wave-2/a → wave-2/b → wave-3/a → wave-4/a** (number of wave-2/wave-3 streams and whether wave-4 ships are owner decisions — see Open Questions).

A note on the ordering rationale driving the cut points: the wave-0 core already ships CTA rendering, a 2-column layout, mobile stacking, and the `hideImageOnMobile` class hook. So wave-2 *extends* an existing layout (not greenfield) and wave-3's CTA work *adds semantics to an existing element* (with a decided element-shape change — Decision D6, not "just behavior").

### Wave 0 — Backfill (do now, before wave-1)

A small, explicitly-sequenced backfill closes gaps the later waves depend on. Each item is its own committable change; all ride existing CI.

- **B1 — Config extension mechanism (Decision D2).** Replace the un-compilable declaration-merge seam: widen `src/config.ts` so feature fields resolve to real types without `config.ts` importing feature buckets. Chosen mechanism: `ENLightboxConfig` carries `triggers?: TriggersConfig`, `theme?: ThemeConfig`, `layout?: LayoutConfig`, `en?: ENIntegrationConfig`, where those names are **type aliases declared in `config.ts` as open/extensible placeholders** that each owning module *populates* via interface declaration merging (merging *into an empty owned interface*, which compiles, rather than *narrowing an existing `unknown`*, which does not). Concretely: `config.ts` declares `export interface TriggersConfigBase {}` and `triggers?: TriggersConfigBase`; `src/triggers/` adds members to `TriggersConfigBase` via `declare module` merging (additive, compiles). This keeps the dependency direction (`config.ts` never imports feature dirs) while being provably compilable. **Prove with `tsc --noEmit` before committing.** (See Risk R1 for the rejected alternatives and why.)
- **B2 — `no-css-emitted` contract.** `npm run build && git add -AN && if find dist -name '*.css' -type f | grep -q .; then echo 'ERROR: .css emitted'; exit 1; fi`.
- **B3 — `api-surface` contract** (committed and green as the baseline for wave-1; see contracts table for the exact extraction).
- **B4 — `config-schema` contract** (pulled earlier than the prior draft; wave-1 perturbs the config type, so the snapshot must exist first — see Risk note in contracts table).
- **B5 — Core a11y/UX additive fixes (committed slice, carries its own tests):** non-empty accessible name fallback, background inert/`aria-hidden`, body scroll-lock + restore, initial-focus policy. These are wave-0-core changes governed by the wave-0 spec; see NFR rows N11/N15–N18 and Decision D14. (Owner may instead fold B5 into wave-2/stream-a — see Open Questions — but it must land on a *committed* stream, not be left to optional wave-4.)

### Wave 1 — Triggers — **ONE stream**

**wave-1/stream-a — Trigger dispatcher, trigger set, session dismissal, and manual-open.** Depends on wave-0 + backfill. Makes the auto-instantiated (not-yet-opened) lightbox appear in response to user behavior and ensures it never nags. Deliverables: a `src/triggers/` dispatcher that reads trigger config, arms the requested triggers, fires `open()` exactly once on the first match (any-of semantics, first-to-fire wins), then tears down all listeners; four trigger implementations behind a common small interface (time-on-page, scroll-depth, inactivity, exit-intent); manual multi-trigger composition; **a documented manual-open path** (`ENLightboxAPI.open()` that consults `isDismissed()` and records dismissal on close — Decision D7); dismiss-once-per-session via `sessionStorage` keyed on `location.pathname` (checked before arming, written on dismiss), **with a single internal key-derivation function and a frozen key format** (Decision D15); trigger config typing owned in `src/triggers/` (populating `TriggersConfigBase` per B1); the single sanctioned additive core change — an `enlb:dismiss` `CustomEvent`; wiring from `src/index.ts` **as thin call-through only** (the dispatcher/normalizer logic lives in governed `src/triggers/` modules, not in the spec-exempt `index.ts` — Decision D8); an **optional `canArm()` eligibility hook** the dispatcher reads (default: always-eligible) so wave-3's EN gate registers a predicate without editing `src/triggers/**` (Decision D16); ownership rule `src/triggers/**`→wave-1 added as the first commit (Decision D9).

**Why one stream:** triggers, composition, and dismissal are one cohesive subsystem with a single integration seam (`index.ts`→`open()`). Splitting them would create an artificial dependency edge with no parallelism benefit under `concurrent_streams=1`.

### Wave 2 — Theming, layout & a11y hardening — **TWO streams (a then b)** (count is an owner decision)

**wave-2/stream-a — Layout, responsive contract, theming token surface, and a11y/motion hardening.** Depends on wave-1. Hardens and parameterizes the layout wave-0 stubbed and establishes the design-token surface (`--enlb-*` CSS custom properties) all themes key off. Converts ad-hoc SCSS values (the `#1a73e8` CTA, the 40/60 split, the 640px breakpoint, spacing/radius) into a documented, overridable variable layer where baseline values become the default theme; promotes `hideImageOnMobile`, image-side, and column-ratio choices into typed `layout` config. Responsive guarantees: 2-col→stacked, hide-image-on-mobile, no layout thrash (Decision D17: theme applied via a single style/class write on the dialog root; read-before-write discipline). **A11y/motion deliverables owned here:** any motion introduced (fade/scale entrance) MUST be wrapped in `@media (prefers-reduced-motion: reduce)`, enforced by a CSS grep contract (N17); contrast verified via an axe-core gate (N13); confirm the empty-image + `layout.variant:'two-column'` interaction renders single-column (Decision D18). Ownership rule `src/themes/**`→wave-2 (incl. SCSS theme partials), added first. Element-shape: CTA becomes a `<button>` here so wave-3 can attach `action` semantics additively (Decision D6).

**wave-2/stream-b — Theme set + full UI customization.** Depends on wave-2/stream-a. Delivers multiple selectable named themes and a customization API so a campaign picks a theme and/or overrides individual tokens entirely from the page-editor config — no per-campaign code edits. Each theme is a named set of `--enlb-*` values; theme selection + per-token override resolution applied at render; `customCss` injection treated as a trusted-editor-only input, scoped under `.enlb-dialog`, gated behind an explicit security review and documented trust boundary (Risk R2); closes out `theme` typing (populating `ThemeConfigBase` per B1).

**Why the split:** stream-a is structural/layout + responsive + token *contract* + a11y/motion hardening; stream-b is the theme *system* that consumes that contract. Building themes before the token contract exists means each theme hard-codes values and then gets refactored — exactly the rework the SDD model avoids.

### Wave 3 — EN integration — **ONE stream** (could split — owner decision)

**wave-3/stream-a — EN page detection, non-interference, CTA semantics, and editor docs.** Depends on wave-2. Makes the library a safe, EN-aware drop-in: a `src/en/` module that detects EN page-type / page-ID and exposes an eligibility predicate registered through wave-1's `canArm()` hook (never editing `src/triggers/**`); provable non-interference with EN form submission, focus, and existing handlers (open and closed) **via a committed concrete test** (Decision U12-test); CTA redirect/close/submit semantics applied to the existing `enlb-cta` element, **with a single canonical routing source of truth** (Decision D5); the **named EN detection source(s)** committed in the brief, spiked against a live TNC EN page before `ENPageContext` is frozen (Decision D19); and the editor-facing + advanced-customization README. Ownership rule `src/en/**`→wave-3 added first.

**Why one stream:** detection/non-interference and CTA semantics share the same EN DOM context, the same risk surface, and the same single integration seam. Splitting yields two PRs both touching `src/en/**` and both needing EN-page fixtures, with no parallelism gain.

### Wave 4 (optional) — Release / packaging — **ONE stream, kept separate**

**wave-4/stream-a — Release automation, versioning, hosting guidance, and final QA.** Depends on wave-3. `release-please` (or equivalent) config + versioning policy + release CI job; hosting/CDN guidance for the committed `dist/en-lightbox.js` (incl. cache-busting interaction); final cross-browser QA sign-off **only as a supplement to** the committed cross-browser smoke matrix landed earlier (N5 must not depend on wave-4 — Decision D3); possibly a lightweight version↔tag/changelog contract. Release-config-only PRs that touch `src/` carry `[no-test: release config]` (Decision D11).

**Why separate:** release/packaging is a different category with a different blast radius. It is genuinely optional and gated on cutting a first release; keeping it separate lets it be deferred or dropped. The marginal cost is low because everything is already serialized.

**Out of scope (deferred, per BACKLOG.md, recoverable only via documented revisit triggers):** cross-session/cross-page dismissal suppression; analytics/lifecycle hooks (`onShow`/`onDismiss`/`dataLayer`); A/B variant testing; video-progress trigger. **Newly logged to BACKLOG with revisit triggers** (previously silently absent): rich-text body content (revisit: a campaign needs a second paragraph or inline link in the body — Open Question Q9); secondary/decline CTA (revisit: a campaign requests a "No thanks"/two-action layout — Open Question Q10); optional `campaignKey` dismissal scoping (revisit: EN flows share a pathname or vary by query/pageId — Risk R-N4key); CTA `submit` action (deferred unless wave-3 commits its concrete EN-form contract — Decision D5b).

---

## Public contract (config + ENLightboxAPI + events)

This is the complete, forward-looking design of the two public surfaces plus the DOM events that decouple core from features. It is engineered so each wave is a purely additive extension. **Where each field physically lives:** `config.ts` declares all top-level fields and empty extensible base interfaces; each owning module *adds members* to its base interface via declaration merging (Decision D2/B1). The `config-schema`/`api-surface` snapshots read the **merged** surface (see contracts table), not just `config.ts`'s literal text.

### Config schema — `ENLightboxConfig` (raw, page-editor-facing)

```ts
// window.ENLightbox — every field optional; every field defaulted in normalization.
interface ENLightboxConfig {
  // ── CONTENT ───────────────────────────────────── (wave-0, shipped, frozen)
  header?: string                 // default ''  dialog title; if empty → aria-label fallback (N11)
  body?: string                   // default ''  PLAIN TEXT (textContent). Rich text = Open Q9.
  image?: ENLightboxImage         // default undefined  omit ⇒ single-column
  cta?: ENLightboxCta             // default undefined  omit ⇒ no CTA button

  // ── BEHAVIOR: close paths ─────────────────────── (wave-0, shipped, frozen)
  closeOnOverlay?: boolean        // default true
  closeOnEsc?: boolean            // default true
  hideImageOnMobile?: boolean     // default true  (layout flag, kept top-level for compat)

  // ── BEHAVIOR: triggers ────────────────────────── (wave-1) ───────────────
  triggers?: TriggersConfig       // default {}/[] (none armed). Members owned in src/triggers/.

  // ── PRESENTATION: theme + layout ──────────────── (wave-2) ───────────────
  theme?: ThemeConfig             // default {} (built-in "light"). Members owned in src/themes/.
  layout?: LayoutConfig           // default {}.                    Members owned in src/themes/.

  // ── INTEGRATION: Engaging Networks ────────────── (wave-3) ───────────────
  en?: ENIntegrationConfig        // default {} (no gate). Members owned in src/en/.
}

// Content (wave-0 frozen; cta gains optional fields in wave-3, element shape decided in wave-2)
interface ENLightboxImage { src: string; alt?: string /* default '' */ }
interface ENLightboxCta {
  label: string
  href?: string                                  // wave-0
  action?: 'redirect' | 'close' | 'submit'       // wave-3; inferred: href⇒'redirect', else 'close'
  target?: '_self' | '_blank'                    // wave-3; default '_self'
  rel?: string                                   // wave-3; default 'noopener' when target='_blank'
}
// NOTE: cta.action is the SINGLE canonical routing source of truth (Decision D5), works on and
// off EN. The enlb-cta element renders as a <button> (Decision D6) so 'close'/'submit' are
// keyboard/SR-correct; href still works for action='redirect'.

// Triggers (wave-1) — members owned in src/triggers/; array form recommended, object form is sugar.
type TriggersConfig = TriggerSpec[] | SingleTriggerObject
type TriggerSpec = TimeTrigger | ScrollTrigger | InactivityTrigger | ExitIntentTrigger
interface TimeTrigger       { type: 'time';        delayMs: number }
interface ScrollTrigger     { type: 'scroll';      percent: number }            // 0–100
interface InactivityTrigger { type: 'inactivity';  idleMs: number }
interface ExitIntentTrigger { type: 'exit-intent' }                             // desktop; touch=no-op
interface SingleTriggerObject {
  time?: number; scroll?: number; inactivity?: number; exitIntent?: boolean
}

// Theme + layout (wave-2) — members owned in src/themes/
interface ThemeConfig {
  preset?: 'light' | 'dark' | 'brand'            // default 'light'
  colors?: { overlay?, surface?, text?, title?, ctaBg?, ctaText? : string }  // → --enlb-* vars
  radius?: string; maxWidth?: string; fontFamily?: string
  customCss?: string  // '' — appended into <style data-enlb>, enlb-scoped, trusted-only (Risk R2)
}
interface LayoutConfig {
  variant?: 'two-column' | 'centered' | 'banner' // default 'two-column' (image-absent ⇒ single-col, D18)
  imagePosition?: 'left' | 'right' | 'top'       // default 'left'
  imageRatio?: string                            // default '40%'
  hideImageOnMobile?: boolean                    // overrides top-level when set (D4)
  stackBreakpoint?: number                       // default 640 (px)
  closeButton?: 'inside' | 'outside' | 'none'    // default 'inside' (initial-focus stays on dialog, N18)
}
// LayoutConfig is construct-time-only: no runtime setLayout (Decision D10). Changing layout
// requires init() re-instantiation. setTheme exists (runtime); setLayout does not.

// EN integration (wave-3) — members owned in src/en/
interface ENIntegrationConfig {
  pageTypes?: ENPageType[]                        // default [] (no restriction)
  includePageIds?: (string|number)[]             // default []
  excludePageIds?: (string|number)[]             // default [] (wins over include)
  respectFormFocus?: boolean                      // default true
  // NOTE: no ctaBehavior/redirectUrl here — routing is owned solely by cta.action (Decision D5).
}
type ENPageType =
  | 'DONATION' | 'PETITION' | 'EMAILTOTARGET' | 'EVENT'
  | 'ECARD' | 'SUBSCRIBE' | 'TWEET' | 'UNSUBSCRIBE' | 'OTHER'
```

**`NormalizedConfig` — the single place defaults are applied (flag #4, now made true).** The prior draft routed sub-normalizers through `index.ts`, which is spec-exempt and has no snapshot home, making flag #4 false. Corrected (Decision D8): each owning module exports a sub-normalizer **in a governed, non-exempt module** (`src/triggers/normalize.ts`, `src/themes/normalize.ts`, `src/en/normalize.ts`), and the **composed** normalized type is defined as:

```ts
type NormalizedConfig = NormalizedCore & {
  triggers: NormalizedTriggers      // default: [] (none armed)
  theme: NormalizedTheme            // default: preset 'light', resolved tokens
  layout: NormalizedLayout          // default: two-column/left/40%/640/inside; hideImageOnMobile resolved
  en: NormalizedEN                  // default: no gate; respectFormFocus true
}
```

Each sub-normalizer's default table is part of its bucket's spec and is captured by `config-schema` (which reads the composed type and each default table — Decision D8). `image`/`cta` stay optional in normalized form (absence is meaningful). `hideImageOnMobile` resolves to a single boolean (`layout.hideImageOnMobile ?? top.hideImageOnMobile ?? true`); because layout is construct-time-only, this single boolean is final at construction (Decision D10). `index.ts` is a thin call-through that invokes the governed composer — it holds **no** default/resolution logic (Decision D8).

### Extension-point seam (how a feature owns its type without editing a foreign spec)

`config.ts` declares, for each feature, an **empty extensible base interface** plus a top-level field typed to it (B1). Each owning module **adds members** to its base via declaration merging — additive, which compiles — rather than narrowing an existing `unknown`, which does **not** compile (Risk R1). The augmentation targets the *correct* module specifier as seen from each bucket (e.g. `'../config'` from `src/triggers/config.ts`, not `'./config'`), and is proven with a type-level assert (`expectType<ENLightboxConfig['triggers']>`) plus a `tsc --noEmit` run that survives the oxc/rolldown build (Risk R1 mitigation). Adding the brand-new `layout?`/`en?` top-level fields and the wave-3 `cta.action/target/rel` members are **additive edits to `config.ts`** that DO land in `config.ts`; each such PR carries `[no-spec: additive config field owned by wave-N module]` (Decision D2). The plan no longer claims "config.ts is never widened" — it is, additively and on purpose, exactly as the `enlb:dismiss` core change is pre-authorized.

### `window.ENLightboxAPI` (programmatic surface — additive across waves)

```ts
interface ENLightboxAPI {
  // ── wave-0 (shipped) ─────────────────────────────────────────────
  Lightbox: typeof Lightbox
  normalizeConfig(input?: Partial<ENLightboxConfig>): NormalizedConfig
  init(config?: Partial<ENLightboxConfig>): Lightbox     // (re)instantiate singleton; destroys prior
  getInstance(): Lightbox | null

  // ── wave-1 (triggers) ────────────────────────────────────────────
  armTriggers(config?: TriggersConfig): void
  disarmTriggers(): void                                  // idempotent
  isDismissed(): boolean                                  // sessionStorage, per location.pathname
  open(): void                                            // MANUAL open (D7): no-op if isDismissed();
                                                          //   records dismissal on subsequent close
  close(): void                                           // explicit close from host code

  // ── wave-2 (theming) ─────────────────────────────────────────────
  setTheme(theme: ThemeConfig): void                      // runtime re-apply (single root write, D17)
  // (no setLayout — layout is construct-time-only, D10)

  // ── wave-3 (EN integration) ──────────────────────────────────────
  getPageContext(): ENPageContext | null
  registerCanArm(pred: () => boolean): void               // EN gate registers eligibility (D16)
}
interface ENPageContext { pageType: ENPageType | null; pageId: string | number | null; isEngagingNetworks: boolean }
```

**`Lightbox` instance**: `constructor(config: NormalizedConfig)`; `open()`/`close()`/`destroy()`; wave-2 additive `applyTheme(theme: NormalizedTheme)`. No wave-0 signature ever changes.

### Events (DOM `CustomEvent`s on `document`, `enlb:`-namespaced, `{bubbles:true}`)

| Event | Wave | When | `detail` | Consumer |
|---|---|---|---|---|
| `enlb:dismiss` | **wave-1** | `Lightbox.close()` (any path) | `{ pathname: string }` | session guard records dismissal |
| `enlb:open` | wave-1 (optional) | `open()` mounts overlay | `{}` | none required |
| `enlb:trigger` | wave-1 (internal) | a trigger fires, before `open()` | `{ type }` | dispatcher disarms the rest |
| `enlb:cta` | wave-3 | CTA activated, before routing | `{ action, href? }` | CTA router (redirect/close/submit) |

**Frozen sub-contract — `enlb:dismiss` + session key (Decision D15):** name, target (`document`), and `detail.pathname` are durable. The `sessionStorage` key format is frozen as **`enlb:dismissed:${location.pathname}`** and derived by a single internal function used by *both* the writer and `isDismissed()`, so they cannot disagree (a wave-1 unit test asserts round-trip: dismiss on path A ⇒ `isDismissed()` true on A, false on B). **Caveat logged:** `pathname` may be the wrong page-identity granularity on EN (same path, different `pageId`); this is accepted for wave-1 with a BACKLOG revisit trigger and an optional future `campaignKey` (Risk R-N4key). `enlb:dismiss` is an *internal* decoupling signal, not a public analytics hook (hooks deferred per BACKLOG).

### Why this is provably additive

Each wave adds optional config members, new API methods, or new events. The one-time exceptions, all decided and pre-authorized: the wave-0 B1 widening of `config.ts`; additive `config.ts` edits for `layout?`/`en?`/`cta.*` under `[no-spec]` waivers; the wave-2 CTA `<a>`→`<button>` element-shape change landed *before* `action` ships (Decision D6); and the additive `enlb:dismiss` core change. No wave removes or retypes anything a correct wave-0 author relied on. `hideImageOnMobile` is never removed from the top level (Decision D4). There is never an `autoOpen` field (flag #2).

---

## Machine-checked contracts (and which wave adds each)

All contracts are shaped for `check_contracts.py`: each `check` runs `shell=True` from repo root, exits non-zero on drift, completes under 300s, and any `git diff` form is paired with `git add -AN`. Snapshot contracts store a committed source-of-truth under `.agentic/contracts/snapshots/`; threshold contracts use a committed budget JSON. New tiny generators live under `tools/sdd/` exposed as `npm run` aliases. `registry.json` edits are themselves reviewed as CI config (Decision D13).

| Contract | Defends (NFR / flag) | `git add -AN`? | Adds at | Notes |
|---|---|---|---|---|
| `bundle` *(existing)* | reproducible build; dist/ matches src | yes | wave-0 ✅ | Source of the deletion-blind-safe pattern. |
| `no-css-emitted` | inlined-CSS NFR; no runtime stylesheet | yes | **wave-0 backfill (B2)** | `... git add -AN && if find dist -name '*.css' -type f \| grep -q .; then exit 1; fi`. |
| `api-surface` | API stability; **flag #1**; auto-init "instantiates+arms-but-no-open" | yes | **wave-0 backfill (B3), green before wave-1** | **Exact extraction (Decision D-api):** sorted list of `export name : full type signature` from a ts-morph/tsc dump of the **merged** `src/index.ts` surface + the IIFE global name string. Additive methods SHOULD churn the snapshot (that's the reviewable diff). Includes the auto-init clause: reads `window.ENLightbox`, instantiates, does NOT open; **wave-1 extends it to assert "arms triggers when present and not dismissed; does not arm when dismissed"** (Decision D-autoinit). |
| `config-schema` | editor config contract + defaults; **flag #4** | yes | **wave-0 backfill (B4)** | Snapshot of the **composed** `ENLightboxConfig`/`NormalizedConfig` + each sub-normalizer's default table. Pulled earlier than prior draft so wave-1's trigger typing diffs against a frozen baseline. |
| `bundle-size` | performance budget | n/a (numeric) | **wave-1** | `npm run build && node tools/sdd/check_size.mjs`; budget in `.agentic/contracts/budgets.json`. **gzip is the gating metric.** Baseline today: 4965 B raw / 1809 B gzip. Initial budget set from measured baseline + a per-wave allowance, **re-baselined after wave-2 themes** (Decision D-size; the flat ~8KB guess is rejected — see Risk). |
| `no-runtime-deps` | zero-runtime-dependency NFR | n/a | **wave-1** | `node -e` assert `package.json` `dependencies` empty/absent. |
| `no-runtime-fetch` | N2(b): no runtime network fetch | n/a (grep) | **wave-2** | Fail if `dist/en-lightbox.js` contains `fetch(`/`XMLHttpRequest`/`import(\s*['"]http`/`url(http`, or if compiled CSS embeds `http(s)://` asset URLs. Closes the runtime-fetch half of N2 that was prose-only (new — gap finding). |
| `reduced-motion-guard` | N17: motion gated behind reduced-motion | n/a (grep) | **wave-2** | Fail if inlined CSS contains a `@keyframes`/`transition`/`animation` not wrapped by `@media (prefers-reduced-motion: reduce)`. Prevents a theme shipping unguarded motion (new — gap finding; axe-core does NOT catch this). |
| `dist-single-file` | single-artifact NFR | yes | **wave-2** | `... git add -AN && test "$(ls dist \| sort \| tr '\n' ',')" = "en-lightbox.js,"`. Complements `no-css-emitted`. |
| `a11y-audit` | N13: contrast/ARIA audit | n/a | **wave-2** | axe-core (or Lighthouse) run over a rendered fixture in CI. Owned by wave-2/stream-a (theming owns contrast). Moves N13 off GAP (new — gap finding). |
| `cross-browser-smoke` | **N5** cross-browser | n/a | **committed mini-stream (see D3)** | Playwright smoke across Chrome/Safari/Edge/Firefox + a mobile viewport. **Assigned to a committed stream, NOT optional wave-4** (Decision D3). Moves N5 off GAP. |
| `ownership-complete` *(optional)* | every `src/<dir>` has an ownership rule | n/a | wave-1+ | Asserts `ownership.json.rules{}` has a rule for each existing `src/` subdir, so a missing carve-out fails CI instead of silently falling through to wave-0 (new — gap finding, closes R3 mechanically). |
| `green-suite` *(optional)* | tests + lint + typecheck green | n/a | optional | Only if the registry should be the single source of "what must hold." |

**Recommended adoption path:** *wave-0 backfill:* `no-css-emitted`, `api-surface`, `config-schema`. *Wave-1:* `bundle-size`, `no-runtime-deps`, (optional `ownership-complete`). *Wave-2:* `no-runtime-fetch`, `reduced-motion-guard`, `dist-single-file`, `a11y-audit`. *Committed mini-stream (with or before wave-2):* `cross-browser-smoke`.

---

## NFR + use-case coverage matrix

Status legend: COVERED · PARTIAL · OWNED-NOT-YET-BUILT · GAP · DEFERRED.

### Non-functional requirements

| # | NFR | Owning wave/stream | Verification | Status |
|---|---|---|---|---|
| N1 | Zero runtime dependencies | wave-0; ratchet wave-1 | `bundle` + `no-runtime-deps` (wave-1) | PARTIAL→closed at wave-1 |
| N2 | Single self-contained artifact (one JS, SCSS inlined, no `.css`, **no runtime fetch**) | wave-0; ratchets at backfill / wave-2 | `bundle` + `no-css-emitted` (B2) + `dist-single-file` (w2) + **`no-runtime-fetch` (w2)** | PARTIAL→closed at wave-2 |
| N3 | Non-intrusive (no render-block, no perf degradation, no EN form interference, **no background scroll**) | wave-0 defer + B5 scroll-lock + wave-3 | defer code-verified + **wave-1 test: no `<style>`/overlay/listeners run `open()` before a trigger; scroll/mousemove listeners `{passive:true}`; ctor side-effect-free** (new — gap finding); scroll-lock test (B5/N16); EN form test (wave-3) | PARTIAL→closes at wave-3 |
| N4 | Session discipline (dismiss-once-per-session, per `pathname`) | wave-1/stream-a | frozen key `enlb:dismissed:${pathname}` (D15); **`sessionStorage` wrapped in try/catch, unavailable⇒"not dismissed", never throws; unit test simulates throwing storage** (new — gap finding); round-trip test | OWNED-NOT-YET-BUILT |
| N5 | Cross-browser (Chrome/Safari/Edge/Firefox + mobile) | **committed mini-stream (D3)** | `cross-browser-smoke` Playwright contract; **no longer dependent on optional wave-4** | OWNED-NOT-YET-BUILT (was GAP) |
| N6 | Responsive 2-col image+content | wave-0 → wave-2/a | DOM-structure test + viewport/visual test (shares cross-browser tooling) | PARTIAL (wave-2) |
| N7 | Responsive mobile stacking | wave-2/a | viewport/visual test (jsdom can't compute layout) | PARTIAL (wave-2) |
| N8 | Hide-image-on-mobile toggle (default ON) | wave-0 + wave-2/a | default `true`; **unit test: class toggles with config flag** + media-effect viewport test | PARTIAL (wave-2) |
| N9 | A11y — focus trap (Tab/Shift+Tab wrap) | wave-0/a | Unit tests | COVERED |
| N10 | A11y — ESC-to-close | wave-0/a | Unit tests | COVERED |
| N11 | A11y — ARIA + **non-empty accessible name** | wave-0/a + **B5** | role/aria-modal tests COVERED; **empty-header fallback to `aria-label` + unit test asserting non-empty accessible name** (new — gap finding) | PARTIAL→closes at B5 |
| N12 | A11y — focus restore on close | wave-0/a | Unit test | COVERED |
| N13 | A11y — automated audit (contrast) | **wave-2/a** | **`a11y-audit` axe-core contract** (new — gap finding moves off GAP) | OWNED-NOT-YET-BUILT (was GAP) |
| N14 | Performance budget (small bundle, defer, no thrash) | wave-0; wave-1; **wave-2/a thrash** | `bundle-size` (size, gzip-gated); defer test (N3); **thrash owned by wave-2/a: single root style write, read-before-write, jsdom assertion that `setTheme` mutates root once** (new — gap finding) | PARTIAL→closes at wave-2 |
| **N15** | **A11y — modal isolates assistive tech (background inert/`aria-hidden`)** | **B5 core + wave-3** | toggle `inert`/`aria-hidden`+saved-tabindex on body's other children on open, restore on close; unit test (background button inert on open, restored on close); **wave-3 test: EN form cleanly hidden/restored, no orphaned `aria-hidden`** (new — gap finding) | OWNED-NOT-YET-BUILT (was unowned) |
| **N16** | **Non-intrusive — body scroll-lock + restore** | **B5 core** | set body overflow + restore scroll position on open/close/destroy; iOS overscroll-behavior approach documented (shares N5 tooling) (new — gap finding) | OWNED-NOT-YET-BUILT (was unowned) |
| **N17** | **A11y — motion gated behind `prefers-reduced-motion`** | **wave-2/a** | **`reduced-motion-guard` grep contract** (new — gap finding; axe-core insufficient) | OWNED-NOT-YET-BUILT (was unowned) |
| **N18** | **A11y — initial-focus policy (focus dialog root, consistent across `closeButton` variants)** | **B5 core + wave-2/a** | focus labelled dialog root by default (not the X button); **wave-2 tests for `closeButton:'inside'\|'outside'\|'none'`** (new — gap finding) | OWNED-NOT-YET-BUILT (was unowned) |

### Product use-cases

| # | Use-case | Owning wave/stream | Verification | Status |
|---|---|---|---|---|
| U1–U4 | Triggers: time / scroll / inactivity / exit-intent | wave-1/a | unit tests (exit-intent touch=no-op) | OWNED-NOT-YET-BUILT |
| U5 | Trigger: video-progress | **DEFERRED** | revisit: campaign needs video-completion triggering | DEFERRED |
| U6 | Manual / multi-trigger composition | wave-1/a | unit tests (first-to-fire wins); **manual `API.open()` documented + dismiss-aware (D7)** | OWNED-NOT-YET-BUILT |
| U7 | Content: image + body + CTA rendering | wave-0/a | unit tests | COVERED |
| U8 | Per-campaign customization | wave-0 + wave-2/b | full customization at wave-2 | PARTIAL (wave-2) |
| U9 | Multiple themes | wave-2/b | unit tests | OWNED-NOT-YET-BUILT |
| U10 | EN page targeting (type / ID detection) | wave-3/a | unit tests; **detection source committed + spiked on live EN (D19)** | OWNED-NOT-YET-BUILT |
| U11 | CTA redirect-vs-close-vs-submit semantics | wave-3/a | **single source of truth `cta.action` (D5)**; `<button>` element (D6); **tag-by-action + keyboard-activation unit test** | OWNED-NOT-YET-BUILT |
| U12 | No EN form-submit interference (= N3/N15) | wave-3/a | **committed concrete test: mount over EN-shaped form, both open and closed; assert submit/validation/focus proceed; cover the submit-action path** (Decision U12-test) | PARTIAL→closes at wave-3 |
| U13 | Editor usability (config + docs) | wave-0 auto-init + **per-wave authoring snippets** + wave-3 README | **each wave ships a minimal authoring snippet + defaults table; one-line resilience policy: invalid/partial config degrades gracefully, never throws on host page** (new — gap finding, D20) | PARTIAL (improved each wave) |
| U14 | Auto-init instantiates but does NOT open (flag #2) | wave-0/a | unit test (+ wave-1 arming clause, D-autoinit) | COVERED |
| U15 | Public API surface (flag #1) | wave-0/a | `api-surface` contract | COVERED |
| **U16** | **Rich-text body (paragraphs/links/bold)** | **DEFERRED (BACKLOG)** | revisit: campaign needs >1 paragraph or inline link; see Open Q9 | DEFERRED |
| **U17** | **Secondary / decline CTA ("No thanks")** | **wave-2/stream-a** (owner decision Q10) | unit test: `secondaryCta`/`dismissLabel` renders; button-row + focus-trap order correct | OWNED-NOT-YET-BUILT |

---

## Sequencing & shared-surface plan

**Merge order (forced sequential):** wave-1/a → wave-2/a → wave-2/b → wave-3/a → wave-4/a (plus the committed cross-browser mini-stream, placed by the owner — see D3). One tracking issue + one PR per stream; independent reviewer; merge-commit only; merge on per-PR owner authorization.

**Branch/rebuild discipline (Decision D-dist):** every stream branches from the latest `main` **after** the prior stream merges (mandatory under `concurrent_streams=1`). The committed minified `dist/` is regenerated per PR and is a recurring conflict/diff-noise surface; `contracts-check` runs `npm run build` post-merge (`npm ci` first) so a stale committed `dist/` is caught. **Open Question Q8:** whether to keep committing `dist/` per-PR or refresh it only at wave/release boundaries (CI rebuilds either way).

**Shared surfaces and how contention is avoided:**
- **`src/config.ts`:** widened additively per B1 (empty extensible base interfaces); each owning module *adds members* via declaration merging from its own bucket. New top-level fields (`layout?`/`en?`/`cta.*`) are additive `config.ts` edits carrying `[no-spec: additive config field owned by wave-N]`. The plan does NOT claim config.ts is untouched — it claims the touches are additive and pre-authorized.
- **Normalization:** sub-normalizers live in **governed** `src/<bucket>/normalize.ts` (NOT in spec-exempt `index.ts`), so default/resolution logic stays attached to its owning spec and tests (Decision D8). `index.ts` is a thin call-through.
- **`src/core/lightbox.ts`:** sanctioned cross-wave changes are wave-1's additive `enlb:dismiss` dispatch and the **B5 a11y/UX additive slice** (accessible-name fallback, inert background, scroll-lock, initial-focus). Each carries `[no-spec: additive ...]` against the wave-0 spec. Core→feature decoupling is via `enlb:*` events + the `canArm()` predicate, never direct imports.
- **`src/styles/` tokens:** wave-2/a defines the `--enlb-*` contract; stream-b and later customization write only to that surface.
- **`window.ENLightboxAPI`:** append-only; `api-surface` (full signatures) makes any signature change a reviewable diff.
- **EN eligibility seam:** wave-1 ships the optional `canArm()` hook (default always-eligible); wave-3 registers a predicate via `registerCanArm()` and never edits `src/triggers/**` (Decision D16). This also avoids the wave-1-dismissal-key vs wave-3-pageId coupling forcing a `src/triggers/**` rewrite: the dismissal key-derivation is a single internal function that wave-3 MAY feed a refined identity into at arm time, not by editing the guard (Risk R-N4key).

**Ownership-map carve-outs (Decision D9):** `src/triggers/**`→wave-1, `src/themes/**`(+SCSS)→wave-2, `src/en/**`→wave-3 are added to `ownership.json.rules{}` (the inert `_planned` prose string is invisible to `check_spec_coupling.py`). Each carve-out is the **literal first commit of that wave's first stream PR**, before any governed file in that dir lands, verified by running `check_spec_coupling.py` so the new dir resolves to the new spec, not wave-0. Optional `ownership-complete` contract enforces this mechanically.

**Spec-file scaffolding (Decision D-scaffold):** each wave entry scaffolds `.agentic/specs/wave-N/{README.md,stream-a.md}` from `BRIEF_TEMPLATE.md` (with exit-criteria + retro stub) **before** the ownership rule points at it, because spec-coupling requires the owning spec file to exist and appear in the diff.

**Feed-forward (Decision D12):** process lessons → wave README retro (feeds next JIT brief); durable technical invariants → `LEARNINGS.md` via the wave's reviewed PR. Invariants to promote: `enlb:dismiss` detail+key shape; the no-`autoOpen` rule; byte-identical-bundle; the B1 declaration-merge-additive-only caveat (Risk R1); `cta.action` as sole routing truth (D5). This keeps `learnings-freshness` quiet.

**JIT briefs:** detailed per-stream briefs are written at each wave entry, informed by the prior wave's retro. This master plan stops at decomposition + contract + machine-checked contracts + coverage.

---

## Risks

**Contract / typing risks:**
- **R1 (declaration merging — the seam now compiles):** declaration merging **cannot** narrow an existing `unknown` member (`triggers?: unknown` → `TriggersConfig` errors with "Subsequent property declarations must have the same type"). The prior draft's seam was non-compilable. Fixed via B1: `config.ts` declares empty extensible base interfaces and each module *adds members* (additive, compiles). Rejected alternatives: (a) `config.ts` importing feature dirs (couples the wave-0 file to feature buckets); (c) editing `config.ts` per wave under raw waivers without a base-interface pattern (works but loses the "own your type in your bucket" property). **Must be proven with `tsc --noEmit` + a type-level `expectType` assert that survives the oxc/rolldown build before wave-1 relies on it**, and the augmentation must target the correct relative specifier (`'../config'`, not `'./config'`).
- **R2 (`ThemeConfig.customCss`) — highest-risk extension point:** raw CSS into `<style data-enlb>` is an injection surface. Mitigate in wave-2: scope every rule under `.enlb-dialog`, trusted-editor-only, document the trust boundary, gate behind an explicit wave-2 security review. Same trust boundary applies if rich-text body (Open Q9) is ever adopted.
- **R3 (ownership map):** the inert `_planned` string is invisible to the checker; until each `rules{}` carve-out lands, governed changes in new dirs match `src/**`→wave-0 and demand wave-0 spec edits. Closed mechanically by Decision D9 (first-commit carve-out) + optional `ownership-complete` contract.
- **R-test-coupling:** test-light PRs WILL trip the `test-coupling` gate: wave-2/a SCSS-only token work, the B1 type-only declaration-merge files, and wave-4 release-config PRs touching `src/`. Each carries a pre-authorized `[no-test: <reason>]` waiver (Decision D11), mirroring the `[no-spec]` pre-authorization.
- **R-governance-files:** `ownership.json`/`registry.json`/`sdd.config.json` are governed-but-unowned; edits arm/disarm the gates with no spec-coupling. Decision D13 assigns review ownership; `registry.json` `shell=True` checks reviewed as CI config.

**Performance / budget risks:**
- **R-size:** the flat ~8KB raw / ~3KB gzip suggestion is rejected — measured baseline is already 4965 B raw / 1809 B gzip, leaving only ~3KB raw for three feature waves (triggers + 4 implementations, token system + multiple themes + customCss, EN detection + routing). Decision D-size: set the initial budget from the baseline + a per-wave allowance, **re-baseline after wave-2 themes**, gate on gzip, and record a per-wave size delta in each retro so ratchet bumps are deliberate.
- **R-thrash:** wave-2's `setTheme`/`applyTheme` re-writing CSS vars on an open dialog and variant box-model changes are the prime layout-thrash source. Owned by wave-2/a (Decision D17): apply theme via a single class/style write on the dialog root, never per-property in a loop; jsdom assertion that `setTheme` mutates the root once.

**Cross-browser correctness edges:**
- **R-storage:** Safari private mode can throw on `sessionStorage` writes; an unhandled throw in `close()` breaks dismissal and violates N3. Decision (N4): wrap storage in try/catch, treat unavailable as "not dismissed," never throw; unit-test a throwing storage.
- **R-N4key:** dismissal keyed on `location.pathname` may misfire on multi-page EN flows (re-show each step) or collide when one path serves multiple EN pages. Accepted for wave-1 with the key-derivation isolated to one function, a BACKLOG revisit trigger, and an optional future `campaignKey`. The frozen `enlb:dismiss detail.pathname` is accepted as-is; if wave-3 proves pathname wrong, an *additive* `detail.key` is the escape hatch (no breaking change).

**Partial-coverage risks (owned, verification structural-only until the noted wave):**
- **R-N3/U12 — EN form non-interference** now has a committed concrete test (Decision U12-test), including the submit-action path.
- **R-N6/N7/N8 — responsive/layout** verified via the cross-browser/viewport tooling (Decision D3), plus a unit test for the N8 class toggle.

**Intentional non-gaps (deferred by decision, recoverable via BACKLOG revisit triggers):** video-progress trigger (U5); cross-session/cross-page dismissal suppression; analytics/lifecycle hooks; A/B testing; rich-text body (U16, Open Q9); secondary/decline CTA (U17, Open Q10); CTA `submit` action unless wave-3 commits its EN-form contract (D5b). These are now logged in BACKLOG with explicit revisit triggers — previously several were *silently* absent.

---

## Decisions (referenced above)

- **D2** — `config.ts` widened via empty extensible base interfaces + additive member merging (B1); replaces the non-compilable `unknown`-narrowing seam.
- **D3** — Cross-browser smoke (N5) and the responsive/viewport checks ride a **committed** mini-stream, never optional wave-4. Owner places it (with or before wave-2).
- **D4** — Top-level `hideImageOnMobile` is the never-removed source of truth; `layout.hideImageOnMobile` overrides; resolved to one boolean at construction.
- **D5** — `cta.action` is the single canonical CTA routing source of truth (on and off EN); `ENIntegrationConfig` carries no `ctaBehavior`/`redirectUrl`. **D5b:** `submit` is in the enum only if wave-3 commits its concrete EN-form contract (which form, native EN submit, non-form-page behavior); otherwise dropped to deferred.
- **D6** — `enlb-cta` renders as a `<button>` (decided in wave-2, before `action` ships in wave-3) so `close`/`submit` are keyboard/SR-correct; `href` still works for `redirect`. Tag-by-action + keyboard-activation unit test.
- **D7** — Manual open is `ENLightboxAPI.open()`: consults `isDismissed()`, records dismissal on close.
- **D8** — Sub-normalizers live in governed `src/<bucket>/normalize.ts`; `index.ts` is a thin call-through holding no default/resolution logic; the composed `NormalizedConfig` makes flag #4 true.
- **D9** — Ownership carve-outs land in `rules{}` as the first commit of each wave's first stream PR.
- **D10** — `LayoutConfig` is construct-time-only (no `setLayout`); documented asymmetry vs runtime `setTheme`.
- **D11** — Pre-authorized `[no-test]` waivers: B1 type-only files, wave-2/a SCSS-only token work, wave-4 release config.
- **D12** — Durable invariants promoted to `LEARNINGS.md` per wave; process lessons to wave README retro.
- **D13** — Review ownership assigned for `ownership.json`/`registry.json`/`sdd.config.json` mutations (owner-confirmed reviewer; see Open Q).
- **D14/B5** — Committed core a11y/UX slice: accessible-name fallback (N11), background inert (N15), scroll-lock (N16), initial-focus (N18). Owner may fold into wave-2/a but it must be committed.
- **D15** — Frozen session key `enlb:dismissed:${location.pathname}`, single derivation function, round-trip test.
- **D16** — Optional `canArm()` hook in wave-1 (default always-eligible); wave-3 EN gate registers a predicate, never edits `src/triggers/**`.
- **D17** — Theme applied via single root style/class write; read-before-write; jsdom one-mutation assertion.
- **D18** — Image absence always wins ⇒ single-column regardless of `layout.variant`; wave-2 unit test (no `enlb-image` node).
- **D19** — Wave-3 commits the named EN detection source(s) + absent-fallback (eligible vs ineligible) and spikes against a live TNC EN page before freezing `ENPageContext`.
- **D20** — Resilience policy: invalid/partial config degrades gracefully (skip bad field, keep lightbox functional), never throws on the host page; surfaced in per-wave authoring snippets.
- **D-api / D-autoinit / D-size / D-dist / D-scaffold** — as described in their sections.

---

*Contradictions resolved between drafts and against ground truth:* (1) **declaration-merge seam** — proven non-compilable for `unknown`-narrowing; replaced with additive base-interface merging (D2/B1/R1). (2) **`config.ts` "never widened"** vs schema adding `layout?`/`en?`/`cta.*` — resolved: additive widening is expected and pre-authorized under `[no-spec]` waivers. (3) **flag #4 "single place defaults are applied"** — made true via a composed `NormalizedConfig` and governed sub-normalizers (D8), not `index.ts` composition. (4) **CTA routing dual source** (`cta.action` vs `en.ctaBehavior`) — collapsed to `cta.action` only (D5). (5) **CTA element** — `<a>`→`<button>` decided now (D6), not deferred to a JIT brief. (6) **N5/N13/N15/N16/N17/N18** — moved off GAP/unowned onto committed streams + contracts. (7) **test-coupling + learnings-freshness gates** — added to governance (were absent). (8) **bundle-size budget** — rejected the flat guess for a baseline-derived, re-baselined, gzip-gated ratchet (D-size). (9) **`no-css-emitted` vs `dist-single-file`** — keep both, staggered, plus the new `no-runtime-fetch` for N2(b).
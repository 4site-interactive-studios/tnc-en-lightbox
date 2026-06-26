# tnc-en-lightbox

> A dependency-free, configurable lightbox library for Engaging Networks pages — behavior-triggered and customizable per campaign.

## What it is

`tnc-en-lightbox` is a single-file, zero-runtime-dependency lightbox built for Engaging Networks (EN) fundraising and advocacy pages. A page editor drops a small global config object on a page, loads one script, and the lightbox auto-instantiates. It waits for a configured behavior trigger — or an explicit API call — before opening, and it respects a per-page display frequency so visitors are not nagged.

The library is intentionally small and non-intrusive: one minified IIFE (`dist/en-lightbox.js`) with all styles inlined, no external runtime dependencies, no runtime network fetches, and no interference with EN form submission.

## Key features

- **Zero runtime dependencies** — enforced by the `no-runtime-deps` contract ([`.agentic/contracts/registry.json`](.agentic/contracts/registry.json)).
- **Single self-contained artifact** — `npm run build` emits one minified IIFE at `dist/en-lightbox.js` with all SCSS inlined; verified by the `bundle`, `no-css-emitted`, and `dist-single-file` contracts.
- **Behavior triggers** — time-on-page, scroll-depth, inactivity, and exit-intent triggers compose with first-to-fire-wins semantics (see [`ROADMAP.md`](.agentic/specs/ROADMAP.md) § "Wave 1 — Triggers").
- **Frequency-capped dismissal** — stores a timestamp in `localStorage` keyed by `location.pathname` (`enlb:shown:${pathname}`), with a configurable `frequencyDays` cap (default 7; `0` = every load). Storage failures fail open and never throw on the host page.
- **Theming presets + token overrides** — `light`, `dark`, and `brand` presets, plus per-token customization of colors, radius, max-width, and font family through CSS custom properties (`--enlb-*`).
- **Accessible by default** — focus trap, Escape-to-close, focus restore on close, non-empty accessible name, background `inert`/`aria-hidden` isolation, body scroll-lock, and motion gated behind `prefers-reduced-motion`; covered by unit tests and the `a11y-audit` / `reduced-motion-guard` contracts.
- **EN-form-safe CTAs** — `cta.action` is the single routing source of truth. `redirect` renders as a native `<a href>`; `close` renders as a `<button>` and records dismissal. `secondaryCta` follows the same rules; `dismissLabel` is always a close button.
- **Cross-browser smoke net** — Playwright smoke specs run against Chromium, WebKit, Firefox, and a mobile viewport in CI (`.github/workflows/cross-browser.yml`).

## Quick start

Add the config and load the built script on any EN page where the lightbox should appear:

```html
<script>
  window.ENLightbox = {
    header: "Join the fight",
    body: "Add your voice to protect the lands and waters we all rely on.",
    cta: { label: "Sign now", href: "#petition", action: "redirect" },
    dismissLabel: "Not now",
    triggers: { frequencyDays: 7, time: 5000 },
  };
</script>
<script src="https://your-cdn.example.com/en-lightbox.js" async></script>
```

The script auto-instantiates from `window.ENLightbox`, arms the configured trigger, and opens the lightbox when the trigger fires. For the full config schema, examples, dismissal behavior, and customization limits, see [`EDITOR.md`](EDITOR.md).

Programmatic control is available on `window.ENLightboxAPI`:

```js
ENLightboxAPI.open()      // manual open (honors frequency cap)
ENLightboxAPI.close()     // close manually
ENLightboxAPI.setTheme({ preset: "dark" })  // re-apply theme at runtime
ENLightboxAPI.getInstance() // current Lightbox instance, or null
```

## Architecture overview

- **Build pipeline** — Vite 8 compiles `src/` TypeScript plus inlined SCSS into one minified IIFE at `dist/en-lightbox.js`. The committed `dist/` artifact is the hosted file.
- **Config seam** — `src/config.ts` declares empty extensible base interfaces (`TriggersConfigBase`, `ThemeConfigBase`, `LayoutConfigBase`) that feature modules populate through TypeScript declaration merging. This keeps the dependency direction clean: the core config never imports feature directories.
- **Singleton lifecycle** — `src/index.ts` exports `init`, `getInstance`, `open`, `close`, `armTriggers`, `disarmTriggers`, `isEligible`, and `setTheme`. Auto-init runs on load when `window.ENLightbox` is present; it instantiates but does **not** open the lightbox.
- **Machine-checked contracts** — `.agentic/contracts/registry.json` defines CI-enforced guarantees: bundle freshness, no emitted CSS, no runtime dependencies, no runtime fetches, single-file distribution, bundle-size budget (gzip ≤ 5000 B), reduced-motion compliance, a11y audit, and cross-browser smoke. Generators live under `tools/sdd/`.
- **SDD governance** — `.agentic/AGENTS.md`, `.agentic/WORKFLOW.md`, and `.agentic/REVIEWING.md` define the delivery loop, GATES, independent-review protocol, and spec-coupling rules. Per-wave briefs live in `.agentic/specs/wave-N/`; the master plan is in `.agentic/specs/ROADMAP.md`.

## Repo structure

```
.
├── src/
│   ├── core/lightbox.ts          # Modal lifecycle, DOM, a11y, focus/scroll management
│   ├── triggers/                 # Trigger dispatcher + implementations + dismissal guard
│   ├── themes/                   # Theme presets, token normalization, layout normalization
│   ├── config.ts                 # Public config types + extensible base interfaces
│   └── index.ts                  # Public API, auto-init, singleton wiring
├── dist/en-lightbox.js           # Shipped, minified, single-file artifact
├── e2e/                          # Playwright cross-browser smoke harness + specs
├── .agentic/
│   ├── AGENTS.md                 # Operating manual for coding agents
│   ├── WORKFLOW.md               # GATES and delivery loop
│   ├── REVIEWING.md              # Independent-reviewer protocol
│   ├── LEARNINGS.md              # Durable technical invariants
│   ├── BACKLOG.md                # Deferred ideas with revisit triggers
│   ├── specs/                    # Wave briefs and master ROADMAP
│   ├── contracts/                # Machine-checked contract registry + snapshots
│   └── decisions/                # Architecture Decision Records
├── tools/sdd/                    # SDD gate scripts
├── EDITOR.md                     # Page-editor / campaign-customization guide
└── README.md                     # This file
```

## Development workflow

```bash
npm install                # install dev dependencies
npm run build              # emit dist/en-lightbox.js (single IIFE, inlined CSS)
npm test                   # Vitest unit suite in jsdom
npm run typecheck          # tsc --noEmit (strict)
npm run lint               # ESLint
npm run e2e                # Playwright cross-browser smoke suite
npm run contracts:generate # regenerate api-surface + config-schema snapshots
```

SDD gates can be run locally:

```bash
python3 tools/sdd/check_spec_coupling.py --base main
python3 tools/sdd/check_contracts.py
python3 tools/sdd/check_test_coupling.py --base main
python3 tools/sdd/check_learnings_freshness.py --base main
```

## Contributing

This project uses Spec-Driven Development under `.agentic/`. Before contributing code, read [`.agentic/AGENTS.md`](.agentic/AGENTS.md) and [`.agentic/WORKFLOW.md`](.agentic/WORKFLOW.md). Every PR needs an independent reviewer, a `Closes #N` body line, and green CI.

## Pending documentation

The following topics are intentionally held for later streams:

- Hosting, CDN, cache-busting, versioning, license, and embed instructions — pending **wave-4/stream-b**.
- Visual appearance, screenshots, and Shadow-DOM / isolation internals — pending **wave-4/stream-c**.

For the current state of these items, see [`DOCS_AUDIT.md`](DOCS_AUDIT.md).

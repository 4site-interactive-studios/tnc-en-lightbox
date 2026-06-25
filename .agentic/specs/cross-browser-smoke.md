# Cross-browser smoke net — committed mini-stream

**Placed:** between wave-1 and wave-2 (Decision D3 / Q3) · **Branch:** `feat/cross-browser-smoke` ·
**Depends on:** wave-0 + wave-1 (core + triggers + frequency dismissal, all on `main`) ·
**Required reading:** [`AGENTS.md`](../AGENTS.md), [`WORKFLOW.md`](../WORKFLOW.md), [`ROADMAP.md`](./ROADMAP.md) (Decision D3, NFR N5, the `cross-browser-smoke` contract row), this brief.

## Goal
Land the **N5 cross-browser safety net before wave-2** adds theming/responsive complexity: a Playwright
smoke suite that drives the **built `dist/en-lightbox.js`** in real Chromium, WebKit (Safari), Firefox,
and a mobile viewport, asserting the load-bearing behaviors render and work. jsdom can't lay out,
animate, or do real pointer/scroll — this catches what the unit suite can't, and gives wave-2's
responsive/visual work a real-browser regression net.

## In scope
- **Playwright** (dev-dependency) + config with projects: `chromium`, `webkit`, `firefox`, and a
  **mobile viewport** project. Edge ≈ Chromium (optionally the `msedge` channel — document the choice).
- A minimal **HTML harness** that loads the built `dist/en-lightbox.js` and sets `window.ENLightbox`,
  served via Playwright's `webServer` (or a static file server).
- **Smoke specs** under `e2e/` (load-bearing handful, NOT exhaustive):
  - a trigger opens the lightbox (e.g. a short time-on-page delay);
  - render: overlay + `role="dialog"` + 2-column layout + close button;
  - all three close paths (ESC / X / overlay backdrop);
  - focus moves into the dialog on open;
  - frequency dismissal suppresses re-open within the window (localStorage);
  - real-browser validation of **exit-intent** and **scroll-depth** (which jsdom could only stub).
- **A dedicated CI job** — `.github/workflows/cross-browser.yml` (or a new job): build → `npx playwright
  install --with-deps` → run the `e2e/` suite across the matrix. Do **NOT** fold this into the
  `contracts-check` job (that lightweight job has no browser binaries). If a `cross-browser-smoke` entry
  is added to `registry.json`, wire its `check` to this dedicated job, not `check_contracts.py`.

## Out of scope
- Any `src/` change or new library feature; theming (wave-2).
- Screenshot / visual-diff regression (smoke only).
- **Fixing** cross-browser bugs found — if a real bug surfaces, **file an issue + flag it**; don't
  expand scope to fix it here unless trivial.

## Deliverables
- `playwright.config.ts` (browser + mobile projects, webServer).
- `e2e/` smoke specs + the HTML harness loading `dist/`.
- `.github/workflows/cross-browser.yml` (build + `playwright install --with-deps` + run, across the matrix).
- `package.json` Playwright dev-dep + an `e2e`/`test:e2e` script.
- (Optional) a `cross-browser-smoke` entry in `registry.json` pointing at the dedicated job.
- This brief trued-up at the end.

## Acceptance criteria
- [ ] Playwright config covers chromium + webkit + firefox + a mobile viewport; runs headless in the
      dedicated CI job (which installs browsers).
- [ ] Smoke specs cover trigger-open, render, the three close paths, focus-in, and frequency
      suppression — **green across all configured browsers** on the head SHA.
- [ ] **No `src/` or shipped-bundle-behavior change**; the existing four SDD gates + the 65 unit tests
      still pass; zero runtime deps unchanged (Playwright is dev-only).
- [ ] The cross-browser CI job is green; if a `cross-browser-smoke` registry entry is added, its check
      is wired to that job.

## First action
Stand up Playwright + a **failing** smoke spec: load `dist/en-lightbox.js` into a page, set a short
time-on-page trigger, assert the overlay appears in chromium. Make it green, then extend the same spec
across webkit / firefox / mobile.

## Gotchas
- **Browsers must be installed in CI** (`npx playwright install --with-deps`) in the **dedicated** job —
  never in `contracts-check` (no browsers there).
- **Test the built `dist/`** (the shipped artifact), not `src/`, so the smoke reflects what ships.
  Build (or use the committed `dist/`) in the job.
- **WebKit** is the Safari proxy; **Edge** is Chromium (use the `msedge` channel only if you want true
  Edge — document either way).
- Keep it **smoke** — a handful of load-bearing behaviors; exhaustive visual diffing is out.
- This stream changes **no `src/`**, so it won't trip spec-coupling; `e2e/*.spec.ts` satisfy test
  patterns. Playwright is a **dev-dep** — the zero-runtime-deps NFR is unchanged.
- If a real cross-browser **bug** appears (e.g. exit-intent/scroll behaving differently), **file an
  issue and flag it** in the report — do not silently fix or expand scope.

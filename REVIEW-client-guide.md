# Independent Review — PR #46: `docs/client-guide`

**Reviewer:** Fernando Santos (`fern@ndo.io`)  
**PR:** #46 — `docs/client-guide` → `main`  
**Head SHA:** `ef44296f2079577335b966d8636b20b081b44fbb`  
**Scope:** Documentation only (`CLIENT_GUIDE.md` added; no code changes).

## Verdict

**APPROVED**

## Verification performed

1. **Diff review** (`gh pr diff 46`) — only `CLIENT_GUIDE.md` is added.
2. **Schema cross-check** — compared every config example and option description against the shipped schema in `EDITOR.md`, `src/config.ts`, `src/themes/config.ts`, and `src/themes/presets.ts` (all read from `main`).
3. **Theme/token cross-check** — compared `forest`/`sky` descriptions against `src/themes/presets.ts` and `src/styles/lightbox.scss`.
4. **Defaults check** — verified stated defaults against `normalizeConfig` / `normalizeLayout` / `normalizeTheme` and `EDITOR.md`.
5. **Overpromising check** — confirmed the deferred Engaging Networks reference-field tracking is described as a future/roadmap item.
6. **CI status** — waited for and confirmed all checks green on head SHA, including `cross-browser-smoke`.
7. **PR metadata** — commit authored/committed by `fern@ndo.io`; body contains `Closes #45`.

## Findings

### Config examples — valid against schema

- All three complete examples and all inline snippets use field names, nesting, and types that match `ENLightboxConfig`:
  - `theme.preset` values: only `forest`/`sky`/`light`/`dark`/`brand` are listed; examples use `forest` and `sky`.
  - `layout.imagePosition`: `left`/`right`/`top` only; defaults to `left`.
  - `layout.closeButton`: `inside`/`outside`/`none` only; defaults to `inside`.
  - `cta`/`secondaryCta`: shape `{ label, href?, action? }` with `action: "redirect" | "close"`.
  - `triggers`: uses `frequencyDays` + `list` form; list items use `type`, `delayMs`, `percent` correctly.
  - `eyebrow`: used as a top-level string in examples.
- No examples use shorthand trigger fields (`time`, `scroll`, `inactivity`, `exitIntent`), but that is a documentation choice, not an error; all shown examples are valid.

### Defaults — correct

- `frequencyDays` default `7` and `0` = every load: stated correctly.
- `closeButton` default `inside`: correct per `normalizeLayout`.
- `hideImageOnMobile` default `true`: correct per `normalizeConfig`.
- CTA `action` defaults to `redirect` when `href` present, else `close`: consistent with `EDITOR.md`.

### No overpromising

- The FAQ entry for "Can we record a click or exit into an Engaging Networks reference field for A/B testing?" explicitly states: "Not yet — this is on the roadmap as a planned future enhancement." No sentence implies the feature is available.

### forest/sky descriptions — match shipped tokens

- `forest`: surface `#0d6b4e`, text `#ffffff`, CTA bg `#ffffff`, CTA text `#0d6b4e` — matches `presets.ts` and `lightbox.scss` (`.enlb-theme-forest`). Content/CTA centered via `lightbox.scss` lines 96–106.
- `sky`: surface `#a7cce3`, text/title `#16181d`, CTA bg `#16181d`, CTA text `#ffffff` — matches `presets.ts` and `lightbox.scss` (`.enlb-theme-sky`). Content/CTA centered.
- Close button: `lightbox.scss` sets `width: 44px; height: 44px; border-radius: 50%` on `.enlb-close`, confirming "44×44 pixels with a contrasting round backing."

### Scope / metadata

- Only `CLIENT_GUIDE.md` added; no source files modified.
- Commit author/committer email: `fern@ndo.io`.
- PR body includes `Closes #45`.
- All CI checks pass on head SHA.

### Clarity

- Document is written in plain language appropriate for a non-developer campaign editor.
- The "Designs work with any trigger" section and FAQ explicitly decouple design from triggers, which addresses a likely client confusion point.
- Minor: the theme table uses "Donate monthly" as an example button label for `forest`, while the corresponding example uses "Give monthly"; this is clearly illustrative and not misleading.

## Conclusion

Accurate, grounded in the shipped schema, no overpromising, docs-only scope, correct metadata, and CI green. Approved.

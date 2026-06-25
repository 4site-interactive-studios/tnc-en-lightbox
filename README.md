# tnc-en-lightbox

> A dependency-free, configurable lightbox library for Engaging Networks pages — behavior-triggered and customizable per campaign.

## Working on this project

This project uses a **Spec-Driven-Development** layer under `.agentic/`. Every coding agent works
inside the governance defined there.

**Entry points:**
- [`.agentic/AGENTS.md`](.agentic/AGENTS.md) — the operating manual for coding agents. **Read first.**
- [`.agentic/WORKFLOW.md`](.agentic/WORKFLOW.md) — the delivery loop and the GATES.
- [`.agentic/REVIEWING.md`](.agentic/REVIEWING.md) — the independent-reviewer protocol.
- [`.agentic/specs/`](.agentic/specs/) — wave and stream briefs.
- [`.agentic/specs/AGENT_LAUNCH_PROMPT.md`](.agentic/specs/AGENT_LAUNCH_PROMPT.md) — paste-ready
  prompt to dispatch a coding agent.

**Gates** (run locally or in CI):
- `python3 tools/sdd/check_spec_coupling.py --base main`
- `python3 tools/sdd/check_contracts.py`
- `python3 tools/sdd/check_test_coupling.py --base main`
- `python3 tools/sdd/check_learnings_freshness.py --base main`

## Development

```bash
npm install          # install dev dependencies
npm run build        # emit the single self-contained JS to dist/ (SCSS inlined, no .css)
npm test             # run the Vitest suite in jsdom
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # ESLint
```

The build compiles `src/` into one minified, dependency-free IIFE at
`dist/en-lightbox.js` with all SCSS **inlined into the JS** — no separate
stylesheet is emitted, and styles are injected at runtime via a `<style>` element.
A page editor sets `window.ENLightbox = { … }` and loads the script; it
auto-instantiates from that config and exposes `window.ENLightboxAPI`
(`Lightbox`, `normalizeConfig`, `init`, `getInstance`) for programmatic use.
Visual and responsive behavior is verified by manual cross-browser QA; the
automated suite covers DOM/behavior/a11y in jsdom.

Languages: TypeScript. Frameworks: Vite, SCSS. Package manager: npm.

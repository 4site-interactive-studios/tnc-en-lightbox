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

Languages: TypeScript. Frameworks: Vite, SCSS. Package manager: npm.

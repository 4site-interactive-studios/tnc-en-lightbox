# AGENTS.md — operating manual for tnc-en-lightbox

> A dependency-free, configurable lightbox library for Engaging Networks pages — behavior-triggered and customizable per campaign.

This is the cardinal manual for every coding agent working on this project. Languages: TypeScript. Frameworks: Vite, SCSS. Package manager: npm.

## Non-functional requirements

Captured from the project brief — every agent must respect these:

- **Zero runtime dependencies.** The shipped asset must not load any third-party runtime library; dev-only deps (Vite, Vitest, ESLint) are fine.
- **Single self-contained artifact.** Compiles to one minified JS file with all SCSS/CSS inlined into the JS — no separate stylesheet, no runtime network fetches.
- **Non-intrusive.** Must not block page rendering, degrade performance, or interfere with Engaging Networks form submission or existing page behavior.
- **Session discipline.** Must not re-trigger within the configured frequency window after the user dismisses it (scoped per-page, persistent via localStorage).
- **Cross-browser.** Latest Chrome, Safari, Edge, Firefox.
- **Responsive.** Desktop, tablet, mobile; the 2-column (image + content) layout stacks on mobile, with an optional toggle to hide the image on mobile (off by default).
- **Accessible.** Modal semantics: focus trap, ESC-to-close, focus restored on close, appropriate ARIA roles/labels.
- **Performance budget.** Keep the bundle small; defer all work until a trigger fires; avoid layout thrash.

## How agents work here

- **Classify first.** Eligible documentation uses the global docs-only lane; ordinary reversible
  work is default; concurrency, migrations, performance risk, broad cross-cutting work,
  `LEARNINGS.md` invariants, and security-sensitive trust boundaries are hard.
- **Test behavior changes.** Tests are required when runtime behavior changes and may be written
  before or after implementation. Use `[no-test: <reason>]` when behavior does not change.
- **Review hard work only.** Default and docs-only work skip independent review. Hard work receives
  one blocker-only review and at most one repair.
- **Integrate green reversible work automatically.** Human approval is reserved for the exact
  irreversible class in `.agentic/WORKFLOW.md`.
- **Stay inside the stack.** Do not introduce a new language, framework, or major dependency without
  an ADR in `.agentic/decisions/`.
- **Use conventional commits.** Link an existing issue with `Closes #N`; do not create an issue only
  for ceremony.
- Read `.agentic/WORKFLOW.md` and `.agentic/REVIEWING.md` before the first task.

## Memory — two tiers, deterministic

- **Durable tier — `.agentic/LEARNINGS.md`.** Human-curated invariants, gotchas, and historical
  fixes, written through normal PR review. This is the *sole* curated store. Lessons learned go into
  a PR's "What was hard / non-obvious" section first; promotion into `LEARNINGS.md` is a reviewed
  change, never a direct drive-by edit.
- **Dynamic tier (off).** Per-run lesson capture is disabled — there is no runtime to capture from yet. Revisit when one exists. Never add a meta-agent that edits the durable record autonomously (see the cautionary note above).

A cautionary note that shaped this design: a managed "the machine promotes lessons automatically"
block that is never wired — *and* forbids manual editing — is the worst of both worlds (capture
inert, manual path forbidden, every lesson lost). Keep the durable layer human-writable now; let any
future automation read and feed it, never gate it.

## Forbidden

Skipping required behavior coverage; adding dependencies without justification; committing secrets
or large unexplained binaries; force-pushing shared branches; bypassing hooks; weakening tests or
contracts to get green; expanding a docs-only request; exceeding the one-repair bound; estimating
time, effort, or duration instead of reporting factual progress.

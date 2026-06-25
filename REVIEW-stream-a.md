# Independent Review — wave-0 / stream-a — PR #2

Reviewed by: Fernando Santos <fern@ndo.io>

Date: 2026-06-25

Verdict: BLOCKED

Reviewed PR head: `ef5b477017ea7523f552f473148cecf62684a496`

Review checkout: `/Users/fernando/sites/.worktrees/wave-0-review`

Audit branch/worktree: `wave-0-review-audit` at `/Users/fernando/sites/.worktrees/wave-0-review-audit`

## Required Reading

PASS: Read the required files in order from the detached review checkout.

Observed files:

```text
.agentic/REVIEWING.md
.agentic/WORKFLOW.md
.agentic/specs/wave-0/stream-a.md
.agentic/LEARNINGS.md
```

Additional stream brief references read:

```text
.agentic/AGENTS.md
.agentic/specs/wave-0/README.md
```

`LEARNINGS.md` invariants status: N/A. The file currently says `_None yet — this project hasn't earned its first invariant._`

## Setup

PASS: Detached review worktree was created at the exact requested SHA and dependencies installed.

Command:

```bash
git rev-parse HEAD
```

Output:

```text
ef5b477017ea7523f552f473148cecf62684a496
```

Command:

```bash
npm ci
```

Output excerpt:

```text
added 175 packages, and audited 176 packages in 681ms
found 0 vulnerabilities
```

## Local Test Suite

PASS: `npm test` passed locally with 20/20 tests.

Command:

```bash
npm test
```

Output:

```text
Test Files  3 passed (3)
Tests       20 passed (20)
```

PASS: Read the assertions, not just the count. `src/core/lightbox.test.ts` covers:

- render + `aria-modal`
- all three close paths: Escape, X button, overlay backdrop
- inside-click no-close
- `closeOnEsc:false` no-close
- `closeOnOverlay:false` no-close
- focus trap Tab and Shift+Tab wrap
- focus moves into dialog on open and restores to trigger on close
- `destroy()` removes overlay, `[class*="enlb-"]` nodes, and `<style data-enlb>`
- repeated open/close does not duplicate DOM

`src/index.test.ts` covers auto-init from `window.ENLightbox` and `init()`/`getInstance()`.

## Typecheck And Lint

PASS: Typecheck exited 0.

Command:

```bash
npm run typecheck
```

Output:

```text
> tnc-en-lightbox@0.0.0 typecheck
> tsc --noEmit
```

PASS: Lint exited 0.

Command:

```bash
npm run lint
```

Output:

```text
> tnc-en-lightbox@0.0.0 lint
> eslint .
```

## Mutation Verify — Escape Handler

PASS: Replaced `this.close()` in `src/core/lightbox.ts:17` with a no-op and reran the suite. Exactly one test failed, and it was the required named test.

Command:

```bash
npm test
```

Output excerpt:

```text
src/core/lightbox.test.ts (14 tests | 1 failed)
× pressing Escape removes the overlay and dialog from the DOM

FAIL src/core/lightbox.test.ts > Lightbox > pressing Escape removes the overlay and dialog from the DOM
AssertionError: expected <div class="enlb-overlay">…(1)</div> to be null
src/core/lightbox.test.ts:53:53

Test Files  1 failed | 2 passed (3)
Tests       1 failed | 19 passed (20)
```

PASS: Reverted the mutation and restored green tests.

Command:

```bash
npm test
```

Output:

```text
Test Files  3 passed (3)
Tests       20 passed (20)
```

PASS: Review checkout clean after mutation revert.

Command:

```bash
git status --short
```

Output:

```text
<no output>
```

## Bundle Contract

PASS: Committed `dist/` matches source after build.

Command:

```bash
npm run build && git add -AN && git diff --exit-code dist/
```

Output excerpt:

```text
dist/en-lightbox.js  4.96 kB │ gzip: 1.80 kB
✓ built in 308ms
```

PASS: Contract checker passes on clean source.

Command:

```bash
python3 tools/sdd/check_contracts.py
```

Output:

```text
dist/en-lightbox.js  4.96 kB │ gzip: 1.80 kB
✓ built in 75ms
OK        bundle
```

PASS: Contract checker fails when a load-bearing SCSS selector is mutated from `.enlb-overlay` to `.enlb-overlay-mutated`.

Command:

```bash
python3 tools/sdd/check_contracts.py
```

Output excerpt:

```text
dist/en-lightbox.js  4.97 kB │ gzip: 1.81 kB
diff --git a/dist/en-lightbox.js b/dist/en-lightbox.js
-.enlb-overlay{...}
+.enlb-overlay-mutated{...}
FAIL      bundle (`npm run build && git add -AN && git diff --exit-code dist/`)

CONTRACT DRIFT: bundle
```

PASS: Reverted the SCSS mutation and contract returned to OK.

Command:

```bash
python3 tools/sdd/check_contracts.py
```

Output:

```text
dist/en-lightbox.js  4.96 kB │ gzip: 1.80 kB
✓ built in 75ms
OK        bundle
```

PASS: Review checkout clean after contract mutation revert.

Command:

```bash
git status --short
```

Output:

```text
<no output>
```

## Artifact And NFR Checks

PASS: `dist/` has exactly one file, `en-lightbox.js`.

Observed directory listing:

```text
dist/
  en-lightbox.js
```

PASS: No tracked `.css` files.

Command:

```bash
if git ls-files '*.css' | rg .; then exit 1; else printf 'tracked css files: none\n'; fi
```

Output:

```text
tracked css files: none
```

PASS: Dist bundle is self-contained and includes inlined style markers/classes.

Command:

```bash
node -e "const fs=require('node:fs'); const files=fs.readdirSync('dist'); const js=fs.readFileSync('dist/en-lightbox.js','utf8'); console.log('dist files:', files.join(',')); console.log('css files in dist:', files.filter(f=>f.endsWith('.css')).join(',') || 'none'); console.log('forbidden external refs:', /require\(|import\(|http|cdn|node_modules/.test(js) ? 'present' : 'none'); console.log('data-enlb present:', js.includes('data-enlb')); console.log('enlb class present:', js.includes('enlb-')); console.log('ENLightboxAPI global present:', js.startsWith('var ENLightboxAPI=')); console.log('ENLightbox config read present:', js.includes('globalThis.ENLightbox'));"
```

Output:

```text
dist files: en-lightbox.js
css files in dist: none
forbidden external refs: none
data-enlb present: true
enlb class present: true
ENLightboxAPI global present: true
ENLightbox config read present: true
```

PASS: Zero runtime dependencies. `package.json` has no `dependencies` key and only dev dependencies.

Command:

```bash
node -e "const p=require('./package.json'); console.log('dependencies key:', Object.prototype.hasOwnProperty.call(p, 'dependencies') ? 'present' : 'absent'); console.log('devDependencies count:', Object.keys(p.devDependencies || {}).length);"
```

Output:

```text
dependencies key: absent
devDependencies count: 9
```

## A11y And Non-Intrusive Behavior

PASS: Source implements required dialog semantics.

Observed in `src/core/lightbox.ts`:

```text
dialog.setAttribute('role', 'dialog')
dialog.setAttribute('aria-modal', 'true')
dialog.setAttribute('aria-labelledby', this.titleId)
dialog.setAttribute('tabindex', '-1')
closeBtn.setAttribute('aria-label', 'Close')
```

PASS: `aria-labelledby` points to a present header id.

Observed in `src/core/lightbox.ts`:

```text
this.titleId = `enlb-title-${Math.random().toString(36).slice(2, 10)}`
title.id = this.titleId
title.textContent = this.config.header
```

PASS: All generated lightbox DOM class names are `enlb-` prefixed.

Observed class names in `src/core/lightbox.ts`:

```text
enlb-overlay
enlb-dialog
enlb-hide-image-mobile
enlb-close
enlb-layout
enlb-image
enlb-img
enlb-content
enlb-title
enlb-text
enlb-cta
```

PASS: `open()` listener adds and `close()` listener removals are symmetric.

Observed in `src/core/lightbox.ts`:

```text
open(): document.addEventListener('keydown', this.onKeydown)
close(): document.removeEventListener('keydown', this.onKeydown)

open(): this.overlay.addEventListener('click', this.onOverlayClick)
close(): this.overlay.removeEventListener('click', this.onOverlayClick)

open(): this.dialog?.addEventListener('keydown', this.onDialogKeydown)
close(): this.dialog?.removeEventListener('keydown', this.onDialogKeydown)

open(): closeBtn?.addEventListener('click', this.onCloseClick)
close(): closeBtn?.removeEventListener('click', this.onCloseClick)
```

## Wave-1 Contract

PASS: IIFE global is `window.ENLightboxAPI`, not `window.ENLightbox`.

Observed in `vite.config.ts`:

```text
name: 'ENLightboxAPI'
formats: ['iife']
```

Observed in `dist/en-lightbox.js`:

```text
var ENLightboxAPI=(function(e){...})({});
```

PASS: Auto-init reads page-editor config global `window.ENLightbox`/`globalThis.ENLightbox`, instantiates, and does not call `open()`.

Observed in `src/index.ts`:

```text
const cfg = (globalThis as { ENLightbox?: Partial<ENLightboxConfig> }).ENLightbox
if (cfg && typeof cfg === 'object' && !('Lightbox' in cfg) && !('getInstance' in cfg)) {
  init(cfg)
}
```

Observed in `src/index.ts` `init()`:

```text
activeInstance = new Lightbox(normalizeConfig(config))
return activeInstance
```

No `open()` call is present in `init()` or auto-init.

PASS: Public API exposes `init()` and `getInstance()` and `Lightbox` ctor takes `NormalizedConfig`.

Observed in `src/index.ts`:

```text
export function init(config?: Partial<ENLightboxConfig>): Lightbox
export function getInstance(): Lightbox | null
```

Observed in `src/core/lightbox.ts`:

```text
constructor(config: NormalizedConfig)
```

## GitHub Checks And PR Hygiene

PASS: PR #2 still points at the reviewed head.

Command:

```bash
gh pr view 2 --json headRefOid,title,body,headRefName,baseRefName,author
```

Output excerpt:

```json
{
  "headRefName": "feat/wave-0-core",
  "headRefOid": "ef5b477017ea7523f552f473148cecf62684a496",
  "title": "feat: stand up wave-0 build pipeline and core lightbox"
}
```

PASS: Required checks are green on the current PR head.

Command:

```bash
gh pr checks 2
```

Output:

```text
contracts-check      pass  13s  https://github.com/4site-interactive-studios/tnc-en-lightbox/actions/runs/28148210507/job/83359820741
learnings-freshness  pass  6s   https://github.com/4site-interactive-studios/tnc-en-lightbox/actions/runs/28148210507/job/83359820739
spec-coupling        pass  7s   https://github.com/4site-interactive-studios/tnc-en-lightbox/actions/runs/28148210507/job/83359820759
test-coupling        pass  6s   https://github.com/4site-interactive-studios/tnc-en-lightbox/actions/runs/28148210507/job/83359820761
```

PASS: PR body contains `Closes #1`, `How tested`, and `What was hard / non-obvious`.

Observed from `gh pr view 2 --json body`:

```text
Closes #1
## How tested
## What was hard / non-obvious
```

PASS: All PR commits are authored and committed by `fern@ndo.io`.

Command:

```bash
git log --format='%H%nAuthor: %an <%ae>%nCommit: %cn <%ce>%n%B%n---END---' origin/main..HEAD
```

Output excerpt:

```text
ef5b477017ea7523f552f473148cecf62684a496
Author: Fernando Santos <fern@ndo.io>
Commit: Fernando Santos <fern@ndo.io>
docs(spec): mark CI-green criterion met in stream-a
---END---
...
da7fcf51181cfc6ae33043081b5d9aed49ee114d
Author: Fernando Santos <fern@ndo.io>
Commit: Fernando Santos <fern@ndo.io>
chore: scaffold vite + vitest + ts strict toolchain
---END---
```

PASS: No `Co-Authored-By` trailers in PR commits.

Command:

```bash
if git log --format=%B origin/main..HEAD | rg -n 'Co-Authored-By'; then exit 1; else printf 'no Co-Authored-By trailers in PR commits\n'; fi
```

Output:

```text
no Co-Authored-By trailers in PR commits
```

PASS: TDD order is visible: red test commit `24a343f` precedes green implementation commit `6411ab5`.

Command:

```bash
git log --oneline --reverse origin/main..HEAD
```

Output:

```text
da7fcf5 chore: scaffold vite + vitest + ts strict toolchain
24a343f test: add failing lightbox, config, and index test suites (red)
6411ab5 feat(lightbox): core open/close lifecycle, a11y, and config normalizer
6807090 build: single-file dist artifact + bundle freshness contract
ad37435 docs(spec): mark bundle + mutation-verify criteria met in stream-a
ef5b477 docs(spec): mark CI-green criterion met in stream-a
```

PASS: No trigger/theming/EN-integration implementation was added. Only placeholder config types are present.

Command:

```text
Search src for: trigger|theme|Engaging|EN page|page-ID|redirect|form
```

Output:

```text
src/config.ts:19:   triggers?: unknown
src/config.ts:20:   theme?: unknown
src/core/lightbox.test.ts:133-146: local variable named trigger for focus-restore test
```

FAIL: Scope/governance regression. PR #2 deletes the merge-discipline rule from `.agentic/WORKFLOW.md`. This is not part of the stream-a acceptance criteria and would remove the durable rule requiring merge commits and forbidding squash/rebase after approval. The review prompt explicitly says this exact head will land via a merge commit, and preserving that workflow rule is directly relevant to future reviews and release history.

Command:

```bash
git diff origin/main..HEAD -- .agentic/WORKFLOW.md
```

Output:

```diff
diff --git a/.agentic/WORKFLOW.md b/.agentic/WORKFLOW.md
index 1becfe7..f05f9ac 100644
--- a/.agentic/WORKFLOW.md
+++ b/.agentic/WORKFLOW.md
@@ -42,10 +42,6 @@ make expensive failures impossible by construction, not to catch them in review.
 
 ## Merge & cleanup discipline
 
-- **Merge with a merge commit** (`gh pr merge --merge`) — never squash. Squash collapses the
-  red -> green TDD history this workflow requires and the individual conventional commits
-  release-please reads. Never rebase a PR after approval — it invalidates the review (see
-  `REVIEWING.md`).
 - `--force-with-lease` only. Never bypass hooks — fix the cause or stash; don't work around it.
 - Audit branches (the reviewer's `*-review-audit`) are append-only, never force-pushed.
 - **Cleanup is gated on VERIFIED merge state**, never on the merge command having returned. Confirm
```

## Final Verdict

BLOCKED: `.agentic/WORKFLOW.md` removes the merge-commit/no-squash/no-rebase-after-approval rule out of scope for wave-0 stream-a.

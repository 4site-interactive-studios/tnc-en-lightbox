# Independent Review — wave-0 / stream-b backfill — PR #8

Reviewed by: Fernando Santos <fern@ndo.io>

Date: 2026-06-25

Verdict: APPROVED

Reviewed PR head: `43e6082014bb35d75cddcdfef6d7f3ad41f5a481`

Review checkout: `/Users/fernando/sites/tnc-en-lightbox/.worktrees/wave-0-b-review` (detached at the exact head)

Audit branch/worktree: `wave-0-review-audit` at `/Users/fernando/sites/tnc-en-lightbox/.worktrees/wave-0-review-audit-b`

## Required Reading

PASS: Read the required files in order from the detached review checkout.

Observed files:

```text
.agentic/REVIEWING.md
.agentic/specs/wave-0/stream-b.md
.agentic/specs/ROADMAP.md   (B1–B5, Decisions D2/D8/D14, Risk R1)
.agentic/LEARNINGS.md
```

`LEARNINGS.md` invariants status: N/A. The file currently says `_None yet — this project hasn't earned its first invariant._` — no durable invariants exist yet to preserve.

## Setup

PASS: Detached review worktree was created at the exact requested head SHA; the author's worktree was not touched.

Command:

```bash
git worktree add --detach .worktrees/wave-0-b-review 43e6082 && git -C .worktrees/wave-0-b-review rev-parse HEAD
```

Output:

```text
HEAD is now at 43e6082 chore(lint): allow empty extensible base interfaces for declaration merging
43e6082014bb35d75cddcdfef6d7f3ad41f5a481
```

Command:

```bash
npm ci
```

Output excerpt:

```text
added 182 packages, and audited 183 in 1s
found 0 vulnerabilities
```

## 1. Reproduce — test / typecheck / lint / build

PASS: `npm test` passed locally with 27/27 tests across 4 files.

Command:

```bash
npm test
```

Output:

```text
 ✓ src/config.test.ts (4 tests) 2ms
 ✓ src/index.test.ts (2 tests) 97ms
 ✓ src/core/lightbox.a11y.test.ts (7 tests) 22ms
 ✓ src/core/lightbox.test.ts (14 tests) 32ms
 Test Files  4 passed (4)
      Tests  27 passed (27)
```

PASS: `npm run typecheck` exited 0 (`tsc --noEmit`, `tsconfig.json` has `"strict": true`).

PASS: `npm run lint` exited 0 (`eslint .`).

PASS: `npm run build` emits exactly ONE file, `dist/en-lightbox.js`.

Command:

```bash
npm run build && ls dist
```

Output excerpt:

```text
dist/en-lightbox.js  6.27 kB │ gzip: 2.12 kB
✓ built in 305ms
en-lightbox.js
```

## 2. Mutation-Verify — inert restore

PASS: Broke the load-bearing inert-restore at `src/core/lightbox.ts:139` (`s.el.removeAttribute('inert')` → `s.el.setAttribute('inert', 'broken')`). The NAMED test "sets inert and aria-hidden on body siblings while open and restores them on close" went RED at `src/core/lightbox.a11y.test.ts:27`, then reverted to green.

Command:

```bash
npx vitest run src/core/lightbox.a11y.test.ts -t "sets inert and aria-hidden on body siblings while open and restores them on close"
```

Output excerpt (mutation in place):

```text
 FAIL src/core/lightbox.a11y.test.ts > Lightbox a11y/UX hardening > sets inert and aria-hidden on body siblings while open and restores them on close
 AssertionError: expected true to be false // Object.is equality
 ❯ src/core/lightbox.a11y.test.ts:27:43
   25|     lb.close()
   26|
   27|     expect(sibling.hasAttribute('inert')).toBe(false)
 Tests  1 failed | 6 skipped (7)
```

PASS: Reverted the mutation; `git status --short` clean and the named test green again.

## 3. Contracts Bite — they are real gates

PASS: `python3 tools/sdd/check_contracts.py` → all four OK on clean source.

Output:

```text
OK        bundle
OK        no-css-emitted
OK        api-surface
OK        config-schema
```

PASS (a): A stray `.css` under `dist/` makes `no-css-emitted` FAIL. After `npm run build`, injected `dist/stray-test.css`, `git add -AN`, ran the exact check clause.

Command:

```bash
( npm run build && touch dist/stray-test.css && git add -AN && if find dist -name '*.css' -type f | grep -q .; then echo 'ERROR: .css emitted'; exit 1; fi ); echo "rc_with_stray=$?"
```

Output:

```text
ERROR: .css emitted
rc_with_stray=1
```

Confirming the clean state exits 0:

```bash
( npm run build && git add -AN && if find dist -name '*.css' -type f | grep -q .; then echo 'ERROR: .css emitted'; exit 1; fi ); echo "rc_clean=$?"
```

Output:

```text
rc_clean=0
```

PASS (b): Editing a public export in `src/index.ts` makes `api-surface` FAIL (drift caught). Added `export function reviewDriftProbe(): void {}` and ran the check.

Command:

```bash
( npm run contracts:api-surface && git add -AN && git diff --exit-code .agentic/contracts/snapshots/api-surface.txt ); echo "api-surface rc=$?"
```

Output:

```text
+reviewDriftProbe : () => void
api-surface rc=1
```

PASS (b): Editing a field in `src/config.ts` makes `config-schema` FAIL (drift caught). Added `reviewProbe?: string` to `ENLightboxConfig` and ran the check.

Command:

```bash
( npm run contracts:config-schema && git add -AN && git diff --exit-code .agentic/contracts/snapshots/config-schema.txt ); echo "config-schema rc=$?"
```

Output:

```text
+  reviewProbe?: string | undefined
config-schema rc=1
```

PASS: Reverted both drift edits; regenerated snapshots are byte-identical to committed (`git diff --exit-code .agentic/contracts/snapshots/ dist/` → rc=0); `git status --short` clean. Every `git diff` check in `registry.json` is paired with `git add -AN`.

## 4. Snapshot Non-Pollution

PASS: Neither committed snapshot contains the fixture-only `time` member. The fixture's `declare module` augmentation does not leak into the contract.

Command:

```bash
grep -R "time" .agentic/contracts/snapshots/
```

Output:

```text
<no matches>
```

Structural reason confirmed by reading the generators: `generate-config-schema.ts` reads `src/config.ts`'s interface declarations (the base interfaces are empty) and emits type *names* (`TriggersConfigBase`), not expanded merged members; `generate-api-surface.ts` reads `src/index.ts` exports only. The fixture sits in the tsconfig program but cannot pollute either snapshot.

## 5. B1 — config extension seam

PASS: `src/config.ts` has no `unknown`. Four empty extensible base interfaces are declared; `triggers?/theme?/layout?/en?` are typed to them. `config.ts` imports nothing (dependency direction preserved — no feature directory import).

Observed in `src/config.ts`:

```text
export interface TriggersConfigBase {}
export interface ThemeConfigBase {}
export interface LayoutConfigBase {}
export interface ENIntegrationConfigBase {}

export interface ENLightboxConfig {
  ...
  triggers?: TriggersConfigBase
  theme?: ThemeConfigBase
  layout?: LayoutConfigBase
  en?: ENIntegrationConfigBase
}
```

PASS: The fixture `src/fixtures/config-augment.ts` proves a separate module ADDING a member via declaration merging typechecks under strict (`tsc --noEmit` clean). It targets the correct relative specifier `'../config'` and includes a type-level assert that the member resolves.

Observed in `src/fixtures/config-augment.ts`:

```text
import type { ENLightboxConfig } from '../config'
declare module '../config' { interface TriggersConfigBase { time?: number } }
type _AssertAugmentation = Required<ENLightboxConfig>['triggers'] extends { time?: number } ? true : never
const _check: _AssertAugmentation = true
```

PASS: The rejected `unknown`-narrowing form is documented in the PR body (Risk R1) and the broken form is not committed.

## 6. B5 — core a11y/UX additive slice

PASS: Non-empty accessible name when `header` is empty. `src/core/lightbox.ts:169-171` sets `aria-label="Dialog"`; test `src/core/lightbox.a11y.test.ts:48-56` asserts the label is truthy and length > 0.

PASS: Body siblings `inert`/`aria-hidden`/`tabindex` saved and restored EXACTLY, including a sibling that already had them. `isolateBackground` (lines 116-130) saves prior attribute presence/value and sets `inert=''`, `aria-hidden='true'`, `tabindex='-1'`; `restoreBackground` (lines 132-148) removes the attribute when the prior value was `null`, else restores the saved value. Test `:13-30` (clean sibling → set on open, removed on close) and test `:32-46` (sibling with pre-existing `inert=''`, `aria-hidden='false'`, `tabindex='5'` → restored to exactly those values) both pass.

PASS: Body scroll-lock + scroll-position restore on close AND destroy. `lockBackground` (lines 111-114) saves `bodyOverflow` and sets `overflow='hidden'`; `restoreBackground` (lines 132-137) restores overflow and calls `window.scrollTo(scrollX, scrollY)`. `destroy()` (lines 105-109) calls `close()` which calls `restoreBackground`, so scroll is restored on destroy too. Tests `:58-69` (overflow 'auto' restored), `:71-79` (unset overflow restored to ''), `:88-97` (`scrollTo` called with saved position) pass. (jsdom does not implement `window.scrollTo`; tests mock it and assert the call — per the brief's jsdom gotcha.)

PASS: Initial focus on the dialog root, not the close button. `src/core/lightbox.ts:85` calls `this.dialog?.focus()`; the dialog carries `tabindex='-1'` (line 168). Test `:81-86` asserts `document.activeElement === dialog`.

PASS: `destroy()` leaves nothing behind. `destroy()` removes the overlay (via `close()`) and the injected `<style data-enlb>`; test `src/core/lightbox.test.ts:151-160` asserts overlay null, style null, and zero `[class*="enlb-"]` nodes.

## 7. Scope — zero deps, single artifact, no feature dirs

PASS: Zero runtime dependencies. `package.json` has no `dependencies` key; only `devDependencies` (which include `ts-morph`/`tsx` for the dev-only generators — runtime stays zero-dep).

Command:

```bash
node -e "const p=require('./package.json'); console.log('dependencies key:', Object.prototype.hasOwnProperty.call(p,'dependencies')?'present':'absent')"
```

Output:

```text
dependencies key: absent
```

PASS: Single dist artifact, SCSS inlined, no `.css`. `dist/` contains only `en-lightbox.js`. `vite.config.ts` sets `cssCodeSplit:false` and `formats:['iife']`; `lightbox.ts:1` imports the SCSS via `?inline` and injects it through a `<style data-enlb>` element at runtime.

PASS: No feature directories created. `src/` contains only `core/`, `styles/`, `fixtures/`, and root files — no `src/triggers/`, `src/themes/`, or `src/en/` (out of scope per the brief and Decision D8/D9).

PASS: `ownership.json` is unchanged in this PR (no premature carve-outs).

## 8. Ruling on known minor findings

MEDIUM — `tabindex="-1"` on body's direct children doesn't block focusable descendants when `inert` is unsupported: **ACCEPT.** The restore path is correct (prior `tabindex` saved and restored exactly). Layered defense is intact: `inert` (modern browsers block the subtree) + `aria-hidden` (SR) + the in-dialog focus-trap backstop. The author followed the brief's jsdom gotcha (assert attributes, not real focus containment). The residual gap (focusable descendants under a non-`inert`-supporting UA) is owned by the committed cross-browser smoke mini-stream (Decision D3). The `tabindex="-1"` write is additive defense on direct children, not a correctness bug; dropping it would reduce defense. Not blocking.

LOW — ESLint `allowInterfaces:'always'` is project-wide: **ACCEPT.** It over-permits empty interfaces beyond the config seam, but the `config-schema` contract plus design review are the real guards against proliferating empty interfaces. Scoping the rule to `src/config.ts` would be tidier; not blocking.

LOW — `api-surface` hardcodes the global name `ENLightboxAPI` vs parsing `vite.config`: **ACCEPT.** The global name is a frozen durable flag (#1: `window.ENLightboxAPI` is the API global; `window.ENLightbox` is reserved for the page-editor config). A rename would be a deliberate, reviewable change requiring a snapshot bump anyway; the literal matches `vite.config.ts:12` today. Not blocking.

LOW — fixture sits in the generator's TS program: **ACCEPT.** No pollution observed (check 4). The generators read `src/config.ts`'s declared interface members (empty) and emit type names, so the merged `time` member structurally cannot appear. Not blocking.

## 9. Hygiene

PASS: CI is green on the exact head SHA `43e6082` (all four SDD gates).

Command:

```bash
gh pr checks 8
```

Output:

```text
contracts-check      pass  22s
learnings-freshness  pass  7s
spec-coupling        pass  7s
test-coupling        pass  3s
```

PASS: SDD coupling gates reproduce locally.

Command:

```bash
python3 tools/sdd/check_spec_coupling.py --base origin/main && python3 tools/sdd/check_test_coupling.py --base origin/main
```

Output:

```text
spec-coupling OK (16 files checked)
test-coupling OK (3 source files checked, 3 test files changed)
```

PASS: PR body contains `Closes #7`.

PASS: All 7 PR commits are authored AND committed by `fern@ndo.io`; no `Co-Authored-By` trailers in any commit body.

Command:

```bash
git log --pretty='%H%n author: %an <%ae>%n committer: %cn <%ce>%n body: %b%n---' 23261ef..43e6082
```

Output excerpt:

```text
43e6082… author: Fernando Santos <fern@ndo.io> committer: Fernando Santos <fern@ndo.io> body:
52a33fc… author: Fernando Santos <fern@ndo.io> committer: Fernando Santos <fern@ndo.io> body:
d509437… author: Fernando Santos <fern@ndo.io> committer: Fernando Santos <fern@ndo.io> body:
7340578… author: Fernando Santos <fern@ndo.io> committer: Fernando Santos <fern@ndo.io> body:
efde64b… author: Fernando Santos <fern@ndo.io> committer: Fernando Santos <fern@ndo.io> body:
97449f0… author: Fernando Santos <fern@ndo.io> committer: Fernando Santos <fern@ndo.io> body:
9c58e2e… author: Fernando Santos <fern@ndo.io> committer: Fernando Santos <fern@ndo.io> body:
```

PASS: TDD red→green order is visible. Red test commit `9c58e2e` (test(a11y): assert body siblings become inert…) precedes green implementation commit `97449f0` (feat(a11y): accessible-name fallback…).

PASS: The `stream-a.md` "Backfill (stream-b) amendments" note is substantive — it documents the `config.ts` base-interface widening and the `lightbox.ts` B5 a11y/UX slice, and points to `stream-b.md` for detail (satisfies the spec-coupling gotcha for `src/config.ts` and `src/core/lightbox.ts`, which are owned by `stream-a.md`).

PASS: `registry.json` check commands are safe for `shell=True` — no untrusted input, no variable expansion; every `git diff` form is paired with `git add -AN` (reviewed as CI config per Decision D13).

PASS: `LEARNINGS.md` invariants preserved — N/A (none exist yet); `learnings-freshness` gate is green (advisory).

## Final Verdict

APPROVED: every MUST-VERIFY checklist item reproduces — CI green on the exact head `43e6082`; the load-bearing inert-restore mutation reds the named test and reverts clean; all three new contracts (`no-css-emitted`, `api-surface`, `config-schema`) bite on drift and are green on clean source; snapshots are not polluted by the fixture-only `time` member; B1's seam compiles under strict with an additive-augmentation fixture and `config.ts` imports no feature dir; B5's a11y/UX slice is exact-restore, scroll-lock restored on close/destroy, initial focus on the dialog root, and `destroy()` leaves nothing; scope is minimal (zero runtime deps, one inlined-SCSS artifact, no feature dirs); commit identity is `fern@ndo.io` with no `Co-Authored-By`, `Closes #7` is in the body, and TDD red→green order holds. All known minor findings are ACCEPTED with rationale above. Not merged — coordinator merges on owner authorization.

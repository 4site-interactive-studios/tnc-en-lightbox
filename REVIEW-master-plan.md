# Independent Review — PR #5 Master Plan (waves 1–4)

**Reviewer:** Fernando Santos (`fern@ndo.io`)  
**Review branch:** `plan-review-audit`  
**PR head reviewed:** `84f151184a26474aba238014a923ad0caaf43c3f`  
**Ground-truth main head:** `ec9e664cd28ce21dd3b511bcce9867458d4e1943`  
**Date:** 2026-06-25

## Verdict

**BLOCKED**

Specific gaps:
1. **BACKLOG.md is missing the deferred entries the plan claims to have newly logged.** The plan’s *Out of scope* section says it logged revisit triggers for **rich-text body (U16)**, **optional `campaignKey` dismissal scoping (R-N4key)**, and **CTA `submit` action (D5b)**. The actual `.agentic/BACKLOG.md` at the PR head contains only four unrelated entries (cross-session suppression, analytics hooks, A/B testing, video-progress). The revisit triggers are in the plan text, but they are not in the durable backlog as claimed.
2. **Owner-decision inconsistency on secondary/decline CTA (U17).** The owner-decision section and the NFR/use-case matrix both place U17 in **wave-2/stream-a** (Q10). However, the *Out of scope* section still lists it as a **deferred BACKLOG item** with a revisit trigger. A feature that is in-scope for wave-2 cannot simultaneously be a deferred backlog item.

These are fixable documentation/scope-consistency errors; once the BACKLOG is updated and the U17 contradiction is removed, the plan should be re-approved.

---

## Coverage checks

### 1. Every NFR in AGENTS.md / sdd.config.json is in the coverage matrix

**Status: PASS**

The eight NFRs from `AGENTS.md` / `sdd.config.json` are all decomposed into the N1–N18 matrix:

| AGENTS.md NFR | Matrix row(s) | Owner | Verification |
|---|---|---|---|
| Zero runtime dependencies | N1 | wave-0 / ratchet wave-1 | `bundle` + `no-runtime-deps` |
| Single self-contained artifact | N2 | wave-0 / wave-2 | `bundle` + `no-css-emitted` + `dist-single-file` + `no-runtime-fetch` |
| Non-intrusive | N3 / N15 / N16 | wave-0 + B5 + wave-3 | defer test + scroll-lock test + EN form test |
| Session discipline | N4 | wave-1/stream-a | `sessionStorage` key contract + tests |
| Cross-browser | N5 | committed mini-stream | `cross-browser-smoke` Playwright |
| Responsive | N6 / N7 / N8 | wave-2/a | DOM/viewport tests |
| Accessible | N9–N13 / N15 / N17 / N18 | wave-0/a + B5 + wave-2/a | unit tests + `a11y-audit` + `reduced-motion-guard` |
| Performance budget | N14 | wave-0 / wave-1 / wave-2/a | `bundle-size` + thrash tests |

No AGENTS.md NFR is unowned or prose-only.

### 2. Every realistic use-case has an owning stream or explicit deferral with revisit trigger

**Status: PASS — with the U17 contradiction noted above**

| Use-case | Matrix row | Owner / Deferral |
|---|---|---|
| Behavior-triggered overlay (time/scroll/inactivity/exit-intent) | U1–U4 | wave-1/a |
| Image + body + CTA | U7 | wave-0/a (COVERED) |
| Per-campaign customization | U8 | wave-2/b |
| Multiple themes | U9 | wave-2/b |
| EN page targeting | U10 | wave-3/a |
| CTA redirect / close / submit | U11 | wave-3/a; `submit` deferred to D5b |
| Editor usability | U13 | per-wave + wave-3/a |
| “Donate / No thanks” two-action pattern | U17 | wave-2/a (but also incorrectly listed as deferred) |

Other deferred items (video-progress U5, rich-text U16) have revisit triggers.

### 3. Every deferral has a concrete revisit trigger

**Status: FAIL**

The plan text itself supplies revisit triggers for all deferred items, but the durable backlog file does not contain the claimed entries. The actual `.agentic/BACKLOG.md` at `84f1511` only contains:
- cross-session / cross-page dismissal suppression
- analytics / lifecycle hooks
- A/B variant testing
- video-progress trigger

Missing from BACKLOG.md (despite the plan saying they were “newly logged”):
- rich-text body content (U16)
- optional `campaignKey` dismissal scoping (R-N4key)
- CTA `submit` action (D5b)
- secondary/decline CTA (U17) — but this should be removed from deferrals because it is now in wave-2 scope.

---

## Soundness checks

### 4. Contract compiles & is additive (Risk R1)

**Status: PASS**

I ran the exact throwaway `tsc` spike the plan requires.

**Good case (additive base-interface merging):**

```ts
// src/config.ts
export interface TriggersConfigBase {}
export interface ENLightboxConfig {
  header?: string
  triggers?: TriggersConfigBase
}

// src/triggers/triggers.ts
import type { ENLightboxConfig } from '../config'
declare module '../config' {
  interface TriggersConfigBase {
    time?: number
  }
}
const _assert: ENLightboxConfig = { triggers: { time: 5 } }

// src/usage.ts
import type { ENLightboxConfig } from './config'
const cfg: ENLightboxConfig = { triggers: { time: 5 } }
```

Command: `tsc --noEmit --strict --project tsconfig.json` (TypeScript 5.9.3)  
Output: `GOOD_EXIT=0` — compiles cleanly.

**Bad case (`triggers?: unknown` narrowing):**

```ts
// bad-config.ts
export interface ENLightboxConfig {
  triggers?: unknown
}

// bad-augment.ts
import type { ENLightboxConfig } from './bad-config'
declare module './bad-config' {
  interface ENLightboxConfig {
    triggers?: { time?: number }
  }
}
const _assert: ENLightboxConfig = { triggers: { time: 5 } }
```

Command: `tsc --noEmit --strict --project tsconfig.json`  
Output:

```
bad-augment.ts(5,5): error TS2717: Subsequent property declarations must have the same type.  Property 'triggers' must be of type 'unknown', but here has type '{ time?: number | undefined; } | undefined'.
```

The plan’s replacement seam compiles; the rejected `unknown`-narrowing seam does not.

### 5. Backward compatibility and wave-0 flags

**Status: PASS — with a type-level caveat on the B1 backfill**

- **Flag #1:** `vite.config.ts` uses `lib.name: 'ENLightboxAPI'` and IIFE output; the built `dist/en-lightbox.js` starts with `var ENLightboxAPI=...`. The auto-init reads `globalThis.ENLightbox`. Verified against the actual dist artifact.
- **Flag #2:** No `autoOpen` field exists. Auto-init calls `init()` which constructs a `Lightbox` but never calls `open()`.
- **Flag #3:** `vite.config.ts` uses `minify: 'oxc'` (Vite 8 / rolldown). The mac↔linux byte-identical claim is asserted by the plan; I cannot verify Linux output in this environment, but the `bundle` contract will catch a drift against the committed artifact.
- **Flag #4:** `Lightbox` constructor takes `NormalizedConfig`. Wave-0 fields (`header`, `body`, `image`, `cta`, `closeOnOverlay`, `closeOnEsc`, `hideImageOnMobile`) are all retained as optional and defaulted. No wave removes or retypes any of those core fields.

**Caveat:** The B1 backfill retypes the **placeholder** fields `triggers?: unknown` → `triggers?: TriggersConfigBase` and `theme?: unknown` → `theme?: ThemeConfigBase`. This is a wave-0 change to a wave-0 type, and the plan explicitly pre-authorizes it (D2/B1/R1). It does not change runtime behavior for a valid wave-0 config (which omits `triggers`/`theme`), but it is technically a retype of fields already present in the shipped `config.ts`. The plan is internally consistent because it calls this out as a decided exception.

### 6. Four gates, ownership carve-out, and index.ts coupling

**Status: PASS**

- `.github/workflows/sdd-gates.yml` has exactly four jobs: `spec-coupling`, `contracts-check`, `test-coupling`, `learnings-freshness`.
- `sdd.config.json` has `gates.test_coupling.enabled: true`. The other three gates are not in `sdd.config.json` but are enforced by the workflow; the plan correctly identifies the workflow as the source of enforcement.
- Decision D9: ownership carve-outs for `src/triggers/**`, `src/themes/**`, `src/en/**` are scheduled as the first commit of each wave. The current `ownership.json` only has the `src/**` catch-all plus the inert `_planned` note; the plan acknowledges this and has a mechanical fix.
- Decision D8: sub-normalizers live in `src/<bucket>/normalize.ts`, not in `index.ts`. `index.ts` is a thin call-through. This satisfies the anti-laundering requirement.
- Pre-authorized `[no-test]` waivers are enumerated (B1 type-only files, wave-2/a SCSS-only token work, wave-4 release config).

### 7. Sequencing and shared-surface contention

**Status: PASS**

- Merge order is strictly sequential: wave-1/a → wave-2/a → wave-2/b → wave-3/a → wave-4/a, plus the committed cross-browser mini-stream placed with/before wave-2.
- Every stream depends only on earlier streams; no forward dependency exists.
- Each shared surface (`config.ts`, `index.ts`, `dist/`, `enlb:dismiss`, session key, `--enlb-*` tokens, `ENLightboxAPI`) has an explicit contention plan in the *Sequencing & shared-surface plan* section.

### 8. Owner-decision consistency

**Status: FAIL**

- **U17 secondary/decline CTA:** The owner-decision (Q10) and the matrix both place it in **wave-2/stream-a**, but the *Out of scope* section still lists it as a deferred BACKLOG item. This is a direct contradiction.
- **customCss / rich-text / CTA-submit:** All three are consistently deferred. `customCss` ships only after token theming + a security review; rich-text body is deferred (U16); `submit` is deferred unless wave-3 commits the EN-form contract (D5b).
- **B1–B5 wave-0 backfill:** Coherent and explicitly sequenced before wave-1.
- **Cross-browser as committed mini-stream:** Correctly placed as a committed stream (D3), not optional wave-4.

### 9. Ground-truth spot-check

**Status: PASS**

| Claim | Evidence |
|---|---|
| ~4965 B raw / 1809 B gzip baseline | `wc -c dist/en-lightbox.js` = 4965; `gzip -c dist/en-lightbox.js \| wc -c` = 1809. |
| 4 CI gates | `.github/workflows/sdd-gates.yml` has four jobs. |
| `ENLightboxAPI` global | `vite.config.ts` `lib.name: 'ENLightboxAPI'`; dist starts with `var ENLightboxAPI=(...`. |
| Auto-init instantiates but does not open | `src/index.ts` auto-init calls `init(cfg)` only; `init()` constructs but never calls `open()`. |
| `dist` single file | `ls dist/` = `en-lightbox.js` only. |
| No runtime deps | `package.json` has only `devDependencies`. |
| No separate CSS emitted | `dist/` contains only `en-lightbox.js`; CSS is inlined. |

---

## Additional angles the internal critics may have missed

1. **BACKLOG / owner-decision consistency.** The 6 internal critics appear to have missed that the plan text and the durable backlog file disagree, and that U17 is simultaneously in-scope and deferred. This is the only blocking finding.
2. **sdd.config.json gate completeness.** Only `test_coupling` is represented in `sdd.config.json`. The other three gates are enforced only in the workflow file. The plan is honest about this, but it is worth codifying all four gates in `sdd.config.json` if that file is intended to be the canonical gate registry.
3. **Cross-platform byte-identical bundle.** The plan asserts oxc/rolldown produces byte-identical output mac↔linux, but there is no dedicated contract to prove it across platforms. The existing `bundle` contract only checks the committed artifact against the current build on the CI runner (Ubuntu). If the committed dist is generated on macOS and CI regenerates on Linux, a diff would fail the contract; this effectively forces the dist to be regenerated in CI, but the plan does not explicitly say that.
4. **CSP / inline styles.** The library injects a `<style data-enlb>` block. A strict `style-src` CSP on a host EN page could block this. This is not currently in the NFRs or plan; it may be a future risk to record.

---

## Required fixes before approval

1. Update `.agentic/BACKLOG.md` to include the deferred items the plan claims are logged: rich-text body (U16), optional `campaignKey` dismissal scoping (R-N4key), and CTA `submit` action (D5b), each with the documented revisit trigger.
2. Remove **secondary/decline CTA (U17)** from the *Out of scope* / deferred list because it is now in wave-2/stream-a per owner decision Q10.
3. (Optional) Consider adding `spec-coupling`, `contracts-check`, and `learnings-freshness` to `sdd.config.json` if that file is meant to be the canonical gate list.

After the above, re-run this review focusing on the changed files only.

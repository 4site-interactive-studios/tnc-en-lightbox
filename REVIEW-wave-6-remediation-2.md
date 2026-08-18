# REVIEW — wave-6/remediation-2 — real EN page support (dotted names, form detection, any-type fill)

- **Stream:** wave-6/remediation-2 (post-wave defect fix, issue #69) — PR #70, Refs #55
- **Reviewed tree:** exact detached snapshot at commit `9a3541b` (branch `feat/wave-6-remediation-2`, base `b5ebab7`), fleet tree digest `00fbf07d4a5fede787d8a1a646eea9d2dcee83303dd4bc0605daf95ed0498162` (140 files)
- **Author lane:** coding-fallback (authoritative fb3 pass; earlier "failures" were a since-fixed OpenCode transport bug — children completed server-side; coder report transport-lost, so THE TREE WAS THE CLAIM)
- **Reviewer lane:** reviewer-medium (independent; re-established all evidence from scratch)
- **Review rounds:** 0 (first-pass approval)
- **Fallbacks this stream:** stream-lead → orchestrator-flat-mode; coding-medium → coding-fallback (both triggered by the false transport failures; disclosed at the merge gate)

## Verdict (verbatim findings)

```
VERDICT: APPROVED
FINDINGS:
- id: F-rem2-1 | severity: minor | claim: e2e legacy-fallback coverage mutates the live form's class/attribute at runtime instead of a static legacy-only fixture | evidence: e2e/reference-field.spec.ts:72-75 — spec item 5 explicitly allowed "a spec case (or tiny extra fixture)"; unit-level static coverage also exists at src/en/reference-field.test.ts:341-349
- id: F-rem2-2 | severity: minor | claim: dotted names containing blocklisted words as non-exact segments (e.g. supporter.action, supporter.submit) remain accepted by design | evidence: src/en/config.ts:24 (full-name blocklist only) + acceptance test src/en/reference-field.test.ts:126-127 — conforms to fix contract item 1
ATTEST: dir=/Users/fernando/sites/.worktrees/tnc-en-lightbox/wave-6-rem2-review head=9a3541b8e034ab5d6583d2f0ad199dc6c4ab183c
```

## Evidence independently established by the reviewer

- Validation (`config.ts:13,19,21-27`): five real EN names accepted (digit-only segments incl.); 69-case probe beyond unit tests — case-insensitive proto segments (`supporter.Constructor`, `SUPPORTER.__PROTO__`), nested (`supporter.__proto__.x`, `a.b.constructor.c`), full-width/homoglyph dots, JSON-smuggled `__proto__`, Symbol/throwing-toString: all rejected, never threw; lookalike substrings correctly accepted.
- Detection & write (`reference-field.ts:17-18,87-89,107-118`): page-builder class primary + legacy fallback, first-match; any-type first-in-DOM-order reuse with `.value`-only writes (attribute-forcing removed); absent → hidden non-required; `enlb:field-write` on write and replay; remediation-1 DOMContentLoaded deferral intact.
- Fixtures faithful to captured real-page markup; `id="en-form"` kept; no `data-en-component` on primary forms; legacy coverage at unit (`test:341`) and e2e (`spec:63`).
- Suite: 303/303 unit; typecheck/lint clean; build deterministic (rebuild reproduced committed dist); snapshots byte-identical; gzip 7286B/7400B; full e2e 306 pass / 0 fail / 0 flaky / 18 intentional skips × 4 browsers.
- Mutations: dotted-branch removal → `reference-field.test.ts:119` red; legacy-only detection → `test:336` + e2e `spec:57` red (mutated dist); both restored byte-exact, tree proven clean.
- Scope: exactly 14 allowed files; locked paths + analytics.spec.ts + budgets.json all 0-line diffs; `smoke.spec.ts` 9-line diff = fixture-forced selector renames only.

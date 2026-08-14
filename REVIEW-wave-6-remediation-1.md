# REVIEW — wave-6/remediation-1 — carry-over replay readiness + journey coverage completion

- **Stream:** wave-6/remediation-1 (wave-exit remediation for reviewer-wave findings F-wave6-1, F-wave6-2) — PR #67, Refs #55 (no per-stream issue)
- **Reviewed tree:** branch `feat/wave-6-remediation-1`, worktree HEAD `93219cf` (uncommitted working tree), fleet tree digest `3930bb6e2bf301988e260d55462783add9d90b7170c075eb463ef71de2a74284` (140 files); committed afterward as `377215f`
- **Author lane:** coding-medium (triage: medium, not security-critical)
- **Reviewer lane:** reviewer-medium (independent; did not write the code)
- **Review rounds:** 0 (first-pass approval)
- **Fallbacks:** none

## Verdict

```
VERDICT: APPROVED
FINDINGS:
- none
ATTEST: dir=/Users/fernando/sites/.worktrees/tnc-en-lightbox/wave-6-remediation-1 head=93219cfc0cee1ae0fcd782b0e8d7e637db219ad3
```

## Wave findings closed

- **F-wave6-1** (replay before DOM readiness): fix confined to `src/en/reference-field.ts:63-81` — `replayPending` defers once to `DOMContentLoaded` (`{once:true}`, guarded, never-throw) when `readyState === 'loading'`; re-enters `replayPending()` at readiness (last-write-wins via storage re-read); pending retained when no form at readiness. Base race independently traced through locked `index.ts:100-122` → `init()` → `installReferenceFieldListeners` → synchronous replay. RED reproduction: new head-embed e2e failed in all 4 browsers against the unfixed bundle (`#en-form input[name="en_txn3"]` count 0 after 5s).
- **F-wave6-2** (journey coverage): `e2e/reference-field.spec.ts:100-151` joint same-interaction assertions (accept ⇒ exactly one `lightbox_click` + `lightbox_accepted`; ESC/close-button/overlay ⇒ zero utag calls + `lightbox_declined`, impression isolated via post-open stub clear); `e2e/debug.spec.ts:91-146` replay diagnostics on a real `carry-over-head.html?debug=log` destination + silent e2e negatives (`debug=false`, `debug=1`, malformed `%E0%A4%A`) with `messages === []`.

## Claims reproduced by the reviewer

- Full suite: 267 unit; full e2e 302 pass / 18 expected skips; targeted reference-field 52/52 (executor's 53 was a miscount — direct run confirmed 52), debug 28/28.
- Mutation-verify reproduced: `reference-field.ts:66` `'loading'` → `'complete'` → named deferral test red at `reference-field.test.ts:266` → exact-bytes restore → green; tree clean.
- Scope: whitelist-only diff; locked files (index.ts, core, analytics, debug, config, en/config, snapshots, harness/helpers/utag-stub) untouched; snapshots byte-identical; gzip 7239B / 7400B (budgets.json unchanged).
- Docs verified truthful against source (`savePending` only after successful origin write; head placement works via deferral).
- Security: no new injection surface — only the pre-existing `isSafeReferenceFieldName` allowlist path, unchanged.

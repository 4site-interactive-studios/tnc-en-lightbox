# tools/sdd — the SDD freshness gates

Portable, stack-agnostic gate scripts (Python for broad availability — port if your project
standardizes elsewhere; the logic is the point, not the language).

- `check_spec_coupling.py` — the **specs-must-change-with-src** gate. Reads `.agentic/ownership.json`;
  a PR changing governed source must also change its owning spec, or carry the `[no-spec: <reason>]`
  waiver with a reason.
- `check_contracts.py` — the **contracts-check** gate. Runs each `check` command in
  `.agentic/contracts/registry.json`; fails on artifact-vs-source drift. (300s timeout per contract,
  a timed-out check fails the gate; warns if a check uses `git diff` without `git add -AN`.)
- `check_test_coupling.py` — the **test-must-change-with-src** gate. A PR changing source must also
  change a test, or carry the `[no-test: <reason>]` waiver with a reason.
- `check_learnings_freshness.py` — the **LEARNINGS.md freshness** signal. Advisory (never blocks);
  warns when `LEARNINGS.md` has gone dormant while source is actively changing.

Run locally:

    python3 tools/sdd/check_spec_coupling.py --base main
    python3 tools/sdd/check_contracts.py
    python3 tools/sdd/check_test_coupling.py --base main
    python3 tools/sdd/check_learnings_freshness.py --base main

Known limitation: the spec-coupling gate only fires when *source* changes; stale narrative prose in a
spec (no source change) won't trip it. Keep status lines minimal and true them up by hand.

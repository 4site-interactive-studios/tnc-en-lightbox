#!/usr/bin/env python3
"""
check_contracts.py — the contracts-check gate.

Runs each contract's `check` command from .agentic/contracts/registry.json and fails if any
committed artifact has drifted from its source of truth. A contract with no check command is a
*promise*, not a gate, and is reported as such. See references/enforcement.md (note the
staged-diff form `generate && git add -AN && git diff --exit-code` to catch newly-emitted files).

SECURITY: check commands run with shell=True from registry.json. Treat registry.json changes with
the same scrutiny as CI config — a malicious check command executes in the CI environment. A 300s
timeout is enforced and a timed-out check fails the gate. Do not commit registry.json entries with
untrusted input.

Usage: python3 tools/sdd/check_contracts.py [--registry .agentic/contracts/registry.json]
Exit 0 = all pass (or only promises), 1 = a check failed or timed out, 2 = config error.
"""
import argparse, json, os, subprocess, sys

CONTRACT_TIMEOUT = 300  # seconds

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", default=".agentic/contracts/registry.json")
    args = ap.parse_args()

    if not os.path.exists(args.registry):
        print("ERROR: no registry.json at", args.registry, file=sys.stderr); sys.exit(2)
    try:
        with open(args.registry) as f:
            contracts = json.load(f).get("contracts", [])
    except (json.JSONDecodeError, OSError) as e:
        print("ERROR: malformed registry.json:", e, file=sys.stderr); sys.exit(2)
    if not contracts:
        print("registry has no contracts yet - gate is a no-op"); sys.exit(0)

    failed, promises, timeouts = [], [], []
    for c in contracts:
        name, check = c.get("name", "?"), c.get("check", "").strip()
        if not check:
            promises.append(name); print("PROMISE   {} (no check command)".format(name)); continue
        # Warn about the deletion-blindness gotcha: a naive `generate && git diff --exit-code`
        # misses newly-emitted untracked files. The robust form stages first:
        #   generate && git add -AN && git diff --exit-code
        if "git add" not in check and "git diff" in check:
            print("WARNING   {} - check uses `git diff` without `git add -AN`;".format(name))
            print("            newly-emitted untracked files will be missed. Use:")
            print("            generate && git add -AN && git diff --exit-code")
        try:
            r = subprocess.run(check, shell=True, timeout=CONTRACT_TIMEOUT, cwd=os.getcwd())
        except subprocess.TimeoutExpired:
            timeouts.append(name); print("TIMEOUT   {} (`{}` exceeded {}s)".format(name, check, CONTRACT_TIMEOUT)); continue
        if r.returncode != 0:
            failed.append(name); print("FAIL      {} (`{}`)".format(name, check))
        else:
            print("OK        {}".format(name))

    if promises:
        print("\n{} contract(s) have no check command - they are promises, not gates.".format(len(promises)))
    if timeouts:
        print("\n{} contract(s) timed out ({}s limit) - treated as failures.".format(len(timeouts), CONTRACT_TIMEOUT))
    if failed or timeouts:
        if failed:
            print("\nCONTRACT DRIFT:", ", ".join(failed))
        if timeouts:
            print("CONTRACT TIMEOUT:", ", ".join(timeouts))
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()

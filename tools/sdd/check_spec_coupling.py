#!/usr/bin/env python3
"""
check_spec_coupling.py — the specs-must-change-with-src gate.

A PR that changes governed source must also change that source's owning spec, or carry the waiver
token with a reason in a commit message / PR body. The waiver format is [no-spec: <reason>] — a bare
[no-spec] without a reason is NOT accepted. Mapping lives in .agentic/ownership.json (longest-glob
match wins). See references/enforcement.md for the rationale and known limitations.

Usage:
    python3 tools/sdd/check_spec_coupling.py --base <base-ref> [--description-file <file>]
Exit 0 = pass, 1 = violation, 2 = config/usage error.
"""
import argparse, json, os, re, subprocess, sys

def glob_to_re(glob):
    # ** matches across slashes (including zero segments); * matches within a path segment.
    out, i = "", 0
    while i < len(glob):
        if glob[i:i+2] == "**":
            if i + 2 < len(glob) and glob[i+2] == "/":
                out += "(?:.*/)?"; i += 3  # **/ matches zero or more dirs
            else:
                out += ".*"; i += 2        # ** at end matches anything
        elif glob[i] == "*":
            out += "[^/]*"; i += 1
        else:
            out += re.escape(glob[i]); i += 1
    return re.compile("^" + out + "$")

def changed_files(base):
    rng = base + "...HEAD"
    out = subprocess.run(["git", "diff", "--name-only", rng],
                         capture_output=True, text=True)
    if out.returncode != 0:
        # fall back to two-dot if merge-base form fails (e.g. shallow checkout)
        out = subprocess.run(["git", "diff", "--name-only", base, "HEAD"],
                             capture_output=True, text=True)
    return [f for f in out.stdout.splitlines() if f.strip()]

def waiver_present(base, desc_file):
    # Waiver must include a non-blank reason: [no-spec: <reason>] (whitespace-only is rejected).
    waiver_re = re.compile(r'\[no-spec\s*:\s*[^\]\s][^\]]*\]')
    if desc_file and os.path.exists(desc_file):
        with open(desc_file) as f:
            if waiver_re.search(f.read()):
                return True
    log = subprocess.run(["git", "log", base + "..HEAD", "--format=%B"],
                         capture_output=True, text=True)
    if waiver_re.search(log.stdout):
        return True
    return bool(waiver_re.search(os.environ.get("PR_BODY", "")))

def spec_in_diff(spec, files):
    # Check if the owning spec (file or directory) appears in the diff.
    spec_norm = spec.rstrip("/")
    for f in files:
        if f == spec or f.startswith(spec_norm + "/"):
            return True
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--description-file", default="")
    ap.add_argument("--ownership", default=".agentic/ownership.json")
    args = ap.parse_args()

    if not os.path.exists(args.ownership):
        print("no ownership.json found at", args.ownership, "- gate is a no-op"); sys.exit(0)
    try:
        with open(args.ownership) as f:
            cfg = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print("ERROR: malformed ownership.json:", e, file=sys.stderr); sys.exit(2)
    rules = cfg.get("rules", {})
    exemptions = [glob_to_re(g) for g in cfg.get("exemptions", [])]
    token = cfg.get("waiver_token", "[no-spec: <reason>]")

    if not rules:
        print("ownership.json has no rules yet - gate is a no-op (seed buckets as the tree grows)")
        sys.exit(0)

    files = changed_files(args.base)
    rule_res = sorted(((glob_to_re(g), g, spec) for g, spec in rules.items()),
                      key=lambda t: len(t[1]), reverse=True)  # longest glob first
    violations = []
    for f in files:
        if any(rx.match(f) for rx in exemptions):
            continue
        for rx, glob, spec in rule_res:
            if rx.match(f):
                if not spec_in_diff(spec, files):
                    violations.append((f, glob, spec))
                break  # longest match wins; stop at first

    if violations and not waiver_present(args.base, args.description_file):
        print("SPEC-COUPLING VIOLATION - governed source changed without its owning spec:")
        for f, glob, spec in violations:
            print("  {} (bucket {}) -> must also change {}".format(f, glob, spec))
        print("\nFix: update the owning spec, or add the waiver token with a reason:")
        print("  [no-spec: <your reason here>]")
        print("to a commit message / PR body. A bare [no-spec] without a reason is NOT accepted.")
        sys.exit(1)
    print("spec-coupling OK ({} files checked)".format(len(files)))
    sys.exit(0)

if __name__ == "__main__":
    main()

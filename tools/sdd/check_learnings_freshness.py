#!/usr/bin/env python3
"""
check_learnings_freshness.py — the LEARNINGS.md freshness signal.

Warns (exit 0 always — advisory, never blocks a PR) when LEARNINGS.md has gone dormant: many
commits have landed since the last change to .agentic/LEARNINGS.md. This surfaces the silent rot
the canon warns about: technical invariants that should have been captured but weren't.

Usage:
    python3 tools/sdd/check_learnings_freshness.py [--base <base-ref>] [--threshold 20] [--learnings <path>]
Exit 0 always (advisory). Prints a WARNING if stale.
"""
import argparse, os, subprocess, sys

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="main")
    ap.add_argument("--threshold", type=int, default=20)
    ap.add_argument("--learnings", default=".agentic/LEARNINGS.md")
    args = ap.parse_args()

    if not os.path.exists(args.learnings):
        print("WARNING: {} does not exist. ".format(args.learnings) +
              "Create it and add invariants/gotchas as the project earns them.")
        sys.exit(0)

    # Find the last commit that touched LEARNINGS.md
    out = subprocess.run(
        ["git", "log", "-1", "--format=%H", "--", args.learnings],
        capture_output=True, text=True)
    last_learnings_commit = out.stdout.strip()

    if not last_learnings_commit:
        print("WARNING: {} has never been committed. ".format(args.learnings) +
              "Add invariants/gotchas as the project earns them.")
        sys.exit(0)

    # Count commits since that commit
    out = subprocess.run(
        ["git", "rev-list", "--count", last_learnings_commit + "..HEAD"],
        capture_output=True, text=True)
    try:
        count = int(out.stdout.strip())
    except ValueError:
        print("WARNING: could not determine commit count since last LEARNINGS.md update.")
        sys.exit(0)

    if count > args.threshold:
        print("WARNING: {} has not been updated in {} commits ".format(args.learnings, count) +
              "(threshold: {}). Source changes may be landing without captured lessons. ".format(args.threshold) +
              "Review recent PRs' 'What was hard / non-obvious' sections and promote any "
              "load-bearing lessons into LEARNINGS.md via a reviewed PR.")
        sys.exit(0)

    print("learnings freshness OK ({} commits since last update, threshold {})".format(
        count, args.threshold))
    sys.exit(0)

if __name__ == "__main__":
    main()

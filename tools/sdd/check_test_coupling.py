#!/usr/bin/env python3
"""
check_test_coupling.py — the test-must-change-with-src gate.

A PR that changes source under a governed directory must also change a test file, or carry the
waiver token with a reason: [no-test: <reason>]. This enforces the TDD cardinal rule at the CI level.
A bare [no-test] without a reason is NOT accepted.

Usage:
    python3 tools/sdd/check_test_coupling.py --base <base-ref> [--description-file <file>] [--src-dirs <csv>]
Exit 0 = pass, 1 = violation, 2 = config/usage error.
"""
import argparse, os, re, subprocess, sys

TEST_PATTERNS = [
    r'test_.*\.py$', r'.*_test\.py$', r'.*\.test\..*', r'.*\.spec\..*',
    r'.*_test\.go$', r'.*_test\.rs$', r'.*Test\.java$', r'.*Test\.kt$',
    r'.*Tests\.java$', r'.*Tests\.kt$', r'.*Spec\.java$', r'.*Spec\.kt$',
    r'.*_test\.rb$', r'.*_spec\.rb$', r'.*_test\.c(?:pp|xx|c)?$',
    r'.*Tests\.swift$', r'.*Spec\.swift$', r'.*Test\.php$', r'.*Tests\.php$',
]
TEST_RES = [re.compile(p) for p in TEST_PATTERNS]

def changed_files(base):
    rng = base + "...HEAD"
    out = subprocess.run(["git", "diff", "--name-only", rng],
                         capture_output=True, text=True)
    if out.returncode != 0:
        out = subprocess.run(["git", "diff", "--name-only", base, "HEAD"],
                             capture_output=True, text=True)
    return [f for f in out.stdout.splitlines() if f.strip()]

def is_test_file(path):
    return any(rx.search(path) for rx in TEST_RES)

def is_source_file(path, src_dirs):
    return any(path.startswith(d) for d in src_dirs)

def waiver_present(base, desc_file):
    waiver_re = re.compile(r'\[no-test\s*:\s*[^\]\s][^\]]*\]')
    if desc_file and os.path.exists(desc_file):
        with open(desc_file) as f:
            if waiver_re.search(f.read()):
                return True
    log = subprocess.run(["git", "log", base + "..HEAD", "--format=%B"],
                         capture_output=True, text=True)
    if waiver_re.search(log.stdout):
        return True
    return bool(waiver_re.search(os.environ.get("PR_BODY", "")))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--description-file", default="")
    ap.add_argument("--src-dirs", default="src/,lib/,app/,cmd/,internal/,pkg/")
    args = ap.parse_args()

    src_dirs = [d.strip() for d in args.src_dirs.split(",") if d.strip()]
    files = changed_files(args.base)

    src_changed = [f for f in files if is_source_file(f, src_dirs) and not is_test_file(f)]
    test_changed = any(is_test_file(f) for f in files)

    if src_changed and not test_changed:
        if not waiver_present(args.base, args.description_file):
            print("TEST-COUPLING VIOLATION - source changed without any test changes:")
            for f in src_changed:
                print("  {}".format(f))
            print("\nFix: add or update a test for the changed source, or add the waiver token")
            print("with a reason: [no-test: <your reason here>]")
            print("to a commit message / PR body. A bare [no-test] without a reason is NOT accepted.")
            sys.exit(1)

    test_count = sum(1 for f in files if is_test_file(f))
    print("test-coupling OK ({} source files checked, {} test files changed)".format(
        len(src_changed), test_count))
    sys.exit(0)

if __name__ == "__main__":
    main()

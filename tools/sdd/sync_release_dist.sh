#!/usr/bin/env bash
# sync_release_dist.sh — rebuild committed dist on a release-please PR branch
#
# Purpose: release-please bumps package.json but does NOT rebuild dist/en-lightbox.js,
# so the committed dist's version banner lags after a version bump.  This script
# rebuilds dist and, if the banner changed, commits + pushes to the release PR branch.
#
# WHY (issue #53): After release-please bumps package.json via API, the committed
# dist/en-lightbox.js still carries the old version banner.  The release-qa job
# uploads a fresh asset to the GitHub Release but never commits it back to main.
# This script closes that gap by committing the rebuilt dist to the release PR
# branch so the merged result is consistent.
#
# Modes:
#   --check / --dry-run : build dist, report drift (exit 1 if drift found), NEVER commit/push
#   (default / --push)  : build dist, commit if changed, push to the release PR branch
#
# Usage:
#   tools/sdd/sync_release_dist.sh --check            # local drift detection
#   tools/sdd/sync_release_dist.sh --push --expected-branch release-please--main  # CI mode
#   tools/sdd/sync_release_dist.sh                     # same as --push (CI default)

set -euo pipefail

MODE="push"
EXPECTED_BRANCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check|--dry-run)
      MODE="check"
      shift
      ;;
    --push)
      MODE="push"
      shift
      ;;
    --expected-branch)
      EXPECTED_BRANCH="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# ── branch-name validation (defense-in-depth against refspec injection) ────────
# A branch name like "+main" would pass a literal != "main" check but is parsed
# by git as a force-push refspec ("+main" ⇒ force-push local main to remote main).
# Similarly, names starting with "-" could be misinterpreted as options, and
# characters like :, ~, ^, ?, *, [, \, or ".." have special meaning in git refs
# or refspecs.  We enforce a strict allowlist AND reject forbidden leading chars.
# This validation runs in BOTH modes (--check and --push) so misuse is caught early.
validate_branch_name() {
  local name="$1"
  local label="$2"

  if [[ -z "$name" ]]; then
    echo "::error::$label: branch name is empty" >&2
    exit 1
  fi

  # Reject leading + or - (refspec force / option injection)
  if [[ "$name" == +* || "$name" == -* ]]; then
    echo "::error::$label: branch name '$name' starts with '${name:0:1}' — could be misinterpreted as a refspec modifier or option" >&2
    exit 1
  fi

  # Strict allowlist: alphanumeric, dots, underscores, slashes, hyphens only
  # This implicitly rejects :, ~, ^, ?, *, [, \, whitespace, and any other
  # character that has special meaning in git refs or refspecs.
  if [[ ! "$name" =~ ^[A-Za-z0-9._/-]+$ ]]; then
    echo "::error::$label: branch name '$name' contains invalid characters (only A-Za-z0-9._/- allowed)" >&2
    exit 1
  fi

  # Reject consecutive dots (could form ".." range syntax)
  if [[ "$name" == *".."* ]]; then
    echo "::error::$label: branch name '$name' contains '..' — could be misinterpreted as a ref range" >&2
    exit 1
  fi

  # Reject exact matches for forbidden branch names
  if [[ "$name" == "main" || "$name" == "HEAD" ]]; then
    echo "::error::$label: refusing to operate on '$name' — dist sync targets release PR branches only" >&2
    exit 1
  fi
}

# ── branch safety checks (both modes) ──────────────────────────────────────────
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Validate the current branch name
validate_branch_name "$CURRENT_BRANCH" "current branch"

# In push mode, --expected-branch is REQUIRED and must match exactly
if [[ "$MODE" == "push" ]]; then
  if [[ -z "$EXPECTED_BRANCH" ]]; then
    echo "::error::--expected-branch is required in push mode" >&2
    exit 1
  fi
  # Validate the expected branch name too (defense-in-depth)
  validate_branch_name "$EXPECTED_BRANCH" "expected branch"
  if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
    echo "::error::branch mismatch: on '$CURRENT_BRANCH', expected '$EXPECTED_BRANCH'" >&2
    exit 1
  fi
elif [[ -n "$EXPECTED_BRANCH" ]]; then
  # In check mode, --expected-branch is optional but if given, validate and match
  validate_branch_name "$EXPECTED_BRANCH" "expected branch"
  if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
    echo "::error::branch mismatch: on '$CURRENT_BRANCH', expected '$EXPECTED_BRANCH'" >&2
    exit 1
  fi
fi

# ── build ──────────────────────────────────────────────────────────────────────
echo "sync_release_dist: building dist (mode=$MODE)…"
npm run build --silent

# ── detect drift ───────────────────────────────────────────────────────────────
if git diff --quiet -- dist/; then
  echo "sync_release_dist: dist is up-to-date — no changes."
  exit 0
fi

echo "sync_release_dist: dist has changed after rebuild."

if [[ "$MODE" == "check" ]]; then
  echo "::error::dist drift detected — run 'npm run build' and commit the result" >&2
  exit 1
fi

# ── push mode: commit + push ──────────────────────────────────────────────────
git add dist/en-lightbox.js
git commit -m "chore: rebuild dist banner for release"
echo "sync_release_dist: committed rebuilt dist."

# Push using an explicit, fully-qualified, non-force refspec.
# Never use bare `git push origin "$CURRENT_BRANCH"` — a name like "+main" would
# be parsed as a force-push refspec.  The explicit refs/heads/ form ensures git
# treats the argument as a branch name, not a refspec modifier.
echo "sync_release_dist: pushing to '$CURRENT_BRANCH'…"
git push origin "refs/heads/${CURRENT_BRANCH}:refs/heads/${CURRENT_BRANCH}"
echo "sync_release_dist: pushed."

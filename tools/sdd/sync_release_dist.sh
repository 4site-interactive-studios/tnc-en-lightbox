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

# ── branch safety checks (both modes) ──────────────────────────────────────────
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$CURRENT_BRANCH" == "HEAD" ]]; then
  echo "::error::refusing to operate on a detached HEAD" >&2
  exit 1
fi

if [[ "$CURRENT_BRANCH" == "main" ]]; then
  echo "::error::refusing to operate on main — dist sync targets release PR branches only" >&2
  exit 1
fi

if [[ -n "$EXPECTED_BRANCH" && "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
  echo "::error::branch mismatch: on '$CURRENT_BRANCH', expected '$EXPECTED_BRANCH'" >&2
  exit 1
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

# Push to the current branch (already validated it is NOT main)
echo "sync_release_dist: pushing to '$CURRENT_BRANCH'…"
git push origin "$CURRENT_BRANCH"
echo "sync_release_dist: pushed."

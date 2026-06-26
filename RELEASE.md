# Release runbook

## Overview

Releases use [release-please](https://github.com/googleapis/release-please) to automate version bumps, changelog generation, and GitHub Release creation. No npm publish — distribution is the GitHub Release + manual EN upload.

## Release workflow

### 1. Merge into `main`

When a feature branch is merged to `main`, release-please evaluates whether a release is needed (based on conventional commits since the last release). If yes, it opens or updates a **release PR** that proposes the next version and a draft changelog.

### 2. Review the release PR

Check that the proposed version is consistent with the changes and that the changelog accurately reflects what shipped. An already-released version in the proposal means the scope is stale.

### 3. Merge the release PR

Use a **merge commit** (`gh pr merge --merge`) — never squash. Merge triggers:
1. A new git tag (e.g. `v1.0.1`).
2. A **GitHub Release** with `dist/en-lightbox.js` attached.
3. A **release-time QA job** that re-runs build, cross-browser smoke, and a11y checks on the tagged ref.

### 4. Download and upload to EN

1. Go to **https://github.com/4site-interactive-studios/tnc-en-lightbox/releases/latest**.
2. Download `dist/en-lightbox.js` from the release assets.
3. Upload the file to the **Engaging Networks asset library**.
4. Note the EN-hosted URL.

### 5. Update embeds

Update every page that embeds the lightbox:
- Replace the script `src` with the new EN-hosted URL.
- Add or update the `?v=VER` cache-busting query parameter (e.g. `?v=1.0.1`).
- If the EN asset library supports versioned filenames, upload as `en-lightbox-v1.0.1.js` instead.

## Emergency rollback

1. Revert the triggering PR.
2. Manually run `git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z` if the tag was already pushed.
3. Upload the previous release's `dist/en-lightbox.js` to the EN asset library.
4. Point embeds back to the previous URL or version.

## CI checks

Before a release, confirm:
- CI green on the release PR (`ci.yml` typecheck + lint + test; `cross-browser.yml` smoke).
- SDD gates green (`sdd-gates.yml` spec coupling, contracts, test coupling).
- `npm run build` succeeds.
- `gzip -c dist/en-lightbox.js | wc -c` ≤ 5200 (budget).

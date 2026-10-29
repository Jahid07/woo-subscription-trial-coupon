# Release process

WordPress.org SVN is the distribution repository. This GitHub repository is the development source after the recovered baseline is reviewed.

## Current state

- Imported published version: 2.0.1.
- The native SVN publisher is configured for future published stable GitHub releases; preparation and merges do not publish.
- Source version 2.0.3 is merged; it has no release tag yet. GitHub 2.0.2 already exists; WordPress.org has not been updated by this work.
- Manual preview workflows stay read-only. The separate release-published workflow can commit to SVN only after its release guards pass.
- Existing Plugin Check and coding-standard findings are technical debt, not a clean certification.

## Manual WordPress.org deployment preview

Open **Actions > WordPress.org deployment preview > Run workflow**, selecting `master`. This builds the production package, reads public WordPress.org SVN, and prepares local trunk, tag, and image changes. Download the `wordpress-org-preview` artifact to review `status.txt`, `changes.diff`, and `summary.md`.

This workflow uses native SVN commands, with no third-party deployment action, no SVN credentials, and no publish command. It runs manually on this repository's `master` branch only, with a read-only GitHub token and pinned GitHub actions. It does not run the browser suite or prove the saved SVN password has write access.

Store listing images in `.wordpress-org/`; they map to the top-level SVN `assets/` folder. Until that folder exists in Git, the preview retains existing WordPress.org listing images. Plugin runtime assets remain inside the production package. Existing version tags are refused rather than overwritten.

## Prepare a future release

1. Open a pull request with the change and its regression tests.
2. Increment the plugin header, internal version constant, readme Stable tag, and changelog. Keep package.json in sync with the plugin version.
3. Run syntax, coding-standard checks, PHPUnit, and browser tests. Record exact integration versions; a skipped premium test is unverified coverage.
4. For subscription/checkout changes, obtain the needed WooCommerce Subscriptions test coverage before a stable release. Invite staging testers through a GitHub prerelease.
5. Build the ZIP with `npm run build` and test installation and upgrade from the previous WordPress.org release using the built package. Check retained settings and migrations.
6. Review Plugin Check findings and compatibility metadata. Fix release-blocking problems before publishing.
7. Create a numeric Git tag and GitHub release for the reviewed commit after approval. Never reuse an existing release tag for changed code.

## What triggers publication

**Publishing a new stable GitHub release is the publish action.** On GitHub, open Releases > Draft a new release, create a numeric tag such as `2.0.3` from `master`, leave prerelease unchecked, and click **Publish release** when authorized. That release commit must contain the publisher and `wordpressOrgDeploymentEnabled: true`, and its plugin/header/internal/npm/readme versions must match the tag.

Merging a PR, pushing a tag alone, saving a draft, publishing a prerelease, or running the manual preview does not publish to WordPress.org. Installing this workflow does not replay the existing GitHub 2.0.2 release. No 2.0.3 tag or release is created by setup.

The workflow uses GitHub-owned actions pinned to commits and native SVN. It requires the release commit to be part of `master`, refuses existing or newer WordPress.org tags, builds only production files, and synchronizes `.wordpress-org/` images to SVN `assets/`. It commits trunk, the new tag, and listing images together. The SVN password is provided through stdin only to the commit process; it is not included in command arguments or the build/preparation environment.

The `wordpress-org` GitHub environment permits tag deployments only. Existing repository secrets `SVN_USERNAME` and `SVN_PASSWORD` are used only in the publisher step. No extra GitHub approval is required beyond deliberately publishing the stable release. Only trusted maintainers should be allowed to change workflows or publish releases. To stop future runs, disable **Publish to WordPress.org** in Actions. Do not edit or reuse a release tag.

After a commit, the workflow verifies the remote tag's plugin version and Stable tag. If WordPress.org release confirmation is enabled, confirm via its email/Release Management dashboard; public downloads and update checks may take time to refresh. If a run fails after committing, inspect the remote tag before retrying. Do not overwrite an existing SVN tag.

## 2.0.2 candidate status

The version fields and WordPress.org readme are prepared for 2.0.2. The candidate was tested on WordPress 7.1.4 with WooCommerce 11.2.1 and the supplied Subscriptions 7.7.0; see [testing evidence and limits](testing.md). The latest premium Subscriptions release is unverified.

Plugin Check still reports 16 errors and 18 warnings inherited from the existing package, including localization and admin-output findings. Review and resolve release-blocking findings before stable publication. The existing lint baseline has not been increased. GitHub 2.0.2 was subsequently published. Its WordPress.org publication did not complete. The 2.0.3 source prepares the next release; creating that stable GitHub release will be a separate authorized action.

## Repeatable release checks

Run `npm run verify` before requesting release approval; add `-- --subscriptions --require-premium` when the private integration is available. The same package runner is automatic on PRs and used by the manual dry run. Review its Markdown/JSON reports, exact tested versions, retained-settings comparison, browser/log results, skipped coverage, and remaining Plugin Check findings. New Plugin Check findings fail automatically; the published baseline is checked with the same pinned checker rather than accepting an increased findings budget. Stable publication remains a separate authorized action.

The **Installable release ZIP** workflow attaches the production plugin ZIP to each stable GitHub release. GitHub’s source archives remain separate. For tags created before this workflow existed, run it manually from the default branch with the existing release tag. It never publishes to WordPress.org or replaces an existing asset.

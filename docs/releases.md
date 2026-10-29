# Release process

WordPress.org SVN is the distribution repository. This GitHub repository is the development source after the recovered baseline is reviewed.

## Current state

- Imported published version: 2.0.1.
- WordPress.org deployment is disabled in `project.json`.
- The GitHub workflow can build a dry-run package and collect Plugin Check findings. It does not commit to SVN.
- Existing Plugin Check and coding-standard findings are technical debt, not a clean certification.

## Prepare a future release

1. Open a pull request with the change and its regression tests.
2. Increment the plugin header, internal version constant, readme Stable tag, and changelog. Keep package.json in sync with the plugin version.
3. Run syntax, coding-standard checks, PHPUnit, and browser tests. Record exact integration versions; a skipped premium test is unverified coverage.
4. For subscription/checkout changes, obtain the needed WooCommerce Subscriptions test coverage before a stable release. Invite staging testers through a GitHub prerelease.
5. Build the ZIP with `npm run build` and test installation and upgrade from the previous WordPress.org release using the built package. Check retained settings and migrations.
6. Review Plugin Check findings and compatibility metadata. Fix release-blocking problems before publishing.
7. Create a numeric Git tag and GitHub release for the reviewed commit after approval. Never reuse an existing release tag for changed code.

## Enable WordPress.org delivery later

After dry-run validation, add a reviewed deployment workflow restricted to stable release tags, pinned deployment actions, and a protected `wordpress-org` GitHub environment. Store the committer username and SVN-specific password in environment secrets, with account 2FA enabled. Verify the tag version and refuse to overwrite existing SVN tags. Deploy the tested production files to trunk and a new SVN tag, confirm the release if enabled, and verify the directory ZIP and update API after WordPress.org's processing/cooldown.

The dry-run workflow is intentionally unable to publish. No credentials are needed for development or package review. Future activation of delivery is a separate explicit step.

## 2.0.2 candidate status

The version fields and WordPress.org readme are prepared for 2.0.2. The candidate was tested on WordPress 7.1.4 with WooCommerce 11.2.1 and the supplied Subscriptions 7.7.0; see [testing evidence and limits](testing.md). The latest premium Subscriptions release is unverified.

Plugin Check still reports 16 errors and 18 warnings inherited from the existing package, including localization and admin-output findings. Review and resolve release-blocking findings before stable publication. The existing lint baseline has not been increased. WordPress.org publishing remains disabled, and this candidate has no release tag.

## Repeatable release checks

Run `npm run verify` before requesting release approval; add `-- --subscriptions --require-premium` when the private integration is available. The same package runner is automatic on PRs and used by the manual dry run. Review its Markdown/JSON reports, exact tested versions, retained-settings comparison, browser/log results, skipped coverage, and remaining Plugin Check findings. New Plugin Check findings fail automatically; the published baseline is checked with the same pinned checker rather than accepting an increased findings budget. Stable publication remains a separate authorized action.

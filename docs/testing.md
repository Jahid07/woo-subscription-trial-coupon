# Testing Woo Subscription Trial Coupon

## Environments

- Development and Playwright: `.wp-env.json`, port 8910.
- PHPUnit: `.wp-env.phpunit.json`, port 8911. Its database is disposable and separate from development.
- Local overrides are ignored by Git. Keep premium dependencies under `.local/`, also ignored.
- The default WordPress version is the latest stable version downloaded by wp-env. Use `core` in a local override to pin another release.
- The default PHP runtime is 8.3. CI also exercises PHP 8.4. Legacy minimum-version declarations are inherited from the published baseline; this setup does not certify those older runtime combinations.

## Commands

`composer lint:syntax` checks syntax. `composer lint` blocks increases in existing WordPress/PHPCompatibility findings. `composer lint:strict` shows all outstanding findings. Baseline updates require review and should normally reduce findings.

`npm run test:php` starts an isolated test environment, runs WordPress's PHPUnit integration suite, and stops the test environment even on failure.

`npm run env:start`, `npm run test:setup`, and `npm run test:e2e` run browser checks against disposable fixtures. The fixture setup changes only this repository's local Docker site. Reports are in `playwright-report/`; traces and screenshots are retained on failures.

## Private integrations

Place your available Subscriptions folder in `.local/woocommerce-subscriptions/` and a compatible free WooCommerce release in `.local/woocommerce/`. Copy `.wp-env.override.example.json` to `.wp-env.override.json`, restart the environment, and run `npm run test:setup`. Keep the folder names canonical: versioned remote ZIP URLs can change wp-env mount names and break dependency detection. Both versions are recorded in the environment report.

The setup command writes `.cache/test-environment.json` with exact WordPress, PHP, theme, and plugin versions. It is a local/CI artifact, not a compatibility claim. Missing premium integration tests are explicitly skipped in the public suite. `npm run test:e2e:integration` requires the premium integration and fails when it is unavailable.

When using premium dependencies with PHPUnit, add the same local mappings to `.wp-env.phpunit.override.json` as appropriate; overrides are separate for the two environments.

## Community testing

People with newer Divi or WooCommerce Subscriptions versions can test a GitHub prerelease on staging and report: plugin version or commit, WordPress/PHP/dependency versions, classic or block checkout, reproduction steps, expected/actual result, and redacted logs. Community reports and maintainer-verified results should be recorded separately. Do not claim the latest Subscriptions version is supported before it has been verified.

If you override the development port, set `WP_BASE_URL` to that site URL when running Playwright.

## Recorded setup validation — 2026-10-25

On WordPress 7.1.3 and PHP 8.3.32: 2 PHPUnit integration tests passed; 1 Chromium browser tests passed; 1 premium browser tests were skipped because the private dependency was unavailable. The active test theme was Twenty Twenty-Five. The coupon environment also had WooCommerce 11.2.1 active. This records the tested scenarios above; it does not certify untested Divi, Subscriptions, checkout, gateway, or legacy PHP combinations.

Version consistency, production ZIP packaging, npm dependency audit, and the shared locked Composer dependency audit passed. Existing coding-standard findings are tracked in the baseline and remain follow-up work.

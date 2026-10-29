# Testing Woo Subscription Trial Coupon

[Demo setup and environment profiles](demo.md) describes the persistent websites, private dependency locations and reset behavior.

## Checks

- `composer lint:syntax`: syntax for project PHP, including fixture code.
- `composer lint`: blocks increases in existing WordPress/PHPCompatibility findings. `composer lint:strict` lists outstanding findings; do not increase the baseline to hide debt.
- `npm run test:php`: starts a separate WordPress PHPUnit environment, runs the integration suite, then stops it even on failure.
- `npm run test:e2e`: resets the isolated E2E database, seeds the realistic website, runs Chromium tests, then stops the test site. Development data is preserved.
- `npm run build`: checks version consistency and builds a production ZIP with no development or private assets.

Browser coverage includes real content navigation, loaded hero imagery, mobile layout/navigation and local contact submission, plus the plugin-specific scenarios. The store also exercises physical-product checkout and customer login; private scenarios are explicit premium tests.

Exact WordPress, PHP, theme and plugin versions and fixture IDs are recorded in ignored `.cache/test-environment.json`. Variant reports use `-divi5` or `-subscriptions` suffixes. HTML reports live in `playwright-report/`; failure screenshots and traces are retained in `test-results/`. Each run replaces its browser report. CI uploads the public-profile results for PHP 8.3 and 8.4.

Private premium tests skip explicitly in a public checkout. `npm run test:e2e:integration` requires the private integration and fails if unavailable. Premium files are not uploaded to GitHub or provided to public CI.

The default WordPress core follows wp-env's latest stable source and PHP defaults to 8.3. CI also tests PHP 8.4. Pin `core` in a profile-specific ignored override when checking another WordPress version. Local overrides for development, PHPUnit and E2E are separate. These checks do not certify the inherited legacy minimum-version declarations.

## Community reports

Test prereleases on staging and report the plugin version/commit, exact WordPress/PHP/dependency versions, native or builder header, classic or block checkout, reproduction steps, expected/actual behavior, and redacted logs. Keep community reports distinct from maintainer-verified results. Do not claim latest premium compatibility until it is actually tested.

## Local validation — 2026-10-25

WordPress 7.1.3 / PHP 8.3.32: 6 Chromium tests passed on public WooCommerce 11.2.1, with the premium scenario explicitly skipped. All 7 passed with the supplied Subscriptions 7.7.0 and WooCommerce 9.9.5. The premium scenario applies a seven-day trial coupon to a virtual monthly subscription, completes classic checkout with manual renewals and verifies a related subscription was created. Physical-product checkout, customer login, responsive content/navigation and local contact submission also passed. Earlier baseline validation passed 2 PHPUnit tests (4 assertions).

Syntax, existing-finding baselines and production ZIP checks passed. All five persistent development sites retained their marker, home content, post/order counts, inquiry data and fixture manifest across isolated browser resets. Repeating ordinary demo setup preserved development data. Desktop/mobile screenshots were inspected. Latest Subscriptions, automatic payment gateways, recurring physical shipping and block checkout remain unverified.

## Account-page follow-up — 2026-10-25

A desktop in-app browser review verified customer login, dashboard, Orders, Subscriptions, Downloads, Addresses and Account details. Corrected WooCommerce clearfix pseudo-elements being treated as grid cells in Login/Register and address layouts, restored paragraph-notice spacing, highlighted the current account section, and made fixture CSS cache versions follow file changes. A missing local privacy page is added by an idempotent seed migration that preserves existing development content and orders. Registration submission, password changes and account-detail saves were outside this check.

## Coupon application and logs — 2026-10-29

Upgraded the same development site to WooCommerce 11.2.1, retaining WordPress 7.1.3, PHP 8.3.32 and the supplied Subscriptions 7.7.0. In fresh browser sessions, verified applying the seven-day trial to The Coffee Club, persistence after refresh, £0 due in the classic checkout preview, removal restoring the £22 charge, and reapplication. A regular-product cart correctly rejected the coupon, but exposed a plugin-side PHP deprecation from assigning `WC_Coupon::$error_code`. Replaced that dynamic property with request-local tracking keyed by coupon object identity, clearing obsolete rejection state on revalidation.

After the fix, both saved Chromium regression cases passed, as did five PHPUnit tests with fourteen assertions. Fresh WordPress debug-log bytes, WooCommerce file/database logs, browser errors and Docker/PHP error output were clean for the repeated application and rejection scenarios. Historical log entries were retained. Syntax, the existing coding-standard baseline and release packaging passed. No orders were placed, the stored product's base trial remained zero, and the user's existing browser cart was not used. Local screenshots and before/after logs are in ignored `.cache/coupon-latest-review/`. The development site is left on 11.2.1. This verifies the simple subscription's classic cart and checkout preview; variable subscriptions, sign-up fee coupon types, order creation, renewals and a newer Subscriptions release are not covered by this check.

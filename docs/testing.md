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

After the fix, both saved Chromium regression cases passed. Six PHPUnit tests with sixteen assertions cover validation state and generic error callbacks without a coupon instance. Fresh WordPress debug-log bytes, WooCommerce file/database logs, browser errors and Docker/PHP error output were clean for the repeated application and rejection scenarios. Historical log entries were retained. Syntax, the existing coding-standard baseline and release packaging passed. No orders were placed, the stored product's base trial remained zero, and the user's existing browser cart was not used. Local screenshots and before/after logs are in ignored `.cache/coupon-latest-review/`. The development site is left on 11.2.1. This verifies the simple subscription's classic cart and checkout preview; variable subscriptions, sign-up fee coupon types, order creation, renewals and a newer Subscriptions release are not covered by this check.

## Version 2.0.2 candidate — 2026-10-29

The candidate updates the coupon rejection fix, version metadata, and WordPress.org readme. The readme records WordPress 7.1.4 / PHP 8.3.32 / WooCommerce 11.2.1 / WooCommerce Subscriptions 7.7.0. Its `Tested up to: 7.1` field follows the directory's major/minor version convention. The newest premium Subscriptions release remains unverified, with staging-test contributions invited.

The built ZIP upgraded from the published 2.0.1 package while preserving the existing coupon type, trial length/period, subscription product settings, fixture IDs and store currency. All six coupon/store browser cases passed, including manual subscription checkout and a physical-product order, in the disposable test site. Two generic site cases passed initially; the remaining image/navigation case passed after the test site's seeded hero URL was pointed at the fixture theme, because test assets are intentionally excluded from production ZIPs. Fresh debug-log output during the browser suite was empty. Six PHPUnit tests / sixteen assertions, syntax, version checks, and the unchanged coding-standard baseline passed.

Plugin Check 2.1.0 was run on the installed production ZIP with static and runtime checks in update mode. It reported 16 errors and 18 warnings, compared with 16 errors and 19 warnings for the published 2.0.1 ZIP; no new findings were introduced. Remaining findings include text-domain/localization errors, unescaped admin output, input-handling warnings, global naming, the legacy slug, and omitted Composer metadata. These are recorded review items, not a clean Plugin Check result. No release tag or SVN publication has been created.

The final ZIP also installed and activated successfully on a fresh WordPress 7.1.4 database with the supplied dependencies. The fresh CLI reset/install sequence emitted a WooCommerce translation-loading timing notice; this is separate from the empty debug output recorded during coupon/browser checks. The persistent development sites were not reset.

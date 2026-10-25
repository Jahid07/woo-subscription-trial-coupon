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

# Woo Subscription Trial Coupon

- This repository preserves the WordPress.org 2.0.1 baseline. Existing Git history must be retained.
- Keep the WordPress.org slug `woo-subscription-trial-coupon` and main file `woo-subscription-trial-coupon.php` unchanged.
- Install Node 24 dependencies with `npm ci` and PHP tools with `composer install`.
- Run `composer lint:syntax`, `composer lint`, `npm run test:php`, and `npm run test:e2e` as appropriate.
- Seed the persistent Docker demo with `npm run demo:seed`; the sole development site is WooCommerce + Subscriptions on port 8915, using `.wp-env.subscriptions.json` to preserve its existing database. Browser tests reset only `.wp-env.e2e*.json` profiles. Read `docs/demo.md` before changing environment mappings.
- Keep premium themes/plugins in ignored `.local/` paths. Never commit credentials, customer data, or local overrides.
- Switch local WooCommerce with `npm run woo:use -- latest|current|VERSION`; restore older versions with their matching database via `woo:restore`. Keep snapshots and exact-version selections private in `.local/`. Development stays on port 8915; do not create extra development sites for version changes.
- Existing coding findings have a baseline. Do not increase it to hide new findings; explain intentional baseline changes.
- Do not claim compatibility with dependency versions that have not been tested.
- WordPress.org publication is configured only for published stable GitHub releases. Do not create/publish a release or execute the publisher without explicit user authorization; preparation and merging alone must not publish. The manual preview remains read-only.
- Build release ZIPs with `npm run build`. A future release must have a new version and matching metadata before deployment.

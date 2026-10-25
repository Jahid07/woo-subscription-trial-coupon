# Woo Subscription Trial Coupon

- This repository preserves the WordPress.org 2.0.1 baseline. Existing Git history must be retained.
- Keep the WordPress.org slug `woo-subscription-trial-coupon` and main file `woo-subscription-trial-coupon.php` unchanged.
- Install Node 24 dependencies with `npm ci` and PHP tools with `composer install`.
- Run `composer lint:syntax`, `composer lint`, `npm run test:php`, and `npm run test:e2e` as appropriate.
- Start this plugin's Docker site with `npm run env:start`; the default port is 8910.
- Keep premium themes/plugins in ignored `.local/` paths. Never commit credentials, customer data, or local overrides.
- Existing coding findings have a baseline. Do not increase it to hide new findings; explain intentional baseline changes.
- Do not claim compatibility with dependency versions that have not been tested.
- WordPress.org deployment is disabled. Do not publish or modify SVN releases during development setup.
- Build release ZIPs with `npm run build`. A future release must have a new version and matching metadata before deployment.

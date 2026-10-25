# Woo Subscription Trial Coupon

[WordPress.org](https://wordpress.org/plugins/woo-subscription-trial-coupon/) · [Issues](https://github.com/Jahid07/woo-subscription-trial-coupon/issues)

Development source for the existing WordPress.org plugin. The published **2.0.1** package was imported as a separate baseline commit on 2026-10-25. Earlier Git history is preserved where available. This setup does not publish a WordPress.org update.

## Local development

Prerequisites: Docker Desktop running, Node 24, Composer, PHP CLI, and the `zip`/`unzip` tools.

```sh
composer install
npm ci
npx playwright install chromium
npm run env:start
npm run test:php
npm run test:setup
npm run test:e2e
```

Local site: http://localhost:8910 (`admin` / `password`, local development only). PHPUnit uses a separate Docker configuration and database on port 8911, then stops that environment. `npm run env:stop` stops the development site.

```sh
composer lint:syntax
composer lint
npm run check:release
npm run build
```

The build creates `dist/woo-subscription-trial-coupon-2.0.1.zip` with a production-only Composer autoloader and verifies that development and private files are excluded. Coding-standard and PHP-compatibility debt from the recovered code is tracked in `phpcs-baseline.json`; checks block increases rather than claiming the legacy code is clean.

## Integration coverage

WooCommerce downloads automatically from WordPress.org in both Docker environments. Supply only your available Subscriptions folder in `.local/woocommerce-subscriptions/`, copy `.wp-env.override.example.json` to `.wp-env.override.json`, restart the environment, and run `npm run test:setup`. The example keeps the automatic WooCommerce download when adding the private Subscriptions copy. Run `npm run env:start -- --update` when you deliberately want to refresh remote dependencies; a normal start can reuse cached sources. Exact installed versions are recorded in the environment report.

The default download follows the latest stable WooCommerce release. Check its compatibility with your available Subscriptions version before testing. A separate environment can use a pinned older WooCommerce copy when needed; keep the mounted plugin folder named `woocommerce` so dependency detection works.

See [testing](docs/testing.md), [contributing](CONTRIBUTING.md), and [release process](docs/releases.md). WordPress.org publishing remains disabled while this workflow is reviewed. Compatibility claims must reflect actual recorded test versions.

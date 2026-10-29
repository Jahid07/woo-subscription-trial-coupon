# Woo Subscription Trial Coupon

[WordPress.org](https://wordpress.org/plugins/woo-subscription-trial-coupon/) · [Issues](https://github.com/Jahid07/woo-subscription-trial-coupon/issues)

Development source for the existing WordPress.org plugin. The published **2.0.1** package was imported as a separate baseline commit on 2026-10-25. Earlier Git history is preserved. WordPress.org publishing remains disabled during development setup.

## Local development

Prerequisites: Docker Desktop running, Node 24, Composer, PHP CLI, and `zip`/`unzip`.

```sh
composer install
npm ci
npx playwright install chromium
npm run demo:seed
npm run test:php
npm run test:e2e
```

Open [the development website](http://localhost:8910) and log in with `admin` / `password`. The realistic demo is persistent; browser tests use a separate resettable site on port 8912. PHPUnit also has its own database on port 8911.

See [demo websites and private dependencies](docs/demo.md) for content, refresh behavior, extra profiles and premium integration commands. `npm run env:stop` stops the default development site.

```sh
composer lint:syntax
composer lint
npm run check:release
npm run build
```

The build creates `dist/woo-subscription-trial-coupon-2.0.2.zip` with a production-only Composer autoloader and verifies development/private files are excluded. Existing WordPress/PHPCompatibility findings are tracked in `phpcs-baseline.json`; checks block increases. Compatibility claims must reflect actual recorded test versions.

See [testing](docs/testing.md), [contributing](CONTRIBUTING.md), and [release process](docs/releases.md).

## Automated verification

```sh
npm run verify
# Include the supplied private Subscriptions integration:
WC_VERSION=latest npm run verify -- --subscriptions --require-premium
```

This checks code, dependencies, readme/version metadata, PHPUnit, fresh ZIP installation, upgrade from the published baseline, retained settings, browser behavior, fresh PHP/WooCommerce logs, and new Plugin Check findings. Only disposable test databases are reset. Reports and coverage limits are described in [testing](docs/testing.md#automated-verification). GitHub runs the public checks on PRs; premium checkout tests run locally with your private copy. A passing run does not enable publishing or clear existing Plugin Check findings.

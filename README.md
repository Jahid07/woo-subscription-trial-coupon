# Woo Subscription Trial Coupon

[WordPress.org](https://wordpress.org/plugins/woo-subscription-trial-coupon/) · [Issues](https://github.com/Jahid07/woo-subscription-trial-coupon/issues)

Development source for the existing WordPress.org plugin. The published **2.0.1** package was imported as a separate baseline commit on 2026-10-25. Earlier Git history is preserved. WordPress.org publishing remains disabled during development setup.

## Local development

Prerequisites: Docker Desktop running, Node 24, Composer, PHP CLI, and `zip`/`unzip`.

Supply WooCommerce Subscriptions privately at `.local/woocommerce-subscriptions.zip` or `.local/woocommerce-subscriptions/`. WooCommerce is downloaded automatically at the version declared by that copy's compatibility header.

```sh
composer install
npm ci
npx playwright install chromium
npm run demo:seed
npm run test:php
npm run test:e2e
```

Open [the development website](http://localhost:8915) and log in with `admin` / `password`. This is the only persistent shop and includes WooCommerce + Subscriptions. Public CI browser tests use a disposable site on port 8912; premium browser tests use port 8917. PHPUnit also has its own database on port 8911.

See [demo websites and private dependencies](docs/demo.md) for content, refresh behavior and premium integration commands. The `env:start`, `env:stop`, `env:logs` and `wp` npm commands explicitly select the existing Subscriptions profile on port 8915.

Choose WooCommerce on that same site with `npm run woo:use -- current`, `npm run woo:use -- latest`, or `npm run woo:use -- VERSION`. Each change saves a private database checkpoint; `npm run woo:restore -- previous` restores the previous files and database state. Restarting retains the chosen version. See [version selection and restore behavior](docs/demo.md#choose-woocommerce-versions-on-the-same-site) before switching back.

```sh
composer lint:syntax
composer lint
npm run check:release
npm run build
```

The build creates `dist/woo-subscription-trial-coupon-2.0.3.zip` with a production-only Composer autoloader and verifies development/private files are excluded. Existing WordPress/PHPCompatibility findings are tracked in `phpcs-baseline.json`; checks block increases. Compatibility claims must reflect actual recorded test versions.

See [testing](docs/testing.md), [contributing](CONTRIBUTING.md), and [release process](docs/releases.md).

## Automated verification

```sh
npm run verify
# Include the supplied private Subscriptions integration:
WC_VERSION=latest npm run verify -- --subscriptions --require-premium
```

This checks code, dependencies, readme/version metadata, PHPUnit, fresh ZIP installation, upgrade from the published baseline, retained settings, browser behavior, fresh PHP/WooCommerce logs, and new Plugin Check findings. Only disposable test databases are reset. Reports and coverage limits are described in [testing](docs/testing.md#automated-verification). GitHub runs the public checks on PRs; premium checkout tests run locally with your private copy. A passing run does not enable publishing or clear existing Plugin Check findings.

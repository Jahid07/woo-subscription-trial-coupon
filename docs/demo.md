# Local demo websites

Run `npm run demo:seed` after installing dependencies and supplying the private Subscriptions copy. This starts the WooCommerce + Subscriptions site on port 8915, activates the intended theme and creates the realistic demo once. Repeating it preserves your page edits and local orders. `npm run demo:refresh` explicitly rewrites owned demo content and settings; it does not reset the database or delete unrelated posts. `demo:subscriptions` remains an alias for the same development site.

| Purpose | Configuration | Port | Data |
| --- | --- | --- | --- |
| Development: WooCommerce + Subscriptions | `.wp-env.subscriptions.json` | 8915 | Persistent |
| PHPUnit | `.wp-env.phpunit.json` | 8911 | Separate integration database |
| Public CI browser tests | `.wp-env.e2e.json` | 8912 | Reset before each test run |
| Subscriptions browser tests | `.wp-env.e2e-subscriptions.json` | 8917 | Reset before each test run |

Each configuration creates separate wp-env containers, database and uploads. Development stays running. Use `npm run env:start`, `npm run env:stop`, `npm run env:logs` and `npm run wp -- ...` for the development site. These commands explicitly select `.wp-env.subscriptions.json`, retaining its existing wp-env identity and data. The standalone development site on port 8910 and its `.wp-env.json` configuration have been removed. Use the npm commands rather than bare `wp-env` commands.

`npm run test:e2e` starts its own E2E profile, validates its configuration and live `WORKSHOP_DEMO_ROLE=e2e` marker, resets **only that E2E database**, seeds the same website, runs Playwright and stops the test profile. `npm run test:setup` performs the E2E reset/seed and leaves that test site running for inspection. Avoid concurrent runs targeting the same profile. For interactive tests use `npm run test:e2e:ui`.

The persistent development profiles carry `WORKSHOP_DEMO_ROLE=development`. No test command needs to reset a development database. Keep manual work in development sites; test-site data is disposable.

### WooCommerce and Subscriptions

There is one persistent development shop, with both WooCommerce and Subscriptions. Public CI still uses a disposable test configuration without the private extension; it does not create a second development shop.

Put your private Subscriptions ZIP at `.local/woocommerce-subscriptions.zip`, or its extracted folder at `.local/woocommerce-subscriptions/`. Then run:

```sh
npm run demo:seed                 # http://localhost:8915
npm run test:e2e:subscriptions
```

On first setup, the development profile keeps an existing local WooCommerce copy, or downloads the version declared by the supplied Subscriptions header's `WC tested up to` field (falling back to `WC requires at least`). The supplied Subscriptions 7.7.0 declares WooCommerce 9.9.5 as tested. This declaration does not certify it against newer WooCommerce releases.

### Choose WooCommerce versions on the same site

Run these commands from this plugin directory. The URL and existing Docker profile stay on port 8915:

```sh
npm run woo:status                 # Installed plugin/database versions; no network lookup
npm run woo:use -- current         # Keep the version already installed
npm run woo:use -- latest          # Resolve the current stable WordPress.org release and switch
npm run woo:use -- 11.2.1          # Choose an exact version (example)
npm run woo:backup                # Save a checkpoint without changing versions
npm run woo:snapshots              # List saved database checkpoints
npm run woo:restore -- previous    # Restore the state immediately before the last switch
# Or: npm run woo:restore -- SNAPSHOT_ID
```

`latest` is resolved only when explicitly requested, then saved as an exact numeric version in ignored `.local/woocommerce-selection.json`. Restarting with `demo:seed` or `env:start` retains the selection. Downloads are verified and retained under `.local/woocommerce-versions/VERSION/woocommerce/`; the original `.local/woocommerce/` copy is preserved. The mounted plugin path remains `woocommerce/woocommerce.php`.

Before changing the running site, the command downloads the requested package, checks its WordPress/PHP minimums, enables temporary maintenance mode and exports a private database snapshot. It verifies Apache denies HTTP access to private backup storage before writing SQL. It then restarts the same Docker profile with the selected files and runs `wp wc update`. WordPress is pinned to its installed version in the local override, with automatic updates disabled, so a WooCommerce switch does not also update core. A failed switch attempts to restore both the previous WooCommerce files and its database. The status command shows the exact installed stack; installation success alone is not proof of checkout or Subscriptions compatibility.

Going back requires a matching database checkpoint, not just older plugin files. `woo:restore` restores products, accounts, orders and settings to that snapshot's point in time; it first backs up the outgoing state. Snapshot IDs, version metadata and SQL checksums are checked, and restoration refuses a different site or mismatched WordPress, Subscriptions or Trial Coupon versions. Snapshots and selection files stay in ignored `.local/` and must not be committed. Uploaded files and other plugin/theme sources are not rolled back by these WooCommerce database snapshots.

This follows [WooCommerce's downgrade guidance](https://woocommerce.com/document/installing-uninstalling-woocommerce/): restore a database backup that matches the version being installed.

The disposable Subscriptions browser tests follow the selected development version by default. `WC_VERSION=latest npm run test:e2e:subscriptions` or `WC_VERSION=9.9.5 npm run test:e2e:subscriptions` tests an override without changing development's selected version. `WC_VERSION` cannot bypass the backed-up development switching command. Public CI remains independent of the private selection and snapshots.

Northline has seven physical products, product categories, images, stock, standard/free delivery, a customer account, cart and classic checkout. The Subscriptions profile also has a virtual £22/month Coffee Club plan with manual renewals and `plugin-test-free-trial`, which grants a seven-day trial. Physical checkout uses an offline local demo payment method. No payment is collected. Contact forms save messages locally and outgoing WordPress mail is suppressed in these fixtures.

Customer login: `demo-customer` / `LocalDemo2026!` (local fixtures only). Admin: `admin` / `password`. No real orders are fulfilled. Latest Subscriptions and block checkout are not certified by these scenarios; newer-version staging reports should include exact dependency versions and reproduction steps.


## Assets and packaging

All photographs, the local font, product illustrations and logos live under `tests/fixtures/`; see [asset credits](../tests/fixtures/ASSETS.md). The fixtures are local development support and are excluded from production ZIPs. Premium sources, generated overrides, Docker data, browser reports and credentials are ignored by Git.

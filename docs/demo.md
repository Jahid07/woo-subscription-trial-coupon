# Local demo websites

Run `npm run demo:seed` after installing dependencies. This starts the Docker site, activates the intended theme and creates the realistic demo once. Repeating it preserves your page edits and local orders. `npm run demo:refresh` explicitly rewrites owned demo content and settings; it does not reset the database or delete unrelated posts. Add `-- --refresh` to a variant command to refresh that profile.

| Purpose | Configuration | Port | Data |
| --- | --- | --- | --- |
| Development | `.wp-env.json` | 8910 | Persistent |
| PHPUnit | `.wp-env.phpunit.json` | 8911 | Separate integration database |
| Browser tests | `.wp-env.e2e.json` | 8912 | Reset before each test run |
| Subscriptions development | `.wp-env.subscriptions.json` | 8915 | Persistent |
| Subscriptions browser tests | `.wp-env.e2e-subscriptions.json` | 8917 | Reset before each test run |

Each configuration creates separate wp-env containers, database and uploads. Development stays running. `npm run env:stop` stops the default development profile; for variants use `npx wp-env --config=.wp-env.divi5.json stop` or `npx wp-env --config=.wp-env.subscriptions.json stop` as applicable.

`npm run test:e2e` starts its own E2E profile, validates its configuration and live `WORKSHOP_DEMO_ROLE=e2e` marker, resets **only that E2E database**, seeds the same website, runs Playwright and stops the test profile. `npm run test:setup` performs the E2E reset/seed and leaves that test site running for inspection. Avoid concurrent runs targeting the same profile. For interactive tests use `npm run test:e2e:ui`.

The persistent development profiles carry `WORKSHOP_DEMO_ROLE=development`. No test command needs to reset a development database. Keep manual work in development sites; test-site data is disposable.

### WooCommerce and Subscriptions

The default shop downloads public WooCommerce automatically from `https://downloads.wordpress.org/plugin/woocommerce.zip`; there is no need to supply a WooCommerce ZIP. Normal starts can reuse the download cache. Use `npm run env:start -- --update` deliberately when refreshing that public source, then record and rerun the tests.

Put your private Subscriptions ZIP at `.local/woocommerce-subscriptions.zip`, or its extracted folder at `.local/woocommerce-subscriptions/`. Then run:

```sh
npm run demo:subscriptions        # http://localhost:8915
npm run test:e2e:subscriptions
```

This separate profile downloads the WooCommerce version declared by the supplied Subscriptions header's `WC tested up to` field (falling back to `WC requires at least`). `WC_VERSION=9.9.5 npm run demo:subscriptions` selects a deliberate numeric override. The download is verified and extracted to canonical `.local/woocommerce/` so the plugin path remains `woocommerce/woocommerce.php`.

The supplied Subscriptions 7.7.0 copy is paired with its declared tested WooCommerce 9.9.5. The latest public WooCommerce site keeps its own database and has no Subscriptions copy by default. An existing different local WooCommerce version is preserved; move it aside before changing the pin. Never downgrade the latest shop's database to test an older dependency.

Northline has seven physical products, product categories, images, stock, standard/free delivery, a customer account, cart and classic checkout. The Subscriptions profile also has a virtual £22/month Coffee Club plan with manual renewals and `plugin-test-free-trial`, which grants a seven-day trial. Physical checkout uses an offline local demo payment method. No payment is collected. Contact forms save messages locally and outgoing WordPress mail is suppressed in these fixtures.

Customer login: `demo-customer` / `LocalDemo2026!` (local fixtures only). Admin: `admin` / `password`. No real orders are fulfilled. Latest Subscriptions and block checkout are not certified by these scenarios; newer-version staging reports should include exact dependency versions and reproduction steps.


## Assets and packaging

All photographs, the local font, product illustrations and logos live under `tests/fixtures/`; see [asset credits](../tests/fixtures/ASSETS.md). The fixtures are local development support and are excluded from production ZIPs. Premium sources, generated overrides, Docker data, browser reports and credentials are ignored by Git.

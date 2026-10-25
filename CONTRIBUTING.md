# Contributing

Create a short branch for one change and open a pull request. Include the problem, expected behavior, and validation performed.

Use `composer install` and `npm ci`. Start Docker with `npm run env:start`, then run `npm run test:php`, `npm run test:setup`, and `npm run test:e2e` in that order. PHPUnit uses WordPress's separate test database; the browser tests use disposable local fixtures.

Run `composer lint:syntax` and `composer lint`. The latter blocks new WordPress coding-standard and PHP-compatibility findings; existing debt is tracked explicitly in `phpcs-baseline.json`. `composer lint:strict` shows the complete report. New PHP files should follow WordPress Coding Standards.

Premium integration tests need private local dependencies. See `docs/testing.md`. A skipped premium test is recorded as unverified coverage. Use `npm run test:e2e:integration` to require the premium dependency and fail if it is missing.

Release packaging and version checks are described in `docs/releases.md`.

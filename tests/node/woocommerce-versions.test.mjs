import test from 'node:test';
import assert from 'node:assert/strict';
import { numericVersion, compareVersions, resolveVersion, validateArchive, assertDevelopmentSite, assertSnapshot } from '../../scripts/woocommerce-versions.mjs';

const site = {
  siteUrl: 'http://localhost:8915', role: 'development', environment: 'local',
  wordpress: '7.1.3', woocommerce: '9.9.5', subscriptions: '7.7.0', plugin: '2.0.1',
};
const hash = 'a'.repeat(64);
const snapshot = { schema: 1, config: '.wp-env.subscriptions.json', site, databaseSHA256: hash };

test('version requests cannot become paths or prerelease downloads', () => {
  for (const version of ['../../9.9.5', '9.9.5/evil', '11.2.0-rc.1', 'latest', '', undefined]) assert.throws(() => numericVersion(version));
  assert.equal(compareVersions('11.2.1', '9.9.5'), 1);
  assert.equal(compareVersions('9.10.0', '9.9.5'), 1);
  assert.equal(compareVersions('9.9', '9.9.0'), 0);
});

test('latest resolves through WordPress.org to an exact pin; current makes no network request', async () => {
  let calls = 0;
  const registry = async url => {
    calls++;
    assert.equal(url.origin, 'https://api.wordpress.org');
    assert.equal(url.searchParams.get('request[slug]'), 'woocommerce');
    return { ok: true, json: async () => ({ version: '11.2.1' }) };
  };
  assert.equal(await resolveVersion('current', '9.9.5', registry), '9.9.5');
  assert.equal(await resolveVersion('9.9.5', '11.2.1', registry), '9.9.5');
  assert.equal(calls, 0);
  assert.equal(await resolveVersion('latest', '9.9.5', registry), '11.2.1');
  assert.equal(calls, 1);
  await assert.rejects(resolveVersion('latest', '9.9.5', async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(resolveVersion('latest', '9.9.5', async () => ({ ok: true, json: async () => ({ version: '11.3.0-beta.1' }) })), /numeric/);
});

test('WooCommerce archives reject traversal, other roots and symlinks', () => {
  validateArchive(['woocommerce/', 'woocommerce/woocommerce.php'], '-rw-r--r--');
  for (const entries of [[], ['woocommerce/../outside.php'], ['/woocommerce/woocommerce.php'], ['other/woocommerce.php'], ['woocommerce/dir\\outside.php']]) {
    assert.throws(() => validateArchive(entries, ''), /paths/);
  }
  assert.throws(() => validateArchive(['woocommerce/link'], 'lrwxrwxrwx 1 user group 0 link'), /symbolic/);
});

test('version and database changes cannot target E2E, another port, or a remote site', () => {
  assertDevelopmentSite(site);
  for (const override of [{ role: 'e2e' }, { environment: 'production' }, { siteUrl: 'http://localhost:8917' }, { siteUrl: 'https://store.example.com:8915' }]) {
    assert.throws(() => assertDevelopmentSite({ ...site, ...override }), /Refusing/);
  }
});

test('restoration requires a matching site, plugin stack and database checksum', () => {
  assertSnapshot(snapshot, site, hash);
  assert.throws(() => assertSnapshot({ ...snapshot, config: '.wp-env.e2e-subscriptions.json' }, site, hash), /does not belong/);
  assert.throws(() => assertSnapshot({ ...snapshot, site: { ...site, siteUrl: 'http://localhost:8910' } }, site, hash), /does not belong/);
  assert.throws(() => assertSnapshot(snapshot, { ...site, subscriptions: '8.0.0' }, hash), /matching/);
  assert.throws(() => assertSnapshot(snapshot, { ...site, wordpress: '7.2.0' }, hash), /matching/);
  assert.throws(() => assertSnapshot(snapshot, site, 'b'.repeat(64)), /checksum/);
});

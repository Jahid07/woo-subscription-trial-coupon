import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertTestProfile, readmeProblems, parsePluginCheck, newFindings, logProblems, testWooCommerceSource } from '../../scripts/release-review.mjs';

test('WooCommerce test versions stay on official URLs and reject paths', () => {
  assert.equal(testWooCommerceSource('latest'), 'https://downloads.wordpress.org/plugin/woocommerce.zip');
  assert.equal(testWooCommerceSource('11.2.1'), 'https://downloads.wordpress.org/plugin/woocommerce.11.2.1.zip');
  for (const version of ['../../private.zip', 'https://example.test/plugin.zip', '11.2.1-beta', '']) {
    assert.throws(() => testWooCommerceSource(version));
  }
});

test('release checks refuse development, overridden ports, and non-E2E profiles', () => {
  const selected = { kind: 'e2e', config: '.wp-env.e2e.json', port: 8912 };
  const config = { port: 8912, config: { WORKSHOP_DEMO_ROLE: 'e2e' } };
  assert.doesNotThrow(() => assertTestProfile(selected, config, 8915));
  assert.throws(() => assertTestProfile(selected, { ...config, port: 8915 }, 8915));
  assert.throws(() => assertTestProfile({ ...selected, config: '.wp-env.subscriptions.json' }, config, 8915));
  assert.throws(() => assertTestProfile(selected, { ...config, config: { WORKSHOP_DEMO_ROLE: 'development' } }, 8915));
});

test('Plugin Check comparison ignores moved lines but rejects new and duplicate findings', () => {
  const finding = { file: 'plugin.php', line: 1, type: 'ERROR', code: 'escaping', message: 'Escape output.' };
  const output = `FILE: plugin.php\n${JSON.stringify([finding])}\n`;
  const baseline = parsePluginCheck(output);
  assert.equal(newFindings(baseline, [{ ...finding, line: 40 }]).length, 0);
  assert.equal(newFindings(baseline, [finding, finding]).length, 1);
  assert.equal(newFindings(baseline, [{ ...finding, message: 'Different output.' }]).length, 1);
  assert.throws(() => parsePluginCheck('Tool failed without output'));
});

test('fresh PHP notices/errors and WooCommerce errors fail while informational logs do not', () => {
  assert.equal(logProblems([{ file: 'debug.log', text: 'PHP Deprecated: dynamic property' }]).length, 1);
  assert.equal(logProblems([{ file: 'uploads/wc-logs/checkout.log', text: 'ERROR Payment failed' }]).length, 1);
  assert.equal(logProblems([{ file: 'uploads/wc-logs/checkout.log', text: 'INFO Order created' }]).length, 0);
  assert.equal(logProblems([{ file: 'debug.log', text: '', truncated: true }]).length, 1);
});

test('readme checks reject inflated tags, long descriptions, and inconsistent identity', () => {
  const readme = '=== Coupon ===\nTags: woocommerce, coupons\nTested up to: 7.1\n\nTrial coupons.\n\n== Description ==\n== Installation ==\n== Frequently Asked Questions ==\n== Changelog ==\n';
  assert.deepEqual(readmeProblems(readme, 'Coupon'), []);
  assert.ok(readmeProblems(readme.replace('woocommerce, coupons', 'a,b,c,d,e,f'), 'Coupon').length);
  assert.ok(readmeProblems(readme.replace('Trial coupons.', 'x'.repeat(151)), 'Coupon').length);
  assert.ok(readmeProblems(readme, 'Other plugin').length);
});

import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { login, assertHealthy } from './helpers.mjs';

const environment = () => JSON.parse(fs.readFileSync('.cache/test-environment.json', 'utf8'));

test('plugin activates safely when Subscriptions is unavailable', async ({ page }) => {
  await login(page);
  await page.goto('/wp-admin/plugins.php');
  await assertHealthy(page);
  await expect(page.locator('[data-plugin="woo-subscription-trial-coupon/woo-subscription-trial-coupon.php"]')).toHaveClass(/active/);
  if (!environment().hasSubscriptions) {
    await expect(page.locator('.notice-error').filter({ hasText: 'Woo Subscription Trial Coupon' })).toBeVisible();
  }
});

test('@premium a trial coupon can be applied to a subscription cart', async ({ page }) => {
  const available = environment().hasSubscriptions;
  if (process.env.REQUIRE_PREMIUM_TESTS) expect(available, 'Activate your private Subscriptions copy and rerun npm run test:setup.').toBe(true);
  test.skip(!available, 'WooCommerce Subscriptions was not supplied; checkout compatibility is unverified.');
  await page.goto(`/?add-to-cart=${environment().fixtures.subscriptionProductId}`);
  await page.goto('/cart/');
  await page.locator('#coupon_code').fill('plugin-test-free-trial');
  await page.getByRole('button', { name: 'Apply coupon', exact: true }).click();
  await expect(page.locator('.woocommerce-message')).toContainText(/Coupon code applied successfully/i);
  await expect(page.locator('.cart-discount')).toContainText(/7 Days/i);
  await assertHealthy(page);
});

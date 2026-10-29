import fs from 'node:fs';
import { test, expect } from './fixtures.mjs';
import { login, assertHealthy } from './helpers.mjs';

const environment = () => JSON.parse(fs.readFileSync(process.env.DEMO_REPORT_PATH || '.cache/test-environment.json', 'utf8'));

test('plugin remains active with the current dependencies', async ({ page }) => {
  await login(page);
  await page.goto('/wp-admin/plugins.php');
  await assertHealthy(page);
  await expect(page.locator('[data-plugin="woo-subscription-trial-coupon/woo-subscription-trial-coupon.php"]')).toHaveClass(/active/);
  if (!environment().hasSubscriptions) {
    await expect(page.locator('.notice-error').filter({ hasText: 'Woo Subscription Trial Coupon' })).toBeVisible();
  }
});

test('@premium a seven-day trial coupon works through subscription checkout', async ({ page }) => {
  test.setTimeout(90_000);
  const available = environment().hasSubscriptions;
  if (process.env.REQUIRE_PREMIUM_TESTS) expect(available, 'Activate your private Subscriptions copy and rerun npm run test:setup.').toBe(true);
  test.skip(!available, 'WooCommerce Subscriptions was not supplied; checkout compatibility is unverified.');
  await page.goto(`/?add-to-cart=${environment().fixtures.subscriptionProductId}`);
  await page.goto('/cart/');
  await page.locator('#coupon_code').fill('plugin-test-free-trial');
  await page.getByRole('button', { name: 'Apply coupon', exact: true }).click();
  await expect(page.locator('.woocommerce-message')).toContainText(/Coupon code applied successfully/i);
  await expect(page.locator('.cart-discount')).toContainText(/7 Days/i);
  await page.goto('/my-account/');
  await page.locator('#username').fill('demo-customer');
  await page.locator('#password').fill('LocalDemo2026!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.goto('/checkout/');
  await expect(page.locator('#payment_method_bacs')).toBeAttached();
  await page.locator('#payment_method_bacs').check();
  await page.locator('#place_order').click();
  await expect(page).toHaveURL(/order-received/, { timeout: 45_000 });
  await expect(page.locator('.woocommerce-order')).toContainText('The Coffee Club');
  await expect(page.locator('.woocommerce-order')).toContainText('Related subscriptions');
  await assertHealthy(page);
});

test('@premium a trial coupon survives refresh and can be removed and reapplied', async ({ page }) => {
  const available = environment().hasSubscriptions;
  if (process.env.REQUIRE_PREMIUM_TESTS) expect(available, 'Activate your private Subscriptions copy.').toBe(true);
  test.skip(!available, 'WooCommerce Subscriptions was not supplied.');
  await page.goto(`/?add-to-cart=${environment().fixtures.subscriptionProductId}`);
  await page.goto('/cart/');
  await page.locator('#coupon_code').fill('plugin-test-free-trial');
  await page.getByRole('button', { name: 'Apply coupon', exact: true }).click();
  await expect(page.locator('.cart-discount')).toContainText(/7 Days/i);
  await expect(page.locator('.cart_totals .order-total .woocommerce-Price-amount').first()).toContainText('£0.00');
  await page.reload();
  await expect(page.locator('.cart-discount')).toContainText(/7 Days/i);
  await expect(page.locator('.cart_totals .order-total .woocommerce-Price-amount').first()).toContainText('£0.00');
  await page.locator('a.woocommerce-remove-coupon').click();
  await expect(page.locator('.cart-discount')).toHaveCount(0);
  await expect(page.locator('.cart_totals .order-total .woocommerce-Price-amount').first()).toContainText('£22.00');
  await page.locator('#coupon_code').fill('plugin-test-free-trial');
  await page.getByRole('button', { name: 'Apply coupon', exact: true }).click();
  await expect(page.locator('.cart-discount')).toContainText(/7 Days/i);
  await expect(page.locator('.cart_totals .order-total .woocommerce-Price-amount').first()).toContainText('£0.00');
  await assertHealthy(page);
});

test('@premium a trial coupon rejects a regular product with its validation message', async ({ page }) => {
  const available = environment().hasSubscriptions;
  if (process.env.REQUIRE_PREMIUM_TESTS) expect(available, 'Activate your private Subscriptions copy.').toBe(true);
  test.skip(!available, 'WooCommerce Subscriptions was not supplied.');
  await page.goto(`/?add-to-cart=${environment().fixtures.simpleProductId}`);
  await page.goto('/cart/');
  await page.locator('#coupon_code').fill('plugin-test-free-trial');
  await page.getByRole('button', { name: 'Apply coupon', exact: true }).click();
  await expect(page.getByText('This coupon is only valid if there is a subscription product in the cart.', { exact: true })).toBeVisible();
  await expect(page.locator('.cart-discount')).toHaveCount(0);
  await assertHealthy(page);
});


test('a shopper can complete a local order with a physical product', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(`/?add-to-cart=${environment().fixtures.simpleProductId}`);
  await page.goto('/cart/');
  await expect(page.locator('.cart_item')).toContainText('Weekend Blend');
  await page.goto('/checkout/');
  for (const [id, value] of Object.entries({ billing_first_name: 'Jamie', billing_last_name: 'Taylor', billing_address_1: '12 Example Street', billing_city: 'Bristol', billing_postcode: 'BS1 4DJ', billing_phone: '07700900123', billing_email: 'checkout@example.test' })) {
    await page.locator(`#${id}`).fill(value);
  }
  const separateShipping = page.locator('#ship-to-different-address-checkbox');
  if (await separateShipping.count()) await separateShipping.uncheck();
  await page.locator('#payment_method_cod').check();
  await page.locator('#place_order').click();
  await expect(page).toHaveURL(/order-received/, { timeout: 45_000 });
  await expect(page.locator('.woocommerce-order')).toContainText('Thank you. Your order has been received.');
  await expect(page.locator('.woocommerce-order')).toContainText('Weekend Blend');
  await assertHealthy(page);
});

test('the seeded customer can use the account area', async ({ page }) => {
  await page.goto('/my-account/');
  await page.locator('#username').fill('demo-customer');
  await page.locator('#password').fill('LocalDemo2026!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.locator('.woocommerce-MyAccount-navigation')).toBeVisible();
  await page.getByRole('link', { name: 'Orders', exact: true }).click();
  await expect(page).toHaveURL(/my-account\/orders/);
  await assertHealthy(page);
});

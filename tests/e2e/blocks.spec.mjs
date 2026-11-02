import { test, expect } from '@playwright/test';

// Explicit opt-in: this suite needs the private Subscriptions extension and block pages.
test.skip(process.env.WP_BLOCKS_TESTS !== '1', 'Run against the isolated block shop with WP_BLOCKS_TESTS=1.');

test('trial formatting follows native block cart updates without changing billing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // Reproduced with our script disabled: WooCommerce's transition vendor uses findDOMNode.
    if (text.startsWith('Warning: findDOMNode is deprecated') && text.includes('wc-cart-checkout-vendors-frontend.js')) {
      test.info().annotations.push({ type: 'upstream-warning', description: 'WooCommerce transition vendor: findDOMNode deprecation.' });
      return;
    }
    errors.push(text);
  });
  await page.goto('/product/coffee-club/');
  await page.locator('.single_add_to_cart_button').click();
  await page.goto('/cart/');
  const row = page.locator('.wc-block-cart-items__row').filter({ hasText: 'The Coffee Club' });
  await expect(row).toBeVisible();
  await expect(page.locator('.wcsc-trial-item')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add coupons', exact: true }).click();
  await page.getByRole('textbox', { name: 'Enter code', exact: true }).fill('plugin-test-free-trial');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(row).toHaveClass(/wcsc-trial-item/);
  const price = row.locator('.wc-block-cart-item__prices');
  await expect(price).toContainText('£0.00 today');
  const badge = row.locator('.wc-block-components-product-details__free-trial');
  await expect(badge).toContainText('7 days');
  await expect(badge).toHaveCSS('background-color', 'rgb(8, 127, 35)');
  await expect(price).toContainText(/Then £22\.00\s*\/ month/);
  await expect(price.locator('.wc-block-components-product-price__value')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.locator('.wc-block-components-totals-footer-item')).toContainText('£0.00');
  const dates = row.locator('.wcsc-payment-detail');
  await expect(dates).toHaveCount(1);
  await expect(dates).toContainText('First payment:');
  const before = await dates.locator('.wcsc-payment-before').innerText();
  const after = await dates.locator('strong').innerText();
  expect(Date.parse(after)).toBeGreaterThan(Date.parse(before));
  await expect(dates.locator('.wcsc-payment-before')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.locator('main')).toContainText('Starting:');
  expect(await page.locator('.wcsc-first-payment').count()).toBe(0);
  expect(await page.locator('script[src*="trial-blocks.js"]').count()).toBe(1);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/checkout/');
    const summary = page.locator('.wc-block-components-order-summary-item.wcsc-trial-item').first();
    await expect(summary).toContainText('£0.00 today');
    await expect(summary).toContainText(/Then £22\.00\s*\/ month/);
    await expect(summary.locator('.wcsc-payment-detail')).toContainText(after);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/cart/');
  await expect(row).toBeVisible();
  await row.locator('input[type="number"]').fill('2');
  await row.locator('input[type="number"]').press('Tab');
  await expect.poll(() => page.evaluate(() => wp.data.select('wc/store/cart').getCartData().extensions.subscriptions[0].totals.total_price)).toBe('4400');
  await expect(page.locator('.wc-block-components-totals-footer-item')).toContainText('£0.00');

  await page.goto('/product/weekend-blend/');
  await page.locator('.single_add_to_cart_button').click();
  await page.goto('/cart/');
  const regular = page.locator('.wc-block-cart-items__row').filter({ hasText: 'Weekend Blend' });
  await expect(regular).toBeVisible();
  await expect(regular).not.toHaveClass(/wcsc-trial-item/);
  await expect(row).toHaveClass(/wcsc-trial-item/);
  await expect.poll(() => page.evaluate(() => wp.data.select('wc/store/cart').getCartData().totals.total_items)).toBe('1400');
  await page.locator('.wc-block-components-chip button').click();
  await expect(page.locator('.wcsc-trial-item')).toHaveCount(0);
  await expect(page.locator('.wcsc-payment-detail')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => wp.data.select('wc/store/cart').getCartData().totals.total_items)).toBe('5800');
  expect(errors).toEqual([]);
});

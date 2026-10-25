import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { assertHealthy } from './helpers.mjs';
const environment = () => JSON.parse(fs.readFileSync(process.env.DEMO_REPORT_PATH || '.cache/test-environment.json', 'utf8'));

test('the demo has real content, working navigation and loaded imagery', async ({ page }) => {
  await page.goto('/');
  await assertHealthy(page);
  await expect(page.locator('h1:visible')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Plugin browser test content.');
  const hero = page.locator('.studio-hero img, .shop-hero img').first();
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.locator('.journal-card a').first().click();
  await expect(page.locator('h1:visible')).toBeVisible();
  await expect(page.locator('body')).toContainText('Start with a useful question');
  await page.goto('/journal/');
  await expect(page.locator('body')).toContainText('Making space for better work');
  expect(environment().role).toBe('e2e');
});

test('the demo fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('h1:visible')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  if (environment().hasDivi) {
    await page.locator('.mobile_menu_bar').click();
    await expect(page.locator('#mobile_menu')).toBeVisible();
  } else {
    await page.locator('.mobile-nav summary').click();
    await expect(page.getByRole('navigation', { name: 'Mobile', exact: true })).toBeVisible();
  }
});

test('the contact form stores a local inquiry', async ({ page }) => {
  await page.goto('/contact/');
  await page.getByLabel('Your name').fill('Demo Visitor');
  await page.getByLabel('Email address').fill('visitor@example.test');
  await page.getByLabel('A little about your project').fill('I would like to discuss a new project.');
  await page.getByRole('button', { name: 'Send your message' }).click();
  await expect(page.locator('.contact-success[role=status]')).toContainText('Your message has been saved');
  await assertHealthy(page);
});

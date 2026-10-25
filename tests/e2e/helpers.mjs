import { expect } from '@playwright/test';

export async function login(page) {
  await page.goto('/wp-login.php');
  await page.getByLabel('Username or Email Address').fill(process.env.WP_ADMIN_USER || 'admin');
  await page.locator('#user_pass').fill(process.env.WP_ADMIN_PASSWORD || 'password');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.locator('#wpadminbar')).toBeVisible();
}

export async function assertHealthy(page) {
  await expect(page.locator('body')).not.toContainText('There has been a critical error');
  await expect(page.locator('body')).not.toContainText('Fatal error:');
}

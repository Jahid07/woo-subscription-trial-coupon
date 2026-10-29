import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push({ type: 'javascript', message: error.message }));
    page.on('console', message => {
      if (message.type() === 'error') errors.push({ type: 'console', message: message.text() });
    });
    page.on('response', response => {
      if (response.status() >= 500) errors.push({ type: 'http', status: response.status(), path: new URL(response.url()).pathname });
    });
    await use(page);
    if (errors.length) await testInfo.attach('browser-errors', { body: JSON.stringify(errors, null, 2), contentType: 'application/json' });
    expect(errors, 'Browser JavaScript, console, and HTTP server errors').toEqual([]);
  },
});
export { expect };

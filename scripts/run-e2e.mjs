import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { setupBrowserTests } from './setup-e2e.mjs';
import { env, root, profile } from './demo-environment.mjs';

const args = process.argv.slice(2);
let selected = profile('e2e', args);
try {
  selected = await setupBrowserTests(args);
  const playwrightArgs = args.filter(arg => !['--divi5', '--subscriptions', '--require-premium'].includes(arg));
  const result = spawnSync(process.execPath, ['node_modules/playwright/cli.js', 'test', ...playwrightArgs], {
    cwd: root, stdio: 'inherit',
    env: { ...process.env, WP_BASE_URL: `http://localhost:${selected.port}`, DEMO_REPORT_PATH: selected.report,
      REQUIRE_PREMIUM_TESTS: args.includes('--require-premium') ? '1' : process.env.REQUIRE_PREMIUM_TESTS || '', PLAYWRIGHT_SKIP_BROWSER_GC: '1' },
  });
  process.exitCode = result.status ?? 1;
} finally {
  if (selected && !args.includes('--ui')) env(selected, ['stop']);
}

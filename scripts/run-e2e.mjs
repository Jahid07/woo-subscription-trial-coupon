import { setupBrowserTests } from './setup-e2e.mjs';
import { env, profile } from './demo-environment.mjs';
import { runBrowserChecks } from './browser-checks.mjs';

const args = process.argv.slice(2);
let selected = profile('e2e', args);
try {
  selected = await setupBrowserTests(args);
  const playwrightArgs = args.filter(arg => !['--divi5', '--subscriptions', '--require-premium'].includes(arg));
  const result = runBrowserChecks(selected, playwrightArgs,
    selected.variant === 'subscriptions' || args.includes('--require-premium') || Boolean(process.env.REQUIRE_PREMIUM_TESTS));
  process.exitCode = result.status;
} finally {
  if (selected && !args.includes('--ui')) env(selected, ['stop']);
}

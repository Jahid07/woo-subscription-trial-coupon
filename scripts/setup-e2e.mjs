import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { profile, prepare, env, wp, seed, project, root } from './demo-environment.mjs';

export async function setupBrowserTests(args = []) {
  const selected = profile('e2e', args);
  if (!/^\.wp-env\.e2e(?:-(?:divi5|subscriptions))?\.json$/.test(selected.config)) throw new Error('Refusing to reset a non-E2E configuration.');
  const config = JSON.parse(fs.readFileSync(path.join(root, selected.config), 'utf8'));
  if (config.config?.WORKSHOP_DEMO_ROLE !== 'e2e' || config.port === project.port) throw new Error('E2E role/port isolation check failed.');
  await prepare(selected);
  env(selected, ['start']);
  const role = wp(selected, ['eval', 'echo defined("WORKSHOP_DEMO_ROLE") ? WORKSHOP_DEMO_ROLE : "missing";']);
  if (role !== 'e2e') throw new Error('Refusing to reset a site without the E2E role marker.');
  env(selected, ['reset', 'development']);
  // Reset reinstalls the isolated site; start reapplies its theme and plugins.
  env(selected, ['start']);
  const fixtures = seed(selected, true);
  const plugins = JSON.parse(wp(selected, ['plugin', 'list', '--skip-update-check', '--format=json']));
  const themes = JSON.parse(wp(selected, ['theme', 'list', '--skip-update-check', '--format=json']));
  const report = {
    recordedAt: new Date().toISOString(), config: selected.config, role: 'e2e', baseURL: `http://localhost:${selected.port}`,
    wordpress: wp(selected, ['core', 'version']), php: wp(selected, ['eval', 'echo PHP_VERSION;']),
    plugins, themes, fixtures,
    hasDivi: themes.some(theme => theme.name.toLowerCase() === 'divi' && theme.status === 'active'),
    hasSubscriptions: plugins.some(plugin => plugin.name === 'woocommerce-subscriptions' && plugin.status === 'active'),
  };
  fs.mkdirSync(path.dirname(selected.report), { recursive: true });
  fs.writeFileSync(selected.report, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ baseURL: report.baseURL, wordpress: report.wordpress, php: report.php, hasDivi: report.hasDivi, hasSubscriptions: report.hasSubscriptions }, null, 2));
  return selected;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await setupBrowserTests(process.argv.slice(2));

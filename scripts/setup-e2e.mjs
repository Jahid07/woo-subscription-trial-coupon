import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const project = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
const cli = path.join(root, 'node_modules/@wordpress/env/bin/wp-env');
function wp(args, { optional = false } = {}) {
  const result = spawnSync(process.execPath, [cli, 'run', 'cli', 'wp', ...args], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0 && !optional) throw new Error(result.stdout + result.stderr);
  return result.status === 0 ? result.stdout.trim() : null;
}
// wp-env writes progress to stderr; JSON is emitted by wp-cli on stdout.
const plugins = JSON.parse(wp(['plugin', 'list', '--format=json']));
const themes = JSON.parse(wp(['theme', 'list', '--format=json']));
const report = {
  recordedAt: new Date().toISOString(),
  wordpress: wp(['core', 'version']),
  php: wp(['eval', 'echo PHP_VERSION;']),
  plugins, themes,
  hasDivi: themes.some(theme => theme.name.toLowerCase() === 'divi' && theme.status === 'active'),
  hasSubscriptions: plugins.some(plugin => plugin.name === 'woocommerce-subscriptions' && plugin.status === 'active'),
};
report.fixtures = JSON.parse(wp(['eval-file', `/var/www/html/wp-content/plugins/${project.slug}/scripts/seed-e2e.php`]));
fs.mkdirSync(path.join(root, '.cache'), { recursive: true });
fs.writeFileSync(path.join(root, '.cache/test-environment.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ wordpress: report.wordpress, php: report.php, activePlugins: report.plugins.filter(plugin => plugin.status === 'active').map(plugin => `${plugin.name} ${plugin.version}`), activeTheme: report.themes.find(theme => theme.status === 'active')?.name, hasDivi: report.hasDivi, hasSubscriptions: report.hasSubscriptions }, null, 2));

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { provisionVersion } from './woocommerce-versions.mjs';

export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const project = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
const cli = path.join(root, 'node_modules/@wordpress/env/bin/wp-env');

export function profile(kind, args = []) {
  const variant = args.includes('--divi5') ? 'divi5' : kind === 'development' || args.includes('--subscriptions') ? 'subscriptions' : 'default';
  if (variant === 'divi5' && project.slug !== 'logo-switcher-divi') throw new Error('Divi 5 belongs to the Divi project.');
  if (variant === 'subscriptions' && project.slug !== 'woo-subscription-trial-coupon') throw new Error('Subscriptions belongs to the coupon project.');
  const suffix = variant === 'default' ? '' : `-${variant}`;
  const config = kind === 'e2e' ? `.wp-env.e2e${suffix}.json` : '.wp-env.subscriptions.json';
  const { port } = JSON.parse(fs.readFileSync(path.join(root, config), 'utf8'));
  return { kind, variant, config, port, report: path.join(root, `.cache/test-environment${suffix}.json`) };
}

export function env(selected, args, capture = false) {
  const result = spawnSync(process.execPath, [cli, `--config=${selected.config}`, ...args], {
    cwd: root, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.status !== 0) throw new Error(capture ? result.stdout + result.stderr : `wp-env ${args[0]} failed.`);
  return capture ? result.stdout.trim() : '';
}

export function wp(selected, args) {
  return env(selected, ['run', 'cli', 'wp', ...args], true);
}

function extractPrivate(zip, target, archiveRoot) {
  if (fs.existsSync(target) || !fs.existsSync(zip)) return;
  const entries = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim().split('\n');
  if (entries.some(entry => !entry.startsWith(`${archiveRoot}/`) || entry.split('/').includes('..') || entry.includes('\\'))) throw new Error(`Unexpected paths in ${path.basename(zip)}.`);
  const details = execFileSync('unzip', ['-Z', '-l', zip], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (/^l[rwx-]{9}/m.test(details)) throw new Error('Private fixture archives must not contain symbolic links.');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  execFileSync('unzip', ['-q', zip, '-d', path.dirname(target)]);
}

function themeAvailable(major) {
  return fs.existsSync(path.join(root, `.local/divi-${major}/Divi/style.css`));
}

export async function prepare(selected) {
  let changes = {};
  if (project.slug === 'logo-switcher-divi') {
    const major = selected.variant === 'divi5' ? 5 : 4;
    extractPrivate(path.join(root, `.local/divi-${major}/Divi.zip`), path.join(root, `.local/divi-${major}/Divi`), 'Divi');
    if (themeAvailable(major)) changes.themes = [`./.local/divi-${major}/Divi`];
    else if (selected.variant === 'divi5') throw new Error('Add Divi 5 at .local/divi-5/Divi/.');
  }
  if (selected.variant === 'subscriptions') {
    extractPrivate(path.join(root, '.local/woocommerce-subscriptions.zip'), path.join(root, '.local/woocommerce-subscriptions'), 'woocommerce-subscriptions');
    const wooCommerce = await provisionVersion(selected);
    changes.plugins = [`./${path.relative(root, wooCommerce).split(path.sep).join('/')}`, './.local/woocommerce-subscriptions', '.'];
  }
  if (Object.keys(changes).length) {
    const filename = path.join(root, selected.config.replace(/\.json$/, '.override.json'));
    const current = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : {};
    // Generated overrides only select the requested private theme/dependencies.
    fs.writeFileSync(filename, JSON.stringify({ ...current, ...changes }, null, 2) + '\n');
  }
}

export function seed(selected, refresh = false) {
  const role = wp(selected, ['eval', 'echo defined("WORKSHOP_DEMO_ROLE") ? WORKSHOP_DEMO_ROLE : "missing";']);
  if (role !== (selected.kind === 'e2e' ? 'e2e' : 'development')) throw new Error('Demo role does not match this configuration.');
  const major = selected.variant === 'divi5' ? 5 : 4;
  const theme = project.slug === 'logo-switcher-divi' && themeAvailable(major) ? 'Divi' : 'demo-theme';
  wp(selected, ['theme', 'activate', theme]);
  const fixtures = JSON.parse(wp(selected, ['eval-file', `/var/www/html/wp-content/plugins/${project.slug}/scripts/seed-demo.php`, ...(refresh ? ['refresh'] : [])]));
  // A fresh bootstrap registers WooCommerce/account endpoints after permalink changes.
  wp(selected, ['rewrite', 'flush', '--hard']);
  return fixtures;
}

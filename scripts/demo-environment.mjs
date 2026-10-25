import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const project = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
const cli = path.join(root, 'node_modules/@wordpress/env/bin/wp-env');

export function profile(kind, args = []) {
  const variant = args.includes('--divi5') ? 'divi5' : args.includes('--subscriptions') ? 'subscriptions' : 'default';
  if (variant === 'divi5' && project.slug !== 'logo-switcher-divi') throw new Error('Divi 5 belongs to the Divi project.');
  if (variant === 'subscriptions' && project.slug !== 'woo-subscription-trial-coupon') throw new Error('Subscriptions belongs to the coupon project.');
  const suffix = variant === 'default' ? '' : `-${variant}`;
  const config = kind === 'e2e' ? `.wp-env.e2e${suffix}.json` : variant === 'default' ? '.wp-env.json' : `.wp-env.${variant}.json`;
  const port = project.port + (variant === 'default' ? 0 : 5) + (kind === 'e2e' ? 2 : 0);
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

async function provisionWooCommerce() {
  const subscriptions = path.join(root, '.local/woocommerce-subscriptions/woocommerce-subscriptions.php');
  if (!fs.existsSync(subscriptions)) throw new Error('Add the private WooCommerce Subscriptions folder under .local/woocommerce-subscriptions/.');
  const header = fs.readFileSync(subscriptions, 'utf8');
  const version = process.env.WC_VERSION || header.match(/WC tested up to:\s*([\d.]+)/i)?.[1] || header.match(/WC requires at least:\s*([\d.]+)/i)?.[1];
  if (!version || !/^\d+\.\d+(?:\.\d+)?$/.test(version)) throw new Error('Cannot select WooCommerce: set WC_VERSION to a numeric release.');
  const target = path.join(root, '.local/woocommerce');
  const existing = path.join(target, 'woocommerce.php');
  if (fs.existsSync(existing)) {
    const installed = fs.readFileSync(existing, 'utf8').match(/Version:\s*([\d.]+)/)?.[1];
    if (installed === version) return target;
    throw new Error(`Local WooCommerce ${installed} is preserved. Move it aside before downloading ${version}.`);
  }
  fs.mkdirSync(path.join(root, '.local'), { recursive: true });
  const temporary = fs.mkdtempSync(path.join(root, '.local/woocommerce-download-'));
  try {
    console.log(`Downloading WooCommerce ${version} from WordPress.org for the Subscriptions environment.`);
    const response = await fetch(`https://downloads.wordpress.org/plugin/woocommerce.${version}.zip`, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`WooCommerce download failed: HTTP ${response.status}`);
    const zip = path.join(temporary, 'woocommerce.zip');
    fs.writeFileSync(zip, Buffer.from(await response.arrayBuffer()));
    const entries = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim().split('\n');
    if (entries.some(entry => !entry.startsWith('woocommerce/') || entry.split('/').includes('..') || entry.includes('\\'))) throw new Error('Unexpected WooCommerce ZIP paths.');
    execFileSync('unzip', ['-q', zip, '-d', temporary]);
    const actual = fs.readFileSync(path.join(temporary, 'woocommerce/woocommerce.php'), 'utf8').match(/Version:\s*([\d.]+)/)?.[1];
    if (actual !== version) throw new Error(`Expected WooCommerce ${version}, received ${actual}.`);
    fs.renameSync(path.join(temporary, 'woocommerce'), target);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  return target;
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
    await provisionWooCommerce();
    changes.plugins = ['./.local/woocommerce', './.local/woocommerce-subscriptions', '.'];
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

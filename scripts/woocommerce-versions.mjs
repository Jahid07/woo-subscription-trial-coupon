import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const local = path.join(root, '.local');
export const developmentConfig = '.wp-env.subscriptions.json';
const selectionFile = path.join(local, 'woocommerce-selection.json');

export function protectLocalStorage() {
  fs.mkdirSync(local, { recursive: true, mode: 0o700 });
  const filename = path.join(local, '.htaccess');
  const existing = fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8') : '';
  if (!existing.includes('# Private local development storage')) {
    fs.writeFileSync(filename, `${existing}\n# Private local development storage\nRequire all denied\nOptions -Indexes\n`, { mode: 0o600 });
  }
}

export function numericVersion(version) {
  if (typeof version !== 'string' || !/^\d+\.\d+(?:\.\d+)?$/.test(version)) {
    throw new Error('Choose "latest", "current", or a numeric WooCommerce release such as 9.9.5.');
  }
  return version;
}

export function compareVersions(left, right) {
  const a = numericVersion(left).split('.').map(Number);
  const b = numericVersion(right).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return Math.sign((a[i] || 0) - (b[i] || 0));
  }
  return 0;
}

export function installedVersion(directory) {
  const filename = path.join(directory, 'woocommerce.php');
  if (!fs.existsSync(filename)) return null;
  return numericVersion(fs.readFileSync(filename, 'utf8').match(/^\s*\*?\s*Version:\s*([\d.]+)/m)?.[1]);
}

export function writeJSON(filename, value) {
  protectLocalStorage();
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const temporary = `${filename}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(temporary, filename);
}

export function selections() {
  return fs.existsSync(selectionFile) ? JSON.parse(fs.readFileSync(selectionFile, 'utf8')) : {};
}

export function selectedVersion(selected) {
  const saved = selections();
  const version = saved[selected.config]?.version || saved[developmentConfig]?.version;
  if (version) return numericVersion(version);
  const existing = installedVersion(path.join(local, 'woocommerce'));
  if (existing) return existing;
  const header = fs.readFileSync(path.join(local, 'woocommerce-subscriptions/woocommerce-subscriptions.php'), 'utf8');
  return numericVersion(header.match(/WC tested up to:\s*([\d.]+)/i)?.[1] || header.match(/WC requires at least:\s*([\d.]+)/i)?.[1]);
}

export async function resolveVersion(requested, current, fetcher = fetch) {
  if (requested === 'current') return numericVersion(current);
  if (requested !== 'latest') return numericVersion(requested);
  const url = new URL('https://api.wordpress.org/plugins/info/1.2/');
  url.searchParams.set('action', 'plugin_information');
  url.searchParams.set('request[slug]', 'woocommerce');
  url.searchParams.set('request[fields][sections]', '0');
  const response = await fetcher(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`WordPress.org version lookup failed: HTTP ${response.status}`);
  const information = await response.json();
  return numericVersion(information.version);
}

export function validateArchive(entries, details) {
  if (!entries.length || entries.some(entry => !entry.startsWith('woocommerce/') || entry.split('/').includes('..') || entry.includes('\\'))) {
    throw new Error('Unexpected paths in the WooCommerce ZIP.');
  }
  if (/^l[rwx-]{9}/m.test(details)) throw new Error('WooCommerce ZIPs must not contain symbolic links.');
}

export async function ensureVersion(version) {
  numericVersion(version);
  protectLocalStorage();
  const legacy = path.join(local, 'woocommerce');
  if (installedVersion(legacy) === version) return legacy;
  const parent = path.join(local, 'woocommerce-versions', version);
  const target = path.join(parent, 'woocommerce');
  if (fs.existsSync(target)) {
    if (installedVersion(target) !== version) throw new Error(`Cached WooCommerce ${version} was modified. Move that cache aside and retry.`);
    return target;
  }
  fs.mkdirSync(local, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(local, 'woocommerce-download-'));
  try {
    console.log(`Downloading WooCommerce ${version} from WordPress.org.`);
    const response = await fetch(`https://downloads.wordpress.org/plugin/woocommerce.${version}.zip`, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`WooCommerce download failed: HTTP ${response.status}`);
    const zip = path.join(temporary, 'woocommerce.zip');
    fs.writeFileSync(zip, Buffer.from(await response.arrayBuffer()));
    const entries = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim().split('\n');
    const details = execFileSync('unzip', ['-Z', '-l', zip], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    validateArchive(entries, details);
    execFileSync('unzip', ['-tq', zip], { stdio: 'pipe' });
    execFileSync('unzip', ['-q', zip, '-d', temporary]);
    if (installedVersion(path.join(temporary, 'woocommerce')) !== version) throw new Error('Downloaded WooCommerce header does not match the requested version.');
    fs.mkdirSync(parent, { recursive: true });
    fs.renameSync(path.join(temporary, 'woocommerce'), target);
    return target;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

export async function provisionVersion(selected) {
  const current = selectedVersion(selected);
  const version = process.env.WC_VERSION ? await resolveVersion(process.env.WC_VERSION, current) : current;
  if (selected.kind === 'development' && version !== current) {
    throw new Error(`Use "npm run woo:use -- ${version}" to switch development with a database backup. WC_VERSION selects disposable tests only.`);
  }
  return ensureVersion(version);
}

export function selectVersion(selected, version, directory, wordpress) {
  if (selected.config !== developmentConfig || selected.kind !== 'development') throw new Error('Version switching is restricted to the existing development shop.');
  if (installedVersion(directory) !== numericVersion(version)) throw new Error('Selected package version does not match its header.');
  const filename = path.join(root, '.wp-env.subscriptions.override.json');
  const overrides = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : {};
  overrides.plugins = [`./${path.relative(root, directory).split(path.sep).join('/')}`, './.local/woocommerce-subscriptions', '.'];
  // Keep wp-env's existing WordPress checkout/uploads and prevent unrelated core refreshes.
  overrides.core = `WordPress/WordPress#${numericVersion(wordpress)}`;
  overrides.config = { ...overrides.config, AUTOMATIC_UPDATER_DISABLED: true, WP_AUTO_UPDATE_CORE: false };
  writeJSON(filename, overrides);
  writeJSON(selectionFile, { ...selections(), [selected.config]: { version, selectedAt: new Date().toISOString() } });
}

export function assertDevelopmentSite(site) {
  const url = new URL(site.siteUrl);
  if (site.role !== 'development' || site.environment !== 'local' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.port !== '8915') {
    throw new Error('Refusing to change a site outside the local development shop on port 8915.');
  }
  numericVersion(site.woocommerce);
}

export function fileHash(filename) {
  return createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

export function assertSnapshot(snapshot, site, actualHash) {
  assertDevelopmentSite(site);
  if (snapshot.schema !== 1 || snapshot.config !== developmentConfig || snapshot.site.siteUrl !== site.siteUrl || snapshot.site.role !== 'development') {
    throw new Error('This snapshot does not belong to this development shop.');
  }
  if (snapshot.site.wordpress !== site.wordpress || snapshot.site.subscriptions !== site.subscriptions || snapshot.site.plugin !== site.plugin) {
    throw new Error('Restore the matching WordPress, Subscriptions and Trial Coupon versions before restoring this WooCommerce snapshot.');
  }
  numericVersion(snapshot.site.woocommerce);
  if (!/^[a-f0-9]{64}$/.test(snapshot.databaseSHA256) || snapshot.databaseSHA256 !== actualHash) {
    throw new Error('The database snapshot is incomplete or its checksum changed.');
  }
}

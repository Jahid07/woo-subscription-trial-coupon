import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { profile, env, wp } from './demo-environment.mjs';
import { root, local, resolveVersion, ensureVersion, selectVersion, assertDevelopmentSite, assertSnapshot, compareVersions, fileHash, writeJSON, protectLocalStorage } from './woocommerce-versions.mjs';

const selected = profile('development');
const snapshots = path.join(local, 'woocommerce-snapshots');
const previousFile = path.join(local, 'woocommerce-previous-snapshot.json');
const lock = path.join(local, 'woocommerce-version.lock');
const args = process.argv.slice(2);
const [command = 'status', requested] = args;
const snapshotId = /^\d{8}T\d{9}Z-\d+\.\d+(?:\.\d+)?-[a-f0-9]{8}$/;
const bare = arguments_ => wp(selected, [...arguments_, '--skip-plugins', '--skip-themes']);

function siteState() {
  const site = JSON.parse(bare(['eval', `
    $wc = get_file_data(WP_PLUGIN_DIR . '/woocommerce/woocommerce.php', array('version' => 'Version'));
    $wcs = get_file_data(WP_PLUGIN_DIR . '/woocommerce-subscriptions/woocommerce-subscriptions.php', array('version' => 'Version'));
    $plugin = get_file_data(WP_PLUGIN_DIR . '/woo-subscription-trial-coupon/woo-subscription-trial-coupon.php', array('version' => 'Version'));
    echo wp_json_encode(array('siteUrl' => get_option('siteurl'), 'role' => defined('WORKSHOP_DEMO_ROLE') ? WORKSHOP_DEMO_ROLE : 'missing',
      'environment' => wp_get_environment_type(), 'wordpress' => get_bloginfo('version'), 'php' => PHP_VERSION,
      'woocommerce' => $wc['version'], 'database' => get_option('woocommerce_db_version'), 'subscriptions' => $wcs['version'],
      'plugin' => $plugin['version'], 'maintenance' => file_exists(ABSPATH . '.maintenance')));` ]));
  assertDevelopmentSite(site);
  return site;
}

function containerFile(id) {
  return `/var/www/html/wp-content/plugins/woo-subscription-trial-coupon/.local/woocommerce-snapshots/${id}/database.sql`;
}

function loadSnapshot(id) {
  if (!snapshotId.test(id || '')) throw new Error('Choose a snapshot ID from "npm run woo:snapshots", or use "previous".');
  const directory = path.join(snapshots, id);
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'snapshot.json'), 'utf8'));
  if (metadata.id !== id) throw new Error('Snapshot identity does not match its directory.');
  return { directory, metadata };
}

async function backup(site, reason) {
  protectLocalStorage();
  const probe = path.join(local, 'woocommerce-backup-access-check.txt');
  fs.writeFileSync(probe, randomUUID(), { mode: 0o600 });
  try {
    const response = await fetch(`${site.siteUrl}/wp-content/plugins/woo-subscription-trial-coupon/.local/woocommerce-backup-access-check.txt`, { signal: AbortSignal.timeout(15000) });
    if (response.status !== 403) throw new Error('Private backup storage must deny HTTP access before saving a database snapshot.');
  } finally {
    fs.rmSync(probe, { force: true });
  }
  const id = `${new Date().toISOString().replace(/[-:.]/g, '')}-${site.woocommerce}-${randomUUID().slice(0, 8)}`;
  const directory = path.join(snapshots, id);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  console.log(`Backing up WooCommerce ${site.woocommerce} and its database: ${id}`);
  bare(['db', 'export', containerFile(id), '--single-transaction', '--skip-lock-tables', '--add-drop-table']);
  const sql = path.join(directory, 'database.sql');
  if (fs.statSync(sql).size < 100) throw new Error('Database backup is empty. Version was not changed.');
  fs.chmodSync(sql, 0o600);
  const metadata = { schema: 1, id, createdAt: new Date().toISOString(), config: selected.config, reason, site, databaseSHA256: fileHash(sql) };
  writeJSON(path.join(directory, 'snapshot.json'), metadata);
  writeJSON(previousFile, { id });
  return { directory, metadata };
}

function importDatabase(snapshot) {
  // Only explicit snapshot restoration/rollback reaches this; always keep a backup of the outgoing state.
  bare(['db', 'reset', '--yes']);
  bare(['db', 'import', containerFile(snapshot.metadata.id)]);
  bare(['cache', 'flush']);
}

function maintenance(active) {
  bare(['maintenance-mode', active ? 'activate' : 'deactivate']);
}

async function change(site, version, directory, restore = null) {
  let safety;
  let changed = false;
  let recovered = true;
  if (!site.maintenance) maintenance(true);
  try {
    safety = await backup(site, restore ? `before-restore-${restore.metadata.id}` : `before-use-${version}`);
    changed = true;
    env(selected, ['stop']);
    selectVersion(selected, version, directory, site.wordpress);
    env(selected, ['start']);
    if (restore) importDatabase(restore);
    else console.log(wp(selected, ['wc', 'update']));
    const after = siteState();
    if (after.woocommerce !== version) throw new Error(`Expected WooCommerce ${version}, but the container loaded ${after.woocommerce}.`);
    const databaseVersion = restore ? restore.metadata.site.database : version;
    if (after.database !== databaseVersion) throw new Error(`Expected WooCommerce database ${databaseVersion}, but found ${after.database}.`);
    if (after.wordpress !== site.wordpress || after.subscriptions !== site.subscriptions || after.plugin !== site.plugin) throw new Error('Another part of the plugin/WordPress stack changed unexpectedly.');
    console.log(`WooCommerce ${after.woocommerce} is selected at ${after.siteUrl}. Database: ${after.database}.`);
    console.log(`Return to the state before this change: npm run woo:restore -- ${safety.metadata.id}`);
  } catch (error) {
    if (changed && safety) {
      console.error('Switch failed. Restoring the previous WooCommerce package and database.');
      try {
        env(selected, ['stop']);
        const oldDirectory = await ensureVersion(site.woocommerce);
        selectVersion(selected, site.woocommerce, oldDirectory, site.wordpress);
        env(selected, ['start']);
        assertSnapshot(safety.metadata, site, fileHash(path.join(safety.directory, 'database.sql')));
        importDatabase(safety);
        console.error(`Restored WooCommerce ${site.woocommerce} from ${safety.metadata.id}.`);
      } catch (rollbackError) {
        recovered = false;
        console.error(`Automatic recovery failed: ${rollbackError.message}\nRecovery snapshot: ${safety.metadata.id}. The site remains in maintenance mode.`);
        throw new Error(`Version switch failed: ${error.message}`);
      }
    }
    throw error;
  } finally {
    // Preserve maintenance mode if it was already enabled before the command.
    if (!site.maintenance && recovered) maintenance(false);
  }
}

async function main() {
  if (!['status', 'use', 'restore', 'snapshots', 'backup'].includes(command) || args.length > 2) throw new Error('Use woo:status, woo:use -- latest|current|VERSION, woo:backup, woo:snapshots, or woo:restore -- previous|SNAPSHOT_ID.');
  if (command === 'snapshots') {
    const ids = fs.existsSync(snapshots) ? fs.readdirSync(snapshots).filter(id => snapshotId.test(id) && fs.existsSync(path.join(snapshots, id, 'snapshot.json'))).sort().reverse() : [];
    for (const id of ids) {
      const { metadata } = loadSnapshot(id);
      console.log(`${id}  WooCommerce ${metadata.site.woocommerce} / WordPress ${metadata.site.wordpress} / Subscriptions ${metadata.site.subscriptions}  ${metadata.createdAt}`);
    }
    if (!ids.length) console.log('No version-switch snapshots yet. Each switch creates one automatically.');
    return;
  }
  if (command === 'status') {
    console.log(JSON.stringify(siteState(), null, 2));
    return;
  }
  if (!requested && command !== 'backup') throw new Error(`Specify ${command === 'use' ? 'latest, current or a numeric version' : 'previous or a snapshot ID'}.`);
  fs.mkdirSync(local, { recursive: true });
  fs.mkdirSync(lock);
  try {
    writeJSON(path.join(lock, 'owner.json'), { pid: process.pid, startedAt: new Date().toISOString() });
    const site = siteState();
    if (command === 'backup') {
      if (!site.maintenance) maintenance(true);
      try { await backup(site, 'manual-checkpoint'); }
      finally { if (!site.maintenance) maintenance(false); }
      return;
    }
    if (command === 'use') {
      const version = await resolveVersion(requested, site.woocommerce);
      const directory = await ensureVersion(version);
      if (compareVersions(version, site.woocommerce) < 0) throw new Error('Downgrading plugin files alone is unsafe. Use "npm run woo:restore -- previous" or choose a matching saved snapshot.');
      if (version === site.woocommerce) {
        selectVersion(selected, version, directory, site.wordpress);
        console.log(`Keeping WooCommerce ${version} at ${site.siteUrl}. No plugin or database changes.`);
        return;
      }
      const header = fs.readFileSync(path.join(directory, 'woocommerce.php'), 'utf8');
      for (const [label, current] of [['Requires at least', site.wordpress], ['Requires PHP', site.php]]) {
        const minimum = header.match(new RegExp(`${label}:\\s*([\\d.]+)`, 'i'))?.[1];
        if (minimum && compareVersions(current, minimum) < 0) throw new Error(`WooCommerce ${version} requires ${label}: ${minimum}; this site has ${current}.`);
      }
      await change(site, version, directory);
    } else {
      const id = requested === 'previous' ? JSON.parse(fs.readFileSync(previousFile, 'utf8')).id : requested;
      const snapshot = loadSnapshot(id);
      assertSnapshot(snapshot.metadata, site, fileHash(path.join(snapshot.directory, 'database.sql')));
      const directory = await ensureVersion(snapshot.metadata.site.woocommerce);
      console.log('Restoring the database as it was at that snapshot, including its products, orders and accounts. The outgoing state will be backed up first.');
      await change(site, snapshot.metadata.site.woocommerce, directory, snapshot);
    }
  } finally {
    fs.rmSync(lock, { recursive: true, force: true });
  }
}

try { await main(); }
catch (error) {
  console.error(error.code === 'EEXIST' ? 'Another WooCommerce version change is in progress. Check .local/woocommerce-version.lock before retrying.' : error.message);
  process.exitCode = 1;
}

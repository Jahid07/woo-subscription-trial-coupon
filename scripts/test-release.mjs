import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { profile, prepare, env, wp, project, root } from './demo-environment.mjs';
import { runBrowserChecks } from './browser-checks.mjs';
import { assertTestProfile, parsePluginCheck, newFindings, testWooCommerceSource } from './release-review.mjs';

const args = process.argv.slice(2);
if (args.some(arg => !['--subscriptions', '--require-premium'].includes(arg))) throw new Error('Supported arguments: --subscriptions --require-premium.');
const selected = profile('e2e', args);
const directory = path.join(root, `.cache/release-review-${selected.variant}`);
fs.mkdirSync(directory, { recursive: true });
const lock = `${directory}.lock`;
fs.mkdirSync(lock); // Refuse concurrent package runs against the same database.
const overrideFile = path.join(root, selected.config.replace(/\.json$/, '.override.json'));
const originalOverride = fs.existsSync(overrideFile) ? fs.readFileSync(overrideFile) : null;
const report = { startedAt: new Date().toISOString(), profile: selected.config, steps: [], checksPassed: false, readyToPublish: false };
const step = (name, work) => {
  console.log(`\nRelease check: ${name}`);
  try {
    const result = work();
    report.steps.push({ name, passed: true });
    return result;
  } catch (error) {
    report.steps.push({ name, passed: false, error: error.message });
    throw error;
  }
};
const pluginVersion = () => wp(selected, ['plugin', 'get', project.slug, '--field=version']);
const installed = () => JSON.parse(wp(selected, ['plugin', 'list', '--skip-update-check', '--format=json']));
const json = code => JSON.parse(wp(selected, ['eval', code]));
const snapshot = () => json(`$m=get_option('harbor_demo_manifest'); $c=new WC_Coupon('plugin-test-free-trial');
  echo json_encode(array('fixtures'=>$m,'couponId'=>$c->get_id(),'couponType'=>$c->get_discount_type(),
  'trialLength'=>$c->get_meta('_wcsc_coupon_trial_length'),'trialPeriod'=>$c->get_meta('_wcsc_coupon_trial_period'),
  'productTrial'=>isset($m['subscriptionProductId'])?get_post_meta($m['subscriptionProductId'],'_subscription_trial_length',true):null,
  'productPrice'=>isset($m['subscriptionProductId'])?get_post_meta($m['subscriptionProductId'],'_subscription_price',true):null,
  'currency'=>get_option('woocommerce_currency')));`);
function pluginCheck(label) {
  const output = wp(selected, ['plugin', 'check', project.slug, '--mode=update', '--format=json',
    '--require=/var/www/html/wp-content/plugins/plugin-check/cli.php']);
  fs.writeFileSync(path.join(directory, `plugin-check-${label}.txt`), output + '\n');
  return parsePluginCheck(output);
}
let started = false;
try {
  step('Build and validate production ZIP', () => execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' }));
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  if (version.localeCompare(project.publishedBaseline, undefined, { numeric: true }) <= 0) throw new Error('Release candidate must be newer than the published baseline.');
  const zip = `dist/${project.slug}-${version}.zip`;
  report.zip = { filename: zip, sha256: createHash('sha256').update(fs.readFileSync(path.join(root, zip))).digest('hex') };
  await prepare(selected);
  const base = JSON.parse(fs.readFileSync(path.join(root, selected.config), 'utf8'));
  const overrides = fs.existsSync(overrideFile) ? JSON.parse(fs.readFileSync(overrideFile, 'utf8')) : {};
  const merged = { ...base, ...overrides, config: { ...base.config, ...overrides.config }, mappings: { ...base.mappings, ...overrides.mappings } };
  assertTestProfile(selected, merged, project.port);
  const pluginPath = `wp-content/plugins/${project.slug}`;
  if (Object.keys(merged.mappings).some(key => key === pluginPath || key.startsWith(`${pluginPath}/`))) throw new Error('Refusing a source mapping inside the installed plugin.');
  // Install into WordPress's real plugin directory. Never overwrite the source bind mount.
  const plugins = merged.plugins.filter(item => /^https?:/.test(item) || path.resolve(root, item) !== root);
  if (process.env.WC_VERSION) {
    const source = testWooCommerceSource(process.env.WC_VERSION);
    const index = plugins.findIndex(item => path.basename(item) === 'woocommerce'
      || /^https:\/\/downloads\.wordpress\.org\/plugin\/woocommerce(?:\.|\/|$)/.test(item));
    if (index === -1) throw new Error('Cannot identify the WooCommerce test dependency.');
    plugins[index] = source;
  }
  const fixtureRoot = 'wp-content/workshop-release-fixtures';
  const input = path.join(directory, 'input');
  fs.mkdirSync(path.join(input, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(root, zip), path.join(input, 'candidate.zip'));
  fs.copyFileSync(path.join(root, 'scripts/seed-demo.php'), path.join(input, 'scripts/seed-demo.php'));
  fs.copyFileSync(path.join(root, 'project.json'), path.join(input, 'project.json'));
  fs.cpSync(path.join(root, 'tests/fixtures/demo-theme/assets'), path.join(input, 'tests/fixtures/demo-theme/assets'), { recursive: true });
  // A directory mount also works on Docker Desktop's file-sharing backend.
  const mappings = { ...merged.mappings,
    [fixtureRoot]: `./${path.relative(root, input).split(path.sep).join('/')}`,
  };
  fs.writeFileSync(overrideFile, JSON.stringify({ ...overrides, plugins, mappings }, null, 2) + '\n');
  started = true;
  env(selected, ['start']);
  if (wp(selected, ['eval', 'echo WORKSHOP_DEMO_ROLE;']) !== 'e2e'
    || wp(selected, ['option', 'get', 'siteurl']) !== `http://localhost:${selected.port}`) throw new Error('Isolated site role/URL check failed.');
  // Check the actual mount table as well as configuration before deleting/installing files.
  env(selected, ['run', 'cli', 'php', '-r', `$p='/var/www/html/${pluginPath}';
    if(is_link($p)) exit(1); foreach(file('/proc/self/mountinfo') as $line) {
      $m=explode(' ',$line)[4]; if($m===$p || str_starts_with($m,$p.'/')) exit(1);
    }`], true);
  env(selected, ['reset', 'development']);
  env(selected, ['start']);
  const candidate = `/var/www/html/${fixtureRoot}/candidate.zip`;
  step('Fresh ZIP installation and activation', () => {
    if (installed().some(plugin => plugin.name === project.slug)) wp(selected, ['plugin', 'delete', project.slug]);
    wp(selected, ['plugin', 'install', candidate, '--activate']);
    if (pluginVersion() !== version) throw new Error('Installed candidate version does not match.');
  });
  step('Install published baseline and create fixtures', () => {
    wp(selected, ['plugin', 'install', project.baselineDownload, '--force', '--activate']);
    if (pluginVersion() !== project.publishedBaseline) throw new Error('Published baseline version does not match.');
    wp(selected, ['theme', 'activate', 'demo-theme']);
    wp(selected, ['eval-file', `/var/www/html/${fixtureRoot}/scripts/seed-demo.php`, 'refresh']);
    wp(selected, ['rewrite', 'flush', '--hard']);
  });
  const before = snapshot();
  wp(selected, ['plugin', 'install', 'plugin-check', '--version=2.1.0', '--activate']);
  const baseline = step('Plugin Check on published baseline', () => pluginCheck('baseline'));
  step('Upgrade ZIP and retain existing settings', () => {
    wp(selected, ['plugin', 'install', candidate, '--force', '--activate']);
    if (pluginVersion() !== version || JSON.stringify(before) !== JSON.stringify(snapshot())) throw new Error('Upgrade changed saved fixtures or installed the wrong version.');
  });
  const candidateFindings = step('Plugin Check on release candidate', () => pluginCheck('candidate'));
  const introduced = newFindings(baseline, candidateFindings);
  report.pluginCheck = { version: '2.1.0', baseline, candidate: candidateFindings, introduced };
  const pluginsNow = installed();
  const themes = JSON.parse(wp(selected, ['theme', 'list', '--skip-update-check', '--format=json']));
  const environment = { recordedAt: new Date().toISOString(), config: selected.config, role: 'e2e',
    baseURL: `http://localhost:${selected.port}`, wordpress: wp(selected, ['core', 'version']),
    php: wp(selected, ['eval', 'echo PHP_VERSION;']), plugins: pluginsNow, themes, fixtures: before.fixtures,
    hasDivi: false, hasSubscriptions: pluginsNow.some(plugin => plugin.name === 'woocommerce-subscriptions' && plugin.status === 'active') };
  if ((selected.variant === 'subscriptions' || args.includes('--require-premium')) && !environment.hasSubscriptions) throw new Error('Private Subscriptions integration is required but unavailable.');
  fs.writeFileSync(selected.report, JSON.stringify(environment, null, 2) + '\n');
  report.environment = environment;
  report.browser = step('Browser regression tests and fresh error logs', () => {
    const result = runBrowserChecks(selected);
    if (result.status !== 0) throw new Error('Browser tests or fresh error-log checks failed.');
    return result;
  });
  step('Compatibility metadata matches tested WordPress', () => {
    const tested = fs.readFileSync(path.join(root, 'readme.txt'), 'utf8').match(/^Tested up to:\s*(\S+)/mi)?.[1];
    if (tested !== environment.wordpress.split('.').slice(0, 2).join('.')) throw new Error('Update Tested up to after reviewing results for this WordPress version.');
  });
  step('No new Plugin Check findings', () => {
    if (introduced.length) throw new Error(`${introduced.length} new Plugin Check findings; inspect the report.`);
  });
  report.checksPassed = true;
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
  console.error(error.message);
} finally {
  try { if (started) env(selected, ['stop']); }
  catch (error) { report.cleanupError = error.message; process.exitCode = 1; report.checksPassed = false; }
  finally {
    if (originalOverride) fs.writeFileSync(overrideFile, originalOverride);
    else fs.rmSync(overrideFile, { force: true });
    fs.rmdirSync(lock);
  }
  report.finishedAt = new Date().toISOString();
  report.reviewRequired = (report.pluginCheck?.candidate.length || 0) > 0 || !report.environment?.hasSubscriptions;
  // Publishing also requires a reviewed tag/workflow and explicit authorization.
  report.readyToPublish = false;
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const summary = `## Release verification\n\n${report.checksPassed ? 'PASS' : 'FAIL'} — automated package checks.\n\n`
    + report.steps.map(item => `- ${item.passed ? 'PASS' : 'FAIL'}: ${item.name}`).join('\n')
    + `\n\nWordPress: ${report.environment?.wordpress || 'unverified'}. Subscriptions: ${report.environment?.hasSubscriptions ? 'private copy tested' : 'not tested in this run'}.\n`
    + `Plugin Check findings remaining: ${report.pluginCheck?.candidate.length ?? 'unavailable'}; new: ${report.pluginCheck?.introduced.length ?? 'unavailable'}.\n\n`
    + `Stable publication requires review; WordPress.org publishing remains disabled.\n${report.error ? `\nFailure: ${report.error}\n` : ''}`;
  fs.writeFileSync(path.join(directory, 'summary.md'), summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
}

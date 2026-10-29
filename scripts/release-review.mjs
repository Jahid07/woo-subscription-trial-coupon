export function assertTestProfile(selected, config, developmentPort) {
  if (selected.kind !== 'e2e' || !/^\.wp-env\.e2e(?:-subscriptions)?\.json$/.test(selected.config)
    || config.config?.WORKSHOP_DEMO_ROLE !== 'e2e' || config.port !== selected.port
    || config.port === developmentPort || ![8912, 8917].includes(config.port)) {
    throw new Error('Release checks may reset only the isolated coupon E2E profiles.');
  }
}

export function testWooCommerceSource(version) {
  if (version === 'latest') return 'https://downloads.wordpress.org/plugin/woocommerce.zip';
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('WC_VERSION must be latest or a numeric X.Y.Z version.');
  return `https://downloads.wordpress.org/plugin/woocommerce.${version}.zip`;
}

export function readmeProblems(readme, pluginName) {
  const problems = [];
  const title = readme.match(/^=== (.+) ===$/m)?.[1];
  const tags = readme.match(/^Tags:\s*(.+)$/mi)?.[1].split(',').map(tag => tag.trim()).filter(Boolean) || [];
  const description = readme.split(/\r?\n\s*\r?\n/)[1] || '';
  if (title !== pluginName) problems.push('Readme title must match the plugin header.');
  if (tags.length < 1 || tags.length > 5) problems.push('Use one to five relevant tags.');
  if (!description || description.length > 150 || /[*`\[\]<>]/.test(description)) problems.push('Use a plain short description of at most 150 characters.');
  if (Buffer.byteLength(readme) > 10_000) problems.push('Keep the readme below 10 KB.');
  if (!/^Tested up to:\s*\d+\.\d+\s*$/mi.test(readme)) problems.push('Tested up to must use WordPress major.minor format.');
  for (const section of ['Description', 'Installation', 'Frequently Asked Questions', 'Changelog']) {
    if (!readme.includes(`== ${section} ==`)) problems.push(`Missing readme section: ${section}.`);
  }
  return problems;
}

export function parsePluginCheck(output) {
  let file = '';
  const findings = [];
  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith('FILE: ')) file = line.slice(6).trim();
    else if (line.startsWith('[')) {
      for (const row of JSON.parse(line)) {
        if (!row.code || !row.type || !row.message || !file) throw new Error('Invalid Plugin Check findings.');
        findings.push({ file, ...row });
      }
    }
  }
  if (!findings.length && !/No (?:errors|issues|problems)|Checks complete|Success:/i.test(output)) {
    throw new Error('Plugin Check did not produce a readable result.');
  }
  return findings;
}

export function newFindings(baseline, candidate) {
  const key = item => JSON.stringify([item.file, item.type, item.code, item.message]);
  const remaining = new Map();
  for (const item of baseline) remaining.set(key(item), (remaining.get(key(item)) || 0) + 1);
  return candidate.filter(item => {
    const count = remaining.get(key(item)) || 0;
    if (count) remaining.set(key(item), count - 1);
    return !count;
  });
}

export function logProblems(changes) {
  return changes.filter(item => item.truncated || (item.file === 'debug.log' ? item.text.trim()
    : /\b(?:ERROR|CRITICAL|ALERT|EMERGENCY)\b|PHP (?:Fatal|Warning|Deprecated|Notice)|Uncaught /i.test(item.text)));
}

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
if (args.some(arg => !['--subscriptions', '--require-premium'].includes(arg))) throw new Error('Supported arguments: --subscriptions --require-premium.');
const commands = [
  ['composer', ['validate', '--strict']],
  ['composer', ['lint:syntax']],
  ['composer', ['lint']],
  ['npm', ['audit', '--audit-level=high']],
  ['npm', ['run', 'test:tooling']],
  ['npm', ['run', 'test:php']],
  ['npm', ['run', 'test:release', '--', ...args]],
];
const report = { startedAt: new Date().toISOString(), commands: [], passed: true, auditThreshold: 'high' };
fs.mkdirSync(path.join(root, '.cache'), { recursive: true });
try {
  for (const [command, parameters] of commands) {
    console.log(`\nVerify: ${command} ${parameters.join(' ')}`);
    const audit = command === 'npm' && parameters[0] === 'audit';
    const result = spawnSync(command, audit ? [...parameters, '--json'] : parameters, {
      cwd: root, stdio: audit ? 'pipe' : 'inherit', encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    });
    if (audit) {
      fs.writeFileSync(path.join(root, '.cache/npm-audit.json'), result.stdout || result.stderr || 'No audit output.');
      try {
        const details = JSON.parse(result.stdout);
        report.auditVulnerabilities = details.metadata?.vulnerabilities;
        console.log('Dependency audit counts:', JSON.stringify(report.auditVulnerabilities || details.error));
      } catch { console.error(result.stderr || 'npm audit did not return JSON.'); }
    }
    report.commands.push({ command: [command, ...parameters].join(' '), exit: result.status ?? 1 });
    if (result.status !== 0) { report.passed = false; process.exitCode = result.status || 1; break; }
  }
} finally {
  fs.mkdirSync(path.join(root, '.cache'), { recursive: true });
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(root, '.cache/verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`\nVerification ${report.passed ? 'PASSED' : 'FAILED'}. See .cache/verification.json and .cache/release-review-*/summary.md. Publishing remains disabled.`);
}

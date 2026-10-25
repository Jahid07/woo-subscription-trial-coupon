import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const project = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
const cli = path.join(root, 'node_modules/@wordpress/env/bin/wp-env');
const run = args => spawnSync(process.execPath, [cli, '--config=.wp-env.phpunit.json', ...args], { cwd: root, stdio: 'inherit' });
let status = 1;
try {
  const started = run(['start']);
  if (started.status !== 0) throw new Error('The isolated PHPUnit environment failed to start.');
  status = run(['run', 'cli', `--env-cwd=wp-content/plugins/${project.slug}`, 'vendor/bin/phpunit']).status ?? 1;
} finally {
  run(['stop']);
}
process.exitCode = status;

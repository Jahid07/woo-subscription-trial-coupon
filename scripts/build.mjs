import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const project = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
execFileSync(process.execPath, ['scripts/check-release.mjs'], { cwd: root, stdio: 'inherit' });
const version = fs.readFileSync(path.join(root, project.mainFile), 'utf8').match(/^\s*(?:\*\s*)?Version:\s*(\S+)/m)[1];
const dist = path.join(root, 'dist');
const stage = path.join(dist, project.slug);
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
const excludes = fs.readFileSync(path.join(root, '.distignore'), 'utf8').split(/\r?\n/).map(line => line.trim().replace(/^\//, '').replace(/\/$/, '')).filter(Boolean);
const excluded = relative => relative.split('/')[0].startsWith('.') || relative === 'vendor' || excludes.some(item => relative === item || relative.startsWith(`${item}/`));
function copy(directory, relative = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (excluded(name)) continue;
    if (entry.isSymbolicLink()) throw new Error(`Release builds reject symlinks: ${name}`);
    const destination = path.join(stage, name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destination, { recursive: true });
      copy(path.join(directory, entry.name), name);
    } else {
      fs.copyFileSync(path.join(directory, entry.name), destination);
    }
  }
}
copy(root);
// Generate a production-only autoloader from the locked dependency graph.
for (const name of ['composer.json', 'composer.lock']) fs.copyFileSync(path.join(root, name), path.join(stage, name));
execFileSync('composer', ['install', '--no-dev', '--no-plugins', '--no-scripts', '--no-interaction', '--prefer-dist', '--optimize-autoloader'], { cwd: stage, stdio: 'inherit' });
for (const name of ['composer.json', 'composer.lock']) fs.rmSync(path.join(stage, name));
const zip = path.join(dist, `${project.slug}-${version}.zip`);
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-q', '-r', zip, project.slug], { cwd: dist });
const files = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).trim().split('\n');
const forbidden = /\/(?:\.git|\.github|\.local|\.cache|node_modules|tests|scripts|docs|playwright-report|test-results)(?:\/|$)|\/(?:package(?:-lock)?\.json|composer\.(?:json|lock)|project\.json|phpcs-baseline\.json)$|\/vendor\/(?:phpunit|yoast|squizlabs|wp-coding-standards|phpcompatibility|dealerdirect|bin)(?:\/|$)/;
if (files.some(file => forbidden.test(file))) throw new Error('Development or private files leaked into the release ZIP.');
if (!files.includes(`${project.slug}/${project.mainFile}`) || !files.includes(`${project.slug}/vendor/autoload.php`)) throw new Error('Release is missing the entry point or runtime autoloader.');
console.log(`Verified release package: ${zip} (${files.length} entries).`);

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Preview only. No SVN credentials or remote write operations are used here.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const project = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
if (!/^[a-z0-9-]+$/.test(project.slug) || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid plugin slug/version.');
execFileSync(process.execPath, ['scripts/check-release.mjs'], { cwd: root, stdio: 'inherit' });
const build = path.join(root, 'dist', project.slug);
const builtMain = fs.readFileSync(path.join(build, project.mainFile), 'utf8');
const builtReadme = fs.readFileSync(path.join(build, 'readme.txt'), 'utf8');
if (builtMain.match(/^Version:\s*(\S+)/m)?.[1] !== version
  || builtReadme.match(/^Stable tag:\s*(\S+)/m)?.[1] !== version) throw new Error('Build the current production package first.');
function checkTree(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.')
      || ['node_modules', 'tests', 'scripts', 'docs'].includes(entry.name)) throw new Error(`Unexpected preview file: ${entry.name}`);
    if (entry.isDirectory()) checkTree(path.join(directory, entry.name));
  }
}
checkTree(build);
const images = path.join(root, '.wordpress-org');
if (fs.existsSync(images)) checkTree(images);
const output = path.join(root, '.cache/wordpress-org-preview');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const workingCopy = path.join(output, 'svn');
const svn = (command, ...args) => {
  if (!['checkout', 'update', 'add', 'delete', 'copy', 'propset', 'status', 'diff'].includes(command)) throw new Error('This script permits preview operations only.');
  return execFileSync('svn', [command, ...args, '--non-interactive', '--no-auth-cache'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
};
svn('checkout', '--depth=immediates', `https://plugins.svn.wordpress.org/${project.slug}/`, workingCopy);
for (const directory of ['trunk', 'assets']) svn('update', '--set-depth=infinity', path.join(workingCopy, directory));
svn('update', '--set-depth=immediates', path.join(workingCopy, 'tags'));
const target = path.join(workingCopy, 'tags', version);
if (fs.existsSync(target)) throw new Error(`WordPress.org tag ${version} already exists; it will not be overwritten.`);
const compare = (a, b) => a.split('.').map(Number).reduce((result, item, index) => result || Math.sign(item - Number(b.split('.')[index])), 0);
if (fs.readdirSync(path.join(workingCopy, 'tags')).some(tag => /^\d+\.\d+\.\d+$/.test(tag) && compare(tag, version) > 0)) {
  throw new Error('A newer WordPress.org tag exists; downgrades are refused.');
}
execFileSync('rsync', ['-rc', '--delete', `${build}/`, `${workingCopy}/trunk/`]);
if (fs.existsSync(images)) execFileSync('rsync', ['-rc', '--delete', `${images}/`, `${workingCopy}/assets/`]);
svn('add', '--force', workingCopy);
for (const line of svn('status', workingCopy).split('\n')) {
  if (!line.startsWith('!')) continue;
  const filename = line.slice(8);
  if (!filename.startsWith(`${workingCopy}/`)) throw new Error('Unexpected SVN deletion path.');
  svn('delete', '--force', filename);
}
const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
for (const file of fs.readdirSync(path.join(workingCopy, 'assets'), { withFileTypes: true })) {
  if (file.isFile() && types[path.extname(file.name)]) svn('propset', 'svn:mime-type', types[path.extname(file.name)], path.join(workingCopy, 'assets', file.name));
}
svn('copy', path.join(workingCopy, 'trunk'), target);
const status = svn('status', workingCopy).replaceAll(`${workingCopy}/`, '');
const diff = svn('diff', workingCopy).replaceAll(`${workingCopy}/`, '');
fs.writeFileSync(path.join(output, 'status.txt'), status);
fs.writeFileSync(path.join(output, 'changes.diff'), diff);
const summary = `## WordPress.org deployment preview\n\nPlugin: ${project.slug}\n\nVersion: ${version}\n\n`
  + `Prepared local changes to trunk and tags/${version}. `
  + `${fs.existsSync(images) ? 'Listing images were staged from .wordpress-org/.' : 'Existing WordPress.org listing images were retained.'}\n\n`
  + `**Nothing was published. SVN credentials were not used. Write access was not tested.**\n\nSee status.txt and changes.diff in the workflow artifact.\n`;
fs.writeFileSync(path.join(output, 'summary.md'), summary);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const project = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
const main = fs.readFileSync(path.join(root, project.mainFile), 'utf8');
const readme = fs.readFileSync(path.join(root, 'readme.txt'), 'utf8');
const version = main.match(/^\s*(?:\*\s*)?Version:\s*(\S+)/m)?.[1];
const packageVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const stable = readme.match(/^Stable tag:\s*(\S+)/mi)?.[1];
const internal = main.match(/define\(\s*['"][A-Z_]+VERSION['"]\s*,\s*['"]([^'"]+)/)?.[1];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Use a numeric MAJOR.MINOR.PATCH plugin version.');
if (packageVersion !== version) throw new Error('package.json version does not match the plugin.');
if (stable !== version) throw new Error(`Stable tag ${stable} does not match plugin version ${version}.`);
if (internal && internal !== version) throw new Error(`Internal version ${internal} does not match ${version}.`);
if (process.env.RELEASE_VERSION && process.env.RELEASE_VERSION !== version) throw new Error('Requested release version does not match the source.');
if (process.argv.includes('--for-publishing')) {
  const compare = (a, b) => a.split('.').map(Number).reduce((result, item, index) => result || Math.sign(item - Number(b.split('.')[index])), 0);
  if (compare(version, project.publishedBaseline) <= 0) throw new Error('A new release must be higher than the imported published baseline.');
  if (!project.wordpressOrgDeploymentEnabled) throw new Error('WordPress.org publishing is disabled pending release-process review.');
}
console.log(`Version checks passed: ${project.slug} ${version}. Publishing enabled: ${project.wordpressOrgDeploymentEnabled}.`);

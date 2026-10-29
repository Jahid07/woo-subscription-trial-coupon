import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateWordPressRelease } from './wordpress-publish-guards.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mode = process.argv.slice(2);
if (mode.length !== 1 || !['--check', '--publish'].includes(mode[0])) throw new Error('Use --check or --publish in the release workflow.');
const project = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
if (!process.env.GITHUB_EVENT_PATH) throw new Error('A GitHub release event is required.');
validateWordPressRelease(JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')), {
  actions: process.env.GITHUB_ACTIONS, eventName: process.env.GITHUB_EVENT_NAME,
  repository: process.env.GITHUB_REPOSITORY, ref: process.env.GITHUB_REF,
}, project, version);
// Read/build/preparation subprocesses never receive WordPress credentials.
const publicEnv = { ...process.env };
for (const key of ['SVN_USERNAME', 'SVN_PASSWORD', 'GITHUB_STEP_SUMMARY']) delete publicEnv[key];
const run = (command, args) => execFileSync(command, args, { cwd: root, env: publicEnv, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
run('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/master']);
run(process.execPath, ['scripts/check-release.mjs', '--for-publishing']);
if (mode[0] === '--check') {
  console.log(`Stable release ${version} matches merged source; no SVN operation performed.`);
  process.exit(0);
}
const username = process.env.SVN_USERNAME?.trim();
const password = process.env.SVN_PASSWORD;
if (!username || !password || /[\r\n]/.test(password)) throw new Error('Configure SVN_USERNAME and a single-line SVN_PASSWORD repository secret.');
run(process.execPath, ['scripts/preview-wordpress.mjs']);
const directory = path.join(root, '.cache/wordpress-org-preview');
const workingCopy = path.join(directory, 'svn');
const redact = value => String(value || '').replaceAll(password, '[redacted]');
let commit;
try {
  commit = execFileSync('svn', ['commit', workingCopy, '--username', username, '--password-from-stdin',
    '--non-interactive', '--no-auth-cache', '-m', `Release ${version} from GitHub`], {
    cwd: root, env: publicEnv, input: `${password}\n`, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
} catch (error) {
  console.error(redact(error.stdout));
  console.error(redact(error.stderr));
  throw new Error('SVN publication failed. Check the logs and remote tag before retrying.');
}
console.log(redact(commit));
const tagURL = `https://plugins.svn.wordpress.org/${project.slug}/tags/${version}/`;
const remoteReadme = run('svn', ['cat', `${tagURL}readme.txt`, '--non-interactive', '--no-auth-cache']);
const remoteMain = run('svn', ['cat', `${tagURL}${project.mainFile}`, '--non-interactive', '--no-auth-cache']);
if (remoteReadme.match(/^Stable tag:\s*(\S+)/mi)?.[1] !== version
  || remoteMain.match(/^Version:\s*(\S+)/m)?.[1] !== version) throw new Error('SVN commit completed but remote version verification failed; inspect the tag before retrying.');
const summary = `## WordPress.org publication\n\nVersion ${version} was committed to SVN trunk and tags/${version}, with listing images.\n\n`
  + `The remote tag's plugin version and Stable tag were verified. WordPress.org may still require release confirmation and processing before its download/update API changes.\n`;
fs.writeFileSync(path.join(directory, 'publication.md'), summary);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);

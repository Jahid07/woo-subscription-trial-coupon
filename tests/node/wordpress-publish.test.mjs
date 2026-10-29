import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWordPressRelease } from '../../scripts/wordpress-publish-guards.mjs';

const repository = 'Jahid07/woo-subscription-trial-coupon';
const event = { action: 'published', repository: { full_name: repository }, release: { draft: false, prerelease: false, tag_name: '2.0.3' } };
const context = { actions: 'true', eventName: 'release', repository, ref: 'refs/tags/2.0.3' };
const project = { slug: 'woo-subscription-trial-coupon', wordpressOrgDeploymentEnabled: true };
const check = (e = event, c = context, p = project) => validateWordPressRelease(e, c, p, '2.0.3');

test('only a matching published stable version is accepted', () => assert.equal(check(), '2.0.3'));
test('draft, prerelease and non-numeric tags are refused', () => {
  for (const release of [{ ...event.release, draft: true }, { ...event.release, prerelease: true }, { ...event.release, tag_name: 'v2.0.3' }, { ...event.release, tag_name: '2.0.4' }]) {
    assert.throws(() => check({ ...event, release }));
  }
});
test('push, manual, edit, fork, and branch events cannot publish', () => {
  for (const c of [{ ...context, actions: 'false' }, { ...context, eventName: 'push' }, { ...context, eventName: 'workflow_dispatch' }, { ...context, repository: 'someone/fork' }, { ...context, ref: 'refs/heads/master' }]) assert.throws(() => check(event, c));
  assert.throws(() => check({ ...event, action: 'edited' }));
  assert.throws(() => check({ ...event, repository: { full_name: 'someone/fork' } }));
});
test('the project switch and intended plugin slug are enforced', () => {
  assert.throws(() => check(event, context, { ...project, wordpressOrgDeploymentEnabled: false }));
  assert.throws(() => check(event, context, { ...project, slug: 'other-plugin' }));
});

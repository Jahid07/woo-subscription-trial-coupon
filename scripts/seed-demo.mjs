import { profile, prepare, env, seed } from './demo-environment.mjs';
const selected = profile('development', process.argv.slice(2));
await prepare(selected);
env(selected, ['start']);
const fixtures = seed(selected, process.argv.includes('--refresh'));
console.log(`Persistent demo ready: http://localhost:${selected.port}`);
console.log(JSON.stringify(fixtures, null, 2));

import test from 'node:test';
import assert from 'node:assert/strict';
import { rankTools, validateSearch } from '../search.js';

const catalog = [
  { name: 'bash', description: 'Run terminal shell commands.' },
  { name: 'generate_image', description: 'Generate an image from a text prompt.' },
  { name: 'read_image', description: 'Read an existing image.' },
];
test('exact callable name wins over description matches', () => {
  assert.deepEqual(rankTools(catalog, 'generate_image', 1).map(x => x.name), ['generate_image']);
});
test('capability words retrieve shell without copying full schemas', () => {
  assert.deepEqual(rankTools(catalog, 'terminal shell', 2).map(x => x.name), ['bash']);
});
test('unmatched query does not activate arbitrary tools', () => {
  assert.deepEqual(rankTools(catalog, 'zzzznomatch', 2), []);
});
test('limits and query length reject invalid tool JSON', () => {
  for (const args of [{query:''}, {query:'x',limit:0}, {query:'x',limit:1.5}, {query:'x',limit:4}, {query:'x'.repeat(41)}]) {
    assert.throws(() => validateSearch(args, {maxResults:3,maxQueryChars:40}));
  }
  assert.deepEqual(validateSearch({query:' bash ',limit:1}, {maxResults:3,maxQueryChars:40}), {query:'bash',limit:1});
});

// One-off conversion, kept for provenance.
// Reads tests.json from the upstream tag `govuk-final` and writes one file per test case to
// src/test-cases/<slug>.html. The `results` data is dropped on purpose (decision D-003).
// The slug function reproduces getFilename() from the upstream build/generate.js exactly,
// including its quirks (non-global regex replace), so URLs stay unchanged.
//
// Usage: node scripts/import-govuk-tests.mjs

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'test-cases');

function getFilename(catname, testname) {
  return [catname.toLowerCase(), testname.toLowerCase()]
    .join('-')
    .replace(/[^a-z0-9\-\ ]/, '')
    .replace('/', ' ')
    .replace(':', '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const json = execFileSync('git', ['show', 'govuk-final:tests.json'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const tests = JSON.parse(json);

mkdirSync(outDir, { recursive: true });
let count = 0;
let categoryOrder = 0;
for (const category of Object.keys(tests)) {
  categoryOrder += 1;
  let order = 0;
  for (const title of Object.keys(tests[category])) {
    order += 1;
    const slug = getFilename(category, title);
    // JSON strings are valid YAML double-quoted scalars.
    const frontMatter = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `category: ${JSON.stringify(category)}`,
      'origin: govuk-2017',
      `categoryOrder: ${categoryOrder}`,
      `order: ${order}`,
      '---',
      '',
    ].join('\n');
    writeFileSync(join(outDir, `${slug}.html`), frontMatter + tests[category][title].example);
    count += 1;
  }
}
console.log(`Wrote ${count} test cases to ${outDir}`);

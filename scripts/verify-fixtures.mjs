// Verifies that the frozen fixtures in the built site (_site) are byte-identical to the
// upstream tag `govuk-final`. Exits non-zero on any difference. No dependencies.
//
// Checks: every tests/<slug>.html listed at govuk-final, plus the fixture assets
// (assets/javascript/*, assets/stylesheets/tests.css, assets/test_images/*, example-pages/*)
// and the one image tests.css loads (assets/images/important.png).
//
// Usage: npm run build && npm run verify

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '_site');
const TAG = 'govuk-final';

function git(...args) {
  return execFileSync('git', args, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
}

const upstreamFiles = git('ls-tree', '-r', '--name-only', '-z', TAG)
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

const wanted = upstreamFiles.filter(
  (f) =>
    /^tests\/[^/]+\.html$/.test(f) ||
    /^assets\/javascript\/(jquery-1\.12\.0\.min|main)\.js$/.test(f) ||
    f === 'assets/stylesheets/tests.css' ||
    f === 'assets/images/important.png' ||
    f.startsWith('assets/test_images/') ||
    f.startsWith('example-pages/'),
);

const pages = wanted.filter((f) => f.startsWith('tests/'));
let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`FAIL ${msg}`);
};

for (const file of wanted) {
  const built = join(site, file);
  if (!existsSync(built)) {
    fail(`${file}: missing from _site`);
    continue;
  }
  if (!readFileSync(built).equals(git('show', `${TAG}:${file}`))) fail(`${file}: differs from ${TAG}`);
}

// No extra pages in _site/tests that did not exist upstream (an AIL test case would be added
// deliberately, so this is reported as a note, not a failure).
const upstreamPages = new Set(pages);
const extra = existsSync(join(site, 'tests'))
  ? readdirSync(join(site, 'tests')).map((f) => `tests/${f}`).filter((f) => !upstreamPages.has(f))
  : [];
if (extra.length) console.log(`Note: ${extra.length} page(s) in _site/tests not in ${TAG}: ${extra.join(', ')}`);

const assets = wanted.length - pages.length;
if (pages.length !== 142) fail(`expected 142 test pages at ${TAG}, found ${pages.length}`);
if (failures) {
  console.error(`\n${failures} problem(s).`);
  process.exit(1);
}
console.log(`OK: ${pages.length}/142 test pages and ${assets} fixture assets identical to ${TAG}.`);

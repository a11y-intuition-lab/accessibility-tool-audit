// Extracts the GOV.UK results for aXe and HTML_CodeSniffer from tests.json at tag `govuk-final`,
// as the historical baseline for AIL's retest with axe-core and pa11y (decision D-016).
// Values are copied unchanged. Slugs use the same getFilename() as scripts/import-govuk-tests.mjs.
//
// Usage: node scripts/import-govuk-results.mjs

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'data', 'results', 'govuk-2017', 'results.json');
const TOOLS = ['axe', 'codesniffer'];

function getFilename(catname, testname) {
  return [catname.toLowerCase(), testname.toLowerCase()]
    .join('-')
    .replace(/[^a-z0-9\-\ ]/, '')
    .replace('/', ' ')
    .replace(':', '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const tests = JSON.parse(
  execFileSync('git', ['show', 'govuk-final:tests.json'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }),
);

const results = {};
for (const [category, entries] of Object.entries(tests)) {
  for (const [title, test] of Object.entries(entries)) {
    results[getFilename(category, title)] = Object.fromEntries(TOOLS.map((t) => [t, test.results[t]]));
  }
}

const out = {
  meta: {
    origin: 'govuk-2017',
    source: 'tests.json at tag govuk-final (e9e46115caf55f07a9302a5ee187687870510a09)',
    extractedBy: 'scripts/import-govuk-results.mjs',
    tools: {
      axe: {
        name: 'aXe',
        lastTested: '2017-12-23',
        settings: 'All tags (wcag2a, wcag2aa, section508, best-practice, experimental) or the aXe-Coconut extension',
        changelog: [
          '2017-11-23 Fixed broken examples, re-tested and updated 9 results (PR #17)',
          '2017-12-01 Improved 8 tests, re-tested those in all tools (PR #20)',
          '2017-12-23 Re-tested and updated 3 results with experimental features (PR #27)',
        ],
      },
      codesniffer: {
        name: 'HTML_CodeSniffer',
        lastTested: '2017-12-05',
        settings: 'WCAG2AAA standard, errors, warnings and notices',
        changelog: [
          '2017-12-01 Improved 8 tests, re-tested those in all tools (PR #20)',
          '2017-12-05 Re-tested and updated 30 results (PR #21)',
          '2018-04-13 Reclassified warnings as manual checks, no retest (PR #37)',
        ],
      },
    },
    values: {
      error: 'issue found',
      error_paid: 'issue found (paid)',
      warning: 'warning only',
      manual: 'user to check',
      identified: 'noticed but not a fail',
      notfound: 'not found',
    },
    tool_versions: 'Not recorded upstream',
  },
  results,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${Object.keys(results).length} results for ${TOOLS.join(', ')} to ${outFile}`);

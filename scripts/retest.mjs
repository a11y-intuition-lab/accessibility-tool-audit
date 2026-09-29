// Runs axe-core and pa11y (HTML_CodeSniffer) against every generated test page
// and proposes a result per test in the same vocabulary as tests.json.
//
//   npm run retest            add proposals for tests missing from retest.json
//   npm run retest -- --force overwrite every proposal in retest.json
//
// Raw findings are written to results/<date>/ for manual review. A finding on
// a page does not prove the tool found the intended barrier, so every proposal
// in retest.json should be checked by a person before it is committed.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import pa11y from 'pa11y';

const require = createRequire(import.meta.url);
const { getFilename } = require('../build/generate.js');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const date = new Date().toISOString().slice(0, 10);

const AXE_TAGS = [
  'wcag2a', 'wcag2aa', 'wcag2aaa',
  'wcag21a', 'wcag21aa', 'wcag22aa',
  'best-practice'
];
const PA11Y_STANDARD = 'WCAG2AAA';

const versions = {
  axe: require('axe-core/package.json').version,
  pa11y: require('pa11y/package.json').version,
  htmlcs: require('@pa11y/html_codesniffer/package.json').version
};

function pageUrl(file) {
  return pathToFileURL(path.join(root, 'tests', file + '.html')).href;
}

async function runAxe(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    const res = await new AxePuppeteer(page).withTags(AXE_TAGS).analyze();
    const findings = [];
    for (const [type, list] of [['violation', res.violations], ['incomplete', res.incomplete]]) {
      for (const rule of list) {
        for (const node of rule.nodes) {
          findings.push({
            type,
            rule: rule.id,
            impact: node.impact || rule.impact,
            message: rule.help,
            target: node.target.join(' ')
          });
        }
      }
    }
    return findings;
  } finally {
    await page.close();
  }
}

async function runPa11y(browser, url) {
  const res = await pa11y(url, {
    browser,
    runners: ['htmlcs'],
    standard: PA11Y_STANDARD,
    includeWarnings: true,
    includeNotices: true,
    timeout: 30000
  });
  return res.issues.map(i => ({
    type: i.type,
    rule: i.code,
    message: i.message,
    target: i.selector
  }));
}

// Findings that also appear on the empty baseline page come from the page
// template, not from the test case.
const key = f => `${f.type}|${f.rule}|${f.target}`;
const withoutBaseline = (findings, baseline) => findings.filter(f => !baseline.has(key(f)));

function classifyAxe(findings) {
  if (findings.some(f => f.type === 'violation')) return 'error';
  if (findings.some(f => f.type === 'incomplete')) return 'manual';
  return 'notfound';
}

// GDS counted HTML_CodeSniffer warnings as manual checks (changelog, April
// 2018). Notices are generic reminders raised for almost every element, so
// they are kept in the raw findings but do not count.
function classifyPa11y(findings) {
  if (findings.some(f => f.type === 'error')) return 'error';
  if (findings.some(f => f.type === 'warning')) return 'manual';
  return 'notfound';
}

// Markdown table for reviewing the proposals: original result, proposal and
// which rules caused it. HTML_CodeSniffer codes are shortened to the part
// after the guideline, e.g. "1_4_3.G18.Fail".
function summary(tests, raw) {
  const rules = (findings, shorten) => [...new Set(findings.map(f => shorten(f.rule)))].join(', ');
  const htmlcs = code => code.replace(/^WCAG2A+\.Principle\d\.Guideline[\d_]+\./, '');
  const cell = s => String(s ?? '').replace(/\|/g, '\\|');

  const lines = [
    `# Retest ${date}`,
    '',
    `axe-core ${versions.axe}, pa11y ${versions.pa11y} (HTML_CodeSniffer ${versions.htmlcs}, ${PA11Y_STANDARD}).`,
    'Original = result in tests.json (pa11y is compared with codesniffer). Findings on tests/_baseline.html are excluded.',
    '',
    '| Category | Test case | WCAG | axe original | axe proposal | axe rules | codesniffer original | pa11y proposal | pa11y rules |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  ];
  for (const [testname, a] of Object.entries(raw.axe.tests)) {
    const p = raw.pa11y.tests[testname];
    const t = tests[a.category][testname];
    lines.push('| ' + [
      a.category, testname,
      t.wcag ? `${t.wcag.criterion} (${t.wcag.level})` : '',
      t.results?.axe ?? '', a.proposal, rules(a.findings, r => r),
      t.results?.codesniffer ?? '', p.proposal, rules(p.findings, htmlcs)
    ].map(cell).join(' | ') + ' |');
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const tests = JSON.parse(fs.readFileSync(path.join(root, 'tests.json'), 'utf8'));
  const retestPath = path.join(root, 'retest.json');
  const retest = fs.existsSync(retestPath)
    ? JSON.parse(fs.readFileSync(retestPath, 'utf8'))
    : { results: {} };

  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const raw = {
    axe: { tool: 'axe-core', version: versions.axe, tags: AXE_TAGS, date, tests: {} },
    pa11y: { tool: 'pa11y', version: versions.pa11y, runner: 'htmlcs ' + versions.htmlcs, standard: PA11Y_STANDARD, date, tests: {} }
  };

  try {
    const baselineUrl = pageUrl('_baseline');
    const baseline = {
      axe: new Set((await runAxe(browser, baselineUrl)).map(key)),
      pa11y: new Set((await runPa11y(browser, baselineUrl)).map(key))
    };

    const changes = [];
    for (const [cname, category] of Object.entries(tests)) {
      for (const testname of Object.keys(category)) {
        if (only && !testname.toLowerCase().includes(only.toLowerCase())) continue;

        const file = getFilename(cname, testname);
        const url = pageUrl(file);
        const axe = withoutBaseline(await runAxe(browser, url), baseline.axe);
        const pa = withoutBaseline(await runPa11y(browser, url), baseline.pa11y);
        const proposal = { axe: classifyAxe(axe), pa11y: classifyPa11y(pa) };

        raw.axe.tests[testname] = { category: cname, file, proposal: proposal.axe, findings: axe };
        raw.pa11y.tests[testname] = { category: cname, file, proposal: proposal.pa11y, findings: pa };

        const current = retest.results[testname];
        if (!current || force) {
          retest.results[testname] = proposal;
        } else if (current.axe !== proposal.axe || current.pa11y !== proposal.pa11y) {
          changes.push(`${testname}: stored ${JSON.stringify(current)}, proposed ${JSON.stringify(proposal)}`);
        }
        process.stdout.write(`${proposal.axe.padEnd(9)} ${proposal.pa11y.padEnd(9)} ${testname}\n`);
      }
    }

    if (changes.length) {
      console.log(`\n${changes.length} stored result(s) differ from this run (use --force to overwrite):`);
      changes.forEach(c => console.log('  ' + c));
    }
  } finally {
    await browser.close();
  }

  const outDir = path.join(root, 'results', date);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'axe.json'), JSON.stringify(raw.axe, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'pa11y.json'), JSON.stringify(raw.pa11y, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'summary.md'), summary(tests, raw));

  if (!only) {
    if (force || !retest.date) {
      retest.date = date;
      retest.tools = {
        axe: { name: 'axe-core', version: versions.axe },
        pa11y: { name: 'pa11y', version: versions.pa11y, runner: 'HTML_CodeSniffer ' + versions.htmlcs }
      };
    }
    fs.writeFileSync(retestPath, JSON.stringify({ date: retest.date, tools: retest.tools, results: retest.results }, null, 2) + '\n');
  }
  console.log(`\nRaw findings: ${path.relative(root, outDir)}/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

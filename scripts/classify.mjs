// Classifies a stored retest run with the rule mapping (D-005, D-020).
//
//   node scripts/classify.mjs [runDir]
//
// Reads <runDir>/summary.json, axe/<slug>.json and pa11y/<slug>.json (and axe|pa11y/linked-<page>/<slug>.json for each
// linked example page of a test case whose barrier is there: linkedPage or linkedPages) plus data/mappings/test-case-rules.json,
// and writes <runDir>/classification.json. The protocol is wiki/method/classification-protocol.md.
// The output is a pure function of the run and the mapping: sorted keys, no timestamps except the run's own.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runsDir = path.join(root, 'data/results/ail-2026/runs');
const mappingRel = 'data/mappings/test-case-rules.json';
const protocolRel = 'wiki/method/classification-protocol.md';

// Strongest first. error_paid is never produced.
const RANK = { error: 4, warning: 3, manual: 2, identified: 1, notfound: 0 };
const AXE_VALUE = { violations: 'error', incomplete: 'manual' };
// HTML_CodeSniffer warnings become "user to check", as GOV.UK reclassified them on 2018-04-13 (protocol, section 4).
const HTMLCS_VALUE = { error: 'error', warning: 'manual', notice: 'identified' };

function newestRun() {
  const runs = readdirSync(runsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{8}T\d{6}Z$/.test(d.name))
    .map((d) => d.name)
    .sort();
  if (!runs.length) throw new Error(`No runs in ${runsDir}`);
  return path.join(runsDir, runs.at(-1));
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const strongest = (values) => values.reduce((best, v) => (RANK[v] > RANK[best] ? v : best), 'notfound');

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

// The linked example pages of a test case: `linkedPage` (one page) and/or `linkedPages` (a list).
const linkedList = (map) => [...(map.linkedPage ? [map.linkedPage] : []), ...(map.linkedPages ?? [])];

// The pages a test case is judged on: its own page, plus the linked example pages when the barrier is there.
// Each entry: { page: 'test' or the linked page path, file: the output file name in axe/ and pa11y/, linked }.
function pagesFor(slug, map) {
  const pages = [{ page: 'test', file: `${slug}.json` }];
  for (const linked of linkedList(map)) {
    pages.push({ page: linked, file: `linked-${path.basename(linked, '.html')}/${slug}.json`, linked: true });
  }
  return pages;
}

function classifyAxe(dir, pages, rules) {
  const listed = new Set(rules.map((r) => r.rule));
  const evidence = [];
  const ran = new Set();
  for (const { page, file, linked } of pages) {
    const full = path.join(dir, file);
    const label = linked ? `linked page ${page}` : 'page';
    if (!existsSync(full)) return { value: null, evidence: [], reason: `no axe output for the ${label}` };
    const raw = readJson(full);
    if (raw.error || !raw.axe) return { value: null, evidence: [], reason: `axe error on the ${label}: ${raw.error ?? 'no result'}` };
    for (const where of ['violations', 'incomplete']) {
      for (const r of raw.axe[where] ?? []) {
        ran.add(r.id);
        if (listed.has(r.id)) evidence.push({ rule: r.id, where, page, nodes: r.nodes.length, value: AXE_VALUE[where] });
      }
    }
    for (const id of [...(raw.axe.passesRuleIds ?? []), ...(raw.axe.inapplicableRuleIds ?? [])]) ran.add(id);
  }
  const notRun = [...listed].filter((id) => !ran.has(id)).sort();
  evidence.sort((a, b) => a.rule.localeCompare(b.rule) || a.page.localeCompare(b.page) || a.where.localeCompare(b.where));
  return { value: strongest(evidence.map((e) => e.value)), evidence, notRun };
}

function classifyPa11y(dir, pages, codes) {
  const counts = new Map();
  for (const { page, file, linked } of pages) {
    const full = path.join(dir, file);
    const label = linked ? `linked page ${page}` : 'page';
    if (!existsSync(full)) return { value: null, evidence: [], reason: `no pa11y output for the ${label}` };
    const raw = readJson(full);
    if (raw.error || !Array.isArray(raw.issues)) return { value: null, evidence: [], reason: `pa11y error on the ${label}: ${raw.error ?? 'no result'}` };
    for (const issue of raw.issues) {
      const entry = codes.find((c) => c.code === issue.code && (!c.types || c.types.includes(issue.type)));
      if (!entry) continue;
      const key = [issue.code, issue.type, page].join('\u0000');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const evidence = [...counts]
    .map(([key, count]) => {
      const [code, type, page] = key.split('\u0000');
      return { code, type, page, count, value: HTMLCS_VALUE[type] };
    })
    .sort((a, b) => a.code.localeCompare(b.code) || a.page.localeCompare(b.page) || a.type.localeCompare(b.type));
  return { value: strongest(evidence.map((e) => e.value)), evidence };
}

function main() {
  const runDir = path.resolve(process.argv[2] ?? newestRun());
  const summary = readJson(path.join(runDir, 'summary.json'));
  const environment = readJson(path.join(runDir, 'environment.json'));
  const mappingBytes = readFileSync(path.join(root, mappingRel));
  const mapping = JSON.parse(mappingBytes).mappings;

  const results = {};
  for (const slug of Object.keys(summary.pages).sort()) {
    const map = mapping[slug];
    if (!map) throw new Error(`No rule mapping for ${slug} in ${mappingRel}`);
    const pages = pagesFor(slug, map);
    const axe = classifyAxe(path.join(runDir, 'axe'), pages, map.axe);
    const pa11y = classifyPa11y(path.join(runDir, 'pa11y'), pages, map.htmlcs);
    const result = { axe: axe.value, pa11y: pa11y.value, evidence: { axe: axe.evidence, pa11y: pa11y.evidence } };
    if (map.linkedPage) result.linkedPage = map.linkedPage;
    if (map.linkedPages) result.linkedPages = map.linkedPages;
    if (axe.notRun?.length) result.evidence.axeRulesNotRun = axe.notRun;
    const reasons = [axe.reason, pa11y.reason].filter(Boolean);
    if (reasons.length) result.reason = reasons.join('; ');
    results[slug] = result;
  }

  const out = {
    meta: {
      run: summary.runId,
      runStartedAt: environment.startedAt,
      runFinishedAt: environment.finishedAt,
      commit: environment.git?.commit ?? null,
      dirty: environment.git?.dirty ?? null,
      tools: environment.tools,
      browser: environment.browser?.version ?? null,
      mapping: { file: mappingRel, sha256: createHash('sha256').update(mappingBytes).digest('hex') },
      protocol: protocolRel,
      generatedBy: 'scripts/classify.mjs',
      values: { axe: AXE_VALUE, pa11y: HTMLCS_VALUE, order: Object.keys(RANK) },
    },
    results,
  };
  const target = path.join(runDir, 'classification.json');
  writeFileSync(target, `${JSON.stringify(sortKeys(out), null, 2)}\n`);

  const tally = {};
  for (const r of Object.values(results)) {
    for (const tool of ['axe', 'pa11y']) {
      const v = r[tool] ?? 'null';
      tally[tool] ??= {};
      tally[tool][v] = (tally[tool][v] ?? 0) + 1;
    }
  }
  console.log(`Wrote ${path.relative(root, target)} (${Object.keys(results).length} test cases)`);
  for (const [tool, t] of Object.entries(tally)) console.log(`  ${tool}: ${JSON.stringify(sortKeys(t))}`);
}

main();

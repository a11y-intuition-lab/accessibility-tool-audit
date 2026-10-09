#!/usr/bin/env node
// Compute WCAG coverage of the test cases from the stored mapping. Deterministic, no dependencies.
//
// Usage (from the repository root, Node 24):
//   node scripts/wcag/coverage.mjs
//
// Reads  data/wcag/success-criteria.json, data/mappings/test-case-wcag.json
//        data/gap-analysis/candidates.json (optional: candidate counts per SC)
// Writes data/gap-analysis/coverage.json
//
// Definitions (see wiki/method/wcag-mapping.md):
//   covered       SC has at least one test case with relation "fails" that is not marked incidental
//   related-only  SC has no such test case but at least one "related" or incidental "fails" entry
//   uncovered     SC has no entries at all
// Counts are per WCAG version: an SC counts in version v if introduced <= v and (not removed or removed > v).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const scData = read('data/wcag/success-criteria.json');
const mapping = read('data/mappings/test-case-wcag.json');
const candidatesPath = 'data/gap-analysis/candidates.json';
const candidates = existsSync(join(root, candidatesPath)) ? read(candidatesPath).candidates : [];

const VERSIONS = ['2.0', '2.1', '2.2'];
const LEVELS = ['A', 'AA', 'AAA'];
const inVersion = (sc, v) => sc.introduced <= v && (!sc.removed || sc.removed > v);

const perSc = new Map(
  scData.successCriteria.map((sc) => [
    sc.id,
    { id: sc.id, handle: sc.handle, level: sc.level, introduced: sc.introduced, removed: sc.removed,
      fails: [], related: [], incidental: [], candidates: [] },
  ]),
);

const testIds = Object.keys(mapping.mappings).sort();
const testsWithNone = [];
const testSummary = { fails: 0, relatedOnly: 0, none: 0 };
for (const id of testIds) {
  const entries = mapping.mappings[id].wcag;
  for (const e of entries) {
    if (e.relation === 'none') continue;
    const rec = perSc.get(e.sc);
    if (!rec) throw new Error(`Unknown SC ${e.sc} in mapping for ${id}`);
    if (e.incidental) rec.incidental.push(id);
    else if (e.relation === 'fails') rec.fails.push(id);
    else if (e.relation === 'related') rec.related.push(id);
    else throw new Error(`Unknown relation ${e.relation} in ${id}`);
  }
  const core = entries.filter((e) => !e.incidental);
  if (core.some((e) => e.relation === 'fails')) testSummary.fails++;
  else if (core.some((e) => e.relation === 'related')) testSummary.relatedOnly++;
  else { testSummary.none++; testsWithNone.push(id); }
}
for (const c of candidates) for (const sc of c.sc) perSc.get(sc)?.candidates.push(c.id);

const status = (r) =>
  r.fails.length ? 'covered' : r.related.length || r.incidental.length ? 'related-only' : 'uncovered';
const criteria = [...perSc.values()].map((r) => {
  const uniq = (a) => [...new Set(a)].sort();
  return { ...r, fails: uniq(r.fails), related: uniq(r.related), incidental: uniq(r.incidental),
    candidates: uniq(r.candidates), status: status(r) };
});

const summary = {};
for (const v of VERSIONS) {
  summary[v] = {};
  for (const l of [...LEVELS, 'total']) {
    const set = criteria.filter((c) => inVersion(scData.successCriteria.find((s) => s.id === c.id), v)
      && (l === 'total' || c.level === l));
    summary[v][l] = {
      total: set.length,
      covered: set.filter((c) => c.status === 'covered').length,
      relatedOnly: set.filter((c) => c.status === 'related-only').length,
      uncovered: set.filter((c) => c.status === 'uncovered').length,
    };
  }
}

const out = {
  meta: {
    generatedBy: 'scripts/wcag/coverage.mjs',
    inputs: ['data/wcag/success-criteria.json', 'data/mappings/test-case-wcag.json', candidatesPath],
    mappingStatus: mapping.meta.status,
    definitions: {
      covered: 'at least one non-incidental "fails" test case',
      relatedOnly: 'no covering test case, but at least one "related" or incidental entry',
      uncovered: 'no entries',
      version: 'SC counted in version v if introduced <= v and not removed in or before v',
    },
  },
  testCases: { total: testIds.length, ...testSummary, noneIds: testsWithNone },
  summary,
  criteria,
};
writeFileSync(join(root, 'data/gap-analysis/coverage.json'), JSON.stringify(out, null, 2) + '\n');

console.log(`Test cases: ${testIds.length} (fails ${testSummary.fails}, related only ${testSummary.relatedOnly}, none ${testSummary.none})`);
for (const v of VERSIONS) {
  const row = LEVELS.map((l) => `${l} ${summary[v][l].covered}/${summary[v][l].relatedOnly}/${summary[v][l].uncovered}`);
  console.log(`WCAG ${v} (covered/related-only/uncovered): ${row.join('  ')}  total ${summary[v].total.covered}/${summary[v].total.relatedOnly}/${summary[v].total.uncovered} of ${summary[v].total.total}`);
}

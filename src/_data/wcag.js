// WCAG data for the WCAG filter on the test cases and results pages.
// Per test case: the success criteria it is mapped to (incidental mappings excluded), with the level and the WCAG
// versions each criterion belongs to. Sources: data/wcag/success-criteria.json and data/mappings/test-case-wcag*.json.
import { readFileSync, readdirSync } from 'node:fs';

const dataDir = new URL('../../data/', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dataDir), 'utf8'));

const criteria = Object.fromEntries(read('wcag/success-criteria.json').successCriteria.map((sc) => [sc.id, sc]));

const byTest = {};
for (const file of readdirSync(new URL('mappings/', dataDir)).filter((f) => /^test-case-wcag.*\.json$/.test(f)).sort()) {
  for (const [id, m] of Object.entries(read(`mappings/${file}`).mappings)) {
    byTest[id] = m.wcag
      .filter((w) => !w.incidental && criteria[w.sc])
      .map((w) => ({ sc: w.sc, level: criteria[w.sc].level, versions: criteria[w.sc].versions, relation: w.relation }));
  }
}

export default {
  byTest,
  versions: ['2.0', '2.1', '2.2'],
  levels: ['A', 'AA', 'AAA'],
  // EN 301 549 V3.2.1, used by the EU Web Accessibility Directive and European Accessibility Act.
  eu: { version: '2.1', level: 'AA', label: 'EU requirement (WCAG 2.1 AA)' },
};

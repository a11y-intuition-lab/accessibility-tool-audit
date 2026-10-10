// Results shown on results.html.
// Historical: GOV.UK results for aXe and HTML_CodeSniffer (data/results/govuk-2017/results.json, D-016).
// 2026: the scripted classification of AIL retest runs (data/results/ail-2026/runs/<runId>/classification.json,
// written by `npm run classify`, D-020). The newest classified run fills the AIL columns.
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const govuk = read('data/results/govuk-2017/results.json');

// Classified runs, newest first. A run without classification.json is not shown.
const runsDir = 'data/results/ail-2026/runs/';
const runs = (existsSync(new URL(runsDir, root)) ? readdirSync(new URL(runsDir, root), { withFileTypes: true }) : [])
  .filter((d) => d.isDirectory() && existsSync(new URL(`${runsDir}${d.name}/classification.json`, root)))
  .map((d) => d.name)
  .sort()
  .reverse()
  .map((id) => {
    const env = read(`${runsDir}${id}/environment.json`);
    const classification = read(`${runsDir}${id}/classification.json`);
    return {
      id,
      date: env.startedAt.slice(0, 10),
      commit: env.git.commit,
      commitShort: env.git.commit.slice(0, 7),
      dirty: env.git.dirty,
      tools: env.tools,
      browser: env.browser.version,
      node: env.node,
      pages: Object.keys(classification.results).length,
      mappingSha256: classification.meta.mapping.sha256,
      hasSupplement: Boolean(classification.meta.supplement),
      results: classification.results,
    };
  });
const latest = runs[0] ?? null;

const byTest = Object.fromEntries(
  Object.entries(govuk.results).map(([id, r]) => [id, { 'govuk:axe': r.axe, 'govuk:codesniffer': r.codesniffer }]),
);
if (latest) {
  for (const [id, r] of Object.entries(latest.results)) {
    byTest[id] = { ...byTest[id], 'ail:axe': r.axe, 'ail:pa11y': r.pa11y };
    if (latest.hasSupplement) byTest[id]['ail:pa11yAA'] = r.pa11yAA;
  }
}

export default {
  values: govuk.meta.values,
  // Columns in display order; each AIL column sits next to its historical counterpart.
  // `era` is 'then' (GOV.UK 2017) or 'now' (AIL 2026 retest); `engine` groups the two columns of one rule engine.
  columns: [
    { key: 'govuk:axe', label: 'aXe', who: 'GOV.UK', when: '2017', era: 'then', engine: 'axe' },
    { key: 'ail:axe', label: 'axe-core', who: 'AIL', when: '2026', era: 'now', engine: 'axe', version: latest?.tools['axe-core'] },
    { key: 'govuk:codesniffer', label: 'HTML_CodeSniffer', who: 'GOV.UK', when: '2017', era: 'then', engine: 'HTML_CodeSniffer' },
    { key: 'ail:pa11y', label: 'pa11y (HTML_CodeSniffer)', who: 'AIL', when: '2026', era: 'now', engine: 'HTML_CodeSniffer', version: latest?.tools.html_codesniffer },
  ],
  engines: [
    { name: 'axe', span: 2 },
    { name: 'HTML_CodeSniffer', span: 2 },
  ],
  // The supplementary WCAG2AA pass (D-024) has no column of its own: it differs from the main pa11y result on few test
  // cases, so the results page notes it in the pa11y cell where it differs (`ail:pa11yAA` in byTest).
  supplementKey: 'ail:pa11yAA',
  supplementFor: 'ail:pa11y',
  byTest,
  govukMeta: govuk.meta,
  // Run metadata for the page, without the per-test results.
  latest: latest && { ...latest, results: undefined },
  runs: runs.map(({ results, ...run }) => run),
};

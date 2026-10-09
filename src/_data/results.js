// Results shown on results.html.
// Historical: GOV.UK results for aXe and HTML_CodeSniffer (data/results/govuk-2017/results.json, D-016).
// AIL retest results will be added under data/results/ail-2026/ when the retest has run.
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const govuk = read('data/results/govuk-2017/results.json');

export default {
  values: govuk.meta.values,
  // Columns in display order; each AIL column sits next to its historical counterpart.
  columns: [
    { key: 'govuk:axe', label: 'aXe', who: 'GOV.UK', when: '2017' },
    { key: 'ail:axe', label: 'axe-core', who: 'AIL', when: '2026' },
    { key: 'govuk:codesniffer', label: 'HTML_CodeSniffer', who: 'GOV.UK', when: '2017' },
    { key: 'ail:pa11y', label: 'pa11y (HTML_CodeSniffer)', who: 'AIL', when: '2026' },
  ],
  byTest: Object.fromEntries(
    Object.entries(govuk.results).map(([id, r]) => [id, { 'govuk:axe': r.axe, 'govuk:codesniffer': r.codesniffer }]),
  ),
  govukMeta: govuk.meta,
};

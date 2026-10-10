// WCAG filter for the test cases and results pages (progressive enhancement).
// Items carry data-wcag='[{"sc","level","versions","relation"}]' and data-origin (govuk-2017 or ail-2026). State is kept in the URL query string.
(() => {
  const form = document.getElementById('wcag-filter');
  if (!form) return;
  const els = { origin: form.elements.origin, wcag: form.elements.wcag, level: form.elements.level, relation: form.elements.relation };
  const status = form.querySelector('.site-filter-status');
  const items = [...document.querySelectorAll('[data-wcag-item]')].map((el) => ({ el, map: JSON.parse(el.dataset.wcag || '[]'), origin: el.dataset.origin }));
  const groups = [...document.querySelectorAll('[data-wcag-group]')];
  const rank = { A: 1, AA: 2, AAA: 3 };
  const eu = { origin: 'all', wcag: form.dataset.euVersion, level: form.dataset.euLevel, relation: 'fails' };
  const all = { origin: 'all', wcag: 'all', level: 'all', relation: 'related' };
  const original = { ...all, origin: 'govuk-2017' };
  const originLabel = { 'govuk-2017': 'original GOV.UK test cases', 'ail-2026': 'test cases added by AIL' };

  const matches = ({ map, origin }, s) => {
    if (s.origin !== 'all' && origin !== s.origin) return false;
    if (s.wcag === 'all' && s.level === 'all') return true;
    return map.some((m) =>
      (s.relation === 'related' || m.relation === 'fails') &&
      m.relation !== 'none' &&
      (s.level === 'all' || rank[m.level] <= rank[s.level]) &&
      (s.wcag === 'all' || m.versions.includes(s.wcag)));
  };

  const describe = (s) => {
    const who = originLabel[s.origin];
    if (s.wcag === 'all' && s.level === 'all') return who ? `all ${who}` : 'all test cases';
    const v = s.wcag === 'all' ? 'any WCAG version' : `WCAG ${s.wcag}`;
    const l = s.level === 'all' ? 'any level' : `level ${s.level}`;
    return `${who ? `${who}, ` : ''}${v}, ${l}${s.relation === 'fails' ? '' : ', including related'}`;
  };

  function apply(s, { updateUrl = true } = {}) {
    for (const [k, el] of Object.entries(els)) el.value = s[k];
    let shown = 0;
    for (const item of items) {
      const ok = matches(item, s);
      item.el.hidden = !ok;
      if (ok) shown += 1;
    }
    for (const g of groups) g.hidden = !g.querySelector('[data-wcag-item]:not([hidden])');
    status.textContent = `Showing ${shown} of ${items.length} test cases: ${describe(s)}.`;
    document.dispatchEvent(new CustomEvent('wcagfilter', { detail: s }));
    if (updateUrl) {
      const url = new URL(location.href);
      for (const k of Object.keys(els)) url.searchParams.set(k, s[k]);
      history.replaceState(null, '', url);
    }
  }

  const read = () => Object.fromEntries(Object.entries(els).map(([k, el]) => [k, el.value]));
  form.addEventListener('change', () => apply(read()));
  form.addEventListener('submit', (e) => e.preventDefault());
  form.querySelector('[data-filter-preset="eu"]').addEventListener('click', () => apply(eu));
  form.querySelector('[data-filter-preset="original"]').addEventListener('click', () => apply(original));
  form.querySelector('[data-filter-preset="all"]').addEventListener('click', () => apply(all));

  const params = new URLSearchParams(location.search);
  const initial = { ...eu };
  for (const k of Object.keys(els)) {
    const v = params.get(k);
    if (v && [...els[k].options].some((o) => o.value === v)) initial[k] = v;
  }
  form.hidden = false;
  apply(initial, { updateUrl: params.has('wcag') });
})();

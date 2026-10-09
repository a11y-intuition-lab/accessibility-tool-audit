// WCAG filter for the test cases and results pages (progressive enhancement).
// Items carry data-wcag='[{"sc","level","versions","relation"}]'. State is kept in the URL query string.
(() => {
  const form = document.getElementById('wcag-filter');
  if (!form) return;
  const els = { wcag: form.elements.wcag, level: form.elements.level, relation: form.elements.relation };
  const status = form.querySelector('.site-filter-status');
  const items = [...document.querySelectorAll('[data-wcag-item]')].map((el) => ({ el, map: JSON.parse(el.dataset.wcag || '[]') }));
  const groups = [...document.querySelectorAll('[data-wcag-group]')];
  const rank = { A: 1, AA: 2, AAA: 3 };
  const eu = { wcag: form.dataset.euVersion, level: form.dataset.euLevel, relation: 'fails' };
  const all = { wcag: 'all', level: 'all', relation: 'related' };

  const matches = (map, s) => {
    if (s.wcag === 'all' && s.level === 'all') return true;
    return map.some((m) =>
      (s.relation === 'related' || m.relation === 'fails') &&
      m.relation !== 'none' &&
      (s.level === 'all' || rank[m.level] <= rank[s.level]) &&
      (s.wcag === 'all' || m.versions.includes(s.wcag)));
  };

  const describe = (s) => {
    if (s.wcag === 'all' && s.level === 'all') return 'all test cases';
    const v = s.wcag === 'all' ? 'any WCAG version' : `WCAG ${s.wcag}`;
    const l = s.level === 'all' ? 'any level' : `level ${s.level}`;
    return `${v}, ${l}${s.relation === 'fails' ? '' : ', including related'}`;
  };

  function apply(s, { updateUrl = true } = {}) {
    for (const [k, el] of Object.entries(els)) el.value = s[k];
    let shown = 0;
    for (const item of items) {
      const ok = matches(item.map, s);
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

  const read = () => ({ wcag: els.wcag.value, level: els.level.value, relation: els.relation.value });
  form.addEventListener('change', () => apply(read()));
  form.addEventListener('submit', (e) => e.preventDefault());
  form.querySelector('[data-filter-preset="eu"]').addEventListener('click', () => apply(eu));
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

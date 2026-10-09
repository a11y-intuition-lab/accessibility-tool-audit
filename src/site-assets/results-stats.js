// Recomputes the key numbers on the results page for the rows the WCAG filter shows.
(() => {
  const found = new Set(['error', 'error_paid', 'warning']);
  function update() {
    const rows = [...document.querySelectorAll('tr[data-wcag-item]:not([hidden])')];
    const count = document.querySelector('[data-stat-count]');
    if (count) count.textContent = rows.length;
    for (const el of document.querySelectorAll('[data-stat-col]')) {
      const values = rows.map((r) => r.querySelector(`[data-col="${el.dataset.statCol}"]`)?.dataset.value).filter(Boolean);
      el.textContent = values.length ? `${Math.round((values.filter((v) => found.has(v)).length / values.length) * 100)}%` : '–';
    }
  }
  document.addEventListener('wcagfilter', update);
  // The filter script runs first (both are deferred) and has already applied its initial state.
  update();
})();

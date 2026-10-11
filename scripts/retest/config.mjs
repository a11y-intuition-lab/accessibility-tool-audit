// Shared tool configuration for the retest harness (run.mjs) and the blinded-build check (scripts/blind/verify.mjs).
// Both must test pages with exactly the same settings; keep every setting here, not in the scripts.

export const VIEWPORT = { width: 1280, height: 1024 };
export const PAGE_TIMEOUT_MS = 30000;
export const AXE_TIMEOUT_MS = 60000;
export const PA11Y_TIMEOUT_MS = 60000;
export const CHROMIUM_ARGS = ['--no-sandbox'];
// Source text of the HTML stored for each node is capped to keep raw output small (see README). 0 = no cap.
export const MAX_HTML_CHARS = 0;

// Fresh objects on every call: run.mjs fills in run-time values (rule ids, browser path) and stores them verbatim in
// environment.json.
export const makeAxeConfig = () => ({
  // Every rule axe-core ships is enabled (D-021, GOV.UK's "most inquisitive options"): the default rules plus the
  // experimental, AAA and deprecated rules that axe-core disables by default. runOnly is not set. The ids are filled in
  // at run time and stored in environment.json (enabledRuleIds, defaultDisabledRuleIds, experimentalRuleIds).
  resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'],
  enableAllRules: true,
  storedDetail: 'violations and incomplete in full; passes and inapplicable as counts plus rule ids',
});

export const makePa11yConfig = () => ({
  runners: ['htmlcs'],
  standard: 'WCAG2AAA',
  supplementStandard: 'WCAG2AA',
  supplementOutput: 'pa11y-aa/<slug>.json and pa11y-aa/linked-<page>/<slug>.json (D-024)',
  includeWarnings: true,
  includeNotices: true,
  viewport: VIEWPORT,
  timeout: PA11Y_TIMEOUT_MS,
  wait: 0,
  chromeLaunchConfig: { executablePath: '<Playwright Chromium, see environment.browser>', headless: true, args: CHROMIUM_ARGS },
});

// Options passed to pa11y() for one page.
export const pa11yRunOptions = (pa11yConfig, standard, chromiumPath) => ({
  runners: pa11yConfig.runners, standard, includeWarnings: true, includeNotices: true,
  viewport: VIEWPORT, timeout: PA11Y_TIMEOUT_MS, wait: 0,
  chromeLaunchConfig: { executablePath: chromiumPath, headless: true, args: CHROMIUM_ARGS },
});

// Asks axe-core (in a blank page of `browser`) for its rule ids, so every rule can be enabled explicitly.
export async function axeRuleIds(browser, axeSource) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><title>x</title>');
  await page.addScriptTag({ content: axeSource });
  const ids = await page.evaluate(() => ({
    enabledRuleIds: axe.getRules().map((r) => r.ruleId).sort(),
    defaultDisabledRuleIds: axe._audit.rules.filter((r) => r.enabled === false).map((r) => r.id).sort(),
    experimentalRuleIds: axe.getRules(['experimental']).map((r) => r.ruleId).sort(),
  }));
  await ctx.close();
  return ids;
}

// axe.run options that enable every rule.
export const axeRunOptionsFor = (axeConfig, enabledRuleIds) => {
  axeConfig.rules = Object.fromEntries(enabledRuleIds.map((id) => [id, { enabled: true }]));
  return { resultTypes: axeConfig.resultTypes, rules: axeConfig.rules };
};

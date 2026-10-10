// Retest harness: runs axe-core and pa11y (HTML_CodeSniffer) against every test-case page in the BUILT site
// (_site/tests/*.html), each on its own page, served over local HTTP. Stores raw output and an environment record.
// No classification happens here (see scripts/retest/README.md).
//
// Usage:  npm run build && npm run verify && npm run retest
//         npm run retest -- --allow-dirty     (marks the run dirty: true instead of refusing)
//         npm run retest -- --only=<slug>,<slug> --out=<dir>
//                                             (partial check of some pages, written to <dir>; marked partial: true,
//                                              not a publishable run)
//
// A test case whose barrier is on a linked example page (field `linkedPage`, or `linkedPages` for several pages, in
// data/mappings/test-case-rules.json) also has each linked page tested by both tools, stored as
// axe/linked-<page>/<slug>.json and pa11y/linked-<page>/<slug>.json (<page> = file name without .html).
//
// pa11y runs twice on every page: the main pass with HTML_CodeSniffer's WCAG2AAA standard (as GOV.UK in 2017), stored
// in pa11y/, and a supplementary pass with WCAG2AA, stored in pa11y-aa/ (D-024). HTML_CodeSniffer 2.6.0's WCAG2AAA
// ruleset leaves out some sniffs that WCAG2AA has (such as 2.2.1, meta refresh); the supplement catches those.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import { basename, dirname, extname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import pa11y from 'pa11y';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const site = join(root, '_site');
const PREFIX = '/accessibility-tool-audit/';
const FIXTURE_PATHS = ['src', 'assets', 'example-pages'];
const allowDirty = process.argv.includes('--allow-dirty');
const argValue = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const only = argValue('only')?.split(',').filter(Boolean) ?? null;
const outDir = argValue('out') ?? null;
const RULE_MAPPING = 'data/mappings/test-case-rules.json';

// ---- configuration (stored verbatim in environment.json) -------------------------------------------------------
const VIEWPORT = { width: 1280, height: 1024 };
const PAGE_TIMEOUT_MS = 30000;
const AXE_TIMEOUT_MS = 60000;
const PA11Y_TIMEOUT_MS = 60000;
const CHROMIUM_ARGS = ['--no-sandbox'];
// Source text of the HTML stored for each node is capped to keep raw output small (see README). 0 = no cap.
const MAX_HTML_CHARS = 0;

const axeConfig = {
  // Every rule axe-core ships is enabled (D-021, GOV.UK's "most inquisitive options"): the default rules plus the
  // experimental, AAA and deprecated rules that axe-core disables by default. runOnly is not set. The ids are filled in
  // at run time and stored in environment.json (enabledRuleIds, defaultDisabledRuleIds, experimentalRuleIds).
  resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'],
  enableAllRules: true,
  storedDetail: 'violations and incomplete in full; passes and inapplicable as counts plus rule ids',
};
const pa11yConfig = {
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
};

// ---- helpers ----------------------------------------------------------------------------------------------------
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const pkgVersion = (name) => readJson(join(root, 'node_modules', name, 'package.json')).version;
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const iso = (d = new Date()) => d.toISOString();
const writeJson = (p, data) => {
  mkdirSync(dirname(p), { recursive: true });
  // The repository is public: never store the local home directory (it reveals the user name).
  writeFileSync(p, JSON.stringify(data, null, 2).split(os.homedir()).join('~') + '\n');
};
const errMsg = (e) => String((e && e.message) || e).split('\n')[0].slice(0, 500);

function osRelease() {
  try {
    const m = readFileSync('/etc/os-release', 'utf8').match(/^PRETTY_NAME="?([^"\n]+)"?/m);
    if (m) return m[1];
  } catch {}
  return os.type();
}

function frontMatterOrigin(slug) {
  const file = join(root, 'src', 'test-cases', `${slug}.html`);
  if (!existsSync(file)) return 'unknown';
  const m = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const o = m && m[1].match(/^origin:\s*"?([\w-]+)"?\s*$/m);
  return o ? o[1] : 'unknown';
}

// ---- preflight: working tree --------------------------------------------------------------------------------------
const dirtyFiles = git('status', '--porcelain', '--', ...FIXTURE_PATHS).split('\n').filter(Boolean);
const dirty = dirtyFiles.length > 0;
if (dirty && !allowDirty) {
  console.error('Refusing to run: uncommitted changes in ' + FIXTURE_PATHS.join(', ') + ':\n  ' + dirtyFiles.join('\n  '));
  console.error('Commit them, or pass --allow-dirty to run anyway (the run is then marked dirty: true).');
  process.exit(1);
}
if (dirty) console.warn(`WARNING: working tree is dirty (${dirtyFiles.length} entries); this run is marked dirty: true.`);

if (!existsSync(join(site, 'tests'))) {
  console.error('_site/tests not found. Run `npm run build` first.');
  process.exit(1);
}
const allSlugs = readdirSync(join(site, 'tests')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).sort();
if (only) {
  const unknown = only.filter((s) => !allSlugs.includes(s));
  if (unknown.length) { console.error(`Unknown test case(s): ${unknown.join(', ')}`); process.exit(1); }
}
const slugs = only ? allSlugs.filter((s) => only.includes(s)) : allSlugs;

// Linked example pages, from the rule mapping (not hard-coded here). `linkedPage` (one page) and `linkedPages` (a list)
// are both supported; each test case gets a list.
const ruleMapping = readJson(join(root, RULE_MAPPING)).mappings;
const linkedList = (m) => [...(m.linkedPage ? [m.linkedPage] : []), ...(m.linkedPages ?? [])];
const linkedPages = Object.fromEntries(
  Object.entries(ruleMapping).filter(([, m]) => linkedList(m).length).map(([slug, m]) => [slug, linkedList(m)]).sort(),
);
for (const [slug, list] of Object.entries(linkedPages)) {
  for (const page of list) {
    if (!/^example-pages\/(ail\/)?[\w.-]+\.html$/.test(page) || !existsSync(join(site, page))) {
      console.error(`linked page for ${slug} is not a built example page: ${page}`);
      process.exit(1);
    }
  }
  if (new Set(list.map((p) => basename(p))).size !== list.length) {
    console.error(`linked pages for ${slug} must have different file names: ${list.join(', ')}`);
    process.exit(1);
  }
}
// Stored in a subfolder per linked page: linked-<page>/<slug>.json exceeded file-name length limits on some file systems.
const linkedFile = (slug, page) => `linked-${basename(page, '.html')}/${slug}.json`;
const siteFingerprint = sha256(
  slugs.map((s) => s + ':' + sha256(readFileSync(join(site, 'tests', s + '.html')))).join('\n'),
);

// ---- static server ------------------------------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};
const server = createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  if (p.startsWith(PREFIX)) p = '/' + p.slice(PREFIX.length); // serve _site both at / and at the Pages prefix
  let file = normalize(join(site, p));
  if (file !== site && !file.startsWith(site + sep)) { res.writeHead(403).end(); return; }
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    const body = readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}${PREFIX}`;

// ---- preflight: a test page's assets must load -----------------------------------------------------------------
{
  const html = readFileSync(join(site, 'tests', slugs[0] + '.html'), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\.\.\/assets\/[^"]+)"/g)].map((m) => m[1]);
  for (const a of assets) {
    const url = new URL(a, `${base}tests/${slugs[0]}.html`).href;
    const status = (await fetch(url)).status;
    console.log(`asset check ${status} ${url}`);
    if (status !== 200) { server.close(); throw new Error(`asset ${url} returned ${status}`); }
  }
}

// ---- environment --------------------------------------------------------------------------------------------------
const started = new Date();
const runId = iso(started).replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const runDir = outDir ? join(outDir, runId) : join(root, 'data', 'results', 'ail-2026', 'runs', runId);
mkdirSync(join(runDir, 'axe'), { recursive: true });
mkdirSync(join(runDir, 'pa11y'), { recursive: true });
mkdirSync(join(runDir, 'pa11y-aa'), { recursive: true });

const chromiumPath = chromium.executablePath();
if (!existsSync(chromiumPath)) {
  server.close();
  console.error('Chromium not installed. Run `npm run retest:browsers` first.');
  process.exit(1);
}
pa11yConfig.chromeLaunchConfig.executablePath = chromiumPath;

const axeSource = readFileSync(join(root, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const browser = await chromium.launch({ executablePath: chromiumPath, args: CHROMIUM_ARGS });
const chromiumVersion = browser.version();
const browsersJson = readJson(join(root, 'node_modules', 'playwright-core', 'browsers.json'));
const chromiumEntry = browsersJson.browsers.find((b) => b.name === 'chromium');

// Enable every rule axe-core ships, including those it disables by default (experimental, AAA, deprecated).
let enabledRuleIds, defaultDisabledRuleIds, experimentalRuleIds;
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><title>x</title>');
  await page.addScriptTag({ content: axeSource });
  ({ enabledRuleIds, defaultDisabledRuleIds, experimentalRuleIds } = await page.evaluate(() => ({
    enabledRuleIds: axe.getRules().map((r) => r.ruleId).sort(),
    defaultDisabledRuleIds: axe._audit.rules.filter((r) => r.enabled === false).map((r) => r.id).sort(),
    experimentalRuleIds: axe.getRules(['experimental']).map((r) => r.ruleId).sort(),
  })));
  await ctx.close();
}
axeConfig.rules = Object.fromEntries(enabledRuleIds.map((id) => [id, { enabled: true }]));
const axeRunOptions = { resultTypes: axeConfig.resultTypes, rules: axeConfig.rules };

let commit = git('rev-parse', 'HEAD').trim();
const environment = {
  runId,
  startedAt: iso(started),
  finishedAt: null,
  partial: only ? { only: slugs, note: 'Partial check with --only; not a publishable run.' } : false,
  git: { commit, dirty, dirtyFiles, checkedPaths: FIXTURE_PATHS },
  site: { servedFrom: '_site', testPages: slugs.length, testPagesSha256: siteFingerprint, pathPrefix: PREFIX, localPort: port },
  linkedPages: {
    source: `${RULE_MAPPING} (fields linkedPage and linkedPages)`,
    sha256: sha256(readFileSync(join(root, RULE_MAPPING))),
    pages: Object.fromEntries(Object.entries(linkedPages).filter(([s]) => slugs.includes(s))),
    output: 'axe/linked-<page>/<slug>.json and pa11y/linked-<page>/<slug>.json',
  },
  node: process.version,
  npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
  os: { pretty: osRelease(), platform: os.platform(), release: os.release(), arch: os.arch() },
  browser: {
    name: 'Chromium (installed by `playwright-core install chromium`)',
    version: chromiumVersion,
    playwrightRevision: chromiumEntry && chromiumEntry.revision,
    executable: relative(dirname(dirname(chromiumPath)), chromiumPath),
    sharedBy: ['axe-core (via Playwright)', 'pa11y (via puppeteer, executablePath)'],
    args: CHROMIUM_ARGS,
  },
  tools: {
    'axe-core': pkgVersion('axe-core'),
    pa11y: pkgVersion('pa11y'),
    'html_codesniffer': pkgVersion('@pa11y/html_codesniffer'),
    'playwright-core': pkgVersion('playwright-core'),
    puppeteer: pkgVersion('puppeteer'),
  },
  config: {
    viewport: VIEWPORT,
    pageLoad: { waitUntil: 'load', timeoutMs: PAGE_TIMEOUT_MS },
    axe: { ...axeConfig, enabledRuleIds, defaultDisabledRuleIds, experimentalRuleIds, runOptions: axeRunOptions },
    pa11y: pa11yConfig,
    maxHtmlChars: MAX_HTML_CHARS,
    concurrency: 1,
    ordering: 'alphabetical by slug',
  },
  network: {
    access: true,
    note: 'The run had internet access. Fixture pages embed some remote resources (e.g. YouTube, remote media); they were not blocked. Failed requests are recorded per page in axe/<slug>.json.',
  },
};
writeJson(join(runDir, 'environment.json'), environment);

// ---- per-page runs ------------------------------------------------------------------------------------------------
const cap = (s) => (MAX_HTML_CHARS && typeof s === 'string' && s.length > MAX_HTML_CHARS ? s.slice(0, MAX_HTML_CHARS) + '…[truncated]' : s);
const mapNode = (n) => ({
  target: n.target,
  html: cap(n.html),
  impact: n.impact ?? null,
  failureSummary: n.failureSummary ?? null,
  checks: { any: (n.any || []).map((c) => c.id), all: (n.all || []).map((c) => c.id), none: (n.none || []).map((c) => c.id) },
});
const mapRule = (r) => ({
  id: r.id, impact: r.impact ?? null, tags: r.tags, description: r.description, help: r.help, helpUrl: r.helpUrl,
  nodes: r.nodes.map(mapNode),
});

async function runAxe(slug, origin, url) {
  const t0 = Date.now();
  const out = { tool: 'axe-core', version: environment.tools['axe-core'], slug, origin, url, startedAt: iso(), error: null };
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  const failedRequests = [];
  const localNon200 = [];
  page.on('requestfailed', (r) => failedRequests.push({ url: r.url(), resourceType: r.resourceType(), failure: r.failure()?.errorText ?? null }));
  page.on('response', (r) => {
    if (r.url().startsWith(`http://127.0.0.1:${port}/`) && r.status() !== 200) localNon200.push({ url: r.url(), status: r.status() });
  });
  try {
    const resp = await page.goto(url, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });
    out.httpStatus = resp ? resp.status() : null;
    await page.addScriptTag({ content: axeSource });
    const r = await Promise.race([
      page.evaluate((opts) => axe.run(document, opts), axeRunOptions),
      new Promise((_, rej) => setTimeout(() => rej(new Error(`axe.run timed out after ${AXE_TIMEOUT_MS} ms`)), AXE_TIMEOUT_MS)),
    ]);
    out.axe = {
      testEngine: r.testEngine, testRunner: r.testRunner, timestamp: r.timestamp,
      violations: r.violations.map(mapRule),
      incomplete: r.incomplete.map(mapRule),
      passesCount: r.passes.length, passesRuleIds: r.passes.map((x) => x.id).sort(),
      inapplicableCount: r.inapplicable.length, inapplicableRuleIds: r.inapplicable.map((x) => x.id).sort(),
    };
  } catch (e) {
    out.error = errMsg(e);
  } finally {
    out.failedRequests = failedRequests;
    out.localNon200 = localNon200;
    out.durationMs = Date.now() - t0;
    await ctx.close().catch(() => {});
  }
  return out;
}

async function runPa11y(slug, origin, url, standard = pa11yConfig.standard) {
  const t0 = Date.now();
  const out = { tool: 'pa11y', version: environment.tools.pa11y, htmlcsVersion: environment.tools.html_codesniffer, standard, slug, origin, url, startedAt: iso(), error: null };
  try {
    const r = await pa11y(url, {
      runners: pa11yConfig.runners, standard, includeWarnings: true, includeNotices: true,
      viewport: VIEWPORT, timeout: PA11Y_TIMEOUT_MS, wait: 0,
      chromeLaunchConfig: { executablePath: chromiumPath, headless: true, args: CHROMIUM_ARGS },
    });
    out.documentTitle = r.documentTitle;
    out.issues = r.issues.map((i) => ({
      code: i.code, type: i.type, typeCode: i.typeCode, message: i.message, selector: i.selector, context: cap(i.context),
    }));
  } catch (e) {
    out.error = errMsg(e);
  }
  out.durationMs = Date.now() - t0;
  return out;
}

const count = (p, t) => (p.issues ? p.issues.filter((x) => x.type === t).length : null);
const pa11ySummary = (p) => (p.error ? { error: p.error } : { errors: count(p, 'error'), warnings: count(p, 'warning'), notices: count(p, 'notice') });
const pageSummary = (a, p, pAA) => ({
  axe: a.error ? { error: a.error } : { violations: a.axe.violations.length, incomplete: a.axe.incomplete.length, passes: a.axe.passesCount, inapplicable: a.axe.inapplicableCount },
  pa11y: pa11ySummary(p),
  pa11yAA: pa11ySummary(pAA),
  failedRequests: a.failedRequests.length,
  localNon200: a.localNon200.length,
});
const pageLine = (a, p) =>
  `axe ${a.error ? 'ERROR ' + a.error : a.axe.violations.length + 'v/' + a.axe.incomplete.length + 'i'} | pa11y ${p.error ? 'ERROR ' + p.error : count(p, 'error') + 'e/' + count(p, 'warning') + 'w/' + count(p, 'notice') + 'n'}`;

const summary = { runId, pages: {}, totals: {} };
let i = 0;
for (const slug of slugs) {
  i++;
  const origin = frontMatterOrigin(slug);
  const url = `${base}tests/${slug}.html`;
  const a = await runAxe(slug, origin, url);
  const p = await runPa11y(slug, origin, url);
  const pAA = await runPa11y(slug, origin, url, pa11yConfig.supplementStandard);
  writeJson(join(runDir, 'axe', `${slug}.json`), a);
  writeJson(join(runDir, 'pa11y', `${slug}.json`), p);
  writeJson(join(runDir, 'pa11y-aa', `${slug}.json`), pAA);
  summary.pages[slug] = { origin, ...pageSummary(a, p, pAA) };
  console.log(`[${i}/${slugs.length}] ${slug} (${origin}) ${pageLine(a, p)}`);
  const linkedSummaries = [];
  for (const linkedPage of linkedPages[slug] ?? []) {
    const linkedUrl = `${base}${linkedPage}`;
    const la = await runAxe(slug, origin, linkedUrl);
    const lp = await runPa11y(slug, origin, linkedUrl);
    const lpAA = await runPa11y(slug, origin, linkedUrl, pa11yConfig.supplementStandard);
    la.linkedPage = lp.linkedPage = lpAA.linkedPage = linkedPage;
    writeJson(join(runDir, 'axe', linkedFile(slug, linkedPage)), la);
    writeJson(join(runDir, 'pa11y', linkedFile(slug, linkedPage)), lp);
    writeJson(join(runDir, 'pa11y-aa', linkedFile(slug, linkedPage)), lpAA);
    linkedSummaries.push({ page: linkedPage, ...pageSummary(la, lp, lpAA) });
    console.log(`        linked ${linkedPage} ${pageLine(la, lp)}`);
  }
  // One linked page: an object, as before; several: a list.
  if (linkedSummaries.length === 1) summary.pages[slug].linked = linkedSummaries[0];
  else if (linkedSummaries.length > 1) summary.pages[slug].linked = linkedSummaries;
}
await browser.close();
server.close();

const pages = Object.values(summary.pages);
summary.totals = {
  pages: pages.length,
  byOrigin: pages.reduce((m, x) => ((m[x.origin] = (m[x.origin] || 0) + 1), m), {}),
  axeLoadFailures: pages.filter((x) => x.axe.error).length,
  pa11yLoadFailures: pages.filter((x) => x.pa11y.error).length,
  axeViolations: pages.reduce((n, x) => n + (x.axe.violations || 0), 0),
  axeIncomplete: pages.reduce((n, x) => n + (x.axe.incomplete || 0), 0),
  pa11yErrors: pages.reduce((n, x) => n + (x.pa11y.errors || 0), 0),
  pa11yWarnings: pages.reduce((n, x) => n + (x.pa11y.warnings || 0), 0),
  pa11yNotices: pages.reduce((n, x) => n + (x.pa11y.notices || 0), 0),
  pa11yAALoadFailures: pages.filter((x) => x.pa11yAA.error).length,
  pa11yAAErrors: pages.reduce((n, x) => n + (x.pa11yAA.errors || 0), 0),
  pa11yAAWarnings: pages.reduce((n, x) => n + (x.pa11yAA.warnings || 0), 0),
  pa11yAANotices: pages.reduce((n, x) => n + (x.pa11yAA.notices || 0), 0),
  pagesWithFailedRequests: pages.filter((x) => x.failedRequests > 0).length,
  pagesWithLocalNon200: pages.filter((x) => x.localNon200 > 0).length,
  linkedPagesTested: pages.flatMap((x) => (x.linked ? [].concat(x.linked) : [])).length,
  linkedPageLoadFailures: pages.flatMap((x) => (x.linked ? [].concat(x.linked) : [])).filter((l) => l.axe.error || l.pa11y.error).length,
};
writeJson(join(runDir, 'summary.json'), summary);
environment.finishedAt = iso();
writeJson(join(runDir, 'environment.json'), environment);
console.log(`Done. ${runDir}\n` + JSON.stringify(summary.totals, null, 2));

// Checks that blinding (D-026) does not change the experiment: runs axe-core and pa11y (HTML_CodeSniffer WCAG2AAA)
// with the retest harness configuration (scripts/retest/config.mjs) on every original test page and linked example
// page and on its blinded copy, and compares the results. Also compares full-page screenshots of each test page.
//
// Usage:  npm run build && npm run blind:build && npm run blind:verify
//         npm run blind:verify -- --only=<slug>,<slug> --concurrency=4
//
// Writes .blind/verify.json. Exit code 1 if any difference is not an expected one (see EXPECTED below).

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import pa11y from 'pa11y';
import {
  AXE_TIMEOUT_MS, CHROMIUM_ARGS, PAGE_TIMEOUT_MS, VIEWPORT,
  axeRuleIds, axeRunOptionsFor, makeAxeConfig, makePa11yConfig, pa11yRunOptions,
} from '../retest/config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argValue = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const only = argValue('only')?.split(',').filter(Boolean) ?? null;
const concurrency = Number(argValue('concurrency') ?? 4);
const PIXEL_REPORT_SHARE = 0.005;

// Differences that blinding is meant to cause: the template <title> text and the template <h1> text on test pages.
// Only rules whose outcome can depend on that text are listed. A difference in any other rule is unexpected.
const EXPECTED = {
  axe: new Set(['document-title', 'page-has-heading-one', 'empty-heading', 'empty-title']),
  htmlcs: (code) => /\.H25\.|\.2_4_2\./.test(code),
};

const key = JSON.parse(readFileSync(join(root, '.blind', 'key.json'), 'utf8'));
const slugToId = Object.fromEntries(Object.entries(key.pages).map(([id, slug]) => [slug, id]));
const exToId = Object.fromEntries(Object.entries(key.examplePages).map(([id, p]) => [p, id]));

// ---- pages to compare ---------------------------------------------------------------------------------------------------
const ruleMapping = JSON.parse(readFileSync(join(root, 'data/mappings/test-case-rules.json'), 'utf8')).mappings;
let slugs = Object.keys(slugToId).sort();
if (only) slugs = slugs.filter((s) => only.includes(s));
const jobs = slugs.map((slug) => ({ kind: 'test', name: slug, orig: `tests/${slug}.html`, blind: `p/${slugToId[slug]}.html` }));
const linked = new Set();
for (const slug of slugs) {
  const m = ruleMapping[slug] ?? {};
  for (const p of [...(m.linkedPage ? [m.linkedPage] : []), ...(m.linkedPages ?? [])]) linked.add(p);
}
for (const p of [...linked].sort()) {
  if (!exToId[p]) { console.error(`linked page ${p} is not in the blinded build`); process.exit(1); }
  jobs.push({ kind: 'linked', name: p, orig: p, blind: `x/${exToId[p]}.html` });
}

// ---- servers (same simple static server for both, as in run.mjs) ---------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.wav': 'audio/wav', '.webm': 'video/webm', '.vtt': 'text/vtt', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
async function serve(dir) {
  const server = createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
    const file = normalize(join(dir, p));
    if (!file.startsWith(dir + sep)) { res.writeHead(403).end(); return; }
    try {
      if (!statSync(file).isFile()) throw new Error();
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(readFileSync(file));
    } catch { res.writeHead(404).end('not found'); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${server.address().port}/` };
}
const S = { orig: await serve(join(root, '_site')), blind: await serve(join(root, 'testing-kit', '.site')) };

// ---- tools -------------------------------------------------------------------------------------------------------------
const chromiumPath = chromium.executablePath();
const axeSource = readFileSync(join(root, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const browser = await chromium.launch({ executablePath: chromiumPath, args: CHROMIUM_ARGS });
const axeConfig = makeAxeConfig();
const pa11yConfig = makePa11yConfig();
const { enabledRuleIds } = await axeRuleIds(browser, axeSource);
const axeRunOptions = axeRunOptionsFor(axeConfig, enabledRuleIds);

async function runAxe(url, base) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  const localNon200 = [];
  page.on('response', (r) => { if (r.url().startsWith(base) && r.status() !== 200) localNon200.push(r.url().slice(base.length) + ' ' + r.status()); });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });
    await page.addScriptTag({ content: axeSource });
    const r = await Promise.race([
      page.evaluate((opts) => axe.run(document, opts), axeRunOptions),
      new Promise((_, rej) => setTimeout(() => rej(new Error('axe timeout')), AXE_TIMEOUT_MS)),
    ]);
    const out = {};
    for (const where of ['violations', 'incomplete', 'passes', 'inapplicable']) for (const x of r[where]) out[`${x.id}|${where}`] = x.nodes.length;
    return { results: out, localNon200: localNon200.length };
  } catch (e) {
    return { error: String(e.message || e).split('\n')[0], localNon200: localNon200.length };
  } finally { await ctx.close().catch(() => {}); }
}

async function runPa11y(url) {
  try {
    const r = await pa11y(url, pa11yRunOptions(pa11yConfig, pa11yConfig.standard, chromiumPath));
    const out = {};
    for (const i of r.issues) out[`${i.code}|${i.type}`] = (out[`${i.code}|${i.type}`] ?? 0) + 1;
    return { results: out };
  } catch (e) { return { error: String(e.message || e).split('\n')[0] }; }
}

async function screenshot(url) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });
    const box = await page.evaluate(() => {
      const h = document.querySelector('body > h1');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return { top: Math.floor(r.top + scrollY), bottom: Math.ceil(r.bottom + scrollY) };
    });
    const png = await page.screenshot({ fullPage: true });
    return { png: png.toString('base64'), box };
  } finally { await ctx.close().catch(() => {}); }
}

// Pixel comparison in the browser (no image library needed). The area above the h1 is compared directly; the area
// below it is aligned at the bottom edge of each page's h1 (the h1 text, and so its height, differs by design).
const cmpCtx = await browser.newContext();
const cmpPage = await cmpCtx.newPage();
async function comparePngs(a, b) {
  return cmpPage.evaluate(async ({ a, b }) => {
    const load = async (s) => {
      const img = await createImageBitmap(await (await fetch('data:image/png;base64,' + s.png)).blob());
      const c = new OffscreenCanvas(img.width, img.height);
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      return { w: img.width, h: img.height, d: x.getImageData(0, 0, img.width, img.height).data, box: s.box ?? { top: 0, bottom: 0 } };
    };
    const A = await load(a);
    const B = await load(b);
    const w = Math.min(A.w, B.w);
    let diff = 0;
    const rows = (ya, yb, n) => {
      for (let r = 0; r < n; r++) {
        const oa = (ya + r) * A.w * 4;
        const ob = (yb + r) * B.w * 4;
        for (let x = 0; x < w * 4; x += 4) {
          if (Math.abs(A.d[oa + x] - B.d[ob + x]) > 8 || Math.abs(A.d[oa + x + 1] - B.d[ob + x + 1]) > 8 || Math.abs(A.d[oa + x + 2] - B.d[ob + x + 2]) > 8) diff++;
        }
      }
    };
    const topRows = Math.min(A.box.top, B.box.top);
    rows(0, 0, topRows);
    const belowA = A.h - A.box.bottom;
    const belowB = B.h - B.box.bottom;
    const below = Math.min(belowA, belowB);
    rows(A.box.bottom, B.box.bottom, below);
    const areaA = A.w * (A.h - (A.box.bottom - A.box.top));
    const areaB = B.w * (B.h - (B.box.bottom - B.box.top));
    const compared = w * (topRows + below);
    const total = Math.max(areaA, areaB);
    diff += total - compared; // rows or columns only one image has
    return { share: total ? diff / total : 0, size: [A.w, A.h, B.w, B.h], h1: [A.box, B.box] };
  }, { a, b });
}

// ---- compare ---------------------------------------------------------------------------------------------------------------
function diffMaps(o, b) {
  const out = [];
  for (const k of new Set([...Object.keys(o), ...Object.keys(b)])) if ((o[k] ?? 0) !== (b[k] ?? 0)) out.push({ key: k, original: o[k] ?? 0, blinded: b[k] ?? 0 });
  return out;
}
async function compareTool(tool, job) {
  const run = (which) => (tool === 'axe' ? runAxe(S[which].base + job[which], S[which].base) : runPa11y(S[which].base + job[which]));
  let attempt = 0;
  let firstDiffs = null;
  while (attempt < 2) {
    const [o, b] = [await run('orig'), await run('blind')];
    const diffs = [];
    if (o.error || b.error) diffs.push({ key: 'error', original: o.error ?? null, blinded: b.error ?? null });
    else diffs.push(...diffMaps(o.results, b.results));
    if (tool === 'axe' && o.localNon200 !== b.localNon200) diffs.push({ key: 'local non-200 responses', original: o.localNon200, blinded: b.localNon200 });
    for (const d of diffs) {
      const rule = d.key.split('|')[0];
      d.expected = tool === 'axe' ? EXPECTED.axe.has(rule) : EXPECTED.htmlcs(rule);
      if (job.kind !== 'test') d.expected = false; // nothing is blinded on example pages but names and comments
    }
    const unexpected = diffs.filter((d) => !d.expected);
    if (!unexpected.length) return { diffs, nondeterministic: firstDiffs };
    if (firstDiffs) return { diffs, nondeterministic: null, firstDiffs };
    firstDiffs = diffs; // rerun once: timers and animations can make a single run differ
    attempt++;
  }
}

const report = { checkedAt: new Date().toISOString(), sourceCommit: key.sourceCommit, blindBuiltAt: key.builtAt, viewport: VIEWPORT, pages: {}, summary: {} };
const t0 = Date.now();
let done = 0;
async function worker(queue) {
  while (queue.length) {
    const job = queue.shift();
    const axeR = await compareTool('axe', job);
    const paR = await compareTool('pa11y', job);
    const entry = { kind: job.kind, blinded: job.blind, axe: axeR, pa11y: paR };
    if (job.kind === 'test') {
      try {
        const [a, b] = [await screenshot(S.orig.base + job.orig), await screenshot(S.blind.base + job.blind)];
        entry.pixels = await comparePngs(a, b);
      } catch (e) { entry.pixels = { error: String(e.message || e).split('\n')[0] }; }
    }
    report.pages[job.name] = entry;
    done++;
    const bad = [...axeR.diffs, ...paR.diffs].filter((d) => !d.expected).length;
    console.log(`[${done}/${jobs.length}] ${job.name}${bad ? ` UNEXPECTED ${bad}` : ''}${axeR.diffs.length + paR.diffs.length - bad ? ' expected diffs' : ''}${entry.pixels?.share > PIXEL_REPORT_SHARE ? ` pixels ${(entry.pixels.share * 100).toFixed(2)}%` : ''}`);
  }
}
const queue = [...jobs];
await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker(queue)));
await browser.close();
S.orig.server.close();
S.blind.server.close();

// ---- summary --------------------------------------------------------------------------------------------------------------
const entries = Object.entries(report.pages);
const listDiffs = (pred) => entries.flatMap(([name, e]) => ['axe', 'pa11y'].flatMap((t) => e[t].diffs.filter(pred).map((d) => ({ page: name, tool: t, ...d }))));
report.summary = {
  pagesCompared: entries.length,
  testPages: entries.filter(([, e]) => e.kind === 'test').length,
  linkedPages: entries.filter(([, e]) => e.kind === 'linked').length,
  expectedDifferences: listDiffs((d) => d.expected),
  unexpectedDifferences: listDiffs((d) => !d.expected),
  nondeterministicOnFirstRun: entries.flatMap(([name, e]) => ['axe', 'pa11y'].filter((t) => e[t].nondeterministic).map((t) => ({ page: name, tool: t, firstRun: e[t].nondeterministic.filter((d) => !d.expected) }))),
  pixelDiffOver0_5Percent: entries.filter(([, e]) => e.pixels?.share > PIXEL_REPORT_SHARE).map(([name, e]) => ({ page: name, share: Number(e.pixels.share.toFixed(4)) })),
  pixelDiffNonZero: entries.filter(([, e]) => e.pixels?.share > 0).length,
  pixelErrors: entries.filter(([, e]) => e.pixels?.error).map(([name, e]) => ({ page: name, error: e.pixels.error })),
  runtimeSeconds: Math.round((Date.now() - t0) / 1000),
  concurrency,
};
writeFileSync(join(root, '.blind', 'verify.json'), JSON.stringify(report, null, 2) + '\n');
const s = report.summary;
console.log(`\nCompared ${s.pagesCompared} pages (${s.testPages} test, ${s.linkedPages} linked) in ${s.runtimeSeconds} s.`);
console.log(`Expected differences: ${s.expectedDifferences.length}; unexpected: ${s.unexpectedDifferences.length}; nondeterministic on first run (resolved on rerun): ${s.nondeterministicOnFirstRun.length}`);
for (const d of s.unexpectedDifferences) console.log(`  UNEXPECTED ${d.page} ${d.tool} ${d.key}: ${d.original} -> ${d.blinded}`);
for (const d of s.expectedDifferences) console.log(`  expected ${d.page} ${d.tool} ${d.key}: ${d.original} -> ${d.blinded}`);
console.log(`Screenshots: ${s.pixelDiffNonZero} test pages with any differing pixel outside the h1; over 0.5%: ${s.pixelDiffOver0_5Percent.length}`);
for (const p of s.pixelDiffOver0_5Percent) console.log(`  ${p.page} ${(p.share * 100).toFixed(2)}%`);
for (const p of s.pixelErrors) console.log(`  screenshot error ${p.page}: ${p.error}`);
console.log('Report: .blind/verify.json');
process.exit(s.unexpectedDifferences.length ? 1 : 0);

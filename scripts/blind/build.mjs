// Blinded build of the test pages for AI test runs (D-026).
//
// Usage:  npm run build && npm run blind:build
//
// Reads the built site (_site/) and writes (both git-ignored):
//   testing-kit/.site/  what the AI tester may see, inside the closed testing-kit workspace: p/<id>.html (test pages), x/<id>.html (example pages),
//                     a/<id>.<ext> (assets). Served by `npm run blind:serve`.
//   .blind/key.json   the key from opaque names back to test cases, example pages, assets, class/id names and
//                     data-ail-* attribute names. Never served; used only when results are classified.
//   .blind/urls.txt   the test-page URLs in random order, one per line.
//
// What changes compared with _site (everything else is byte-for-byte the same):
//   - file names are opaque and random per build, and every local reference is rewritten to them;
//   - on test pages only, the template <title> and the template <h1> (first element in <body>) read "Test page";
//   - HTML, CSS and JS comments are removed from the fixtures (jquery-1.12.0.min.js is copied unchanged);
//   - class names, ids and data-ail-* attribute names are replaced by opaque tokens, consistently in HTML, CSS and JS.
// Fixture content inside <main> and on example pages is not changed: some barriers are titles or headings.

import { execFileSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NameMap, collectIds, hex, jsLeaks, processCss, processHtml, processJs } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const site = join(root, '_site');
const outRoot = join(root, '.blind');
const outSite = join(root, 'testing-kit', '.site');
const BLIND_PORT = 8090;

if (!existsSync(join(site, 'tests'))) {
  console.error('_site/tests not found. Run `npm run build` first.');
  process.exit(1);
}

const warnings = [];
const errors = [];
const warn = (m) => warnings.push(m);

// Files of the site that are part of the experiment. Anything else under _site (site pages, site-assets) must never be
// referenced from a fixture.
const FIXTURE_PREFIXES = ['tests/', 'example-pages/', 'assets/javascript/', 'assets/stylesheets/', 'assets/test_images/', 'assets/images/', 'assets/ail/'];
const COPY_UNCHANGED = new Set(['assets/javascript/jquery-1.12.0.min.js']);
const isFixture = (p) => FIXTURE_PREFIXES.some((x) => p.startsWith(x)) && !p.endsWith('.md');
const existsFile = (p) => { try { return statSync(join(site, p)).isFile(); } catch { return false; } };

const listHtml = (dir) => readdirSync(join(site, dir), { recursive: true })
  .filter((f) => f.endsWith('.html')).map((f) => posix.join(dir, f.split('\\').join('/'))).sort();
const testPages = listHtml('tests');
const examplePages = listHtml('example-pages');

// ---- opaque file names --------------------------------------------------------------------------------------------
const newPath = new Map(); // original site path -> blind site path
const usedIds = new Set();
const freshId = () => { let id; do id = hex(8); while (usedIds.has(id)); usedIds.add(id); return id; };
function blindPathOf(orig) {
  let p = newPath.get(orig);
  if (!p) {
    const id = freshId();
    if (orig.startsWith('tests/')) p = `p/${id}.html`;
    else if (orig.startsWith('example-pages/')) p = `x/${id}.html`;
    else p = `a/${id}${posix.extname(orig).toLowerCase()}`;
    newPath.set(orig, p);
  }
  return p;
}
// Random order of id assignment, so ids do not follow the alphabetical order of slugs.
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
for (const p of shuffle([...testPages, ...examplePages])) blindPathOf(p);

// ---- references ---------------------------------------------------------------------------------------------------
const deadRefs = new Map(); // "from -> raw" -> count
const queue = [...testPages, ...examplePages];
const queued = new Set(queue);

// Rewrites one URL found in `fromOrig` (whose document base, for JS, is `baseOrig`).
function makeRewriter(fromOrig, baseDirOrig, fromNew) {
  return (raw) => {
    if (raw === '' || raw.startsWith('#')) return raw;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) return raw; // external, data:, javascript:, mailto:
    if (raw.startsWith('/')) {
      // Root-relative links copied from GOV.UK pages: dead in the original (the site is served below a path prefix) and
      // in the blinded build. A root-relative link that does reach a site file would need rewriting: refuse.
      const p = raw.split(/[?#]/)[0].replace(/^\/(accessibility-tool-audit\/)?/, '');
      if (p && existsFile(p)) errors.push(`${fromOrig}: root-relative reference to a site file: ${raw}`);
      else deadRefs.set(`${fromOrig} -> ${raw}`, (deadRefs.get(`${fromOrig} -> ${raw}`) ?? 0) + 1);
      return raw;
    }
    const cut = raw.search(/[?#]/);
    const pathPart = cut < 0 ? raw : raw.slice(0, cut);
    const suffix = cut < 0 ? '' : raw.slice(cut);
    if (suffix.includes('#') && suffix.slice(suffix.indexOf('#') + 1)) warn(`${fromOrig}: fragment kept in ${raw}`);
    const target = posix.normalize(posix.join(baseDirOrig, pathPart));
    if (!existsFile(target)) {
      const k = `${fromOrig} -> ${raw}`;
      deadRefs.set(k, (deadRefs.get(k) ?? 0) + 1);
      return raw; // dead in the original too; stays dead in the blinded build
    }
    if (!isFixture(target)) { errors.push(`${fromOrig}: reference to non-fixture file ${target} (${raw})`); return raw; }
    if (!queued.has(target)) { queued.add(target); queue.push(target); }
    const to = blindPathOf(target);
    const rel = posix.relative(posix.dirname(fromNew), to);
    return rel + suffix;
  };
}

// JS: a relative path in a string literal resolves against the document that runs the script. Fixture scripts run on
// test pages (tests/) and example pages (example-pages/); both map to sibling folders (p/, x/) in the blinded build.
// A path that exists relative to tests/ is rewritten relative to p/; a path that only exists relative to the site root
// (main.js: 'example-pages/demo.html', used on the combined page) is rewritten to the same root-relative form (x/<id>),
// which is as unreachable from p/ as the original was from tests/.
function jsPathRewriter(fromOrig) {
  return (raw) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
    const fromTests = posix.normalize(posix.join('tests', raw));
    if (existsFile(fromTests) && isFixture(fromTests)) return makeRewriter(fromOrig, 'tests', 'p/x.html')(raw);
    const fromRoot = posix.normalize(raw);
    if (existsFile(fromRoot) && isFixture(fromRoot)) {
      if (!queued.has(fromRoot)) { queued.add(fromRoot); queue.push(fromRoot); }
      warn(`${fromOrig}: string '${raw}' resolves only from the site root; rewritten root-relative (as unreachable as before)`);
      return blindPathOf(fromRoot);
    }
    errors.push(`${fromOrig}: path-like string '${raw}' does not resolve to a fixture file`);
    return raw;
  };
}

// ---- pre-scan -------------------------------------------------------------------------------------------------------
const knownIds = new Set();
for (const p of [...testPages, ...examplePages]) for (const id of collectIds(readFileSync(join(site, p), 'utf8'))) knownIds.add(id);
const keyframes = new Set();
for (const p of readdirSync(join(site, 'assets'), { recursive: true }).map((f) => 'assets/' + f.split('\\').join('/'))) {
  if (p.endsWith('.css')) for (const m of readFileSync(join(site, p), 'utf8').matchAll(/@(?:-webkit-|-moz-)?keyframes\s+(-?[_a-zA-Z][\w-]*)/g)) keyframes.add(m[1]);
}
for (const p of [...testPages, ...examplePages]) {
  for (const m of readFileSync(join(site, p), 'utf8').matchAll(/@(?:-webkit-|-moz-)?keyframes\s+(-?[_a-zA-Z][\w-]*)/g)) keyframes.add(m[1]);
}
const ctx = { names: new NameMap('k'), attrs: new NameMap('k'), knownIds, keyframes, warn };

// ---- template title and heading (test pages only) -----------------------------------------------------------------
const TITLE_RE = /<title>Accessibility tools audit test - [^<]* - (?:GDS accessibility team|A11y Intuition Lab)<\/title>/g;
const H1_RE = /(<body>\s*<h1>)([^<]*)(<\/h1>)/;
function neutraliseTemplate(slug, html) {
  const titles = html.match(TITLE_RE) ?? [];
  if (titles.length !== 1) { errors.push(`${slug}: expected 1 template <title>, found ${titles.length}`); return html; }
  if (!H1_RE.test(html)) { errors.push(`${slug}: template <h1> not found right after <body>`); return html; }
  return html.replace(TITLE_RE, '<title>Test page</title>').replace(H1_RE, '$1Test page$3');
}

// ---- process ----------------------------------------------------------------------------------------------------------
rmSync(outRoot, { recursive: true, force: true });
rmSync(outSite, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });
mkdirSync(outSite, { recursive: true });
const counts = { testPages: 0, examplePages: 0, assets: 0, unchanged: 0, commentsRemoved: 0 };
const processedText = []; // [blind path, text] for the leak check

while (queue.length) {
  const orig = queue.shift();
  const to = blindPathOf(orig);
  const dest = join(outSite, to);
  mkdirSync(dirname(dest), { recursive: true });
  const buf = readFileSync(join(site, orig));
  const ext = posix.extname(orig).toLowerCase();
  const rewrite = makeRewriter(orig, posix.dirname(orig), to);
  let text = null;
  try {
    if (COPY_UNCHANGED.has(orig)) {
      writeFileSync(dest, buf);
      counts.unchanged++;
      counts.assets++;
      continue;
    }
    if (ext === '.html') {
      let html = buf.toString('utf8');
      if (orig.startsWith('tests/')) html = neutraliseTemplate(orig, html);
      if (html.includes('<!--')) counts.commentsRemoved++;
      text = processHtml(ctx, html, { rewriteUrl: rewrite, stripComments: true });
      if (orig.startsWith('tests/')) counts.testPages++; else if (orig.startsWith('example-pages/')) counts.examplePages++; else counts.assets++;
    } else if (ext === '.css') {
      text = processCss(ctx, buf.toString('utf8'), rewrite);
      counts.assets++;
    } else if (ext === '.js') {
      text = processJs(ctx, buf.toString('utf8'), jsPathRewriter(orig));
      counts.assets++;
    } else {
      writeFileSync(dest, buf);
      counts.assets++;
      continue;
    }
  } catch (e) {
    errors.push(`${orig}: ${e.message}`);
    continue;
  }
  writeFileSync(dest, text);
  processedText.push([to, orig, text]);
}

// ---- leak checks -------------------------------------------------------------------------------------------------------
for (const [to, orig, text] of processedText) {
  if (/data-ail-/.test(text)) errors.push(`${orig}: data-ail- still present`);
  if (orig.endsWith('.js')) {
    const { leaks, bare } = jsLeaks(ctx, text);
    for (const l of leaks) errors.push(`${orig}: original name left in JS selector: ${l}`);
    for (const b of bare) warn(`${orig}: string equal to an original class/id name (not a selector, left unchanged): ${b}`);
  }
  if (/<!--/.test(text)) errors.push(`${orig}: HTML comment left`);
  if (orig.startsWith('tests/') && /Accessibility tools audit test/.test(text)) errors.push(`${orig}: template title left`);
  // Every class and id attribute value must consist of tokens only.
  for (const m of text.matchAll(/\s(class|id)\s*=\s*"([^"]*)"/g)) {
    for (const t of m[2].split(/\s+/).filter(Boolean)) if (!ctx.names.used.has(t)) errors.push(`${orig}: ${m[1]} value ${t} not renamed`);
  }
}

// ---- key, URL list -------------------------------------------------------------------------------------------------------
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim();
const idOf = (p) => posix.basename(p).replace(/\.[^.]+$/, '');
const pages = {}; const exPages = {}; const assets = {};
for (const [orig, to] of [...newPath].sort((a, b) => a[1].localeCompare(b[1]))) {
  if (!existsSync(join(outSite, to))) continue;
  if (to.startsWith('p/')) pages[idOf(to)] = posix.basename(orig, '.html');
  else if (to.startsWith('x/')) exPages[idOf(to)] = orig;
  else assets[posix.basename(to)] = orig;
}
const names = {};
for (const [o, t] of ctx.names.map) names[t] = o;
for (const [o, t] of ctx.attrs.map) names['data-' + t] = o;
const key = {
  builtAt: new Date().toISOString(),
  sourceCommit: git('rev-parse', 'HEAD'),
  dirty: git('status', '--porcelain', '--', 'src', 'assets', 'example-pages', 'scripts/blind').length > 0,
  note: 'Key for the blinded build (D-026). Not served; used only when results are classified.',
  pages, examplePages: exPages, assets, names,
};
writeFileSync(join(outRoot, 'key.json'), JSON.stringify(key, null, 2) + '\n');
const urls = shuffle(Object.keys(pages).map((id) => `http://127.0.0.1:${BLIND_PORT}/p/${id}.html`));
writeFileSync(join(outRoot, 'urls.txt'), urls.join('\n') + '\n');

// ---- summary ---------------------------------------------------------------------------------------------------------------
const deadList = [...deadRefs.keys()];
console.log(`Blinded build written to .blind/ (source ${key.sourceCommit.slice(0, 12)}${key.dirty ? ', dirty' : ''})`);
console.log(`  test pages ${counts.testPages}, example pages ${counts.examplePages}, assets ${counts.assets} (${counts.unchanged} copied unchanged)`);
console.log(`  renamed: ${ctx.names.map.size} class/id/keyframes names, ${ctx.attrs.map.size} data-ail-* attributes; HTML comments removed from ${counts.commentsRemoved} pages`);
console.log(`  references dead in the original too, left unchanged: ${deadList.length} (from ${new Set(deadList.map((k) => k.split(' -> ')[0])).size} pages)`);
const uniqWarnings = [...new Set(warnings)];
if (uniqWarnings.length) console.log(`  warnings (${uniqWarnings.length}):\n    ` + uniqWarnings.join('\n    '));
if (process.argv.includes('--list-dead')) console.log('  dead references:\n    ' + deadList.join('\n    '));
if (errors.length) {
  console.error(`ERRORS (${errors.length}):\n  ` + [...new Set(errors)].join('\n  '));
  process.exit(1);
}

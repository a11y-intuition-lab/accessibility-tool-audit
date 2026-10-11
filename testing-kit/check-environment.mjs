// Environment check for the closed testing-kit workspace: no AI, no judging. Starts the test server, loads one page in
// Chromium, runs axe-core and HTML_CodeSniffer on it, and prints counts. Run from testing-kit/: node check-environment.mjs
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
// Playwright reads PLAYWRIGHT_BROWSERS_PATH when it is loaded, so set it first and import afterwards. The browsers are
// in this folder because the sandbox cannot read the user's cache.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(here, '.browsers');
const { chromium } = await import('playwright-core');
const { default: pa11y } = await import('pa11y');
const require = createRequire(import.meta.url);
const port = 8090;
const server = spawn(process.execPath, [join(here, 'serve.mjs'), `--port=${port}`], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => d.toString().includes('Serving') && resolve());
  server.on('exit', (code) => reject(new Error(`server exited with ${code}; is port ${port} already in use?`)));
});
try {
  const res = await fetch(`http://127.0.0.1:${port}/p/`);
  console.log(`server: up (directory request returns ${res.status}, expected 404)`);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  console.log(`chromium: ${browser.version()}`);
  // Any test page will do; the server has no index, so take the first file name the build wrote.
  const page1 = readdirSync(join(here, '.site', 'p'))[0];
  const url = `http://127.0.0.1:${port}/p/${page1}`;
  const page = await browser.newPage();
  const resp = await page.goto(url);
  console.log(`page: HTTP ${resp.status()}`);
  await page.addScriptTag({ content: readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
  const axe = await page.evaluate(() => window.axe.run().then((r) => ({ v: window.axe.version, violations: r.violations.length, passes: r.passes.length })));
  console.log(`axe-core ${axe.v}: ran (${axe.violations} violations, ${axe.passes} passes)`);
  // HTML_CodeSniffer, two ways. pa11y starts its own Chromium through Puppeteer; the full Chromium build opens a Unix
  // socket at start-up that the sandbox refuses, so pa11y is pointed at the headless shell build. If pa11y still
  // cannot start a browser, HTML_CodeSniffer is injected into the Playwright page instead (same ruleset, no pa11y).
  const shellDir = readdirSync(join(here, '.browsers')).find((d) => d.startsWith('chromium_headless_shell-'));
  const shell = shellDir && join(here, '.browsers', shellDir, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
  let htmlcs;
  try {
    const p = await pa11y(url, { runners: ['htmlcs'], standard: 'WCAG2AAA', includeNotices: true, includeWarnings: true,
      chromeLaunchConfig: { executablePath: shell, args: ['--no-sandbox'] } });
    htmlcs = `via pa11y with the headless shell (${p.issues.length} issues)`;
  } catch (e) {
    await page.addScriptTag({ content: readFileSync(require.resolve('@pa11y/html_codesniffer/build/HTMLCS.js'), 'utf8') });
    const n = await page.evaluate(() => new Promise((resolve) =>
      window.HTMLCS.process('WCAG2AAA', document, () => resolve(window.HTMLCS.getMessages().length))));
    htmlcs = `injected into the Playwright page (${n} messages); pa11y could not start: ${String(e.message).split('\n')[0].slice(0, 120)}`;
  }
  console.log(`HTML_CodeSniffer: ran ${htmlcs}`);
  await browser.close();
  console.log('OK: the workspace can serve pages, drive Chromium and run both rule engines.');
} finally {
  server.kill();
}

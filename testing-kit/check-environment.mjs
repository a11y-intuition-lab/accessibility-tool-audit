// Environment check for the closed testing-kit workspace: no AI, no judging. Starts the test server, loads one page in
// Chromium, runs axe-core and HTML_CodeSniffer on it, and prints counts. Run from testing-kit/: node check-environment.mjs
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import pa11y from 'pa11y';

const here = dirname(fileURLToPath(import.meta.url));
process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(here, '.browsers');
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
  const { readdirSync } = await import('node:fs');
  const page1 = readdirSync(join(here, '.site', 'p'))[0];
  const url = `http://127.0.0.1:${port}/p/${page1}`;
  const page = await browser.newPage();
  const resp = await page.goto(url);
  console.log(`page: HTTP ${resp.status()}`);
  await page.addScriptTag({ content: readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
  const axe = await page.evaluate(() => window.axe.run().then((r) => ({ v: window.axe.version, violations: r.violations.length, passes: r.passes.length })));
  console.log(`axe-core ${axe.v}: ran (${axe.violations} violations, ${axe.passes} passes)`);
  await browser.close();
  const p = await pa11y(url, { runners: ['htmlcs'], standard: 'WCAG2AAA', includeNotices: true, includeWarnings: true,
    chromeLaunchConfig: { executablePath: chromium.executablePath(), args: ['--no-sandbox'] } });
  console.log(`pa11y/HTML_CodeSniffer: ran (${p.issues.length} issues)`);
  console.log('OK: the workspace can serve pages, drive Chromium and run both rule engines.');
} finally {
  server.kill();
}

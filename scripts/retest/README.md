# Retest harness

Runs axe-core and pa11y (HTML_CodeSniffer) against every test-case page of the **built** site, each page on its own
(D-004), and stores raw output plus an environment record. It does not classify anything; classification is a later,
separate script that reads the stored data (D-005).

## Reproduce a run

Requirements: Node.js 24, npm 11.15 or later, internet access (some fixtures embed remote media), Linux.

```bash
git checkout <commit named in environment.json of the run>
npm ci                      # exact versions from package-lock.json; no install scripts (.npmrc)
npm run retest:browsers     # installs the pinned Chromium revision (playwright-core install chromium)
npm run build               # builds _site/
npm run verify              # GOV.UK fixtures must be byte-identical to govuk-final
npm run retest              # takes about 7 minutes for 147 pages
```

The Chromium revision comes from the pinned `playwright-core` version, so the same lockfile gives the same browser.
Browser, tool and OS versions are written to `environment.json`; compare them with the run you reproduce.

`npm run retest` refuses to run when `src/`, `assets/` or `example-pages/` have uncommitted changes. For development
runs, `npm run retest -- --allow-dirty` runs anyway and records `git.dirty: true` and the list of changed files.
A dirty run is not publishable evidence.

## What it does

1. Starts a `node:http` static server for `_site/` on a random free port on 127.0.0.1. It serves `_site` both at `/`
   and under `/accessibility-tool-audit/`, so the pages' relative `../assets/...` links resolve. Before testing it
   fetches the first page's assets and aborts unless they return 200.
2. For each `_site/tests/<slug>.html` in alphabetical order (one page at a time): runs axe-core in Playwright's Chromium,
   then pa11y in the same Chromium binary. Each tool gets a fresh browser context or process per page.
3. Reads each page's origin (`govuk-2017` or `ail-2026`) from `src/test-cases/<slug>.html` front matter.
4. Writes everything to `data/results/ail-2026/runs/<runId>/`, where `runId` is the UTC start time, `YYYYMMDDTHHMMSSZ`.
   A page that fails to load or time out is recorded with an `error` field and does not stop the run.

## Configuration

- Viewport 1280x1024 for both tools; page load waits for the `load` event (30 s timeout for axe; pa11y timeout 60 s).
- **axe-core**: injected as `axe.min.js` with `page.addScriptTag`. `runOnly` is not set, so all rules that are enabled by
  default run; experimental rules (disabled by default) are enabled explicitly, and their ids are listed in
  `environment.json`. `resultTypes`: violations, incomplete, passes, inapplicable. Deprecated rules stay off, as in axe-core's defaults.
- **pa11y**: runner `htmlcs`, standard `WCAG2AAA`, `includeWarnings` and `includeNotices` true, no ignored rules.
  pa11y is pointed at Playwright's Chromium with `chromeLaunchConfig.executablePath`; puppeteer's own Chrome download
  is never triggered (install scripts are off), so both tools run on the one recorded browser.
- Chromium is started with `--no-sandbox`, which is also Playwright's default on Linux.
- Network is not blocked. Requests that fail (remote YouTube, media) are recorded per page.

## Output

```
data/results/ail-2026/runs/<runId>/
  environment.json   commit, dirty flag, versions, browser, OS, all configs, start and end time, network note
  summary.json       per slug: origin, axe violation/incomplete counts, pa11y error/warning/notice counts, errors
  axe/<slug>.json    violations and incomplete in full (rule id, impact, tags, nodes with target, html, failureSummary,
                     check ids); passes and inapplicable as counts and rule ids; failed requests; local non-200 responses
  pa11y/<slug>.json  all issues: code, type, typeCode, message, selector, context
```

Absolute paths and user names are not written to the output (the repository is public).

## Notes

- `tests/foo` returns 404 on `html-object-not-embedded-accessibly-wmode-parameter-not-set-to-window`: the fixture
  itself links to it. This is recorded under `localNon200` and is expected.
- Raw output for a full run is about 7 MB. `MAX_HTML_CHARS` in `run.mjs` can cap stored HTML snippets; it is off (0).

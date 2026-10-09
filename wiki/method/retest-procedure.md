# Retest procedure

How the AIL retest runs axe-core and pa11y. The step-by-step instructions are in
[`scripts/retest/README.md`](../../scripts/retest/README.md); this page records the method and its reasons.

## Principles

- **Test the built site** (`_site/tests/*.html`) over local HTTP, not source files (D-009).
- **One page per test case, one tool run per page** (D-004). Both the GOV.UK-origin and the AIL-origin pages are run.
- **Store raw output, classify later** (D-005). Classification is a pure function of the stored run plus the rule mapping.
- **One recorded browser.** axe-core runs in Playwright's Chromium; pa11y is pointed at the same binary with
  `chromeLaunchConfig.executablePath`. No second Chrome is downloaded.
- **Refuse dirty runs.** Uncommitted changes in `src/`, `assets/` or `example-pages/` stop the run, unless
  `--allow-dirty` is given; the run is then marked `git.dirty: true`.

## Tool settings (D-016)

| | axe-core | pa11y |
|---|---|---|
| Rules | all default rules, experimental rules enabled, `runOnly` unset | HTML_CodeSniffer, `WCAG2AAA` |
| Reported | violations and incomplete in full; passes and inapplicable as counts and rule ids | errors, warnings and notices |
| Viewport | 1280x1024 | 1280x1024 |

## Network

Some fixtures embed remote resources (YouTube, remote media). They are not blocked, so runs need internet access, and
failed requests are recorded per page. A remote embed can change over time; this is a known limit of the fixtures.

## Output and versions

Each run is stored in `data/results/ail-2026/runs/<runId>/` with `environment.json` (commit, dirty flag, Node, npm, OS,
Chromium, tool versions, all configuration), `summary.json`, `axe/<slug>.json` and `pa11y/<slug>.json`.

## First run

The first end-to-end run (147 pages, about 6 minutes, 6.6 MB) used axe-core 4.13.0, pa11y 10.0.0, HTML_CodeSniffer 2.6.0,
playwright-core 1.63.0 and Chromium 153.0.8010.12. It was made while other fixture work was in progress in the tree, so
treat it as a proof of the harness, not as the published retest.

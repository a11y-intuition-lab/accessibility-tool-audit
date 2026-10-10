# Retest procedure

How the AIL retest runs axe-core and pa11y. The step-by-step instructions are in
[`scripts/retest/README.md`](../../scripts/retest/README.md); this page records the method and its reasons.

## Principles

- **Test the built site** (`_site/tests/*.html`) over local HTTP, not source files (D-009).
- **One page per test case, one tool run per page** (D-004). Both the GOV.UK-origin and the AIL-origin pages are run.
- **Linked example pages are tested too** (D-022). When a test case's barrier is on a page in `example-pages/` that it
  links to, the mapping names that page (`linkedPage` in `data/mappings/test-case-rules.json`, or `linkedPages` for a
  barrier spread over several pages, such as inconsistent navigation) and the harness runs both tools on each of them. The list comes from the mapping, not from the harness.
- **Store raw output, classify later** (D-005). Classification is a pure function of the stored run plus the rule mapping.
- **One recorded browser.** axe-core runs in Playwright's Chromium; pa11y is pointed at the same binary with
  `chromeLaunchConfig.executablePath`. No second Chrome is downloaded.
- **Refuse dirty runs.** Uncommitted changes in `src/`, `assets/` or `example-pages/` stop the run, unless
  `--allow-dirty` is given; the run is then marked `git.dirty: true`.

## Tool settings (D-016)

| | axe-core | pa11y |
|---|---|---|
| Rules | every rule axe-core ships, including those off by default (experimental, AAA, deprecated) (D-021); `runOnly` unset | HTML_CodeSniffer, `WCAG2AAA`; plus a supplementary `WCAG2AA` pass (D-024) |
| Reported | violations and incomplete in full; passes and inapplicable as counts and rule ids | errors, warnings and notices |
| Viewport | 1280x1024 | 1280x1024 |

## Network

Some fixtures embed remote resources (YouTube, remote media). They are not blocked, so runs need internet access, and
failed requests are recorded per page. A remote embed can change over time; this is a known limit of the fixtures.

## Output and versions

Each run is stored in `data/results/ail-2026/runs/<runId>/` with `environment.json` (commit, dirty flag, Node, npm, OS,
Chromium, tool versions, all configuration including the full list of enabled axe-core rules), `summary.json`,
`axe/<slug>.json` and `pa11y/<slug>.json`, plus `axe/linked-<page>/<slug>.json` and `pa11y/linked-<page>/<slug>.json` for linked
example pages. From D-024 the supplementary WCAG2AA pass is stored the same way in `pa11y-aa/`. `npm run classify` adds `classification.json` ([classification protocol](classification-protocol.md)).

## Runs

- **Proof run (discarded).** The first end-to-end run (147 pages) proved the harness; it predated the 20 new AIL test
  cases and was made while fixture work was in progress, so it was not kept.
- **`20261010T073126Z`** — first stored run: 167 pages from clean commit `17f1f4a`, axe-core 4.13.0, pa11y 10.0.0,
  HTML_CodeSniffer 2.6.0, playwright-core 1.63.0, Chromium 153.0.8010.12, about 7 minutes, classified by
  `npm run classify`. It predates three changes, so its results are incomplete: axe-core ran only default plus
  experimental rules (before D-021), linked example pages were not tested (before D-022), and the AIL orientation lock
  was in the shared stylesheet, so `css-orientation-lock` fired on every AIL page (see [provenance](../provenance.md)).
  The next full run from a clean commit replaces it as the published retest.
- A partial check can be made with `npm run retest -- --allow-dirty --only=<slug>,<slug> --out=<dir>`; it is marked
  `partial` in `environment.json` and is not publishable.

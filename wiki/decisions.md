# Decisions

Numbered decisions for the AIL extension of the audit. Old decisions are never rewritten; a later decision supersedes
them explicitly.

## D-001 — Cover all WCAG 2.x versions and levels (2026-10-09)

**Decision:** Map and analyse against every success criterion in WCAG 2.0, 2.1 and 2.2, at levels A, AA and AAA.
**Reason:** It is easier to filter out what a reader does not care about than to add what was left out.

## D-002 — Exclude WCAG 3.0 (2026-10-10)

**Decision:** WCAG 3.0 is not included.
**Reason:** It is a working draft with a different structure (outcomes rather than success criteria), and it is still changing.

## D-003 — Retest with axe-core and pa11y only (2026-10-09)

**Decision:** Rerun all test cases with axe-core and pa11y. pa11y uses its HTML_CodeSniffer runner.
**Reason:** Both are free, open source, scriptable and pinnable. Running pa11y with HTML_CodeSniffer gives a second,
independent rule engine rather than running axe twice.
**Consequence:** Results for the other 11 upstream tools are removed from this repository and referenced at `govuk-final`.

## D-004 — Every test case is tested on its own page (2026-10-09)

**Decision:** Tools run against each test case's individual page, not only the combined page.
**Reason:** Failures on a combined page can mask or trigger each other, which makes results hard to attribute.

## D-005 — Classification by explicit, scripted protocol (2026-10-09)

**Decision:** Whether a tool "found" a test case is decided by a script using a stored mapping from test case to the
relevant rule IDs. AI may propose mappings; the proposals are stored as data with a rationale.
**Reason:** Upstream classification was manual and not documented in enough detail to reproduce.

## D-006 — Freeze test fixtures; rebuild the site around them (2026-10-10)

**Decision:** The generated test-case pages and the assets they load stay unchanged (byte-identical where possible).
The website, build and styling are rebuilt.
**Reason:** The fixtures are the objects being measured. `assets/javascript/main.js` (jQuery) drives fixture behaviour
such as keyboard traps, so it is part of the experiment, not part of the site.

## D-007 — Work directly on the default branch (2026-10-10)

**Decision:** Changes go directly on `gh-pages`. Deployment moves to GitHub Actions so a failing build is not published.

## D-008 — Supply-chain hardening (2026-10-10)

**Decision:** Repository-level `.npmrc` with a 7-day minimum release age, install scripts disabled, exact versions and
registry-only dependencies; GitHub Actions pinned to commit SHAs with least-privilege permissions; Dependabot with a
7-day cooldown. Details in [supply-chain security](method/supply-chain-security.md).
**Reason:** The project is public and runs third-party code in CI and on contributors' machines. Rules in the repository
apply to everyone, not just one machine.

## D-009 — Build with Eleventy, locally and in CI (2026-10-10)

**Decision:** The site is built with Eleventy 3 (`npm run build`), the same way locally and in GitHub Actions, and deployed
from Actions. Test runs use the built files in `_site/`, served over local HTTP.
**Reason:** Test-case pages and overview pages are generated from one file per test case. Testing the built output means
testing exactly what is published. `npm run verify` checks that GOV.UK fixtures stay byte-identical to `govuk-final`.
**Supersedes:** the "committed generated files" approach of the upstream project.

## D-010 — Defective GOV.UK fixtures get corrected AIL versions alongside (2026-10-10)

**Decision:** GOV.UK fixtures that do not show what their title says stay unchanged. AIL adds a corrected test case next
to each, with `origin: ail-2026` and `corrects: <govuk id>`. AIL fixture styles live in `assets/ail/tests-ail.css`, never
in the frozen `tests.css`.
**Reason:** Both versions stay measurable, results remain comparable with 2017, and provenance stays clean.

## D-011 — Borderline mappings are queued for human review (2026-10-10)

**Decision:** Mappings the protocol calls borderline get `"review": "pending"`. `npm run wcag:review` lists them. Until
reviewed, they count as `related`, so coverage figures are conservative.

## D-012 — 4.1.1-only test cases are kept as historical (2026-10-10)

**Decision:** Test cases whose only failure is 4.1.1 Parsing (removed in WCAG 2.2) are kept and marked `"historical"`.
**Reason:** They stay relevant for WCAG 2.0/2.1 and for comparing with the 2017 results, but they do not count towards
WCAG 2.2 coverage.

## D-013 — New categories: Pointer and Motion, Timing, Authentication (2026-10-10)

**Decision:** Accepted for test cases that do not fit the 19 GOV.UK categories (WCAG 2.1/2.2 criteria such as 2.5.x,
2.2.x and 3.3.8/3.3.9).

## D-014 — Flashing test cases are opt-in and warned (2026-10-10)

**Decision:** A flashing test case (2.3.1/2.3.2) uses a local animation that only starts after an explicit click, with a
clear photosensitivity warning before it and a stop control. It is never on the combined test-cases page in an active state.
**Reason:** Flashing content can trigger seizures, including in the people running the tests.

## D-015 — Media fixtures must be openly licensed and stored locally (2026-10-10)

**Decision:** Video and audio for test cases are stored in the repository, under CC0, public domain or another licence
that allows republication. Source and licence are recorded next to each file.
**Reason:** Remote media disappears (several GOV.UK multimedia sources may no longer load), and everything here is published.

## D-016 — Keep the historical aXe and HTML_CodeSniffer results (2026-10-10)

**Decision:** The GOV.UK results for aXe and HTML_CodeSniffer are kept in `data/results/govuk-2017/results.json`
(extracted unchanged from `govuk-final` by `scripts/import-govuk-results.mjs`) and shown next to the AIL retest.
HTML_CodeSniffer is the historical counterpart of pa11y, because pa11y runs it as its engine.
**Supersedes:** the part of D-003 that removed all old tool results. The other 11 tools stay removed.
**Reason:** Showing whether the tools have improved over time is one of the main questions.
**Consequences:** To compare like with like, the retest runs pa11y with the same standard GOV.UK used for
HTML_CodeSniffer (WCAG2AAA, including warnings and notices) and axe-core with all rule tags, including best practices
and experimental rules. Remaining differences (manual versus scripted classification, unrecorded 2017 versions) are
stated on the results page.

## D-017 — Two research questions (2026-10-10)

**Decision:** The project answers two questions: (1) Have automated accessibility checkers improved since 2017?
(2) Can AI find more accessibility barriers than automated checkers? WCAG mapping and new test cases are supporting
work for both.
**Consequence:** AI has two roles that are kept apart: object of study (question 2, with published prompts, models and
settings, classified like the tools) and research assistant (drafting mappings, test cases, code and documentation,
always stored as data and marked when not human-reviewed). The public method is on the site's methodology page.

## D-019 — Three aims instead of research questions (2026-10-10)

**Decision:** The project is described by three aims: (1) retest the GOV.UK test cases with current axe-core and pa11y
and compare with 2017; (2) add test cases for uncovered WCAG success criteria and see how the tools find them;
(3) phase 2, later: AI-assisted testing on the same test cases, compared with the tools.
**Supersedes:** D-017's two research questions. The split between AI as object of study (aim 3) and AI as research
assistant still applies.

## D-018 — Retest dependencies: axe-core, pa11y, playwright-core (2026-10-10)

**Decision:** Three devDependencies, exact versions, all at least 7 days old when added: `axe-core` (the rule engine itself,
injected as `axe.min.js`, so no wrapper package such as `@axe-core/playwright` is needed), `pa11y` (runs HTML_CodeSniffer, the
historical counterpart of D-016; it brings `puppeteer` and `@pa11y/html_codesniffer` as transitive dependencies) and
`playwright-core` (drives Chromium for axe-core and provides the explicit, version-pinned browser install, because install
scripts are off; the full `playwright` package adds a test runner we do not need). pa11y is pointed at Playwright's
Chromium through `executablePath`, so both tools run on one recorded browser. Versions and dates are in the run's
`environment.json` and in [retest procedure](method/retest-procedure.md).
**Reason:** D-003 requires both tools; D-008 requires few dependencies, pinned, with a reason for each.
**Consequences:** `npm audit` reports no new advisories beyond those already assessed in
[supply-chain security](method/supply-chain-security.md). The browser download is a separate step, `npm run retest:browsers`.

## D-020 — Classification protocol, with HTML_CodeSniffer warnings as "user to check" (2026-10-10)

**Decision:** Retest results are classified by `scripts/classify.mjs` (`npm run classify`) following the
[classification protocol](method/classification-protocol.md). A tool finds a test case only through a rule listed for it
in `data/mappings/test-case-rules.json`. axe-core: violation → issue found, needs review → user to check.
HTML_CodeSniffer: error → issue found, **warning → user to check**, notice → noticed but not a fail; notices emitted on
every page are never listed. The strongest hit wins. A page that failed to load, or a barrier on a linked example page the
run did not load, gives no result ("Not tested").
**Reason:** Implements D-005. GOV.UK reclassified HTML_CodeSniffer warnings as manual checks on 2018-04-13, so the 2017
data has no "warning only" results for it; coding 2026 warnings the same way keeps the comparison fair. The alternative
(warning → warning only) would raise the 2026 detection rate through a coding choice alone. Linked-page cases are not
"not found" because the tool never saw the page.
**Consequences:** The rule mapping is AI-proposed (claude-opus-5-5), stored with a rationale per rule, and not yet reviewed;
borderline entries are marked `review: pending`. Rules disabled by default in axe-core (`color-contrast-enhanced`,
`target-size`, `identical-links-same-purpose`, deprecated `duplicate-id` and `audio-caption`) are listed but did not run in
the first run, so the classification records them separately. Testing linked example pages needs a harness change.

## D-021 — Enable all axe-core rules (2026-10-10)

**Decision:** The retest harness enables every rule axe-core ships, including the rules it disables by default:
experimental, AAA (`color-contrast-enhanced`, `target-size`, `identical-links-same-purpose`,
`meta-refresh-no-exceptions`) and deprecated ones still shipped in 4.13 (`duplicate-id`, `duplicate-id-active`,
`audio-caption`, `aria-roledescription`, `landmark-complementary-is-top-level`). The full list is recorded in each run's
`environment.json` (`enabledRuleIds`, `defaultDisabledRuleIds`).
**Reason:** GOV.UK's instruction for the 2017 audit (`tools-info.md` at `govuk-final`) was to use each tool's most
inquisitive options. With defaults only, the first run could not find barriers for which axe-core has a rule.
**Supersedes:** the part of D-016 and D-018 that ran axe-core with default plus experimental rules only.
**Consequences:** Comparability: GOV.UK's 2017 aXe settings listed the tags wcag2a, wcag2aa, section508, best-practice
and experimental, not AAA. Results from AAA rules (for example the AAA contrast test cases) can therefore be found in 2026
for a reason that is partly configuration, not tool improvement; the results page and analysis must say so when
comparing those cases. Deprecated rules (4.1.1 Parsing) are included for comparability with 2017, when they were current.

## D-022 — Test linked example pages (2026-10-10)

**Decision:** When a test case's barrier is on a linked page in `example-pages/`, the mapping names it (`linkedPage` in
`data/mappings/test-case-rules.json`), the harness runs both tools on that page too, and the classifier counts listed-rule
hits on either page. "No result" remains only for a page that failed to load or a tool error.
**Supersedes:** the part of D-020 that gave these cases no result because the run did not load the linked page.
**Reason:** Ten GOV.UK test cases (page titles, html `lang`, missing `h1`, keyboard trap, unorganised content) were
otherwise untestable; GOV.UK tested the linked pages in 2017.


## D-023 — Generate media fixtures with scripts (2026-10-10)

**Decision:** Where a test case needs audio or video but no particular recording, AIL generates the media with a script
in this repository (`scripts/media/`), from arithmetic only, and releases it under CC0 1.0. Files live in
`assets/ail/media/`, listed with script, length and checksum in its `README.md`.
**Refines:** D-015. Generated media meets its rule (local, openly licensed) without sourcing third-party files.
**Reason:** The tools inspect markup and media metadata (for example axe-core `no-autoplay-audio` reads the duration),
not what the media says, so synthetic content is enough for many media barriers. The script makes the file reproducible.
**Consequences:** Candidates that need real speech or a human (sign language, audio description, speech over music)
stay deferred until speech can be generated reproducibly or openly licensed recordings are found.

## D-024 — Supplementary HTML_CodeSniffer WCAG2AA pass (2026-10-10)

**Decision:** Every retest runs pa11y twice per page: the main pass with HTML_CodeSniffer's `WCAG2AAA` standard (stored
in `pa11y/`, unchanged) and a supplementary pass with `WCAG2AA` (stored in `pa11y-aa/`). The classifier reports the
supplement as `pa11yAA`: the strongest of the main result and the WCAG2AA pass, matched on the mapped codes with the
`WCAG2AA` prefix plus WCAG2AA-only codes listed in the mapping field `htmlcsAA`. The results page shows it in its own
column, marked "Supplement".
**Reason:** In HTML_CodeSniffer 2.6.0 the `WCAG2AAA` ruleset leaves out some sniffs that `WCAG2AA` includes, notably
2.2.1 (meta refresh errors F40.2 and F41.2), and pa11y cannot add them to `WCAG2AAA`. GOV.UK used `WCAG2AAA` in 2017, so
the main pass keeps it for comparability (D-016).
**Consequences:** The main pa11y column remains comparable with 2017; the supplement is not. Runs before
`20261010T110125Z` (inclusive) have no supplement.

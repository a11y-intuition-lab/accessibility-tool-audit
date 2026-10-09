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

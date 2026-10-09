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

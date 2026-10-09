# Provenance

This page records where everything in this repository comes from. It answers three questions: what came from
GOV.UK, what A11y Intuition Lab (AIL) has done, and how to tell the two apart.

## Upstream: GOV.UK (2017–2019)

| | |
|---|---|
| Repository | [alphagov/accessibility-tool-audit](https://github.com/alphagov/accessibility-tool-audit) (archived) |
| Authors | Government Digital Service (GDS) accessibility team |
| Licence | MIT, © 2017 Crown Copyright (Government Digital Service) — see [`LICENSE`](../LICENSE) |
| Last upstream commit | `e9e46115caf55f07a9302a5ee187687870510a09` (2019-05-22), tagged `govuk-final` in this repository |
| Published site | <https://alphagov.github.io/accessibility-tool-audit/> |
| Background | [What we found when we tested tools on the world's least accessible webpage](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/) (GDS blog, 2017-02-24) |

What upstream contains at `govuk-final`:

- 142 test cases in 19 categories (`tests.json`), each with an HTML example.
- Results for 13 tools (Google ADT, Tenon, WAVE, HTML_CodeSniffer, aXe, Asqatasun, SortSite, EIII, AChecker, Nu Html
  Checker, Siteimprove, FAE, ASLint), last updated 13 April 2018 according to `changelog.json`.
- Fixture assets: test images, example pages, jQuery-based fixture script and test stylesheet.
- A gulp + Sass + Nunjucks build producing the site.

Code identifiers used for upstream material: `origin: govuk-2017`.

## A11y Intuition Lab (2026–)

AIL extends and retests the audit. Code identifier: `origin: ail-2026`.

Planned and ongoing work (see [decisions](decisions.md) and [log](log.md)):

1. Modernise the build and website, keeping the GOV.UK test fixtures unchanged.
2. Map test cases to WCAG 2.0, 2.1 and 2.2 success criteria (levels A, AA, AAA) and identify gaps.
3. Add test cases for the gaps.
4. Retest all test cases with axe-core and pa11y (HTML_CodeSniffer runner), with pinned versions and stored raw output.
5. Document the method so others can reproduce the retest.

## Changes to upstream material

Every change to something that came from GOV.UK is listed here, newest last.

| Date | What | Why |
|---|---|---|
| 2026-10-10 | Tagged `e9e46115` as `govuk-final` | Fixed reference point for the upstream state |
| 2026-10-10 | Converted `tests.json` to one file per test case in `src/test-cases/` (`scripts/import-govuk-tests.mjs`); example HTML verbatim, slugs unchanged | One file per test case is easier to review and extend; fixtures verified byte-identical by `npm run verify` |
| 2026-10-10 | Removed the `results` data for the 13 original tools | Decision D-003; results remain upstream at `govuk-final` |
| 2026-10-10 | Replaced the gulp + Sass + Nunjucks build with Eleventy 3 | The old toolchain does not run on current Node; fixture output is unchanged |
| 2026-10-10 | Removed GOV.UK branding from the site (crest, Open Government Licence footer, site titles, stylesheet). Test-case pages keep their original `<title>` | We must not look like GOV.UK |
| 2026-10-10 | Added the line `Copyright (c) 2026 A11y Intuition Lab` to `LICENSE`, below the Crown Copyright line | Credit for AIL's additions; the original line and text are unchanged |

## Removed upstream material

Material removed from this repository remains available upstream at `govuk-final`.

| Date | What | Where to find it |
|---|---|---|
| 2026-10-10 | `gulpfile.js`, `build/` | upstream at `govuk-final` (Gulp build, Nunjucks templates and result analysis) |
| 2026-10-10 | `assets/sass/` (incl. vendored GOV.UK frontend toolkit) | upstream at `govuk-final` (Sass sources) |
| 2026-10-10 | `assets/stylesheets/application.css` | upstream at `govuk-final` (Compiled GOV.UK site stylesheet) |
| 2026-10-10 | `assets/images/` except `important.png` | upstream at `govuk-final` (GOV.UK crest, Open Government Licence logos, touch icons, sprites; duplicates of `assets/test_images/`. `important.png` stays because `tests.css` loads it) |
| 2026-10-10 | `index.html`, `results.html`, `test-cases.html`, `tests/*.html` at repository root | upstream at `govuk-final` (Generated files; now built into `_site/`) |
| 2026-10-10 | `tests.json` | upstream at `govuk-final` (Converted to `src/test-cases/`) |
| 2026-10-10 | `analysis.json`, `changelog.json` | upstream at `govuk-final` (Result analysis and results changelog (D-003)) |
| 2026-10-10 | `tools-info.md` | upstream at `govuk-final` (Settings and changelogs of the 13 original tools (D-003)) |

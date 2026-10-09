# Log

Append-only, newest last.

## 2026-10-10 — Wiki started
- Tagged upstream commit `e9e46115` as `govuk-final`.
- Added `AGENTS.md` (repository and wiki conventions), provenance, decisions D-001 to D-007, and the upstream source page.

## 2026-10-10 — Modernised build; supply-chain hardening
- Replaced gulp/Sass with Eleventy 3; one file per test case in `src/test-cases/` (`origin: govuk-2017`). All 142 GOV.UK
  test pages and 20 fixture assets verified byte-identical to `govuk-final` (`npm run verify`).
- Removed GOV.UK branding, old tool results and the upstream build (listed in [provenance](provenance.md)).
- Added `.npmrc`, pinned Actions, Dependabot ([supply-chain security](method/supply-chain-security.md); D-008, D-009).

## 2026-10-10 — WCAG gap analysis (AI-drafted)
- Ingested W3C `wcag.json` (WCAG 2.2 data, includes 2.0/2.1 via `versions`): 61 / 78 / 86 (+4.1.1) success criteria.
- Wrote the [mapping protocol](method/wcag-mapping.md) and mapped all 142 GOV.UK test cases (status `ai-proposed`):
  79 with ≥1 `fails`, 48 only `related`, 15 `none`.
- [Gap analysis](analysis/wcag-gap-analysis.md): WCAG 2.2 coverage 40 covered / 10 related-only / 36 uncovered of 86;
  80 candidate test cases proposed. Found several defects in GOV.UK fixtures (left unchanged, see the analysis).
- Reproduce with `npm run wcag:fetch` and `npm run wcag:coverage`.

## 2026-10-10 — Corrected fixtures and gap-analysis decisions
- Pushed to GitHub; first Actions deploy succeeded.
- Added five corrected AIL test cases (contrast ×3, blinking text, table cell counts) and `assets/ail/tests-ail.css` (D-010).
- Marked 24 borderline GOV.UK mappings for human review and 5 4.1.1-only cases as historical (D-011, D-012).
- Decisions D-013 to D-015: new categories, flashing safety, media licensing.

## 2026-10-10 — Historical results for aXe and HTML_CodeSniffer
- Extracted GOV.UK's 2017 results for aXe (41 found, 2 manual, 99 not found) and HTML_CodeSniffer (29 found, 19 manual,
  1 identified, 93 not found) into `data/results/govuk-2017/results.json` (D-016).
- Results page now shows these next to empty columns for the 2026 axe-core and pa11y retest.

## 2026-10-10 — AIL design and methodology page
- Site restyled with the AIL design (vendored tokens and base CSS, self-hosted Poppins and Nunito Sans, no Google Fonts
  requests). Fixture pages unchanged; on the combined page site styles are scoped away from the examples.
- Added the public methodology page (`src/methodology.njk`) and decision D-017 (two research questions).

## 2026-10-10 — Retest harness
- Added `npm run retest` and `npm run retest:browsers` (`scripts/retest/`): axe-core and pa11y against every built test
  page on one Playwright Chromium, with raw output and an environment record per run (D-018).
- Added [retest procedure](method/retest-procedure.md) and updated the methodology page (sections 4 and 10).
- A first proof run worked (147 pages, no load failures). It was discarded because it predates the new test cases; the first published run is made from a clean commit.

## 2026-10-10 — 20 new AIL test cases; WCAG filter
- Implemented 20 of the 24 high-priority candidates as `ail-2026` test cases (WCAG 2.1/2.2 criteria such as 1.3.4, 1.3.5,
  1.4.11, 1.4.12, 2.1.4, 2.4.11, 2.5.1, 2.5.2, 2.5.7, 3.3.8, 4.1.3). Four deferred (media, meta refresh, multi-step flow).
- Added `assets/ail/tests-ail.js` (fixture behaviour, vanilla JS). It is now also loaded by the five earlier AIL test
  pages; their examples are unchanged.
- Test cases and results pages get a WCAG filter (version, level, fails/related) with the EU requirement — WCAG 2.1 AA,
  via EN 301 549 V3.2.1 — as the default and as a reset button. State is kept in the URL.

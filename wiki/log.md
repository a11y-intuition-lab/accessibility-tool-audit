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

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

## 2026-10-10 — Scripted classification of the first retest run
- Added the [classification protocol](method/classification-protocol.md), the rule mapping
  `data/mappings/test-case-rules.json` (167 test cases, AI-proposed, 23 marked for review) and `scripts/classify.mjs`
  (`npm run classify`), decision D-020. HTML_CodeSniffer warnings are coded as "user to check", as GOV.UK did from 2018.
- Classified run `20261010T073126Z` (`classification.json` in the run directory; deterministic, checked by running twice).
- Results page now fills the 2026 axe-core and pa11y columns from the newest classified run and lists the run in the
  changelog; methodology sections 6 and 10 updated.
- Ten GOV.UK test cases have their barrier on a linked example page that the harness does not load; they show
  "Not tested" until the harness tests linked pages.

## 2026-10-10 — Complete the retest: orientation fixture, linked pages, all axe-core rules
- AIL fixture change: the orientation lock moved from the shared `assets/ail/tests-ail.css` into the example of
  `page-layout-content-locked-to-portrait-orientation-ail`, so `css-orientation-lock` no longer fires on every AIL page
  (checked with axe-core on all 25 AIL pages). Recorded in [provenance](provenance.md).
- The harness tests linked example pages named by `linkedPage` in the rule mapping and the classifier merges their
  evidence (D-022). The harness enables every axe-core rule, including AAA and deprecated ones, and records the list (D-021).
  New `--only` and `--out` options for partial checks.
- Updated the [classification protocol](method/classification-protocol.md), [retest procedure](method/retest-procedure.md)
  (including the outdated "first run" paragraph), the harness README and methodology section 4. Run
  `20261010T073126Z` was reclassified with the new mapping; it predates these changes and will be replaced by a new full run.

## 2026-10-10 — Retest run 20261010T080254Z
- Full run from clean commit `d17e577` with all axe rules enabled and linked example pages tested (D-021, D-022).
- GOV.UK cases, 2017 → 2026: axe found 41 → 40, manual 2 → 7; HTML_CodeSniffer/pa11y found 29 → 29, manual 19 → 6,
  identified 1 → 23. Classification is AI-proposed (rule mapping) and scripted.

## 2026-10-10 — 51 more AIL test cases; head field, linked page sets, own-page timers
- Implemented every remaining medium- and low-priority candidate that does not need video or audio, plus the two
  high-priority ones deferred for other reasons (meta refresh; redundant entry, which needed a multi-step flow): 51 new
  `ail-2026` test cases, 76 AIL test cases in all. Seven media candidates are deferred: they need openly licensed media (D-015).
- Infrastructure: a `head` front-matter field in the AIL fixture layout for head-level barriers (the combined page shows a
  note instead), `combinedNote` for examples that must not run on the combined page (flashing, D-014; timers),
  20 AIL example pages in `example-pages/ail/`, and `linkedPages` in the rule mapping, supported by the harness and the
  classifier. Details in [provenance](provenance.md).
- Each new page was checked with axe-core 4.13.0 (all rules) and pa11y 10.0.0: apart from template noise only the intended
  rules fire; no page scrolls horizontally at 320 CSS px.
- WCAG mappings added to `data/mappings/test-case-wcag-ail.json` (AI-proposed, not reviewed). The rule mapping has
  entries only for the 9 linked-page cases (`axe: []`, `htmlcs: []`, "rules not yet mapped"); the other new cases need
  rule mappings before `npm run classify` can run on a full run.


## 2026-10-10 — Rule mappings for the 51 new AIL test cases; retest run 20261010T085044Z
- Added rule mappings for the 51 new `ail-2026` test cases to `data/mappings/test-case-rules.json` (now 218 test cases,
  AI-proposed, not reviewed), including the 9 linked-page cases that said "rules not yet mapped". 13 of the 51 are marked
  `review: pending`; 32 have no rule in either tool (mostly cognitive, cross-page and interaction barriers). 35 of 218
  mappings are now pending review.
- Classified run `20261010T085044Z` (full run from clean commit `99575fe`, 218 test pages; deterministic, checked by
  running twice).
- GOV.UK cases (142): axe found 40, manual 7; HTML_CodeSniffer/pa11y found 29, manual 6, identified 23 (unchanged from
  run `20261010T080254Z`).
- AIL cases (76): axe found 13, manual 2, not found 61; HTML_CodeSniffer/pa11y found 1, manual 2, identified 12,
  not found 61. Of the 51 new cases axe found 5 (inline text spacing, ARIA list children, landmarks, two meta refresh
  cases) and flagged 1 for review (text over a background image); pa11y found 1 (data table with role presentation),
  flagged 1 for review and noticed 9 through generic reminders.
- HTML_CodeSniffer `F40.2`/`F41.2` (meta refresh) did not fire on the two meta refresh cases; cause not investigated.

## 2026-10-10 — Fictional phone numbers; first generated media test case

- AIL fixtures now use Ofcom's drama range `020 7946 0xxx` instead of `0300 123 456x` (see provenance). Not retested:
  the change is in plain text that no mapped rule inspects.
- D-023: media fixtures may be generated by script under CC0. `scripts/media/generate-audio.mjs` writes a 12-second
  synthesised music loop, byte-identical on every run.
- New test case `multimedia-audio-plays-automatically-with-no-way-to-stop-it-ail` (1.4.2, F93), mapped to axe-core
  `no-autoplay-audio` and the HTML_CodeSniffer `1_4_2.F23` notice. A partial check (not a publishable run) gave axe-core
  "incomplete" (user to check) and the F23 notice (identified). It enters the published results with the next full run.
- 8 candidates remain deferred.

## 2026-10-10 — Origin filter on the test cases and results pages

- The WCAG filter gets a "Test cases" field (all / original GOV.UK 2017 / added by AIL 2026) and a preset button
  "Original 2017 test cases". Reason: the 2017 columns cover only the 142 GOV.UK test cases, while the 2026 columns also
  cover the AIL test cases, which mostly target criteria the tools do not check. Under the default EU filter that made
  2026 look worse (axe 41% → 32%, HTML_CodeSniffer 24% → 15%); on the same 70 GOV.UK test cases both are unchanged
  (41% and 24%).

## 2026-10-10 — Generated video; HTML_CodeSniffer WCAG2AAA skips the 2.2.1 sniff

- `scripts/media/generate-video.mjs` records a 12-second canvas animation ("how to repot a plant", steps shown only on
  screen) in Chromium, silent and with the generated music. Not byte-identical on regeneration; checksums in
  `assets/ail/media/README.md` (D-023).
- New test cases `multimedia-video-only-content-without-alternative-ail` (1.2.1) and
  `multimedia-prerecorded-video-without-audio-description-or-media-alternative-ail` (1.2.3, 1.2.5, 1.2.8). A partial
  check: axe-core 4.13 has no rule for either (`video-caption` fires but targets captions); HTML_CodeSniffer emits its
  generic media notices. 6 candidates remain deferred; all need speech or a human (sign language).
- Why HTML_CodeSniffer F40.2/F41.2 (meta refresh) did not fire: in HTML_CodeSniffer 2.6.0 the `WCAG2AAA` ruleset does
  not include the `Principle2.Guideline2_2.2_2_1` sniff, which holds those checks; `WCAG2A` and `WCAG2AA` do. pa11y's
  `rules` option cannot add it, because pa11y only accepts sniffs listed in `WCAG2AAA`. Other `WCAG2AA` sniffs missing
  from `WCAG2AAA` (1.3.1_A, 1.4.3, 1.4.4, 1.4.5, 2.3.1, 2.4.4, 3.3.4) appear to be replaced by their AAA counterparts.
  GOV.UK also ran HTML_CodeSniffer with WCAG2AAA in 2017 (upstream `tools-info.md`), so the retest keeps WCAG2AAA for
  comparability. A supplementary `WCAG2AA` pass is possible but not decided.

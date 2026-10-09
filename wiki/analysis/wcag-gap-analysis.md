# WCAG gap analysis of the GOV.UK test cases

> Status: AI-drafted, not human-reviewed

Which WCAG 2.0/2.1/2.2 success criteria (SCs) the 142 GOV.UK test cases (`govuk-2017`) exercise, which they miss,
and which new test cases (`ail-2026`) would close the gaps. Mapping proposed by `claude-opus-5-5` on 2026-10-10.

## Method

1. SC list: W3C `wcag.json` for WCAG 2.2, normalised to 87 entries ([source page](../sources/wcag.md)).
2. Each test case, as it renders on its own page at `govuk-final`, was mapped by the
   [mapping protocol](../method/wcag-mapping.md): `fails` (cite Fxx where one exists), `related`, or `none`;
   barriers that are not the test case's target are flagged `incidental` and do not count as coverage.
3. [`scripts/wcag/coverage.mjs`](../../scripts/wcag/coverage.mjs) computes coverage per SC and per version × level.
   **Covered** = at least one non-incidental `fails` test case. **Related only** = only `related` or incidental entries.
   **Uncovered** = no entries.
4. Candidate test cases were proposed for every SC that is not covered, plus "thin" SCs where a common, distinct
   failure (usually a W3C Fxx) has no test.

Data: [`test-case-wcag.json`](../../data/mappings/test-case-wcag.json) ·
[`coverage.json`](../../data/gap-analysis/coverage.json) · [`candidates.json`](../../data/gap-analysis/candidates.json)

## Test cases

| Mapping result | Test cases |
|---|---|
| At least one `fails` | 79 |
| Only `related` | 48 |
| `none` (no SC applies) | 15 |
| **Total** | **142** |

Five test cases fail only 4.1.1 Parsing, so they show **no failure under WCAG 2.2**: `lists-li-element-with-no-parent`,
`lists-dt-or-dd-elements-that-are-not-contained-within-a-dl-element`, `lists-improperly-nested-lists`,
`html-duplicate-id`, `html-start-and-close-tags-dont-match`.

### Fixture issues found while mapping

The GOV.UK fixtures are frozen (D-006). Where a fixture does not show what its title says, AIL adds a corrected test
case next to it (D-010), with `corrects:` pointing to the original.

| Test case | Issue | Corrected by |
|---|---|---|
| `colour-and-contrast-large-text-…-31-so-does-not-meet-aa` | "Large" text is 20 px normal weight, which is not large text in WCAG; it fails 4.5:1 (3.41:1) | `colour-and-contrast-large-text-below-31-ail` |
| `colour-and-contrast-small-text-…-71-so-does-not-meet-aaa` | 2.86:1 also fails AA, not only AAA | `colour-and-contrast-small-text-below-71-aaa-ail` |
| `colour-and-contrast-large-text-…-45-1-so-does-not-meet-aaa` | Uses the AA class (`low-contrast-large-aa`), so it is identical to the AA case | `colour-and-contrast-large-text-below-451-aaa-ail` |
| `colour-and-contrast-focus-not-visible` | The button does get a thin (1 px) focus outline, so it fails 2.4.13 rather than 2.4.7 | Not needed: 2.4.7 is covered by `keyboard-access-keyboard-focus-is-not-indicated-visually` |
| `tables-table-with-inconsistent-numbers-of-columns-in-rows` | Every row spans 10 columns; the grid is consistent | `tables-table-rows-have-different-numbers-of-cells-ail` |
| `typography-blink-element-found` | `<blink>` no longer blinks in any browser | `typography-blinking-text-cannot-be-paused-ail` |
| Multimedia cases | Remote video, audio and YouTube sources may no longer load | Pending: needs openly licensed local media (D-015) |

### Human review and historical cases

- Mappings marked `"review": "pending"` are borderline and await human review (D-011). List them with
  `npm run wcag:review`.
- Five test cases fail only 4.1.1 Parsing, which is removed in WCAG 2.2. They are kept and marked `"historical"` (D-012).

## Coverage by version and level

| Version | Level | SCs | Covered | Related only | Uncovered |
|---|---|---|---|---|---|
| 2.0 | A | 25 | 21 | 1 | 3 |
| 2.0 | AA | 13 | 5 | 3 | 5 |
| 2.0 | AAA | 23 | 8 | 2 | 13 |
| **2.0** | **all** | **61** | **34** | **6** | **21** |
| 2.1 | A | 30 | 22 | 1 | 7 |
| 2.1 | AA | 20 | 8 | 5 | 7 |
| 2.1 | AAA | 28 | 9 | 3 | 16 |
| **2.1** | **all** | **78** | **39** | **9** | **30** |
| 2.2 | A | 31 | 21 | 1 | 9 |
| 2.2 | AA | 24 | 9 | 6 | 9 |
| 2.2 | AAA | 31 | 10 | 3 | 18 |
| **2.2** | **all** | **86** | **40** | **10** | **36** |

4.1.1 is covered (5 test cases) and counted in 2.0 and 2.1 only.

## SCs not covered

Candidates = number of proposed test cases for the SC.

| SC | Handle | Level | Since | Status | Candidates |
|---|---|---|---|---|---|
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | 2.0 | related only | 1 |
| 1.2.4 | Captions (Live) | AA | 2.0 | uncovered | 1 |
| 1.2.5 | Audio Description (Prerecorded) | AA | 2.0 | related only | 1 |
| 1.2.6 | Sign Language (Prerecorded) | AAA | 2.0 | uncovered | 1 |
| 1.2.7 | Extended Audio Description (Prerecorded) | AAA | 2.0 | uncovered | 1 |
| 1.2.8 | Media Alternative (Prerecorded) | AAA | 2.0 | related only | 1 |
| 1.2.9 | Audio-only (Live) | AAA | 2.0 | uncovered | 1 |
| 1.3.4 | Orientation | AA | 2.1 | uncovered | 2 |
| 1.3.5 | Identify Input Purpose | AA | 2.1 | uncovered | 2 |
| 1.3.6 | Identify Purpose | AAA | 2.1 | uncovered | 1 |
| 1.4.2 | Audio Control | A | 2.0 | uncovered | 1 |
| 1.4.5 | Images of Text | AA | 2.0 | related only | 1 |
| 1.4.7 | Low or No Background Audio | AAA | 2.0 | uncovered | 1 |
| 1.4.9 | Images of Text (No Exception) | AAA | 2.0 | uncovered | 1 |
| 1.4.12 | Text Spacing | AA | 2.1 | related only | 2 |
| 2.1.3 | Keyboard (No Exception) | AAA | 2.0 | uncovered | 1 |
| 2.1.4 | Character Key Shortcuts | A | 2.1 | uncovered | 1 |
| 2.2.4 | Interruptions | AAA | 2.0 | uncovered | 3 |
| 2.2.5 | Re-authenticating | AAA | 2.0 | uncovered | 1 |
| 2.2.6 | Timeouts | AAA | 2.1 | uncovered | 1 |
| 2.3.3 | Animation from Interactions | AAA | 2.1 | related only | 1 |
| 2.4.1 | Bypass Blocks | A | 2.0 | uncovered | 2 |
| 2.4.5 | Multiple Ways | AA | 2.0 | uncovered | 1 |
| 2.4.6 | Headings and Labels | AA | 2.0 | related only | 2 |
| 2.4.8 | Location | AAA | 2.0 | uncovered | 1 |
| 2.4.10 | Section Headings | AAA | 2.0 | related only | 1 |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | 2.2 | related only | 1 |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | 2.2 | uncovered | 2 |
| 2.5.1 | Pointer Gestures | A | 2.1 | uncovered | 1 |
| 2.5.2 | Pointer Cancellation | A | 2.1 | uncovered | 1 |
| 2.5.4 | Motion Actuation | A | 2.1 | uncovered | 1 |
| 2.5.6 | Concurrent Input Mechanisms | AAA | 2.1 | uncovered | 1 |
| 2.5.7 | Dragging Movements | AA | 2.2 | uncovered | 1 |
| 3.1.3 | Unusual Words | AAA | 2.0 | uncovered | 1 |
| 3.1.6 | Pronunciation | AAA | 2.0 | uncovered | 1 |
| 3.2.1 | On Focus | A | 2.0 | uncovered | 2 |
| 3.2.3 | Consistent Navigation | AA | 2.0 | uncovered | 1 |
| 3.2.4 | Consistent Identification | AA | 2.0 | uncovered | 1 |
| 3.2.6 | Consistent Help | A | 2.2 | uncovered | 1 |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | 2.0 | uncovered | 1 |
| 3.3.5 | Help | AAA | 2.0 | uncovered | 1 |
| 3.3.6 | Error Prevention (All) | AAA | 2.0 | uncovered | 1 |
| 3.3.7 | Redundant Entry | A | 2.2 | uncovered | 1 |
| 3.3.8 | Accessible Authentication (Minimum) | AA | 2.2 | uncovered | 2 |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA | 2.2 | uncovered | 3 |
| 4.1.3 | Status Messages | AA | 2.1 | related only | 1 |

Pattern: every SC new in 2.1 and 2.2 except 1.4.10, 1.4.11, 1.4.13, 2.4.13, 2.5.3, 2.5.5 and 2.5.8 is not covered
(the GOV.UK set dates from 2017), as are all 1.2.x media SCs except 1.2.1/1.2.2 and all multi-page consistency SCs.

## Test cases mapping to no SC

| Test case | Reason |
|---|---|
| `html-deprecated-center-element` | Obsolete element, no accessibility impact |
| `html-deprecated-font-element` | Obsolete element, no accessibility impact |
| `html-empty-paragraph` | Not exposed by AT |
| `html-object-not-embedded-accessibly-wmode-parameter-not-set-to-window` | Flash-era concern; fallback text present |
| `html-spacer-image-found` | `alt=""` is correct for a spacer |
| `images-image-has-alt-and-title-that-are-different` | Alt text is adequate; title is a tooltip |
| `keyboard-access-accesskey-attribute-used` | Modifier-key shortcut, outside 2.1.4 |
| `keyboard-access-keyboard-focus-assigned-to-a-non-focusable-element-using-tabindex0` | Extra tab stop, no SC prohibits it |
| `links-link-text-with-identical-title` | Redundant, harmless |
| `links-link-to-,-invalid-hypertext-reference` | Markup alone fails nothing |
| `links-link-to-pdf-does-not-include-information-on-file-format-and-file-size` | Good practice; purpose is clear |
| `links-links-not-separated-by-printable-characters` | WCAG 1.0 checkpoint 10.5, not in 2.x |
| `tables-table-with-some-empty-cells` | Content quality |
| `typography-all-caps-text-found` | Readability best practice |
| `typography-italics-used-on-long-sections-of-text` | Readability best practice |

## Candidate test cases

80 candidates in [`candidates.json`](../../data/gap-analysis/candidates.json): 40 for uncovered SCs, 11 for
related-only SCs, 29 for thin coverage. Three new categories: **Pointer and Motion**, **Timing**, **Authentication**
(alongside the existing nineteen). HTML is not written yet.

| Priority | Automatable | Partially | Manual | Total |
|---|---|---|---|---|
| High | 4 | 15 | 5 | 24 |
| Medium | 4 | 17 | 14 | 35 |
| Low | 0 | 4 | 17 | 21 |
| **Total** | **8** | **36** | **36** | **80** |

High priority:

| Candidate | SC | Fxx | Detectability |
|---|---|---|---|
| `multimedia-prerecorded-video-without-audio-description-or-media-alternative` | 1.2.3, 1.2.5 | — | manual |
| `multimedia-audio-plays-automatically-with-no-way-to-stop-it` | 1.4.2 | F93 | partially |
| `images-svg-image-without-accessible-name` | 1.1.1 | — | automatable |
| `page-layout-content-locked-to-portrait-orientation` | 1.3.4 | F97 | partially |
| `forms-invalid-autocomplete-value-on-personal-data-field` | 1.3.5 | F107 | automatable |
| `forms-missing-autocomplete-on-personal-data-fields` | 1.3.5 | — | partially |
| `colour-and-contrast-form-field-border-has-insufficient-contrast` | 1.4.11 | — | partially |
| `css-text-clipped-when-text-spacing-is-increased` | 1.4.12 | F104 | partially |
| `keyboard-access-focus-removed-by-script-when-received` | 2.1.1, 2.4.7, 3.2.1 | F55 | partially |
| `keyboard-access-single-character-key-shortcut-cannot-be-turned-off` | 2.1.4 | F99 | manual |
| `keyboard-access-positive-tabindex-scrambles-form-focus-order` | 2.4.3 | F44 | partially |
| `keyboard-access-sticky-footer-hides-focused-element` | 2.4.11, 2.4.12 | F110 | partially |
| `timing-page-refreshes-automatically-with-meta-refresh` | 2.2.1, 2.2.4, 3.2.5 | F41 | automatable |
| `timing-auto-rotating-carousel-without-pause` | 2.2.2 | F16 | partially |
| `navigation-repeated-navigation-block-cannot-be-bypassed` | 2.4.1 | — | partially |
| `pointer-and-motion-path-gesture-required-without-single-pointer-alternative` | 2.5.1 | F105 | manual |
| `pointer-and-motion-action-triggered-on-pointer-down` | 2.5.2 | F101 | partially |
| `pointer-and-motion-drag-and-drop-without-single-pointer-alternative` | 2.5.7 | F108 | manual |
| `forms-focus-on-field-opens-new-window` | 3.2.1 | — | partially |
| `forms-previously-entered-information-requested-again` | 3.3.7 | — | manual |
| `forms-status-message-not-announced` | 4.1.3 | F103 | partially |
| `forms-custom-checkbox-without-checked-state` | 4.1.2 | F15 | partially |
| `html-focusable-element-inside-aria-hidden` | 4.1.2 | — | automatable |
| `authentication-paste-blocked-in-password-field` | 3.3.8, 3.3.9 | F109 | partially |

### SCs that do not fit a static single-page test case

| Kind | SCs | Suggested fixture |
|---|---|---|
| Media | 1.2.1 (video-only), 1.2.3–1.2.9, 1.4.2, 1.4.7 | Short, openly licensed local media files (stored in the repo with licence), so tests do not depend on remote hosts; "live" SCs simulated with a looping stream labelled live |
| Multi-page consistency | 2.4.5, 2.4.8, 3.2.3, 3.2.4, 3.2.6 | A small set of 3–4 linked pages under one folder; run tools page by page and compare |
| Multi-step flows | 3.3.4, 3.3.6, 3.3.7 | A 2–3 step static form flow with client-side state (no server) |
| Timing | 2.2.5, 2.2.6 | A page with a scripted short "session" (e.g. 30 s) that simulates expiry and re-login |
| Interaction/sensors | 2.1.4, 2.5.1, 2.5.2, 2.5.4, 2.5.6, 2.5.7 | Single page with script; tests need scripted interaction (key presses, pointer, device-motion emulation) |
| Flashing | 2.3.1, 2.3.2 | A local flashing animation that only starts after an explicit click and is small, to protect people running the tests |

## How to regenerate

```sh
node scripts/wcag/fetch-wcag.mjs --offline   # re-normalise data/wcag/raw/wcag.json
node scripts/wcag/coverage.mjs               # recompute data/gap-analysis/coverage.json
node scripts/wcag/review-queue.mjs           # list mappings awaiting human review
```

Coverage is computed from the GOV.UK baseline (`test-case-wcag.json`) only. AIL test cases are mapped in
`data/mappings/test-case-wcag-ail.json`.

Edit `data/mappings/test-case-wcag.json` (or `candidates.json`) by hand to change a mapping, then rerun
`coverage.mjs` and update the tables on this page from its output.

## Sources

- W3C, *WCAG 2.2*, <https://www.w3.org/TR/WCAG22/>; *Understanding WCAG 2.2*, <https://www.w3.org/WAI/WCAG22/Understanding/>;
  *Techniques for WCAG 2.2*, <https://www.w3.org/WAI/WCAG22/Techniques/>
- GOV.UK test cases at tag `govuk-final` ([source page](../sources/govuk-audit-2017.md))

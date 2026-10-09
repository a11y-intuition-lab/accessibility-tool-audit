# WCAG mapping protocol

> Status: AI-drafted, not human-reviewed

This protocol says how to map one test case to WCAG 2.x success criteria (SCs). It is written so that another person
(or a later AI run) can reapply it and get the same answer, and so that disagreements can be traced to a specific rule.
The current mapping is stored as data in [`data/mappings/test-case-wcag.json`](../../data/mappings/test-case-wcag.json);
the analysis built on it is in [WCAG gap analysis](../analysis/wcag-gap-analysis.md).

## Scope

- All SCs in WCAG 2.0, 2.1 and 2.2, levels A, AA and AAA ([D-001](../decisions.md)); no WCAG 3.0 ([D-002](../decisions.md)).
- The SC list is [`data/wcag/success-criteria.json`](../../data/wcag/success-criteria.json) (see [WCAG source](../sources/wcag.md)).
- **4.1.1 Parsing** is in WCAG 2.0 and 2.1 and removed in 2.2. It is mapped like any other SC. Coverage is computed
  per version, so a 4.1.1 mapping counts for 2.0 and 2.1 only. A test case whose only relation is `fails 4.1.1` has
  no WCAG 2.2 failure; this is stated in its `notes`.

## Unit of evaluation

1. The object is the test case's **individual page** ([D-004](../decisions.md)) as generated at `govuk-final`
   (`build/templates/single-test.html`: an `h1` with the test name, then the example in `main`), with
   `assets/stylesheets/tests.css` and `assets/javascript/main.js` loaded.
2. **As rendered** means: in a current evergreen browser (Chromium/Firefox, 2026), default user settings, default black
   text on white background, viewport 1280 px wide unless the SC itself defines another condition (for example 320 CSS px
   for 1.4.10, 200 % zoom for 1.4.4).
3. Where the example links to a page in `example-pages/`, that linked page is the object for the barrier the test
   case names.
4. External resources (remote video/audio, YouTube) are judged by what the markup and the test-case title say they
   are, because they may no longer load. This is recorded in `notes`.
5. Obsolete elements are judged by what browsers do today (for example `<blink>` no longer blinks).

## Relation types

| Relation | Use when | Technique |
|---|---|---|
| `fails` | The example, as rendered, does not meet the SC. A reviewer applying the normative SC text (and its Understanding document) would record a failure without needing information that is not on the page. | Cite a W3C failure technique `Fxx` when one describes this situation. Otherwise `null`. |
| `related` | The SC addresses this kind of barrier, but the example does not by itself fail it: the outcome depends on context not on the page, a sufficient technique exists that the example already meets in another way, or the practice is advisory/best practice under that SC. | Optional; may cite an `Fxx` whose pattern is close but not met. |
| `none` | No SC applies; the barrier is best practice, a code-quality issue, or an obsolete WCAG 1.0 checkpoint. Recorded as one entry `{sc: null, relation: "none"}`. | — |

Additional optional flags on an entry:

- `incidental: true` — the failure is real but is not the barrier the test case was built to show (for example a linked
  example page that also lacks a `lang` attribute, or an image button whose image is an image of text). Incidental
  entries are listed in coverage but do **not** make an SC "covered", because a tool result on that test case is not
  attributed to that SC.
- `technique_obsolete: true` — the cited `Fxx` exists but W3C marks it obsolete (for example F47, F70, F77, F87).

## Rules

1. **Start from the test-case title.** It names the intended barrier. Map that barrier first, then check the example
   for other barriers in the example's own markup and assets (mark those `incidental`).
2. **Read the normative text, not the tool rule.** Do not map an SC because tools typically flag it there. Only the
   SC wording, its definitions and its Understanding document decide.
3. **Cite failure techniques precisely.** Cite `Fxx` for `fails` only when the technique's described situation matches
   the example. The SC's current failure techniques are listed in `success-criteria.json` (`failureTechniques`); an
   obsolete technique may be cited with `technique_obsolete: true`.
4. **Sufficient technique met another way → `related`.** Example: "Read more" link directly after a heading meets 2.4.4
   via H80, so 2.4.4 is `related` and 2.4.9 (AAA, link text alone) is `fails`.
5. **Context-dependent → `related`.** If failure depends on information not on the page (what a linked file contains,
   whether an image is informative where the author gives no signal), use `related` and say what the context would
   have to be.
6. **"Mechanism is available" SCs (1.4.8).** `fails` only where a W3C failure technique describes the example (F88,
   justified text). Author CSS that a user can override (line height, line length) is `related`.
7. **Contrast** is computed from the fixture CSS against the default white background (WCAG relative luminance).
   "Large text" means at least 18 pt (24 CSS px) or 14 pt (≈18.66 CSS px) bold. A fixture that fails a stricter
   threshold than the title claims is mapped to every SC it fails, with a note.
8. **Validity (4.1.1).** Duplicate IDs, mismatched tags and content-model nesting errors are `fails 4.1.1`. They are
   mapped to 1.3.1 or 4.1.2 only if they also change the accessibility tree in a way those SCs cover.
9. **One-sentence rationale** per entry, saying what on the page causes the relation.
10. **Borderline cases** (a reasonable reviewer could choose `fails` or `related`): choose `related` unless an `Fxx`
    matches or the Understanding document gives this pattern as a failure example, and note "borderline" in the
    rationale. This keeps `fails` conservative, so "covered" is not overstated.

## Status of each mapping

Mappings proposed by AI carry `meta.status: "ai-proposed"` and the model ID. A human reviewer changes entries in the
data file and records review status there; the analysis is regenerated with the scripts (see
[WCAG gap analysis](../analysis/wcag-gap-analysis.md#how-to-regenerate)).

## Sources

- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*, W3C Recommendation, <https://www.w3.org/TR/WCAG22/>
- W3C, *Understanding WCAG 2.2*, <https://www.w3.org/WAI/WCAG22/Understanding/>
- W3C, *Techniques for WCAG 2.2*, <https://www.w3.org/WAI/WCAG22/Techniques/>

# Classification protocol

> Status: AI-drafted, not human-reviewed

This protocol says how the raw output of a retest run becomes one result per test case and tool, using the categories
GOV.UK used in 2017. It is applied by a script, [`scripts/classify.mjs`](../../scripts/classify.mjs) (`npm run classify`),
so the result can be regenerated from stored data without any human or AI judgement ([D-005](../decisions.md),
[D-020](../decisions.md)). The judgement sits in one place, the rule mapping
[`data/mappings/test-case-rules.json`](../../data/mappings/test-case-rules.json), which is AI-proposed and stored with a
rationale for every rule.

## Inputs and output

- A run directory `data/results/ail-2026/runs/<runId>/` from the [retest harness](retest-procedure.md): `summary.json`,
  `environment.json`, `axe/<slug>.json`, `pa11y/<slug>.json`, and for test cases with a `linkedPage` also
  `axe/linked-<page>/<slug>.json` and `pa11y/linked-<page>/<slug>.json` (section 6).
- The rule mapping, `data/mappings/test-case-rules.json`.
- Output: `<runId>/classification.json` with, per test case, `axe` and `pa11y` values (or `null`) and the evidence: the
  matching rule ids with where axe-core reported them (`violations` or `incomplete`) and node counts, the matching
  HTML_CodeSniffer codes with issue type and count, and the listed axe-core rules that did not run at all
  (`axeRulesNotRun`). The metadata records the run id, commit, tool versions, the protocol and the SHA-256 of the mapping file.
- The output is deterministic: keys are sorted and the only timestamps are copied from the run. Running the script twice
  gives byte-identical files.

## 1. The rule mapping

For every test case the mapping lists the axe-core rule ids and HTML_CodeSniffer codes that correspond to **its intended
barrier**, the barrier the title names and the example is built to show.

1. A rule is listed if it tests for that barrier, whether or not it fired in any run. The run's raw output is used as
   evidence of what fires, never as a reason to list a rule.
2. A rule that targets a closely related but different problem is not listed; the `notes` say so (for example
   `scrollable-region-focusable` on the horizontal-scrolling case is about keyboard access to the scrolling box).
3. Empty lists are allowed: they mean neither tool has a rule for the barrier, and `notes` say why.
4. Borderline choices get `"review": "pending"`, as for WCAG mappings ([D-011](../decisions.md)). They are used in the
   classification until reviewed; the review can only remove or add rules, and the classification is then rerun.
5. Rules that are disabled by default in axe-core (such as `color-contrast-enhanced`, `target-size`,
   `identical-links-same-purpose`, the deprecated `duplicate-id` and `audio-caption`) are listed when they test the barrier.
   The first run did not enable them; since D-021 the harness enables every axe-core rule. The classifier records listed
   rules that did not run under `axeRulesNotRun`, which separates "the rule exists but did not run" from "the rule ran
   and passed".

## 2. When a tool "finds" a test case

A tool finds a test case only through a rule that is listed for that test case. Hits from unlisted rules are ignored,
however severe. This removes:

- **Template noise** that every fixture page triggers, such as axe-core `region` (the template `h1` is outside `main`),
  and the heading level of the example relative to the template `h1` (`heading-order`, HTML_CodeSniffer `G141`) on test
  cases that are not about headings.
- **Incidental issues** in the example that are not the barrier, such as a contrast warning on a fake button.

## 3. axe-core

| axe-core reports a listed rule in | Result |
|---|---|
| `violations` | `error` (issue found) |
| `incomplete` only ("needs review") | `manual` (user to check) |
| neither | `notfound` |

## 4. pa11y / HTML_CodeSniffer

| HTML_CodeSniffer reports a listed code as | Result |
|---|---|
| `error` | `error` (issue found) |
| `warning` | `manual` (user to check) |
| `notice` | `identified` (noticed but not a fail) |
| nothing | `notfound` |

**Why warnings become "user to check".** GOV.UK first recorded HTML_CodeSniffer warnings as "warning only", then on
2018-04-13 reclassified them as manual checks without retesting (PR #37, recorded in
[`data/results/govuk-2017/results.json`](../../data/results/govuk-2017/results.json) under `meta.tools.codesniffer.changelog`).
The 2017 data we compare with therefore contains no HTML_CodeSniffer "warning only" results. Mapping warnings to `manual`
keeps 2026 comparable with that data. HTML_CodeSniffer warnings also match the meaning of "user to check": their messages
ask the tester to check something ("Check that…", "If this element contains…").

**The alternative** is warning → `warning` (the pre-2018 GOV.UK practice). It would raise the pa11y detection rate,
because "warning only" counts as found on the results page, while the 2017 HTML_CodeSniffer rate would stay unchanged.
That would make the tool look better in 2026 for a reason that is only a coding choice. The alternative can be computed
by changing one line in the classifier (`HTMLCS_VALUE.warning`).

**Matching.** A listed code matches a pa11y issue when the full code is identical, for example
`WCAG2AAA.Principle1.Guideline1_1.1_1_1.H37`. There is no prefix matching: every variant that counts is listed
(for example `G18.Fail`, `G18.Abs` and `G18.BgImage` for contrast). An entry may restrict the issue types that count
(`"types": ["warning"]`) where HTML_CodeSniffer uses the same code for a page-level notice and an element-level warning.

**Unconditional reminders.** HTML_CodeSniffer emits 39 notices on every page, whatever it contains (in the first run
all 167 pages had them; for example `1_3_3.G96` "content identified by location", `1_4_1.G14,G182` "use of colour",
`3_1_5` reading level, `2_4_2.H25.2` "check the title describes the document", all `2_5_x`).
They cannot tell a page with the barrier from one without, so they are never listed; the affected test cases say so in
`notes`. Notices that HTML_CodeSniffer only emits when the page has the relevant feature (such as `H30` on each link,
`G107` on each input, `G94.Image` on each image with alt text, `H4.2` when tabindex is used) are listed when their
message asks the tester to check the very property that is broken. These give `identified`; most are marked
`review: pending` because they are generic per-element reminders.

## 5. Several hits

If several listed rules hit, the strongest result wins: `error` > `warning` > `manual` > `identified` > `notfound`.
`error_paid` is never used (both tools are free). `warning` cannot occur in 2026 with the rules above; it is kept in the
order for completeness.

## 6. Barriers on a linked page

Ten GOV.UK test cases (page titles, `lang` on the `html` element, missing `h1`, keyboard trap, unorganised content) show
the barrier on a page in `example-pages/` that the test case only links to. Their mapping names that page in
`linkedPage`. The retest harness reads this field and tests the linked page with both tools as well, storing
`axe/linked-<page>/<slug>.json` and `pa11y/linked-<page>/<slug>.json`. The classifier treats the test-case page and the linked page
as one unit: hits of listed rules on either page count, and the evidence records which page each hit came from
(`page: "test"` or the linked path).

AIL test cases whose barrier only shows across several pages (consistent navigation, identification and help, multiple
ways, location, and multi-step forms) link to pages in `example-pages/ail/`. A mapping can name several pages in
`linkedPages` (a list); the harness tests each one and stores it as `linked-<page>/<slug>.json`, and the classifier counts
hits of listed rules on the test-case page or any of the linked pages. `linkedPage` (one page) keeps working.

Runs made before the harness tested linked pages (the first run, `20261010T073126Z`) have no linked-page output; for
those, the ten cases have no result (below).

## 7. No result

The result is `null`, shown as "Not tested", not `notfound`, when the test-case page or, for a `linkedPage` or `linkedPages` case, a
linked page failed to load, the tool reported an error (an `error` field in the raw output), or the output file is
missing. A page the tool never saw cannot count as a miss.

## Limitations

- **Rule, not element.** Matching is by rule id or code, not by the element reported. A listed rule that hit only the
  template would still count. This was checked for the first run (`20261010T073126Z`): every matching axe-core node and
  every matching HTML_CodeSniffer selector is inside `main` (the example), except (a) page-level notices with no element
  (`2_4_7` focus visible, `H4.2` tabindex), which are page-level by design, and (b) `css-orientation-lock` on
  `<html>`, which in that run fired on every AIL page because the orientation lock was in the shared AIL stylesheet.
  The lock has since been moved into the portrait test case itself ([provenance](../provenance.md)); with that change
  the rule fires on that page only. Re-check this when the mapping or the fixtures change.
- **Linked pages.** On a linked example page every listed rule counts wherever it hits, because the whole page is the
  example.
- **Generic reminders.** Notices such as `H30` (link purpose) fire on every link, so `identified` means the tool pointed
  at the element, not that it judged it.
- **No interaction.** Neither tool presses keys, moves the pointer or waits; barriers that need interaction are
  `notfound` by construction. This is a property of the tools as run, not of the protocol.
- **Comparison with 2017.** GOV.UK classified by hand and did not document which rule matched. Some 2017 "user to
  check" results for HTML_CodeSniffer appear to come from notices (for example link-text cases), which this protocol
  codes as `identified`. The detection rate on the results page (issue found and warning only) is not affected; the split
  between "user to check" and "noticed" is not strictly comparable.
- **HTML_CodeSniffer standard.** The retest uses `WCAG2AAA`, as GOV.UK did. In HTML_CodeSniffer 2.6.0 that ruleset
  leaves out the 2.2.1 sniff (meta refresh errors F40.2 and F41.2), which `WCAG2A` and `WCAG2AA` include, so these
  checks never run in the main pass. Since D-024 a supplementary WCAG2AA pass is classified separately as `pa11yAA`
  (the strongest of the main result and the WCAG2AA pass; extra WCAG2AA-only codes in the mapping field `htmlcsAA`).
- **Mapping quality.** The mapping is AI-proposed and not yet reviewed. 35 of 218 test cases are marked
  `review: pending`.

## Sources

- axe-core 4.13 rule metadata (`axe.getRules()`), and Deque's rule descriptions at
  [dequeuniversity.com/rules/axe/4.13](https://dequeuniversity.com/rules/axe/4.13).
- HTML_CodeSniffer 2.6.0 `WCAG2AAA` sniffs, as bundled with pa11y 10.0.0 (`@pa11y/html_codesniffer`).
- GOV.UK results and changelog: [`data/results/govuk-2017/results.json`](../../data/results/govuk-2017/results.json).

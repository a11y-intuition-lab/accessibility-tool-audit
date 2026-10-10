# Test-method grouping of WCAG 2.x

> Status: AI-drafted, not human-reviewed

Phase 2 (aim 3, [D-019](../decisions.md)) starts by asking, for every WCAG 2.x success criterion: **how is it tested,
and by whom or what?** This page explains the grouping in [D-025](../decisions.md), compares it with earlier work, and
assesses its weaknesses. The data is in [`data/mappings/sc-test-methods.json`](../../data/mappings/sc-test-methods.json)
(validated and summarised by `npm run wcag:methods`). The testing recipes built on it are in
[`testing-kit/`](../../testing-kit/README.md).

## Why group by test method

WCAG is organised by principle and guideline: what a page must achieve. A tester works differently. They pick a tool or
a mode (a keyboard, a screen reader, a zoomed browser, a reading of the text) and check everything that mode can reveal
before switching. Grouping criteria by method follows that work pattern:

- **Fewer context switches.** Each group shares one setup and one way of looking. A keyboard pass checks focus order,
  focus visibility, traps and changes on focus in the same sweep.
- **Cheapest method first.** Each criterion is also triaged: automated rules first, AI for what rules cannot decide, and
  a person where neither is good enough. Cost decides the order, and the triage says where effort is still needed.
- **Units of delegation.** A group is a natural unit for a person, a checklist or an AI subagent. Data collection
  (screenshots, focus traces, renders) can be separated from judging within a group.

Grouping by method is not new (see [Comparison](#comparison-with-earlier-groupings)). What is new here is triage per
criterion with an AI tier, evidence for the automation tier from our own retest, and recipes written to serve both
people and AI agents.

## The groups

| Group | What the tester does | Shared setup | Primary criteria |
|---|---|---|---|
| Automated rule checks | Run axe-core and HTML_CodeSniffer | The tools | 0 |
| Code and accessibility tree | Read markup, DOM and the accessibility tree: names, roles, states, relationships, language, structure | DevTools, accessibility tree view | 15 |
| Visual inspection | Look at the rendered page: colour use, contrast, images of text, sensory instructions | Screenshots, contrast checker | 8 |
| Keyboard pass | Operate the page with the keyboard only | Keyboard; no mouse | 11 |
| Screen-reader pass | Listen to, or read, what a screen reader announces | Screen reader (NVDA, VoiceOver) | 3 |
| Zoom and reflow | Zoom, 320 CSS px width, text-spacing override, orientation, content on hover or focus | Browser zoom, bookmarklet | 6 |
| Pointer and motion | Gestures, cancellation, target size, dragging, motion | Pointer, touch emulation | 7 |
| Time and media | Time limits, moving and flashing content, autoplay, captions, audio description, sign language | Watching and listening over time | 19 |
| Language and cognition | Read the content: headings and labels, unusual words, abbreviations, reading level, help | Reading | 7 |
| Multi-step flow | Walk a process or several pages: error prevention, redundant entry, authentication, consistency | Several pages or steps | 11 |

Every criterion has one **primary** group, the pass that verifies it most efficiently in full, and any number of
**secondary** groups that also see it. For example, 2.4.7 Focus Visible is primary in the keyboard pass and secondary in
visual inspection. Membership of each group, with levels, is generated into the recipes from the data file.

### Recommended order

Automated → code and accessibility tree → visual → keyboard → zoom and reflow → pointer and motion → time and media →
language and cognition → multi-step flow → screen reader.

The order goes from cheap and broad to expensive and narrow. The automated pass and the code reading cost little and
remove many questions early. The screen-reader pass comes last, as a confirmation of what the code reading predicted.
This matches the order in every framework compared below: automated first, then manual and keyboard, then assistive
technology, then user testing.

## Triage results

The [data file](../../data/mappings/sc-test-methods.json) defines each level. In short: automation *full* means a rule
decides pass and fail for the whole criterion; AI *likely* means a capable model should judge it reliably from the
collected data; human *must* means tools and AI cannot verify it well enough.

| Tier | Level | Criteria (of 87) |
|---|---|---|
| Automation (axe-core + HTML_CodeSniffer) | full / partial / none | 0 / 48 / 39 |
| AI | likely / possible / unlikely | 47 / 33 / 7 |
| Human | must / should / optional | 7 / 54 / 26 |

By primary group:

| Group | Criteria | Automation partial / none | AI likely / possible / unlikely | Human must / should / optional |
|---|---|---|---|---|
| Code and accessibility tree | 15 | 14 / 1 | 14 / 1 / 0 | 0 / 4 / 11 |
| Visual inspection | 8 | 6 / 2 | 7 / 1 / 0 | 0 / 3 / 5 |
| Keyboard pass | 11 | 7 / 4 | 7 / 4 / 0 | 0 / 11 / 0 |
| Screen-reader pass | 3 | 1 / 2 | 2 / 1 / 0 | 0 / 2 / 1 |
| Zoom and reflow | 6 | 4 / 2 | 4 / 2 / 0 | 0 / 5 / 1 |
| Pointer and motion | 7 | 2 / 5 | 2 / 5 / 0 | 0 / 5 / 2 |
| Time and media | 19 | 9 / 10 | 1 / 11 / 7 | 7 / 11 / 1 |
| Language and cognition | 7 | 2 / 5 | 4 / 3 / 0 | 0 / 6 / 1 |
| Multi-step flow | 11 | 3 / 8 | 6 / 5 / 0 | 0 / 7 / 4 |

What the numbers say:

- **No criterion is fully automatable** with the two engines. Even where rules are strong (1.4.3 contrast, 3.1.1
  language of page), they miss cases our retest includes: text over images, or a valid `lang` code for the wrong language.
- **Rules help with about half the criteria** (48 partial). The retest evidence cited per criterion shows how much: for
  1.1.1, axe-core flagged 4 of 15 failing test cases.
- **AI is expected to carry most of the rest**, with code and accessibility tree as the strongest group (14 of 15 likely).
- **Human testing concentrates in time and media.** All 7 *must* criteria are media criteria (audio description, live
  captions, sign language, background audio), where judging needs real listening or watching.
- **The keyboard pass is all *should*.** AI can drive the keyboard and diff screenshots, but subtle focus indicators and
  focus order need a person to confirm.

The AI levels are **predictions, not results**. Phase 2 tests them: the first AI run on the 221 test pages
([D-027](../decisions.md)) will show where they hold.

## Comparison with earlier groupings

Source pages give details and links. "X" means a comparable group or step; "(x)" means partial.

| Framework | auto | code/tree | visual | keyboard | screen reader | zoom | pointer | time/media | language | flows |
|---|---|---|---|---|---|---|---|---|---|---|
| [Nav test protocols](../sources/nav-testing-guidance.md) | (x) as a tool | X | X | X | X (merged with code) | X | X | X | (x) | (x) forms, site context |
| [WCAG-EM](../sources/wcag-em.md) | – | – | – | – | – | – | – | – | – | X complete processes |
| [ACT Rules](../sources/act-rules.md) | X | (x) semi-automated | – | – | – | – | – | – | – | – |
| [Trusted Tester](../sources/trusted-tester.md) | (x) | X | (x) | X (not verified) | – | – | – | – | – | – |
| [Uutilsynet](../sources/uutilsynet-test-rules.md) | X simplified control | – | – | – | – | – | – | – | – | – |
| [GOV.UK assistive technology testing](../sources/govuk-assistive-technology-testing.md) | X | – | (x) | (x) | X | X magnifier | – | – | – | X user research |
| [Accessibility Insights](../sources/accessibility-insights-assessment.md) | X | (x) assisted | (x) | X | – | not verified | not verified | not verified | not verified | – |
| [A11y Project checklist](../sources/other-testing-checklists.md) | – | – | (x) | X | – | – | (x) | X | (x) | – |

Observations:

- **Nav is the closest prior art.** Its six test protocols group criteria by method and shared tooling, with an
  "always test / test if relevant" split. Nav merges the code check and the screen-reader test into one protocol; we keep
  them apart because an AI can read the accessibility tree without a screen reader, while listening is a different
  activity. Nav's older guidance layers testing as automated, then manual, then user testing. No source was found for a
  Nav "test pyramid" as such; the [source page](../sources/nav-testing-guidance.md) records what was searched.
- **Three-way splits already exist for tools.** Accessibility Insights separates automated, assisted and manual tests,
  and ACT rules are implemented as automatic, semi-automatic or manual, with the outcome `cantTell` when a rule cannot
  decide. Our AI tier sits where "assisted" and `cantTell` sit: the cases a rule can find but not decide.
- **Published automation figures depend on the unit.** Deque reports 57% of *issues* found automatically in its audit
  data, but automated findings for only 16 of 50 WCAG 2.1 AA *criteria*; the GDS Way says automated testing finds "around
  30% of likely accessibility problems" without stating the basis
  ([automated coverage studies](../sources/automated-coverage-studies.md)). Our triage counts criteria, so it must not
  be compared with issue-based percentages.
- **No framework reports AI coverage.** This is the open question phase 2 addresses (D-017, D-019).

## Assessment

Strengths:

- One primary group per criterion makes coverage checkable: every criterion has a home, and `npm run wcag:methods`
  fails if one is missing.
- The automation tier rests on evidence from our own retest, not only on vendor claims.
- Groups match how people already test (Nav, GOV.UK), so the recipes are usable without the AI layer.

Weaknesses and open questions:

1. **"Automated" is a layer, not a group.** No criterion has automation *full*, so the automated group is primary for
   none. It works as a pre-pass that every other group builds on. It is kept as a group so its recipe has a home, but the
   analysis treats it as tier 1 of the triage.
2. **Time and media is overloaded.** With 19 primary criteria it mixes two activities: observing behaviour over time
   (2.2.x, 2.3.x) and judging media content (1.2.x, 1.4.7). Splitting it into "time and motion" and "media" may be
   better once the recipes have been used.
3. **The screen-reader pass is thin** (3 primary criteria), because most of what a screen reader reveals is predicted by
   the code and tree reading. Its value is confirmation. Whether an AI reading the accessibility tree can stand in for
   listening is one of the things phase 2 should measure.
4. **Site-level criteria fit badly on single test pages.** 2.4.5 Multiple Ways, 3.2.3 Consistent Navigation, 3.2.4
   Consistent Identification and 3.2.6 Consistent Help need several pages. Nav tests these "in the context of the
   site". Our test set covers some with linked example pages (D-022), not all.
5. **No "not applicable" gating yet.** Nav's "test if relevant" and WCAG-EM's sampling skip criteria whose content type
   is absent (no media, no forms). The recipes should start each group with an applicability check, so an agent does
   not spend tokens on a page without, for example, video.
6. **Other assistive technology is missing.** Speech input, magnification and switch access appear only as aspects of
   other groups (2.5.3 Label in Name, zoom). GOV.UK's guidance tests with several assistive technologies.
7. **Borderline calls.** 11 criteria are marked for review (`npm run wcag:review`), among them 2.5.3 Label in Name (code
   reading versus speech input), 3.3.1 Error Identification (flow versus language) and the flash criteria 2.3.1 and 2.3.2,
   where a flash analyser would be better than either AI or a person watching.

## Sources

- The source pages linked in the comparison table, each with its own references.
- W3C, *Understanding WCAG 2.2*, <https://www.w3.org/WAI/WCAG22/Understanding/>
- Retest evidence: [`data/results/ail-2026/runs/20261010T112606Z`](../../data/results/ail-2026/runs/20261010T112606Z)

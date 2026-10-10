# NAV (Nav) accessibility testing guidance on Aksel

> Status: AI-drafted, not human-reviewed

## What it is

The Norwegian Labour and Welfare Administration (Nav) publishes testing guidance for universal design (universell utforming) on its Aksel site, written by Nav's "Universell utforming" team. It consists of one process article (test in every phase) and a set of **test protocols**, each covering a group of WCAG success criteria with a shared method.

**Not found:** we searched for a Nav "testpyramide" or similar levels model (Aksel pages, navikt GitHub) and found none. The articles never name a pyramid or numbered levels. A navikt repository skill file mentions "axe-core in CI + manual tab-through + screen-reader test on one critical flow", but that is a secondary, repo-level note and is not verified here. Do not cite Nav as having a "pyramid" until a source is found. Nav's older UU site (navikt.github.io/uu) does layer testing in three methods: automated check first (said to cover only about 20 to 30 percent of possible errors), then a manual WCAG check, then user testing with people who use assistive technology. That ordering is pyramid-like, but the page does not call it a pyramid.

## Version/date

| Page | Last updated (as shown on page) |
|---|---|
| Test universell utforming i alle faser av produktutviklingen (process article) | 18 July 2024 |
| Test less! | 16 July 2025 |
| Six test protocols (below) | 18 July 2025 |
| Test min løsning (user testing with people with functional variation, with Digjobb) | 29 July 2026 |

Retrieved 2026-10-10. Pages carry a "may be outdated, not revised for over a year" banner. The protocols cover WCAG 2.1 numbering (they cite 4.1.1 Parsing as "always test").

## Licence

No licence is stated on the pages (footer "© 2026 Nav", link to the Aksel GitHub repository). Treat as all rights reserved: link and quote one sentence at most.

## How it groups testing

The protocols group WCAG criteria **by test method and shared tooling**, with a "always test / test if relevant" split. This is the closest prior art to our grouping.

| Nav protocol | Method | WCAG criteria (as listed on the page) | Tools |
|---|---|---|---|
| Tastaturnavigasjon | Tab through the page twice | 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 3.2.1, 3.2.2, 1.4.13 | Keyboard; optional landmark/headings extensions |
| Kodesjekk og skjermlesertest | Code check + screen reader | 1.3.1, 3.1.1, 3.1.2, 4.1.1, 4.1.2, 4.1.3, 2.5.3 | HTML validator, DevTools, VoiceOver/NVDA/Narrator |
| Interaksjonsmønstre og justerbarhet | Adjust display, check user control | 1.3.2, 1.3.4, 1.4.4, 1.4.10, 1.4.12, 1.4.13, 2.1.4, 2.2.1, 2.5.1, 2.5.2, 2.5.4 | Text-spacing bookmarklet, DevTools, optional screen reader |
| Innhold og fargebruk | Visual/content review in site context | 1.1.1, 1.3.3, 1.4.1, 1.4.3, 1.4.5, 1.4.11, 2.4.2, 2.4.4, 2.4.5, 2.4.6, 3.2.3, 3.2.4 | DevTools, automated tool (ARC, axe, Accessibility Insights), Colour Contrast Analyser |
| Skjemaer | Check forms conditionally | 1.3.5, 3.3.1, 3.3.2, 3.3.3, 3.3.4 | DevTools |
| Multimedia | Check media conditionally | 1.2.1, 1.2.2, 1.2.5, 1.4.2, 2.2.2, 2.3.1 | None |

The process article adds phases rather than levels: Innsikt (research, contact centre, user testing), Design (prototypes, colour), Utvikling (linting, component and end-to-end tests, then reflow/zoom, text spacing, heading levels, screen reader in full-page context), and expert users with assistive technology. "Test less!" proposes testing representative pages and answering criteria as "not applicable" when the content type is absent.

Automation is treated as one tool inside the protocols (contrast and content checks), not as a separate level. The process article says keyboard and automatic/manual tests exist but does not rank them.

## What we use it for

| Nav protocol | Our group |
|---|---|
| Tastaturnavigasjon | `keyboard` |
| Kodesjekk og skjermlesertest | `code-and-tree` plus `screen-reader` (Nav merges them) |
| Interaksjonsmønstre og justerbarhet | `zoom-reflow` (1.3.4, 1.4.4, 1.4.10, 1.4.12) plus `pointer-motion` (2.5.x, 2.1.4) plus 2.2.1 in `time-media` |
| Innhold og fargebruk | `visual` (1.4.x contrast, colour, text images) plus `language-cognition` (2.4.x titles, headings) plus `multi-step-flow` (3.2.3, 3.2.4, 2.4.5, "in context of the site") |
| Skjemaer | `multi-step-flow` / `language-cognition` (3.3.x) |
| Multimedia | `time-media` |

- Strong confirmation: grouping by method with a shared procedure, and conditional "test only if relevant" gating, matches our design.
- We have, and Nav lacks: an explicit `automated` pass and a triage that tries tool, then AI, then human.
- Nav has, and we lack: the site-level view ("page in the context of the whole site") and the "not applicable" gating by content type; the Insight/Design phases and user testing with disabled people.
- Nav splits 1.4.13 across keyboard and interaction protocols, so some SCs need more than one group; our assignment should allow a primary and secondary group.

## Sources

- Nav, *Test universell utforming i alle faser av produktutviklingen*, <https://aksel.nav.no/god-praksis/artikler/uu-testing>
- Nav, testing topic index, <https://aksel.nav.no/god-praksis/universell-utforming?undertema=Testing>
- Protocols: <https://aksel.nav.no/god-praksis/artikler/testprotokoll-tastaturnavigasjon>, <https://aksel.nav.no/god-praksis/artikler/testprotokoll-kodesjekk-og-skjermlesertest>, <https://aksel.nav.no/god-praksis/artikler/testprotokoll-interaksjonsmonstre-og-justerbarhet>, <https://aksel.nav.no/god-praksis/artikler/testprotokoll-innhold-og-fargebruk>, <https://aksel.nav.no/god-praksis/artikler/testprotokoll-skjemaer>, <https://aksel.nav.no/god-praksis/artikler/testprotokoll-multimedia>
- Nav UU team, *UU-testing* (automated, manual, user testing), <https://navikt.github.io/uu/hvordan-faa-det-til/UU-testing/>
- Nav, *Test less!*, <https://aksel.nav.no/god-praksis/artikler/test-less>

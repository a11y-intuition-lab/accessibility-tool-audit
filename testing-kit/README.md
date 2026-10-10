# Testing kit

> Status: AI-drafted, not human-reviewed

Method material for testing a web page against WCAG 2.x (all versions, all levels), grouped by test method. It is phase 2 of this project (decision D-025 in [the decision log](../wiki/decisions.md)). Each recipe in [`recipes/`](./recipes/) says how to collect the data for one group of success criteria and how to judge it. The recipes are written so that a person can follow them by hand, and so that an AI can later turn them into prompts or a skill for an agent that tests pages itself, possibly an orchestrator with one subagent per group, with data collection separated from judging.

## What it is not

- It is not a compliance certificate. A page with no findings has not been shown to conform; a `passed` outcome means only that the tester found no failure in the collected data.
- It is not validated yet. The first validation is a run against the 221 test pages of this repository, whose expected barriers are known (see [methodology](../wiki/index.md)). Until then the recipes are a draft, and the numbers they cite are from our phase 1 retest, not from the kit.
- It does not replace testing with people who use assistive technology.

## Files

| File | Content |
|---|---|
| [`recipes/<group-id>.md`](./recipes/) | One recipe per test-method group, same section order in every file |
| [`../data/mappings/sc-test-methods.json`](../data/mappings/sc-test-methods.json) | The 87 success criteria: group, automation, AI and human triage, and rule ids |

Every recipe has the same sections: Criteria (a table that a script fills from the data file), Setup, Collect, Judge, Already covered by tools, AI and human, Report, Sources.

## Groups and triage

Each criterion has one primary group, where it is most efficiently verified in full, and sometimes secondary groups where part of it is checked. Each criterion is also triaged three times in the data file:

1. **Automation** (`full`, `partial`, `none`): can axe-core or HTML_CodeSniffer decide it? No criterion is `full`, so the automated group has no primary criteria; it is a pass that every page gets first.
2. **AI** (`likely`, `possible`, `unlikely`) and the data it needs (`dom`, `accessibility-tree`, `screenshot`, `focus-trace`, `zoomed-render`, `text-spacing-render`, `interaction`, `media`, `timing`, `multi-page`).
3. **Human** (`must`, `should`, `optional`): whether a person has to test, should confirm an AI first pass, or can leave it to tools and AI.

The order of work follows the triage: automated tools first because they are cheapest; an AI for what the tools cannot decide, given the collected data; a person where the data file says `must` or `should`. The triage is AI-proposed and review-pending, so a recipe states the data file's level and does not override it.

## Order of passes

1. **automated** — cheapest, no judgement, and its output tells later passes where to look.
2. **code-and-tree** — one DOM and accessibility-tree capture serves 15 criteria.
3. **visual** — reuses the same page load at 100% zoom; colour, contrast, images of text.
4. **keyboard** — first pass that needs input; a script can walk the page once and store the trace.
5. **zoom-reflow** — changes the viewport; kept together so the page is resized once.
6. **pointer-motion** — changes the input device to touch and mouse.
7. **time-media** — waiting and playing media take the longest wall-clock time; started late so earlier passes are not blocked, and it can run in parallel for an agent.
8. **language-cognition** — reading work on text that earlier passes already extracted.
9. **multi-step-flow** — needs a defined process and several pages; last because it benefits from knowing the page's forms and navigation from earlier passes.
10. **screen-reader** — last, as the assistive-technology pass. It is the slowest, needs a real screen reader, and its results are easier to interpret once structure, names and status regions are known.

The order exists to limit context switches for a person: each step keeps the same tool and mental mode (reading source, looking at pixels, using keys, resizing, pointing, waiting, reading text, following a process, listening). For an agent the order matters little, because collection is scripted and can run in parallel; what matters is that collection for a group finishes before its judging starts, and that judging uses stored artifacts only. Two deliberate choices: `time-media` may start first as a background job because it waits; and `language-cognition` may move directly after `visual` for a person who is already reading page content.

## Outcomes

Each finding uses one of four outcomes, borrowed from the W3C ACT Rules Format ([ACT Rules](../wiki/sources/act-rules.md)):

| Outcome | Meaning |
|---|---|
| `failed` | The data shows that the criterion is not met at this location |
| `passed` | The data was checked and shows no failure at this location |
| `inapplicable` | The content the criterion is about does not exist on the page |
| `cantTell` | The data cannot decide. This is the route to escalate: to a later pass, to an AI with more data, or to a person |

`cantTell` is a correct and expected answer, not an error. An AI that has to guess instead of answering `cantTell` makes the results worse. Several criteria (live captions, sign language, audio description adequacy, flashing without an analyser) are `cantTell` for an AI by design.

## Finding format

All recipes use the same format (the Report section of each recipe has the rules and an example):

| Field | Content |
|---|---|
| `criterion` | Success criterion id, for example `1.4.3` |
| `outcome` | `failed`, `passed`, `inapplicable` or `cantTell` |
| `location` | Page URL plus CSS selector |
| `evidence` | Short factual text with a reference to the collected artifact |
| `confidence` | `high`, `medium` or `low` |
| `tester` | `human` or the model id |

## Principles

- **Collect, then judge.** Collection gathers data without judgement and can be done by a script or a cheap model. Judging uses only the stored data, so a judge can be repeated or replaced.
- **Say what you did not look at.** A finding names its sample and its assumptions (audience, pages compared).
- **Blinded AI runs.** AI runs against this repository's test pages use a separate blinded build (D-026) and start only on the project owner's go-ahead (D-027).

## Sources

- [Decisions D-025 to D-027](../wiki/decisions.md).
- [ACT Rules](../wiki/sources/act-rules.md), [Nav testing guidance](../wiki/sources/nav-testing-guidance.md) and the other prior groupings in [`wiki/sources/`](../wiki/sources/).
- WCAG 2.2, <https://www.w3.org/TR/WCAG22/>; ACT Rules Format 1.1, <https://www.w3.org/TR/act-rules-format-1.1/>.

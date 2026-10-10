# GOV.UK guidance: testing for accessibility and with assistive technologies

> Status: AI-drafted, not human-reviewed

## What it is

GOV.UK Service Manual pages telling UK government teams how to test, and the minimum assistive technology (AT) matrix before public beta. Background on the 2017 audit: [GOV.UK 2017 audit](govuk-audit-2017.md).

## Version/date

- *Testing for accessibility*: first published 6 March 2019, last updated 29 October 2024.
- *Testing with assistive technologies*: last updated 24 May 2022; matrix last changed 21 September 2020.
- GDS Way accessibility manual: reviewed 23 September 2026 (see [automated coverage](automated-coverage-studies.md)).

## Licence

Open Government Licence v3.0 (except where stated); quoting is fine with attribution.

## How it groups testing

A sequence over the project lifecycle, not by criterion:

| Step | What |
|---|---|
| 1 Early design checks | WCAG principles, contrast on prototypes |
| 2 Automated | Axe, WAVE, ARC Toolkit, SiteImprove once production code exists |
| 3 Manual | keyboard, link text, contrast, alt text, form labels, browser tools |
| 4 AT testing | screen readers etc.; yourself or as part of an audit |
| 5 User research | disabled and older users |
| 6 Formal audit | before public beta |

AT matrix: JAWS 2019+, NVDA, VoiceOver iOS, TalkBack, Windows Magnifier or Apple Zoom, Dragon 15+, each with a named browser. The page warns "you'll miss some issues if you only do automated testing". No AI content found.

## What we use it for

- Confirms the ordering automated, then manual, then AT, then users, i.e. our triage direction. Our groups split their "manual" step by method (keyboard, zoom-reflow, visual).
- The matrix is the reference for the AT versions our `screen-reader` recipe must pin; note it adds *speech recognition* (Dragon) and *magnifier* which our groups do not name (speech control relates to 2.5.3 and could be a gap).
- We lack: user research and audit steps (out of scope for tool-driven phase 2).

## Sources

- <https://www.gov.uk/service-manual/technology/testing-for-accessibility>
- <https://www.gov.uk/service-manual/technology/testing-with-assistive-technologies>
- <https://gds-way.digital.cabinet-office.gov.uk/manuals/accessibility.html>

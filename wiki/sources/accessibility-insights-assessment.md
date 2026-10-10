# Accessibility Insights for Web: Assessment

> Status: AI-drafted, not human-reviewed

## What it is

Microsoft's open-source browser extension. **FastPass** is a short check (automated checks plus tab stops). **Assessment** is a guided evaluation against WCAG 2.2 Level AA, organised into tests, each made of requirements.

## Version/date

Current docs state 24 tests and WCAG 2.2 AA; the page gives no version number (JSON report version equals the extension version). An older overview describes WCAG 2.1 AA, automated checks for about 50 requirements and about 20 manual tests; a separate "Quick Assess" has 10 requirements. Retrieved 2026-10-10.

## Licence

Not verified. The project is open source on GitHub (`microsoft/accessibility-insights-web`); licence not read. Docs: link only.

## How it groups testing

Each requirement is labelled by who does the work:

| Type | Meaning (docs) |
|---|---|
| Automated | the tool identifies and evaluates instances itself |
| Assisted | the tool helps identify or evaluate instances (visual helper, instance list) |
| Manual | the tool gives instructions for identifying and evaluating instances |

Tests are grouped by topic/method, e.g. Automated checks, Keyboard, Landmarks. **Not verified:** the full list of 24 test names; the docs pages we fetched do not list them, and a search did not return them either. Keyboard is described as manual with a tab-stop visualisation; Landmarks as the first test producing an automatic instance list. We found no AI content.

## What we use it for

- Direct prior art for a three-way automation tag. Their *assisted* class (tool finds instances, human judges) is the nearest existing equivalent of our "AI proposes, human confirms" tier, and also of `code-and-tree`.
- Their tests are topic-based, like Nav's; confirms Keyboard as its own early group.
- Action: get the 24 test names from the extension or repo and map them to our groups.

## Sources

- <https://accessibilityinsights.io/docs/web/getstarted/assessment/>
- <https://accessibilityinsights.io/docs/web/overview/>
- <https://accessibilityinsights.io/docs/web/getstarted/quickassess/>

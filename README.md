# Accessibility tool audit

Part of [A11y Intuition Lab](https://a11yintuition.org) — *Play. Reflect. Design for everyone.*

A11y Intuition Lab helps students and IT professionals develop the knowledge,
skills, attitudes, and habits to make digital accessibility part of everyday
practice. It creates open, hands-on learning tools that make human variation,
context, and digital barriers tangible.

## About this copy

This is an independent copy of the [accessibility tool audit](https://alphagov.github.io/accessibility-tool-audit/) by the Government Digital Service (GDS), maintained by A11y Intuition Lab (AIL). The original test cases and results are unchanged. The GDS text has been adapted to say "GDS" where it said "we", so it is clear who did what.

In September 2026, AIL:
- replaced the old build tools so the project can be built safely
- added 52 test cases for WCAG 2.0, 2.1 and 2.2 success criteria up to level AAA
- retested every test case with axe-core and pa11y
- wrote test procedures an AI can follow for the barriers the two tools miss, and ran them with Claude

This work was done with the AI coding assistant Claude Code and was not carried out, reviewed or endorsed by GDS.

- Site: [a11yintuition.org/accessibility-tool-audit](https://a11yintuition.org/accessibility-tool-audit/)
- Method, use of AI and how to repeat the retest: [method page](https://a11yintuition.org/accessibility-tool-audit/method.html)
- Instructions, decisions and corrections made along the way: [process log](docs/process-log.md)

## About the audit

Automated accessibility checkers can be used to help identify accessibility issues in digital services. They're good for finding simple and obvious problems, but aren't able to detect many accessibility issues.

This repo contains a collection of accessibility failures to be used for testing automated accessibility tools and test results from those tools.

[Read the GDS blog post](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/) about how GDS did the automated tool testing.

## About the test cases

The test cases are a collection of the wide variety of potential accessibility issues that can exist. There are probably many more that GDS or AIL have not thought of.

The original audit (GDS, 2016 to 2018) has 142 test cases. Test cases added later cover WCAG 2.0, 2.1 and 2.2 success criteria up to level AAA that the original audit did not cover. They have a `wcag` field and no original `results`, and are marked "Added" on the site.

## Contributing / updating results

AIL welcomes issues / pull requests for updated or new test cases or tool results. All relevant content can be found in `tests.json`. (All the HTML files are automatically created from that one file.)
Read more on [how to contribute](CONTRIBUTING.md).

## Installing

You need Node.js 22.13 or later. No Python or global packages are needed.

```
npm ci
npm run build
npm run serve
```

Then open [http://localhost:8000/](http://localhost:8000/) to see the generated HTML output.

`npm run build` generates the HTML from `tests.json` (`npm run generate`) and compiles the Sass (`npm run sass`).

## Retesting with axe-core and pa11y

```
npm run retest
```

This runs axe-core and pa11y (HTML_CodeSniffer) against every page in `tests/` using the Chrome installed on your machine (`/usr/bin/google-chrome`, override with `CHROME_PATH`). Run `npm run build` first so the test pages are up to date.

- When a test case is only a link to a page in `example-pages/`, the linked page or pages are tested instead of the test page (`scripts/targets.mjs`).
- Findings that also appear on `tests/_baseline.html`, an empty test page, are ignored because they come from the page template. On example pages, rules that fire on `example-pages/_baseline.html` are ignored.
- axe violations count as "issue found" and incomplete results as "user to check". pa11y errors count as "issue found" and warnings as "user to check". pa11y notices are ignored.
- Proposed results are written to `retest.json`. Existing entries are kept unless you run `npm run retest -- --force`. Use `--only=<part of test name>` to run a subset.
- Raw findings and a summary for review are written to `results/<date>/`.

A finding on a page does not prove the tool found the intended barrier. Check `results/<date>/summary.md` and correct `retest.json` by hand before committing, then run `npm run build` again.

## Checking with AI

The AI check is preliminary. The model gets screenshots, but most of its findings rest on the HTML, the accessibility tree and values the evidence script measured, not on how the page looks. See the limitations on the method page.

```
npm run ai-check
```

This runs the test procedures in `ai-checks.json` with Claude on Amazon Bedrock. It needs `AWS_REGION` and the model in `ANTHROPIC_DEFAULT_OPUS_MODEL` (or `--model=`). Run `npm run build` first.

- `scripts/ai-evidence.mjs` collects evidence from each page in headless Chrome: HTML, accessibility tree, styles, screenshots, Tab stops, what happens on Enter, Escape, hover, zoom and more. Run `node scripts/ai-evidence.mjs tests/<file>.html` to see what the model gets for one page.
- Names that give away the test case (title, first heading, class names, ids, file names) are replaced before the model sees the page.
- The control pages in `controls/` (from `controls.json`) have no known barrier. Failures on them are false positives.
- Results go to `retest.json` (`ai` for each test case), findings to `results/<date>/ai.json` and a summary for review to `results/<date>/ai-summary.md`. Answers are cached in `results/<date>/ai-cache/`.
- `--only=`, `--force` and `--controls` work as for the retest.

`npm run build` fails if a test case that neither axe nor pa11y finds is not covered by a procedure in `ai-checks.json`.

## Licence

All content, including the test cases and results, is available under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/). The original content is © Crown copyright (Government Digital Service). The additions are by AIL contributors and are available under the same licence.

Contains public sector information licensed under the Open Government Licence v3.0.

The code is released under the MIT Licence, a copy of which can be found in the file `LICENSE`.

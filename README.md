# Accessibility tool audit

Automated accessibility checkers can be used to help identify accessibility issues in digital services. They're good for finding simple and obvious problems, but aren't able to detect many accessibility issues.

This repo contains a collection of accessibility failures to be used for testing automated accessibility tools and test results from those tools.

[Read our blog post](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/) about how we did the automated tool testing.

## About the test cases

The test cases are a collection of the wide variety of potential accessibility issues that can exist. There's probably loads more we haven't thought of.

The original audit (GDS, 2017 to 2018) has 142 test cases. Test cases added later cover WCAG 2.0, 2.1 and 2.2 success criteria up to level AAA that the original audit did not cover. They have a `wcag` field and no original `results`, and are marked "Added" on the site.

## Contributing / updating results

We welcome issues / pull requests for updated or new test cases or tool results. All relevant content can be found in `tests.json`. (All the HTML files are automatically created from that one file.)
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

- Findings that also appear on `tests/_baseline.html`, an empty test page, are ignored because they come from the page template.
- axe violations count as "issue found" and incomplete results as "user to check". pa11y errors count as "issue found" and warnings as "user to check". pa11y notices are ignored.
- Proposed results are written to `retest.json`. Existing entries are kept unless you run `npm run retest -- --force`. Use `--only=<part of test name>` to run a subset.
- Raw findings and a summary for review are written to `results/<date>/`.

A finding on a page does not prove the tool found the intended barrier. Check `results/<date>/summary.md` and correct `retest.json` by hand before committing, then run `npm run build` again.

## Licence

Released under the MIT Licence, a copy of which can be found in the file `LICENCE`.

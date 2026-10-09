# Accessibility tool audit

A collection of accessibility failures, used to test how well automated accessibility checkers find them. Automated
checkers are good at finding simple and obvious problems, but they cannot detect many accessibility issues.

This repository contains the test cases (142 so far, in 19 categories) and the website that presents them. Each test case
is deliberately flawed and contains one specific failure.

## Origin and changes

This is a fork of [alphagov/accessibility-tool-audit](https://github.com/alphagov/accessibility-tool-audit), created by
the GDS accessibility team in 2017 and archived in 2019. It is maintained by A11y Intuition Lab (AIL), which is
retesting the test cases with axe-core and pa11y and extending them to cover WCAG 2.0, 2.1 and 2.2.

- The original site: <https://alphagov.github.io/accessibility-tool-audit/>
- The original blog post: [What we found when we tested tools on the world's least accessible webpage](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/)
- The upstream final state is tagged `govuk-final` in this repository.

What changed: the build was replaced with Eleventy, each test case now lives in its own file under `src/test-cases/`,
the results for the 13 original tools were removed (they remain upstream), and the site was rebuilt without GOV.UK
branding. The GOV.UK test-case pages and the files they load are frozen and must stay byte-identical to `govuk-final`.
Every change to upstream material is recorded in [`wiki/provenance.md`](wiki/provenance.md).

## Build

Requires Node.js 22 or later and npm 11.15 or later (for the `min-release-age` setting in `.npmrc`).

```
npm ci
npm run build    # writes the site to _site/
npm run verify   # checks the frozen fixtures against the govuk-final tag
npm start        # local server with live reload
```

`npm run verify` needs the `govuk-final` tag in your clone (`git fetch --tags`). It compares all 142 test pages and the
fixture assets in `_site/` with `govuk-final` and fails on any difference.

## Layout

- `src/test-cases/` one file per test case (front matter plus the example HTML)
- `src/_includes/` page templates (`fixture-govuk.njk`, `fixture-ail.njk`, `base.njk`)
- `src/site-assets/site.css` styles for the site itself (not for test cases)
- `assets/`, `example-pages/` frozen fixture assets, copied unchanged
- `scripts/` verification and one-off import scripts
- `data/`, `wiki/` research data and the project wiki

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT. Crown Copyright 2017 (Government Digital Service) for the original work; additions copyright 2026 A11y Intuition
Lab. See [LICENSE](LICENSE).

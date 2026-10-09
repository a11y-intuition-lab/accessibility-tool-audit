# Source: GOV.UK accessibility tool audit (2017)

| | |
|---|---|
| What | Test page with deliberately introduced accessibility barriers, plus results from 13 automated tools |
| By | GDS accessibility team, UK Government Digital Service |
| Version used | `e9e46115` (tag `govuk-final`), 2019-05-22 |
| URL | <https://github.com/alphagov/accessibility-tool-audit> |
| Licence | MIT, © 2017 Crown Copyright |
| Used for | Starting set of test cases and the method this project extends |

## Summary

GDS built a page with 142 accessibility barriers in 19 categories (content, typography, links, forms, keyboard access and
others) and ran 13 automated checkers against it. Each result was recorded manually as one of: issue found, issue found
(paid version), warning only, user to check, noticed but not a fail, or not found. The headline finding was that
automated tools found only a minority of the barriers.

The test cases have no mapping to WCAG success criteria. Results were last updated in April 2018, and several of the
tools no longer exist.

## Sources

- Repository: <https://github.com/alphagov/accessibility-tool-audit>
- Blog post: <https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/>

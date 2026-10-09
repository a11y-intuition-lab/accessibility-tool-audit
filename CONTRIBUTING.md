# How to contribute

We welcome issues and pull requests, in particular new test cases. Read [`AGENTS.md`](AGENTS.md) and
[`wiki/provenance.md`](wiki/provenance.md) first.

## One file per test case

Each test case is a file in `src/test-cases/`. The file name is the slug and the URL, so
`src/test-cases/forms-example.html` is built to `tests/forms-example.html`.

```
---
title: "Name of the test case"
category: "Forms"
origin: ail-2026
categoryOrder: 14
order: 12
---
<form>... the example HTML, exactly as it should appear ...</form>
```

- `title` is the heading of the test page.
- `category` groups test cases. `categoryOrder` and `order` set the order of categories and of test cases within a
  category.
- `origin` says where the test case comes from: `govuk-2017` (original, frozen) or `ail-2026` (added by AIL).
- The body is the example HTML. It is not processed by any template engine, so it appears in the page as written.
- Make the example as isolated as possible: one failure per test case.

Images used by an example go in `assets/test_images/` and are referenced as `images/<file>`; links to local example
pages use `example-pages/<file>`. The build rewrites both to the right relative paths.

## Frozen fixtures

The 142 `govuk-2017` test cases, `assets/javascript/`, `assets/stylesheets/tests.css`, `assets/test_images/` and
`example-pages/` are the objects being measured. Do not change them. `npm run verify` fails if any of them differs from
the `govuk-final` tag. If a change is truly needed, record it and the reason in `wiki/provenance.md` and update the
verification deliberately.

New `ail-2026` test cases use a separate page template that differs from the GOV.UK one only in the `<title>` suffix
("A11y Intuition Lab").

## Before you open a pull request

```
npm ci
npm run build
npm run verify
```

## Testing a tool against the test cases

Check each test case on its own page, not the combined page. Use the most inquisitive options (for example AAA rather
than AA), and look for the one issue the test case is meant to show. Some test cases only link to an example page; test
that example page instead.

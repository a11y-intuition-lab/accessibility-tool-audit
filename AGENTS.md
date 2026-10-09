# Working in this repository (humans and AI agents)

This repository is **public**. Everything committed here is published. It is a fork of the archived
[alphagov/accessibility-tool-audit](https://github.com/alphagov/accessibility-tool-audit), extended and retested by
A11y Intuition Lab (AIL). Read [`wiki/provenance.md`](wiki/provenance.md) before changing anything.

## Ground rules

1. **Provenance first.** Every test case, result and document must say whether it comes from GOV.UK (`govuk-2017`) or
   AIL (`ail-2026`). Never edit GOV.UK material silently; record any change in `wiki/provenance.md`.
2. **Fixtures are frozen.** The test-case pages and the files they load (`assets/javascript/`, `assets/stylesheets/tests.css`,
   `assets/test_images/`, `example-pages/`) are the objects being measured. Changing them changes the experiment.
   A fixture change needs a log entry and a reason.
3. **Reproducible by default.** Pin tool versions, store raw tool output, and make classification a script, not a judgement
   call. If an AI proposes a mapping or classification, store the proposal as data with its rationale, so the result can be
   regenerated without the AI.
4. **Publish consciously.** No personal data, no private notes, no copies of copyrighted sources (link and quote briefly;
   quoting WCAG under the W3C licence is fine).
5. **English** for everything in the repo.

## The wiki (`wiki/`)

The wiki is an LLM-maintained knowledge base for this project, in the style of an "LLM wiki": raw sources stay
untouched, the wiki holds the synthesised, cross-linked understanding, and this file is the schema.

- `wiki/index.md` — catalogue of every page, with a one-line summary. Update it when a page is added.
- `wiki/log.md` — append-only, newest last. One entry per meaningful change: date, what, why, link.
- `wiki/provenance.md` — what is GOV.UK, what is AIL, and every change to upstream material.
- `wiki/decisions.md` — numbered decisions (D-001 …) with date, decision, reason, consequences. Never rewrite an old
  decision; supersede it with a new one.
- `wiki/sources/` — one page per external source (what it is, version, URL, licence, what we use it for).
- `wiki/method/` — how things are done: test procedures, coding protocol, retest instructions.
- `wiki/analysis/` — findings, such as the WCAG gap analysis.

Page conventions: Markdown, one H1 per page, relative links between pages, a "Sources" section at the end when claims
rely on external material. Mark AI-generated content that has not been reviewed by a human with
`> Status: AI-drafted, not human-reviewed`.

Operations:
- **Ingest:** a new source → add `wiki/sources/<name>.md`, update affected pages, add a log entry.
- **Query:** answer from the wiki; if the answer is worth keeping, write it back as a page.
- **Lint:** look for contradictions, stale claims, orphan pages and missing provenance.

## Data (`data/`)

Research data, separate from the website source. Upstream material and AIL material live in separate files or folders.

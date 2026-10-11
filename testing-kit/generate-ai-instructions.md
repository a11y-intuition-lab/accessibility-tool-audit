# Prompt: generate AI testing instructions from the testing kit

> This file is the prompt the project owner gives to an AI agent to generate the AI testing instructions (prompt or
> skill) from the testing kit (D-025, D-027). It is published so the generation step can be repeated.
>
> How to use: run `npm run kit:setup` once from the repository root, make sure `testing-kit/ai-kit/` and
> `testing-kit/.site/` do not exist (the test pages are built only for the run, with `npm run blind:build`), then start Claude Code in `testing-kit/` (its `.claude/settings.json` limits the agent to reading this folder,
> writing to `ai-kit/` and the local machine only) and ask it to follow this file.

---

You are going to write instructions that let an AI agent test web pages for accessibility against WCAG 2.x (2.0, 2.1
and 2.2, levels A, AA and AAA), using the testing kit described below. You write the instructions; you do not test any
page yourself.

## Input

You have the files in this folder, and only these:

- `README.md` — what the kit is, the automated pre-step plus ten test-method groups, the order of passes, the outcomes
  (`failed`, `passed`, `inapplicable`, `cantTell`) and the finding format.
- `pre-step-automated.md` — the automated pre-step (axe-core and HTML_CodeSniffer).
- `recipes/<group>.md` — one recipe per group: Criteria, Setup, Collect, Judge, Already covered by tools, AI and human,
  Report, Sources.
- `finding.schema.json` — the JSON schema that every result must follow.
- `sc-test-methods.json` — all 87 success criteria with their group, automation, AI and human triage.
- `check-environment.mjs` and `serve.mjs` — how the environment below is used (see "Environment").

Do not open `.site/`, `node_modules/` or `.browsers/`; they are tools and test material, not method.

Treat the recipes as the method. Do not add criteria, outcomes or judging rules that the recipes do not contain. Where a
recipe is unclear, choose the stricter reading and note the choice in your design notes.

## What to produce

Write the instructions as files in the folder `ai-kit/` (create it):

1. **`README.md` — design notes.** How the instructions are structured and why, how each group is run, which model you
   recommend for each role and why, what you left out and why, and every place where you had to interpret the kit.
2. **The orchestrator instructions.** The entry point. Given one or more page URLs, it runs the automated pre-step,
   decides per group whether the group applies to the page, runs the groups, and merges the results into one findings
   file per page that validates against `finding.schema.json`.
3. **One set of instructions per group** (ten groups), for a subagent. Each follows its recipe: first collect the data
   listed under Collect, then judge only from what was collected, criterion by criterion as listed under Judge.

Write them as a Claude Code skill in `ai-kit/` (`SKILL.md` for the orchestrator, plus one file per group that the
orchestrator gives to a subagent), unless you have a strong reason for another form; if so, explain it in the design notes.

## Requirements

- **Split collection from judging.** Collection follows the recipe's Collect steps and needs no judgement, so it can be
  done by a script or by a small, cheap model. Judging uses only the stored artifacts. Store artifacts as files with
  names that findings can cite as evidence.
- **Use the pre-step.** Run axe-core and HTML_CodeSniffer first and pass their results to each group as context, as
  `pre-step-automated.md` describes. A rule result alone never decides a criterion's outcome, except where the recipe
  says so.
- **Choose the cheapest model that is good enough** for each role. Prefer Claude Haiku for collection and mechanical
  steps, Claude Sonnet for most judging, and a larger model only where the recipe's AI level and the task need it.
  Name the model per role in the design notes, and record the model ids used in the `tester.models` field of the output.
- **Report `cantTell` instead of guessing.** Follow each recipe's "Answer `cantTell` when" rules. Where the triage says
  a person must test, the AI answer is `cantTell` unless the recipe names a step the AI can decide (for example, whether
  an alternative exists at all).
- **Report every criterion the group covers** for the page: `failed`, `passed`, `inapplicable` or `cantTell`. Missing
  criteria count as not tested.
- **One finding per failure location.** Give the CSS selector where the failure concerns an element.
- **Do not rely on page titles, headings, file names or URLs to guess what is wrong.** Judge what the page does.
- **Do not change the pages**, apart from the temporary changes a recipe asks for (zoom, text-spacing override,
  viewport), and reload the page after each.
- **Keep it general.** The instructions should work on any web page, not only on test pages, so they can be used in
  software development later. Do not mention any particular test set, test page or earlier result.
- **Only pages the tester may test.** State in the orchestrator and in the shared rules that the instructions may be
  run only against pages the user owns or has permission to test, normally the local test server. Steps that submit
  forms, try logins, press many keys or activate every control must never run against third-party sites.
- **Mark every file.** Start every Markdown file you write with the line
  `> Status: AI-generated from the testing kit; not human-reviewed.`

## Environment the instructions can assume

- Bash commands run in a sandbox with no internet access; the sandbox has its own `localhost`. Everything the tester
  needs is in this folder:
  - `node_modules/` with `playwright-core` 1.63.0, `axe-core` 4.13.0 and `pa11y` 10.0.0 (HTML_CodeSniffer runner);
  - Chromium in `.browsers/` (set `PLAYWRIGHT_BROWSERS_PATH` to that folder; launch with `--no-sandbox`);
  - `serve.mjs`, which serves the pages to test on `http://127.0.0.1:8090/`. The tester must start it itself inside its
    sandbox (`node serve.mjs`) before testing, and stop it afterwards.
  - `check-environment.mjs` shows the whole chain working: server, Chromium, axe-core and pa11y.
- The tester gets page URLs on that server and nothing else. Pages may link to other pages on the same server; follow
  those links when a recipe needs several pages.
- A Chromium browser that can be driven by script (Playwright), with keyboard, pointer and viewport control,
  screenshots, the accessibility tree, and the ability to inject axe-core and run HTML_CodeSniffer through pa11y.
- Write run output under `ai-kit/runs/`.
- File read and write for artifacts and results.
- Subagents with a choice of model.
- No screen reader and no audio output. The screen-reader group works from the browser's accessibility tree and
  must say so in its findings.
- Media files can be downloaded and inspected with standard tools if available; if a needed tool is missing, the
  affected criteria are `cantTell` with the reason.

## When you are done

List the files you wrote, and give a short summary of the design notes: structure, model per role, and the main
interpretations of the kit.

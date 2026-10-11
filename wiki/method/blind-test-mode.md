# Blinded test mode

> Status: AI-drafted, not human-reviewed

How AI testers get the test pages without being told the expected barrier ([D-026](../decisions.md)). The AI only gets
URLs on a local server, and works in a closed folder ([`testing-kit/`](../../testing-kit/README.md)).

## Commands

| Command | What it does |
|---|---|
| `npm run kit:setup` | Installs the closed workspace's own tools in `testing-kit/` (pinned `playwright-core`, `axe-core`, `pa11y`, and Chromium in `testing-kit/.browsers/`) |
| `npm run test-mode` | Builds the site, builds the blinded copy and serves it on `http://127.0.0.1:8090/` |
| `npm run blind:build` | Writes `testing-kit/.site/` and `.blind/` from `_site/` (run `npm run build` first) |
| `npm run blind:serve` | Serves `testing-kit/.site/` only (`--port=` to change the port); the same as `node serve.mjs` in `testing-kit/` |
| `npm run blind:verify` | Checks that blinding changes no tool result (about 12 minutes) |

Both outputs are git-ignored and rebuilt with new random names each time:

- `testing-kit/.site/`: what the tester may see, inside the closed workspace. Test pages are `p/<id>.html`, example pages `x/<id>.html`, assets `a/<id>.<ext>`.
- `.blind/urls.txt`: the test-page URLs in random order.
- `.blind/key.json`: the key back to test cases, example pages, assets and renamed names, with the source commit. It is
  never served, and is used only when findings are classified. It must be stored with the AI run's results.
- `.blind/verify.json`: the verification report.

## What blinding changes

Every test page names its barrier, and not only in the title: in file names (`keyboardtrap.html`), in CSS and JS comments
("Outline not visible"), and in class, id and data attribute names (`missing-labels-year`, `data-ail-block-paste`). The
blinded copy differs from `_site/` in exactly these ways:

1. File names are opaque and every local reference is rewritten to them.
2. On test pages only, the template `<title>` and the template `<h1>` read "Test page". The element stays, so the heading
   structure is unchanged. Example pages keep their titles and headings, because some barriers are titles.
3. HTML, CSS and JS comments are removed from the fixtures. jQuery is copied unchanged.
4. Class, id, keyframes and `data-ail-*` names are replaced by opaque tokens, consistently in HTML, CSS and JS.

Everything else is byte-for-byte the same. The build fails on any unresolved local reference or leftover original name.

## Verification

Blinding changes the files being measured, so it must not change what the tools see. `npm run blind:verify` serves the
original and the blinded site side by side and runs axe-core and HTML_CodeSniffer on both, with the exact settings of
the retest (`scripts/retest/config.mjs`, shared with `run.mjs`). Per page it compares axe-core rule results and node
counts, and HTML_CodeSniffer codes, types and counts. It also compares full-page screenshots.

Result on 2026-10-11 (source commit `f882211` plus the uncommitted test-mode code):

- 221 test pages and 23 linked example pages compared: **no difference** in any tool result. Differences in rules
  about the page title or the template heading would have been accepted as expected; none occurred.
- Second run (2026-10-11, after the site moved to `testing-kit/.site/`): 243 pages identical; one page differed in
  axe-core results on `hidden-content`, `color-contrast` and `region` counts. That page's text blinks with a CSS
  animation that hides it every other half second, so the result depends on the moment axe runs. The blinded page has
  the same animation (checked: class and keyframes renamed consistently), so this is timing, not blinding. Pages with
  running animations can differ between any two runs, blinded or not.
- Screenshots: 6 pages differ outside the heading. One differs by 3.75%, because its original heading wraps to two
  lines, which moves the content below it. The other five differ by under 0.25% because of animation timing (animated
  GIF, video, marquee).

## Known leaks

Fixture content is not changed, because changing it would change the experiment. Some of it still hints at the barrier:

- Visible text in test pages, such as a legend "Non-matching for attribute" or a link text naming a keyboard trap.
- Titles and headings of GOV.UK example pages ("Example Keyboard Trap") and AIL example pages ("example page 1 of 3").
- Blink and marquee texts that describe themselves; a few JS window names.

These are reported as a limitation with every AI run. Tools see the same text, so the comparison stays fair, but an AI
reads text the way tools do not.

## The closed workspace

[`testing-kit/.claude/settings.json`](../../testing-kit/.claude/settings.json) limits an agent started in `testing-kit/`:
it may read only that folder, write only to `testing-kit/ai-kit/`, use no web search, and fetch only from
`127.0.0.1`/`localhost`. Bash runs in Claude Code's sandbox (needs `bubblewrap` and `socat` on Linux), and the
repository's and parent folders' `CLAUDE.md` files are excluded. The criteria data is copied into the folder
(`testing-kit/sc-test-methods.json`, kept in sync by `npm run wcag:methods -- --write-recipes`), without the retest
evidence: nothing in the workspace tells an AI what the test set contains or how the tools did on it.

The workspace is self-contained, because Claude Code's Bash sandbox on Linux has its own `localhost` and cannot read the
repository: it has its own pinned tools (`testing-kit/package.json`, same versions as the retest), its own Chromium,
and the server script. The agent starts `node serve.mjs` inside its sandbox. `node check-environment.mjs` checks the
chain (server, Chromium, axe-core, HTML_CodeSniffer) without any AI, and [`check-sandbox.md`](../../testing-kit/check-sandbox.md)
is the prompt that checks the sandbox limits before a run. The test pages are not in the workspace while the AI instructions are
generated (`testing-kit/.site/` is built only for a run), so the instructions cannot be tailored to them. Hooks and
auto-memory are turned off in the workspace (`disableAllHooks`, `autoMemoryEnabled`), so the agent gets neither the
user's command hooks nor pointers to private notes.

Check before a run: start the agent in `testing-kit/` and confirm that reading `../README.md` and a script reading
`../package.json` are refused, that writing to `ai-kit/` works, that fetching an external site is refused, and that
`/memory` shows no repository `CLAUDE.md`.

## Sources

- Claude Code documentation: permissions, sandboxing and memory, <https://code.claude.com/docs/en/permissions>,
  <https://code.claude.com/docs/en/sandboxing>, <https://code.claude.com/docs/en/memory>

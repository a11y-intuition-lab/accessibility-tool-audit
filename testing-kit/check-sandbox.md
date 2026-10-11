# Check the closed workspace before an AI run

> Give this file to an agent started in `testing-kit/`. It checks the environment only; it tests no page.

Do each step and report one line per step: what you did, and whether it was allowed or refused. Do not try to work
around a refusal.

1. Read `../README.md` with the file-read tool. Expected: refused.
2. Run `python3 -c "print(open('../package.json').read()[:80])"`. Expected: refused or an error.
3. Write the file `ai-kit/sandbox-check.txt` with the text `ok`, then delete it. Expected: allowed.
4. Fetch `https://example.com`. Expected: refused.
5. Run `node check-environment.mjs`. Expected: it ends with `OK: the workspace can serve pages, drive Chromium and run
   both rule engines.`
6. List the instruction files and memory you have loaded (the user can also check with `/memory`). Expected:
   `testing-kit/CLAUDE.md` only; no `CLAUDE.md` from a folder above `testing-kit/` and no auto-memory.
7. Run `ls recipes`. Expected: the ten recipe files, with no error from a hook (hooks are off in this workspace).

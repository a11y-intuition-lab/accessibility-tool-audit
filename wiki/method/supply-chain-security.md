# Supply-chain security

The build and the test runs depend on npm packages and GitHub Actions. These rules limit what can get in and when.
They apply to everyone who clones the repository, because they live in the repository, not on one machine.

## npm (`.npmrc`)

| Setting | Effect |
|---|---|
| `registry=https://registry.npmjs.org/` | One fixed registry |
| `strict-ssl=true` | Only verified TLS connections |
| `min-release-age=7` | Only versions published at least 7 days ago are installed; most malicious releases are caught and removed within that window |
| `ignore-scripts=true` | No install scripts (`preinstall`, `postinstall`) run — the most common attack path |
| `save-exact=true` | Exact versions in `package.json`, no `^` or `~` |
| `package-lock=true` | Lockfile is committed; CI installs with `npm ci`, which fails if it does not match |
| `engine-strict=true` | Refuse to install when Node/npm versions do not match `engines` |
| `audit=true`, `audit-level=high` | Report known vulnerabilities; fail at high or critical |
| `allow-git=none`, `allow-remote=none`, `allow-file=none`, `allow-directory=root` | Dependencies only from the registry; no git, tarball-URL or local-file dependencies |
| `fund=false`, `update-notifier=false` | Less noise |

`min-release-age` needs npm 11.15 or later (`engines.npm` in `package.json`; CI installs that exact npm version).

## Dependencies

- Keep them few. The site build currently has one direct dependency: `@11ty/eleventy`.
- Every new dependency gets a reason in [decisions](../decisions.md).
- Because install scripts are disabled, tools that download browsers on install (Playwright, Puppeteer) need an explicit,
  version-pinned browser install step. The browser version is recorded with every test run.

## GitHub Actions

- Every action is pinned to a full commit SHA, with the release tag in a comment. New releases are adopted no earlier
  than 7 days after publication.
- Default `permissions: contents: read`; only the deploy job gets `pages: write` and `id-token: write`.
- `actions/checkout` runs with `persist-credentials: false`.
- No `pull_request_target`. Pull requests build and verify, but never deploy.
- CI runs `npm ci`, `npm audit signatures` (registry signatures and provenance), `npm audit`, build, and fixture verification.

## Dependabot

`.github/dependabot.yml` checks npm and GitHub Actions weekly, with `cooldown: default-days: 7` so updates follow the
same 7-day rule.

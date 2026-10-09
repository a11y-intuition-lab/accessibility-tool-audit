# Log

Append-only, newest last.

## 2026-10-10 — Wiki started
- Tagged upstream commit `e9e46115` as `govuk-final`.
- Added `AGENTS.md` (repository and wiki conventions), provenance, decisions D-001 to D-007, and the upstream source page.

## 2026-10-10 — Modernised build; supply-chain hardening
- Replaced gulp/Sass with Eleventy 3; one file per test case in `src/test-cases/` (`origin: govuk-2017`). All 142 GOV.UK
  test pages and 20 fixture assets verified byte-identical to `govuk-final` (`npm run verify`).
- Removed GOV.UK branding, old tool results and the upstream build (listed in [provenance](provenance.md)).
- Added `.npmrc`, pinned Actions, Dependabot ([supply-chain security](method/supply-chain-security.md); D-008, D-009).

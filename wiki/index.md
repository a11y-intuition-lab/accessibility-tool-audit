# Wiki index

Knowledge base for A11y Intuition Lab's extension of the GOV.UK accessibility tool audit. Conventions are in
[`AGENTS.md`](../AGENTS.md).

## Project
- [Provenance](provenance.md) — what comes from GOV.UK, what AIL has done, and every change to upstream material.
- [Decisions](decisions.md) — numbered project decisions with reasons.
- [Log](log.md) — chronological record of changes.

## Sources
- [GOV.UK accessibility tool audit (2017)](sources/govuk-audit-2017.md) — the upstream project this fork extends.
- [WCAG 2.x](sources/wcag.md) — W3C's machine-readable success criteria for 2.0, 2.1 and 2.2.

## Method
- [Supply-chain security](method/supply-chain-security.md) — npm and GitHub Actions hardening rules.
- [WCAG mapping protocol](method/wcag-mapping.md) — rules for mapping a test case to success criteria (`fails` / `related` / `none`).

Planned: coding protocol for tool results, retest procedure.

## Analysis
- [WCAG gap analysis](analysis/wcag-gap-analysis.md) — coverage of all 2.x success criteria by the 142 GOV.UK test cases, and 80 candidate test cases. AI-drafted.

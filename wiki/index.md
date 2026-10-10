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
- [Nav testing guidance](sources/nav-testing-guidance.md) — Nav's method-based test protocols on Aksel; closest prior art for the test-method grouping. AI-drafted.
- [WCAG-EM](sources/wcag-em.md) — W3C's evaluation methodology (scope, sample, complete processes). AI-drafted.
- [ACT Rules](sources/act-rules.md) — W3C's format for test rules; automatic, semi-automatic and manual implementations, `cantTell`. AI-drafted.
- [Trusted Tester](sources/trusted-tester.md) — US Section 508 test process and ICT Testing Baseline. AI-drafted.
- [Uutilsynet test rules](sources/uutilsynet-test-rules.md) — the Norwegian supervisory authority's test rules. AI-drafted.
- [Accessibility Insights assessment](sources/accessibility-insights-assessment.md) — Microsoft's automated, assisted and manual tests. AI-drafted.
- [GOV.UK assistive technology testing](sources/govuk-assistive-technology-testing.md) — GDS guidance on testing with assistive technology. AI-drafted.
- [Automated coverage studies](sources/automated-coverage-studies.md) — published figures on what automated tools find, and their units. AI-drafted.
- [Other testing checklists](sources/other-testing-checklists.md) — The A11y Project checklist. AI-drafted.

## Method
- [Supply-chain security](method/supply-chain-security.md) — npm and GitHub Actions hardening rules.
- [WCAG mapping protocol](method/wcag-mapping.md) — rules for mapping a test case to success criteria (`fails` / `related` / `none`).
- [Retest procedure](method/retest-procedure.md) — how axe-core and pa11y are run against the built site, and what is stored.
- [Classification protocol](method/classification-protocol.md) — how raw tool output becomes a result per test case, using the rule mapping `data/mappings/test-case-rules.json` (HTML_CodeSniffer warning → user to check). AI-drafted.

## Analysis
- [Test-method grouping](analysis/test-method-grouping.md) — phase 2: ten test-method groups, triage per criterion (automated, AI, human), comparison with earlier groupings. AI-drafted.
- [WCAG gap analysis](analysis/wcag-gap-analysis.md) — coverage of all 2.x success criteria by the 142 GOV.UK test cases, and 80 candidate test cases. AI-drafted.

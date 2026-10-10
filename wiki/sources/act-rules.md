# W3C ACT Rules (Accessibility Conformance Testing)

> Status: AI-drafted, not human-reviewed

## What it is

Two related things: the **ACT Rules Format** (a W3C Recommendation for writing test rules with applicability, expectations and outcomes) and the **ACT Rules Community Group**, which publishes a library of rules in that format. Tool vendors report implementations against the rules.

## Version/date

- ACT Rules Format 1.1: W3C Recommendation, 5 February 2026 (Candidate Recommendation 19 August 2025). 1.0 coexists.
- ACT Rules library: 91 rules listed at retrieval (2026-10-10), 3 marked deprecated.
- Implementations page: 15 entries; no date shown.

## Licence

Format: W3C Document License. Rule content: the W3C Software and Document Notice and License (copy, modify, distribute with the notice). Quoting a sentence is fine.

## How it groups testing

ACT does **not** group rules by test method. Rules are mapped to WCAG success criteria and techniques. Automation appears in two places:

| Where | Categories |
|---|---|
| Format 1.1 | Rules can be "fully automated, completely manual, or some combination"; implementations report modes such as automatic, manual, semiAuto (EARL). Mixed case: applicability automated, expectation manual, reported as `cantTell`. |
| Implementations page | Test Methodologies (1), Semi-automated Test Tools (3), Automated Test Tools (9), Accessibility Linters (2). There is no "manual" category. |

Per-rule metadata lists WCAG mapping, input rules and "complete implementations". We found no automation field on the rule listing. The implementation data is vendor-supplied and not verified by W3C. We found no AI content.

## What we use it for

- Principled vocabulary for our triage: `cantTell` is exactly our "tool cannot decide, escalate to AI or human" outcome; store it as a result state.
- The "applicability automated, expectation manual" split suggests triage per rule, not only per SC (an SC can be partly automated).
- The mapping from ACT rule to SC lets us estimate which SCs have any automated rule. Not computed yet.
- Our `automated` group corresponds to fully automated ACT rules; `code-and-tree` roughly to semi-automated; the other groups to manual methodologies. ACT has no group like `keyboard` or `screen-reader`.

## Sources

- W3C, *ACT Rules Format 1.1*, <https://www.w3.org/TR/act-rules-format-1.1/>
- ACT Rules CG, <https://act-rules.github.io/pages/about/>, rules <https://act-rules.github.io/rules/>, licence <https://act-rules.github.io/pages/license/>
- W3C WAI, ACT implementations, <https://www.w3.org/WAI/standards-guidelines/act/implementations/>

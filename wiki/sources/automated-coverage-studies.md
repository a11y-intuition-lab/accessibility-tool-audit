# Published automated-coverage figures

> Status: AI-drafted, not human-reviewed

## What it is

Claims about how much of WCAG (or how many real issues) automated tools can find. The figures measure different things and must not be compared directly.

## Figures

| Source | Claim (short) | Unit | Date | Verified |
|---|---|---|---|---|
| Deque, *Automated Accessibility Coverage Report* | "57.38% of total issues were identified using Deque's automated tests" | share of issues (294,958 issues, 13,000+ pages, over 2,000 audits, first-time audits, axe-core, HTML only, WCAG 2.0/2.1 A/AA) | press release March 2021; page shows no date | yes, from the report page |
| Same report | automated issues found for "16 out of the 50 Success Criteria" of WCAG 2.1 AA, said to support the "20 to 30%" claim | share of criteria | as above | yes |
| GDS Way, accessibility manual | "automated testing can only find around 30% of likely accessibility problems" | issues (basis not given) | last reviewed 23 Sep 2026 | yes, basis not stated |
| Skatteetaten (Norway) | automatic evaluation answers roughly 20-30% of WCAG requirements | requirements | undated in our notes | via search summary only |
| Uutilsynet | no figure; fully automated check limited to one SC per principle | n/a | 2023 | yes |

## Licence

Deque: vendor report, link and short quote only. GDS Way: Open Government Licence v3.0 (quotable). Others: not stated.

## Caveats from the Deque report

Vendor study on its own customers; template issues counted once; best-practice and needs-review items excluded; 1.4.4 dropped (axe rule downgraded). Per-SC automated share varies hugely: 1.4.3 contrast 83.11%, 4.1.2 54.42%, 1.3.1 45.17%, 1.1.1 67.57%, but 2.1.1 Keyboard 2.49% and 2.4.3/2.4.7 0%. A separate Deque "semi-automated" report claims 80%+; not opened, unverified.

## What we use it for

- Supports a per-SC rather than global automation estimate. Our own data (axe + pa11y on 221 test cases) can give a criteria-based figure; we should state the unit (SC vs issue volume) explicitly.
- Per-SC shares show which SCs are really human-only (keyboard, focus order): consistent with groups `keyboard` and `screen-reader` being manual-first.
- No source gives an AI-assisted coverage figure. Recent academic work (University of Maribor feasibility study; ScreenAudit, CHI 2025) reports weak or unreliable LLM performance on manual WCAG checks without AT grounding; we have not read these in full. Two blog statistics (82% / 23% AI-label claims attributed to CMU/MIT) could not be traced to a primary source and must not be cited.

## Sources

- Deque, <https://www.deque.com/automated-accessibility-coverage-report/>; press release <https://www.businesswire.com/news/home/20210310005156/en>
- GDS Way, <https://gds-way.digital.cabinet-office.gov.uk/manuals/accessibility.html>
- Skatteetaten, <https://www.skatteetaten.no/en/stilogtone/god-praksis/universell-utforming/testing/>
- ScreenAudit, <https://arxiv.org/pdf/2504.02110>; Maribor study, <https://press.um.si/index.php/ump/en/catalog/book/1128/chapter/1235>

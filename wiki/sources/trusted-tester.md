# Section 508 ICT Testing Baseline and DHS Trusted Tester

> Status: AI-drafted, not human-reviewed

## What it is

- **ICT Testing Baseline** (US Access Board and Federal ICT Testing Baseline Working Group): tool-independent baseline tests mapped to Section 508 and WCAG 2.0 A/AA, for web and electronic documents. It is a baseline for building a test process, not a process itself.
- **DHS Trusted Tester**: a manual test process built on the Baseline, with certification for testers. Agencies adopting it accept results only from certified testers.

## Version/date

- Baseline for Web 3.1, published 1 April 2024; Baseline for Electronic Documents 1.0, 30 September 2024.
- Trusted Tester Section 508 Conformance Test Process for Web 5.1.3, April 2024 (per a secondary source; the DHS page says only "Last Updated 04/03/2025" and a 5.1 repository). The 5.1 process incorporates Baseline v3.0.

## Licence

Not verified. Both GitHub repositories (`atbcb/ICTTestingBaseline`, `Section508Coordinators/TrustedTester`) contain a LICENSE file whose type we did not read. US federal works are normally public domain, but confirm before copying. We only link.

## How it groups testing

**Not verified:** we could not open the 5.1 test list. Secondary sources say the Baseline for Web has numbered requirement groups (about 24) and IDs like `10.5-FormHasLabel`; counts differ between sources (57 vs 62 tests) so we do not rely on them. The Trusted Tester process is described as manual inspection using ANDI (Accessible Name and Description Inspector) and other browser tools, based mainly on WCAG 2.0 A/AA, with some test steps specific to Trusted Tester. A Boston.gov page mentions a "Keyboard and Focus" test group, unverified. We found no AI content.

## What we use it for

- Evidence that a mature government programme groups tests by *topic* (keyboard and focus, forms, name/role/value, ...) and treats most checking as **human inspection supported by an inspection tool**, which matches our `code-and-tree` group.
- Open action: read the 5.1 test list (GitHub) and map each test to our 10 groups, then fill this page. Until then no mapping is claimed.
- Lacks WCAG 2.1/2.2 criteria (2.0 A/AA only), so it cannot cover our 87 SCs.

## Sources

- Access Board, ICT Testing Baseline, <https://ictbaseline.access-board.gov/>; repo <https://github.com/atbcb/ICTTestingBaseline>
- DHS, Trusted Tester, <https://www.dhs.gov/trusted-tester>; repo <https://github.com/Section508Coordinators/TrustedTester>
- Data.gov catalogue entry, <https://catalog.data.gov/dataset/trusted-tester-process>
- ADA National Network, *Overview of Trusted Tester for Web v5*, <https://adata.org/node/3332>

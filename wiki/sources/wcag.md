# WCAG 2.x (W3C)

> Status: AI-drafted, not human-reviewed

The Web Content Accessibility Guidelines are the W3C standard that this project maps test cases against
([D-001](../decisions.md): 2.0, 2.1 and 2.2, levels A/AA/AAA; [D-002](../decisions.md): no WCAG 3.0).

## Versions

| Version | Status | Success criteria | New in this version |
|---|---|---|---|
| WCAG 2.0 | W3C Recommendation, 2008 | 61 | 61 |
| WCAG 2.1 | W3C Recommendation, 2018 | 78 | 17 |
| WCAG 2.2 | W3C Recommendation, 2023 (current edition 2024-12-12) | 86 (87 entries incl. removed 4.1.1) | 9 |

Counts are from the data file below and match the published totals. WCAG 2.2 removed **4.1.1 Parsing** ("obsolete and
removed"); it stays in the data with `removed: "2.2"` and counts only toward 2.0 and 2.1.

New SCs by level: 2.1 added 5 A, 7 AA, 5 AAA; 2.2 added 2 A, 4 AA, 3 AAA.

## Data used

| | |
|---|---|
| Machine-readable source | <https://www.w3.org/WAI/WCAG22/wcag.json> (generated from <https://github.com/w3c/wcag>) |
| Stored copy | [`data/wcag/raw/wcag.json`](../../data/wcag/raw/wcag.json), provenance in [`data/wcag/SOURCE.md`](../../data/wcag/SOURCE.md) |
| Normalised | [`data/wcag/success-criteria.json`](../../data/wcag/success-criteria.json): `id`, `slug`, `handle`, `level`, `principle`, `guideline`, `introduced`, `removed`, `versions`, `url` (Understanding document), `failureTechniques` |
| Script | [`scripts/wcag/fetch-wcag.mjs`](../../scripts/wcag/fetch-wcag.mjs) (Node 24, no dependencies; `--offline` re-normalises the stored copy) |
| Licence | [W3C Document License](https://www.w3.org/copyright/document-license/); quoting and redistributing with the notice is allowed |

The 2.2 data is the single source for all three versions: the `versions` array on each SC says which versions contain
it. `failureTechniques` lists the current W3C failure techniques (Fxx) linked from each SC; obsolete techniques (for
example F47, F70, F77, F87) are not in the 2.2 data but still have pages under the Techniques for WCAG 2.2.

## How we use it

- The SC list and levels for the [mapping protocol](../method/wcag-mapping.md) and the
  [gap analysis](../analysis/wcag-gap-analysis.md).
- Failure techniques as citations for `fails` mappings.
- Understanding documents as the interpretation reference for borderline cases.

## Sources

- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*, <https://www.w3.org/TR/WCAG22/>
- W3C, *WCAG 2.1*, <https://www.w3.org/TR/WCAG21/>; *WCAG 2.0*, <https://www.w3.org/TR/WCAG20/>
- W3C, *Understanding WCAG 2.2*, <https://www.w3.org/WAI/WCAG22/Understanding/>
- W3C, *Techniques for WCAG 2.2*, <https://www.w3.org/WAI/WCAG22/Techniques/>

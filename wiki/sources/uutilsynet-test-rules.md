# Uutilsynet test rules (Norway)

> Status: AI-drafted, not human-reviewed

## What it is

The Norwegian Authority for Universal Design of ICT (Uutilsynet, part of Digdir) publishes test rules ("testregler") for supervision of websites against WCAG 2.1 A/AA, plus an automated mass-check programme.

## Version/date

- *Oversikt over testregler for nettsteder*: created 3 July 2017, last changed 15 April 2025. Based on WCAG 2.1; WCAG 2.2 not covered.
- *Forenklet kontroll og statusmåling*: page created 27 February 2023, updated 16 March 2023; first round 2024.
- WAI-Tools pilot documentation (pilot used 19 ACT rules covering 13 SCs, per search summary).

## Licence

Not stated on the pages we read. Link and quote at most a sentence.

## How it groups testing

| Aspect | Finding |
|---|---|
| Organisation of rules | By WCAG principle, then by SC; letter-suffixed rule ids (1.1.1a, 1.1.1b). We counted 68 rules: 32 / 19 / 12 / 5 for principles 1-4. |
| Automatic vs manual | Not marked per rule on the overview page. |
| Relation to ACT | Not mentioned on the overview page; the simplified control uses ACT rules via a customised QualWeb. |
| Simplified control (forenklet kontroll) | Fully automated, no manual testing; up to 500 sites per year, up to 2,000 pages each; deliberately limited to one criterion per principle; no sanctions. About 10% of sites are chosen for in-depth inspection. |
| In-depth supervision | Manual rule-based inspection; method not detailed in what we read. |

Not verified: the in-depth supervision procedure and any sampling rules. We found no AI content and no published automated-coverage percentage from Uutilsynet itself (a Skatteetaten page states automatic evaluation answers roughly 20-30% of WCAG requirements; it is a different agency).

## What we use it for

- Shows a regulator treating *automated* as a separate, cheap screening layer with a deliberately tiny SC set, and everything else as manual: supports our `automated` first pass and the point that "automatable" is a small subset.
- Rule granularity (several rules per SC) argues for triage below the SC level.
- Not a method grouping, so no mapping to our other 9 groups.

## Sources

- <https://www.uutilsynet.no/regelverk/oversikt-over-testregler-nettsteder/709>
- <https://www.uutilsynet.no/tilsyn/forenklet-kontroll-og-statusmaling-med-nettsteder/1648>
- <https://www.uutilsynet.no/kartlegginger/wai-tools-dokumentasjon-av-pilotkontroll/942>
- Skatteetaten, testing page, <https://www.skatteetaten.no/en/stilogtone/god-praksis/universell-utforming/testing/>

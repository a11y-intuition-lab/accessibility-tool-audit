# WCAG-EM (W3C WCAG Evaluation Methodology)

> Status: AI-drafted, not human-reviewed

## What it is

A W3C methodology for evaluating whole websites against WCAG 2: how to scope, sample and report. It is informative and does not add requirements. It says nothing about grouping success criteria by test method.

## Version/date

- WCAG-EM 1.0: W3C Working Group Note, 2014 (exact date not re-verified here).
- WCAG-EM 2.0: W3C Group Note dated 23 July 2026 (as shown on the page we retrieved), editors Hidde de Vries, Jeroen Hulscher, Steve Faulkner; builds on 1.0.

## Licence

W3C Document License; quoting with notice is allowed (the page links to the licence, it does not state a separate one).

## How it groups testing

It sequences the **evaluation process**, not the checks:

| Step | Content |
|---|---|
| 1 Define scope | product scope, conformance target, accessibility-support baseline (browsers, AT), optional extras |
| 2 Explore | common views, essential functionality, sample types, relied-upon technologies |
| 3 Select sample | structured sample, random sample (10% of structured), complete processes |
| 4 Evaluate | check all samples, check complete processes, compare structured and random sets |
| 5 Report | outcomes, specifics, statement, optional score, machine-readable report (EARL) |

On automation it states that most accessibility checks are not fully automatable; tools help find samples and assist manual checks. Step 1.3 requires defining an accessibility-support baseline including assistive technologies. Involving people with disabilities is "strongly recommended" but not required. We did not find AI content in it.

## What we use it for

- Our `multi-step-flow` group corresponds to WCAG-EM 3.3/4.2 "complete processes"; WCAG-EM confirms that flows must be tested as units, not page by page.
- The accessibility-support baseline (step 1.3) is something our phase 2 recipes need: each AT-dependent group (`screen-reader`, `keyboard`, `zoom-reflow`) must state browser and AT versions.
- Random-versus-structured sampling is a possible validity check for AI triage (compare AI findings on a random sample against human findings).
- We lack: sampling and reporting steps; WCAG-EM has nothing on per-criterion method groups.

## Sources

- W3C, *WCAG-EM 2.0*, <https://www.w3.org/TR/WCAG-EM/> (retrieved 2026-10-10; 1.0 dated 2014 from memory, not re-verified)
- W3C Document License, <https://www.w3.org/copyright/document-license/>

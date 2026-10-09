# Source: W3C WCAG 2.2 machine-readable data

| | |
|---|---|
| File | [`raw/wcag.json`](raw/wcag.json) (unchanged copy) |
| URL | <https://www.w3.org/WAI/WCAG22/wcag.json> |
| Retrieved | 2026-10-09T22:09:04Z (server `Last-Modified: Thu, 03 Sep 2026 15:17:58 GMT`, ETag `W/"7e37d-65a95a826b580"`) |
| Size | 516 989 bytes |
| sha256 | `3a034865a879a7d874b60ff2aec7f430cf37bc1597a1e00985680fd80ef5cf75` |
| Corresponds to | WCAG 2.2, W3C Recommendation, <https://www.w3.org/TR/WCAG22/> (dated version <https://www.w3.org/TR/2024/REC-WCAG22-20241212/>) |
| Generated from | <https://github.com/w3c/wcag> (W3C AG Working Group source repository) |
| Licence | [W3C Document License](https://www.w3.org/copyright/document-license/) |
| Retrieval details | [`raw/retrieval.json`](raw/retrieval.json), written by the fetch script |

## Attribution

Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation.
Copyright © 2020–2024 [World Wide Web Consortium](https://www.w3.org/).
W3C® [liability](https://www.w3.org/policies/#Legal_Disclaimer), [trademark](https://www.w3.org/policies/#W3C_Trademarks)
and [document use](https://www.w3.org/copyright/document-license/) rules apply.

The raw file is redistributed unchanged under the W3C Document License. Normalised data derived from it is in
[`success-criteria.json`](success-criteria.json).

## How versions are encoded

Each principle, guideline and success criterion has a `versions` array listing the WCAG 2.x versions that contain it.
The first entry is the version that introduced it. 4.1.1 Parsing is listed with `["2.0", "2.1"]` and an empty
`level`, because WCAG 2.2 removed it; the normaliser sets `removed: "2.2"` and `level: "A"` (its level in 2.0/2.1).

## Regenerate

```sh
node scripts/wcag/fetch-wcag.mjs            # download a fresh copy, then normalise
node scripts/wcag/fetch-wcag.mjs --offline  # normalise this stored copy only
```

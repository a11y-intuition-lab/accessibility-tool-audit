# Self-hosted fonts

Retrieved 2026-10-10 from Google Fonts (latin subset, woff2), using the css2 API with a Chrome user agent:

`https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Nunito+Sans:wght@400..800&display=swap`

| File | Family / weight | Source URL | Bytes | sha256 |
|---|---|---|---|---|
| `poppins-latin-600.woff2` | Poppins 600 | https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2 | 8000 | f4e80d9dfd374d02989b87a27b5ed4cb78fbb177c27f1478e9a8b0afb7513149 |
| `poppins-latin-700.woff2` | Poppins 700 | https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2 | 7816 | 9338e65fc077355c7a87ae0d64cc101e23b9bf8ad78ae65f0f319c857311b526 |
| `poppins-latin-800.woff2` | Poppins 800 | https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDD4Z1xlFQ.woff2 | 7824 | 60bf0aba6526436f3930c58c12047687fbb6bff4dd180cce4613458ed3439ea2 |
| `nunito-sans-latin-wght.woff2` | Nunito Sans, variable weight axis 400-800 | https://fonts.gstatic.com/s/nunitosans/v19/pe0TMImSLYBIv1o4X1M8ce2xCx3yop4tQpF_MeTm0lfGWVpNn64CL7U8upHZIbMV51Q42ptCp7t1R-s.woff2 | 31076 | 29e3890496844a9ea81975c52771c587c872b4eb317026422d1995b88d21b57d |

Notes:
- Google serves Nunito Sans as one variable file for all weights, so one file covers 400, 600, 700 and 800.
- Latin subset only (U+0000-00FF and the common punctuation range, as declared in `fonts.css`). Other scripts fall back to `'Segoe UI', Arial, sans-serif`.
- Licence: SIL Open Font License 1.1, see `OFL.txt`. The copyright lines there were written from the upstream
  repositories' notices (itfoundry/Poppins, googlefonts/nunitosans) and not checked against the font files' name tables.
- The design tokens file (`../ail/ail-tokens.css`) is vendored unchanged. Its header comment suggests a Google Fonts
  `<link>`; the site does not use it and loads `fonts.css` instead.
- Copyright lines in `OFL.txt` checked against google/fonts `ofl/poppins/OFL.txt` and `ofl/nunitosans/OFL.txt` (2026-10-10).

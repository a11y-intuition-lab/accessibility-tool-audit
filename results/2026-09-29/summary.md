# Retest 2026-09-29

axe-core 4.13.0, pa11y 10.0.0 (HTML_CodeSniffer 2.6.0, WCAG2AAA).
Original = result in tests.json (pa11y is compared with codesniffer). Findings on tests/_baseline.html are excluded.

| Category | Test case | WCAG | axe original | axe proposal | axe rules | codesniffer original | pa11y proposal | pa11y rules |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Content | Content identified by location |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Content | Plain language is not used |  | notfound | notfound |  | notfound | notfound |  |
| Content | Content is not in correct reading order in source code |  | notfound | error | heading-order | notfound | error | 1_3_1_AAA.G141 |
| Content | Content is not organised into well-defined groups or chunks, using headings, lists, and other visual mechanisms |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Content | First instance of abbreviation not expanded |  | notfound | notfound |  | notfound | notfound |  |
| Content | Idioms and jargon are not explained | 3.1.3 (AAA) |  | notfound |  |  | notfound |  |
| Content | Meaning depends on pronunciation that is not given | 3.1.6 (AAA) |  | notfound |  |  | notfound |  |
| Page Layout | Wide page forces users to scroll horizontally |  | notfound | error | scrollable-region-focusable, color-contrast | notfound | notfound |  |
| Page Layout | Content is locked to one display orientation | 1.3.4 (AA) |  | notfound |  |  | notfound |  |
| Colour and Contrast | Colour alone is used to convey content |  | notfound | notfound |  | notfound | notfound |  |
| Colour and Contrast | Small text does not have a contrast ratio of at least 4.5:1 so does not meet AA |  | error | error | color-contrast | notfound | notfound |  |
| Colour and Contrast | Large text does not have a contrast ratio of at least 3:1 so does not meet AA |  | error | error | color-contrast | notfound | notfound |  |
| Colour and Contrast | Small text does not have a contrast ratio of at least 7:1 so does not meet AAA |  | error | error | color-contrast | notfound | notfound |  |
| Colour and Contrast | Large text does not have a contrast ratio of at least 4.5:1 so does not meet AAA |  | error | error | color-contrast | notfound | notfound |  |
| Colour and Contrast | Focus not visible |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Colour and Contrast | Form field border does not have a contrast ratio of at least 3:1 | 1.4.11 (AA) |  | notfound |  |  | notfound | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Colour and Contrast | Icon-only button does not have a contrast ratio of at least 3:1 | 1.4.11 (AA) |  | notfound |  |  | notfound | 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Typography | Inadequate line height used |  | notfound | notfound |  | notfound | notfound |  |
| Typography | All caps text found |  | notfound | notfound |  | notfound | notfound |  |
| Typography | Blink element found |  | error | error | blink | error | error | 2_2_2.F47 |
| Typography | Italics used on long sections of text |  | notfound | notfound |  | notfound | notfound |  |
| Typography | Marquee element found |  | error | error | marquee | notfound | notfound |  |
| Typography | Long lines of text |  | notfound | notfound |  | notfound | notfound |  |
| Typography | Very small text found |  | notfound | notfound |  | notfound | notfound |  |
| Typography | Justified text found |  | notfound | notfound |  | notfound | notfound |  |
| Language of content | Text language changed without required change in direction |  | notfound | notfound |  | notfound | notfound |  |
| Language of content | html element has an empty lang attribute |  | error | notfound |  | error | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Language of content | lang attribute not used to identify change of language |  | notfound | notfound |  | notfound | notfound |  |
| Language of content | Text language is in the wrong direction |  | notfound | notfound |  | notfound | notfound |  |
| Language of content | html element has an invalid value in the lang attribute |  | error | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Language of content | lang attribute used to identify change of language, but with invalid value |  | error | error | valid-lang | notfound | notfound |  |
| Language of content | html element is missing a lang attribute |  | error | notfound |  | error | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Language of content | html element has lang attribute set to wrong language |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Language of content | lang attribute used to identify change of language, but with wrong language |  | notfound | notfound |  | notfound | notfound |  |
| Page Title | Inappropriate page title |  | notfound | notfound |  | manual | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Page Title | Empty page title |  | error | notfound |  | error | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Page Title | Missing page title |  | error | notfound |  | error | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Headings | Empty heading |  | error | error | empty-heading, heading-order | error | error | 1_3_1_AAA.G141, 1_3_1.H42.2 |
| Headings | Missing H1 |  | notfound | notfound |  | error | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Headings | Text formatting used instead of an actual heading |  | notfound | notfound |  | notfound | notfound |  |
| Headings | Headings not structured in a hierarchical manner |  | error | error | heading-order | error | error | 1_3_1_AAA.G141 |
| Lists | LI element with no parent |  | error | error | listitem | notfound | notfound |  |
| Lists | List not marked up as a list |  | notfound | notfound |  | notfound | notfound |  |
| Lists | DT or DD elements that are not contained within a DL element |  | error | error | dlitem | notfound | notfound |  |
| Lists | Improperly nested lists |  | error | error | list | notfound | notfound |  |
| Tables | Table with column headers and double row headers |  | notfound | notfound |  | error | error | 1_3_1.DataTable, 1_3_1.H43.IncorrectAttr, 1_3_1.H43.HeadersRequired, 1_3_1.H39.3.Check |
| Tables | Table has no scope attributes |  | notfound | notfound |  | error | error | 1_3_1.DataTable, 1_3_1.H43,H63, 1_3_1.H39.3.Check |
| Tables | Table nested within table header |  | notfound | notfound |  | notfound | error | 1_3_1.DataTable, 1_3_1.H43,H63, 1_3_1.H39.3.NoCaption |
| Tables | Table nested within table |  | notfound | notfound |  | notfound | manual | 1_3_1.DataTable, 1_3_1.H39.3.NoCaption |
| Tables | Table has no table headings |  | error | notfound |  | manual | error | 1_3_1.LayoutTable, 1_3_1.H39.3.LayoutTable |
| Tables | Table with inconsistent numbers of columns in rows |  | notfound | notfound |  | manual | error | 1_3_1.DataTable, 1_3_1.H43.IncorrectAttr, 1_3_1.H43.MissingHeaderIds, 1_3_1.H39.3.Check |
| Tables | Table that only has TH elements in it |  | error | manual | th-has-data-cells | notfound | manual | 1_3_1.DataTable, 1_3_1.H39.3.NoCaption |
| Tables | Table is missing a caption |  | notfound | notfound |  | manual | manual | 1_3_1.DataTable, 1_3_1.H39.3.NoCaption |
| Tables | Table used for layout |  | notfound | error | target-size | identified | notfound | 1_3_1.LayoutTable, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Tables | Table has an empty table header |  | notfound | error | empty-table-header | notfound | error | 1_3_1.DataTable, 1_3_1.H63.1, 1_3_1.H39.3.Check |
| Tables | Table with some empty cells |  | notfound | notfound |  | notfound | notfound | 1_3_1.DataTable, 1_3_1.H39.3.Check |
| Images | Image has alt and title that are different |  | notfound | notfound |  | notfound | notfound | 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | Image with presentation role has non-empty alt |  | notfound | error | aria-allowed-role | notfound | notfound | 1_4_9.G140,C22,C30.NoException |
| Images | Image with no alt attribute |  | error | error | image-alt | error | error | 1_1_1.H37, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | Background image that conveys information does not have a text alternative |  | notfound | manual | color-contrast | notfound | manual | 1_4_6.G17.BgImage |
| Images | Image has empty alt and non-empty title |  | notfound | notfound |  | error | error | 1_1_1.H67.1, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | A distraction is present, an animated gif |  | notfound | notfound |  | notfound | notfound | 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | Image that conveys information has an empty alt attribute |  | notfound | notfound |  | manual | manual | 1_1_1.H67.2, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | Image that conveys information has inappropriate alt text |  | notfound | notfound |  | manual | notfound | 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | Image alt attribute contains image file name |  | notfound | notfound |  | manual | notfound | 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | Image with partial text alternative |  | notfound | notfound |  | manual | notfound | 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | Image of text used instead of text | 1.4.5 (AA) |  | notfound |  |  | notfound | 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Images | Image of text used for a quotation | 1.4.9 (AAA) |  | notfound |  |  | notfound | 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| Multimedia | Embedded video file is missing text alternative |  | manual | manual | video-caption | manual | notfound | 1_2_1.G159,G166, 1_2_2.G87,G93, 1_2_4.G9,G87,G93, 1_2_5.G78,G173,G8, 1_2_6.G54,G81, 1_2_7.G8, 1_2_8.G69,G159, 1_4_2.F23 |
| Multimedia | Flashing content doesn't have warning |  | notfound | manual | aria-prohibited-attr, bypass | notfound | notfound | 2_4_1.H64.2 |
| Multimedia | Embedded audio file is missing text alternative |  | manual | notfound |  | manual | notfound | 1_2_1.G158, 1_2_9.G150,G151,G157, 1_4_2.F23, 1_4_7.G56 |
| Multimedia | Live video stream has no captions | 1.2.4 (AA) |  | manual | video-caption |  | notfound | 1_2_1.G159,G166, 1_2_2.G87,G93, 1_2_4.G9,G87,G93, 1_2_5.G78,G173,G8, 1_2_6.G54,G81, 1_2_7.G8, 1_2_8.G69,G159, 1_4_2.F23 |
| Multimedia | Video has no sign language interpretation | 1.2.6 (AAA) |  | notfound |  |  | notfound | 1_2_1.G159,G166, 1_2_2.G87,G93, 1_2_4.G9,G87,G93, 1_2_5.G78,G173,G8, 1_2_6.G54,G81, 1_2_7.G8, 1_2_8.G69,G159, 1_4_2.F23 |
| Multimedia | Video has no extended audio description | 1.2.7 (AAA) |  | notfound |  |  | notfound | 1_2_1.G159,G166, 1_2_2.G87,G93, 1_2_4.G9,G87,G93, 1_2_5.G78,G173,G8, 1_2_6.G54,G81, 1_2_7.G8, 1_2_8.G69,G159, 1_4_2.F23 |
| Multimedia | Live audio stream has no text alternative | 1.2.9 (AAA) |  | notfound |  |  | notfound | 1_2_1.G158, 1_2_9.G150,G151,G157, 1_4_2.F23, 1_4_7.G56 |
| Multimedia | Audio plays automatically with no way to stop it | 1.4.2 (A) |  | manual | no-autoplay-audio |  | notfound | 1_2_1.G158, 1_2_9.G150,G151,G157, 1_4_2.F23, 1_4_7.G56 |
| Multimedia | Speech has loud background music | 1.4.7 (AAA) |  | notfound |  |  | notfound | 1_2_1.G158, 1_2_9.G150,G151,G157, 1_4_2.F23, 1_4_7.G56 |
| Links | Image link with no alternative text |  | error | error | link-name | error | error | 1_1_1.H30.2, 2_4_9.H30, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link to javascript, invalid hypertext reference |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Uninformative link text |  | notfound | error | heading-order | manual | error | 1_3_1_AAA.G141, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link launches new window with no warning |  | notfound | notfound |  | manual | manual | 2_4_9.H30, 3_2_5.H83.3, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Links not separated by printable characters |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link text with identical title |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Links to a sound file, no transcript |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Identifying links by colour alone |  | notfound | error | color-contrast-enhanced | notfound | manual | 1_3_1.H48, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link to PDF does not include information on file format and file size |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link to #, invalid hypertext reference |  | error | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Blank link text |  | error | error | link-name | error | error | 4_1_2.H91.A.NoContent, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Links with the same text go to different pages |  | notfound | manual | identical-links-same-purpose | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link text does not make sense out of context |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Adjacent links going to the same destination |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link contains only a full stop |  | notfound | manual | identical-links-same-purpose | manual | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Image link alt text repeats text in the link |  | error | error | image-redundant-alt | notfound | notfound | 2_4_9.H30, 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link not clearly identifiable and distinguishable from surrounding text |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link to a multimedia file, no transcript |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Non-specific link text |  | notfound | notfound |  | manual | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Links | Link to an image, no text alternative |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Buttons | Image button has no alt attribute |  | error | error | input-image-alt | error | error | 1_1_1.H36, 4_1_2.H91.InputImage.Name, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Buttons | Empty button |  | error | error | button-name | error | error | 4_1_2.H91.Button.Name, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Buttons | Uninformative alt attribute value on image button |  | notfound | notfound |  | manual | notfound | 1_1_1.G94.Button, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Buttons | Empty alt attribute on image button |  | error | error | input-image-alt | error | error | 1_1_1.H36, 4_1_2.H91.InputImage.Name, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Errors identified by colour only |  | notfound | notfound |  | manual | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Labels missing when they would look clumsy for some form controls |  | error | error | label | error | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 4_1_2.H91.InputText.Name, 1_3_1.F68, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Error messages - no suggestion for corrections given, e.g. required format |  | notfound | error | color-contrast-enhanced | notfound | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Left aligned form labels with too much white space |  | notfound | notfound |  | notfound | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Group of radio buttons not enclosed in a fieldset |  | error | error | heading-order | notfound | error | 1_3_1.H71.SameName, 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_1_AAA.G141, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Form element has no label |  | error | error | label | error | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 4_1_2.H91.InputText.Name, 1_3_1.F68, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Fieldset without a legend |  | notfound | notfound |  | error | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 4_1_2.H91.Fieldset.Name, 1_3_1.H71.NoLegend |
| Forms | Empty legend |  | notfound | notfound |  | error | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 4_1_2.H91.Fieldset.Name |
| Forms | Label element with for= attribute but not matching id= attribute of form control |  | error | error | label | error | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 4_1_2.H91.InputCheckbox.Name, 1_3_1.F68, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Group of check boxes not enclosed in a fieldset |  | error | error | heading-order | notfound | error | 1_3_1.H71.SameName, 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_1_AAA.G141, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Empty label found |  | error | error | label | notfound | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Two unique labels, but identical for= attributes |  | error | manual | form-field-multiple-labels | notfound | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Errors identified with a poor colour contrast |  | error | error | color-contrast | error | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_4_6.G17.Fail, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Non-unique field label found |  | notfound | notfound |  | notfound | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Missing labels in checkboxes |  | error | error | label | error | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 4_1_2.H91.InputCheckbox.Name, 1_3_1.F68, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Field hint not associated with input |  | notfound | error | color-contrast-enhanced | notfound | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Placeholder no label |  | error | notfound |  | error | error | 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 4_1_2.H91.InputSearch.Name, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Errors are not identified |  | notfound | notfound |  | manual | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Form control that changes context without warning |  | notfound | notfound |  | manual | error | 3_2_2.H32.2, 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 4_1_2.H91.Select.Value, 1_3_1.H85.2, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Input purpose is not identified | 1.3.5 (AA) |  | notfound |  |  | notfound | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Autocomplete attribute has an invalid value | 1.3.5 (AA) |  | error | autocomplete-valid |  | manual | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Status message is not announced to assistive technologies | 4.1.3 (AA) |  | notfound |  |  | notfound | 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Information entered earlier must be entered again | 3.3.7 (A) |  | notfound |  |  | notfound | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Pasting into the password field is blocked | 3.3.8 (AA) |  | notfound |  |  | notfound | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Focusing a field opens a new window | 3.2.1 (A) |  | notfound |  |  | notfound | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Payment is taken without a chance to check or cancel | 3.3.4 (AA) |  | notfound |  |  | notfound | 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | No help is available for a complex field | 3.3.5 (AAA) |  | notfound |  |  | notfound | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Submitting a form cannot be checked, confirmed or reversed | 3.3.6 (AAA) |  | notfound |  |  | notfound | 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Forms | Sign in requires recognising objects in pictures | 3.3.9 (AAA) |  | notfound |  |  | notfound | 1_3_5.H98, 3_2_1.G107, 1_1_1.G94.Image, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException, 2_4_7.G149,G165,G195,C15,SCR31 |
| Navigation | Inadequately-sized clickable targets found |  | notfound | error | target-size | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Navigation | Help link is in a different place on each page | 3.2.6 (A) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Navigation | No way to skip repeated navigation | 2.4.1 (A) |  | notfound |  |  | manual | 1_3_1.H48, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Navigation | Pages can only be found in one way | 2.4.5 (AA) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Navigation | No indication of where the user is in the site | 2.4.8 (AAA) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Navigation | Navigation is in a different order on each page | 3.2.3 (AA) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Navigation | The same function has different labels on different pages | 3.2.4 (AA) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Alert shows for a short time |  | notfound | notfound |  | notfound | notfound | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Lightbox - close button doesn't receive focus |  | notfound | notfound |  | notfound | manual | 2_4_9.H30, 1_4_10.C32,C31,C33,C38,SCR34,G206, 3_2_5.H83.3, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Focus order in wrong order |  | notfound | notfound |  | notfound | manual | 1_3_1.H48, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Tabindex greater than 0 |  | error | error | tabindex | notfound | notfound | 2_4_9.H30, 2_4_3.H4.2, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Keyboard focus is not indicated visually |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Keyboard focus assigned to a non focusable element using tabindex=0 |  | notfound | notfound |  | notfound | notfound | 2_4_3.H4.2 |
| Keyboard Access | Concertina items don't get keyboard focus |  | notfound | notfound |  | notfound | notfound |  |
| Keyboard Access | Keyboard trap |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Dropdown navigation - only the top level items receive focus |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Lightbox - ESC key doesn't close the lightbox |  | notfound | notfound |  | notfound | manual | 2_4_9.H30, 1_4_10.C32,C31,C33,C38,SCR34,G206, 3_2_5.H83.3, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Link with a role=button does not work with space bar |  | notfound | error | color-contrast-enhanced | notfound | error | 1_4_6.G17.Fail, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Tooltips don't receive keyboard focus |  | notfound | notfound |  | notfound | error | 1_4_6.G17.Fail, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Accesskey attribute used |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Lightbox - focus is not moved immediately to lightbox |  | notfound | notfound |  | notfound | manual | 2_4_9.H30, 1_4_10.C32,C31,C33,C38,SCR34,G206, 3_2_5.H83.3, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Lightbox - focus is not retained within the lightbox |  | notfound | notfound |  | notfound | manual | 2_4_9.H30, 1_4_10.C32,C31,C33,C38,SCR34,G206, 3_2_5.H83.3, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Fake button is not keyboard accessible |  | notfound | error | color-contrast-enhanced | notfound | error | 1_4_6.G17.Fail |
| Keyboard Access | Single character keyboard shortcut cannot be turned off or remapped | 2.1.4 (A) |  | notfound |  |  | notfound |  |
| Keyboard Access | Focused link is hidden behind a sticky footer | 2.4.11 (AA) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Signature can only be drawn with a pointer | 2.1.3 (AAA) |  | notfound |  |  | notfound |  |
| Keyboard Access | Focused link is partly hidden by a chat widget | 2.4.12 (AAA) |  | manual | color-contrast |  | manual | 2_4_9.H30, 1_4_6.G17.Abs, 2_4_7.G149,G165,G195,C15,SCR31 |
| Keyboard Access | Focus indicator is too thin and has low contrast | 2.4.13 (AAA) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Frames | iframe is missing a title attribute |  | error | error | frame-title | error | error | 2_4_1.H64.1 |
| Frames | iframe title attribute does not describe the content or purpose of the iframe |  | notfound | notfound |  | manual | notfound | 2_4_1.H64.2 |
| CSS | Content is not readable and functional when text is increased |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| CSS | Non-decorative content inserted using CSS |  | notfound | notfound |  | notfound | notfound |  |
| CSS | visibility:hidden used to visually hide content when it should be available to screenreader |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| CSS | display:none used to visually hide content when it should be available to screenreader |  | notfound | notfound |  | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| CSS | Page zoom - boxes that don't expand with the text |  | notfound | notfound |  | notfound | manual | 1_4_6.G17.Abs, 1_3_1.H48, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| CSS | Content is clipped when text spacing is increased | 1.4.12 (AA) |  | notfound |  |  | notfound |  |
| CSS | Text spacing cannot be overridden because of important inline styles | 1.4.12 (AA) |  | error | avoid-inline-spacing |  | notfound |  |
| HTML | Duplicate id |  | error | notfound |  | error | error | 4_1_1.F77 |
| HTML | Article element used to mark-up an element that's not an article/blog post etc. |  | notfound | error | target-size | notfound | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| HTML | Empty paragraph |  | notfound | notfound |  | notfound | notfound |  |
| HTML | Deprecated center element |  | notfound | notfound |  | error | error | 1_3_1.H49.Center |
| HTML | Invalid ARIA role names |  | error | error | aria-roles, color-contrast | notfound | manual | 1_4_6.G17.BgImage, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| HTML | Object not embedded accessibly - wmode parameter not set to window |  | notfound | manual | color-contrast | notfound | manual | 1_1_1.G94,G92.Object,ARIA6, 1_2_1.G158, 1_2_1.G159,G166, 1_2_2.G87,G93, 1_2_4.G9,G87,G93, 1_2_5.G78,G173,G8, 1_2_6.G54,G81, 1_2_7.G8, 1_2_8.G69,G159, 1_2_9.G150,G151,G157, 1_4_2.F23, 1_4_7.G56, 2_1_2.F10 |
| HTML | Spacer image found |  | notfound | notfound |  | notfound | manual | 1_1_1.H67.2, 1_1_1.G73,G74, 1_4_9.G140,C22,C30.NoException |
| HTML | Inline style adds colour |  | notfound | notfound |  | notfound | manual | 1_4_3_F24.F24.FGColour |
| HTML | Start and close tags don't match |  | notfound | notfound |  | notfound | notfound |  |
| HTML | PRE element without CODE element inside it |  | notfound | notfound |  | notfound | manual | 1_4_10.C32,C31,C33,C38,SCR34,G206 |
| HTML | Deprecated font element |  | notfound | notfound |  | error | error | 1_3_1.H49.Font |
| HTML | Purpose of regions cannot be programmatically determined | 1.3.6 (AAA) |  | notfound |  |  | manual | 1_3_1.H48, 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Content on Hover or Focus | Tooltip cannot be dismissed without moving the pointer or focus | 1.4.13 (AA) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Content on Hover or Focus | Tooltip disappears when the pointer is moved over it | 1.4.13 (AA) |  | notfound |  |  | notfound | 2_4_9.H30, 2_4_7.G149,G165,G195,C15,SCR31 |
| Pointer and Motion | Carousel can only be changed with a swipe gesture | 2.5.1 (A) |  | notfound |  |  | notfound |  |
| Pointer and Motion | Action is triggered on pointer down | 2.5.2 (A) |  | notfound |  |  | notfound | 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Pointer and Motion | Accessible name does not contain the visible label | 2.5.3 (A) |  | notfound |  |  | manual | 2_5_3.F96, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Pointer and Motion | Function can only be operated by shaking the device | 2.5.4 (A) |  | notfound |  |  | notfound |  |
| Pointer and Motion | List can only be reordered by dragging | 2.5.7 (AA) |  | notfound |  |  | notfound |  |
| Pointer and Motion | Clickable targets are smaller than 24 by 24 CSS pixels | 2.5.8 (AA) |  | error | target-size |  | notfound | 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Pointer and Motion | Mouse input is ignored on devices with a touch screen | 2.5.6 (AAA) |  | notfound |  |  | notfound | 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Timing | Task has a time limit | 2.2.3 (AAA) |  | notfound |  |  | notfound | 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Timing | Updates interrupt the user and cannot be postponed | 2.2.4 (AAA) |  | notfound |  |  | notfound |  |
| Timing | Data is lost when the session expires | 2.2.5 (AAA) |  | notfound |  |  | notfound | 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Timing | Users are not warned about an inactivity timeout | 2.2.6 (AAA) |  | notfound |  |  | notfound | 3_3_1.G83,G84,G85, 3_3_2.G131,G89,G184,H90, 3_3_3.G177, 3_3_5.G71,G184,G193, 3_3_6.G98,G99,G155,G164,G168.AllForms, 1_3_5.H98, 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Animation and Flashing | Content flashes more than three times in one second | 2.3.2 (AAA) |  | notfound |  |  | notfound | 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |
| Animation and Flashing | Motion animation triggered by interaction cannot be turned off | 2.3.3 (AAA) |  | notfound |  |  | notfound | 3_2_1.G107, 2_4_7.G149,G165,G195,C15,SCR31 |

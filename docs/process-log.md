# Process log: modernising and extending the accessibility tool audit

This log records how this copy of the [GDS accessibility tool audit](https://alphagov.github.io/accessibility-tool-audit/) was modernised and extended on 29 September 2026. The site's [method page](https://a11yintuition.org/accessibility-tool-audit/method.html) describes the method. This log covers the process: what the maintainer asked for, what the AI assistant did, which decisions were made and which mistakes were found and corrected.

It is a summary, not a full transcript. Every instruction from the maintainer is quoted word for word in the original Norwegian, followed by an English translation. The session transcript is kept by the maintainer.

- **Maintainer:** Dag Frode Solberg, A11y Intuition Lab
- **AI assistant:** Claude Code with the model Claude Opus 5.5 (Anthropic), in one session on a Linux workstation
- **Time (UTC):** about 07:20 to 08:45 on 29 September 2026
- **Commits:** `a878cc1` (sources), `e6c68ca` (generated site and retest results), `68ec8ac` and `dcaaedd` (separation from GDS), and the commits that added this log

## 1. Assessing the old project (07:20)

> se over prosjektet. er det mulig å oppdatere det? pakkene altså så det er trygt å bruke det
>
> *Look over the project. Is it possible to update it? The packages, that is, so it is safe to use.*

> vi kan gjerne fjerne pythoin hvis det er mulig?
>
> *We can remove Python if possible?*

The assistant looked at the project. It had last been changed in May 2019. It was built with gulp 3 and node-sass (which needs Python) and used jQuery 1.12.

Before the maintainer's next instruction, the assistant ran `npm install` on the old `package.json` (435 packages) to run `npm audit`. The result was **32 known vulnerabilities, 4 of them critical**. It also tried `npx gulp generate`, which failed on startup because gulp 3 does not work with Node.js 24. Install scripts were already turned off in the maintainer's global npm configuration, so no package code ran during the install. This was confirmed by the missing `node-sass/vendor` folder.

The assistant then started replacing gulp with npm scripts (`build/generate.js` run directly with Node, Dart Sass instead of node-sass). It checked that the generated HTML for all 142 test pages and the results page was unchanged. It also rewrote the package lock file, which pointed to an internal package mirror, so that it points to the public npm registry.

## 2. Setting the goal and the safety rule (07:25)

> denne har ikke vært oppdatert på 8 år. vi må nok bumpe alle pakker kraftig og bytte ut noen pakker. ikke prøv å kjøre det som er der i dag. det er nok ikke trygt. og vi trenger nok ikke kjøre alt. jeg vil ha ting til et stadie hvor vi kan kjøre axe og pa11y på testsidene som inneholder kjente feil. planen er å utvide lista med kjente feil for å dekke de nye kravene i wcag samt å teste om verktøyene har blitt bedre
>
> *This has not been updated in 8 years. We will probably need to bump all packages heavily and replace some. Do not try to run what is there today. It is probably not safe. And we probably do not need to run everything. I want things in a state where we can run axe and pa11y on the test pages that contain known failures. The plan is to extend the list of known failures to cover the new WCAG requirements, and to test whether the tools have improved.*

> alt annet kan fjernes
>
> *Everything else can be removed.*

**Decision:** no old code is run from now on. The goal is to run axe and pa11y against the test pages, and to add test cases for newer WCAG criteria.

The assistant wrote a plan. It covered:
- new packages: axe-core, @axe-core/puppeteer, pa11y and puppeteer, using the Chrome already installed
- `ignore-scripts=true` in the project's `.npmrc`
- a new data file `retest.json`, kept apart from the original results
- new test cases for WCAG 2.1 and 2.2 at levels A and AA
- a script that runs both tools
- new columns on the results page

The plan first proposed removing most of the site.

## 3. Keeping the original and separating old from new (07:30)

The maintainer rejected the first plan:

> vi kan beholde indeks.html men oppdatere den. på testsiden behold det som er der i dag, men få inn de nye kravene og legg til ny collone for nylig test av de nye verktøyene og gjør det tydlelig hva som var og hva som er.
>
> *We can keep index.html but update it. On the test page, keep what is there today, but add the new requirements and add a new column for the recent test of the new tools, and make it clear what was and what is.*

**Decision:** all original content and results stay. The retest gets its own columns, and it must be clear which results are original and which are new.

## 4. The list of criteria (07:40)

> dette er listen med krav som manglet som jeg hentet ut. tenker vi kan utvide til wcag 2.2 aaa og heller filtere bort. 1.2.4, 1.2.6, 1.2.7, 1.2.9, 1.3.4, 1.3.5, 1.3.6, 1.4.2, 1.4.5, 1.4.7, 1.4.9, 1.4.12, 2.1.3, 2.1.4, 2.2.3, 2.2.4, 2.2.5, 2.2.6, 2.3.2, 2.3.3, 2.4.1, 2.4.5, 2.4.8, 2.4.11, 2.4.12, 2.4.13, 2.5.1, 2.5.2, 2.5.3, 2.5.4, 2.5.6, 2.5.7, 3.1.3, 3.1.6, 3.2.1, 3.2.3, 3.2.4, 3.2.6, 3.3.4, 3.3.5, 3.3.6, 3.3.7, 3.3.8, 3.3.9, 4.1.3
>
> *This is the list of missing criteria that I extracted. I think we can extend to WCAG 2.2 AAA and filter instead.*

**Decision:** cover every success criterion up to WCAG 2.2 AAA that the original did not cover, and let readers filter by level.

The assistant wrote 52 test cases. They cover all criteria in the list, plus 1.4.11, 1.4.13 and 2.5.8 from its own plan. Each test case has a `wcag` field with criterion, name, level and version.

The test cases were placed in the existing categories where they fit. New categories were created for the rest: "Content on Hover or Focus", "Pointer and Motion", "Timing" and "Animation and Flashing". Behaviour that needs script (tooltips, gestures, timeouts and so on) is in `assets/javascript/main.js`, and styles are in `assets/sass/tests.scss`. Criteria about consistency across pages (3.2.3, 3.2.4, 3.2.6, and 2.4.5 and 2.4.8) use extra pages in `example-pages/`.

The test-cases page got a filter by level (original, A, AA, AAA). The two test cases for 4.1.1 Parsing got a note that the criterion was removed in WCAG 2.2.

### Media files

The media test cases (1.2.4, 1.2.6, 1.2.7, 1.2.9, 1.4.2, 1.4.7) needed sound and video. The files in `assets/test_media/` were generated as follows, with espeak-ng and ffmpeg:

```sh
espeak-ng -v en-gb -s 150 -w speech.wav "Welcome to the recycling service. Your bin collection day has changed from Monday to Thursday. Please put your bin out by seven in the morning. Thank you for recycling."
ffmpeg -y -i speech.wav -ac 1 -ar 22050 -b:a 48k speech.mp3

# Speech with loud "background music": a chord of sine tones with tremolo
ffmpeg -y -i speech.wav -f lavfi -i "sine=f=220:d=12" -f lavfi -i "sine=f=277:d=12" -f lavfi -i "sine=f=330:d=12" \
  -filter_complex "[1][2][3]amix=inputs=3,volume=2.5,tremolo=f=4:d=0.6[m];[0]volume=2[s];[s][m]amix=inputs=2:duration=first" \
  -ac 1 -ar 22050 -b:a 48k speech-with-background-music.mp3

# Video: ffmpeg test pattern with the speech as sound
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 speech.wav)
ffmpeg -y -f lavfi -i "testsrc2=s=320x180:r=15:d=$D" -i speech.wav -c:v libx264 -pix_fmt yuv420p \
  -profile:v baseline -crf 32 -c:a aac -b:a 48k -ac 1 -shortest -movflags +faststart speech-video.mp4
```

`speech-video.vtt` holds captions written by hand for the same four sentences.

## 5. The retest script and the first runs (07:45 to 08:10)

The assistant wrote `scripts/retest.mjs`. It checks an empty baseline page first and removes any findings that also appear on it. It then runs axe-core and pa11y (HTML_CodeSniffer) on every page and proposes a result per tool. The rules are described on the method page.

Changes made after the first runs:

| Problem found | Change |
| --- | --- |
| pa11y notices put about 80% of test cases in "user to check" | Notices are no longer counted. They are still in the raw data. |
| Links on 7 added pages failed the target size rule (2.5.8) | A `spaced-links` class gives the links space. |
| Headings in added test cases failed the heading order rule | `h4` changed to `h2` |
| The chat widget (2.4.12) had low text contrast | Background colour changed. axe still marks the contrast as "needs review" probably because the widget overlaps other content. |

Only added test pages were changed. The original 142 pages were not touched. The retest was then run again from scratch for all pages (`node scripts/retest.mjs --force`). The published results come from that run.

Other technical problems that were fixed:
- `npm audit` against the internal mirror failed, so it was run with `--registry=https://registry.npmjs.org`.
- Sass in folder mode compiled vendored subfolders, so it now uses explicit file pairs.
- puppeteer was pinned to `^25.11.0` because the newest version was less than 7 days old.
- An ffmpeg option (`normalize`) was not supported and was removed.

The assistant checked the site in Chrome and ran axe on `index.html` and `results.html`: no violations. It fixed two layout problems in the retest tables:
- the tool names made the columns overlap
- the table captions were hidden by an old rule

Correction: in its report, the assistant had first said that the old `npm install` ran install scripts. That was wrong. Install scripts were turned off on the machine, and the assistant corrected this.

Results of the run on 29 September 2026 (share of test cases with "issue found" or "warning only"):

| Tool | Original audit | Retest, original 142 test cases | Retest, added A and AA |
| --- | --- | --- | --- |
| axe | 29% | 30% | 10% |
| pa11y (HTML_CodeSniffer) | 20% | 31% | 0% |

## 6. Publishing (08:15)

> du kan pushe rett til gh-pages og jeg vil ha med rådataene og skru på github pages hvis det ikke er på
>
> *You can push directly to gh-pages, and I want the raw data included, and turn on GitHub Pages if it is not on.*

The sources and the generated site were committed in separate commits (`a878cc1` and `e6c68ca`), following the practice in CONTRIBUTING.md. The raw data went into `results/2026-09-29/`. GitHub Pages was already enabled for the gh-pages branch.

## 7. Separating the copy from GDS (08:19)

> index.html må skilles mer fra den originale auditen. we er gov.uk ikke meg. så må skille de 2
>
> *index.html must be separated more from the original audit. "We" is GOV.UK, not me. So the two must be separated.*

**Decision:** the text from GDS stays unchanged and still says "we". Text added in this copy is written in the third person.

Changes:
- Every page has a notice saying that this is an independent copy, that "we" means GDS, and that the additions were not made, reviewed or endorsed by GDS.
- The GDS introduction on the overview page was restored to its original wording.
- The retest was moved into its own marked section labelled "Not by GDS".

## 8. Licence (08:25)

> what is Open Government Licence v3.0 og hvilke krav stiller den?
>
> *What is the Open Government Licence v3.0, and what does it require?*

The assistant explained what the licence requires:
- attribution of the source
- no suggestion of official status or endorsement
- no misrepresentation
- some exceptions, such as logos and personal data

It noted that the notice about GDS not endorsing the additions meets the endorsement condition.

## 9. Moving to A11y Intuition Lab and documenting the method (08:30)

> så jeg tenker vi skal legge dette under https://github.com/a11y-intuition-lab/ vi skal og passe på å oppfylle https://github.com/a11y-intuition-lab/ så vi trenger å tydligjøre hva som er blitt gjort. vi bør og skrive en egen side som skriver om bruk av claude og hva vi har gjort for å oppdatere og endre denne siden. still meg spørsmål om noe rundt prosessen er uklart
>
> *So I think we should put this under the a11y-intuition-lab organisation. We must also make sure to comply [with the licence], so we need to make clear what has been done. We should also write a separate page about the use of Claude and what we have done to update and change this site. Ask me if anything about the process is unclear.*

The assistant asked four questions. The maintainer's answers:

> mente gov lisensen. og at jeg tenker vi flytter dette repo under den orgen. så du kan se litt hva den er
>
> *I meant the government licence. And that I think we move this repo under that organisation, so you can look at what it is.*

- Transfer the existing repository (chosen from the options).
- A web page and a full log (chosen from the options), with this note:

> det oppdaterte dokumentet skal muligens brukes i forskning så bør være repliserbart. men trenger ikke være 100% av historikken, men nok til at det kan repliseres. derfor metode og er viktig her. arbeidet original er jo og feilbarlig da det er utført av mennesker. bruk av ai her har latt oss effektivt legge til manglende scenarioer og teste som vi ellers ikke ville hatt resurser til
>
> *The updated document may be used in research, so it should be replicable. It does not need 100% of the history, but enough that it can be replicated. That is why the method is important here. The original work is also fallible, since it was done by people. Using AI here has let us efficiently add missing scenarios and test in a way we would not otherwise have had resources for.*

> tenker det repo fint kan fortsette å være under ogl
>
> *I think the repo can happily continue to be under the OGL.*

**Decisions:**
- The repository was transferred to `a11y-intuition-lab`. GitHub redirects the old address.
- All content, including the additions, is under the Open Government Licence v3.0. Code stays under the MIT licence (`LICENSE`).
- The footer credits GDS as the source, as the licence requires.
- A method page and this log were written.

While writing the method page, the assistant checked the session transcript. It found that the old dependencies had been installed and the old build had been tried before the safety rule was given (section 1). The method page states this instead of claiming the old code was never run.

## Open

- The retest proposals have not all been checked by hand. See `results/2026-09-29/summary.md`.
- The added test cases have not been reviewed by an independent accessibility expert.

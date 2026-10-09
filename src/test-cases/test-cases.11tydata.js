// Directory data for all test cases.
//
// - The body of each file is the example HTML, verbatim: templateEngineOverride false stops
//   Eleventy from running it through Liquid/Nunjucks.
// - GOV.UK test cases (origin govuk-2017) use the original page template unchanged.
//   AIL test cases (origin ail-2026) use an identical layout except for the <title> suffix.
export default {
  tags: ['testCase'],
  templateEngineOverride: false,
  eleventyComputed: {
    layout: (data) => (data.origin === 'ail-2026' ? 'fixture-ail.njk' : 'fixture-govuk.njk'),
    permalink: (data) => `tests/${data.page.fileSlug}.html`,
  },
};

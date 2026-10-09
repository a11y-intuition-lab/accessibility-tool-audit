// Eleventy 3 configuration (ESM).
//
// Input is `src/`. The fixture assets and example pages live at the repository root and are
// copied unchanged, so their URL paths stay the same as upstream (`govuk-final`).
// `data/`, `wiki/` and `scripts/` are outside the input directory and are never processed.

// Reproduces processExample() from the upstream build/generate.js, including its quirk:
// String.replace with a string pattern replaces only the FIRST occurrence. The built
// tests/<slug>.html files must stay byte-identical to upstream, so this must not be "fixed".
function processExample(example) {
  if (example.indexOf('images') > -1) {
    example = example.replace('images/', '../assets/test_images/');
  }
  if (example.indexOf('example-pages') > -1) {
    example = example.replace('example-pages/', '../example-pages/');
  }
  return example;
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.addPassthroughCopy('example-pages');
  eleventyConfig.addPassthroughCopy({ 'src/site-assets': 'site-assets' });

  eleventyConfig.addFilter('processExample', processExample);

  // Combined page (test-cases.html) uses a global replace, as upstream's Nunjucks `replace` did.
  eleventyConfig.addFilter('combinedExample', (example) =>
    example.split('images/').join('assets/test_images/'),
  );

  // Test cases in the original order: by category, then by position within the category.
  eleventyConfig.addCollection('testCases', (api) =>
    api
      .getFilteredByTag('testCase')
      .sort((a, b) => a.data.categoryOrder - b.data.categoryOrder || a.data.order - b.data.order),
  );

  eleventyConfig.addFilter('groupByCategory', (items) => {
    const groups = [];
    for (const item of items) {
      let group = groups.find((g) => g.name === item.data.category);
      if (!group) {
        group = { name: item.data.category, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups;
  });

  // Number of test cases whose result in column `key` equals `value` (null = no result).
  eleventyConfig.addFilter('countResult', (items, byTest, key, value) =>
    items.filter((item) => (byTest[item.fileSlug]?.[key] ?? null) === value).length,
  );

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    pathPrefix: '/accessibility-tool-audit/',
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
}

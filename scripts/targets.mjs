// Which page(s) to test for a test case. Most examples are on the generated
// test page. Some are only links to pages in example-pages/, because the
// barrier is on the whole page (lang, title) or across pages (consistency).
// CONTRIBUTING says the linked pages are what should be tested. An iframe
// that embeds an example page is tested on the test page itself.

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function pageUrl(file) {
  return pathToFileURL(path.join(root, 'tests', file + '.html')).href;
}

export function exampleUrl(file) {
  return pathToFileURL(path.join(root, 'example-pages', file)).href;
}

export function targetUrls(test, file) {
  const linked = [...test.example.matchAll(/<a\s[^>]*href="(example-pages\/[^"#]+)"/g)]
    .map(m => exampleUrl(m[1].slice('example-pages/'.length)));
  return linked.length ? [...new Set(linked)] : [pageUrl(file)];
}

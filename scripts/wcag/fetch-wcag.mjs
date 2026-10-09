#!/usr/bin/env node
// Fetch W3C's machine-readable WCAG 2.2 data and normalise it to one record per success criterion.
//
// Usage (from the repository root, Node 24, no dependencies):
//   node scripts/wcag/fetch-wcag.mjs            # download raw copy, then normalise
//   node scripts/wcag/fetch-wcag.mjs --offline  # normalise the stored raw copy only (reproducible)
//
// Inputs/outputs:
//   data/wcag/raw/wcag.json            raw copy, byte-for-byte as served by W3C
//   data/wcag/raw/retrieval.json       URL, retrieval time, HTTP validators, sha256 of the raw copy
//   data/wcag/success-criteria.json    normalised list (see wiki/sources/wcag.md)
//
// The W3C file is the data behind the WCAG 2.2 Recommendation. Each success criterion has a
// `versions` array listing the WCAG 2.x versions that contain it; the earliest entry is the version
// that introduced it. 4.1.1 Parsing is listed with versions ["2.0","2.1"] and an empty level because it
// was removed in 2.2, so `removed` is derived as the next version after its last listed one.

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://www.w3.org/WAI/WCAG22/wcag.json';
const UNDERSTANDING_BASE = 'https://www.w3.org/WAI/WCAG22/Understanding/';
const VERSIONS = ['2.0', '2.1', '2.2'];
// Levels that the 2.2 data leaves empty because the criterion was removed. Value from WCAG 2.0/2.1.
const LEVEL_OF_REMOVED = { '4.1.1': 'A' };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rawDir = join(root, 'data', 'wcag', 'raw');
const rawFile = join(rawDir, 'wcag.json');
const retrievalFile = join(rawDir, 'retrieval.json');
const outFile = join(root, 'data', 'wcag', 'success-criteria.json');

const offline = process.argv.includes('--offline');

if (!offline) {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`GET ${SOURCE_URL} -> HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(rawDir, { recursive: true });
  await writeFile(rawFile, buf);
  const retrieval = {
    url: SOURCE_URL,
    retrieved: new Date().toISOString(),
    lastModified: res.headers.get('last-modified'),
    etag: res.headers.get('etag'),
    bytes: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex'),
  };
  await writeFile(retrievalFile, JSON.stringify(retrieval, null, 2) + '\n');
  console.log(`Fetched ${buf.length} bytes, sha256 ${retrieval.sha256}`);
}

const rawBuf = await readFile(rawFile);
const sha256 = createHash('sha256').update(rawBuf).digest('hex');
const retrieval = JSON.parse(await readFile(retrievalFile, 'utf8'));
if (retrieval.sha256 !== sha256) {
  throw new Error(`Raw file sha256 ${sha256} does not match retrieval.json (${retrieval.sha256})`);
}
const wcag = JSON.parse(rawBuf.toString('utf8'));

const criteria = [];
for (const p of wcag.principles) {
  for (const g of p.guidelines) {
    for (const sc of g.successcriteria) {
      const versions = [...sc.versions].sort();
      const introduced = versions[0];
      const last = versions[versions.length - 1];
      const removed = last === VERSIONS.at(-1) ? null : VERSIONS[VERSIONS.indexOf(last) + 1];
      const level = sc.level || LEVEL_OF_REMOVED[sc.num];
      if (!level) throw new Error(`No level for ${sc.num}`);
      // `failure` entries are usually techniques; collect nested ones too in case they are grouped.
      const flatten = (t) => [t, ...(t.techniques ?? []).flatMap(flatten), ...(t.groups ?? []).flatMap(flatten)];
      const failures = (sc.techniques?.failure ?? [])
        .flatMap(flatten)
        .filter((t) => t.id && /^F\d+$/.test(t.id))
        .map((t) => ({ id: t.id, title: t.title }));
      const uniqueFailures = [...new Map(failures.map((f) => [f.id, f])).values()];
      criteria.push({
        id: sc.num,
        slug: sc.id,
        handle: sc.handle.replace(/\s*\(Obsolete and removed\)$/, ''),
        level,
        principle: `${p.num} ${p.handle}`,
        guideline: `${g.num} ${g.handle}`,
        introduced,
        removed,
        versions,
        url: `${UNDERSTANDING_BASE}${sc.id}.html`,
        failureTechniques: uniqueFailures,
      });
    }
  }
}

const cmp = (a, b) => {
  const pa = a.id.split('.').map(Number);
  const pb = b.id.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};
criteria.sort(cmp);

const counts = Object.fromEntries(
  VERSIONS.map((v) => [v, criteria.filter((c) => c.introduced <= v && (!c.removed || c.removed > v)).length]),
);
counts['2.2 incl. removed 4.1.1'] = criteria.length;

const out = {
  meta: {
    source: SOURCE_URL,
    sha256,
    retrieved: retrieval.retrieved,
    licence: 'W3C Document License, https://www.w3.org/copyright/document-license/',
    attribution:
      'Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation. Copyright © World Wide Web Consortium.',
    generatedBy: 'scripts/wcag/fetch-wcag.mjs',
    counts,
    notes:
      '`introduced` = earliest entry of the W3C `versions` array; `removed` = version after the last entry when that ' +
      'is not 2.2. 4.1.1 Parsing has an empty level in the 2.2 data; its WCAG 2.0/2.1 level (A) is used.',
  },
  successCriteria: criteria,
};
await writeFile(outFile, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${criteria.length} success criteria to ${outFile}`);
console.log('Counts per version:', counts);

const expected = { '2.0': 61, '2.1': 78, '2.2': 86, '2.2 incl. removed 4.1.1': 87 };
for (const [k, v] of Object.entries(expected)) {
  if (counts[k] !== v) console.warn(`WARNING: expected ${v} success criteria for ${k}, found ${counts[k]}`);
}

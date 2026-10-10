// Lists mappings awaiting human review (review: "pending") as Markdown.
// Reads data/mappings/test-case-wcag*.json and data/mappings/sc-test-methods.json.
// Usage: node scripts/wcag/review-queue.mjs
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../../data/mappings');
const rows = [];
for (const file of readdirSync(dir).filter((f) => /^test-case-wcag.*\.json$/.test(f)).sort()) {
  const { mappings } = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  for (const [id, m] of Object.entries(mappings)) {
    if (m.review !== 'pending') continue;
    const scs = m.wcag.map((w) => `${w.sc} ${w.relation}`).join(', ');
    rows.push(`| \`${id}\` | ${scs} |`);
  }
}
console.log(`${rows.length} mappings awaiting review\n\n| Test case | Current mapping |\n|---|---|\n${rows.join('\n')}`);

const methodsFile = join(dir, 'sc-test-methods.json');
if (existsSync(methodsFile)) {
  const { criteria } = JSON.parse(readFileSync(methodsFile, 'utf8'));
  const pending = Object.entries(criteria).filter(([, c]) => c.review === 'pending');
  console.log(`\n${pending.length} test-method entries awaiting review\n\n| SC | Groups | Automation / AI / human |\n|---|---|---|`);
  for (const [id, c] of pending) {
    const groups = [c.groups.primary, ...(c.groups.secondary ?? [])].join(', ');
    console.log(`| ${id} ${c.handle} | ${groups} | ${c.automation.level} / ${c.ai.level} / ${c.human.level} |`);
  }
}

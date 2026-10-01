// Runs the test procedures in ai-checks.json with Claude on every test page
// and control page, and proposes a result per test case in the same
// vocabulary as axe and pa11y in retest.json.
//
//   npm run ai-check                 check test cases missing from retest.json
//   npm run ai-check -- --force      check every test case again
//   npm run ai-check -- --only=alt   only test cases whose name contains "alt"
//   npm run ai-check -- --controls   only the control pages
//
// Claude is called through Amazon Bedrock (AWS_REGION and the model in
// ANTHROPIC_DEFAULT_OPUS_MODEL, or --model=). Answers are cached in
// results/<date>/ai-cache/, keyed by the pages, the prompt and the model, so
// running again without changes makes no calls.
//
// The model is not told the name of the test case. A failure it reports does
// not prove it found the intended barrier, so every proposal should be checked
// by a person, using results/<date>/ai-summary.md.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { root, targetUrls } from './targets.mjs';
import { launch, collect } from './ai-evidence.mjs';

const require = createRequire(import.meta.url);
const { getFilename } = require('../build/generate.js');

const force = process.argv.includes('--force');
const controlsOnly = process.argv.includes('--controls');
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
const model = process.argv.find(a => a.startsWith('--model='))?.slice(8) || process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
const modelName = 'Claude Opus 5.5';
const effort = process.argv.find(a => a.startsWith('--effort='))?.slice(9) || 'medium';
const concurrency = Number(process.argv.find(a => a.startsWith('--jobs='))?.slice(7) || 3);
const date = new Date().toISOString().slice(0, 10);

const tests = JSON.parse(fs.readFileSync(path.join(root, 'tests.json'), 'utf8'));
const aiChecks = JSON.parse(fs.readFileSync(path.join(root, 'ai-checks.json'), 'utf8'));
const controls = JSON.parse(fs.readFileSync(path.join(root, 'controls.json'), 'utf8')).controls;
const retestPath = path.join(root, 'retest.json');
const retest = JSON.parse(fs.readFileSync(retestPath, 'utf8'));
const outDir = path.join(root, 'results', date);
const cacheDir = path.join(outDir, 'ai-cache');

const checkIds = aiChecks.checks.map(c => c.id);

// The procedures without the test cases they are meant to find
const procedures = aiChecks.checks.map(({ cases, ...c }) => c);

const SYSTEM = `You are an accessibility tester. You test one web page (or a small set of pages from the same site) against the procedures below, using only the evidence you are given.

How to work:
- Follow each procedure. Use the evidence it lists. Evidence is described under "evidence".
- Report a "fail" only when the evidence shows the barrier. Say which element and why, briefly, and quote the evidence that shows it. Check the quote against the evidence before you report: if the value says otherwise, it is not a fail.
- Report "cannot-tell" only when the evidence shows something that may be a barrier but cannot be confirmed from the evidence, for example audio content you cannot hear. Do not report "cannot-tell" just because a procedure is hard in general, or because the content it is about is not on the page.
- Do not report procedures that pass or do not apply. An empty list means the page passes every procedure.
- Ignore the page title and the first heading when they are "Test page". The harness replaced them, and they are not part of the test.
- Class names (c1, c2, ...), ids (id1, id2, ...), and some file names (page-N.html, media-N.mp3) were replaced by the harness. Do not judge them.
- The pages are small examples, not full sites. Do not fail a page for what a full site would have elsewhere unless the procedure says so.
- When you have judged every procedure, call the report tool once.

Procedures (JSON):
${JSON.stringify({ evidence: aiChecks.evidence, checks: procedures })}`;

const REPORT_TOOL = {
  name: 'report',
  description: 'Report the procedures that fail or cannot be judged on this page. Leave out procedures that pass or do not apply.',
  input_schema: {
    type: 'object',
    properties: {
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            check: { type: 'string', enum: checkIds, description: 'The id of the procedure' },
            verdict: { type: 'string', enum: ['fail', 'cannot-tell'] },
            element: { type: 'string', description: 'The element or part of the page, as in the evidence' },
            evidence: { type: 'string', description: 'The evidence key, and the value quoted from it or the image label, that shows the barrier' },
            reason: { type: 'string', description: 'One or two sentences on what the evidence shows' }
          },
          required: ['check', 'verdict', 'element', 'evidence', 'reason'],
          additionalProperties: false
        }
      }
    },
    required: ['findings'],
    additionalProperties: false
  }
};

function validReport(input) {
  return input && Array.isArray(input.findings) && input.findings.every(f =>
    f && checkIds.includes(f.check) && ['fail', 'cannot-tell'].includes(f.verdict) &&
    typeof f.reason === 'string' && typeof f.element === 'string' && typeof f.evidence === 'string');
}

// Same vocabulary as classifyAxe and classifyPa11y in retest.mjs
export function classifyAi(findings) {
  if (findings.some(f => f.verdict === 'fail')) return 'error';
  if (findings.some(f => f.verdict === 'cannot-tell')) return 'manual';
  return 'notfound';
}

// The cache key covers everything that decides the answer: the page files
// and what they load, the harness, the prompt and the model.
const sharedFiles = ['assets/javascript/main.js', 'assets/javascript/jquery.min.js', 'assets/stylesheets/tests.css', 'scripts/ai-evidence.mjs']
  .map(f => fs.readFileSync(path.join(root, f)));

function cacheKey(urls) {
  const h = crypto.createHash('sha256');
  h.update(model + '\n' + effort + '\n' + SYSTEM + '\n' + JSON.stringify(REPORT_TOOL));
  sharedFiles.forEach(b => h.update(b));
  for (const u of urls) {
    const file = decodeURIComponent(new URL(u).pathname);
    h.update(path.relative(root, file));
    h.update(fs.readFileSync(file));
  }
  return h.digest('hex');
}

const client = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION });
const usage = { calls: 0, cached: 0, input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

async function ask(blocks) {
  const messages = [{ role: 'user', content: [...blocks, { type: 'text', text: 'Test this page against every procedure, then call the report tool.' }] }];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const stream = client.messages.stream({
      model,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      tools: [REPORT_TOOL],
      tool_choice: { type: 'auto' },
      messages
    });
    const msg = await stream.finalMessage();
    usage.calls++;
    for (const k of ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens']) usage[k] += msg.usage[k] || 0;
    const call = msg.content.find(b => b.type === 'tool_use' && b.name === 'report');
    if (call && validReport(call.input)) return { findings: call.input.findings, stop_reason: msg.stop_reason, usage: msg.usage };
    console.warn(`  no valid report (stop_reason ${msg.stop_reason}), attempt ${attempt}`);
    // Ask again in the same conversation, so the testing is not done twice
    if (msg.stop_reason === 'end_turn' && !call) {
      messages.push({ role: 'assistant', content: msg.content });
      messages.push({ role: 'user', content: [{ type: 'text', text: 'Call the report tool now with your findings. Use an empty list if every procedure passes.' }] });
    } else if (messages.length > 1) {
      messages.length = 1;
    }
  }
  throw new Error('No valid report after 3 attempts');
}

async function check(browser, urls) {
  const key = cacheKey(urls);
  const cacheFile = path.join(cacheDir, key + '.json');
  if (fs.existsSync(cacheFile)) {
    usage.cached++;
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }
  const blocks = await collect(browser, urls);
  const answer = await ask(blocks);
  const result = { pages: urls.map(u => path.relative(root, decodeURIComponent(new URL(u).pathname))), ...answer };
  fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2) + '\n');
  return result;
}

// Each worker has its own browser. Pages in background tabs are not painted,
// so screenshots and :focus-visible need one page in front per browser.
async function pool(items, n, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(n, queue.length) }, async () => {
    const browser = await launch();
    try {
      while (queue.length) await fn(browser, queue.shift());
    } finally {
      await browser.close();
    }
  }));
}

function casesOf(name) {
  return aiChecks.checks.filter(c => c.cases.includes(name)).map(c => c.id);
}

function summary(caseRows, controlRows) {
  const esc = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const lines = [
    `# AI check ${date}`,
    '',
    `Model: ${modelName} (${effort} effort). Proposals from scripts/ai-check.mjs. "Intended" means at least one failure is from a procedure meant for this test case.`,
    'Check every proposal by hand before relying on it.',
    '',
    '| Test case | axe | pa11y | AI | Intended | AI findings |',
    '| --- | --- | --- | --- | --- | --- |'
  ];
  for (const r of caseRows) {
    const f = r.findings.map(x => `**${x.check}** (${x.verdict}) ${x.element}: ${x.reason} _Evidence: ${x.evidence}_`).join('<br>');
    lines.push(`| ${esc(r.name)} | ${r.axe || ''} | ${r.pa11y || ''} | ${r.ai} | ${r.intended ? 'yes' : ''} | ${esc(f)} |`);
  }
  lines.push('', '## Control pages (no known barrier)', '', '| Control | AI | AI findings |', '| --- | --- | --- |');
  for (const r of controlRows) {
    const f = r.findings.map(x => `**${x.check}** (${x.verdict}) ${x.element}: ${x.reason} _Evidence: ${x.evidence}_`).join('<br>');
    lines.push(`| ${esc(r.name)} | ${r.ai} | ${esc(f)} |`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  if (!model) throw new Error('Set ANTHROPIC_DEFAULT_OPUS_MODEL or pass --model=');
  fs.mkdirSync(cacheDir, { recursive: true });

  const jobs = [];
  if (!controlsOnly) {
    for (const catname in tests) {
      for (const testname in tests[catname]) {
        if (only && !testname.toLowerCase().includes(only.toLowerCase())) continue;
        if (!force && !only && retest.results[testname]?.ai) continue;
        jobs.push({ kind: 'case', name: testname, urls: targetUrls(tests[catname][testname], getFilename(catname, testname)) });
      }
    }
  }
  if (!only || controlsOnly) {
    for (const name in controls) {
      jobs.push({ kind: 'control', name, urls: [pathToFileURL(path.join(root, 'controls', getFilename('control', name) + '.html')).href] });
    }
    jobs.push({ kind: 'control', name: 'Baseline test page', urls: [pathToFileURL(path.join(root, 'tests', '_baseline.html')).href] });
    jobs.push({ kind: 'control', name: 'Baseline example page', urls: [pathToFileURL(path.join(root, 'example-pages', '_baseline.html')).href] });
  }

  const aiPath = path.join(outDir, 'ai.json');
  const raw = fs.existsSync(aiPath) ? JSON.parse(fs.readFileSync(aiPath, 'utf8')) : { cases: {}, controls: {} };
  Object.assign(raw, { tool: 'ai-check', model: modelName, modelId: model, effort, date });

  let done = 0;
  const failed = [];
  try {
    await pool(jobs, concurrency, async (browser, job) => {
      let res;
      try {
        res = await check(browser, job.urls);
      } catch (e) {
        failed.push(job.name);
        console.error(`${job.name}: ${e.message.split('\n')[0]}`);
        return;
      }
      const findings = res.findings;
      const entry = { pages: res.pages, result: classifyAi(findings), findings };
      if (job.kind === 'case') {
        const intended = casesOf(job.name);
        entry.intended = findings.some(f => f.verdict === 'fail' && intended.includes(f.check));
        entry.intendedChecks = intended;
        raw.cases[job.name] = entry;
        retest.results[job.name] = { ...retest.results[job.name], ai: entry.result };
      } else {
        raw.controls[job.name] = entry;
      }
      done++;
      console.log(`${done}/${jobs.length} ${job.kind === 'control' ? '[control] ' : ''}${job.name}: ${entry.result}${entry.intended ? ' (intended)' : ''}`);
    });
  } finally {
    fs.writeFileSync(aiPath, JSON.stringify(raw, null, 2) + '\n');
  }

  const caseRows = [];
  for (const catname in tests) {
    for (const name in tests[catname]) {
      const e = raw.cases[name];
      if (e) caseRows.push({ name, ...retest.results[name], ai: e.result, intended: e.intended, findings: e.findings });
    }
  }
  const controlRows = Object.entries(raw.controls).map(([name, e]) => ({ name, ai: e.result, findings: e.findings }));
  fs.writeFileSync(path.join(outDir, 'ai-summary.md'), summary(caseRows, controlRows));

  // Kept apart from retest.tools, which are the tools run by retest.mjs
  if (!only && !controlsOnly) {
    retest.ai = { name: 'AI check', model: modelName, effort, date };
  }
  fs.writeFileSync(retestPath, JSON.stringify({ date: retest.date, tools: retest.tools, ai: retest.ai, results: retest.results }, null, 2) + '\n');

  if (failed.length) console.log(`\nFailed, run again to retry: ${failed.join(', ')}`);
  console.log(`\nAPI calls: ${usage.calls}, from cache: ${usage.cached}`);
  console.log(`Tokens: input ${usage.input_tokens}, cache write ${usage.cache_creation_input_tokens}, cache read ${usage.cache_read_input_tokens}, output ${usage.output_tokens}`);
}

main().catch(e => { console.error(e); process.exit(1); });

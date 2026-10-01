// Collects the evidence described in ai-checks.json for one test case, so an
// AI model can judge the page. Each probe starts from a fresh load, so one
// probe cannot change what another sees.
//
// Blinding: the test pages name the barrier in their title, first heading,
// class names, ids and some file names. These are replaced before anything is
// collected or shown, so the model judges the page and not its labels. Titles
// of example pages are kept unless they name the audit, because some example
// pages test the title itself.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { root } from './targets.mjs';

const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const WIDTH = 1280;
const HEIGHT = 800;
const MAX_SHOT_HEIGHT = 1600;
const MAX_TAB = 40;
const TAB_IMAGES = 10;
const MAX_ACTIVATE = 10;
const MAX_HOVER = 40;

// File names that name the barrier. Image names are kept, because a file
// name used as alt text is one of the barriers.
const LEAKY_NAMES = [
  ...fs.readdirSync(path.join(root, 'assets/test_media')),
  ...fs.readdirSync(path.join(root, 'example-pages'))
];

export async function launch() {
  return puppeteer.launch({ executablePath: chromePath, headless: true, protocolTimeout: 60000,
    // Tracks and iframes on file:// pages load as they would on a web server
    args: ['--allow-file-access-from-files'] });
}

// Runs in the page before any page script. Records changes to the page and
// calls to window.open, labelled with the action the harness last performed.
function instrument() {
  const t0 = performance.now();
  // mark is only used to find the script id of the harness, so its own
  // listeners can be left out of the evidence
  window.__ai = { log: [], action: 'load', mark: () => {} };
  const pathOf = el => window.__aiPath ? window.__aiPath(el) : (el && el.nodeName);
  const push = change => window.__ai.log.push({
    t: Math.round(performance.now() - t0), action: window.__ai.action, ...change
  });
  window.open = function (url) {
    push({ change: 'window.open', detail: 'page tried to open a new window' + (url ? ' (' + String(url).split('/').pop() + ')' : '') });
    return null;
  };
  const shown = el => el.nodeType === 1 && el.checkVisibility && el.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  const text = n => (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const start = () => new MutationObserver(ms => {
    for (const m of ms) {
      const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (!target || target.closest('[data-ai-harness]')) continue;
      if (m.type === 'childList') {
        const added = [...m.addedNodes].map(text).filter(Boolean).join(' | ');
        const removed = [...m.removedNodes].map(text).filter(Boolean).join(' | ');
        if (added || removed) push({ change: 'content', element: pathOf(target), added, removed });
      } else if (m.type === 'characterData') {
        push({ change: 'text', element: pathOf(target), now: text(target) });
      } else if (m.type === 'attributes') {
        const name = m.attributeName;
        if (name === 'class') {
          push({ change: 'class', element: pathOf(target), visibleNow: shown(target), text: text(target).slice(0, 60) });
        } else if (name !== 'id' && !name.startsWith('data-ai')) {
          push({ change: 'attribute', element: pathOf(target), attribute: name, value: target.hasAttribute(name) ? target.getAttribute(name).slice(0, 80) : '(removed)', visibleNow: shown(target) });
        }
      }
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true });
  // A link or form that would leave the page is logged instead of followed,
  // so the probe can go on. This runs last, after the page's own click handlers.
  window.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    const href = a && a.getAttribute('href');
    if (e.defaultPrevented || !href || href.startsWith('#') || href.startsWith('javascript:')) return;
    e.preventDefault();
    push({ change: 'navigation', element: pathOf(a), detail: 'link would open ' + (href.split('/').filter(Boolean).pop() || href) + (a.target === '_blank' ? ' in a new window' : '') });
  });
  window.addEventListener('submit', e => {
    if (e.defaultPrevented) return;
    e.preventDefault();
    push({ change: 'form submitted', element: pathOf(e.target), detail: 'the browser would now load ' + (e.target.getAttribute('action') || 'the same page') });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}

// Runs in the page after load. Defines helpers used by the probes and
// replaces the title and first heading where they name the test case.
function prepare(isTestPage) {
  window.__aiPath = el => {
    if (!el || el.nodeType !== 1) return String(el && el.nodeName);
    if (el === document.body) return 'body';
    if (el === document.documentElement) return 'html';
    const parts = [];
    while (el && el !== document.body && el.nodeType === 1) {
      const tag = el.tagName.toLowerCase();
      const same = el.parentElement ? [...el.parentElement.children].filter(c => c.tagName === el.tagName) : [];
      parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(el) + 1})` : tag);
      el = el.parentElement;
    }
    return parts.join(' > ');
  };
  const leaky = /accessibility tool|keyboard trap|baseline|unorganised/i;
  if (isTestPage || leaky.test(document.title)) document.title = 'Test page';
  const h1 = document.querySelector('h1');
  if (h1 && (isTestPage || leaky.test(h1.textContent))) h1.textContent = 'Test page';
}

async function open(browser, url, { isTestPage, viewport = {}, before } = {}) {
  const page = await browser.newPage();
  // Every page acts as the focused window, so :focus-visible works when
  // several pages are checked at the same time
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, ...viewport });
  await page.evaluateOnNewDocument(instrument);
  if (before) await before(page);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    // External frames (a YouTube embed) may not load. The page itself has.
  }
  await page.evaluate(prepare, isTestPage);
  await page.evaluate(() => { window.__ai.log = []; });
  return page;
}

async function act(page, label) {
  await page.evaluate(l => { window.__ai.action = l; }, label);
}

async function takeLog(page) {
  return page.evaluate(() => { const l = window.__ai.log; window.__ai.log = []; return l; });
}

async function shot(page, options = {}) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const vp = page.viewport();
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: vp.width, height: Math.min(Math.max(height, vp.height), MAX_SHOT_HEIGHT) },
    captureBeyondViewport: true,
    ...options
  });
  return Buffer.from(buf).toString('base64');
}

// Serialises the page with neutral class names and ids. The same maps are
// used for the source file, so both describe the same page.
function serialise() {
  const classes = new Map();
  const ids = new Map();
  for (const el of document.querySelectorAll('*')) {
    for (const c of el.classList) if (!classes.has(c)) classes.set(c, 'c' + (classes.size + 1));
    if (el.id && !ids.has(el.id)) ids.set(el.id, 'id' + (ids.size + 1));
  }
  const clone = document.documentElement.cloneNode(true);
  const refs = ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-activedescendant', 'aria-details', 'aria-errormessage', 'list', 'headers', 'form'];
  for (const el of clone.querySelectorAll('*')) {
    if (el.hasAttribute('class')) {
      const v = [...el.classList].map(c => classes.get(c) || c).join(' ');
      if (v) el.setAttribute('class', v); else el.removeAttribute('class');
    }
    if (el.id) el.id = ids.get(el.id) || el.id;
    for (const r of refs) {
      if (el.hasAttribute(r)) el.setAttribute(r, el.getAttribute(r).split(/\s+/).map(x => ids.get(x) || x).join(' '));
    }
    const href = el.getAttribute('href');
    if (href && href.startsWith('#') && ids.has(href.slice(1))) el.setAttribute('href', '#' + ids.get(href.slice(1)));
    if (el.tagName === 'SCRIPT') el.textContent = '';
    if (el.tagName === 'STYLE') el.textContent = '/* styles removed */';
    if (el.hasAttribute('data-ai-harness')) el.remove();
  }
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach(c => c.remove());
  return {
    html: '<!DOCTYPE html>\n' + clone.outerHTML,
    classes: [...classes.entries()],
    ids: [...ids.entries()]
  };
}

function blindSource(source, map, isTestPage) {
  let s = source.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2');
  s = s.replace(/class="([^"]*)"/g, (m, v) => 'class="' + v.split(/\s+/).filter(Boolean).map(c => map.classes.get(c) || c).join(' ') + '"');
  s = s.replace(/\b(id|for|aria-labelledby|aria-describedby|aria-controls)="([^"]*)"/g,
    (m, a, v) => `${a}="${v.split(/\s+/).map(x => map.ids.get(x) || x).join(' ')}"`);
  s = s.replace(/href="#([^"]+)"/g, (m, v) => `href="#${map.ids.get(v) || v}"`);
  const leaky = /accessibility tool|keyboard trap|baseline|unorganised/i;
  s = s.replace(/<title>([\s\S]*?)<\/title>/i, (m, v) => (isTestPage || leaky.test(v)) ? '<title>Test page</title>' : m);
  s = s.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/i, (m, a, v) => (isTestPage || leaky.test(v)) ? `<h1${a}>Test page</h1>` : m);
  return s;
}

// Styles of visible text, links and controls, with contrast where it can be
// computed from solid colours.
function styles() {
  const parse = c => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).map(Number);
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return Math.round((l1 + 0.05) / (l2 + 0.05) * 100) / 100;
  };
  const bgOf = el => {
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none') return { image: true };
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const out = [];
  const seen = new Set();
  const visible = el => el.checkVisibility({ visibilityProperty: true }) && el.getClientRects().length;
  for (const el of document.body.querySelectorAll('*')) {
    if (out.length >= 150) break;
    if (!visible(el) || el.closest('[data-ai-harness]')) continue;
    const cs = getComputedStyle(el);
    const ownText = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
    const isControl = el.matches('input, select, textarea, button, [role=button]');
    const pseudo = ['::before', '::after'].map(p => {
      const c = getComputedStyle(el, p).content;
      return c && c !== 'none' && c !== 'normal' && c !== '""' && c !== '" "' ? `${p} content ${c}` : null;
    }).filter(Boolean);
    const bgImage = cs.backgroundImage !== 'none' && cs.backgroundImage.includes('url(')
      ? 'background image ' + cs.backgroundImage.replace(/.*\//, '').replace(/["')]+$/, '') : null;
    if (!ownText && !isControl && !pseudo.length && !bgImage && el.tagName !== 'IMG') continue;
    const fg = parse(cs.color);
    const bg = bgOf(el.parentElement && isControl ? el.parentElement : el);
    const fontSize = parseFloat(cs.fontSize);
    const rect = el.getBoundingClientRect();
    const entry = {
      element: window.__aiPath(el),
      text: (ownText || el.value || el.getAttribute('alt') || '').slice(0, 60),
      fontSize: Math.round(fontSize * 10) / 10 + 'px',
      lineHeight: cs.lineHeight === 'normal' ? 'normal' : Math.round(parseFloat(cs.lineHeight) / fontSize * 100) / 100,
      fontStyle: cs.fontStyle,
      fontWeight: cs.fontWeight,
      textTransform: cs.textTransform,
      textAlign: cs.textAlign,
      color: cs.color,
      background: bg.image ? 'image' : `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
      contrast: fg && !bg.image ? ratio(fg, bg) : 'unknown'
    };
    if (ownText.length > 80) entry.charsPerLine = Math.round(rect.width / (fontSize * 0.5));
    if (el.tagName === 'A') {
      const parent = el.parentElement;
      const pc = parse(getComputedStyle(parent).color);
      entry.underline = cs.textDecorationLine.includes('underline');
      entry.contrastWithSurroundingText = fg && pc ? ratio(fg, pc) : 'unknown';
    }
    if (isControl || el.tagName === 'IMG' || el.tagName === 'SVG') {
      const border = parse(cs.borderTopColor);
      entry.border = `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`;
      if (border && !bg.image && parseFloat(cs.borderTopWidth) > 0) entry.borderContrast = ratio(border, bg);
      entry.size = `${Math.round(rect.width)} by ${Math.round(rect.height)}`;
    }
    if (pseudo.length) entry.generated = pseudo;
    if (bgImage) entry.backgroundImage = bgImage;
    const key = JSON.stringify(entry);
    if (!seen.has(key)) { seen.add(key); out.push(entry); }
  }
  return out;
}

async function listeners(page) {
  const client = await page.createCDPSession();
  const { result: { objectId: listId } } = await client.send('Runtime.evaluate', {
    expression: '[window, document, ...document.querySelectorAll("*")]'
  });
  const { result } = await client.send('Runtime.getProperties', { objectId: listId, ownProperties: true });
  const { result: { objectId: markId } } = await client.send('Runtime.evaluate', { expression: 'window.__ai.mark' });
  const { internalProperties } = await client.send('Runtime.getProperties', { objectId: markId });
  const harness = internalProperties.find(p => p.name === '[[FunctionLocation]]').value.value.scriptId;
  const out = [];
  for (const prop of result) {
    if (!/^\d+$/.test(prop.name) || !prop.value?.objectId) continue;
    const ls = (await client.send('DOMDebugger.getEventListeners', { objectId: prop.value.objectId })).listeners
      .filter(l => l.scriptId !== harness);
    if (!ls.length) continue;
    const { result: { value: where } } = await client.send('Runtime.callFunctionOn', {
      objectId: prop.value.objectId,
      functionDeclaration: 'function () { return this === window ? "window" : this === document ? "document" : window.__aiPath(this); }',
      returnByValue: true
    });
    out.push({ element: where, events: [...new Set(ls.map(l => l.type))] });
  }
  await client.detach();
  return out;
}

async function media(page) {
  await page.evaluate(() => {
    for (const t of document.querySelectorAll('track')) if (t.track) t.track.mode = 'hidden';
  });
  await new Promise(r => setTimeout(r, 500));
  const items = await page.evaluate(() => [...document.querySelectorAll('audio, video, iframe, object, embed')].map(el => {
    const base = { element: window.__aiPath(el), tag: el.tagName.toLowerCase() };
    if (el.tagName === 'AUDIO' || el.tagName === 'VIDEO') {
      return {
        ...base,
        source: (el.currentSrc || el.getAttribute('src') || '').split('/').pop(),
        duration: isFinite(el.duration) ? Math.round(el.duration) + ' s' : 'unknown',
        controls: el.controls, autoplay: el.autoplay, loop: el.loop, muted: el.muted,
        playingAfterLoad: !el.paused,
        tracks: [...el.textTracks].map(t => ({
          kind: t.kind, language: t.language, label: t.label,
          cues: t.cues ? [...t.cues].map(c => c.text).join(' / ').slice(0, 400) : ''
        }))
      };
    }
    if (el.tagName === 'IFRAME') {
      let content = 'not readable (other origin)';
      try {
        const d = el.contentDocument;
        if (d) content = `title "${d.title}", text "${d.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 200)}"`;
      } catch (e) { /* cross-origin */ }
      return { ...base, title: el.getAttribute('title'), source: (el.getAttribute('src') || '').split('/').pop(), content };
    }
    return { ...base, outerHTML: el.outerHTML.slice(0, 300) };
  }));
  return items;
}

const focusInfo = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2]];
  const covered = points.map(([x, y]) => {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return 'outside viewport';
    const hit = document.elementFromPoint(x, y);
    return !hit || el.contains(hit) || hit.contains(el) ? null : window.__aiPath(hit);
  });
  const name = el.getAttribute('aria-label') || el.innerText || el.getAttribute('alt') || el.value || el.getAttribute('title') || '';
  return {
    element: window.__aiPath(el),
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') || '',
    tabindex: el.getAttribute('tabindex'),
    text: name.replace(/\s+/g, ' ').trim().slice(0, 60),
    rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
    outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
    boxShadow: cs.boxShadow,
    background: cs.backgroundColor,
    coveredAt: { centre: covered[0], corners: covered.slice(1) }
  };
};

async function tabSequence(page) {
  const stops = [];
  const images = [];
  let previous = null;
  for (let i = 1; i <= MAX_TAB; i++) {
    await act(page, `Tab ${i}`);
    await page.keyboard.press('Tab');
    await new Promise(r => setTimeout(r, 60));
    const info = await page.evaluate(focusInfo);
    const changes = await takeLog(page);
    if (!info) { stops.push({ press: i, focus: 'left the page or on body', changes }); break; }
    const repeat = previous === info.element;
    stops.push({ press: i, ...info, repeatsPrevious: repeat || undefined, changes: changes.length ? changes : undefined });
    if (images.length < TAB_IMAGES * 2 && !repeat) {
      const pad = 12;
      const sx = await page.evaluate(() => [scrollX, scrollY]);
      const clip = {
        x: Math.max(0, info.rect.x + sx[0] - pad), y: Math.max(0, info.rect.y + sx[1] - pad),
        width: Math.min(600, info.rect.width + pad * 2), height: Math.min(300, info.rect.height + pad * 2)
      };
      if (clip.width > 2 && clip.height > 2) {
        images.push({ label: `Tab stop ${i} with focus`, data: Buffer.from(await page.screenshot({ clip })).toString('base64') });
        await page.evaluate(() => { window.__aiRefocus = document.activeElement; document.activeElement.blur(); });
        images.push({ label: `Tab stop ${i} without focus`, data: Buffer.from(await page.screenshot({ clip })).toString('base64') });
        await page.evaluate(() => window.__aiRefocus.focus({ preventScroll: true }));
        await takeLog(page);
      }
    }
    if (repeat && stops.filter(s => s.repeatsPrevious).length >= 3) {
      stops.push({ note: 'Focus stayed on the same element for several presses. Stopped.' });
      break;
    }
    previous = info.element;
  }
  return { stops, images };
}

async function candidates(page, selector, max) {
  return page.evaluate((sel, max) => [...document.body.querySelectorAll(sel)]
    .map((el, index) => ({ el, index }))
    .filter(({ el }) => el.checkVisibility())
    .slice(0, max)
    .map(({ el, index }) => ({
      index,
      element: window.__aiPath(el),
      text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 60)
    })), selector, max);
}

async function nthHandle(page, selector, index) {
  return page.evaluateHandle((sel, i) => document.body.querySelectorAll(sel)[i], selector, index);
}

const CLICKABLE = 'a[href^="#"], a[href^="javascript"], a:not([href]), button, [role=button], [onclick], dt, select, input[type=button], [tabindex], canvas';

async function activation(browser, url, opts, clickTargets) {
  const results = [];
  const probe = await open(browser, url, opts);
  const selector = [CLICKABLE, ...clickTargets].join(', ');
  const list = await candidates(probe, selector, MAX_ACTIVATE);
  await probe.close();
  for (const c of list) {
    const r = { element: c.element, text: c.text };
    for (const how of ['Enter', 'Space', 'click']) {
      const page = await open(browser, url, { ...opts, before: p => p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]) });
      const el = await nthHandle(page, selector, c.index);
      const isSelect = await el.evaluate(e => e.tagName === 'SELECT');
      await act(page, how);
      if (how === 'click') {
        await el.click().catch(() => {});
      } else {
        await el.evaluate(e => e.focus());
        const focused = await page.evaluate(() => window.__aiPath(document.activeElement));
        if (focused !== c.element) r.notFocusable = true;
        await page.keyboard.press(isSelect && how === 'Enter' ? 'ArrowDown' : how === 'Space' ? 'Space' : 'Enter');
      }
      await new Promise(res => setTimeout(res, 400));
      const out = { changes: await takeLog(page) };
      out.focusAfter = await page.evaluate(() => window.__aiPath(document.activeElement));
      out.animations = await page.evaluate(() => document.getAnimations().map(a => ({
        type: a.constructor.name, element: window.__aiPath(a.effect && a.effect.target),
        duration: a.effect && a.effect.getTiming().duration, iterations: a.effect && (a.effect.getTiming().iterations === Infinity ? 'infinite' : a.effect.getTiming().iterations),
        properties: a.effect && a.effect.getKeyframes ? [...new Set(a.effect.getKeyframes().flatMap(k => Object.keys(k).filter(x => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))] : []
      })));
      if (!out.animations.length) delete out.animations;
      if (how === 'Enter' && out.changes.length) {
        const next = [];
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          next.push(await page.evaluate(() => document.activeElement === document.body ? 'body' : window.__aiPath(document.activeElement)));
        }
        out.nextTabStops = next;
      }
      r[how] = out;
      await page.close();
      // Escape straight after Enter, on a fresh page, so the Tab presses
      // above do not decide where focus ends up
      if (how === 'Enter' && out.changes.length) {
        const again = await open(browser, url, { ...opts, before: p => p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]) });
        const target = await nthHandle(again, selector, c.index);
        await target.evaluate(e => e.focus());
        await again.keyboard.press(isSelect ? 'ArrowDown' : 'Enter');
        await new Promise(res => setTimeout(res, 400));
        await takeLog(again);
        await act(again, 'Escape');
        await again.keyboard.press('Escape');
        await new Promise(res => setTimeout(res, 200));
        out.escapeAfterEnter = { changes: await takeLog(again), focus: await again.evaluate(() => window.__aiPath(document.activeElement)) };
        await again.close();
      }
    }
    results.push(r);
  }
  return results;
}

async function keys(browser, url, opts) {
  const page = await open(browser, url, opts);
  const out = [];
  for (const k of 'abcdefghijklmnopqrstuvwxyz') {
    await act(page, `key ${k}`);
    await page.keyboard.press(k);
    await new Promise(r => setTimeout(r, 30));
    const changes = await takeLog(page);
    if (changes.length) out.push({ key: k, changes });
  }
  await page.close();
  return out.length ? out : 'No key from a to z changed the page.';
}

async function pointer(browser, url, opts, pointerTargets) {
  const selector = ['button', 'a[href]', '[role=button]', 'canvas', 'li[draggable]', ...pointerTargets].join(', ');
  const probe = await open(browser, url, opts);
  const list = await candidates(probe, selector, MAX_ACTIVATE);
  await probe.close();
  const out = [];
  for (const c of list) {
    const r = { element: c.element, text: c.text };
    let page = await open(browser, url, opts);
    let el = await nthHandle(page, selector, c.index);
    const box = await el.boundingBox();
    if (!box) { await page.close(); continue; }
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await act(page, 'pointer down');
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await new Promise(res => setTimeout(res, 200));
    r.afterPointerDown = await takeLog(page);
    await act(page, 'move away and release');
    await page.mouse.move(cx + 300, cy + 300, { steps: 5 });
    await page.mouse.up();
    await new Promise(res => setTimeout(res, 200));
    r.afterMovingAwayAndReleasing = await takeLog(page);
    await page.close();

    page = await open(browser, url, { ...opts, viewport: { hasTouch: true } });
    el = await nthHandle(page, selector, c.index);
    await act(page, 'mouse click on a touch screen device');
    await el.click().catch(() => {});
    await new Promise(res => setTimeout(res, 200));
    r.mouseClickOnTouchDevice = await takeLog(page);
    await page.close();

    page = await open(browser, url, opts);
    el = await nthHandle(page, selector, c.index);
    await act(page, 'mouse click');
    await el.click().catch(() => {});
    await new Promise(res => setTimeout(res, 200));
    r.mouseClick = await takeLog(page);
    await page.close();
    out.push(r);
  }
  return out;
}

async function paste(browser, url, opts) {
  const page = await open(browser, url, opts);
  const out = await page.evaluate(() => [...document.querySelectorAll('input:not([type]), input[type=text], input[type=password], input[type=email], input[type=tel], textarea')].map(el => {
    el.focus();
    const dt = new DataTransfer();
    dt.setData('text/plain', 'pasted');
    const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
    return { element: window.__aiPath(el), type: el.type, pasteBlocked: ev.defaultPrevented };
  }));
  await page.close();
  return out.length ? out : 'No text fields.';
}

async function hoverFocus(browser, url, opts) {
  const page = await open(browser, url, opts);
  const visibleSet = () => page.evaluate(() => [...document.body.querySelectorAll('*')]
    .filter(e => e.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && e.getClientRects().length)
    .map(e => window.__aiPath(e)));
  const textOf = paths => page.evaluate(ps => ps.map(p => {
    const el = [...document.body.querySelectorAll('*')].find(e => window.__aiPath(e) === p);
    return el ? { element: p, text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 100) } : { element: p };
  }), paths);
  const list = await page.evaluate(max => [...document.body.querySelectorAll('main *, body > *:not(script)')]
    .filter(e => e.checkVisibility() && e.getClientRects().length && (e.children.length === 0 || e.matches('a, button, [title], [aria-describedby], [tabindex], label, span')))
    .slice(0, max).map(e => window.__aiPath(e)), MAX_HOVER);
  const out = [];
  const before = new Set(await visibleSet());
  for (const p of list) {
    const handle = await page.evaluateHandle(path => [...document.body.querySelectorAll('*')].find(e => window.__aiPath(e) === path), p);
    const box = await handle.boundingBox?.();
    if (!box) continue;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 3 });
    await new Promise(r => setTimeout(r, 120));
    const shown = (await visibleSet()).filter(x => !before.has(x) && !x.startsWith(p + ' >') && x !== p);
    const title = await handle.evaluate(e => e.getAttribute('title'));
    if (shown.length) {
      const top = shown.filter(x => !shown.some(y => y !== x && x.startsWith(y + ' >')));
      const r = { hovered: p, appeared: await textOf(top) };
      await page.keyboard.press('Escape');
      await new Promise(res => setTimeout(res, 100));
      r.stillVisibleAfterEscape = (await visibleSet()).some(x => top.includes(x));
      const target = await page.evaluateHandle(path => [...document.body.querySelectorAll('*')].find(e => window.__aiPath(e) === path), top[0]);
      const tbox = await target.boundingBox?.();
      if (tbox) {
        await page.mouse.move(tbox.x + tbox.width / 2, tbox.y + tbox.height / 2, { steps: 10 });
        await new Promise(res => setTimeout(res, 120));
        r.stillVisibleWhenPointerMovedOntoIt = (await visibleSet()).some(x => top.includes(x));
      } else {
        r.stillVisibleWhenPointerMovedOntoIt = 'not tested, content is no longer on the page';
      }
      out.push(r);
    } else if (title) {
      out.push({ hovered: p, titleAttribute: title, note: 'Browser tooltip from the title attribute.' });
    }
    await page.mouse.move(WIDTH - 5, HEIGHT - 5);
    await new Promise(r => setTimeout(r, 60));
  }
  // Focus: content that appears when an element gets keyboard focus
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    await new Promise(r => setTimeout(r, 80));
    const f = await page.evaluate(() => document.activeElement === document.body ? null : window.__aiPath(document.activeElement));
    if (!f) break;
    const shown = (await visibleSet()).filter(x => !before.has(x) && !x.startsWith(f + ' >') && x !== f);
    if (shown.length) {
      const top = shown.filter(x => !shown.some(y => y !== x && x.startsWith(y + ' >')));
      const r = { focused: f, appeared: await textOf(top) };
      await page.keyboard.press('Escape');
      await new Promise(res => setTimeout(res, 100));
      r.stillVisibleAfterEscape = (await visibleSet()).some(x => top.includes(x));
      out.push(r);
    }
  }
  await page.close();
  return out.length ? out : 'Nothing appeared on hover or focus.';
}

async function submitEmpty(browser, url, opts) {
  const probe = await open(browser, url, opts);
  const count = await probe.evaluate(() => document.forms.length);
  await probe.close();
  const out = [];
  for (let i = 0; i < Math.min(count, 3); i++) {
    const page = await open(browser, url, opts);
    await act(page, 'submit empty form');
    const how = await page.evaluate(n => {
      const f = document.forms[n];
      const btn = f.querySelector('button:not([type=button]), input[type=submit], input[type=image]');
      if (btn) { btn.click(); return 'clicked ' + window.__aiPath(btn); }
      f.requestSubmit(); return 'requestSubmit()';
    }, i);
    await new Promise(r => setTimeout(r, 400));
    out.push({
      form: await page.evaluate(n => window.__aiPath(document.forms[n]), i),
      how,
      changes: await takeLog(page),
      focusAfter: await page.evaluate(() => window.__aiPath(document.activeElement)),
      validationMessages: await page.evaluate(n => [...document.forms[n].elements].filter(e => e.validationMessage).map(e => ({ element: window.__aiPath(e), message: e.validationMessage })), i),
      liveRegions: await page.evaluate(() => [...document.querySelectorAll('[aria-live], [role=status], [role=alert], [role=log]')].map(e => ({ element: window.__aiPath(e), text: e.innerText.trim().slice(0, 100) })))
    });
    await page.close();
  }
  return out.length ? out : 'No forms.';
}

// Elements whose text is clipped or overlaps other text
function clipping() {
  const out = [];
  const els = [...document.body.querySelectorAll('*')].filter(e => e.checkVisibility() && e.getClientRects().length && !e.closest('[data-ai-harness]'));
  for (const el of els) {
    const cs = getComputedStyle(el);
    const clipsY = el.scrollHeight > el.clientHeight + 1 && cs.overflowY !== 'visible';
    const clipsX = el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible';
    const fixedOverflow = cs.overflowY === 'visible' && cs.height !== 'auto' && el.scrollHeight > el.getBoundingClientRect().height + 2 && el.innerText.trim();
    if (clipsY || clipsX) out.push({ element: window.__aiPath(el), problem: 'text is cut off (overflow ' + cs.overflow + ')' });
    else if (fixedOverflow) out.push({ element: window.__aiPath(el), problem: 'text spills out of a box with a fixed height' });
  }
  const texts = els.filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  for (let i = 0; i < texts.length && out.length < 30; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (texts[i].contains(texts[j]) || texts[j].contains(texts[i])) continue;
      const a = texts[i].getBoundingClientRect(), b = texts[j].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 4 && oy > 4) out.push({ element: window.__aiPath(texts[i]), problem: 'text overlaps ' + window.__aiPath(texts[j]) });
    }
  }
  return out.length ? out : 'No clipped or overlapping text found.';
}

const DOUBLE_TEXT = () => {
  const els = [...document.querySelectorAll('body, body *')];
  const sizes = els.map(e => parseFloat(getComputedStyle(e).fontSize));
  els.forEach((e, i) => e.style.setProperty('font-size', sizes[i] * 2 + 'px', 'important'));
};

const TEXT_SPACING = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
p { margin-bottom: 2em !important; }`;

// Evidence for one page, as a list of labelled text and image parts
async function pageEvidence(browser, url, isTestPage) {
  const opts = { isTestPage };
  const text = {};
  const images = [];

  // A probe that fails is reported as evidence, so one broken probe does not
  // stop the rest
  const guard = async (keys, fn) => {
    try { await fn(); } catch (e) {
      if (page && !page.isClosed()) await page.close().catch(() => {});
      for (const k of keys) if (!(k in text)) text[k] = `The harness could not collect this evidence (${e.message.split('\n')[0]}).`;
    }
  };
  let page = await open(browser, url, opts);
  const ser = await page.evaluate(serialise);
  text.dom = ser.html;
  const file = decodeURIComponent(new URL(url).pathname);
  text.source = blindSource(fs.readFileSync(file, 'utf8'), { classes: new Map(ser.classes), ids: new Map(ser.ids) }, isTestPage);
  const snapshot = await page.accessibility.snapshot({ interestingOnly: true });
  text.axtree = cleanTree(snapshot);
  text.styles = await page.evaluate(styles);
  text.listeners = await listeners(page);
  const clickTargets = [];
  const pointerTargets = [];
  for (const l of text.listeners) {
    if (l.element === 'window' || l.element === 'document') continue;
    if (l.events.some(e => ['click', 'keydown', 'keyup', 'focus', 'change'].includes(e))) clickTargets.push(l.element);
    if (l.events.some(e => /^(pointer|mouse|touch|drag)/.test(e))) pointerTargets.push(l.element);
  }
  await page.close();
  await guard(['media'], async () => { text.media = await (async () => {
    const p = await open(browser, url, opts);
    const m = await media(p);
    await p.close();
    return m.length ? m : 'No audio, video, frames or objects.';
  })(); });

  await guard(['screenshot'], async () => {
    page = await open(browser, url, opts);
    images.push({ label: 'screenshot (1280 by 800)', data: await shot(page) });
    await page.addStyleTag({ content: 'html { filter: grayscale(1) !important; }' });
    images.push({ label: 'grayscale', data: await shot(page) });
    await page.close();
  });

  // timeline: changes on their own for 3 seconds after load
  await guard(['timeline'], async () => {
    page = await open(browser, url, opts);
    await act(page, 'waiting 3 seconds without input');
    await new Promise(r => setTimeout(r, 3000));
    text.timeline = await takeLog(page);
    text.timeline.unshift({ note: 'The page was left alone for 3 seconds after load.' });
    text.timeline.push({ runningAnimations: await page.evaluate(() => document.getAnimations().map(a => ({ type: a.constructor.name, element: window.__aiPath(a.effect && a.effect.target), duration: a.effect && a.effect.getTiming().duration, iterations: a.effect && (a.effect.getTiming().iterations === Infinity ? 'infinite' : a.effect.getTiming().iterations) }))) });
    text.timeline.push({ animatedImages: await page.evaluate(() => [...document.images].filter(i => /\.gif$/i.test(i.src)).map(i => window.__aiPath(i) + ' (gif)')) });
    text.timeline.push({ animatedElements: await page.evaluate(() => [...document.querySelectorAll('blink, marquee')].map(e => window.__aiPath(e))) });
    await page.close();
  });

  await guard(['tab-sequence'], async () => {
    page = await open(browser, url, opts);
    const tabs = await tabSequence(page);
    text['tab-sequence'] = tabs.stops;
    images.push(...tabs.images);
    await page.close();
  });

  await guard(['activation'], async () => { text.activation = await activationByPath(browser, url, opts, clickTargets); });
  await guard(['keys'], async () => { text.keys = await keys(browser, url, opts); });
  await guard(['pointer'], async () => { text.pointer = await pointerByPath(browser, url, opts, pointerTargets); });
  await guard(['paste'], async () => { text.paste = await paste(browser, url, opts); });
  await guard(['hover-focus'], async () => { text['hover-focus'] = await hoverFocus(browser, url, opts); });
  await guard(['submit-empty'], async () => { text['submit-empty'] = await submitEmpty(browser, url, opts); });

  await guard(['zoom-320'], async () => {
    page = await open(browser, url, { ...opts, viewport: { width: 320, height: 640 } });
    text['zoom-320'] = await page.evaluate(() => ({ horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1, pageWidth: document.documentElement.scrollWidth }));
    images.push({ label: 'zoom-320 (320 CSS pixels wide)', data: await shot(page) });
    await page.close();
  });

  await guard(['text-200'], async () => {
    page = await open(browser, url, opts);
    await page.evaluate(DOUBLE_TEXT);
    text['text-200'] = await page.evaluate(clipping);
    images.push({ label: 'text-200 (all font sizes doubled)', data: await shot(page) });
    await page.close();
  });

  await guard(['text-spacing'], async () => {
    page = await open(browser, url, opts);
    await page.addStyleTag({ content: TEXT_SPACING });
    text['text-spacing'] = await page.evaluate(clipping);
    images.push({ label: 'text-spacing (WCAG 1.4.12 values applied)', data: await shot(page) });
    await page.close();
  });

  await guard(['orientation'], async () => {
    page = await open(browser, url, { ...opts, viewport: { width: 800, height: 1280, isLandscape: false } });
    images.push({ label: 'orientation: portrait (800 by 1280)', data: await shot(page) });
    await page.close();
    page = await open(browser, url, { ...opts, viewport: { width: 1280, height: 800, isLandscape: true } });
    images.push({ label: 'orientation: landscape (1280 by 800)', data: await shot(page) });
    await page.close();
  });

  await guard(['regions'], async () => {
    page = await open(browser, url, opts);
    text.regions = await page.evaluate(() => [...document.querySelectorAll('header, nav, footer, [role=banner], [role=navigation], [role=contentinfo], [role=search]')].map(e => ({
      element: window.__aiPath(e),
      links: [...e.querySelectorAll('a, button')].map(a => a.innerText.trim()).filter(Boolean)
    })));
    await page.close();
  });

  return { text, images };
}

// The probes need to find elements again on a fresh load. Listener paths are
// turned into selectors the probes can use.
function pathSelector(p) {
  return 'body > ' + p;
}

async function activationByPath(browser, url, opts, paths) {
  return activation(browser, url, opts, paths.map(pathSelector));
}

async function pointerByPath(browser, url, opts, paths) {
  return pointer(browser, url, opts, paths.map(pathSelector));
}

// The accessibility tree without internal ids and URLs (the URL has the
// file name, which names the test case)
function cleanTree(node) {
  if (!node) return node;
  const { backendNodeId, loaderId, url, children, ...rest } = node;
  if (children) rest.children = children.map(cleanTree);
  return rest;
}

// One line per item, so the evidence is compact but still readable
function format(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(v => JSON.stringify(v)).join('\n');
  return JSON.stringify(value);
}

function neutralise(s) {
  let out = s;
  LEAKY_NAMES.forEach((name, i) => {
    const ext = path.extname(name);
    const neutral = (name.endsWith('.html') ? 'page-' : 'media-') + (i + 1) + ext;
    out = out.split(name).join(neutral);
  });
  return out;
}

// Evidence for a test case: one or more pages. Returns content blocks for the
// Messages API and a hash input that changes when the evidence changes.
export async function collect(browser, urls) {
  const blocks = [];
  const pages = [];
  for (const [i, url] of urls.entries()) {
    const isTestPage = url.includes('/tests/') || url.includes('/controls/');
    const ev = await pageEvidence(browser, url, isTestPage);
    pages.push(ev);
    const label = urls.length > 1 ? `Page ${i + 1} of ${urls.length}` : 'The page';
    blocks.push({ type: 'text', text: `# ${label}` });
    for (const [key, value] of Object.entries(ev.text)) {
      const body = format(value);
      blocks.push({ type: 'text', text: neutralise(`## Evidence: ${key}\n\n${body}`) });
    }
    for (const img of ev.images) {
      blocks.push({ type: 'text', text: `## Image: ${img.label}` });
      blocks.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: img.data } });
    }
  }
  if (urls.length > 1) {
    blocks.push({ type: 'text', text: '## Evidence: multi-page\n\nThe pages above belong to the same site and the same test. Compare their regions, navigation and repeated components.' });
  }
  return blocks;
}

// Run on its own to look at the evidence for one page:
//   node scripts/ai-evidence.mjs tests/<file>.html
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  const browser = await launch();
  const blocks = await collect(browser, [new URL('file://' + path.resolve(target)).href]);
  await browser.close();
  for (const b of blocks) {
    if (b.type === 'text') console.log(b.text.length > 3000 ? b.text.slice(0, 3000) + '\n[...]' : b.text);
    else console.log(`[image, ${Math.round(b.source.data.length * 0.75 / 1024)} kB]`);
  }
}

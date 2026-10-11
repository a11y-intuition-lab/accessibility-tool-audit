// Text transforms for the blinded build (D-026): small, dependency-free tokenizers for HTML, CSS and JavaScript that
// rewrite references and rename class, id and data-ail-* names without touching anything else in the source.

import { randomBytes } from 'node:crypto';

export const hex = (n) => randomBytes(Math.ceil(n / 2)).toString('hex').slice(0, n);

// Consistent opaque names: one token per original name, across every file of the build.
export class NameMap {
  constructor(prefix) {
    this.prefix = prefix;
    this.map = new Map();
    this.used = new Set();
  }
  tok(name) {
    if (!name) return name;
    let t = this.map.get(name);
    if (!t) {
      do t = this.prefix + hex(6); while (this.used.has(t));
      this.used.add(t);
      this.map.set(name, t);
    }
    return t;
  }
  has(name) { return this.map.has(name); }
}

// Context shared by all transforms of one build.
//   names     NameMap for class names, ids and @keyframes names
//   attrs     NameMap for data-ail-* attribute names (tokens are used as data-<token>)
//   knownIds  every id value that occurs in the fixture HTML (pre-scan)
//   keyframes every @keyframes name in the fixture CSS (pre-scan)
//   warn(msg)
export const AIL_ATTR = /\bdata-ail-[\w-]+/g;
export const renameAttrName = (ctx, name) => (/^data-ail-/.test(name) ? 'data-' + ctx.attrs.tok(name) : name);
const renameList = (ctx, v) => v.replace(/\S+/g, (n) => ctx.names.tok(n));
const renameWhole = (ctx, v) => (v === '' ? v : ctx.names.tok(v));

// ---- CSS -----------------------------------------------------------------------------------------------------------

const IDENT = /^-?[_a-zA-Z][\w-]*/;

function endOfQuoted(s, i) {
  const q = s[i];
  let j = i + 1;
  while (j < s.length && s[j] !== q) j += s[j] === '\\' ? 2 : 1;
  return Math.min(j + 1, s.length);
}

export function stripCssComments(css) {
  let out = '';
  let i = 0;
  let removed = false;
  while (i < css.length) {
    const c = css[i];
    if (c === '"' || c === "'") {
      const j = endOfQuoted(css, i);
      out += css.slice(i, j);
      i = j;
    } else if (c === '/' && css[i + 1] === '*') {
      const j = css.indexOf('*/', i + 2);
      i = j < 0 ? css.length : j + 2;
      removed = true;
    } else {
      out += c;
      i++;
    }
  }
  if (!removed) return out;
  // Whitespace left behind by removed comments: drop blank-only lines and collapse runs of blank lines.
  return out.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
}

// Attribute selector "[name op value]" (possibly unterminated, as in a JS string fragment).
function renameAttrSelector(ctx, text) {
  const m = /^\[(\s*)([\w:-]+)(\s*)(?:([~|^$*]?=)(\s*)("[^"]*"?|'[^']*'?|[^\]\s'"]*))?([\s\S]*)$/.exec(text);
  if (!m) return text;
  let [, s1, name, s2, op, s3, value, rest] = m;
  const newName = renameAttrName(ctx, name);
  if (op && value) {
    const q = value[0] === '"' || value[0] === "'" ? value[0] : '';
    const closed = q && value.length > 1 && value.endsWith(q);
    const inner = q ? value.slice(1, closed ? -1 : undefined) : value;
    let v = inner;
    if (name === 'class' && (op === '~=' || op === '=')) v = renameList(ctx, inner);
    else if (name === 'id' && op === '=') v = renameWhole(ctx, inner);
    else if ((name === 'class' || name === 'id') && inner) ctx.warn(`attribute selector ${text} matches part of a ${name}; not renamed`);
    else if (/^data-ail-/.test(name) && ctx.knownIds.has(inner)) v = ctx.names.tok(inner);
    value = q + v + (closed ? q : '');
  }
  return `[${s1}${newName}${s2}${op ?? ''}${s3 ?? ''}${value ?? ''}${rest}`;
}

function closeBracket(s, i) {
  let j = i + 1;
  while (j < s.length && s[j] !== ']') j = s[j] === '"' || s[j] === "'" ? endOfQuoted(s, j) : j + 1;
  return Math.min(j + 1, s.length);
}

// Renames .class, #id and [attr] parts of a selector (or selector fragment from a JS string).
export function renameSelector(ctx, sel) {
  let out = '';
  let i = 0;
  while (i < sel.length) {
    const c = sel[i];
    if (c === '\\') {
      out += sel.slice(i, i + 2);
      i += 2;
    } else if (c === '"' || c === "'") {
      const j = endOfQuoted(sel, i);
      out += sel.slice(i, j);
      i = j;
    } else if (c === '[') {
      const j = closeBracket(sel, i);
      out += renameAttrSelector(ctx, sel.slice(i, j));
      i = j;
    } else if ((c === '.' || c === '#') && IDENT.test(sel.slice(i + 1))) {
      const name = IDENT.exec(sel.slice(i + 1))[0];
      out += c + ctx.names.tok(name);
      i += 1 + name.length;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

const URL_FN = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^'")\s]*))\s*\)/g;

// Declarations: url() references and animation names.
export function processDeclarations(ctx, decls, rewriteUrl) {
  let out = decls.replace(URL_FN, (all, d, s, u) => {
    const raw = d ?? s ?? u;
    if (raw.startsWith('#')) return all.replace(raw, '#' + ctx.names.tok(raw.slice(1)));
    const next = rewriteUrl(raw);
    return next === raw ? all : all.replace(raw, next);
  });
  out = out.replace(/(animation(?:-name)?\s*:\s*)([^;}]*)/g, (all, p, v) =>
    p + v.replace(/-?[_a-zA-Z][\w-]*/g, (n) => (ctx.keyframes.has(n) ? ctx.names.tok(n) : n)),
  );
  return out;
}

const GROUP_AT = /^@(media|supports|document|layer|container|-moz-document)\b/i;

export function processCss(ctx, cssIn, rewriteUrl) {
  const css = stripCssComments(cssIn);
  const stack = []; // 'group' | 'decl' | 'keyframes'
  let out = '';
  let seg = 0;
  let i = 0;
  const top = () => stack[stack.length - 1];
  while (i < css.length) {
    const c = css[i];
    if (c === '"' || c === "'") { i = endOfQuoted(css, i); continue; }
    if (c === 'u' || c === 'U') { // url(...) without quotes may contain characters like ; or {
      const m = /^url\(\s*[^'"\s)][^)]*\)/i.exec(css.slice(i, i + 4096));
      if (m && !/[\w-]/.test(css[i - 1] ?? '')) { i += m[0].length; continue; }
    }
    if (c === '{') {
      const prelude = css.slice(seg, i);
      const t = top();
      if (t === 'decl') {
        ctx.warn('nested block inside declarations; left unchanged');
        out += prelude;
        stack.push('decl');
      } else if (t === 'keyframes') {
        out += prelude;
        stack.push('decl');
      } else {
        const p = prelude.trim();
        if (p.startsWith('@')) {
          if (GROUP_AT.test(p)) { out += prelude; stack.push('group'); }
          else if (/^@(-webkit-|-moz-)?keyframes\b/i.test(p)) {
            out += prelude.replace(/(keyframes\s+)(-?[_a-zA-Z][\w-]*)/i, (a, k, n) => k + ctx.names.tok(n));
            stack.push('keyframes');
          } else { out += prelude; stack.push('decl'); }
        } else {
          out += renameSelector(ctx, prelude);
          stack.push('decl');
        }
      }
      out += '{';
      seg = i + 1;
    } else if (c === '}') {
      const body = css.slice(seg, i);
      out += top() === 'decl' ? processDeclarations(ctx, body, rewriteUrl) : body;
      stack.pop();
      out += '}';
      seg = i + 1;
    } else if (c === ';' && top() !== 'decl') {
      // statement at-rule such as @import
      out += processDeclarations(ctx, css.slice(seg, i + 1), rewriteUrl);
      seg = i + 1;
    }
    i++;
  }
  out += css.slice(seg);
  return out;
}

// ---- JavaScript ----------------------------------------------------------------------------------------------------

const REGEX_KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);

// Splits JavaScript into code, comment, string, template and regex tokens. Template literal substitutions are code.
export function tokenizeJs(src) {
  const toks = [];
  let i = 0;
  let codeStart = 0;
  let prev = null; // last significant token: { kind: 'punct'|'word'|'value', text }
  let depth = 0;
  const tplStack = [];
  const flush = (end) => { if (end > codeStart) toks.push({ type: 'code', text: src.slice(codeStart, end) }); };
  const push = (type, start, end) => { flush(start); toks.push({ type, text: src.slice(start, end) }); codeStart = end; };
  const readTemplate = (start) => { // from just after ` or }, until ` or ${
    let j = start;
    while (j < src.length) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '`') return { end: j + 1, open: false };
      if (src[j] === '$' && src[j + 1] === '{') return { end: j + 2, open: true };
      j++;
    }
    throw new Error('unterminated template literal');
  };
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      let j = src.indexOf('\n', i);
      if (j < 0) j = src.length;
      push('comment', i, j);
      i = j;
    } else if (c === '/' && n === '*') {
      const j = src.indexOf('*/', i + 2);
      if (j < 0) throw new Error('unterminated block comment');
      push('comment', i, j + 2);
      i = j + 2;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\n') throw new Error(`unterminated string at ${i}`);
        j += src[j] === '\\' ? 2 : 1;
      }
      push('string', i, j + 1);
      i = j + 1;
      prev = { kind: 'value' };
    } else if (c === '`' || (c === '}' && tplStack.length && tplStack[tplStack.length - 1] === depth)) {
      if (c === '}') tplStack.pop();
      const r = readTemplate(i + 1);
      push('template', i, r.end);
      if (r.open) tplStack.push(depth);
      i = r.end;
      prev = r.open ? { kind: 'punct', text: '${' } : { kind: 'value' };
    } else if (c === '/') {
      const regexOk = !prev || (prev.kind === 'punct' && !')]'.includes(prev.text)) || (prev.kind === 'word' && REGEX_KEYWORDS.has(prev.text));
      if (regexOk) {
        let j = i + 1;
        let cls = false;
        while (j < src.length) {
          const d = src[j];
          if (d === '\\') { j += 2; continue; }
          if (d === '\n') throw new Error(`unterminated regex at ${i}`);
          if (cls) { if (d === ']') cls = false; } else if (d === '[') cls = true; else if (d === '/') break;
          j++;
        }
        j++;
        while (j < src.length && /[a-z]/i.test(src[j])) j++;
        push('regex', i, j);
        i = j;
        prev = { kind: 'value' };
      } else {
        i++;
        prev = { kind: 'punct', text: '/' };
      }
    } else if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < src.length && /[\w$]/.test(src[j])) j++;
      prev = { kind: 'word', text: src.slice(i, j) };
      i = j;
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(n))) {
      let j = i + 1;
      while (j < src.length && /[\w.]/.test(src[j])) j++;
      prev = { kind: 'value' };
      i = j;
    } else if (/\s/.test(c)) {
      i++;
    } else {
      if (c === '{') depth++;
      else if (c === '}') depth--;
      prev = { kind: 'punct', text: c };
      i++;
    }
  }
  flush(src.length);
  return toks;
}

const SELECTOR_CALL = /(?:\$|jQuery|querySelector|querySelectorAll|closest|matches|webkitMatchesSelector|\.not|\.find|\.next|\.prev|\.is|\.filter|\.children|\.parents|\.parent|\.siblings|\.has|\.nextAll|\.prevAll|\.nextUntil|\.prevUntil|\.parentsUntil|\beach)\s*\(\s*$/;
const CLASS_CALL = /(?:addClass|removeClass|toggleClass|hasClass|classList\s*\.\s*(?:add|remove|toggle|contains|replace))\s*\(\s*(?:(['"])[^'"]*\1\s*,\s*)?$/;
const ID_CALL = /getElementById\s*\(\s*$/;
const CLASS_ASSIGN = /\bclassName\s*\+?=\s*$/;
const ID_ASSIGN = /\.id\s*=\s*$/;
const SET_ATTR = /(?:setAttribute|\.attr)\s*\(\s*(['"])([\w:-]+)\1\s*,\s*$/;
const IDREF_ATTRS = new Set(['for', 'headers', 'list', 'form', 'usemap', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-activedescendant', 'aria-details', 'aria-errormessage', 'aria-flowto']);
const PATH_LIKE = /^(?:\.{1,2}\/)*[\w-]+(?:\/[\w.-]+)*\.(?:html?|png|jpe?g|gif|svg|css|js|wav|webm|vtt|mp3|mp4|ogg|ogv)$/i;

// Strips comments (keeping line breaks, so automatic semicolon insertion is unchanged), renames class, id and
// data-ail-* names in selector strings and DOM API arguments, and rewrites asset paths in string literals.
export function processJs(ctx, src, rewritePath, { stripComments = true } = {}) {
  const toks = tokenizeJs(src);
  const multilineTemplate = toks.some((t) => t.type === 'template' && t.text.includes('\n'));
  let out = '';
  for (const t of toks) {
    if (t.type === 'comment') {
      if (!stripComments) out += t.text;
      else if (t.text.startsWith('//')) out += '';
      else out += t.text.includes('\n') ? '\n' : ' ';
      continue;
    }
    if (t.type !== 'string') { out += t.text; continue; }
    const q = t.text[0];
    let inner = t.text.slice(1, -1);
    const before = out.slice(-200);
    let m;
    if (SELECTOR_CALL.test(before)) inner = renameSelector(ctx, inner);
    else if (CLASS_CALL.test(before) || CLASS_ASSIGN.test(before)) inner = renameList(ctx, inner);
    else if (ID_CALL.test(before) || ID_ASSIGN.test(before)) inner = renameWhole(ctx, inner);
    else if ((m = SET_ATTR.exec(before))) {
      const a = m[2];
      if (a === 'class' || IDREF_ATTRS.has(a)) inner = renameList(ctx, inner);
      else if (a === 'id') inner = renameWhole(ctx, inner);
    } else if (/^\s*\[/.test(inner) || /\[data-ail-/.test(inner)) inner = renameSelector(ctx, inner); // selector fragment
    else if (PATH_LIKE.test(inner)) inner = rewritePath(inner);
    inner = inner.replace(AIL_ATTR, (a) => 'data-' + ctx.attrs.tok(a));
    out += q + inner + q;
  }
  if (stripComments && !multilineTemplate) {
    out = out.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
  }
  return out;
}

// String literals in processed JS that still name an original class or id: as a selector part (.name or #name) they
// are errors; a string that only equals a name (such as a window name) is a warning.
export function jsLeaks(ctx, src) {
  const originals = [...ctx.names.map.keys()];
  const leaks = [];
  const bare = [];
  for (const t of tokenizeJs(src)) {
    if (t.type !== 'string' && t.type !== 'template') continue;
    for (const o of originals) {
      const re = new RegExp(`(^|[^\\w-])([.#]?)${o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`);
      const mm = re.exec(t.text.slice(1, -1));
      if (mm && mm[2]) leaks.push(`${o} in ${t.text}`);
      else if (t.text.slice(1, -1) === o) bare.push(`${o} in ${t.text}`);
    }
    if (/data-ail-/.test(t.text)) leaks.push(`data-ail in ${t.text}`);
  }
  return { leaks, bare };
}

// ---- HTML ----------------------------------------------------------------------------------------------------------

const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp']);
const URL_ATTRS = new Set(['src', 'href', 'poster', 'data', 'action', 'formaction', 'background', 'cite', 'longdesc', 'xlink:href', 'manifest']);

// Parses the attributes of a start tag. Returns [{ name, valueStart, valueEnd, value }] with offsets into `tag`.
function parseAttrs(tag, from) {
  const attrs = [];
  let i = from;
  while (i < tag.length) {
    while (i < tag.length && /[\s/]/.test(tag[i])) i++;
    if (i >= tag.length || tag[i] === '>') break;
    const ns = i;
    while (i < tag.length && !/[\s/>=]/.test(tag[i])) i++;
    const name = tag.slice(ns, i).toLowerCase();
    let j = i;
    while (j < tag.length && /\s/.test(tag[j])) j++;
    if (tag[j] === '=') {
      j++;
      while (j < tag.length && /\s/.test(tag[j])) j++;
      let vs, ve;
      if (tag[j] === '"' || tag[j] === "'") {
        const q = tag[j];
        vs = j + 1;
        ve = tag.indexOf(q, vs);
        if (ve < 0) throw new Error(`unterminated attribute value in ${tag.slice(0, 80)}`);
        i = ve + 1;
      } else {
        vs = j;
        while (j < tag.length && !/[\s>]/.test(tag[j])) j++;
        ve = j;
        i = j;
      }
      attrs.push({ name, nameStart: ns, nameEnd: ns + name.length, valueStart: vs, valueEnd: ve, value: tag.slice(vs, ve) });
    } else {
      attrs.push({ name, nameStart: ns, nameEnd: ns + name.length, valueStart: null, valueEnd: null, value: null });
    }
  }
  return attrs;
}

function endOfTag(html, i) {
  let j = i;
  while (j < html.length && html[j] !== '>') j = html[j] === '"' || html[j] === "'" ? (html.indexOf(html[j], j + 1) < 0 ? html.length : html.indexOf(html[j], j + 1) + 1) : j + 1;
  return j + 1;
}

// opts: { rewriteUrl(raw) -> new raw, stripComments }
export function processHtml(ctx, html, opts) {
  let out = '';
  let i = 0;
  const rewriteFragment = (frag) => (ctx.knownIds.has(frag) ? ctx.names.tok(frag) : (frag && ctx.warn(`fragment #${frag} has no matching id; left unchanged`), frag));
  const rewriteUrlWithFragment = (raw) => {
    if (raw.startsWith('#')) return raw.length > 1 ? '#' + rewriteFragment(raw.slice(1)) : raw;
    const h = raw.indexOf('#');
    if (h < 0) return opts.rewriteUrl(raw);
    const base = opts.rewriteUrl(raw.slice(0, h));
    const frag = raw.slice(h + 1);
    return base + '#' + (frag ? rewriteFragment(frag) : '');
  };
  const transformAttr = (tagName, a, attrs) => {
    const { name, value } = a;
    if (value === null) return value;
    if (name === 'class') return renameList(ctx, value);
    if (name === 'id') return renameWhole(ctx, value);
    if (IDREF_ATTRS.has(name)) {
      if (name === 'usemap') return value.startsWith('#') ? '#' + renameWhole(ctx, value.slice(1)) : value;
      return renameList(ctx, value);
    }
    if (tagName === 'map' && name === 'name') return renameWhole(ctx, value);
    if (/^data-ail-/.test(name)) return ctx.knownIds.has(value) ? ctx.names.tok(value) : value;
    if (name === 'style') return processDeclarations(ctx, value, opts.rewriteUrl);
    if (/^on/.test(name)) return processJs(ctx, value, opts.rewriteUrl, { stripComments: false });
    if (URL_ATTRS.has(name)) return rewriteUrlWithFragment(value);
    if (name === 'srcset') {
      return value.replace(/(^|,)(\s*)(\S+)/g, (all, c, s, u) => c + s + opts.rewriteUrl(u));
    }
    if (name === 'content' && tagName === 'meta') {
      const he = attrs.find((x) => x.name === 'http-equiv');
      if (he && /^refresh$/i.test(he.value)) {
        return value.replace(/^(\s*\d+(?:\.\d+)?\s*[;,]\s*(?:url\s*=\s*)?['"]?)([^'"]*?)(['"]?\s*)$/i, (all, p, u, s) => p + rewriteUrlWithFragment(u) + s);
      }
    }
    if (/url\(\s*['"]?#/.test(value)) return value.replace(/url\(\s*(['"]?)#([^'")]+)\1\s*\)/g, (all, q, id) => `url(${q}#${ctx.names.tok(id)}${q})`);
    return value;
  };
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const j = html.indexOf('-->', i + 4);
      const end = j < 0 ? html.length : j + 3;
      if (!opts.stripComments) out += html.slice(i, end);
      i = end;
      continue;
    }
    if (html[i] === '<' && /[a-zA-Z]/.test(html[i + 1] ?? '')) {
      const end = endOfTag(html, i);
      const tag = html.slice(i, end);
      const tagName = /^<([a-zA-Z][\w:-]*)/.exec(tag)[1].toLowerCase();
      const attrs = parseAttrs(tag, 1 + tagName.length);
      let newTag = tag;
      for (const a of [...attrs].reverse()) {
        const nv = transformAttr(tagName, a, attrs);
        if (a.value !== null && nv !== a.value) newTag = newTag.slice(0, a.valueStart) + nv + newTag.slice(a.valueEnd);
        const nn = renameAttrName(ctx, tag.slice(a.nameStart, a.nameEnd));
        if (nn !== tag.slice(a.nameStart, a.nameEnd)) newTag = newTag.slice(0, a.nameStart) + nn + newTag.slice(a.nameEnd);
      }
      out += newTag;
      i = end;
      if (RAW_TEXT.has(tagName) && !tag.endsWith('/>')) {
        const close = html.toLowerCase().indexOf('</' + tagName, i);
        const stop = close < 0 ? html.length : close;
        let body = html.slice(i, stop);
        if (tagName === 'style') body = processCss(ctx, body, opts.rewriteUrl);
        else if (tagName === 'script' && body.trim()) {
          const type = attrs.find((x) => x.name === 'type')?.value;
          if (!type || /javascript|module/i.test(type)) body = processJs(ctx, body, opts.rewriteUrl, { stripComments: opts.stripComments });
        }
        out += body;
        i = stop;
      }
      continue;
    }
    out += html[i];
    i++;
  }
  return out;
}

// Every id value in an HTML document (for the pre-scan).
export function collectIds(html) {
  const ids = new Set();
  for (const m of html.matchAll(/<[a-zA-Z][^>]*>/g)) {
    for (const a of parseAttrs(m[0], 1)) if (a.name === 'id' && a.value) ids.add(a.value);
  }
  return ids;
}

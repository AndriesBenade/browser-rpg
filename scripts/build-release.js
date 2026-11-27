#!/usr/bin/env node
/**
 * Builds a compressed release copy of the game in dist/:
 *   dist/index.html   the engine with its script and styles minified (esbuild) and the markup
 *                     stripped of comments and redundant whitespace
 *   dist/content/     every JSON and SVG content file, minified
 *
 * Modes:
 *   npm run build        Standalone release (keeps offline file:// EMBEDDED_CONTENT + server.py,
 *                        and runs all 6 campaign & systems test suites against dist/index.html)
 *   npm run build:web    Hosted Cloudflare Workers Static Assets build (--web): strips the
 *                        file://-only EMBEDDED_CONTENT blob (~262 KB uncompressible base64),
 *                        omits server.py, and writes Cloudflare _headers for edge caching & security
 *
 * index.html stays the source: edit it, never dist/ (dist/ is not committed).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const WEB_MODE = process.argv.includes('--web');

let esbuild;
try {
  esbuild = require('esbuild');
} catch (e) {
  console.error('esbuild is not installed. Run `npm install` once, then `npm run build`.');
  process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;
const br = (buf) => zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

function minifyInlineStyles(html) {
  return html.replace(/style="([^"]*)"/g, (_, st) =>
    `style="${st.replace(/\s*:\s*/g, ':').replace(/\s*;\s*/g, ';').replace(/;+$/, '').replace(/\s{2,}/g, ' ').trim()}"`
  );
}

function minifyMarkup(html, { stripNoCacheMeta = false } = {}) {
  let out = html.replace(/<!--[\s\S]*?-->/g, '');
  if (stripNoCacheMeta) {
    out = out
      .replace(/<meta\s+http-equiv="(?:Cache-Control|Pragma|Expires)"[^>]*>/gi, '');
  }
  out = out
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/>\n</g, '><');
  return minifyInlineStyles(out);
}

/**
 * Safely collapses redundant indentation, inter-tag whitespace, and inline style spacing
 * inside multi-line HTML template literals in JS while preserving regex literals, quoted
 * strings, comments, nested ${...} expressions, and <pre>/<textarea> whitespace.
 */
function minifyHtmlTemplatesInJs(code) {
  const len = code.length;
  let i = 0;
  let out = '';
  let lastNonWs = '';
  let lastWord = '';

  const regexPrevTokens = new Set(['', '(', '[', '{', ',', ';', ':', '=', '!', '?', '&', '|', '^', '~', '+', '-', '*', '%', '<', '>']);
  const regexPrevWords = new Set(['return', 'case', 'throw', 'in', 'of', 'typeof', 'void', 'delete', 'new', 'await', 'yield', 'else', 'do']);
  const isIdentChar = (c) => /[a-zA-Z0-9_$]/.test(c);

  const readQuote = (q) => {
    let s = q; i++;
    while (i < len) {
      const c = code[i];
      if (c === '\\') { s += code.slice(i, i + 2); i += 2; continue; }
      s += c; i++;
      if (c === q) break;
    }
    return s;
  };

  const readRegex = () => {
    let s = '/'; i++;
    let inClass = false;
    while (i < len) {
      const c = code[i];
      if (c === '\\') { s += code.slice(i, i + 2); i += 2; continue; }
      if (c === '[') inClass = true;
      else if (c === ']') inClass = false;
      s += c; i++;
      if (c === '/' && !inClass) {
        while (i < len && /[a-z]/i.test(code[i])) { s += code[i]; i++; }
        break;
      }
    }
    return s;
  };

  const collapseHtmlChunk = (chunk, isFirst, isLast) => {
    let v = chunk
      .replace(/\r?\n[ \t]+/g, ' ')
      .replace(/\r?\n/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ');
    v = minifyInlineStyles(v);
    if (isFirst) v = v.replace(/^\s+(?=<)/, '');
    if (isLast) v = v.replace(/>\s+$/, '>');
    return v;
  };

  const readTemplate = () => {
    const parts = [];
    let buf = '';
    while (i < len) {
      const c = code[i];
      if (c === '\\') { buf += code.slice(i, i + 2); i += 2; continue; }
      if (c === '`') { i++; break; }
      if (c === '$' && code[i + 1] === '{') {
        parts.push({ t: 's', v: buf });
        buf = '';
        i += 2;
        parts.push({ t: 'e', v: readExprUntilCloseBrace() });
        continue;
      }
      buf += c; i++;
    }
    parts.push({ t: 's', v: buf });

    const joinedStatic = parts.filter(p => p.t === 's').map(p => p.v).join('');
    const hasHtml = /<(?:div|span|button|option|select|table|tr|td|th|h[1-6]|p|ul|li|strong|em|small|label|input|textarea|section|article|header|footer|nav|details|summary|svg|g|path|circle|rect|text|line|br|hr|a)\b/i.test(joinedStatic);
    const hasPre = /<pre\b|<textarea\b|white-space\s*:\s*pre/i.test(joinedStatic);
    const doCollapse = hasHtml && !hasPre && joinedStatic.includes('\n');

    return parts.map((p, idx) => {
      if (p.t === 'e') return '${' + p.v + '}';
      return doCollapse ? collapseHtmlChunk(p.v, idx === 0, idx === parts.length - 1) : p.v;
    }).join('');
  };

  const readExprUntilCloseBrace = () => {
    let depth = 1;
    let res = '';
    let prevTok = '{';
    let prevWord = '';
    while (i < len && depth > 0) {
      const c = code[i];
      if (c === '"' || c === "'") { res += readQuote(c); prevTok = '"'; prevWord = ''; continue; }
      if (c === '`') { i++; res += '`' + readTemplate() + '`'; prevTok = '`'; prevWord = ''; continue; }
      if (c === '/' && code[i + 1] === '/') {
        while (i < len && code[i] !== '\n') { res += code[i]; i++; }
        continue;
      }
      if (c === '/' && code[i + 1] === '*') {
        res += '/*'; i += 2;
        while (i < len && !(code[i] === '*' && code[i + 1] === '/')) { res += code[i]; i++; }
        if (i < len) { res += '*/'; i += 2; }
        continue;
      }
      if (c === '/' && (regexPrevTokens.has(prevTok) || regexPrevWords.has(prevWord))) {
        res += readRegex(); prevTok = '/'; prevWord = ''; continue;
      }
      if (c === '{') { depth++; res += c; prevTok = c; prevWord = ''; i++; continue; }
      if (c === '}') {
        depth--;
        if (depth === 0) { i++; break; }
        res += c; prevTok = c; prevWord = ''; i++; continue;
      }
      if (isIdentChar(c)) {
        let w = '';
        while (i < len && isIdentChar(code[i])) { w += code[i]; i++; }
        res += w; prevTok = 'w'; prevWord = w; continue;
      }
      if (!/\s/.test(c)) { prevTok = c; prevWord = ''; }
      res += c; i++;
    }
    return res;
  };

  while (i < len) {
    const c = code[i];
    if (c === '"' || c === "'") { out += readQuote(c); lastNonWs = '"'; lastWord = ''; continue; }
    if (c === '`') { i++; out += '`' + readTemplate() + '`'; lastNonWs = '`'; lastWord = ''; continue; }
    if (c === '/' && code[i + 1] === '/') {
      while (i < len && code[i] !== '\n') { out += code[i]; i++; }
      continue;
    }
    if (c === '/' && code[i + 1] === '*') {
      out += '/*'; i += 2;
      while (i < len && !(code[i] === '*' && code[i + 1] === '/')) { out += code[i]; i++; }
      if (i < len) { out += '*/'; i += 2; }
      continue;
    }
    if (c === '/' && (regexPrevTokens.has(lastNonWs) || regexPrevWords.has(lastWord))) {
      out += readRegex(); lastNonWs = '/'; lastWord = ''; continue;
    }
    if (isIdentChar(c)) {
      let w = '';
      while (i < len && isIdentChar(code[i])) { w += code[i]; i++; }
      out += w; lastNonWs = 'w'; lastWord = w; continue;
    }
    if (!/\s/.test(c)) { lastNonWs = c; lastWord = ''; }
    out += c; i++;
  }
  return out;
}

function buildHtml(src, { webMode = false } = {}) {
  const styleOpen = src.indexOf('<style>');
  const styleClose = src.indexOf('</style>', styleOpen);
  const scriptOpen = src.indexOf('<script>');
  const scriptClose = src.lastIndexOf('</script>');
  if (styleOpen < 0 || styleClose < 0 || scriptOpen < 0 || scriptClose < 0 || !(styleClose < scriptOpen)) {
    throw new Error('index.html layout changed: expected one <style> block followed by one <script> block.');
  }
  const css = src.slice(styleOpen + 7, styleClose);
  let js = src.slice(scriptOpen + 8, scriptClose);
  if (webMode) {
    // Hosted web builds serve /content/* directly over HTTP/2 + Brotli from Cloudflare's edge CDN,
    // so stripping the file://-only EMBEDDED_CONTENT base64 payload saves ~262 KB (~200 KB gzipped)
    // on every initial page load while index.html in source stays 100% offline file:// capable.
    js = js.replace(
      /(\/\/ @embedded-content[^\n]*\r?\n\s*return\s*)"[^"]*";/,
      '$1"";'
    );
  }
  js = minifyHtmlTemplatesInJs(js);
  const cssMin = esbuild.transformSync(css, { loader: 'css', minify: true }).code.trim();
  // Classic script (no format): esbuild keeps top-level names, so inline onclick="window.engine..."
  // handlers and the test sandbox (which looks up GreekMythologyEngine) keep working.
  const jsMin = esbuild.transformSync(js, { loader: 'js', minify: true, target: 'es2022', legalComments: 'none', pure: ['console.log'] }).code.trim();
  if (/<\/script/i.test(jsMin)) throw new Error('Minified script contains "</script": refusing to inline it.');
  return minifyMarkup(src.slice(0, styleOpen), { stripNoCacheMeta: webMode }) + '\n<style>' + cssMin + '</style>\n'
    + minifyMarkup(src.slice(styleClose + 8, scriptOpen)) + '\n<script>' + jsMin + '</script>\n'
    + minifyMarkup(src.slice(scriptClose + 9)) + '\n';
}

function minifySvg(svgStr) {
  return svgStr
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\/>/g, '/>')
    .replace(/(\d)\.0+(?=[\s,"'])/g, '$1')
    .trim();
}

function copyContent(dir, rel = 'content') {
  let before = 0, after = 0, count = 0;
  for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
    const r = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      if (r === path.join('content', 'campaigns', 'fixtures')) continue; // test-only fixtures
      const sub = copyContent(dir, r);
      before += sub.before; after += sub.after; count += sub.count;
    } else if (entry.name.endsWith('.json')) {
      const raw = fs.readFileSync(path.join(ROOT, r));
      const min = Buffer.from(JSON.stringify(JSON.parse(raw.toString('utf8'))));
      fs.mkdirSync(path.join(dir, rel), { recursive: true });
      fs.writeFileSync(path.join(dir, r), min);
      before += raw.length; after += min.length; count++;
    } else if (entry.name.endsWith('.svg')) {
      const raw = fs.readFileSync(path.join(ROOT, r));
      const min = Buffer.from(minifySvg(raw.toString('utf8')), 'utf8');
      fs.mkdirSync(path.join(dir, rel), { recursive: true });
      fs.writeFileSync(path.join(dir, r), min);
      before += raw.length; after += min.length; count++;
    }
  }
  return { before, after, count };
}

const CLOUDFLARE_HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/
  Cache-Control: public, max-age=0, must-revalidate

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/content/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=604800
`;

function main() {
  const srcBuf = fs.readFileSync(path.join(ROOT, 'index.html'));
  const out = Buffer.from(buildHtml(srcBuf.toString('utf8'), { webMode: WEB_MODE }));
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, 'index.html'), out);
  const content = copyContent(DIST);

  if (WEB_MODE) {
    fs.writeFileSync(path.join(DIST, '_headers'), CLOUDFLARE_HEADERS);
    fs.writeFileSync(path.join(DIST, '.assetsignore'), 'server.py\n');
  } else {
    fs.copyFileSync(path.join(ROOT, 'server.py'), path.join(DIST, 'server.py'));
    fs.writeFileSync(path.join(DIST, '.assetsignore'), 'server.py\n');
  }

  console.log(`Release build written to dist/ (${WEB_MODE ? 'hosted web mode' : 'standalone offline mode'})`);
  console.log(`  index.html : ${kb(srcBuf.length)} -> ${kb(out.length)} (${Math.round(100 - out.length / srcBuf.length * 100)}% smaller); gzip ${kb(gz(srcBuf))} -> ${kb(gz(out))}; brotli ${kb(br(out))}`);
  console.log(`  content/   : ${content.count} JSON/SVG files, ${kb(content.before)} -> ${kb(content.after)}`);
  if (WEB_MODE) console.log('  _headers   : written for Cloudflare Workers Static Assets (caching + security headers)');

  if (process.argv.includes('--check')) {
    // Run campaign & systems suites against the built engine (the harness reads ENGINE_HTML).
    const { spawnSync } = require('child_process');
    const suites = [
      'tests/behaviour_tests.js',
      'tests/tutorial_campaign_tests.js',
      'tests/northern_realms_tests.js',
      'tests/multi_enemy_combat_tests.js',
      'tests/phase2_systems_tests.js',
      'tests/global_magic_morality_tests.js',
      'tests/ashen_ledger_tests.js',
      'tests/vermin_black_tests.js'
    ];
    for (const suite of suites) {
      const r = spawnSync(process.execPath, [path.join(ROOT, suite)], { cwd: ROOT, env: Object.assign({}, process.env, { ENGINE_HTML: 'dist/index.html' }), encoding: 'utf8' });
      const summary = ((r.stdout || '').match(/(SUMMARY|RESULTS|ALL .* PASSED):? .*/) || ['ok'])[0];
      console.log(`  check      : ${suite} on dist/index.html -> ${summary}`);
      if (r.status !== 0) { process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(1); }
    }
  }
}

main();

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

function minifyMarkup(html, { stripNoCacheMeta = false } = {}) {
  let out = html.replace(/<!--[\s\S]*?-->/g, '');
  if (stripNoCacheMeta) {
    out = out
      .replace(/<meta\s+http-equiv="(?:Cache-Control|Pragma|Expires)"[^>]*>/gi, '');
  }
  return out
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/>\n</g, '><');
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
  const cssMin = esbuild.transformSync(css, { loader: 'css', minify: true }).code.trim();
  // Classic script (no format): esbuild keeps top-level names, so inline onclick="window.engine..."
  // handlers and the test sandbox (which looks up GreekMythologyEngine) keep working.
  const jsMin = esbuild.transformSync(js, { loader: 'js', minify: true, target: 'es2020', legalComments: 'none' }).code.trim();
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
  Cache-Control: public, max-age=300, stale-while-revalidate=86400
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
      'tests/phase2_systems_tests.js',
      'tests/global_magic_morality_tests.js',
      'tests/ashen_ledger_tests.js'
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

#!/usr/bin/env node
/**
 * Builds a compressed release copy of the game in dist/:
 *   dist/index.html   the engine with its script and styles minified (esbuild) and the markup
 *                     stripped of comments and indentation; it still contains the embedded content,
 *                     so it runs on its own from file:// as well as from a web server
 *   dist/content/     every JSON content file, minified
 *   dist/server.py    the local no-cache server
 *
 *   npm install          # once: installs esbuild (devDependency)
 *   npm run build        # writes dist/ and prints the sizes
 *                        (and runs the behaviour + Dev campaign test suites against dist/index.html)
 *
 * index.html stays the source: edit it, never dist/ (dist/ is not committed).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

let esbuild;
try {
  esbuild = require('esbuild');
} catch (e) {
  console.error('esbuild is not installed. Run `npm install` once, then `npm run build`.');
  process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

function minifyMarkup(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

function buildHtml(src) {
  const styleOpen = src.indexOf('<style>');
  const styleClose = src.indexOf('</style>', styleOpen);
  const scriptOpen = src.indexOf('<script>');
  const scriptClose = src.lastIndexOf('</script>');
  if (styleOpen < 0 || styleClose < 0 || scriptOpen < 0 || scriptClose < 0 || !(styleClose < scriptOpen)) {
    throw new Error('index.html layout changed: expected one <style> block followed by one <script> block.');
  }
  const css = src.slice(styleOpen + 7, styleClose);
  const js = src.slice(scriptOpen + 8, scriptClose);
  const cssMin = esbuild.transformSync(css, { loader: 'css', minify: true }).code.trim();
  // Classic script (no format): esbuild keeps top-level names, so inline onclick="window.engine..."
  // handlers and the test sandbox (which looks up GreekMythologyEngine) keep working.
  const jsMin = esbuild.transformSync(js, { loader: 'js', minify: true, target: 'es2020', legalComments: 'none' }).code.trim();
  if (/<\/script/i.test(jsMin)) throw new Error('Minified script contains "</script": refusing to inline it.');
  return minifyMarkup(src.slice(0, styleOpen)) + '\n<style>' + cssMin + '</style>\n'
    + minifyMarkup(src.slice(styleClose + 8, scriptOpen)) + '\n<script>' + jsMin + '</script>\n'
    + minifyMarkup(src.slice(scriptClose + 9)) + '\n';
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
    }
  }
  return { before, after, count };
}

function main() {
  const srcBuf = fs.readFileSync(path.join(ROOT, 'index.html'));
  const out = Buffer.from(buildHtml(srcBuf.toString('utf8')));
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, 'index.html'), out);
  const content = copyContent(DIST);
  fs.copyFileSync(path.join(ROOT, 'server.py'), path.join(DIST, 'server.py'));

  console.log('Release build written to dist/');
  console.log(`  index.html : ${kb(srcBuf.length)} -> ${kb(out.length)} (${Math.round(100 - out.length / srcBuf.length * 100)}% smaller); gzipped ${kb(gz(srcBuf))} -> ${kb(gz(out))}`);
  console.log(`  content/   : ${content.count} JSON files, ${kb(content.before)} -> ${kb(content.after)}`);

  if (process.argv.includes('--check')) {
    // Run the behaviour and Dev campaign suites against the built engine (the harness reads ENGINE_HTML).
    const { spawnSync } = require('child_process');
    for (const suite of ['tests/behaviour_tests.js', 'tests/dev_campaign_tests.js']) {
      const r = spawnSync(process.execPath, [path.join(ROOT, suite)], { cwd: ROOT, env: Object.assign({}, process.env, { ENGINE_HTML: 'dist/index.html' }), encoding: 'utf8' });
      const summary = ((r.stdout || '').match(/SUMMARY: .*/) || ['no summary'])[0];
      console.log(`  check      : ${suite} on dist/index.html -> ${summary}`);
      if (r.status !== 0) { process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(1); }
    }
  }
}

main();

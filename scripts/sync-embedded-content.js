#!/usr/bin/env node
/**
 * Regenerates the content embedded in index.html (`GreekMythologyEngine.EMBEDDED_CONTENT`), which the
 * engine uses when the game is opened from file:// and fetch is blocked. Every JSON file that the two
 * built-in campaigns reference (their campaign.json and every module path in it) is packed as
 * { path: json }, deflate-compressed and base64-encoded.
 *
 *   node scripts/sync-embedded-content.js          # rewrite index.html
 *   node scripts/sync-embedded-content.js --check  # exit 1 if index.html is out of date
 *
 * Run it after editing any campaign JSON file (`npm run sync:embedded`). `npm test` fails while the
 * embedded copy differs from the files. The check compares decoded JSON, not compressed bytes, so a
 * different zlib version never reports a false difference. No dependencies.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const MANIFESTS = ['content/campaigns/greek_mythology/campaign.json', 'content/campaigns/dev_test_campaign/campaign.json'];
const MARK = '// @embedded-content';
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

/** { path: json } for every file the built-in campaigns use. */
function buildFiles() {
  const files = {};
  for (const manifestPath of MANIFESTS) {
    const manifest = readJson(manifestPath);
    files[manifestPath] = manifest;
    for (const value of Object.values(manifest.modules || {})) {
      [].concat(value).forEach(rel => {
        if (typeof rel !== 'string') return;
        if (!fs.existsSync(path.join(ROOT, rel))) throw new Error(`${manifestPath} lists a module that does not exist: ${rel}`);
        files[rel] = readJson(rel);
      });
    }
  }
  return files;
}

/** ASCII-only JSON (the engine's decoder maps bytes straight to characters). */
const asciiJson = (obj) => JSON.stringify(obj).replace(/[\u0080-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const pack = (files) => zlib.deflateRawSync(Buffer.from(asciiJson(files), 'latin1'), { level: 9 }).toString('base64');
const unpack = (b64) => JSON.parse(zlib.inflateRawSync(Buffer.from(b64, 'base64')).toString('latin1'));

function locate(html) {
  const at = html.indexOf(MARK);
  if (at === -1) throw new Error('@embedded-content marker not found in index.html');
  const lineStart = html.indexOf('\n', at) + 1;
  const lineEnd = html.indexOf('\n', lineStart);
  const m = html.slice(lineStart, lineEnd).match(/return "([A-Za-z0-9+/=]*)";/);
  if (!m) throw new Error('The line after @embedded-content must be: return "<base64>";');
  return { lineStart, lineEnd, packed: m[1] };
}

/** The embedded files currently in index.html. */
function readEmbedded(html = fs.readFileSync(HTML, 'utf8')) {
  const { packed } = locate(html);
  return packed ? unpack(packed) : {};
}

function build(html, files = buildFiles()) {
  const { lineStart, lineEnd } = locate(html);
  return html.slice(0, lineStart) + `        return "${pack(files)}";` + html.slice(lineEnd);
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

if (require.main === module) {
  const html = fs.readFileSync(HTML, 'utf8');
  const files = buildFiles();
  const current = readEmbedded(html);
  if (process.argv.includes('--check')) {
    if (!same(current, files)) {
      const changed = [...new Set([...Object.keys(files), ...Object.keys(current)])].filter(k => !same(files[k], current[k]));
      console.error(`index.html embedded content is out of date (${changed.join(', ')}). Run: npm run sync:embedded`);
      process.exit(1);
    }
    console.log(`Embedded content is in sync with the JSON files (${Object.keys(files).length} files).`);
  } else if (!same(current, files)) {
    fs.writeFileSync(HTML, build(html, files));
    const { packed } = locate(fs.readFileSync(HTML, 'utf8'));
    console.log(`index.html: embedded content regenerated (${Object.keys(files).length} files, ${packed.length} base64 chars).`);
  } else {
    console.log('index.html: embedded content already up to date.');
  }
}

module.exports = { buildFiles, readEmbedded, build, pack, unpack, MANIFESTS };

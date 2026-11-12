#!/usr/bin/env node
/**
 * Regenerates the embedded copy of the Developer campaign inside index.html
 * (`GreekMythologyEngine.EMBEDDED_DEV_CAMPAIGN`, used when the game is opened from file:// and
 * fetch is blocked) from content/campaigns/dev_test_campaign/ (campaign.json and every module it lists).
 *
 *   node scripts/sync-embedded-dev-content.js          # rewrite index.html
 *   node scripts/sync-embedded-dev-content.js --check  # exit 1 if index.html is out of date
 *
 * Run it after editing any Dev campaign JSON file. `npm test` fails while the two differ.
 * No dependencies.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const MANIFEST_PATH = 'content/campaigns/dev_test_campaign/campaign.json';
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

// module key -> key inside the JSON file (mirrors fetchModularCampaignData in index.html)
const SINGLE = {
  locations: 'locations', characters: 'characters', creatures: 'creatures', items: 'items',
  lootTables: 'lootTables', interactiveObjects: 'interactiveObjects', factions: 'factions',
  events: 'events', professions: 'professions', materials: 'materials', craftingTemplates: 'templates',
  puzzles: 'puzzles', deities: 'deities', mythology: 'loreEntries', glossary: 'glossary', quests: 'quests'
};
// Catalogs that may be one path or a list of paths, merged by id (like fetchCatalog).
const CATALOGS = ['classes', 'backgrounds', 'origins', 'traits'];

function buildEmbedded() {
  const manifest = readJson(MANIFEST_PATH);
  const modules = manifest.modules || {};
  const data = {};
  for (const [key, prop] of Object.entries(SINGLE)) {
    data[key] = modules[key] ? (readJson(modules[key])[prop] || []) : [];
  }
  const enc = modules.encounters ? readJson(modules.encounters) : {};
  data.encounters = enc.encounters || [];
  data.randomEncounters = enc.randomEncounters || [];
  data.dialogues = modules.dialogues ? (readJson(modules.dialogues).dialogues || {}) : {};
  for (const key of CATALOGS) {
    const byId = new Map();
    [].concat(modules[key] || []).forEach(p => (readJson(p)[key] || []).forEach(e => byId.set(e.id, e)));
    data[key] = [...byId.values()];
  }
  return { manifest, data };
}

const MARK = '// @embedded-dev-campaign';
function build(html) {
  const at = html.indexOf(MARK);
  if (at === -1) throw new Error('EMBEDDED_DEV_CAMPAIGN marker not found in index.html');
  const lineStart = html.indexOf('\n', at) + 1;
  const lineEnd = html.indexOf('\n', lineStart);
  const line = `        return ${JSON.stringify(buildEmbedded())};`;
  return html.slice(0, lineStart) + line + html.slice(lineEnd);
}

if (require.main === module) {
  const html = fs.readFileSync(HTML, 'utf8');
  const updated = build(html);
  if (process.argv.includes('--check')) {
    if (updated !== html) {
      console.error('index.html embedded Dev campaign is out of date. Run: node scripts/sync-embedded-dev-content.js');
      process.exit(1);
    }
    console.log('Embedded Dev campaign is in sync with the JSON files.');
  } else if (updated !== html) {
    fs.writeFileSync(HTML, updated);
    console.log('index.html: embedded Dev campaign regenerated from JSON.');
  } else {
    console.log('index.html: embedded Dev campaign already up to date.');
  }
}

module.exports = { buildEmbedded, build };

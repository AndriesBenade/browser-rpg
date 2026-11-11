#!/usr/bin/env node
/**
 * Regenerates the embedded Developer Verification campaign content inside index.html
 * (`loadEmbeddedDevTestContent()`, used when the game is opened from file:// and fetch is blocked)
 * from the JSON files in content/campaigns/dev_test_campaign/world/.
 *
 *   node scripts/sync-embedded-dev-content.js          # rewrite index.html
 *   node scripts/sync-embedded-dev-content.js --check  # exit 1 if index.html is out of date
 *
 * Run it after editing any Dev campaign JSON file. tests/behaviour_tests.js fails when the two drift.
 * No dependencies.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const DIR = 'content/campaigns/dev_test_campaign/world/';
const read = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, DIR, file), 'utf8'));

// engine catalog -> [json file, key inside the file]
const WORLD = {
  locations: ['locations.json', 'locations'],
  characters: ['characters.json', 'characters'],
  creatures: ['creatures.json', 'creatures'],
  items: ['items.json', 'items'],
  lootTables: ['loot_tables.json', 'lootTables'],
  interactiveObjects: ['interactive_objects.json', 'interactiveObjects'],
  factions: ['factions.json', 'factions'],
  encounters: ['encounters.json', 'encounters'],
  randomEncounters: ['encounters.json', 'randomEncounters'],
  events: ['events.json', 'events'],
  classes: ['classes.json', 'classes'],
  backgrounds: ['backgrounds.json', 'backgrounds'],
};
const ADVENTURE = {
  quests: ['quests.json', 'quests'],
  dialogues: ['dialogues.json', 'dialogues'],
  encounters: ['encounters.json', 'encounters'],
};

function build(html) {
  const start = html.indexOf('      loadEmbeddedDevTestContent() {');
  if (start === -1) throw new Error('loadEmbeddedDevTestContent() not found in index.html');
  const end = html.indexOf('\n      }\n', start);
  let body = html.slice(start, end);

  for (const [key, [file, prop]] of Object.entries(WORLD)) {
    const json = JSON.stringify(read(file)[prop] || []);
    const line = `        this.world.${key} = ${json};`;
    // A catalog is either a one-line JSON assignment or a multi-line literal ending in "];".
    const re = new RegExp(`\\n        this\\.world\\.${key} = (\\[[^\\n]*\\];|\\[\\n[\\s\\S]*?\\n        \\];)`);
    if (re.test(body)) {
      body = body.replace(re, () => `\n${line}`);
    } else {
      // Not embedded yet: add it after the encounters catalog.
      const anchor = body.match(/\n        this\.world\.encounters = [^\n]*;/);
      if (!anchor) throw new Error(`cannot place embedded catalog ${key}`);
      body = body.replace(anchor[0], () => `${anchor[0]}\n${line}`);
    }
  }
  for (const [key, [file, prop]] of Object.entries(ADVENTURE)) {
    const json = JSON.stringify(read(file)[prop] || (key === 'dialogues' ? {} : []));
    const re = new RegExp(`\\n          ${key}: [^\\n]*,`);
    if (!re.test(body)) throw new Error(`currentAdventure.${key} not found in embedded loader`);
    body = body.replace(re, () => `\n          ${key}: ${json},`);
  }
  return html.slice(0, start) + body + html.slice(end);
}

const html = fs.readFileSync(HTML, 'utf8');
const updated = build(html);
if (process.argv.includes('--check')) {
  if (updated !== html) {
    console.error('index.html embedded Dev content is out of date. Run: node scripts/sync-embedded-dev-content.js');
    process.exit(1);
  }
  console.log('Embedded Dev content is in sync with the JSON files.');
} else if (updated !== html) {
  fs.writeFileSync(HTML, updated);
  console.log('index.html: embedded Dev content regenerated from JSON.');
} else {
  console.log('index.html: embedded Dev content already up to date.');
}

/**
 * Behaviour test harness.
 *
 * Loads the REAL engine from index.html into an isolated Node `vm` context with:
 *   - a small, stateful DOM stub (elements remember innerHTML / innerText / style),
 *   - a `fetch` that serves the project's real JSON content files from disk,
 *   - `localStorage` (IndexedDB is reported as unavailable, so saves use localStorage),
 *   - controllable timers (setTimeout callbacks are queued until `flushTimers()`).
 *
 * This lets tests exercise genuine engine behaviour and cross-system interactions
 * (content loading, campaigns, combat, saves, scheduler) instead of mock re-implementations.
 * No third-party dependencies are required.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function makeElement(id, tag = 'div') {
  const el = {
    id, tagName: String(tag).toUpperCase(), className: '', style: {}, dataset: {}, value: '', checked: false, disabled: false,
    innerHTML: '', innerText: '', textContent: '', children: [], attributes: {}, isConnected: true, scrollTop: 0, scrollHeight: 0,
    classList: {
      _set: new Set(),
      add(...c) { c.forEach(x => this._set.add(x)); }, remove(...c) { c.forEach(x => this._set.delete(x)); },
      toggle(c, force) { const on = force === undefined ? !this._set.has(c) : !!force; if (on) this._set.add(c); else this._set.delete(c); return on; },
      contains(c) { return this._set.has(c); }
    },
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    removeChild(child) { this.children = this.children.filter(c => c !== child); return child; },
    setAttribute(k, v) { this.attributes[k] = String(v); }, getAttribute(k) { return this.attributes[k] ?? null; }, removeAttribute(k) { delete this.attributes[k]; },
    addEventListener() {}, removeEventListener() {}, click() {}, focus() {},
    querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 20, right: 100, bottom: 20 }; },
  };
  return el;
}

function createSandbox(opts = {}) {
  const elements = new Map();
  const timers = [];
  const storage = {};
  const document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, makeElement(id)); return elements.get(id); },
    createElement(tag) { return makeElement(null, tag); },
    createElementNS(ns, tag) { return makeElement(null, tag); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    body: makeElement('body'),
  };
  const fetchStub = (url) => new Promise((resolve, reject) => {
    const rel = String(url).replace(/^\.?\//, '');
    const full = path.join(ROOT, rel);
    if (!full.startsWith(ROOT) || !fs.existsSync(full)) return reject(new Error('404 ' + rel));
    const raw = fs.readFileSync(full, 'utf8');
    resolve({ ok: true, status: 200, json: async () => JSON.parse(raw), text: async () => raw });
  });
  const sandbox = {
    console: { log() {}, warn() {}, error: (...a) => sandbox.__errors.push(a.join(' ')), info() {} },
    __errors: [],
    document,
    localStorage: {
      getItem: (k) => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
      clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
    },
    indexedDB: { open() { const req = {}; Promise.resolve().then(() => req.onerror && req.onerror(new Error('IndexedDB unavailable in harness'))); return req; } },
    fetch: fetchStub,
    setTimeout: (fn, ms) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => { timers.push(fn); return timers.length; },
    alert: () => {},
    confirm: () => true,
    innerWidth: 1280, innerHeight: 800,
    addEventListener: () => {},
    AudioContext: undefined,
    FileReader: function () {},
    Date, Math, JSON, Promise, Map, Set, Object, Array, String, Number, Boolean, RegExp, Error, encodeURIComponent, parseInt, parseFloat, isNaN,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  // ENGINE_HTML=dist/index.html runs the whole suite against the release build.
  const html = opts.html || fs.readFileSync(path.join(ROOT, process.env.ENGINE_HTML || 'index.html'), 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Engine <script> block not found in index.html');
  // Classes declared with `class X {}` are not added to the global object, so expose them explicitly.
  vm.runInContext(match[1] + '\n;this.GreekMythologyEngine = GreekMythologyEngine; this.TutorialManager = TutorialManager;', sandbox, { filename: 'index.html#engine' });

  return {
    sandbox,
    Engine: sandbox.GreekMythologyEngine,
    el: (id) => document.getElementById(id),
    storage,
    flushTimers(max = 100) { let n = 0; while (timers.length && n < max) { const fn = timers.shift(); fn(); n++; } return n; },
    pendingTimers: () => timers.length,
  };
}

/** Boot a full engine the way the browser does (init), using real JSON content. */
async function bootEngine(env) {
  const engine = new env.Engine();
  env.sandbox.engine = engine;
  await engine.init();
  registerTestFixtures(engine);
  env.flushTimers();
  return engine;
}

/**
 * The original Developer campaign is frozen as a hidden test fixture (campaign_dev_legacy) so the
 * regression tests keep a stable world while the playable Dev campaign can change freely.
 */
const LEGACY_DEV_MANIFEST = 'content/campaigns/fixtures/dev_legacy/campaign.json';
function registerTestFixtures(engine) {
  engine.registerCampaign(JSON.parse(fs.readFileSync(path.join(ROOT, LEGACY_DEV_MANIFEST), 'utf8')));
}

/** Synchronously load the legacy Dev fixture content into an engine (no fetch, no game started). */
function loadLegacyDevContent(engine) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, LEGACY_DEV_MANIFEST), 'utf8'));
  const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const m = manifest.modules;
  const enc = read(m.encounters);
  const catalog = (paths, key) => { const byId = new Map(); [].concat(paths || []).forEach(p => (read(p)[key] || []).forEach(e => byId.set(e.id, e))); return [...byId.values()]; };
  const data = {
    locations: read(m.locations).locations, characters: read(m.characters).characters, creatures: read(m.creatures).creatures,
    items: read(m.items).items, lootTables: read(m.lootTables).lootTables, interactiveObjects: read(m.interactiveObjects).interactiveObjects,
    factions: read(m.factions).factions, events: read(m.events).events, quests: read(m.quests).quests,
    encounters: enc.encounters, randomEncounters: enc.randomEncounters, dialogues: read(m.dialogues).dialogues,
    classes: catalog(m.classes, 'classes'), backgrounds: catalog(m.backgrounds, 'backgrounds'),
    origins: catalog(m.origins, 'origins'), traits: catalog(m.traits, 'traits')
  };
  engine.registerCampaign(manifest);
  engine.activeCampaignId = manifest.id;
  engine.applyCampaignContent(manifest, data);
  return engine;
}

/** Start a campaign and create a hero through the real wizard entry points. */
async function startCampaign(env, engine, campaignId, opts = {}) {
  engine.skipWalkthrough();
  engine.selectCampaign(campaignId);
  await engine.confirmCampaignSelection();
  engine.renderWizardStep(2);
  if (opts.classId) engine.selectClass(opts.classId);
  if (opts.backgroundId) engine.selectBackground(opts.backgroundId);
  if (opts.trait) engine.selectTrait(opts.trait);
  if (opts.origin) engine.selectOrigin(opts.origin);
  while (engine.creationState.pointsLeft > 0) engine.alterWizAttr('endurance', 1);
  engine.confirmHeroCreation();
  env.flushTimers();
  return engine;
}

module.exports = { createSandbox, bootEngine, startCampaign, loadLegacyDevContent, ROOT, LEGACY_DEV_MANIFEST };

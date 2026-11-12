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

function createSandbox() {
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

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
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
  env.flushTimers();
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

module.exports = { createSandbox, bootEngine, startCampaign, ROOT };

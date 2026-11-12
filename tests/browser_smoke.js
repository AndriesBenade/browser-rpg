/**
 * Optional real-browser smoke test (headless Chromium via Playwright).
 *
 *   npm run test:browser
 *
 * Requires Playwright (`npm install --no-save playwright` and `npx playwright install chromium`).
 * If Playwright is not installed the test is skipped (exit code 0) so `npm test` stays dependency-free.
 * Set CHROME_PATH to use an installed Chrome/Chromium instead of Playwright's bundled browser.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.log('[SKIP] Playwright is not installed; browser smoke test skipped.');
  process.exit(0);
}

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.md': 'text/markdown' };

function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const full = path.join(ROOT, rel);
      if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(full).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const errors = [];
  let failures = 0;
  const check = (name, ok, detail = '') => { console.log(`${ok ? '[PASS]' : '[FAIL]'} ${name}${ok ? '' : ' ' + detail}`); if (!ok) failures++; };
  try {
    const page = await (await browser.newContext()).newPage();
    page.on('pageerror', e => errors.push(e.message));
    // Starting a new game while one is in progress asks for confirmation: record and accept it.
    const dialogs = [];
    page.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
    await page.goto(url);
    await page.waitForFunction(() => window.engine && window.engine.world && window.engine.world.locations.length > 0);
    check('Game boots and loads content', true);

    const greek = await page.evaluate(async () => {
      engine.skipWalkthrough(); engine.selectCampaign('campaign_greek_mythology'); await engine.confirmCampaignSelection();
      engine.renderWizardStep(2);
      while (engine.creationState.pointsLeft > 0) engine.alterWizAttr('endurance', 1);
      engine.confirmHeroCreation();
      ['view-map', 'view-character', 'view-inventory', 'view-journal', 'view-codex', 'view-crafting', 'view-settings', 'view-story'].forEach(v => engine.switchView(v));
      // Cards may sit inside closed per-NPC / per-place lists, so read textContent (innerText is empty for hidden text).
      const cards = [...document.querySelectorAll('#context-actions-container .action-card-btn')].map(b => b.querySelector('.action-card-title span').textContent.trim());
      return { cards, unique: new Set(cards).size === cards.length };
    });
    check('Greek campaign: all views render and the action deck has no duplicates', greek.cards.length > 0 && greek.unique, JSON.stringify(greek));

    const dev = await page.evaluate(async () => {
      engine.selectCampaign('campaign_dev_test'); await engine.confirmCampaignSelection();
      engine.renderWizardStep(2);
      while (engine.creationState.pointsLeft > 0) engine.alterWizAttr('endurance', 1);
      engine.confirmHeroCreation();
      const talk = [...document.querySelectorAll('#context-actions-container .action-card-btn')].find(b => /Speak with Tamsin Quill/.test(b.textContent));
      if (talk) talk.click();
      const speaker = document.getElementById('dialogue-speaker-name').innerText;
      await engine.saveGameSilently(1);
      return { speaker, factions: Object.keys(engine.state.worldState.factions) };
    });
    check('Dev campaign: NPC dialogue opens', dev.speaker === 'Tamsin Quill', JSON.stringify(dev));
    check('Dev campaign: only its own factions', dev.factions.every(f => f.startsWith('faction_dev')), JSON.stringify(dev.factions));
    check('Launching a campaign mid-game asks first and keeps the old game in its slot',
      dialogs.some(m => /Start a new game/.test(m) && /stays saved in Slot 1/.test(m)), JSON.stringify(dialogs));

    await page.reload();
    await page.waitForFunction(() => window.engine && window.engine.world && window.engine.world.locations.length > 0);
    await page.waitForTimeout(500);
    const resumed = await page.evaluate(() => ({ campaign: engine.activeCampaignId, loc: engine.state.worldState.currentLocationId, hud: document.getElementById('hud-location-name').innerText }));
    check('Reload resumes the Dev campaign with its own content', resumed.campaign === 'campaign_dev_test' && resumed.loc === 'loc_dev_brindle_ford' && /Brindle/.test(resumed.hud), JSON.stringify(resumed));

    // Session 17: page-level windows are really visible when opened (a mis-nested window is invisible).
    const windows = await page.evaluate(() => {
      const shown = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.width > 50 && r.height > 50; };
      const out = {};
      window.engine.switchView('view-story');
      document.querySelector('#side-travel-links button').click();
      out.travel = shown('map-travel-modal') && !!document.querySelector('#map-travel-modal .pace-btn');
      document.getElementById('map-travel-modal').style.display = 'none';
      window.engine.openTrade('npc_dev_tamsin_quill'); out.trade = shown('trade-modal'); window.engine.closeTrade();
      window.engine.engageCreature('creature_dev_reef_crab'); out.confront = shown('confront-modal');
      window.engine.chooseConfrontation('attack'); out.combat = shown('combat-modal') && /Next:/.test(document.getElementById('combat-intent-line').innerText);
      document.getElementById('combat-modal').style.display = 'none'; window.engine.combatSession = null;
      out.weather = /ration|Hungry/.test(document.getElementById('story-location-weather').innerText);
      return out;
    });
    check('Travel card (with pace), trade, confrontation and combat windows are visible; weather and supplies are shown', Object.values(windows).every(Boolean), JSON.stringify(windows));

    // Crafting from the bag with real mouse drags: material onto a toolkit opens its workbench,
    // a second material fills it, and a whetstone dropped on a blade hones it.
    await page.evaluate(() => {
      const e = window.engine;
      e.addItem('item_dev_tinker_kit', 1); e.addItem('mat_dev_river_iron', 1); e.addItem('mat_dev_driftwood', 1);
      e.addItem('item_dev_whetstone', 1); e.addItem('item_dev_tinker_knife', 1);
      e.switchView('view-inventory');
    });
    const card = (id) => page.locator(`#inventory-items-container .item-card[data-item-id="${id}"]`);
    await card('mat_dev_river_iron').dragTo(card('item_dev_tinker_kit'));
    await card('mat_dev_driftwood').dragTo(page.locator('#workbench-panel [data-wb-slot="p1"]'));
    const bench = await page.evaluate(() => ({ shown: document.getElementById('workbench-panel').getBoundingClientRect().height > 50, ready: window.engine.isWorkbenchReady(), recipes: document.querySelectorAll('#workbench-panel .workbench-template').length }));
    check('Drag to craft: materials dropped on a toolkit open its workbench with the recipes they can make', bench.shown && bench.ready && bench.recipes > 0, JSON.stringify(bench));
    // Close the bench and scroll the bag so both cards are on screen (Playwright cannot scroll mid-drag).
    await page.evaluate(() => { window.engine.closeWorkbench(); document.getElementById('inventory-items-container').scrollTop = 1e6; });
    await card('item_dev_whetstone').dragTo(card('item_dev_tinker_knife'));
    const honed = await page.evaluate(() => ({ honed: window.engine.getItemQuantity('item_dev_honed_tinker_knife'), knife: window.engine.getItemQuantity('item_dev_tinker_knife') }));
    check('Combining in the bag: a whetstone dropped on the knife hones it', honed.honed === 1, JSON.stringify(honed));
    check('No uncaught page errors', errors.length === 0, errors.join(' | '));
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failures ? `\nBROWSER SMOKE: ${failures} failure(s)` : '\nBROWSER SMOKE: all checks passed');
  process.exit(failures ? 1 : 0);
})();

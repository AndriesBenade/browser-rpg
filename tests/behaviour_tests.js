/**
 * Behaviour & regression tests for the real engine (see behaviour_harness.js).
 *
 * Every test drives genuine engine code paths and checks observable results,
 * including interactions between systems (campaign loading <-> saves, combat <->
 * quests <-> loot, crafting <-> persistence, scheduler <-> calendar, ...).
 *
 * Run: node tests/behaviour_tests.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createSandbox, bootEngine, startCampaign, ROOT } = require('./behaviour_harness');

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`[FAIL] ${name}\n       ${(err && err.message || String(err)).split('\n').join('\n       ')}`);
  }
}

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fixedRoll = (engine, value) => { engine.rollD20 = () => value; };
// Fights open with a confrontation (pre-combat choices); tests that only need the fight attack openly.
const engageFight = (engine, env) => {
  if (env) env.flushTimers();
  const cf = engine.confrontation;
  if (cf) engine.chooseConfrontation(cf.initiator === 'enemy' ? (cf.unavoidable ? 'head_on' : 'fight') : 'attack');
};
// Values created inside the engine's VM context have foreign prototypes; compare plain copies.
const plain = (v) => JSON.parse(JSON.stringify(v));

(async () => {
  console.log('=================================================================');
  console.log('RUNNING BEHAVIOUR & REGRESSION TESTS (real engine, real content)');
  console.log('=================================================================\n');

  // ---------------------------------------------------------------------------
  // Content integrity (data validation)
  // ---------------------------------------------------------------------------
  await test('Content: every item/creature/location/NPC reference in both campaigns resolves', () => {
    const campaigns = {
      greek: {
        items: ['content/world/items.json'], materials: 'content/campaigns/greek_mythology/materials.json',
        refs: ['content/world/characters.json', 'content/world/creatures.json', 'content/world/locations.json', 'content/world/loot_tables.json',
          'content/world/interactive_objects.json', 'content/campaigns/greek_mythology/classes.json', 'content/campaigns/greek_mythology/backgrounds.json',
          'content/campaigns/greek_mythology/professions.json', 'content/campaigns/greek_mythology/crafting_templates.json', 'content/adventures/tutorial.json'],
        creatures: 'content/world/creatures.json', locations: 'content/world/locations.json', characters: 'content/world/characters.json',
      },
      dev: {
        items: ['content/campaigns/dev_test_campaign/world/items.json'],
        refs: ['characters', 'creatures', 'locations', 'loot_tables', 'interactive_objects', 'classes', 'backgrounds', 'quests', 'dialogues', 'encounters', 'events']
          .map(f => `content/campaigns/dev_test_campaign/world/${f}.json`),
        creatures: 'content/campaigns/dev_test_campaign/world/creatures.json', locations: 'content/campaigns/dev_test_campaign/world/locations.json',
        characters: 'content/campaigns/dev_test_campaign/world/characters.json',
      },
    };
    const problems = [];
    for (const [cName, c] of Object.entries(campaigns)) {
      const items = new Set(c.items.flatMap(f => readJson(f).items.map(i => i.id)));
      if (c.materials) readJson(c.materials).materials.forEach(m => items.add(m.id));
      const creatures = new Set(readJson(c.creatures).creatures.map(x => x.id));
      const locs = new Set(readJson(c.locations).locations.map(x => x.id));
      const npcs = new Set(readJson(c.characters).characters.map(x => x.id));
      const walk = (o, p, file) => {
        if (Array.isArray(o)) return o.forEach((v, i) => walk(v, `${p}[${i}]`, file));
        if (o && typeof o === 'object') return Object.entries(o).forEach(([k, v]) => walk(v, `${p}.${k}`, file));
        if (typeof o !== 'string' || p.endsWith('.id') || p.endsWith('.handlerType')) return;
        if (/^(item|mat)_/.test(o) && !items.has(o)) problems.push(`${cName}: ${file}${p} -> unknown item ${o}`);
        if (/^creature_/.test(o) && !creatures.has(o)) problems.push(`${cName}: ${file}${p} -> unknown creature ${o}`);
        if (/^loc_/.test(o) && !locs.has(o)) problems.push(`${cName}: ${file}${p} -> unknown location ${o}`);
        if (/^npc_/.test(o) && !npcs.has(o)) problems.push(`${cName}: ${file}${p} -> unknown NPC ${o}`);
      };
      c.refs.forEach(f => walk(readJson(f), '', path.basename(f)));
    }
    assert.deepStrictEqual(problems, []);
  });

  await test('Content: rarity vocabulary used by items is known to the engine rarity table', () => {
    const env = createSandbox();
    const engine = new env.Engine();
    const files = ['content/world/items.json', 'content/campaigns/dev_test_campaign/world/items.json'];
    const unknown = [];
    files.forEach(f => readJson(f).items.forEach(i => { if (engine.getRarityRank(i.rarity) === null) unknown.push(`${i.id}:${i.rarity}`); }));
    assert.deepStrictEqual(unknown, []);
  });

  await test('Content: the in-game campaign validator passes both shipped campaigns and flags broken item references', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    for (const id of ['campaign_greek_mythology', 'campaign_dev_test']) {
      // The "Validate Campaign" button validates the highlighted campaign against its own content,
      // even when another campaign is the one being played.
      engine.openCampaignSelectView();
      engine.selectCampaign(id);
      const r = await engine.runComprehensiveCampaignValidation(id);
      assert.deepStrictEqual(plain(r.errors), [], `${id} should validate cleanly`);
      assert.strictEqual(engine.activeCampaignId, 'campaign_greek_mythology', 'validating must not switch the running campaign');
      assert.ok(engine.getLocation('loc_cithaeron_crossroads').id === 'loc_cithaeron_crossroads', 'running campaign content restored after validation');
    }
    await engine.loadContent();
    const broken = env.Engine.validateCampaign(engine.campaigns.get('campaign_dev_test'), {
      locations: engine.world.locations, items: [{ id: 'item_a', name: 'A' }], classes: [{ id: 'c', name: 'C', startingEquipment: ['item_missing'] }],
    });
    assert.ok(broken.errors.some(e => e.includes('item_missing')));
  });

  // ---------------------------------------------------------------------------
  // Campaign architecture, isolation & save identity
  // ---------------------------------------------------------------------------
  await test('Campaign isolation: starting the Dev campaign carries no Greek state or content', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState, p = engine.state.player;
    assert.strictEqual(w.campaignId, 'campaign_dev_test');
    assert.strictEqual(w.currentLocationId, 'loc_dev_haven');
    assert.deepStrictEqual(plain(Object.keys(w.factions).sort()), ['faction_dev_guards', 'faction_dev_haven', 'faction_dev_outlaws']);
    assert.ok(w.discoveredLocations.every(id => engine.world.locations.some(l => l.id === id)), 'discovered locations must exist in campaign: ' + w.discoveredLocations);
    assert.ok(!w.quests.quest_tutorial_stolen_ram, 'Greek tutorial quest must not be active in Dev campaign');
    const unknownItems = p.inventory.filter(e => !engine.world.items.some(i => i.id === e.itemId));
    assert.deepStrictEqual(plain(unknownItems.map(e => e.itemId)), [], 'inventory must only contain items of the active campaign');
    assert.strictEqual(engine.world.deities.length, 0, 'Greek deities must not leak into Dev campaign');
    assert.strictEqual(engine.glossary.length, 0, 'Greek glossary must not leak into Dev campaign');
  });

  await test('Campaign isolation: switching Dev -> Greek in one session leaves no Dev content behind', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    engine.selectCampaign('campaign_dev_test'); await engine.loadContent();
    engine.selectCampaign('campaign_greek_mythology'); await engine.loadContent();
    assert.ok(!engine.world.factions.some(f => f.id.startsWith('faction_dev')), 'dev factions leaked');
    assert.ok(!engine.world.encounters.some(e => e.id.startsWith('enc_dev')), 'dev encounters leaked');
    assert.ok(!engine.world.events.some(e => String(e.id).includes('dev')), 'dev events leaked');
    assert.strictEqual(engine.currentAdventure.id, 'adv_tutorial_cithaeron_001');
  });

  await test('Save identity: a Dev-campaign save resumes with Dev content after a full restart', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    await engine.saveGameSilently(1);
    // "Reload the page": new engine, same storage
    const engine2 = new env.Engine();
    env.sandbox.engine = engine2;
    await engine2.init();
    assert.strictEqual(engine2.activeCampaignId, 'campaign_dev_test');
    assert.strictEqual(engine2.world.locations[0].id.startsWith('loc_dev'), true, 'Dev content must be loaded for a Dev save');
    assert.strictEqual(engine2.getLocation(engine2.state.worldState.currentLocationId).id, 'loc_dev_haven');
  });

  await test('Save identity: loading a slot from another campaign switches content to that campaign', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    await engine.saveGameSilently(2);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    assert.ok(engine.world.locations.some(l => l.id === 'loc_cithaeron_crossroads'));
    await engine.loadGame(2);
    assert.strictEqual(engine.activeCampaignId, 'campaign_dev_test');
    assert.ok(engine.world.locations.some(l => l.id === 'loc_dev_haven'), 'content must follow the loaded save');
  });

  await test('Save migration: an old v1.2 save missing newer fields loads without errors and keeps progress', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    const old = JSON.parse(JSON.stringify(engine.state));
    old.version = '1.2.0'; old.hasCompletedCreation = true;
    delete old.worldState.scheduledEvents; delete old.worldState.executedEventIds; delete old.worldState.permanentNpcDeaths;
    delete old.worldState.grantedUniqueItems; delete old.worldState.defeatedEncounters; delete old.worldState.encounterCooldowns;
    delete old.player.morality; delete old.player.feats; delete old.worldState.campaignId;
    old.player.drachmae = 30; // currency lost by an earlier bug
    old.player.currencies.drachmae = 45;
    old.player.inventory.push({ itemId: 'item_hunting_bow_001', quantity: 1, equipped: true, slot: 'two_hand' });
    old.player.inventory.find(i => i.itemId === 'item_dory_spear_001').equipped = false;
    env.storage['gm_save_slot_3'] = JSON.stringify(old);
    await engine.loadGame(3);
    const s = engine.state;
    assert.ok(Array.isArray(s.worldState.scheduledEvents));
    assert.ok(s.worldState.permanentNpcDeaths && s.player.morality && Array.isArray(s.player.feats));
    assert.strictEqual(s.worldState.campaignId, 'campaign_greek_mythology');
    assert.strictEqual(s.player.currencies.drachmae, 75, 'stray player.drachmae must be folded into currencies');
    assert.strictEqual(s.player.drachmae, undefined);
    assert.strictEqual(s.player.inventory.find(i => i.itemId === 'item_hunting_bow_001').slot, 'main_hand', 'legacy two_hand slot normalised');
    engine.advanceTime(30, 0); // must not throw
    engine.renderAll();
  });

  await test('Save slots: autosave writes to the loaded game\'s own slot and the last slot resumes on restart', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.state.player.name = 'SlotOne';
    await engine.saveGameSilently(1);
    engine.state.player.name = 'SlotTwo';
    await engine.saveGameSilently(2);
    await engine.loadGame(2);
    engine.state.player.name = 'SlotTwoProgress';
    await engine.autosave();
    assert.strictEqual(JSON.parse(env.storage.gm_save_slot_1).player.name, 'SlotOne', 'slot 1 must not be overwritten by slot 2 play');
    const engine2 = new env.Engine(); env.sandbox.engine = engine2; await engine2.init();
    assert.strictEqual(engine2.state.player.name, 'SlotTwoProgress');
  });

  await test('Save slots: a corrupted save does not stop the game from starting', async () => {
    const env = createSandbox();
    env.storage.gm_save_slot_1 = '{"player": {broken json';
    const engine = await bootEngine(env);
    assert.ok(engine.world.locations.length > 0);
    assert.strictEqual(engine.state.hasCompletedCreation, false);
  });

  await test('Dual content: embedded file:// fallback stays in sync with the JSON content files', () => {
    const env = createSandbox();
    const dev = new env.Engine();
    dev.loadEmbeddedDevTestContent();
    const devDir = 'content/campaigns/dev_test_campaign/world/';
    const ids = (arr) => plain(arr.map(x => x.id).sort());
    // The embedded Dev campaign must be IDENTICAL to its JSON (it is generated by
    // scripts/sync-embedded-dev-content.js); a stale copy changed classes/backgrounds in file:// mode.
    const same = (embedded, file, key, label) => assert.deepStrictEqual(plain(embedded), readJson(devDir + file)[key], `${label} differs from ${file}: run node scripts/sync-embedded-dev-content.js`);
    same(dev.world.locations, 'locations.json', 'locations', 'locations');
    same(dev.world.characters, 'characters.json', 'characters', 'characters');
    same(dev.world.creatures, 'creatures.json', 'creatures', 'creatures');
    same(dev.world.items, 'items.json', 'items', 'items');
    same(dev.world.lootTables, 'loot_tables.json', 'lootTables', 'loot tables');
    same(dev.world.interactiveObjects, 'interactive_objects.json', 'interactiveObjects', 'interactive objects');
    same(dev.world.factions, 'factions.json', 'factions', 'factions');
    same(dev.world.encounters, 'encounters.json', 'encounters', 'encounters');
    same(dev.world.randomEncounters, 'encounters.json', 'randomEncounters', 'random encounters');
    same(dev.world.events, 'events.json', 'events', 'events');
    same(dev.world.classes, 'classes.json', 'classes', 'classes');
    same(dev.world.backgrounds, 'backgrounds.json', 'backgrounds', 'backgrounds');
    same(dev.currentAdventure.quests, 'quests.json', 'quests', 'quests');
    same(dev.currentAdventure.dialogues, 'dialogues.json', 'dialogues', 'dialogues');
    const greek = new env.Engine();
    greek.loadEmbeddedFallbackContent();
    const jsonItems = new Set(readJson('content/world/items.json').items.map(i => i.id));
    const extra = greek.world.items.filter(i => !jsonItems.has(i.id)).map(i => i.id);
    assert.deepStrictEqual(plain(extra), [], 'embedded Greek items must be a subset of items.json');
    assert.deepStrictEqual(ids(greek.world.locations), ids(readJson('content/world/locations.json').locations));
    // Starting kits referenced by the embedded classes must resolve in file:// mode too
    const missingKit = greek.getFallbackClasses().flatMap(c => c.startingEquipment || []).filter(id => !greek.world.items.some(i => i.id === id));
    assert.deepStrictEqual(plain(missingKit), [], 'embedded class kits reference items missing from the embedded catalog');
  });

  // ---------------------------------------------------------------------------
  // Character creation & progression
  // ---------------------------------------------------------------------------
  await test('Creation: class starting gear replaces the default kit and is equipped in valid slots', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology', { classId: 'amazon' });
    const eq = engine.state.player.inventory.filter(i => i.equipped);
    const slots = eq.map(i => i.slot);
    assert.ok(eq.some(i => i.itemId === 'item_hunting_bow_001'), 'class weapon equipped');
    assert.ok(!eq.some(i => i.itemId === 'item_dory_spear_001'), 'default hoplite spear must not stay equipped for an Amazon');
    assert.strictEqual(new Set(slots).size, slots.length, 'no two items may share a slot: ' + slots);
    const validSlots = new Set(engine.getEquipmentSlots());
    assert.ok(slots.every(s => validSlots.has(s)), 'all equipped slots must be real paper-doll slots: ' + slots);
    assert.ok(eq.every(i => engine.world.items.some(it => it.id === i.itemId)), 'starting gear must exist in the catalog');
  });

  await test('Creation: background defaults to a real campaign background and traits reflect the chosen trait only', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology', { trait: 'eloquent' });
    const p = engine.state.player;
    assert.ok(engine.getCampaignBackgrounds().some(b => b.id === p.background), 'background must be a campaign background, got ' + p.background);
    assert.deepStrictEqual(plain(p.traits.map(t => t.id || t.name)), ['eloquent']);
  });

  await test('Creation: origin perks shown in the wizard are applied', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    engine.skipWalkthrough(); engine.selectCampaign('campaign_greek_mythology'); await engine.confirmCampaignSelection();
    engine.selectOrigin('laconia');
    const strBefore = engine.creationState.attributes.strength;
    engine.renderWizardStep(2);
    engine.confirmHeroCreation();
    const p = engine.state.player;
    const cls = engine.getCampaignClasses().find(c => c.id === p.class);
    const classStr = (cls && cls.statBonuses && cls.statBonuses.strength) || 0;
    assert.strictEqual(p.attributes.strength, strBefore + classStr + 1, 'Laconia promises +1 Strength');
  });

  await test('Perception: the Vigilant bonus applies only to heroes who chose Vigilant', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology', { trait: 'pious' });
    const pious = engine.getPerceptionBonus();
    engine.state.player.traits = [{ id: 'vigilant', name: 'Vigilant Scout' }];
    assert.strictEqual(engine.getPerceptionBonus(), pious + 2);
  });

  // ---------------------------------------------------------------------------
  // Action deck
  // ---------------------------------------------------------------------------
  await test('Action deck: no duplicate cards or duplicate category groups at the tutorial crossroads', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const groups = engine.getContextualActionGroups();
    const ids = groups.flatMap(g => g.actions.map(a => a.id));
    assert.deepStrictEqual(plain(ids.filter((x, i) => ids.indexOf(x) !== i)), [], 'duplicate action ids');
    const cats = groups.map(g => g.category);
    assert.deepStrictEqual(plain(cats.filter((x, i) => cats.indexOf(x) !== i)), [], 'duplicate category groups');
    const talk = groups.flatMap(g => g.actions).filter(a => /^Speak with .*Daidalos/.test(a.title));
    assert.strictEqual(talk.length, 1, 'exactly one way to talk to Daidalos: ' + talk.map(a => a.title));
  });

  // ---------------------------------------------------------------------------
  // Tutorial storyline end-to-end (quests <-> puzzles <-> combat <-> dialogue <-> rewards)
  // ---------------------------------------------------------------------------
  await test('Tutorial: full playthrough grants each defined reward exactly once', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    fixedRoll(engine, 15);
    const p = engine.state.player, w = engine.state.worldState;
    engine.openDialogue('dialogue_daidalos_shepherd', 'node_accept_quest');
    engine.executeGenericAction(engine.currentAdventure.contextActions.find(a => a.id === 'act_search_tracks'));
    const loc = engine.getLocation(w.currentLocationId);
    engine.executeTravel(engine.getLocation('loc_cithaeron_fissure_cave'), loc.connections.find(c => c.targetLocationId === 'loc_cithaeron_fissure_cave'));
    env.flushTimers();
    // Learn the clue, then use the clue-based answer
    engine.openDialogue('dialogue_daidalos_shepherd', 'node_cadmus_lore');
    engine.openPuzzle('puzzle_cadmean_threshold');
    engine.resolveRiddleChoice('known_answer');
    assert.strictEqual(w.flags.cithaeron_cave_unsealed, true, 'clue-based riddle answer must open the threshold');
    assert.strictEqual(w.quests.quest_tutorial_stolen_ram.objectives.obj_solve_riddle.completed, true, 'later-stage objective recorded');
    // Fight
    engine.startCombatEncounter('enc_fissure_beast');
    engine.combatSession.enemy.hp = 1;
    const xp0 = p.xp;
    engine.combatAction('thrust'); engine.combatAction('thrust'); engine.combatAction('thrust');
    env.flushTimers();
    assert.strictEqual(engine.combatSession, null);
    assert.strictEqual(engine.getItemQuantity('item_votive_bell_hermes'), 1, 'encounter victory outcome grants the bell once');
    assert.strictEqual(w.quests.quest_tutorial_stolen_ram.objectives.obj_recover_bell.completed, true);
    const wolfXp = engine.getCreature('creature_cithaeron_wolf').xpReward;
    assert.strictEqual(p.xp - xp0, wolfXp + 150, 'creature XP + encounter XP, awarded once despite repeated clicks');
    // Return to Daidalos
    w.currentLocationId = 'loc_cithaeron_crossroads';
    const d0 = p.currencies.drachmae, x0 = p.xp;
    engine.openDialogue('dialogue_daidalos_shepherd', 'node_complete_quest');
    env.flushTimers();
    assert.strictEqual(p.currencies.drachmae - d0, 30, 'quest drachmae reward once');
    assert.strictEqual(p.xp - x0, 200, 'quest XP reward once');
    assert.strictEqual(engine.getItemQuantity('item_votive_bell_hermes'), 1, 'no duplicate bell');
    assert.strictEqual(w.quests.quest_tutorial_stolen_ram.completed, true);
    // Re-opening the node must not pay out again
    engine.openDialogue('dialogue_daidalos_shepherd', 'node_complete_quest');
    assert.strictEqual(p.currencies.drachmae - d0, 30);
  });

  await test('Combat: killing an unrelated creature does not set tutorial quest flags', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    fixedRoll(engine, 15);
    engine.startCombat('creature_parnassian_satyr');
    engine.combatSession.enemy.hp = 1;
    engine.combatAction('thrust');
    env.flushTimers();
    assert.ok(!engine.state.worldState.flags.cithaeron_beast_defeated);
    const obj = engine.state.worldState.quests.quest_tutorial_stolen_ram.objectives.obj_defeat_beast;
    assert.ok(!(obj && obj.completed));
  });

  await test('Combat: defeat is processed once even if the player keeps clicking', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.state.player.currencies.drachmae = 50;
    engine.startCombat('creature_lernaean_hydra');
    engine.state.player.vitals.health = 1;
    fixedRoll(engine, 20); // enemy crit
    engine.rollD20 = (() => { let n = 0; return () => (n++ % 2 === 0 ? 2 : 20); })();
    const t0 = engine.getTotalInGameMinutes();
    engine.combatAction('feint'); engine.combatAction('feint'); engine.combatAction('feint');
    env.flushTimers();
    assert.strictEqual(engine.state.player.currencies.drachmae, 45, 'defeat penalty applied once');
    assert.strictEqual(engine.getTotalInGameMinutes() - t0, 12 * 60, 'defeat time skip applied once');
  });

  await test('Combat: creature XP rewards come from creature data; bosses alone schedule boss respawns', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    fixedRoll(engine, 15);
    const xp0 = engine.state.player.xp;
    engine.startCombat('creature_stymphalian_bird');
    engine.combatSession.enemy.hp = 1;
    engine.combatAction('thrust'); env.flushTimers();
    assert.strictEqual(engine.state.player.xp - xp0, engine.getCreature('creature_stymphalian_bird').xpReward);
    const types = engine.state.worldState.scheduledEvents.map(e => e.type);
    assert.ok(types.includes('creature_respawn'));
    assert.ok(!types.includes('boss_respawn'), 'a regular creature must not schedule a boss respawn');
  });

  await test('Combat: a ranged weapon attacks with Agility + Ranged skill (as the Agility description promises)', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology', { classId: 'amazon' });
    const p = engine.state.player;
    p.attributes.strength = 6; p.attributes.agility = 18; p.skills.ranged_combat = 3; p.skills.melee_combat = 0;
    engine.startCombat('creature_sphinx_thebes');
    engine.combatSession.enemy.armorClass = 10 + 4 + 3; // needs agility+ranged to hit with a roll of 10
    fixedRoll(engine, 10);
    const hp0 = engine.combatSession.enemy.hp;
    engine.combatAction('thrust');
    assert.ok(engine.combatSession.enemy.hp < hp0, 'bow attack should hit using agility');
  });

  await test('Combat: a main-hand item without damage stats never produces NaN damage', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.world.items.push({ id: 'item_test_lyre', name: 'Lyre', category: 'instrument', slot: 'main_hand', stats: {} });
    engine.buildContentMaps();
    engine.state.player.inventory.push({ itemId: 'item_test_lyre', quantity: 1, equipped: false });
    engine.equipItem('item_test_lyre');
    engine.startCombat('creature_cithaeron_wolf');
    fixedRoll(engine, 15);
    engine.combatAction('thrust');
    assert.ok(Number.isFinite(engine.combatSession.enemy.hp), 'enemy hp must stay numeric');
  });

  await test('Combat: consumable button works with any campaign healing item (Dev campaign potion)', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const potion = engine.world.items.find(i => engine.getConsumableEffects(i).restoreHealth > 0);
    assert.ok(potion, 'dev campaign must have a healing consumable');
    engine.addItem(potion.id, 1);
    engine.startCombat('creature_dev_wild_boar');
    engine.state.player.vitals.health = 3;
    fixedRoll(engine, 1);
    engine.combatAction('salve');
    assert.strictEqual(engine.getItemQuantity(potion.id), 0, 'potion consumed');
    assert.ok(engine.state.player.vitals.health > 3 || engine.combatSession === null);
  });

  await test('Combat: Shield Clash costs stamina, can be used once per round and resolves the round', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.startCombat('creature_cithaeron_wolf');
    const c = engine.combatSession;
    const stm0 = engine.state.player.vitals.stamina;
    engine.openMinigame('shield_clash');
    engine.clashState.pos = engine.clashState.braceStart; // perfect
    engine.braceHopliteShield();
    engine.closeMinigame(true);
    env.flushTimers();
    assert.strictEqual(engine.state.player.vitals.stamina, stm0 - 2, 'clash costs 2 stamina');
    assert.strictEqual(c.round, 2, 'clash consumes the player turn');
    engine.state.player.vitals.stamina = 0;
    engine.openMinigame('shield_clash');
    assert.strictEqual(engine.activeMinigame, null, 'clash refused without stamina');
  });

  // ---------------------------------------------------------------------------
  // Economy / exploits
  // ---------------------------------------------------------------------------
  await test('Economy: data-driven drachmae rewards are credited to the real purse', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const d0 = engine.state.player.currencies.drachmae;
    engine.applyActionOutcome({ giveDrachmae: 12 });
    assert.strictEqual(engine.state.player.currencies.drachmae, d0 + 12);
    assert.strictEqual(engine.state.player.drachmae, undefined);
  });

  await test('Exploit: a natural-20 discovery cache can be found only once per location', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    fixedRoll(engine, 20);
    const d0 = engine.state.player.currencies.drachmae;
    engine.checkSkill('perception', 'wisdom', 10, 'test');
    const d1 = engine.state.player.currencies.drachmae;
    engine.checkSkill('perception', 'wisdom', 10, 'test');
    engine.checkSkill('perception', 'wisdom', 10, 'test');
    assert.ok(d1 > d0);
    assert.strictEqual(engine.state.player.currencies.drachmae, d1);
  });

  await test('Exploit: a natural-20 discovery in the Dev campaign never awards Greek items', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    fixedRoll(engine, 20);
    engine.checkSkill('perception', 'wisdom', 10, 'test');
    const foreign = engine.state.player.inventory.filter(e => !engine.world.items.some(i => i.id === e.itemId));
    assert.deepStrictEqual(plain(foreign.map(f => f.itemId)), []);
  });

  await test('Exploit: pickpocketing the same NPC repeatedly is limited and takes time', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    fixedRoll(engine, 18);
    const d0 = engine.state.player.currencies.drachmae, t0 = engine.getTotalInGameMinutes();
    for (let i = 0; i < 10; i++) engine.attemptPickpocket('npc_dev_merchant_lycus');
    env.flushTimers();
    const gained = engine.state.player.currencies.drachmae - d0;
    assert.ok(gained > 0 && gained <= 17, 'only one successful theft per cooldown, got ' + gained);
    assert.ok(engine.getTotalInGameMinutes() > t0, 'pickpocketing consumes time');
  });

  await test('Exploit: one Venus cast pays out once even if bones are re-rolled', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const d0 = engine.state.player.currencies.drachmae;
    engine.openMinigame('astragaloi');
    const venus = [1, 3, 4, 6].map(v => ({ val: v, name: 'x', face: String(v) }));
    engine.astragaloiState.bones = venus.slice(); engine.astragaloiState.hasCast = true; engine.astragaloiState.rerollsLeft = 2;
    engine.renderAstragaloiTray();
    const origRandom = env.sandbox.Math.random;
    // re-roll die 0 into the same face twice
    env.sandbox.Math.random = () => 0.0; engine.rerollAstragaloi(0); engine.rerollAstragaloi(0);
    env.sandbox.Math.random = origRandom;
    assert.strictEqual(engine.state.player.currencies.drachmae - d0, 6);
  });

  await test('Time: hunting and herbal-compounding minigames consume in-game time', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const t0 = engine.getTotalInGameMinutes();
    engine.openMinigame('stalk'); engine.closeMinigame(false);
    const t1 = engine.getTotalInGameMinutes();
    assert.ok(t1 > t0, 'hunting takes time');
    engine.openMinigame('mortar'); engine.closeMinigame(false);
    assert.ok(engine.getTotalInGameMinutes() > t1, 'compounding takes time');
  });

  // ---------------------------------------------------------------------------
  // Crafting <-> equipment <-> persistence
  // ---------------------------------------------------------------------------
  await test('Crafting: crafted armour adds Armor Class and crafted items survive save/reload', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    ['item_toolkit_smithing', 'mat_cypriot_bronze', 'mat_cypriot_bronze'].forEach(id => engine.addItem(id, 1));
    fixedRoll(engine, 15);
    const res = engine.craftItem('template_shield', 'mat_cypriot_bronze', 'mat_cypriot_bronze', null, 0);
    assert.ok(res.success, 'craft should succeed');
    const ac0 = engine.getPlayerArmorClass();
    const old = engine.state.player.inventory.find(i => i.equipped && i.slot === 'off_hand');
    engine.equipItem(res.item.id);
    const shieldBefore = old ? (engine.getItemData(old.itemId).stats.defenseBonus || 0) : 0;
    assert.ok(engine.getPlayerArmorClass() > ac0 - shieldBefore, 'crafted shield must contribute AC');
    await engine.saveGameSilently(1);
    const engine2 = new env.Engine(); env.sandbox.engine = engine2; await engine2.init();
    const def = engine2.getItemData(res.item.id);
    assert.strictEqual(def.name, res.item.name, 'crafted item definition must persist across reloads');
    assert.ok(def.stats && def.stats.defenseBonus > 0);
  });

  await test('Crafting: a failed attempt keeps the materials (as documented) and missing materials block crafting', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.addItem('item_toolkit_smithing', 1);
    fixedRoll(engine, 1);
    const blocked = engine.craftItem('template_sword', 'mat_cypriot_bronze', 'mat_cypriot_bronze', null, 0);
    assert.strictEqual(blocked.success, false);
    assert.ok(!engine.state.player.inventory.some(i => String(i.itemId).startsWith('crafted_')));
    engine.addItem('mat_cypriot_bronze', 2);
    fixedRoll(engine, 2); // an ordinary failure (a natural 1 is a critical failure, tested separately)
    const failed = engine.craftItem('template_sword', 'mat_cypriot_bronze', 'mat_cypriot_bronze', null, 0);
    assert.strictEqual(failed.success, false);
    assert.strictEqual(failed.critical, null);
    assert.strictEqual(engine.getItemQuantity('mat_cypriot_bronze'), 2, 'materials preserved on an ordinary failure');
  });

  // ---------------------------------------------------------------------------
  // World time & scheduler
  // ---------------------------------------------------------------------------
  await test('Time: the absolute clock is continuous across month and year boundaries', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    engine.state.worldState.time = { hour: 23, minute: 0, day: 30, month: 12, year: 1 };
    const before = engine.getTotalInGameMinutes();
    engine.advanceTime(2, 0);
    assert.strictEqual(engine.getTotalInGameMinutes() - before, 120);
    assert.deepStrictEqual(plain(engine.state.worldState.time), { hour: 1, minute: 0, day: 1, month: 1, year: 2 });
  });

  await test('Scheduler: an event scheduled 2h before a year boundary does not fire early', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    engine.state.worldState.time = { hour: 22, minute: 0, day: 30, month: 12, year: 1 };
    engine.scheduleEvent({ id: 'evt_newyear', inHours: 48, type: 'world_event', setFlags: { newyear: true } });
    engine.advanceTime(4, 0);
    assert.ok(!engine.state.worldState.flags.newyear, 'fired early across the year boundary');
    engine.advanceTime(44, 0);
    assert.ok(engine.state.worldState.flags.newyear);
  });

  await test('Scheduler: recurring events fire once per occurrence during a large time skip and survive failed conditions', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    let fired = 0;
    const orig = engine.dispatchScheduledEvent.bind(engine);
    engine.dispatchScheduledEvent = (e) => { if (e.id === 'evt_tick') fired++; return orig(e); };
    engine.scheduleEvent({ id: 'evt_tick', inHours: 1, recurrenceMinutes: 60, type: 'world_event' });
    engine.advanceTime(5, 0);
    assert.strictEqual(fired, 5);
    engine.scheduleEvent({ id: 'evt_cond', inHours: 1, recurrenceMinutes: 60, type: 'world_event', conditions: { requiresFlag: 'gate' }, setFlags: { gated_ran: true } });
    engine.advanceTime(2, 0);
    assert.ok(engine.state.worldState.scheduledEvents.some(e => e.id === 'evt_cond'), 'recurring event must stay queued while its condition is false');
    engine.state.worldState.flags.gate = true;
    engine.advanceTime(1, 0);
    assert.ok(engine.state.worldState.flags.gated_ran);
  });

  await test('Scheduler: re-scheduling an id that already ran executes again (e.g. repeated respawns)', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    let n = 0;
    const orig = engine.dispatchScheduledEvent.bind(engine);
    engine.dispatchScheduledEvent = (e) => { if (e.id === 'evt_same') n++; return orig(e); };
    engine.scheduleEvent({ id: 'evt_same', inHours: 1, type: 'world_event' });
    engine.advanceTime(2, 0);
    engine.scheduleEvent({ id: 'evt_same', inHours: 1, type: 'world_event' });
    engine.advanceTime(2, 0);
    assert.strictEqual(n, 2);
  });

  await test('Scheduler: manifest consequence rules use the shared scheduler and apply failQuest/piety', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const apollo0 = engine.state.player.piety.apollo || 0;
    engine.emitEvent('ENTITY_DEATH', { entityId: 'npc_timon_pilgrim' });
    assert.strictEqual(engine.state.player.piety.apollo, apollo0 - 2, 'piety outcome applied');
    engine.emitEvent('ENTITY_DEATH', { entityId: 'npc_daidalos_shepherd' });
    assert.strictEqual(engine.state.worldState.quests.quest_tutorial_stolen_ram.failed, true, 'failQuest outcome applied');
    engine.consequenceRules = [{ id: 'r', event: 'X', outcomes: { scheduleEvent: { id: 'evt_x', delayHours: 2, setFlags: { x: 1 } } } }];
    engine.emitEvent('X', {});
    const evt = engine.state.worldState.scheduledEvents.find(e => e.id === 'evt_x');
    assert.ok(evt && evt.triggerTimeMinutes !== undefined, 'consequence events go through scheduleEvent');
  });

  await test('Social: cooldowns survive month rollover and disposition changes persist in the save', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    engine.state.worldState.time = { hour: 22, minute: 0, day: 30, month: 1, year: 1 };
    fixedRoll(engine, 18);
    const r1 = engine.attemptPersuadeNpc('npc_dev_merchant_lycus');
    assert.ok(r1.success);
    engine.advanceTime(5, 0); // into next month
    const r2 = engine.attemptPersuadeNpc('npc_dev_merchant_lycus');
    assert.ok(!r2.blocked, 'cooldown must expire after 5 hours even across a month boundary');
    const saved = JSON.parse(JSON.stringify(engine.state));
    assert.ok(saved.worldState.npcStates.npc_dev_merchant_lycus.disposition >= 20, 'disposition stored in save state');
  });

  // ---------------------------------------------------------------------------
  // NPC death, quests, morality
  // ---------------------------------------------------------------------------
  await test('NPC death: quest failover comes from quest data and the journal item is not duplicated', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    fixedRoll(engine, 15);
    engine.startCombatWithEntity('npc_dev_elena_scholar', 'npc');
    engine.combatSession.enemy.hp = 1;
    engine.combatAction('thrust'); env.flushTimers();
    const q = engine.state.worldState.quests.quest_dev_sunstone_relic;
    assert.strictEqual(q.stage, 'explore_crypt');
    assert.ok(engine.getItemQuantity('item_dev_elena_journal') <= 1);
    assert.ok(engine.state.worldState.permanentNpcDeaths.npc_dev_elena_scholar);
  });

  await test('Dialogue: completing a non-tutorial quest completes that quest (no tutorial side effects)', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const tree = Object.entries(engine.currentAdventure.dialogues).find(([, t]) => Object.values(t.nodes).some(n => n.completeQuest === 'quest_dev_sunstone_relic'));
    const [treeId, t] = tree;
    const nodeId = Object.keys(t.nodes).find(k => t.nodes[k].completeQuest === 'quest_dev_sunstone_relic');
    engine.openDialogue(treeId, nodeId);
    env.flushTimers();
    const w = engine.state.worldState;
    assert.strictEqual(w.quests.quest_dev_sunstone_relic.completed, true);
    assert.ok(!w.flags.tutorial_quest_completed, 'tutorial flag must not be set');
    assert.strictEqual(engine.getItemQuantity('item_votive_bell_hermes'), 0, 'no Greek tutorial reward in Dev campaign');
  });

  await test('Morality: alignment thresholds come from the campaign configuration', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    engine.activeCampaign = Object.assign({}, engine.activeCampaign, { moralityConfig: { enabled: true, tiers: { heroic: 50, pragmatic: -15, ruthless: -40 } } });
    engine.state.player.morality = { virtue: 40, hubris: 0 };
    assert.strictEqual(engine.getMoralityAlignment(), 'pragmatic');
  });

  await test('Defeat: the hero recovers at a location that exists in the active campaign', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    engine.handlePlayerDefeat();
    const id = engine.state.worldState.currentLocationId;
    assert.ok(engine.world.locations.some(l => l.id === id), 'defeat location must exist, got ' + id);
  });

  await test('Ambush: rest/travel ambushes use creatures from the active campaign', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const cid = engine.getAmbushCreatureId(engine.getLocation('loc_dev_whispering_woods'));
    assert.ok(engine.getCreature(cid), 'ambush creature must exist in campaign: ' + cid);
  });

  // ---------------------------------------------------------------------------
  // UI text
  // ---------------------------------------------------------------------------
  await test('UI: plain-text labels never show raw HTML entities', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.walkthroughStep = engine.walkthroughSteps.length - 1; engine.renderWalkthroughStep();
    engine.renderAll();
    engine.startCombat('creature_cithaeron_wolf');
    const texts = ['wt-btn-next', 'hud-hero-origin', 'sheet-hero-origin', 'combat-player-archetype', 'btn-combat-shield'].map(id => env.el(id).innerText);
    texts.forEach(t => assert.ok(!/&[a-z]+;/.test(t), 'raw entity in: ' + t));
    assert.ok(!/BG_|_/.test(env.el('hud-hero-origin').innerText), 'HUD should show readable names: ' + env.el('hud-hero-origin').innerText);
  });

  // ---------------------------------------------------------------------------
  // Second audit pass (2026-11-11, part 2): regressions for issues found after the first pass
  // ---------------------------------------------------------------------------
  const setConfirm = (env, answer) => { env.sandbox.confirm = () => answer; };
  const slotName = (env, n) => { const raw = env.storage[`gm_save_slot_${n}`]; return raw ? JSON.parse(raw).player.name : null; };

  await test('Save safety: launching another campaign mid-game keeps the current game and uses a free slot', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.state.player.name = 'GreekHero';
    engine.advanceTime(3, 0); // unsaved progress
    // Cancelling the confirmation leaves the running game untouched
    setConfirm(env, false);
    engine.openCampaignSelectView(); engine.selectCampaign('campaign_dev_test');
    assert.strictEqual(await engine.confirmCampaignSelection(), false);
    assert.strictEqual(engine.state.player.name, 'GreekHero');
    assert.strictEqual(engine.activeCampaignId, 'campaign_greek_mythology');
    // Confirming starts the new game in a free slot; the Greek game (with its latest progress) stays in Slot 1
    setConfirm(env, true);
    await startCampaign(env, engine, 'campaign_dev_test');
    await new Promise(r => setTimeout(r, 5));
    assert.strictEqual(slotName(env, 1), 'GreekHero', 'Slot 1 must still hold the Greek game');
    assert.strictEqual(JSON.parse(env.storage.gm_save_slot_1).worldState.time.hour, engine.getInitialState().worldState.time.hour + 3);
    assert.strictEqual(engine.state.saveSlot, 2);
    assert.strictEqual(JSON.parse(env.storage.gm_save_slot_2).worldState.campaignId, 'campaign_dev_test');
  });

  await test('Save safety: importing a save never overwrites the slot number stored in the file', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const precious = JSON.parse(JSON.stringify(engine.state)); precious.player.name = 'PreciousSlot2'; precious.saveSlot = 2;
    env.storage.gm_save_slot_2 = JSON.stringify(precious);
    const file = JSON.parse(JSON.stringify(engine.state)); file.player.name = 'Imported'; file.saveSlot = 2;
    await engine.importSaveState(file);
    await engine.autosave();
    assert.strictEqual(slotName(env, 2), 'PreciousSlot2', 'unrelated game in Slot 2 must survive the import');
    assert.strictEqual(engine.state.saveSlot, 3);
    assert.strictEqual(slotName(env, 3), 'Imported');
  });

  await test('Save safety: saving over another game asks first, and loading another slot keeps current progress', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.state.player.name = 'Current';
    await engine.autosave();
    const other = JSON.parse(JSON.stringify(engine.state)); other.player.name = 'Other'; other.saveSlot = 2;
    env.storage.gm_save_slot_2 = JSON.stringify(other);
    setConfirm(env, false);
    assert.strictEqual(await engine.saveGame(2), false);
    assert.strictEqual(slotName(env, 2), 'Other');
    setConfirm(env, true);
    engine.state.player.name = 'CurrentProgress';
    await engine.loadGame(2);
    assert.strictEqual(slotName(env, 1), 'CurrentProgress', 'the game being left is saved in its own slot');
    assert.strictEqual(engine.state.player.name, 'Other');
  });

  await test('Campaign browsing: highlighting another campaign does not change the running game\'s rules', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.openCampaignSelectView();
    engine.selectCampaign('campaign_dev_test');
    engine.switchView('view-story');
    assert.strictEqual(engine.activeCampaignId, 'campaign_greek_mythology');
    assert.strictEqual(engine.usesDefaultContentFallbacks(), true);
    assert.ok(engine.getCampaignOrigins().some(o => o.id === 'boeotia'));
  });

  await test('Encounters: one-time encounters cannot be farmed; repeatable ones wait for their cooldown', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const win = (encId) => {
      const enc = engine.world.encounters.find(e => e.id === encId);
      engine.state.worldState.currentLocationId = enc.locationId;
      const card = engine.getContextualActionGroups().flatMap(g => g.actions).find(a => a.id === `act_enc_${encId}`);
      if (!card) return false;
      fixedRoll(engine, 20);
      engine.state.player.vitals.health = engine.state.player.vitals.maxHealth = 500;
      card.handler();
      engageFight(engine);
      while (engine.combatSession) { engine.combatSession.enemy.hp = 1; engine.combatAction('thrust'); env.flushTimers(); }
      return true;
    };
    assert.ok(win('enc_dev_shadow_stalker'));
    const xpAfterFirst = engine.state.player.xp;
    assert.strictEqual(win('enc_dev_shadow_stalker'), false, 'a non-repeatable encounter is offered once');
    engine.startCombatEncounter('enc_dev_shadow_stalker');
    assert.strictEqual(engine.combatSession, null, 'and cannot be started through an action either');
    assert.strictEqual(engine.state.player.xp, xpAfterFirst);
    assert.ok(win('enc_dev_crypt_boss'));
    assert.strictEqual(win('enc_dev_crypt_boss'), false, 'repeatable boss waits for its cooldown');
    engine.advanceTime(25, 0);
    assert.ok(win('enc_dev_crypt_boss'), 'repeatable boss returns after its cooldown');
    // Documented triggerCondition
    engine.world.encounters.push({ id: 'enc_gated', locationId: 'loc_dev_haven', creatureId: 'creature_dev_wild_boar', triggerCondition: { flag: 'gate_open', expected: true } });
    assert.strictEqual(engine.isEncounterAvailable(engine.world.encounters.find(e => e.id === 'enc_gated')), false);
    engine.setWorldFlags({ gate_open: true });
    assert.strictEqual(engine.isEncounterAvailable(engine.world.encounters.find(e => e.id === 'enc_gated')), true);
  });

  await test('World events: events.json triggers fire once (FLAG_SET, ITEM_ACQUIRED) and the ledger is saved', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    assert.ok(engine.world.events.length >= 2, 'Dev events.json is loaded');
    engine.emitEvent('ENTITY_DEATH', { entityId: 'npc_dev_merchant_lycus' }); // consequence rule sets merchant_lycus_dead
    assert.strictEqual(engine.state.worldState.flags.merchant_lycus_dead, true);
    assert.strictEqual(engine.state.worldState.flags.haven_under_curfew, true, 'FLAG_SET world event applied its outcome');
    const v = engine.state.player.vitals;
    v.health = 5;
    engine.addItem('item_dev_sunstone_relic', 1);
    assert.strictEqual(v.health, 15, 'ITEM_ACQUIRED world event restores 10 Health');
    engine.addItem('item_dev_sunstone_relic', 1);
    assert.strictEqual(v.health, 15, 'one-time event does not fire twice');
    const reloaded = engine.migrateState(JSON.parse(JSON.stringify(engine.state)));
    assert.ok(reloaded.worldState.firedWorldEvents.event_dev_sunstone_radiance !== undefined, 'fired events persist in the save');
  });

  await test('Scheduler: quest deadlines move stages through the quest system and failures cancel later milestones', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState;
    if (!w.quests.quest_dev_urgent_rescue) engine.startQuest('quest_dev_urgent_rescue');
    engine.advanceTime(49, 0);
    const q = w.quests.quest_dev_urgent_rescue;
    assert.strictEqual(q.stage, 'stage_hostage_moved');
    const qDef = engine.getQuestDefinition('quest_dev_urgent_rescue');
    (qDef.stages.stage_hostage_moved.objectives || []).forEach(o => assert.ok(q.objectives[o.id], 'objective of the new stage is shown: ' + o.id));
    // A failing milestone cancels the quest's remaining milestones
    engine.startQuest('quest_dev_boar_menace');
    engine.scheduleEvent({ id: 'quest_ms_quest_dev_boar_menace_1', type: 'quest_deadline', questId: 'quest_dev_boar_menace', inHours: 1, payload: { failQuest: true } });
    engine.scheduleEvent({ id: 'quest_ms_quest_dev_boar_menace_5', type: 'quest_deadline', questId: 'quest_dev_boar_menace', inHours: 5, payload: { setFlags: { should_not_happen: true } } });
    engine.advanceTime(2, 0);
    assert.strictEqual(w.quests.quest_dev_boar_menace.failed, true);
    assert.ok(!w.scheduledEvents.some(e => e.questId === 'quest_dev_boar_menace'), 'remaining milestones cancelled');
  });

  await test('Respawn: killing the same creature twice leaves one pending respawn event', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    for (let i = 0; i < 2; i++) {
      engine.startCombat('creature_dev_wild_boar', {});
      engine.combatSession.enemy.hp = 0; engine.handleCombatVictory();
    }
    const pending = engine.state.worldState.scheduledEvents.filter(e => e.type === 'creature_respawn' && e.targetId === 'creature_dev_wild_boar');
    assert.strictEqual(pending.length, 1);
  });

  await test('Skills: athletics exists, background training applies, heaving uses it, level-up offers it, old saves migrate', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    const bg = readJson('content/campaigns/greek_mythology/backgrounds.json').backgrounds.find(b => (b.proficiencies || []).includes('athletics'));
    await startCampaign(env, engine, 'campaign_greek_mythology', { backgroundId: bg.id });
    const p = engine.state.player;
    assert.strictEqual(p.skills.athletics, 2, `${bg.id} trains athletics`);
    let rolled = null;
    const orig = engine.checkSkill.bind(engine);
    engine.checkSkill = (skill, attr, dc, label) => { rolled = skill; return orig(skill, attr, dc, label); };
    engine.world.interactiveObjects.push({ id: 'obj_test_boulder', name: 'Test Boulder', type: 'obstacle', locationId: engine.state.worldState.currentLocationId, isPickable: false, heaveDc: 30 });
    engine.buildContentMaps();
    engine.heaveObstacle('obj_test_boulder');
    assert.strictEqual(rolled, 'athletics');
    engine.triggerLevelUp(); engine.renderLevelUpModal();
    assert.ok(env.el('levelup-skill-options').innerHTML.includes('Athletics'), 'level-up lists every skill');
    const old = JSON.parse(JSON.stringify(engine.state)); old.version = '1.4.0'; delete old.player.skills.athletics;
    assert.strictEqual(engine.migrateState(old).player.skills.athletics, 2, 'old hero keeps the promised background bonus');
  });

  await test('Time: lockpicking and heaving take time; an open lock gives no second XP award', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const obj = engine.world.interactiveObjects.find(o => o.isPickable !== false && !engine.isObjectOpen(o));
    engine.state.worldState.currentLocationId = obj.locationId;
    engine.addItem('item_dev_iron_lockpick', 1);
    fixedRoll(engine, 5);
    const t0 = engine.getTotalInGameMinutes();
    engine.attemptLockpick(obj.id);
    assert.ok(engine.getTotalInGameMinutes() > t0, 'a lockpick attempt takes time');
    fixedRoll(engine, 20);
    engine.attemptLockpick(obj.id);
    const xp = engine.state.player.xp;
    engine.attemptLockpick(obj.id);
    assert.strictEqual(engine.state.player.xp, xp, 'no XP for picking an already open lock');
  });

  await test('Level-up: a pending level-up is offered again after the game is loaded', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.state.player.xp = engine.state.player.xpNext + 5;
    await engine.saveGameSilently(1);
    const engine2 = new env.Engine(); env.sandbox.engine = engine2; await engine2.init(); env.flushTimers();
    assert.ok(engine2.levelUpState && engine2.levelUpState.nextLevel === 2, 'level-up window reopened on resume');
  });

  await test('Progression: campaigns can define XP thresholds and titles; other campaigns get neutral titles', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    assert.ok(!/Ephebos|Hellas|Hoplite/.test(engine.state.player.heroTitle), 'no Greek title in Dev campaign: ' + engine.state.player.heroTitle);
    engine.activeCampaign = Object.assign({}, engine.activeCampaign, { progression: { xpTable: { 1: 80 }, levelTitles: { 1: 'Recruit', 2: 'Scout' } } });
    assert.strictEqual(engine.getXPForNextLevel(1), 80);
    assert.strictEqual(engine.getXPForNextLevel(2), 250, 'missing entries use the defaults');
    assert.strictEqual(engine.getLevelTitle(2), 'Scout');
  });

  await test('Morality: the documented alignmentTiers format and campaign labels are honoured', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    engine.activeCampaign = Object.assign({}, engine.activeCampaign, { moralityConfig: { virtueLabel: 'Honor', alignmentTiers: { heroic: { minScore: 40, title: 'Paragon' } } } });
    engine.state.player.morality = { virtue: 35, hubris: 0 };
    assert.strictEqual(engine.getMoralityAlignment(), 'pragmatic');
    engine.state.player.morality = { virtue: 45, hubris: 0 };
    assert.strictEqual(engine.getMoralitySummary().title, 'Paragon');
    assert.strictEqual(engine.getMoralityConfig().virtueLabel, 'Honor');
  });

  await test('Equipment: item attribute/skill bonuses and damage reduction are applied by the shared rules', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const p = engine.state.player;
    p.attributes.wisdom = 11; // modifier 0 -> 12 gives +1
    fixedRoll(engine, 10);
    const before = engine.checkSkill('mythology_lore', 'wisdom', 99, 't').total;
    engine.addItem('item_delphic_laurel_wreath', 1); engine.equipItem('item_delphic_laurel_wreath');
    const after = engine.checkSkill('mythology_lore', 'wisdom', 99, 't').total;
    assert.strictEqual(after - before, 1, 'wisdomBonus raises the modifier');
    engine.addItem('item_signet_ring_plataea', 1); engine.equipItem('item_signet_ring_plataea');
    const pers = engine.checkSkill('persuasion', 'charisma', 99, 't').total;
    engine.unequipItem('item_signet_ring_plataea');
    assert.strictEqual(pers - engine.checkSkill('persuasion', 'charisma', 99, 't').total, 1, 'persuasionBonus applies');
    // Damage reduction
    engine.addItem('item_nemean_pelt_fragment', 1); engine.equipItem('item_nemean_pelt_fragment');
    engine.startCombat({ id: 'x', name: 'Test Brute', vitals: { health: 99, maxHealth: 99 }, armorClass: 30, actions: [{ name: 'Smash', style: 'normal', attackBonus: 50, damage: '5' }] });
    p.vitals.health = 50; p.vitals.maxHealth = 50;
    fixedRoll(engine, 2);
    engine.combatAction('thrust');
    assert.strictEqual(p.vitals.health, 47, 'flat 5 damage minus 2 reduction (the old parser read "5" as 5d6)');
    assert.strictEqual(engine.rollDamageExpression('1d1-1'), 0);
  });

  await test('Save migration: v1.3 saves in year 2 keep event timings exact for events created in either year', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const oldClock = (y, m, d, h) => ((y * 365 + m * 30 + d) * 24 + h) * 60;
    const old = JSON.parse(JSON.stringify(engine.state));
    old.version = '1.3.0';
    old.worldState.time = { year: 2, month: 1, day: 2, hour: 0, minute: 0 };
    old.worldState.scheduledEvents = [
      // created on the last day of year 1, due 3 days later (in year 2)
      { id: 'from_y1', type: 'world_event', createdAtMinutes: oldClock(1, 12, 30, 0), triggerTimeMinutes: oldClock(1, 12, 30, 0) + 3 * 1440 },
      // created in year 2, due 1 day later
      { id: 'from_y2', type: 'world_event', createdAtMinutes: oldClock(2, 1, 1, 0), triggerTimeMinutes: oldClock(2, 1, 1, 0) + 1440 },
    ];
    const s = engine.migrateState(old);
    engine.state = s;
    const newClock = (y, m, d, h) => { engine.state.worldState.time = { year: y, month: m, day: d, hour: h, minute: 0 }; return engine.getTotalInGameMinutes(); };
    const due = (id) => s.worldState.scheduledEvents.find(e => e.id === id).triggerTimeMinutes;
    assert.strictEqual(due('from_y1'), newClock(1, 12, 30, 0) + 3 * 1440);
    assert.strictEqual(due('from_y2'), newClock(2, 1, 1, 0) + 1440);
  });

  await test('Narration: ambushes in a non-Greek campaign never describe a mountain wolf', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const logs = [];
    const orig = engine.logTranscript.bind(engine);
    engine.logTranscript = (sp, text, cls) => { logs.push(String(text)); return orig(sp, text, cls); };
    fixedRoll(engine, 1);
    engine.state.worldState.currentLocationId = 'loc_dev_whispering_woods';
    const conn = { name: 'Test Trail', staminaCost: 1, travelHours: 1, distanceKm: 1, dangerRating: 3 };
    engine.executeTravel(engine.getLocation('loc_dev_haven'), conn);
    env.flushTimers();
    assert.ok(logs.length > 0);
    assert.ok(!logs.some(t => /mountain wolf|grey fur/i.test(t)), 'Greek wolf prose leaked: ' + logs.join(' | '));
    assert.ok(engine.confrontation, 'the ambush still happens (as a confrontation: spotted in time, the hero has the initiative)');
    assert.ok(!/mountain wolf|grey fur/i.test(engine.confrontation.intro || ''), 'confrontation prose is campaign-neutral');
    engageFight(engine);
    assert.ok(engine.combatSession, 'standing to fight starts the combat');
  });

  await test('Travel: every location of both campaigns can be reached through the travel cards; path predicates are enforced', async () => {
    for (const campaignId of ['campaign_greek_mythology', 'campaign_dev_test']) {
      const env = createSandbox();
      const engine = await bootEngine(env);
      await startCampaign(env, engine, campaignId);
      if (campaignId === 'campaign_dev_test') engine.setWorldFlags({ discovered_sunken_grotto: true });
      const seen = new Set([engine.state.worldState.currentLocationId]);
      const queue = [...seen];
      while (queue.length) {
        const here = queue.shift();
        engine.state.worldState.currentLocationId = here;
        const cards = engine.getContextualActionGroups().flatMap(g => g.actions).filter(a => a.id.startsWith('act_travel_'));
        for (const card of cards) {
          engine.state.worldState.currentLocationId = here;
          engine.state.player.vitals.stamina = engine.state.player.vitals.maxStamina = 99;
          card.handler(); env.flushTimers(); engine.combatSession = null;
          const now = engine.state.worldState.currentLocationId;
          if (!seen.has(now)) { seen.add(now); queue.push(now); }
        }
      }
      assert.strictEqual(seen.size, engine.world.locations.length, `${campaignId}: reachable ${[...seen].join(', ')}`);
    }
    // A road with an unmet requiresFlag is neither offered nor travellable
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    engine.state.worldState.currentLocationId = 'loc_dev_whispering_woods';
    assert.ok(!engine.getContextualActionGroups().flatMap(g => g.actions).some(a => a.id === 'act_travel_loc_dev_sunken_grotto'));
    const conn = engine.getLocation('loc_dev_whispering_woods').connections.find(c => c.targetLocationId === 'loc_dev_sunken_grotto');
    engine.executeTravel(engine.getLocation('loc_dev_sunken_grotto'), conn);
    assert.strictEqual(engine.state.worldState.currentLocationId, 'loc_dev_whispering_woods');
  });

  await test('Objects: authored unlockOutcomes apply once (Dev boulder opens the grotto path and completes its quest)', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState;
    if (!w.quests.quest_dev_grotto_mystery) engine.startQuest('quest_dev_grotto_mystery');
    engine.state.worldState.currentLocationId = 'loc_dev_whispering_woods';
    const xp0 = engine.state.player.xp;
    fixedRoll(engine, 19); // a success that is not a natural 20 (which would add a discovery cache)
    const questXp = engine.getQuestDefinition('quest_dev_grotto_mystery').rewards.experience;
    const d0 = engine.state.player.currencies.drachmae;
    engine.heaveObstacle('obj_boulder_seal');
    assert.strictEqual(w.flags.discovered_sunken_grotto, true, 'unlockOutcome flag set');
    assert.strictEqual(w.quests.quest_dev_grotto_mystery.completed, true, 'quest completed by the boulder');
    assert.strictEqual(engine.state.player.xp - xp0, 30 + questXp, 'authored XP replaces the generic award (not both); the quest pays its rewards');
    assert.strictEqual(engine.state.player.currencies.drachmae - d0, 15, 'quest drachmae paid once');
    engine.heaveObstacle('obj_boulder_seal');
    assert.strictEqual(engine.state.player.xp - xp0, 30 + questXp, 'no second award');
    assert.ok(engine.getContextualActionGroups().flatMap(g => g.actions).some(a => a.id === 'act_travel_loc_dev_sunken_grotto'), 'grotto road now open');
  });

  await test('UI: crafting header shows the bonus the crafting roll actually uses', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.state.player.attributes.strength = 16;
    engine.currentCraftingProfession = 'metalworking';
    engine.renderCraftingView();
    assert.strictEqual(env.el('crafting-fieldcraft-badge').innerText, 'd20 + 3 (Strength)');
  });

  // ---------------------------------------------------------------------------
  // Universal D20 criticals & Reliable Talent
  // ---------------------------------------------------------------------------
  const rollSeq = (engine, values) => { const q = [...values]; engine.rollD20 = () => (q.length ? q.shift() : 10); };

  await test('D20: criticals come from the natural die, never from the modified total', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const r = (natural, modifier, dc) => plain(engine.resolveD20({ natural, modifier, dc }));
    let x = r(1, 15, 5);
    assert.ok(x.isCriticalFailure && x.success === false, 'natural 1 + 15 is a critical failure even against DC 5');
    x = r(20, 2, 30);
    assert.ok(x.isCriticalSuccess && x.success === true, 'natural 20 + 2 is a critical success even against DC 30');
    x = r(10, 8, 15);
    assert.ok(!x.critical && x.total === 18 && x.success, 'natural 10 + 8 = ordinary 18');
    x = r(10, 10, 25);
    assert.ok(!x.isCriticalSuccess && x.total === 20, 'a modified total of 20 is not a critical success');
    x = r(2, -1, 5);
    assert.ok(!x.isCriticalFailure && x.total === 1 && x.success === false, 'a modified total of 1 is an ordinary failure');
  });

  await test('D20: Reliable Talent lifts natural 1-5 to 6 on a mastered non-combat skill only', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const p = engine.state.player;
    p.skills.persuasion = engine.getReliableTalentThreshold('persuasion');
    p.skills.deception = 2;
    p.skills.melee_combat = 30;
    assert.strictEqual(engine.getReliableTalentThreshold('melee_combat'), null, 'combat skills never qualify');
    for (let n = 1; n <= 20; n++) {
      const x = engine.resolveD20({ natural: n, modifier: 0, dc: 10, skill: 'persuasion' });
      assert.strictEqual(x.effective, n < 6 ? 6 : n, `natural ${n}`);
      assert.strictEqual(x.isCriticalFailure, false, `no critical failure at natural ${n}`);
      assert.strictEqual(x.isCriticalSuccess, n === 20);
    }
    assert.strictEqual(engine.resolveD20({ natural: 1, dc: 10, skill: 'deception' }).isCriticalFailure, true, 'deception is not covered by persuasion mastery');
    assert.strictEqual(engine.resolveD20({ natural: 1, dc: 10, skill: 'melee_combat' }).isCriticalFailure, true, 'combat skill rolls keep critical failures');
    // Through the real persuasion action: a natural 3 is treated as 6 and cannot fumble
    fixedRoll(engine, 3);
    const before = engine.getNpcDisposition('npc_dev_merchant_lycus');
    const res = engine.attemptPersuadeNpc('npc_dev_merchant_lycus');
    assert.strictEqual(res.critical, null);
    assert.ok(engine.getNpcDisposition('npc_dev_merchant_lycus') >= before, 'no critical-failure offence');
    // A failed check is still possible against a hard DC (no automatic success)
    p.skills.persuasion = engine.getReliableTalentThreshold('persuasion');
    assert.strictEqual(engine.resolveD20({ natural: 1, modifier: 0, dc: 40, skill: 'persuasion' }).success, false);
  });

  await test('D20: critical consequences are contextual (social, stealing, lockpicking, exploration, crafting)', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const npc = 'npc_dev_merchant_lycus';
    // Persuasion: critical success = ordinary +10 plus an extra +10
    const d0 = engine.getNpcDisposition(npc);
    fixedRoll(engine, 20);
    engine.attemptPersuadeNpc(npc);
    assert.strictEqual(engine.getNpcDisposition(npc) - d0, 20);
    // Deception: critical failure = ordinary -10 plus an extra -10 and a reputation loss
    engine.advanceTime(5, 0);
    const d1 = engine.getNpcDisposition(npc);
    const rep0 = engine.getFactionReputation('faction_dev_haven');
    fixedRoll(engine, 1);
    const dec = engine.attemptDeceiveNpc(npc);
    assert.strictEqual(dec.critical, 'failure');
    assert.strictEqual(engine.getNpcDisposition(npc) - d1, -20);
    assert.ok(engine.getFactionReputation('faction_dev_haven') < rep0);
    // Pickpocket: a critical success doubles the haul
    const npc2 = 'npc_dev_guard_captain';
    const purse0 = engine.state.player.currencies.drachmae;
    rollSeq(engine, [20]);
    const realRandom = env.sandbox.Math.random;
    env.sandbox.Math.random = () => 0; // minimum base haul (6)
    try { engine.attemptPickpocket(npc2); } finally { env.sandbox.Math.random = realRandom; }
    assert.strictEqual(engine.state.player.currencies.drachmae - purse0, 12, 'minimum haul 6, doubled');
    // Exploration: a critical failure costs stamina and time on top of the failure
    const st0 = engine.state.player.vitals.stamina, t0 = engine.getTotalInGameMinutes();
    fixedRoll(engine, 1);
    const chk = engine.checkSkill('investigation', 'intelligence', 5, 'Test');
    assert.ok(chk.isAte && !chk.success);
    assert.strictEqual(st0 - engine.state.player.vitals.stamina, 2);
    assert.strictEqual(engine.getTotalInGameMinutes() - t0, 15);
    // Ordinary failure: no extra consequence
    const st1 = engine.state.player.vitals.stamina;
    fixedRoll(engine, 2);
    const ord = engine.checkSkill('investigation', 'intelligence', 99, 'Test');
    assert.ok(!ord.success && !ord.critical && engine.state.player.vitals.stamina === st1);
    // Lockpicking: a critical failure snaps the pick
    const door = engine.getInteractiveObject('obj_treasury_iron_door');
    engine.state.worldState.currentLocationId = door.locationId;
    engine.addItem('item_dev_iron_lockpick', 1);
    const picks = engine.getItemQuantity('item_dev_iron_lockpick');
    fixedRoll(engine, 1);
    engine.attemptLockpick(door.id);
    assert.strictEqual(engine.getItemQuantity('item_dev_iron_lockpick'), picks - 1);
  });

  await test('D20: crafting criticals use the natural die even with a minigame bonus', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.addItem('item_toolkit_smithing', 1);
    engine.addItem('mat_cypriot_bronze', 4);
    engine.state.player.attributes.strength = 30; // +10, would beat the DC on any roll
    fixedRoll(engine, 1);
    const bad = engine.craftItem('template_sword', 'mat_cypriot_bronze', 'mat_cypriot_bronze', null, 3);
    assert.strictEqual(bad.success, false, 'a natural 1 fails despite +13');
    assert.strictEqual(bad.critical, 'failure');
    assert.strictEqual(engine.getItemQuantity('mat_cypriot_bronze'), 3, 'one material ruined');
    engine.state.player.attributes.strength = 3; // -4
    fixedRoll(engine, 20);
    const good = engine.craftItem('template_sword', 'mat_cypriot_bronze', 'mat_cypriot_bronze', null, 0);
    assert.ok(good.success && good.quality.name === 'Masterwork', 'a natural 20 is a masterwork even with a penalty');
  });

  await test('D20: creatures and the hero share combat criticals; Reliable Talent never applies to attacks', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const p = engine.state.player;
    p.skills.melee_combat = 40;
    const brute = { id: 'x', name: 'Test Brute', vitals: { health: 999, maxHealth: 999 }, armorClass: 5, actions: [{ name: 'Smash', style: 'normal', attackBonus: 0, damage: '1' }] };
    p.vitals.health = p.vitals.maxHealth = 100;
    engine.startCombat(brute);
    rollSeq(engine, [1, 1]); // hero fumbles (despite +40), creature fumbles
    engine.combatAction('thrust');
    assert.strictEqual(engine.combatSession.enemy.hp, 999, 'natural 1 misses even with a huge modifier');
    assert.strictEqual(engine.combatSession.playerBonus, 2, 'creature fumble gives the hero +2 on the next strike');
    rollSeq(engine, [10, 20]); // hero hits normally, creature crits
    engine.combatAction('thrust');
    assert.strictEqual(p.vitals.health, 100 - (1 + 4), 'creature critical hit: +4 damage');
    rollSeq(engine, [1, 10]);
    engine.combatAction('thrust');
    assert.strictEqual(engine.combatSession.enemyBonus, 0, 'the hero\'s fumble bonus is used by the next enemy attack');
  });

  await test('D20: campaigns configure criticals, Reliable Talent skills and thresholds; mastery survives save/load', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    engine.activeCampaign = Object.assign({}, engine.activeCampaign, { d20Rules: {
      reliableTalent: { eligibleSkills: ['stealth'], thresholds: { stealth: 3 } },
      criticalOutcomes: { exploration: { failure: { loseStamina: 5, text: 'Custom fumble.' } } }
    } });
    const p = engine.state.player;
    p.skills.stealth = 3; p.skills.persuasion = 20;
    assert.strictEqual(engine.hasReliableTalent('stealth'), true);
    assert.strictEqual(engine.hasReliableTalent('persuasion'), false, 'only the configured skills qualify');
    const st0 = p.vitals.stamina;
    fixedRoll(engine, 1);
    engine.checkSkill('investigation', 'intelligence', 10, 'Test');
    assert.strictEqual(st0 - p.vitals.stamina, 5, 'campaign outcome replaces the default');
    // A content action can define its own critical outcome
    const before = engine.state.player.currencies.drachmae;
    fixedRoll(engine, 20);
    engine.executeGenericAction({ handlerType: 'skill_check', skillCheck: { skill: 'investigation', attribute: 'intelligence', dc: 10, criticalSuccess: { giveDrachmae: 7 } } });
    assert.strictEqual(engine.state.player.currencies.drachmae - before, 7);
    // Criticals can be switched off by a campaign
    engine.activeCampaign = Object.assign({}, engine.activeCampaign, { d20Rules: { criticals: false } });
    assert.strictEqual(engine.resolveD20({ natural: 1, modifier: 20, dc: 10 }).success, true);
    // Save / load keeps the ranks (Reliable Talent is derived from them); old saves get a deception skill
    await engine.saveGameSilently(1);
    const engine2 = new env.Engine(); env.sandbox.engine = engine2; await engine2.init();
    assert.strictEqual(engine2.state.player.skills.stealth, 3);
    const old = JSON.parse(JSON.stringify(engine2.state)); old.version = '1.5.0'; delete old.player.skills.deception; old.player.skills.persuasion = 7;
    assert.strictEqual(engine2.migrateState(old).player.skills.deception, 7, 'deception inherits the persuasion rank it used to roll');
    // Default threshold reached through level-ups shows on the character sheet
    engine2.state.player.skills.medicine = engine2.getReliableTalentThreshold('medicine');
    engine2.renderCharacterSheet();
    assert.ok(env.el('sheet-skills-list').innerHTML.includes('Reliable'));
  });

  // ---------------------------------------------------------------------------
  // Creation catalogs, grouped action deck, resizable layout
  // ---------------------------------------------------------------------------
  await test('Creation: origins and traits load per campaign like classes, and shared files are reusable', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test', { origin: 'haven_born', trait: 'eloquent' });
    assert.deepStrictEqual(plain(engine.getCampaignOrigins().map(o => o.id)), ['wanderer', 'haven_born', 'frontier_raised'], 'shared + Dev origin files merged');
    assert.deepStrictEqual(plain(engine.getCreationTraits().map(t => t.id)), ['vigilant', 'eloquent', 'resolute'], 'Dev reuses the shared trait file');
    const p = engine.state.player;
    assert.strictEqual(p.skills.persuasion, engine.getInitialState().player.skills.persuasion + 1, 'origin perk applied from data');
    assert.strictEqual(engine.getTraitCheckBonus('deception', 'charisma'), 2, 'trait bonus comes from trait data');
    await startCampaign(env, engine, 'campaign_greek_mythology', { trait: 'pious' });
    assert.deepStrictEqual(plain(engine.getCreationTraits().map(t => t.id)), ['vigilant', 'pious', 'eloquent', 'resolute']);
    assert.strictEqual(engine.getTraitValue('libationMultiplier'), 2);
    assert.ok(engine.state.player.piety.hermes >= 2, 'pious piety perk applied');
    // Old saves store traits without mechanics: they are resolved by id
    engine.state.player.traits = [{ id: 'vigilant', name: 'Vigilant Scout', desc: '' }];
    assert.strictEqual(engine.getTraitCheckBonus('tracking', 'wisdom'), 2);
  });

  await test('Action deck: one openable list per NPC / creature / object / place; a single action stays a button', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const loc = engine.getLocation(engine.state.worldState.currentLocationId);
    const groups = {};
    engine.getContextualActionGroups().flatMap(g => g.actions).forEach(a => {
      const e = engine.getActionEntity(a, loc); (groups[`${e.kind}:${e.id}`] = groups[`${e.kind}:${e.id}`] || []).push(a.id);
    });
    assert.deepStrictEqual(groups['npc:npc_dev_merchant_lycus'].map(id => id.split('_')[1]).sort(),
      ['attack', 'deceive', 'persuade', 'pickpocket', 'rumour', 'talk', 'trade'], 'talk, trade, rumours, persuade, deceive, attack and pickpocket grouped under Lycus');
    assert.strictEqual(groups['object:obj_treasury_iron_door'].length, 1);
    assert.ok(groups['place:loc_dev_whispering_woods'], 'travel belongs to the destination');
    // Rendering ("lists" layout): details elements for multi-action entities, plain cards otherwise
    engine.setUiSize('actionLayout', 'lists');
    const created = [];
    const origCreate = env.sandbox.document.createElement;
    env.sandbox.document.createElement = (tag) => { const el = origCreate(tag); created.push(el); return el; };
    engine.renderStoryPanel();
    env.sandbox.document.createElement = origCreate;
    const details = created.filter(el => el.tagName === 'DETAILS' && el.className === 'action-entity-group');
    assert.strictEqual(details.length, 5, 'four NPC lists (Lycus, Valerius, Elena, Brannoch) and Haven itself (search, rest)');
    assert.strictEqual(created.filter(el => el.tagName === 'DETAILS' && el.className === 'risky-acts').length, 4, 'attack and pickpocket tucked behind a toggle per NPC');
    engine.setUiSize('actionLayout', null);
    assert.ok(created.filter(el => el.tagName === 'BUTTON').length >= 9 + 6);
    // Greek tutorial: "Speak with Elder Daidalos" joins Daidalos' list
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const gl = engine.getLocation(engine.state.worldState.currentLocationId);
    const talk = engine.getContextualActionGroups().flatMap(g => g.actions).find(a => /Speak with Elder Daidalos/.test(a.title));
    assert.strictEqual(engine.getActionEntity(talk, gl).id, 'npc_daidalos_shepherd');
  });

  await test('Action menu: next steps, focus panel with compact tiles, friendly vs hostile acts, layout setting', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const loc = engine.getLocation('loc_dev_haven');
    assert.strictEqual(engine.getActionLayout(), 'focus', 'focus panel is the default');
    const actions = () => engine.getContextualActionGroups().flatMap(g => g.actions);
    // Next steps: the main quest is active, so talking to Elena (who starts it properly) is a next step
    let steps = engine.getNextStepActions(actions()).map(x => x.act.id);
    assert.ok(steps.includes('act_talk_npc_dev_elena_scholar'), steps.join(','));
    // Focusing another quest narrows the strip to it; its encounter is elsewhere, so the road there is offered
    engine.openDialogue('dialogue_dev_captain', 'node_boar_bounty'); engine.closeDialogue();
    engine.toggleQuestFocus('quest_dev_boar_menace');
    steps = engine.getNextStepActions(actions()).map(x => x.act.id);
    assert.deepStrictEqual(plain(steps), ['act_travel_loc_dev_whispering_woods']);
    engine.state.worldState.currentLocationId = 'loc_dev_whispering_woods';
    assert.deepStrictEqual(plain(engine.getNextStepActions(actions()).map(x => x.act.id)), ['act_enc_enc_dev_wild_boar']);
    engine.state.worldState.currentLocationId = 'loc_dev_haven';
    // Short labels drop the entity's name
    const lycus = { kind: 'npc', id: 'npc_dev_merchant_lycus', name: 'Merchant Lycus' };
    const byId = (id) => actions().find(a => a.id === id);
    assert.strictEqual(engine.shortActionLabel(byId('act_talk_npc_dev_merchant_lycus'), lycus), 'Speak');
    assert.strictEqual(engine.shortActionLabel(byId('act_persuade_npc_dev_merchant_lycus'), lycus), `Persuade (DC ${engine.getPersuadeDc('npc_dev_merchant_lycus')})`);
    assert.strictEqual(engine.shortActionLabel(byId('act_obj_pick_obj_treasury_iron_door'), { name: 'Ironbound Vault Door' }), 'Pick Lock (DC 12)');
    // Rendering: one chip per multi-action entity, one hidden panel each, single actions as tiles
    const created = [];
    const origCreate = env.sandbox.document.createElement;
    env.sandbox.document.createElement = (tag) => { const el = origCreate(tag); created.push(el); return el; };
    engine.renderStoryPanel();
    env.sandbox.document.createElement = origCreate;
    const chips = created.filter(el => el.className && /entity-chip/.test(el.className));
    const panels = created.filter(el => el.className === 'focus-panel');
    assert.strictEqual(chips.length, 5, 'Lycus, Valerius, Elena, Brannoch and Haven');
    assert.ok(panels.length === 5 && panels.every(p => p.hidden), 'panels exist but stay closed until chosen');
    assert.strictEqual(created.filter(el => el.className === 'risky-acts').length, 4, 'hostile acts behind a toggle for each person');
    assert.ok(created.some(el => el.className === 'next-steps'), 'next steps strip rendered');
    chips[0].onclick();
    assert.ok(engine._focusEntity, 'a chip selects its entity');
    // Layout setting persists and survives "Reset panel sizes"
    engine.setActionLayout('lists');
    assert.strictEqual(JSON.parse(env.storage.gm_ui_sizes).actionLayout, 'lists');
    engine.resetUiSizes();
    assert.strictEqual(engine.getActionLayout(), 'lists');
  });

  await test('UI: panel sizes and text size are saved and restored', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    engine.setUiSize('sidebar', 420);
    engine.setUiSize('textScale', 120);
    assert.deepStrictEqual(JSON.parse(env.storage.gm_ui_sizes), { sidebar: 420, textScale: 120 });
    engine.resetUiSizes();
    assert.strictEqual(env.storage.gm_ui_sizes, undefined);
  });

  // ---------------------------------------------------------------------------
  // Session 15: quests, NPC standing, trading, confrontations, gameplay fixes
  // ---------------------------------------------------------------------------
  await test('Dev campaign: every quest can be started and completed through dialogue, actions and fights', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState;
    fixedRoll(engine, 15);
    engine.state.player.vitals.maxHealth = engine.state.player.vitals.health = 500;
    assert.deepStrictEqual(plain(Object.keys(w.quests)), ['quest_dev_sunstone_relic'], 'only the main quest starts on day 1 (others are offered or discovered)');
    const say = (tree, ...nodes) => { nodes.forEach(n => engine.openDialogue(tree, n)); engine.closeDialogue(); };
    const win = () => { engageFight(engine, env); let guard = 0; while (engine.combatSession && guard++ < 20) { if (engine.combatSession.awaitingMercy) { engine.resolveYield(false); break; } engine.combatSession.enemy.hp = 1; engine.combatAction('thrust'); env.flushTimers(); } };
    const at = (loc) => { w.currentLocationId = loc; };
    const act = (id) => { const a = engine.getContextualActionGroups().flatMap(g => g.actions).find(x => x.id === id); assert.ok(a, 'action available: ' + id); a.handler(); env.flushTimers(); };
    // Lycus' delivery: parcel -> Captain -> back to Lycus (quest rewards paid once)
    const xp0 = engine.state.player.xp;
    say('dialogue_dev_lycus', 'node_quest');
    assert.ok(engine.hasItem('item_dev_trade_parcel'));
    assert.strictEqual(w.quests.quest_dev_merchant_delivery.giverId, 'npc_dev_merchant_lycus');
    say('dialogue_dev_captain', 'node_parcel', 'node_boar_bounty', 'node_rescue_brief');
    assert.strictEqual(w.quests.quest_dev_merchant_delivery.stage, 'return_lycus');
    assert.ok(!engine.hasItem('item_dev_trade_parcel'), 'the parcel is handed over (consumeItem)');
    const lycus0 = engine.getNpcDisposition('npc_dev_merchant_lycus');
    say('dialogue_dev_lycus', 'node_paid');
    assert.ok(w.quests.quest_dev_merchant_delivery.completed);
    assert.strictEqual(engine.state.player.xp - xp0, 80, 'quest rewards block paid');
    assert.strictEqual(engine.getNpcDisposition('npc_dev_merchant_lycus') - lycus0, 15, 'the quest giver thinks better of you');
    say('dialogue_dev_lycus', 'node_paid');
    assert.strictEqual(engine.state.player.xp - xp0, 80, 'never paid twice');
    // Boar bounty: encounter -> Captain
    at('loc_dev_whispering_woods'); act('act_enc_enc_dev_wild_boar'); win();
    assert.strictEqual(w.quests.quest_dev_boar_menace.stage, 'return_captain');
    assert.ok(!engine.getContextualActionGroups().flatMap(g => g.actions).some(a => a.id === 'act_attack_creature_dev_wild_boar' && engine.isEncounterAvailable(engine.findEncounter('enc_dev_wild_boar'))), 'no second attack card beside an available encounter');
    say('dialogue_dev_captain', 'node_boar_paid');
    assert.ok(w.quests.quest_dev_boar_menace.completed);
    // Monolith, grotto (discovered by doing), Silas' bargain (moral choice from dialogue)
    say('dialogue_dev_elena', 'node_accept_sunstone', 'node_monoliths');
    assert.strictEqual(w.quests.quest_dev_sunstone_relic.stage, 'explore_crypt', 'accepting the job completes "speak with Elena"');
    act('act_study_monolith');
    assert.ok(w.quests.quest_dev_ancient_ruins.completed);
    engine.heaveObstacle('obj_boulder_seal');
    assert.ok(w.quests.quest_dev_grotto_mystery.completed, 'a discovery quest starts and completes when you find it');
    say('dialogue_dev_bandit', 'node_bargain', 'node_arrest');
    assert.strictEqual(w.quests.quest_dev_bandit_alliance.chosenPath, 'heroic');
    assert.ok(!engine.getNpcsAt('loc_dev_whispering_woods').some(n => n.id === 'npc_dev_bandit_renegade'), 'arrested Silas leaves the woods');
    // Rescue by stealth, report to the Captain within the deadline (early bonus)
    at('loc_dev_obsidian_crag'); act('act_sneak_to_apprentice');
    assert.strictEqual(w.quests.quest_dev_urgent_rescue.stage, 'return_haven', 'stage.next skips the "moved" branch');
    engine.advanceTime(30, 0);
    assert.strictEqual(w.quests.quest_dev_urgent_rescue.stage, 'return_haven', 'the 24h warning no longer applies; escalation only while still at the crag (ifStage)');
    engine.advanceTime(20, 0);
    assert.strictEqual(w.quests.quest_dev_urgent_rescue.stage, 'return_haven', 'a rescued hostage is not moved by the deadline');
    say('dialogue_dev_captain', 'node_rescue_done');
    assert.ok(w.quests.quest_dev_urgent_rescue.completed);
    // Sunstone: boss loot completes the recovery objective through the ITEM_ACQUIRED event
    at('loc_dev_ancient_crypt'); act('act_enc_enc_dev_crypt_boss'); win();
    assert.ok(engine.hasItem('item_dev_sunstone_relic'));
    assert.strictEqual(w.quests.quest_dev_sunstone_relic.stage, 'return_or_keep');
    at('loc_dev_haven'); say('dialogue_dev_elena', 'node_complete_sunstone');
    assert.ok(w.quests.quest_dev_sunstone_relic.completed);
    assert.ok(!engine.hasItem('item_dev_sunstone_relic'), 'the relic is handed over');
    // Vault: the strongbox is unreachable until the door is open; opening it discovers and completes the heist
    assert.ok(!engine.getContextualActionGroups().flatMap(g => g.actions).some(a => /Strongbox/.test(a.title)), 'strongbox hidden behind the vault door');
    engine.addItem('item_dev_iron_lockpick', 1);
    engine.attemptLockpick('obj_treasury_iron_door');
    engine.attemptLockpick('obj_trapped_coffer');
    assert.ok(w.quests.quest_dev_treasury_heist.completed);
    assert.ok(Object.values(w.quests).every(q => q.completed), 'all eight quests completed: ' + Object.values(w.quests).filter(q => !q.completed).map(q => q.id));
  });

  await test('Standing: personal favour + faction share, tiers change persuasion, dialogue, trade and hostility', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const st = (id) => engine.getNpcStanding(id);
    assert.strictEqual(st('npc_dev_merchant_lycus').personal, 20);
    assert.strictEqual(st('npc_dev_merchant_lycus').regional, Math.round(engine.getFactionReputation('faction_dev_haven') / 2));
    assert.strictEqual(st('npc_dev_bandit_renegade').tier, 'unfriendly');
    engine.modifyFactionReputation('faction_dev_haven', -150);
    assert.strictEqual(st('npc_dev_merchant_lycus').tier, 'hostile', 'regional reputation moves individual standing');
    assert.ok(engine.getMerchantClosedReason(engine.getCharacter('npc_dev_merchant_lycus')), 'hostile merchants do not trade');
    engine.openDialogue('dialogue_dev_lycus');
    assert.ok(/refuses to speak/.test(env.el('dialogue-text-body').innerHTML), 'hostile NPCs refuse to talk');
    engine.modifyFactionReputation('faction_dev_haven', 150);
    // Persuasion DC follows standing; success raises it
    assert.strictEqual(engine.getPersuadeDc('npc_dev_bandit_renegade'), 14);
    engine.changeNpcStanding('npc_dev_guard_captain', 60);
    assert.strictEqual(st('npc_dev_guard_captain').tier, 'trusted');
    assert.strictEqual(engine.getPersuadeDc('npc_dev_guard_captain'), 8);
    // Standing-gated dialogue choice is shown locked below the threshold and opens at it
    engine.changeNpcStanding('npc_dev_guard_captain', -60);
    engine.openDialogue('dialogue_dev_captain');
    assert.ok(/locked/.test(env.el('dialogue-choices-list').innerHTML), 'locked choice is visible');
    engine.changeNpcStanding('npc_dev_guard_captain', 60);
    engine.openDialogue('dialogue_dev_captain', 'node_vault_trust');
    assert.ok(engine.hasItem('item_dev_treasury_key'), 'trusted Captain lends the vault key');
    // Persuade / deceive / pickpocket cards show the real DC
    const cards = engine.getContextualActionGroups().flatMap(g => g.actions);
    assert.ok(cards.some(a => a.id === 'act_persuade_npc_dev_merchant_lycus' && a.title.includes(`DC ${engine.getPersuadeDc('npc_dev_merchant_lycus')}`)));
    assert.ok(cards.some(a => a.id === 'act_pickpocket_npc_dev_merchant_lycus' && a.title.includes(`DC ${engine.getPickpocketDc('npc_dev_merchant_lycus')}`)));
    fixedRoll(engine, 18);
    const before = engine.getNpcDisposition('npc_dev_elena_scholar');
    engine.attemptPersuadeNpc('npc_dev_elena_scholar');
    assert.strictEqual(engine.getNpcDisposition('npc_dev_elena_scholar') - before, 10);
    assert.ok(!engine.canAttemptSocial('npc_dev_elena_scholar'), 'social cooldown');
    // Hostile NPCs with hostileAction "attack" confront you on arrival
    engine.setNpcDisposition('npc_dev_guard_captain', -100);
    engine.state.worldState.currentLocationId = 'loc_dev_whispering_woods';
    fixedRoll(engine, 15);
    engine.executeTravel(engine.getLocation('loc_dev_haven'), engine.getLocation('loc_dev_whispering_woods').connections.find(c => c.targetLocationId === 'loc_dev_haven'));
    env.flushTimers();
    assert.ok(engine.confrontation && engine.confrontation.npcId === 'npc_dev_guard_captain' && engine.confrontation.initiator === 'enemy');
    assert.ok(engine.getConfrontationOptions().some(o => o.id === 'parley'), 'people can be talked down');
  });

  await test('Trading: buy and sell with standing prices, buy-back, event-driven restock, saved in the game', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const npc = 'npc_dev_merchant_lycus';
    engine.state.player.currencies.drachmae = 100;
    engine.openTrade(npc);
    assert.ok(engine.tradeSession);
    const listed = engine.getCharacter(npc).merchantInventory.find(e => e.itemId === 'item_dev_healing_draught');
    const tier = engine.getNpcStanding(npc).tier;
    const expected = Math.max(1, Math.round(listed.price * engine.getStandingConfig().priceMultiplier[tier]));
    assert.strictEqual(engine.getBuyPrice(npc, 'item_dev_healing_draught'), expected);
    assert.ok(engine.buyItem(npc, 'item_dev_healing_draught'));
    assert.strictEqual(engine.state.player.currencies.drachmae, 100 - expected);
    assert.strictEqual(engine.state.worldState.merchants[npc].stock.item_dev_healing_draught, listed.stock - 1);
    assert.strictEqual(engine.state.worldState.scheduledEvents.filter(e => e.type === 'merchant_restock').length, 1, 'one restock event');
    engine.buyItem(npc, 'item_dev_healing_draught');
    assert.strictEqual(engine.state.worldState.scheduledEvents.filter(e => e.type === 'merchant_restock').length, 1, 'still one');
    // Sell: equipped and quest items cannot be sold; sold items can be bought back
    const weapon = engine.state.player.inventory.find(e => e.equipped);
    assert.strictEqual(engine.getUnsellableReason(npc, weapon), 'Equipped');
    engine.addItem('item_dev_trade_parcel', 1);
    assert.strictEqual(engine.getUnsellableReason(npc, engine.state.player.inventory.find(e => e.itemId === 'item_dev_trade_parcel')), 'Not for sale');
    const purse = engine.state.player.currencies.drachmae;
    assert.ok(engine.sellItem(npc, 'item_dev_healing_draught'));
    assert.strictEqual(engine.state.player.currencies.drachmae - purse, engine.getSellPrice(npc, 'item_dev_healing_draught'));
    assert.strictEqual(engine.state.worldState.merchants[npc].buyback.item_dev_healing_draught, 1);
    // Unfriendly customers pay more
    const friendlyPrice = engine.getBuyPrice(npc, 'item_dev_iron_lockpick');
    engine.setNpcDisposition(npc, -40);
    assert.strictEqual(engine.getNpcStanding(npc).tier, 'unfriendly');
    assert.ok(engine.getBuyPrice(npc, 'item_dev_iron_lockpick') > friendlyPrice);
    engine.setNpcDisposition(npc, 20);
    const t0 = engine.getTotalInGameMinutes();
    engine.closeTrade();
    assert.ok(engine.getTotalInGameMinutes() > t0, 'trading takes time');
    // Save round trip keeps the merchant; the restock event restores the stock
    const copy = engine.migrateState(JSON.parse(JSON.stringify(engine.state)));
    assert.strictEqual(copy.worldState.merchants[npc].stock.item_dev_healing_draught, listed.stock - 2);
    engine.advanceTime(25, 0);
    assert.strictEqual(engine.getMerchantState(npc).stock.item_dev_healing_draught, listed.stock, 'restocked');
    assert.deepStrictEqual(plain(engine.getMerchantState(npc).buyback), {}, 'buy-back cleared at restock');
    // Generic merchants (no authored dialogue) offer trade from conversation too
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const tree = engine.buildGenericNpcDialogue('dialogue_npc_theban_agora_merchant');
    assert.ok(tree.nodes.node_wares.openTrade);
  });

  await test('Confrontations: the side that starts the fight decides the options; preparations shape the opening', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState;
    w.currentLocationId = 'loc_dev_whispering_woods';
    // Player-initiated: terrain tactics (+ location tactic), opening strike, attack, back off
    engine.engageCreature('creature_dev_forest_wolf');
    const ids = engine.getConfrontationOptions().map(o => o.arg || o.id);
    assert.ok(ids.includes('bramble_lure') && ids.includes('ambush') && ids.includes('attack') && ids.includes('withdraw'), ids.join(','));
    assert.ok(!ids.includes('hide'), 'no hiding from something that has not seen you');
    fixedRoll(engine, 18);
    const t0 = engine.getTotalInGameMinutes();
    engine.chooseConfrontation('tactic', 'bramble_lure');
    assert.strictEqual(engine.getTotalInGameMinutes() - t0, 10, 'preparing takes time');
    assert.deepStrictEqual(plain(engine.confrontation.opening.mods.enemyAttack), { value: 2, rounds: 3 });
    engine.chooseConfrontation('ambush');
    const c = engine.combatSession;
    assert.ok(c && c.enemy.hp < c.enemy.maxHp, 'the opening strike already wounded the foe');
    assert.strictEqual(engine.getCombatMod('enemyAttack'), 2, 'preparation carried into the fight');
    engine.combatSession = null;
    // Backing off avoids the fight
    engine.engageCreature('creature_dev_forest_wolf');
    engine.chooseConfrontation('withdraw');
    assert.ok(!engine.confrontation && !engine.combatSession);
    // A noisy failed preparation hands the initiative to the foe
    engine.engageCreature('creature_dev_forest_wolf');
    fixedRoll(engine, 1);
    engine.chooseConfrontation('tactic', 'study');
    assert.strictEqual(engine.confrontation.initiator, 'enemy');
    assert.ok(engine.getConfrontationOptions().some(o => o.id === 'hide'));
    // Enemy-initiated: hiding can avoid the fight entirely
    fixedRoll(engine, 20);
    engine.chooseConfrontation('hide');
    assert.ok(!engine.combatSession && !engine.confrontation, 'hid successfully');
    // ... and a failed hide means the foe strikes first
    engine.engageCreature('creature_dev_forest_wolf', { initiator: 'enemy', surprised: true });
    fixedRoll(engine, 2);
    const hp = engine.state.player.vitals.health;
    engine.chooseConfrontation('hide');
    assert.ok(engine.combatSession, 'found: the fight begins');
    engine.combatSession = null;
    // Unavoidable fights only offer conflict choices (tutorial cave beast)
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.state.worldState.flags.cithaeron_cave_unsealed = true;
    engine.state.worldState.currentLocationId = 'loc_cithaeron_fissure_cave';
    const enter = engine.getContextualActionGroups().flatMap(g => g.actions).find(a => a.id === 'act_enter_grotto');
    enter.handler();
    assert.deepStrictEqual(plain(engine.getConfrontationOptions().map(o => o.id)), ['brace', 'strike_first', 'head_on']);
    engine.chooseConfrontation('brace');
    assert.ok(engine.combatSession && engine.combatSession.mods.ac, 'braced');
    assert.ok(hp >= 0);
  });

  await test('Gameplay fixes: search finds placed items once, rest is safe in towns, NPCs can be spared, feats are campaign-neutral', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState;
    // Search the area for presentItems (previously never obtainable)
    fixedRoll(engine, 15);
    assert.deepStrictEqual(plain(engine.getUnfoundItems('loc_dev_haven')), ['item_dev_iron_lockpick']);
    engine.searchArea('loc_dev_haven');
    assert.ok(engine.hasItem('item_dev_iron_lockpick'));
    assert.deepStrictEqual(plain(engine.getUnfoundItems('loc_dev_haven')), [], 'found once');
    // One find per search: further searches reveal the remaining hidden spots, then the card goes away.
    fixedRoll(engine, 20);
    let guard = 0;
    while (engine.getUnrevealedSpots('loc_dev_haven').length && guard++ < 10) engine.searchArea('loc_dev_haven');
    fixedRoll(engine, 15);
    assert.ok(!engine.getContextualActionGroups().flatMap(g => g.actions).some(a => a.id === 'act_search_loc_dev_haven'));
    // Rest safety: towns and cities are safe
    assert.strictEqual(engine.getRestSafety(engine.getLocation('loc_dev_haven')), 'settlement');
    assert.strictEqual(engine.getRestSafety(engine.getLocation('loc_dev_whispering_woods')), 'wild');
    // Sparing a yielding NPC: they live, turn hostile and leave for a day (event-driven return)
    engine.engageNpc('npc_dev_elena_scholar', { initiator: 'player' });
    engine.chooseConfrontation('attack');
    const c = engine.combatSession;
    c.enemy.hp = 2; fixedRoll(engine, 2);
    engine.combatAction('thrust');
    assert.ok(engine.combatSession.awaitingMercy, 'the NPC yields and the hero chooses');
    engine.resolveYield(true);
    assert.ok(engine.isNpcAlive('npc_dev_elena_scholar'));
    assert.ok(!engine.getNpcsAt('loc_dev_haven').some(n => n.id === 'npc_dev_elena_scholar'), 'gone for now');
    assert.strictEqual(engine.getNpcStanding('npc_dev_elena_scholar').tier, 'hostile');
    engine.advanceTime(25, 0);
    assert.ok(engine.getNpcsAt('loc_dev_haven').some(n => n.id === 'npc_dev_elena_scholar'), 'back after a day');
    // Feats: neutral names outside the Greek campaign
    const feats = engine.getHeroicFeatDefinitions();
    assert.strictEqual(feats.hydra_bane.name, 'Monster Slayer');
    await startCampaign(env, engine, 'campaign_greek_mythology');
    assert.strictEqual(engine.getHeroicFeatDefinitions().hydra_bane.name, 'Bane of the Hydra');
    // Greek NPCs belong to their regions' factions
    assert.strictEqual(engine.getNpcStanding('npc_daidalos_shepherd').factionId, 'faction_plataea');
  });

  await test('Quest log: completed and failed quests are separate; focused quests drive the sidebar', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState;
    engine.startQuest('quest_dev_boar_menace');
    engine.startQuest('quest_dev_ancient_ruins');
    engine.startQuest('quest_dev_merchant_delivery');
    engine.completeQuest('quest_dev_ancient_ruins');
    engine.failQuest('quest_dev_merchant_delivery');
    engine.renderQuests();
    let html = env.el('quest-list-container').innerHTML;
    assert.ok(/Active \(2\)/.test(html) && /Completed \(1\)/.test(html) && /Failed \(1\)/.test(html), 'tab counts');
    assert.ok(!html.includes('The Whispering Monoliths'), 'completed quests are not in the Active tab');
    engine.setQuestTab('completed');
    html = env.el('quest-list-container').innerHTML;
    assert.ok(html.includes('The Whispering Monoliths') && !html.includes('Bristle Boar'));
    // Focus
    assert.deepStrictEqual(plain(engine.getSidebarQuests().quests.map(q => q.id)), ['quest_dev_sunstone_relic'], 'without focus: the main quest');
    engine.toggleQuestFocus('quest_dev_boar_menace');
    assert.deepStrictEqual(plain(engine.getSidebarQuests().quests.map(q => q.id)), ['quest_dev_boar_menace']);
    assert.ok(engine.getSidebarQuests().focused);
    engine.completeQuest('quest_dev_boar_menace');
    assert.deepStrictEqual(plain(w.focusedQuests), [], 'completing a quest unpins it');
    // Focus survives save/load
    engine.toggleQuestFocus('quest_dev_sunstone_relic');
    const copy = engine.migrateState(JSON.parse(JSON.stringify(engine.state)));
    assert.deepStrictEqual(plain(copy.worldState.focusedQuests), ['quest_dev_sunstone_relic']);
  });

  await test('Save migration: 1.6 saves gain merchants and focused quests; 1.7 found items become hidden spots', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const old = JSON.parse(JSON.stringify(engine.state));
    old.version = '1.6.0';
    delete old.worldState.merchants; delete old.worldState.focusedQuests; delete old.worldState.foundSpots;
    delete old.worldState.companions; delete old.worldState.rumouredLocations; delete old.worldState.travelPace; delete old.worldState.hunger;
    old.worldState.foundItems = { loc_dev_haven: ['item_dev_iron_lockpick'] };
    const m = engine.migrateState(old);
    assert.strictEqual(m.version, '1.8.0');
    assert.deepStrictEqual(plain(m.worldState.merchants), {});
    assert.deepStrictEqual(plain(m.worldState.foundSpots), { loc_dev_haven: ['item:item_dev_iron_lockpick'] });
    assert.strictEqual(m.worldState.foundItems, undefined);
    assert.deepStrictEqual(plain(m.worldState.companions), []);
    assert.deepStrictEqual(plain(m.worldState.rumouredLocations), {});
    assert.strictEqual(m.worldState.travelPace, 'normal');
    assert.strictEqual(m.worldState.hunger, 0);
    assert.deepStrictEqual(plain(m.worldState.focusedQuests), []);
  });

  // ---------------------------------------------------------------------------
  // Session 17: combat depth and exploration
  // ---------------------------------------------------------------------------
  const dummy = (over = {}) => Object.assign({ id: 'creature_test_dummy', name: 'Test Brute', level: 1, vitals: { health: 200, maxHealth: 200, morale: 20 }, armorClass: 5,
    actions: [{ name: 'Maul', style: 'heavy', attackBonus: 50, damage: '4' }] }, over);

  await test('Combat: telegraphed moves reward bracing and side-stepping', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const p = engine.state.player;
    p.vitals.health = p.vitals.maxHealth = 100; p.vitals.stamina = p.vitals.maxStamina = 30;
    engine.startCombat(dummy());
    const c = engine.combatSession;
    assert.strictEqual(c.intent.style, 'heavy');
    assert.ok(/Next:.*Maul/.test(engine.describeIntent()), 'the next move is announced');
    fixedRoll(engine, 10);
    engine.combatAction('thrust');
    assert.strictEqual(100 - p.vitals.health, 6, 'a heavy blow deals half again as much (4 -> 6)');
    // Side-step: the telegraphed blow misses entirely and sets up a counter
    const hp = p.vitals.health;
    fixedRoll(engine, 18);
    engine.combatAction('sidestep');
    assert.strictEqual(p.vitals.health, hp, 'side-stepped: no damage');
    assert.strictEqual(engine.combatSession.playerBonus, 2, 'counter bonus on the next strike');
    // Bracing a shield against a heavy blow is worth +2 more AC, and turning it gives +2 on the next strike
    engine.combatSession = null;
    engine.startCombat(dummy({ actions: [{ name: 'Maul', style: 'heavy', attackBonus: 0, damage: '4' }] }));
    const ac = engine.getPlayerArmorClass();
    const calls = [];
    const orig = engine.resolveD20.bind(engine);
    engine.resolveD20 = (o) => { calls.push(o); return orig(o); };
    fixedRoll(engine, 10);
    engine.combatAction('shield_block');
    engine.resolveD20 = orig;
    const enemyRoll = calls[calls.length - 1];
    assert.strictEqual(enemyRoll.dc, ac + engine.combatSession.shieldBonus + 2, 'brace vs heavy: +2 AC on top of the shield');
    assert.strictEqual(enemyRoll.modifier, -1, 'heavy blows are a little easier to see coming (-1 to hit)');
    // Quick strikes hit more often for less
    engine.combatSession = null;
    engine.startCombat(dummy({ actions: [{ name: 'Jab', style: 'quick', attackBonus: 50, damage: '4' }] }));
    p.vitals.health = 100;
    engine.combatAction('thrust');
    assert.strictEqual(100 - p.vitals.health, 3, 'quick: 1 less damage');
  });

  await test('Combat: status effects (bleeding, entangled, frightened, stunned) tick, expire and respect immunities', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const p = engine.state.player;
    p.vitals.health = p.vitals.maxHealth = 100; p.vitals.stamina = p.vitals.maxStamina = 30;
    engine.startCombat(dummy({ armorClass: 40, actions: [{ name: 'Bite', style: 'normal', attackBonus: 50, damage: '1', inflicts: { status: 'bleeding', rounds: 2, value: 3 } }] }));
    fixedRoll(engine, 10);
    engine.combatAction('thrust');
    assert.strictEqual(p.vitals.health, 100 - 1 - 3, 'bite + first bleed tick');
    assert.strictEqual(engine.combatSession.status.player.bleeding.rounds, 1);
    engine.combatSession.enemy.actions[0].inflicts = null; engine.combatSession.intent.action.inflicts = null;
    engine.combatAction('thrust');
    assert.strictEqual(p.vitals.health, 96 - 1 - 3, 'second tick');
    assert.ok(!engine.combatSession.status.player.bleeding, 'bleeding wears off');
    // Entangled: no fleeing, -2 to hit; frightened foes hit less
    engine.applyCombatStatus('player', 'entangled', 2);
    assert.strictEqual(engine.getStatusAttackMod('player'), -2);
    engine.combatAction('flee');
    assert.ok(engine.combatSession && !engine.combatSession.ended, 'cannot flee while entangled');
    engine.applyCombatStatus('enemy', 'frightened', 2);
    assert.strictEqual(engine.getStatusAttackMod('enemy'), -2);
    // Enemy bleeding damages it each round; a stunned hero loses the action
    const hp = engine.combatSession.enemy.hp;
    engine.applyCombatStatus('enemy', 'bleeding', 2, 5);
    engine.applyCombatStatus('player', 'stunned', 1);
    engine.combatAction('thrust');
    assert.strictEqual(engine.combatSession.enemy.hp, hp - 5, 'only the bleed hurt it: the stunned hero did not strike');
    // Immunity from a class feature (Hoplite level 3: Steadfast Discipline)
    await startCampaign(env, engine, 'campaign_greek_mythology');
    engine.state.player.class = 'hoplite'; engine.state.player.level = 3;
    engine.startCombat(dummy());
    assert.strictEqual(engine.applyCombatStatus('player', 'frightened', 2), false);
    assert.ok(!engine.hasCombatStatus('player', 'frightened'));
  });

  await test('Class features: passive effects and combat abilities work from class data', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_greek_mythology');
    const p = engine.state.player;
    // Every feature of every class has mechanics
    engine.getCampaignClasses().forEach(c => c.classFeatures.forEach(f => assert.ok(f.effect || f.combat, `${c.id}: ${f.name} has an effect`)));
    // Hoplite: +2 AC only while a shield is equipped
    p.class = 'hoplite'; p.level = 1;
    const shield = p.inventory.find(i => i.equipped && i.slot === 'off_hand');
    assert.ok(shield, 'hoplite starts with a shield');
    assert.strictEqual(engine.getFeatureArmorBonus(), 2, 'Aspis Phalanx Wall with a shield');
    engine.unequipItem(shield.itemId);
    assert.strictEqual(engine.getFeatureArmorBonus(), 0, 'no shield, no bonus');
    // Trickster 3: 15% off; lockpicking +3
    p.class = 'trickster'; p.level = 3;
    assert.strictEqual(engine.getFeatureNumber('merchantDiscount'), 0.15);
    assert.strictEqual(engine.getFeatureCheckBonus('lockpicking', 'agility', 'lockpick'), 3);
    assert.strictEqual(engine.getFeatureCheckBonus('persuasion', 'charisma'), 2);
    // Demigod 2: +5 max health granted once
    p.class = 'demigod'; p.level = 2;
    const mh = p.vitals.maxHealth;
    engine.renderAll(); engine.renderAll();
    assert.strictEqual(p.vitals.maxHealth, mh + 5, 'Ichor of the Gods granted exactly once');
    // Abilities: uses and stamina, automatic damage, ward
    p.level = 4; p.vitals.stamina = p.vitals.maxStamina = 20; p.vitals.health = p.vitals.maxHealth;
    engine.startCombat(dummy({ actions: [{ name: 'Hit', style: 'normal', attackBonus: 50, damage: '6' }] }));
    const ab = engine.getCombatAbilities();
    assert.deepStrictEqual(plain(ab.map(a => a.name)), ['Olympian Sparks', 'Heavenly Aegis']);
    const hp0 = engine.combatSession.enemy.hp, php = p.vitals.health;
    fixedRoll(engine, 10);
    engine.combatAction('ability:heavenly_aegis');
    assert.strictEqual(p.vitals.health, php, 'the aegis absorbed the blow');
    assert.strictEqual(engine.combatSession.ward, 9);
    engine.combatAction('ability:olympian_sparks');
    assert.ok(engine.combatSession.enemy.hp < hp0, 'sparks always hit');
    assert.strictEqual(p.vitals.stamina, 19);
    engine.combatAction('ability:heavenly_aegis');
    assert.strictEqual(engine.combatSession.abilityUses.heavenly_aegis, 1, 'once per fight');
    // Dev classes too
    await startCampaign(env, engine, 'campaign_dev_test');
    engine.state.player.class = 'dev_sentinel';
    engine.startCombat(dummy());
    engine.combatAction('ability:shield_bash');
    assert.ok(engine.combatSession.enemy.hp < 200);
    assert.strictEqual(100, 100);
  });

  await test('Morale and the law: beasts can break and flee; guards accept surrender (fine or cells)', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState, p = engine.state.player;
    // A wounded wolf fails its morale check and runs: half XP, not dead, no loot
    engine.startCombat('creature_dev_forest_wolf');
    const xp0 = p.xp;
    engine.combatSession.enemy.hp = 4;
    rollSeq(engine, [2, 3]); // hero misses, the wolf's morale roll fails
    engine.combatAction('thrust');
    assert.ok(engine.combatSession.ended, 'the wolf flees');
    env.flushTimers();
    assert.ok(!engine.combatSession);
    assert.ok(!w.deadEntities.creature_dev_forest_wolf, 'it survives');
    assert.strictEqual(p.xp - xp0, 20, 'half the XP for driving it off');
    // Quest encounters and bosses never flee
    engine.startCombatEncounter('enc_dev_wild_boar');
    engine.combatSession.enemy.hp = 2;
    assert.strictEqual(engine.checkFoeMorale({ innerHTML: '' }), false);
    engine.combatSession = null;
    // Surrender to a guard who attacks: fine paid, no longer hunted
    engine.setNpcDisposition('npc_dev_guard_captain', -100);
    engine.modifyFactionReputation('faction_dev_guards', -80);
    p.currencies.drachmae = 100;
    engine.engageNpc('npc_dev_guard_captain', { initiator: 'enemy' });
    assert.ok(engine.getConfrontationOptions().some(o => o.id === 'surrender'));
    engine.chooseConfrontation('surrender');
    assert.strictEqual(p.currencies.drachmae, 75, 'first offence: 25 drachmae');
    assert.ok(!engine.confrontation && !engine.combatSession);
    assert.notStrictEqual(engine.getNpcStanding('npc_dev_guard_captain').tier, 'hostile', 'the debt is paid');
    // Second offence, no money: the cells (time passes), purse emptied; also available mid-fight
    engine.setNpcDisposition('npc_dev_guard_captain', -100);
    p.currencies.drachmae = 10;
    engine.startCombatWithEntity('npc_dev_guard_captain', 'npc');
    engine.renderAll(); engine.updateCombatUI();
    assert.ok(/Surrender/.test(env.el('combat-extra-bar').innerHTML));
    const t0 = engine.getTotalInGameMinutes();
    engine.combatAction('surrender');
    assert.strictEqual(p.currencies.drachmae, 0);
    assert.strictEqual(engine.getTotalInGameMinutes() - t0, 24 * 60, 'a day in the cells');
    assert.strictEqual(w.lawRecord.offences, 2);
    // Merchants are not the law
    engine.engageNpc('npc_dev_merchant_lycus', { initiator: 'enemy' });
    assert.ok(!engine.getConfrontationOptions().some(o => o.id === 'surrender'));
  });

  await test('Companions: hirelings and allies fight beside the hero, give perks, and leave when their time is up', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState, p = engine.state.player;
    p.currencies.drachmae = 50;
    const hire = engine.getContextualActionGroups().flatMap(g => g.actions).find(a => a.id === 'act_hire_npc_dev_sellsword_brannoch');
    assert.ok(hire && !hire.disabled);
    hire.handler();
    assert.strictEqual(p.currencies.drachmae, 20);
    assert.ok(engine.isCompanion('npc_dev_sellsword_brannoch'));
    assert.ok(!engine.getNpcsAt('loc_dev_haven').some(n => n.id === 'npc_dev_sellsword_brannoch'), 'he travels with you now');
    // In a fight he attacks after the hero
    engine.startCombat(dummy({ actions: [{ name: 'Hit', style: 'normal', attackBonus: -50, damage: '1' }] }));
    assert.strictEqual(engine.combatSession.allies.length, 1);
    rollSeq(engine, [2, 15, 2]); // hero misses, Brannoch hits, foe misses
    engine.combatAction('thrust');
    assert.ok(engine.combatSession.enemy.hp < 200, 'the companion dealt damage');
    engine.combatSession = null;
    // Silas joins through the villainous pact and brings perks
    w.currentLocationId = 'loc_dev_whispering_woods';
    engine.openDialogue('dialogue_dev_bandit', 'node_bargain'); engine.openDialogue('dialogue_dev_bandit', 'node_ally'); engine.closeDialogue();
    assert.ok(engine.isCompanion('npc_dev_bandit_renegade'));
    assert.strictEqual(engine.getFeatureCheckBonus('stealth', 'agility'), 2);
    assert.strictEqual(engine.getFeatureCheckBonus('x', 'agility', 'lockpick'), 2);
    assert.strictEqual(w.companions.length, 2);
    // Save round trip, then the contract runs out (event-driven)
    const copy = engine.migrateState(JSON.parse(JSON.stringify(engine.state)));
    assert.strictEqual(copy.worldState.companions.length, 2);
    engine.advanceTime(73, 0);
    assert.ok(!engine.isCompanion('npc_dev_sellsword_brannoch'), 'the hireling leaves after 3 days');
    assert.ok(engine.isCompanion('npc_dev_bandit_renegade'), 'Silas stays');
    engine.dismissCompanion('npc_dev_bandit_renegade');
    assert.ok(engine.getNpcsAt('loc_dev_whispering_woods').some(n => n.id === 'npc_dev_bandit_renegade'), 'dismissed companions go home');
  });

  await test('Exploration: hidden spots one at a time, secret paths, travel pace, light and weather', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState;
    // Hidden spots: one find per search, easiest first; a secret path opens a new road
    w.currentLocationId = 'loc_dev_whispering_woods';
    const n0 = engine.getUnrevealedSpots('loc_dev_whispering_woods').length;
    assert.ok(n0 >= 2);
    fixedRoll(engine, 19);
    engine.searchArea('loc_dev_whispering_woods');
    assert.strictEqual(w.foundSpots.loc_dev_whispering_woods.length, 1, 'one thing per search');
    assert.strictEqual(engine.getUnrevealedSpots('loc_dev_whispering_woods').length, n0 - 1);
    engine.searchArea('loc_dev_whispering_woods'); engine.searchArea('loc_dev_whispering_woods');
    assert.ok(w.foundSpots.loc_dev_whispering_woods.includes('hunters_cache') && engine.hasItem('item_dev_trail_rations'));
    w.currentLocationId = 'loc_dev_obsidian_crag';
    const roads = () => engine.getLocation('loc_dev_obsidian_crag').connections.filter(c => engine.isConnectionOpen(c)).map(c => c.targetLocationId);
    assert.deepStrictEqual(plain(roads()), ['loc_dev_haven']);
    engine.searchArea('loc_dev_obsidian_crag');
    assert.deepStrictEqual(plain(roads()), ['loc_dev_haven', 'loc_dev_whispering_woods'], 'the goat track is found');
    // Locations without authored spots hide a small default cache
    assert.strictEqual(engine.getLocationSpots('loc_dev_ancient_crypt').filter(sp => sp.id === 'cache').length, 1);
    // Travel pace
    const conn = engine.getLocation('loc_dev_haven').connections.find(c => c.targetLocationId === 'loc_dev_whispering_woods');
    w.time.hour = 10;
    const normal = engine.getTravelCost(conn);
    assert.strictEqual(normal.minutes, 60);
    engine.setTravelPace('careful');
    assert.strictEqual(engine.getTravelCost(conn).minutes, 90);
    assert.strictEqual(engine.getTravelPace().spot, 4);
    engine.setTravelPace('fast');
    assert.strictEqual(engine.getTravelCost(conn).minutes, 42);
    assert.ok(engine.getTravelCost(conn).stamina > normal.stamina);
    w.currentLocationId = 'loc_dev_haven';
    const t0 = engine.getTotalInGameMinutes();
    fixedRoll(engine, 15);
    engine.executeTravel(engine.getLocation('loc_dev_whispering_woods'), conn);
    env.flushTimers();
    if (engine.confrontation) engine.chooseConfrontation(engine.getConfrontationOptions().some(o => o.id === 'withdraw') ? 'withdraw' : 'fight');
    assert.strictEqual(engine.getTotalInGameMinutes() - t0, 42, 'the journey takes the pace-adjusted time');
    engine.combatSession = null;
    engine.setTravelPace('normal');
    // Light: night hides you and hinders the eye; weather: storms slow the road
    w.time.hour = 23;
    assert.strictEqual(engine.getEnvironmentMod('perception'), -2);
    assert.strictEqual(engine.getEnvironmentMod('stealth'), 2);
    w.time.hour = 10;
    assert.strictEqual(engine.getEnvironmentMod('perception'), 0);
    w.weather = { id: 'storm' };
    assert.strictEqual(engine.getTravelCost(conn).minutes, 90);
    assert.strictEqual(engine.getEnvironmentMod('ranged'), -2);
    w.weather = { id: 'fog' };
    const base = engine.checkSkill('stealth', 'agility', 99, 't').total;
    w.weather = { id: 'clear' };
    assert.strictEqual(base - engine.checkSkill('stealth', 'agility', 99, 't').total, 3, 'fog helps stealth checks');
    // Weather is event-driven and keeps going across long skips
    engine.renderAll();
    assert.strictEqual(w.scheduledEvents.filter(e => e.type === 'weather_change').length, 1);
    engine.advanceTime(60, 0);
    assert.strictEqual(w.scheduledEvents.filter(e => e.type === 'weather_change').length, 1, 'the next change is always scheduled');
    assert.ok(engine.getWeatherDefs()[w.weather.id]);
  });

  await test('Exploration: rumours mark places on the map; rations, hunger and camp events', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    await startCampaign(env, engine, 'campaign_dev_test');
    const w = engine.state.worldState, p = engine.state.player;
    // Rumours
    const card = () => engine.getContextualActionGroups().flatMap(g => g.actions).find(a => a.id === 'act_rumour_npc_dev_merchant_lycus');
    assert.ok(card());
    card().handler();
    assert.ok(w.rumouredLocations.loc_dev_ancient_crypt, 'rumoured, not discovered');
    assert.ok(!w.discoveredLocations.includes('loc_dev_ancient_crypt'));
    assert.ok(w.journal.knowledge.some(k => /Rumour/.test(k.title)));
    card().handler();
    assert.ok(w.rumouredLocations.loc_dev_obsidian_crag);
    assert.ok(!card(), 'nothing more to tell');
    assert.strictEqual(engine.getRumourFor(engine.getCharacter('npc_dev_elena_scholar')), null, 'no repeats from others');
    // Rations on the road: one per 8 hours of travel; none left means hunger
    p.inventory = p.inventory.filter(e => !engine.isRation(e.itemId));
    engine.addItem('item_dev_trail_rations', 1);
    engine.noteTravelHours(9);
    assert.ok(!engine.hasItem('item_dev_trail_rations'), 'eaten on the road');
    assert.strictEqual(w.hunger, 0);
    engine.noteTravelHours(8);
    assert.strictEqual(w.hunger, 1, 'no rations: hungry');
    w.time.hour = 10; w.weather = { id: 'clear' };
    fixedRoll(engine, 15);
    const hungry = engine.checkSkill('perception', 'wisdom', 99, 't').total;
    engine.addItem('item_dev_trail_rations', 1);
    engine.consumeItem('item_dev_trail_rations');
    assert.strictEqual(w.hunger, 0, 'eating ends hunger');
    w.time.hour = 10;
    fixedRoll(engine, 15);
    assert.strictEqual(engine.checkSkill('perception', 'wisdom', 99, 't').total - hungry, 1, 'hunger was a -1 on checks');
    // Resting in the wild without food is a poor rest; in town you are fed
    w.currentLocationId = 'loc_dev_whispering_woods';
    p.vitals.stamina = 1;
    const realRandom = env.sandbox.Math.random;
    env.sandbox.Math.random = () => 0.99; // no camp event
    fixedRoll(engine, 15);
    try { engine.executeRest('long'); } finally { env.sandbox.Math.random = realRandom; }
    env.flushTimers();
    engine.combatSession = null; engine.confrontation = null;
    assert.strictEqual(w.hunger, 1);
    assert.ok(p.vitals.stamina < p.vitals.maxStamina, 'a hungry rest does not fully restore stamina');
    // Camp events use the shared outcome vocabulary
    env.sandbox.Math.random = () => 0;
    let ev;
    try { ev = engine.rollCampEvent(); } finally { env.sandbox.Math.random = realRandom; }
    assert.strictEqual(ev, 'shooting_star');
    assert.strictEqual(w.inspiration, true);
    const a = engine.checkSkill('perception', 'wisdom', 99, 't').total;
    const b = engine.checkSkill('perception', 'wisdom', 99, 't').total;
    assert.strictEqual(a - b, 2, 'inspiration: +2 once');
  });

  // ---------------------------------------------------------------------------
  // Integration fuzzing: random play through the real action deck
  // ---------------------------------------------------------------------------
  for (const campaignId of ['campaign_greek_mythology', 'campaign_dev_test']) {
    await test(`Fuzz: 600 seeded random actions in ${campaignId} raise no errors and keep state invariants`, async () => {
      const env = createSandbox();
      let seed = 1234567;
      env.sandbox.Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
      const rnd = (n) => Math.floor(env.sandbox.Math.random() * n);
      const engine = await bootEngine(env);
      await startCampaign(env, engine, campaignId);
      const choicesFrom = (html, fn) => [...String(html).matchAll(new RegExp(`${fn}\\(([^)]*)\\)`, 'g'))].map(m => m[1]);
      let lastTime = engine.getTotalInGameMinutes();
      for (let step = 0; step < 600; step++) {
        const p = engine.state.player;
        if (engine.levelUpState) {
          engine.selectLevelUpAttr('endurance'); engine.selectLevelUpSkill('melee_combat'); engine.selectLevelUpSkill('perception');
          const feat = engine.getAvailableFeats()[0]; if (feat) engine.selectLevelUpFeat(feat.id);
          engine.confirmLevelUp();
        } else if (engine.activeMinigame) {
          engine.closeMinigame(false);
        } else if (engine.combatSession && engine.combatSession.awaitingMercy) {
          engine.resolveYield(rnd(2) === 0);
        } else if (engine.confrontation) {
          const opts = engine.getConfrontationOptions().filter(o => !o.disabled);
          const o = opts[rnd(opts.length)];
          engine.chooseConfrontation(o.id, o.arg);
        } else if (engine.tradeSession) {
          const m = engine.getMerchantState(engine.tradeSession.npcId);
          const stock = Object.keys(m.stock); const mine = engine.state.player.inventory.map(e => e.itemId);
          const r = rnd(3);
          if (r === 0 && stock.length) engine.buyItem(engine.tradeSession.npcId, stock[rnd(stock.length)]);
          else if (r === 1 && mine.length) engine.sellItem(engine.tradeSession.npcId, mine[rnd(mine.length)]);
          else engine.closeTrade();
        } else if (engine.combatSession && !engine.combatSession.ended) {
          const abil = engine.getCombatAbilities().filter(a => a.ready).map(a => 'ability:' + a.id);
          const acts = ['thrust', 'thrust', 'thrust', 'shield_block', 'feint', 'salve', 'prayer', 'sidestep', 'flee', 'surrender'].concat(abil);
          const pick = acts[rnd(acts.length)];
          if (pick !== 'surrender' || (engine.combatSession.enemy.isNpc && engine.isLawOfficer(engine.getCharacter(engine.combatSession.enemy.id)))) engine.combatAction(pick);
        } else if (env.el('dialogue-modal').style.display === 'flex' && rnd(4) > 0) {
          const opts = choicesFrom(env.el('dialogue-choices-list').innerHTML, 'window.engine.selectDialogueChoice');
          if (opts.length) { const [tree, node] = opts[rnd(opts.length)].split(',').map(x => x.trim().replace(/^'|'$/g, '')); engine.selectDialogueChoice(tree, node); }
          else env.el('dialogue-modal').style.display = 'none';
        } else if (env.el('riddle-modal').style.display === 'flex' && rnd(3) > 0) {
          const opts = choicesFrom(env.el('riddle-choices-container').innerHTML, 'window.engine.resolveRiddleChoice');
          if (opts.length) engine.resolveRiddleChoice(opts[rnd(opts.length)].replace(/'/g, ''));
          env.el('riddle-modal').style.display = 'none';
        } else {
          ['dialogue-modal', 'riddle-modal', 'rest-modal', 'defeat-modal', 'interactive-object-modal'].forEach(id => { env.el(id).style.display = 'none'; });
          const actions = engine.getContextualActionGroups().flatMap(g => g.actions).filter(a => !a.disabled);
          const roll = rnd(10);
          if (roll === 0) engine.executeRest(['short', 'long', 'sacred'][rnd(3)]);
          else if (roll === 1 && p.inventory.length) { const e = p.inventory[rnd(p.inventory.length)]; engine.equipItem(e.itemId); engine.consumeItem(e.itemId); }
          else if (actions.length) actions[rnd(actions.length)].handler();
        }
        env.flushTimers();
        // ---- invariants ----
        const v = engine.state.player.vitals;
        assert.ok(Number.isFinite(v.health) && v.health >= 0 && v.health <= v.maxHealth, `step ${step}: health ${v.health}/${v.maxHealth}`);
        assert.ok(Number.isFinite(v.stamina) && v.stamina >= 0 && v.stamina <= v.maxStamina, `step ${step}: stamina ${v.stamina}`);
        assert.ok(Number.isFinite(engine.state.player.currencies.drachmae) && engine.state.player.currencies.drachmae >= 0, `step ${step}: drachmae`);
        const now = engine.getTotalInGameMinutes();
        assert.ok(now >= lastTime, `step ${step}: time went backwards`); lastTime = now;
        const loc = engine.state.worldState.currentLocationId;
        assert.ok(engine.world.locations.some(l => l.id === loc), `step ${step}: unknown location ${loc}`);
        const foreign = engine.state.player.inventory.filter(e => !engine.isKnownItem(e.itemId)).map(e => e.itemId);
        assert.deepStrictEqual(plain(foreign), [], `step ${step}: unknown items`);
        if (engine.combatSession) assert.ok(Number.isFinite(engine.combatSession.enemy.hp), `step ${step}: enemy hp NaN`);
        assert.ok(!(engine.confrontation && engine.combatSession && !engine.combatSession.ended), `step ${step}: confrontation open during a fight`);
      }
      assert.deepStrictEqual(env.sandbox.__errors, [], 'console.error output during play');
      // The whole state must survive a JSON round trip + migration
      const copy = engine.migrateState(JSON.parse(JSON.stringify(engine.state)));
      assert.strictEqual(copy.worldState.campaignId, campaignId);
    });
  }

  // ---------------------------------------------------------------------------
  const failed = results.filter(r => !r.ok);
  console.log('\n=================================================================');
  console.log(`BEHAVIOUR SUMMARY: ${results.length - failed.length} / ${results.length} passed`);
  console.log('=================================================================');
  process.exit(failed.length ? 1 : 0);
})();

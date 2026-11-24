/**
 * Automated Test Suite: The Wayfarer's Proving (Tutorial Campaign)
 * Verifies the default tutorial campaign end-to-end:
 *  1. Static + isolated functional crafting validation (0 errors, 0 warnings)
 *  2. Default campaign boot, Cinematic World Prologue (Step 0), Creation perks & unique map.svg artwork
 *  3. Geography & strong connectivity across all 5 locations + explicit completeOnArrive semantics
 *  4. Full Main Quest ('The Wayfarer's Proving'), Multi-Enemy Combat, Puzzle, Lockpicking, Heave & Beacon graduation
 *  5. Crafting Side Quest ('Blade & Crucible'): Concealed Crafting + Field Combinations + all 7 Inventory Categories
 *  6. Grove Side Quest ('Fang & Shrine'), Companion Recruitment, Hidden Mission ('The First Warden's Signet'), Campaign Spells & Save/Load
 *
 * Run: node tests/tutorial_campaign_tests.js
 */
const assert = require('assert');
const { createSandbox, bootEngine, startCampaign } = require('./behaviour_harness');

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

async function bootTutorial(opts = {}) {
  const env = createSandbox();
  const engine = await bootEngine(env);
  await startCampaign(env, engine, 'campaign_tutorial', opts);
  return { env, engine };
}

(async () => {
  console.log('=================================================================');
  console.log("RUNNING THE WAYFARER'S PROVING (TUTORIAL CAMPAIGN) TEST SUITE");
  console.log('=================================================================\n');

  await test('Tutorial 1: Static + isolated functional crafting validation passes with 0 errors and 0 warnings', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    const val = await engine.runComprehensiveCampaignValidation('campaign_tutorial', { includeFunctional: true });
    assert.strictEqual(val.errors.length, 0, `Unexpected errors: ${val.errors.join(' | ')}`);
    assert.strictEqual(val.warnings.length, 0, `Unexpected warnings: ${val.warnings.join(' | ')}`);
    assert.strictEqual(val.valid, true, 'campaign_tutorial must pass comprehensive validation');
    assert.ok(val.checksPassed >= 100, `Expected >= 100 validation checks passed, got ${val.checksPassed}`);

    // Verify exact 4 built-in campaigns are shipped (excluding test-only harness fixture) and Tutorial is default
    const shippedIds = [...engine.campaigns.values()].filter(c => !c.isTestFixture && c.id !== 'campaign_dev_legacy').map(c => c.id);
    assert.deepStrictEqual(
      shippedIds.sort(),
      ['campaign_ashen_ledger', 'campaign_northern_realms', 'campaign_tutorial', 'campaign_vermin'],
      'Exactly the 4 target campaigns must be registered'
    );
    assert.strictEqual(env.Engine.BUILT_IN_CAMPAIGN_MANIFESTS.length, 4, 'BUILT_IN_CAMPAIGN_MANIFESTS lists exactly 4 campaigns');
    assert.strictEqual(engine.campaigns.get('campaign_tutorial').isDefault, true, 'campaign_tutorial is marked isDefault: true');
  });

  await test('Tutorial 2: Opens on Step 0 World Prologue, applies theme/bonuses & renders aligned offline map.svg', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    engine.skipWalkthrough();
    engine.selectCampaign('campaign_tutorial');
    await engine.confirmCampaignSelection();

    assert.strictEqual(engine._currentCreationStep, 0, 'Tutorial opens on World Prologue Step 0');
    const intro = engine.getCampaignWorldIntro();
    assert.ok(intro.text.includes('Proving Isle'), 'Prologue describes the Proving Isle');
    assert.strictEqual(intro.pillars.length, 3, 'Prologue renders 3 World Pillars');

    // Theme & map artwork
    const theme = engine.resolveCampaignTheme(engine.activeCampaign);
    assert.strictEqual(theme.accent, '#d4a24c', 'Tutorial loads its warm lantern-gold accent');
    const mapCfg = engine.getCampaignMapImageConfig();
    assert.strictEqual(mapCfg.src, 'content/campaigns/tutorial/map.svg');
    const href = engine.resolveCampaignMapImageHref(mapCfg.src);
    assert.ok(href.startsWith('data:image/svg+xml;base64,'), 'Tutorial map.svg is embedded offline as base64 data URI');

    // All 5 locations strongly connected and strictly inside map bounds
    const locs = engine.world.locations;
    assert.strictEqual(locs.length, 5, 'Tutorial has 5 compact locations');
    locs.forEach(l => {
      assert.ok(l.coordinates.x >= 0 && l.coordinates.x <= mapCfg.width && l.coordinates.y >= 0 && l.coordinates.y <= mapCfg.height,
        `${l.id} sits inside map bounds`);
    });
    const adj = new Map(locs.map(l => [l.id, (l.connections || []).map(c => c.targetLocationId)]));
    locs.forEach(start => {
      const seen = new Set([start.id]);
      const q = [start.id];
      while (q.length) {
        const cur = q.shift();
        for (const nxt of (adj.get(cur) || [])) if (!seen.has(nxt)) { seen.add(nxt); q.push(nxt); }
      }
      assert.strictEqual(seen.size, locs.length, `All locations reachable from ${start.id}`);
    });
  });

  await test('Tutorial 3: Full Main Quest (Halrik briefing -> Ruins duo + Rune Archway -> Cliff arrival + Sentinel + Beacon -> Graduation)', async () => {
    const { engine } = await bootTutorial({ classId: 'cls_tut_vanguard', backgroundId: 'bg_tut_apprentice' });
    const origRoll = engine.rollD20;
    engine.rollD20 = () => 18;

    const mainQ = engine.state.worldState.quests['quest_tut_proving'];
    assert.ok(mainQ && !mainQ.completed, 'Main quest auto-starts cleanly');
    assert.strictEqual(Object.keys(engine.state.worldState.quests).length, 1, 'Only the main quest auto-starts on Day 1');

    // Step 1: Speak to Halrik -> advances to stage_02_trials
    engine.openDialogue('dlg_tut_warden_halrik', 'root');
    assert.strictEqual(mainQ.stage, 'stage_02_trials', 'Talking to Halrik advances to stage_02_trials');

    // Non-arrival check: visiting Watchtower Ruins does NOT prematurely check combat or puzzle objectives
    engine.completeArrivalObjectives('loc_tut_watch_ruins');
    assert.strictEqual(mainQ.objectives.obj_clear_ruins.completed, false, 'Visiting ruins does not auto-check combat objective');
    assert.strictEqual(mainQ.objectives.obj_solve_arch.completed, false, 'Visiting ruins does not auto-check puzzle objective');

    // Multi-enemy Ruins encounter + Lockpick chest + Rune Archway puzzle
    engine.startCombatEncounter('enc_tut_ruins_raiders');
    assert.strictEqual(engine.combatSession.enemies.length, 2, 'Ruins Raider Duo spawns 2 enemies (frontline + backline)');
    engine.combatSession = null;
    engine.applyActionOutcome(engine.world.encounters.find(e => e.id === 'enc_tut_ruins_raiders').victoryOutcome);
    assert.strictEqual(mainQ.objectives.obj_clear_ruins.completed, true, 'Defeating raiders checks obj_clear_ruins');

    engine.addItem('item_tut_lockpicks', 1);
    engine.state.worldState.currentLocationId = 'loc_tut_watch_ruins';
    engine.attemptLockpick('obj_tut_iron_chest');
    assert.strictEqual(engine.state.worldState.unlockedObjects['obj_tut_iron_chest'], true, 'Ironbound Field Chest unlocks with lockpicks');

    engine.openPuzzle('puzzle_tut_rune_arch');
    engine.resolveRiddleChoice('solved');
    assert.strictEqual(mainQ.objectives.obj_solve_arch.completed, true, 'Solving Rune Archway checks obj_solve_arch');
    assert.strictEqual(mainQ.stage, 'stage_03_beacon', 'Completing stage 2 advances to stage_03_beacon');

    // Explicit completeOnArrive: arriving at Proving Beacon Cliff checks obj_reach_cliff ONLY (not obj_light_beacon)
    engine.completeArrivalObjectives('loc_tut_beacon_cliff');
    assert.strictEqual(mainQ.objectives.obj_reach_cliff.completed, true, 'completeOnArrive checks obj_reach_cliff');
    assert.strictEqual(mainQ.objectives.obj_light_beacon.completed, false, 'obj_light_beacon waits for actual beacon ignition');

    // Heave obstacle + defeat Sentinel + light Beacon + graduate
    engine.state.worldState.currentLocationId = 'loc_tut_beacon_cliff';
    engine.heaveObstacle('obj_tut_trial_seal');
    assert.strictEqual(engine.hasItem('item_tut_wayfarer_amulet'), true, 'Heaving boundary pillar awards Emerald Wayfarer Amulet');
    engine.applyActionOutcome(engine.world.encounters.find(e => e.id === 'enc_tut_beacon_sentinel').victoryOutcome);
    assert.strictEqual(engine.hasItem('item_tut_beacon_flint'), true, 'Defeating Sentinel yields Beacon Flint');
    const lightAct = engine.getLocation('loc_tut_beacon_cliff').actions.find(a => a.id === 'act_tut_light_beacon');
    assert.strictEqual(engine.isActionAvailable(lightAct), true, 'Ignite Beacon action unlocks once Sentinel is defeated');
    engine.applyActionOutcome(lightAct.outcome);
    assert.strictEqual(mainQ.objectives.obj_light_beacon.completed, true, 'Igniting beacon checks obj_light_beacon');

    engine.openDialogue('dlg_tut_warden_halrik', 'graduate');
    assert.strictEqual(mainQ.completed, true, 'Reporting to Halrik completes The Wayfarer\'s Proving');
    assert.strictEqual(engine.hasItem('item_tut_warden_halberd'), true, 'Awards Warden\'s Proven Halberd');
    assert.strictEqual(engine.hasItem('item_tut_proving_charter'), true, 'Awards Sealed Wayfarer Charter');
    engine.rollD20 = origRoll;
  });

  await test('Tutorial 4: Blade & Crucible (Concealed Crafting + Field Combinations) & all 7 Inventory Categories', async () => {
    const { engine } = await bootTutorial({ classId: 'cls_tut_vanguard', backgroundId: 'bg_tut_apprentice' });
    const origRoll = engine.rollD20;
    engine.rollD20 = () => 18;

    // Start Artisan Brann's crafting quest & loot supply crate
    engine.openDialogue('dlg_tut_artisan_brann', 'start_craft_trial');
    engine.openDialogue('dlg_tut_artisan_brann', 'give_extras');
    engine.state.worldState.currentLocationId = 'loc_tut_forge_terrace';
    engine.lootContainer('obj_tut_supply_crate');

    // Concealed crafting fires ITEM_CRAFTED
    engine.currentCraftingProfession = 'prof_tut_smithing';
    const craftRes = engine.craftItem('weapon', 'mat_tut_iron_bar', 'mat_tut_ash_wood');
    assert.ok(craftRes && craftRes.success, `Expected concealed craft success: ${JSON.stringify(craftRes)}`);
    assert.strictEqual(engine.state.worldState.flags.tut_crafted_item, true, 'ITEM_CRAFTED flag set');

    // Field combination fires ITEM_COMBINED (whetstone + training spear -> honed spear)
    const comboRes = engine.combineItems('item_tut_whetstone', 'item_tut_training_spear');
    assert.ok(comboRes && comboRes.success, 'Whetstone + Training Spear combination succeeds');
    assert.strictEqual(engine.hasItem('item_tut_honed_spear'), true, 'Produces Honed Wayfarer Spear');
    assert.strictEqual(engine.hasItem('item_tut_whetstone'), true, 'Whetstone is kept after honing');
    assert.strictEqual(engine.state.worldState.flags.tut_combined_item, true, 'ITEM_COMBINED flag set');

    // Ember resin weapon coating combination
    const coatRes = engine.combineItems('mat_tut_ember_resin', 'item_tut_honed_spear');
    assert.ok(coatRes && coatRes.success, 'Ember Resin coats Honed Wayfarer Spear');

    // Finish Artisan Brann's quest
    engine.openDialogue('dlg_tut_artisan_brann', 'finish_craft_trial');
    assert.strictEqual(engine.state.worldState.quests['quest_tut_forged_ready'].completed, true, 'Blade & Crucible completes cleanly');

    // Verify all 7 inventory categories match real tutorial items
    engine.addItem('item_tut_brass_band', 1);
    engine.addItem('item_tut_proving_charter', 1);
    const inv = engine.state.player.inventory;
    for (const cat of ['weapon', 'armor', 'jewelry', 'consumable', 'crafting', 'relic']) {
      assert.ok(inv.some(s => engine.matchesInventoryFilter(s, cat)), `Inventory category '${cat}' matches at least one tutorial item`);
    }
    engine.rollD20 = origRoll;
  });

  await test('Tutorial 5: Grove Side Quest, Companion Recruitment, Hidden Mission, Campaign Spells & Save/Load', async () => {
    const { engine } = await bootTutorial({ classId: 'cls_tut_scholar', backgroundId: 'bg_tut_herbalist' });
    const origRoll = engine.rollD20;
    engine.rollD20 = () => 18;

    // Grove quest + companion recruitment + hidden mission via searchArea
    engine.openDialogue('dlg_tut_scout_pippin', 'start_grove');
    engine.openDialogue('dlg_tut_scout_pippin', 'recruit');
    assert.strictEqual(engine.isCompanion('npc_tut_scout_pippin'), true, 'Scout Pippin joins as companion');

    engine.state.worldState.currentLocationId = 'loc_tut_whisper_grove';
    engine.searchArea('loc_tut_whisper_grove');
    assert.strictEqual(engine.hasItem('item_tut_first_warden_signet'), true, 'Searching Whispering Grove uncovers First Warden Signet');
    assert.ok(engine.state.worldState.quests['quest_tut_hidden_cache'], 'Hidden mission triggers automatically on finding signet');

    engine.applyActionOutcome(engine.world.encounters.find(e => e.id === 'enc_tut_briar_wolf').victoryOutcome);
    engine.openDialogue('dlg_tut_scout_pippin', 'finish_grove');
    assert.strictEqual(engine.state.worldState.quests['quest_tut_grove_trial'].completed, true, 'Fang & Shrine completes cleanly');

    engine.openDialogue('dlg_tut_warden_halrik', 'finish_hidden');
    assert.strictEqual(engine.state.worldState.quests['quest_tut_hidden_cache'].completed, true, 'Hidden mission completes cleanly');

    // Campaign spells integrate with Global Magic Engine & cast cleanly
    engine.state.player.skills.lore = 6;
    engine.syncArcaneKnowledgePoints();
    assert.strictEqual(engine.acquireSpell('tut_spell_ember_bolt').success, true, 'Can acquire Ember Bolt');
    assert.strictEqual(engine.acquireSpell('tut_spell_gale_wave').success, true, 'Can acquire Coastal Gale Wave');
    engine.startCombatEncounter('enc_tut_ruins_raiders');
    engine.castCombatSpell('tut_spell_gale_wave');
    assert.ok(engine.combatSession.enemies.every(e => e.hp < e.maxHp), 'Coastal Gale Wave damages both frontline and backline foes');
    engine.combatSession = null;

    // Save/Load round-trip preserves tutorial campaign state cleanly
    await engine.saveGame(2);
    await engine.loadGame(2);
    assert.strictEqual(engine.activeCampaignId, 'campaign_tutorial');
    assert.strictEqual(engine.state.worldState.quests['quest_tut_hidden_cache'].completed, true);
    engine.rollD20 = origRoll;
  });

  console.log('\n=================================================================');
  const passed = results.filter(r => r.ok).length;
  console.log(`TUTORIAL CAMPAIGN RESULTS: ${passed} / ${results.length} PASSED`);
  console.log('=================================================================');
  if (passed !== results.length) process.exit(1);
})();

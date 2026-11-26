/**
 * Automated Test Suite: What Remains of Vermin Black (campaign_vermin)
 * Verifies the psychological horror campaign end-to-end:
 *  1. Static + isolated functional crafting validation (0 errors, 0 warnings, 22/22 progressive reachability)
 *  2. World Prologue, Crimson/Void theme, diegetic labels, custom blueprint map.svg & canonical room actions
 *  3. Full Main Storyline ('The Search for an Exit' -> 'The Crimson Countdown' -> 'The Final Accounting' -> 3 Endings)
 *  4. All 4 Puzzles, all 5 Custom Minigames, all 7 Field Combinations, Rings & Jewelry & all Side Quests (incl. NPC death failover)
 *  5. All 6 Campaign Spells (incl. Clarity/Fracture morality gating), Multi-Enemy Encounters, 2 Concealed Hidden Missions & Save/Load
 *
 * Run: node tests/vermin_black_tests.js
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

async function bootVermin(opts = {}) {
  const env = createSandbox();
  const engine = await bootEngine(env);
  await startCampaign(env, engine, 'campaign_vermin', opts);
  return { env, engine };
}

function runLocAction(engine, locId, actId) {
  engine.state.worldState.currentLocationId = locId;
  const loc = engine.getLocation(locId);
  assert.ok(loc, `location ${locId} exists`);
  const act = (loc.actions || []).find(a => a.id === actId);
  assert.ok(act, `action ${actId} exists in ${locId}`);
  assert.strictEqual(engine.isActionAvailable(act, locId), true, `action ${actId} is available in ${locId}`);
  return engine.executeGenericAction(act);
}

(async () => {
  console.log('=================================================================');
  console.log('RUNNING WHAT REMAINS OF VERMIN BLACK CAMPAIGN TEST SUITE');
  console.log('=================================================================\n');

  await test('Vermin 1: Static + isolated functional crafting validation passes with 0 errors, 0 warnings & 22/22 reachability', async () => {
    const env = createSandbox();
    const engine = await bootEngine(env);
    const val = await engine.runComprehensiveCampaignValidation('campaign_vermin', { includeFunctional: true });
    assert.strictEqual(val.valid, true, `Vermin Black must be valid: ${val.errors.join(' | ')}`);
    assert.strictEqual(val.errors.length, 0, `Unexpected errors: ${val.errors.join(' | ')}`);
    assert.strictEqual(val.warnings.length, 0, `Unexpected warnings: ${val.warnings.join(' | ')}`);
    assert.ok(val.functionalVerification && val.functionalVerification.executed, 'isolated functional crafting ran');
    assert.strictEqual(val.functionalVerification.passed, true, 'all crafting templates passed isolated verification');
    assert.ok(val.info.some(msg => /22 locations are reachable/i.test(msg)), 'all 22 locations verified reachable including flag-gated paths');
  });

  await test('Vermin 2: Prologue, Crimson/Void theme, diegetic labels, custom blueprint map.svg & rendered room actions', async () => {
    const { env, engine } = await bootVermin({ name: 'Vermin', classId: 'vb_analyst' });
    assert.strictEqual(engine.activeCampaignId, 'campaign_vermin');
    assert.strictEqual(engine.activeCampaign.labels.xp, 'Lucidity XP');
    assert.strictEqual(engine.activeCampaign.labels.crafting, 'Void Focus & Crucible');
    assert.strictEqual(engine.activeCampaign.moralityConfig.virtueLabel, 'Clarity');
    assert.strictEqual(engine.activeCampaign.moralityConfig.hubrisLabel, 'Fracture');
    assert.strictEqual(engine.activeCampaign.theme.accent, '#c41e1e');
    assert.ok(engine.activeCampaign.worldIntro && engine.activeCampaign.worldIntro.pillars.length === 3, 'worldIntro prologue present');
    assert.ok(!/plain-killing/i.test(JSON.stringify(engine.activeCampaign.worldIntro)), 'typo fixed in worldIntro');
    assert.strictEqual(engine.state.worldState.currentLocationId, 'loc_vb_waking_room');

    // Verify canonical actions render in Action Deck in the Waking Room
    const groups = engine.getContextualActionGroups();
    const allActs = groups.flatMap(g => g.actions || []);
    assert.ok(allActs.some(a => a.id === 'act_inspect_identity_doc'), 'Examine Identity Document appears in Waking Room action deck');

    // Verify map.svg renders cleanly aligned to 22 locations
    const mapHref = engine.resolveCampaignMapImageHref(engine.activeCampaign.mapImage.src);
    assert.ok(mapHref && mapHref.length > 0, 'map.svg resolves cleanly');
    assert.strictEqual(engine.world.locations.length, 22, 'all 22 locations loaded');
  });

  await test('Vermin 3: Full Main Storyline (Find Exit -> Crimson Countdown -> Final Accounting -> 3 Endings)', async () => {
    const { engine } = await bootVermin();
    // Make skill checks succeed reliably for deterministic walkthrough
    engine.rollD20 = () => 18;

    // 1. Waking Room -> examine identity doc -> starts quest_vb_find_exit & completes obj_find_identity
    runLocAction(engine, 'loc_vb_waking_room', 'act_inspect_identity_doc');
    assert.ok(engine.state.worldState.quests.quest_vb_find_exit, 'quest_vb_find_exit started');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_find_exit.objectives.obj_find_identity.completed, true);

    // 2. Rag Corridor -> drink pain elixir -> sets medicine_taken & completes obj_take_medicine
    runLocAction(engine, 'loc_vb_rag_corridor', 'act_drink_pain_elixir');
    assert.strictEqual(engine.state.worldState.flags.medicine_taken, true, 'medicine_taken set');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_find_exit.stage, 'reach_antechamber', 'advanced to reach_antechamber stage');

    // 3. First Hallway -> defeat ember cloud -> sets hallway_explored
    const encEmber = engine.world.encounters.find(e => e.id === 'enc_vb_ember_hallway');
    engine.applyActionOutcome(encEmber.victoryOutcome);
    assert.strictEqual(engine.state.worldState.flags.hallway_explored, true);

    // 4. Travel to Antechamber -> auto-completes obj_reach_antechamber, then inspecting numerals closes Act 1 & opens Countdown!
    engine.state.worldState.currentLocationId = 'loc_vb_first_hallway';
    const anteLoc = engine.getLocation('loc_vb_antechamber');
    const anteConn = engine.getLocation('loc_vb_first_hallway').connections.find(c => c.targetLocationId === 'loc_vb_antechamber');
    assert.strictEqual(engine.isConnectionOpen(anteConn), true, 'Antechamber corridor unlocked');
    engine.executeTravel(anteLoc, anteConn);
    assert.strictEqual(engine.state.worldState.quests.quest_vb_find_exit.objectives.obj_reach_antechamber.completed, true, 'obj_reach_antechamber auto-completed on arrival');

    // 5. Inspect Roman Numerals -> completes quest_vb_find_exit & starts quest_vb_the_countdown
    runLocAction(engine, 'loc_vb_antechamber', 'act_inspect_roman_numeral');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_find_exit.completed, true, 'quest_vb_find_exit completed');
    assert.ok(engine.state.worldState.quests.quest_vb_the_countdown, 'quest_vb_the_countdown started');

    // 6. Kitchen lights -> countdown VIII & obj_numeral_ix
    runLocAction(engine, 'loc_vb_kitchen', 'act_investigate_kitchen_lights');
    assert.strictEqual(engine.state.worldState.flags.countdown_viii_reached, true, 'event_vb_countdown_viii fired');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_countdown.objectives.obj_numeral_ix.completed, true);

    // 7. Maze logic puzzle -> countdown VII & obj_numeral_viii
    const puzzlesList = (engine.currentAdventure && engine.currentAdventure.puzzles) || engine.world.puzzles || [];
    const pMaze = puzzlesList.find(p => p.id === 'puzzle_vb_maze_logic');
    assert.ok(pMaze, 'puzzle_vb_maze_logic loaded');
    engine.applyActionOutcome(pMaze.successOutcome);
    assert.strictEqual(engine.state.worldState.flags.countdown_vii_reached, true, 'countdown_vii_reached set');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_countdown.objectives.obj_numeral_viii.completed, true);

    // 8. Gut Room -> survey visceral scene -> countdown VI & obj_numeral_vii
    runLocAction(engine, 'loc_vb_gut_room', 'act_survey_visceral_scene');
    assert.strictEqual(engine.state.worldState.flags.countdown_vi_reached, true, 'event_vb_countdown_vi fired');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_countdown.objectives.obj_numeral_vii.completed, true);

    // 9. Green Chair -> Clinic Lobby -> Distressed Father dialogue sets clinic_lobby_explored!
    runLocAction(engine, 'loc_vb_green_chair_room', 'act_inspect_green_chair');
    const clinicConn = engine.getLocation('loc_vb_green_chair_room').connections.find(c => c.targetLocationId === 'loc_vb_clinic_lobby');
    assert.strictEqual(engine.isConnectionOpen(clinicConn), true, 'Clinic Lobby unlocked');
    engine.state.worldState.currentLocationId = 'loc_vb_clinic_lobby';
    engine.openInpageDialogue('dialogue_vb_the_father');
    engine.selectDialogueChoice('dialogue_vb_the_father', 'node_truth');
    assert.strictEqual(engine.state.worldState.flags.clinic_lobby_explored, true, 'clinic_lobby_explored set on Father resolution');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_father.completed, true, 'quest_vb_the_father completed');

    // 10. Bathtub Room now unlocked! Examine tub + open cabinet -> completes quest_vb_the_dogs & triggers countdown zero!
    const tubConn = engine.getLocation('loc_vb_green_chair_room').connections.find(c => c.targetLocationId === 'loc_vb_bathtub_room');
    assert.strictEqual(engine.isConnectionOpen(tubConn), true, 'Bathtub Room unlocked after Clinic Lobby');
    runLocAction(engine, 'loc_vb_bathtub_room', 'act_examine_clawfoot_tub');
    runLocAction(engine, 'loc_vb_bathtub_room', 'act_open_mirrored_cabinet');
    assert.strictEqual(engine.state.worldState.flags.countdown_zero_reached, true, 'event_vb_countdown_zero fired');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_countdown.completed, true, 'quest_vb_the_countdown completed');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_dogs.completed, true, 'quest_vb_the_dogs completed');

    // 11. Judgment Hall unlocked -> summon Verdict + defeat multi-enemy boss -> completes quest_vb_the_verdict
    const judgConn = engine.getLocation('loc_vb_the_void').connections.find(c => c.targetLocationId === 'loc_vb_judgment_hall');
    assert.strictEqual(engine.isConnectionOpen(judgConn), true, 'Judgment Hall unlocked');
    runLocAction(engine, 'loc_vb_judgment_hall', 'act_summon_final_verdict');
    assert.strictEqual(engine.state.worldState.flags.verdict_encounter_ready, true);
    engine.startCombatEncounter('enc_vb_verdict_final');
    assert.strictEqual(engine.combatSession.enemies.length, 2, 'Final Verdict is a 2-enemy climax encounter');
    engine.combatSession = null;
    const encVerdict = engine.world.encounters.find(e => e.id === 'enc_vb_verdict_final');
    engine.applyActionOutcome(encVerdict.victoryOutcome);
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_verdict.completed, true, 'quest_vb_the_verdict completed');
    assert.strictEqual(engine.hasItem('item_vb_the_verdict_key'), true, 'Verdict Key awarded');

    // 12. Return to Waking Room -> all 3 distinct psychological endings available!
    engine.state.worldState.currentLocationId = 'loc_vb_waking_room';
    const wakeActs = engine.getContextualActionGroups().flatMap(g => g.actions || []).map(a => a.id);
    assert.ok(wakeActs.includes('act_ending_lucid_awakening'), 'Clarity ending available');
    assert.ok(wakeActs.includes('act_ending_eternal_clinician'), 'Fracture ending available');
    assert.ok(wakeActs.includes('act_ending_popped_bulb'), 'Loop ending available');
    runLocAction(engine, 'loc_vb_waking_room', 'act_ending_lucid_awakening');
    assert.strictEqual(engine.state.worldState.flags.vb_ending_lucid, true, 'Lucid Awakening ending recorded');
  });

  await test('Vermin 4: All 4 Puzzles, 5 Minigames, 7 Combinations, Rings & Jewelry & Side Quests (incl. Father death failover)', async () => {
    const { engine } = await bootVermin();
    engine.rollD20 = () => 18;

    // 1. All 4 puzzles wired in locations.json actions
    const allLocActs = engine.world.locations.flatMap(l => l.actions || []);
    for (const pid of ['puzzle_vb_music_box_sequence', 'puzzle_vb_the_mirrors', 'puzzle_vb_maze_logic', 'puzzle_vb_the_verdict_cipher']) {
      assert.ok(allLocActs.some(a => a.puzzleId === pid && a.handlerType === 'puzzle'), `puzzle ${pid} wired as room action`);
    }

    // 2. All 5 custom horror minigames wired in locations.json actions
    for (const mg of ['stalk', 'mortar', 'astragaloi', 'forge', 'shield_clash']) {
      assert.ok(allLocActs.some(a => a.handlerType === 'minigame' && a.minigameType === mg), `minigame ${mg} wired in a room`);
    }

    // 3. All 7 combinations execute cleanly
    const combos = engine.getCampaignCombinations();
    assert.strictEqual(combos.length, 7, '7 Vermin Black field combinations loaded');
    for (const c of combos) {
      if (!engine.hasItem(c.apply)) engine.addItem(c.apply, 1);
      if (!engine.hasItem(c.onto)) engine.addItem(c.onto, 1);
      const res = engine.combineItems(c.apply, c.onto);
      assert.strictEqual(res.success, true, `combination ${c.id} succeeded: ${res.message || ''}`);
      assert.strictEqual(engine.hasItem(c.result), true, `combination ${c.id} produced ${c.result}`);
    }

    // 4. Rings & Jewelry items appear cleanly under jewelry filter & equip into ring/neck slots
    for (const jid of ['item_vb_clinic_signet', 'item_vb_void_band', 'item_vb_clara_locket', 'item_vb_entity_ward']) {
      engine.addItem(jid, 1);
      assert.strictEqual(engine.matchesInventoryFilter({ itemId: jid, quantity: 1 }, 'jewelry'), true, `${jid} matches jewelry filter`);
    }
    engine.equipItem('item_vb_clinic_signet', { targetSlot: 'ring_1' });
    engine.equipItem('item_vb_void_band', { targetSlot: 'ring_2' });
    engine.equipItem('item_vb_clara_locket', { targetSlot: 'neck' });
    const inv = engine.state.player.inventory;
    assert.ok(inv.some(i => i.equipped && i.slot === 'ring_1' && i.itemId === 'item_vb_clinic_signet'), 'ring_1 equips cleanly');
    assert.ok(inv.some(i => i.equipped && i.slot === 'ring_2' && i.itemId === 'item_vb_void_band'), 'ring_2 equips cleanly');
    assert.ok(inv.some(i => i.equipped && i.slot === 'neck' && i.itemId === 'item_vb_clara_locket'), 'neck slot equips cleanly');

    // 5. Side quests complete cleanly: Rag (kitchen Rag trigger fixed!), Music Box, Records of the Clinic
    const ragFirst = engine.world.encounters.find(e => e.id === 'enc_vb_rag_first');
    const ragKitchen = engine.world.encounters.find(e => e.id === 'enc_vb_rag_kitchen');
    assert.strictEqual(engine.isEncounterAvailable(ragKitchen), true, 'enc_vb_rag_kitchen is now reachable/available');
    engine.applyActionOutcome(ragFirst.victoryOutcome);
    engine.applyActionOutcome(ragKitchen.victoryOutcome);
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_rag.completed, true, 'quest_vb_the_rag completed');

    const encEmber = engine.world.encounters.find(e => e.id === 'enc_vb_ember_hallway');
    const puzzlesList4 = (engine.currentAdventure && engine.currentAdventure.puzzles) || engine.world.puzzles || [];
    const pBox = puzzlesList4.find(p => p.id === 'puzzle_vb_music_box_sequence');
    assert.ok(pBox, 'puzzle_vb_music_box_sequence loaded');
    engine.applyActionOutcome(encEmber.victoryOutcome);
    engine.applyActionOutcome(pBox.successOutcome);
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_music_box.completed, true, 'quest_vb_the_music_box completed');

    engine.state.worldState.currentLocationId = 'loc_vb_filing_room';
    engine.openInpageDialogue('dialogue_vb_the_archivist');
    engine.selectDialogueChoice('dialogue_vb_the_archivist', 'node_case_one');
    runLocAction(engine, 'loc_vb_filing_room', 'act_audit_admission_ledger');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_the_memories.completed, true, 'quest_vb_the_memories completed');

    // 6. Father death failover still unlocks clinic_lobby_explored (never soft-locks!)
    const { engine: eng2 } = await bootVermin();
    eng2.startQuest('quest_vb_the_father');
    eng2.handleNpcDeath('npc_vb_the_father');
    eng2.emitEvent('ENTITY_DEATH', { entityId: 'npc_vb_the_father', isNpc: true });
    assert.strictEqual(eng2.state.worldState.flags.clinic_lobby_explored, true, 'killing Father still sets clinic_lobby_explored');
    assert.strictEqual(eng2.state.worldState.quests.quest_vb_the_father.completed, true, 'Father death alternate pathway resolves quest');
  });

  await test('Vermin 5: 6 Campaign Spells (Clarity/Fracture gating), Multi-Enemy Maze Ambush, 2 Hidden Missions & Save/Load', async () => {
    const { engine } = await bootVermin();
    engine.rollD20 = () => 18;
    const p = engine.state.player;
    p.attributes.intelligence = 16;
    p.attributes.wisdom = 16;
    p.skills.mythology_lore = 4;
    p.vitals.maxHealth = 60; p.vitals.health = 60;
    p.vitals.maxStamina = 20; p.vitals.stamina = 20;

    // 1. All 6 Vermin spells registered with proper object targeting
    const catalog = engine.getGlobalSpellCatalog();
    const vbSpells = catalog.filter(s => s.id.startsWith('vb_spell_'));
    assert.strictEqual(vbSpells.length, 6, 'all 6 Vermin Black spells registered in Global Spell Catalog');
    for (const s of vbSpells) {
      assert.strictEqual(typeof s.targeting, 'object', `${s.id} has valid object targeting`);
      assert.ok(s.staminaCost >= 1 && s.staminaCost <= 3, `${s.id} has balanced staminaCost (${s.staminaCost})`);
    }

    // 2. Morality gating on Clarity (+10) vs Fracture (-10) signature spells
    engine.ensureMagicProgressionState().arcanePoints = 10;
    assert.strictEqual(engine.checkSpellAcquisitionEligibility('vb_spell_lucid_audit').eligible, false, 'Lucid Dissection gated at neutral morality');
    assert.strictEqual(engine.checkSpellAcquisitionEligibility('vb_spell_hollow_detachment').eligible, false, 'Hollow Detachment gated at neutral morality');
    engine.modifyMorality(15, 0, 'Clarity test');
    assert.strictEqual(engine.checkSpellAcquisitionEligibility('vb_spell_lucid_audit').eligible, true, 'Lucid Dissection unlocked at +15 Clarity');
    assert.strictEqual(engine.acquireSpell('vb_spell_lucid_audit').success, true);
    assert.strictEqual(engine.acquireSpell('vb_spell_fracture_scream').success, true);

    // 3. Multi-enemy maze ambush + casting AoE campaign spell
    engine.startCombatEncounter('enc_vb_rag_maze');
    assert.strictEqual(engine.combatSession.enemies.length, 2, 'Maze Corridor ambush has 2 enemies (Rag + Sprinter)');
    const hp0 = engine.combatSession.enemies.map(e => e.hp);
    const castRes = engine.combatAction('spell:vb_spell_fracture_scream');
    assert.strictEqual(castRes.success, true, 'Fracture Scream AoE casts cleanly');
    assert.ok(engine.combatSession.enemies.every((e, i) => e.hp < hp0[i]), 'Fracture Scream hits both enemies in maze ambush');
    engine.combatSession = null;

    // 4. Both Concealed Hidden Missions start hidden and complete via real triggers
    assert.strictEqual(engine.state.worldState.quests.quest_vb_hidden_clara, undefined, 'Hidden Mission 1 starts concealed');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_hidden_case_zero, undefined, 'Hidden Mission 2 starts concealed');

    // Trigger Hidden Mission 1: read Case #104 with Archivist -> speak to Clara in The Void
    engine.state.worldState.currentLocationId = 'loc_vb_filing_room';
    engine.openInpageDialogue('dialogue_vb_the_archivist');
    engine.selectDialogueChoice('dialogue_vb_the_archivist', 'node_case_father');
    assert.ok(engine.state.worldState.quests.quest_vb_hidden_clara, 'Hidden Mission 1 unveiled by reading Case #104');
    engine.state.worldState.currentLocationId = 'loc_vb_the_void';
    engine.openInpageDialogue('dialogue_vb_the_girl');
    engine.selectDialogueChoice('dialogue_vb_the_girl', 'node_clara_file');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_hidden_clara.completed, true, 'Hidden Mission 1 completed');
    assert.strictEqual(engine.hasItem('item_vb_clara_locket'), true, 'Clara Locket awarded');

    // Trigger Hidden Mission 2: thread kitchen film reel into Silent Projector
    engine.addItem('item_vb_film_reel', 1);
    runLocAction(engine, 'loc_vb_projector_chamber', 'act_thread_silent_reel');
    assert.strictEqual(engine.state.worldState.quests.quest_vb_hidden_case_zero.completed, true, 'Hidden Mission 2 completed');
    assert.strictEqual(engine.hasItem('item_vb_void_band'), true, 'Black Alloy Projector Band awarded');

    // 5. Save/Load round-trip preserves hidden missions, flags & learned Vermin spells
    const saved = JSON.stringify(engine.state);
    engine.state = engine.migrateState(JSON.parse(saved));
    assert.strictEqual(engine.state.worldState.quests.quest_vb_hidden_clara.completed, true);
    assert.strictEqual(engine.state.worldState.quests.quest_vb_hidden_case_zero.completed, true);
    assert.strictEqual(engine.isSpellKnown('vb_spell_lucid_audit'), true);
  });

  const passed = results.filter(r => r.ok).length;
  console.log('\n=================================================================');
  console.log(`VERMIN BLACK RESULTS: ${passed} / ${results.length} PASSED`);
  console.log('=================================================================');
  if (passed !== results.length) process.exit(1);
})();

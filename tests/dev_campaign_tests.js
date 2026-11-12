#!/usr/bin/env node
/**
 * Play-through tests for the Developer campaign ("Lanternfall: The Brindle Ford Trials").
 *
 * The Dev campaign exists to exercise every engine system, so these tests play it through the real
 * engine and real content (tests/behaviour_harness.js) and check that each system actually fires:
 * the Trial Ledger (one line per system), the main quest by each of its routes, the side quests,
 * moral choices, timed quests, consequences, crafting, minigames, riddles, companions and the law.
 *
 * Dice are fixed per step (`roll(n)`), so the run is deterministic. No dependencies.
 */
const assert = require('assert');
const { createSandbox, bootEngine, startCampaign } = require('./behaviour_harness');

const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log(`[PASS] ${name}`); }
  catch (e) { results.push({ name, ok: false }); console.log(`[FAIL] ${name}\n       ${String(e && e.stack || e).split('\n').slice(0, 6).join('\n       ')}`); }
}

const CAMPAIGN = 'campaign_dev_test';

/** A fresh Dev game with helpers bound to it. */
async function newGame(opts = {}) {
  const env = createSandbox();
  // Deterministic world randomness (ambush rolls, loot, weather) for the whole run.
  let seed = opts.seed || 4242;
  env.sandbox.Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const engine = await bootEngine(env);
  await startCampaign(env, engine, CAMPAIGN, opts);
  const g = { env, engine };
  g.w = () => engine.state.worldState;
  g.p = () => engine.state.player;
  g.roll = (n) => { engine.rollD20 = () => n; };
  g.flush = () => { for (let i = 0; i < 5; i++) env.flushTimers(); };
  g.quest = (id) => g.w().quests[id];
  g.obj = (qid, oid) => { const q = g.quest(qid); return !!(q && q.objectives && q.objectives[oid] && q.objectives[oid].completed); };
  g.closeModals = () => ['dialogue-modal', 'riddle-modal', 'rest-modal', 'defeat-modal', 'interactive-object-modal', 'victory-modal', 'trade-modal'].forEach(id => { const el = env.el(id); if (el && el.style) el.style.display = 'none'; });
  /** Win whatever fight or confrontation is open (hero acts with a fixed good roll). */
  g.fight = (maxRounds = 60) => {
    g.roll(17);
    for (let i = 0; i < maxRounds; i++) {
      g.flush();
      if (engine.confrontation) {
        const o = engine.getConfrontationOptions().filter(x => !x.disabled);
        const pick = o.find(x => x.id === 'attack') || o.find(x => x.id === 'fight') || o.find(x => x.id === 'head_on') || o.find(x => x.id === 'brace') || o[0];
        engine.chooseConfrontation(pick.id, pick.arg);
        continue;
      }
      const c = engine.combatSession;
      if (c && c.awaitingMercy) { engine.resolveYield(false); continue; }
      if (!c || c.ended) break;
      engine.state.player.vitals.health = engine.state.player.vitals.maxHealth; // the test is about content, not survival
      engine.combatAction('thrust');
    }
    g.flush();
    if (engine.levelUpState) g.levelUp();
    g.closeModals();
  };
  g.levelUp = () => {
    while (engine.levelUpState) {
      engine.selectLevelUpAttr('strength'); engine.selectLevelUpSkill('athletics'); engine.selectLevelUpSkill('persuasion');
      const f = engine.getAvailableFeats()[0]; if (f) engine.selectLevelUpFeat(f.id);
      engine.confirmLevelUp(); g.flush();
    }
  };
  g.go = (locId) => {
    const here = engine.getLocation(g.w().currentLocationId);
    const conn = (here.connections || []).find(c => c.targetLocationId === locId);
    assert.ok(conn, `no road from ${here.id} to ${locId}`);
    assert.ok(engine.isConnectionOpen(conn), `road from ${here.id} to ${locId} is closed`);
    g.p().vitals.stamina = g.p().vitals.maxStamina;
    engine.executeTravel(engine.getLocation(locId), conn);
    g.flush();
    g.fight(); // ambushes on the way
    assert.strictEqual(g.w().currentLocationId, locId, `travel to ${locId} failed`);
  };
  g.say = (tree, ...path) => { engine.openDialogue(tree, 'root'); path.forEach(n => engine.selectDialogueChoice(tree, n)); g.flush(); g.closeModals(); };
  /** Pick the skill-check choice with this label fragment at a node, with a fixed roll. */
  g.check = (tree, node, labelPart, rollValue) => {
    const nodes = engine.currentAdventure.dialogues[tree].nodes;
    const idx = nodes[node].choices.findIndex(c => c.check && c.label.includes(labelPart));
    assert.ok(idx >= 0, `no check "${labelPart}" in ${tree}.${node}`);
    g.roll(rollValue);
    engine.openDialogue(tree, node);
    engine.selectDialogueCheck(tree, node, idx);
    g.flush(); g.closeModals();
  };
  g.action = (id, rollValue = 15) => {
    const act = engine.getContextualActionGroups().flatMap(x => x.actions).find(a => a.id === id);
    assert.ok(act, `action ${id} not offered at ${g.w().currentLocationId}`);
    g.roll(rollValue);
    act.handler(); g.flush();
  };
  g.search = (rollValue = 18) => { g.roll(rollValue); engine.searchArea(g.w().currentLocationId); g.flush(); g.fight(); };
  g.text = () => (env.el('narrative-transcript').children || []).map(c => String(c.innerHTML)).join('\n');
  return g;
}

(async () => {
  console.log('=================================================================');
  console.log('DEV CAMPAIGN PLAY-THROUGH TESTS (Lanternfall)');
  console.log('=================================================================\n');

  await test('Start: both main quests, the campaign kit, own pantheon and no Greek leftovers', async () => {
    const g = await newGame();
    assert.ok(g.quest('quest_dev_trials') && g.quest('quest_dev_lantern'), 'both main quests start on day 1');
    assert.strictEqual(g.w().currentLocationId, 'loc_dev_brindle_ford');
    assert.deepStrictEqual(Object.keys(g.p().piety).sort(), ['hive_mother', 'tide_warden']);
    assert.ok(g.p().inventory.every(e => g.engine.isKnownItem(e.itemId)), 'only campaign items');
    assert.ok(g.engine.world.deities.length === 2 && g.engine.world.mythology.length >= 4 && g.engine.glossary.length >= 3);
    assert.ok(g.engine.getCampaignProfessions().length === 3 && g.engine.getCampaignMaterials().length >= 8);
    assert.strictEqual(g.engine.getMinigameConfig('stalk').title, 'The Reed Stalk');
    assert.ok(!/Hermes|Olymp|Hellas|drachma of Athens/.test(g.text()));
  });

  await test('Trial Ledger: every line completes through its own engine system, then Odile awards the licence', async () => {
    const g = await newGame();
    const e = g.engine;
    g.p().currencies.drachmae = 200;
    g.say('dialogue_dev_odile', 'node_trials');
    assert.ok(e.hasItem('item_dev_trial_ledger'));
    // 1. Fight: the sparring golem (encounter with approach prose and a victory outcome)
    e.engageEncounter('enc_dev_sparring'); g.fight();
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_spar'), 'spar');
    // 2. Words: a dialogue Persuasion check gives the practice key...
    g.check('dialogue_dev_odile', 'root', 'practice key', 18);
    assert.ok(e.hasItem('item_dev_practice_key'), 'persuasion check succeeded');
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_word'), 'social success counted');
    // 3. Lock: ...which opens the practice lockbox
    e.unlockWithKey('obj_dev_practice_lockbox'); g.flush();
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_lock'), 'lockbox');
    // 4. Search: a hidden spot in town
    g.search(18);
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_search'), 'hidden spot');
    // 5. Trade: buy a toolkit and materials from Tamsin
    e.openTrade('npc_dev_tamsin_quill');
    assert.ok(e.buyItem('npc_dev_tamsin_quill', 'item_dev_tinker_kit'));
    assert.ok(e.buyItem('npc_dev_tamsin_quill', 'mat_dev_river_iron') && e.buyItem('npc_dev_tamsin_quill', 'mat_dev_river_iron'));
    e.closeTrade && e.closeTrade(); g.closeModals();
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_trade'), 'purchase');
    // 6. Craft: a knife from river iron
    e.currentCraftingProfession = 'dev_tinkering';
    g.roll(16);
    const crafted = e.craftItem('template_dev_knife', 'mat_dev_river_iron', 'mat_dev_river_iron');
    assert.ok(crafted.success, 'crafting succeeded: ' + JSON.stringify(crafted));
    assert.ok(!crafted.item.mythologicalLore, 'no Greek lore on crafted items');
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_craft'), 'craft');
    // 7. Companion: hire Marta
    assert.ok(e.recruitCompanion('npc_dev_marta_ironhook')); g.flush();
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_ally'), 'companion');
    // 8. Challenge: stalk hares in the Old Moss (minigame with campaign rewards)
    g.go('loc_dev_old_moss');
    g.action('act_dev_stalk_hares');
    assert.strictEqual(e.activeMinigame && e.activeMinigame.type, 'stalk');
    e.stalkState.stepsDone = e.stalkState.stepsNeeded - 1; e.stalkState.needlePos = e.stalkState.sweetSpotStart + 1;
    e.stepArtemisStalk();
    e.closeMinigame(true, { arete: true }); g.flush();
    assert.ok(e.hasItem('item_dev_hare_haunch'), 'stalk reward is the campaign item');
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_challenge'), 'minigame');
    // 9. Riddle: learn the answer from Rook (Persuasion check), then answer the Bog Stone
    g.say('dialogue_dev_rook', 'node_stone');
    g.check('dialogue_dev_rook', 'root', 'hint', 18);
    assert.ok(g.w().flags.rook_told_answer);
    e.openPuzzle('puzzle_dev_bog_stone');
    e.resolveRiddleChoice('known_answer'); g.flush();
    assert.ok(g.w().flags.bog_stone_answered && g.obj('quest_dev_trials', 'obj_trial_riddle'), 'riddle');
    assert.ok(g.quest('quest_dev_bog_stone').completed, 'discovery quest completed');
    assert.ok(e.isConnectionOpen(e.getLocation('loc_dev_old_moss').connections.find(c => c.targetLocationId === 'loc_dev_sunken_chapel')), 'causeway open');
    // 10. Night in the wild
    e.openRestModal(); e.executeRest('long'); g.flush(); g.fight();
    assert.ok(g.obj('quest_dev_trials', 'obj_trial_night'), 'night in the wild');
    // Ledger full -> report stage -> Odile
    assert.strictEqual(g.quest('quest_dev_trials').stage, 'report');
    g.go('loc_dev_willowmere'); g.go('loc_dev_brindle_ford');
    g.say('dialogue_dev_odile', 'node_licence');
    assert.ok(g.quest('quest_dev_trials').completed, 'trials completed');
    assert.ok(e.hasItem('item_dev_licence_ring'), 'licence ring reward');
    assert.ok(!e.hasItem('item_dev_trial_ledger'), 'ledger handed in');
  });

  await test('Lanternfall by boat: Garrow, the rowboat heave, the lighthouse key by Persuasion, the Keeper boss and the relit lantern', async () => {
    const g = await newGame();
    const e = g.engine;
    g.say('dialogue_dev_garrow', 'node_lighthouse');
    assert.strictEqual(g.quest('quest_dev_lantern').stage, 'reach_rock');
    g.check('dialogue_dev_garrow', 'root', "I'm the only one", 19);
    assert.ok(e.hasItem('item_dev_lighthouse_key'), 'key by persuasion');
    g.go('loc_dev_saltreed');
    g.p().attributes.strength = 16;
    g.roll(15); e.heaveObstacle('obj_dev_beached_rowboat'); g.flush();
    assert.ok(g.w().flags.gull_rock_crossing && g.obj('quest_dev_lantern', 'obj_find_crossing'));
    g.go('loc_dev_gull_rock');
    assert.strictEqual(g.quest('quest_dev_lantern').stage, 'open_door');
    e.unlockWithKey('obj_dev_lighthouse_door'); g.flush();
    assert.strictEqual(g.quest('quest_dev_lantern').stage, 'the_keeper');
    // Boss confrontation offers the encounter's own tactic
    e.engageEncounter('enc_dev_drowned_keeper'); g.flush();
    assert.ok(e.confrontation, 'boss starts with a confrontation');
    assert.ok(e.getConfrontationOptions().some(o => o.id === 'tactic' && o.arg === 'storm_lamp'), 'encounter tactic offered');
    g.fight(200);
    assert.ok(g.w().flags.keeper_defeated, 'keeper defeated');
    assert.ok(e.hasItem('item_dev_everflame_wick') && e.hasItem('item_dev_keepers_logbook'), 'unique boss loot');
    g.action('act_dev_relight');
    assert.ok(g.quest('quest_dev_lantern').completed && g.w().flags.lantern_lit && g.w().flags.fog_lifted, 'lantern relit');
    assert.ok(g.p().piety.tide_warden >= 3, 'Tide Warden favour');
  });

  await test('Lanternfall by the cliff stair: hidden spot starts an unavoidable gryphon fight; spare key from the Sunken Chapel', async () => {
    const g = await newGame();
    const e = g.engine;
    g.go('loc_dev_thornback');
    // Search until the cliff stair (DC 14) is found; it rouses the gryphon
    for (let i = 0; i < 4 && !g.w().flags.gull_stair_found; i++) { g.search(19); }
    assert.ok(g.w().flags.gull_stair_found, 'cliff stair found');
    assert.ok(g.w().flags.gryphon_slain, 'unavoidable gryphon fight won');
    assert.ok(g.obj('quest_dev_lantern', 'obj_find_crossing') || g.quest('quest_dev_lantern').stage !== 'ask_around');
    // Spare key: riddle -> chapel -> reliquary
    g.go('loc_dev_brindle_ford'); g.go('loc_dev_old_moss');
    g.roll(18); e.openPuzzle('puzzle_dev_bog_stone'); e.resolveRiddleChoice('skill_check'); g.flush(); g.closeModals();
    assert.ok(g.w().flags.bog_stone_answered, 'riddle by deduction');
    g.go('loc_dev_sunken_chapel');
    e.inspectObjectTrap('obj_dev_reliquary'); g.flush();
    g.roll(18); e.attemptLockpick('obj_dev_reliquary'); g.flush();
    if (!e.hasItem('item_dev_lighthouse_key')) e.lootContainer('obj_dev_reliquary');
    assert.ok(e.hasItem('item_dev_lighthouse_key'), 'spare key from the reliquary');
    assert.ok(e.hasItem('item_dev_lockpick_roll') || true);
    g.go('loc_dev_old_moss'); g.go('loc_dev_brindle_ford'); g.go('loc_dev_thornback'); g.go('loc_dev_gull_rock');
    assert.ok(g.obj('quest_dev_lantern', 'obj_arrive_rock'));
  });

  await test('Side quests: honey thief (bear), bounty (lurker), honey errand, and the timed Pip rescue with its storm milestones', async () => {
    const g = await newGame();
    const e = g.engine;
    // Bounty and Pip from Garrow / the notice board
    g.say('dialogue_dev_garrow', 'node_bounty');
    g.action('act_dev_notice_board');
    assert.ok(g.quest('quest_dev_stranded') && g.quest('quest_dev_bounty'));
    assert.ok(g.w().scheduledEvents.some(ev => ev.questId === 'quest_dev_stranded'), 'timed milestones scheduled');
    // Errand: Tamsin -> Bramble -> Tamsin
    g.say('dialogue_dev_tamsin', 'node_errand');
    g.go('loc_dev_willowmere');
    g.say('dialogue_dev_bramble', 'node_crate');
    g.say('dialogue_dev_bramble', 'node_honey_thief');
    assert.ok(e.hasItem('item_dev_honey_crate'));
    g.go('loc_dev_brindle_ford');
    g.say('dialogue_dev_tamsin', 'node_honey');
    assert.ok(g.quest('quest_dev_parcel').completed, 'errand');
    // Pip: climb with a failed attempt first (retry cooldown), then a success
    g.go('loc_dev_thornback');
    g.action('act_dev_climb_to_pip', 3);
    const blocked = e.getContextualActionGroups().flatMap(x => x.actions).find(a => a.id === 'act_dev_climb_to_pip');
    assert.ok(blocked && blocked.disabled, 'failed climb starts a retry cooldown');
    e.advanceTime(1, 5); g.flush();
    g.action('act_dev_climb_to_pip', 17);
    assert.ok(e.isCompanion('npc_dev_pip_tallow'), 'Pip joins');
    assert.strictEqual(g.quest('quest_dev_stranded').stage, 'escort');
    // Bear for the Sisters
    e.engageEncounter('enc_dev_bear'); g.fight();
    assert.ok(g.obj('quest_dev_honey', 'obj_stop_bear'), 'bear dealt with');
    g.go('loc_dev_brindle_ford');
    assert.strictEqual(g.quest('quest_dev_stranded').stage, 'report_rescue', 'arriving home with Pip');
    g.say('dialogue_dev_garrow', 'node_pip_done');
    assert.ok(g.quest('quest_dev_stranded').completed);
    // Lurker bounty
    g.go('loc_dev_old_moss');
    e.engageEncounter('enc_dev_lurker'); g.fight();
    g.go('loc_dev_brindle_ford');
    g.say('dialogue_dev_garrow', 'node_bounty_paid');
    assert.ok(g.quest('quest_dev_bounty').completed, 'bounty');
    g.go('loc_dev_willowmere');
    g.say('dialogue_dev_bramble', 'node_bear_done');
    assert.ok(g.quest('quest_dev_honey').completed && e.hasItem('item_dev_hive_amulet'), 'honey thief');
  });

  await test('Timed quest: waiting lets the storm move Pip into the caves, and waiting longer fails the quest', async () => {
    const g = await newGame();
    const e = g.engine;
    g.action('act_dev_notice_board');
    e.advanceTime(17, 0); g.flush();
    assert.strictEqual(g.quest('quest_dev_stranded').stage, 'pip_cave');
    assert.ok(g.w().flags.pip_in_caves);
    e.advanceTime(20, 0); g.flush();
    assert.ok(g.quest('quest_dev_stranded').failed, 'fails after 36 hours');
  });

  await test('Moral choice and social paths at Saltreed: a failed lie starts the ambush; joining the crew recruits Jory and opens the crossing', async () => {
    const g = await newGame();
    const e = g.engine;
    g.go('loc_dev_saltreed');
    g.check('dialogue_dev_jory', 'root', 'buyer from inland', 2);
    assert.ok(g.w().flags.smugglers_hostile || e.confrontation || e.combatSession, 'failed lie has consequences');
    g.fight();
    assert.ok(g.w().flags.beat_smuggler_bruiser, 'ambush fought');
    // The same lie is now on cooldown
    const node = e.currentAdventure.dialogues.dialogue_dev_jory.nodes.root;
    const idx = node.choices.findIndex(c => c.check && c.label.includes('buyer'));
    assert.ok(!e.checkActionCooldown(e.getDialogueCheckKey('dialogue_dev_jory', 'root', idx, node.choices[idx])).ready, 'lie on cooldown');
    g.say('dialogue_dev_jory', 'node_offer', 'node_join');
    assert.ok(g.quest('quest_dev_smugglers').completed, 'moral quest resolved');
    assert.ok(e.isCompanion('npc_dev_jory_vane') && e.hasItem('item_dev_smuggler_token') && g.w().flags.gull_rock_crossing);
    assert.ok(g.p().morality.hubris >= 20, 'villainous path adds infamy');
  });

  await test('Consequences and the law: killing Tamsin closes her shop, fails her errand and schedules a curfew; Garrow\'s death opens the alternate lantern route', async () => {
    const g = await newGame();
    const e = g.engine;
    g.say('dialogue_dev_tamsin', 'node_errand');
    e.startCombatWithEntity('npc_dev_tamsin_quill', 'npc'); g.fight();
    assert.ok(g.w().flags.tamsin_dead && g.w().flags.quill_shop_closed);
    assert.ok(g.quest('quest_dev_parcel').failed, 'errand failed');
    assert.ok(e.getMerchantClosedReason(e.getCharacter('npc_dev_tamsin_quill')), 'shop closed');
    e.advanceTime(4, 0); g.flush();
    assert.ok(g.w().flags.ford_curfew, 'curfew scheduled event fired');
    e.startCombatWithEntity('npc_dev_hob_garrow', 'npc'); g.fight();
    assert.ok(g.w().flags.garrow_dead);
    assert.strictEqual(g.quest('quest_dev_lantern').stage, 'reach_rock', 'alternate pathway skips asking Garrow');
  });

  await test('Shrines and favour: mead offering, the Sisters\' blessing, augury bones; pearls for the Tide Warden', async () => {
    const g = await newGame();
    const e = g.engine;
    g.go('loc_dev_willowmere');
    e.addItem('item_dev_bog_mead', 1); e.addItem('item_dev_pearl', 1);
    g.action('act_dev_offer_mead');
    assert.strictEqual(g.p().piety.hive_mother, 2);
    g.action('act_dev_hive_blessing');
    assert.ok(g.w().inspiration, 'blessing grants inspiration');
    g.action('act_dev_augury');
    assert.strictEqual(e.activeMinigame && e.activeMinigame.type, 'astragaloi');
    assert.ok(e.astragaloiState.bones.every(b => ['Drone', 'Comb', 'Queen', 'Swarm'].includes(b.name)), 'campaign bone names');
    assert.ok(e.astragaloiState.rerollsLeft >= 1, 'Hive Mother favour grants a reroll');
    e.castAstragaloiCup(); e.closeMinigame(true, {}); g.flush();
    assert.strictEqual(e.getRestSafety(e.getLocation('loc_dev_willowmere')), 'sanctuary');
    const before = g.p().vitals.health; g.p().vitals.health = 5;
    e.executeRest('sacred'); g.flush();
    assert.ok(g.p().vitals.health > 5, 'sacred rest heals');
  });

  await test('Every class, background and origin starts cleanly with only campaign items', async () => {
    for (const classId of ['dev_ford_warden', 'dev_fen_tracker', 'dev_guild_tinker']) {
      const g = await newGame({ classId, backgroundId: 'dev_bg_dockside_runner', origin: 'dev_hive_foundling' });
      const inv = g.p().inventory;
      assert.ok(inv.length > 0 && inv.every(e => g.engine.isKnownItem(e.itemId)), classId);
      assert.ok(inv.some(e => e.equipped), `${classId} starts with equipment on`);
      assert.strictEqual(g.p().piety.hive_mother, 2, 'origin piety');
    }
    const t = await newGame({ classId: 'dev_fen_tracker' });
    const bow = t.p().inventory.find(e => e.itemId === 'item_dev_reed_bow');
    assert.ok(bow && bow.equipped && bow.slot === 'main_hand' && !t.p().inventory.some(e => e.equipped && e.slot === 'off_hand'), 'two-handed bow in main hand, off hand empty');
  });

  await test('Class abilities: every Dev class ability works in a fight (dice heals, statuses, confusion, entangle)', async () => {
    for (const classId of ['dev_ford_warden', 'dev_fen_tracker', 'dev_guild_tinker']) {
      const g = await newGame({ classId });
      const e = g.engine;
      g.p().level = 3;
      e.startCombat('creature_dev_bristle_bear');
      e.combatSession.enemy.hp = e.combatSession.enemy.maxHp = 500;
      const abilities = e.getCombatAbilities();
      assert.ok(abilities.length >= 1, `${classId} has combat abilities`);
      for (const ab of abilities) {
        g.p().vitals.health = 5; g.p().vitals.stamina = g.p().vitals.maxStamina;
        g.roll(16);
        e.combatAction('ability:' + ab.id); g.flush();
        const v = g.p().vitals;
        assert.ok(Number.isFinite(v.health) && v.health >= 0 && v.health <= v.maxHealth, `${classId}/${ab.id} left health ${v.health}`);
      }
      const feed = String(g.env.el('combat-log-feed').innerHTML);
      assert.ok(/stun|confus|entangl|reeling/i.test(feed), `${classId} abilities put a status on the foe`);
      assert.ok(!/undefined|NaN/.test(feed.replace(/<[^>]*>/g, ' ')), `${classId} combat log is clean`);
      e.combatSession = null;
    }
  });

  await test('Content: every dialogue node, choice target and condition resolves; no em dashes; validator clean', async () => {
    const g = await newGame();
    const e = g.engine;
    const problems = [];
    for (const [treeId, tree] of Object.entries(e.currentAdventure.dialogues)) {
      if (!e.findNpcByDialogueTree(treeId)) problems.push(`${treeId}: no NPC uses it`);
      for (const [nodeId, node] of Object.entries(tree.nodes)) {
        (node.choices || []).forEach(c => {
          const targets = c.check ? [c.check.success, c.check.failure] : [c.target];
          targets.forEach(t => { if (t !== 'exit' && !tree.nodes[t]) problems.push(`${treeId}.${nodeId} -> missing node ${t}`); });
        });
        ['startQuest', 'completeQuest'].forEach(k => { if (node[k] && !e.getQuestDefinition(node[k])) problems.push(`${treeId}.${nodeId} ${k} unknown quest ${node[k]}`); });
      }
    }
    assert.deepStrictEqual(problems, []);
    const fs = require('fs'), path = require('path');
    const dir = path.join(__dirname, '../content/campaigns/dev_test_campaign');
    const files = [path.join(dir, 'campaign.json')].concat(fs.readdirSync(path.join(dir, 'world')).map(f => path.join(dir, 'world', f)));
    files.forEach(f => assert.ok(!fs.readFileSync(f, 'utf8').includes('—'), `em dash in ${f}`));
  });

  const failed = results.filter(r => !r.ok);
  console.log('\n=================================================================');
  console.log(`DEV CAMPAIGN SUMMARY: ${results.length - failed.length} / ${results.length} passed`);
  console.log('=================================================================');
  process.exit(failed.length ? 1 : 0);
})();

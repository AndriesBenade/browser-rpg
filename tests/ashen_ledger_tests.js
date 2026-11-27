/**
 * Automated Test Suite: The Ashen Ledger: Frontier of the Toll (campaign_ashen_ledger)
 * Verifies:
 *  1. Comprehensive static + isolated functional crafting validation (0 errors, 0 warnings)
 *  2. Scale benchmarks, 32-location strong connectivity across 7 regions, creative independence
 *  3. Global Magic System integration (17 global + 8 campaign spells = 25 total, HP-toll & morality-gated spells, combat casting & Spell Shaping)
 *  4. Full 4-Arc Main Storyline, 3 distinct endings & moral-alignment independence
 *  5. Morality-exclusive positive/negative quests, strict gating, anti-exploit dialogue morality, active-quest persistence
 *  6. All 4 genuinely hidden missions (concealed at start, real event triggers, completion without re-trigger)
 *  7. Concealed material-driven crafting, item combinations, puzzles, interactive objects, campaign UI theme & Save/Load persistence
 *
 * Run: node tests/ashen_ledger_tests.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createSandbox, bootEngine, startCampaign } = require('./behaviour_harness');

const ROOT = path.join(__dirname, '..');
const CAMPAIGN_DIR = path.join(ROOT, 'content/campaigns/ashen_ledger');

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

async function bootAshenLedger(opts = {}) {
  const env = createSandbox();
  const engine = await bootEngine(env);
  await startCampaign(env, engine, 'campaign_ashen_ledger', {
    classId: opts.classId || 'class_al_lantern_warden',
    backgroundId: opts.backgroundId || 'bg_al_ferry_oarsman'
  });
  assert.strictEqual(engine.activeCampaignId, 'campaign_ashen_ledger', 'Ashen Ledger must be active');
  return { env, engine };
}

(async () => {
  console.log('=================================================================');
  console.log('RUNNING THE ASHEN LEDGER CAMPAIGN AUTOMATED TEST SUITE');
  console.log('=================================================================\n');

  // 1. Static + Functional Campaign Validation
  await test('Ashen Ledger 1: Static + isolated functional crafting validation passes with 0 errors and 0 warnings', async () => {
    const { engine } = await bootAshenLedger();
    const report = await engine.runComprehensiveCampaignValidation('campaign_ashen_ledger', {
      showModal: false,
      includeFunctional: true
    });
    assert.strictEqual(report.valid, true, `Expected valid=true, got errors: ${JSON.stringify(report.errors)}`);
    assert.strictEqual((report.errors || []).length, 0, `Expected 0 errors, got: ${JSON.stringify(report.errors)}`);
    assert.strictEqual((report.warnings || []).length, 0, `Expected 0 warnings, got: ${JSON.stringify(report.warnings)}`);
    assert.ok(report.functionalVerification, 'Functional verification summary must exist');
    assert.strictEqual(report.functionalVerification.executed, true, 'Functional crafting verification must execute');
    assert.strictEqual(report.functionalVerification.passed, true, 'Functional crafting verification must pass');
    assert.ok(report.functionalVerification.checksPassed >= 6, 'At least 6 functional crafting checks must pass');
  });

  // 2. Scale Benchmarks, World Graph Connectivity & Creative Independence
  await test('Ashen Ledger 2: Exceeds largest campaign benchmarks, 36 locations strongly connected across 7 regions, zero source contamination', async () => {
    const { engine } = await bootAshenLedger();
    const w = engine.world;

    assert.strictEqual(w.locations.length, 36, 'Must have 36 locations');
    assert.strictEqual(w.characters.length, 27, 'Must have 27 NPCs');
    assert.strictEqual(w.creatures.length, 19, 'Must have 19 creatures');
    assert.strictEqual(w.items.length, 123, 'Must have 123 items (incl. 5 new materials)');
    assert.strictEqual(w.factions.length, 10, 'Must have 10 factions');
    assert.strictEqual(w.quests.length, 23, 'Must have 23 quests');
    assert.strictEqual(w.encounters.length, 18, 'Must have 18 encounters');
    assert.strictEqual(w.materials.length, 25, 'Must have 25 materials (20 original + 5 new)');
    assert.strictEqual(w.craftingTemplates.length, 34, 'Must have all 34 crafting templates preserved');
    assert.strictEqual(w.professions.length, 4, 'Must have 4 compressed professions');
    assert.strictEqual(w.combinations.length, 12, 'Must have 12 combinations');
    assert.strictEqual(w.interactiveObjects.length, 13, 'Must have 13 interactive objects');
    assert.strictEqual(w.events.length, 48, 'Must have 48 events (incl. ITEM_ENCHANTED milestone & QUEST_STARTED sync events)');
    assert.strictEqual(w.mythology.length, 19, 'Must have 19 codex lore entries');
    assert.strictEqual(w.spells.length, 10, 'Must have 10 campaign spells');

    const regions = new Set(w.locations.map(l => l.region));
    assert.strictEqual(regions.size, 7, `Expected 7 regions, got ${regions.size}`);

    const bosses = w.creatures.filter(c => c.isBoss);
    assert.strictEqual(bosses.length, 6, 'Must have 6 bosses');

    const merchants = w.characters.filter(c => c.isMerchant);
    assert.ok(merchants.length >= 11, `Expected >= 11 merchants, got ${merchants.length}`);

    // Strong connectivity check (BFS forward + reverse from starting location)
    const locMap = new Map(w.locations.map(l => [l.id, l]));
    const getTargets = (loc) => (loc.connections || []).map(c => typeof c === 'string' ? c : c.targetLocationId);
    const startId = 'loc_al_ferry_quay';
    const fwd = new Set([startId]);
    const q1 = [startId];
    while (q1.length) {
      const cur = locMap.get(q1.shift());
      for (const next of getTargets(cur)) {
        if (locMap.has(next) && !fwd.has(next)) { fwd.add(next); q1.push(next); }
      }
    }
    assert.strictEqual(fwd.size, 36, `Forward BFS reached ${fwd.size}/36 locations`);

    const revEdges = new Map();
    for (const l of w.locations) {
      for (const next of getTargets(l)) {
        if (!revEdges.has(next)) revEdges.set(next, []);
        revEdges.get(next).push(l.id);
      }
    }
    const rev = new Set([startId]);
    const q2 = [startId];
    while (q2.length) {
      for (const prev of (revEdges.get(q2.shift()) || [])) {
        if (!rev.has(prev)) { rev.add(prev); q2.push(prev); }
      }
    }
    assert.strictEqual(rev.size, 36, `Reverse BFS reached ${rev.size}/36 locations`);

    // Creative independence & zero em dashes check
    const banned = ['kaelen', 'abyssal trench', 'paragon', 'ascended', 'burdens', 'subjugation'];
    const allFiles = [
      path.join(CAMPAIGN_DIR, 'campaign.json'),
      ...fs.readdirSync(path.join(CAMPAIGN_DIR, 'world')).map(f => path.join(CAMPAIGN_DIR, 'world', f))
    ];
    for (const fp of allFiles) {
      const txt = fs.readFileSync(fp, 'utf8');
      assert.strictEqual(txt.includes('\u2014'), false, `Unicode em dash found in ${fp}`);
      const low = txt.toLowerCase();
      for (const b of banned) {
        assert.strictEqual(low.includes(b), false, `Source contamination '${b}' found in ${fp}`);
      }
    }
  });

  // 3. Global Magic System Integration (27 Spells, HP-Toll, Morality-Gated, Multi-Enemy Combat)
  await test('Ashen Ledger 3: Registers 10 campaign spells into Global Magic Engine (27 total), enforces HP-toll & morality gates in combat', async () => {
    const { engine } = await bootAshenLedger();
    const p = engine.state.player;
    const catalog = engine.getGlobalSpellCatalog();
    assert.strictEqual(catalog.length, 27, `Expected 27 total spells (17 global + 10 campaign), got ${catalog.length}`);

    // Grant skill milestones to earn AKP legitimately
    p.skills.mythology_lore = 4;
    p.skills.investigation = 4;
    p.skills.medicine = 2;
    p.attributes.intelligence = 15;
    p.attributes.wisdom = 14;
    engine.syncArcaneKnowledgePoints();
    const summary = engine.getArcaneKnowledgeSummary();
    assert.ok(summary.available >= 6, `Expected >= 6 AKP from milestones, got ${summary.available}`);

    // Acquire HP-toll campaign spell (al_spell_cinder_writ)
    const acqCinder = engine.acquireSpell('al_spell_cinder_writ');
    assert.strictEqual(acqCinder.success, true, `Should acquire al_spell_cinder_writ: ${JSON.stringify(acqCinder)}`);
    assert.strictEqual(engine.isSpellKnown('al_spell_cinder_writ'), true);

    // Morality-gated spells must be blocked at neutral morality (score 0)
    assert.strictEqual(engine.checkSpellAcquisitionEligibility('al_spell_mercy_shroud').eligible, false, 'Mercy Shroud must be blocked at neutral morality');
    assert.strictEqual(engine.checkSpellAcquisitionEligibility('al_spell_debt_chains').eligible, false, 'Debt Chains must be blocked at neutral morality');

    // Shift positive -> Mercy Shroud unlocks
    engine.modifyMorality(15, 0, 'Mercy Test', { decisionKey: 'test_al_mercy_spell' });
    assert.strictEqual(engine.checkSpellAcquisitionEligibility('al_spell_mercy_shroud').eligible, true, 'Mercy Shroud must unlock at +15 morality');
    assert.strictEqual(engine.acquireSpell('al_spell_mercy_shroud').success, true, 'Must acquire Mercy Shroud');

    // Shift negative -> Debt Chains unlocks
    engine.modifyMorality(0, 30, 'Toll Test', { decisionKey: 'test_al_debt_spell' });
    assert.strictEqual(engine.checkSpellAcquisitionEligibility('al_spell_debt_chains').eligible, true, 'Debt Chains must unlock at -15 morality');
    assert.strictEqual(engine.acquireSpell('al_spell_debt_chains').success, true, 'Must acquire Debt Chains');

    // Test casting HP-toll spell in multi-enemy encounter (3 enemies)
    engine.startCombatEncounter('enc_al_viaduct_raid');
    const c = engine.combatSession;
    assert.ok(c && Array.isArray(c.enemies) && c.enemies.length === 3, 'Multi-enemy combat enc_al_viaduct_raid must spawn 3 enemies');
    p.vitals.health = p.vitals.maxHealth;
    p.vitals.stamina = p.vitals.maxStamina;
    const hpBefore = p.vitals.health;
    const targetBefore = c.enemies[0].hp;
    engine.rollD20 = () => 18;
    engine.castCombatSpell('al_spell_cinder_writ');
    assert.ok(p.vitals.health <= hpBefore - 2, `Cinder Writ must apply >= 2 HP self-toll (before: ${hpBefore}, after: ${p.vitals.health})`);
    assert.ok(c.enemies[0].hp < targetBefore, 'Cinder Writ must damage target');
    engine.combatSession = null;
  });

  // 4. Full 4-Arc Main Storyline, 3 Endings & Moral Alignment Independence
  await test('Ashen Ledger 4: Full 4-Arc Main Storyline works under any moral alignment and supports all 3 endings', async () => {
    // Test main story start + progression under ruthlessly negative morality to prove non-blocking
    const { engine } = await bootAshenLedger();
    engine.modifyMorality(0, 35, 'Ruthless Hero Run', { decisionKey: 'test_al_ruthless_main' });

    const mainIds = [
      'quest_al_main_01_unstamped',
      'quest_al_main_02_furnace_tithe',
      'quest_al_main_03_frontier_keys',
      'quest_al_main_04_first_seal'
    ];
    for (const qid of mainIds) {
      const def = engine.getQuestDefinition(qid);
      assert.ok(def, `Main quest ${qid} must exist`);
      assert.strictEqual(def.minMoralityScore, undefined, `Main quest ${qid} must not require positive morality`);
      assert.strictEqual(def.maxMoralityScore, undefined, `Main quest ${qid} must not require negative morality`);
      if (!engine.state.worldState.quests[qid]) {
        const started = engine.startQuest(qid);
        assert.strictEqual(started, true, `Main quest ${qid} must start even at negative morality`);
      }
      engine.completeQuest(qid);
      assert.strictEqual(engine.state.worldState.quests[qid].completed, true, `Main quest ${qid} must complete`);
    }

    // Verify all 3 endings exist in the Silent Architect's final Sanctum dialogue tree and set distinct ending flags
    const sanctumDlg = engine.currentAdventure.dialogues['dlg_al_silent_architect_echo'];
    assert.ok(sanctumDlg && sanctumDlg.nodes, 'Silent Architect Sanctum dialogue must exist');
    for (const endNode of ['ending_quiet', 'ending_reform', 'ending_seize']) {
      assert.ok(sanctumDlg.nodes[endNode], `Ending node '${endNode}' must exist in dlg_al_silent_architect_echo`);
      assert.ok(sanctumDlg.nodes[endNode].setFlags, `Ending node '${endNode}' must set world flags`);
    }
    // Execute one ending cleanly via openDialogue
    engine.openDialogue('dlg_al_silent_architect_echo', 'ending_reform');
    assert.strictEqual(engine.state.worldState.flags.al_campaign_ending_reform, true, 'Reform ending flag must be set');
  });

  // 5. Morality-Exclusive Quests, Strict Gating, Dialogue Morality & Active-Quest Persistence
  await test('Ashen Ledger 5: Positive & negative morality-exclusive quests enforce thresholds, dialogue choices shift morality once, active quests persist', async () => {
    const { engine } = await bootAshenLedger();

    // Neutral (0): ALL 4 morality-exclusive quests must be refused
    assert.strictEqual(engine.startQuest('quest_al_moral_pos_sanctuary'), false, 'Positive sanctuary quest must be refused at neutral');
    assert.strictEqual(engine.startQuest('quest_al_moral_pos_mercy_bell'), false, 'Positive mercy bell quest must be refused at neutral');
    assert.strictEqual(engine.startQuest('quest_al_moral_neg_foreclosure'), false, 'Negative foreclosure quest must be refused at neutral');
    assert.strictEqual(engine.startQuest('quest_al_moral_neg_cinder_crown'), false, 'Negative cinder crown quest must be refused at neutral');

    // Dialogue moral choice applies cleanly once (anti-exploit)
    engine.openDialogue('dlg_al_ferryman_corvus', 'return_oar_good');
    const scoreAfterOnce = engine.getMoralitySummary().score;
    assert.ok(scoreAfterOnce > 0, `Expected positive morality after returning oar, got ${scoreAfterOnce}`);
    engine.openDialogue('dlg_al_ferryman_corvus', 'return_oar_good');
    assert.strictEqual(engine.getMoralitySummary().score, scoreAfterOnce, 'Re-visiting moral dialogue node must not farm morality');

    // Reach +25 morality -> both positive exclusive quests unlock, negative remain locked
    engine.modifyMorality(25, 0, 'Heroic Deeds', { decisionKey: 'test_al_pos_tier' });
    assert.strictEqual(engine.startQuest('quest_al_moral_pos_sanctuary'), true, 'Sanctuary quest must unlock at >= +15');
    assert.strictEqual(engine.startQuest('quest_al_moral_pos_mercy_bell'), true, 'Unbroken Vow quest must unlock at >= +25');
    assert.strictEqual(engine.startQuest('quest_al_moral_neg_foreclosure'), false, 'Negative quest still locked when positive');

    // Shift to deeply negative morality -> previously accepted positive quest PERSISTS & completes, while negative exclusive quests unlock!
    engine.modifyMorality(0, 80, 'Dark Turn', { decisionKey: 'test_al_neg_tier' });
    assert.ok(engine.getMoralitySummary().score <= -35, 'Morality score must now be <= -35');
    assert.ok(engine.state.worldState.quests['quest_al_moral_pos_sanctuary'], 'Active positive quest must persist after moral shift');
    engine.completeQuest('quest_al_moral_pos_sanctuary');
    assert.strictEqual(engine.state.worldState.quests['quest_al_moral_pos_sanctuary'].completed, true, 'Persisted positive quest must remain completable');

    assert.strictEqual(engine.startQuest('quest_al_moral_neg_foreclosure'), true, 'Foreclosure quest must unlock at <= -15');
    assert.strictEqual(engine.startQuest('quest_al_moral_neg_cinder_crown'), true, 'Tithe of the Unforgiven must unlock at <= -25');
  });

  // 6. All 4 Genuinely Hidden Missions
  await test('Ashen Ledger 6: All 4 hidden missions start concealed, trigger via real game events/items/flags, and complete cleanly', async () => {
    const { engine } = await bootAshenLedger();
    const hiddenIds = [
      'quest_al_hidden_01_drowned_charter',
      'quest_al_hidden_02_silent_architect',
      'quest_al_hidden_03_clockwork_conspiracy',
      'quest_al_hidden_04_pale_ferry'
    ];
    for (const hid of hiddenIds) {
      const def = engine.getQuestDefinition(hid);
      assert.ok(def && def.hidden === true, `Quest ${hid} must be marked hidden: true`);
      assert.strictEqual(Boolean(engine.state.worldState.quests[hid]), false, `Hidden quest ${hid} must NOT be active at game start`);
    }

    // Hidden 1: Drowned Charter -> acquire item_al_drowned_charter_piece + flag al_read_secret_ledger
    engine.addItem('item_al_drowned_charter_piece', 1);
    assert.strictEqual(Boolean(engine.state.worldState.quests['quest_al_hidden_01_drowned_charter']), false, 'Hidden 1 requires both charter piece and secret ledger');
    engine.setWorldFlags({ al_read_secret_ledger: true });
    assert.ok(engine.state.worldState.quests['quest_al_hidden_01_drowned_charter'], 'Hidden 1 must unlock once both conditions met');
    engine.completeQuest('quest_al_hidden_01_drowned_charter');
    assert.strictEqual(engine.state.worldState.quests['quest_al_hidden_01_drowned_charter'].completed, true);

    // Hidden 2: Lament of the Silent Architect -> al_unwritten_truce_forged + acquire item_al_architect_tablet
    engine.setWorldFlags({ al_unwritten_truce_forged: true });
    engine.addItem('item_al_architect_tablet', 1);
    assert.ok(engine.state.worldState.quests['quest_al_hidden_02_silent_architect'], 'Hidden 2 must unlock');
    engine.completeQuest('quest_al_hidden_02_silent_architect');
    assert.strictEqual(engine.state.worldState.quests['quest_al_hidden_02_silent_architect'].completed, true);

    // Hidden 3: The Thirteenth Chime -> al_thirteenth_chime_rung + al_belfry_vault_opened
    engine.setWorldFlags({ al_thirteenth_chime_rung: true });
    assert.strictEqual(Boolean(engine.state.worldState.quests['quest_al_hidden_03_clockwork_conspiracy']), false, 'Hidden 3 requires both flags');
    engine.setWorldFlags({ al_belfry_vault_opened: true });
    assert.ok(engine.state.worldState.quests['quest_al_hidden_03_clockwork_conspiracy'], 'Hidden 3 must unlock');
    engine.completeQuest('quest_al_hidden_03_clockwork_conspiracy');
    assert.strictEqual(engine.state.worldState.quests['quest_al_hidden_03_clockwork_conspiracy'].completed, true);

    // Hidden 4: Passage Beyond the Salt -> 3 frontier charms acquired via items
    engine.addItem('item_al_frontier_charm_1', 1);
    engine.addItem('item_al_frontier_charm_2', 1);
    assert.strictEqual(Boolean(engine.state.worldState.quests['quest_al_hidden_04_pale_ferry']), false, 'Hidden 4 requires all 3 charms');
    engine.addItem('item_al_frontier_charm_3', 1);
    assert.ok(engine.state.worldState.quests['quest_al_hidden_04_pale_ferry'], 'Hidden 4 must unlock on 3rd charm');
    engine.completeQuest('quest_al_hidden_04_pale_ferry');
    assert.strictEqual(engine.state.worldState.quests['quest_al_hidden_04_pale_ferry'].completed, true);
  });

  // 7. Concealed Crafting, Combinations, Puzzles, UI Theme & Save/Load Persistence
  await test('Ashen Ledger 7: Concealed crafting, combinations, puzzles, Obsidian/Brass UI theme & Save/Load round-trip', async () => {
    const { env, engine } = await bootAshenLedger();
    const p = engine.state.player;

    // Concealed crafting test (Foundry Smithing + Pale-Iron + required Foundry toolkit)
    p.skills.athletics = 5;
    p.attributes.strength = 16;
    engine.addItem('item_al_kit_foundry', 1);
    engine.addItem('mat_al_pale_iron', 4);
    engine.addItem('mat_al_weir_ashwood', 2);
    const origRoll = engine.rollD20;
    engine.rollD20 = () => 18;
    engine.currentCraftingProfession = 'al_foundry_smithing';
    const craftRes = engine.craftItem('weapon', 'mat_al_pale_iron', 'mat_al_weir_ashwood');
    engine.rollD20 = origRoll;
    assert.ok(craftRes && craftRes.success, `Expected concealed weapon craft to succeed, got: ${JSON.stringify(craftRes)}`);
    assert.ok(craftRes.item && String(craftRes.item.name || '').includes('Pale-Iron'), `Expected Pale-Iron crafted item, got ${craftRes.item && craftRes.item.name}`);

    // Item combination test (Hone Cutlass)
    engine.addItem('item_al_pale_whetstone', 1);
    if (!engine.hasItem('item_al_dock_cutlass')) engine.addItem('item_al_dock_cutlass', 1);
    const combRes = engine.combineItems('item_al_pale_whetstone', 'item_al_dock_cutlass');
    assert.strictEqual(combRes && combRes.success, true, `Combination comb_al_hone_cutlass should succeed, got: ${JSON.stringify(combRes)}`);
    assert.strictEqual(engine.hasItem('item_al_dock_cutlass_honed'), true, 'Honed cutlass must be produced');

    // Puzzle test (Customs Scale puzzle)
    engine.openPuzzle('puzzle_al_customs_scale');
    engine.resolveRiddleChoice('solved');
    assert.strictEqual(engine.state.worldState.flags.al_archive_riddle_solved, true, 'Customs Scale puzzle must set solved flag');
    assert.strictEqual(engine.hasItem('item_al_archive_brass_key'), true, 'Customs Scale puzzle must award archive brass key');

    // Theme check (Spectral Amethyst & Lantern-Teal Obsidian - unmistakably distinct from default Greek Gold & Nordic Blue)
    const theme = engine.activeCampaign.theme;
    assert.strictEqual(theme.bgVoid, '#090712', 'Spectral Obsidian void background must be configured');
    assert.strictEqual(theme.accent, '#b680ff', 'Spectral Amethyst primary accent must be configured');
    assert.strictEqual(theme.secondaryAccentBright, '#5ce6d8', 'Lantern-Teal secondary accent must be configured');

    // Parity checks: only 1 quest auto-starts, custom rank title, Codex prose, puzzle distractors, random encounters, and real creation perks
    assert.strictEqual(engine.state.player.heroTitle, 'Unstamped Arrival', 'Level 1 rank must use custom Ashen Ledger title');
    assert.ok(engine.world.mythology.every(e => e.text && e.text.length > 20), 'Every Codex entry must have non-empty .text prose');
    assert.ok(engine.world.randomEncounters.length >= 6, 'Campaign must configure region-scoped random encounters');
    const q1Active = Object.keys(engine.state.worldState.quests || {});
    assert.strictEqual(q1Active.length, 1, `Only opening main quest should auto-start, got: ${JSON.stringify(q1Active)}`);
    assert.strictEqual(q1Active[0], 'quest_al_main_01_unstamped');
    assert.ok(engine.world.traits.every(t => t.description && t.perks), 'Every trait must have both narrative description and green perks line');
    assert.ok(engine.world.origins.every(o => o.description && o.perks), 'Every origin must have both narrative description and green perks line');
    assert.ok(engine.world.classes.every(c => c.statBonuses && Array.isArray(c.proficiencies) && c.subtitle), 'Every class must define statBonuses, proficiencies & subtitle');
    assert.ok(engine.world.backgrounds.every(b => Array.isArray(b.proficiencies) && b.passiveBonus && b.category), 'Every background must define proficiencies, passiveBonus & category');

    // Save/Load persistence + campaign switching check (spells, morality, flags, location, campaignId)
    p.skills.mythology_lore = Math.max(p.skills.mythology_lore || 0, 3);
    engine.syncArcaneKnowledgePoints();
    engine.acquireSpell('al_spell_cinder_writ');
    engine.modifyMorality(18, 0, 'Save Test', { decisionKey: 'test_al_save_moral' });
    engine.startQuest('quest_al_moral_pos_sanctuary');
    await engine.saveGame(5);

    // Switch away to Tutorial campaign to verify campaign switching & theme swap, then reload slot 5
    await startCampaign(env, engine, 'campaign_tutorial');
    assert.strictEqual(engine.activeCampaignId, 'campaign_tutorial', 'Must switch away cleanly to Tutorial campaign');

    await engine.loadGame(5);
    assert.strictEqual(engine.activeCampaignId, 'campaign_ashen_ledger', 'Loaded save must restore Ashen Ledger campaign');
    assert.strictEqual(engine.isSpellKnown('al_spell_cinder_writ'), true, 'Loaded save must preserve acquired campaign spell');
    assert.strictEqual(engine.getMoralitySummary().score, 18, 'Loaded save must preserve morality score');
    assert.ok(engine.state.worldState.quests['quest_al_moral_pos_sanctuary'], 'Loaded save must preserve morality-exclusive quest');
    assert.strictEqual(engine.state.worldState.flags.al_archive_riddle_solved, true, 'Loaded save must preserve puzzle flags');
  });

  // 8. Crucible & Frontier Expansion: 3-Part Crafting Quest Line, 6th Profession, New Combinations, Puzzle & Side Quests
  await test('Ashen Ledger 8: Full 3-part Crafting Quest Line, Clockwork Artifice profession, new combinations, Astral Orrery puzzle & bonus side quests', async () => {
    const { engine } = await bootAshenLedger();
    const p = engine.state.player;
    p.skills.athletics = 5;
    p.skills.sleight_of_hand = 5;
    p.skills.mythology_lore = 4;
    p.skills.investigation = 4;
    p.attributes.strength = 16;
    p.attributes.intelligence = 16;
    const origRoll = engine.rollD20;
    engine.rollD20 = () => 18;

    // Part 1: Start 'The Cold Crucible' via Master Orla, craft an item -> ITEM_CRAFTED event updates quest -> complete Part 1
    engine.openDialogue('dlg_al_master_orla', 'start_craft_1');
    assert.ok(engine.state.worldState.quests['quest_al_craft_01_cold_hearth'], 'Crafting Part 1 must start');
    engine.addItem('item_al_kit_foundry', 1);
    engine.addItem('mat_al_pale_iron', 3);
    engine.addItem('mat_al_kiln_glass', 2);
    engine.currentCraftingProfession = 'al_foundry_smithing';
    const trialCraft = engine.craftItem('weapon', 'mat_al_pale_iron', 'mat_al_kiln_glass');
    assert.strictEqual(trialCraft && trialCraft.success, true, 'Trial craft with Pale-Iron + Tempered Kiln-Glass must succeed');
    assert.strictEqual(engine.state.worldState.flags.al_crafted_first_trial, true, 'ITEM_CRAFTED event must set al_crafted_first_trial');
    engine.openDialogue('dlg_al_master_orla', 'finish_craft_1');
    assert.strictEqual(engine.state.worldState.quests['quest_al_craft_01_cold_hearth'].completed, true, 'Crafting Part 1 must complete');
    assert.strictEqual(engine.hasItem('item_al_kit_clockwork'), true, 'Part 1 must reward Clockwork Artifice toolkit');

    // Test 6th profession (Clockwork & Lantern Artifice) concealed crafting!
    engine.addItem('mat_al_clockwork_springs', 3);
    engine.addItem('mat_al_prism_lens', 2);
    engine.currentCraftingProfession = 'al_clockwork_artifice';
    const artificeCraft = engine.craftItem('accessory', 'mat_al_clockwork_springs', 'mat_al_prism_lens');
    assert.strictEqual(artificeCraft && artificeCraft.success, true, `Clockwork Artifice craft must succeed: ${JSON.stringify(artificeCraft)}`);

    // Part 2: Start 'Resin of the Deep Slag', tap pitch cistern, run field combination -> ITEM_COMBINED updates quest -> resolve with Mercy
    engine.openDialogue('dlg_al_master_orla', 'start_craft_2');
    assert.ok(engine.state.worldState.quests['quest_al_craft_02_amber_vein'], 'Crafting Part 2 must start');
    engine.setWorldFlags({ al_tapped_pitch_cistern: true });
    engine.addItem('item_al_pitch_sample_cask', 1);
    engine.addItem('mat_al_kiln_glass', 1);
    if (!engine.hasItem('item_al_dock_cutlass')) engine.addItem('item_al_dock_cutlass', 1);
    const glassCombo = engine.combineItems('mat_al_kiln_glass', 'item_al_dock_cutlass');
    assert.strictEqual(glassCombo && glassCombo.success, true, 'New Kiln-Glass cutlass combination must succeed');
    assert.strictEqual(engine.state.worldState.flags.al_performed_craft_combo, true, 'ITEM_COMBINED event must fire for Part 2');
    engine.openDialogue('dlg_al_master_orla', 'finish_craft_2_mercy');
    assert.strictEqual(engine.state.worldState.quests['quest_al_craft_02_amber_vein'].completed, true, 'Crafting Part 2 must complete');
    assert.ok(engine.getMoralitySummary().score >= 8, 'Sharing pitch with quarry families must award positive morality');

    // Part 3: Start 'The Unstamped Masterwork', solve Observatory Orrery puzzle for Fulgurite-Silver, imbue gear via Enchanting Table, + acquire Muted Bell-Alloy -> forge Legendary Sabre!
    engine.openDialogue('dlg_al_master_orla', 'explain_imbuement');
    assert.strictEqual(engine.state.worldState.flags.al_orla_taught_imbuement, true, 'Orla teaches Arcane Imbuement');
    engine.openDialogue('dlg_al_master_orla', 'start_craft_3');
    assert.ok(engine.state.worldState.quests['quest_al_craft_03_masterwork_seal'], 'Crafting Part 3 must start');
    engine.addItem('mat_al_starlight_cinder', 3);
    if (!engine.hasItem('item_al_dock_cutlass')) engine.addItem('item_al_dock_cutlass', 1);
    const prevRoll3 = engine.rollD20;
    engine.rollD20 = () => 18;
    const enchRes = engine.enchantItem('item_al_dock_cutlass', 'mat_al_starlight_cinder', null, 'minor');
    engine.rollD20 = prevRoll3;
    assert.strictEqual(enchRes && enchRes.success, true, `Enchanting existing gear must succeed: ${JSON.stringify(enchRes)}`);
    assert.strictEqual(engine.state.worldState.flags.al_performed_enchant, true, 'ITEM_ENCHANTED event must set al_performed_enchant');
    assert.strictEqual(engine.state.worldState.quests['quest_al_craft_03_masterwork_seal'].objectives.obj_imbue_masterwork_gear.completed, true, 'Part 3 optional imbuement objective completes on enchant');
    engine.openPuzzle('puzzle_al_observatory_orrery');
    engine.resolveRiddleChoice('solved');
    assert.strictEqual(engine.state.worldState.flags.al_observatory_orrery_solved, true, 'Astral Orrery puzzle must solve cleanly');
    assert.strictEqual(engine.hasItem('mat_al_fulgurite_silver'), true, 'Orrery puzzle must award Fulgurite-Silver Ingot');
    engine.addItem('mat_al_muted_bell_shard', 1);
    engine.openDialogue('dlg_al_master_orla', 'forge_blade');
    assert.strictEqual(engine.state.worldState.quests['quest_al_craft_03_masterwork_seal'].completed, true, 'Crafting Part 3 must complete');
    assert.strictEqual(engine.hasItem('item_al_crucible_masterwork_blade'), true, 'Must receive legendary Dawn-Tempered Fulgurite Sabre');

    // Bonus Side Quests (Muted Belfry + Observatory Charts) + New Campaign Spells
    engine.openDialogue('dlg_al_scribe_cassian', 'start_belfry');
    engine.setWorldFlags({ al_bell_mender_defeated: true });
    engine.addItem('item_al_resonance_tuning_fork', 1);
    engine.openDialogue('dlg_al_scribe_cassian', 'finish_belfry');
    assert.strictEqual(engine.state.worldState.quests['quest_al_side_muted_belfry'].completed, true, 'Muted Belfry side quest must complete');
    assert.strictEqual(engine.hasItem('item_al_bell_warden_chime'), true);

    engine.openDialogue('dlg_al_astronomer_vael', 'start_charts');
    engine.addItem('item_al_astral_star_chart', 1);
    engine.openDialogue('dlg_al_astronomer_vael', 'finish_charts');
    assert.strictEqual(engine.state.worldState.quests['quest_al_side_observatory_charts'].completed, true, 'Observatory Charts side quest must complete');
    assert.strictEqual(engine.hasItem('item_al_starlight_astrolabe'), true);

    // Acquire & cast new campaign spells in new Bell Crypt boss encounter
    engine.syncArcaneKnowledgePoints();
    assert.strictEqual(engine.acquireSpell('al_spell_crucible_temper').success, true, 'Must acquire Crucible Temper');
    assert.strictEqual(engine.acquireSpell('al_spell_prismatic_refraction').success, true, 'Must acquire Prismatic Refraction');
    engine.startCombatEncounter('enc_al_bell_crypt_warden');
    assert.strictEqual(engine.combatSession.enemies.length, 3, 'Bell Crypt Warden encounter spawns Boss + 2 automatons');
    engine.castCombatSpell('al_spell_crucible_temper');
    assert.ok(engine.combatSession.ward >= 6, 'Crucible Temper grants Arcane Ward');
    engine.combatSession = null;
    engine.rollD20 = origRoll;
  });

  // 9. Forensic End-to-End Interconnectedness: Real searchArea hiddenSpots, Interactive Objects, Companion Recruitment, All 6 Professions, All 12 Combinations & All 10 Campaign Spells
  await test('Ashen Ledger 9: End-to-end interconnectedness (searchArea hiddenSpots, interactive objects, 2 companions, all 4 professions, enchanting, 7 minigames, all 12 combos, all 5 puzzles, all 10 spells)', async () => {
    const { engine } = await bootAshenLedger({ classId: 'al_lantern_warden', backgroundId: 'bg_al_quarry_survivor' });
    const p = engine.state.player;
    ['strength', 'intelligence', 'wisdom', 'agility', 'charisma', 'endurance'].forEach(k => p.attributes[k] = 18);
    Object.keys(p.skills).forEach(k => p.skills[k] = 6);
    const origRoll = engine.rollD20;
    engine.rollD20 = () => 18;

    // Real searchArea() hiddenSpot awards item & triggers Hidden Mission 1
    engine.setWorldFlags({ al_read_secret_ledger: true });
    engine.state.worldState.currentLocationId = 'loc_al_drowned_piers';
    engine.searchArea('loc_al_drowned_piers');
    assert.strictEqual(engine.hasItem('item_al_drowned_charter_piece'), true, 'searchArea must award hidden spot item');
    assert.ok(engine.state.worldState.quests['quest_al_hidden_01_drowned_charter'], 'Hidden spot item must trigger Hidden Mission 1');

    // Interactive objects: heave + loot
    engine.state.worldState.currentLocationId = 'loc_al_amber_catacombs';
    engine.heaveObstacle('obj_al_pitch_cistern');
    assert.strictEqual(engine.state.worldState.flags.al_tapped_pitch_cistern, true);
    assert.strictEqual(engine.hasItem('item_al_pitch_sample_cask'), true);
    engine.lootContainer('obj_al_pitch_cistern');
    assert.strictEqual(engine.hasItem('mat_al_soul_pitch'), true);

    engine.state.worldState.currentLocationId = 'loc_al_cinder_foundries';
    engine.heaveObstacle('obj_al_foundry_pressure_valve');
    assert.strictEqual(engine.state.worldState.flags.al_vented_foundry_flue, true);

    engine.state.worldState.currentLocationId = 'loc_al_crucible_wharf';
    engine.lootContainer('obj_al_crucible_quench_chest');
    assert.strictEqual(engine.hasItem('mat_al_kiln_glass'), true);

    // Companion recruitment via dialogue
    engine.openDialogue('dlg_al_gutter_informant', 'recruit_pem');
    engine.openDialogue('dlg_al_warden_scout_fenn', 'recruit_fenn');
    const comps = engine.state.player.companions || engine.state.worldState.companions || [];
    assert.ok(comps.length >= 2, 'Both Sluice-Rat Pem and Scout Fenn must be recruitable');

    // All 4 compressed crafting professions (including new craftable materials)
    for (const prof of engine.world.professions) {
      if (prof.requiredToolkitId) engine.addItem(prof.requiredToolkitId, 1);
    }
    const profMatrix = [
      ['al_foundry_smithing', 'weapon', 'mat_al_pale_iron', 'mat_al_verdigris_copper'],
      ['al_clockwork_artifice', 'weapon', 'mat_al_clockwork_springs', 'mat_al_tally_mercury'],
      ['al_oilskin_leathercraft', 'armor', 'mat_al_salt_hide', 'mat_al_ember_velvet'],
      ['al_mnemonic_alchemy', 'consumable', 'mat_al_tallow_herbs', 'mat_al_starlight_cinder'],
      ['al_mnemonic_alchemy', 'weapon', 'mat_al_ash_quartz', 'mat_al_bone_ivory']
    ];
    for (const [pid, cat, m1, m2] of profMatrix) {
      engine.addItem(m1, 3); engine.addItem(m2, 3);
      engine.currentCraftingProfession = pid;
      const r = engine.craftItem(cat, m1, m2);
      assert.strictEqual(r && r.success, true, `Crafting failed for profession ${pid} (${cat})`);
    }

    // All 7 optional minigame varieties wired in Ashen Ledger locations
    const alMgTypes = new Set(engine.world.locations.flatMap(l => (l.actions || []).filter(a => a.handlerType === 'minigame').map(a => a.minigameType)));
    for (const t of ['forge', 'mortar', 'stalk', 'astragaloi', 'shield_clash', 'glyph_memory', 'pendulum_tune']) {
      assert.strictEqual(alMgTypes.has(t), true, `Ashen Ledger must wire optional minigame '${t}'`);
    }

    // Verify new minigames (glyph_memory & pendulum_tune) initialize cleanly + Item Enchanting Rank I->II persistence across Save/Load
    engine.openMinigame('glyph_memory', { allowAnywhere: true });
    assert.ok(engine.glyphMemoryState && engine.glyphMemoryState.fullSequence.length === 5, 'glyph_memory initializes cleanly');
    engine.closeMinigame(false);
    engine.openMinigame('pendulum_tune', { allowAnywhere: true });
    assert.ok(engine.pendulumState && engine.pendulumState.totalStages === 3, 'pendulum_tune initializes cleanly');
    engine.closeMinigame(false);

    p.skills.mythology_lore = Math.max(p.skills.mythology_lore || 0, 3);
    engine.addItem('mat_al_starlight_cinder', 6);
    if (!engine.hasItem('item_al_dock_cutlass')) engine.addItem('item_al_dock_cutlass', 1);
    const e1 = engine.enchantItem('item_al_dock_cutlass', 'mat_al_starlight_cinder', 'keen_edge', 'minor');
    assert.strictEqual(e1 && e1.success, true, 'Rank I Keen Edge enchant succeeds');
    const e2 = engine.enchantItem(e1.item.id, 'mat_al_starlight_cinder', 'keen_edge', 'masterwork');
    assert.strictEqual(e2 && e2.success, true, 'Rank II Masterwork Keen Edge upgrade succeeds');
    assert.strictEqual(e2.item.enchantments[0].rank, 2, 'Keen Edge upgraded to Rank II');
    const savedState = JSON.stringify(engine.state);
    engine.state = engine.migrateState(JSON.parse(savedState));
    assert.ok(engine.state.worldState.dynamicItems[e2.item.id], 'Enchanted item persists cleanly across Save/Load');

    // All 12 combinations
    for (const comb of engine.world.combinations) {
      const ontoId = typeof comb.onto === 'string' ? comb.onto : 'item_al_dock_cutlass';
      engine.addItem(comb.apply, 2);
      if (!engine.hasItem(ontoId)) engine.addItem(ontoId, 2);
      if (comb.requiresItem && !engine.hasItem(comb.requiresItem)) engine.addItem(comb.requiresItem, 1);
      const cr = engine.combineItems(comb.apply, ontoId);
      assert.strictEqual(cr && cr.success, true, `Combination failed: ${comb.id}`);
    }

    // All 5 puzzles
    const puzList = Object.values(engine.currentAdventure.puzzles || {});
    assert.strictEqual(puzList.length, 5, 'Must have 5 inscribed puzzles');
    for (const puz of puzList) {
      engine.openPuzzle(puz.id);
      engine.resolveRiddleChoice('solved');
    }

    // All 10 campaign spells acquire & cast cleanly
    engine.syncArcaneKnowledgePoints();
    engine.state.player.magicProgression.totalEarnedPoints += 60;
    engine.modifyMorality(25, 0, 'Audit Pos', { decisionKey: 'test9_pos' });
    for (let pass = 0; pass < 3; pass++) {
      for (const sp of engine.getGlobalSpellCatalog()) {
        if (!engine.isSpellKnown(sp.id) && !sp.maxMoralityScore) engine.acquireSpell(sp.id);
      }
    }
    engine.modifyMorality(0, 50, 'Audit Neg', { decisionKey: 'test9_neg' });
    for (const sp of engine.world.spells.filter(s => s.maxMoralityScore)) {
      if (!engine.isSpellKnown(sp.id)) engine.acquireSpell(sp.id);
    }
    for (const sp of engine.world.spells) {
      assert.strictEqual(engine.isSpellKnown(sp.id), true, `Spell not acquired: ${sp.id}`);
      engine.startCombatEncounter('enc_al_viaduct_raid');
      p.vitals.health = p.vitals.maxHealth;
      p.vitals.stamina = p.vitals.maxStamina;
      const res = engine.castCombatSpell(sp.id);
      assert.strictEqual(res && res.success, true, `Spell cast failed: ${sp.id}`);
      engine.combatSession = null;
    }
    engine.rollD20 = origRoll;
  });

  // 10. All 23 Quests Live Completion Chain, Early-Pickup Anti-Softlock, Level-First Combat Loot & Themed Dropdown CSS
  await test('Ashen Ledger 10: All 23 quests complete cleanly via real triggers (incl. Arc 2->3->4 & early-pickup), level-first combat loot scaling & themed dropdowns', async () => {
    const chooseDialogue = (eng, treeId, fromNode, targetNode) => {
      const tree = eng.currentAdventure.dialogues[treeId];
      const ch = (tree.nodes[fromNode].choices || []).find(c => c.target === targetNode);
      assert.ok(ch, `Missing choice ${treeId}.${fromNode} -> ${targetNode}`);
      if (ch.condition) assert.strictEqual(eng.checkDialogueCondition(ch.condition), true, `Condition failed: ${treeId}.${fromNode} -> ${targetNode}`);
      eng.openDialogue(treeId, targetNode);
    };

    const { engine } = await bootAshenLedger({ classId: 'al_lantern_warden', backgroundId: 'bg_al_quarry_survivor' });
    const p = engine.state.player;
    ['strength', 'intelligence', 'wisdom', 'agility', 'charisma', 'endurance'].forEach(k => p.attributes[k] = 18);
    Object.keys(p.skills).forEach(k => p.skills[k] = 6);
    const origRoll = engine.rollD20;
    engine.rollD20 = () => 18;

    // Complete Arc 1 -> Arc 2 -> Arc 3 -> Arc 4 through real dialogue/event prerequisite chains
    engine.openDialogue('dlg_al_ferryman_corvus', 'root');
    engine.openDialogue('dlg_al_clerk_maren', 'root');
    engine.openDialogue('dlg_al_archivist_solene', 'root');
    assert.strictEqual(engine.state.worldState.quests['quest_al_main_01_unstamped'].completed, true);
    chooseDialogue(engine, 'dlg_al_archivist_solene', 'root', 'start_arc2');
    engine.setWorldFlags({ al_read_secret_ledger: true, al_kiln_warden_defeated: true });
    chooseDialogue(engine, 'dlg_al_magistrate_lyra', 'root', 'finish_arc2');
    assert.strictEqual(engine.state.worldState.quests['quest_al_main_02_furnace_tithe'].completed, true);
    assert.ok(engine.state.worldState.quests['quest_al_main_03_frontier_keys'], 'Arc 3 must start immediately after Arc 2 completes on same node');

    // Acquire all 3 fragments -> Arc 3 completes & launches Arc 4
    engine.openPuzzle('puzzle_al_library_tablet'); engine.resolveRiddleChoice('solved');
    chooseDialogue(engine, 'dlg_al_regent_malcor_envoy', 'root', 'start_truce');
    chooseDialogue(engine, 'dlg_al_regent_malcor_envoy', 'root', 'grant_truce');
    engine.addItem('item_al_seal_fragment_quiet', 1);
    assert.strictEqual(engine.state.worldState.quests['quest_al_main_03_frontier_keys'].completed, true);
    assert.ok(engine.state.worldState.quests['quest_al_main_04_first_seal'], 'Arc 4 must start immediately after Arc 3 completes');
    engine.setWorldFlags({ al_high_auditor_defeated: true });
    chooseDialogue(engine, 'dlg_al_silent_architect_echo', 'root', 'ending_reform');
    assert.strictEqual(engine.state.worldState.quests['quest_al_main_04_first_seal'].completed, true);

    // Dara Foundry Strike dual-path: venting the Foundry valve completes Ashes in the Flue cleanly
    chooseDialogue(engine, 'dlg_al_strike_leader_dara', 'root', 'start_strike');
    engine.state.worldState.currentLocationId = 'loc_al_cinder_foundries';
    engine.heaveObstacle('obj_al_foundry_pressure_valve');
    chooseDialogue(engine, 'dlg_al_strike_leader_dara', 'root', 'finish_strike_good');
    assert.strictEqual(engine.state.worldState.quests['quest_al_side_foundry_strike'].completed, true);

    // Early-pickup Arc 3 anti-softlock in fresh run
    const { engine: e2 } = await bootAshenLedger();
    e2.addItem('item_al_seal_fragment_passage', 1);
    e2.addItem('item_al_seal_fragment_memory', 1);
    e2.addItem('item_al_seal_fragment_quiet', 1);
    e2.openDialogue('dlg_al_archivist_solene', 'root');
    e2.openDialogue('dlg_al_archivist_solene', 'start_arc2');
    e2.setWorldFlags({ al_read_secret_ledger: true });
    e2.openDialogue('dlg_al_magistrate_lyra', 'finish_arc2');
    assert.strictEqual(e2.state.worldState.quests['quest_al_main_03_frontier_keys'].completed, true, 'Early-picked fragments auto-complete Arc 3');
    assert.ok(e2.state.worldState.quests['quest_al_main_04_first_seal'], 'Arc 4 starts after early-picked Arc 3');

    // Level-first combat loot scaling: Level 2 hero in Epic gear vs Level 4 enemy keeps >= Challenging loot rank
    e2.state.player.level = 2;
    e2.addItem('item_al_ossuary_plate', 1); e2.equipItem('item_al_ossuary_plate');
    e2.addItem('item_al_vowblade_mercy', 1); e2.equipItem('item_al_vowblade_mercy');
    e2.addItem('item_al_relic_quiet_crown', 1); e2.equipItem('item_al_relic_quiet_crown');
    const lvl4Foe = e2.getCreature('creature_al_cinder_beetle');
    const lootGeared = e2.evaluateCombatLootScaling(lvl4Foe, e2.evaluateIndividualEnemyDifficulty(lvl4Foe));
    assert.ok(lootGeared.rank >= 3, `Expected >= Challenging (3) loot rank for Lvl 2 Epic-geared hero vs Lvl 4 foe, got ${lootGeared.rank}`);
    e2.state.player.level = 10;
    const lvl1Foe = e2.getCreature('creature_al_gutter_hound');
    assert.strictEqual(e2.evaluateCombatLootScaling(lvl1Foe, e2.evaluateIndividualEnemyDifficulty(lvl1Foe)).rank, 0, 'Over-leveled hero vs Lvl 1 foe stays Trivial (0)');

    // Themed dropdown CSS check (no broken var(--bg-dark) on crafting selects)
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert.strictEqual(html.includes('background: var(--bg-dark)'), false, 'Crafting selects must not use undefined var(--bg-dark)');
    assert.ok(html.includes('.classical-select option'), 'Themed select option CSS must exist');
    engine.rollD20 = origRoll;
  });

  // 11. Regression Guard: Non-arrival objectives with map-pin locationId never auto-check on travel,
  //     explicit completeOnArrive objectives still work, and legacy saves self-heal falsely checked objectives.
  await test('Ashen Ledger 11: Map-pin locationId never auto-checks combat/fetch/turn-in objectives on travel & existing saves self-heal cleanly', async () => {
    const { engine } = await bootAshenLedger();

    // Start the 3 side quests shown in player bug report
    engine.openDialogue('dlg_al_captain_voss', 'start_viaduct');
    engine.openDialogue('dlg_al_astronomer_vael', 'start_charts');
    engine.openDialogue('dlg_al_ferryman_corvus', 'start_oar');

    // Simulate walking through every location referenced by those quests' objectives
    ['loc_al_rusted_viaduct', 'loc_al_lantern_wall_gate', 'loc_al_salt_observatory', 'loc_al_glass_conservatory', 'loc_al_drowned_piers', 'loc_al_ferry_quay'].forEach(locId => {
      engine.completeArrivalObjectives(locId);
    });

    const qV = engine.state.worldState.quests['quest_al_side_warden_beacon'];
    const qS = engine.state.worldState.quests['quest_al_side_observatory_charts'];
    const qO = engine.state.worldState.quests['quest_al_side_missing_oar'];

    assert.strictEqual(qV.objectives.obj_defend_viaduct.completed, false, 'Walking onto Rusted Viaduct must NOT auto-check combat objective');
    assert.strictEqual(qV.objectives.obj_report_voss.completed, false, 'Walking to Lantern-Wall Bastion must NOT auto-check turn-in objective');
    assert.strictEqual(qS.objectives.obj_recover_star_chart.completed, false, 'Walking into Salt-Observatory must NOT auto-check fetch objective');
    assert.strictEqual(qS.objectives.obj_return_star_chart.completed, false, 'Walking into Glass Conservatory must NOT auto-check delivery objective');
    assert.strictEqual(qO.objectives.obj_clear_piers.completed, false, 'Walking onto Drowned Piers must NOT auto-check ambush objective');
    assert.strictEqual(qO.objectives.obj_resolve_oar.completed, false, 'Walking onto Ferry Quay must NOT auto-check Corvus turn-in objective');

    // Now simulate a legacy save where ALL 6 objectives were falsely checked off by the old bug,
    // while ONLY the viaduct raid was actually defeated (al_viaduct_beacons_defended: true)
    engine.state.worldState.flags.al_viaduct_beacons_defended = true;
    [qV, qS, qO].forEach(q => {
      Object.values(q.objectives).forEach(o => { o.completed = true; });
    });
    const repaired = engine.reconcileActiveQuestObjectives();
    assert.strictEqual(repaired, 5, 'Should repair exactly the 5 falsely checked objectives while keeping the genuinely defeated viaduct raid');
    assert.strictEqual(qV.objectives.obj_defend_viaduct.completed, true, 'Truly defeated viaduct raid remains checked');
    assert.strictEqual(qV.objectives.obj_report_voss.completed, false, 'Uncompleted Voss turn-in resets to incomplete');
    assert.strictEqual(qS.objectives.obj_recover_star_chart.completed, false, 'Unpicked star-chart resets to incomplete');
    assert.strictEqual(qS.objectives.obj_return_star_chart.completed, false, 'Uncompleted Vael delivery resets to incomplete');
    assert.strictEqual(qO.objectives.obj_clear_piers.completed, false, 'Undefeated pier ambush resets to incomplete');
    assert.strictEqual(qO.objectives.obj_resolve_oar.completed, false, 'Uncompleted Corvus turn-in resets to incomplete');

    // Genuine turn-in still completes cleanly and marks all objectives done
    engine.openDialogue('dlg_al_captain_voss', 'finish_viaduct');
    assert.strictEqual(qV.completed, true, 'Talking to Captain Voss after clearing raid completes the quest');
    assert.strictEqual(qV.objectives.obj_report_voss.completed, true, 'Turn-in objective marks complete on quest completion');

    // Verify genuine completeOnArrive: true objectives (Tutorial Beacon Cliff) STILL auto-complete on arrival
    const envTut = createSandbox();
    const eTut = await bootEngine(envTut);
    await startCampaign(envTut, eTut, 'campaign_tutorial');
    eTut.setQuestStage('quest_tut_proving', 'stage_03_beacon');
    eTut.completeArrivalObjectives('loc_tut_beacon_cliff');
    assert.strictEqual(eTut.state.worldState.quests['quest_tut_proving'].objectives.obj_reach_cliff.completed, true, 'Explicit completeOnArrive: true objective still completes on arrival');
  });

  console.log('\n=================================================================');
  const passed = results.filter(r => r.ok).length;
  console.log(`ASHEN LEDGER RESULTS: ${passed} / ${results.length} PASSED`);
  console.log('=================================================================');
  if (passed !== results.length) process.exit(1);
})();

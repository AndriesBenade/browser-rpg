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
  await test('Ashen Ledger 2: Exceeds largest campaign benchmarks, 32 locations strongly connected across 7 regions, zero source contamination', async () => {
    const { engine } = await bootAshenLedger();
    const w = engine.world;

    assert.strictEqual(w.locations.length, 32, 'Must have 32 locations');
    assert.strictEqual(w.characters.length, 24, 'Must have 24 NPCs');
    assert.strictEqual(w.creatures.length, 16, 'Must have 16 creatures');
    assert.strictEqual(w.items.length, 95, 'Must have 95 items');
    assert.strictEqual(w.factions.length, 10, 'Must have 10 factions');
    assert.strictEqual(w.quests.length, 18, 'Must have 18 quests');
    assert.strictEqual(w.encounters.length, 15, 'Must have 15 encounters');
    assert.strictEqual(w.materials.length, 14, 'Must have 14 materials');
    assert.strictEqual(w.craftingTemplates.length, 22, 'Must have 22 crafting templates');
    assert.strictEqual(w.professions.length, 5, 'Must have 5 professions');
    assert.strictEqual(w.combinations.length, 7, 'Must have 7 combinations');
    assert.strictEqual(w.interactiveObjects.length, 10, 'Must have 10 interactive objects');
    assert.strictEqual(w.events.length, 21, 'Must have 21 events');
    assert.strictEqual(w.mythology.length, 16, 'Must have 16 codex lore entries');
    assert.strictEqual(w.spells.length, 8, 'Must have 8 campaign spells');

    const regions = new Set(w.locations.map(l => l.region));
    assert.strictEqual(regions.size, 7, `Expected 7 regions, got ${regions.size}`);

    const bosses = w.creatures.filter(c => c.isBoss);
    assert.strictEqual(bosses.length, 5, 'Must have 5 bosses');

    const merchants = w.characters.filter(c => c.isMerchant);
    assert.ok(merchants.length >= 9, `Expected >= 9 merchants, got ${merchants.length}`);

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
    assert.strictEqual(fwd.size, 32, `Forward BFS reached ${fwd.size}/32 locations`);

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
    assert.strictEqual(rev.size, 32, `Reverse BFS reached ${rev.size}/32 locations`);

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

  // 3. Global Magic System Integration (25 Spells, HP-Toll, Morality-Gated, Multi-Enemy Combat)
  await test('Ashen Ledger 3: Registers 8 campaign spells into Global Magic Engine (25 total), enforces HP-toll & morality gates in combat', async () => {
    const { engine } = await bootAshenLedger();
    const p = engine.state.player;
    const catalog = engine.getGlobalSpellCatalog();
    assert.strictEqual(catalog.length, 25, `Expected 25 total spells (17 global + 8 campaign), got ${catalog.length}`);

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

    // Theme check
    const theme = engine.activeCampaign.theme;
    assert.strictEqual(theme.bgVoid, '#0b0a0e', 'Obsidian void background must be configured');
    assert.strictEqual(theme.accent, '#c98a3b', 'Brass accent must be configured');
    assert.strictEqual(theme.secondaryAccentBright, '#9b72bd', 'Violet secondary accent must be configured');

    // Save/Load persistence + campaign switching check (spells, morality, flags, location, campaignId)
    p.skills.mythology_lore = 3;
    engine.syncArcaneKnowledgePoints();
    engine.acquireSpell('al_spell_cinder_writ');
    engine.modifyMorality(18, 0, 'Save Test', { decisionKey: 'test_al_save_moral' });
    engine.startQuest('quest_al_moral_pos_sanctuary');
    await engine.saveGame(5);

    // Switch away to Greek Mythology to verify campaign switching & theme swap, then reload slot 5
    await startCampaign(env, engine, 'campaign_greek_mythology');
    assert.strictEqual(engine.activeCampaignId, 'campaign_greek_mythology', 'Must switch away cleanly to Greek Mythology');

    await engine.loadGame(5);
    assert.strictEqual(engine.activeCampaignId, 'campaign_ashen_ledger', 'Loaded save must restore Ashen Ledger campaign');
    assert.strictEqual(engine.isSpellKnown('al_spell_cinder_writ'), true, 'Loaded save must preserve acquired campaign spell');
    assert.strictEqual(engine.getMoralitySummary().score, 18, 'Loaded save must preserve morality score');
    assert.ok(engine.state.worldState.quests['quest_al_moral_pos_sanctuary'], 'Loaded save must preserve morality-exclusive quest');
    assert.strictEqual(engine.state.worldState.flags.al_archive_riddle_solved, true, 'Loaded save must preserve puzzle flags');
  });

  console.log('\n=================================================================');
  const passed = results.filter(r => r.ok).length;
  console.log(`ASHEN LEDGER RESULTS: ${passed} / ${results.length} PASSED`);
  console.log('=================================================================');
  if (passed !== results.length) process.exit(1);
})();

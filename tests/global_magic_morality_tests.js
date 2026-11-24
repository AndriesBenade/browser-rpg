/**
 * Automated Test Suite: Phase 1-4 Global Magic System Overhaul & Global Morality Expansion
 * Verifies engine-wide magic acquisition, Arcane Knowledge Points, 17-spell global catalog,
 * Grimoire UI, combat integration, save migration, campaign spell registration, and
 * global morality prerequisites & persistence across all existing campaigns.
 *
 * Run: node tests/global_magic_morality_tests.js
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

async function bootCampaign(id) {
  const env = createSandbox();
  const engine = await bootEngine(env);
  await startCampaign(env, engine, id);
  return { env, engine };
}

(async () => {
  console.log('=================================================================');
  console.log('RUNNING GLOBAL MAGIC & MORALITY INFRASTRUCTURE TEST SUITE');
  console.log('=================================================================\n');

  // 1. Arcane Knowledge Points, Milestones, Anti-Farming & Strict Separation from Casting Capacity
  await test('Global Magic 1: Arcane Knowledge Points earn strictly from non-repeatable skill milestones (never cast spam) & stay separate from casting capacity', async () => {
    const { engine } = await bootCampaign('campaign_tutorial');
    const p = engine.state.player;
    p.skills.mythology_lore = 0;
    p.skills.investigation = 0;
    p.skills.medicine = 0;
    p.attributes.intelligence = 10;
    p.attributes.wisdom = 10;
    p.magicProgression = { knownSpells: ['aegis', 'bolt'], claimedMilestones: [], spentPoints: 0, totalEarnedPoints: 0 };

    const s0 = engine.getArcaneKnowledgeSummary();
    assert.strictEqual(s0.available, 0, '0 AKP before reaching any magic skill milestone');
    assert.strictEqual(engine.getCombatSpellCapacityInfo().capacity, 1, '1 cast/battle at Lore 0 + WIS 10');

    // Reach Lore 1 & Investigation 2 -> +2 AKP claimed once each
    p.skills.mythology_lore = 1;
    p.skills.investigation = 2;
    const s1 = engine.getArcaneKnowledgeSummary();
    assert.strictEqual(s1.available, 2, 'Lore 1 (+1) + Investigation 2 (+1) grants 2 AKP');

    // Syncing repeatedly never double-awards the same milestone
    const dup = engine.syncArcaneKnowledgePoints();
    assert.strictEqual(dup.gained, 0, 'already-claimed milestones cannot grant AKP again');
    assert.strictEqual(engine.getArcaneKnowledgeSummary().available, 2);

    // Casting a spell in combat does NOT directly grant AKP
    engine.startCombat(engine.getCreature('creature_tut_briar_wolf'));
    engine.castCombatSpell('bolt', 'standard');
    assert.strictEqual(engine.getArcaneKnowledgeSummary().totalEarned, 2, 'casting spells never directly farms AKP');
    engine.combatSession = null;

    // Acquiring spells NEVER alters Combat Casting Capacity
    const capBefore = engine.getCombatSpellCapacityInfo().capacity;
    const acq = engine.acquireSpell('ember_lance');
    assert.strictEqual(acq.success, true, 'acquires ember_lance for 1 AKP');
    assert.strictEqual(engine.getCombatSpellCapacityInfo().capacity, capBefore, 'learning a spell does NOT alter combat casting capacity');
  });

  // 2. Expanded 17-Spell Global Catalog, Prerequisites, Point Enforcement & Save Persistence
  await test('Global Magic 2: 17-spell catalog, prerequisite chains, cost enforcement, save/load persistence & legacy save migration', async () => {
    const { env, engine } = await bootCampaign('campaign_northern_realms');
    const p = engine.state.player;
    const catalog = engine.getGlobalSpellCatalog();
    assert.ok(catalog.length >= 17, `expected >= 17 global engine spells, got ${catalog.length}`);

    // Prerequisite enforcement: tempest_arc requires ember_lance + Lore 3 + INT 13
    p.skills.mythology_lore = 3;
    p.attributes.intelligence = 14;
    p.skills.investigation = 2;
    p.magicProgression = { knownSpells: ['aegis', 'bolt'], claimedMilestones: [], spentPoints: 0, totalEarnedPoints: 0 };
    const akpBefore = engine.getArcaneKnowledgeSummary().available;
    assert.ok(akpBefore >= 4, `expected >= 4 AKP for Lore 3 + Inv 2 + INT 14, got ${akpBefore}`);

    const blockedTempest = engine.acquireSpell('tempest_arc');
    assert.strictEqual(blockedTempest.success, false, 'tempest_arc blocked before learning prerequisite ember_lance');
    assert.strictEqual(engine.getArcaneKnowledgeSummary().spent, 0, 'failed purchase must not deduct AKP');

    // Learn ember_lance (1 AKP), then tempest_arc (2 AKP)
    assert.strictEqual(engine.acquireSpell('ember_lance').success, true);
    assert.strictEqual(engine.acquireSpell('ember_lance').success, false, 'cannot purchase an already-known spell twice');
    assert.strictEqual(engine.acquireSpell('tempest_arc').success, true, 'tempest_arc unlocks once ember_lance is known');
    assert.strictEqual(engine.getArcaneKnowledgeSummary().spent, 3, 'exact 3 AKP deducted (1 + 2)');

    // Persist through save/load
    engine.autosave();
    const loaded = await engine.loadGameSilently(engine.state.saveSlot);
    assert.ok(loaded.player.magicProgression.knownSpells.includes('tempest_arc'), 'acquired spells persist in save');
    assert.strictEqual(loaded.player.magicProgression.spentPoints, 3, 'spent AKP persists in save');

    // Legacy save migration (missing magicProgression field)
    delete engine.state.player.magicProgression;
    const migrated = engine.ensureMagicProgressionState();
    assert.ok(migrated.knownSpells.includes('aegis') && migrated.knownSpells.includes('bolt'), 'legacy saves migrate safely with starter spells intact');

    // Grimoire Modal UI renders cleanly with AKP & spells
    engine.openSpellbookModal();
    const gridHtml = env.el('spellbook-spells-grid').innerHTML;
    assert.ok(gridHtml.includes('Ember Lance') && gridHtml.includes('Chain Tempest'), 'Grimoire modal renders global spells cleanly');
    engine.closeSpellbookModal();
  });

  // 3. Data-Driven Combat Casting, Spell Shaping & Multi-Enemy Integration
  await test('Global Magic 3: acquired global spells & campaign spells execute cleanly in multi-enemy combat with Spell Shaping', async () => {
    const { engine } = await bootCampaign('campaign_northern_realms');
    const p = engine.state.player;
    p.skills.mythology_lore = 4;
    p.skills.medicine = 2;
    p.attributes.intelligence = 16;
    p.attributes.wisdom = 14;
    p.vitals.maxStamina = 24;
    p.vitals.stamina = 24;
    p.vitals.health = p.vitals.maxHealth - 10;

    // Register a campaign-specific test spell via world.spells to verify global engine integration
    engine.world.spells = [{
      id: 'test_camp_cinder_hex',
      name: 'Cinder Hex',
      icon: '🕯️',
      discipline: 'necromancy',
      tier: 1,
      costPoints: 1,
      staminaCost: 1,
      minSkills: { mythology_lore: 1 },
      targeting: { targetType: 'single', maxTargets: 1, range: 'magic', bypassFrontline: true, requiresLineOfSight: false, aoe: false, label: 'Single • Bypasses Cover' },
      effect: { damageDice: '1d6', damageStat: 'intelligence', enemyStatus: { id: 'weakened', rounds: 2, value: 0 }, verb: 'brands with cinders' },
      desc: 'Test campaign spell registered with global engine.'
    }];

    assert.strictEqual(engine.acquireSpell('ember_lance').success, true);
    assert.strictEqual(engine.acquireSpell('tempest_arc').success, true);
    assert.strictEqual(engine.acquireSpell('frost_shroud').success, true);
    assert.strictEqual(engine.acquireSpell('test_camp_cinder_hex').success, true, 'campaign spell acquired through global AKP engine');

    // Multi-enemy fight (3 wolves)
    engine.startCombatEncounter('enc_nr_wolf_ambush');
    const c = engine.combatSession;
    const hpBefore = c.enemies.map(e => e.hp);

    // Cast Chain Tempest (multi-target up to 2 foes) with Lingering Weave spell shaping!
    const rTempest = engine.castCombatSpell('tempest_arc', 'lingering_weave');
    assert.strictEqual(rTempest.success, true, 'Chain Tempest casts cleanly');
    assert.strictEqual(rTempest.targetsHit.length, 2, 'Chain Tempest hits 2 targets independently');
    assert.ok(c.ward >= 4, 'Spell Shaping (Lingering Weave) integrates seamlessly with newly acquired spells');
    assert.ok(c.enemies[0].hp < hpBefore[0] && c.enemies[1].hp < hpBefore[1], 'both hit targets took damage');

    // Cast Frost Shroud (self ward + enemy attack debuff)
    const ward0 = c.ward;
    const rShroud = engine.castCombatSpell('frost_shroud', 'standard');
    assert.strictEqual(rShroud.success, true);
    assert.ok(c.ward > ward0, 'Frost Shroud adds Arcane Ward');

    // Cast campaign-registered spell bypassing frontline wall onto backline wolf!
    const backWolf = c.enemies.find(e => e.position === 'backline');
    const backHp0 = backWolf.hp;
    engine.selectCombatTarget(backWolf.uid);
    const rCamp = engine.castCombatSpell('test_camp_cinder_hex', 'standard');
    assert.strictEqual(rCamp.success, true, 'campaign-registered spell casts cleanly in combat');
    assert.ok(backWolf.hp < backHp0, 'backline wolf took damage from cover-bypassing campaign spell');
    engine.combatSession = null;
  });

  // 4. Cross-Campaign Compatibility (All 4 Shipped Campaigns + Dev Legacy Fixture)
  await test('Global Magic 4: shared spell acquisition works across Tutorial, Northern Realms, Ashen Ledger & Vermin Black', async () => {
    for (const cid of ['campaign_tutorial', 'campaign_northern_realms', 'campaign_ashen_ledger', 'campaign_vermin', 'campaign_dev_legacy']) {
      const { engine } = await bootCampaign(cid);
      engine.state.player.skills.mythology_lore = 2;
      const sum = engine.getArcaneKnowledgeSummary();
      assert.ok(sum.available >= 2, `${cid} earns global AKP from Lore 2`);
      const res = engine.acquireSpell('veil_of_phantoms');
      assert.strictEqual(res.success, true, `${cid} can acquire global spell via shared engine`);
      assert.strictEqual(engine.isSpellKnown('veil_of_phantoms'), true);
    }
  });

  // 5. Phase 2 & 3: Global Morality Expansion, Exclusive Quest Gates, Persistence & Validator Rules
  await test('Global Morality & Infrastructure: positive/negative exclusive quests, active-quest persistence, anti-exploit ledger, NPC reactivity & validator checks', async () => {
    const { engine } = await bootCampaign('campaign_dev_legacy');
    const p = engine.state.player;
    p.morality = { virtue: 0, hubris: 0, score: 0, alignment: 'pragmatic' };

    // Add one positive-exclusive & one negative-exclusive test quest
    engine.world.quests.push(
      { id: 'q_test_pos_only', title: 'Merciful Path', category: 'side', minMoralityScore: 15, stages: { s1: { objectives: [{ id: 'o1', text: 'Help' }] } } },
      { id: 'q_test_neg_only', title: 'Ruthless Path', category: 'side', maxMoralityScore: -15, stages: { s1: { objectives: [{ id: 'o1', text: 'Exploit' }] } } }
    );

    // At neutral 0, BOTH exclusive quests are blocked
    assert.strictEqual(engine.startQuest('q_test_pos_only', { silent: true }), false, 'positive-exclusive quest blocked at score 0');
    assert.strictEqual(engine.startQuest('q_test_neg_only', { silent: true }), false, 'negative-exclusive quest blocked at score 0');

    // One-time decisionKey prevents farming morality
    engine.modifyMorality(20, 0, 'Spared captives', { decisionKey: 'test_moral_dec_1' });
    engine.modifyMorality(20, 0, 'Spared captives', { decisionKey: 'test_moral_dec_1' });
    assert.strictEqual(p.morality.virtue, 20, 'one-time decisionKey prevents repeating the same moral gain');
    assert.strictEqual(p.morality.score, 20);

    // Now positive quest unlocks, negative stays locked
    assert.strictEqual(engine.startQuest('q_test_pos_only', { silent: true }), true, 'positive-exclusive quest unlocks at score +20');
    assert.strictEqual(engine.startQuest('q_test_neg_only', { silent: true }), false, 'negative-exclusive quest still locked at score +20');

    // Shift morality deeply negative (-40 hubris -> score -20):
    // Policy: already-accepted positive quest remains active & persistent; negative quest now unlocks!
    engine.modifyMorality(0, 40, 'Betrayed garrison', { decisionKey: 'test_moral_dec_2' });
    assert.strictEqual(p.morality.score, -20);
    assert.ok(engine.state.worldState.quests['q_test_pos_only'] && !engine.state.worldState.quests['q_test_pos_only'].failed, 'previously accepted moral quest persists without vanishing');
    assert.strictEqual(engine.startQuest('q_test_neg_only', { silent: true }), true, 'negative-exclusive quest unlocks at score -20');

    // Dialogue & world condition support minMoralityScore / maxMoralityScore / moralityBand
    assert.strictEqual(engine.checkDialogueCondition({ moralityBand: 'negative', maxMoralityScore: -15 }), true);
    assert.strictEqual(engine.checkDialogueCondition({ moralityBand: 'positive' }), false);

    // Validator catches broken spell prerequisites & warns if a main quest has an exclusive moral gate
    const Engine = engine.constructor;
    const valRes = Engine.validateCampaign(
      { id: 'c_val_test', name: 'Val Test', startingLocationId: 'l1', modules: {} },
      {
        locations: [{ id: 'l1', name: 'Start', coordinates: { x: 100, y: 100 }, connections: [] }],
        spells: [{ id: 'sp_bad', name: 'Bad Spell', desc: 'Bad prereq', prerequisites: ['nonexistent_spell'] }],
        quests: [{ id: 'q_main_bad', title: 'Main', category: 'main', minMoralityScore: 25, stages: { s1: { objectives: [{ id: 'o1', text: 'Go' }] } } }]
      }
    );
    assert.strictEqual(valRes.valid, false, 'broken spell prerequisite fails validation');
    assert.ok(valRes.warnings.some(w => w.includes('Main storyline quest')), 'warns if main quest has exclusive moral gate');
  });

  const passed = results.filter(r => r.ok).length;
  console.log('\n=================================================================');
  console.log(`GLOBAL MAGIC & MORALITY SUMMARY: ${passed} / ${results.length} passed`);
  console.log('=================================================================');
  if (passed !== results.length) process.exit(1);
})();

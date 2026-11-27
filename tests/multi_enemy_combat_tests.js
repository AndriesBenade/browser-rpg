/**
 * Automated Test Suite: Multi-Enemy Combat, Target Selection, Positioning,
 * Individual vs Overall Encounter Difficulty, and Two-Layer Loot System.
 *
 * Run: node tests/multi_enemy_combat_tests.js
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

const fixedRoll = (engine, val) => { engine.rollD20 = () => val; };
const plain = (v) => JSON.parse(JSON.stringify(v));

async function bootNR() {
  const env = createSandbox();
  const engine = await bootEngine(env);
  await startCampaign(env, engine, 'campaign_northern_realms');
  return { env, engine };
}

(async () => {
  console.log('=================================================================');
  console.log('RUNNING MULTI-ENEMY COMBAT, TARGETING & LOOT TEST SUITE');
  console.log('=================================================================\n');

  // ---------------------------------------------------------------------------
  // 12.1 Multi-Enemy Encounters & Independent Combatant Tracking
  // ---------------------------------------------------------------------------
  await test('12.1 Multi-Enemy Encounters: identical pack, mixed roles, boss+escort, independent HP/status/deaths, support heal & single-enemy compatibility', async () => {
    const { env, engine } = await bootNR();

    // A. Identical 3-enemy wolf pack
    engine.startCombatEncounter('enc_nr_wolf_ambush');
    const c = engine.combatSession;
    assert.ok(c && Array.isArray(c.enemies) && c.enemies.length === 3, 'wolf ambush spawns 3 independent wolves');
    assert.strictEqual(new Set(c.enemies.map(e => e.uid)).size, 3, 'each enemy has unique uid');
    assert.strictEqual(new Set(c.enemies.map(e => e.name)).size, 3, 'identical creatures receive disambiguated names (#1, #2, #3)');
    assert.strictEqual(c.enemies.filter(e => e.position === 'frontline').length, 2, '2 frontline wolves');
    assert.strictEqual(c.enemies.filter(e => e.position === 'backline').length, 1, '1 backline flanking wolf');

    // Apply status to wolf #1 only - wolf #2 & #3 must stay unaffected
    engine.applyCombatStatus('enemy', 'bleeding', 2, 2, c.enemies[0]);
    assert.strictEqual(engine.hasCombatStatus('enemy', 'bleeding', c.enemies[0]), true);
    assert.strictEqual(engine.hasCombatStatus('enemy', 'bleeding', c.enemies[1]), false, 'status is tracked independently per enemy');

    // Defeating enemy #1 must NOT end the encounter while #2 and #3 remain alive
    fixedRoll(engine, 18);
    c.enemies[0].hp = 1;
    engine.combatAction('thrust');
    env.flushTimers();
    assert.strictEqual(c.enemies[0].state, 'defeated', 'enemy #1 defeated');
    assert.strictEqual(c.ended, false, 'defeating 1 of 3 enemies must NOT end combat prematurely');
    assert.strictEqual(engine.getLivingEnemies().length, 2, '2 enemies still fighting');
    assert.ok(c.selectedTargetUid !== c.enemies[0].uid, 'target automatically updated away from defeated foe');
    engine.combatSession = null;

    // B. Mixed-role squad with Frontline Tank + Backline Support Caster (support heal action)
    engine.startCombatEncounter('enc_nr_cult_ambush');
    const c2 = engine.combatSession;
    assert.strictEqual(c2.enemies.length, 2, 'cult ambush spawns 2 distinct enemies');
    assert.strictEqual(c2.enemies[0].position, 'frontline');
    assert.strictEqual(c2.enemies[1].position, 'backline');
    assert.notStrictEqual(c2.enemies[0].id, c2.enemies[1].id, 'different creature types retain distinct identities');

    // Damage frontline tank and trigger support caster's healAlly action
    c2.enemies[0].hp = 5;
    c2.enemies[0].stunned = 1; // frontline skips its attack
    const healAct = c2.enemies[1].actions.find(a => a.healAlly);
    assert.ok(healAct, 'cult zealot has a genuine support healAlly action');
    c2.enemies[1].intent = { action: healAct, style: 'support', text: 'heals ally' };
    const hpBeforeHeal = c2.enemies[0].hp;
    engine.runEnemyTurn(env.el('combat-log-feed'));
    assert.ok(c2.enemies[0].hp > hpBeforeHeal, 'backline support enemy heals wounded frontline ally during enemy turn');
    engine.combatSession = null;

    // C. Boss + Supporting Escort
    engine.startCombatEncounter('enc_nr_skallagrim_boss');
    const c3 = engine.combatSession;
    assert.strictEqual(c3.enemies.length, 2, 'Skallagrim boss spawns with arcane escort');
    assert.strictEqual(c3.enemies[0].isBoss, true);
    assert.strictEqual(c3.enemies[1].isBoss, false);
    assert.strictEqual(c3.enemies[1].position, 'backline');
    engine.combatSession = null;

    // D. Existing single-enemy encounter still works as a 1-enemy encounter
    engine.startCombatEncounter('enc_nr_bog_stalker');
    assert.strictEqual(engine.combatSession.enemies.length, 1);
    assert.strictEqual(engine.combatSession.enemy, engine.combatSession.enemies[0]);
    engine.combatSession = null;
  });

  // ---------------------------------------------------------------------------
  // 12.2 Individual Creature Difficulty vs. Overall Encounter Difficulty
  // ---------------------------------------------------------------------------
  await test('12.2 Difficulty: individual vs overall encounter ratings, synergy scaling, build-sensitive matchups & zero stat mutation', async () => {
    const { engine } = await bootNR();
    const wolf = engine.getCreature('creature_nr_timber_wolf');
    const wraith = engine.getCreature('creature_nr_ice_wraith');
    const golem = engine.getCreature('creature_nr_stone_golem');
    const wraithBefore = plain(wraith);

    // 1 wolf vs 3 wolves: overall threat grows sub-linearly (not 3x) yet exceeds 1 wolf
    const oneWolf = engine.evaluateIndividualEnemyDifficulty(wolf);
    const threeWolves = engine.evaluateEncounterDifficulty([wolf, wolf, wolf]);
    assert.ok(threeWolves.encounterThreat > oneWolf.enemyThreat, '3 wolves rate higher encounter threat than 1 wolf');
    assert.ok(threeWolves.encounterThreat < oneWolf.enemyThreat * 3.0, 'combined threat avoids naive linear 3x exaggeration');
    assert.strictEqual(threeWolves.individualRatings.length, 3, 'tracks individual difficulty for every participant');

    // Tactical synergy distinction: 2 frontline wolves vs 1 frontline bruiser + 1 backline support caster
    const cultSquad = engine.evaluateEncounterDifficulty(engine.findEncounter('enc_nr_cult_ambush'));
    assert.ok(cultSquad.synergies.includes('Frontline + Backline Formation'), 'detects frontline+backline synergy');
    assert.ok(cultSquad.synergies.includes('Support/Healing Synergy'), 'detects support/healer synergy');

    // Build sensitivity at identical character level: Arcane-counter build vs Physical-only build
    const p = engine.state.player;
    p.level = 3;
    // Build A: Arcane scholar (high WIS/INT/Lore, low STR/melee)
    p.attributes.strength = 8; p.attributes.agility = 10; p.attributes.intelligence = 18; p.attributes.wisdom = 18;
    p.skills.melee_combat = 0; p.skills.athletics = 0; p.skills.mythology_lore = 6; p.skills.arcana = 5;
    const mageVsWraith = engine.evaluateIndividualEnemyDifficulty(wraith);
    const mageVsGolem = engine.evaluateIndividualEnemyDifficulty(golem);

    // Build B: Same Level 3, Physical juggernaut (high STR/melee/athletics, low WIS/INT/Lore)
    p.attributes.strength = 18; p.attributes.agility = 14; p.attributes.intelligence = 8; p.attributes.wisdom = 8;
    p.skills.melee_combat = 6; p.skills.athletics = 6; p.skills.mythology_lore = 0; p.skills.arcana = 0;
    const warriorVsWraith = engine.evaluateIndividualEnemyDifficulty(wraith);
    const warriorVsGolem = engine.evaluateIndividualEnemyDifficulty(golem);

    assert.ok(mageVsWraith.ratio < warriorVsWraith.ratio, `Arcane build handles magical wraith better (${mageVsWraith.ratio.toFixed(2)}) than zero-magic warrior (${warriorVsWraith.ratio.toFixed(2)})`);
    assert.ok(warriorVsGolem.ratio < mageVsGolem.ratio, `Physical build handles armored golem better (${warriorVsGolem.ratio.toFixed(2)}) than frail mage (${mageVsGolem.ratio.toFixed(2)})`);

    // Zero stat mutation guarantee
    assert.deepStrictEqual(plain(wraith), wraithBefore, 'difficulty evaluation never modifies enemy statistics');
  });

  // ---------------------------------------------------------------------------
  // 12.3 Two-Layer Loot System (Individual + Overall Encounter + Anti-Exploit)
  // ---------------------------------------------------------------------------
  await test('12.3 Loot System: distinct individual vs encounter loot, zero duplication on simultaneous kills/reloads & anti-swarm cap', async () => {
    const { env, engine } = await bootNR();

    // A. Mixed encounter: killing enemy 1 drops individual loot once; killing enemy 2 drops its loot + encounter completion reward once
    engine.startCombatEncounter('enc_nr_cult_ambush');
    const c = engine.combatSession;
    const drachStart = engine.state.player.currencies.drachmae || 0;
    c.enemies[0].hp = 0;
    engine.resolveFoeState(env.el('combat-log-feed'));
    assert.strictEqual(c.enemies[0].lootResolved, true, 'enemy #1 individual loot resolved on defeat');
    assert.strictEqual(c.enemies[1].lootResolved, false, 'living enemy #2 not yet looted');
    assert.strictEqual(c.encounterRewardsGranted, false, 'encounter completion loot NOT granted before encounter ends');
    const drachAfter1 = engine.state.player.currencies.drachmae;
    assert.ok(drachAfter1 > drachStart, 'enemy #1 granted individual currency');

    // Calling resolveEntityLoot again on same combatant instance must NOT duplicate loot
    const dupRes = engine.resolveEntityLoot(c.enemies[0]);
    assert.strictEqual(dupRes.alreadyResolved, true, 'cannot double-loot same fallen combatant');
    assert.strictEqual(engine.state.player.currencies.drachmae, drachAfter1, 'no duplicate coins on re-loot');

    // Now finish enemy #2 -> both enemy #2 individual loot AND Layer 2 overall encounter completion loot fire once
    c.enemies[1].hp = 0;
    engine.resolveFoeState(env.el('combat-log-feed'));
    env.flushTimers();
    assert.strictEqual(c.enemies[1].lootResolved, true, 'enemy #2 individual loot resolved');
    assert.strictEqual(c.encounterRewardsGranted, true, 'overall encounter completion loot granted once');
    assert.ok(engine.state.player.currencies.drachmae > drachAfter1, 'enemy #2 + encounter bonus granted');

    // Re-attempting encounter completion loot on same combatInstanceId must NOT duplicate!
    const drachAfterWin = engine.state.player.currencies.drachmae;
    const dupEnc = engine.resolveEncounterCompletionLoot(c);
    assert.strictEqual(dupEnc.alreadyClaimed, true, 'encounter completion loot cannot be claimed twice');
    assert.strictEqual(engine.state.player.currencies.drachmae, drachAfterWin, 'reload/repeat claim grants 0 duplicate coins');

    // B. Anti-Swarm Exploit Test: 6 trivial (very_easy) wolves against a maxed hero cannot yield rare/epic gear
    const p = engine.state.player;
    p.level = 10;
    p.vitals.maxHealth = 120; p.vitals.health = 120;
    p.attributes.strength = 20; p.attributes.intelligence = 20; p.attributes.wisdom = 20;
    p.skills.melee_combat = 8; p.skills.mythology_lore = 8;
    engine.addItem('item_nr_relic_dragonbane', 1);
    engine.equipItem('item_nr_relic_dragonbane', { targetSlot: 'main_hand' });

    const trivialSwarm = Array.from({ length: 6 }, () => ({ creatureId: 'creature_nr_timber_wolf', position: 'frontline' }));
    engine.startCombat(trivialSwarm, { encounterName: 'Trivial Swarm' });
    const sc = engine.combatSession;
    sc.enemies.forEach(e => { e.state = 'defeated'; e.hp = 0; e.lootResolved = true; });
    const swarmReward = engine.resolveEncounterCompletionLoot(sc, { forceBonusRoll: true });
    assert.ok(swarmReward.effectiveRewardRank <= 1, `trivial 6-enemy swarm capped at easy tier (got rank ${swarmReward.effectiveRewardRank})`);
    assert.strictEqual(swarmReward.droppedItemIds.length, 0, 'trivial swarm produces no high-tier item drops from quantity alone');
    engine.combatSession = null;
  });

  // ---------------------------------------------------------------------------
  // 12.4 & 12.6 Target Selection, Positioning Obstruction & Zero-Cost Invalid Actions
  // ---------------------------------------------------------------------------
  await test('12.4 & 12.6 Target Selection & Melee Obstruction: frontline blocks melee to backline, zero cost on blocked attempt, ranged bypasses, clearing frontline exposes backline', async () => {
    const { env, engine } = await bootNR();
    // Keep hero alive through multi-turn enemy counterattacks during targeting verification
    engine.state.player.vitals.maxHealth = 120;
    engine.state.player.vitals.health = 120;

    // Equip a melee weapon
    engine.addItem('item_nr_iron_longsword', 1);
    engine.equipItem('item_nr_iron_longsword', { targetSlot: 'main_hand' });
    engine.startCombatEncounter('enc_nr_cult_ambush');
    const c = engine.combatSession;
    const front = c.enemies[0];
    const back = c.enemies[1];
    assert.strictEqual(front.position, 'frontline');
    assert.strictEqual(back.position, 'backline');

    // Selecting backline target costs 0 stamina and 0 turns
    const stm0 = engine.state.player.vitals.stamina;
    const round0 = c.round;
    const selRes = engine.selectCombatTarget(back.uid);
    assert.strictEqual(selRes.success, true, 'living backline enemy can be selected');
    assert.strictEqual(selRes.accessibleToCurrentWeapon, false, 'reports melee obstruction clearly');
    assert.strictEqual(engine.state.player.vitals.stamina, stm0, 'target selection consumes 0 stamina');
    assert.strictEqual(c.round, round0, 'target selection does not advance turn');

    // Attempting melee thrust on obstructed backline enemy MUST fail with zero cost & zero silent redirect!
    const frontHp0 = front.hp;
    const backHp0 = back.hp;
    const blockedRes = engine.combatAction('thrust');
    assert.strictEqual(blockedRes.blocked, true, 'melee thrust blocked by frontline enemy');
    assert.strictEqual(blockedRes.reason, 'obstructed_by_frontline');
    assert.strictEqual(front.hp, frontHp0, 'blocked melee strike does NOT silently redirect to frontline enemy');
    assert.strictEqual(back.hp, backHp0, 'obstructed backline enemy takes 0 damage');
    assert.strictEqual(c.round, round0, 'invalid attack does not consume player turn');
    assert.strictEqual(engine.state.player.vitals.stamina, stm0, 'invalid attack does not consume stamina');

    // Switching to a ranged weapon allows hitting that exact backline target past the frontline!
    const bow = engine.world.items.find(it => engine.isRangedWeapon(it));
    assert.ok(bow, 'Northern Realms has a ranged weapon');
    engine.addItem(bow.id, 1);
    engine.equipItem(bow.id, { targetSlot: 'main_hand' });
    // Ensure backline caster uses an attack intent on this turn rather than self-healing right after taking the arrow
    const dmgAct = back.actions.find(a => !a.healAlly);
    if (dmgAct) back.intent = { action: dmgAct, style: 'normal', text: 'attacks' };
    fixedRoll(engine, 18);
    const rangedRes = engine.combatAction('thrust');
    assert.strictEqual(rangedRes.success, true, 'ranged weapon bypasses frontline obstruction');
    assert.ok(back.hp < backHp0, 'ranged attack hits selected backline enemy');
    assert.strictEqual(front.hp, frontHp0, 'single-target ranged attack leaves frontline untouched');

    // Re-equip melee sword, kill frontline enemy -> backline becomes immediately accessible to melee!
    engine.equipItem('item_nr_iron_longsword', { targetSlot: 'main_hand' });
    engine.selectCombatTarget(front.uid);
    front.hp = 1;
    fixedRoll(engine, 18);
    engine.combatAction('thrust');
    assert.strictEqual(front.state, 'defeated', 'frontline enemy slain');
    assert.strictEqual(engine.hasLivingFrontline(), false, 'defeated enemy no longer obstructs');

    // Defeated enemy cannot be re-selected
    const deadSel = engine.selectCombatTarget(front.uid);
    assert.strictEqual(deadSel.success, false);
    assert.strictEqual(deadSel.reason, 'target_defeated');

    // Now ordinary melee thrust reaches the exposed backline enemy cleanly!
    const backHpBeforeMelee = back.hp;
    if (dmgAct) back.intent = { action: dmgAct, style: 'normal', text: 'attacks' };
    engine.selectCombatTarget(back.uid);
    fixedRoll(engine, 18);
    const exposedMelee = engine.combatAction('thrust');
    assert.strictEqual(exposedMelee.success, true, 'melee reaches backline once frontline falls');
    assert.ok(back.hp < backHpBeforeMelee, 'exposed backline enemy takes melee damage');
    engine.combatSession = null;
  });

  // ---------------------------------------------------------------------------
  // 12.5 Attack & Spell Targeting Types (Single, Frontline Cleave, LoS vs Cover-Bypass, AoE)
  // ---------------------------------------------------------------------------
  await test('12.5 Attack & Spell Targeting: Sweeping Cleave, Line-of-Sight Wall (Bolt) vs Cover-Bypass (Bind) vs Multi-Target AoE (Nova)', async () => {
    const { env, engine } = await bootNR();

    // Boost mage stats so all spells + 4 casts are unlocked
    const p = engine.state.player;
    p.attributes.intelligence = 16;
    p.attributes.wisdom = 16;
    p.skills.mythology_lore = 5;
    p.vitals.maxStamina = 24; p.vitals.stamina = 24;
    engine.addItem('item_nr_iron_longsword', 1);
    engine.equipItem('item_nr_iron_longsword', { targetSlot: 'main_hand' });

    // Start 3-wolf pack: 2 frontline + 1 backline (forms a 2-enemy frontline wall!)
    engine.startCombatEncounter('enc_nr_wolf_ambush');
    const c = engine.combatSession;
    const [f1, f2, b1] = c.enemies;
    f1.hp = f1.maxHp = 50;
    f2.hp = f2.maxHp = 50;
    b1.hp = b1.maxHp = 50;
    b1.immune = ['burning']; // test independent status immunity per enemy!

    // 1. Line-of-Sight spell (`bolt`) targeting backline behind 2 frontline foes is BLOCKED without spending spell casts or stamina!
    engine.selectCombatTarget(b1.uid);
    const casts0 = c.spellsCast;
    const stm0 = p.vitals.stamina;
    const boltBlocked = engine.combatAction('spell:bolt');
    assert.strictEqual(boltBlocked.blocked, true, 'bolt blocked by 2-enemy frontline wall');
    assert.strictEqual(boltBlocked.reason, 'blocked_line_of_sight');
    assert.strictEqual(c.spellsCast, casts0, 'blocked spell consumes 0 spell casts');
    assert.strictEqual(p.vitals.stamina, stm0, 'blocked spell consumes 0 stamina');

    // 2. Obstruction-bypassing spell (`bind`) hits that exact backline target even behind 2 frontline foes!
    const bindRes = engine.combatAction('spell:bind');
    assert.strictEqual(bindRes.success, true, 'bind bypasses frontline wall completely');
    assert.ok(b1.hp < 50, 'backline target takes bind damage');
    assert.strictEqual(engine.hasCombatStatus('enemy', 'entangled', b1), true, 'backline target entangled');
    assert.strictEqual(engine.hasCombatStatus('enemy', 'entangled', f1), false, 'single-target bind does not affect frontline');

    // 3. Multi-target melee (`cleave` - Sweeping Cleave) hits BOTH frontline foes independently, leaving backline untouched
    engine.selectCombatTarget(f1.uid);
    const b1HpBeforeCleave = b1.hp;
    fixedRoll(engine, 18);
    const cleaveRes = engine.combatAction('cleave');
    assert.strictEqual(cleaveRes.success, true, 'Sweeping Cleave resolves cleanly');
    assert.ok(f1.hp < 50 && f2.hp < 50, 'Sweeping Cleave hits BOTH frontline enemies');
    assert.strictEqual(b1.hp, b1HpBeforeCleave, 'Sweeping Cleave does not reach backline while frontline stands');

    // 4. Area-of-Effect spell (`nova`) + Fire Aspect hits ALL 3 enemies across frontline & backline independently, respecting b1's burning immunity!
    c.selectedSpellOption = 'elemental_shift';
    c.selectedSpellElement = 'fire';
    const hpBeforeNova = [f1.hp, f2.hp, b1.hp];
    const novaRes = engine.combatAction('spell:nova');
    assert.strictEqual(novaRes.success, true, 'AoE nova resolves cleanly');
    assert.ok(f1.hp < hpBeforeNova[0] && f2.hp < hpBeforeNova[1] && b1.hp < hpBeforeNova[2], 'AoE nova damages all 3 foes across frontline & backline');
    assert.strictEqual(engine.hasCombatStatus('enemy', 'burning', f1), true, 'f1 ignited by Fire Aspect');
    assert.strictEqual(engine.hasCombatStatus('enemy', 'burning', f2), true, 'f2 ignited independently by Fire Aspect');
    assert.strictEqual(engine.hasCombatStatus('enemy', 'burning', b1), false, 'b1 burning immunity respected independently during AoE');
    engine.combatSession = null;
  });

  // ---------------------------------------------------------------------------
  // 12.7 Combat UI DOM, Confrontation Roster & Multi-Enemy Save/Load Persistence
  // ---------------------------------------------------------------------------
  await test('12.7 UI Integration & Save/Load: Confrontation & Combat Arena DOM rosters + mid-battle multi-enemy save/reload without loot duplication', async () => {
    const { env, engine } = await bootNR();

    // 1. Pre-combat confrontation displays overall encounter badge + individual enemy formation roster
    engine.engageEncounter('enc_nr_cult_ambush');
    const confrontHtml = String(env.el('confront-box').innerHTML);
    assert.ok(confrontHtml.includes('confront-roster-list'), 'confrontation displays multi-enemy roster before combat');
    assert.ok(confrontHtml.includes('Frontline') && confrontHtml.includes('Backline'), 'confrontation shows frontline & backline positions');

    // 2. Enter combat and verify full Formation Roster DOM & Target Summary Strip
    engine.chooseConfrontation('attack');
    const rosterHtml = String(env.el('combat-enemies-roster').innerHTML);
    assert.ok(rosterHtml.includes('data-lane="frontline"') && rosterHtml.includes('data-lane="backline"'), 'combat UI renders separate Frontline and Backline lanes');
    assert.ok(rosterHtml.includes('selected-target') && rosterHtml.includes('🎯 Target'), 'selected enemy highlighted clearly');
    assert.ok(rosterHtml.includes('diff-frame-') && rosterHtml.includes('diff-badge'), 'each enemy card shows its individual difficulty frame & badge');
    assert.ok(String(env.el('combat-difficulty-badge').innerHTML).includes('Encounter:'), 'header clearly labels overall Encounter difficulty');
    assert.ok(String(env.el('combat-target-summary').innerHTML).includes('Target:'), 'command deck displays target accessibility summary');

    // 3. Kill enemy #1 (marks lootResolved=true), inflict status on enemy #2, SAVE mid-combat, then RELOAD into a fresh engine!
    const c = engine.combatSession;
    c.enemies[0].hp = 0;
    engine.resolveFoeState(env.el('combat-log-feed'));
    assert.strictEqual(c.enemies[0].state, 'defeated');
    assert.strictEqual(c.enemies[0].lootResolved, true);
    engine.applyCombatStatus('enemy', 'weakened', 3, 0, c.enemies[1]);
    c.enemies[1].hp = 19;
    await engine.saveGameSilently(1);

    // Boot fresh engine sharing the same persisted IndexedDB/storage snapshot
    const snapshot = JSON.parse(JSON.stringify(engine.state));
    const { env: env2, engine: engine2 } = await bootNR();
    await engine2.applyLoadedState(snapshot);
    engine2.resumeSavedCombat();
    assert.ok(engine2.combatSession && engine2.combatSession.enemies.length === 2, 'multi-enemy combat restores cleanly after save/load');
    assert.strictEqual(engine2.combatSession.enemies[0].state, 'defeated', 'defeated enemy #1 stays defeated after reload');
    assert.strictEqual(engine2.combatSession.enemies[0].lootResolved, true, 'lootResolved flag persists across reload (no double loot)');
    assert.strictEqual(engine2.combatSession.enemies[1].hp, 19, 'surviving enemy #2 exact HP persists across reload');
    assert.strictEqual(engine2.hasCombatStatus('enemy', 'weakened', engine2.combatSession.enemies[1]), true, 'per-enemy status effect persists across reload');
    assert.strictEqual(engine2.combatSession.selectedTargetUid, engine2.combatSession.enemies[1].uid, 'selected living target persists across reload');
    engine2.combatSession = null;
  });

  // ---------------------------------------------------------------------------
  const failed = results.filter(r => !r.ok);
  console.log('\n=================================================================');
  console.log(`MULTI-ENEMY COMBAT SUMMARY: ${results.length - failed.length} / ${results.length} passed`);
  console.log('=================================================================');
  process.exit(failed.length ? 1 : 0);
})();

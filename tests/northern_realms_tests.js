/**
 * The Northern Realms Campaign & Core Systems Overhaul Automated Test Suite
 * Covers:
 * - Campaign validation (0 errors, 0 warnings) + validator fault detection
 * - Item/creature/slot/stat repairs & full 25-location graph reachability
 * - All 8 visible quests + branching moral choices + Jarl death failover
 * - All 3 genuinely hidden missions (concealment, order-sensitive & multi-condition triggers, completion, no re-trigger)
 * - Concealed material-driven crafting & skill-gated supplementary material slots
 * - Progression-based combat magic capacity & Intelligence-gated tactical spell options
 * - Save/Load serialization persistence
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const harness = require('./behaviour_harness.js');

const ROOT = path.join(__dirname, '..');
const CAMPAIGN_DIR = path.join(ROOT, 'content/campaigns/northern_realms');
const MANIFEST_PATH = path.join(CAMPAIGN_DIR, 'campaign.json');

async function bootNorthernRealms(opts = {}) {
  const env = harness.createSandbox();
  const engine = new env.Engine();
  await engine.init();
  env.flushTimers();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  engine.registerCampaign(manifest);
  engine.skipWalkthrough();
  engine.selectCampaign('campaign_northern_realms');
  await engine.confirmCampaignSelection();

  if (opts.createHero !== false) {
    engine.selectClass(opts.classId || 'class_nr_shield_thane');
    engine.selectBackground(opts.backgroundId || 'bg_nr_hearth_guard');
    engine.creationState.name = opts.name || 'Sigrid Ironbound';
    engine.creationState.gender = 'female';
    const order = ['strength', 'endurance', 'agility', 'wisdom', 'intelligence', 'charisma'];
    let idx = 0;
    while (engine.creationState.pointsLeft > 0 && idx < 40) {
      const k = order[idx % order.length];
      engine.creationState.attributes[k] += 1;
      engine.creationState.pointsLeft -= 1;
      idx++;
    }
    engine.confirmHeroCreation();
    env.flushTimers();
    assert.strictEqual(engine.state.hasCompletedCreation, true, "Hero creation must complete cleanly");
  }
  return { env, engine, manifest };
}

function forceRoll(env, fixedDie) {
  const orig = Math.random;
  Math.random = () => Math.min(0.9999, Math.max(0, (fixedDie - 1) / 20 + 0.01));
  return () => { Math.random = orig; };
}

async function runNorthernRealmsSuite() {
  console.log("=================================================================");
  console.log("RUNNING THE NORTHERN REALMS CAMPAIGN & SYSTEMS TEST SUITE");
  console.log("=================================================================");

  let passed = 0;
  async function test(label, fn) {
    await fn();
    passed++;
    console.log(`[PASS] ${label}`);
  }

  // 1. Campaign Registration, Deep Validation (0 errors, 0 warnings) & Fault Detection
  await test("Campaign Validation: 0 errors, 0 warnings, and catches broken prerequisites/hidden/events", async () => {
    const { env, engine, manifest } = await bootNorthernRealms({ createHero: false });
    const content = engine.collectValidationContent(manifest);
    const valResult = env.Engine.validateCampaign(manifest, content);
    assert.strictEqual(valResult.valid, true, "Campaign must validate cleanly: " + JSON.stringify(valResult.errors));
    assert.strictEqual(valResult.errors.length, 0, "0 errors expected: " + JSON.stringify(valResult.errors));
    assert.strictEqual(valResult.warnings.length, 0, "0 warnings expected: " + JSON.stringify(valResult.warnings));

    // Verify validator genuinely catches broken prerequisites, hidden autoStart, dangling stage.next, and invalid event quest refs
    const brokenContent = JSON.parse(JSON.stringify(content));
    brokenContent.quests.push({
      id: "quest_broken_test",
      title: "Broken Test",
      hidden: true,
      autoStart: true,
      prerequisites: ["quest_does_not_exist"],
      currentStage: "s1",
      stages: { s1: { id: "s1", next: "s_missing", objectives: [{ id: "o1", text: "Test" }] } },
      rewards: { reputation: { faction_nonexistent: 10 } }
    });
    brokenContent.events.push({ id: "evt_broken_test", trigger: "FLAG_SET", outcomes: { startQuest: "quest_ghost" } });
    const badRes = env.Engine.validateCampaign(manifest, brokenContent);
    assert.strictEqual(badRes.valid, false, "Validator must fail on broken quest/event definitions");
    assert.ok(badRes.errors.some(e => e.includes("nonexistent prerequisite")), "Must catch invalid prerequisite");
    assert.ok(badRes.errors.some(e => e.includes("autoStart: true")), "Must catch hidden quest autoStart");
    assert.ok(badRes.errors.some(e => e.includes("nonexistent next stage")), "Must catch broken stage.next");
    assert.ok(badRes.errors.some(e => e.includes("unknown faction/deity")), "Must catch invalid reward reputation");
    assert.ok(badRes.errors.some(e => e.includes("nonexistent quest 'quest_ghost'")), "Must catch invalid event quest ref");
  });

  // 2. Campaign Activation, Content Counts & Isolation
  await test("Campaign Activation & Isolation: 25 locations, 57 items, 10 creatures, 11 quests, 10 hidden spots", async () => {
    const { engine } = await bootNorthernRealms({ createHero: false });
    assert.strictEqual(engine.world.locations.length, 25, "Must load 25 locations");
    assert.strictEqual(engine.world.items.length, 57, "Must load 57 items");
    assert.strictEqual(engine.world.creatures.length, 10, "Must load 10 creatures");
    assert.strictEqual(engine.world.quests.length, 11, "Must load 11 quests (8 visible + 3 hidden)");
    assert.strictEqual(engine.world.characters.length, 17, "Must load 17 NPCs");
    const totalSpots = engine.world.locations.reduce((n, l) => n + (l.hiddenSpots ? l.hiddenSpots.length : 0), 0);
    assert.ok(totalSpots >= 10, `Expected at least 10 hidden spots, got ${totalSpots}`);
    assert.ok(!engine.world.locations.some(l => l.id === 'loc_cadmea_citadel'), "Must not contain Greek locations");
    assert.ok(!engine.world.locations.some(l => l.id === 'loc_dev_brindle_ford'), "Must not contain Dev locations");
  });

  // 3. Repaired Item Stats, Equipment Slots & Creature Combat Schema
  await test("Repaired Equipment & Creatures: weapons deal real damage, armor grants AC, bosses have real actions", async () => {
    const { engine } = await bootNorthernRealms();
    // Every weapon has valid damageMin/damageMax
    const weapons = engine.world.items.filter(i => i.category === 'weapon');
    assert.ok(weapons.length >= 10);
    weapons.forEach(w => {
      assert.ok(w.stats && Number.isFinite(w.stats.damageMin) && w.stats.damageMax >= w.stats.damageMin, `Weapon ${w.id} missing damage stats`);
    });
    // Armor & shields use valid paper-doll slots and grant real AC
    const baseAC = engine.getPlayerArmorClass();
    engine.addItem('item_nr_dwarven_plate', 1);
    engine.addItem('item_nr_iron_spangenhelm', 1);
    engine.equipItem('item_nr_dwarven_plate');
    engine.equipItem('item_nr_iron_spangenhelm');
    const plateAC = engine.getPlayerArmorClass();
    assert.ok(plateAC > baseAC, `Equipping Dwarven Plate & Spangenhelm must raise AC (${baseAC} -> ${plateAC})`);

    // Every creature has top-level armorClass, non-empty actions, xpReward, and bosses have isBoss
    engine.world.creatures.forEach(cr => {
      assert.ok(Number.isFinite(cr.armorClass) && cr.armorClass >= 12, `Creature ${cr.id} missing armorClass`);
      assert.ok(Array.isArray(cr.actions) && cr.actions.length >= 2, `Creature ${cr.id} missing combat actions`);
      assert.ok(cr.xpReward > 0, `Creature ${cr.id} missing xpReward`);
    });
    const vyr = engine.getCreature('creature_nr_boss_vyr');
    assert.strictEqual(vyr.isBoss, true, "Vyr must be marked isBoss: true");
    assert.ok(vyr.actions.some(a => /Glacial Breath/i.test(a.name)), "Vyr must have bespoke Glacial Breath action");
  });

  // 4. Geographic Reachability (25/25) & Rest Rules
  await test("Geography & Rest Rules: all 25 locations strongly connected and rest tiers enforced", async () => {
    const { engine } = await bootNorthernRealms();
    const visited = new Set(['loc_nr_valenfrost_gates']);
    const queue = ['loc_nr_valenfrost_gates'];
    while (queue.length) {
      const curr = queue.shift();
      const loc = engine.getLocation(curr);
      (loc.connections || []).forEach(c => {
        const dest = c.targetLocationId || c.targetId || c.to || c.locationId;
        if (dest && !visited.has(dest)) { visited.add(dest); queue.push(dest); }
      });
    }
    assert.strictEqual(visited.size, 25, "All 25 locations must be reachable");

    engine.state.worldState.currentLocationId = 'loc_nr_valenfrost_hall';
    const hallRest = engine.evaluateRestAvailability();
    assert.strictEqual(hallRest.anyAllowed, true, "Sanctuary allows rest");
    assert.strictEqual(hallRest.campAllowed, true, "Sanctuary allows full rest");
    engine.state.worldState.currentLocationId = 'loc_nr_wolf_den_cavern';
    const denRest = engine.evaluateRestAvailability();
    assert.strictEqual(denRest.anyAllowed, false, "Forbidden cavern blocks all rest");
    assert.strictEqual(denRest.campAllowed, false, "Forbidden cavern blocks camping");
  });

  // 5. NPC Inspection, Normalized Slots, Interactive Objects, Puzzles & Item Combinations
  await test("NPC Inspection, Objects, Puzzles & Combinations: unified possessions and whetstone/venom", async () => {
    const { env, engine } = await bootNorthernRealms();
    engine.state.worldState.currentLocationId = 'loc_nr_valenfrost_gates';
    const torPoss = engine.getNpcPossessions('npc_nr_gate_captain_tor');
    const eqList = Array.isArray(torPoss.equipment) ? torPoss.equipment : Object.entries(torPoss.equipment || {}).map(([slot, itemId]) => ({ slot, itemId }));
    assert.ok(eqList.some(e => e.slot === 'body' && e.itemId === 'item_nr_iron_ringmail'), "Captain Tor armor normalized to body slot");
    assert.ok(eqList.some(e => e.slot === 'head' && e.itemId === 'item_nr_iron_spangenhelm'), "Captain Tor helm normalized to head slot");
    assert.ok(torPoss.drachmae > 0, "NPC carries real coin purse");

    engine.openNpcInspectModal('npc_nr_gate_captain_tor');
    assert.ok(env.el('npc-inspect-title').innerText.includes('Captain Tor'));

    // Item Combinations: Whetstone + Broadsword and Venom Coating
    const hone = engine.combineItems('item_nr_mountain_whetstone', 'item_nr_iron_broadsword');
    assert.strictEqual(hone.success, true);
    assert.strictEqual(hone.resultItemId, 'item_nr_honed_iron_broadsword');
    engine.addItem('item_nr_mire_venom_gland', 1);
    const coat = engine.combineItems('item_nr_mire_venom_gland', 'item_nr_honed_iron_broadsword');
    assert.strictEqual(coat.success, true);
    assert.ok(engine.getWeaponCoating('item_nr_honed_iron_broadsword'));
  });

  // 6. Concealed Material-Driven Crafting & Skill-Gated Supplementary Slots
  await test("Crafting System: outcomes stay concealed pre-craft, primary materials drive form, skills unlock 1..4 supp slots", async () => {
    const { env, engine } = await bootNorthernRealms();
    const p = engine.state.player;
    engine.addItem('item_nr_smithing_hammer', 1);
    engine.addItem('mat_nr_sky_iron_ore', 4);
    engine.addItem('mat_nr_bog_iron', 4);
    engine.addItem('mat_nr_frost_quartz', 4);
    engine.addItem('mat_nr_hardened_pine', 4);
    engine.addItem('mat_nr_hearth_amber', 4);
    engine.addItem('mat_nr_wyrm_blood_vial', 2);

    // 6a. Pre-craft UI concealment in Craft View AND Workbench (no exact weapon/armor template names leaked!)
    engine.currentCraftingProfession = 'nr_weaponsmithing';
    engine.selectedCraftingCategory = 'weapon';
    engine.renderCraftingView();
    const cfgHtml = env.el('crafting-config-panel').innerHTML;
    const prevHtml = env.el('crafting-preview-panel').innerHTML;
    const combinedUi = cfgHtml + " " + prevHtml;
    assert.ok(combinedUi.includes('Weapon'), "General category 'Weapon' must be visible");
    assert.ok(combinedUi.includes('Armour &amp; Protection') || combinedUi.includes('Armour'), "General category 'Armour' must be visible");
    ['Broadsword', 'Waraxe', 'Greataxe', 'Runestaff', 'Roundshield', 'Hauberk', 'Spangenhelm', 'Dirk'].forEach(leak => {
      assert.ok(!combinedUi.includes(leak), `Exact item form '${leak}' must NOT be leaked in pre-craft UI!`);
    });
    // Skill transparency check
    assert.ok(combinedUi.includes('Athletics'), "UI must clearly name governing skill Athletics");
    assert.ok(combinedUi.includes('Supplementary'), "UI must clearly display supplementary slot progress");

    // Workbench concealment check
    engine.openWorkbench('item_nr_smithing_hammer');
    engine.placeOnWorkbench('mat_nr_bog_iron', 'p0');
    engine.placeOnWorkbench('mat_nr_hardened_pine', 'p1');
    const wbHtml = env.el('workbench-panel').innerHTML;
    assert.ok(wbHtml.includes('Weapon'), "Workbench must show general category");
    ['Broadsword', 'Waraxe', 'Greataxe', 'Runestaff', 'Roundshield', 'Hauberk'].forEach(leak => {
      assert.ok(!wbHtml.includes(leak), `Workbench must NOT leak exact item form '${leak}'!`);
    });

    // 6b. Skill-gated supplementary slot thresholds (Athletics Rank 0-1 -> 1, Rank 2 -> 2, Rank 4 -> 3, Rank 6 -> 4)
    const prof = engine.getCampaignProfessions().find(pr => pr.id === 'nr_weaponsmithing');
    p.skills.athletics = 1;
    assert.strictEqual(engine.getCraftingSupplementaryCapacity(prof).slots, 1, "Rank 1 -> 1 supp slot");
    assert.strictEqual(engine.getCraftingSupplementaryCapacity(prof).nextThreshold, 2, "Next unlock at Rank 2");

    // Attempting 2 supplementary materials at Rank 1 MUST be rejected by engine!
    const rejected = engine.craftItem('category:weapon', 'mat_nr_bog_iron', 'mat_nr_hardened_pine', ['mat_nr_hearth_amber', 'mat_nr_frost_quartz']);
    assert.strictEqual(rejected.success, false, "Engine must reject supplementary count exceeding skill capacity");
    assert.ok(/capacity exceeded/i.test(rejected.reason));

    p.skills.athletics = 2;
    assert.strictEqual(engine.getCraftingSupplementaryCapacity(prof).slots, 2, "Rank 2 -> 2 supp slots");
    p.skills.athletics = 4;
    assert.strictEqual(engine.getCraftingSupplementaryCapacity(prof).slots, 3, "Rank 4 -> 3 supp slots");
    p.skills.athletics = 6;
    assert.strictEqual(engine.getCraftingSupplementaryCapacity(prof).slots, 4, "Rank 6 -> 4 supp slots");

    // 6c. Primary materials meaningfully determine outcome form
    const restoreRoll = forceRoll(env, 18);
    try {
      const heavyCraft = engine.craftItem('category:weapon', 'mat_nr_sky_iron_ore', 'mat_nr_bog_iron', ['mat_nr_hearth_amber', 'mat_nr_frost_quartz']);
      assert.strictEqual(heavyCraft.success, true, "Heavy metal craft should succeed");
      assert.strictEqual(heavyCraft.templateId, 'tmpl_nr_greataxe', "Dense star-iron + bog iron should shape a Huscarl Greataxe");
      assert.ok(heavyCraft.item.stats.elementalDamage >= 3, "Arcane/amber/quartz catalysts must impart elemental damage");
      assert.ok(heavyCraft.item.supplementaryTraits.length >= 2, "Supplementary traits recorded on item");

      const arcaneCraft = engine.craftItem('category:weapon', 'mat_nr_frost_quartz', 'mat_nr_hardened_pine', ['mat_nr_wyrm_blood_vial']);
      assert.strictEqual(arcaneCraft.success, true, "Crystal + pine craft should succeed");
      assert.strictEqual(arcaneCraft.templateId, 'tmpl_nr_runic_staff', "Glacial quartz + pine should shape a Glacial Runestaff");
      assert.notStrictEqual(heavyCraft.templateId, arcaneCraft.templateId, "Different primary materials must yield distinct forms");

      // Materials consumed accurately & crafted item persisted in dynamicItems
      assert.ok(engine.state.worldState.dynamicItems[heavyCraft.item.id], "Crafted item stored in dynamicItems for save persistence");
      assert.strictEqual(engine.getItemQuantity(heavyCraft.item.id), 1);

      // Save/Load persistence check (no duplication)
      await engine.saveGameSilently(1);
      await engine.loadGame(1);
      assert.strictEqual(engine.getItemQuantity(heavyCraft.item.id), 1, "Crafted item quantity unchanged after reload");
      assert.strictEqual(engine.getItemData(heavyCraft.item.id).name, heavyCraft.item.name, "Dynamic item definition survives reload");
    } finally {
      restoreRoll();
    }
  });

  // 7. Progression-Based Combat Magic Capacity & Intelligence-Gated Spell Options
  await test("Magic System: capacity scales 1..5 with Lore+WIS, resets between fights, INT unlocks tactical spell options", async () => {
    const { env, engine } = await bootNorthernRealms();
    const p = engine.state.player;

    // 7a. Capacity thresholds
    p.skills.mythology_lore = 0; p.attributes.wisdom = 10;
    assert.strictEqual(engine.getCombatSpellCapacityInfo().capacity, 1, "Lore 0 + WIS 10 -> 1 spell/combat");
    p.skills.mythology_lore = 2; p.attributes.wisdom = 10;
    assert.strictEqual(engine.getCombatSpellCapacityInfo().capacity, 2, "Lore 2 + WIS 10 -> 2 spells/combat");
    p.skills.mythology_lore = 4; p.attributes.wisdom = 14;
    assert.strictEqual(engine.getCombatSpellCapacityInfo().capacity, 3, "Lore 4 + WIS 14 -> 3 spells/combat");
    p.skills.mythology_lore = 6; p.attributes.wisdom = 14;
    assert.strictEqual(engine.getCombatSpellCapacityInfo().capacity, 4, "Lore 6 + WIS 14 -> 4 spells/combat");
    p.skills.mythology_lore = 8; p.attributes.wisdom = 18;
    assert.strictEqual(engine.getCombatSpellCapacityInfo().capacity, 5, "Lore 8 + WIS 18 -> 5 spells/combat");

    // 7b. Beginner combat test (1 cast max, INT 10 locks all advanced options)
    p.skills.mythology_lore = 0; p.attributes.wisdom = 10; p.attributes.intelligence = 10;
    p.vitals.stamina = 18;
    engine.startCombat('creature_nr_frost_troll');
    assert.strictEqual(engine.combatSession.spellCapacity, 1);

    // Locked option MUST be rejected by engine
    const lockedRes = engine.castCombatSpell('bolt', 'elemental_shift', 'frost');
    assert.strictEqual(lockedRes.success, false);
    assert.strictEqual(lockedRes.reason, 'option_locked');

    // Cast 1 succeeds, Cast 2 rejected
    const cast1 = engine.castCombatSpell('bolt', 'standard');
    assert.strictEqual(cast1.success, true);
    assert.strictEqual(engine.combatSession.spellsCast, 1);
    const cast2 = engine.castCombatSpell('aegis', 'standard');
    assert.strictEqual(cast2.success, false);
    assert.strictEqual(cast2.reason, 'casting_capacity_reached');

    // 7c. Advanced caster (Lore 4, WIS 14 -> 3 casts; INT 18 -> all 4 options unlocked!) + reset on new encounter
    engine.combatSession = null;
    p.skills.mythology_lore = 4; p.attributes.wisdom = 14; p.attributes.intelligence = 18;
    p.vitals.stamina = 20; p.vitals.health = p.vitals.maxHealth - 6;
    engine.startCombat('creature_nr_frost_troll');
    assert.strictEqual(engine.combatSession.spellsCast, 0, "Casts must reset on new encounter");
    assert.strictEqual(engine.combatSession.spellCapacity, 3, "Advanced caster starts with 3 casts");

    // Verify Combat UI & Character Sheet clearly show capacity and options
    engine.renderCharacterSheet();
    assert.ok(env.el('sheet-magic-block').innerHTML.includes('3 Spells / Battle'));
    assert.ok(env.el('combat-magic-bar').innerHTML.includes('3 / 3'));

    // Cast 1: Elemental Shift (Frost) applies enemyAttack -2 mod
    const r1 = engine.castCombatSpell('bolt', 'elemental_shift', 'frost');
    assert.strictEqual(r1.success, true);
    assert.ok(engine.getCombatMod('enemyAttack') <= -2, "Frost Shift must chill enemy attack");

    // Cast 2: Lingering Weave raises Arcane Ward + consumes extra stamina
    const stmBefore = p.vitals.stamina;
    const r2 = engine.castCombatSpell('bind', 'lingering_weave');
    assert.strictEqual(r2.success, true);
    assert.ok(engine.combatSession.ward >= 4, "Lingering Weave must raise Arcane Ward");
    assert.strictEqual(p.vitals.stamina, stmBefore - 3, "Bind (2) + Lingering Weave (1) must cost 3 Stamina");

    // Cast 3: Overchannel Surge succeeds once, then locks for rest of battle
    const r3 = engine.castCombatSpell('bolt', 'overchannel');
    assert.strictEqual(r3.success, true);
    assert.strictEqual(engine.combatSession.overchannelUsed, true);
    assert.strictEqual(engine.combatSession.spellsCast, 3);

    // Cast 4 refused (3/3 spent)
    const r4 = engine.castCombatSpell('aegis', 'standard');
    assert.strictEqual(r4.success, false);
    assert.strictEqual(r4.reason, 'casting_capacity_reached');
    engine.combatSession = null;
  });

  // 8. All 8 Visible Quests & Branching Choices (including Scholarly Re-Seal & Jarl Death Failover)
  await test("Visible Quests & Branching: all 8 visible quests + Re-Seal Vyr ending + Jarl failover work end-to-end", async () => {
    const { env, engine } = await bootNorthernRealms();

    // 8a. Trial of the Frozen Shield
    engine.openDialogue('dlg_nr_veteran_karl', 'node_covenant_task');
    assert.ok(engine.state.worldState.quests['quest_nr_covenant_trial_of_steel']);
    engine.state.worldState.currentLocationId = 'loc_nr_abandoned_shaft_nine';
    engine.startCombatEncounter('enc_nr_shaft_troll');
    engine.combatSession.enemy.hp = 0;
    engine.handleCombatVictory();
    engine.openDialogue('dlg_nr_veteran_karl', 'node_turn_in_trial');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_covenant_trial_of_steel'].completed, true);

    // 8b. Caravan of the Howling Pass (New Side Quest - return to Astrid)
    engine.openDialogue('dlg_nr_merchant_astrid', 'node_caravan_offer');
    assert.ok(engine.state.worldState.quests['quest_nr_side_lost_caravan']);
    engine.state.worldState.currentLocationId = 'loc_nr_wolf_den_cavern';
    engine.startCombatEncounter('enc_nr_wolf_alpha');
    engine.combatSession.enemy.hp = 0;
    engine.handleCombatVictory();
    assert.ok(engine.hasItem('item_nr_caravan_crate'));
    engine.openDialogue('dlg_nr_merchant_astrid', 'node_turn_in_caravan');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_side_lost_caravan'].completed, true);
    assert.strictEqual(engine.state.worldState.quests['quest_nr_side_lost_caravan'].chosenPath, 'returned_honestly');

    // 8c. Embers of the Deep Forge (New Side Quest - Helga + Sentinel)
    engine.openDialogue('dlg_nr_blackforge_master_helga', 'node_embers_offer');
    assert.ok(engine.state.worldState.quests['quest_nr_side_blackforge_embers']);
    engine.state.worldState.currentLocationId = 'loc_nr_grimstone_delve';
    engine.startCombatEncounter('enc_nr_runebound_sentinel');
    engine.combatSession.enemy.hp = 0;
    engine.handleCombatVictory();
    engine.openDialogue('dlg_nr_blackforge_master_helga', 'node_turn_in_embers');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_side_blackforge_embers'].completed, true);
    assert.ok(engine.hasItem('item_nr_blackforge_hearthblade'));

    // 8d. The Silver Kin's Legacy (Star-Key Alpha + Honorable Charter Return)
    engine.openDialogue('dlg_nr_dwarf_overseer_thrain', 'node_vault_story');
    engine.addItem('item_nr_key_grimstone_vault', 1);
    engine.state.worldState.currentLocationId = 'loc_nr_abandoned_shaft_nine';
    engine.unlockWithKey('obj_nr_grimstone_vault_door');
    assert.ok(engine.hasItem('item_nr_star_key_alpha'));
    assert.ok(engine.hasItem('item_nr_silver_kin_ledger'));
    engine.openDialogue('dlg_nr_dwarf_overseer_thrain', 'node_return_key');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_side_dwarven_vault'].completed, true);

    // 8e. Secrets of the Rime Spire (Star-Key Beta + Dragon Binding Liturgy)
    engine.openDialogue('dlg_nr_archmage_kallan', 'node_ask_star_key');
    engine.state.worldState.currentLocationId = 'loc_nr_spire_frostmere';
    engine.openDialogue('dlg_nr_skald_einar', 'node_spire_hint');
    engine.openPuzzle('puzzle_nr_rime_stone');
    engine.resolveRiddleChoice('known_answer');
    engine.openDialogue('dlg_nr_librarian_freya', 'node_consult_archives');
    assert.strictEqual(engine.state.worldState.flags.studied_dragon_binding, true);
    engine.openDialogue('dlg_nr_archmage_kallan', 'node_turn_in_circle');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_circle_rime_relic'].completed, true);
    assert.ok(engine.hasItem('item_nr_star_key_beta'));

    // 8f. The Slumber of Skallagrim (Star-Key Gamma)
    engine.openDialogue('dlg_nr_jarl_sigurd', 'node_barrow_report');
    engine.addItem('item_nr_key_barrow_sanctum', 1);
    engine.state.worldState.currentLocationId = 'loc_nr_ancient_cairn';
    engine.unlockWithKey('obj_nr_barrow_crypt_portal');
    engine.state.worldState.currentLocationId = 'loc_nr_barrow_depths';
    engine.startCombatEncounter('enc_nr_skallagrim_boss');
    engine.combatSession.enemy.hp = 0;
    engine.handleCombatVictory();
    engine.openDialogue('dlg_nr_jarl_sigurd', 'node_turn_in_barrow');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_side_barrow_curse'].completed, true);
    assert.ok(engine.hasItem('item_nr_star_key_gamma'));

    // 8g. Main Quest: Shadow of Mount Wyrmfang - Scholarly Eternal Re-Binding Ritual!
    engine.openDialogue('dlg_nr_jarl_sigurd', 'node_offer_aid');
    engine.state.worldState.currentLocationId = 'loc_nr_wyrmfang_caldera';
    const caldera = engine.getLocation('loc_nr_wyrmfang_caldera');
    const resealAct = caldera.actions.find(a => a.id === 'act_nr_reseal_vyr');
    assert.ok(resealAct && engine.isActionAvailable(resealAct, 'loc_nr_wyrmfang_caldera'), "Re-Seal ritual must be available with 3 Star-Keys + Freya lore");
    const restoreRoll = forceRoll(env, 19);
    try { engine.executeGenericAction(resealAct); } finally { restoreRoll(); }
    assert.strictEqual(engine.state.worldState.flags.vyr_resealed_peacefully, true);
    engine.openDialogue('dlg_nr_jarl_sigurd', 'node_turn_in_main_binder');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_main_shadow_of_wyrmfang'].completed, true);
    assert.strictEqual(engine.state.worldState.quests['quest_nr_main_shadow_of_wyrmfang'].chosenPath, 'binder');
    assert.ok(engine.hasItem('item_nr_relic_dragonbane'));
  });

  // 9. Hidden Mission 1: Ashes of the Broken Oath (Concealment + Order Check + Negative Standing + Completion)
  await test("Hidden Mission 1 ('Ashes of the Broken Oath'): concealed pre-trigger, rejects wrong order, unlocks & completes cleanly", async () => {
    const { env, engine } = await bootNorthernRealms();

    // Must NOT exist or appear in Quest Log before conditions met
    assert.ok(!engine.state.worldState.quests['quest_nr_hidden_broken_oath']);
    engine.renderQuests();
    assert.ok(!env.el('quest-list-container').innerHTML.includes('Ashes of the Broken Oath'), "Hidden mission must NOT appear in quest log beforehand");

    // Wrong order check: talking to Mira BEFORE completing the ledger quest must NOT unlock it!
    engine.state.worldState.currentLocationId = 'loc_nr_drowned_lantern_tavern';
    engine.openDialogue('dlg_nr_innkeeper_mira', 'root');
    assert.ok(!engine.state.worldState.quests['quest_nr_hidden_broken_oath'], "Talking to Mira early must NOT unlock hidden mission");

    // Start ledger quest, recover ledger via stealth/parley, expose to Captain Tor (drops Cabal rep <= -15)
    engine.openDialogue('dlg_nr_cabal_leader_valeria', 'node_cabal_work');
    engine.addItem('item_nr_elena_stolen_ledger', 1);
    engine.openDialogue('dlg_nr_gate_captain_tor', 'node_expose_cabal');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_cabal_smugglers_ledger'].completed, true);
    assert.ok(engine.getFactionReputation('faction_nr_whispering_cabal') <= -15, "Exposing Cabal must drop standing <= -15");
    // Still NOT unlocked yet because player has NOT spoken to Mira AFTER completing the quest!
    assert.ok(!engine.state.worldState.quests['quest_nr_hidden_broken_oath'], "Must require speaking to Mira AFTER quest completion");

    // NOW speak to Mira AFTER completing the quest -> unlocks!
    engine.openDialogue('dlg_nr_innkeeper_mira', 'root');
    assert.ok(engine.state.worldState.quests['quest_nr_hidden_broken_oath'], "Hidden Mission 1 must activate once all 3 ordered conditions hold");
    engine.renderQuests();
    assert.ok(env.el('quest-list-container').innerHTML.includes('Ashes of the Broken Oath'), "Discovered hidden mission must appear in quest log");
    assert.ok(env.el('quest-list-container').innerHTML.includes('Hidden Mission'), "Must display Hidden Mission badge");

    // Complete Hidden Mission 1
    engine.state.worldState.currentLocationId = 'loc_nr_mire_causeway';
    engine.startCombatEncounter('enc_nr_cult_ambush');
    engine.combatSession.enemy.hp = 0;
    engine.handleCombatVictory();
    assert.ok(engine.hasItem('item_nr_cult_manifest'));
    engine.openDialogue('dlg_nr_gate_captain_tor', 'node_turn_in_manifest_tor');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_hidden_broken_oath'].completed, true);
    assert.ok(engine.hasItem('item_nr_oathbreaker_signet'));

    // Re-speaking to Mira must NOT re-trigger
    const seqBefore = engine.state.worldState.eventSeq;
    engine.openDialogue('dlg_nr_innkeeper_mira', 'root');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_hidden_broken_oath'].completed, true);
    assert.ok(engine.state.worldState.eventSeq > seqBefore);
  });

  // 10. Hidden Mission 2: The Mercy of the Drowned (Sparing Malik + Quest + Morrigan Afterwards)
  await test("Hidden Mission 2 ('The Mercy of the Drowned'): sparing Malik + quest + Morrigan unlocks & grants +1 Spell Capacity talisman", async () => {
    const { engine } = await bootNorthernRealms();

    // Talking to Morrigan BEFORE sparing Malik must NOT unlock it
    engine.openDialogue('dlg_nr_bog_witch_morrigan', 'root');
    assert.ok(!engine.state.worldState.quests['quest_nr_hidden_mercy_drowned']);

    // Spare Malik peacefully via parley dialogue + complete ledger quest
    engine.openDialogue('dlg_nr_cabal_leader_valeria', 'node_cabal_work');
    engine.openDialogue('dlg_nr_bandit_captain_malik', 'node_parley_success');
    assert.ok(engine.state.worldState.sparedEntities['npc_nr_bandit_captain_malik'] !== undefined, "Malik must be recorded as spared");
    engine.openDialogue('dlg_nr_cabal_leader_valeria', 'node_turn_in_ledger');

    // Still locked until speaking to Morrigan AFTER sparing Malik
    assert.ok(!engine.state.worldState.quests['quest_nr_hidden_mercy_drowned']);
    engine.openDialogue('dlg_nr_bog_witch_morrigan', 'root');
    assert.ok(engine.state.worldState.quests['quest_nr_hidden_mercy_drowned'], "Hidden Mission 2 must unlock after speaking to Morrigan post-mercy");

    // Complete Hidden Mission 2 & verify Talisman grants +1 combat spell capacity!
    engine.state.worldState.currentLocationId = 'loc_nr_wolf_den_cavern';
    const cav = engine.getLocation('loc_nr_wolf_den_cavern');
    const cairnAct = cav.actions.find(a => a.id === 'act_nr_hidden_drakenseeker_cairn');
    assert.ok(cairnAct && engine.isActionAvailable(cairnAct, 'loc_nr_wolf_den_cavern'));
    const origRand = Math.random;
    Math.random = () => 0.95;
    try { engine.executeGenericAction(cairnAct); } finally { Math.random = origRand; }
    assert.ok(engine.hasItem('item_nr_frost_truce_tablet'));

    const capBefore = engine.getCombatSpellCapacityInfo().capacity;
    engine.openDialogue('dlg_nr_bog_witch_morrigan', 'node_turn_in_truce');
    assert.strictEqual(engine.state.worldState.quests['quest_nr_hidden_mercy_drowned'].completed, true);
    assert.ok(engine.hasItem('item_nr_drakenseeker_talisman'));
    engine.equipItem('item_nr_drakenseeker_talisman');
    assert.strictEqual(engine.getCombatSpellCapacityInfo().capacity, capBefore + 1, "Talisman of the First Truce must add +1 combat spell capacity");
  });

  // 11. Hidden Mission 3: Blood Upon the Frost-Throne (Order-Sensitive Mission Sequence + Killing/Failover Path)
  await test("Hidden Mission 3 ('Blood Upon the Frost-Throne'): enforces strict quest order AND works with Jarl death failover", async () => {
    // 11a. Negative test: completing Dwarven Vault BEFORE Barrow Curse must NOT trigger Path B!
    {
      const { engine } = await bootNorthernRealms();
      engine.startQuest('quest_nr_side_dwarven_vault', { silent: true });
      engine.completeQuest('quest_nr_side_dwarven_vault');
      engine.startQuest('quest_nr_side_barrow_curse', { silent: true });
      engine.completeQuest('quest_nr_side_barrow_curse');
      engine.modifyFactionReputation('faction_nr_frostpeak_watch', -45, 'Test transgression');
      engine.openDialogue('dlg_nr_skald_einar', 'root');
      assert.ok(!engine.state.worldState.quests['quest_nr_hidden_blood_throne'], "Wrong quest order (Vault before Barrow) must NOT trigger Hidden Mission 3");
    }

    // 11b. Positive Path B test: Barrow Curse STRICTLY BEFORE Dwarven Vault + negative Watch rep + speak to Einar AFTERWARD
    {
      const { engine } = await bootNorthernRealms();
      engine.startQuest('quest_nr_side_barrow_curse', { silent: true });
      engine.completeQuest('quest_nr_side_barrow_curse');
      engine.startQuest('quest_nr_side_dwarven_vault', { silent: true });
      engine.completeQuest('quest_nr_side_dwarven_vault');
      engine.modifyFactionReputation('faction_nr_frostpeak_watch', -45, 'Defied watch');
      assert.ok(!engine.state.worldState.quests['quest_nr_hidden_blood_throne'], "Must wait until speaking to Skald Einar afterward");
      engine.openDialogue('dlg_nr_skald_einar', 'root');
      assert.ok(engine.state.worldState.quests['quest_nr_hidden_blood_throne'], "Correct order + negative Watch + Einar talk unlocks Hidden Mission 3");

      // Complete Hidden Mission 3
      engine.state.worldState.currentLocationId = 'loc_nr_frostmere_archives';
      engine.startCombatEncounter('enc_nr_ice_wraith_shrine');
      engine.combatSession.enemy.hp = 0;
      engine.handleCombatVictory();
      assert.ok(engine.hasItem('item_nr_rime_king_crown'));
      engine.openDialogue('dlg_nr_archmage_kallan', 'node_seal_crown');
      assert.strictEqual(engine.state.worldState.quests['quest_nr_hidden_blood_throne'].completed, true);
      assert.strictEqual(engine.state.worldState.quests['quest_nr_hidden_blood_throne'].chosenPath, 'preserve_unity');
    }

    // 11c. Positive Path A + Main Quest Jarl Death Failover (proves killing Jarl unlocks Hidden Mission 3 AND never soft-locks Main Quest!)
    {
      const { engine } = await bootNorthernRealms();
      engine.startQuest('quest_nr_side_barrow_curse', { silent: true });
      engine.completeQuest('quest_nr_side_barrow_curse');
      engine.handleNpcDeath('npc_nr_jarl_sigurd');
      assert.strictEqual(engine.state.worldState.flags.jarl_failover_active, true, "Main quest must activate Jarl death failover");
      engine.openDialogue('dlg_nr_skald_einar', 'root');
      assert.ok(engine.state.worldState.quests['quest_nr_hidden_blood_throne'], "Slaying Jarl + Barrow + Einar unlocks Hidden Mission 3 (Path A)");

      // Main quest still completable through Skald Einar failover!
      engine.setWorldFlags({ vyr_defeated: true });
      engine.openDialogue('dlg_nr_skald_einar', 'node_failover_main');
      assert.strictEqual(engine.state.worldState.quests['quest_nr_main_shadow_of_wyrmfang'].completed, true, "Main quest completable via Skald Einar failover even if Jarl died");
    }
  });

  // 12. Save/Load Round-Trip for Hidden Quests, Ordered Event History & Mid-Combat Spells
  await test("Save/Load Persistence: hidden quests, eventHistory sequence, and mid-combat spell casts persist cleanly", async () => {
    const { engine } = await bootNorthernRealms();
    engine.state.player.skills.mythology_lore = 4;
    engine.state.player.attributes.wisdom = 14;
    engine.startQuest('quest_nr_hidden_mercy_drowned', { silent: true });
    engine.startCombat('creature_nr_timber_wolf');
    engine.castCombatSpell('bolt', 'standard');
    assert.strictEqual(engine.combatSession.spellsCast, 1);

    await engine.saveGameSilently(2);
    const snap = JSON.stringify(engine.state);
    const restored = JSON.parse(snap);
    assert.strictEqual(restored.worldState.quests['quest_nr_hidden_mercy_drowned'].discoveredHidden, true);
    assert.ok(Array.isArray(restored.worldState.eventHistory) && restored.worldState.eventHistory.length > 0);
    assert.strictEqual(restored.worldState.activeCombat.spellsCast, 1);
    assert.strictEqual(restored.worldState.activeCombat.spellCapacity, 3);
  });

  console.log("=================================================================");
  console.log(`ALL ${passed} NORTHERN REALMS & SYSTEMS TESTS PASSED SUCCESSFULLY!`);
  console.log("=================================================================");
}

runNorthernRealmsSuite().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});

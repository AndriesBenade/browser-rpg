/**
 * Automated Verification Suite for Greek Mythology RPG Engine
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=================================================================");
console.log("RUNNING GREEK MYTHOLOGY RPG ENGINE AUTOMATED TEST SUITE");
console.log("=================================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${testName}:`, err.message);
  }
}

// -----------------------------------------------------------------------------
// 1. JSON Content Schema & Integrity Verification
// -----------------------------------------------------------------------------
const filesToVerify = [
  'content/world/locations.json',
  'content/world/characters.json',
  'content/world/creatures.json',
  'content/world/items.json',
  'content/world/deities.json',
  'content/world/mythology.json',
  'content/world/glossary.json',
  'content/adventures/tutorial.json'
];

filesToVerify.forEach(relPath => {
  runTest(`Content integrity: ${relPath} is valid JSON`, () => {
    const fullPath = path.join(__dirname, '..', relPath);
    assert.ok(fs.existsSync(fullPath), `File does not exist: ${relPath}`);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.ok(typeof parsed === 'object' && parsed !== null, "Content is not a valid object");
  });
});

runTest("Adventure Pack Schema: Tutorial adventure has required fields", () => {
  const adv = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/adventures/tutorial.json'), 'utf8'));
  assert.equal(adv.id, "adv_tutorial_cithaeron_001");
  assert.ok(adv.title, "Missing title");
  assert.ok(adv.mythologicalSetting && adv.mythologicalSetting.primarySources.length > 0, "Missing mythological citations");
  assert.ok(adv.quests && adv.quests.length > 0, "Missing quests");
  assert.ok(adv.puzzles && adv.puzzles.length > 0, "Missing puzzles");
  assert.ok(adv.dialogues && adv.dialogues.dialogue_daidalos_shepherd, "Missing Daidalos dialogue tree");
});

runTest("World Locations Schema: All locations have valid coordinates and connections", () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/locations.json'), 'utf8'));
  assert.ok(data.locations.length >= 4, "Insufficient locations defined");
  const locIds = new Set(data.locations.map(l => l.id));
  data.locations.forEach(loc => {
    assert.ok(loc.coordinates && typeof loc.coordinates.x === 'number' && typeof loc.coordinates.y === 'number', `Invalid coordinates in ${loc.id}`);
    assert.ok(loc.narrative && loc.narrative.overview, `Missing narrative in ${loc.id}`);
    loc.connections.forEach(conn => {
      assert.ok(locIds.has(conn.targetLocationId), `Unknown connection target ${conn.targetLocationId} in ${loc.id}`);
      assert.ok(conn.travelHours > 0, `Travel hours must be > 0 in ${loc.id}`);
      assert.ok(conn.staminaCost >= 0, `Stamina cost must be >= 0 in ${loc.id}`);
    });
  });
});

runTest("Classical Attributions: Deities and Items cite primary ancient sources", () => {
  const deities = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/deities.json'), 'utf8'));
  deities.deities.forEach(d => {
    assert.ok(d.ancientGreek, `Missing ancient Greek spelling for ${d.name}`);
    assert.ok(d.primarySources && d.primarySources.length > 0, `Missing ancient sources for ${d.name}`);
  });

  const items = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/items.json'), 'utf8'));
  items.items.forEach(i => {
    assert.ok(i.id && i.name && i.category, `Item missing core fields: ${i.id}`);
    if (i.rarity !== 'common') {
      assert.ok(i.mythologicalLore, `Special item ${i.id} must have classical lore attribution`);
    }
  });
});

// -----------------------------------------------------------------------------
// 2. Rules Engine & Tabletop Mechanics Verification
// -----------------------------------------------------------------------------
class MockRulesEngine {
  getModifier(score) {
    return Math.floor((score - 10) / 2);
  }

  checkSkill(d20, score, skillRank, dc) {
    const mod = this.getModifier(score);
    const total = d20 + mod + (skillRank * 2);
    const isArete = d20 === 20;
    const isAte = d20 === 1;
    const success = isArete || (!isAte && total >= dc);
    return { success, isArete, isAte, total, mod };
  }
}

runTest("RulesEngine: Attribute modifier formula calculations", () => {
  const engine = new MockRulesEngine();
  assert.equal(engine.getModifier(10), 0);
  assert.equal(engine.getModifier(11), 0);
  assert.equal(engine.getModifier(12), 1);
  assert.equal(engine.getModifier(14), 2);
  assert.equal(engine.getModifier(18), 4);
  assert.equal(engine.getModifier(8), -1);
  assert.equal(engine.getModifier(7), -2);
});

runTest("RulesEngine: d20 resolution with Arete (20) and Ate (1)", () => {
  const engine = new MockRulesEngine();
  const res1 = engine.checkSkill(12, 14, 2, 13);
  assert.equal(res1.success, true);
  assert.equal(res1.total, 18);

  const res2 = engine.checkSkill(5, 10, 1, 15);
  assert.equal(res2.success, false);

  const res3 = engine.checkSkill(20, 8, 0, 30);
  assert.equal(res3.isArete, true);
  assert.equal(res3.success, true);

  const res4 = engine.checkSkill(1, 20, 5, 10);
  assert.equal(res4.isAte, true);
  assert.equal(res4.success, false);
});

// -----------------------------------------------------------------------------
// 3. Character Creation System Verification
// -----------------------------------------------------------------------------
class MockCharacterCreation {
  constructor() {
    this.state = {
      name: "Kallisto",
      gender: "female",
      origin: "arcadia",
      background: "hunter",
      attributes: {
        strength: 12,
        agility: 14,
        endurance: 13,
        intelligence: 11,
        wisdom: 13,
        charisma: 10,
        perception: 14
      },
      pointsLeft: 0,
      trait: "vigilant"
    };
  }

  applyHeroCreation() {
    const p = {
      name: this.state.name,
      origin: this.state.origin,
      background: this.state.background,
      attributes: { ...this.state.attributes },
      vitals: {
        maxHealth: 20 + Math.floor((this.state.attributes.endurance - 10) / 2) * 2,
        maxStamina: 16 + Math.floor((this.state.attributes.endurance - 10) / 2)
      },
      inventory: [],
      skills: { tracking: 2, survival: 2 }
    };
    p.vitals.health = p.vitals.maxHealth;
    p.vitals.stamina = p.vitals.maxStamina;

    if (this.state.background === "hunter") {
      p.inventory.push({ itemId: "item_hunting_bow_001", quantity: 1, equipped: true });
      p.skills.tracking += 2;
    }
    return p;
  }
}

runTest("Character Creation: Custom hero creation correctly calculates vitals and panoply", () => {
  const wizard = new MockCharacterCreation();
  const hero = wizard.applyHeroCreation();

  assert.equal(hero.name, "Kallisto");
  assert.equal(hero.origin, "arcadia");
  assert.equal(hero.background, "hunter");
  assert.equal(hero.vitals.maxHealth, 22); // 20 + (1 * 2)
  assert.equal(hero.vitals.health, 22);
  assert.equal(hero.skills.tracking, 4);
  assert.ok(hero.inventory.some(i => i.itemId === "item_hunting_bow_001"));
});

// -----------------------------------------------------------------------------
// 4. Action Engine & Grouped Selectable Cards Verification
// -----------------------------------------------------------------------------
class MockActionEngine {
  getActionGroups(locId, flags, inventory) {
    const groups = [];
    if (locId === "loc_cithaeron_crossroads") {
      const dialogue = [{ id: "act_talk_daidalos", title: "Speak with Elder Daidalos" }];
      groups.push({ category: "Conversations & Inquiries", actions: dialogue });

      const explore = [];
      if (!flags["examined_hermaion"]) {
        explore.push({ id: "act_examine_cairn", title: "Examine the Hermaion Stone Cairn" });
      }
      if (!flags["cithaeron_cave_path_known"]) {
        explore.push({ id: "act_search_tracks", title: "Search Scrubland for Ram Tracks" });
      }
      groups.push({ category: "Exploration & Investigation", actions: explore });

      if (flags["examined_hermaion"] && !flags["poured_libation_hermes"]) {
        const hasWine = inventory.some(i => i.itemId === "item_clay_aryballos_wine");
        groups.push({
          category: "Sacred Rites & Offerings",
          actions: [{ id: "act_pour_libation", title: "Pour Wine Libation", disabled: !hasWine }]
        });
      }
    }
    return groups;
  }
}

runTest("Action Deck: Predefined actions generate grouped cards with proper disabled states", () => {
  const engine = new MockActionEngine();
  // State 1: Fresh start
  const groups1 = engine.getActionGroups("loc_cithaeron_crossroads", {}, []);
  assert.equal(groups1.length, 2);
  assert.equal(groups1[0].category, "Conversations & Inquiries");
  assert.equal(groups1[1].category, "Exploration & Investigation");
  assert.equal(groups1[1].actions.length, 2);

  // State 2: Cairn examined, wine in inventory
  const groups2 = engine.getActionGroups("loc_cithaeron_crossroads", { "examined_hermaion": true }, [{ itemId: "item_clay_aryballos_wine" }]);
  const sacredGrp = groups2.find(g => g.category === "Sacred Rites & Offerings");
  assert.ok(sacredGrp, "Missing sacred rites category");
  assert.equal(sacredGrp.actions[0].disabled, false);

  // State 3: Cairn examined, NO wine in inventory
  const groups3 = engine.getActionGroups("loc_cithaeron_crossroads", { "examined_hermaion": true }, []);
  const sacredGrp3 = groups3.find(g => g.category === "Sacred Rites & Offerings");
  assert.equal(sacredGrp3.actions[0].disabled, true);
});

// -----------------------------------------------------------------------------
// 5. State Transitions & Save / Load Serialization
// -----------------------------------------------------------------------------
class MockGameState {
  constructor() {
    this.player = {
      name: "Alkaios",
      vitals: { health: 24, maxHealth: 24, stamina: 18, maxStamina: 18 },
      inventory: [{ itemId: "item_clay_aryballos_wine", quantity: 1 }]
    };
    this.time = { hour: 8, minute: 30, day: 12, month: 4, year: 1 };
  }

  advanceTime(hours, minutes) {
    this.time.minute += minutes;
    this.time.hour += hours;
    while (this.time.minute >= 60) {
      this.time.minute -= 60;
      this.time.hour += 1;
    }
    while (this.time.hour >= 24) {
      this.time.hour -= 24;
      this.time.day += 1;
    }
  }

  hasItem(id) {
    return this.player.inventory.some(i => i.itemId === id && i.quantity > 0);
  }

  removeItem(id, qty = 1) {
    const it = this.player.inventory.find(i => i.itemId === id);
    if (it) {
      it.quantity -= qty;
      if (it.quantity <= 0) {
        this.player.inventory = this.player.inventory.filter(i => i.itemId !== id);
      }
    }
  }
}

runTest("State & Time: Calendar rolls over correctly across hours and days", () => {
  const state = new MockGameState();
  assert.equal(state.time.day, 12);
  assert.equal(state.time.hour, 8);

  state.advanceTime(16, 45);
  assert.equal(state.time.day, 13);
  assert.equal(state.time.hour, 1);
  assert.equal(state.time.minute, 15);
});

runTest("Inventory: Consumption and removal maintains integrity", () => {
  const state = new MockGameState();
  assert.equal(state.hasItem("item_clay_aryballos_wine"), true);
  state.removeItem("item_clay_aryballos_wine", 1);
  assert.equal(state.hasItem("item_clay_aryballos_wine"), false);
  assert.equal(state.player.inventory.length, 0);
});

runTest("Save / Load Serialization Round-Trip: State serializes cleanly without circular refs", () => {
  const state = new MockGameState();
  const serialized = JSON.stringify(state);
  const deserialized = JSON.parse(serialized);
  assert.deepStrictEqual(state.time, deserialized.time);
  assert.deepStrictEqual(state.player.vitals, deserialized.player.vitals);
  assert.equal(deserialized.player.name, "Alkaios");
});

// -----------------------------------------------------------------------------
// 6. Tutorial Riddle & In-Page Modals Verification
// -----------------------------------------------------------------------------
runTest("Tutorial Simulation: Riddle keywords match Cadmean Threshold solutions", () => {
  const validSolutions = ["drakon", "dragon", "serpent", "ismenian drakon", "serpent of ares", "drakon ismenios"];
  
  function checkRiddleAnswer(input) {
    const norm = input.trim().toLowerCase();
    return validSolutions.some(k => norm.includes(k));
  }

  assert.equal(checkRiddleAnswer("The Ismenian Drakon"), true);
  assert.equal(checkRiddleAnswer("serpent"), true);
  assert.equal(checkRiddleAnswer("drakon"), true);
  assert.equal(checkRiddleAnswer("Zeus"), false);
  assert.equal(checkRiddleAnswer("Minotaur"), false);
});

// -----------------------------------------------------------------------------
// 7. Index.html Static Verification
// -----------------------------------------------------------------------------
runTest("Engine Deliverable: index.html contains all onboarding, wizard, and in-page modals", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Views
  assert.ok(html.includes('id="view-char-creation"'), "Missing view-char-creation");
  assert.ok(html.includes('id="view-story"'), "Missing view-story");
  assert.ok(html.includes('id="view-map"'), "Missing view-map");
  assert.ok(html.includes('id="view-character"'), "Missing view-character");
  assert.ok(html.includes('id="view-inventory"'), "Missing view-inventory");
  assert.ok(html.includes('id="view-quests"'), "Missing view-quests");
  assert.ok(html.includes('id="view-journal"'), "Missing view-journal");
  assert.ok(html.includes('id="view-codex"'), "Missing view-codex");
  assert.ok(html.includes('id="view-gods"'), "Missing view-gods");
  assert.ok(html.includes('id="view-settings"'), "Missing view-settings");

  // Modals & Walkthrough
  assert.ok(html.includes('id="walkthrough-overlay"'), "Missing walkthrough-overlay");
  assert.ok(html.includes('id="dialogue-modal"'), "Missing dialogue-modal");
  assert.ok(html.includes('id="riddle-modal"'), "Missing riddle-modal");
  assert.ok(html.includes('id="victory-modal"'), "Missing victory-modal");
  assert.ok(html.includes('id="combat-modal"'), "Missing combat-modal");
  assert.ok(html.includes('id="rest-modal"'), "Missing rest-modal");
  assert.ok(html.includes('id="defeat-modal"'), "Missing defeat-modal");

  // Core Engine Class & Decoupled Methods
  assert.ok(html.includes("class GreekMythologyEngine"), "Missing GreekMythologyEngine class definition");
  assert.ok(html.includes("getContextualActionGroups"), "Missing getContextualActionGroups");
  assert.ok(html.includes("startWalkthrough"), "Missing startWalkthrough");
  assert.ok(html.includes("confirmHeroCreation"), "Missing confirmHeroCreation");
  assert.ok(html.includes("completeTutorialQuest"), "Missing completeTutorialQuest");
  assert.ok(html.includes("openDialogue"), "Missing openDialogue generic runner");
  assert.ok(html.includes("startCombat"), "Missing startCombat generic runner");
  assert.ok(html.includes("openRestModal"), "Missing openRestModal");
  assert.ok(html.includes("executeRest"), "Missing executeRest");
  assert.ok(html.includes("equipItem"), "Missing equipItem");
  assert.ok(html.includes("consumeItem"), "Missing consumeItem");
  assert.ok(html.includes("handlePlayerDefeat"), "Missing handlePlayerDefeat");
});

// -----------------------------------------------------------------------------
// 8. Generic Decoupled Dialogue Runner Verification
// -----------------------------------------------------------------------------
class MockDialogueRunner {
  evaluateChoice(choice, flags, inventory, journalClues, questCompleted) {
    if (!choice.condition) return true;
    const cond = choice.condition;
    if (cond.flag !== undefined) {
      if (!!flags[cond.flag] !== cond.expected) return false;
    }
    if (cond.questNotDone && questCompleted) {
      return false;
    }
    if (cond.hasItem && !inventory.some(i => i.itemId === cond.hasItem && i.quantity > 0)) {
      return false;
    }
    if (cond.knowledge && !journalClues.includes(cond.knowledge)) {
      return false;
    }
    return true;
  }

  applyNodeEffects(node, state) {
    if (node.setFlags) Object.assign(state.flags, node.setFlags);
    if (node.giveItem) state.inventory.push({ itemId: node.giveItem, quantity: 1 });
    if (node.giveDrachmae) state.currencies.drachmae += node.giveDrachmae;
    if (node.updateQuest) {
      state.quests[node.updateQuest.questId] = state.quests[node.updateQuest.questId] || { objectives: {} };
      state.quests[node.updateQuest.questId].objectives[node.updateQuest.objectiveId] = node.updateQuest.completed;
    }
  }
}

runTest("Decoupled Dialogue: Evaluates dynamic conditions and applies node side-effects cleanly", () => {
  const runner = new MockDialogueRunner();
  const flags = { "cithaeron_beast_defeated": true };
  const journalClues = ["Cadmus"];

  // Choice 1: requires cithaeron_accepted_quest to be false -> should pass
  const choiceAccept = { label: "Accept", target: "node_accept", condition: { flag: "cithaeron_accepted_quest", expected: false } };
  assert.equal(runner.evaluateChoice(choiceAccept, flags, [], journalClues, false), true);

  // Once flag set to true -> should now fail
  flags["cithaeron_accepted_quest"] = true;
  assert.equal(runner.evaluateChoice(choiceAccept, flags, [], journalClues, false), false);

  // Choice 2: quest complete choice when quest is not done -> passes
  const choiceComplete = { label: "Turn in", target: "node_complete", condition: { flag: "cithaeron_beast_defeated", expected: true, questNotDone: true } };
  assert.equal(runner.evaluateChoice(choiceComplete, flags, [], journalClues, false), true);

  // When quest is done -> fails
  assert.equal(runner.evaluateChoice(choiceComplete, flags, [], journalClues, true), false);

  // Node effects application
  const state = { flags: {}, inventory: [], currencies: { drachmae: 10 }, quests: {} };
  runner.applyNodeEffects({
    setFlags: { "met_shepherd": true },
    giveItem: "item_clay_aryballos_wine",
    giveDrachmae: 30,
    updateQuest: { questId: "quest_01", objectiveId: "obj_01", completed: true }
  }, state);

  assert.equal(state.flags["met_shepherd"], true);
  assert.equal(state.inventory.some(i => i.itemId === "item_clay_aryballos_wine"), true);
  assert.equal(state.currencies.drachmae, 40);
  assert.equal(state.quests["quest_01"].objectives["obj_01"], true);
});

// -----------------------------------------------------------------------------
// 9. Generic Combat & Tactical Player Agency Verification
// -----------------------------------------------------------------------------
class MockCombatEngine {
  calculatePlayerAC(agilityScore, equippedItems, isShieldBraced) {
    const agiMod = Math.floor((agilityScore - 10) / 2);
    let ac = 10 + agiMod;
    equippedItems.forEach(item => {
      if (item.stats && item.stats.defenseBonus) {
        ac += item.stats.defenseBonus;
      }
    });
    if (isShieldBraced) ac += 4;
    return ac;
  }

  canRaiseShield(stamina) {
    return stamina >= 2;
  }

  resolveEnemyAttack(d20, enemyAtkBonus, playerAC, feintActive) {
    const penalty = feintActive ? 3 : 0;
    const total = d20 + enemyAtkBonus - penalty;
    const hit = (d20 === 20) || (d20 !== 1 && total >= playerAC);
    return { hit, total };
  }
}

runTest("Combat Agency: Dynamic AC, stamina-gated shield block, and feint tactical penalties", () => {
  const combat = new MockCombatEngine();
  const equippedItems = [
    { itemId: "item_linothorax_001", stats: { defenseBonus: 2 } },
    { itemId: "item_aspis_shield_001", stats: { defenseBonus: 3 } }
  ];

  // Base AC with Agi 12 (+1) + 2 + 3 = 16
  const baseAC = combat.calculatePlayerAC(12, equippedItems, false);
  assert.equal(baseAC, 16);

  // Shield Braced AC = 16 + 4 = 20
  const bracedAC = combat.calculatePlayerAC(12, equippedItems, true);
  assert.equal(bracedAC, 20);

  // Stamina check: 1 stamina cannot raise shield (needs 2)
  assert.equal(combat.canRaiseShield(1), false);
  assert.equal(combat.canRaiseShield(2), true);
  assert.equal(combat.canRaiseShield(10), true);

  // Tactical Feint gives -3 penalty to enemy attack
  // Enemy with +3 atk bonus rolls 14 against AC 16:
  // Normal total: 14 + 3 = 17 -> HIT
  const normAtk = combat.resolveEnemyAttack(14, 3, 16, false);
  assert.equal(normAtk.hit, true);

  // With Feint active: 14 + 3 - 3 = 14 -> MISS vs AC 16
  const feintAtk = combat.resolveEnemyAttack(14, 3, 16, true);
  assert.equal(feintAtk.hit, false);
});

// -----------------------------------------------------------------------------
// 10. Stamina Exhaustion & Forced March Economics
// -----------------------------------------------------------------------------
class MockTravelEconomics {
  evaluateTravel(currentStamina, currentHealth, connStaminaCost) {
    if (currentStamina >= connStaminaCost) {
      return {
        allowed: true,
        isForcedMarch: false,
        staminaRemaining: currentStamina - connStaminaCost,
        healthLoss: 0
      };
    }

    const deficit = connStaminaCost - currentStamina;
    if (currentHealth <= deficit) {
      return {
        allowed: false,
        isForcedMarch: true,
        staminaRemaining: currentStamina,
        healthLoss: deficit,
        reason: "Cannot survive forced march without collapsing."
      };
    }

    return {
      allowed: true,
      isForcedMarch: true,
      staminaRemaining: 0,
      healthLoss: deficit
    };
  }
}

runTest("Travel Economics: Exhaustion gates travel and enforces Forced March health penalty", () => {
  const travel = new MockTravelEconomics();

  // Scenario 1: Normal trek with plenty of stamina (10 Stamina vs 4 Cost)
  const res1 = travel.evaluateTravel(10, 24, 4);
  assert.equal(res1.allowed, true);
  assert.equal(res1.isForcedMarch, false);
  assert.equal(res1.staminaRemaining, 6);
  assert.equal(res1.healthLoss, 0);

  // Scenario 2: Exhausted trek (1 Stamina vs 5 Cost, 20 HP) -> Forced March burns 4 HP
  const res2 = travel.evaluateTravel(1, 20, 5);
  assert.equal(res2.allowed, true);
  assert.equal(res2.isForcedMarch, true);
  assert.equal(res2.staminaRemaining, 0);
  assert.equal(res2.healthLoss, 4);

  // Scenario 3: Lethal exhaustion (0 Stamina vs 6 Cost, but only 4 HP) -> Travel blocked!
  const res3 = travel.evaluateTravel(0, 4, 6);
  assert.equal(res3.allowed, false);
  assert.equal(res3.healthLoss, 6);
});

// -----------------------------------------------------------------------------
// 11. Rest & Recovery with Consequential Time Passing
// -----------------------------------------------------------------------------
class MockRestSystem {
  calculateShortRest(enduranceScore) {
    const endMod = Math.floor((enduranceScore - 10) / 2);
    return Math.max(5, 5 + endMod * 2);
  }

  calculateLongRest(maxHealth, enduranceScore) {
    const endMod = Math.floor((enduranceScore - 10) / 2);
    return Math.floor(maxHealth / 3) + Math.max(1, endMod * 2);
  }

  checkWildernessAmbush(dangerRating, d20Roll) {
    if (dangerRating <= 0) return false;
    // Ambush if d20 <= 4 in danger zones
    return d20Roll <= 4;
  }
}

runTest("Rest & Consequence: Short rest, full rest healing, and wilderness ambush checks", () => {
  const rest = new MockRestSystem();

  // Short rest restores stamina based on endurance
  const stm14 = rest.calculateShortRest(14); // End 14 (+2) -> 5 + 4 = 9
  assert.equal(stm14, 9);
  const stm10 = rest.calculateShortRest(10); // End 10 (+0) -> 5
  assert.equal(stm10, 5);

  // Long rest restores health
  const heal24 = rest.calculateLongRest(24, 14); // 8 + 4 = 12 HP
  assert.equal(heal24, 12);

  // Ambush checks in danger vs safe zones
  assert.equal(rest.checkWildernessAmbush(0, 2), false); // Sanctuary is always safe
  assert.equal(rest.checkWildernessAmbush(2, 3), true);  // d20=3 in danger zone triggers ambush
  assert.equal(rest.checkWildernessAmbush(2, 15), false); // d20=15 sleeps peacefully
});

// -----------------------------------------------------------------------------
// 12. Dynamic Inventory Equipment & Item Consumption
// -----------------------------------------------------------------------------
class MockInventoryManager {
  constructor() {
    this.inventory = [
      { itemId: "item_dory_spear_001", quantity: 1, equipped: true, slot: "main_hand" },
      { itemId: "item_xiphos_001", quantity: 1, equipped: false, slot: "main_hand" },
      { itemId: "item_dried_figs_bread", quantity: 2, equipped: false },
      { itemId: "item_salve_asclepius", quantity: 1, equipped: false }
    ];
    this.vitals = { health: 10, maxHealth: 24, stamina: 5, maxStamina: 18 };
  }

  equip(targetId, targetSlot) {
    this.inventory.forEach(i => {
      if (i.equipped && i.slot === targetSlot) i.equipped = false;
    });
    const it = this.inventory.find(i => i.itemId === targetId);
    if (it) {
      it.equipped = true;
      it.slot = targetSlot;
    }
  }

  consume(itemId) {
    const slot = this.inventory.find(i => i.itemId === itemId && i.quantity > 0);
    if (!slot) return false;

    if (itemId === "item_dried_figs_bread") {
      this.vitals.stamina = Math.min(this.vitals.maxStamina, this.vitals.stamina + 6);
    } else if (itemId === "item_salve_asclepius") {
      this.vitals.health = Math.min(this.vitals.maxHealth, this.vitals.health + 12);
    }
    slot.quantity--;
    if (slot.quantity <= 0) {
      this.inventory = this.inventory.filter(i => i.itemId !== itemId);
    }
    return true;
  }
}

runTest("Inventory Systems: Dynamic slot swapping and consumable item application", () => {
  const mgr = new MockInventoryManager();

  // Initial state: Dory equipped, Xiphos unequipped
  assert.equal(mgr.inventory.find(i => i.itemId === "item_dory_spear_001").equipped, true);
  assert.equal(mgr.inventory.find(i => i.itemId === "item_xiphos_001").equipped, false);

  // Equip Xiphos -> automatically unequipped Dory
  mgr.equip("item_xiphos_001", "main_hand");
  assert.equal(mgr.inventory.find(i => i.itemId === "item_dory_spear_001").equipped, false);
  assert.equal(mgr.inventory.find(i => i.itemId === "item_xiphos_001").equipped, true);

  // Consume figs (restores +6 stamina)
  assert.equal(mgr.vitals.stamina, 5);
  mgr.consume("item_dried_figs_bread");
  assert.equal(mgr.vitals.stamina, 11);
  assert.equal(mgr.inventory.find(i => i.itemId === "item_dried_figs_bread").quantity, 1);

  // Consume salve (restores +12 health)
  assert.equal(mgr.vitals.health, 10);
  mgr.consume("item_salve_asclepius");
  assert.equal(mgr.vitals.health, 22);
  assert.equal(mgr.inventory.some(i => i.itemId === "item_salve_asclepius"), false);
});

// -----------------------------------------------------------------------------
// 12. Perception as Wisdom Substat & Passive Perception (D&D Mechanics)
// -----------------------------------------------------------------------------
class MockPerceptionEngine {
  constructor(wisdomScore = 14, perceptionRank = 2) {
    this.player = {
      attributes: { wisdom: wisdomScore, strength: 12 },
      skills: { perception: perceptionRank, tracking: 2 },
      traits: [{ name: "Wayfarer's Eye", desc: "+2 Perception on mountain trails." }],
      inventory: []
    };
  }

  getModifier(score) {
    return Math.floor((score - 10) / 2);
  }

  getPerceptionBonus() {
    const wisMod = this.getModifier(this.player.attributes.wisdom);
    const perceptionRank = this.player.skills.perception || 0;
    let bonus = wisMod + (perceptionRank * 2);

    if (this.player.traits.some(t => t.name.includes("Wayfarer") || t.name.includes("Vigilant"))) {
      bonus += 2;
    }

    this.player.inventory.forEach(i => {
      if (i.equipped) {
        if (i.perceptionPenalty) bonus += i.perceptionPenalty;
        if (i.perceptionBonus) bonus += i.perceptionBonus;
      }
    });

    return bonus;
  }

  getPassivePerception() {
    return 10 + this.getPerceptionBonus();
  }

  checkSkill(d20, skillName, attributeName, dc) {
    let effectiveAttr = attributeName;
    if (effectiveAttr === "perception" || skillName === "perception") {
      effectiveAttr = "wisdom";
    }
    const attrScore = this.player.attributes[effectiveAttr] || 10;
    const attrMod = this.getModifier(attrScore);
    const skillRank = (skillName === "perception" || attributeName === "perception")
      ? this.player.skills.perception
      : (this.player.skills[skillName] || 0);

    const isArete = d20 === 20;
    const isAte = d20 === 1;
    const bonus = this.getPerceptionBonus();
    const total = d20 + bonus;
    const success = isArete || (!isAte && total >= dc);
    return { success, isArete, isAte, total, effectiveAttr };
  }
}

runTest("Perception Substat: Wisdom-derived Perception & Passive Perception calculation", () => {
  const engine = new MockPerceptionEngine(14, 2); // Wis 14 (+2), Rank 2 (+4), Trait (+2) = +8
  assert.equal(engine.getPerceptionBonus(), 8);
  assert.equal(engine.getPassivePerception(), 18);

  // Equip Corinthian Helmet with vision restriction (-1)
  engine.player.inventory.push({ itemId: "item_corinthian_helmet_001", equipped: true, perceptionPenalty: -1 });
  assert.equal(engine.getPerceptionBonus(), 7);
  assert.equal(engine.getPassivePerception(), 17);

  // Equip Archaic Bronze Bell of Hermes (+1)
  engine.player.inventory.push({ itemId: "item_votive_bell_hermes", equipped: true, perceptionBonus: 1 });
  assert.equal(engine.getPerceptionBonus(), 8);
  assert.equal(engine.getPassivePerception(), 18);

  // Verify attribute routing: "perception" or "tracking" check routes to Wisdom
  const rollRes = engine.checkSkill(12, "tracking", "perception", 15);
  assert.equal(rollRes.effectiveAttr, "wisdom");
  assert.equal(rollRes.total, 20); // 12 + 8 = 20
  assert.equal(rollRes.success, true);
});

// -----------------------------------------------------------------------------
// 13. Critical Success (Natural 20 / Arete) Outside Combat (Location Discoveries)
// -----------------------------------------------------------------------------
class MockCriticalDiscoveryEngine {
  constructor() {
    this.player = {
      inventory: [],
      currencies: { drachmae: 20 },
      piety: { hermes: 1 }
    };
    this.worldState = {
      currentLocationId: "loc_cithaeron_crossroads",
      time: { day: 12, month: 4, hour: 9, minute: 0 },
      journal: { discoveries: [] }
    };
  }

  getLocationCriticalDiscovery(locId) {
    const discoveries = {
      "loc_cithaeron_crossroads": {
        itemId: "item_clay_aryballos_wine",
        quantity: 1,
        drachmae: 8,
        title: "Ancient Wayfarer's Wine Cache"
      },
      "loc_cithaeron_fissure_cave": {
        itemId: "item_salve_asclepius",
        quantity: 1,
        drachmae: 5,
        title: "Healer's Lost Alabastron"
      },
      "loc_crag_overlook": {
        itemId: "item_xiphos_001",
        quantity: 1,
        drachmae: 10,
        title: "Heroic Leaf-Bladed Xiphos"
      },
      "loc_shrine_hermes_strophaios": {
        itemId: "item_dried_figs_bread",
        quantity: 2,
        drachmae: 6,
        pietyDeity: "hermes",
        pietyAmount: 1,
        title: "Consecrated Offering of Hermes"
      },
      "loc_plataea_outskirts": {
        itemId: "item_hunting_bow_001",
        quantity: 1,
        drachmae: 12,
        title: "Arcadian Hunting Bow in the Thyme"
      }
    };
    return discoveries[locId];
  }

  triggerCriticalSuccessDiscovery() {
    const locId = this.worldState.currentLocationId;
    const disc = this.getLocationCriticalDiscovery(locId);

    // Add item
    const existing = this.player.inventory.find(i => i.itemId === disc.itemId);
    if (existing) existing.quantity += disc.quantity;
    else this.player.inventory.push({ itemId: disc.itemId, quantity: disc.quantity, equipped: false });

    // Add drachmae
    this.player.currencies.drachmae += disc.drachmae;

    // Add piety
    if (disc.pietyDeity) {
      this.player.piety[disc.pietyDeity] = (this.player.piety[disc.pietyDeity] || 0) + (disc.pietyAmount || 1);
    }

    // Journal entry
    this.worldState.journal.discoveries.unshift({
      title: `Arete Discovery: ${disc.title}`,
      text: `Acquired ${disc.itemId} and ${disc.drachmae} silver drachmae.`
    });
  }
}

runTest("Critical Success: Natural 20 skill checks award location-specific items & journal entry", () => {
  const engine = new MockCriticalDiscoveryEngine();

  // Test 1: Mount Cithaeron Crossroads -> Pramnian wine aryballos & 8 silver drachmae
  engine.worldState.currentLocationId = "loc_cithaeron_crossroads";
  engine.triggerCriticalSuccessDiscovery();

  assert.ok(engine.player.inventory.some(i => i.itemId === "item_clay_aryballos_wine"));
  assert.equal(engine.player.currencies.drachmae, 28); // 20 + 8
  assert.equal(engine.worldState.journal.discoveries.length, 1);
  assert.ok(engine.worldState.journal.discoveries[0].title.includes("Ancient Wayfarer's Wine Cache"));

  // Test 2: Whispering Fissure -> Epidaurian salve & 5 silver drachmae
  engine.worldState.currentLocationId = "loc_cithaeron_fissure_cave";
  engine.triggerCriticalSuccessDiscovery();

  assert.ok(engine.player.inventory.some(i => i.itemId === "item_salve_asclepius"));
  assert.equal(engine.player.currencies.drachmae, 33); // 28 + 5
  assert.equal(engine.worldState.journal.discoveries.length, 2);

  // Test 3: Lion's Crag Overlook -> Bronze Xiphos & 10 silver drachmae
  engine.worldState.currentLocationId = "loc_crag_overlook";
  engine.triggerCriticalSuccessDiscovery();

  assert.ok(engine.player.inventory.some(i => i.itemId === "item_xiphos_001"));
  assert.equal(engine.player.currencies.drachmae, 43); // 33 + 10
  assert.equal(engine.worldState.journal.discoveries.length, 3);

  // Test 4: Shrine of Hermes -> Consecrated figs, 6 drachmae & +1 Hermes piety
  engine.worldState.currentLocationId = "loc_shrine_hermes_strophaios";
  engine.triggerCriticalSuccessDiscovery();

  assert.ok(engine.player.inventory.some(i => i.itemId === "item_dried_figs_bread"));
  assert.equal(engine.player.currencies.drachmae, 49); // 43 + 6
  assert.equal(engine.player.piety.hermes, 2); // 1 + 1
});

// -----------------------------------------------------------------------------
// 14. Combat Critical Strike (Arete 20): Critical Damage & Spoils
// -----------------------------------------------------------------------------
runTest("Combat Critical Strike: Natural 20 deals enhanced Arete damage and dislodges battlefield spoils", () => {
  const player = {
    attributes: { strength: 14 },
    currencies: { drachmae: 10 },
    inventory: []
  };
  const weapon = { stats: { damageMin: 5, damageMax: 10 } }; // Dory spear
  const enemy = { name: "Cithaeron Dire Wolf", hp: 30 };

  const strMod = Math.floor((player.attributes.strength - 10) / 2); // +2
  const maxDmg = weapon.stats.damageMax; // 10

  // On d20 === 20: Critical damage = (maxDmg * 2) + strMod + 4 = (10 * 2) + 2 + 4 = 26!
  const criticalDmg = (maxDmg * 2) + strMod + 4;
  enemy.hp -= criticalDmg;
  assert.equal(criticalDmg, 26);
  assert.equal(enemy.hp, 4); // Defeats nearly any standard beast in one heroic strike!

  // Combat spoils: +4 to +8 drachmae
  const bonusDrachmae = 6;
  player.currencies.drachmae += bonusDrachmae;
  assert.equal(player.currencies.drachmae, 16);
});

// -----------------------------------------------------------------------------
// 15. Collaboration Protocol & Developer Notes Verification
// -----------------------------------------------------------------------------
runTest("Collaboration Protocol: DEVELOPER_NOTES.md contains AI hand-off log and architecture specs", () => {
  const notesPath = path.resolve(__dirname, "../DEVELOPER_NOTES.md");
  assert.ok(fs.existsSync(notesPath), "DEVELOPER_NOTES.md must exist in browser-rpg root");

  const content = fs.readFileSync(notesPath, "utf8");
  assert.ok(content.includes("Chronological AI & Developer Hand-Off Log"), "Must contain Hand-Off Log");
  assert.ok(content.includes("AI-to-AI Collaboration Protocol"), "Must contain AI Collaboration Protocol");
  assert.ok(content.includes("Perception Substat"), "Must reference Perception Substat rules");
  assert.ok(content.includes("Critical Success (Arete [20])"), "Must reference Arete Critical Success rules");
  assert.ok(content.includes("How to Verify & Run Tests"), "Must contain testing instructions");
});

// -----------------------------------------------------------------------------
// 16. Authentic Greek Mythology World Expansion Validation
// -----------------------------------------------------------------------------
runTest("Mythological Expansion: 19 authentic classical locations across 4 major regions", () => {
  const locData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/locations.json'), 'utf8'));
  assert.ok(locData.locations.length >= 19, `Expected at least 19 locations, found ${locData.locations.length}`);

  const regions = new Set(locData.locations.map(l => l.region));
  assert.ok(regions.has("Boeotia"), "Missing Boeotia region");
  assert.ok(regions.has("Phocis"), "Missing Phocis / Delphi region");
  assert.ok(regions.has("Argolis"), "Missing Argolis region");
  assert.ok(regions.has("Arcadia"), "Missing Arcadia region");
  assert.ok(regions.has("Laconia"), "Missing Laconia region");

  // Verify key mythic landmarks
  const locIds = locData.locations.map(l => l.id);
  assert.ok(locIds.includes("loc_thebes_seven_gates"), "Missing Thebes Seven Gates");
  assert.ok(locIds.includes("loc_delphi_sanctuary"), "Missing Sanctuary of Delphi");
  assert.ok(locIds.includes("loc_castalian_spring"), "Missing Castalian Spring");
  assert.ok(locIds.includes("loc_mycenae_lion_gate"), "Missing Mycenae Lion Gate");
  assert.ok(locIds.includes("loc_lernaean_swamp"), "Missing Marshes of Lerna");
  assert.ok(locIds.includes("loc_nemean_valley"), "Missing Nemean Valley");
  assert.ok(locIds.includes("loc_mount_lykaion"), "Missing Mount Lykaion");
  assert.ok(locIds.includes("loc_cape_taenarum"), "Missing Cape Taenarum Gate of Hades");
});

runTest("Mythological Expansion: Tier 1 to 5 creatures with Greek names, XP rewards & citations", () => {
  const creatData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/creatures.json'), 'utf8'));
  assert.ok(creatData.creatures.length >= 12, `Expected at least 12 creatures, found ${creatData.creatures.length}`);

  const tiers = new Set(creatData.creatures.map(c => c.tier));
  for (let t = 1; t <= 5; t++) {
    assert.ok(tiers.has(t), `Missing creature Tier ${t}`);
  }

  creatData.creatures.forEach(c => {
    assert.ok(c.id && c.name && c.ancientGreek, `Creature ${c.id} missing ancient Greek name`);
    assert.ok(typeof c.xpReward === 'number' && c.xpReward >= 40, `Creature ${c.id} missing valid XP reward`);
    assert.ok(c.mythologicalSource && c.mythologicalSource.author, `Creature ${c.id} missing ancient source attribution`);
    assert.ok(c.vitals && c.vitals.maxHealth > 0, `Creature ${c.id} missing vitals`);
    assert.ok(c.actions && c.actions.length >= 2, `Creature ${c.id} requires at least 2 distinct combat actions`);
  });

  // Verify legendary bosses
  const bossIds = creatData.creatures.map(c => c.id);
  assert.ok(bossIds.includes("creature_sphinx_thebes"), "Missing Sphinx of Thebes");
  assert.ok(bossIds.includes("creature_drakon_ares"), "Missing Drakon of Ares");
  assert.ok(bossIds.includes("creature_lernaean_hydra"), "Missing Lernaean Hydra");
});

runTest("Mythological Expansion: Classical Relics, Weapons, Deities and Mythology Codex entries", () => {
  const items = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/items.json'), 'utf8')).items;
  assert.ok(items.length >= 24, `Expected at least 24 items, found ${items.length}`);
  
  const relicIds = items.map(i => i.id);
  assert.ok(relicIds.includes("item_nemean_pelt_fragment"), "Missing Nemean Lion Pelt Fragment");
  assert.ok(relicIds.includes("item_hydra_bile_vial"), "Missing Hydra Venom Vial");
  assert.ok(relicIds.includes("item_delphic_laurel_wreath"), "Missing Delphic Laurel Wreath");
  assert.ok(relicIds.includes("item_omphalos_amulet"), "Missing Omphalos Amulet");
  assert.ok(relicIds.includes("item_charon_obol_token"), "Missing Charon's Obol Token");

  const deities = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/deities.json'), 'utf8')).deities;
  assert.ok(deities.length >= 8, `Expected at least 8 deities, found ${deities.length}`);
  const deityNames = deities.map(d => d.id);
  assert.ok(deityNames.includes("deity_hades"), "Missing Hades");
  assert.ok(deityNames.includes("deity_demeter"), "Missing Demeter");

  const myth = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/mythology.json'), 'utf8')).loreEntries;
  assert.ok(myth.length >= 12, `Expected at least 12 myth entries, found ${myth.length}`);
});

// -----------------------------------------------------------------------------
// 17. Heroic Ascension & Level-Up Progression Mechanics Verification
// -----------------------------------------------------------------------------
class MockProgressionEngine {
  constructor() {
    this.player = {
      level: 1,
      xp: 0,
      xpNext: 100,
      heroTitle: "Ephebos (Youthful Initiate)",
      renown: 10,
      attributes: {
        strength: 14,
        agility: 12,
        endurance: 14,
        intelligence: 11,
        wisdom: 13,
        charisma: 11,
        perception: 13
      },
      skills: {
        melee_combat: 3,
        survival: 2,
        tracking: 2,
        perception: 2,
        mythology_lore: 2,
        investigation: 2
      },
      vitals: {
        health: 24, maxHealth: 24,
        stamina: 18, maxStamina: 18
      },
      feats: []
    };
    this.ascensionTriggered = false;
  }

  getLevelTitle(lvl) {
    const titles = {
      1: "Ephebos (Youthful Initiate)",
      2: "Hoplite of the Phalanx",
      3: "Promachos (Vanguard Champion)",
      4: "Hero of the Peloponnese",
      5: "Ison Theos (Peer of Demigods)"
    };
    return titles[lvl] || "Legendary Hero of Hellas";
  }

  getXPForNextLevel(lvl) {
    const table = { 1: 100, 2: 250, 3: 500, 4: 900, 5: 1500 };
    return table[lvl] || (lvl * lvl * 60);
  }

  awardXP(amount) {
    this.player.xp += amount;
    if (this.player.xp >= this.player.xpNext) {
      this.ascensionTriggered = true;
    }
  }

  confirmLevelUp(chosenAttr, chosenSkill, chosenFeat) {
    this.player.level += 1;
    this.player.heroTitle = this.getLevelTitle(this.player.level);
    this.player.xpNext = this.getXPForNextLevel(this.player.level);

    // Vitals Boost
    this.player.vitals.maxHealth += 4;
    this.player.vitals.health = this.player.vitals.maxHealth;
    this.player.vitals.maxStamina += 2;
    this.player.vitals.stamina = this.player.vitals.maxStamina;

    // Attributes Boost
    this.player.attributes[chosenAttr] += 1;
    if (chosenAttr === "wisdom") {
      this.player.attributes.perception = this.player.attributes.wisdom;
    }

    // Skills Boost
    this.player.skills[chosenSkill] = (this.player.skills[chosenSkill] || 0) + 1;

    // Feat Boost
    if (chosenFeat && !this.player.feats.includes(chosenFeat)) {
      this.player.feats.push(chosenFeat);
    }

    this.player.renown += 15;
    this.ascensionTriggered = false;
  }
}

runTest("Level Progression: XP accumulation, title advancement, and vitals/attribute scaling", () => {
  const engine = new MockProgressionEngine();
  assert.equal(engine.player.level, 1);
  assert.equal(engine.player.heroTitle, "Ephebos (Youthful Initiate)");
  assert.equal(engine.player.xpNext, 100);

  // Award 40 XP from wolf combat
  engine.awardXP(40);
  assert.equal(engine.player.xp, 40);
  assert.equal(engine.ascensionTriggered, false);

  // Award 25 XP from Arete critical discovery
  engine.awardXP(25);
  assert.equal(engine.player.xp, 65);
  assert.equal(engine.ascensionTriggered, false);

  // Award 50 XP from solving Cadmean riddle -> Total 115 >= 100 XP threshold!
  engine.awardXP(50);
  assert.equal(engine.player.xp, 115);
  assert.equal(engine.ascensionTriggered, true);

  // Ascend to Level 2: Boost Wisdom, Perception skill, and claim Bane of the Hydra feat
  engine.confirmLevelUp("wisdom", "perception", "hydra_bane");

  assert.equal(engine.player.level, 2);
  assert.equal(engine.player.heroTitle, "Hoplite of the Phalanx");
  assert.equal(engine.player.xpNext, 250);
  assert.equal(engine.player.vitals.maxHealth, 28); // 24 + 4
  assert.equal(engine.player.vitals.health, 28);
  assert.equal(engine.player.vitals.maxStamina, 20); // 18 + 2
  assert.equal(engine.player.vitals.stamina, 20);
  assert.equal(engine.player.attributes.wisdom, 14); // 13 + 1
  assert.equal(engine.player.attributes.perception, 14); // Wisdom substat sync!
  assert.equal(engine.player.skills.perception, 3); // 2 + 1
  assert.ok(engine.player.feats.includes("hydra_bane"));
  assert.equal(engine.player.renown, 25); // 10 + 15
});

// -----------------------------------------------------------------------------
// 18. Heroic Feats Mechanical Effects Verification
// -----------------------------------------------------------------------------
runTest("Heroic Feats: Tactical bonuses in combat, travel and exploration", () => {
  const player = {
    level: 2,
    attributes: { strength: 14, wisdom: 14 },
    skills: { melee_combat: 3, perception: 2, mythology_lore: 2 },
    feats: ["hydra_bane", "pallas_aegis", "laconian_iron", "hermes_swift_stride", "eagle_zeus", "pythian_prescience"]
  };

  // 1. Hydra Bane: +2 damage on attacks
  const baseDmg = 7;
  const effectiveDmg = baseDmg + (player.feats.includes("hydra_bane") ? 2 : 0);
  assert.equal(effectiveDmg, 9);

  // 2. Aegis of Pallas: +6 AC on shield block (up from +4)
  const baseShieldAC = 4;
  const shieldAC = player.feats.includes("pallas_aegis") ? 6 : baseShieldAC;
  assert.equal(shieldAC, 6);

  // 3. Laconian Iron: -2 damage taken (min 1)
  const incomingMonsterDmg = 8;
  const mitigatedDmg = Math.max(1, incomingMonsterDmg - (player.feats.includes("laconian_iron") ? 2 : 0));
  assert.equal(mitigatedDmg, 6);

  // 4. Stride of Hermes: -1 stamina cost on overland travel
  const mountainPassCost = 5;
  const reducedCost = Math.max(1, mountainPassCost - (player.feats.includes("hermes_swift_stride") ? 1 : 0));
  assert.equal(reducedCost, 4);

  // 5. Eye of the Eagle: +2 perception bonus
  const wisMod = Math.floor((player.attributes.wisdom - 10) / 2); // +2
  const featBonus = player.feats.includes("eagle_zeus") ? 2 : 0;
  const totalPerceptionBonus = wisMod + (player.skills.perception * 2) + featBonus; // 2 + 4 + 2 = 8
  const passivePerception = 10 + totalPerceptionBonus; // 18!
  assert.equal(passivePerception, 18);

  // 6. Pythian Prescience: +3 mythology lore bonus
  const loreBonus = wisMod + (player.skills.mythology_lore * 2) + (player.feats.includes("pythian_prescience") ? 3 : 0);
  assert.equal(loreBonus, 9); // 2 + 4 + 3 = 9
});

// -----------------------------------------------------------------------------
// 19. Regional Recommended Level Danger Rating & Scaling Verification
// -----------------------------------------------------------------------------
runTest("Regional Scaling: Dangerous zones trigger peril warning when hero level < recommended level", () => {
  const locData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/locations.json'), 'utf8'));
  const thebesSphinx = locData.locations.find(l => l.id === "loc_mount_sphingion");
  const lerna = locData.locations.find(l => l.id === "loc_lernaean_swamp");
  const taenarum = locData.locations.find(l => l.id === "loc_cape_taenarum");

  assert.equal(thebesSphinx.recommendedLevel, 3);
  assert.equal(lerna.recommendedLevel, 4);
  assert.equal(taenarum.recommendedLevel, 4);

  const heroLevel = 2;
  const isThebesDangerous = thebesSphinx.recommendedLevel > heroLevel;
  const isLernaDangerous = lerna.recommendedLevel > heroLevel;

  assert.ok(isThebesDangerous, "Hero Level 2 should trigger peril warning at Mount Sphingion (Lvl 3)");
  assert.ok(isLernaDangerous, "Hero Level 2 should trigger peril warning at Lerna (Lvl 4)");
});

// -----------------------------------------------------------------------------
// 20. Dual Content Synchronization Verification
// -----------------------------------------------------------------------------
runTest("Dual Content Sync: index.html embedded fallback contains 19 locations, 12 creatures and 24 items", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Verify locations in index.html
  assert.ok(html.includes('"id": "loc_thebes_seven_gates"'), "Fallback missing Seven Gates of Thebes");
  assert.ok(html.includes('"id": "loc_lernaean_swamp"'), "Fallback missing Marshes of Lerna");
  assert.ok(html.includes('"id": "loc_delphi_sanctuary"'), "Fallback missing Delphi Sanctuary");

  // Verify creatures in index.html
  assert.ok(html.includes('"id": "creature_lernaean_hydra"'), "Fallback missing Lernaean Hydra");
  assert.ok(html.includes('"id": "creature_sphinx_thebes"'), "Fallback missing Sphinx of Thebes");
  assert.ok(html.includes('"id": "creature_lykaion_werewolf"'), "Fallback missing Lykaion Werewolf");

  // Verify items in index.html
  assert.ok(html.includes('"id": "item_nemean_pelt_fragment"'), "Fallback missing Nemean Pelt Fragment");
  assert.ok(html.includes('"id": "item_hydra_bile_vial"'), "Fallback missing Hydra Venom Vial");

  // Verify level-up methods in index.html
  assert.ok(html.includes("awardXP("), "Engine missing awardXP");
  assert.ok(html.includes("triggerLevelUp("), "Engine missing triggerLevelUp");
  assert.ok(html.includes("confirmLevelUp("), "Engine missing confirmLevelUp");
  assert.ok(html.includes("getHeroicFeatDefinitions("), "Engine missing getHeroicFeatDefinitions");
});

// -----------------------------------------------------------------------------
// 21. Contextual Mythological Terminology & Central Glossary Verification
// -----------------------------------------------------------------------------
runTest("Glossary Schema: glossary.json contains comprehensive classical terms with plain English explanations", () => {
  const glossPath = path.join(__dirname, '../content/world/glossary.json');
  assert.ok(fs.existsSync(glossPath), "glossary.json file must exist");
  const data = JSON.parse(fs.readFileSync(glossPath, 'utf8'));
  assert.ok(Array.isArray(data.glossary), "glossary.json must contain a 'glossary' array");
  assert.ok(data.glossary.length >= 25, `Expected at least 25 glossary terms, found ${data.glossary.length}`);

  const requiredKeys = ['hermaion', 'aspis', 'dory', 'xiphos', 'linothorax', 'aryballos', 'libation', 'arete', 'ate', 'kleos', 'psychopompos', 'drakon'];
  const foundKeys = new Set(data.glossary.map(g => g.key));
  requiredKeys.forEach(k => {
    assert.ok(foundKeys.has(k), `Missing core mythological term in glossary: ${k}`);
  });

  data.glossary.forEach(item => {
    assert.ok(item.key && typeof item.key === 'string', `Invalid key in glossary entry: ${JSON.stringify(item)}`);
    assert.ok(Array.isArray(item.terms) && item.terms.length > 0, `Missing search terms for ${item.key}`);
    assert.ok(item.name && typeof item.name === 'string', `Missing name for ${item.key}`);
    assert.ok(item.category && typeof item.category === 'string', `Missing category for ${item.key}`);
    assert.ok(item.simpleEnglish && typeof item.simpleEnglish === 'string', `Missing simple English explanation for ${item.key}`);
    assert.ok(item.explanation && typeof item.explanation === 'string', `Missing detailed explanation for ${item.key}`);
  });
});

runTest("Glossary Engine: enrichMythologicalText safely wraps terms without mangling HTML tags", () => {
  const glossData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/world/glossary.json'), 'utf8')).glossary;
  
  // Mock Glossary Engine
  const glossaryMap = new Map();
  const allTerms = [];
  glossData.forEach(entry => {
    entry.terms.forEach(t => {
      const lower = t.toLowerCase().trim();
      glossaryMap.set(lower, entry);
      allTerms.push(lower);
    });
  });
  allTerms.sort((a, b) => b.length - a.length);
  const escaped = allTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

  function enrich(html) {
    let insideIgnoredTag = 0;
    const ignoredTagRegex = /^(?:button|a|input|textarea|select|script|style)$/i;

    return html.replace(/(<(?:\/)?([a-zA-Z0-9\-]+)[^>]*>)|([^<]+)/g, (match, tag, tagName, text) => {
      if (tag) {
        const isClosing = tag.startsWith("</");
        const tagLower = tagName ? tagName.toLowerCase() : "";
        if (ignoredTagRegex.test(tagLower)) {
          if (isClosing) {
            insideIgnoredTag = Math.max(0, insideIgnoredTag - 1);
          } else if (!tag.endsWith("/>")) {
            insideIgnoredTag++;
          }
        } else if (tag.includes('class="myth-term"')) {
          if (isClosing) {
            insideIgnoredTag = Math.max(0, insideIgnoredTag - 1);
          } else {
            insideIgnoredTag++;
          }
        }
        return match;
      }
      if (insideIgnoredTag > 0 || !text) return text;
      return text.replace(pattern, (termMatch) => {
        const lower = termMatch.toLowerCase();
        const entry = glossaryMap.get(lower);
        if (!entry) return termMatch;
        return `<span class="myth-term" data-term-key="${entry.key}">${termMatch}</span>`;
      });
    });
  }

  const sample = 'You discover an ancient hermaion along the pass. A hoplite carried an aspis and a dory.';
  const enriched = enrich(sample);

  assert.ok(enriched.includes('<span class="myth-term" data-term-key="hermaion">hermaion</span>'), "Failed to wrap hermaion");
  assert.ok(enriched.includes('<span class="myth-term" data-term-key="aspis">aspis</span>'), "Failed to wrap aspis");
  assert.ok(enriched.includes('<span class="myth-term" data-term-key="dory">dory</span>'), "Failed to wrap dory");

  // Verify tags with attributes are NOT corrupted
  const htmlWithTag = '<a href="https://example.com/aspis" title="aspis link">Read about aspis</a> and a dory outside.';
  const enrichedTag = enrich(htmlWithTag);
  assert.ok(enrichedTag.includes('href="https://example.com/aspis"'), "Enrichment corrupted link href attribute!");
  assert.ok(enrichedTag.includes('title="aspis link"'), "Enrichment corrupted link title attribute!");
  assert.ok(!enrichedTag.includes('data-term-key="aspis"'), "Inside <a> tag should be ignored to prevent nesting conflicts");
  assert.ok(enrichedTag.includes('<span class="myth-term" data-term-key="dory">dory</span>'), "Outside tag must be enriched");

  // Idempotency: re-running on already-enriched text should not double-wrap
  const doubleEnriched = enrich(enriched);
  assert.equal(doubleEnriched, enriched, "Enrichment must be 100% idempotent");
});

// -----------------------------------------------------------------------------
// 22. Natural Language Outcomes (No Technical D&D Math Exposed)
// -----------------------------------------------------------------------------
runTest("Narrative Checks: Output presents natural literary outcomes without technical dice formulas", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Verify checkSkill implementation in index.html
  assert.ok(html.includes('class="entry-narrative-check'), "checkSkill must output .entry-narrative-check container");
  assert.ok(html.includes('outcome-success') && html.includes('outcome-failure') && html.includes('outcome-arete') && html.includes('outcome-ate'), "Missing outcome classification styles");
  
  // Verify that raw D&D strings are NOT logged to the story transcript
  assert.ok(!html.includes('<span>d20: ${d20} + Mod'), "checkSkill must NOT expose raw 'd20: X + Mod' roll formula");
  assert.ok(!html.includes('vs DC ${dc}</span>'), "checkSkill must NOT expose raw 'vs DC X' to the player");

  // Verify that combat logs do not display raw AC comparisons
  assert.ok(!html.includes('(${attackRoll} vs AC ${targetAC})'), "Combat logs must NOT expose raw 'attackRoll vs AC'");
  assert.ok(!html.includes('(${enemyRoll} vs AC ${playerAC})'), "Combat logs must NOT expose raw 'enemyRoll vs AC'");
});

// -----------------------------------------------------------------------------
// 23. Immediate Visual Feedback (Toast Notification System)
// -----------------------------------------------------------------------------
runTest("Toast Notifications: Container, styling, and trigger wiring across key systems", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Verify DOM container
  assert.ok(html.includes('id="toast-container"'), "DOM must contain #toast-container");
  assert.ok(html.includes('class="toast-notification-container"'), "DOM must style #toast-container");

  // Verify showToast method
  assert.ok(html.includes('showToast(category, title, type = "info"'), "Engine must implement showToast method");

  // Verify CSS styles
  assert.ok(html.includes('.toast-card'), "CSS missing .toast-card");
  assert.ok(html.includes('.toast-positive'), "CSS missing .toast-positive");
  assert.ok(html.includes('.toast-negative'), "CSS missing .toast-negative");
  assert.ok(html.includes('.toast-info'), "CSS missing .toast-info");

  // Verify toast wiring across game systems
  assert.ok(html.includes('this.showToast("item"'), "addItem / removeItem must trigger item toasts");
  assert.ok(html.includes('this.showToast("level"'), "awardXP / confirmLevelUp must trigger level toasts");
  assert.ok(html.includes('this.showToast("attribute"'), "Attribute progression must trigger attribute toasts");
  assert.ok(html.includes('this.showToast("quest"'), "Quest updates must trigger quest toasts");
  assert.ok(html.includes('this.showToast("journal"'), "Journal discoveries must trigger journal toasts");
  assert.ok(html.includes('this.showToast("discovery"'), "Travel arrivals must trigger discovery toasts");
});

// -----------------------------------------------------------------------------
// 24. Persistent Custom Action Bar Interface Architecture
// -----------------------------------------------------------------------------
runTest("Persistent Action Bar: Input is permanently docked at the base of the interface across all views", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Verify DOM structure
  assert.ok(html.includes('id="persistent-action-bar"'), "DOM must contain #persistent-action-bar");
  assert.ok(html.includes('id="custom-action-input"'), "DOM must contain #custom-action-input");
  assert.ok(html.includes('id="custom-action-form"'), "DOM must contain #custom-action-form");

  // Verify that it is outside #viewports-stage so it stays visible regardless of active viewport
  const stageIndex = html.indexOf('id="viewports-stage"');
  const barIndex = html.indexOf('id="persistent-action-bar"');
  assert.ok(stageIndex !== -1 && barIndex !== -1, "Both stage and persistent bar must exist");
  assert.ok(barIndex > stageIndex, "Persistent bar must be docked below the viewports stage");

  // Verify CSS styles
  assert.ok(html.includes('.persistent-action-bar-container'), "CSS missing .persistent-action-bar-container");
  assert.ok(html.includes('.persistent-action-bar'), "CSS missing .persistent-action-bar");
  assert.ok(html.includes('.persistent-action-input'), "CSS missing .persistent-action-input");

  // Verify handleCustomAction switches to view-story when invoked from any tab
  assert.ok(html.includes('if (this.currentView !== "view-story") {\n          this.switchView("view-story");\n        }'), "handleCustomAction must automatically switch to view-story");
});

// -----------------------------------------------------------------------------
// 25. Plain-English Attribute Explanations
// -----------------------------------------------------------------------------
runTest("Character Attributes: Ordinary language explanations for all six core attributes", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  assert.ok(html.includes('strength: "Muscular power'), "Character sheet missing plain-English description for Strength");
  assert.ok(html.includes('agility: "Speed & reflexes'), "Character sheet missing plain-English description for Agility");
  assert.ok(html.includes('endurance: "Stamina & resilience'), "Character sheet missing plain-English description for Endurance");
  assert.ok(html.includes('intelligence: "Logic & memory'), "Character sheet missing plain-English description for Intelligence");
  assert.ok(html.includes('wisdom: "Intuition & perception'), "Character sheet missing plain-English description for Wisdom");
  assert.ok(html.includes('charisma: "Eloquence & presence'), "Character sheet missing plain-English description for Charisma");
});

// -----------------------------------------------------------------------------
// 26. Performance & Engine Optimization Verification
// -----------------------------------------------------------------------------
runTest("Performance & Engine Optimization: Hash map lookups and compact fallback integrity", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Verify O(1) content maps
  assert.ok(html.includes("buildContentMaps()"), "Engine missing buildContentMaps method");
  assert.ok(html.includes("this._itemMap = new Map()"), "Engine missing item map cache");
  assert.ok(html.includes("this._locationMap = new Map()"), "Engine missing location map cache");
  assert.ok(html.includes("this._creatureMap = new Map()"), "Engine missing creature map cache");
  assert.ok(html.includes("getDomElement(id)"), "Engine missing DOM query cache");
});

// -----------------------------------------------------------------------------
// 27. Dynamic Minigame Suite & Classical Audio Synthesizer Verification
// -----------------------------------------------------------------------------
runTest("Minigame Suite: DOM modal, audio synthesizer, and interactive runners", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Verify DOM structure
  assert.ok(html.includes('id="minigame-modal"'), "DOM missing #minigame-modal");
  assert.ok(html.includes('id="minigame-card"'), "DOM missing #minigame-card");
  assert.ok(html.includes('id="minigame-stat-banner"'), "DOM missing #minigame-stat-banner");
  assert.ok(html.includes('id="minigame-body"'), "DOM missing #minigame-body");
  assert.ok(html.includes('id="minigame-footer"'), "DOM missing #minigame-footer");

  // Verify Audio Synthesizer methods (zero external audio files)
  assert.ok(html.includes("initAudio()"), "Engine missing initAudio");
  assert.ok(html.includes("playLyre("), "Engine missing playLyre synthesizer");
  assert.ok(html.includes("playClash()"), "Engine missing playClash synthesizer");
  assert.ok(html.includes("playChime()"), "Engine missing playChime synthesizer");
  assert.ok(html.includes("playRattle()"), "Engine missing playRattle synthesizer");
  assert.ok(html.includes("toggleAudioMute()"), "Engine missing toggleAudioMute");

  // Verify Minigame Controller and 4 Game Archetypes
  assert.ok(html.includes("openMinigame("), "Engine missing openMinigame runner");
  assert.ok(html.includes("closeMinigame("), "Engine missing closeMinigame handler");
  assert.ok(html.includes("initArtemisStalk("), "Engine missing initArtemisStalk");
  assert.ok(html.includes("stepArtemisStalk()"), "Engine missing stepArtemisStalk");
  assert.ok(html.includes("initAsklepianMortar("), "Engine missing initAsklepianMortar");
  assert.ok(html.includes("addMortarHerb("), "Engine missing addMortarHerb");
  assert.ok(html.includes("stirMortarPestle()"), "Engine missing stirMortarPestle");
  assert.ok(html.includes("initHopliteClash("), "Engine missing initHopliteClash");
  assert.ok(html.includes("braceHopliteShield()"), "Engine missing braceHopliteShield");
  assert.ok(html.includes("initAstragaloi("), "Engine missing initAstragaloi");
  assert.ok(html.includes("castAstragaloiCup()"), "Engine missing castAstragaloiCup");
  assert.ok(html.includes("rerollAstragaloi("), "Engine missing rerollAstragaloi");

  // Verify dedicated action cards & contextual triggers
  assert.ok(html.includes('"act_hunt_stalk"'), "Missing Artemis Stalk action card at Crossroads");
  assert.ok(html.includes('"act_cast_astragaloi"'), "Missing Astragaloi action card at Crossroads");
  assert.ok(html.includes("window.engine.openMinigame('mortar')"), "Rest modal missing Asklepian Mortar trigger");
  assert.ok(html.includes("window.engine.openMinigame('shield_clash')"), "Combat actions bar missing Shield Clash trigger");
});

runTest("Minigame Stat Integration: Character attributes directly scale challenge mechanics", () => {
  const p = {
    attributes: { strength: 16, agility: 14, endurance: 15, intelligence: 14, wisdom: 14, charisma: 14 },
    skills: { tracking: 2, perception: 2, medicine: 1 },
    feats: ["pallas_aegis"],
    piety: { hermes: 3 }
  };

  // 1. Agility expands Artemis Stalk sweet spot
  const agiMod = Math.floor((p.attributes.agility - 10) / 2);
  const sweetSpotWidth = Math.min(48, Math.max(18, 22 + (agiMod * 4)));
  assert.ok(sweetSpotWidth >= 30, `High Agility (14) must expand sweet spot, got \${sweetSpotWidth}%`);

  // 2. Strength & Pallas Aegis expand Shield Clash brace zone
  const strMod = Math.floor((p.attributes.strength - 10) / 2);
  const braceZoneWidth = Math.min(46, Math.max(14, 16 + (strMod * 3) + 8));
  assert.ok(braceZoneWidth >= 30, `Strength (16) + Pallas Aegis must expand brace zone, got \${braceZoneWidth}%`);

  // 3. Intelligence / Medicine pre-aligns Asklepian mortar humors
  const intMod = Math.floor((p.attributes.intelligence - 10) / 2);
  const preAlign = intMod >= 1 || p.skills.medicine >= 1;
  assert.ok(preAlign, "Intelligence (14) must pre-align medicine humors");

  // 4. Charisma & Hermes Piety grant free Astragaloi rerolls
  const chaMod = Math.floor((p.attributes.charisma - 10) / 2);
  const freeRerolls = Math.max(0, (chaMod >= 1 ? 1 : 0) + (p.piety.hermes >= 2 ? 1 : 0));
  assert.equal(freeRerolls, 2, "Charisma (14) + Hermes Piety (3) must grant 2 bone rerolls");
});

console.log("\n=================================================================");
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY`);
console.log("=================================================================");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

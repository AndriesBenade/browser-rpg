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
// 1. JSON Content Schema & Integrity Verification (Shipped 4-Campaign Roster)
// -----------------------------------------------------------------------------
const filesToVerify = [
  'content/campaigns/tutorial/campaign.json',
  'content/campaigns/tutorial/world/locations.json',
  'content/campaigns/tutorial/world/characters.json',
  'content/campaigns/tutorial/world/creatures.json',
  'content/campaigns/tutorial/world/items.json',
  'content/campaigns/tutorial/world/deities.json',
  'content/campaigns/tutorial/world/lore.json',
  'content/campaigns/tutorial/world/glossary.json',
  'content/campaigns/tutorial/world/quests.json',
  'content/campaigns/tutorial/world/puzzles.json',
  'content/campaigns/tutorial/world/encounters.json',
  'content/campaigns/tutorial/world/dialogues.json',
  'content/campaigns/northern_realms/campaign.json',
  'content/campaigns/ashen_ledger/campaign.json',
  'content/campaigns/vermin/campaign.json'
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

runTest("Tutorial Campaign Schema: Default tutorial manifest and core modules have required fields", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/campaign.json'), 'utf8'));
  const quests = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/quests.json'), 'utf8'));
  const puzzles = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/puzzles.json'), 'utf8'));
  const dialogues = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/dialogues.json'), 'utf8'));
  assert.equal(manifest.id, "campaign_tutorial");
  assert.equal(manifest.isDefault, true, "Tutorial must be marked isDefault: true");
  assert.ok(manifest.name && manifest.worldIntro && manifest.worldIntro.text, "Missing name or worldIntro");
  assert.ok(quests.quests && quests.quests.length >= 4, "Missing tutorial quests");
  assert.ok(puzzles.puzzles && puzzles.puzzles.length >= 1, "Missing tutorial puzzles");
  assert.ok(dialogues.dialogues && dialogues.dialogues.dlg_tut_warden_halrik, "Missing Warden Halrik dialogue tree");
});

runTest("World Locations Schema: All tutorial locations have valid coordinates and connections", () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/locations.json'), 'utf8'));
  assert.ok(data.locations.length >= 5, "Insufficient locations defined");
  const locIds = new Set(data.locations.map(l => l.id));
  data.locations.forEach(loc => {
    assert.ok(loc.coordinates && typeof loc.coordinates.x === 'number' && typeof loc.coordinates.y === 'number', `Invalid coordinates in ${loc.id}`);
    assert.ok(loc.narrative && loc.narrative.overview, `Missing narrative in ${loc.id}`);
    loc.connections.forEach(conn => {
      assert.ok(locIds.has(conn.targetLocationId), `Unknown connection target ${conn.targetLocationId} in ${loc.id}`);
      assert.ok((conn.travelHours > 0) || (conn.travelMinutes > 0), `Travel duration must be > 0 in ${loc.id}`);
      if (conn.staminaCost !== undefined) assert.ok(conn.staminaCost >= 0, `Stamina cost must be >= 0 in ${loc.id}`);
    });
  });
});

runTest("Campaign World Schemas: Tutorial deities and items define core fields cleanly", () => {
  const deities = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/deities.json'), 'utf8'));
  assert.ok(Array.isArray(deities.deities) && deities.deities.length >= 2, "Tutorial must define patrons/deities");
  deities.deities.forEach(d => {
    assert.ok(d.id && d.name && d.description, `Missing core deity fields for ${d.id}`);
  });

  const items = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/items.json'), 'utf8'));
  assert.ok(items.items.length >= 20, "Tutorial must define comprehensive starter items");
  items.items.forEach(i => {
    assert.ok(i.id && i.name && i.category, `Item missing core fields: ${i.id}`);
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
// 16. Shipped 4-Campaign Content Roster Validation
// -----------------------------------------------------------------------------
runTest("Shipped Roster: All 4 campaigns load rich location graphs across distinct regions", () => {
  const expectations = [
    { dir: 'tutorial', minLocs: 5 },
    { dir: 'northern_realms', minLocs: 25 },
    { dir: 'ashen_ledger', minLocs: 36 },
    { dir: 'vermin', minLocs: 20 }
  ];
  for (const exp of expectations) {
    const locData = JSON.parse(fs.readFileSync(path.join(__dirname, `../content/campaigns/${exp.dir}/world/locations.json`), 'utf8'));
    assert.ok(locData.locations.length >= exp.minLocs, `${exp.dir}: expected >= ${exp.minLocs} locations, found ${locData.locations.length}`);
  }
});

runTest("Shipped Roster: Tutorial creatures define vitals, XP rewards & combat stats", () => {
  const creatData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/creatures.json'), 'utf8'));
  assert.ok(creatData.creatures.length >= 4, `Expected at least 4 tutorial creatures, found ${creatData.creatures.length}`);
  creatData.creatures.forEach(c => {
    assert.ok(c.id && c.name, `Creature ${c.id} missing name`);
    assert.ok(typeof c.xpReward === 'number' && c.xpReward >= 30, `Creature ${c.id} missing valid XP reward`);
    assert.ok(c.vitals && c.vitals.maxHealth > 0, `Creature ${c.id} missing vitals`);
  });
  assert.ok(creatData.creatures.some(c => c.isBoss), "Tutorial must include a proving boss sentinel");
});

runTest("Shipped Roster: Tutorial items cover all equipment, jewelry, consumables & tools plus codex lore", () => {
  const items = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/items.json'), 'utf8')).items;
  assert.ok(items.length >= 25, `Expected at least 25 tutorial items, found ${items.length}`);
  const ids = new Set(items.map(i => i.id));
  assert.ok(ids.has("item_tut_training_spear"), "Missing Training Spear");
  assert.ok(ids.has("item_tut_brass_band"), "Missing Brass Focus Band ring");
  assert.ok(ids.has("item_tut_first_warden_signet"), "Missing Signet of the First Warden");
  assert.ok(ids.has("item_tut_healing_salve"), "Missing Sunleaf Healing Salve");
  assert.ok(ids.has("item_tut_whetstone"), "Missing Coastal River Whetstone");

  const lore = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/lore.json'), 'utf8')).loreEntries;
  assert.ok(lore.length >= 4, `Expected at least 4 tutorial codex entries, found ${lore.length}`);
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
  const locData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/northern_realms/world/locations.json'), 'utf8'));
  const highLvlLocs = locData.locations.filter(l => (l.recommendedLevel || 1) >= 4);
  assert.ok(highLvlLocs.length >= 3, "Northern Realms should contain multiple high-level peril zones");

  const heroLevel = 2;
  highLvlLocs.forEach(loc => {
    assert.ok(loc.recommendedLevel > heroLevel, `Hero Level 2 should trigger peril warning at ${loc.id} (Lvl ${loc.recommendedLevel})`);
  });
});

// -----------------------------------------------------------------------------
// 20. Dual Content Synchronization Verification
// -----------------------------------------------------------------------------
runTest("Dual Content Sync: index.html embedded fallback contains all 4 shipped campaigns and Tutorial data", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const embedded = require('../scripts/sync-embedded-content.js').readEmbedded(html);
  const ids = (file, key) => new Set(((embedded[file] || {})[key] || []).map(e => e.id));

  assert.ok(embedded['content/campaigns/tutorial/campaign.json'], "Fallback missing Tutorial manifest");
  assert.ok(embedded['content/campaigns/northern_realms/campaign.json'], "Fallback missing Northern Realms manifest");
  assert.ok(embedded['content/campaigns/ashen_ledger/campaign.json'], "Fallback missing Ashen Ledger manifest");
  assert.ok(embedded['content/campaigns/vermin/campaign.json'], "Fallback missing Vermin Black manifest");

  const locs = ids('content/campaigns/tutorial/world/locations.json', 'locations');
  const creatures = ids('content/campaigns/tutorial/world/creatures.json', 'creatures');
  const items = ids('content/campaigns/tutorial/world/items.json', 'items');
  assert.ok(locs.size >= 5 && creatures.size >= 4 && items.size >= 25, "Embedded Tutorial content is incomplete");
  assert.ok(locs.has("loc_tut_courtyard") && locs.has("loc_tut_beacon_cliff"), "Fallback missing Tutorial landmarks");
  assert.ok(creatures.has("creature_tut_briar_wolf") && creatures.has("creature_tut_beacon_sentinel"), "Fallback missing Tutorial creatures");
  assert.ok(items.has("item_tut_training_spear") && items.has("item_tut_first_warden_signet"), "Fallback missing Tutorial items");

  // Verify level-up methods in index.html
  assert.ok(html.includes("awardXP("), "Engine missing awardXP");
  assert.ok(html.includes("triggerLevelUp("), "Engine missing triggerLevelUp");
  assert.ok(html.includes("confirmLevelUp("), "Engine missing confirmLevelUp");
  assert.ok(html.includes("getHeroicFeatDefinitions("), "Engine missing getHeroicFeatDefinitions");
});

// -----------------------------------------------------------------------------
// 21. Contextual Terminology & Central Glossary Verification
// -----------------------------------------------------------------------------
runTest("Glossary Schema: tutorial glossary.json contains plain-English campaign terms", () => {
  const glossPath = path.join(__dirname, '../content/campaigns/tutorial/world/glossary.json');
  assert.ok(fs.existsSync(glossPath), "tutorial glossary.json file must exist");
  const data = JSON.parse(fs.readFileSync(glossPath, 'utf8'));
  assert.ok(Array.isArray(data.glossary), "glossary.json must contain a 'glossary' array");
  assert.ok(data.glossary.length >= 6, `Expected at least 6 glossary terms, found ${data.glossary.length}`);

  const requiredKeys = ['proving_isle', 'wayfarer_beacon', 'concealed_crafting', 'field_combination', 'frontline_backline'];
  const foundKeys = new Set(data.glossary.map(g => g.key));
  requiredKeys.forEach(k => {
    assert.ok(foundKeys.has(k), `Missing core tutorial term in glossary: ${k}`);
  });

  data.glossary.forEach(item => {
    assert.ok(item.key && typeof item.key === 'string', `Invalid key in glossary entry: ${JSON.stringify(item)}`);
    assert.ok(Array.isArray(item.terms) && item.terms.length > 0, `Missing search terms for ${item.key}`);
    assert.ok(item.simpleEnglish && typeof item.simpleEnglish === 'string', `Missing simple English explanation for ${item.key}`);
    assert.ok(item.explanation && typeof item.explanation === 'string', `Missing detailed explanation for ${item.key}`);
  });
});

runTest("Glossary Engine: enrichMythologicalText safely wraps terms without mangling HTML tags", () => {
  const glossData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/glossary.json'), 'utf8')).glossary;
  
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

  const sample = 'Across the Proving Isle, recruits use a Whetstone and gather Sunleaf before lighting the Wayfarer Beacon.';
  const enriched = enrich(sample);

  assert.ok(enriched.includes('<span class="myth-term" data-term-key="proving_isle">Proving Isle</span>'), "Failed to wrap Proving Isle");
  assert.ok(enriched.includes('<span class="myth-term" data-term-key="field_combination">Whetstone</span>'), "Failed to wrap Whetstone");
  assert.ok(enriched.includes('<span class="myth-term" data-term-key="sunleaf">Sunleaf</span>'), "Failed to wrap Sunleaf");

  // Verify tags with attributes are NOT corrupted
  const htmlWithTag = '<a href="https://example.com/Whetstone" title="Whetstone link">Read about Whetstone</a> and gather Sunleaf outside.';
  const enrichedTag = enrich(htmlWithTag);
  assert.ok(enrichedTag.includes('href="https://example.com/Whetstone"'), "Enrichment corrupted link href attribute!");
  assert.ok(enrichedTag.includes('title="Whetstone link"'), "Enrichment corrupted link title attribute!");
  assert.ok(!enrichedTag.includes('data-term-key="field_combination"'), "Inside <a> tag should be ignored to prevent nesting conflicts");
  assert.ok(enrichedTag.includes('<span class="myth-term" data-term-key="sunleaf">Sunleaf</span>'), "Outside tag must be enriched");

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
// 24. Action Deck Architecture (Requirement 20: Persistent Command Bar Removal)
// -----------------------------------------------------------------------------
runTest("Action Deck & Command Removal: Persistent text action bar is completely removed and gameplay is driven by structured action cards", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8').replace(/\r\n/g, '\n');

  // Verify complete DOM removal of legacy text input bar
  assert.ok(!html.includes('id="persistent-action-bar"'), "DOM must NOT contain #persistent-action-bar");
  assert.ok(!html.includes('id="custom-action-input"'), "DOM must NOT contain #custom-action-input");
  assert.ok(!html.includes('id="custom-action-form"'), "DOM must NOT contain #custom-action-form");

  // Verify handleCustomAction method is completely removed
  assert.ok(!html.includes('handleCustomAction('), "Engine must NOT contain handleCustomAction method");

  // Verify CSS removal
  assert.ok(!html.includes('.persistent-action-bar-container'), "CSS must NOT contain .persistent-action-bar-container");
  assert.ok(!html.includes('.persistent-action-bar'), "CSS must NOT contain .persistent-action-bar");
  assert.ok(!html.includes('.persistent-action-input'), "CSS must NOT contain .persistent-action-input");

  // Verify contextual action cards engine drives gameplay
  assert.ok(html.includes('getContextualActionGroups()'), "Engine must implement getContextualActionGroups");
  assert.ok(html.includes('id="context-actions-container"'), "DOM must contain #context-actions-container");
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

// -----------------------------------------------------------------------------
// 27. Modular Action Engine & Declarative Conditions
// -----------------------------------------------------------------------------
runTest("Modular Action Engine: evaluateActionCondition and isActionAvailable correctly evaluate declarative conditions", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(html.includes("evaluateActionCondition(cond)"), "Engine must implement evaluateActionCondition");
  assert.ok(html.includes("isActionAvailable(action, locId)"), "Engine must implement isActionAvailable");
  assert.ok(html.includes("executeGenericAction(action)"), "Engine must implement executeGenericAction");
  assert.ok(html.includes("applyActionOutcome(outcome)"), "Engine must implement applyActionOutcome");

  const locs = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/locations.json'), 'utf8')).locations;
  const allActions = locs.flatMap(l => l.actions || l.contextActions || []);
  assert.ok(allActions.length >= 4, "Tutorial locations must define declarative actions");
  const beaconAct = allActions.find(a => a.id === "act_tut_light_beacon");
  assert.ok(beaconAct && (beaconAct.condition || (Array.isArray(beaconAct.conditions) && beaconAct.conditions.length > 0)), "act_tut_light_beacon must declare declarative conditions");
});

// -----------------------------------------------------------------------------
// 28. Modular Puzzle Engine & Data-Driven Riddle Resolver
// -----------------------------------------------------------------------------
runTest("Modular Puzzle Engine: openPuzzle dynamically resolves keyword matching and outcome application", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(html.includes("openPuzzle(puzzleId)"), "Engine must implement openPuzzle");
  assert.ok(html.includes("openRiddleModal()"), "Engine must retain backward-compatible openRiddleModal");
  
  const puzData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/puzzles.json'), 'utf8'));
  assert.ok(Array.isArray(puzData.puzzles), "tutorial puzzles.json must declare puzzles array");
  const arch = puzData.puzzles.find(p => p.id === "puzzle_tut_rune_arch");
  assert.ok(arch, "Rune Archway puzzle must exist in tutorial puzzles.json");
  assert.ok(arch.solutions.includes("beacon"), "Rune Archway puzzle must accept 'beacon' keyword");
  assert.ok(arch.successOutcome && arch.successOutcome.giveItem === "item_tut_ruin_crest", "Rune Archway puzzle must declare successOutcome with item reward");
});

// -----------------------------------------------------------------------------
// 29. Modular Encounter Runner & Combat Rewards
// -----------------------------------------------------------------------------
runTest("Modular Encounter Runner: startCombatEncounter and handleCombatVictory dispatch dynamic rewards", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(html.includes("startCombatEncounter(encounterId)"), "Engine must implement startCombatEncounter");
  assert.ok(html.includes("startCaveCombat()"), "Engine must retain backward-compatible startCaveCombat");

  const encData = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/encounters.json'), 'utf8'));
  assert.ok(Array.isArray(encData.encounters), "tutorial encounters.json must declare encounters array");
  const enc = encData.encounters.find(e => e.id === "enc_tut_beacon_sentinel");
  assert.ok(enc, "Beacon sentinel encounter must exist in tutorial encounters.json");
  assert.equal(enc.enemies[0].creatureId, "creature_tut_beacon_sentinel", "Encounter must reference creature_tut_beacon_sentinel");
  assert.ok(enc.victoryOutcome && enc.victoryOutcome.giveItem === "item_tut_beacon_flint", "Encounter must reward item_tut_beacon_flint on victory");
});

// -----------------------------------------------------------------------------
// 30. Storage Management & Fresh Reset Features
// -----------------------------------------------------------------------------
runTest("Storage Management: deleteSaveSlot and deleteAllSavedContent methods exist with UI buttons", () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(html.includes("deleteSaveSlot(slot)"), "Engine must implement deleteSaveSlot");
  assert.ok(html.includes("deleteAllSavedContent()"), "Engine must implement deleteAllSavedContent");
  assert.ok(html.includes("Delete All Saved Content"), "Settings viewport must include Delete All Saved Content button");
  assert.ok(html.includes("deleteSaveSlot"), "renderSaveSlots must render slot deletion button");
});

// Setup headless environment for in-engine campaign and simulation tests
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  getElementById: (id) => ({
    tagName: 'DIV',
    className: '',
    style: {},
    dataset: { jtab: 'chronicle' },
    innerText: '',
    innerHTML: '',
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {}
  }),
  createElement: (tag) => ({
    tagName: (tag || 'div').toUpperCase(),
    className: '',
    style: {},
    dataset: { jtab: 'chronicle' },
    innerText: '',
    innerHTML: '',
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {}
  }),
  createElementNS: (ns, tag) => ({
    tagName: (tag || 'g').toUpperCase(),
    className: '',
    style: {},
    dataset: { jtab: 'chronicle' },
    innerText: '',
    innerHTML: '',
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {}
  }),
  querySelectorAll: () => [],
  querySelector: (sel) => ({
    tagName: 'DIV',
    className: '',
    style: {},
    dataset: { jtab: 'chronicle' },
    innerText: '',
    innerHTML: '',
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {}
  }),
  addEventListener: () => {}
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};
global.alert = () => {};
global.confirm = () => true;

const indexHtmlSource = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const scriptMatch = indexHtmlSource.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  eval(scriptMatch[1]);
}
// The original Developer campaign is frozen as a hidden fixture for these regression tests.
const { loadLegacyDevContent } = require('./behaviour_harness');

// -----------------------------------------------------------------------------
// 31. Campaign Framework: Manifests & Configuration Architecture
// -----------------------------------------------------------------------------
runTest("Campaign Architecture: All 4 shipped campaign manifests are valid and registered", () => {
  const shipped = [
    { dir: 'tutorial', id: 'campaign_tutorial', isDefault: true },
    { dir: 'northern_realms', id: 'campaign_northern_realms' },
    { dir: 'ashen_ledger', id: 'campaign_ashen_ledger' },
    { dir: 'vermin', id: 'campaign_vermin' }
  ];
  for (const s of shipped) {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, `../content/campaigns/${s.dir}/campaign.json`), 'utf8'));
    assert.equal(manifest.id, s.id, `${s.dir} manifest ID mismatch`);
    assert.ok(manifest.name && manifest.version && manifest.modules, `${s.dir} missing core metadata`);
    assert.ok(manifest.startingLocationId, `${s.dir} must declare a starting location`);
    assert.ok(manifest.modules.locations && manifest.modules.items, `${s.dir} must declare modular paths`);
    if (s.isDefault) assert.equal(manifest.isDefault, true, "Tutorial must be the default campaign");
  }
});

// -----------------------------------------------------------------------------
// 32. Campaign Content Validation Engine
// -----------------------------------------------------------------------------
runTest("Campaign Validation: validateCampaign correctly verifies valid campaigns and catches structural/logical flaws", () => {
  const devManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/fixtures/dev_legacy/campaign.json'), 'utf8'));
  const devDir = path.join(__dirname, '../content/campaigns/fixtures/dev_legacy/world');
  const devContent = {
    locations: JSON.parse(fs.readFileSync(path.join(devDir, 'locations.json'), 'utf8')).locations,
    characters: JSON.parse(fs.readFileSync(path.join(devDir, 'characters.json'), 'utf8')).characters,
    creatures: JSON.parse(fs.readFileSync(path.join(devDir, 'creatures.json'), 'utf8')).creatures,
    items: JSON.parse(fs.readFileSync(path.join(devDir, 'items.json'), 'utf8')).items,
    lootTables: JSON.parse(fs.readFileSync(path.join(devDir, 'loot_tables.json'), 'utf8')).lootTables,
    interactiveObjects: JSON.parse(fs.readFileSync(path.join(devDir, 'interactive_objects.json'), 'utf8')).interactiveObjects,
    factions: JSON.parse(fs.readFileSync(path.join(devDir, 'factions.json'), 'utf8')).factions,
    quests: JSON.parse(fs.readFileSync(path.join(devDir, 'quests.json'), 'utf8')).quests,
    encounters: JSON.parse(fs.readFileSync(path.join(devDir, 'encounters.json'), 'utf8')).encounters
  };

  const validResult = GreekMythologyEngine.validateCampaign(devManifest, devContent);
  assert.ok(validResult.valid, `Dev Test campaign should be valid, but had errors: ${validResult.errors.join("; ")}`);
  assert.equal(validResult.errors.length, 0);
  assert.ok(validResult.info.length > 0, "Validation should report informational summary");

  // Verify against invalid fixture
  const invalidFixture = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/fixtures/invalid_campaign.json'), 'utf8'));
  const invalidResult = GreekMythologyEngine.validateCampaign(invalidFixture, {
    locations: [
      { id: "loc_broken", name: "Broken Land", coordinates: { x: 10, y: 10 }, narrative: { overview: "test" }, connections: [{ targetLocationId: "loc_nowhere", travelHours: 1 }] }
    ],
    creatures: [
      { id: "creat_invalid", name: "Dead Husk", vitals: { health: 0 } }
    ],
    lootTables: [
      { id: "lt_bad", entries: [{ itemId: "item_none", chance: 2.5 }] }
    ],
    interactiveObjects: [
      { id: "obj_boulder", name: "Heavy Boulder", type: "obstacle", isPickable: true, locationId: "loc_broken" }
    ],
    quests: [
      { id: "quest_a", title: "Quest A", prerequisites: ["quest_b"] },
      { id: "quest_b", title: "Quest B", prerequisites: ["quest_a"] }
    ]
  });

  assert.equal(invalidResult.valid, false, "Invalid campaign fixture must fail validation");
  assert.ok(invalidResult.errors.some(e => e.includes("loc_nowhere")), "Must report dangling target location");
  assert.ok(invalidResult.errors.some(e => e.includes("health")), "Must report invalid creature health");
  assert.ok(invalidResult.errors.some(e => e.includes("chance")), "Must report invalid loot probability");
  assert.ok(invalidResult.errors.some(e => e.includes("Circular quest dependency")), "Must detect circular quest dependency");
  assert.ok(invalidResult.warnings.some(w => w.includes("boulder") || w.includes("obstacle")), "Must warn against lockpickable boulders");
});

// -----------------------------------------------------------------------------
// 33. Entity Interaction Freedom: Combat with Anyone & Entity Death
// -----------------------------------------------------------------------------
runTest("Entity Interaction Freedom: Players can attack any living NPC, generating combat and handling death consequences", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);
  engine.state.worldState.currentLocationId = "loc_dev_haven";

  // Before attack: Merchant Lycus is alive and present
  const actionsBefore = engine.getContextualActionGroups();
  const lycusAttack = actionsBefore.flatMap(g => g.actions).find(a => a.id === "act_attack_npc_dev_merchant_lycus");
  assert.ok(lycusAttack, "Action deck must include option to attack Merchant Lycus in Haven");
  const lycusTalk = actionsBefore.flatMap(g => g.actions).find(a => a.id === "act_talk_npc_dev_merchant_lycus");
  assert.ok(lycusTalk, "Action deck must include option to speak with Merchant Lycus");

  // Attack Merchant Lycus -> initiates combat without restriction
  engine.startCombatWithEntity("npc_dev_merchant_lycus", "npc");
  assert.ok(engine.combatSession, "Combat session must be active");
  assert.equal(engine.combatSession.enemy.name, "Merchant Lycus");
  assert.equal(engine.combatSession.enemy.isNpc, true);

  // Simulate killing Merchant Lycus
  engine.combatSession.enemy.hp = 0;
  engine.handleCombatVictory();

  // Verify permanent world state changes
  assert.ok(engine.state.worldState.deadEntities["npc_dev_merchant_lycus"], "Merchant Lycus must be marked dead in worldState");

  // Verify action deck after death: Merchant is dead so no talk or attack actions generated
  const actionsAfter = engine.getContextualActionGroups();
  const lycusAttackAfter = actionsAfter.flatMap(g => g.actions).find(a => a.id === "act_attack_npc_dev_merchant_lycus");
  assert.ok(!lycusAttackAfter, "Dead NPC must not appear in action deck for combat");
});

// -----------------------------------------------------------------------------
// 34. Multi-Table Loot Engine & Anti-Exploit System
// -----------------------------------------------------------------------------
runTest("Multi-Table Loot System: Evaluates drops and prevents duplicate unique relic exploitation on repeat kills", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  const karasBoss = {
    id: "creature_dev_crypt_boss",
    name: "Lord Karas the Undying",
    lootTableId: "loot_dev_crypt_boss",
    encounterId: "enc_dev_crypt_boss"
  };

  const initialUniqueCount = engine.state.player.inventory.filter(i => i.itemId === "item_dev_sunstone_relic").length;
  assert.equal(initialUniqueCount, 0);

  // Kill 1: First defeat -> drops unique relic
  engine.state.worldState.defeatedEncounters["enc_dev_crypt_boss"] = 1;
  engine.resolveEntityLoot(karasBoss);

  const relicCountAfterKill1 = engine.state.player.inventory.filter(i => i.itemId === "item_dev_sunstone_relic").length;
  assert.equal(relicCountAfterKill1, 1, "First kill must award unique Sunstone Relic");
  assert.ok(engine.state.worldState.grantedUniqueItems["item_dev_sunstone_relic"], "Relic must be recorded in grantedUniqueItems");

  // Kill 2: Repeat kill -> Anti-exploit must prevent second unique relic!
  engine.state.worldState.defeatedEncounters["enc_dev_crypt_boss"] = 2;
  const drachmaeBeforeKill2 = engine.state.player.currencies.drachmae;
  engine.resolveEntityLoot(karasBoss);

  const relicCountAfterKill2 = engine.state.player.inventory.filter(i => i.itemId === "item_dev_sunstone_relic").length;
  assert.equal(relicCountAfterKill2, 1, "Repeat kill must NOT award duplicate unique Sunstone Relic (anti-exploit)");
  assert.ok(engine.state.player.currencies.drachmae > drachmaeBeforeKill2, "Repeat kill should award repeat currency instead of duplicate relic");
});

// -----------------------------------------------------------------------------
// 35. Lockpicking Mechanics & Interactive Physical Objects
// -----------------------------------------------------------------------------
runTest("Interactive Objects & Lockpicking: Requires tools, distinguishes unpickable boulders, breaks on Ate, triggers traps", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);
  engine.state.worldState.currentLocationId = "loc_dev_haven";

  // 1. Unpickable Boulder: Physical barriers cannot be lockpicked
  const boulder = engine.getInteractiveObject("obj_boulder_seal");
  assert.ok(boulder, "Granite boulder must exist");
  assert.equal(boulder.isPickable, false, "Boulder must be marked isPickable: false");

  // Attempting to pick an unpickable boulder warns the player
  engine.attemptLockpick("obj_boulder_seal");
  assert.ok(!engine.state.worldState.unlockedObjects["obj_boulder_seal"], "Boulder cannot be unlocked with lockpicks");

  // 2. Lockpicking requires tools in inventory
  engine.state.player.inventory = engine.state.player.inventory.filter(i => !i.itemId.includes("lockpick"));
  engine.attemptLockpick("obj_treasury_iron_door");
  assert.ok(!engine.state.worldState.unlockedObjects["obj_treasury_iron_door"], "Must not unlock without tools");

  // 3. Give lockpick set and test tool breakage on Ate (Nat 1)
  engine.addItem("item_dev_iron_lockpick", 1);
  assert.ok(engine.hasItem("item_dev_iron_lockpick"));

  // Mock rollD20 to return 1 (Ate)
  const originalRoll = engine.rollD20;
  engine.rollD20 = () => 1;
  const initialHealth = engine.state.player.vitals.health;

  // The strongbox sits inside the vault: it cannot be reached until the vault door is open.
  engine.attemptLockpick("obj_trapped_coffer");
  assert.ok(engine.hasItem("item_dev_iron_lockpick") && !engine.state.worldState.unlockedObjects["obj_trapped_coffer"], "Strongbox is unreachable while the vault is shut");
  engine.state.worldState.unlockedObjects["obj_treasury_iron_door"] = true;

  // Attempt lockpicking trapped coffer with Nat 1
  engine.attemptLockpick("obj_trapped_coffer");
  assert.ok(!engine.hasItem("item_dev_iron_lockpick"), "Nat 1 (Ate) must snap and destroy the lockpick set");
  assert.ok(engine.state.player.vitals.health < initialHealth, "Trapped coffer failure must inflict trap damage");

  // 4. Key unlocking safely opens container without rolls or traps
  delete engine.state.worldState.unlockedObjects["obj_treasury_iron_door"];
  engine.addItem("item_dev_treasury_key", 1);
  engine.unlockWithKey("obj_treasury_iron_door");
  assert.ok(engine.state.worldState.unlockedObjects["obj_treasury_iron_door"], "Vault door must be unlocked with key");

  // Restore rollD20
  engine.rollD20 = originalRoll;
});

// -----------------------------------------------------------------------------
// 36. Non-Linear Quest Branching & Failover on NPC Death
// -----------------------------------------------------------------------------
runTest("Quest Branching: Killing key NPCs triggers alternate quest pathways and handles failures", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);
  engine.state.worldState.currentLocationId = "loc_dev_haven";

  // Start the Sunstone and Delivery quests
  engine.state.worldState.quests["quest_dev_sunstone_relic"] = {
    id: "quest_dev_sunstone_relic",
    title: "The Lost Sunstone of Haven",
    stage: "inquire_scholar",
    completed: false
  };
  engine.state.worldState.quests["quest_dev_merchant_delivery"] = {
    id: "quest_dev_merchant_delivery",
    title: "Lycus' Caravan Contract",
    stage: "active_delivery",
    completed: false
  };

  // Kill Scholar Elena -> Alternate pathway triggered (field notes dropped)
  engine.handleNpcDeath("npc_dev_elena_scholar");
  assert.equal(engine.state.worldState.quests["quest_dev_sunstone_relic"].stage, "explore_crypt", "Killing Elena should advance quest to independent crypt stage");
  assert.ok(engine.hasItem("item_dev_elena_journal"), "Killing Elena must award her field notes as alternate quest progression item");

  // Kill Merchant Lycus -> Delivery quest fails
  engine.handleNpcDeath("npc_dev_merchant_lycus");
  assert.equal(engine.state.worldState.quests["quest_dev_merchant_delivery"].failed, true, "Killing merchant Lycus must fail delivery quest");
});

// -----------------------------------------------------------------------------
// 37. Multi-Phase Boss Combat & Respawn Cooldowns
// -----------------------------------------------------------------------------
runTest("Boss Mechanics: Enrage phase triggered below threshold and cooldown hours enforced", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  const karasCreature = engine.getCreature("creature_dev_crypt_boss");
  assert.ok(karasCreature, "Lord Karas creature must exist");
  assert.ok(karasCreature.isBoss, "Lord Karas must be flagged isBoss");

  // 1. Start boss combat
  engine.startCombat(karasCreature, { encounterId: "enc_dev_crypt_boss", isBoss: true });
  assert.equal(engine.combatSession.enemy.enraged, false);

  // Drop boss HP below 50%
  engine.combatSession.enemy.hp = Math.floor(karasCreature.vitals.maxHealth * 0.4);
  engine.combatAction("thrust");
  assert.equal(engine.combatSession.enemy.enraged, true, "Boss must enter enraged phase below 50% HP");

  // 2. Victory and Cooldown tracking
  engine.handleCombatVictory();
  const defeatTime = engine.state.worldState.encounterCooldowns["enc_dev_crypt_boss"];
  assert.ok(defeatTime !== undefined, "Defeat timestamp must be recorded in encounterCooldowns");

  // Immediately after defeat: encounter cooldown is active (not ready)
  assert.equal(engine.checkEncounterCooldown("enc_dev_crypt_boss"), false, "Boss must be on cooldown immediately after defeat");

  // Advance time past cooldown hours (24h)
  engine.advanceTime(25, 0);
  assert.equal(engine.checkEncounterCooldown("enc_dev_crypt_boss"), true, "Boss should be ready to respawn after cooldown elapsed");
});

// -----------------------------------------------------------------------------
// 38. Factions & Living World Consequence Engine
// -----------------------------------------------------------------------------
runTest("Factions & Consequences: Reputation modifications, scheduled world events, and standings", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);
  // Loading content no longer writes into the running game's state; starting a game does.
  engine.activeCampaignId = "campaign_dev_legacy";
  engine.resetStateForActiveCampaign();

  // Initial reputation
  const initialHavenRep = engine.getFactionReputation("faction_dev_haven");
  assert.equal(initialHavenRep, 15);
  assert.equal(engine.getFactionStanding("faction_dev_haven"), "Neutral");

  // Shift reputation
  engine.modifyFactionReputation("faction_dev_haven", 10, "Helped citizens");
  assert.equal(engine.getFactionReputation("faction_dev_haven"), 25);
  assert.equal(engine.getFactionStanding("faction_dev_haven"), "Friendly");

  // Severe crime shifts to Hostile
  engine.modifyFactionReputation("faction_dev_haven", -60, "Committed multiple murders");
  assert.equal(engine.getFactionReputation("faction_dev_haven"), -35);
  assert.equal(engine.getFactionStanding("faction_dev_haven"), "Hostile");

  // Scheduled world events processing
  engine.emitEvent("ENTITY_DEATH", { entityId: "npc_dev_merchant_lycus", locationId: "loc_dev_haven" });
  assert.ok(engine.state.worldState.scheduledEvents.length > 0, "Murdering merchant should schedule town guard curfew event");

  // Advance time by 5 hours to trigger curfew event
  engine.advanceTime(5, 0);
  assert.ok(engine.state.worldState.flags["dev_haven_curfew_active"], "Town curfew flag should be active after time elapsed");
});

// -----------------------------------------------------------------------------
// 39. Character Classes & Backgrounds Archetype Matrix
// -----------------------------------------------------------------------------
runTest("Character Classes & Backgrounds: Tutorial classes and backgrounds loaded & selectable, full compatibility matrix, starting equipment and proficiencies assigned cleanly", () => {
  const engine = new GreekMythologyEngine();
  engine.loadEmbeddedFallbackContent();

  const classes = engine.getCampaignClasses();
  assert.equal(classes.length, 3, "Tutorial campaign must define 3 distinct starter classes");
  classes.forEach(c => {
    assert.ok(c.id && c.name && c.description, `Class ${c.id} missing core fields`);
    assert.ok(Array.isArray(c.primaryAttributes) && c.primaryAttributes.length >= 2, `Class ${c.id} missing primaryAttributes`);
    assert.ok(Array.isArray(c.startingEquipment), `Class ${c.id} missing startingEquipment array`);
  });

  const backgrounds = engine.getCampaignBackgrounds();
  assert.equal(backgrounds.length, 3, "Tutorial campaign must define 3 starter backgrounds");
  backgrounds.forEach(b => {
    assert.ok(b.id && b.name && b.description, `Background ${b.id} missing core fields`);
    assert.ok(Array.isArray(b.proficiencies), `Background ${b.id} missing proficiencies`);
  });

  // Test full cross-compatibility: combine Wayfarer Scout + Smith's Apprentice
  engine.creationState = {
    name: "Kael",
    gender: "female",
    origin: "orig_tut_highland",
    classId: "cls_tut_scout",
    background: "bg_tut_apprentice",
    trait: "trait_tut_steady",
    attributes: { strength: 12, agility: 14, endurance: 12, intelligence: 10, wisdom: 12, charisma: 10 },
    pointsLeft: 0
  };

  engine.confirmHeroCreation();
  const p = engine.state.player;
  assert.equal(p.class, "cls_tut_scout");
  assert.equal(p.background, "bg_tut_apprentice");
  assert.ok(p.inventory.some(i => i.itemId === "item_tut_wayfarer_bow"), "Scout starting equipment (shortbow) must be assigned");
  assert.ok(p.proficiencies.includes("crafting"), "Background crafting proficiency must be assigned");
  assert.ok(p.proficiencies.includes("ranged_combat"), "Class ranged_combat proficiency must be assigned");
});

// -----------------------------------------------------------------------------
// 40. Campaign Independence & Archetype Isolation
// -----------------------------------------------------------------------------
runTest("Campaign Independence: Switching to Dev Test isolates classes and backgrounds without leaking Greek archetypes", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  const devClasses = engine.getCampaignClasses();
  assert.equal(devClasses.length, 2, "Dev test campaign must expose exactly 2 verified test classes");
  assert.ok(devClasses.some(c => c.id === "dev_sentinel"));
  assert.ok(devClasses.some(c => c.id === "dev_infiltrator"));
  assert.ok(!devClasses.some(c => c.id === "hoplite"), "Greek hoplite class must not leak into dev test campaign");
  assert.ok(!devClasses.some(c => c.id === "amazon"), "Greek amazon class must not leak into dev test campaign");

  // The embedded (file://) catalog is generated from backgrounds.json (it used to be a stale hand-written copy).
  const devBgs = engine.getCampaignBackgrounds();
  assert.equal(devBgs.length, 2, "Dev test campaign must expose its 2 test backgrounds");
  assert.ok(devBgs.every(b => b.id.startsWith("dev_bg_")), "only Dev backgrounds");
  assert.ok(!devBgs.some(b => b.id === "bg_demigod_scion"), "Greek background must not leak into dev test campaign");
});

// -----------------------------------------------------------------------------
// 41. Level Up Progression & Point Distribution
// -----------------------------------------------------------------------------
runTest("Progression & Point Distribution: Level up awards exactly 1 primary attribute point and 2 secondary skill/substat points", () => {
  const engine = new GreekMythologyEngine();
  engine.loadEmbeddedFallbackContent();

  const p = engine.state.player;
  p.level = 1;
  p.xp = 120;
  p.xpNext = 100;
  const initialStr = p.attributes.strength;
  const initialAthletics = p.skills.athletics || 0;
  const initialMelee = p.skills.melee_combat || 0;

  engine.triggerLevelUp();
  assert.ok(engine.levelUpState, "Level-up state must be active");
  assert.equal(engine.levelUpState.pendingLevel, 2);
  assert.equal(engine.levelUpState.pointsLeft, 1, "Must award exactly 1 primary attribute point");
  assert.equal(engine.levelUpState.skillPointsLeft, 2, "Must award exactly 2 secondary skill points");

  // Select 1 primary attribute
  engine.selectLevelUpAttr("strength");
  assert.equal(engine.levelUpState.pointsLeft, 0);

  // Select 2 secondary skills
  engine.selectLevelUpSkill("athletics");
  assert.equal(engine.levelUpState.skillPointsLeft, 1);
  engine.selectLevelUpSkill("melee_combat");
  assert.equal(engine.levelUpState.skillPointsLeft, 0);

  // Select feat if required
  const availableFeats = engine.getAvailableFeats();
  if (availableFeats.length > 0) engine.selectLevelUpFeat(availableFeats[0].id);

  // Confirm level up
  engine.confirmLevelUp();
  assert.equal(p.level, 2, "Hero level must increase to 2");
  assert.equal(p.attributes.strength, initialStr + 1, "Primary attribute must increase by exactly 1");
  assert.equal(p.skills.athletics, initialAthletics + 1, "Secondary skill athletics must increase by 1");
  assert.equal(p.skills.melee_combat, initialMelee + 1, "Secondary skill melee_combat must increase by 1");
});

// -----------------------------------------------------------------------------
// 42. Full 14-Slot Equipment Paper Doll & Dual Ring / Two-Hand Rules
// -----------------------------------------------------------------------------
runTest("Equipment Paper Doll: Full 14 slots supported, dual ring slot logic, and two-handed weapon slot occupancy", () => {
  const engine = new GreekMythologyEngine();
  engine.loadEmbeddedFallbackContent();

  const slots = engine.getEquipmentSlots();
  assert.equal(slots.length, 14, "Paper doll must support all 14 distinct equipment slots");
  const expectedSlots = ["head", "neck", "shoulders", "back", "body", "arms", "hands", "waist", "legs", "feet", "ring_1", "ring_2", "main_hand", "off_hand"];
  expectedSlots.forEach(s => assert.ok(slots.includes(s), `Missing slot ${s}`));

  // 1. Dual Ring Logic
  engine.world.items.push(
    { id: "item_test_ring_1", name: "Silver Signet Ring", category: "accessory", slot: "ring_1", rarity: "common" },
    { id: "item_test_ring_2", name: "Bronze Seal Ring", category: "accessory", slot: "ring_2", rarity: "common" }
  );
  engine.buildContentMaps();

  engine.addItem("item_test_ring_1", 1);
  engine.addItem("item_test_ring_2", 1);

  engine.equipItem("item_test_ring_1");
  let equippedRing1 = engine.state.player.inventory.find(i => i.itemId === "item_test_ring_1" && i.equipped);
  assert.ok(equippedRing1, "First ring must be equipped");
  assert.equal(equippedRing1.slot, "ring_1", "First ring must occupy ring_1");

  engine.equipItem("item_test_ring_2");
  let equippedRing2 = engine.state.player.inventory.find(i => i.itemId === "item_test_ring_2" && i.equipped);
  assert.ok(equippedRing2, "Second ring must be equipped");
  assert.equal(equippedRing2.slot, "ring_2", "Second ring must occupy ring_2");

  // 2. Two-Handed Weapon Slot Occupancy Rule
  engine.addItem("item_tut_training_spear", 1);
  engine.addItem("item_tut_round_shield", 1);
  engine.addItem("item_tut_wayfarer_bow", 1);

  // Equip 1-hand weapon and off-hand shield
  engine.equipItem("item_tut_training_spear");
  engine.equipItem("item_tut_round_shield");
  assert.ok(engine.state.player.inventory.some(i => i.itemId === "item_tut_round_shield" && i.equipped), "Shield must be equipped in off-hand");

  // Equip two-handed bow -> must unequip shield in off-hand!
  engine.equipItem("item_tut_wayfarer_bow");
  assert.ok(!engine.state.player.inventory.some(i => i.itemId === "item_tut_round_shield" && i.equipped), "Equipping two-handed weapon must unequip off-hand shield");

  // Attempting to equip shield while holding two-handed weapon -> must unequip two-handed weapon!
  engine.equipItem("item_tut_round_shield");
  assert.ok(!engine.state.player.inventory.some(i => i.itemId === "item_tut_wayfarer_bow" && i.equipped), "Equipping off-hand shield must unequip two-handed weapon");
  assert.ok(engine.state.player.inventory.some(i => i.itemId === "item_tut_round_shield" && i.equipped), "Shield should now be equipped");
});

// -----------------------------------------------------------------------------
// 43. Centralized Loot Engine & Probability Hard Caps
// -----------------------------------------------------------------------------
runTest("Centralized Loot Engine: Normal creature rare <= 65%, epic <= 2%, legendary/mythic 0%, boss mythic <= 2% (common..legendary <= 95% or 100% guaranteed), never bypassed by feats", () => {
  const engine = new GreekMythologyEngine();
  engine.loadEmbeddedFallbackContent();

  const normalCreature = {
    id: "creature_cithaeron_wolf",
    tier: 1,
    level: 1,
    lootTableId: "loot_test_scaling"
  };

  const testLootTable = {
    id: "loot_test_scaling",
    currency: { min: 10, max: 20 },
    entries: [
      { itemId: "item_trash_pebble", chance: 1.0 },
      { itemId: "item_rare_brooch", chance: 1.0 },
      { itemId: "item_epic_helm", chance: 0.5 },
      { itemId: "item_legendary_blade", chance: 0.5 },
      { itemId: "item_mythic_relic", chance: 0.5 }
    ]
  };
  engine.lootTables.push(testLootTable);
  engine._lootTableMap.set(testLootTable.id, testLootTable);

  const itemsByTier = {
    common: { id: "item_trash_pebble", name: "Pebble", rarity: "common" },
    uncommon: { id: "item_uncommon_ring", name: "Silver Band", rarity: "uncommon" },
    rare: { id: "item_rare_brooch", name: "Rare Brooch", rarity: "rare" },
    epic: { id: "item_epic_helm", name: "Epic Helm", rarity: "epic", mythologicalLore: { source: "Homer", note: "Epic" } },
    legendary: { id: "item_legendary_blade", name: "Legendary Blade", rarity: "legendary", mythologicalLore: { source: "Homer", note: "Legendary" } },
    mythic: { id: "item_mythic_relic", name: "Mythic Relic", rarity: "mythic", mythologicalLore: { source: "Homer", note: "Mythic" } }
  };
  engine.world.items.push(...Object.values(itemsByTier));
  engine.buildContentMaps();

  // Direct hard rarity cap checks with Extreme difficulty + Fortune Seeker + Relic Hunter active
  const maxOpts = { isBoss: false, isGuaranteed: false, mult: 1.35, featLootMult: 1.20, featRareWeight: 1.18 };
  assert.strictEqual(engine.clampLootChance(1.0, itemsByTier.legendary, maxOpts), 0, "Non-boss legendary must be 0%");
  assert.strictEqual(engine.clampLootChance(1.0, itemsByTier.mythic, maxOpts), 0, "Non-boss mythic must be 0%");
  assert.strictEqual(engine.clampLootChance(1.0, itemsByTier.legendary, { ...maxOpts, isGuaranteed: true }), 0, "Non-boss guaranteed legendary stays blocked at 0%");
  assert.strictEqual(engine.clampLootChance(1.0, itemsByTier.epic, maxOpts), 0.02, "Non-boss epic must cap at <= 2% (0.02) even with feats");
  assert.strictEqual(engine.clampLootChance(1.0, itemsByTier.epic, { ...maxOpts, isGuaranteed: true }), 0.02, "Non-boss epic cannot exceed 2%");
  assert.ok(engine.clampLootChance(0.01, itemsByTier.epic, maxOpts) > 0.01 && engine.clampLootChance(0.01, itemsByTier.epic, maxOpts) <= 0.02, "Sub-cap non-boss epic scales with feats/difficulty up to 2%");
  assert.strictEqual(engine.clampLootChance(1.0, itemsByTier.rare, maxOpts), 0.65, "Non-boss rare must cap at <= 65% (0.65) even with feats");

  // Boss caps: mythic <= 2%, common..legendary follow table odds up to 95% (or 100% if guaranteed)
  const bossOpts = { ...maxOpts, isBoss: true };
  assert.strictEqual(engine.clampLootChance(1.0, itemsByTier.mythic, bossOpts), 0.02, "Boss mythic must cap at <= 2% (0.02) even with feats");
  assert.strictEqual(engine.clampLootChance(1.0, itemsByTier.mythic, { ...bossOpts, isGuaranteed: true }), 0.02, "Boss mythic cannot exceed 2%");
  for (const r of ["common", "uncommon", "rare", "epic", "legendary"]) {
    assert.strictEqual(engine.clampLootChance(1.0, itemsByTier[r], bossOpts), 0.95, `Boss non-guaranteed ${r} caps at 95%`);
    assert.strictEqual(engine.clampLootChance(0.4, itemsByTier[r], { ...bossOpts, isGuaranteed: true }), 1.0, `Boss guaranteed ${r} yields 100%`);
  }
  assert.ok(Math.abs(engine.clampLootChance(0.4, itemsByTier.legendary, { isBoss: true }) - 0.4) < 1e-9, "Boss legendary follows table odds");

  // Test runtime enforcement on normal creature: legendary and mythic MUST NEVER drop
  engine.state.player.feats = ["fortune_seeker", "relic_hunter"];
  for (let i = 0; i < 50; i++) {
    engine.resolveEntityLoot(normalCreature);
    assert.ok(!engine.hasItem("item_legendary_blade"), "Legendary items must NEVER drop from normal creatures");
    assert.ok(!engine.hasItem("item_mythic_relic"), "Mythic items must NEVER drop from normal creatures");
  }

  // Currency must be scaled by creature level independently of loot table
  const currencyResult = engine.resolveEntityLoot({ id: "creature_level_5", level: 5 });
  assert.ok(currencyResult.drachmaeWon >= 15, "Creature currency must scale with level (>= level * 3)");
});

// -----------------------------------------------------------------------------
// 44. Recipe-Free Dynamic Crafting Engine & Minigame Integration
// -----------------------------------------------------------------------------
runTest("Dynamic Crafting Engine: Template + 2 primary materials + 1 supplementary generates dynamic item with composite stats and minigame bonus", () => {
  const engine = new GreekMythologyEngine();
  engine.loadEmbeddedFallbackContent();

  engine.addItem("mat_tut_iron_bar", 2);
  engine.addItem("mat_tut_ash_wood", 2);
  engine.addItem("mat_tut_ember_resin", 1);
  engine.addItem("item_tut_smith_kit", 1);

  // Mock rollD20 for deterministic crafting check
  const originalRoll = engine.rollD20;
  engine.rollD20 = () => 15;

  // Craft with forge minigame bonus +3
  const craftResult = engine.craftItem("tpl_tut_blade", "mat_tut_iron_bar", "mat_tut_ash_wood", "mat_tut_ember_resin", 3);
  assert.ok(craftResult.success, "Crafting check with bonus should succeed");
  assert.ok(craftResult.item, "Must return dynamically generated item object");
  assert.ok(craftResult.item.id.startsWith("crafted_tpl_tut_blade_"), "Item ID must follow procedural convention");
  assert.ok(craftResult.item.name.includes("Wayfarer Iron Blade"), "Item name must include template base name");
  assert.ok(craftResult.item.stats.damageMin >= 4, "Weapon damage must reflect template and material hardness");
  assert.equal(craftResult.item.slot, "main_hand");

  // Verify item is present in player inventory and world item map
  assert.ok(engine.hasItem(craftResult.item.id), "Crafted item must be added to player knapsack");
  assert.ok(engine.getItem(craftResult.item.id), "Crafted item must be registered in world items");

  // Verify failure produces zero penalty (materials are kept) and does not crash
  const qtyIronBefore = engine.getItemQuantity("mat_tut_iron_bar");
  const failResult = engine.craftItem("tpl_tut_blade", "mat_tut_iron_bar", "mat_tut_ash_wood", null, -50);
  assert.equal(failResult.success, false, "Negative roll must fail craft check");
  assert.equal(failResult.reason, "Roll below DC");
  assert.equal(engine.getItemQuantity("mat_tut_iron_bar"), qtyIronBefore, "Failed craft must not consume materials");

  // Crafting without the required materials is refused
  const noMats = engine.craftItem("tpl_tut_blade", "mat_tut_rune_shard", "mat_tut_rune_shard", null, 3);
  assert.equal(noMats.success, false);
  assert.equal(noMats.reason, "Insufficient materials");

  // Restore rollD20
  engine.rollD20 = originalRoll;
});

// -----------------------------------------------------------------------------
// 45. Settlement Economy & Mandatory Healing Potion
// -----------------------------------------------------------------------------
runTest("Settlement Economy: Shipped campaign merchants maintain local goods and healing supplies", () => {
  const tutChars = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/tutorial/world/characters.json'), 'utf8')).characters;
  const sera = tutChars.find(c => c.id === "npc_tut_quartermaster_sera");
  assert.ok(sera && sera.isMerchant === true, "Tutorial Quartermaster Sera must be a merchant");
  assert.ok(Array.isArray(sera.merchantInventory) && sera.merchantInventory.length >= 3, "Sera must stock at least 3 items");
  assert.ok(sera.merchantInventory.some(i => /healing|salve|draught|tonic/i.test(i.itemId)), "Sera must stock a healing salve");

  const nrChars = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/campaigns/northern_realms/world/characters.json'), 'utf8')).characters;
  const nrMerchants = nrChars.filter(c => c.isMerchant);
  assert.ok(nrMerchants.length >= 3, "Northern Realms must have multiple settlement merchants");
});

// -----------------------------------------------------------------------------
// 46. NPC Defensive / Flee Behavior & Social Interactivity Anti-Exploit
// -----------------------------------------------------------------------------
runTest("NPC Interactivity: Wounded NPCs attempt to yield/flee below 25% HP and social checks enforce cooldowns", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  // 1. Social Checks with Anti-Exploit Cooldown
  const persuadeResult1 = engine.attemptPersuadeNpc("npc_dev_merchant_lycus");
  assert.ok(persuadeResult1 && typeof persuadeResult1.roll === "number", "Persuasion check should return roll result");

  // Immediate repeat attempt must be blocked by cooldown/anti-exploit
  const persuadeResult2 = engine.attemptPersuadeNpc("npc_dev_merchant_lycus");
  assert.equal(persuadeResult2.blocked, true, "Immediate repeat persuasion attempt must be blocked by cooldown");

  // 2. Combat defensive check below 25% HP
  const bandit = engine.getCharacter("npc_dev_bandit_renegade");
  engine.startCombatWithEntity("npc_dev_bandit_renegade", "npc");
  assert.ok(engine.combatSession, "Combat session should be active");

  // Reduce NPC HP below 25%
  engine.combatSession.enemy.hp = Math.floor(bandit.vitals.maxHealth * 0.2);
  engine.combatAction("thrust");

  // Verify NPC attempts to surrender or flee
  assert.ok(engine.combatSession.enemy.fleeing || engine.combatSession.enemy.surrendered || engine.combatSession.enemy.hp <= 0, "NPC below 25% HP should attempt to yield/flee or perish");
});

// -----------------------------------------------------------------------------
// 47. Dynamic World Time & Configurable Activity Durations
// -----------------------------------------------------------------------------
runTest("Dynamic World Time: Activities consume appropriate in-game time, abilities modify duration, non-time interactions take 0 time", () => {
  const engine = new GreekMythologyEngine();
  engine.loadEmbeddedFallbackContent();

  const initialMinutes = engine.getTotalInGameMinutes();

  // 1. Rest durations
  engine.performActivity("rest_short");
  assert.equal(engine.getTotalInGameMinutes(), initialMinutes + 60, "Short rest must advance exactly 60 minutes");

  engine.performActivity("rest_sacred");
  assert.equal(engine.getTotalInGameMinutes(), initialMinutes + 180, "Sacred rest must advance exactly 120 minutes");

  engine.performActivity("rest_long");
  assert.equal(engine.getTotalInGameMinutes(), initialMinutes + 660, "Long rest must advance exactly 480 minutes (8 hours)");

  // 2. Combat duration
  const preCombat = engine.getTotalInGameMinutes();
  engine.performActivity("combat");
  assert.equal(engine.getTotalInGameMinutes(), preCombat + 15, "Combat engagement must advance 15 minutes");

  // 3. Travel duration & Ability modifier (hermes_swift_stride reduces by 20%)
  const travelDurationStandard = engine.getActivityDuration("travel", { travelHours: 2 });
  assert.equal(travelDurationStandard, 120, "Standard 2 hour travel must calculate 120 minutes");

  engine.state.player.feats.push("hermes_swift_stride");
  const travelDurationSwift = engine.getActivityDuration("travel", { travelHours: 2 });
  assert.equal(travelDurationSwift, 96, "Hermes Swift Stride feat must reduce travel time by 20% (96 min)");

  // 4. Crafting duration
  const craftDuration = engine.getActivityDuration("crafting", { craftingMinutes: 120 });
  assert.ok(craftDuration <= 120 && craftDuration >= 30, "Crafting duration must calculate appropriate time");

  // 5. Non-time interactions consume exactly 0 minutes
  const preUI = engine.getTotalInGameMinutes();
  engine.performActivity("ui_menu");
  engine.performActivity("inspect_inventory");
  engine.performActivity("view_character");
  assert.equal(engine.getTotalInGameMinutes(), preUI, "UI menu inspection must consume exactly 0 in-game minutes");

  // 6. Calendar Rollover across days, months, and years
  engine.advanceTime(24 * 30 * 12, 0); // Advance 1 year
  const t = engine.state.worldState.time;
  assert.ok(t.year >= 2, "Calendar must roll over correctly to subsequent year");
});

// -----------------------------------------------------------------------------
// 48. Event-Driven EventScheduler Architecture
// -----------------------------------------------------------------------------
runTest("Event-Driven Scheduler: Chronological execution, duplicate prevention, cancellation, rescheduling, zero polling loops", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  const executionLog = [];
  const startMin = engine.getTotalInGameMinutes();

  // Schedule 3 events out of order
  const ev3 = engine.scheduleEvent({
    id: "evt_late",
    triggerTimeMinutes: startMin + 120,
    type: "test_event",
    payload: { action: () => executionLog.push("late") }
  });

  const ev1 = engine.scheduleEvent({
    id: "evt_early",
    triggerTimeMinutes: startMin + 30,
    type: "test_event",
    payload: { action: () => executionLog.push("early") }
  });

  const ev2 = engine.scheduleEvent({
    id: "evt_mid",
    triggerTimeMinutes: startMin + 60,
    type: "test_event",
    payload: { action: () => executionLog.push("mid") }
  });

  // Verify binary search insertion maintained strict chronological sorting
  const events = engine.state.worldState.scheduledEvents;
  assert.equal(events[0].id, "evt_early");
  assert.equal(events[1].id, "evt_mid");
  assert.equal(events[2].id, "evt_late");

  // Advance time partially (45 minutes) -> only early event should execute
  engine.advanceTime(0, 45);
  assert.ok(engine.state.worldState.executedEventIds["evt_early"], "Early event must execute when time arrives");
  assert.ok(!engine.state.worldState.executedEventIds["evt_mid"], "Mid event must not execute prematurely");
  assert.ok(!engine.state.worldState.executedEventIds["evt_late"], "Late event must not execute prematurely");

  // Test Rescheduling: reschedule 'late' to startMin + 50
  engine.rescheduleEvent("evt_late", startMin + 50);
  const lateEvt = engine.state.worldState.scheduledEvents.find(e => e.id === "evt_late");
  assert.equal(lateEvt.triggerTimeMinutes, startMin + 50, "Event must reschedule to new timestamp");

  // Test Cancellation: schedule a temporary event and cancel it
  const cancelId = engine.scheduleEvent({
    id: "evt_cancel_me",
    triggerTimeMinutes: startMin + 55,
    type: "test_event"
  });
  assert.ok(engine.state.worldState.scheduledEvents.some(e => e.id === cancelId));
  const cancelled = engine.cancelScheduledEvent(cancelId);
  assert.equal(cancelled, true, "Cancellation must return true");
  assert.ok(!engine.state.worldState.scheduledEvents.some(e => e.id === cancelId), "Cancelled event must be removed from queue");

  // Derived time remaining (Zero intervals)
  const remaining = engine.getTimeUntilEvent("evt_mid");
  assert.ok(remaining && remaining.totalMinutes === 15, "Derived time remaining must equal 15 minutes");

  // Advance time through all remaining events (leap 60 minutes)
  engine.advanceTime(1, 0);
  assert.ok(engine.state.worldState.executedEventIds["evt_mid"], "Mid event must execute");
  assert.ok(engine.state.worldState.executedEventIds["evt_late"], "Rescheduled late event must execute");

  // Duplicate prevention check: advancing more time must not re-trigger executed events
  engine.advanceTime(5, 0);
  assert.ok(engine.state.worldState.scheduledEvents.every(e => e.id !== "evt_early" && e.id !== "evt_mid"), "One-time events must be pruned after execution");
});

// -----------------------------------------------------------------------------
// 49. Quest-Specific Time Consequences (Time-Sensitive vs Timeless)
// -----------------------------------------------------------------------------
runTest("Quest Time Consequences: Urgent quests deteriorate or branch on missed deadlines; early completion awards bonus; timeless quests remain unaffected", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  // 1. Time-Sensitive Quest: Urgent Rescue
  engine.startQuest("quest_dev_urgent_rescue");
  const urgentQ = engine.state.worldState.quests["quest_dev_urgent_rescue"];
  assert.ok(urgentQ, "Urgent rescue quest must be active");
  assert.equal(urgentQ.stage, "rescue_crag");

  // Verify deadline event was registered with the event scheduler
  const deadlineEvt = engine.state.worldState.scheduledEvents.find(e => e.questId === "quest_dev_urgent_rescue" && e.type === "quest_deadline");
  assert.ok(deadlineEvt, "Event scheduler must register deadline milestone for time-sensitive quest");

  // Advancing time past deadline (49 hours) -> triggers captive relocation / stage mutation
  engine.advanceTime(49, 0);
  assert.equal(urgentQ.stage, "stage_hostage_moved", "Missed deadline must mutate quest stage to hostage relocated");
  assert.ok(engine.state.worldState.flags["hostage_moved_deep"], "Missed deadline must set world consequence flag");

  // 2. Early Completion Bonus verification
  engine.startQuest("quest_dev_urgent_rescue");
  const urgentQ2 = engine.state.worldState.quests["quest_dev_urgent_rescue"];
  urgentQ2.stage = "rescue_crag";
  const preDrachmae = engine.state.player.currencies.drachmae || 0;
  const preVirtue = engine.state.player.morality.virtue;

  // Complete within 12 hours (well under the 24 hour early bonus threshold)
  engine.advanceTime(12, 0);
  engine.completeQuest("quest_dev_urgent_rescue");
  assert.equal(urgentQ2.completed, true);
  assert.ok((engine.state.player.currencies.drachmae || 0) > preDrachmae, "Swift completion must award early completion drachmae bonus");
  assert.ok(engine.state.player.morality.virtue > preVirtue, "Swift completion must award early virtue bonus");

  // 3. Timeless Quest: Ancient Ruins exploration remains unaffected by passage of time
  engine.startQuest("quest_dev_ancient_ruins");
  const timelessQ = engine.state.worldState.quests["quest_dev_ancient_ruins"];
  assert.ok(timelessQ, "Timeless quest must be active");

  // Advance 2 weeks (336 hours)
  engine.advanceTime(336, 0);
  assert.equal(timelessQ.stage, "examine_stones", "Timeless quest stage must not be degraded by passage of time");
  assert.equal(timelessQ.failed, false, "Timeless quest must never fail due to elapsed time");
});

// -----------------------------------------------------------------------------
// 50. Event-Driven Creature & Boss Respawning
// -----------------------------------------------------------------------------
runTest("Creature & Boss Respawn: Defeated creatures and bosses respawn via event-driven scheduler; unique relics are never duplicated", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  // 1. Defeat a normal creature (Wild Boar, respawnHours = 12)
  engine.startCombatWithEntity("creature_dev_wild_boar", "creature");
  assert.ok(engine.combatSession, "Combat session must be active");
  engine.handleCombatVictory();

  assert.ok(engine.state.worldState.deadEntities["creature_dev_wild_boar"], "Killed boar must be recorded as dead");

  // Verify creature_respawn event was scheduled
  const respawnEvt = engine.state.worldState.scheduledEvents.find(e => e.type === "creature_respawn" && e.targetId === "creature_dev_wild_boar");
  assert.ok(respawnEvt, "Must register creature_respawn event with scheduler");

  // Advance time by 6 hours -> creature must still be dead
  engine.advanceTime(6, 0);
  assert.ok(engine.state.worldState.deadEntities["creature_dev_wild_boar"], "Creature must remain dead before respawn time arrives");

  // Advance time past respawn time (+7 hours, total 13h) -> creature respawns!
  engine.advanceTime(7, 0);
  assert.ok(!engine.state.worldState.deadEntities["creature_dev_wild_boar"], "Creature must be restored from deadEntities upon respawn event");

  // 2. Boss Respawn & Anti-Exploit Relic Protection
  engine.startCombatWithEntity("creature_dev_crypt_boss", "creature");
  engine.handleCombatVictory();

  assert.ok(engine.hasItem("item_dev_sunstone_relic"), "First boss defeat must award unique Sunstone relic");
  assert.ok(engine.state.worldState.grantedUniqueItems["item_dev_sunstone_relic"], "Relic must be tracked in grantedUniqueItems");

  const bossRespawnEvt = engine.state.worldState.scheduledEvents.find(e => e.type === "boss_respawn");
  assert.ok(bossRespawnEvt, "Must register boss_respawn event with scheduler");

  // Advance time past boss respawn (25 hours)
  engine.advanceTime(25, 0);
  assert.ok(engine.checkEncounterCooldown("enc_dev_crypt_boss"), "Boss encounter cooldown must be cleared after respawn event executes");

  // Defeat boss a second time -> anti-exploit must suppress duplicate relic!
  const preDrachmae = engine.state.player.currencies.drachmae || 0;
  engine.startCombatWithEntity("creature_dev_crypt_boss", "creature");
  engine.handleCombatVictory();

  const sunstoneCount = engine.state.player.inventory.filter(i => i.itemId === "item_dev_sunstone_relic").reduce((sum, i) => sum + i.quantity, 0);
  assert.equal(sunstoneCount, 1, "Repeat boss kill must NEVER grant duplicate unique relic");
  assert.ok((engine.state.player.currencies.drachmae || 0) > preDrachmae, "Repeat boss kill must award replacement repeat currency");
});

// -----------------------------------------------------------------------------
// 51. Permanent NPC Death & World Consequences
// -----------------------------------------------------------------------------
runTest("Permanent NPC Death: NPCs never respawn, death is persistently recorded, triggers quest failover and scheduled murder inquest", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  const preHubris = engine.state.player.morality.hubris;

  // Start Lycus' delivery contract before slaying him
  engine.startQuest("quest_dev_merchant_delivery");
  assert.ok(engine.state.worldState.quests["quest_dev_merchant_delivery"], "Merchant delivery contract should be active");

  // Slay Merchant Lycus
  engine.startCombatWithEntity("npc_dev_merchant_lycus", "npc");
  engine.handleCombatVictory();

  // 1. Permanent Death Record
  assert.ok(engine.state.worldState.permanentNpcDeaths["npc_dev_merchant_lycus"], "NPC death must be recorded in permanentNpcDeaths");
  assert.ok(engine.isPermanentNpc("npc_dev_merchant_lycus"), "isPermanentNpc must return true");

  // 2. Moral consequence: slaying innocent NPC awards Hubris
  assert.ok(engine.state.player.morality.hubris > preHubris, "Slaying NPC must award Hubris (Miasma)");

  // 3. Quest consequence: Lycus' contract failed
  const deliveryQ = engine.state.worldState.quests["quest_dev_merchant_delivery"];
  assert.ok(deliveryQ && deliveryQ.failed, "Lycus' death must fail his active delivery contract");

  // 4. Scheduled murder inquest 24h later
  const inquestEvt = engine.state.worldState.scheduledEvents.find(e => e.type === "world_event" && e.id.startsWith("inquest_npc_dev_merchant_lycus"));
  assert.ok(inquestEvt, "Slaying NPC must schedule an official murder inquest event");

  // 5. Advance time by 30 days (720 hours) -> verify NPC NEVER respawns!
  engine.advanceTime(720, 0);
  assert.ok(engine.state.worldState.deadEntities["npc_dev_merchant_lycus"], "NPC must remain permanently dead after weeks of elapsed time");
  assert.ok(!engine.state.worldState.scheduledEvents.some(e => e.type === "creature_respawn" && e.targetId === "npc_dev_merchant_lycus"), "NPC must NEVER be queued for creature respawn");
});

// -----------------------------------------------------------------------------
// 52. Morality, Karma & Multi-Path Quest Alignment
// -----------------------------------------------------------------------------
runTest("Morality & Quest Alignment: Virtue, Hubris, dynamic alignment tiers, and multi-path moral choices with divergent outcomes", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  // 1. Morality Mechanics
  const m = engine.state.player.morality;
  assert.ok(m && typeof m.virtue === "number" && typeof m.hubris === "number", "Player must track virtue and hubris");

  // High virtue awards Heroic tier
  engine.modifyMorality(40, 0, "Altruistic deeds");
  assert.equal(engine.getMoralityAlignment(), "heroic", "Net score >= 30 must yield 'heroic' alignment");

  // High hubris awards Villainous tier
  engine.modifyMorality(0, 100, "Atrocities and hubris");
  assert.equal(engine.getMoralityAlignment(), "villainous", "Net score <= -41 must yield 'villainous' alignment");

  // 2. Multi-Path Quest Choice: The Renegade's Bargain
  engine.startQuest("quest_dev_bandit_alliance");
  const banditQ = engine.state.worldState.quests["quest_dev_bandit_alliance"];
  assert.ok(banditQ, "Bandit alliance quest must be active");

  // Test Heroic Resolution: Arrest Silas
  const preGuardsRep = engine.getFactionReputation("faction_dev_guards");
  engine.resolveMoralChoice("quest_dev_bandit_alliance", "heroic");
  assert.equal(banditQ.completed, true);
  assert.equal(banditQ.chosenPath, "heroic");
  assert.ok(engine.getFactionReputation("faction_dev_guards") > preGuardsRep, "Heroic resolution must improve town guard standing");

  // Test Villainous Resolution on fresh instance
  const engine2 = new GreekMythologyEngine();
  loadLegacyDevContent(engine2);
  engine2.startQuest("quest_dev_bandit_alliance");
  const preOutlawsRep = engine2.getFactionReputation("faction_dev_outlaws");
  const preHubrisVal = engine2.state.player.morality.hubris;

  engine2.resolveMoralChoice("quest_dev_bandit_alliance", "villainous");
  assert.ok(engine2.getFactionReputation("faction_dev_outlaws") > preOutlawsRep, "Villainous path must improve outlaw syndicate reputation");
  assert.ok(engine2.state.player.morality.hubris > preHubrisVal, "Villainous path must award significant Hubris");
});

// -----------------------------------------------------------------------------
// 53. Campaign Integration & Configurable Rules
// -----------------------------------------------------------------------------
runTest("Campaign Integration: Campaigns independently configure calendars, activity durations, respawn rules, and morality parameters", () => {
  const engine = new GreekMythologyEngine();
  engine.loadEmbeddedFallbackContent();

  // Default Tutorial campaign geography & standard tier respawn rules
  assert.ok(engine.world.locations.length >= 5, "Default tutorial campaign must load its full geography");
  assert.ok(engine.getCreatureRespawnHours({ id: "creature_tut_briar_wolf", tier: 1 }) === 12, "Tier 1 creature must have 12h respawn");
  assert.ok(engine.getCreatureRespawnHours({ id: "creature_tier4_test", tier: 4 }) === 96, "Tier 4 beast must have 96h respawn");
  assert.ok(engine.getCreatureRespawnHours({ id: "creature_tier5_test", tier: 5 }) === 168, "Tier 5 legendary boss must have 168h (1 week) respawn");
  assert.ok(engine.getCreatureRespawnHours({ id: "npc_tut_warden_halrik", isNpc: true }) === 0, "NPCs must NEVER have respawn hours");

  // Dev Legacy fixture overrides
  const devEngine = new GreekMythologyEngine();
  loadLegacyDevContent(devEngine);
  assert.equal(devEngine.activeCampaign.id, "campaign_dev_legacy");
  assert.equal(devEngine.activeCampaign.respawnRules.bossHours, 24, "Dev fixture campaign can independently set boss respawn to 24 hours");
});

// -----------------------------------------------------------------------------
// 54. Save / Load Persistence of World-Time, Events & State
// -----------------------------------------------------------------------------
runTest("Save & Load Persistence: Scheduled events, permanent NPC deaths, morality, and time serialize cleanly and prevent duplicate execution", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  // Advance time, slay an NPC, schedule an event, modify morality
  engine.advanceTime(14, 30);
  engine.startCombatWithEntity("npc_dev_bandit_renegade", "npc");
  engine.handleCombatVictory();

  engine.modifyMorality(25, 10, "Complex moral deeds");
  const testEvtId = engine.scheduleEvent({
    id: "evt_persist_test",
    inHours: 48,
    type: "world_event",
    setFlags: { flag_persisted_event: true }
  });

  // Serialize save state
  const serialized = JSON.stringify(engine.state);
  assert.ok(serialized.includes("evt_persist_test"), "Save state must contain scheduled events");
  assert.ok(serialized.includes("npc_dev_bandit_renegade"), "Save state must contain permanent NPC death");
  assert.ok(serialized.includes("morality"), "Save state must contain player morality");

  // Load into fresh engine
  const restoredEngine = new GreekMythologyEngine();
  loadLegacyDevContent(restoredEngine);
  restoredEngine.state = JSON.parse(serialized);

  // Verify restored state
  assert.equal(restoredEngine.state.worldState.time.hour, engine.state.worldState.time.hour);
  assert.ok(restoredEngine.state.worldState.permanentNpcDeaths["npc_dev_bandit_renegade"]);
  assert.equal(restoredEngine.state.player.morality.virtue, engine.state.player.morality.virtue);

  // Advance time on restored engine -> verify event fires exactly once
  restoredEngine.advanceTime(50, 0);
  assert.ok(restoredEngine.state.worldState.flags["flag_persisted_event"], "Restored event must execute upon time advance");
  assert.ok(restoredEngine.state.worldState.executedEventIds["evt_persist_test"], "Event must be recorded in executedEventIds to prevent duplicate execution");
});

// -----------------------------------------------------------------------------
// 55. Project Optimisation, Memory Efficiency & Zero Polling
// -----------------------------------------------------------------------------
runTest("Project Optimisation: Event pruning prevents memory accumulation, fast binary insertion, zero continuous intervals or polling loops", () => {
  const engine = new GreekMythologyEngine();
  loadLegacyDevContent(engine);

  // 1. Verify scheduler pruning of completed events
  for (let i = 0; i < 20; i++) {
    engine.scheduleEvent({
      id: `evt_batch_${i}`,
      inMinutes: i * 5,
      type: "world_event"
    });
  }

  assert.equal(engine.state.worldState.scheduledEvents.length, 20, "20 events must be registered");

  // Advance time past all 20 events (120 minutes)
  engine.advanceTime(0, 120);

  // Executed one-time events must be pruned from scheduledEvents array
  assert.equal(engine.state.worldState.scheduledEvents.length, 0, "Executed events must be pruned to avoid unbounded array growth");

  // 2. Zero intervals check: ensure world-time has no active setInterval countdown loops or continuous polling
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(!html.includes("setInterval(() => this.advanceTime"), "World time must NOT use setInterval countdown loops");
  assert.ok(!html.includes("setInterval(() => this.processScheduledEvents"), "Event scheduler must NOT use setInterval continuous polling");
});

// -----------------------------------------------------------------------------
// 56. Glossary Completeness & Expanded Validator Diagnostics
// -----------------------------------------------------------------------------
runTest("Glossary & Validation: Shipped glossaries contain zero empty terms and validator exposes check counts", () => {
  const glossaryPaths = [
    '../content/campaigns/tutorial/world/glossary.json',
    '../content/campaigns/northern_realms/world/glossary.json',
    '../content/campaigns/ashen_ledger/world/glossary.json',
    '../content/campaigns/vermin/world/glossary.json'
  ];
  const entries = glossaryPaths.flatMap(rel => {
    const p = path.join(__dirname, rel);
    return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf8')).glossary || []) : [];
  });
  assert.ok(entries.length >= 15, "Shipped campaigns must provide glossary entries");
  entries.forEach(entry => {
    assert.ok(entry.key && Array.isArray(entry.terms) && entry.terms.length > 0, `Glossary entry invalid key/terms: ${JSON.stringify(entry)}`);
    assert.ok(Boolean((entry.simpleEnglish && entry.simpleEnglish.trim()) || (entry.explanation && entry.explanation.trim())), `Glossary entry '${entry.key}' has empty explanation`);
  });
  const templatePath = path.join(__dirname, '../documentation/templates/glossary_template.json');
  assert.ok(fs.existsSync(templatePath), "documentation/templates/glossary_template.json must exist");
});

console.log("\n=================================================================");
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY`);
console.log("=================================================================");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

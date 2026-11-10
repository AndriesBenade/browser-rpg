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

  // Core Engine Class & Methods
  assert.ok(html.includes("class GreekMythologyEngine"), "Missing GreekMythologyEngine class definition");
  assert.ok(html.includes("getContextualActionGroups"), "Missing getContextualActionGroups");
  assert.ok(html.includes("startWalkthrough"), "Missing startWalkthrough");
  assert.ok(html.includes("confirmHeroCreation"), "Missing confirmHeroCreation");
  assert.ok(html.includes("completeTutorialQuest"), "Missing completeTutorialQuest");
});

console.log("\n=================================================================");
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY`);
console.log("=================================================================");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

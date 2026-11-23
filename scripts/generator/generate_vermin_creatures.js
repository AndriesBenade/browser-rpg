const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const WORLD_DIR = path.join(ROOT, 'content/campaigns/vermin/world');

function writeJson(filePath, data) {
  const jsonStr = JSON.stringify(data, null, 2);
  if (jsonStr.includes('\u2014')) {
    throw new Error(`CRITICAL: Forbidden em dash detected in output for ${filePath}`);
  }
  fs.writeFileSync(filePath, jsonStr, 'utf8');
  console.log(`Wrote ${filePath} (${jsonStr.length} bytes)`);
}

// ==========================================
// 1. LOOT TABLES
// ==========================================
const lootTables = {
  lootTables: [
    {
      id: "loot_vb_rag_drop",
      name: "The Rag Drops",
      currency: { min: 2, max: 6 },
      entries: [
        { itemId: "mat_vb_entity_cloth", chance: 1.0, guaranteed: true, minQuantity: 1, maxQuantity: 2 },
        { itemId: "mat_vb_ash_dust", chance: 0.6, minQuantity: 1, maxQuantity: 2 },
        { itemId: "mat_vb_void_ash", chance: 0.4, minQuantity: 1, maxQuantity: 1 }
      ]
    },
    {
      id: "loot_vb_sprinter_drop",
      name: "The Sprinter Drops",
      currency: { min: 1, max: 4 },
      entries: [
        { itemId: "mat_vb_glass_shard", chance: 0.8, guaranteed: true, minQuantity: 1, maxQuantity: 2 },
        { itemId: "mat_vb_ash_dust", chance: 0.5, minQuantity: 1, maxQuantity: 1 }
      ]
    },
    {
      id: "loot_vb_entity_generic",
      name: "Generic Entity Drops",
      currency: { min: 1, max: 5 },
      entries: [
        { itemId: "mat_vb_ash_dust", chance: 0.7, minQuantity: 1, maxQuantity: 2 },
        { itemId: "mat_vb_void_ash", chance: 0.4, minQuantity: 1, maxQuantity: 1 },
        { itemId: "mat_vb_glass_shard", chance: 0.3, minQuantity: 1, maxQuantity: 1 }
      ]
    },
    {
      id: "loot_vb_kitchen_search",
      name: "Kitchen Cupboard Search",
      currency: { min: 4, max: 10 },
      entries: [
        { itemId: "item_vb_iron_key_c", chance: 1.0, guaranteed: true, isUnique: true, minQuantity: 1, maxQuantity: 1 },
        { itemId: "item_vb_glass_vial", chance: 0.8, minQuantity: 1, maxQuantity: 2 },
        { itemId: "item_vb_bandage_cloth", chance: 0.6, minQuantity: 1, maxQuantity: 2 }
      ]
    },
    {
      id: "loot_vb_filing_search",
      name: "Filing Cabinet Search",
      currency: { min: 5, max: 12 },
      entries: [
        { itemId: "item_vb_journal_clinic", chance: 1.0, guaranteed: true, isUnique: true, minQuantity: 1, maxQuantity: 1 },
        { itemId: "item_vb_admissions_form", chance: 1.0, guaranteed: true, isUnique: true, minQuantity: 1, maxQuantity: 1 },
        { itemId: "mat_vb_ash_dust", chance: 0.5, minQuantity: 1, maxQuantity: 1 }
      ]
    },
    {
      id: "loot_vb_gut_search",
      name: "Anatomical Residue Search",
      currency: { min: 6, max: 15 },
      entries: [
        { itemId: "item_vb_iron_key_b", chance: 1.0, guaranteed: true, isUnique: true, minQuantity: 1, maxQuantity: 1 },
        { itemId: "mat_vb_blood_iron", chance: 0.7, minQuantity: 1, maxQuantity: 1 },
        { itemId: "mat_vb_void_ash", chance: 0.5, minQuantity: 1, maxQuantity: 2 }
      ]
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'loot_tables.json'), lootTables);

// ==========================================
// 2. CREATURES
// ==========================================
const creatures = {
  creatures: [
    {
      id: "creature_vb_the_rag",
      name: "The Rag",
      tier: 2,
      level: 2,
      xpReward: 80,
      vitals: { health: 35, maxHealth: 35, morale: 8 },
      armorClass: 11,
      immune: ["frightened"],
      fearless: true,
      alertness: 12,
      description: "Coarse stained cloth suspended in mid-air at human height with nobody standing beneath it. It exudes a toxic emission that causes blurred vision and a sinking feeling underfoot.",
      actions: [
        {
          name: "Toxic Emanation",
          style: "heavy",
          attackBonus: 3,
          damage: "1d4+1",
          damageType: "psychic",
          telegraph: "The air thickens into a sickly miasma as the suspended cloth drifts forward.",
          inflicts: { status: "poisoned", chance: 0.6, rounds: 3, value: 2 }
        },
        {
          name: "Enveloping Shroud",
          style: "normal",
          attackBonus: 2,
          damage: "1d6",
          damageType: "bludgeoning",
          inflicts: { status: "entangled", chance: 0.4, rounds: 2, value: 1 }
        }
      ],
      loot: [
        { itemId: "mat_vb_entity_cloth", chance: 1.0 },
        { itemId: "mat_vb_ash_dust", chance: 0.5 }
      ]
    },
    {
      id: "creature_vb_sprinter",
      name: "The Sprinter",
      tier: 1,
      level: 1,
      xpReward: 50,
      vitals: { health: 20, maxHealth: 20, morale: 4 },
      armorClass: 14,
      alertness: 14,
      description: "A dark humanoid silhouette that sprints from behind doorways at breakneck speed, colliding violently before vanishing into unlit corners.",
      actions: [
        {
          name: "Sudden Lunge",
          style: "quick",
          attackBonus: 5,
          damage: "1d8+2",
          damageType: "slashing",
          telegraph: "A blurred shadow bursts around the doorframe."
        },
        {
          name: "Disorienting Dash",
          style: "quick",
          attackBonus: 3,
          damage: "1d4",
          damageType: "bludgeoning",
          inflicts: { status: "frightened", chance: 0.5, rounds: 2, value: 1 }
        }
      ],
      loot: [
        { itemId: "mat_vb_glass_shard", chance: 0.8 },
        { itemId: "mat_vb_ash_dust", chance: 0.4 }
      ]
    },
    {
      id: "creature_vb_ember_cloud",
      name: "The Ember Cloud",
      tier: 1,
      level: 1,
      xpReward: 40,
      vitals: { health: 25, maxHealth: 25, morale: 10 },
      armorClass: 10,
      immune: ["entangled", "poisoned"],
      alertness: 10,
      description: "A dense cloud of swirling dust and fire embers hovering in the hallway, accompanied by an eerie tune that refuses to lose tempo.",
      actions: [
        {
          name: "Ash Burst",
          style: "normal",
          attackBonus: 2,
          damage: "1d6",
          damageType: "fire",
          inflicts: { status: "confused", chance: 0.35, rounds: 2, value: 1 }
        },
        {
          name: "Eerie Resonance",
          style: "heavy",
          attackBonus: 3,
          damage: "1d4+2",
          damageType: "psychic",
          telegraph: "A shrill metallic chime builds to an unbearable pitch.",
          inflicts: { status: "frightened", chance: 0.4, rounds: 2, value: 1 }
        }
      ],
      loot: [
        { itemId: "mat_vb_ash_dust", chance: 0.8 },
        { itemId: "mat_vb_void_ash", chance: 0.4 }
      ]
    },
    {
      id: "creature_vb_the_drip",
      name: "The Drip",
      tier: 2,
      level: 2,
      xpReward: 70,
      vitals: { health: 30, maxHealth: 30, morale: 12 },
      armorClass: 9,
      alertness: 8,
      description: "Coagulated organic matter hanging from plaster ceiling cracks, pulsing and dripping dark fluids in synchronized, unnatural rhythm.",
      actions: [
        {
          name: "Visceral Cascade",
          style: "heavy",
          attackBonus: 2,
          damage: "2d6",
          damageType: "bludgeoning",
          telegraph: "Ceiling plaster buckles as heavy crimson fluid gathers overhead."
        },
        {
          name: "Contaminating Splatter",
          style: "normal",
          attackBonus: 3,
          damage: "1d4+1",
          damageType: "psychic",
          inflicts: { status: "poisoned", chance: 0.5, rounds: 4, value: 2 }
        }
      ],
      loot: [
        { itemId: "mat_vb_blood_iron", chance: 0.6 },
        { itemId: "mat_vb_void_ash", chance: 0.5 }
      ]
    },
    {
      id: "creature_vb_verdict_form",
      name: "The Final Verdict",
      isBoss: true,
      tier: 5,
      level: 5,
      xpReward: 350,
      vitals: { health: 120, maxHealth: 120, morale: 20 },
      armorClass: 15,
      fearless: true,
      immune: ["frightened", "confused", "entangled"],
      alertness: 16,
      description: "An amalgamation of all Vermin Black's atrocities made manifest: razor blades, cold bathtubs, whined complaints, weeping infants, and stitched intestines assembled into a towering, relentless judgment.",
      actions: [
        {
          name: "Weight of What Was Done",
          style: "heavy",
          attackBonus: 6,
          damage: "2d8+3",
          damageType: "psychic",
          telegraph: "Voices of forgotten victims rise in a deafening, unified accusation.",
          inflicts: { status: "frightened", chance: 0.7, rounds: 3, value: 2 }
        },
        {
          name: "The Final Tally",
          style: "normal",
          attackBonus: 5,
          damage: "2d6+2",
          damageType: "psychic"
        },
        {
          name: "Surgical Recompense",
          style: "quick",
          attackBonus: 6,
          damage: "1d10+2",
          damageType: "slashing",
          inflicts: { status: "bleeding", chance: 0.5, rounds: 3, value: 3 }
        }
      ],
      loot: [
        { itemId: "item_vb_the_verdict_key", chance: 1.0, guaranteed: true, isUnique: true }
      ]
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'creatures.json'), creatures);

// ==========================================
// 3. ENCOUNTERS
// ==========================================
const encounters = {
  encounters: [
    {
      id: "enc_vb_rag_first",
      locationId: "loc_vb_rag_corridor",
      creatureId: "creature_vb_the_rag",
      triggerCondition: { flag: "medicine_taken", expected: false },
      initiative: "enemy",
      unavoidable: false,
      introProse: "You turn to inspect the corridor behind you and freeze. A coarse rag hangs in mid-air as if an invisible figure stands beneath it. A toxic vapor rolls off its folds, turning your vision blurry as your sandals feel as though they are sinking into the floorboards.",
      approachProse: "The levitating fabric hovers motionless at human eye level, waiting.",
      victoryOutcome: {
        text: "You strike aside the floating shroud! The fabric falls limp onto the floorboards, revealing absolutely nothing underneath. Your footing solidifies and your vision clears.",
        setFlags: { rag_first_defeated: true },
        awardXP: 80,
        giveItem: "mat_vb_entity_cloth",
        addJournalChronicle: {
          title: "The Rag in the Hall",
          text: "Defeated the paranormal hanging cloth in the corridor. It possessed no physical body beneath the weave."
        }
      }
    },
    {
      id: "enc_vb_rag_kitchen",
      locationId: "loc_vb_kitchen",
      creatureId: "creature_vb_the_rag",
      triggerCondition: { flag: "kitchen_rag_active", expected: true },
      initiative: "enemy",
      unavoidable: false,
      introProse: "As the kitchen lights flicker and pop, a familiar coarse rag materializes by the counter, drifting toward you with suffocating malice.",
      victoryOutcome: {
        text: "The cloth collapses upon the kitchen tile, motionless. The oppressive hum in your ears subsides.",
        setFlags: { rag_kitchen_defeated: true, kitchen_rag_active: false },
        awardXP: 80,
        giveItem: "mat_vb_entity_cloth"
      }
    },
    {
      id: "enc_vb_sprinter_room",
      locationId: "loc_vb_kitchen",
      creatureId: "creature_vb_sprinter",
      triggerCondition: { flag: "sprinter_kitchen_encountered", expected: false },
      initiative: "enemy",
      unavoidable: false,
      introProse: "You step past the counter when suddenly a dark human-like silhouette sprints from behind the pantry door, charging straight at you before vanishing into shadow!",
      victoryOutcome: {
        text: "You sidestep and slash through the charging silhouette! It disperses with the sound of snapping bone, leaving only sharp glass shards behind.",
        setFlags: { sprinter_kitchen_encountered: true, sprinter_kitchen_defeated: true },
        awardXP: 50,
        giveItem: "mat_vb_glass_shard"
      }
    },
    {
      id: "enc_vb_ember_hallway",
      locationId: "loc_vb_first_hallway",
      creatureId: "creature_vb_ember_cloud",
      triggerCondition: { flag: "ember_defeated", expected: false },
      initiative: "enemy",
      unavoidable: false,
      introProse: "At the far end of the carpeted hallway, a cloud of grey dust erupts with sparkling fire embers, accompanied by an eerie tune that echoes down the corridor.",
      victoryOutcome: {
        text: "The swirling ember cloud dissipates into the carpet. In the sudden dead silence, a polished wind-up music box sits upon the floorboards where the cloud stood.",
        setFlags: { ember_defeated: true, hallway_explored: true },
        awardXP: 40,
        giveItem: "item_vb_music_box",
        addJournalChronicle: {
          title: "The Music Box in the Ash",
          text: "Silenced the musical ember cloud in the hallway. It left behind an ornate wind-up music box."
        }
      }
    },
    {
      id: "enc_vb_drip_gut",
      locationId: "loc_vb_gut_room",
      creatureId: "creature_vb_the_drip",
      triggerCondition: { flag: "drip_defeated", expected: false },
      initiative: "enemy",
      unavoidable: false,
      introProse: "You step onto squishing floorboards in the dim light. From the blood-stained ceiling above, heavy organic matter detaches and strikes downward in an aggressive cascade!",
      victoryOutcome: {
        text: "You sever the descending masses with clinical detachment! The dripping ceases and the overhead lights pop back on, revealing the expanded expanse of the gut-spattered room.",
        setFlags: { drip_defeated: true, gut_lights_restored: true },
        awardXP: 70,
        giveItem: "mat_vb_blood_iron",
        addJournalChronicle: {
          title: "The Visceral Ceiling",
          text: "Cleared the aggressive anatomical matter in the gut room. Found blood-tempered iron embedded in the residue."
        }
      }
    },
    {
      id: "enc_vb_rag_maze",
      locationId: "loc_vb_maze_corridor",
      creatureId: "creature_vb_the_rag",
      triggerCondition: { flag: "rag_maze_defeated", expected: false },
      initiative: "enemy",
      unavoidable: false,
      introProse: "As you navigate the narrow wooden walls of the maze, the lights pop. Ahead in the blind turn, the levitating rag blocks the path forward, leaking thick psychic miasma.",
      victoryOutcome: {
        text: "You pin the cloth against the wood paneling until its struggling ceases. The air clears, revealing the continuation of the maze corridor.",
        setFlags: { rag_maze_defeated: true },
        awardXP: 80,
        giveItem: "mat_vb_entity_cloth"
      }
    },
    {
      id: "enc_vb_verdict_final",
      locationId: "loc_vb_judgment_hall",
      creatureId: "creature_vb_verdict_form",
      triggerCondition: { flag: "verdict_encounter_ready", expected: true },
      initiative: "enemy",
      unavoidable: true,
      introProse: "The judgment hall seals behind you. The crimson numerals IX through I burn on all four walls. In the center, the green armchair dissolves into a towering, shrieking manifestation of every life Vermin dismantled. It is time for the accounting.",
      victoryOutcome: {
        text: "With unyielding precision, you dismantle the manifestation piece by piece. The screaming fades into total, absolute stillness. The golden key to the final threshold materializes upon the floor.",
        setFlags: { verdict_form_defeated: true, verdict_given: true },
        awardXP: 350,
        giveItem: "item_vb_the_verdict_key",
        addJournalChronicle: {
          title: "The Verdict Overcome",
          text: "Faced the embodiment of all past atrocities in the Judgment Hall. The entity dissolved, leaving the final key."
        }
      }
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'encounters.json'), encounters);


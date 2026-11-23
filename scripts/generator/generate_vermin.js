const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const CAMPAIGN_DIR = path.join(ROOT, 'content/campaigns/vermin');
const WORLD_DIR = path.join(CAMPAIGN_DIR, 'world');

fs.mkdirSync(WORLD_DIR, { recursive: true });

function writeJson(filePath, data) {
  const jsonStr = JSON.stringify(data, null, 2);
  if (jsonStr.includes('\u2014')) {
    throw new Error(`CRITICAL: Forbidden em dash detected in output for ${filePath}`);
  }
  fs.writeFileSync(filePath, jsonStr, 'utf8');
  console.log(`Wrote ${filePath} (${jsonStr.length} bytes)`);
}

console.log("Generating campaign files for What Remains of Vermin Black...");

// ==========================================
// 1. FACTIONS
// ==========================================
const factions = {
  factions: [
    {
      id: "faction_vb_the_self",
      name: "The Ego",
      description: "Vermin Black's internal composure, clinical detachment, and cognitive defense mechanisms.",
      defaultReputation: 50,
      thresholds: { hostile: -40, unfriendly: -10, neutral: 0, friendly: 20, trusted: 50 }
    },
    {
      id: "faction_vb_the_echoes",
      name: "The Paranormal Entities",
      description: "Paranormal entities, rag emanations, sprinters, and shifting phenomena haunting the architectural loops.",
      defaultReputation: -50,
      thresholds: { hostile: -40, unfriendly: -10, neutral: 0, friendly: 20, trusted: 50 }
    },
    {
      id: "faction_vb_the_architecture",
      name: "The Shifting Space",
      description: "The impossible, shifting labyrinth of rooms, popping light bulbs, popping corridors, and sealed thresholds.",
      defaultReputation: 0,
      thresholds: { hostile: -40, unfriendly: -10, neutral: 0, friendly: 20, trusted: 50 }
    },
    {
      id: "faction_vb_the_remembered",
      name: "The Remembered Victims",
      description: "The echoes of patients, deceived complainants, staff, and butchered animals preserved in the space.",
      defaultReputation: -60,
      thresholds: { hostile: -40, unfriendly: -10, neutral: 0, friendly: 20, trusted: 50 }
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'factions.json'), factions);

// ==========================================
// 2. DEITIES
// ==========================================
const deities = {
  deities: [
    {
      id: "deity_vb_the_void",
      name: "The Consuming Void",
      domain: "Oblivion and Silent Darkness",
      epithets: ["The Dark Between", "The Silence That Remains", "The Unlit Room"],
      symbols: ["Popped Light Bulb", "Empty Table", "Snuffed Lantern"],
      description: "The suffocating emptiness between the shifting walls. It swallows rooms, projects shadows, and extinguishes lanterns without warning."
    },
    {
      id: "deity_vb_the_verdict",
      name: "The Final Verdict",
      domain: "Inevitable Reckoning and Accounting",
      epithets: ["The Wall of Numerals", "The Final Bell", "The Unavoidable Audit"],
      symbols: ["Roman Numerals in Blood", "The Green Fabric Chair", "The Shaving Blade"],
      description: "The underlying consciousness of the space that counts down from IX toward zero. It demands that every atrocity be looked upon and tallied."
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'deities.json'), deities);

// ==========================================
// 3. CLASSES
// ==========================================
const classes = {
  classes: [
    {
      id: "vb_predator",
      name: "The Predator",
      subtitle: "Cold Manipulator",
      archetype: "Warrior & Infiltrator",
      description: "A detached mind devoid of human empathy, regarding living beings as simple playthings to dissect, manipulate, and discard.",
      primaryAttributes: ["strength", "intelligence"],
      statBonuses: { strength: 2, intelligence: 1 },
      proficiencies: ["intimidation", "deception", "light_blades", "athletics"],
      classFeatures: [
        {
          level: 1,
          name: "Surgical Detachment",
          type: "passive",
          desc: "Cold disregard for pain grants +2 Armor Class and immunity to panic.",
          effect: { ac: 2, immune: ["frightened"] }
        },
        {
          level: 2,
          name: "Dissection Strike",
          type: "active",
          desc: "Strike precision anatomical vulnerabilities with clinical ruthlessness.",
          combat: {
            uses: 2,
            staminaCost: 3,
            attack: true,
            extraDamage: 5,
            enemyStatus: { id: "bleeding", rounds: 3, value: 3 }
          }
        }
      ],
      startingEquipment: ["item_vb_clinical_razor", "item_vb_void_coat"]
    },
    {
      id: "vb_survivor",
      name: "The Survivor",
      subtitle: "Tenacious Drifter",
      archetype: "Endurance & Will",
      description: "An iron-willed individual refusing to submit to the sinking sensations and toxic emanations of the shifting space.",
      primaryAttributes: ["endurance", "wisdom"],
      statBonuses: { endurance: 2, wisdom: 1 },
      proficiencies: ["endurance", "perception", "survival", "athletics"],
      classFeatures: [
        {
          level: 1,
          name: "Tenacious Stride",
          type: "passive",
          desc: "Stubborn resistance to spectral entanglements grants +10 maximum Stamina.",
          effect: { maxStamina: 10 }
        },
        {
          level: 2,
          name: "Desperate Clout",
          type: "active",
          desc: "Swing an improvised iron implement to dislodge clinging entities.",
          combat: {
            uses: 2,
            staminaCost: 4,
            damage: "1d8+2",
            contest: "strength",
            enemyMods: { attack: { value: -2, rounds: 2 } }
          }
        }
      ],
      startingEquipment: ["item_vb_iron_hook", "item_vb_bandage_cloth"]
    },
    {
      id: "vb_analyst",
      name: "The Analyst",
      subtitle: "Clinical Observer",
      archetype: "Scholar & Detective",
      description: "A meticulous clinician who catalogues anomalies, measures corridors, and calculates the logic behind the shifting architecture.",
      primaryAttributes: ["intelligence", "wisdom"],
      statBonuses: { intelligence: 2, wisdom: 1 },
      proficiencies: ["investigation", "mythology_lore", "medicine", "perception"],
      classFeatures: [
        {
          level: 1,
          name: "Lucid Observation",
          type: "passive",
          desc: "Meticulous awareness reveals hidden compartments and grants +2 to all Investigation checks.",
          effect: { checkBonus: { investigation: 2, perception: 1 } }
        },
        {
          level: 2,
          name: "Hypothesis Testing",
          type: "active",
          desc: "Identify entity attack frequencies to anticipate and blunt spectral strikes.",
          combat: {
            uses: 2,
            staminaCost: 3,
            selfMods: { ac: { value: 3, rounds: 2 } },
            heal: "1d6+2"
          }
        }
      ],
      startingEquipment: ["item_vb_clinical_razor", "item_vb_lantern"]
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'classes.json'), classes);

// ==========================================
// 4. BACKGROUNDS
// ==========================================
const backgrounds = {
  backgrounds: [
    {
      id: "bg_vb_institutionalist",
      name: "The Institutionalist",
      category: "Clinical Authority",
      description: "You managed a psychiatric clinic where patients were treated not as suffering mortals, but as subjects and toys.",
      proficiencies: ["medicine", "deception"],
      passiveBonus: "+2 bonus on Deception and Persuasion checks when manipulating confused minds.",
      dialoguePerk: "Unlocks clinical authority and bureaucratic intimidation dialogue options."
    },
    {
      id: "bg_vb_the_hollow",
      name: "The Hollow",
      category: "Emotional Void",
      description: "You were born incapable of feeling affection, guilt, or remorse. Cruelty was simply an experiment in cause and effect.",
      proficiencies: ["endurance", "stealth"],
      passiveBonus: "+2 Armor Class against psychic dread and complete immunity to guilt-induced status effects.",
      dialoguePerk: "Unlocks coldly rational dialogue responses that unnerve emotional apparitions."
    },
    {
      id: "bg_vb_the_rememberer",
      name: "The Rememberer",
      category: "Suppressed Recall",
      description: "Memories of bathtubs, shaving blades, signed admissions, and muffled cries surface with crystalline, morbid clarity.",
      proficiencies: ["investigation", "mythology_lore"],
      passiveBonus: "+2 on Investigation checks when examining physical evidence and bloody inscriptions.",
      dialoguePerk: "Unlocks hidden memories and instant solutions to symbolic architectural riddles."
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'backgrounds.json'), backgrounds);

// ==========================================
// 5. ORIGINS & TRAITS
// ==========================================
const origins = {
  origins: [
    {
      id: "origin_vb_condemned",
      name: "The Condemned",
      description: "Sealed within an impossible shifting maze from which no physical exit has ever been discovered.",
      perks: "+1 Endurance • +1 Athletics • Hardened against fatigue",
      attributes: { endurance: 1 },
      skills: { athletics: 1 },
      reputation: { faction_vb_the_architecture: 5 },
      piety: {},
      maxMorale: 0
    },
    {
      id: "origin_vb_observer",
      name: "The Observer",
      description: "Treating the waking nightmare as an intriguing puzzle rather than a horrifying reality.",
      perks: "+1 Wisdom • +1 Perception • +1 Investigation",
      attributes: { wisdom: 1 },
      skills: { perception: 1, investigation: 1 },
      reputation: { faction_vb_the_self: 5 },
      piety: {},
      maxMorale: 0
    },
    {
      id: "origin_vb_hollow_born",
      name: "The Hollow-Born",
      description: "Untouched by human warmth since infancy, unburdened by conscience or sentimental hesitation.",
      perks: "+2 Strength • -1 Charisma • +1 Intimidation",
      attributes: { strength: 2, charisma: -1 },
      skills: { intimidation: 1 },
      reputation: { faction_vb_the_remembered: -10 },
      piety: {},
      maxMorale: 0
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'origins.json'), origins);

const traits = {
  traits: [
    {
      id: "trait_vb_void_sight",
      name: "Void Sight",
      description: "You detect anomalies and apparitions before they materialize into the physical corridor.",
      perks: "+2 on Perception checks against entities.",
      checkBonus: { perception: 2 }
    },
    {
      id: "trait_vb_clinical_mind",
      name: "Clinical Mind",
      description: "You dismiss supernatural manifestations as sensory glitches or amusing parlor tricks.",
      perks: "+2 on Wisdom saving throws against mental panic.",
      checkBonus: { endurance: 1 }
    },
    {
      id: "trait_vb_fractured",
      name: "Already Fractured",
      description: "A mind shattered long before entering this corridor, resilient through sheer internal fragmentation.",
      perks: "+10 Maximum Stamina • +1 Endurance Checks.",
      checkBonus: { endurance: 1 }
    },
    {
      id: "trait_vb_lucid",
      name: "Lucid Walker",
      description: "You perceive spatial distortions, trick doors, and hidden passages with piercing clarity.",
      perks: "+2 on Investigation and Puzzle deduction checks.",
      checkBonus: { investigation: 2 }
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'traits.json'), traits);

// ==========================================
// 6. SPELLS
// ==========================================
const spells = {
  spells: [
    {
      id: "vb_spell_clarity_surge",
      name: "Clarity Surge",
      discipline: "Abjuration",
      tier: 1,
      costPoints: 1,
      staminaCost: 4,
      targeting: "self",
      effect: {
        ward: 12,
        selfMods: { ac: { value: 2, rounds: 3 } },
        cure: ["frightened", "confused"]
      },
      description: "Force the suffocating fog of unreality back through deliberate mental discipline."
    },
    {
      id: "vb_spell_void_step",
      name: "Void Step",
      discipline: "Illusion",
      tier: 1,
      costPoints: 1,
      staminaCost: 5,
      targeting: "self",
      effect: {
        selfMods: { ac: { value: 4, rounds: 2 }, attack: { value: 2, rounds: 2 } }
      },
      description: "Slip sideways through the dark between moments, bypassing entity reach."
    },
    {
      id: "vb_spell_spectral_blind",
      name: "Spectral Blind",
      discipline: "Control",
      tier: 2,
      costPoints: 2,
      staminaCost: 7,
      targeting: "single",
      effect: {
        enemyStatus: { id: "confused", rounds: 2, value: 1 },
        enemyMods: { ac: { value: -3, rounds: 2 } }
      },
      description: "Strip an apparition of its perceptive anchor, leaving it thrashing blindly."
    },
    {
      id: "vb_spell_fracture_scream",
      name: "Fracture Scream",
      discipline: "Evocation",
      tier: 2,
      costPoints: 2,
      staminaCost: 8,
      targeting: "multi",
      effect: {
        damage: "2d6+3",
        enemyStatus: { id: "frightened", rounds: 2, value: 1 }
      },
      description: "Unleash the repressed psychopathic rage within, projecting it as a shattering psychic shockwave."
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'spells.json'), spells);

// ==========================================
// 7. TUTORIALS
// ==========================================
const tutorials = {
  tutorials: [
    {
      id: "tut_vb_waking",
      title: "The Shifting Architecture",
      summary: "Inspect documents, keep your lantern lit, drink plain-killing elixirs when pain strikes, and follow the descending Roman numerals toward the Verdict."
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'tutorials.json'), tutorials);


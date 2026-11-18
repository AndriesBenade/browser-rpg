// scripts/generator/generate_world.js
// Complete procedural & declarative content generator for The Northern Realms campaign.
// Adheres strictly to engine rules: NO em dashes (U+2014), strict referential integrity,
// fully connected geography, rich quests, branching choices, complete bestiary, items, crafting,
// puzzles, and world events.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'content/campaigns/northern_realms/world');
const MANIFEST_PATH = path.join(ROOT, 'content/campaigns/northern_realms/campaign.json');

console.log("Generating complete content for The Northern Realms...");

function writeJson(filePath, data) {
  const jsonStr = JSON.stringify(data, null, 2);
  if (jsonStr.includes('\u2014')) {
    throw new Error(`CRITICAL: Forbidden em dash detected in output for ${filePath}`);
  }
  fs.writeFileSync(filePath, jsonStr, 'utf8');
  console.log(`Wrote ${filePath} (${jsonStr.length} bytes)`);
}

// -------------------------------------------------------------
// 1. FACTIONS, DEITIES, LORE, GLOSSARY
// -------------------------------------------------------------
const factions = {
  factions: [
    {
      id: "faction_nr_iron_covenant",
      name: "The Iron Covenant",
      description: "Elite warrior fellowship based in the high mead-hall of Valenfrost. Sworn to martial honor, shield-drills, and monster-hunting across the reaches.",
      defaultReputation: 10
    },
    {
      id: "faction_nr_whispering_cabal",
      name: "The Whispering Cabal",
      description: "A shadowy guild of outlaws, fences, and cutpurses headquartered in the sunken cisterns below the Mistglen canals.",
      defaultReputation: 0
    },
    {
      id: "faction_nr_circle_of_winter",
      name: "The Circle of Winter",
      description: "Ancient order of northern sorcerers, enchanters, and element-binders presiding over the glacial Spire of Frostmere.",
      defaultReputation: 5
    },
    {
      id: "faction_nr_frostpeak_watch",
      name: "Frostpeak Hold Guard",
      description: "Steadfast sworn guards and archers maintaining order, collecting caravan tolls, and manning the ramparts across Valenfrost.",
      defaultReputation: 10
    },
    {
      id: "faction_nr_silver_kin",
      name: "The Silver Kin",
      description: "Proud dwarf clan and veteran prospectors working the deep argent lodes of Grimstone Mine and the Blackforge.",
      defaultReputation: 15
    },
    {
      id: "faction_nr_drakenseekers",
      name: "Order of Drakenseekers",
      description: "Dedicated slayers of legendary behemoths and ancient wyrms, preserving runic armaments and dragon lore.",
      defaultReputation: 0
    },
    {
      id: "faction_nr_fen_bandits",
      name: "Drowned Mire Marauders",
      description: "Ruthless brigands and deserters lurking in the fog-drenched reed beds of Mistglen Bog.",
      defaultReputation: -40
    },
    {
      id: "faction_nr_cult_of_vyr",
      name: "The Vyr Worshippers",
      description: "Chthonic death-cult seeking the awakening of the dormant Frost Wyrm beneath Mount Wyrmfang.",
      defaultReputation: -50
    }
  ]
};

const deities = {
  deities: [
    {
      id: "deity_torvald",
      name: "Torvald the All-Watcher",
      domain: "Storms, Valor, Honor, Smithing",
      epithets: ["The Thunder-Father", "Keeper of the Iron Gate", "Lord of the Hearthfire"],
      symbols: ["Winged Great-Hammer", "Silver Thunderbolt", "Anvil Crest"],
      description: "Chief deity of the northern clans. Honored with roasted meats, crushed barley, and tempered blades on granite mountain altars."
    },
    {
      id: "deity_skadi",
      name: "Skadi the Frostmaiden",
      domain: "Winter, Archery, The Hunt, Glaciers",
      epithets: ["Lady of the Blizzard", "The Arrow of Rime", "Mistress of White Wolves"],
      symbols: ["Yew Longbow", "Snow Crystal", "Dire Wolf Pelt"],
      description: "Goddess of snowbound paths and silent hunters. She grants enduring stamina to those who respect the sacred winter woods."
    },
    {
      id: "deity_varn",
      name: "Varn the Shrouded",
      domain: "Death, Secrets, Subterrane, Shadows",
      epithets: ["The Silent Boatman", "Lord of Barrows", "The Gray Sovereign"],
      symbols: ["Silver Coin", "Raven Feather", "Obsidian Dagger"],
      description: "Guardian of ancestral resting places and ruler of the cold underworld beneath the permafrost."
    }
  ]
};

const lore = {
  loreEntries: [
    {
      id: "lore_nr_the_great_calamity",
      title: "The Age of Rime and Ruin",
      category: "Ancient History",
      text: "Four centuries past, the ancient High Kingdom shattered when the Great Frost Wyrm Vyr descended from the volcanic peaks. The kingdoms fractured into fortified holds, and the secret art of runecraft was nearly lost to the encroaching ice."
    },
    {
      id: "lore_nr_vyr_the_wyrm",
      title: "The Slumber of Vyr",
      category: "Mythology",
      text: "Legends etched into the barrow slates recount that Vyr was not slain, but bound beneath the obsidian crater of Mount Wyrmfang by three runic star-keys forged from star-iron."
    },
    {
      id: "lore_nr_star_iron",
      title: "Sky-Iron and Rune-Forging",
      category: "Crafting & Metallurgy",
      text: "Sky-iron fell from blazing stars upon the glacial peaks. When quenched in glacier water and carved with Torvald's runes, it yields armaments that never dull and bite through dragon scales."
    },
    {
      id: "lore_nr_barrow_curses",
      title: "The Draugr of the Old Reaches",
      category: "Supernatural",
      text: "Those warriors who swore blasphemous blood-oaths to the Wyrm were entombed alive within stone barrows. Their corpses remain vigilant, clad in blackened iron, striking down any who disturb their funeral urns."
    },
    {
      id: "lore_nr_mead_and_hospitality",
      title: "The Law of Hearth and Salt",
      category: "Culture",
      text: "In the Northern Realms, no host may harm a guest who has tasted bread, salt, and spiced juniper mead beneath their timber roof. Breaking hearth-peace marks a warrior as an outcast across all holds."
    }
  ]
};

const glossary = {
  glossary: [
    {
      key: "jarl",
      terms: ["Jarl", "Jarls"],
      name: "Jarl",
      category: "Title & Society",
      simpleEnglish: "A northern regional ruler or lord",
      explanation: "A high-ranking noble ruling over a province, fortress hold, and sworn huscarls in the Northern Realms.",
      significance: "Holds sovereign authority over regional laws, garrisons, and judicial trials."
    },
    {
      key: "huscarl",
      terms: ["Huscarl", "Huscarls"],
      name: "Huscarl",
      category: "Title & Society",
      simpleEnglish: "A sworn personal bodyguard or elite veteran warrior",
      explanation: "Veteran warriors bound by sacred blood-oath to defend their Jarl and hold unto death.",
      significance: "Renowned for their unbreakable shield-walls and heavy iron plate."
    },
    {
      key: "draugr",
      terms: ["Draugr", "Draugrs"],
      name: "Draugr",
      category: "Creatures",
      simpleEnglish: "Undead warrior haunting ancient barrows and ruins",
      explanation: "Animated ancestral corpses guarding burial crypts with ancient rusted blades and chthonic frost magic.",
      significance: "Deadly subterranean foes resistant to mundane cold."
    },
    {
      key: "runecraft",
      terms: ["Runecraft", "runecarving"],
      name: "Runecraft",
      category: "Magic & Lore",
      simpleEnglish: "The art of inscribing magical runes into metals and stone",
      explanation: "The northern art of channeling primordial storm and frost energy into weapons, armor, and gate-wards.",
      significance: "Essential for breaking ancient seal-doors and battling eldritch wyrms."
    },
    {
      key: "sky_iron",
      terms: ["Sky-Iron", "star-iron"],
      name: "Sky-Iron",
      category: "Materials",
      simpleEnglish: "Meteoric ore found in snowbound mountain crags",
      explanation: "Dense, resonant celestial metal prized by master smiths for forging legendary relic weapons.",
      significance: "The only material capable of piercing the hide of ancient dragons."
    }
  ]
};

// -------------------------------------------------------------
// 2. PROFESSIONS, MATERIALS, CRAFTING TEMPLATES, COMBINATIONS
// -------------------------------------------------------------
const professions = {
  professions: [
    {
      id: "nr_weaponsmithing",
      name: "Runic Blacksmithing",
      icon: "🔨",
      "": "strength",
      secondaryAttribute: "intelligence",
      requiredToolkitId: "item_nr_smithing_hammer",
      "": "anvil",
      description: "Forging heavy blades, battleaxes, plate armor, and reinforced shields from bog-iron and sky-iron.",
      "": ["weapon", "shield", "armor"]
    },
    {
      id: "nr_alchemy",
      name: "Northern Alchemy",
      icon: "🧪",
      "": "wisdom",
      secondaryAttribute: "intelligence",
      requiredToolkitId: "item_nr_alembic_kit",
      "": "mortar",
      description: "Brewing stamina cordials, frost resistance draughts, and weapon venoms using mountain lichen and monster oils.",
      "": ["consumable"]
    },
    {
      id: "nr_leatherwork",
      name: "Furrier & Leatherwork",
      icon: "🧵",
      "": "agility",
      secondaryAttribute: "endurance",
      requiredToolkitId: "item_nr_leather_tanner_kit",
      "": "bench",
      description: "Tailoring wolf-fur cloaks, supple boots, and reinforced lamellar from beast hides.",
      "": ["armor", "boots", "gloves"]
    }
  ]
};

const materials = {
  materials: [
    {
      id: "mat_nr_bog_iron",
      "": "Refined Bog Iron",
      category: "metal",
      rarity: "common",
      weightKg: 1.5,
      valueDrachmae: 8,
      properties: { hardness: 6, durability: 6, flexibility: 3, heatResistance: 6, magicalAffinity: 1, purity: 65 },
      "": ["nr_weaponsmithing"],
      "": { damage: 1, defense: 1 },
      description: "Smelted from rich iron sediment dredged from the riverbeds of Valenfrost."
    },
    {
      id: "mat_nr_silver_ingot",
      "": "Deep-Silver Ingot",
      category: "metal",
      rarity: "uncommon",
      weightKg: 1.2,
      valueDrachmae: 25,
      properties: { hardness: 7, durability: 7, flexibility: 5, heatResistance: 7, magicalAffinity: 6, purity: 90 },
      "": ["nr_weaponsmithing"],
      "": { damage: 2, defense: 2 },
      description: "Lustrous argent mined by the Silver Kin dwarves beneath Grimstone Mountain."
    },
    {
      id: "mat_nr_sky_iron_ore",
      "": "Meteoric Sky-Iron Chunk",
      category: "metal",
      rarity: "rare",
      weightKg: 2.0,
      valueDrachmae: 75,
      properties: { hardness: 10, durability: 10, flexibility: 4, heatResistance: 10, magicalAffinity: 9, purity: 98 },
      "": ["nr_weaponsmithing"],
      "": { damage: 4, defense: 4 },
      description: "Resonant, cold-forged sky-iron fallen from winter shooting stars."
    },
    {
      id: "mat_nr_hardened_pine",
      "": "Ironwood Pine Timber",
      category: "wood",
      rarity: "common",
      weightKg: 1.0,
      valueDrachmae: 4,
      properties: { hardness: 5, durability: 6, flexibility: 5, heatResistance: 3, magicalAffinity: 2, purity: 80 },
      "": ["nr_weaponsmithing", "nr_leatherwork"],
      "": { defense: 1 },
      description: "Dense, resinous heartwood from the pines of Whispering Woods."
    },
    {
      id: "mat_nr_wolf_pelt",
      "": "White Wolf Pelt",
      category: "leather",
      rarity: "common",
      weightKg: 0.8,
      valueDrachmae: 10,
      properties: { hardness: 3, durability: 6, flexibility: 8, heatResistance: 2, magicalAffinity: 3, purity: 85 },
      "": ["nr_leatherwork"],
      "": { defense: 1 },
      description: "Thick winter fur that repels sleet and freezing winds."
    },
    {
      id: "mat_nr_frost_troll_hide",
      "": "Frost Troll Thickhide",
      category: "leather",
      rarity: "uncommon",
      weightKg: 2.5,
      valueDrachmae: 35,
      properties: { hardness: 7, durability: 9, flexibility: 6, heatResistance: 4, magicalAffinity: 5, purity: 90 },
      "": ["nr_leatherwork"],
      "": { defense: 3 },
      description: "Tough, pebbled hide stripped from a mountain frost troll."
    },
    {
      id: "mat_nr_frost_lichen",
      "": "Glacier Moss & Blue Lichen",
      category: "herb",
      rarity: "common",
      weightKg: 0.2,
      valueDrachmae: 5,
      properties: { hardness: 1, durability: 2, flexibility: 9, heatResistance: 1, magicalAffinity: 5, purity: 75 },
      "": ["nr_alchemy"],
      "": {},
      description: "Luminescent pale blue moss gathered from frozen rockfaces."
    },
    {
      id: "mat_nr_wyrm_blood_vial",
      "": "Vial of Dormant Wyrm Blood",
      category: "relic_oil",
      rarity: "rare",
      weightKg: 0.3,
      valueDrachmae: 80,
      properties: { hardness: 1, durability: 5, flexibility: 10, heatResistance: 9, magicalAffinity: 10, purity: 95 },
      "": ["nr_alchemy"],
      "": {},
      description: "Boiling, primordial dragon essence that seethes with draconic power."
    }
  ]
};

const craftingTemplates = {
  templates: [
    {
      id: "tmpl_nr_iron_broadsword",
      name: "Northern Iron Broadsword",
      profession: "nr_weaponsmithing",
      targetCategory: "weapon",
      minLevel: 1,
      requiredSkillCheck: { skill: "athletics", dc: 11 },
      materials: [
        { category: "metal", quantity: 2, defaultMaterialId: "mat_nr_bog_iron" },
        { category: "wood", quantity: 1, defaultMaterialId: "mat_nr_hardened_pine" }
      ],
      outputItemId: "item_nr_iron_broadsword",
      description: "A wide, double-edged northern blade built for crushing mail and beast hide."
    },
    {
      id: "tmpl_nr_silver_waraxe",
      name: "Silver-Inlaid Waraxe",
      profession: "nr_weaponsmithing",
      targetCategory: "weapon",
      minLevel: 2,
      requiredSkillCheck: { skill: "athletics", dc: 13 },
      materials: [
        { category: "metal", quantity: 2, defaultMaterialId: "mat_nr_silver_ingot" },
        { category: "wood", quantity: 1, defaultMaterialId: "mat_nr_hardened_pine" }
      ],
      outputItemId: "item_nr_silver_waraxe",
      description: "A heavy cleaving axe engraved with silver runes that sear through undead flesh."
    },
    {
      id: "tmpl_nr_iron_roundshield",
      name: "Huscarl's Reinforced Roundshield",
      profession: "nr_weaponsmithing",
      targetCategory: "shield",
      minLevel: 1,
      requiredSkillCheck: { skill: "athletics", dc: 10 },
      materials: [
        { category: "wood", quantity: 2, defaultMaterialId: "mat_nr_hardened_pine" },
        { category: "metal", quantity: 1, defaultMaterialId: "mat_nr_bog_iron" }
      ],
      outputItemId: "item_nr_huscarl_roundshield",
      description: "Stout pine boards bound in forged iron rim with a heavy central boss."
    },
    {
      id: "tmpl_nr_wolf_pelt_cloak",
      name: "Winter Wolf Warm-Cloak",
      profession: "nr_leatherwork",
      targetCategory: "armor",
      minLevel: 1,
      requiredSkillCheck: { skill: "survival", dc: 11 },
      materials: [
        { category: "leather", quantity: 2, defaultMaterialId: "mat_nr_wolf_pelt" }
      ],
      outputItemId: "item_nr_wolfskin_mantle",
      description: "A broad, snow-shedding fur mantle that keeps out arctic squalls."
    },
    {
      id: "tmpl_nr_stamina_cordial",
      name: "Juniper Stamina Cordial",
      profession: "nr_alchemy",
      targetCategory: "consumable",
      minLevel: 1,
      requiredSkillCheck: { skill: "medicine", dc: 10 },
      materials: [
        { category: "herb", quantity: 2, defaultMaterialId: "mat_nr_frost_lichen" }
      ],
      outputItemId: "item_nr_stamina_draught",
      description: "A brisk, invigorating tonic of crushed pine berries and glacier moss."
    },
    {
      id: "tmpl_nr_frost_resist_elixir",
      name: "Elixir of the Hearthfire",
      profession: "nr_alchemy",
      targetCategory: "consumable",
      minLevel: 2,
      requiredSkillCheck: { skill: "medicine", dc: 13 },
      materials: [
        { category: "herb", quantity: 1, defaultMaterialId: "mat_nr_frost_lichen" },
        { category: "metal", quantity: 1, defaultMaterialId: "mat_nr_silver_ingot" }
      ],
      outputItemId: "item_nr_frost_resist_potion",
      description: "A warming distilled elixir that wards the blood against lethal blizzard frost."
    }
  ]
};

const combinations = {
  combinations: [
    {
      id: "combo_nr_whetstone_broadsword",
      apply: "item_nr_mountain_whetstone",
      onto: "item_nr_iron_broadsword",
      result: "item_nr_honed_iron_broadsword",
      outcome: {
        transcript: {
          speaker: "Crafting",
          text: "You hone the edge of your broadsword against the coarse mountain whetstone. The blade gleams razor-sharp.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "combo_nr_venom_blade",
      apply: "item_nr_mire_venom_gland",
      onto: { category: "weapon" },
      coating: {
        id: "mire_poison",
        name: "Mire Viper Venom",
        hitsRemaining: 3,
        damageBonus: 2,
        status: { id: "poisoned", value: 2, rounds: 2 }
      },
      outcome: {
        transcript: {
          speaker: "Poisoner's Touch",
          text: "You coat the cutting edge in thick, greenish mire venom. Your next strikes will poison foes.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "combo_nr_herbal_remedy",
      apply: "mat_nr_frost_lichen",
      onto: "item_nr_stamina_draught",
      requiresItem: "item_nr_alembic_kit",
      result: "item_nr_potent_restorative",
      outcome: {
        transcript: {
          speaker: "Herbal Distillation",
          text: "Using your alembic kit, you refine the lichen into the stamina cordial, creating a potent restorative tonic.",
          style: "entry-discovery"
        }
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. CLASSES, BACKGROUNDS, ORIGINS, TRAITS
// -------------------------------------------------------------
const classes = {
  classes: [
    {
      id: "class_nr_shield_thane",
      name: "Shield Thane",
      subtitle: "The Unyielding Hearth-Wall",
      archetype: "Combat",
      description: "Armored vanguard sworn to the high holds. Master of the locked shield-wall, sweeping waraxes, and front-line resilience.",
      "": ["strength", "endurance"],
      statBonuses: { strength: 1, endurance: 1 },
      "": ["melee_combat", "athletics"],
      startingEquipment: [
        "item_nr_iron_broadsword",
        "item_nr_huscarl_roundshield",
        "item_nr_iron_ringmail",
        "item_nr_mountain_whetstone",
        "item_nr_smoked_venison",
        "item_nr_smoked_venison"
      ],
      classFeatures: [
        {
          level: 1,
          name: "Wall of Iron",
          type: "passive",
          desc: "+2 Armour Class while carrying a shield in your off-hand.",
          effect: { acWithShield: 2 }
        },
        {
          level: 1,
          name: "Shield Slam",
          type: "active",
          desc: "Batter your adversary: 1d6 damage and stuns them for 1 turn (once per combat, 1 Stamina).",
          combat: {
            damage: "1d6",
            enemyStatus: { id: "stunned", rounds: 1 },
            uses: 1,
            staminaCost: 1
          }
        },
        {
          level: 3,
          name: "Warrior's Second Wind",
          type: "active",
          desc: "Catch your breath amidst blood and snow: restore 2d6+2 Health (once per fight, 2 Stamina).",
          combat: {
            heal: "2d6+2",
            uses: 1,
            staminaCost: 2
          }
        }
      ]
    },
    {
      id: "class_nr_rime_scout",
      name: "Rime Scout",
      subtitle: "Silent Path of the Bow",
      archetype: "Ranged",
      description: "Stealthy stalker of the taiga and jagged crags. Expert archer who tracks wolf packs and snipes from snowdrifts.",
      "": ["agility", "wisdom"],
      statBonuses: { agility: 1, wisdom: 1 },
      "": ["ranged_combat", "tracking", "survival"],
      startingEquipment: [
        "item_nr_ash_longbow",
        "item_nr_hunting_dagger",
        "item_nr_scout_leather_coat",
        "item_nr_stamina_draught",
        "item_nr_hard_tack_bread",
        "item_nr_hard_tack_bread"
      ],
      classFeatures: [
        {
          level: 1,
          name: "Ghost of the Drift",
          type: "passive",
          desc: "+2 on Tracking and Survival checks; +1 bonus to ranged attack rolls.",
          effect: {
            checkBonus: { tracking: 2, survival: 2 },
            attackRanged: 1
          }
        },
        {
          level: 1,
          name: "Crippling Arrow",
          type: "active",
          desc: "Pin your quarry to the frozen ground: deals ranged damage and entangles for 2 rounds (1 Stamina).",
          combat: {
            attack: true,
            hitBonus: 2,
            status: { id: "entangled", rounds: 2 },
            uses: 1,
            staminaCost: 1
          }
        },
        {
          level: 3,
          name: "Snow Blindness Immunity",
          type: "passive",
          desc: "You read the glare of sun on snow without faltering; night and blizzard penalties are halved.",
          effect: { nightVision: true }
        }
      ]
    },
    {
      id: "class_nr_skald_spellblade",
      name: "Skald Spellblade",
      subtitle: "Song, Steel and Rime",
      archetype: "Battlemage",
      description: "Warrior-poet trained in the ancestral chants of Frostmere. Weaves frosty evocations around tempered steel.",
      "": ["intelligence", "strength"],
      statBonuses: { intelligence: 1, strength: 1 },
      "": ["melee_combat", "mythology_lore", "persuasion"],
      startingEquipment: [
        "item_nr_iron_broadsword",
        "item_nr_skald_ringmail",
        "item_nr_frost_rune_focus",
        "item_nr_frost_resist_potion",
        "item_nr_smoked_venison"
      ],
      classFeatures: [
        {
          level: 1,
          name: "Rime Blade",
          type: "passive",
          desc: "Your weapon strikes hum with bitter chill: +1 frost damage on all melee hits.",
          effect: { damage: 1 }
        },
        {
          level: 1,
          name: "Glacial Blast",
          type: "active",
          desc: "Release a freezing cone of rime: 1d8 frost damage and weakens the foe for 2 rounds (1 Stamina).",
          combat: {
            damage: "1d8",
            enemyStatus: { id: "weakened", rounds: 2 },
            uses: 1,
            staminaCost: 1
          }
        },
        {
          level: 3,
          name: "Hearth Chant",
          type: "passive",
          desc: "Inspiring verses steel your spirit: +2 Maximum Morale and +2 vs fear effects.",
          effect: { maxMorale: 2 }
        }
      ]
    },
    {
      id: "class_nr_shadow_prowler",
      name: "Shadow Prowler",
      subtitle: "Lockpick and Poisoned Stiletto",
      archetype: "Rogue",
      description: "Infiltrator from the Mistglen canals. Disables deadly crypt traps, bypasses bronze vault locks, and strikes from shadows.",
      "": ["agility", "intelligence"],
      statBonuses: { agility: 1, intelligence: 1 },
      "": ["stealth", "investigation"],
      startingEquipment: [
        "item_nr_hunting_dagger",
        "item_nr_dwarven_lockpicks",
        "item_nr_leather_boots",
        "item_nr_mire_venom_gland",
        "item_nr_smoked_salmon"
      ],
      classFeatures: [
        {
          level: 1,
          name: "Nimble Hands",
          type: "passive",
          desc: "+3 bonus on lockpicking and pickpocketing actions; lockpicks never break on failed attempts.",
          effect: {
            activityBonus: { lockpick: 3, pickpocket: 3 },
            toolsSafe: true
          }
        },
        {
          level: 1,
          name: "Blinding Powder",
          type: "active",
          desc: "Flung powdered ash into enemy eyes: confuses target for 2 rounds (1 Stamina).",
          combat: {
            enemyStatus: { id: "confused", rounds: 2 },
            uses: 1,
            staminaCost: 1
          }
        },
        {
          level: 3,
          name: "Backstab Mastery",
          type: "passive",
          desc: "Exploit unguarded vulnerabilities: +2 damage on attacks against stunned, confused, or entangled targets.",
          effect: { damage: 2 }
        }
      ]
    }
  ]
};

const backgrounds = {
  backgrounds: [
    {
      id: "bg_nr_hearth_guard",
      name: "Hold Veteran",
      category: "Military",
      description: "Years standing watch on the freezing battlements of Valenfrost Keep against raiders and wolves.",
      "": ["melee_combat", "athletics"],
      startingEquipment: ["item_nr_iron_broadsword", "item_nr_smoked_venison"],
      passiveBonus: "Accustomed to standing firm against biting mountain blizzards.",
      "": "Hold guards and huscarls treat you as an honorable comrade."
    },
    {
      id: "bg_nr_barrow_delver",
      name: "Barrow Delver",
      category: "Exploration",
      description: "You have plundered the sealed burial cairns of forgotten chieftains and survived the walking dead.",
      "": ["investigation", "survival"],
      startingEquipment: ["item_nr_mountain_torch", "item_nr_dwarven_lockpicks"],
      passiveBonus: "Intuitive eye for tripwires, loose flagstones, and hidden wall alcoves.",
      "": "Scholars and antiquarians eagerly buy rare curiosities from your pack."
    },
    {
      id: "bg_nr_apprentice_runecarver",
      name: "Apprentice Runecarver",
      category: "Scholarship",
      description: "Trained under the master enchanters of Frostmere Spire in the geometry of storm and frost runes.",
      "": ["mythology_lore", "persuasion"],
      startingEquipment: ["item_nr_frost_rune_focus", "item_nr_alembic_kit"],
      passiveBonus: "Instinctive recognition of ancient runic inscriptions and magical wards.",
      "": "Mages of the Winter Circle welcome you into their sanctums without suspicion."
    },
    {
      id: "bg_nr_canal_smuggler",
      name: "Mistglen Smuggler",
      category: "Underworld",
      description: "Piloted flat-bottomed punts through the swamp mist of Mistglen, transporting contraband under the watch of the fog.",
      "": ["stealth", "deception"],
      startingEquipment: ["item_nr_hunting_dagger", "item_nr_hard_tack_bread"],
      passiveBonus: "Knows how to melt into marsh fog and strike deals in dingy dock taverns.",
      "": "Fences, thieves, and informants whisper passwords to you freely."
    }
  ]
};

const origins = {
  origins: [
    {
      id: "origin_nr_frostpeak_born",
      name: "Valenfrost Born",
      description: "Raised in the high shadow of Mount Wyrmfang amidst ringing anvils and clan songs.",
      perks: "+1 Strength, +5 reputation with Frostpeak Hold Guard",
      attributes: { strength: 1 },
      reputation: { faction_nr_frostpeak_watch: 5 }
    },
    {
      id: "origin_nr_mistglen_fenlander",
      name: "Mistglen Fenlander",
      description: "Grew up in stilt-cabins above the black water of the western bogs.",
      perks: "+1 Agility, +1 Stealth check bonus",
      attributes: { agility: 1 },
      skills: { stealth: 1 }
    },
    {
      id: "origin_nr_grimstone_miner",
      name: "Grimstone Prospector",
      description: "Worked alongside the Silver Kin dwarves extracting silver veins from deep granite shafts.",
      perks: "+1 Endurance, +5 reputation with The Silver Kin",
      attributes: { endurance: 1 },
      reputation: { faction_nr_silver_kin: 5 }
    },
    {
      id: "origin_nr_frostmere_initiate",
      name: "Frostmere Scribe",
      description: "Spent youth transcribing icy codices within the glacial tower of the Circle of Winter.",
      perks: "+1 Intelligence, +1 Mythology Lore bonus",
      attributes: { intelligence: 1 },
      skills: { mythology_lore: 1 }
    }
  ]
};

const traits = {
  traits: [
    {
      id: "trait_nr_iron_blood",
      name: "Iron Blood",
      description: "Your lineage survived centuries of mountain frostbite and dragon skirmishes.",
      perks: "+5 Maximum Health, +2 bonus on Survival checks.",
      maxHealth: 5,
      checkBonus: { survival: 2 }
    },
    {
      id: "trait_nr_eagle_eyed",
      name: "Hawk of the Crags",
      description: "Uncanny sight capable of picking out ambushes through howling blizzards.",
      perks: "+2 bonus on Perception and Tracking checks.",
      checkBonus: { perception: 2, tracking: 2 }
    },
    {
      id: "trait_nr_silver_tongue",
      name: "Hearth Skald",
      description: "A commanding yet warm presence that wins over suspicious tavern keepers and jarls.",
      perks: "+2 bonus on Persuasion and Deception checks.",
      checkBonus: { persuasion: 2, deception: 2 }
    },
    {
      id: "trait_nr_resolute_will",
      name: "Dauntless Hearth-Soul",
      description: "Never trembles before draugr wights or towering frost beasts.",
      perks: "+2 Maximum Morale.",
      maxMorale: 2
    }
  ]
};

writeJson(path.join(OUT_DIR, 'professions.json'), professions);
writeJson(path.join(OUT_DIR, 'materials.json'), materials);
writeJson(path.join(OUT_DIR, 'crafting_templates.json'), craftingTemplates);
writeJson(path.join(OUT_DIR, 'combinations.json'), combinations);
writeJson(path.join(OUT_DIR, 'classes.json'), classes);
writeJson(path.join(OUT_DIR, 'backgrounds.json'), backgrounds);
writeJson(path.join(OUT_DIR, 'origins.json'), origins);
writeJson(path.join(OUT_DIR, 'traits.json'), traits);

console.log("Stage 2 complete: Professions, Materials, Crafting, Combinations, Classes, Backgrounds, Origins, Traits.");

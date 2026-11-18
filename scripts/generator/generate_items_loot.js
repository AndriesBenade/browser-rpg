// scripts/generator/generate_items_loot.js
// Generates items.json and loot_tables.json for The Northern Realms campaign.
// Strict compliance: NO em dashes (U+2014), strict cross-references, weapons obtainable early.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'content/campaigns/northern_realms/world');

function writeJson(filePath, data) {
  const jsonStr = JSON.stringify(data, null, 2);
  if (jsonStr.includes('\u2014')) {
    throw new Error(`CRITICAL: Forbidden em dash detected in output for ${filePath}`);
  }
  fs.writeFileSync(filePath, jsonStr, 'utf8');
  console.log(`Wrote ${filePath} (${jsonStr.length} bytes, ${data.items ? data.items.length + ' items' : data.lootTables.length + ' loot tables'})`);
}

// -------------------------------------------------------------
// ITEMS: Weapons, Armor, Shields, Consumables, Tools, Quest, Valuables
// -------------------------------------------------------------
const items = {
  items: [
    // 1. WEAPONS - SWORDS, AXES, BOWS, DAGGERS, M在這裡
    {
      id: "item_nr_iron_broadsword",
      name: "Northern Iron Broadsword",
      type: "weapon",
      slot: "main_hand",
      rarity: "common",
      damage: "1d8",
      damageType: "slashing",
      valueDrachmae: 18,
      weightKg: 2.2,
      category: "weapon",
      description: "A wide, heavy double-edged broadsword forged from Valenfrost river-iron. Reliable and deadly in the hands of a hold warrior."
    },
    {
      id: "item_nr_honed_iron_broadsword",
      name: "Honed Iron Broadsword",
      type: "weapon",
      slot: "main_hand",
      rarity: "uncommon",
      damage: "1d8+1",
      damageType: "slashing",
      valueDrachmae: 30,
      weightKg: 2.2,
      category: "weapon",
      description: "Carefully whetted with coarse mountain stone. Its mirror edge cleaves through wolf fur and quilted gambesons."
    },
    {
      id: "item_nr_silver_waraxe",
      name: "Silver-Inlaid Waraxe",
      type: "weapon",
      slot: "main_hand",
      rarity: "uncommon",
      damage: "1d10",
      damageType: "slashing",
      valueDrachmae: 45,
      weightKg: 2.8,
      category: "weapon",
      description: "Forged with dwarven silver inlay along the bearded beard-edge. Undead wights and draugr shriek when struck by its silver bite."
    },
    {
      id: "item_nr_ash_longbow",
      name: "Rime-Wood Longbow",
      type: "weapon",
      slot: "two_hand",
      rarity: "common",
      damage: "1d8",
      damageType: "piercing",
      valueDrachmae: 22,
      weightKg: 1.5,
      category: "weapon",
      description: "A tall yew-backed ash recurve crafted by scout bowyers. Penetrates heavy hides at long distances."
    },
    {
      id: "item_nr_hunting_dagger",
      name: "Scout's Hunting Dagger",
      type: "weapon",
      slot: "main_hand",
      rarity: "common",
      damage: "1d4+1",
      damageType: "piercing",
      valueDrachmae: 10,
      weightKg: 0.6,
      category: "weapon",
      description: "A sharp bone-hilted utility blade used for field dressing game, cutting ropes, and silent throat-strikes."
    },
    {
      id: "item_nr_huscarl_battleaxe",
      name: "Huscarl's Greataxe",
      type: "weapon",
      slot: "two_hand",
      rarity: "rare",
      damage: "1d12",
      damageType: "slashing",
      valueDrachmae: 65,
      weightKg: 4.0,
      category: "weapon",
      description: "A massive two-handed executioner's greataxe carried by the Jarl's personal huscarl guard. Devastating on charging foes."
    },
    {
      id: "item_nr_frost_runeblade",
      name: "Rune-Carved Glacial Blade",
      type: "weapon",
      slot: "main_hand",
      rarity: "rare",
      damage: "1d8+2",
      damageType: "slashing",
      valueDrachmae: 95,
      weightKg: 2.3,
      category: "weapon",
      description: "Etched with archaic winter runes that glow pale blue. Wreathed in frost vapors that numb enemy parrying arms."
    },
    {
      id: "item_nr_wyrmtooth_spear",
      name: "Wyrmtooth Boar Spear",
      type: "weapon",
      slot: "main_hand",
      rarity: "rare",
      damage: "1d8+2",
      damageType: "piercing",
      valueDrachmae: 85,
      weightKg: 2.7,
      category: "weapon",
      description: "Tipped with the fossilized tooth of a young ice drake. Can pierce through troll hide and scale with frightening ease."
    },
    {
      id: "item_nr_relic_dragonbane",
      name: "Fang of the Star-Father",
      type: "weapon",
      slot: "main_hand",
      rarity: "unique",
      damage: "2d8+3",
      damageType: "slashing",
      valueDrachmae: 250,
      weightKg: 3.0,
      category: "weapon",
      description: "The ancient ancestral blade of High King Valen, forged from pure meteoric sky-iron. Glows like falling lightning in the presence of wyrms."
    },
    {
      id: "item_nr_cabal_stiletto",
      name: "Whispering Stiletto",
      type: "weapon",
      slot: "main_hand",
      rarity: "uncommon",
      damage: "1d4+2",
      damageType: "piercing",
      valueDrachmae: 35,
      weightKg: 0.5,
      category: "weapon",
      description: "A needle-thin black steel stiletto favoured by the cutpurses of Mistglen for slipping past armor seams."
    },

    // 2. SHIELDS
    {
      id: "item_nr_huscarl_roundshield",
      name: "Huscarl's Reinforced Roundshield",
      type: "shield",
      slot: "off_hand",
      rarity: "common",
      acBonus: 2,
      valueDrachmae: 15,
      weightKg: 3.5,
      category: "shield",
      description: "Hardened pine planks bound in iron rim with a heavy central boss. Blunts heavy axe strikes and arrows."
    },
    {
      id: "item_nr_silver_crest_shield",
      name: "Silver-Crested Tower Shield",
      type: "shield",
      slot: "off_hand",
      rarity: "rare",
      acBonus: 3,
      valueDrachmae: 60,
      weightKg: 5.5,
      category: "shield",
      description: "A towering dwarven heater shield bearing the silver pickaxe sigil of the Silver Kin. Repels physical blows and magical frost."
    },

    // 3. ARMOR, HELMETS, BOOTS, CLOAKS
    {
      id: "item_nr_iron_ringmail",
      name: "Northern Ringmail Hauberk",
      type: "armor",
      slot: "armor",
      rarity: "common",
      acBonus: 4,
      valueDrachmae: 40,
      weightKg: 10.0,
      category: "armor",
      description: "Interlinked iron rings riveted over thick quilted wool. Standard field panoply of the hold garrison."
    },
    {
      id: "item_nr_scout_leather_coat",
      name: "Ranger's Waxed Leather Coat",
      type: "armor",
      slot: "armor",
      rarity: "common",
      acBonus: 2,
      valueDrachmae: 25,
      weightKg: 4.5,
      category: "armor",
      description: "Treated elk-skin leather reinforced with horn plates. Silent, flexible, and weather-resistant."
    },
    {
      id: "item_nr_skald_ringmail",
      name: "Skald's Silver-Threaded Ringmail",
      type: "armor",
      slot: "armor",
      rarity: "uncommon",
      acBonus: 3,
      valueDrachmae: 55,
      weightKg: 7.5,
      category: "armor",
      description: "Supple chain hauberk interwoven with silver wire, tailored for swift chanting and blade-dancing."
    },
    {
      id: "item_nr_wolfskin_mantle",
      name: "Winter Wolf Warm-Cloak",
      type: "armor",
      slot: "cloak",
      rarity: "common",
      acBonus: 1,
      valueDrachmae: 20,
      weightKg: 1.8,
      category: "armor",
      description: "A thick pelt of snowy white mountain wolf lined with wool. Keeps bitter winds from chilling muscle and bone."
    },
    {
      id: "item_nr_dwarven_plate",
      name: "Silver Kin Forged Cuirass",
      type: "armor",
      slot: "armor",
      rarity: "rare",
      acBonus: 6,
      valueDrachmae: 120,
      weightKg: 14.0,
      category: "armor",
      description: "Flawlessly articulated heavy breastplate forged from tempered coal-steel by clan smiths in the Blackforge."
    },
    {
      id: "item_nr_iron_spangenhelm",
      name: "Northern Spangenhelm",
      type: "armor",
      slot: "helmet",
      rarity: "common",
      acBonus: 1,
      valueDrachmae: 22,
      weightKg: 2.0,
      category: "armor",
      description: "Conical iron helm fitted with an ocular spectacle mask and protective cheek plates."
    },
    {
      id: "item_nr_leather_boots",
      name: "Fur-Lined Mountain Boots",
      type: "armor",
      slot: "boots",
      rarity: "common",
      acBonus: 0,
      valueDrachmae: 12,
      weightKg: 1.5,
      category: "boots",
      description: "Heavy treaded leather boots fitted with iron cleats for traversing frozen mountain scree."
    },

    // 4. CONSUMABLES & FOOD & MEDICINE
    {
      id: "item_nr_smoked_venison",
      name: "Salt-Cured Mountain Venison",
      type: "consumable",
      category: "food",
      rarity: "common",
      valueDrachmae: 3,
      weightKg: 0.5,
      ration: true,
      restoreStamina: 6,
      restoreHealth: 4,
      description: "Hearty strips of venison smoked over pine embers. Sustains hunters on grueling climbs."
    },
    {
      id: "item_nr_smoked_salmon",
      name: "Cold-Smoked Fjord Salmon",
      type: "consumable",
      category: "food",
      rarity: "common",
      valueDrachmae: 4,
      weightKg: 0.4,
      ration: true,
      restoreStamina: 7,
      restoreHealth: 5,
      description: "Rich, oily pink salmon cured in juniper salt. A favorite of Mistglen boatmen."
    },
    {
      id: "item_nr_hard_tack_bread",
      name: "Caravan Hardtack Biscuit",
      type: "consumable",
      category: "food",
      rarity: "common",
      valueDrachmae: 2,
      weightKg: 0.3,
      ration: true,
      restoreStamina: 4,
      description: "Dense, dry barley biscuits baked to endure months in pack sacks without spoiling."
    },
    {
      id: "item_nr_spiced_mead_flagon",
      name: "Valenfrost Spiced Juniper Mead",
      type: "consumable",
      category: "drink",
      rarity: "common",
      valueDrachmae: 6,
      weightKg: 1.0,
      restoreHealth: 8,
      restoreMorale: 2,
      description: "Sweet, intoxicating golden mead fermented with wild clover honey and crushed mountain juniper."
    },
    {
      id: "item_nr_stamina_draught",
      name: "Juniper Stamina Cordial",
      type: "consumable",
      category: "potion",
      rarity: "common",
      valueDrachmae: 14,
      weightKg: 0.4,
      restoreStamina: 12,
      description: "A brisk herbal draught distilled from blue glacier lichen. Clears mental fatigue and restores vigour."
    },
    {
      id: "item_nr_frost_resist_potion",
      name: "Elixir of the Hearthfire",
      type: "consumable",
      category: "potion",
      rarity: "uncommon",
      valueDrachmae: 28,
      weightKg: 0.4,
      restoreHealth: 15,
      description: "A glowing amber brew that fills the veins with gentle warmth, nullifying freezing chill."
    },
    {
      id: "item_nr_potent_restorative",
      name: "Master Alchemist's Restorative",
      type: "consumable",
      category: "potion",
      rarity: "rare",
      valueDrachmae: 50,
      weightKg: 0.4,
      restoreHealth: 25,
      restoreStamina: 15,
      description: "A concentrated dual draught of distilled herbs that knits torn sinew and mends cracked bone."
    },
    {
      id: "item_nr_mire_venom_gland",
      name: "Mire Viper Venom Gland",
      type: "consumable",
      category: "poison",
      rarity: "common",
      valueDrachmae: 12,
      weightKg: 0.3,
      description: "A harvested venom sac from a marsh viper. Can be smeared upon blade edges to inflict lethal poisoning."
    },

    // 5. TOOLS & ADVENTURING GEAR
    {
      id: "item_nr_dwarven_lockpicks",
      name: "Dwarven Tension Lockpicks",
      type: "tool",
      category: "tool",
      rarity: "common",
      valueDrachmae: 25,
      weightKg: 0.4,
      description: "A roll of finely tempered steel picks and torsion wrenches crafted for bypassing heavy iron tumblers."
    },
    {
      id: "item_nr_mountain_torch",
      name: "Pitch-Soaked Pine Torch",
      type: "tool",
      category: "tool",
      rarity: "common",
      valueDrachmae: 2,
      weightKg: 0.8,
      description: "Burns with a bright, smoky resin flare for hours inside damp barrows and caverns."
    },
    {
      id: "item_nr_mountain_whetstone",
      name: "Granite Mountain Whetstone",
      type: "tool",
      category: "tool",
      rarity: "common",
      valueDrachmae: 8,
      weightKg: 0.6,
      description: "Fine-grained whetstone quarried from high peaks. Perfect for putting a razor edge on iron and steel weapons."
    },
    {
      id: "item_nr_smithing_hammer",
      name: "Master Smith's Rounding Hammer",
      type: "tool",
      category: "tool",
      rarity: "common",
      valueDrachmae: 15,
      weightKg: 2.0,
      description: "Heavy balance hammer required for forging weapons and shaping plates at an anvil."
    },
    {
      id: "item_nr_alembic_kit",
      name: "Portable Copper Alembic Kit",
      type: "tool",
      category: "tool",
      rarity: "common",
      valueDrachmae: 20,
      weightKg: 1.5,
      description: "Tubing, glass phials, and a copper retort for distilling mountain herbs and monster extracts."
    },
    {
      id: "item_nr_leather_tanner_kit",
      name: "Furrier's Scraper & Awl Set",
      type: "tool",
      category: "tool",
      rarity: "common",
      valueDrachmae: 15,
      weightKg: 1.2,
      description: "Curved scrapers, bone needles, and sinew thread used to work pelts and beast hides."
    },
    {
      id: "item_nr_frost_rune_focus",
      name: "Carved Obsidian Rune Focus",
      type: "relic",
      slot: "ring",
      rarity: "uncommon",
      valueDrachmae: 45,
      weightKg: 0.2,
      description: "A polished volcanic glass token inscribed with the storm glyph of Torvald. Enhances spellcasting resonance."
    },

    // 6. KEYS & RUNIC ARTEFACTS & QUEST OBJECTS
    {
      id: "item_nr_key_grimstone_vault",
      name: "Iron Key of Grimstone Vault",
      type: "key",
      category: "key",
      rarity: "uncommon",
      valueDrachmae: 1,
      weightKg: 0.1,
      description: "A heavy, square-toothed iron key recovered from the dwarven overseer's office in Grimstone Mine."
    },
    {
      id: "item_nr_key_frostmere_library",
      name: "Silver Key of the Winter Spire",
      type: "key",
      category: "key",
      rarity: "uncommon",
      valueDrachmae: 1,
      weightKg: 0.1,
      description: "A delicately chased silver key granting access to the locked arcanum vaults of Frostmere Spire."
    },
    {
      id: "item_nr_key_barrow_sanctum",
      name: "Ancient Runic Barrow Key",
      type: "key",
      category: "key",
      rarity: "rare",
      valueDrachmae: 1,
      weightKg: 0.2,
      description: "Carved from petrified bog oak and tipped with bronze. Unlocks the inner burial crypt of Skallagrim."
    },
    {
      id: "item_nr_star_key_alpha",
      name: "Star-Key of the Eastern Peak",
      type: "relic",
      category: "quest",
      rarity: "unique",
      valueDrachmae: 100,
      weightKg: 0.5,
      description: "First of the three celestial runic tablets forged by High King Valen to seal the crater of Mount Wyrmfang."
    },
    {
      id: "item_nr_star_key_beta",
      name: "Star-Key of the Glacial Spire",
      type: "relic",
      category: "quest",
      rarity: "unique",
      valueDrachmae: 100,
      weightKg: 0.5,
      description: "Second of the three celestial runic tablets, safeguarded within the archives of Frostmere Spire."
    },
    {
      id: "item_nr_star_key_gamma",
      name: "Star-Key of the Sunken Barrow",
      type: "relic",
      category: "quest",
      rarity: "unique",
      valueDrachmae: 100,
      weightKg: 0.5,
      description: "Third of the three celestial runic tablets, entombed with Chieftain Skallagrim in the deep crypts."
    },
    {
      id: "item_nr_jarl_heirloom_ring",
      name: "Signet of the Wolf Crest",
      type: "jewelry",
      slot: "ring",
      rarity: "rare",
      valueDrachmae: 70,
      weightKg: 0.1,
      description: "Stolen from Jarl Sigurd's chambers. Bearing the roaring wolf head of Valenfrost in hammered gold."
    },
    {
      id: "item_nr_elena_stolen_ledger",
      name: "Cabal's Smuggling Ledger",
      type: "lore_item",
      category: "quest",
      rarity: "uncommon",
      valueDrachmae: 15,
      weightKg: 0.4,
      description: "A cipher-filled oilcloth ledger recording bribes, warehouse caches, and shipments between Mistglen and Valenfrost."
    },

    // 7. VALUABLES, COINS & TREASURES
    {
      id: "item_nr_silver_chalice",
      name: "Engraved Ancient Silver Chalice",
      type: "valuable",
      category: "treasure",
      rarity: "uncommon",
      valueDrachmae: 35,
      weightKg: 0.8,
      description: "An antique drinking vessel adorned with intertwined knotwork, recovered from a burial barrow."
    },
    {
      id: "item_nr_amber_necklace",
      name: "Baltic Amber Bead Necklace",
      type: "jewelry",
      slot: "ring",
      rarity: "uncommon",
      valueDrachmae: 40,
      weightKg: 0.3,
      description: "Golden translucent fossil resin beads washed ashore along the northern sea coast."
    },
    {
      id: "item_nr_garnet_brooch",
      name: "Garnet-Studded Cloak Clasp",
      type: "jewelry",
      slot: "ring",
      rarity: "rare",
      valueDrachmae: 65,
      weightKg: 0.2,
      description: "A bronze disk brooch set with deep red cabochon garnets in geometric clan patterns."
    }
  ]
};

// -------------------------------------------------------------
// LOOT TABLES
// -------------------------------------------------------------
const lootTables = {
  lootTables: [
    {
      id: "lt_nr_wolf_pack",
      name: "Wild Wolf Pack Spoils",
      entries: [
        { itemId: "mat_nr_wolf_pelt", chance: 0.75, quantityMin: 1, quantityMax: 2 },
        { itemId: "item_nr_smoked_venison", chance: 0.4, quantityMin: 1, quantityMax: 1 }
      ],
      guaranteed: ["mat_nr_wolf_pelt"],
      drachmaeMin: 0,
      drachmaeMax: 2
    },
    {
      id: "lt_nr_frost_troll",
      name: "Mountain Frost Troll Spoils",
      entries: [
        { itemId: "mat_nr_frost_troll_hide", chance: 0.85, quantityMin: 1, quantityMax: 2 },
        { itemId: "mat_nr_bog_iron", chance: 0.5, quantityMin: 1, quantityMax: 2 },
        { itemId: "item_nr_smoked_venison", chance: 0.6, quantityMin: 1, quantityMax: 2 }
      ],
      guaranteed: ["mat_nr_frost_troll_hide"],
      drachmaeMin: 8,
      drachmaeMax: 20
    },
    {
      id: "lt_nr_mire_bandit",
      name: "Drowned Mire Bandit Spoils",
      entries: [
        { itemId: "item_nr_hunting_dagger", chance: 0.35, quantityMin: 1, quantityMax: 1 },
        { itemId: "item_nr_hard_tack_bread", chance: 0.5, quantityMin: 1, quantityMax: 2 },
        { itemId: "item_nr_mire_venom_gland", chance: 0.3, quantityMin: 1, quantityMax: 1 },
        { itemId: "item_nr_dwarven_lockpicks", chance: 0.2, quantityMin: 1, quantityMax: 1 }
      ],
      guaranteed: [],
      drachmaeMin: 4,
      drachmaeMax: 15
    },
    {
      id: "lt_nr_draugr_warrior",
      name: "Ancient Barrow Draugr Spoils",
      entries: [
        { itemId: "mat_nr_silver_ingot", chance: 0.4, quantityMin: 1, quantityMax: 1 },
        { itemId: "item_nr_mountain_whetstone", chance: 0.3, quantityMin: 1, quantityMax: 1 },
        { itemId: "item_nr_silver_chalice", chance: 0.15, quantityMin: 1, quantityMax: 1 }
      ],
      guaranteed: [],
      drachmaeMin: 5,
      drachmaeMax: 18
    },
    {
      id: "lt_nr_boss_skallagrim",
      name: "Barrow Lord Skallagrim's Cache",
      entries: [
        { itemId: "item_nr_silver_waraxe", chance: 1.0, quantityMin: 1, quantityMax: 1 },
        { itemId: "item_nr_garnet_brooch", chance: 1.0, quantityMin: 1, quantityMax: 1 },
        { itemId: "item_nr_star_key_gamma", chance: 1.0, quantityMin: 1, quantityMax: 1 }
      ],
      guaranteed: ["item_nr_star_key_gamma", "item_nr_silver_waraxe"],
      drachmaeMin: 50,
      drachmaeMax: 90
    },
    {
      id: "lt_nr_boss_vyr",
      name: "Wyrmfang Crater Spoils",
      entries: [
        { itemId: "item_nr_relic_dragonbane", chance: 1.0, quantityMin: 1, quantityMax: 1 },
        { itemId: "mat_nr_wyrm_blood_vial", chance: 1.0, quantityMin: 1, quantityMax: 2 },
        { itemId: "mat_nr_sky_iron_ore", chance: 1.0, quantityMin: 2, quantityMax: 3 }
      ],
      guaranteed: ["item_nr_relic_dragonbane", "mat_nr_wyrm_blood_vial"],
      drachmaeMin: 100,
      drachmaeMax: 200
    },
    {
      id: "lt_nr_chest_common",
      name: "Wilderness Crate Spoils",
      entries: [
        { itemId: "item_nr_smoked_venison", chance: 0.6, quantityMin: 1, quantityMax: 2 },
        { itemId: "item_nr_mountain_torch", chance: 0.5, quantityMin: 1, quantityMax: 1 },
        { itemId: "mat_nr_bog_iron", chance: 0.4, quantityMin: 1, quantityMax: 2 }
      ],
      guaranteed: [],
      drachmaeMin: 3,
      drachmaeMax: 12
    },
    {
      id: "lt_nr_chest_dwarven_vault",
      name: "Grimstone Dwarven Vault",
      entries: [
        { itemId: "mat_nr_silver_ingot", chance: 1.0, quantityMin: 2, quantityMax: 4 },
        { itemId: "item_nr_silver_crest_shield", chance: 0.7, quantityMin: 1, quantityMax: 1 },
        { itemId: "item_nr_potent_restorative", chance: 0.8, quantityMin: 1, quantityMax: 2 }
      ],
      guaranteed: ["mat_nr_silver_ingot"],
      drachmaeMin: 40,
      drachmaeMax: 80
    }
  ]
};

writeJson(path.join(OUT_DIR, 'items.json'), items);
writeJson(path.join(OUT_DIR, 'loot_tables.json'), lootTables);

console.log("Stage 3 complete: Items and Loot Tables.");

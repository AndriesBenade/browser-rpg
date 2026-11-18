// scripts/generator/generate_npcs_creatures.js
// Generates characters.json, creatures.json, encounters.json for The Northern Realms.
// Adheres strictly to: NO em dashes (U+2014), valid equipment and inventory item IDs,
// merchants, companions, guards, creatures with proper vitals/actions/xp, and boss phases.

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
  console.log(`Wrote ${filePath} (${jsonStr.length} bytes, ${data.characters ? data.characters.length + ' characters' : data.creatures ? data.creatures.length + ' creatures' : data.encounters.length + ' encounters'})`);
}

// -------------------------------------------------------------
// 1. CHARACTERS (Living NPCs, Merchants, Companions, Rulers)
// -------------------------------------------------------------
const characters = {
  characters: [
    // VALENFROST HIGHLANDS
    {
      id: "npc_nr_gate_captain_tor",
      name: "Captain Tor the Stalwart",
      title: "Captain of the Gate Guard",
      locationId: "loc_nr_valenfrost_gates",
      factionId: "faction_nr_frostpeak_watch",
      isGuard: true,
      dialogueId: "dlg_nr_gate_captain_tor",
      description: "A battle-scarred veteran with a graying beard, wearing heavy iron ringmail and leaning on an ash spear.",
      vitals: { health: 32, maxHealth: 32, stamina: 18, maxStamina: 18 },
      combatStats: { armorClass: 16, attackBonus: 5, damage: "1d8+3" },
      equipment: {
        main_hand: "item_nr_iron_broadsword",
        off_hand: "item_nr_huscarl_roundshield",
        armor: "item_nr_iron_ringmail",
        helmet: "item_nr_iron_spangenhelm"
      },
      inventory: ["item_nr_smoked_venison"],
      lootTableId: "lt_nr_chest_common"
    },
    {
      id: "npc_nr_jarl_sigurd",
      name: "Jarl Sigurd Wolf-Mantle",
      title: "Ruler of Valenfrost Hold",
      locationId: "loc_nr_valenfrost_hall",
      factionId: "faction_nr_frostpeak_watch",
      dialogueId: "dlg_nr_jarl_sigurd",
      description: "A tall, imposing ruler draped in snowy wolf pelts, seated upon the carved throne of High King Valen.",
      vitals: { health: 45, maxHealth: 45, stamina: 25, maxStamina: 25 },
      combatStats: { armorClass: 17, attackBonus: 7, damage: "1d10+4" },
      equipment: {
        main_hand: "item_nr_silver_waraxe",
        armor: "item_nr_dwarven_plate",
        cloak: "item_nr_wolfskin_mantle"
      },
      inventory: ["item_nr_spiced_mead_flagon"],
      lootTableId: "lt_nr_chest_common"
    },
    {
      id: "npc_nr_skald_einar",
      name: "Einar the Silver-Chanter",
      title: "Court Skald of the Hold",
      locationId: "loc_nr_valenfrost_hall",
      factionId: "faction_nr_iron_covenant",
      dialogueId: "dlg_nr_skald_einar",
      description: "A charismatic poet with silver rings woven through his braided hair, carrying a pine harp.",
      vitals: { health: 22, maxHealth: 22, stamina: 16, maxStamina: 16 },
      combatStats: { armorClass: 13, attackBonus: 3, damage: "1d4+1" },
      equipment: {
        main_hand: "item_nr_hunting_dagger",
        armor: "item_nr_skald_ringmail"
      },
      inventory: ["item_nr_spiced_mead_flagon"],
      lootTableId: "lt_nr_chest_common"
    },
    {
      id: "npc_nr_merchant_astrid",
      name: "Astrid the Far-Trader",
      title: "Caravan Provisioner",
      locationId: "loc_nr_valenfrost_market",
      factionId: "faction_nr_frostpeak_watch",
      isMerchant: true,
      dialogueId: "dlg_nr_merchant_astrid",
      description: "A shrewd merchant in thick woolens, surrounded by barrels of salted fish, iron ingots, and travel kits.",
      vitals: { health: 20, maxHealth: 20, stamina: 12, maxStamina: 12 },
      combatStats: { armorClass: 12, attackBonus: 2, damage: "1d4" },
      equipment: {
        main_hand: "item_nr_hunting_dagger"
      },
      inventory: [],
      merchantInventory: [
        { itemId: "item_nr_iron_broadsword", price: 18, quantity: 2 },
        { itemId: "item_nr_ash_longbow", price: 22, quantity: 1 },
        { itemId: "item_nr_hunting_dagger", price: 10, quantity: 3 },
        { itemId: "item_nr_huscarl_roundshield", price: 15, quantity: 2 },
        { itemId: "item_nr_iron_ringmail", price: 40, quantity: 1 },
        { itemId: "item_nr_scout_leather_coat", price: 25, quantity: 2 },
        { itemId: "item_nr_mountain_torch", price: 2, quantity: 10 },
        { itemId: "item_nr_mountain_whetstone", price: 8, quantity: 3 },
        { itemId: "item_nr_dwarven_lockpicks", price: 25, quantity: 2 },
        { itemId: "item_nr_smoked_venison", price: 3, quantity: 8 },
        { itemId: "item_nr_hard_tack_bread", price: 2, quantity: 12 },
        { itemId: "item_nr_stamina_draught", price: 14, quantity: 4 }
      ]
    },
    {
      id: "npc_nr_smith_bjorn",
      name: "Bjorn Hearth-Hammer",
      title: "Master Hold Blacksmith",
      locationId: "loc_nr_valenfrost_smithy",
      factionId: "faction_nr_frostpeak_watch",
      isMerchant: true,
      dialogueId: "dlg_nr_smith_bjorn",
      description: "A burly, soot-streaked smith whose muscular arms bear burn scars from decades at the anvil.",
      vitals: { health: 36, maxHealth: 36, stamina: 22, maxStamina: 22 },
      combatStats: { armorClass: 14, attackBonus: 6, damage: "1d8+3" },
      equipment: {
        main_hand: "item_nr_smithing_hammer",
        armor: "item_nr_iron_ringmail"
      },
      inventory: [],
      merchantInventory: [
        { itemId: "mat_nr_bog_iron", price: 8, quantity: 6 },
        { itemId: "mat_nr_hardened_pine", price: 4, quantity: 8 },
        { itemId: "item_nr_smithing_hammer", price: 15, quantity: 2 },
        { itemId: "item_nr_mountain_whetstone", price: 8, quantity: 4 },
        { itemId: "item_nr_iron_broadsword", price: 18, quantity: 3 },
        { itemId: "item_nr_huscarl_roundshield", price: 15, quantity: 2 }
      ]
    },
    {
      id: "npc_nr_veteran_karl",
      name: "Karl the Iron-Ribbed",
      title: "Huscarl Shield-Master",
      locationId: "loc_nr_valenfrost_barracks",
      factionId: "faction_nr_iron_covenant",
      dialogueId: "dlg_nr_veteran_karl",
      description: "A veteran warrior instructor capable of joining the player as a mercenary companion.",
      vitals: { health: 40, maxHealth: 40, stamina: 24, maxStamina: 24 },
      combatStats: { armorClass: 17, attackBonus: 6, damage: "1d10+3" },
      equipment: {
        main_hand: "item_nr_huscarl_battleaxe",
        armor: "item_nr_iron_ringmail",
        helmet: "item_nr_iron_spangenhelm"
      },
      inventory: ["item_nr_smoked_venison"],
      companion: {
        hireCost: 35,
        days: 5,
        joinText: "My battleaxe is yours, friend. Let us give the barrow beasts a taste of northern steel.",
        perksText: "+2 Armour Class while traveling with Karl; shield-block support in melee combat.",
        perks: { combatBonus: 1 }
      }
    },

    // WHISPERING WOODS
    {
      id: "npc_nr_trapper_ulf",
      name: "Ulf White-Wolf",
      title: "Taiga Guide & Furrier",
      locationId: "loc_nr_hunters_camp",
      factionId: "faction_nr_frostpeak_watch",
      isMerchant: true,
      dialogueId: "dlg_nr_trapper_ulf",
      description: "A lean tracker cloaked in white wolf pelts with keen amber eyes and a strung recurve bow.",
      vitals: { health: 28, maxHealth: 28, stamina: 20, maxStamina: 20 },
      combatStats: { armorClass: 14, attackBonus: 5, damage: "1d8+2" },
      equipment: {
        main_hand: "item_nr_ash_longbow",
        armor: "item_nr_scout_leather_coat",
        cloak: "item_nr_wolfskin_mantle"
      },
      merchantInventory: [
        { itemId: "mat_nr_wolf_pelt", price: 10, quantity: 5 },
        { itemId: "item_nr_ash_longbow", price: 22, quantity: 2 },
        { itemId: "item_nr_smoked_venison", price: 3, quantity: 6 },
        { itemId: "item_nr_leather_tanner_kit", price: 15, quantity: 1 }
      ]
    },

    // MISTGLEN FENS
    {
      id: "npc_nr_boatman_hagan",
      name: "Hagan the Punt-Piler",
      title: "Fen Waterman",
      locationId: "loc_nr_mistglen_docks",
      factionId: "faction_nr_whispering_cabal",
      dialogueId: "dlg_nr_boatman_hagan",
      description: "A quiet, weathered boatman who poles flat-bottomed skiffs through the mist-shrouded canals.",
      vitals: { health: 24, maxHealth: 24, stamina: 18, maxStamina: 18 },
      combatStats: { armorClass: 12, attackBonus: 3, damage: "1d6+1" },
      equipment: {
        main_hand: "item_nr_hunting_dagger"
      },
      inventory: ["item_nr_smoked_salmon"]
    },
    {
      id: "npc_nr_innkeeper_mira",
      name: "Mira Cold-Spring",
      title: "Mistress of the Drowned Lantern",
      locationId: "loc_nr_drowned_lantern_tavern",
      factionId: "faction_nr_whispering_cabal",
      isMerchant: true,
      dialogueId: "dlg_nr_innkeeper_mira",
      description: "A shrewd innkeeper who hears every rumor carried down the canals and sells strong fen ale.",
      vitals: { health: 20, maxHealth: 20, stamina: 14, maxStamina: 14 },
      combatStats: { armorClass: 11, attackBonus: 2, damage: "1d4" },
      equipment: {
        main_hand: "item_nr_hunting_dagger"
      },
      merchantInventory: [
        { itemId: "item_nr_smoked_salmon", price: 4, quantity: 8 },
        { itemId: "item_nr_hard_tack_bread", price: 2, quantity: 10 },
        { itemId: "item_nr_spiced_mead_flagon", price: 6, quantity: 6 },
        { itemId: "item_nr_mountain_torch", price: 2, quantity: 5 }
      ]
    },
    {
      id: "npc_nr_cabal_leader_valeria",
      name: "Valeria Shadow-Gilded",
      title: "Mistress of the Whispering Cabal",
      locationId: "loc_nr_cabal_cistern",
      factionId: "faction_nr_whispering_cabal",
      dialogueId: "dlg_nr_cabal_leader_valeria",
      description: "A poised rogue in midnight-blue velvet and supple leather, twirling a polished stiletto.",
      vitals: { health: 34, maxHealth: 34, stamina: 24, maxStamina: 24 },
      combatStats: { armorClass: 16, attackBonus: 7, damage: "1d6+4" },
      equipment: {
        main_hand: "item_nr_cabal_stiletto",
        armor: "item_nr_scout_leather_coat",
        boots: "item_nr_leather_boots"
      },
      inventory: ["item_nr_dwarven_lockpicks", "item_nr_mire_venom_gland"]
    },
    {
      id: "npc_nr_bandit_captain_malik",
      name: "Malik the Drowned",
      title: "Marauder Warlord",
      locationId: "loc_nr_bandit_redoubt",
      factionId: "faction_nr_fen_bandits",
      dialogueId: "dlg_nr_bandit_captain_malik",
      description: "A hulking deserter in dented ringmail with cold dead eyes, wielding a barbed broadsword.",
      vitals: { health: 42, maxHealth: 42, stamina: 20, maxStamina: 20 },
      combatStats: { armorClass: 15, attackBonus: 6, damage: "1d8+3" },
      equipment: {
        main_hand: "item_nr_iron_broadsword",
        off_hand: "item_nr_huscarl_roundshield",
        armor: "item_nr_iron_ringmail"
      },
      inventory: ["item_nr_key_barrow_sanctum", "item_nr_hard_tack_bread"],
      lootTableId: "lt_nr_mire_bandit"
    },
    {
      id: "npc_nr_bog_witch_morrigan",
      name: "Morrigan the Peat-Mother",
      title: "Bog Seer & Alchemist",
      locationId: "loc_nr_witch_hut",
      factionId: "faction_nr_whispering_cabal",
      isMerchant: true,
      dialogueId: "dlg_nr_bog_witch_morrigan",
      description: "An ancient crone wrapped in crow feathers whose milky blind eyes see through the thickest mists.",
      vitals: { health: 26, maxHealth: 26, stamina: 18, maxStamina: 18 },
      combatStats: { armorClass: 12, attackBonus: 3, damage: "1d4+2" },
      equipment: {
        main_hand: "item_nr_hunting_dagger"
      },
      merchantInventory: [
        { itemId: "mat_nr_frost_lichen", price: 5, quantity: 8 },
        { itemId: "item_nr_mire_venom_gland", price: 12, quantity: 4 },
        { itemId: "item_nr_frost_resist_potion", price: 28, quantity: 3 },
        { itemId: "item_nr_alembic_kit", price: 20, quantity: 1 }
      ]
    },

    // GRIMSTONE CRAGS
    {
      id: "npc_nr_dwarf_warden_durn",
      name: "Durn Silver-Shield",
      title: "Gate Warden of Clan Silver-Kin",
      locationId: "loc_nr_grimstone_gates",
      factionId: "faction_nr_silver_kin",
      isGuard: true,
      dialogueId: "dlg_nr_dwarf_warden_durn",
      description: "A broad-shouldered dwarf in burnished scale armor clutching a heavy silver-crested tower shield.",
      vitals: { health: 40, maxHealth: 40, stamina: 20, maxStamina: 20 },
      combatStats: { armorClass: 17, attackBonus: 5, damage: "1d10+2" },
      equipment: {
        main_hand: "item_nr_silver_waraxe",
        off_hand: "item_nr_silver_crest_shield",
        armor: "item_nr_dwarven_plate"
      },
      inventory: ["item_nr_hard_tack_bread"]
    },
    {
      id: "npc_nr_dwarf_overseer_thrain",
      name: "Overseer Thrain Iron-Brow",
      title: "Chief Mine Engineer",
      locationId: "loc_nr_grimstone_delve",
      factionId: "faction_nr_silver_kin",
      dialogueId: "dlg_nr_dwarf_overseer_thrain",
      description: "A gruff mining engineer checking ore manifests with a soot-stained parchment and copper calipers.",
      vitals: { health: 34, maxHealth: 34, stamina: 18, maxStamina: 18 },
      combatStats: { armorClass: 15, attackBonus: 4, damage: "1d8+2" },
      equipment: {
        main_hand: "item_nr_smithing_hammer",
        armor: "item_nr_iron_ringmail"
      },
      inventory: ["mat_nr_silver_ingot"]
    },
    {
      id: "npc_nr_blackforge_master_helga",
      name: "Helga Anvil-Mother",
      title: "Chief Runesmith of the Blackforge",
      locationId: "loc_nr_blackforge",
      factionId: "faction_nr_silver_kin",
      isMerchant: true,
      dialogueId: "dlg_nr_blackforge_master_helga",
      description: "A legendary dwarf smith whose silver beard is bound with gold clasps, standing over roaring magma hearths.",
      vitals: { health: 42, maxHealth: 42, stamina: 26, maxStamina: 26 },
      combatStats: { armorClass: 16, attackBonus: 7, damage: "1d10+4" },
      equipment: {
        main_hand: "item_nr_smithing_hammer",
        armor: "item_nr_dwarven_plate"
      },
      merchantInventory: [
        { itemId: "mat_nr_silver_ingot", price: 25, quantity: 6 },
        { itemId: "mat_nr_sky_iron_ore", price: 75, quantity: 2 },
        { itemId: "item_nr_silver_waraxe", price: 45, quantity: 2 },
        { itemId: "item_nr_silver_crest_shield", price: 60, quantity: 1 },
        { itemId: "item_nr_dwarven_plate", price: 120, quantity: 1 }
      ]
    },

    // FROSTPEAK GLACIERS & ARCANUM
    {
      id: "npc_nr_archmage_kallan",
      name: "Archmage Kallan Frost-Weaver",
      title: "Grand Magister of the Winter Circle",
      locationId: "loc_nr_spire_frostmere",
      factionId: "faction_nr_circle_of_winter",
      dialogueId: "dlg_nr_archmage_kallan",
      description: "An austere elven mage draped in silver and ermine robes, his staff topped with a pulsing sapphire.",
      vitals: { health: 38, maxHealth: 38, stamina: 30, maxStamina: 30 },
      combatStats: { armorClass: 15, attackBonus: 6, damage: "1d8+3" },
      equipment: {
        main_hand: "item_nr_frost_runeblade",
        off_hand: "item_nr_frost_rune_focus",
        cloak: "item_nr_wolfskin_mantle"
      },
      inventory: ["item_nr_frost_resist_potion", "item_nr_star_key_beta"]
    },
    {
      id: "npc_nr_librarian_freya",
      name: "Freya of the Silver Quill",
      title: "Keeper of the Spire Archives",
      locationId: "loc_nr_frostmere_archives",
      factionId: "faction_nr_circle_of_winter",
      isMerchant: true,
      dialogueId: "dlg_nr_librarian_freya",
      description: "A scholarly archivist surrounded by ancient dragon scrolls and frozen star charts.",
      vitals: { health: 22, maxHealth: 22, stamina: 18, maxStamina: 18 },
      combatStats: { armorClass: 12, attackBonus: 2, damage: "1d4" },
      equipment: {
        main_hand: "item_nr_hunting_dagger"
      },
      merchantInventory: [
        { itemId: "item_nr_frost_rune_focus", price: 45, quantity: 2 },
        { itemId: "item_nr_frost_resist_potion", price: 28, quantity: 4 },
        { itemId: "item_nr_potent_restorative", price: 50, quantity: 2 },
        { itemId: "mat_nr_frost_lichen", price: 5, quantity: 10 }
      ]
    }
  ]
};

// -------------------------------------------------------------
// 2. CREATURES (Wildlife, Predatory Beasts, Undead, Trolls, Dragons)
// -------------------------------------------------------------
const creatures = {
  creatures: [
    {
      id: "creature_nr_timber_wolf",
      name: "Northern White Wolf",
      tier: 1,
      vitals: { health: 14, maxHealth: 14, stamina: 12, maxStamina: 12 },
      combatStats: { armorClass: 13, attackBonus: 3, damage: "1d6+1" },
      xp: 25,
      lootTableId: "lt_nr_wolf_pack",
      loot: [{ itemId: "mat_nr_wolf_pelt", chance: 0.8 }, { itemId: "item_nr_smoked_venison", chance: 0.5 }],
      description: "A muscular white wolf adapted to deep mountain snowdrifts. Hunts in coordinated packs with chilling howls.",
      combatActions: [
        { id: "act_wolf_bite", name: "Ripping Jaws", damage: "1d6+1", type: "melee", telegraph: "bares its yellow fangs and lunges low" },
        { id: "act_wolf_hamstring", name: "Hamstring Takedown", damage: "1d4+2", type: "melee", status: { id: "entangled", rounds: 1 }, telegraph: "circles swiftly behind your flank" }
      ]
    },
    {
      id: "creature_nr_frost_troll",
      name: "Mountain Frost Troll",
      tier: 3,
      vitals: { health: 48, maxHealth: 48, stamina: 20, maxStamina: 20 },
      combatStats: { armorClass: 14, attackBonus: 6, damage: "2d6+3" },
      xp: 75,
      lootTableId: "lt_nr_frost_troll",
      loot: [{ itemId: "mat_nr_frost_troll_hide", chance: 1.0 }, { itemId: "item_nr_smoked_venison", chance: 0.8 }],
      description: "A hulking blue-furred monstrosity with three yellow eyes and stone-hard claws. Feared by miners and mountain travelers.",
      combatActions: [
        { id: "act_troll_slam", name: "Crushing Forearm Smash", damage: "2d6+3", type: "melee", telegraph: "raises both massive fists overhead with a guttural roar" },
        { id: "act_troll_sweep", name: "Glacial Sweep", damage: "1d8+3", type: "melee", status: { id: "stunned", rounds: 1 }, telegraph: "swings its trunk-like arm in a wide, sweeping arc" }
      ]
    },
    {
      id: "creature_nr_mire_bandit_bruiser",
      name: "Drowned Mire Marauder",
      tier: 2,
      vitals: { health: 26, maxHealth: 26, stamina: 14, maxStamina: 14 },
      combatStats: { armorClass: 14, attackBonus: 4, damage: "1d8+2" },
      xp: 45,
      lootTableId: "lt_nr_mire_bandit",
      loot: [{ itemId: "item_nr_hunting_dagger", chance: 0.4 }, { itemId: "item_nr_hard_tack_bread", chance: 0.6 }],
      description: "A desperate cutthroat wearing waterlogged ringmail and wielding a jagged broadsword coated in marsh slime.",
      combatActions: [
        { id: "act_bandit_slash", name: "Foul Water Cut", damage: "1d8+2", type: "melee", telegraph: "steps through the mire with a vicious diagonal slash" },
        { id: "act_bandit_mud_throw", name: "Blinding Peat", damage: "1d4", type: "ranged", status: { id: "confused", rounds: 2 }, telegraph: "scoops up black mud to fling into your eyes" }
      ]
    },
    {
      id: "creature_nr_draugr_wight",
      name: "Ancient Barrow Draugr",
      tier: 2,
      vitals: { health: 30, maxHealth: 30, stamina: 16, maxStamina: 16 },
      combatStats: { armorClass: 15, attackBonus: 5, damage: "1d8+2" },
      xp: 55,
      lootTableId: "lt_nr_draugr_warrior",
      loot: [{ itemId: "mat_nr_silver_ingot", chance: 0.3 }, { itemId: "item_nr_mountain_whetstone", chance: 0.4 }],
      description: "An animated ancestral warrior clad in blackened iron mail, its hollow eyes burning with ghostly blue frost fire.",
      combatActions: [
        { id: "act_draugr_axe", name: "Barrow Cleave", damage: "1d8+2", type: "melee", telegraph: "raises its rusted bearded axe with dry joint clicks" },
        { id: "act_draugr_chill", name: "Grave Chill", damage: "1d6", type: "spell", status: { id: "weakened", rounds: 2 }, telegraph: "exhales a cloud of arctic tomb vapor" }
      ]
    },
    {
      id: "creature_nr_boss_skallagrim",
      name: "Chieftain Skallagrim the Undying",
      tier: 4,
      boss: true,
      vitals: { health: 80, maxHealth: 80, stamina: 30, maxStamina: 30 },
      combatStats: { armorClass: 17, attackBonus: 8, damage: "1d10+4" },
      xp: 150,
      lootTableId: "lt_nr_boss_skallagrim",
      loot: [{ itemId: "item_nr_star_key_gamma", chance: 1.0 }, { itemId: "item_nr_silver_waraxe", chance: 1.0 }],
      description: "The ancient First-Age warlord, risen from his slate sarcophagus with a massive silver greataxe and crowned with frost.",
      combatActions: [
        { id: "act_skallagrim_frenzy", name: "Ancestral Rage", damage: "2d8+4", type: "melee", telegraph: "bellows an ancient war-chant as rime crackles across his axe" },
        { id: "act_skallagrim_howl", name: "Tomb Howl", damage: "1d8", type: "spell", status: { id: "frightened", rounds: 2 }, telegraph: "screams with the voice of a hundred entombed dead" }
      ]
    },
    {
      id: "creature_nr_boss_vyr",
      name: "Vyr the Ancient Frost Wyrm",
      tier: 5,
      boss: true,
      vitals: { health: 140, maxHealth: 140, stamina: 40, maxStamina: 40 },
      combatStats: { armorClass: 18, attackBonus: 10, damage: "2d10+5" },
      xp: 350,
      lootTableId: "lt_nr_boss_vyr",
      loot: [{ itemId: "item_nr_relic_dragonbane", chance: 1.0 }, { itemId: "mat_nr_wyrm_blood_vial", chance: 1.0 }],
      description: "The legendary calamity of the North: a colossal dragon with iridescent rime-scales, razor talons, and a heart of glacier ice.",
      combatActions: [
        { id: "act_vyr_breath", name: "Glacial Frost Breath", damage: "3d8+4", type: "breath", status: { id: "weakened", rounds: 3 }, telegraph: "its gullet glows with brilliant blinding azure light" },
        { id: "act_vyr_tail", name: "Cataclysmic Tail Sweep", damage: "2d8+5", type: "melee", status: { id: "stunned", rounds: 1 }, telegraph: "whips its colossal spiked tail across the volcanic basalt" }
      ]
    }
  ]
};

// -------------------------------------------------------------
// 3. ENCOUNTERS (Major Boss Encounters & Random Travel Encounters)
// -------------------------------------------------------------
const encounters = {
  encounters: [
    {
      id: "enc_nr_wolf_ambush",
      name: "Howling Pine Ambush",
      type: "combat",
      locationId: "loc_nr_pine_crossroads",
      creatureId: "creature_nr_timber_wolf",
      introProse: "Shadows dart across the snowdrifts! A pack of white wolves emerges with bared yellow fangs.",
      rewards: { xp: 35, drachmae: 4 }
    },
    {
      id: "enc_nr_troll_rockslide",
      name: "Frost Troll on the Ledge",
      type: "combat",
      locationId: "loc_nr_glacier_pass",
      creatureId: "creature_nr_frost_troll",
      introProse: "Boulders smash across the icy trail! A towering mountain frost troll blocks the glacier pass.",
      rewards: { xp: 80, drachmae: 15 }
    },
    {
      id: "enc_nr_skallagrim_boss",
      name: "The Crypt Lord Awakens",
      type: "boss",
      locationId: "loc_nr_barrow_depths",
      creatureId: "creature_nr_boss_skallagrim",
      introProse: "The heavy granite sarcophagus shatters! Chieftain Skallagrim steps forth with burning blue eyes and a raised waraxe.",
      rewards: { xp: 160, drachmae: 80 }
    },
    {
      id: "enc_nr_vyr_boss",
      name: "Wrath of Mount Wyrmfang",
      type: "boss",
      locationId: "loc_nr_wyrmfang_caldera",
      creatureId: "creature_nr_boss_vyr",
      introProse: "The caldera basalt shudders and splits! Vyr the Frost Wyrm spreads its colossal wings and roars with the fury of a thousand winters.",
      rewards: { xp: 400, drachmae: 200 }
    }
  ],
  randomEncounters: [
    {
      id: "renc_nr_wolf_pack",
      type: "combat",
      creatureId: "creature_nr_timber_wolf",
      regions: ["Whispering Woods", "Valenfrost Highlands"],
      terrain: "mountain_trail",
      weight: 30
    },
    {
      id: "renc_nr_mire_bandits",
      type: "combat",
      creatureId: "creature_nr_mire_bandit_bruiser",
      regions: ["Mistglen Fens"],
      terrain: "swamp_marsh",
      weight: 25
    },
    {
      id: "renc_nr_mountain_troll",
      type: "combat",
      creatureId: "creature_nr_frost_troll",
      regions: ["Grimstone Crags", "Frostpeak Glaciers"],
      terrain: "rocky_scrubland",
      weight: 20
    },
    {
      id: "renc_nr_barrow_draugr",
      type: "combat",
      creatureId: "creature_nr_draugr_wight",
      regions: ["Whispering Woods", "Grimstone Crags"],
      terrain: "limestone_cave",
      weight: 25
    }
  ]
};

writeJson(path.join(OUT_DIR, 'characters.json'), characters);
writeJson(path.join(OUT_DIR, 'creatures.json'), creatures);
writeJson(path.join(OUT_DIR, 'encounters.json'), encounters);

console.log("Stage 5 complete: Characters (17), Creatures (6), Encounters & Random Encounters.");

# Content Schema & Data Contract Specification
**Document Version:** 1.0.0  
**Schema Version:** `gm-rpg-v1.0`  
**Standard:** JSON Schema compatible structures  

---

## 1. Overview & Content Philosophy

All narrative content, geography, entities, and adventures in the Greek Mythology RPG are stored in standardized JSON content packs.

Content creators must follow these principles:
1. **Primary Source Integrity:** Every mythological deity, monster, and legendary item must include a `mythology` object attributing the classical ancient source (e.g., Homer, Hesiod, Apollodorus, Pausanias, Pindar).
2. **Explicit Entity Identifiers:** All keys use lower-snake-case prefixed by entity type (e.g., `loc_`, `npc_`, `item_`, `quest_`, `deity_`, `puzzle_`).
3. **Branching & Statefulness:** Quests and dialogues declare unambiguous prerequisite conditions using the engine's conditional expression syntax.

---

## 2. Adventure Pack Schema (`adventure_*.json`)

An adventure pack is an independent, loadable gameplay unit containing all local narrative arcs, custom encounters, specific locations, and dialogue trees.

```json
{
  "$schema": "https://greek-mythology-rpg.org/schemas/v1/adventure.json",
  "id": "adv_tutorial_cithaeron_001",
  "title": "The Whispering Cave of Cithaeron",
  "version": "1.0.0",
  "engineVersion": ">=0.1.0",
  "author": "Historical Systems Designer",
  "description": "Investigate the vanishing of a sacrificial ram near the crags of Mount Cithaeron and uncover the stirrings of an ancient chthonic rite.",
  "mythologicalSetting": {
    "region": "Boeotia / Attica Borderlands",
    "historicalEpoch": "Archaic / Heroic Age",
    "primarySources": [
      {
        "author": "Hesiod",
        "work": "Theogony",
        "passage": "lines 22-35",
        "notes": "Invocation on Mount Helicon and adjacent Boeotian peaks."
      },
      {
        "author": "Apollodorus",
        "work": "Bibliotheca",
        "passage": "Book 3, Chapter 4",
        "notes": "Myths of Mount Cithaeron, the lion of Cithaeron, and shepherd cults."
      }
    ]
  },
  "dependencies": {
    "requiredWorldPacks": ["world_core_v1.0"]
  },
  "startingConditions": {
    "locationId": "loc_cithaeron_crossroads",
    "timeOfDay": "morning",
    "initialJournalEntries": ["journal_tutorial_intro"],
    "initialQuests": ["quest_cithaeron_missing_ram"]
  },
  "locations": [ /* Array of Location definitions */ ],
  "npcs": [ /* Array of NPC definitions */ ],
  "creatures": [ /* Array of Creature definitions */ ],
  "items": [ /* Array of Item definitions */ ],
  "quests": [ /* Array of Quest definitions */ ],
  "puzzles": [ /* Array of Puzzle definitions */ ],
  "dialogues": { /* Map of dialogue tree definitions */ },
  "encounters": [ /* Array of combat/hazard encounters */ ]
}
```

---

## 3. World & Location Schema (`locations.json`)

Locations represent both points on the vector campaign map and rich narrative exploration spaces.

```json
{
  "id": "loc_cithaeron_crossroads",
  "name": "Crossroads of Mount Cithaeron",
  "ancientName": "Kithairōn",
  "region": "Boeotia",
  "type": "crossroads", // settlement | sanctuary | cave | mountain_pass | grove | port | ruins
  "coordinates": {
    "mapX": 340,
    "mapY": 480
  },
  "terrain": "rocky_scrubland", // paved_road | mountain_trail | rocky_scrubland | dense_forest | coastal
  "connections": [
    {
      "targetLocationId": "loc_shrine_hermes_strophaios",
      "distanceKm": 4.5,
      "travelHours": 1.5,
      "staminaCost": 4,
      "terrain": "rocky_scrubland",
      "dangerRating": 1,
      "requirements": []
    },
    {
      "targetLocationId": "loc_cithaeron_fissure_cave",
      "distanceKm": 7.0,
      "travelHours": 2.5,
      "staminaCost": 8,
      "terrain": "mountain_trail",
      "dangerRating": 2,
      "requirements": [
        {
          "type": "flag",
          "flag": "cithaeron_cave_discovered",
          "expected": true,
          "failureMessage": "The crags loom impenetrable; you do not know the path to the hidden fissure."
        }
      ]
    }
  ],
  "narrative": {
    "firstVisit": "The wind carries the bitter scent of wild thyme and crushed limestone. Here, where the rugged track from Plataea forks toward the heights of Cithaeron, stands a rough stone cairn dedicated to Hermes—patron of travelers and guide of spirits. To the north, limestone crags cut into the morning sky like broken teeth.",
    "subsequentVisit": "You return to the wind-buffeted crossroads. The stone cairn stands silent under the watch of circling kites."
  },
  "contextualActions": [
    {
      "id": "act_inspect_cairn",
      "label": "Examine the Herm stone cairn",
      "actionType": "examine",
      "skillCheck": {
        "skill": "mythology_lore",
        "attribute": "wisdom",
        "difficulty": 11
      },
      "successOutcome": {
        "text": "You recognize the stones as an *hermaion*—a mound raised by travelers adding stones for good fortune. Tucked beneath an ancient slate is a carved wooden dedication marked with archaic caduceus symbols.",
        "addJournalDiscovery": "discovery_hermaion_tradition",
        "setFlags": { "inspected_hermaion": true },
        "revealsActions": ["act_pour_libation_hermes"]
      },
      "failureOutcome": {
        "text": "It is a heap of loose stones marking the way. You feel the eerie quiet of the mountain pass.",
        "setFlags": { "inspected_hermaion": true }
      }
    },
    {
      "id": "act_pour_libation_hermes",
      "label": "Pour a libation of wine at the cairn",
      "actionType": "interact",
      "conditions": [
        { "type": "has_item", "itemId": "item_clay_aryballos_wine", "quantity": 1 },
        { "type": "flag", "flag": "inspected_hermaion", "expected": true },
        { "type": "flag", "flag": "hermes_libation_poured", "expected": false }
      ],
      "outcome": {
        "text": "Uncorking the small aryballos, you pour dark Pramnian wine over the crest stone, invoking Hermes Enodios—Protector of the Way. A warm breeze stirs the dry grass, carrying away fatigue.",
        "consumeItem": { "itemId": "item_clay_aryballos_wine", "quantity": 1 },
        "modifyVitals": { "stamina": 5 },
        "modifyPiety": { "deity": "hermes", "amount": 2 },
        "setFlags": { "hermes_libation_poured": true },
        "addConsequence": "Honored Hermes Enodios at the Cithaeron pass; gained divine favor on travel checks."
      }
    }
  ],
  "presentNPCs": ["npc_shepherd_daidalos"],
  "presentItems": []
}
```

---

## 4. Characters & NPCs Schema (`characters.json`)

```json
{
  "id": "npc_shepherd_daidalos",
  "name": "Daidalos the Shepherd",
  "title": "Herdkeeper of Plataea",
  "locationId": "loc_cithaeron_crossroads",
  "disposition": 10, // -100 (kill on sight) to +100 (revered friend)
  "attributes": {
    "strength": 12,
    "agility": 11,
    "endurance": 14,
    "intelligence": 10,
    "wisdom": 13,
    "charisma": 9
  },
  "dialogueTreeId": "dialogue_shepherd_daidalos",
  "knowledgeKnown": [
    "lore_cithaeron_mountain_spirits",
    "rumor_cithaeron_cave_noises"
  ],
  "inventory": [
    { "itemId": "item_shepherd_crook_001", "quantity": 1 },
    { "itemId": "item_goat_cheese_001", "quantity": 2 }
  ],
  "isEssential": false,
  "onDeath": {
    "setFlags": { "shepherd_daidalos_dead": true },
    "addJournalChronicle": "Daidalos the shepherd was slain on the slopes of Cithaeron. His blood taints the soil with miasma."
  }
}
```

---

## 5. Items & Equipment Schema (`items.json`)

```json
{
  "id": "item_dory_spear_001",
  "name": "Hoplite Dory",
  "ancientName": "Dory (δόρυ)",
  "category": "weapon", // weapon | armor | shield | accessory | consumable | quest | material | relic
  "slot": "main_hand", // main_hand | off_hand | two_hand | head | body | feet | ring
  "rarity": "common", // common | crafted | exceptional | consecrated | mythic
  "weightKg": 2.2,
  "valueDrachmae": 30,
  "durability": { "current": 100, "max": 100 },
  "stats": {
    "damageMin": 5,
    "damageMax": 10,
    "damageType": "piercing",
    "reach": 2, // melee reach modifier
    "attributeRequirement": { "strength": 12 }
  },
  "description": "An ash-wood spear tipped with a leaf-shaped bronze head and balanced by a four-sided bronze butt-spike (sauroter) for planting in the earth.",
  "mythologicalLore": {
    "source": "Homer, Iliad 16.140",
    "note": "Ash spears of Pelion were famously hewn by Chiron for Peleus and wielded by Achilles."
  }
}
```

---

## 6. Creatures & Bestiary Schema (`creatures.json`)

```json
{
  "id": "creature_cithaeron_wolf",
  "name": "Cithaeronian Timber Wolf",
  "mythologicalSource": {
    "author": "Pausanias",
    "work": "Description of Greece",
    "passage": "Book 9, Chapter 2",
    "notes": "Wolves and wild beasts of the Cithaeron forest sacred to Artemis Agrotera."
  },
  "level": 1,
  "vitals": {
    "health": 16,
    "maxHealth": 16,
    "morale": 10
  },
  "attributes": {
    "strength": 12,
    "agility": 14,
    "endurance": 13,
    "perception": 15
  },
  "armorClass": 12,
  "actions": [
    {
      "name": "Savage Bite",
      "attackBonus": 4,
      "damage": "1d6+2",
      "damageType": "slashing",
      "statusEffect": { "type": "bleeding", "chance": 0.25, "durationTurns": 3 }
    },
    {
      "name": "Menacing Snarl",
      "target": "morale",
      "dc": 12,
      "effect": "frightened"
    }
  ],
  "loot": [
    { "itemId": "item_wolf_pelt_001", "chance": 1.0 },
    { "itemId": "item_wolf_fang_001", "chance": 0.5 }
  ]
}
```

---

## 7. Quests Schema (`quests.json`)

```json
{
  "id": "quest_cithaeron_missing_ram",
  "title": "The Stolen Ram of the Herm",
  "category": "side", // main | side | sacred_vow | divine_favor
  "summary": "Daidalos' prize black ram, reared for the feast of Hermes, vanished into the limestone crags.",
  "stages": {
    "initial": {
      "journalEntry": "Daidalos the shepherd pleaded for assistance. His prize ram disappeared under the shadows of Mount Cithaeron, leaving strange tracks that lead toward a fissure cave.",
      "objectives": [
        {
          "id": "obj_follow_tracks",
          "description": "Follow the dragging tracks from the crossroads up the mountain slope.",
          "type": "skill_check_or_travel",
          "optional": false,
          "completed": false
        },
        {
          "id": "obj_find_sacred_cairn_clue",
          "description": "Consult the Herm stone for a traveler's omen.",
          "type": "interaction",
          "optional": true,
          "completed": false
        }
      ]
    },
    "cave_explored": {
      "journalEntry": "You tracked the fleece into the Whispering Fissure. The ram was not taken by common wolves, but led by strange chthonic symbols inscribed upon the stone.",
      "objectives": [
        {
          "id": "obj_solve_fissure_riddle",
          "description": "Decipher the ancient Cadmean inscription barring the sanctuary.",
          "type": "puzzle",
          "puzzleId": "puzzle_cadmean_symbols",
          "completed": false
        }
      ]
    }
  },
  "rewards": {
    "experience": 150,
    "drachmae": 25,
    "items": ["item_blessed_herdsman_amulet_001"],
    "reputation": { "region_plataea": 10, "deity_hermes": 3 }
  }
}
```

---

## 8. Riddles & Puzzle Schema (`puzzles.json`)

```json
{
  "id": "puzzle_cadmean_symbols",
  "title": "The Cadmean Threshold",
  "type": "inscription_deduction",
  "prompt": "Carved into the limestone lintel are three archaic Phoenician-Greek letters and a carved relief of a snake, an oak leaf, and a bronze tripod. An inscription reads: 'Speak the name of the earth-born guardian slain by Cadmus to open the path.'",
  "cluesRequired": ["knowledge_cadmus_dragon_myth"],
  "solutions": [
    {
      "acceptedPhrases": ["drakon", "dragon", "isminian dragon", "the serpent of ares", "drakon ismenios"],
      "outcome": {
        "text": "As you speak the ancient title of Ares' serpent, the counter-weighted stone slab grinds open with a rumble that echoes deep into the subterranean spring.",
        "setFlags": { "cithaeron_cave_unsealed": true },
        "awardXP": 100,
        "addJournalChronicle": "Spoke the ancient name of the Ismenian Drakon and unsealed the inner grotto."
      }
    }
  ],
  "failureHint": "A scholar of mythology or an investigator with knowledge of Theban lore might recall the guardian Cadmus conquered before founding the city."
}
```

---

## 9. Campaign Manifest Schema (`campaign.json`)

The campaign manifest defines the master configuration for an entire campaign or world setting.

```json
{
  "id": "campaign_custom_world",
  "name": "Chronicles of the Aegean Horizon",
  "version": "1.0.0",
  "engineVersion": ">=1.0.0",
  "author": "World Designer",
  "description": "Comprehensive campaign setting spanning mainland poleis and maritime archipelagos.",
  "genre": "classical_mythology",
  "isDefault": true,
  "isTestCampaign": false,
  "startingLocationId": "loc_cithaeron_crossroads",
  "startingTime": {
    "hour": 8,
    "minute": 0,
    "day": 1,
    "month": 1,
    "year": 1
  },
  "modules": {
    "locations": "content/world/locations.json",
    "characters": "content/world/characters.json",
    "creatures": "content/world/creatures.json",
    "items": "content/world/items.json",
    "lootTables": "content/world/loot_tables.json",
    "interactiveObjects": "content/world/interactive_objects.json",
    "factions": "content/world/factions.json",
    "quests": "content/adventures/tutorial.json",
    "encounters": "content/world/encounters.json",
    "dialogues": "content/world/dialogues.json",
    "events": "content/world/events.json"
  },
  "factions": [
    {
      "id": "faction_athenian_assembly",
      "name": "Athenian Citizen Assembly",
      "description": "Democratically inclined citizens and hoplites of Attica.",
      "defaultReputation": 0
    }
  ],
  "consequenceRules": [
    {
      "id": "rule_kill_guard",
      "event": "ENTITY_DEATH",
      "conditions": { "targetEntityId": "npc_athenian_gate_guard" },
      "outcomes": {
        "setFlags": { "athens_gate_locked": true },
        "modifyReputation": { "faction_athenian_assembly": -50 },
        "transcript": "The city watch sounds war trumpets! Gate checkpoints are sealed."
      }
    }
  ],
  "settings": {
    "allowAnyEntityCombat": true,
    "lockpickingEnabled": true,
    "livingWorldSimulation": true
  }
}
```

---

## 10. Interactive Objects Schema (`interactive_objects.json`)

Environmental obstacles, lockable doors, trapped coffers, and physical mechanisms.

```json
{
  "interactiveObjects": [
    {
      "id": "obj_temple_vault_door",
      "locationId": "loc_athens_acropolis",
      "name": "Banded Bronze Sanctuary Portal",
      "type": "door", // door | container | obstacle | shrine | mechanism
      "locked": true,
      "isPickable": true,
      "lockDifficulty": 14,
      "requiredKeyId": "item_key_sanctuary_bronze",
      "requiredToolId": "item_iron_lockpick",
      "description": "A reinforced portal inscribed with the owl of Athena.",
      "failureConsequence": {
        "breakToolOnAte": true,
        "alertNpcId": "npc_temple_guard",
        "message": "The bronze tumbler resists violently, jamming your tension wrench!"
      },
      "unlockOutcome": {
        "setFlags": { "sanctuary_vault_open": true },
        "awardXP": 25
      }
    },
    {
      "id": "obj_cliff_boulder",
      "locationId": "loc_cithaeron_pass",
      "name": "Granite Cliff Rockfall",
      "type": "obstacle",
      "locked": true,
      "isPickable": false,
      "unpickableReason": "A solid granite mass has no lock cylinder; lockpicks cannot budge stone!",
      "requiredAttribute": "strength",
      "requiredScore": 14,
      "unlockOutcome": {
        "setFlags": { "pass_cleared": true },
        "awardXP": 30
      }
    },
    {
      "id": "obj_trapped_chest",
      "locationId": "loc_sunken_grotto",
      "name": "Ironbound Coffer of the Ancients",
      "type": "container",
      "locked": true,
      "isPickable": true,
      "lockDifficulty": 13,
      "trap": {
        "name": "Pressurized Bronze Needle",
        "disarmDC": 12,
        "damage": 6
      },
      "contents": {
        "drachmae": 45,
        "items": ["item_silver_chalice"]
      }
    }
  ]
}
```

---

## 11. Multi-Table Loot Schema (`loot_tables.json`)

Dynamic loot resolution tables supporting drop chances, guaranteed awards, and anti-exploit repeat rewards.

```json
{
  "lootTables": [
    {
      "id": "loot_hydra_sepulcher",
      "name": "Lernaean Hydra Hoard",
      "currency": { "min": 50, "max": 100 },
      "entries": [
        {
          "itemId": "item_hydra_bile_relic",
          "chance": 1.0,
          "guaranteed": true,
          "isUnique": true,
          "minQuantity": 1,
          "maxQuantity": 1
        },
        {
          "itemId": "item_healing_draught",
          "chance": 0.75,
          "minQuantity": 1,
          "maxQuantity": 2
        }
      ],
      "repeatCurrency": { "min": 25, "max": 40 },
      "repeatEntries": [
        {
          "itemId": "item_hardened_scales",
          "chance": 1.0,
          "minQuantity": 2,
          "maxQuantity": 4
        }
      ]
    }
  ]
}
```

---

## 12. Factions Schema (`factions.json`)

Living world factions, initial dispositions, and reputation threshold parameters.

```json
{
  "factions": [
    {
      "id": "faction_haven_free_citizens",
      "name": "Haven Free Citizens",
      "description": "Merchants, artisans, and farmers cultivating the valley plains.",
      "defaultReputation": 15,
      "thresholds": {
        "hostile": -25,
        "unfriendly": -1,
        "neutral": 0,
        "friendly": 20,
        "honored": 50
      }
    }
  ]
}
```

---

## 13. Consequence Rules & World Events Schema (`events.json`)

Event-driven consequences and scheduled delayed events.

```json
{
  "events": [
    {
      "id": "event_merchant_investigation",
      "name": "Haven Watch Murder Inquest",
      "trigger": "FLAG_SET",
      "conditions": {
        "flag": "merchant_lycus_dead",
        "expected": true
      },
      "outcomes": {
        "setFlags": { "haven_curfew_active": true },
        "transcript": {
          "speaker": "Town Crier",
          "text": "By decree of the Captain, night curfew is enforced throughout Haven!",
          "style": "entry-consequence"
        }
      }
    }
  ]
}
```

---

## 14. Character Classes Schema (`classes.json`)

Defines playable character classes, stat bonuses, weapon/armor proficiencies, progression feature unlocks, and starting equipment panoplies.

```json
{
  "classes": [
    {
      "id": "hoplite",
      "name": "Hoplite",
      "subtitle": "Phalangite Heavy Infantry",
      "archetype": "Warrior & Combat",
      "description": "Disciplined heavy infantry fighter specialising in heavy bronze armour, shield defence, spear combat, and protective battlefield formations.",
      "primaryAttributes": ["strength", "endurance"],
      "statBonuses": { "strength": 1, "endurance": 1 },
      "proficiencies": ["heavy_armor", "spears", "shields"],
      "classFeatures": [
        { "level": 1, "name": "Aspis Phalanx Wall", "type": "passive", "desc": "+2 Armor Class when wielding a shield." },
        { "level": 2, "name": "Dory Piercing Thrust", "type": "active", "desc": "Bypasses 2 points of enemy armor class on melee spear strikes." }
      ],
      "startingEquipment": ["item_dory_spear_001", "item_aspis_shield_001", "item_linothorax_001"]
    }
  ]
}
```

---

## 15. Character Backgrounds Schema (`backgrounds.json`)

Defines character cultural and narrative origins, skill proficiencies, passive traits, and contextual dialogue perks.

```json
{
  "backgrounds": [
    {
      "id": "bg_demigod_scion",
      "name": "Demigod Scion",
      "category": "Divine & Mystical Origins",
      "description": "Mortal child of an Olympian deity, carrying heavenly lineage and heroic destiny.",
      "proficiencies": ["persuasion", "mythology_lore"],
      "passiveBonus": "+1 to all divine favor and piety gains.",
      "dialoguePerk": "Unlocks divine lineage dialogue options with priests, seers, and monsters."
    }
  ]
}
```

---

## 16. Consolidated Professions & Toolkits Schema (`professions.json`)

Defines artisan craft professions, governing attributes, required inventory toolkits, and produced item categories.

```json
{
  "professions": [
    {
      "id": "metalworking",
      "name": "Metalworking & Smithing",
      "governingAttribute": "strength",
      "requiredToolkitId": "item_toolkit_smithing",
      "workstation": "forge",
      "description": "The sacred forge discipline of Hephaestus, encompassing bronze forging, adamantine armaments, and orichalcum refinement.",
      "itemCategories": ["weapon", "shield", "heavy_armor", "accessory"]
    }
  ]
}
```

---

## 17. Crafting Materials Schema (`materials.json`)

Standardized crafting materials with physical, elemental, and magical attributes for composite item assembly.

```json
{
  "materials": [
    {
      "id": "mat_cypriot_bronze",
      "name": "Cypriot Bronze Ingot",
      "category": "metal",
      "rarity": "common",
      "weightKg": 1.5,
      "valueDrachmae": 12,
      "properties": {
        "hardness": 7,
        "durability": 8,
        "flexibility": 4,
        "heatResistance": 8,
        "magicalAffinity": 3,
        "purity": 85
      },
      "compatibleProfessions": ["metalworking", "artifice", "music"],
      "statModifiers": { "defense": 2, "damage": 2, "durability": 15 },
      "description": "Refined copper alloyed with tin from the island of Cyprus."
    }
  ]
}
```

---

## 18. Crafting Templates Schema (`crafting_templates.json`)

Reusable equipment archetypes defining base stats, slot occupancy, DC checks, and required material slots.

```json
{
  "templates": [
    {
      "id": "template_sword",
      "name": "Xiphos Short Sword",
      "professionId": "metalworking",
      "slot": "main_hand",
      "category": "weapon",
      "baseDamageMin": 4,
      "baseDamageMax": 8,
      "baseWeightKg": 1.4,
      "baseValueDrachmae": 25,
      "primaryMaterialSlots": 2,
      "allowedSupplementarySlots": 1,
      "description": "A double-edged leaf-bladed short sword suited for close-quarters fighting in phalanx formations."
    }
  ]
}
```

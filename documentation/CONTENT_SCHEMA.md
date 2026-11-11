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
  "rarity": "common", // common | crafted | uncommon | rare | exceptional | epic | consecrated | legendary | mythic
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

---

## 19. Dynamic World Time & Activity Durations Schema (`campaign.json`)

Campaign manifests configure calendar parameters and time consumption (in minutes) for player activities.

```json
{
  "activityDurations": {
    "travel_short": 60,
    "travel_medium": 120,
    "travel_long": 240,
    "combat_encounter": 15,
    "rest_short": 60,
    "rest_full": 480,
    "craft_item": 60,
    "gather_resources": 45,
    "search_location": 30,
    "npc_conversation": 5,
    "menu_interaction": 0
  }
}
```

---

## 20. Respawn Rules Schema (`campaign.json` & `creatures.json`)

Individual creature declarations define exact respawn intervals; the campaign manifest supplies the boss default.
(Corrected in the second v4.1 audit pass: the previous example listed fields the engine never read.)

### Campaign Manifest (`campaign.json`):
```json
{
  "respawnRules": {
    "bossHours": 72
  }
}
```
* Respawn hours are resolved as: creature `respawnHours` → `respawnRules.bossHours` (bosses only) → tier default (tier 1: 12, 2: 24, 3: 48, 4: 96, 5+: 168).
* NPCs never respawn (permanent death). `creatureNormalHours`, `creatureRareHours` and `preventNpcRespawn`, present in the shipped manifests, are not read by the engine.

### Creature Declaration (`creatures.json`):
```json
{
  "id": "creature_nemean_lion",
  "name": "Spawn of Orthrus (Nemean Beast)",
  "tier": 5,
  "level": 6,
  "isMonster": true,
  "isBoss": true,
  "repeatable": true,
  "respawnHours": 72,
  "xpReward": 350
}
```

---

## 21. Morality & Alignment Configuration Schema (`campaign.json`)

Campaign manifests configure morality terminology, optional starting balances, and tier thresholds. Two formats are accepted:

```json
{
  "moralityConfig": {
    "enabled": true,
    "virtueLabel": "Arete & Dike",
    "hubrisLabel": "Hubris & Miasma",
    "tiers": { "heroic": 30, "pragmatic": -15, "ruthless": -40, "villainous": -100 }
  }
}
```

```json
{
  "moralityConfig": {
    "virtueLabel": "Honor",
    "hubrisLabel": "Infamy",
    "initialVirtue": 10,
    "initialHubris": 0,
    "alignmentTiers": {
      "heroic": { "minScore": 40, "title": "Heroic Exemplar" },
      "pragmatic": { "minScore": -15, "title": "Pragmatic Wanderer" },
      "ruthless": { "minScore": -40, "title": "Ruthless Opportunist" },
      "villainous": { "title": "Cursed Villain" }
    }
  }
}
```
* Score = virtue − hubris. Alignment is the first tier (heroic → pragmatic → ruthless) whose minimum the score reaches; anything lower is villainous (its minimum is ignored).
* Missing values use the defaults: heroic 30, pragmatic −15, ruthless −40.
* `virtueLabel` / `hubrisLabel` appear in notifications; tier `title`s in the morality summary.
* `initialVirtue` / `initialHubris` set the hero's starting balance when a new game starts.

---

## 22. Time-Sensitive & Moral-Choice Quests Schema (`quests.json`)

(Corrected in the second v4.1 audit pass: the previous example used `milestones`, `hoursElapsed` and `moralChoices`, which the engine does not read.)

```json
{
  "id": "quest_dev_urgent_rescue",
  "title": "Hostage of the Obsidian Crag",
  "timeSensitive": true,
  "deadlineHours": 48,
  "earlyCompletionBonus": { "hoursThreshold": 24, "drachmae": 40, "virtue": 10, "narrative": "Rescued the apprentice swiftly!" },
  "timeMilestones": [
    { "hours": 24, "action": "warn", "narrative": "Bandit lookouts have doubled." },
    { "hours": 48, "action": "escalate", "mutateStage": "stage_hostage_moved", "setFlags": { "hostage_moved_deep": true }, "narrative": "The captive has been moved." },
    { "hours": 72, "action": "fail", "narrative": "The trail has gone cold." }
  ],
  "currentStage": "rescue_crag",
  "stages": { "rescue_crag": { "objectives": [] }, "stage_hostage_moved": { "objectives": [] }, "completed": { "objectives": [] } }
}
```
* `timeMilestones` are scheduled when the quest starts (only if `timeSensitive: true`), counted from the moment it was accepted. `mutateStage` moves the quest to that stage and shows its objectives; `"action": "fail"` fails the quest and cancels its later milestones; `setFlags` and `narrative` are applied as written.
* `deadlineHours` is descriptive; enforce a deadline with a `fail` milestone.
* `earlyCompletionBonus` is granted by `completeQuest()` when the quest is completed within `hoursThreshold` hours.

Moral choices use `moralPaths` and are resolved with `resolveMoralChoice(questId, pathKey)`:
```json
{
  "moralPaths": {
    "heroic": { "label": "Arrest Silas", "virtue": 20, "hubris": 0, "reputation": { "faction_dev_guards": 25 }, "rewards": { "experience": 120, "drachmae": 30 } },
    "villainous": { "label": "Eliminate the Captain", "virtue": 0, "hubris": 35, "rewards": { "experience": 200, "drachmae": 100 } }
  }
}
```

---

## 23. Field Reference Added or Clarified in the v4.1 Audit

These fields are supported by the engine as of v4.1. Where two spellings exist in shipped content, both are accepted.

### Items
* `rarity` must be one of: `common`, `crafted`, `uncommon`, `rare`, `exceptional`, `epic`, `consecrated`, `legendary`, `mythic`. Loot caps only apply to `epic`, `legendary` and `mythic` (see ENGINE_ARCHITECTURE §7.5).
* `stats.ranged: true` marks a ranged weapon (attacks with Agility + Ranged Combat).
* `stats.defenseBonus` adds to Armour Class.
* Consumables: `restoreHealth` / `restoreStamina` may be placed in `stats` **or** `effect` (both are read by the inventory *Use* button and the combat item button).
* Equipped-item bonuses applied by the rules engine: `<attribute>Bonus` (`strengthBonus` … `charismaBonus`, e.g. `wisdomBonus`), `<skill>Bonus` (e.g. `persuasionBonus`, `athleticsBonus`), `perceptionBonus` / `perceptionPenalty`, and `damageReduction` (per hit, minimum 1 damage). Other stats (`moraleBonus`, `staminaBonus`, `coldResistance`, `blockChance`, `speedPenalty`, …) are descriptive only. `attributeRequirement` is shown in tooltips but not enforced.

### Characters / NPCs
* Dialogue link: `dialogueTreeId` or `dialogueId`.
* Faction: `faction` or `factionId`.
* `combatStats`: `{ "armorClass", "attackBonus", "damage", "xpReward", "actions": [{ "name", "attackBonus", "damage" }] }` and `vitals.maxHealth` are used when the NPC is attacked.
* `knowledge`: ids of `mythology.json` lore entries; used for generated conversations.

### Quests
* Stage objectives may declare `"locationId"`: the objective completes when the hero arrives there.
* `"autoStart": false` keeps a quest from starting automatically when the campaign begins (start it with a `startQuest` outcome).
* `alternatePathways.onNpcDeath`: `{ "npcId", "setStage", "completeObjective", "giveItem", "setFlags", "narrative" }` (object or array).
* `failableConditions.onNpcDeath`: `{ "npcId", "reason" }` (object or array).
* When all required objectives of the current stage are completed, the quest advances to the next stage; the final `completed` stage is entered by `completeQuest`.
* `rewards` on a quest is **descriptive**: it is not granted automatically. Grant rewards in the outcome that completes the quest (e.g. the turn-in dialogue node's `giveDrachmae` / `awardXP`, as both shipped campaigns do), so they are never paid twice.

### Action / outcome objects (actions, encounter `victoryOutcome`, puzzle `successOutcome`)
* Added: `startQuest`, `failQuest`, `failReason`. `giveDrachmae` now credits the hero's purse.

### Puzzles
* `acceptedKeywords` (typed answers), `successOutcome` (applied on success), `clueJournalIds`, optional `deductionSkill`, `deductionAttribute`, `deductionDc`, `deductionHint`, `knownAnswerLabel`, `distractors` (array of wrong-answer labels).

### Interactive objects
* Lock difficulty: `lockDc` or `lockDifficulty`. Key: `keyRequired` or `requiredKeyId`. Heave: `heaveDc` or `requiredScore`, with optional `requiredAttribute`.
* `"locked": false` objects are open from the start. `"openedByFlag": "<flag>"` marks an object as open once that world flag is set.
* Container contents: `items` (array) or `contents: { "drachmae", "items" }`, or a `lootTableId`.
* `unlockOutcome` (any outcome fields: `setFlags`, `updateQuest`, `completeQuest`, `awardXP`, `transcript`, `giveItem`, …) is applied once, the first time the object is opened by lockpick, key, heave or mechanism. Its `awardXP` replaces the generic 35 XP for opening.
* `failureConsequence`: `message` is shown when a lockpick attempt fumbles (natural 1); `"breakToolOnAte": false` keeps the lockpick. `alertNpcId` is not implemented.

### Locations
* Connections: `requiresFlag` closes the road until the flag is set; `requiresNotFlag` closes it while the flag is set. Every open road can be travelled, including to places not yet discovered (arriving discovers them).
* `criticalDiscovery`: `{ "itemId", "quantity", "drachmae", "pietyDeity", "pietyAmount", "title", "narrative" }` — the cache a natural 20 can uncover (once per location).

### Campaign manifest (`campaign.json`)
* `origins` / `traits`: inline creation-wizard lists (prefer the `modules.origins` / `modules.traits` files, §25).
* `defeatRecoveryLocationId`, `defeatNarrative`: where and how the hero recovers after a defeat.
* `timeOfDayNarration`: `{ "Morning", "Afternoon", "Dusk", "Night" }`.
* `startingJournalNotes`: initial text of the player's notes.
* `activityDurations.divination` (default 30), `lockpicking` (default 10) and `heave` (default 10) in addition to the existing keys.
* `respawnRules.bossHours` is used for bosses without their own `respawnHours`.
* `moralityConfig`: see §21 (both `tiers` and `alignmentTiers` formats).
* `progression`: `{ "xpTable": { "1": 100, "2": 250 }, "levelTitles": { "1": "Recruit" }, "maxLevelTitle": "Legend" }` — XP needed to leave each level and level titles; missing entries use the engine defaults (non-default campaigns get "Level N Adventurer").
* `randomEncounters` (or a top-level `randomEncounters` array in the campaign's `encounters.json`): `{ "id", "type": "combat", "creatureId", "regions", "terrain", "weight" }` — used for rest/travel ambushes.

### Encounters (`encounters.json`)
* A won encounter is **one-time** unless `"repeatable": true`. A repeatable encounter returns after `cooldownHours`, or, without a cooldown, once its creature has respawned.
* `triggerCondition: { "flag", "expected" }` must hold for the encounter to be offered or started.

### World events (`events.json`)
* `{ "id", "trigger", "conditions", "outcomes", "repeatable" }`. Triggers: `FLAG_SET` (conditions `flag`, `expected`; raised when an outcome changes that flag), `ITEM_ACQUIRED` (condition `itemId`), or any engine event name such as `ENTITY_DEATH` (conditions `targetEntityId`, `locationId`).
* Outcomes: `setFlags`, `modifyReputation`, `scheduleEvent`, `failQuest`, `piety`, `morality`, `restoreHealth`, `restoreStamina`, `transcript` (`speaker`, `text`, `style`), `addJournalChronicle`.
* Each event fires once per game unless `repeatable: true` (fired ids are saved).

### Dev campaign and `file://` mode
* After editing any file in `content/campaigns/dev_test_campaign/world/`, run `node scripts/sync-embedded-dev-content.js` (or `npm run sync:embedded`) to regenerate the embedded copy used under `file://`. `npm test` fails while they differ.

---

## 24. D20 Criticals & Reliable Talent (`campaign.json` → `d20Rules`, actions)

All fields are optional; the defaults are shown.

```json
{
  "d20Rules": {
    "criticals": true,
    "criticalSuccessOn": 20,
    "criticalFailureOn": 1,
    "reliableTalent": {
      "enabled": true,
      "minimumRoll": 6,
      "defaultThreshold": 8,
      "thresholds": { "persuasion": 8, "stealth": 9 },
      "eligibleSkills": null,
      "combatSkills": ["melee_combat", "ranged_combat"]
    },
    "criticalOutcomes": {
      "persuasion": {
        "success": { "disposition": 15, "text": "They are utterly won over." },
        "failure": { "disposition": -15, "reputation": -5, "text": "You insult their family." }
      }
    }
  }
}
```
* `criticals: false` turns critical successes and failures off for the campaign (rolls are then compared with the DC only).
* `eligibleSkills: null` means every non-combat skill can gain Reliable Talent; give an array to restrict it. A threshold is the skill **rank** required. Combat skills never qualify.
* `criticalOutcomes[activity].success|failure` **replaces** the engine default for that activity (see ENGINE_ARCHITECTURE §7.11 for the activity names and defaults). Keys:
  * any outcome key: `text`, `speaker`, `awardXP`, `giveItem`, `giveDrachmae`, `setFlags`, `updateQuest`, `restoreHealth`, …;
  * `loseStamina`, `minutes` (time lost), `disposition` / `reputation` (social checks: towards the NPC and the NPC's faction), `discovery` (the location's natural-20 cache);
  * activity mechanics: `lootMultiplier` (pickpocket), `spareTool`, `breakTool`, `springTrap` (lockpick), `caught` (pickpocket), `masterwork`, `damageMaterial` (crafting), `enemyBonus`, `playerBonus`, `extraDamage`, `restoreStamina` (combat: attack, feint, flee, enemy_attack).

Content `skill_check` actions can choose the activity and their own critical outcomes:
```json
{
  "handlerType": "skill_check",
  "skillCheck": {
    "skill": "survival", "attribute": "wisdom", "dc": 13, "name": "Track the stag",
    "activity": "hunting",
    "success": { "text": "You find the stag." },
    "failure": { "text": "The trail goes cold." },
    "criticalSuccess": { "giveItem": "item_dried_figs_bread", "text": "You also find a forager's cache." },
    "criticalFailure": { "minutes": 60, "text": "You spook the herd and lose an hour." }
  }
}
```
`npcId` may be added to a social `skill_check` so `disposition` / `reputation` effects target that NPC. A skill check without `skill` (attribute only) works as a saving throw; it has criticals but no Reliable Talent.

---

## 25. Origins & Personality Traits (`origins.json`, `traits.json`)

Origins and traits are loaded exactly like classes and backgrounds, from the campaign's `modules`. **Any of `classes`, `backgrounds`, `origins` and `traits` may be one path or a list of paths**, so campaigns can reuse shared files (`content/shared/`) or another campaign's file. Entries are merged by `id`; a later file overrides an earlier one.

```json
"modules": {
  "origins": ["content/shared/origins.json", "content/campaigns/dev_test_campaign/world/origins.json"],
  "traits": ["content/shared/traits.json"]
}
```

```json
{ "origins": [
  { "id": "haven_born", "name": "Haven-Born", "description": "Raised behind the palisades.", "perks": "+1 Persuasion • Trusted by the citizens",
    "attributes": { "charisma": 1 }, "skills": { "persuasion": 1 }, "reputation": { "faction_dev_haven": 5 }, "piety": {}, "maxMorale": 0 }
] }
```
```json
{ "traits": [
  { "id": "eloquent", "name": "Silver-Tongued", "description": "A natural talker.", "perks": "+2 bonus on Persuasion & Deception checks.",
    "checkBonus": { "persuasion": 2, "deception": 2 } },
  { "id": "pious", "name": "Pious Devotee", "description": "…", "perks": "…", "piety": { "hermes": 2 }, "libationMultiplier": 2 }
] }
```
* Shared perk fields (origins and traits): `attributes`, `skills`, `piety`, `reputation` (faction id: delta), `maxMorale`.
* Trait-only fields: `checkBonus` (skill id: bonus on that skill's checks; `perception` also applies to perception-based checks), `libationMultiplier`.
* `perks` is the text shown on the card; write it to match the fields. `title` / `desc` / `perk` are accepted as older spellings.
* Without files: inline manifest `origins` / `traits`, else the built-in Greek lists (default campaign, `file://`), else a neutral "Wanderer" origin and no traits.
* The hero keeps a copy of the chosen trait's mechanics, so later edits to a trait file do not change existing heroes.


# Browser-RPG - Content Creation & Authoring Guide

> **Document Version:** 2.1.0  
> **Target Audience:** Developers, Content Authors, and AI Assistants (ChatGPT, Claude, Gemini, Antigravity, etc.)  
> **Core Principle:** **Engine built once, expanded through content indefinitely.**  
> New locations, dialogue trees, quests, actions, riddles, encounters, and items are added through standalone JSON definitions without needing to modify core engine functions.

---

## 📖 Table of Contents
1. [Architecture Overview & Content Philosophy](#1-architecture-overview--content-philosophy)
2. [Folder Structure & Content Files](#2-folder-structure--content-files)
3. [Creating a New Location](#3-creating-a-new-location)
4. [Creating an NPC & Dialogue Tree](#4-creating-an-npc--dialogue-tree)
5. [Creating Contextual Actions & Skill Checks](#5-creating-contextual-actions--skill-checks)
6. [Creating Puzzles & Inscribed Riddles](#6-creating-puzzles--inscribed-riddles)
7. [Creating Combat Encounters](#7-creating-combat-encounters)
8. [Creating Quests & Objectives](#8-creating-quests--objectives)
9. [Adding Items, Creatures & Lore Entries](#9-adding-items-creatures--lore-entries)
10. [Dual Content Synchronization (Offline Resilience)](#10-dual-content-synchronization-offline-resilience)
11. [Authoring Checklist & Best Practices](#11-authoring-checklist--best-practices)

---

## 1. Architecture Overview & Content Philosophy

The **Browser-RPG** engine is a content-agnostic interpreter. It provides:
- Classical d20 tabletop mechanics with literary outcome translation (no raw dice jargon).
- Persistent state, stamina/rest economics, travel fatigue, and calendar cycles.
- Declarative event dispatchers that execute actions, dialogues, puzzles, and encounters based purely on JSON properties.

### Three Golden Rules for Content Authors
1. **Never edit `index.html` simply to add story content.** Use JSON definitions in `content/world/` or `content/adventures/`.
2. **Always cite authentic ancient sources.** Classical deities, relics, monsters, and places must include `primarySources` or `mythologicalSource` (Homer, Hesiod, Apollodorus, Pausanias, etc.).
3. **Use explicit ID prefixes:**
   - Locations: `loc_...`
   - Characters/NPCs: `npc_...`
   - Dialogue trees: `dialogue_...`
   - Quests: `quest_...`
   - Actions: `act_...`
   - Puzzles: `puzzle_...`
   - Encounters: `enc_...`
   - Creatures: `creature_...`
   - Items: `item_...`
   - Deities: `deity_...`
   - Lore: `lore_...`

---

## 2. Folder Structure & Content Files

```
browser-rpg/
├── index.html                       # Core Game Engine (Content-agnostic interpreter)
├── DEVELOPER_NOTES.md               # Chronological hand-off log between collaborators
├── content/
│   ├── world/                       # Global World Database
│   │   ├── locations.json           # 19+ Classical Greek geography and waypoints
│   │   ├── characters.json          # Regional NPCs, sages, and priests
│   │   ├── creatures.json           # Tiers 1–5 bestiary with XP and combat actions
│   │   ├── items.json               # Relics, hoplite weapons, armor, consumables
│   │   ├── deities.json             # Olympian and chthonic pantheon
│   │   ├── mythology.json           # Mythological lore codex articles
│   │   └── glossary.json            # 28+ Classical Greek terms & plain English explanations
│   └── adventures/
│       └── tutorial.json            # Main story / adventure definitions (actions, riddles, quests)
└── documentation/
    ├── CONTENT_CREATION_GUIDE.md    # This guide
    └── templates/                   # Copy-paste JSON templates for rapid authoring
```

---

## 3. Creating a New Location

Locations are defined in `content/world/locations.json`. Each entry defines its geography, connections, and ambient narrative.

### Location Schema Example:
```json
{
  "id": "loc_mount_pelion_cavern",
  "name": "The Cavern of Chiron",
  "ancientName": "Pelion Antron Cheironos",
  "region": "Thessaly / Mount Pelion",
  "recommendedLevel": 2,
  "coordinates": { "x": 520, "y": 180 },
  "terrain": "mountain_cave",
  "connections": [
    {
      "targetLocationId": "loc_cithaeron_crossroads",
      "name": "The Thessalian Way",
      "distanceKm": 45.0,
      "travelHours": 9.0,
      "staminaCost": 12,
      "terrain": "mountain_trail",
      "dangerRating": 2
    }
  ],
  "narrative": {
    "overview": "Ancient wild laurel and medicinal dittany shelter the mossy entrance to the wise centaur's cave. The air is cool and fragrant with crushed herbs and sweet mountain honey.",
    "shortDescription": "A secluded mountain grotto renowned as the ancient sanctuary of the centaur tutor Chiron."
  },
  "presentNPCs": ["npc_chiron_centaur"],
  "presentItems": ["item_salve_asclepius"]
}
```

### Supported Fields:
- `id` (required, string): Unique identifier (`loc_...`).
- `name` (required, string): Display name.
- `ancientName` (optional, string): Classical Greek / Hellenistic toponym.
- `region` (required, string): Political or mythic region (e.g. `Boeotia`, `Argolis`, `Arcadia`, `Laconia`).
- `recommendedLevel` (required, integer): 1 to 5. Triggers peril notifications if a low-level hero enters.
- `coordinates` (required, object `{ x, y }`): Position on the SVG campaign map.
- `terrain` (required, string): `paved_road`, `mountain_trail`, `rocky_scrubland`, `sacred_grove`, `limestone_cave`, `swamp_marsh`.
- `connections` (required, array): Array of path objects with `targetLocationId`, `name`, `distanceKm`, `travelHours`, `staminaCost`, `dangerRating`.
- `presentNPCs` (optional, array): List of `npc_...` IDs present here.
- `presentItems` (optional, array): List of `item_...` IDs scattered or discoverable here.

---

## 4. Creating an NPC & Dialogue Tree

NPCs are registered in `content/world/characters.json` or inside an adventure pack. Dialogue trees live in `dialogues` (e.g. in `tutorial.json` or `characters.json`).

### Dialogue Tree Schema:
```json
{
  "dialogue_chiron_centaur": {
    "greeting": "Welcome to my hearth, ephebe of Hellas. Rest your spear and speak your inquiry.",
    "nodes": {
      "root": {
        "text": "The elder centaur leans upon an ash-wood staff, his eyes reflecting centuries of wisdom.",
        "choices": [
          {
            "label": "Teach me the lore of mountain herbs.",
            "target": "node_herbal_lore"
          },
          {
            "label": "I seek guidance on confronting the Hydra.",
            "target": "node_hydra_counsel",
            "condition": { "flag": "knows_hydra_peril", "expected": true }
          },
          {
            "label": "Farewell, noble teacher.",
            "target": "exit"
          }
        ]
      },
      "node_herbal_lore": {
        "text": "Cretan dittany knits flesh, while wild mountain honey prevents festering wounds. Take this jar of salve.",
        "giveItem": "item_salve_asclepius",
        "setFlags": { "learned_chiron_herbs": true },
        "awardXP": 25,
        "addJournalKnowledge": {
          "title": "Chiron's Herbology",
          "text": "The centaur tutor taught that combining dittany and mountain honey soothes mortal wounds."
        },
        "choices": [
          { "label": "Thank you, Chiron.", "target": "root" }
        ]
      }
    }
  }
}
```

### Supported Choice Node Outcomes:
- `setFlags`: `{ "flag_name": true / false }`
- `giveItem`: `"item_id"` (given once per save, and only if the hero does not already carry it)
- `giveDrachmae`: integer (given once per save)
- `awardXP`: integer (given once per save; also grants renown = XP / 10)
- `updateQuest`: `{ "questId": "...", "objectiveId": "...", "completed": true }` - objectives of later quest stages may be used; the quest moves to that stage
- `startQuest`: `"quest_id"` (no effect if already started)
- `completeQuest`: `"quest_id"` - completes **that** quest (the tutorial quest additionally shows its victory screen)
- `addJournalKnowledge`: `{ "title": "...", "text": "..." }`
- `addJournalChronicle`: `{ "title": "...", "text": "..." }`

One-time rewards are recorded in the save (`worldState.dialogueRewardsClaimed`), so revisiting a node or reloading the page never pays out twice.

### Linking NPCs to dialogue
An NPC opens the tree named by `dialogueTreeId` **or** `dialogueId`. NPCs without an authored tree still get a simple conversation generated from their `description`, their `knowledge` ids (matched to entries in `mythology.json`) and, for merchants, their `merchantInventory`.

---

## 5. Creating Contextual Actions & Skill Checks

Contextual actions appear in the Action Deck when the player is in a specific location and conditions are met. Add them to `contextActions` in `tutorial.json` or any adventure file.

### 5.1 Skill Check Action Example
```json
{
  "id": "act_climb_pelion_ridge",
  "category": "Exploration & Investigation",
  "locationId": "loc_mount_pelion_cavern",
  "title": "Scale the High Ridge of Pelion",
  "desc": "Climb the jagged rocks above the cave to gather sacred wild dittany.",
  "badge": "Agility Check",
  "type": "primary-quest-action",
  "requiresNotFlag": "climbed_pelion_ridge",
  "handlerType": "skill_check",
  "skillCheck": {
    "skill": "athletics",
    "attribute": "agility",
    "dc": 12,
    "name": "Athletics Climbing Check",
    "success": {
      "transcript": {
        "speaker": "Discovery",
        "text": "Finding agile footing upon the limestone ledges, you crest the ridge and discover fragrant wild dittany blooming in the sunlight!",
        "style": "entry-discovery"
      },
      "giveItem": "item_salve_asclepius",
      "setFlags": { "climbed_pelion_ridge": true },
      "awardXP": 35
    },
    "failure": {
      "transcript": {
        "speaker": "Narrator",
        "text": "A loose rock gives way under your sandal, forcing you to slide back to the ledge bruised and winded.",
        "style": "entry-prose"
      },
      "staminaDamage": 3
    }
  }
}
```

### 5.2 Sacred Offering / Item Action Example
```json
{
  "id": "act_offer_honey_chiron",
  "category": "Sacred Rites & Offerings",
  "locationId": "loc_mount_pelion_cavern",
  "title": "Offer Wild Honey to Chiron",
  "desc": "Gift a comb of mountain honey in respect of the centaur tutor (+2 Piety, Restores Stamina).",
  "badge": "Xenia Offering",
  "type": "sacred-action",
  "requiresItem": "item_dried_figs_bread",
  "handlerType": "item_action",
  "consumeItem": "item_dried_figs_bread",
  "outcome": {
    "setFlags": { "offered_honey_chiron": true },
    "restoreStamina": 6,
    "awardXP": 20,
    "transcript": {
      "speaker": "Gift of Xenia",
      "text": "Chiron accepts your offering with a nod of approval: 'A courteous hero is twice blessed by Zeus Xenios.'",
      "style": "entry-discovery"
    }
  }
}
```

### 5.3 Interactive Minigame Action Example
```json
{
  "id": "act_hunt_pelion_deer",
  "category": "Exploration & Investigation",
  "locationId": "loc_mount_pelion_cavern",
  "title": "Stalk Mountain Game on Pelion [Interactive Challenge]",
  "desc": "Time your footsteps with the mountain gusts to stalk game and gather rations.",
  "badge": "Hunting Minigame",
  "type": "primary-quest-action",
  "handlerType": "minigame",
  "minigameType": "stalk",
  "minigameConfig": { "targetName": "Pelion Red Deer & Forest Herbs" }
}
```

---

## 6. Creating Puzzles & Inscribed Riddles

Puzzles are declared in the `puzzles` array. The engine's generic `PuzzleEngine` manages clue verification, free-text keyword matching, and reward dispatching.

### Puzzle Schema Example:
```json
{
  "id": "puzzle_chiron_riddle",
  "locationId": "loc_mount_pelion_cavern",
  "title": "The Centaur's Enigma",
  "prompt": "Carved into the cedar chest in Chiron's cave is a riddle of the Heroic Age:\n\n'What spear did Chiron fashion from the tallest ash of Mount Pelion, which no man save Peleus and his son could lift?'",
  "clueJournalIds": ["lore_mount_pelion", "knows_peleus_spear"],
  "acceptedKeywords": ["pelian ash", "spear of peleus", "pelian spear", "ash spear", "peleus"],
  "successOutcome": {
    "text": "You speak the sacred name: 'The Pelian Ash!' The heavy bronze hasp springs open, revealing ancestral armor within!",
    "setFlags": { "chiron_chest_opened": true },
    "giveItem": "item_cyclopean_bronze_spear",
    "awardXP": 100,
    "addJournalChronicle": {
      "title": "The Centaur's Chest",
      "text": "Answered Chiron's enigma of the Pelian Ash spear and claimed heroic armament."
    }
  },
  "hint": "Chiron crafted the great spear of Peleus from the ash trees of Pelion, as sung in Homer's Iliad."
}
```

---

## 7. Creating Combat Encounters

Encounters are declared in the `encounters` array. When triggered, the engine initializes turn-based combat with tactical options (Shield Block, Feint, Strike) and automatically dispatches victory outcomes.

* An encounter is offered only while its `triggerCondition` (`flag` / `expected`) holds.
* Every attack roll uses the shared D20 rules: natural 20 / natural 1 are critical for the hero and for creatures alike (CONTENT_SCHEMA §24).
* Once won, an encounter is **one-time** unless it sets `"repeatable": true`; a repeatable encounter comes back after `cooldownHours` (or, without a cooldown, when its creature respawns). Make farmable fights repeatable on purpose and give them a cooldown.

### Encounter Schema Example:
```json
{
  "id": "enc_pelion_boar",
  "locationId": "loc_mount_pelion_cavern",
  "triggerCondition": { "flag": "approached_thicket", "expected": true },
  "creatureId": "creature_cithaeron_wolf",
  "introProse": "A savage wild boar with razor-sharp curved tusks bursts from the underbrush, snorting furiously as its hooves tear through the moss!",
  "victoryOutcome": {
    "text": "With a decisive spear-thrust, you bring down the raging boar! Its curved tusks yield magnificent trophies.",
    "setFlags": { "pelion_boar_slain": true },
    "giveItem": "item_boar_tusk_helmet",
    "awardXP": 120,
    "addJournalChronicle": {
      "title": "The Boar of Mount Pelion",
      "text": "Slew the ferocious boar haunting the upper crags of Mount Pelion."
    }
  }
}
```

---

## 8. Creating Quests & Objectives

Quests are declared in the `quests` array. They track stages, individual objectives, and overall rewards.

### Quest Schema Example:
```json
{
  "id": "quest_chiron_medicinal_herbs",
  "title": "The Healing Balm of Pelion",
  "category": "Heroic Quest",
  "summary": "Master Chiron has requested rare dittany from the high windswept crags to brew a healing poultice for wounded pilgrims.",
  "currentStage": "gather_herbs",
  "stages": {
    "gather_herbs": {
      "description": "Ascend the high ridge above the cavern to gather fresh dittany.",
      "objectives": [
        { "id": "obj_climb_ridge", "text": "Scale the sheer ridge above Chiron's cave.", "completed": false },
        { "id": "obj_harvest_dittany", "text": "Harvest wild dittany from the mountain crevices.", "completed": false }
      ]
    },
    "return_to_chiron": {
      "description": "Bring the freshly harvested herbs back to Chiron in his cave.",
      "objectives": [
        { "id": "obj_deliver_herbs", "text": "Deliver the herbs to Chiron.", "completed": false }
      ]
    }
  },
  "rewards": {
    "experience": 150,
    "drachmae": 25,
    "items": ["item_salve_asclepius"],
    "renown": 15
  }
}
```

---

## 9. Adding Items, Creatures & Lore Entries

### 9.1 Item Schema (`content/world/items.json`)
```json
{
  "id": "item_mycenaean_dagger",
  "name": "Inlaid Bronze Dagger of Mycenae",
  "ancientGreek": "ἐγχειρίδιον",
  "category": "weapon",
  "slot": "main_hand",
  "rarity": "exceptional",
  "weightKg": 0.8,
  "valueDrachmae": 30,
  "stats": {
    "damageMin": 4,
    "damageMax": 8,
    "damageType": "piercing",
    "reachBonus": 0
  },
  "description": "A bronze dagger inlaid with niello and gold depicting a lion hunt.",
  "mythologicalLore": {
    "source": "Pausanias 2.16.5",
    "note": "Excavated from the royal shaft graves of Mycenae."
  }
}
```

### 9.2 Creature Schema (`content/world/creatures.json`)
```json
{
  "id": "creature_nemean_lion",
  "name": "The Nemean Lion",
  "ancientGreek": "λέων τῆς Νεμέας",
  "tier": 4,
  "xpReward": 250,
  "level": 4,
  "stats": {
    "health": 60,
    "armorClass": 16,
    "damageReduction": 3,
    "speed": 12
  },
  "actions": [
    { "name": "Crushing Paw", "damageMin": 8, "damageMax": 16, "damageType": "bludgeoning", "attackBonus": 5 },
    { "name": "Throat Rend", "damageMin": 10, "damageMax": 20, "damageType": "slashing", "attackBonus": 6 }
  ],
  "mythologicalSource": {
    "author": "Hesiod",
    "work": "Theogony",
    "passage": "line 327",
    "notes": "Offspring of Echidna, with an impenetrable hide that could not be pierced by mortal weapons."
  }
}
```

---

## 10. Dual Content Synchronization (Offline Resilience)

The RPG engine supports **offline `file:///` play** without a web server. Browsers restrict `fetch()` requests when loading from local disk (`file:///`).

To guarantee offline play:
1. When you add new items, locations, creatures, or lore to JSON files in `content/`, also update the embedded compact fallback data in `index.html`:
   - `loadEmbeddedFallbackContent()`: Contains compact JSON arrays for locations, creatures, items, and deities.
   - `getEmbeddedFallbackAdventure()`: Contains compact JSON for the active adventure.
2. `tests/behaviour_tests.js` ("Dual content") verifies that the embedded Dev campaign has the same location, NPC, creature, item and quest ids as its JSON files, that the embedded Greek items are a subset of `items.json`, and that every embedded class starting item exists in the embedded catalog.
3. The embedded Greek fallback is intentionally a **reduced subset** (no crafting toolkits or materials, fewer items). For full play serve the folder over HTTP (`python server.py`).

---

## 11. Authoring Checklist & Best Practices

Before committing new content:
- [ ] Unique `id` prefixed with entity type (`loc_`, `npc_`, `act_`, `item_`, etc.).
- [ ] Validated JSON syntax (no trailing commas, properly closed quotes).
- [ ] Ancient literary source cited (`author`, `work`, `passage`).
- [ ] Connect new locations back to existing locations so the player can travel to and from them.
- [ ] Plain-English outcomes used in action narratives (no raw D&D calculation formulas).
- [ ] **No em dashes (`\u2014`)** anywhere in authored campaign JSON files, manifests, or documentation (use `-`, `,`, or `:` instead; `validateCampaign()` rejects em dashes as errors).
- [ ] **Guaranteed usable weapon**: any combat-enabled campaign provides at least one obtainable, equippable weapon (`type: "weapon"` or `slot: "main_hand"` / `"two_hand"`) in starting equipment, at `startingLocationId`, or via a starting-location merchant.
- [ ] Run the test suites: `npm test` (legacy + behaviour tests, no dependencies) and, if Playwright is installed, `npm run test:browser`.
- [ ] Run **Validate Campaign** on the campaign screen: it now also reports item ids referenced by loot tables, creature loot, merchant stock and class/background starting equipment that do not exist.

---

## 12. Authoring a Full Campaign & Using the Campaign Validation Engine

### 12.1 Campaign Directory Structure
To author a new campaign or adventure world:
1. Create a directory under `content/campaigns/<campaign_id>/`.
2. Place a `campaign.json` manifest in the folder.
3. Organize modular content files (recommended under `content/campaigns/<campaign_id>/world/`):
   - `locations.json`: Waypoints, connections, coordinates, and ambient prose.
   - `characters.json`: Living NPCs, merchants, guards, dispositions, and combat stats.
   - `creatures.json`: Bestiary entries, boss phase thresholds, and combat actions.
   - `items.json`: Equipment, relics, keys, and lockpicking tools.
   - `loot_tables.json`: Drop chance tables, guaranteed drops, and repeat kill currency.
   - `interactive_objects.json`: Doors, trapped chests, shrines, and unpickable obstacles.
   - `factions.json`: Faction identities, initial reputations, and threshold parameters.
   - `quests.json`: Linear or branching quests with objective stages and alternate death failovers.
   - `encounters.json`: Boss encounters with intro prose, cooldown hours, and victory triggers.
   - `dialogues.json`: Decoupled conversation trees with conditional node branches.
   - `events.json`: World events that react to `FLAG_SET`, `ITEM_ACQUIRED` or `ENTITY_DEATH` (see CONTENT_SCHEMA §23). Manifest `consequenceRules` cover the same triggers.

> **file:// mode:** both built-in campaigns also exist as a compressed embedded copy inside `index.html`. After editing any of their files, run `npm run sync:embedded` (`node scripts/sync-embedded-content.js`). `npm test` fails while the copy is out of date.

### 12.2 Using the Campaign Content Validation Engine
The engine includes a built-in static validator:
```javascript
const validation = GreekMythologyEngine.validateCampaign(manifest, content);
if (!validation.valid) {
  console.error("Campaign has critical errors:", validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn("Campaign warnings:", validation.warnings);
}
```
Validation checks performed:
1. **Structural Schemas**: Required metadata (`id`, `name`, `version`, `modules`), starting location, coordinate types, vitals, and actions.
2. **Referential Integrity**: All connection targets, NPC locations, drop items, shop stocks, and quest prerequisites must exist.
3. **Circular Quest Dependencies**: Identifies recursive or looping prerequisites in quests using graph cycle detection.
4. **Physical Logic Audits**: Flags mechanical incongruities (e.g. unpickable boulders erroneously configured as pickable).

In-game, players and creators can inspect campaign validity anytime via the **Campaign Validator Modal** (`window.engine.runComprehensiveCampaignValidation()`).

---

## 13. Authoring Universal Campaign Systems: Classes, Backgrounds, Professions, Materials & Crafting

The Universal RPG Engine enables content authors to define entirely different genres, mythologies, and rule systems without touching engine code.

### 13.1 Custom Classes (`classes.json`)
Each campaign can define its own roster of playable classes:
```json
{
  "classes": [
    {
      "id": "runic_berserker",
      "name": "Runic Berserker",
      "subtitle": "Fury of the Einherjar",
      "archetype": "Warrior & Skirmisher",
      "description": "Ferocious Norse warrior channeling ancient elder futhark runes to shrug off agony in battle.",
      "primaryAttributes": ["strength", "endurance"],
      "statBonuses": { "strength": 2, "endurance": 1 },
      "proficiencies": ["two_handed_axes", "medium_armor", "intimidation"],
      "classFeatures": [
        { "level": 1, "name": "Viking Rage", "type": "active", "desc": "+3 melee weapon damage for 3 turns." }
      ],
      "startingEquipment": ["item_dane_axe", "item_wolf_fur_jerkin"]
    }
  ]
}
```

### 13.2 Custom Backgrounds (`backgrounds.json`)
Backgrounds provide narrative origins, skill proficiencies, and unique dialogue perks:
```json
{
  "backgrounds": [
    {
      "id": "bg_skald",
      "name": "Court Skald",
      "category": "Lore & Tradition",
      "description": "Keeper of genealogical sagas and praise poetry in the mead-halls of jarls.",
      "proficiencies": ["oratory", "mythology_lore"],
      "passiveBonus": "+2 Charisma checks when bargaining with chieftain factions.",
      "dialoguePerk": "Unlocks skaldic poetry dialogue options when speaking with leaders and gods."
    }
  ]
}
```

### 13.3 Consolidated Professions & Toolkits (`professions.json`)
Declare crafting disciplines tailored to your world:
```json
{
  "professions": [
    {
      "id": "runecarving",
      "name": "Runecarving & Inscription",
      "governingAttribute": "wisdom",
      "requiredToolkitId": "item_toolkit_runic_chisel",
      "workstation": "runic_altar",
      "description": "Chiseling sacred symbols into bog iron and rowan wood to empower arms.",
      "itemCategories": ["talisman", "enchanted_weapon"]
    }
  ]
}
```

### 13.4 Standardized Materials (`materials.json`)
Crafting materials define physical and magical properties that scale dynamic items:
```json
{
  "materials": [
    {
      "id": "mat_bog_iron",
      "name": "Bog Iron Bloom",
      "category": "metal",
      "rarity": "common",
      "weightKg": 2.0,
      "valueDrachmae": 8,
      "properties": {
        "hardness": 6,
        "durability": 7,
        "flexibility": 3,
        "heatResistance": 7,
        "magicalAffinity": 4,
        "purity": 70
      },
      "compatibleProfessions": ["metalworking", "runecarving"]
    }
  ]
}
```

### 13.5 Crafting Templates (`crafting_templates.json`)
Templates define base equipment geometries and slots for recipe-free procedural synthesis:
```json
{
  "templates": [
    {
      "id": "template_dane_axe",
      "name": "Two-Handed Broadaxe",
      "professionId": "metalworking",
      "slot": "two_hand",
      "category": "weapon",
      "baseDamageMin": 6,
      "baseDamageMax": 12,
      "baseWeightKg": 3.5,
      "baseValueDrachmae": 35,
      "primaryMaterialSlots": 2,
      "allowedSupplementarySlots": 1,
      "baseDC": 12,
      "description": "A long-hafted battle axe capable of shearing through shields."
    }
  ]
}
```

### 13.6 The Zero-Engine-Modification Principle
When building a new campaign:
1. Declare your new modules in `content/campaigns/<campaign_id>/campaign.json` under `modules`.
2. Populate the JSON files in `content/campaigns/<campaign_id>/`.
3. Provide embedded fallback data in `index.html` (e.g. `loadEmbeddedFallbackContent()` or dedicated method) if offline `file:///` support is desired.
4. Run `node tests/engine_tests.js` to verify integrity.
5. Launch the game and select your campaign from `#view-campaign-select`!

---

## 14. Dynamic World Time, Timed Quests, Respawns, and Morality Authoring Guide

### 14.1 Configuring Activity Durations per Campaign
In `content/campaigns/<campaign_id>/campaign.json`, define the `activityDurations` object with durations in minutes:
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
*Note: Menu interactions and inventory browsing take 0 minutes so players can read lore and manage gear without penalizing in-game time.*

### 14.2 Authoring Time-Sensitive Quests
In `world/quests.json`:
- **Urgent Quests**: Add `"deadlineHours": <number>` and optionally `"earlyCompletionBonusHours": <number>`.
- **Milestones**: Add intermediate notifications and status changes that occur after specific elapsed hours.
- **Timeless Quests**: Simply omit `deadlineHours` to allow the player to pursue the quest at their own pace without arbitrary penalties.

```json
{
  "id": "quest_courier_urgent",
  "name": "Urgent Message to Delphi",
  "category": "urgent",
  "deadlineHours": 36,
  "earlyCompletionBonusHours": 18,
  "earlyCompletionReward": { "xp": 75, "currency": 30 }
}
```

### 14.3 Configuring Creature & Boss Respawns
In `world/creatures.json`:
- Set `"respawnHours": <hours>` (e.g. 12 for wolves/boars, 72 for legendary beasts).
- Bosses marked with `"isBoss": true` respawn according to `respawnHours` using event-driven scheduling. Their encounter (in `encounters.json`) must set `"repeatable": true` (and usually `cooldownHours`) to be fought again; non-repeatable encounters are one-time.
- Unique relics listed in loot tables are awarded only on the first victory; subsequent victories award level-scaled drachmae to prevent item duplication exploits.

### 14.4 Defining Moral Choices & Alignment Consequences
In `campaign.json`, configure the `moralityConfig` labels and starting balances.
In quests and dialogues, grant Virtue (*Arete*) or Hubris (*Miasma*) through outcome payloads or dialogue choices:
```json
{
  "text": "Mercy: Spare the trembling captive and bandage his wounds.",
  "outcome": {
    "transcript": "You cut his bonds and offer water. He swears gratitude by the Styx.",
    "virtue": 15,
    "hubris": 0
  }
}
```

### 14.5 Permanent NPC Death Rule
- Living NPCs (`npcs` in `characters.json`) are unique mortal entities.
- Slaying an NPC permanently records their death in `worldState.permanentNpcDeaths`.
- NPCs never respawn. Any quest tied to a slain NPC triggers alternative failovers or journal updates, and the engine schedules a delayed murder investigation event.

## 15. People, Shops and Fights Worth Choosing (v1.7.0)

* **Give every quest a beginning and an end.** Set `autoStart: false` on quests an NPC offers (`startQuest` in their dialogue) or that the player discovers (objects and actions that update a quest start it automatically). Turn-ins are dialogue choices with a `questStage` condition and a node with `completeQuest`; the quest's `rewards` are paid there once. Use stage `next` when a branch should skip ahead (see the Dev rescue quest).
* **Let standing matter.** Give NPCs a `faction` and `disposition`; gate the best dialogue with `minStanding: "friendly"` / `"trusted"` (players see it locked until then); give quest-giving nodes nothing extra: completing the quest already improves the giver's opinion. Use `hostileAction: "attack"` for people who will not tolerate an enemy (guards, outlaws).
* **Shops**: `isMerchant` + `merchantInventory`; add `openTrade: true` to the node where the merchant says "have a look".
* **Fights**: decide who starts each encounter. A beast you can stalk: leave `initiative` unset and write an `approachProse`. Something that springs on you: `initiative: "enemy"`; if the story makes escape impossible, add `unavoidable: true`. Add location `tactics` that fit the place (a brazier in a crypt, a bramble thicket in a forest) so preparation feels local. A failed sneak can start a fight with `startEncounter` in the failure outcome.
* **Things to find**: `presentItems` on a location are found with the Search card; rarer items need better Perception.
* **Next steps**: the ★ strip finds quest progress by looking for `questId` / `completeQuest` / `questActive` in actions, encounter `victoryOutcome`s, object `unlockOutcome`s and the first choices of conversations. Progress written that way is pointed out to players automatically; progress that only happens through `events.json` is not.

Field details: CONTENT_SCHEMA §26–§28.

## 16. Fights and Journeys with Texture (v1.8.0)

* **Give signature attacks a tell.** Mark a creature's big attack `style: "heavy"` with a `telegraph` line, so players learn to brace or side-step it; add `inflicts` to the attacks that should leave a mark (a wolf's bite bleeds, a howl frightens).
* **Every class feature needs an `effect` or a `combat` block** (a test enforces it). Write the description from the mechanics, not the other way round.
* **Companions**: a `companion` block on an NPC is all it takes; add `hireCost` for hirelings or recruit through dialogue.
* **Hide things**: two or three `hiddenSpots` per important location, at different DCs, so searching again (or coming back in daylight) pays off. A spot whose outcome sets a flag can open a road with `requiresFlag`.
* **Let people talk**: `rumours` on NPCs point players at far places before they can reach them.
* **Sell food**: mark provisions `ration: true` and stock them with a merchant near every long road.

Field details: CONTENT_SCHEMA §29–§30.

---

## 17. Gameplay Consistency, Difficulty Modes & Policy Rules (v1.9.0)

* **Forbidden Em Dashes (`U+2014`)**: Never use Unicode em dashes in generated campaign JSON, manifests, or documentation. `GreekMythologyEngine.validateCampaign()` scans the manifest and all loaded content sections and flags any `\u2014` as an error.
* **Guaranteed Usable Weapon**: Every combat campaign (`features.combat !== false` with creatures present) must define at least one weapon (`type: "weapon"` or `slot: "main_hand"` / `"two_hand"`) that can be obtained immediately from `startingEquipment` (manifest/classes/backgrounds) or from merchants/locations/dialogues at `startingLocationId`.
* **Primary & Secondary Dependencies**: Every skill in `campaign.json` (`skillDependencies`) and profession in `professions.json` (`governingAttribute` + `secondaryAttribute`) uses one primary attribute modifier plus `Math.ceil(Math.max(0, secMod) / 2)` from its secondary attribute.
* **Action Cooldowns**: Configure per-campaign cooldown durations in hours via `cooldownRules` in `campaign.json` (`persuade`, `deceive`, `negotiate`, `bluff`, `pickpocket`, `track`, `forage`, `confrontation_prep`). Cooldowns are tracked purely from in-game world timestamps (`worldState.actionCooldowns`).
* **Campaign Difficulty Modes**: Players choose `easy`, `normal`, `hard`, or `extreme` before starting a campaign. Authors can set `defaultDifficulty` or customize presets via `difficultyPresets` in `campaign.json` (`maxRespawns`, `dropNonEssentialPct`, `deathPenaltyDrachmae`, `respawnHealthPct`). Equipped gear and quest/key/relic items are always spared when dropping non-essential supplies on defeat.

Field details: CONTENT_SCHEMA §31.

---

## 18. Rest Rules, Glossaries, NPC Possessions, Mandatory Items & Validation (Session 21)

### 18.1 Location-Based Rest & Camping Rules
Rest and camp actions are never available globally from the top status bar. Every location controls rest availability dynamically via `evaluateRestAvailability()`:
* `restSafety`: `"sanctuary"` | `"settlement"` | `"wild"` | `"restricted"` | `"forbidden"`.
* `noRest: true` or `restRules: { allowRest: false, allowCamp: false }`: blocks resting cleanly in both UI and engine execution.
* `restRules` (or `restConfig`): supports `allowRest`, `allowCamp`, `sacredAllowed`, `requiresFlag`, `blockedByFlag` / `requiresNotFlag`, `requiresQuestCompleted`, `requiresNpcId`, `blockedInWeather`, `facilityName`, `restBlockedReason`, and `campBlockedReason`.

### 18.2 Contextual Glossary Authoring (`glossary.json`)
Copy [glossary_template.json](documentation/templates/glossary_template.json) when creating a campaign glossary:
* Every entry MUST include non-empty `key`, `terms` (array of match strings), and explanatory text (`simpleEnglish` and/or `explanation`), plus optional `name`, `category`, and `significance`.
* Empty entries without `simpleEnglish`/`explanation` are skipped at runtime so blank popups never appear, and are flagged as errors by `validateCampaign()`.

### 18.3 NPC Equipment & Carried Inventory (`characters.json`)
Give NPCs realistic inspectable gear and pocket items separate from `merchantInventory` shop stock:
* `equipment`: object map (`{ "main_hand": "item_sword", "body": "item_leather" }`) or array of item ids.
* `inventory`: array of personal carried item ids or `{ "itemId", "quantity" }` objects.
* `drachmae`: optional explicit coin purse amount.
* At first inspection, pickpocket, or combat defeat, `getNpcPossessions()` materializes one persistent state record so inspecting, stealing, and looting on death stay 100% consistent.

### 18.4 Mandatory Action Item Checks & Failed Quest NPCs
* Action conditions (`{ "type": "item", "itemId": "item_rope", "quantity": 1, "equipped": false }`) and shorthand fields (`requiresItem`, `requiresQuantity`, `requiresEquipped`) are validated in both UI pills and inside `executeGenericAction()`.
* Quests may define `"onFail": { "setFlags": { ... }, "removeCharacter": "npc_id" }`, and NPCs may declare `"presenceCondition": { "questNotFailed": "quest_id", "flag": "...", "expected": false }` so NPCs and actions tied to a failed quest vanish consistently across travel and save/load.

* Time milestones accept `"ifStage": ["stage_a", "stage_b"]` (one stage or a list). Give a `fail` milestone an `ifStage` so the deadline cannot fail a quest whose goal is already achieved (Pip in the Dev campaign fails only while still stranded).
* Equipment slots for NPCs are the hero's slots: `main_hand`, `off_hand`, `head`, `body`, `hands`, `feet`, `back`, `neck`, `ring_1`, `ring_2`.
* The herbal mortar heals like a rest, so it follows the same location rules as a short rest or camp.

Field details: CONTENT_SCHEMA §33.

## 19. Crafting from the Bag: Workbenches and Combinations (Session 23)

### 19.1 Workbenches come for free
Every toolkit that a profession names as `requiredToolkitId` is a workbench. Dropping a material on the toolkit in the
Inventory (or pressing its "Workbench" button) opens that profession's bench; two materials list everything the
profession can make, a third adds a complement, and the player can play the `forge` minigame first for +1 to +3.
To decide which materials fit, give each material `"compatibleProfessions": ["your_profession_id"]`.

### 19.2 Writing combinations
Add `combinations.json` and list it in `campaign.json` → `modules.combinations`. Three patterns cover most needs:
```json
{ "combinations": [
  { "id": "comb_hone_knife", "name": "Hone the edge", "apply": "item_whetstone", "onto": "item_knife",
    "result": "item_knife_honed", "consumeApplied": 0, "minutes": 10, "text": "You work the edge on the stone." },
  { "id": "comb_poison_blade", "name": "Coat with venom", "apply": "item_venom",
    "onto": { "category": "weapon", "damageTypes": ["piercing", "slashing"] },
    "coating": { "name": "Venom", "charges": 3, "status": { "id": "poisoned", "rounds": 2, "value": 3 } } },
  { "id": "comb_strong_tonic", "name": "Steep with herbs", "apply": "mat_herb", "onto": "item_tonic",
    "result": "item_strong_tonic", "requiresItem": "item_herbal_kit",
    "check": { "skill": "medicine", "attribute": "wisdom", "dc": 10, "failureConsumesApplied": true } }
] }
```
* A permanent upgrade needs its own result item (one combination per blade); a coating works on any matching weapon.
* `consumeApplied: 0` keeps tools such as whetstones; leave it out for consumables.
* Use `ITEM_COMBINED` in `events.json` to react (the Dev Trial Ledger counts it as crafting).
* Ready-made template: `documentation/templates/combination_template.json`. Field details: CONTENT_SCHEMA §34.


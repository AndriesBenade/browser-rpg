# Greek Mythology RPG — Content Creation & Authoring Guide

> **Document Version:** 2.0.0  
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

The Greek Mythology RPG engine is a content-agnostic interpreter. It provides:
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
- `giveItem`: `"item_id"`
- `giveDrachmae`: integer
- `awardXP`: integer
- `updateQuest`: `{ "questId": "...", "objectiveId": "...", "completed": true }`
- `completeQuest`: `"quest_id"`
- `addJournalKnowledge`: `{ "title": "...", "text": "..." }`
- `addJournalChronicle`: `{ "title": "...", "text": "..." }`

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
2. The engine's test suite automatically verifies that all locations, creatures, and items exist in both external JSON files and the embedded fallback.

---

## 11. Authoring Checklist & Best Practices

Before committing new content:
- [ ] Unique `id` prefixed with entity type (`loc_`, `npc_`, `act_`, `item_`, etc.).
- [ ] Validated JSON syntax (no trailing commas, properly closed quotes).
- [ ] Ancient literary source cited (`author`, `work`, `passage`).
- [ ] Connect new locations back to existing locations so the player can travel to and from them.
- [ ] Plain-English outcomes used in action narratives (no raw D&D calculation formulas).
- [ ] Run the test suite: `node tests/engine_tests.js` to ensure 100% test passing!

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
   - `events.json`: Consequence rules and scheduled delayed world events.

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

# Greek Mythology RPG — Engine Architecture Specification
**Document Version:** 1.0.0  
**Target Engine Version:** v0.1.0-alpha  
**Author:** Lead Software Architect & Systems Designer  

---

## 1. Executive Summary & Design Philosophy

The **Greek Mythology RPG Engine** is a browser-based, data-driven, tabletop-inspired roleplaying engine built with standard web technologies (HTML5, CSS3, Vanilla ES6+ JavaScript, SVG, IndexedDB). It is engineered for long-term campaigns rooted in authentic classical Greek mythology, literature, and history.

### Core Architectural Pillars
1. **Strict Separation of Engine & Content:** The engine is a general-purpose, content-agnostic interpreter. All locations, dialogue, quests, items, creatures, deities, and narrative logic reside in external, versioned JSON packs.
2. **Tabletop RPG Fidelity:** Game mechanics evoke pen-and-paper roleplaying (attributes, skill checks, situational modifiers, non-linear problem solving, consequential world states) rather than arcade or linear visual novel tropes.
3. **Dual Action Paradigm:** Supports both contextual, curated choices and an open-ended custom action input evaluated through an extensible intent/rules parser (designed with an abstraction layer ready for optional AI/LLM augmentation).
4. **Authentic Mythological Grounding:** Built-in data structures support classical attributions, regional traditions, divine favour/wrath, ritual sacrifice, *miasma* (ritual pollution), *arete* (heroic excellence), and *xenia* (hospitality).
5. **Zero-Dependency Core:** Self-contained in standard vanilla web standards, runnable offline or via any standard static HTTP server, storing saves robustly in IndexedDB.

---

## 2. System Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                PRESENTATION LAYER                                 |
|  +-----------------------------------------------------------------------------+  |
|  | Navigation Bar: [Story] [World Map] [Character] [Inventory] [Quests]        |  |
|  |                 [Journal] [Codex] [Pantheon] [Settings]                     |  |
|  +-----------------------------------------------------------------------------+  |
|  | Primary Viewport:                                                           |  |
|  | - Narrative Log & Dialogue Feed (Rich prose, formatting, speaker badges)     |  |
|  | - Interactive Map (Interactive SVG campaign cartography with travel nodes) |  |
|  | - Character Sheet / Inventory Matrix / Quest Log / Categorized Journal      |  |
|  +-----------------------------------------------------------------------------+  |
|  | Action Console & Command Tray:                                              |  |
|  | - Contextual Action Buttons | Dialogue Choices | Custom Text Action Bar     |  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                               CORE ENGINE SYSTEMS                                 |
|  +---------------------+   +---------------------+   +--------------------------+  |
|  |   ActionEngine      |   |    RulesEngine      |   |       QuestManager       |  |
|  | - Context evaluator |   | - d20 + mod checks  |   | - Multi-stage tracker    |  |
|  | - Intent parser     |   | - Combat resolution |   | - Hidden/optional goals  |  |
|  | - Dialogue runner   |   | - Opposed rolls     |   | - Branching conditions   |  |
|  +---------------------+   +---------------------+   +--------------------------+  |
|  +---------------------+   +---------------------+   +--------------------------+  |
|  |     MapEngine       |   |   JournalChronicle  |   |    TimeCalendarSystem    |  |
|  | - Node pathfinding  |   | - Discoveries & lore|   | - Solar/lunar day cycle  |  |
|  | - Travel/fatigue    |   | - Clues & mysteries |   | - Season & sacred days   |  |
|  | - Encounter checks  |   | - Player notes      |   | - Time-dependent events  |  |
|  +---------------------+   +---------------------+   +--------------------------+  |
|  +---------------------+   +---------------------+   +--------------------------+  |
|  |    ContentLoader    |   |    EventBusEngine   |   |       CombatEngine       |  |
|  | - Schema validator  |   | - Publish/Subscribe |   | - Turn-based narrative   |  |
|  | - Pack registry     |   | - State mutators    |   | - Tactical options       |  |
|  | - Modularity manager|   | - Consequence log   |   | - Mythic traits & status |  |
|  +---------------------+   +---------------------+   +--------------------------+  |
+-----------------------------------------------------------------------------------+
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
+---------------------------------------+ +-----------------------------------------+
|              GAME STATE               | |            CONTENT DATA (JSON)          |
| - Player Entity (attributes, skills,  | | - World Database (/content/world/)      |
|   vitals, equipment, inventory)       | |   • locations.json, characters.json     |
| - World Flags & Consequence Record    | |   • creatures.json, items.json          |
| - Active & Completed Quests           | |   • deities.json, mythology.json        |
| - Journal, Codex, & Known Clues       | | - Adventure Packs (/content/adventures/)|
| - NPC Dispositions & Relationship Map | |   • tutorial.json                       |
| - Time, Calendar, & Environment       | |   • future_adventure_*.json             |
+---------------------------------------+ +-----------------------------------------+
                    │
                    ▼
+-----------------------------------------------------------------------------------+
|                               PERSISTENCE LAYER                                   |
| - IndexedDB: Multi-slot saves, auto-saves, snapshots, export/import JSON          |
| - LocalStorage: Audio settings, UI preferences, text speed, font scaling         |
+-----------------------------------------------------------------------------------+
```

---

## 3. Subsystem Detailed Specifications

### 3.1 StateManager & Central Game State
The `StateManager` encapsulates the complete serialisable game state. State transitions occur strictly via controlled mutations dispatched through the engine, ensuring idempotency, undo/redo compatibility, and crash-resilient persistence.

#### State Structure
```javascript
{
  version: "1.0.0",
  saveId: "save_slot_01",
  timestamp: 1731234567890,
  playtimeSeconds: 1420,
  player: {
    id: "player_character",
    name: "Alkaios",
    gender: "male",
    origin: "mortal_freeman", // extensible to demigod_heritage, mystery_cult, etc.
    background: "hoplite_veteran",
    appearance: "Lean, sun-bronzed with a faded spear scar across the left forearm.",
    vitals: {
      health: 24,
      maxHealth: 24,
      stamina: 18,
      maxStamina: 18,
      morale: 15,
      maxMorale: 15
    },
    attributes: {
      strength: 14,     // physical power, melee prowess, carrying capacity
      agility: 12,      // reflexes, speed, evasion, balance
      endurance: 15,    // stamina, poison/disease resistance, march endurance
      intelligence: 11, // logic, deduction, tactical appraisal, literacy
      wisdom: 13,       // perception, mythological insight, reading people, piety
      charisma: 12      // persuasion, leadership, intimidation, eloquence
    },
    skills: {
      melee_combat: 3,
      ranged_combat: 1,
      stealth: 1,
      persuasion: 2,
      deception: 0,
      survival: 2,
      tracking: 1,
      medicine: 1,
      mythology_lore: 2,
      investigation: 2,
      athletics: 2
    },
    traits: ["hoplite_discipline", "favored_by_local_nymph"],
    piety: {
      athena: 2,
      apollo: 0,
      hermes: 1,
      poseidon: -1
    },
    currencies: {
      drachmae: 45,
      obols: 4
    },
    inventory: [
      { itemId: "item_dory_spear_001", quantity: 1, equipped: true, slot: "main_hand" },
      { itemId: "item_aspide_shield_001", quantity: 1, equipped: true, slot: "off_hand" },
      { itemId: "item_linothorax_001", quantity: 1, equipped: true, slot: "body" },
      { itemId: "item_dried_figs_001", quantity: 3, equipped: false }
    ],
    activeEffects: []
  },
  world: {
    currentLocationId: "loc_cithaeron_crossroads",
    discoveredLocations: ["loc_cithaeron_crossroads", "loc_shrine_hermes"],
    dateTime: {
      year: 1, // Mythic epoch
      month: 4, // Elaphebolion (Attic calendar)
      day: 14,
      hour: 10,
      minute: 30
    },
    weather: "fair_clear",
    flags: {
      "hermes_shrine_libation_poured": true,
      "cithaeron_shepherd_talked": true
    },
    npcStates: {
      "npc_shepherd_daidalos": {
        disposition: 15, // -100 (hostile) to +100 (revered)
        alive: true,
        dialogueFlags: { "asked_about_wolves": true }
      }
    },
    questStates: {
      "quest_tutorial_stolen_flock": {
        status: "active", // active | completed | failed
        currentStage: "investigate_tracks",
        objectives: {
          "inspect_blood_marks": { completed: true, optional: false },
          "find_cave_entrance": { completed: false, optional: false },
          "recover_sacred_bell": { completed: false, optional: true }
        }
      }
    },
    journal: {
      chronicle: [],
      discoveries: [],
      knowledge: [],
      people: [],
      mysteries: [],
      playerNotes: []
    },
    consequencesLog: [
      {
        id: "ev_consequence_001",
        timestamp: "Day 14, 09:15",
        summary: "Poured wine libation at Hermes' stone mound; felt a sudden tailwind."
      }
    ]
  }
}
```

---

### 3.2 RulesEngine: Attribute, Skill, & Probability Mechanics
The system uses a **d20 + Attribute Modifier + Skill Rank vs Target Difficulty Class (DC)** resolution mechanic familiar to tabletop roleplayers, with specific adaptations for ancient Greek heroism.

- **Attribute Modifiers:** `Math.floor((attributeScore - 10) / 2)` (e.g., Str 14 = +2, Agi 12 = +1).
- **Skill Checks:** `d20 + Attribute Mod + (Skill Rank * 2) + Situational Modifiers vs DC`.
  - Typical DCs:
    - *Easy (DC 10):* Routine task under mild pressure (climbing a low drystone wall).
    - *Moderate (DC 13):* Professional task requiring training (identifying a temple inscription).
    - *Hard (DC 16):* Formidable challenge (noticing subtle hoofprints in heavy rain).
    - *Heroic (DC 20):* Feat of legendary calibre (recalling an esoteric hymn to Hecate).
- **Critical Rolls:**
  - Natural 20 = *Arete* (Excellence / Critical Triumph with narrative flourish).
  - Natural 1 = *Ate* (Blind Ruin / Critical Misfortune with consequential setback).
- **Controlled Probability:** Dice rolls utilise a deterministic pseudo-random seed generator that can be seeded during unit testing for 100% reproducible test suites.

---

### 3.3 ActionEngine & Parser
The engine executes player intent through a unified pipeline accepting two input channels:
1. **Contextual Action Buttons:** Explicit choices dynamically generated based on current location, active NPCs, inventory, quest stage, and character skills.
2. **Custom Player Input:** A text prompt allowing tabletop-style commands (e.g., *"examine the moss on the altar"*, *"offer wine to Hermes"*, *"intimidate the shepherd with my spear"*).

#### Intent Interpretation Pipeline
```
[User Text Input]
       │
       ▼
[Tokenizer & Normalizer] (strips punctuation, trims, downcases, lemmatizes common Greek/English verbs)
       │
       ▼
[Context-Aware Matcher]
   - Checks against registered verbs: 'examine', 'talk', 'take', 'use', 'attack', 'pray', 'offer', 'search'
   - Checks against location entities, visible NPCs, and player inventory items
       │
       ├── Match Found ──► Execute matched action with skill/condition check
       │
       └── No Match ──► Graceful fallback ("You consider this action, but in your current position...") 
                         + Suggestions based on visible nouns & standard verbs.
                         (Pluggable hook architecture ready for an optional AI/LLM parser endpoint).
```

---

### 3.4 World Map & Travel Engine
The world map is rendered as an interactive, styled vector SVG representing ancient Greece.

- **Node-and-Edge Graph:**
  - Every settlement, sanctuary, mountain pass, or cave is a `LocationNode`.
  - Roads, sea routes, and mountain paths are `TravelEdges`.
- **Travel Economics:**
  - **Distance & Terrain:** Traversing a mountain trail consumes 3x stamina/time compared to an paved sacred way.
  - **Time & Calendar:** Travel increments hours, triggering day/night shifts, torch requirement, and fatigue checks.
  - **Travel Encounters:** Each edge defines encounter tables (bandits, wolves, satyrs, wandering bards, sudden omens) rolled per leg of the journey.
  - **Access Predicates:** Nodes can define strict requisites (e.g., Delphi requires `quest_stage_oracle_ready` or knowledge of the sacred day; Crete requires boat access/hire).

---

### 3.5 Turn-Based Narrative Combat Engine
Combat is tactical, round-based, and heavily narrated:
- **Combat Turn Order:** Determined by Agility + Perception initiative roll.
- **Player Actions:**
  - *Standard Attacks:* Thrust, Slash, Shield Bash, Ranged volley.
  - *Tactical Maneuvers:* Feint (Charisma/Deception vs Wisdom), Disarm, Take Cover behind Aspis, Rally (Morale boost).
  - *Mythic / Prayer Actions:* Invoking patron god (costs Piety/Favour, risks Hubris).
  - *Consumables & Fleeing:* Herbal salves, wine, retreat to adjacent node.
- **Combat Resolution Output:** Narrative combat log providing detailed blow-by-blow descriptions evoking the heroic epic style of the *Iliad* (e.g., bronze piercing boarhide, spear splintering against oak).

---

### 3.6 Journal, Codex, & Knowledge Graph
The journal is not a generic quest log; it is an active research chronicle divided into 6 distinct registries:
1. **Adventure History:** Chronological ledger of major deeds, oaths sworn, and outcomes.
2. **Discoveries:** Archaeological and geographic logs (inscriptions transcribed, ruins surveyed).
3. **Knowledge & Lore:** Lore unlocked through conversation, reading, or skill successes.
4. **People & Factions:** Dossiers on mortals, demigods, priests, including known secrets and relationship scores.
5. **Unresolved Mysteries:** Active riddles, incomplete prophecies, cryptic omens.
6. **Personal Notes:** Full free-form player markdown/text notepad persisted in game save.

**Deduction Engine:** When resolving puzzles or high-tier dialogue checks, the engine can query `state.world.journal.knowledge` to confirm the character actually observed or learned the prerequisite lore before unlocking the solution option.

---

### 3.7 EventBus & Consequence System
All significant occurrences publish typed events across an internal bus:
- `EVENT_LOCATION_ENTERED`
- `EVENT_ACTION_PERFORMED`
- `EVENT_DIALOGUE_COMPLETED`
- `EVENT_ITEM_ACQUIRED`
- `EVENT_QUEST_STAGE_CHANGED`
- `EVENT_COMBAT_RESOLVED`
- `EVENT_TIME_PASSED`

Listeners evaluate conditions and execute side effects (mutating game state, logging consequences, awarding experience/renown, updating NPC dispositions).

---

### 3.8 Persistence & Storage Architecture
- **IndexedDB (`GreekMythologyRPG_DB`):**
  - Store: `saves` (key: `slot_id`, value: complete serialized state, metadata: name, level, playtime, thumbnail location).
  - Store: `adventure_packs` (offline cached adventure JSONs).
- **LocalStorage:**
  - Key: `gm_settings` (audio levels, text typing speed, high-contrast mode, auto-save interval).
- **Export/Import:**
  - One-click export to `.json` save file.
  - Full schema validation on import with error recovery.

---

## 4. User Interface Specification

### Aesthetic Direction: Neoclassical & Archaic Greece
- **Palette:**
  - Background: Deep obsidian/charcoal (`#111113`, `#1a1917`) with subtle limestone/parchment undertones.
  - Surfaces: Aged vellum/parchment (`#f4ecd8`, `#ede3c8`) on content cards; deep bronze borders (`#8c6d3b`, `#c59b27`).
  - Accents: Terracotta / Attic red-figure (`#b33c1b`), Aegean lapis (`#1d4e89`), Laurel green (`#2d5a27`).
- **Typography:**
  - Headings: Serif with classical proportions (e.g., Cinzel / Cardo / Georgia).
  - Body: High-legibility classical serif or humanist sans (e.g., Merriweather / Georgia / system serif).
- **Ornamentation:**
  - Subtle meander (Greek fret) borders on section headers.
  - SVG iconography derived from authentic archaeological motifs (tripods, amphorae, hoplite shields, laurel wreaths) — strictly no modern emojis.

---

## 5. Technical Limitations & Mitigation Strategies

| Potential Limitation | Mitigation Strategy |
| :--- | :--- |
| **Single HTML requirement vs modularity** | Develop modular JS classes; deliver a build/assembly script that compiles the verified modular code into a pristine, zero-dependency standalone `index.html` alongside external content packs. |
| **Natural Language Parser complexity without AI** | Implement robust rule-based intent/entity matching with synonym dictionaries, fuzzy matching, and helpful context-sensitive fallbacks. Abstract the parser behind an async interface so a local or remote LLM can be swapped in without touching game logic. |
| **IndexedDB browser quota & private browsing limits** | Provide fallback serialization to LocalStorage for small save payloads, plus instant file download/upload (.json) save migration. |
| **Large Adventure Packs memory footprint** | Lazy-load adventure stages and asset references; index dialogue trees by node key rather than parsing full trees into memory at once. |

---

## 6. Campaign Framework & Living World Architecture (Engine v2.0.0 Overhaul)

### 6.1 Content-Driven Campaign Framework
The engine functions as a campaign-agnostic virtual machine. Entirely new settings and genres are supported via modular JSON packages without core engine changes:
* **Campaign Manifest (`campaign.json`)**: Declares metadata (`id`, `name`, `version`, `genre`, `startingLocationId`, `startingTime`), modular component paths (`locations`, `characters`, `creatures`, `items`, `lootTables`, `interactiveObjects`, `factions`, `quests`, `encounters`, `dialogues`, `events`), and consequence rules.
* **Dual Loading Strategy**: Supports network-based asynchronous `fetch` when hosted on web servers as well as synchronous embedded fallbacks (`loadEmbeddedFallbackContent()` for Greek Mythology and `loadEmbeddedDevTestContent()` for Developer Verification Campaign) for local `file:///` execution.
* **Campaign Startup Flow**: 1. Guide hints &rarr; 2. Campaign Selection & Configuration (`#view-campaign-select`) &rarr; 3. Character Creation Wizard &rarr; 4. Game Begins.
* **Custom Campaign Profiles**: Save and reload personalized module configurations (`saveCustomCampaignProfile`, `loadCustomCampaignProfile`) stored under `rpg_campaign_profile_<id>`.

### 6.2 Campaign Content Validation Engine
The static `GreekMythologyEngine.validateCampaign(manifest, content)` engine audits campaign packages prior to or during runtime:
* **Structural Schemas**: Validates required metadata, starting location, coordinate types, vitals, and dice notation.
* **Referential Integrity**: Verifies that connection targets exist, creature/NPC loot tables reference valid tables, items in drops/shops exist, and quest prerequisite chains are satisfied.
* **Circular Quest Dependency Detection**: Executes depth-first search graph traversal across prerequisite chains, detecting cycles and generating explicit diagnostic reports.
* **Logic & Safety Audits**: Warns on thematic and mechanical anomalies (e.g., flagging unpickable physical obstacles such as boulders mistakenly marked `isPickable: true`).
* **Visual Audit Modal**: Integrated in-engine via `#validation-modal`.

### 6.3 Complete Freedom to Interact With Living Entities
* **Universal Combat Engagement**: Players are free to initiate combat with ANY living entity in the world (friendly NPCs, merchants, guards, quest-givers, animals, monsters, bosses) via `startCombatWithEntity(entityId, type)`.
* **Action Deck Integration**: Contextual actions dynamically surface `Speak`, `Attack`, and `Pickpocket` cards for all present living entities.
* **Permanent Death Persistence**: Slain entities are logged in `state.worldState.deadEntities`, disabling subsequent dialogue and pruning exploration cards.
* **Non-Linear Quest Failovers**: Key NPC deaths evaluate `alternatePathways` (e.g., slaying Elena drops her research journal and transitions the Sunstone quest directly to independent crypt exploration).

### 6.4 Multi-Table Loot Resolution & Anti-Exploit Protection
* **Data-Driven Drop Tables**: Probability rolls, guaranteed drops, and variable currency ranges.
* **Anti-Exploit Relic Tracking**: Prevents duplicate unique relic acquisition on repeat boss kills via `state.worldState.grantedUniqueItems`. If a unique relic has already been awarded, repeat defeats suppress the duplicate drop and grant `repeatCurrency` or `repeatEntries` instead.

### 6.5 Interactive Physical Objects & Lockpicking Mechanics
* **Interactive Environmental Entities**: Doors, containers, obstacles, shrines, and mechanisms tracked in `state.worldState.unlockedObjects`.
* **Lockpicking Requirements**: Requires physical tools (`item_lockpick_set`, `item_dev_iron_lockpick`, `item_thieves_tools`).
* **Tabletop Resolution & Consequences**: D20 skill check vs DC. Ate (Nat 1) breaks and destroys the lockpick.
* **Physical Obstacles vs Mechanical Locks**: Boulders and cave-ins are flagged `isPickable: false` and cannot be lockpicked; they must be cleared via `heaveObstacle` requiring raw Strength.
* **Traps & Key Bypass**: Trapped containers inflict spring needle damage on failed picks or Ate fumbles. Keys (`unlockWithKey`) safely unlock mechanisms without dice checks or trap hazards.

### 6.6 Multi-Phase Boss Combat & Cooldowns
* **Dynamic Enraged Phase**: Bosses enter second phases (`enraged: true`) upon dropping below configurable health thresholds (e.g., 50% HP), gaining +3 attack bonuses and increased damage output.
* **Respawn Cooldown Hours**: Defeated repeatable encounters record defeat timestamps in `state.worldState.encounterCooldowns`. Respawn eligibility is enforced by `checkEncounterCooldown(encounterId)` comparing total in-game elapsed hours against `cooldownHours`.

### 6.7 Factions, Consequences & Scheduled Simulation
* **Dynamic Faction Standing**: Tracks numerical reputation per faction, mapped to standing tiers: *Hostile* ($\le -25$), *Unfriendly* ($< 0$), *Neutral* ($< 20$), *Friendly* ($< 50$), and *Honored* ($\ge 50$).
* **Consequence Rule Engine**: `emitEvent(name, payload)` processes `consequenceRules` defined in campaign manifests, mutating world flags, adjusting faction reputations, and scheduling delayed world events (`scheduledEvents`).
* **Scheduled Event Dispatch**: Scheduled events trigger automatically when total in-game hours elapse during rest or travel.

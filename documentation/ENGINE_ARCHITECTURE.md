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
- **Critical Rolls:** natural 20 = critical success (*Arete*), natural 1 = critical failure (*Ate*), decided on the natural die by the shared resolver. See §7.11 for the implementation, consequences and Reliable Talent.
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

---

## 7. Universal RPG Engine, Progression, Equipment, Loot, and Dynamic Crafting (Engine v3.0.0, corrected in v4.1 audit)

> This section was corrected during the v4.1 independent audit (2026-11-11) so that it describes what the engine
> actually does. Items marked **Not implemented** are data or descriptions that exist without engine behaviour.

### 7.1 Campaign Independence
* **Campaign-scoped content**: Classes, backgrounds, professions, materials and crafting templates are loaded from the modules declared in each campaign's `campaign.json`.
* **Content isolation**: `loadContent()` resets every catalog (`createEmptyWorld()`), the glossary, the adventure and consequence rules before loading a campaign, so switching campaigns in one session cannot leak content. The built-in fallback catalogs (`getFallbackClasses()` etc.) are used **only** by the default (Greek) campaign; other campaigns get empty catalogs when they define none.
* **Campaign start**: `confirmCampaignSelection()` builds a fresh state with `resetStateForActiveCampaign(slot)`: only the campaign's own factions, discovered locations that exist in the campaign, its starting location/time, optional starting morality (`moralityConfig.initialVirtue/initialHubris`), and default-kit items that exist in its catalog. The new game goes to a free save slot (see §9).
* **Browsing vs. launching**: clicking a campaign card only highlights it (`selectedCampaignId`); the running game's `activeCampaignId`, rules and content change only when *Launch Campaign* is confirmed. *Validate Campaign* checks the highlighted campaign against **its own** content (`withCampaignContent()` loads it temporarily and restores the running game's content afterwards).
* **Loading content never writes into the game state** (the embedded Dev loader used to add Dev faction standings to whatever game was running).
* **Creation wizard data**: classes, backgrounds, origins and traits are all campaign catalogs loaded by `fetchCatalog()` from `modules` (one file or a list of shared files, merged by id; CONTENT_SCHEMA §25). Origin and trait perks are applied by one function (`applyCreationPerks()`); trait check bonuses come from data (`getTraitCheckBonus()`), not from hard-coded trait ids.
* **Layout**: the selection screens use the full width (cards are not boxed into fixed-height lists; Back/Next stay visible). The action deck groups actions by what they act on (`getActionEntity()` / `renderGroupedActions()`): People, Creatures, Objects & Containers, Places — one openable list per NPC, creature, object or place, or a plain button when there is only one action. Panels are player-resizable: drag grips for the action list height and the sidebar width (double-click resets), a resize corner on selection lists and dialogue text, and a text-size slider in Settings; sizes are saved in `localStorage.gm_ui_sizes` (not in save files).
* **Dual-mode loading**: Over HTTP the JSON files are fetched. Under `file:///` (where browsers block `fetch`) the engine uses embedded copies: `loadEmbeddedDevTestContent()` is **generated** from the Dev campaign JSON by `node scripts/sync-embedded-dev-content.js` (`npm test` fails if it is out of date; a stale hand-written copy had different classes and backgrounds), while `loadEmbeddedFallbackContent()` is a **reduced subset** of the Greek content (e.g. 32 of 62 items, no crafting toolkits). Serve the game with `python server.py` for the full experience.
* **Progression rules per campaign**: a manifest may define `progression.xpTable` (XP needed to leave each level) and `progression.levelTitles`; missing entries use the engine defaults. Greek level titles are used only by the default campaign; other campaigns get neutral "Level N Adventurer" titles unless they define their own.

### 7.2 Greek Classes & Backgrounds (actual content)
* **14 classes** (`content/campaigns/greek_mythology/classes.json`): hoplite, hypaspist, amazon, myrmidon, trickster, oracle_shadow, labyrinth_runner, demigod, oracle, philosopher, mystery_cultist, nymph_bound, tide_caller, maenad.
* **16 backgrounds** (`backgrounds.json`): bg_demigod_scion, bg_oracle_seer, bg_temple_acolyte, bg_cursed_mortal, bg_nymph_foundling, bg_hoplite_veteran, bg_pankration_champion, bg_monster_hunter, bg_royal_guard, bg_argonaut_sailor, bg_philosopher_sophist, bg_artisan_forge, bg_exiled_noble, bg_underworld_escapee, bg_cultist_mysteries, bg_brigand_crags.
* **Applied at creation**: class `statBonuses`, class + background `startingEquipment` (replaces the default kit's equipment; the first item per slot is equipped), background `proficiencies` (+2 to matching skill ranks), background `startingBonus.drachmae`, origin perks, chosen trait.
* **Skills**: melee_combat, ranged_combat, stealth, persuasion, survival, tracking, perception, medicine, mythology_lore, investigation, **athletics** (added in save v1.5.0; rolled when heaving obstacles; heroes from older saves whose background trained it receive the +2). The level-up window offers every skill the hero has.
* **Not implemented**: class `classFeatures` (all levels) and proficiency effects (e.g. armour/weapon proficiencies) have no engine behaviour yet. The background proficiencies `intimidation` and `crafting` are recorded but are not skills, so they have no effect.

### 7.3 Character Progression
* Each level-up awards exactly **1 attribute point**, **2 skill points** and one heroic feat; max Health +4 and max Stamina +2 (flat). Endurance affects Health/Stamina only at character creation (`20 + END mod × 2`, `16 + END mod`).
* Wisdom drives Perception and Passive Perception (`10 + Perception Bonus`).
* XP is cumulative; thresholds come from `getXPForNextLevel()`.

### 7.4 14-Slot Equipment Paper Doll
* Slots: `head`, `neck`, `shoulders`, `back`, `body`, `arms`, `hands`, `waist`, `legs`, `feet`, `ring_1`, `ring_2`, `main_hand`, `off_hand`.
* Rings fill `ring_1`, then `ring_2`, then replace `ring_1`. Items with slot `accessory` fill `neck`, then the ring slots.
* Two-handed weapons (`slot: "two_hand"` or `twoHanded: true`) are stored in `main_hand` and unequip the off hand; equipping an off-hand item unequips a two-handed weapon.
* Legacy slot names in old saves (`two_hand`, `helm`, `armor`, `weapon`, `shield`, `ring`, `relic`, equipped `accessory`) are normalised by `migrateState()`.
* Armour Class = `10 + AGI mod + Σ stats.defenseBonus` (crafted items from older versions that stored `stats.defense` are also counted).
* **Equipped item bonuses** are applied by the shared rules: `<attribute>Bonus` (e.g. `wisdomBonus`) raises that attribute for skill checks and attack rolls (`getEffectiveAttribute()`), `<skill>Bonus` (e.g. `persuasionBonus`) adds to that skill's checks, `perceptionBonus`/`perceptionPenalty` to perception and tracking, and `damageReduction` reduces each hit taken (minimum 1). Tooltips list these bonuses. **Not applied**: `moraleBonus`, `staminaBonus`, `coldResistance`, `blockChance`, `speedPenalty` and other descriptive stats; `attributeRequirement` is shown but not enforced.
* Ranged weapons (`stats.ranged: true`, or `weaponType: "ranged"`) attack with **Agility + Ranged Combat**; all other weapons use Strength + Melee Combat.

### 7.5 Loot Engine & Probability Caps
* `resolveEntityLoot()` is the single place drops are resolved (it is called once per victory). It applies loot-table `guaranteed` items, `entries` (with `minQuantity`/`maxQuantity`), `currency`, **and** a creature's inline `loot` array, plus level-scaled drachmae.
* **Caps** (by rarity *name*): normal creatures — `epic` ≤ 0.02 %, `legendary`/`mythic` 0 %; bosses — `mythic` ≤ 0.02 %. The Greek content uses `exceptional` and `consecrated` tiers, which are **not** capped (see `getRarityRank()` for the full vocabulary: common, crafted, uncommon, rare, exceptional/epic, consecrated/legendary, mythic).
* Unique items (`isUnique`) are granted once (`worldState.grantedUniqueItems`); repeat kills give replacement drachmae.
* References to items that do not exist in the campaign are skipped (and reported by the validator).

### 7.6 Recipe-Free Crafting
* Professions (Greek): metalworking, artifice, textiles, alchemy, stonework, music, scribing — each requires its toolkit item.
* Materials expose `hardness`, `durability`, `flexibility`, `heatResistance`, `magicalAffinity`, `purity`.
* Check (shared resolver, §7.11): `d20 + governing attribute modifier + Forge Strike bonus (0–3)` vs template `baseDC`. Quality: Standard, Superior (margin ≥ 5), Masterwork (margin ≥ 10 or natural 20). A natural 1 always fails, even with a large bonus.
* `craftItem()` validates the toolkit and material quantities itself. **Materials are consumed only on success**; an ordinary failure keeps them, a **critical failure ruins one unit of the first primary material**. Every attempt takes the crafting time.
* Generated items use `stats.defenseBonus` for armour and are stored in the save at `worldState.dynamicItems`, so they survive reloads.

### 7.7 Minigames
* Artemis Stalk (hunting), Asklepian Mortar (camp medicine), Hoplite Shield Clash (combat), Astragaloi (divination), Hephaestus' Forge Strike (crafting bonus +1…+3, free to retry, no penalty).
* Time costs use the campaign's `activityDurations`: stalk → `hunting`, mortar → `rest_short`, astragaloi → `divination` (default 30 min).
* Shield Clash costs 2 Stamina, can be attempted once per combat round, and resolves the round like *Raise Shield* (+3/+5/+8 AC; a perfect brace also staggers the enemy).
* The Venus cast pays out once per casting session.

### 7.8 Settlement Merchants
* Merchants declare `merchantInventory` (`itemId`, `price`, `stock`); every major Greek settlement merchant stocks a healing item.
* **Not implemented**: there is no buy/sell interface or economy logic yet. Talking to a merchant without an authored dialogue lists their wares.

### 7.9 NPC Behaviour & Social Cooldowns
* NPCs below 25 % HP yield and flee; the engine currently records this the same way as a kill (permanent death, consequences).
* NPC combat uses authored `combatStats` (`armorClass`, `actions`, `attackBonus`, `damage`, `xpReward`) and `vitals` when present, else attribute-derived defaults.
* Persuade/Deceive share a 4-hour per-NPC cooldown; Pickpocket has a 24-hour per-NPC cooldown. All use the absolute world clock and are stored in `worldState.socialInteractions`; each attempt takes `social_interaction` time. Disposition changes are saved in `worldState.npcStates[npcId].disposition`.
* **Lockpicking and heaving** take `lockpicking` / `heave` time (default 10 minutes each, configurable in `activityDurations`), so failed attempts cannot be retried for free while quest clocks are frozen.
* **Opening objects**: picking, key, heave and mechanism all go through `markObjectOpened()`, which applies the object's authored `unlockOutcome` (flags, quest updates, XP, text) exactly once. If `unlockOutcome.awardXP` is set it replaces the generic 35 XP award. `failureConsequence.message` is shown on a fumble and `breakToolOnAte: false` keeps the tool. **Not implemented**: `failureConsequence.alertNpcId`, `trap.disarmDC` (there is no disarm action).

### 7.10 Travel & Exploration
* The action deck offers a travel card for **every open road** from the current location; arriving at a place discovers it. Unexplored destinations are labelled "(unexplored)" and are also clickable on the map. (Previously the cards and the map offered only discovered places while the sidebar list offered every road; all three now use the same rule.)
* A road is closed while its `requiresFlag` is unset (or its `requiresNotFlag` is set); `executeTravel()`, the map and the sidebar list enforce this too.
* Wilderness ambushes pick the creature first (`pickAmbush()`), so the narration names the actual creature; the Greek wolf prose is only used for the Greek wolf.
* NPCs without an authored dialogue tree get a generated conversation from their `description`, `knowledge` (matched against mythology entries) and merchant stock. NPCs may reference their tree with `dialogueTreeId` or `dialogueId`.

---

### 7.11 D20 Criticals & Reliable Talent (save v1.6.0)
* **One resolver.** Every D20 roll that is a check goes through `resolveD20({ modifier, dc, skill, natural })`: player skill checks (`checkSkill()`), attacks, feints, escapes, crafting, and creature/NPC attacks. It returns `natural`, `effective`, `total`, `success`, `reliable`, `isCriticalSuccess`, `isCriticalFailure` and `critical` ("success" / "failure" / null). Criticals are decided on the **natural** die: natural 1 + 15 is still a critical failure, natural 20 + 2 is still a critical success, and a modified total of 20 is just a 20. A critical success always succeeds and a critical failure always fails. Hard restrictions (missing tools, closed roads, cooldowns) are checked *before* rolling, so a natural 20 never bypasses them.
* **Not checks:** the rest/travel ambush rolls are encounter-table rolls ("ambush on 1–4"), not checks, and are not critical-aware. Hunting, herb mixing, shield clash and astragaloi are timing/dice minigames without a D20; their bonuses are modifiers (e.g. Forge Strike), so they can never turn a natural 1 into a success.
* **Consequences** come on top of the ordinary success or failure and depend on the activity (`applyCriticalEffects(activity, roll, ctx)`; defaults in `GreekMythologyEngine.CRITICAL_EFFECTS`):

| Activity | Critical success | Critical failure |
|---|---|---|
| `exploration` (default for skill checks) | location discovery cache (once per location) | −2 Stamina, 15 minutes lost |
| `heave` | discovery cache | −3 Stamina |
| `lockpick` | salvage a spare pick | pick breaks, trap springs |
| `pickpocket` | double haul | caught: reputation −15, the victim attacks |
| `persuasion` | +10 extra disposition, +3 faction reputation | −10 disposition (an ordinary failure changes nothing) |
| `deception` | +5 disposition | −10 extra disposition, −5 faction reputation |
| `puzzle` (riddle deduction) | +25 XP | −2 Stamina |
| `crafting` | Masterwork quality | one primary material ruined |
| `hunting`, `gathering` (for content checks) | +15 / +10 XP | 30 / 20 minutes lost |
| `attack` (hero) | existing critical damage + battlefield spoils | enemy +2 to hit this round |
| `feint` | next strike +2 | enemy +2 to hit this round |
| `flee` | escape and +2 Stamina | enemy +2 to hit this round |
| `enemy_attack` (creatures, NPCs) | +4 damage | the hero's next strike +2 |

  Priority: an action's own `criticalSuccess` / `criticalFailure` > the campaign's `d20Rules.criticalOutcomes[activity]` > the engine default. Effects are mild and never kill the hero.
* **Reliable Talent.** A *non-combat* skill whose rank reaches its threshold (default **8**, configurable per skill) treats natural 1–5 as 6 for that skill only: no critical failures, natural 20 still a critical success, all normal modifiers still added, so hard DCs can still be failed. `melee_combat` and `ranged_combat` never qualify (attacks never pass a skill to the resolver). Rank is the skill points in that skill, so it is saved with the hero and nothing extra is stored. With the default progression a hero starts with at most rank 5 in a non-combat skill (base 2, background +2, origin +1) and gains 2 skill points per level, so rank 8 needs at least two level-ups put entirely into one skill. The character sheet shows `★ Reliable` or the progress (e.g. `5/8`).
* **Deception** is its own skill (it used to roll persuasion), so mastery in one does not cover the other. Old saves give deception the persuasion rank it used to roll (no change in odds).
* **New D20 content** uses `checkSkill(skill, attribute, dc, label, { activity, npcId, criticalOverride })`, or `skill_check` actions with optional `activity`, `criticalSuccess`, `criticalFailure` (CONTENT_SCHEMA §24). New engine activities call `resolveD20()` and `applyCriticalEffects()`; never compare raw `rollD20()` results.

## 8. World Time, Event Scheduler, Living World and Morality (Engine v4.0.0, corrected in v4.1 audit)

### 8.1 World Time
* Calendar: 60-minute hours, 24-hour days, **30-day months, 12-month (360-day) years**. The calendar is not yet configurable per campaign.
* `getTotalInGameMinutes()` is a continuous clock consistent with that calendar (it previously counted 365-day years and jumped 5 days at each new year). Year-1 timestamps are unchanged; `migrateState()` shifts later-year timestamps in older saves.
* Activities advance time through `performActivity(type)` using the campaign's `activityDurations` (defaults in brackets): travel (connection `travelHours`, −20 % with *Stride of Hermes*), combat (15), rest_short (60), rest_sacred (120), rest_long (480), crafting (120, reduced by INT), hunting (90), foraging (45), investigation (30), social_interaction (15), dialogue (5, currently unused), divination (30), lockpicking (10), heave (10). Menus, map, inventory and journal take no time.

### 8.2 Event Scheduler
* No polling: events are processed only inside `advanceTime()` (UI animations use timers, game time never does).
* `scheduleEvent()` inserts by `triggerTimeMinutes` (binary search). Re-scheduling an id that already ran is treated as a new occurrence.
* `processScheduledEvents()` repeatedly takes the **earliest due event**, so large time skips run every due event — including each occurrence of a recurring event and events scheduled by other events — in chronological order (safety valve: 1000 dispatches per call).
* Conditional events (`conditions.requiresFlag`, `requiresNotFlag`, `npcAlive`) are dropped if their condition is false when due; **recurring** events stay scheduled.
* Duplicate protection: `worldState.executedEventIds` (bounded to the latest 500 ids).
* Manifest consequence rules (`scheduleEvent` outcome) also go through `scheduleEvent()`.
* Scheduled quest events use the quest helpers: `quest_deadline` / `quest_stage` move stages with `setQuestStage()` (revealing the new stage's objectives) and fail quests with `failQuest()` (which cancels the quest's remaining milestones).
* **World events (`events.json`)** are event-driven, never polled: `setWorldFlags()` raises `FLAG_SET` for each flag whose value changes, `addItem()` raises `ITEM_ACQUIRED`, and every `emitEvent()` name (e.g. `ENTITY_DEATH`) is also offered to world events. Each event fires once per game unless `repeatable: true`; fired ids are saved in `worldState.firedWorldEvents`. Outcomes share `applyWorldOutcome()` with manifest consequence rules (flags, reputation, scheduled events, failQuest, piety, morality, restoreHealth/Stamina, transcript with optional `speaker`, chronicle entry).
* API: `scheduleEvent`, `cancelScheduledEvent`, `rescheduleEvent`, `getTimeUntilEvent`, `processScheduledEvents`.

### 8.3 Time-Sensitive Quests
* `timeMilestones` (`hours`, `action`, `mutateStage`, `setFlags`, `narrative`; `action: "fail"` fails the quest) are scheduled when the quest starts. `deadlineHours` is descriptive only — use a milestone to enforce it.
* `earlyCompletionBonus` (`hoursThreshold`, `drachmae`, `virtue`, `narrative`) is applied by `completeQuest()`.
* Completing or failing a quest cancels its pending milestone events.

### 8.4 Creature & Boss Respawns
* Respawn hours: creature `respawnHours` → campaign `respawnRules.bossHours` for bosses → tier defaults (12/24/48/96/168). `respawnRules.creatureNormalHours` / `creatureRareHours` are not used.
* Every non-NPC kill schedules a `creature_respawn` with the id `respawn_<creatureId>` (killing the same kind again reschedules it instead of piling up events); bosses and encounters with `cooldownHours` also schedule `boss_respawn_<encounterId>`.
* **Encounter availability** (`isEncounterAvailable()`): `triggerCondition { flag, expected }` must hold; a won encounter is **one-time unless `repeatable: true`**; a repeatable encounter waits for `cooldownHours`, or (without a cooldown) until its creature has respawned. (Before this, every non-repeatable encounter could be re-fought forever for its full victory rewards.)

### 8.5 Permanent NPC Death
* Slain NPCs are recorded in `worldState.permanentNpcDeaths` and `deadEntities` and never respawn.
* Consequences: +15 Hubris, −25 reputation with the NPC's own faction, manifest consequence rules (`ENTITY_DEATH`: flags, reputation, `failQuest`, `piety`, `morality`, scheduled events), and a scheduled inquest event that sets the flag `inquest_<npcId>`.
* Quest failover is data-driven: `alternatePathways.onNpcDeath` and `failableConditions.onNpcDeath` in quest definitions.
* **Not implemented**: inquest effects on prices or regional security.

### 8.6 Morality
* `player.morality.virtue` and `.hubris`; score = virtue − hubris.
* Alignment thresholds come from the campaign's `moralityConfig` (`getMoralityConfig()`): either `tiers: { heroic: 30, pragmatic: -15, ruthless: -40 }` (shipped campaigns) or `alignmentTiers: { heroic: { minScore, title }, ... }`. Defaults: heroic ≥ 30, pragmatic ≥ −15, ruthless ≥ −40, otherwise villainous. `virtueLabel` / `hubrisLabel` are used in notifications; tier `title`s in the morality summary.
* Alignment can gate actions (`requiresMorality`, `morality_alignment` conditions). **Not implemented**: merchant discounts, temple bans or other passive alignment effects.
* Moral quest choices: `resolveMoralChoice(questId, pathKey)` with `moralPaths` in the quest definition.

---

## 9. Save Format & Migration (v1.6.0)
* v1.6.0: `player.skills.deception` (migrated from the persuasion rank).
* Saves are written to IndexedDB (`GreekMythologyRPG_DB`/`saves`), falling back to `localStorage` (`gm_save_slot_<n>`). `gm_last_slot` remembers the slot of the game in play and the game resumes from it on start. Autosaves (`autosave()`) write to the slot of the game in play: a game loaded from Slot 2 keeps autosaving to Slot 2.
* **Slot safety (v1.5.0)**: a new game (Launch Campaign, Restart) or an imported save first autosaves the current game, then goes to the **first slot without a hero** (`findSlotForNewGame()`); if all 3 slots are in use the player is asked before the current game's slot is replaced. Imports never reuse the slot number stored inside the file. *Save* into another game's slot asks for confirmation; *Load* of another slot saves the current game first. The slot list shows each slot's hero, level, campaign and save time.
* A level-up that was pending when the game was saved is offered again after loading (`checkPendingLevelUp()`).
* `state.version` is the save format version (`GreekMythologyEngine.SAVE_VERSION`). Every loaded or imported save passes through `migrateState()`, which adds missing containers, normalises legacy slots, recovers currency from an old stray `player.drachmae` field, and never removes progress.
* Loading a save whose `worldState.campaignId` differs from the loaded content reloads that campaign's content first (`applyLoadedState()`).
* World-state containers added in v1.4.0: `socialInteractions`, `criticalDiscoveries` (one natural-20 cache per location), `dialogueRewardsClaimed` (one-time dialogue rewards), `dynamicItems` (crafted item definitions), `npcStates[npcId].disposition`. Added in v1.5.0: `firedWorldEvents`, `player.skills.athletics`.
* Calendar migration for pre-1.4.0 saves in year 2+: each timestamp is shifted by the error of the year it was taken in (scheduled events by the year they were created in), so events created before and after a year boundary both keep their exact timing.
* Crafted items made before v1.4.0 were never saved; their definitions cannot be recovered and they appear as unidentified items.

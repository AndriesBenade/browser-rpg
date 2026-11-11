# Universal Browser RPG Campaign Engine — Comprehensive Capabilities Specification

**Document Version:** 4.2.0  
**Engine Build:** Modular Vanilla HTML5/ES6+ RPG Engine  
**Runtime Architecture:** Single-File Distribution (`index.html`) + Standalone JSON Content Packages  
**Runtime Dependencies:** None (Zero external dependencies; runs offline via `file:///` and over standard HTTP)

---

## 1. Executive Summary & Engine Philosophy

The **Universal Browser RPG Campaign Engine** is a high-fidelity, tabletop-inspired, narrative roleplaying system engineered using standard web technologies (HTML5, CSS3, Vanilla ES6+ JavaScript, SVG, Web Audio API, IndexedDB). 

Originally developed as an authentic classical Greek mythology adventure, the engine underwent a comprehensive architectural overhaul to become **completely campaign- and genre-independent**. Any universe—Greek myth, Norse legends, traditional high fantasy, grimdark medieval, cyberpunk, sci-fi, or anime—can be loaded simply by importing compatible content packages, requiring **zero engine modifications**.

```
+-----------------------------------------------------------------------------------------+
|                                    CAMPAIGN LAYER                                       |
|  +--------------------+  +--------------------+  +--------------------+                 |
|  |  Greek Mythology   |  |  Developer Test    |  |  Custom Campaign   | (JSON Modules)  |
|  |  (Archaic Hellas)  |  |  (Verification)    |  |  (Norse, Fantasy)  |                 |
|  +--------------------+  +--------------------+  +--------------------+                 |
+-----------------------------------------------------------------------------------------+
                                             │
                                             ▼
+-----------------------------------------------------------------------------------------+
|                                 CORE ENGINE RUNTIME                                     |
|  +-----------------------+  +------------------------+  +----------------------------+  |
|  | Central Rules & D20   |  | Dynamic World Time     |  | Character & Progression    |  |
|  | - resolveD20()        |  | - Calendar rollover    |  | - 14-slot paper doll       |  |
|  | - Nat 20 / Nat 1      |  | - Event Scheduler      |  | - 1 primary + 2 secondary  |  |
|  | - Reliable Talent     |  | - Zero polling loops   |  | - Attributes & 11 Skills   |  |
|  +-----------------------+  +------------------------+  +----------------------------+  |
|  +-----------------------+  +------------------------+  +----------------------------+  |
|  | Combat & Encounters   |  | Quests & Consequences  |  | Procedural Crafting        |  |
|  | - Tactical Actions    |  | - Deadlines & Failover |  | - Recipe-free crucible     |  |
|  | - Multi-phase Bosses  |  | - Permanent NPC Death  |  | - 7 Professions, Toolkits  |  |
|  | - Defensive AI & Flee |  | - Morality (Arete/Ate) |  | - Material Matrix (10 mats)|  |
|  +-----------------------+  +------------------------+  +----------------------------+  |
|  +-----------------------+  +------------------------+  +----------------------------+  |
|  | Grouped Action Deck   |  | Interactive Objects    |  | Minigame Suite             |  |
|  | - Entity Accordions   |  | - Locks, Traps, Boulders| | - 5 Synthesized Minigames  |  |
|  | - Road Predicates     |  | - Athletics & Tool DC  |  | - Zero asset footprint    |  |
|  +-----------------------+  +------------------------+  +----------------------------+  |
+-----------------------------------------------------------------------------------------+
                                             │
                                             ▼
+-----------------------------------------------------------------------------------------+
|                               PERSISTENCE & SECURITY                                    |
|  - Multi-slot IndexedDB with LocalStorage fallback                                      |
|  - Save Versioning (v1.6.0) with automated migration pipeline                           |
|  - Slot overwrite protection & isolated campaign saves                                  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Universal Campaign Architecture

### 2.1 Complete Content Decoupling
* **Campaign Manifest (`campaign.json`)**: Every campaign declares its identity, metadata, starting conditions, calendar parameters, activity durations, respawn rules, morality scales, and file paths for modular content.
* **Declarative Module Catalogs**:
  * `locations.json`: Waypoint graph, SVG coordinates, connections, hazards, discoveries.
  * `characters.json`: Regional NPCs, dialogue triggers, merchant goods, combat statistics.
  * `creatures.json`: Bestiary across tiers 1–5, attacks, XP rewards, respawn hours.
  * `items.json`: Equipment, consumables, quest items, lore attributions.
  * `loot_tables.json`: Multi-tier drop tables with hard probability caps.
  * `interactive_objects.json`: Locked doors, trapped coffers, heavy obstacles.
  * `factions.json`: Faction affiliations and standing tiers.
  * `quests.json`: Linear and branching storylines, deadlines, moral choices.
  * `encounters.json`: Turn-based battles, ambient surprises, boss phases.
  * `dialogues.json`: Branching dialogue trees with conditional nodes and rewards.
  * `events.json`: Global world events triggered by flags, item pickups, or milestones.
  * `classes.json` & `backgrounds.json`: Campaign-specific archetypes and starting gear.
  * `origins.json` & `traits.json`: Modular character traits with data-driven perks.
  * `professions.json`, `materials.json`, `crafting_templates.json`: Dynamic crafting rules.
* **Catalog Merging (`fetchCatalog`)**: Manifests can load multiple JSON files per module (e.g. shared base traits plus campaign-specific traits).
* **Multi-Campaign Isolation**: Switching campaigns cleanly re-initializes all catalogs, state variables, and UI elements. Greek archetypes, gods, or items never bleed into developer or custom campaigns.

### 2.2 Dual-Mode Content Loading
* **HTTP Dynamic Fetch**: Operates asynchronously over local or cloud web servers (`python server.py`).
* **Offline `file:///` Embedded Fallbacks**: Embedded fallback methods (`loadEmbeddedFallbackContent()`, `loadEmbeddedDevTestContent()`) ensure the entire game is 100% playable directly from disk in browsers that restrict local `fetch()`.
* **Automated Sync Tooling**: `scripts/sync-embedded-dev-content.js` automatically compiles the JSON files into embedded methods, verified on every test run.

### 2.3 Campaign Validation Engine
* An in-engine static analyzer (`GreekMythologyEngine.validateCampaign`) that audits any campaign pack:
  * Referential integrity: Missing locations, invalid connection targets, missing items, unlinked dialogue trees.
  * Circular quest dependencies via depth-first graph traversal.
  * Logical anomalies (e.g. flagging unpickable physical obstacles accidentally marked as pickable).
  * Surfaced via the in-game `#validation-modal` and CLI verification tests.

---

## 3. Character Creation, Archetypes & Progression

### 3.1 Character Creation Wizard
* Responsive 1500px multi-stage creation flow with sticky navigation:
  1. **Identity & Heritage**: Name, gender, campaign-defined origins.
  2. **Class Selection**: Responsive cards detailing combat roles, primary attributes, and starting panoplies.
  3. **Background Selection**: Cultural heritage defining starting skill proficiencies and unique perks.
  4. **Traits Selection**: Positive and neutral personality traits with data-driven bonuses.
  5. **Review & Embarkation**: Comprehensive character summary before entering the world.

### 3.2 14 Greek Heroic Classes & 16 Cultural Backgrounds
* **14 Classes**: Hoplite (phalanx tank), Toxotes (marksman), Peltast (skirmisher), Hippeus (cavalry vanguard), Pankratiast (unarmed brawler), Mystes (esoteric initiate), Rhapsode (epic skald), Pythia (oracle), Asklepiad (physician), Stratiotes (veteran legionary), Korybante (frenzied dancer), Skiritae (mountain ranger), Syntrophos (sworn companion), Telemachos (cunning voyager).
* **16 Backgrounds**: Spartiate Agoge, Athenian Ephebe, Theban Sacred Band, Arcadian Hunter, Cretan Archer, Myrmidon Veteran, Corinthian Navigator, Phocian Miner, Delphic Suppliant, Argive Bronzesmith, Centaur Foster-Child, Thessalian Horseman, Thracian Mercenary, Olympic Victor, Chthonic Oracle, Laconian Helot.
* **Universal Compatibility Matrix**: Any background pairs with any class. The engine dynamically calculates attribute modifiers, proficiencies, starting equipment panoplies, and background perks.

### 3.3 Core Attributes & The 11-Skill System
* **6 Core Attributes**:
  * **Strength**: Melee attack power, heavy armor tolerance, physical heaving.
  * **Agility**: Ranged accuracy, defensive evasion, stealth, initiative.
  * **Endurance**: Health pool, stamina pool, exhaustion thresholds.
  * **Intelligence**: Lore knowledge, puzzle insight, crafting precision.
  * **Wisdom**: Perception, medical diagnosis, divine discernment.
  * **Charisma**: Persuasion, deception, morale capacity, social standing.
* **11 Core Skills**:
  * Combat: `melee`, `ranged`, `defense`.
  * Physical & Subterfuge: `athletics`, `stealth`.
  * Social: `persuasion`, `deception`.
  * Survival & Knowledge: `survival`, `medicine`, `lore`, `piety`.

### 3.4 Progression & Level Advancement
* **Point Allocation**: Every level-up grants **1 Primary Attribute Point** and **2 Secondary Skill / Substat Points**.
* **Campaign Progression Config**: Campaigns configure XP advancement tables and cultural level titles (e.g. *Ephebos* &rarr; *Hoplite* &rarr; *Hero* in Hellas; neutral titles in other campaigns).
* **Derived Substats**:
  * **Perception**: Derived from Wisdom (`10 + Wisdom Modifier + Skill Points`). Governs detection of hidden paths, ambush warnings, and secret loot caches.
  * **Passive Perception**: Continuous background passive observation.
  * **Vitals**: Max Health and Max Stamina dynamically scale with Endurance; Max Morale scales with Charisma.

---

## 4. Centralized D20 Rules & Tabletop Mechanics

### 4.1 Unified Resolver (`resolveD20`)
A single, centralized resolver processes every d20 roll across the engine (skill checks, attacks, feints, escapes, crafting, creature actions):
$$\text{Total} = \text{Die Roll} + \text{Attribute Modifier} + \text{Skill Bonus} + \text{Item Bonuses} + \text{Situational Modifiers}$$

### 4.2 Natural 20 (Arete) & Natural 1 (Ate) Criticals
Critical outcomes are evaluated strictly on the **natural raw die roll**, never the modified sum:
* **Combat**:
  * Natural 20 (*Arete*): Maximum critical damage + bonus dislodged battlefield spoils.
  * Natural 1 (*Ate*): Hero fumble grants the opponent +2 to hit next round; creature fumbles grant the hero +2 on the next strike.
* **Crafting**:
  * Natural 20: Elevates item tier to Masterwork with maximum bonus attributes.
  * Natural 1: Crafting fails and ruins one primary material (ordinary failures preserve materials).
* **Social & Subterfuge**:
  * Natural 20: Grants activity-specific bonuses (vendor discounts, bonus coin) without exploiting regional discovery caches.
* **Lockpicking**:
  * Natural 1 snaps the lockpick and triggers spring-loaded needle traps.

### 4.3 Reliable Talent System
* Non-combat skills at or above mastery rank (default rank $\ge 8$, campaign-configurable in `d20Rules`) elevate natural rolls of 1–5 up to **6**.
* Displayed on the Character Sheet as `★ Reliable` with progress indicators.
* Guarantees experienced heroes never fail routine tasks within their area of mastery.

---

## 5. Combat Agency & Tactical Encounter Engine

```
+-----------------------------------------------------------------------------------------+
|                                    COMBAT ROUND                                         |
|                                                                                         |
|  [Tactical Action Choice] ──> [Stamina Check] ──> [resolveD20()] ──> [Dynamic Armor AC] |
|            │                                                                │           |
|            ├── Standard Attack (Melee/Ranged)                               │           |
|            ├── Shield Block / Clash (Stamina-gated, +8 AC)                  ▼           |
|            ├── Feint (Tactical defense debuff)                    [Damage vs Reductions]|
|            ├── Tactical Consumables (Potions, Salves)                       │           |
|            └── Tactical Escape (Agility check vs Peril)                     ▼           |
|                                                                    [Health Update]      |
|                                                                             │           |
|   ┌─────────────────────────────────────────────────────────────────────────┴─────────┐|
|   ▼                                                                                   ▼|
| [NPC Yield / Flee Evaluation] (<25% HP)                       [Multi-Phase Boss Enrage]|
+-----------------------------------------------------------------------------------------+
```

### 5.1 Tactical Combat Actions
* **Standard Strike**: Uses Strength for melee or Agility for ranged weapons.
* **Shield Clash / Othismos**: Costs 2 Stamina, provides +8 Armor Class for the round, absorbs incoming blows, and uses the turn.
* **Tactical Feint**: Opposed Agility check that lowers enemy defense for subsequent strikes.
* **Consumables in Combat**: In-battle medicine and potion administration.
* **Tactical Retreat**: Agility-governed escape check influenced by terrain and fatigue.

### 5.2 Dynamic Armor Class & Damage Reduction
* Armor Class dynamically aggregates base agility, equipped armor piece defense bonuses, and shield bonuses.
* Equipped items with `damageReduction` mitigate flat incoming physical trauma.

### 5.3 Multi-Phase Boss Mechanics
* Bosses declare multi-phase transitions in JSON:
  * Health thresholds (e.g. dropping below 50% HP) trigger enraged stances (`enraged: true`).
  * Enraged bosses gain +3 attack bonuses, amplified damage, and display dramatic narrative banners.

### 5.4 Wounded NPC Yield & Flee Behaviors
* Living NPCs entering combat evaluate defensive surrender or flight when dropping below 25% HP.
* Evaluates cowardice, morale, and self-preservation before catastrophic defeat.

---

## 6. Dynamic World Time & Event-Driven Priority Scheduler

### 6.1 Centralized Time Progression
* Fully tracked chronological time: Minutes, Hours, Days, Months (30 days), Years (12 months / 360 days).
* **Zero Polling Loops**: Operates with **zero continuous `setInterval` loops**. Time advances strictly when the player acts (`advanceTime(minutes)`).
* Standardized activity durations configured per campaign in `campaign.json`:
  * Travel: 60m (short), 120m (medium), 240m (long). Reduced by 20% by *Hermes' Swift Stride*.
  * Combat: 15 minutes per encounter.
  * Rest: Short rest (60m), Full rest (480m / 8 hours), Medical care (120m).
  * Crafting: 60 minutes base.
  * Lockpicking / Heaving: 10 minutes.
  * **Zero-Cost UI**: Reading journal entries, checking the map, inspecting inventory, or managing gear takes **0 minutes**.

### 6.2 Priority Event Scheduler
* Events stored in an array sorted ascending by `triggerTimestamp`.
* Insertion uses binary search ($O(\log n)$) to maintain sorted chronological ordering.
* **Automatic Memory Pruning**: Executed one-time events are automatically pruned from active arrays to keep long-running save files lightweight.
* **Execution Ledger**: Executed event IDs are permanently stored in `state.worldState.executedEventIds`, making duplicate execution impossible even across big time skips.

---

## 7. Living World, Quests & Consequence Systems

### 7.1 Time-Sensitive Quests & Deadlines
* Quests declare `deadlineHours` from acceptance.
* Exceeding deadlines triggers stage failure or situation deterioration (e.g. hostages executed, rivals plundering crypts).
* Intermediate milestone warnings alert the player as time passes (e.g. guard patrols doubled at 24h).
* **Early Completion Bonuses**: Finishing within `earlyCompletionBonusHours` awards bonus XP, currency, and special titles.
* **Timeless Quests**: Mythological ruins and research quests omit deadlines to allow relaxed exploration.

### 7.2 Non-Linear Quest Failovers & Permanent NPC Death
* **Unique Mortals**: Living NPCs in `characters.json` are unique mortals. When slain, their ID is permanently registered in `state.worldState.permanentNpcDeaths`.
* **NPCs Never Respawn**: Creature respawn handlers explicitly reject permanent NPC IDs.
* **Death Cascades**: Slaying an NPC fails active contracts, drops required quest items directly into the world, opens alternate narrative branches, and schedules delayed murder inquests that raise regional alert levels and merchant prices.

### 7.3 Creature & Boss Respawns
* Defeated creatures and bosses declare `respawnHours` (12–48h for common beasts; 24–168h for legendary bosses).
* Defeat schedules a `creature_respawn` or `boss_respawn` event in the scheduler.
* **Anti-Exploit Protection**: Unique relics recorded in `state.worldState.grantedUniqueItems` are awarded only once. Repeat victories award level-scaled silver drachmae and consumable items instead.

### 7.4 Morality & Karma Engine (Virtue vs Hubris)
* Cumulative tracking of **Virtue (*Arete*)** and **Hubris (*Miasma*)**.
* Net score: $\text{Score} = \text{Virtue} - \text{Hubris}$.
* **Dynamic Alignment Tiers**:
  * **Heroic** ($\ge +40$): Deific favor, agora discounts, welcoming citizens.
  * **Pragmatic** ($-15$ to $+39$): Neutral survivalist, standard reactions.
  * **Ruthless** ($-40$ to $-16$): Feared, heightened guard alertness, shunned by temples.
  * **Villainous** ($\le -41$): Accursed with *miasma*, hunted by mercenaries, barred from holy sanctuaries.
* Multi-path moral choices in dialogue and quests yield divergent alignments and consequences.

---

## 8. Economy, Loot & Recipe-Free Dynamic Crafting

### 8.1 14-Slot Equipment Paper Doll
* Dedicated equipment slots: `head`, `neck`, `shoulders`, `back`, `body`, `arms`, `hands`, `waist`, `legs`, `feet`, `ring_1`, `ring_2`, `main_hand`, `off_hand`.
* Dual Ring cycling logic (fills slot 1, then slot 2, then cycles).
* Two-handed weapon mutual exclusion (equipping a two-handed weapon automatically unequips off-hand shields or weapons).

### 8.2 Centralized Loot Engine & Rarity Caps
* Hard probability caps enforce authentic balance:
  * Normal creatures: Epic $\le 0.02\%$, Legendary $0.00\%$, Mythic $0.00\%$.
  * Boss creatures: Mythic capped at $\le 0.02\%$.
* Independent level-scaled currency: Normal creature victories award silver drachmae scaled dynamically to level ($\ge \text{level} \times 3$).

### 8.3 Recipe-Free Procedural Crafting
* **7 Consolidated Professions**: Blacksmithing, Woodworking, Leatherworking, Weaving, Alchemy, Jewelcrafting, Inscription.
* **8 Required Toolkits**: Must be carried in inventory to practice disciplines.
* **10 Standardized Materials**: Metal ingots, seasoned timbers, beast hides, raw flax, alchemical reagents, monster venom, etc., with physical and magical attributes (hardness, durability, flexibility, magical affinity, toxicity, weight).
* **Procedural Assembly**: Combines 1 Item Template + 2 Primary Materials + 1 Supplementary Material.
* **Quality Multipliers**: Standard, Superior, Masterwork. Composite stats (damage, defense, weight, value) are calculated procedurally and saved permanently in `worldState.dynamicItems`.

### 8.4 Settlement Economy
* Regional settlement merchants maintain authentic local inventories with guaranteed minimums of emergency healing salves and potions.

---

## 9. Interactive World Objects, Lockpicking & Obstacles

* **Interactive Object Archetypes**: Doors, chests, burial coffers, stone boulders, altar mechanisms.
* **Lockpicking Mechanics**: Requires lockpicks (`item_lockpick_set`), checks Agility/Stealth vs DC, snaps picks on Natural 1 (*Ate*), and triggers spring needle traps on critical fumbles.
* **Physical Obstacles**: Unpickable boulders require raw Strength and the `athletics` skill to heave aside.
* **Authored Outcomes**: Opening objects applies authored `unlockOutcome` payloads (awarding XP, revealing hidden road connections, completing quest stages).

---

## 10. Exploration, Cartography & Travel Economics

* **Interactive SVG Cartography**: Campaign maps render regional waypoints, connected road paths, coordinate grids, and unexplored territory indicators.
* **Unified Road Predicates**: Action Deck cards, SVG map nodes, and the sidebar travel list all enforce identical path predicates (`requiresFlag` / `requiresNotFlag`).
* **Travel Economics**: Distance-scaled travel time, stamina expenditure, exhaustion thresholds, and forced-march health penalties.
* **Environmental Perils**: Regions declare recommended levels, displaying "Heroic Peril" warnings when low-level adventurers trespass into dangerous lands.

---

## 11. Grouped Action Deck UI

* **Contextual Accordions**: Action cards are automatically grouped by present entities:
  * Location actions (Search, Rest, Travel).
  * Living NPCs (Speak, Pickpocket, Attack).
  * Hostile Creatures & Bosses (Combat, Stalk).
  * Interactive Objects (Unlock, Heave, Disarm).
* **State Preservation**: Single actions render as direct buttons; multiple actions render as collapsible accordions that preserve their open/closed state across turns.
* **Pure Action Card Gameplay**: Completely eliminated legacy text-entry command bars; 100% of player interaction is driven by structured action cards.

---

## 12. Synthesized Minigame Suite

The engine includes 5 interactive minigames rendered in dynamic DOM modals with zero external audio assets, using the HTML5 Web Audio API for classical procedural sound synthesis:
1. 🏹 **The Artemis Stalk** (Hunting & Foraging): Kinetic wind-timing slider scaled by Agility and Perception.
2. 🏺 **The Asklepian Herbal Mortar** (Healing & Alchemy): Balancing humors (Heat, Moisture, Astringency) scaled by Intelligence and Medicine.
3. ⚔️ **The Hoplite Shield Clash** (Tactical Combat Reaction): Kinetic shield boss alignment scaled by Strength.
4. 🎲 **The Astragaloi of Hermes** (Divination & Wagering): Authentic four-knucklebone sheep astragaloi roll (*Chios*, *Coan*, *Euripides*, *Stesichoros*, *Venus Cast*).
5. 🔨 **Hephaestus' Forge Strike** (Crafting Bonus): Kinetic sweet-spot hammer strike granting +1 to +3 crafting bonuses with **zero penalty on failure**.

---

## 13. Persistence, Save Safety & Storage Architecture

* **Multi-Slot IndexedDB**: Robust asynchronous persistence with LocalStorage fallbacks.
* **Save Versioning & Automated Migration (`migrateState()`)**:
  * Seamlessly upgrades older save formats across v1.2, v1.3, v1.4, v1.5, and v1.6 without losing player progress.
  * Preserves time timestamps, dynamic crafted items, custom traits, and newly added skills (`athletics`, `deception`).
* **Slot Safety Architecture**:
  * `findSlotForNewGame()` finds the first unused slot.
  * Launching new campaigns or restarting mid-game automatically saves the current hero and prompts before replacing any data.
  * Importing a save never overwrites the local slot index stored in the file.
* **Portable JSON Export/Import**: Allows players to export and import complete save packages with campaign-neutral file naming.
* **Complete Reset Tools**: Settings menu provides individual slot deletion and a one-click *"Delete All Saved Content & Reset Fresh"* action.

---

## 14. Responsive UI & Customization Features

* **Widescreen & Laptop Support**: Creation wizard scales to 1500px; responsive scrolling containers (`.viewport`, `.view-card-wrapper`) prevent cut-offs on 1024×700 and laptop screens.
* **Interactive UI Resizing**:
  * Drag grips adjust Action Deck height and Sidebar width.
  * Corner resize handles on dialogues, selection cards, level-up lists, and crafting crucible.
  * In-game Font Size slider and UI Reset controls in Settings, saved persistently in `localStorage.gm_ui_sizes`.
* **Thematic Modals**: In-game Codex, Mythology Glossary, Pantheon Shrine, Validation Suite, Developer Hand-Off Notes, and Quest Chronicle.

---

## 15. Testing, Verification & Developer Tooling

* **148 Automated Tests**:
  * **Legacy Test Suite (`tests/engine_tests.js`)**: 74 unit tests validating formulas, math, and data schemas.
  * **Behaviour Test Suite (`tests/behaviour_tests.js`)**: 74 integration tests executing the real engine in a headless Node VM against live JSON content packs.
  * **Seeded Fuzzing**: 600-step randomized action runs across both Hellenic and Dev campaigns verifying state invariants.
* **Synchronization CLI**: `npm run sync:embedded` regenerates embedded offline fallbacks from JSON.
* **Full Test Command**: `npm test` runs both suites and checks embedded sync in **< 1.5 seconds**.

---

## 16. Technical Metrics & System Limits Summary

| System | Specification / Limit | Implementation Notes |
| :--- | :--- | :--- |
| **Engine Core** | Single-file HTML5 (`index.html`), ~13,100 lines | Zero external runtime scripts or libraries |
| **Supported Browsers** | Chrome, Firefox, Edge, Safari | ES6+ standard compliant |
| **Active Campaigns** | Unlimited | Loaded via `content/campaigns/<id>/` |
| **Equipment Slots** | 14 discrete paper doll slots | Dual rings + Two-hand weapon mutual exclusion |
| **Core Attributes** | 6 (STR, AGI, END, INT, WIS, CHA) | Standard tabletop modifier formula $\lfloor(X-10)/2\rfloor$ |
| **Core Skills** | 11 specialized skills | Non-combat skills support Reliable Talent ($\ge 8$) |
| **Time System** | Discrete minutes, hours, days, months, years | Zero continuous polling loops; activity-driven |
| **Scheduler Insertion** | Binary Search ($O(\log n)$) | Chronologically sorted; memory pruned on execution |
| **Loot Hard Caps** | Normal Epic $\le 0.02\%$; Boss Mythic $\le 0.02\%$ | Anti-exploit unique relic duplication lock |
| **Save Storage** | IndexedDB primary, LocalStorage fallback | Automated schema migration pipeline |
| **Automated Tests** | 148 automated passing tests | Complete regression & behaviour coverage |

# Greek Mythology Text RPG — Developer & AI Collaboration Hand-Off Notes

> **Notice to AI Assistants (Claude, ChatGPT, Antigravity, Gemini, Codex, DeepSeek, etc.):**  
> Two friends are collaborating on this browser-based Greek Mythology RPG and passing this repository back and forth. Each friend pairs with their AI assistant to implement features, fix issues, and improve the game.  
> Whenever you (the AI) perform a work session on this codebase, you **MUST** read this file first and update the **Chronological Hand-Off Log** at the top before concluding your turn so the next AI and friend can smoothly pick up where you left off.

---

## 📜 Chronological AI & Developer Hand-Off Log

### Session 6 — 2026-11-10
* **Collaborator / Model**: User & Antigravity (Google DeepMind)
* **User Request**: Implement the Dynamic Minigame Integration System with dedicated contextual cards, occasional triggers in rest/combat, surprise thematic minigames, and lightweight zero-asset synthesized audio to keep the folder minimal.
* **Minigame Systems Implemented**:
  1. **Four Classical Minigame Archetypes**:
     - 🏹 **The Artemis Stalk** (Hunting & Foraging): Approach mountain game or harvest sacred dittany by timing steps with wind gusts (*Aegean Gust* green zone). Needle oscillations and sweet spot size scale directly with Agility and Perception.
     - 🏺 **The Asklepian Herbal Mortar** (Camp Rest & Healing): Compounding 3 ancient humors (Heat, Moisture, Astringency) to target equilibrium using Dittany, Mountain Honey, Olive Oil, and Myrrh. Intelligence and Medicine skill pre-align humors; Endurance expands ingredients tolerated.
     - ⚔️ **The Hoplite Shield Clash / Othismos** (Tactical Combat Reaction): Timing the locking of the central bronze shield boss as kinetic rims converge. Strength widens the center brace boss; Aegis of Pallas feat grants divine magnetic stability.
     - 🎲 **The Astragaloi of Hermes** (Sacred Knucklebones Divination): Cast 4 authentic sheep knucklebones with classical faces (*Chios* 1, *Coan* 3, *Euripides* 4, *Stesichoros* 6). Rolling all four different faces yields the legendary *Venus Cast (Aphrodite)* for +25 XP and silver drachmae! Charisma and Hermes Piety grant bone rerolls.
  2. **Non-Intrusive Contextual Integration**:
     - Dedicated action cards added to Crossroads (*Hunt & Stalk*, *Cast Astragaloi*) and Fissure Cave (*Forage Dittany*).
     - Interactive rest button added to Rest Modal (*Compound Medicinal Poultice*).
     - Interactive tactical button added to Combat Modal (*Shield Clash [Othismos Challenge]*).
     - 100% optional: immediate `[Skip Challenge]` button on every minigame card.
  3. **Zero-Asset Classical Audio Synthesizer**:
     - Pure Web Audio API procedural synthesis with zero audio files on disk (keeping repo lightweight).
     - Generates Dorian lyre string plucks, bronze shield clashes, knucklebone percussive rattles, and harmonic victory chimes.
     - Global audio toggle (`🔊 Sound` / `🔇 Muted`) with state persistence.
  4. **Strict RPG Balance Capping**:
     - Performance-based rewards (Tier 0 to Tier 3 Arete) strictly capped at +1 to +3 situational bonuses, extra rations, or recovery boosts with zero penalty on failure.
  5. **Automated Verification**:
     - Test suite expanded to **45 / 45 passing tests**.

### Session 5 — 2026-11-10
* **Collaborator / Model**: User & Antigravity (Google DeepMind)
* **User Request**: "Please optimize and compress where possible while trying best not to break anything."
* **Optimizations Implemented**:
  1. **Embedded Data Compression**:
     - Compressed the embedded offline fallback content in `loadEmbeddedFallbackContent()` and `getFallbackGlossary()`, reducing `index.html` by **2,693 lines** of whitespace bloat (from 9,496 lines down to 6,803 lines) while preserving 100% of data for offline `file:///` gameplay across all 19 locations, 12 creatures, 24 items, 8 deities, 12 lore entries, and 28 glossary terms.
  2. **Fast $O(1)$ Hash Map Lookups**:
     - Added `buildContentMaps()`: indexes all items, locations, and creatures into `this._itemMap`, `this._locationMap`, and `this._creatureMap`.
     - Replaced linear array `.find()` traversals in `getItemData(id)`, `getLocation(id)`, and `getCreature(id)` with instantaneous $O(1)$ hash map lookups, eliminating thousands of redundant scans per turn during inventory rendering, map link generation, and combat rounds.
  3. **DOM Query Caching**:
     - Implemented `getDomElement(id)` with a persistent DOM cache map to eliminate repetitive `document.getElementById` tree traversals during high-frequency HUD updates.
  4. **Automated Verification**:
     - Expanded test suite from 42 to **43 passing tests** verifying hash map lookups, compact fallback integrity, and DOM caching.

### Session 4 — 2026-11-10
* **Collaborator / Model**: User & Antigravity (Google DeepMind)
* **Friend's Request & Requirements Implemented**:
  1. **Custom Action Bar — Always Visible**:
     - Docked a prominent, persistent custom action input (`#persistent-action-bar`) permanently at the base of the interface outside `#viewports-stage`.
     - Remains visible, accessible, and fully operational across all interface panels (Story, Map, Character, Inventory, Quests, Journal, Codex, Pantheon, Settings) without scrolling or search.
     - Automatically routes commands to the narrative chronicle (`switchView('view-story')`) so results are immediately visible.
     - Expanded intent parsing for navigation ("map", "inventory", "character", "journal", "codex", "pantheon", "rest"), combat ("fight", "attack"), and environmental exploration ("examine", "search", "talk", "offer").
  2. **Human-Understandable Mechanics & Natural Language Outcomes**:
     - Removed all technical D&D mechanics, raw dice calculations, and internal formulas (`d20: 17 + Mod: 2 = 23 vs DC 11`, `vs AC 12`, `[20]`, `[1]`) from player-facing narratives and action descriptions.
     - Implemented `.entry-narrative-check` cards displaying natural, literary English outcomes:
       - What happened.
       - Whether the action succeeded, failed, or was a legendary triumph (Arete) or sudden misfortune (Ate).
       - Why it happened (drawing upon character attributes and skills).
       - What the consequences are.
     - Preserved all mathematical properties in backend return values (`success`, `isArete`, `isAte`, `total`, `d20`, `bonusTotal`, `dc`) to maintain 100% test compatibility.
     - Added plain-English gameplay explanations for all 6 core attributes (Strength, Agility, Endurance, Intelligence, Wisdom, Charisma) in the Character Sheet.
  3. **Immediate Visual Feedback (Toast Notification System)**:
     - Implemented an elegant, classical Greek-themed toast notification system (`#toast-container`) positioned top-right with `aria-live="polite"` accessibility.
     - Distinct styling for positive (emerald/laurel), negative (terracotta), and informational (bronze/gold) events with classical icons and concise + / - numerical indicators.
     - Fully wired into item additions/removals, drachmae spoils, level ups, attribute increases, heroic feats, quest objective completions, journal clue discoveries, travel arrivals, and camp rest recovery.
     - Smooth entrance and exit animations with auto-dismissal after 4.2 seconds.
  4. **Contextual Mythological Terminology & Floating Explanations**:
     - Created central glossary in `content/world/glossary.json` (and synchronized embedded fallback in `getFallbackGlossary()`) covering 28 authentic classical terms (*Hermaion*, *Aspis*, *Dory*, *Xiphos*, *Linothorax*, *Aryballos*, *Libation*, *Arete*, *Ate*, *Kleos*, *Psychopompos*, *Omphalos*, *Pythia*, *Abaton*, *Obol*, *Drachma*, *Hoplite*, *Phalanx*, *Chlamys*, *Petasos*, *Kriophoros*, *Thyrsus*, *Xenios*, *Hubris*, *Styx*, *Drakon*, *Dittany*, *Ambrosia*).
     - Built `enrichMythologicalText()` regex engine that automatically identifies and highlights unfamiliar terminology in narrative text, dialogue, and action cards with zero tag corruption.
     - Implemented interactive floating tooltip dialog (`#glossary-floating-tooltip`) with boundary-clamped positioning, non-flickering hover, and touch device tap support.
  5. **Automated Testing**:
     - Expanded test suite from 35 to **42 tests**, verifying glossary schema, text enrichment regex, idempotency, natural check cards, toast notifications, persistent action bar DOM presence, and plain-English attribute explanations.

### Session 3 — 2026-11-10
* **Collaborator / Model**: User & Antigravity (Google DeepMind)
* **User Requests**:
  1. Conduct in-depth research on authentic Greek mythology and add items, creatures, NPCs, gods, places, and lore specific to regions in Greek mythology so players can learn authentic mythology in a fun, interactive way.
  2. Implement a complete **Level Up / Progression System** so players grow stronger over time and are not overwhelmed by higher-tier mythological threats (e.g. Sphinx of Thebes, Nemean Lion, Lernaean Hydra).
  3. Ensure all changes are documented in `DEVELOPER_NOTES.md` and the in-game developer modal so the two friends and their AI assistants can pass the repository back and forth smoothly.
* **Code & Content Changes**:
  - `content/world/locations.json`:
    - Expanded from 5 to **19 authentic classical locations** across 4 major regions:
      - **Boeotia & Thebes**: Crossroads of Cithaeron, Shrine of Hermes, Pastures of Plataea, Whispering Fissure, Lion's Crag Overlook, Seven Gates of Thebes, Mount Sphingion (Lair of the Sphinx), Fountain of Ares (Spring of Dirce), and Lake Copais.
      - **Phocis & Delphi**: Triple Way of Daulis (Crossroads of Laius & Oedipus), Sanctuary of Delphi (Temple of Apollo & Pythian Oracle), Castalian Spring (Sacred Purification), and Corycian Cave of the Nymphs.
      - **Argolis & Mycenae/Nemea/Lerna/Epidaurus**: Lion Gate of Mycenae (Cyclopean Citadel), Valley of Nemea (Sanctuary of Zeus & Lair of the Lion), Marshes of Lerna (Alcyonian Lake & Hydra's Den), and Asklepieion of Epidaurus (Healing Abaton).
      - **Arcadia & Mount Lykaion**: Altar of Zeus Lykaios (Mount Lykaion & Werewolf Rites).
      - **Laconia & The Underworld**: Cape Taenarum (Cave Entrance to Hades where Herakles drew up Kerberos).
    - Every location has valid grid coordinates, recommended player levels (1–5), bidirectional road/mountain connections, and primary source historical narratives (Pausanias, Homer, Hesiod, Apollodorus).
  - `content/world/creatures.json`:
    - Expanded from 2 to **12 authentic mythological creatures** categorized across **Tiers 1 to 5**:
      - *Tier 1 (Lvl 1–2)*: Cithaeronian Timber Wolf (`λύκος`), Chthonic Cave Beast (`θὴρ χθόνιος`).
      - *Tier 2 (Lvl 2–3)*: Wild Parnassian Satyr (`σάτυρος`), Stymphalian Razor-Bird (`Στυμφαλὶς ὄρνις`), Kabeiroi Bronze Automaton (`χάλκεος θεράπων`).
      - *Tier 3 (Lvl 3–4)*: Lycanthrope of Mount Lykaion (`λυκάνθρωπος`), Boar of Mount Erymanthos (`Ἐρυμάνθιος κάπρος`), Harpy of the Whirlwind (`Ἅρπυια`), Empousa the Blood-Drinker (`Ἔμπουσα`).
      - *Tier 4 (Lvl 4–5)*: The Sphinx of Thebes (`Σφίγξ`), The Ismenian Dragon of Ares (`Ἰσμήνιος δράκων`).
      - *Tier 5 (Lvl 5+)*: The Lernaean Hydra (`Λερναία Ὕδρα`).
    - Every creature cites ancient literature (Pausanias *Description of Greece*, Hesiod *Theogony*, Homer *Iliad/Odyssey*, Apollodorus *Bibliotheca*), includes distinct multi-action combat abilities, scaled XP rewards (40 to 400 XP), and classical loot tables.
  - `content/world/characters.json`:
    - Expanded from 2 to **10 authentic historical and mythological NPCs**:
      - Daidalos the Shepherd, Timon the Athenian Pilgrim, Teiresias the Blind Theban Seer, Regent Creon of Thebes, The Pythia of Delphi, Wandering Herakles (Youth of Thebes), Sostratos of Epidaurus, Atalanta the Arcadian Huntress, Chiron the Centaur, and Charon the Ferryman of the Dead.
  - `content/world/items.json`:
    - Expanded from 12 to **24 authentic classical weapons, armors, and relics**:
      - Weapons: Ash-Wood Hoplite Dory, Bronze Xiphos, Hunting Bow, Cyclopean Heavy Dory, Thyrsus of Dionysus, Labrys of the Kabeiroi.
      - Armor: Bronze-Faced Aspis, Spolas Linothorax, Muscled Theban Bronze Cuirass, Boar-Tusk Helmet, Nemean Lion Pelt Fragment.
      - Relics & Consumables: Archaic Bronze Bell, Pramnian Wine Aryballos, Epidaurian Herbal Salve, Attic Barley Cakes, Delphic Laurel Wreath, Omphalos Amulet, Syrinx of Pan, Charon's Styx Obol, Castalian Water Phial, Dragon's Tooth of Ares, Lernaean Hydra Venom Vial.
    - All non-common items include full `mythologicalLore` with primary classical literature references.
  - `content/world/deities.json` & `mythology.json`:
    - Expanded deities to 8 Olympian and chthonic powers: Hermes, Athena, Apollo, Artemis, Poseidon, Dionysus, Demeter, Hades (with ancient Greek spellings, cult epithets, and cult centers).
    - Expanded mythology codex to 12 classical lore articles.
  - `index.html`:
    - Implemented full **Heroic Ascension (Level-Up) Progression System**:
      - Levels 1 to 5 with Homeric titles: `Ephebos` &rarr; `Hoplite of the Phalanx` &rarr; `Promachos` &rarr; `Hero of the Peloponnese` &rarr; `Ison Theos (Peer of Demigods)`.
      - XP Threshold curve: Lvl 1 (100 XP), Lvl 2 (250 XP), Lvl 3 (500 XP), Lvl 4 (900 XP), Lvl 5 (1500 XP).
      - Engine methods: `getLevelTitle(lvl)`, `getXPForNextLevel(lvl)`, `awardXP(amount, reason)`, `getHeroicFeatDefinitions()`, `getAvailableFeats()`, `triggerLevelUp()`, `renderLevelUpModal()`, `selectLevelUpAttr(key)`, `selectLevelUpSkill(key)`, `selectLevelUpFeat(id)`, `confirmLevelUp()`.
      - Level ascension rewards: +4 Max HP (full heal), +2 Max Stamina (full restore), +1 Attribute point (syncing Wisdom substat for Perception), +1 Skill rank, +1 Heroic Feat of the Immortals, +15 Renown, journal chronicle entry, and transcript herald banner.
      - Heroic Feats library:
        - `hydra_bane`: +2 attack damage against beasts, serpents, and monsters.
        - `pallas_aegis`: +6 AC during shield block (up from +4).
        - `laconian_iron`: Spartan physical discipline reduces all incoming combat damage taken by 2 (min 1).
        - `hermes_swift_stride`: reduces overland travel stamina cost by 1 (min 1).
        - `eagle_zeus`: +2 bonus to active Perception and Passive Perception.
        - `pythian_prescience`: +3 bonus on Mythology Lore and Investigation checks to decipher ancient omens.
        - `lion_prowess`: +1 bonus on combat melee attack rolls.
        - `arete_strike`: natural 20 in combat instantly restores 3 Stamina.
      - Integrated XP rewards across combat victories (`xpReward`), riddle solutions (+50 XP), quest turn-ins (+100 XP), and Arete discoveries (+25 XP).
      - Regional danger tier alerts: Travel modal renders a warning banner when traveling to a location with a recommended level higher than the hero's current level.
      - UI integration: Top status bar displays Level pill, Hero Title, and Kleos XP; Character Sheet displays Level, Title, XP, and active Heroic Feats.
      - Dual Content Synchronization: `loadEmbeddedFallbackContent()` fully updated with all 19 locations, 12 creatures, and 24 items for offline `file:///` play.
  - `tests/engine_tests.js`:
    - Expanded automated test suite from 28 to **35 passing tests** (added test suites 16–20 covering mythological expansion, tier 1–5 creatures, classical relics/deities, level-up progression, feat mechanics, regional danger scaling, and dual fallback sync).
* **Status**: 35/35 automated unit tests passing. Codebase 100% verified.
* **Suggested Next Steps for the Friend & Their AI**:
  - *Option 1*: Implement **Chapter 1 Quest Chains**:
    - The Riddle of the Sphinx at Mount Sphingion outside Thebes (branching dialogue with Regent Creon and Seer Teiresias).
    - The Hunt of the Nemean Lion in the Valley of Nemea with Wandering Herakles.
  - *Option 2*: Implement **Procedural Web Audio Synthesizer**:
    - Zero audio files needed: generate authentic ancient Dorian lyre strums, bronze sword clashes, and d20 dice rolls using the native browser `AudioContext`.
  - *Option 3*: Add **Dynamic Solar & Atmospheric Lighting**:
    - Dynamic CSS filters and background gradients shifting across Morning (*Eos*), Afternoon (*Mesembria*), Sunset (*Deile*), and Starlit Night (*Nyx*).

---

## 📜 Chronological AI & Developer Hand-Off Log

### Session 2 — 2026-11-10
* **Collaborator / Model**: User & Antigravity (Google DeepMind)
* **User Requests**:
  1. Add a **Critical Success (Natural 20 / Arete)** option:
     - Outside combat: yields location-appropriate discoveries/loot based on the current area.
     - Inside combat: deals massive critical damage and dislodges battlefield spoils (drachmae and salves).
  2. Implement **Perception as a substat of Wisdom (like D&D)**:
     - 6 primary ability scores: Strength, Agility, Endurance, Intelligence, Wisdom, Charisma.
     - Perception is a substat governed by Wisdom with calculated Perception Bonus and Passive Perception.
  3. Add a **Developer & AI Notes** system that persists across hand-offs so both friends and their AI models can seamlessly continue building features.
* **Code Changes**:
  - `browser-rpg/index.html`:
    - Added `getPerceptionBonus()` and `getPassivePerception()`:
      $$\text{Perception Bonus} = \text{Wisdom Mod} + (\text{Perception Rank} \times 2) + \text{Traits} + \text{Equipment}$$
      $$\text{Passive Perception} = 10 + \text{Perception Bonus}$$
    - Updated `checkSkill`: dynamically routes any `perception` checks to `wisdom`, incorporates trait bonuses (*Wayfarer's Eye* / *Vigilant Scout* `+2`) and equipment modifiers (*Corinthian Helmet* vision restriction `-1`, *Bronze Bell* `+1`).
    - Added `getLocationCriticalDiscovery(locId)` & `triggerCriticalSuccessDiscovery`:
      - Natural 20 skill checks award location-specific loot (Crossroads -> Pramnian wine aryballos & 8 drachmae; Fissure Cave -> Epidaurian salve & 5 drachmae; Crag Overlook -> Bronze Xiphos & 10 drachmae; Shrine -> sacred figs/bread, 6 drachmae & Hermes piety; Plataea -> Yew Hunting Bow & 12 drachmae).
      - Renders an illuminated gold **Heroic Arete Triumph Banner** in the transcript and records the discovery in `worldState.journal.discoveries`.
    - Updated `combatAction("thrust")`: Natural 20 deals critical damage $(\text{Max Weapon Dmg} \times 2) + \text{Str Mod} + 4$ and dislodges 4–8 silver drachmae from the monster's lair, with a 50% chance to knock loose an Epidaurian healing salve.
    - Integrated Passive Perception ($\ge 14\text{--}15$) into wilderness resting ambush checks and road travel hazard checks to prevent being ambushed flat-footed.
    - Updated Character Creation Wizard (Step 3 & 5) and Character Sheet to display the 6 core attributes and the Wisdom-governed Perception Substat and Passive Perception.
    - Added in-game `#devnotes-modal` and top navbar `[📜 Dev & AI Notes]` button.
    - Exposed `window.GreekMythologyEngine = GreekMythologyEngine` globally for headless testing and dev tools.
  - `browser-rpg/tests/engine_tests.js`:
    - Added unit tests for Perception Substat, Passive Perception, Natural 20 Location Discoveries, and Combat Critical Strike.
    - Expanded test suite from 24 to 28 passing tests.
* **Status**: 28/28 automated unit tests passing. Engine fully functional.
* **Suggested Next Steps for the Friend & Their AI**:
  - *Option 1*: Implement **Procedural Web Audio** (using the HTML5 Web Audio API, synthesizer-based Dorian lyre chords, sword clangs, and dice rolling sounds with zero audio files needed).
  - *Option 2*: Add **Chapter 1 Quest Expansion** (e.g. *The Riddle of the Sphinx at Thebes* or *The Boar of Cithaeron*).
  - *Option 3*: Add **Dynamic Attic Sky Visuals** (CSS lighting filters that change according to morning, afternoon, sunset, and starlit night).

---

### Session 1 — 2026-11-10
* **Collaborator / Model**: User & Antigravity (Google DeepMind)
* **User Requests**:
  1. Inspect the game and evaluate ability to improve it.
  2. Implement **Option D** (Decouple dialogue and combat systems to be 100% data-driven from JSON).
  3. Implement **Option A** (Core polish: player defeat/revival loop, inventory equip/unequip & direct consumption, resting/camping system).
  4. Enforce **Stamina depletion & exhaustion economics**: 0 stamina should prevent shield blocking and penalize travel.
  5. Ensure **Rest & recover** is always available with **consequential time passing** (positive recovery vs. negative wilderness ambush checks).
  6. Maintain deep **Player tactical agency in combat**.
* **Code Changes**:
  - Decoupled dialogue tree runner (`openDialogue`, `selectDialogueChoice`) evaluating preconditions and side-effects from JSON.
  - Decoupled creature combat runner (`startCombat`, `startCaveCombat`) loading stats from `creatures.json` with tactical choices: Thrust, Aspis Shield Brace, Tactical Feint, Apply Salve, Divine Invocation, Flee.
  - Heroic defeat loop (`handlePlayerDefeat`): Hermes Psychopompos escorts the fallen hero to the Shrine of Hermes upon reaching 0 HP.
  - Stamina exhaustion & Forced March: reaching 0 stamina inflicts -2 attack penalty; traveling without stamina burns health.
  - Rest modal (`openRestModal`, `executeRest`): Short Rest (1 hr), Long Rest (8 hrs with wilderness ambush danger), Sacred Contemplation (100% safe at shrines).
  - Time advance & day/night periods (*Morning/Eos, Afternoon/Mesembria, Dusk/Deile, Night/Nyx*).
  - Interactive inventory equip/unequip and direct consumption of rations and salves.
* **Status**: 24/24 automated unit tests passing.

---

## 🛠️ AI-to-AI Collaboration Protocol (Rules of Engagement)

When handing off this project between AI assistants, follow these strict development rules to ensure the codebase remains clean, bug-free, and delightful to play:

1. **Zero External Runtime Dependencies**:
   - The game engine must remain 100% playable by simply opening `index.html` in any modern web browser or serving it via `python -m http.server 8000`.
   - Do NOT introduce npm build steps (Webpack, Vite, Rollup, Babel, etc.) or external framework dependencies (React, Vue, Tailwind) unless explicitly requested by the users.
2. **Dual-Mode Content Loading (Network + Local Fallback)**:
   - When running via `http://localhost:8000`, the engine fetches JSON files from `content/world/` and `content/adventures/`.
   - When running via `file:///` without a server, browser CORS policies may block `fetch()`. The engine has `loadEmbeddedFallbackContent()` inside `index.html`.
   - **Always keep fallback content and JSON files in sync** whenever you add new items, locations, creatures, or dialogue trees!
3. **Tabletop Rules Integrity**:
   - All d20 checks use `rollD20()`.
   - `d20 === 20` is always an **Arete (Critical Triumph)**.
   - `d20 === 1` is always an **Ate (Critical Setback / Fumble)**.
   - Perception is **always governed by Wisdom**, and Passive Perception is `10 + Perception Bonus`.
4. **Preserve Classical Authenticity**:
   - Keep names, places, and lore authentic to ancient Greek literature (*Homer, Hesiod, Pausanias, Apollodorus*). Avoid generic fantasy tropes.
5. **Always Update the Automated Tests**:
   - When adding a new mechanic or modifying formulas, add corresponding unit tests to `browser-rpg/tests/engine_tests.js`.
   - Run `node tests/engine_tests.js` from `browser-rpg/` and verify that **100% of tests pass** before handing off.
6. **Update This Log**:
   - Add a new entry to the **Chronological Hand-Off Log** at the top of this document detailing your changes and suggesting next steps for the next AI!

---

## 📁 Repository Directory Structure

```
browser-rpg/
├── DEVELOPER_NOTES.md            <-- This collaborative AI hand-off file
├── index.html                    <-- Self-contained playable client (UI + Engine)
├── package.json                  <-- Test scripts ("npm test" -> node tests/engine_tests.js)
├── server.py                     <-- Optional lightweight Python local web server
├── content/
│   ├── adventures/
│   │   └── tutorial.json         <-- "The Stolen Ram of Cithaeron" quest & dialogue tree
│   └── world/
│       ├── characters.json       <-- NPCs (Elder Daidalos, Timon the Suppliant, etc.)
│       ├── creatures.json        <-- Bestiary (Cithaeron Wolf, Brood of Echidna, etc.)
│       ├── deities.json          <-- Greek Pantheon (Hermes, Athena, Apollo, Artemis, etc.)
│       ├── items.json            <-- Panoply (Dory, Xiphos, Aspis, Salve, Wine, etc.)
│       ├── locations.json        <-- Node cartography, edges, coordinates, danger ratings
│       └── mythology.json        <-- Classical lore snippets citing ancient authors
├── documentation/
│   ├── CONTENT_SCHEMA.md         <-- JSON schemas for adventure packs and world files
│   ├── DEVELOPMENT_GUIDELINES.md <-- Style guide, Classical Greek spelling & mechanics
│   └── ENGINE_ARCHITECTURE.md    <-- Engine architecture, state machine & persistence
└── tests/
    └── engine_tests.js           <-- Automated Node.js unit test suite (28 tests)
```

---

## 🎮 Core Game Mechanics Quick Reference

### 1. The Six Primary Attributes (D&D 5e Standard)
| Attribute | Abbreviation | Governing Role |
| :--- | :--- | :--- |
| **Strength** | `STR` | Melee spear/sword damage, feats of physical power. |
| **Agility** | `AGI` | Evasion, initiative, bow accuracy, tactical feinting. |
| **Endurance** | `END` | Max Health ($20 + \text{Mod} \times 2$), Max Stamina ($16 + \text{Mod}$), forced march resistance. |
| **Intelligence** | `INT` | Puzzle deduction, investigation, reading ancient Cadmean inscriptions. |
| **Wisdom** | `WIS` | **Directly governs the Perception Substat**, tracking, mythology lore, sacred rites. |
| **Charisma** | `CHA` | Persuasion, heroic oratory, leadership, bartering. |

$$\text{Attribute Modifier} = \lfloor(\text{Score} - 10) / 2\rfloor$$

### 2. Perception Substat & Passive Perception
* `getPerceptionBonus()` calculates:
  $$\text{Perception Bonus} = \text{Wis Mod} + (\text{Perception Skill Rank} \times 2) + \text{Trait Bonus} + \text{Equipment Modifiers}$$
* `getPassivePerception()` calculates:
  $$\text{Passive Perception} = 10 + \text{Perception Bonus}$$
* Traits: *Vigilant Scout* (+2), *Wayfarer's Eye* (+2).
* Equipment: *Corinthian Helmet* (`perceptionPenalty: -1`), *Archaic Bronze Bell of Hermes* (`perceptionBonus: +1`).
* Exploration & Danger: Passive Perception $\ge 14\text{--}15$ automatically warns the hero of ambushes while resting or traveling.

### 3. Critical Success (Arete [20]) & Fumble (Ate [1])
* **Outside Combat (Skill Checks)**:
  * Rolling 20 on any d20 check triggers `triggerCriticalSuccessDiscovery(skillName, label)`.
  * Awards location-specific loot based on `worldState.currentLocationId`:
    * `loc_cithaeron_crossroads`: *Ancient Wayfarer's Cache* (Pramnian wine aryballos & 8 drachmae).
    * `loc_cithaeron_fissure_cave`: *Healer's Lost Alabastron* (Epidaurian dittany salve & 5 drachmae).
    * `loc_crag_overlook`: *Heroic Leaf-Bladed Xiphos* (Bronze Xiphos & 10 drachmae).
    * `loc_shrine_hermes_strophaios`: *Consecrated Offering of Hermes* (barley cakes, dried figs, 6 drachmae & +1 Hermes Piety).
    * `loc_plataea_outskirts`: *Arcadian Hunting Bow in the Thyme* (Yew hunting bow & 12 drachmae).
  * Awards items to inventory, drachmae to purse, logs entry in `journal.discoveries`, and renders an illuminated gold Arete banner in the transcript.
* **Inside Combat (Weapon Strikes)**:
  * Rolling 20 on `thrust`: Deals $(\text{Max Weapon Damage} \times 2) + \text{Str Mod} + 4$ critical damage.
  * Dislodges **4–8 silver drachmae** from the creature's lair, with a 50% chance to knock loose an Epidaurian herbal salve.

### 4. Stamina & Forced March Economics
* Max Stamina = $16 + \text{Endurance Modifier}$.
* If `stamina <= 0`, the hero is **Exhausted (κάματος)**:
  * Suffers a `-2` penalty to all attack rolls.
  * Cannot raise heavy shields (`shield_block` requires 2 stamina).
* Traveling when stamina is insufficient forces a **Forced March (καταπόνησις)**:
  * The stamina deficit is converted directly into **Health damage**.
  * If health is too low to survive the forced march, travel is blocked and the player is warned to make camp and rest first.

### 5. Resting & Consequential Time Passing
* Triggered via HUD `[🏕️ Rest & Camp]` button or Action Deck:
  * **Short Rest (1 hour)**: Restores stamina based on Endurance.
  * **Full Rest (8 hours)**: Fully restores stamina, heals wounds, consumes 1 ration (*Dried Figs & Bread*).
    * If camping in wilderness: rolls d20 nocturnal ambush check. High Passive Perception allows detecting the predator early.
  * **Sacred Contemplation (2 hours)**: Only available at consecrated shrines; 100% safe from danger.
* `advanceTime(hours, minutes)`:
  * Advances Attic solar period (*Morning/Eos, Afternoon/Mesembria, Dusk/Deile, Night/Nyx*).
  * Automatically handles day, month, and year calendar rollovers.
  * Resets daily morning libation allowances at altars.

### 6. Heroic Defeat Loop (`handlePlayerDefeat`)
* When player HP drops to `0`, combat immediately pauses and opens the `#defeat-modal`.
* The hero is guided by **Hermes Psychopompos** back from the threshold of Hades to the nearest discovered sanctuary.
* Revived with 12 HP, 6 Stamina, 12 elapsed hours, and a 5 silver drachmae toll placed upon the altar.

---

## 🧪 How to Verify & Run Tests

```bash
# 1. Run the automated unit test suite:
node tests/engine_tests.js

# 2. Verify JavaScript syntax in index.html:
node -e "const fs = require('fs'), vm = require('vm'), html = fs.readFileSync('index.html', 'utf8'); new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]); console.log('Syntax OK');"

# 3. Launch local game server:
python -m http.server 8000
# Then open: http://localhost:8000/index.html
```

---

*This document was created and maintained for pair programming between friends and their AI companions. Keep building greatness!*

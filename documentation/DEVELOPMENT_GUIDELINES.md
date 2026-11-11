# Development & Content Guidelines
**Document Version:** 1.0.0  
**Target:** Engineering, Systems Design & Classical Research  

---

> **Implementation status (v4.1 audit, 2026-11-11):** the module names below (`StateManager`, `RulesEngine`, …) describe the
> intended separation of concerns. In the current code all of them live as method groups inside one class,
> `GreekMythologyEngine`, in `index.html`. Save recovery is simpler than §1.2 describes: an unreadable save slot is
> skipped with a console error (the game still starts) and older saves are upgraded by `migrateState()`; there is no
> checksum or recovery dialog. Testing: `npm test` runs the legacy suite and `tests/behaviour_tests.js`, which exercises
> the real engine and content (see §3).

## 1. Code Standards & Architecture Guidelines

### 1.1 Modularity & Single-HTML Deliverable
- **Single-File Distribution:** The primary runtime deliverable is a self-contained `index.html` file embedding the complete game engine CSS and JavaScript, capable of executing directly in any modern desktop browser via standard HTTP or local server.
- **Source Modularity:** During development, logic is cleanly partitioned into distinct functional modules:
  - `StateManager`: Pure state container, serialisation, migrations, and event subscriptions.
  - `RulesEngine`: Probability, d20 checks, combat maths, attribute modifiers.
  - `ActionEngine`: Context action generation and intent parsing.
  - `MapEngine`: Vector SVG rendering, node graph traversal, and travel economics.
  - `JournalChronicle`: Persistent categorized knowledge and clue discovery indexing.
  - `PersistenceService`: IndexedDB asynchronous wrapper with LocalStorage fallback.
  - `UIController`: View switching, narrative log rendering, typewriter effect, dialog trays.
- **Content Decoupling:** Never embed specific adventure narratives, quest IDs, or custom dialogue branches into engine logic. The engine interprets generic types defined in the schema.

### 1.2 Error Handling & Resilience
- **Schema Validation:** Always validate incoming JSON packs prior to merging into state. If an adventure references an unknown location ID, log a structured warning and provide a safe fallback state rather than throwing an unhandled exception.
- **Corrupt Save Recovery:** If IndexedDB save data fails checksum or schema validation, prompt the user with a recovery dialog, restore the last known valid auto-save, and write an error diagnostic to the console.

---

## 2. Classical Research & Historical Accuracy Standards

This project demands strict adherence to authentic classical traditions. Generic fantasy tropes must not be passed off as Greek myth.

### 2.1 Ancient Greek vs. Roman Traditions
- **Greek Names First:** Use authentic Greek naming conventions rather than Latinised/Roman variants:
  - *Herakles* (not Hercules)
  - *Odysseus* (not Ulysses)
  - *Ares* (not Mars)
  - *Hades / Plouton* (not Pluto)
  - *Hermes* (not Mercury)
  - *Athena* (not Minerva)
- **Roman Sources Identified:** When consulting Roman authors (such as Ovid's *Metamorphoses* or Virgil's *Aeneid*), explicitly document that the narrative represents the Augustan Roman tradition rather than the Archaic Greek tradition (e.g., Hesiod or Homer).
- **Variant Traditions Acknowledged:** Acknowledge regional and theological variations. For instance, the Hesiodic birth of Aphrodite from the sea foam (*Ouranos*) versus the Homeric tradition (*Zeus and Dione*) must be treated as distinct mythological traditions rather than merged carelessly.

### 2.2 Classical Concepts to Weave into Engine Systems
1. **Arete (ἀρετή):** Heroic excellence in martial, oratorical, or athletic endeavor. Expressed through critical triumphs on high-difficulty rolls.
2. **Hubris & Nemesis (ὕβρις & νέμεσις):** Insolence towards the gods. Characters who boast or desecrate shrines accumulate *Hubris*, which heightens divine wrath and invites disastrous divine intervention.
3. **Miasma (μίασμα):** Spiritual pollution incurred through murder, oath-breaking, or sacrilege. Miasma bars entry to sanctuaries, incurs social penalty, and requires ritual purification (*katharsis*).
4. **Xenia (ξενία):** Sacred guest-friendship overseen by Zeus Xenios. Breaching hospitality carries severe narrative and divine consequences.
5. **Time (τιμή) & Kleos (κλέος):** Honor and immortal renown sung by future generations. Measured as key character reputation attributes.

---

## 3. Testing & Verification Protocol

Before certifying any stage:
0. **Run the suites:** `npm test` (no dependencies) and, if Playwright is available, `npm run test:browser`. Prefer adding
   tests to `tests/behaviour_tests.js`: they run the real engine from `index.html` with the real JSON content, unlike the
   mock-based tests in `tests/engine_tests.js`. After editing Dev campaign JSON, run `npm run sync:embedded` so the
   embedded `file://` copy in `index.html` matches (`npm test` checks this).
   When changing the save structure, bump `GreekMythologyEngine.SAVE_VERSION` and extend `migrateState()`; never drop fields.
1. **Automated Unit Tests:**
   - Execute logic verification on `RulesEngine` (attribute modifiers, d20 probability distribution, skill check bounds).
   - Test `StateManager` immutability and IndexedDB save/load cycle round-tripping.
   - Verify `ContentLoader` against valid and deliberately malformed test packs.
2. **Manual End-to-End Walkthrough:**
   - Complete character creation and verify stat calculation.
   - Navigate the SVG map; verify travel duration and stamina subtraction.
   - Verify that acquiring a clue in conversation unlocks a previously unselectable riddle option.
   - Test saving in combat, closing the browser tab, reopening, and resuming without state degradation.

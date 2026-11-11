# Independent Project Audit — Browser RPG (Engine v4.1)

> **Two passes.** Part 1 (sections A–H below) is the first audit pass. **Part 2** (at the end) is a second, independent pass made the same day. It re-checked Part 1's changes and continued into areas Part 1 had not covered. Part 2 found two more critical problems: save slots being overwritten, and most of the world map being unreachable. Items in Part 1 §F that Part 2 resolved are marked ✅.

**Date:** 2026-11-11 · **Scope:** the whole repository (`index.html` engine and UI, all content packs, tests, documentation)
**Approach:** read the engine end to end, then verified behaviour by running the real engine (Node VM harness with the real JSON content, plus headless Chrome over HTTP and `file://`). Every fix is covered by a regression test. No gameplay features were added beyond completing behaviour the game already presents to the player.

---

## A. Overall Assessment

The project is ambitious and the content is rich, but before this audit it was **less stable than its test results suggested**. All 74 existing tests passed, yet many of them test re-implementations (`MockCombatEngine`, `MockRulesEngine`, …) or only check that strings exist in `index.html`, so real bugs in the engine went unnoticed.

The most serious problems were at the **boundaries between systems**: campaign loading ↔ saves, combat ↔ encounter rewards ↔ quests, crafting ↔ persistence ↔ armour class, scheduler ↔ calendar, and the Greek content leaking into the "universal" campaign framework. Those are now fixed and tested. The architecture (one large engine class in a single HTML file, with content duplicated as embedded fallbacks) still works, but it is the main long-term maintenance risk (see G).

---

## B. Problems Identified (by severity)

### Critical
| # | Problem | Systems |
|---|---------|---------|
| C1 | A save from a non-default campaign (Dev Test) resumed with **Greek content** after a page reload: `init()` loaded the default content before reading the save. The hero stood in a non-existent location. | Saves, campaigns |
| C2 | Starting any campaign carried over the default Greek state: Greek factions, discovered Greek locations, the Greek tutorial quest, and Greek items in the inventory. Switching campaigns in one session also kept the previous campaign's factions, encounters and events. | Campaigns, content loading |
| C3 | **No save migration.** Older saves missing newer fields could break systems silently. Currency from `giveDrachmae` outcomes had been written to an unused `player.drachmae` field. | Saves |
| C4 | Autosave always wrote to **Slot 1**: playing a game loaded from Slot 2 overwrote the Slot 1 game. A corrupted slot could stop the game from starting. | Saves |
| C5 | **Crafted items were never saved.** Their definitions lived only in memory, so they turned into nameless placeholders on reload. Crafted armour gave **0 AC** (`stats.defense` vs `defenseBonus`). | Crafting, saves, combat |
| C6 | Encounter `victoryOutcome`s were **never applied** (`_activeEncounter` was never set). Every kill of any creature also set the tutorial flag `cithaeron_beast_defeated`, which let players skip the tutorial cave. | Combat, quests |
| C7 | Clicking during the 1.5-second victory/defeat delay re-ran combat: **duplicate XP per click**, and the defeat penalty and 12-hour skip were applied twice. | Combat (race condition) |

### High
| # | Problem |
|---|---------|
| H1 | Any dialogue `completeQuest` ran the Greek tutorial completion. That meant the wrong quest, tutorial rewards paid twice (60 drachmae, 300 XP, 2 bells), and Greek rewards and the victory screen appearing in the Dev campaign. |
| H2 | The puzzle's clue-based answer (`known_answer`) fell through to "the stones remain unmoved". The puzzle's data-driven keywords and `successOutcome` were ignored. |
| H3 | Creature `xpReward` was ignored, so every enemy gave 50 XP (a Hydra = a wolf). |
| H4 | Every creature kill scheduled a **boss respawn** event. |
| H5 | The absolute clock counted 365-day years, but the calendar has 360. At each new year it jumped 5 days and **scheduled events fired early**. |
| H6 | The scheduler lost occurrences of recurring events during big time skips. A recurring event whose condition was false was dropped permanently. Re-scheduling an id that had already run never fired again. |
| H7 | Quest stages never advanced: objectives of later stages were silently ignored, so the quest log never showed them. |
| H8 | Dev NPCs (`dialogueId`) never opened their dialogues. 11 Greek NPCs referenced dialogue trees that don't exist, so "Speak with …" did nothing. |
| H9 | The action deck showed duplicate cards and duplicate category groups (legacy hard-coded tutorial actions plus data-driven ones). Daidalos had three "Speak with" cards. |
| H10 | Defeat teleported the hero to a Greek shrine, and rest/travel ambushes spawned a Greek wolf, **in every campaign**. Campaign `randomEncounters` were never loaded. |
| H11 | 9 item ids referenced by Greek classes, a merchant and a creature did not exist. Most classes started with nameless junk "accessories" plus the default hoplite kit still equipped. |
| H12 | Infinite money/XP farms with no time cost: pickpocketing the same NPC, natural-20 discovery caches, Venus-cast re-rolls, the hunting/herb/dice minigames, and a **free +8 AC Shield Clash every round**. |
| H13 | Manifest consequence rules bypassed the shared scheduler and ignored their `failQuest`, `piety` and `morality` outcomes. |
| H14 | Social cooldowns used `day*24+hour` and broke at every month boundary. Persuasion changed the shared content object, so it was lost on reload. |
| H15 | In HTTP mode the Dev campaign's quest catalog (`world.quests`) was never set, so moral choices and early-completion bonuses could not work. |

### Medium
- Inline creature loot was rolled **twice** per kill, once without rarity caps.
- Crafting consumed materials even on failure, contradicting the docs ("failures never destroy materials") and its own toast. `craftItem()` also did not check materials or toolkit.
- A main-hand item without damage stats (e.g. a crafted lyre) produced `NaN` damage, so the fight could not be won.
- Bows attacked with Strength + Melee, although the Agility description says it governs bow accuracy.
- Dev consumables (`effect.restoreHealth`) could not be used from the inventory or in combat. The combat item button only knew three Greek items.
- Trait/origin perks shown in the wizard were not applied, every hero received the Vigilant bonus and two default traits, and the background defaulted to a legacy id.
- Morality thresholds and boss respawn rules ignored the campaign configuration.
- Rest durations ignored the campaign `activityDurations`. Time-of-day and urgency messages were Greek in every campaign.
- Escape closed the level-up window and discarded the pending level-up.
- Unlocked containers (`locked: false`, `contents`) could not be looted. Dev objects' `lockDifficulty`/`requiredKeyId` were only partly supported.
- Hard-coded Dev-campaign quest ids in `handleNpcDeath()`. Elena's journal was granted twice.
- Loot-table `minQuantity`/`maxQuantity` ranges always gave the minimum.
- Crafting UI and fallback catalogs leaked Greek crafting into other campaigns.
- The campaign validator did not check item references (it would not have caught H11).

### Low
- `innerText` labels showed literal `&rarr;` / `&bull;`. The HUD showed raw ids such as `BG_DEMIGOD_SCION`.
- The presence list still showed slain NPCs. The quest sidebar only ever showed the tutorial quest. The quest log had no FAILED state and the same summary for every quest.
- Wrong `showToast` arguments when deleting saves. The import button could not re-import the same file. Favicon 404.
- The chronicle DOM grew without limit, which is a slow memory leak in long sessions.

---

## C. Corrections Implemented

| Area | Change (smallest reliable fix) |
|------|-------------------------------|
| Saves | `init()` reads the save first. `applyLoadedState()` switches content to the save's campaign. `migrateState()` (save v1.4.0) fills containers, normalises legacy slots and recovers lost currency. `autosave()` writes to the current game's slot and `gm_last_slot` resumes it. IndexedDB/localStorage errors are handled and corrupted slots are skipped. |
| Campaigns | `loadContent()` resets all catalogs. `resetStateForActiveCampaign()` gives each new game only its own factions, places, items and quests. Fallback catalogs, origins, traits, defeat recovery, ambush creatures and time narration are campaign-aware. |
| Combat | Encounter outcomes applied from the combat session. `ended` guard against repeated clicks. Data-driven XP. Generic consumables. Ranged weapons use Agility. NaN-safe damage. Bosses only schedule boss respawns. Encounter cooldowns enforced. NPC `combatStats` honoured. |
| Quests | Shared quest helpers: `getQuestDefinition`, `setQuestStage`, `failQuest`, stage advancement, arrival objectives. Data-driven NPC-death failover. Moral choices go through `completeQuest`. |
| Dialogue & puzzles | Correct quest completion. One-time rewards stored in the save. `startQuest` support. NPCs linked by `dialogueId`; generated conversations for NPCs without trees. Puzzles use their data (`known_answer`, keywords, `successOutcome`). |
| Scheduler/time | Continuous 360-day clock (Year-1 timestamps unchanged). Chronological processing loop with recurrence and safety valve. Re-scheduled ids run again. Bounded ledger. Consequence rules use `scheduleEvent()`. |
| Crafting | Validates toolkit and materials, consumes only on success, saves item definitions, armour uses `defenseBonus`. |
| Exploits | Discovery caches once per location. Pickpocket 24 h cooldown plus time cost. Venus pays once. Minigames take time. Shield Clash costs 2 Stamina, once per round, uses the turn. |
| Content data | Added 7 missing common items, remapped 2 ids, marked the bow `ranged`. Dev classes now have starting gear. Elena's journal moved into quest data. Tutorial "reach the fissure" objective and the portal now resolve. Embedded fallbacks synced. |

## D. Improvements Made
- **Testing:** `tests/behaviour_harness.js` runs the real engine with real content in a Node VM (no dependencies). `tests/behaviour_tests.js` has 46 behaviour/regression tests, including content cross-reference validation, embedded-vs-JSON sync checks and two 600-step seeded fuzz playthroughs with state invariants. `tests/browser_smoke.js` is an optional Playwright test. `npm test` now runs both Node suites.
- **Validator:** now reports missing items in loot tables, creature loot, merchant stock and class/background kits, plus missing loot tables.
- **Schema tolerance:** both field spellings found in shipped content are accepted (`lockDc|lockDifficulty`, `keyRequired|requiredKeyId`, `dialogueTreeId|dialogueId`, `faction|factionId`, `stats|effect`).
- **Usability:** readable identity line, quest FAILED badge and stage descriptions, honest crafting/merchant messages, clearer level-up and restart prompts.
- **Performance/memory:** chronicle capped at 400 entries, scheduler ledger capped at 500 ids, inline loot resolved once. `renderAll()` measured at about 1.1 ms, so no rendering refactor was needed.
- **Docs:** `ENGINE_ARCHITECTURE.md` §7–9 rewritten to match the code (and to mark unimplemented features). Field reference added to `CONTENT_SCHEMA.md` §23. Content guide, development guidelines and `DEVELOPER_NOTES.md` (Session 11) updated.

## E. Testing Results
| Suite | Result |
|------|--------|
| `tests/engine_tests.js` (legacy) | **74 / 74** (one test updated: it relied on crafting without materials) |
| `tests/behaviour_tests.js` (new) | **46 / 46**. On the original code **0 / 40** of the initial set passed, which confirms that each test reproduces a real defect. |
| `tests/browser_smoke.js` (headless Chrome, HTTP) | **6 / 6**, no page errors |
| Manual browser probes | Full tutorial played through the UI cards (talk → tracks → travel → clue → riddle → fight → bell); Dev campaign dialogue, crafting screen and save/reload; `file://` mode for both campaigns. |

**Verified:** campaign isolation and switching, save identity, migration and slots, character creation, action deck, tutorial storyline, combat rewards/race/defeat/ranged/consumables/Shield Clash, loot, crafting and persistence, scheduler (year boundary, recurrence, re-scheduling, consequence rules), social cooldowns, NPC death failover, morality config, exploit limits, UI labels.
**Partially tested:** minigame timing UIs (rewards and time costs tested; the real-time interaction was not played by a human), map rendering (renders without errors; layout not inspected visually), IndexedDB path (exercised in Chrome; the Node harness uses localStorage).
**Not tested:** Firefox/Safari, mobile layouts, audio, very large saves, the in-game Dev Notes modal content.

## F. Remaining Issues (not changed: design decisions or new features)
1. **Class features are not implemented.** Every class defines `classFeatures` for levels 1–5 and proficiencies, but the engine only applies stat bonuses and starting gear. This is the largest gap in class balance.
2. **No merchant trading.** Merchant stock and prices exist as data only; there is no buy/sell system, so the economy has no gold sink.
3. **Campaign module toggles** on the selection screen are saved but have no effect on loading.
4. **NPCs who "yield and flee"** at 25 % HP are recorded as killed (permanent death, hubris, inquest). Changing this is a design decision.
5. **Rarity vocabulary:** loot caps apply only to `epic/legendary/mythic`. Greek items use `exceptional/consecrated`, which are uncapped, and tier 4–5 Greek monsters are not flagged `isBoss`. Decide the mapping before tuning drop rates.
6. **Crafting balance:** a standard crafted bronze sword (≈ 8–12 damage) beats most found weapons, including the "exceptional" Cyclopean Dory (7–14 at the low end). Consider damping material bonuses.
7. **Dev campaign content gaps:** 7 of 8 Dev quests have no content path to completion, and `resolveMoralChoice()` has no UI entry point. *(Part 2: partly an engine problem: most locations were unreachable and object `unlockOutcome`s were ignored. Now 3 of 8 can be completed; see Part 2 §F.)*
8. **`file://` mode** uses a reduced Greek content subset (no toolkits or materials, so no crafting). Use `python server.py` for full play.
9. **Not configurable per campaign:** calendar length, origin/trait effects beyond attributes/skills/piety/reputation/morale (e.g. "Swift Mountain Movement", "+3 vs fear", which have no underlying system), morale in combat.
10. ✅ Lockpicking and heaving now take time (Part 2). Objects inside rooms (e.g. the vault coffer) are still not gated behind their doors.
11. ✅ `athletics` is now a skill (Part 2). `intimidation` and `crafting` still have no effect.
12. Crafted items made before this version were never saved and cannot be recovered; they stay as "unidentified" items in old saves.

## G. Further Recommendations
1. **Split `index.html` into modules** (engine class, UI, embedded content) with a tiny build step that inlines them for the single-file deliverable. This reduces merge conflicts between the two collaborators and makes reviews practical. Large rewrite: plan it separately.
2. **Generate the embedded fallbacks from the JSON** with a script instead of hand-maintaining copies. The sync test now catches drift for the Dev campaign; the Greek fallback is intentionally partial.
3. Add **merchant trading** and **class features** next, since data for both already exists. Then revisit balance (crafting, rarity caps, boss flags).
4. Retire or rewrite the mock-based legacy tests over time; new tests should go into `behaviour_tests.js`.
5. Run **Validate Campaign** in CI (it can be called from the Node harness) so broken content references fail the build.

## H. Final Compatibility Assessment
| Item | Status |
|------|--------|
| Greek Mythology campaign (HTTP) | Verified: creation, all views, full tutorial, combat, crafting, saves |
| Developer Verification campaign (HTTP) | Verified: isolation, dialogues, combat/NPC death, saves across reload. Content gaps noted in F7 |
| `file://` mode | Verified for both campaigns (reduced Greek content) |
| Save format | v1.4.0 (Part 1) → **v1.5.0** (Part 2). Older v1.x saves migrate without losing progress (tested with synthetic v1.2, v1.3 and v1.4 saves). Saves created by this version are not intended for older engine builds |
| Content formats | Existing JSON accepted unchanged. New optional fields documented in `CONTENT_SCHEMA.md` §23 |
| Browsers | Chrome (headless) verified; others not tested |

---
---

# Part 2 — Second Independent Pass (2026-11-11)

**Approach:** I started by reviewing Part 1's ~1,900-line engine diff line by line. I then probed every remaining system with the real engine and content (Node VM harness) and in real Chrome (HTTP with IndexedDB, and `file://`). Every suspected defect was reproduced before it was fixed. Each fix has a regression test, and the new tests were run against Part 1's engine to confirm that they fail there.

## A. Overall Assessment (after Part 2)

Part 1's fixes held up: I found no regressions in its diff. Its tests, however, only exercised the paths it had looked at. Part 2 found problems in the flows between screens and in how content is wired up:

* **Save safety.** Starting or importing a game could silently overwrite another saved hero.
* **Reachability.** Travel only offered places already discovered, so most of both campaigns' maps could never be visited.
* **Content registration.** Three documented content features were loaded but never executed: `events.json` world events, interactive-object `unlockOutcome`, and encounter `repeatable` / `triggerCondition`.

The documentation also described several formats the engine never read. With these fixed, both campaigns are fully traversable and the shipped content now does what its data says. The project is in a stable state for continued development. The main structural risk is still the single 12,000-line `index.html` (see Part 1 §G1).

## B. Problems Identified (Part 2)

### Critical
| # | Problem | Evidence |
|---|---------|----------|
| P2-C1 | **Starting a new game overwrote saves.** *Launch Campaign* mid-game replaced the running game with no confirmation, and the new hero autosaved into Slot 1. In the reproduction, a Greek game in Slot 1 was replaced by the Dev hero. *Restart* did the same. | Reproduced in the harness and in Chrome |
| P2-C2 | **Importing a save overwrote an unrelated slot.** The import reused the `saveSlot` number stored inside the file, so the next autosave replaced whatever game was in that slot on this machine. | Reproduced: "PreciousSlot2" was overwritten |
| P2-C3 | **Most of the world was unreachable.** Travel cards and the map offered only already-discovered places, and almost nothing discovers new places. Reachable through the UI: **3 of 19 Greek locations** (plus the cave during the tutorial) and **1 of 5 Dev locations**. Every Dev quest outside Haven was impossible. | Breadth-first search over the real travel cards |

### High
| # | Problem |
|---|---------|
| P2-H1 | Clicking a campaign card on the selection screen switched `activeCampaign` (activity durations, morality, respawn, fallback catalogs) **without loading its content**. Browsing to Dev and back left a Greek game running under Dev rules, and in `file://` mode Greek crafting disappeared. *Validate Campaign* validated one campaign's manifest against another campaign's content. |
| P2-H2 | **Encounter farming.** Encounters without `cooldownHours` stayed available after victory and re-applied their full `victoryOutcome`. The Dev Shadow Stalker paid 440 XP per 15 in-game minutes. `repeatable` and the documented `triggerCondition` were ignored. |
| P2-H3 | **`events.json` world events never fired.** They were loaded into `world.events` but never read. For example, the curfew after Lycus's murder and the Sunstone heal never happened. |
| P2-H4 | **Interactive-object `unlockOutcome` was never applied** (documented in CONTENT_SCHEMA). As a result, the Dev boulder never revealed the Sunken Grotto road, and the vault's flags were never set. |
| P2-H5 | **The embedded `file://` Dev content had drifted from its JSON:** different classes, a non-existent background and no random encounters. Its loader also wrote Dev faction standings into whatever game was running, and replaced the campaign manifest with a partial stub. |

### Medium
* Scheduled `quest_deadline` / `quest_stage` events set `q.stage` / `q.failed` directly. The new stage's objectives never appeared, and later milestones of a failed quest stayed queued.
* Heaving rolls an `athletics` skill that heroes did not have. Five backgrounds' "+2 athletics" was silently lost, and the level-up window had a hard-coded skill list.
* Lockpicking and heaving could be retried with no time cost. A lockpick on an already-open object could award XP again.
* Every kill scheduled a new respawn event with a unique id, so duplicates piled up for the same creature.
* A level-up pending at save time was lost after loading until more XP arrived.
* XP thresholds and Greek level titles were hard-coded for every campaign, so the Dev hero was an "Ephebos".
* `moralityConfig` docs show `alignmentTiers` / `initialVirtue` / labels, but the engine read only `tiers`. Toasts always said "Arete/Miasma".
* Equipped item stats `wisdomBonus`, `charismaBonus`, `persuasionBonus` and `damageReduction` were authored but never applied.
* The enemy damage parser ignored `-K` and would read a flat `"5"` as 5d6 (no shipped content was affected).
* The calendar migration from Part 1 shifted every old timestamp by the save's *current* year. Events created before a year boundary would have fired 5 days early.
* Documentation: CONTENT_SCHEMA §20 (respawn), §21 (morality) and §22 (timed quests: `milestones`, `hoursElapsed`, `moralChoices`) described fields the engine never read.

### Low
* Ambush narration always described a "mountain wolf" with grey fur and pine needles, in every campaign.
* The crafting header showed a static "Fieldcraft & Gathering: Rank 1 (+2)" that was never applied.
* Save slots gave no hint of their contents. *Save* into another hero's slot did not ask. *Load* of another slot discarded unsaved progress.
* Exported save files were always named `greek_mythology_save_…`.

## C. Corrections Implemented (Part 2)

| Area | Change |
|------|--------|
| Saves | `findSlotForNewGame()` / `prepareSlotForNewGame()`: the current game is autosaved first, the new or imported game uses the first slot without a hero, and the player confirms before anything is replaced (`importSaveState()`, `restartAdventure()`, `confirmCampaignSelection()`). *Save* asks before overwriting another hero; *Load* saves the current game first. Slot list shows hero, level, campaign and time. `checkPendingLevelUp()` runs after resume, load and import. Save format **1.5.0**. |
| Campaigns | `selectedCampaignId` is separate from `activeCampaignId`; only *Launch* switches. `withCampaignContent()` lets *Validate* check the highlighted campaign against its own content and then restores the running game. Embedded loaders no longer touch game state. |
| Travel | Travel cards for every open road ("Explore toward X (unexplored)"); unexplored neighbours are clickable on the map. `isConnectionOpen()` enforces `requiresFlag` / `requiresNotFlag` in the cards, the map and `executeTravel()`. |
| Encounters | `isEncounterAvailable()`: `triggerCondition`, one-time unless `repeatable`, cooldown or creature respawn. Used by both the action deck and `startCombatEncounter()`. |
| World events | `setWorldFlags()` (all content `setFlags` paths), `processWorldEvents()` (FLAG_SET, ITEM_ACQUIRED, any `emitEvent` name). Event-driven, fired once unless `repeatable`, ledger saved in `firedWorldEvents`. `applyWorldOutcome()` is shared with manifest consequence rules (adds `restoreHealth/Stamina` and transcript `speaker`). |
| Objects | `markObjectOpened()` applies `unlockOutcome` once for lockpick, key, heave and mechanism. Authored XP replaces the generic award. `failureConsequence.message` and `breakToolOnAte` are honoured. Lockpicking and heaving take `lockpicking` / `heave` time (10 min). |
| Quests & scheduler | Deadline and stage events use `setQuestStage()` / `failQuest()`. Respawn ids are `respawn_<creature>` and `boss_respawn_<encounter>`. Migration shifts each timestamp by its own year and re-sorts the queue. |
| Rules | `athletics` skill (+ migration that honours the background bonus). Level-up lists every skill. `getEffectiveAttribute()` / `getEquipmentStat()` apply item bonuses to skill checks and attacks. `damageReduction`. `rollDamageExpression()`. Campaign `progression` (XP table, titles). `getMoralityConfig()` (both formats, labels, titles, starting balance). |
| UI text | Ambushes name the actual creature (`pickAmbush()`). The crafting header shows `d20 ± mod (Attribute)`. Item tooltips list applied bonuses. Campaign-neutral export names. |
| Content | Dev vault door, coffer and boulder now update and complete the heist and grotto quests. Embedded Dev content is regenerated from JSON by `scripts/sync-embedded-dev-content.js`. |

## D. Improvements Made (Part 2)
* **Maintainability:** `scripts/sync-embedded-dev-content.js` (`npm run sync:embedded`, and `--check` in `npm test`) replaces the hand-maintained `file://` copy of the Dev campaign. The sync test now compares every Dev catalog exactly, not just ids.
* **Shared paths instead of duplicates:** one outcome applier for consequence rules and world events, one flag setter, one object-opening path, one encounter-availability rule, one effective-attribute function.
* **Universal campaign support:** progression and morality are now configurable per campaign. Greek titles, labels and ambush prose no longer appear in other campaigns.
* **Performance:** the new event processing is O(events with that trigger) per flag change or item gain, with no polling. The respawn queue no longer grows with repeated kills of the same creature. Stress run: 48,000 actions in 14 s (Node), including 1,749 reloads.

## E. Testing Results (Part 2)
| Suite | Result |
|------|--------|
| `tests/engine_tests.js` (legacy) | **74 / 74**. Two tests updated: they asserted the stale embedded Dev background and the loader's side effect on faction state. |
| `tests/behaviour_tests.js` | **65 / 65**. 19 new tests (save safety ×3, campaign browsing, encounters, world events, quest deadlines, respawn, athletics, lockpick time, pending level-up, progression, morality, equipment, migration, ambush narration, crafting header, travel reachability, unlock outcomes). The sync test is now exact. **All 19 fail on Part 1's engine.** |
| `scripts/sync-embedded-dev-content.js --check` | In sync (part of `npm test`). |
| `tests/browser_smoke.js` (Chrome, HTTP, IndexedDB) | **7 / 7**. New check: launching a campaign mid-game asks first and keeps the old game in Slot 1. |
| Chrome probes | IndexedDB: Greek game kept in Slot 1 with unsaved progress, Dev hero in Slot 2, browsing did not change rules, curfew world event fired via the real combat path and survived a reload, slot summaries rendered, loading Slot 1 restored the Greek game and content. UI travel by card and map node over HTTP and `file://`. `file://` boot of both campaigns with no errors. |
| Stress fuzz (`/tools`, not in repo) | 8 seeds × 3,000 steps × 2 campaigns = **48,000 random actions**: travel (6,458), combat (13,602 rounds), crafting (947), rests, time skips, and **1,749 save → new-engine reload round trips**. Zero errors and zero invariant violations (vitals, currency, clock monotonic, known locations and items, scheduler size, reload equality). |

**Verified:** everything listed in C, plus Part 1's verified list (re-run).
**Partially tested:** the map's dashed "unexplored" edges render without errors, but the layout was not inspected visually. The real-time minigame interaction was not played by a human.
**Not tested:** Firefox, Safari, mobile layouts, audio, very large saves.

## F. Remaining Issues (Part 2 view)
Still open from Part 1 §F: 1 (class features), 2 (merchant trading), 3 (module toggles), 4 (NPC yield recorded as death), 5 (rarity vocabulary and boss flags), 6 (crafting balance), 8 (Greek `file://` subset), 9 (calendar and origin effects), 12 (pre-1.4 crafted items).

New or refined:
1. **Five Dev quests still have no content path to completion:** the boar menace turn-in, merchant delivery, urgent rescue, the bandit alliance (`resolveMoralChoice()` has no UI entry) and ancient ruins. Their objectives are referenced by no content. Sunstone, heist and grotto can now be completed.
2. **With travel opened up, the whole Greek map is reachable from the start.** Recommended-level warnings ("Heroic Peril") still apply. The crag overlook → fissure cave road has no `requiresFlag`, so the cave can be reached before the tutorial reveals it. Add a predicate if that is not intended.
3. **Quest `rewards` are descriptive, not granted automatically.** Both campaigns grant rewards in the turn-in outcome, so automatic granting would pay them twice. The heist and grotto quests therefore pay only the XP authored on their objects. This is now documented.
4. Random-encounter types `peaceful` and `discovery` (Dev: travelling tinker, roadside altar) are loaded but never triggered. Only `combat` entries are used for ambushes.
5. Item `attributeRequirement` is shown in tooltips but not enforced. Stats such as `moraleBonus`, `staminaBonus`, `coldResistance` and `blockChance` are descriptive only.
6. `respawnRules.creatureNormalHours` / `creatureRareHours` and `failureConsequence.alertNpcId` are not read. Trap `disarmDC` has no disarm action.
7. Class `statBonuses` to `perception` (Dev "Shadow Infiltrator") are overwritten, because perception is derived from Wisdom.

## G. Further Recommendations (Part 2)
1. Decide the **exploration design**: fully open roads (current), or predicates on the roads that should be gated. The data already supports both.
2. Add **merchant trading** (data and UI hooks exist), then revisit loot and crafting balance with a real gold sink.
3. Extend the sync-script approach to the Greek `file://` fallback, so both campaigns run identically from disk.
4. Give the Dev campaign complete quest paths. It is the regression fixture for the universal-campaign features, and each new engine feature should have one Dev content use.

## H. Final Compatibility Assessment (after Part 2)
| Item | Status |
|------|--------|
| Greek Mythology campaign (HTTP) | Verified: all 19 locations reachable, full tutorial, combat, crafting, saves |
| Developer Verification campaign (HTTP and `file://`) | Verified: 4 of 5 locations open from the start, grotto after the boulder, world events, objects, encounters, saves. Quest content gaps in F1 |
| Save format | **1.5.0**. v1.2, v1.3 and v1.4 saves migrate (synthetic fixtures). No silent slot overwrites |
| Content formats | Existing JSON accepted unchanged. New optional fields (`progression`, `alignmentTiers`, `requiresNotFlag`, `repeatable` events) documented in CONTENT_SCHEMA §21–23 |
| Browsers | Chrome (headless, HTTP + IndexedDB, `file://`) verified; others not tested |

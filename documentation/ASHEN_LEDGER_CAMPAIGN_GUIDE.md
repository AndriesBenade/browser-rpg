# The Ashen Ledger: Frontier of the Toll - Developer Campaign Guide

> **DEVELOPER DOCUMENT ONLY (CONTAINS FULL SPOILERS & HIDDEN MISSION TRIGGERS)**
> This guide documents the architecture, worldbuilding, quests, morality branches, hidden missions, encounters, crafting, and validation of `campaign_ashen_ledger`. Hidden mission conditions are intentionally **excluded** from player-facing UI and documented exclusively here.

---

## 1. Campaign Overview & Creative Independence

- **Campaign ID:** `campaign_ashen_ledger`
- **Title:** *The Ashen Ledger: Frontier of the Toll*
- **Manifest:** `content/campaigns/ashen_ledger/campaign.json`
- **Genre:** Original Dark Fantasy / Industrial Afterlife Frontier
- **Theme:** Obsidian, tarnished brass, and spectral violet (`#0b0a0e`, `#c98a3b`, `#9b72bd`)
- **Starting Location:** `loc_al_ferry_quay` (Ferry-Weir Quay, Weir-Port)
- **Default Hero:** Rowan

### Creative Independence Guarantee
*The Ashen Ledger* draws purely thematic inspiration from dark fantasy concepts (an industrialised afterlife bureaucracy, an eternal salt-and-ash frontier, magic that demands steep personal tolls, a corrupt institution containing principled reformers alongside ruthless actors, and intelligent/tragic altered adversaries). Every world name, faction, character, deity, creature, item, spell, location, and storyline is **100% original**. Automated tests explicitly assert zero leakage of source-material names or proper nouns across all 26 campaign files.

---

## 2. Scale Benchmarks vs. Existing Campaigns (v1.1 Crucible & Frontier Expansion)

| Content Category | Greek Mythology | Lanternfall (Dev) | The Northern Realms | **The Ashen Ledger (v1.1)** |
| :--- | :---: | :---: | :---: | :---: |
| Locations | 19 | 5 | 25 | **36** (+44%) |
| Regions | 5 | 1 | 5 | **7** (+40%) |
| NPCs (Merchants) | 14 (4) | 3 (1) | 17 (6) | **27 (11)** (+59%) |
| Factions | 4 | 2 | 8 | **10** (+25%) |
| Quests (Main / Crafting Arc / Side / Moral-Excl / Hidden) | 7 | 4 | 11 | **23** (4 / 3 / 8 / 4 / 4) (+109%) |
| Creatures (Bosses) | 12 (2) | 4 (1) | 10 (2) | **19 (6)** (+90%) |
| Tactical Encounters | 8 | 3 | 10 | **18** (+80%) |
| Items | 66 | 14 | 54 | **118** (+79%) |
| Crafting Materials | 10 | 4 | 10 | **20** (+100%) |
| Crafting Templates (Concealed) | 15 | 4 | 16 | **34** (+113%) |
| Professions / Combinations | 7 / 4 | 2 / 1 | 4 / 5 | **6 / 12** |
| Campaign Spells (+17 Global) | 0 (17) | 0 (17) | 0 (17) | **10 (27 total)** |
| Interactive Objects / Puzzles | 2 / 1 | 2 / 1 | 6 / 3 | **13 / 5** |
| World Events / Codex Lore / Glossary | 6 / 12 / 18 | 4 / 2 / 4 | 14 / 10 / 24 | **28 / 19 / 39** |

### Crucible & Frontier Expansion Highlights (v1.1)
- **4 Additional Interconnected Locations (36 total, 19 hiddenSpots):**
  - `loc_al_crucible_wharf` (The Crucible Wharf & Old Forge - Weir-Port, home of Master Artisan Orla Vane-Kin)
  - `loc_al_amber_catacombs` (The Amber-Vein Catacombs - Ash-Fields, guarded by Crucible Slag-Golem & Slag-Carapace Scuttlers)
  - `loc_al_salt_observatory` (The Shattered Salt-Observatory - Pale Reach, home of Puzzle #5 `puzzle_al_observatory_orrery` -> answer: `star` / `starlight`)
  - `loc_al_bell_crypt` (Crypt of the Muted Bells - Ossuary Bastions, guarded by Boss #6 `creature_al_boss_bell_mender`)
- **Dedicated 3-Part Crafting Side Quest Line (Master Crucible-Smith Orla Vane-Kin, `npc_al_master_orla`):**
  1. `quest_al_craft_01_cold_hearth` (*The Cold Crucible*) - Craft any item (`ITEM_CRAFTED` event) to earn `item_al_kit_clockwork` & Orla's Unstamped Forge-Mark.
  2. `quest_al_craft_02_amber_vein` (*Resin of the Deep Slag*) - Tap the Ancient Pitch Cistern (`obj_al_pitch_cistern`), perform any Field Combination (`ITEM_COMBINED` event), and choose whether to share surplus pitch with Dara's quarry families (+Mercy), keep it independent, or auction vein rights to Mintmaster Gideon (+Toll & +90 coin).
  3. `quest_al_craft_03_masterwork_seal` (*The Unstamped Masterwork*) - Recover `mat_al_fulgurite_silver` (from `puzzle_al_observatory_orrery`) & `mat_al_muted_bell_shard` (from `loc_al_bell_crypt`) to forge your choice of legendary relic: **Dawn-Tempered Fulgurite Sabre** (`item_al_crucible_masterwork_blade`) OR **Sovereign Crucible Aegis-Lantern** (`item_al_crucible_aegis_lantern`).
- **2 Additional Exploration Side Quests:**
  - `quest_al_side_muted_belfry` (*Songs of the Buried Bronze* - Bell-Scribe Cassian `npc_al_scribe_cassian`, merchant at Bellwright Square -> defeat Bell-Mender Automaton & return Pre-Toll Tuning-Fork).
  - `quest_al_side_observatory_charts` (*Star-Maps of the Pre-Toll Sky* - Astronomer Vael `npc_al_astronomer_vael` at Glass Conservatory -> recover Pre-Chancery Astral Star-Chart from `loc_al_salt_observatory`).
- **Major Crafting Expansion:**
  - **6th Profession:** `al_clockwork_artifice` (*Clockwork & Lantern Artifice*, requires `item_al_kit_clockwork`).
  - **6 New Materials (20 total):** Tempered Kiln-Glass, Cinder-Pitch Resin, Tempered Brass Mainsprings, Mnemonic Prism-Shard, Fulgurite-Silver Ingot, Muted Bell-Alloy Shard.
  - **12 New Concealed Templates (34 total):** Quarryman's Halberd, Furnace-Mask Greathelm, Censer-Bell Flail, Resonant Bell-Pauldrons, Salt-Strider Greaves, Smuggler's Rigging Belt, Cinder-Pitch Flash Flask, Lucid Memory Draught, Mnemonic Prism Focus, Clockwork Tally-Repeater, Brass Threshold Chronometer, Artificer's Aether-Lantern.
  - **5 New Field Combinations (12 total):** Kiln-Glass Cutlass inlay, Prismatic Threshold Lantern, Pitch-Sealed Frontier Oilskin, Bell-Dust Resonant Balm, Calibrated Masterwork Caliper.
- **2 Additional Campaign Spells (10 Campaign / 27 Total):** `al_spell_crucible_temper` (Abjuration self Ward + AC/Attack buff) & `al_spell_prismatic_refraction` (Divination 2-target radiant strike stripping Guard & lowering AC).

---

## 3. World Lore, Setting & The Seven Regions (32 Locations)

Every arrival in **Vesper-Threshold** crosses the Mist-Weir river and is stamped with a brass **Soul-Tally** by the **Chancery of Scales**. Memory and spiritual residue are taxed and distilled into **Aether-Ash** to fuel the city's furnaces, street-lanterns, and elite longevity elixirs. Those who cannot pay are exiled beyond the Lantern-Wall into the eternal salt frontier.

All **32 locations** form a single **100% strongly connected graph** (every location reachable from `loc_al_ferry_quay` and back):

1. **Weir-Port & The Drowned Docks (5 locations):**
   - `loc_al_ferry_quay` (Ferry-Weir Quay - Start), `loc_al_customs_hall` (Customs Scale-Hall), `loc_al_lantern_market` (Lantern-Wick Market), `loc_al_salt_boardinghouse` (Salt-Wick Boardinghouse), `loc_al_drowned_piers` (The Drowned Piers).
2. **The Chancery Terraces (5 locations):**
   - `loc_al_audit_archives` (Audit Archives), `loc_al_brass_mint` (The Brass Mint), `loc_al_bellwright_square` (Bellwright Square), `loc_al_soot_alleys` (Soot-Gutter Alleys), `loc_al_magistrate_court` (Magistrate's High Court).
3. **The Velvet Spire & Glassworks (4 locations):**
   - `loc_al_glass_foundry` (Mnemonic Glassworks), `loc_al_velvet_court` (Velvet Auction Court), `loc_al_clockwork_belfry` (Clockwork Belfry), `loc_al_silent_library` (The Silent Library).
4. **Cinder-Basin & The Great Quarry (4 locations):**
   - `loc_al_slag_causeway` (Slag-Heap Causeway), `loc_al_ash_quarry` (Great Ash-Quarry), `loc_al_furnace_core` (Furnace-Core Foundry), `loc_al_exhaust_vent` (Exhaust Flue Galleries).
5. **The Lantern-Wall & Salt Viaduct (5 locations):**
   - `loc_al_viaduct_gate` (Viaduct Gatehouse), `loc_al_warden_barrack` (Warden Bastion), `loc_al_salt_flats` (Weeping Salt-Flats), `loc_al_cairn_road` (Cairn-Stone Road), `loc_al_broken_arch` (Broken Ferry-Arch).
6. **The Pale Reach & Glass Steppe (5 locations):**
   - `loc_al_glass_steppe` (Shattered Glass Steppe), `loc_al_salt_mire` (Sunken Salt-Mire), `loc_al_weeping_orchard` (Weeping Glass Orchard), `loc_al_unwritten_citadel` (Citadel of the Unwritten), `loc_al_whispering_well` (Well of Unpaid Vows).
7. **The Ossuary Bastions & First Seal (4 locations):**
   - `loc_al_marrow_bridge` (Marrow-Stone Bridge), `loc_al_echo_vault` (Vault of Unpaid Echoes), `loc_al_scale_sanctum` (Sanctum of the First Scale), `loc_al_pale_shore` (The Pale Far Shore).

Across these 32 locations are **14 hiddenSpots** yielding rare crafting materials, quest clues, and hidden mission items.

---

## 4. Factions (10) & Threshold Powers (4)

### Factions (`world/factions.json`)
1. `faction_al_chancery_auditors` - **The Chancery of Scales** (institutional afterlife bureaucracy)
2. `faction_al_lantern_reformers` - **The Quiet Reformers** (internal Chancery clerks & magistrates working for humane reform)
3. `faction_al_cinder_syndicate` - **The Furnace Guild** (industrial kiln-barons refining Aether-Ash)
4. `faction_al_weir_ferrymen` - **The Oar-Keepers' Union** (river wardens preserving older crossing oaths)
5. `faction_al_salt_smugglers` - **The Unstamped Freebooters** (frontier runners & contraband fixers)
6. `faction_al_bellwright_order` - **The Order of the Last Bell** (monastic bronze-casters easing tormented souls)
7. `faction_al_pale_wardens` - **The Pale Frontier Wardens** (border rangers holding the Viaduct)
8. `faction_al_unwritten_court` - **The Court of the Unwritten** (proud exiles & altered souls beyond the Wall)
9. `faction_al_glass_scholars` - **The Mnemonic Collegium** (scholars preserving bottled memories)
10. `faction_al_toll_corsairs` - **The Black-Ledger Brokers** (debt-traffickers & ruthless private bailiffs)

### Threshold Powers (`world/deities.json`)
- **The Quiet Oar** (`vesper_oar`) - Mercy, safe crossing, rest for the weary
- **The Brass Scale** (`brass_scale`) - Order, contract, civic precision
- **The Pale Lantern** (`pale_lantern`) - Memory, truth, illumination in darkness
- **The Cinder Maw** (`cinder_maw`) - Hunger, transmutation, ruthless ambition

---

## 5. Cast of Characters (24 NPCs, 9 Merchants)

Each NPC in `world/characters.json` has an individual dialogue tree in `world/dialogues.json`, worn gear, carried possessions, faction affiliation, and optional `moralPreference` affecting trade reactivity:

- **Weir-Port:** Ferryman Corvus (`npc_al_ferryman_corvus`), Clerk Maren (`npc_al_clerk_maren`), Merchant Halda (`npc_al_merchant_halda`, Merchant), Innkeeper Bram (`npc_al_innkeeper_bram`, Merchant), Broker Vespera Null (`npc_al_broker_vespera`, Merchant), Smuggler Rooks (`npc_al_smuggler_rooks`, Merchant).
- **Chancery Terraces:** Kiln-Baron Vane (`npc_al_baron_vane`), Archivist Solene (`npc_al_archivist_solene`), Mintmaster Gideon (`npc_al_mintmaster_gideon`, Merchant), Prior Aldous (`npc_al_prior_aldous`), Gutter-Rat Pip (`npc_al_gutter_informant`), Magistrate Lyra (`npc_al_magistrate_lyra`).
- **Velvet Spire:** Savant Elara (`npc_al_savant_elara`, Merchant), Lord-Auctioneer Kestrel (`npc_al_auctioneer_kestrel`), Horologist Tomas (`npc_al_horologist_tomas`, Merchant).
- **Cinder-Basin:** Strike-Leader Dara (`npc_al_strike_leader_dara`), Quarry Overseer Brent (`npc_al_quarry_overseer_brent`).
- **Frontier & Pale Reach:** Scout Fenn (`npc_al_warden_scout_fenn`), Captain Voss (`npc_al_captain_voss`, Merchant), Cairn-Hermit Orin (`npc_al_cairn_hermit`), Mire-Herbalist Nyx (`npc_al_mire_herbalist`, Merchant), Envoy of Regent Malcor (`npc_al_regent_malcor_envoy`), Weeping Serena (`npc_al_weeping_serena`), Echo of the Silent Architect (`npc_al_silent_architect_echo`).

---

## 6. Character Creation (6 Classes, 6 Backgrounds, 4 Origins, 4 Traits)

- **Classes (`world/classes.json`):** Lantern Warden, Bell-Cantor, Cinder Alchemist, Unstamped Cutpurse, Debt-Bailiff, Mnemonic Scholar.
- **Backgrounds (`world/backgrounds.json`):** Weir-Ferry Oarsman, Disgraced Chancery Clerk, Ash-Quarry Breaker, Glassworks Apprentice, Frontier Smuggler, Bellhouse Novice.
- **Campaign Origins (`world/origins.json`):** Unstamped Arrival, Runaway Indebted, Ex-Bailiff Deserter, Salt-Born Wanderer.
- **Campaign Traits (`world/traits.json`):** Cracked Tally, Resonant Ear, Ash-Lungs, Unyielding Ledger.

---

## 7. Main Storyline (4-Arc Spine) & Three Endings

> **Critical Design Rule:** The main storyline has **zero** exclusive morality locks. Players can complete all four arcs as heroic reformers, pragmatic survivors, or ruthless sovereigns.

1. **Arc 1 - `quest_al_main_01_unstamped` (The Cracked Tally):** Awaken at Ferry-Weir Quay with a fractured soul-tally, inspect Customs Hall, meet Clerk Maren, uncover why your tally refuses Chancery stamping, and earn transit to the Chancery Terraces.
2. **Arc 2 - `quest_al_main_02_furnace_tithe` (The Furnace Tithe):** Uncover the secret Aether-Ash audit ledger (`al_read_secret_ledger`), confront Kiln-Warden Krag (`enc_al_kiln_warden_boss` -> `al_kiln_warden_defeated`), and expose the Chancery's memory-harvesting engine.
3. **Arc 3 - `quest_al_main_03_frontier_keys` (Three Arcs of the First Seal):** Journey across the Frontier, Pale Reach, and Ossuary Bastions to recover the three silver fragments of the First Seal:
   - `item_al_seal_fragment_passage` (Fragment of Passage)
   - `item_al_seal_fragment_memory` (Fragment of Memory)
   - `item_al_seal_fragment_quiet` (Fragment of Quiet)
   - Acquiring all three fires `evt_al_arc3_complete_to_arc4`, automatically advancing to Arc 4.
4. **Arc 4 - `quest_al_main_04_first_seal` (The Sanctum of the First Scale):** Defeat High Auditor Crassus (`enc_al_high_auditor_finale` -> `al_high_auditor_defeated`), enter the Sanctum, and converse with the Echo of the Silent Architect (`dlg_al_silent_architect_echo`) to choose one of **three distinct endings**:
   - **Ending A (`ending_quiet` -> `al_campaign_ending_quiet`):** *The True Quiet* - Shatter the Chancery ledger engine and toll the First Bell so all weary souls may cross cleanly into peace (+20 Mercy).
   - **Ending B (`ending_reform` -> `al_campaign_ending_reform`):** *The Open Compact* - Reforge the Seal with Magistrate Lyra and Captain Voss, abolishing debt-forfeiture and transforming Vesper-Threshold into a free refuge (+10 Mercy, +5 Toll).
   - **Ending C (`ending_seize` -> `al_campaign_ending_seize`):** *Sovereign of Ash* - Seize the First Seal and claim the Chancery furnaces as your own eternal throne (+25 Toll).

---

## 8. Side Quests (6) & Morality-Exclusive Branches (4)

### Side & Faction Quests (Multi-Path Moral Choices)
- `quest_al_side_missing_oar` - *The Stolen Ferry-Oar* (Return to Corvus for Mercy vs. fence to Smuggler Rooks for Toll & coin)
- `quest_al_side_foundry_strike` - *Cinder & Solidarity* (Back Dara's quarry strikers vs. side with Kiln-Baron Vane)
- `quest_al_side_glass_memory` - *Bottled Rain* (Preserve a dying scholar's last memory for Savant Elara vs. auction it)
- `quest_al_side_warden_beacon` - *Hold the Viaduct* (Defend the Frontier Wall alongside Captain Voss in `enc_al_viaduct_raid`)
- `quest_al_side_bell_bronze` - *Resonance of the Seventh Bell* (Recover bell-bronze for Prior Aldous)
- `quest_al_side_unwritten_truce` - *Parley of the Salt* (Broker truce with the Court of the Unwritten -> `al_unwritten_truce_forged`, OR conquer Hollow Regent Malcor)

### Morality-Exclusive Missions (4 Total - Strictly Gated, Active-Quest Persistent)

| Quest ID | Title | Gate Condition | Quest Giver / Location | Reward Highlight |
| :--- | :--- | :--- | :--- | :--- |
| `quest_al_moral_pos_sanctuary` | *Refuge for the Debtless* | `minMoralityScore: 15` (`positive`) | Clerk Maren (`dlg_al_clerk_maren`) -> Prior Aldous | `item_al_lantern_reformer_pin`, +12 Mercy |
| `quest_al_moral_pos_mercy_bell` | *The Unbroken Vow* | `minMoralityScore: 25` (`positive`) | Weeping Serena (`loc_al_weeping_orchard`) | `item_al_vowblade_mercy`, sets `al_serena_redeemed` |
| `quest_al_moral_neg_foreclosure` | *Foreclosure of the Docks* | `maxMoralityScore: -15` (`negative`) | Broker Vespera Null (`loc_al_drowned_piers`) | `item_al_ring_black_interest`, +140 coin, +12 Toll |
| `quest_al_moral_neg_cinder_crown` | *Tithe of the Unforgiven* | `maxMoralityScore: -25` (`negative`) | Lord-Auctioneer Kestrel (`loc_al_velvet_court`) | `item_al_cinder_glaive_toll`, +180 coin, +15 Toll |

> **Persistence Rule:** If a hero meets the threshold, accepts a morality-exclusive quest, and later shifts to the opposite moral alignment, the accepted quest **remains active and completable** (never silently deleted).

---

## 9. DEVELOPER SPOILER SECTION: All 4 Genuinely Hidden Missions

All four hidden missions have `hidden: true` and `autoStart: false`. None appear in the Quest Log, Codex, or tooltips until their multi-step discovery triggers fire via `world/events.json`:

1. **Hidden Mission 1: `quest_al_hidden_01_drowned_charter` (*The Drowned Charter*)**
   - **Events:** `evt_al_hidden1_unlock` (`ITEM_ACQUIRED`) & `evt_al_hidden1_unlock_alt` (`FLAG_SET`).
   - **Exact Trigger Conditions (any order):** Possess `item_al_drowned_charter_piece` (hidden cache at `loc_al_drowned_piers`) **AND** set flag `al_read_secret_ledger` (unlocked by inspecting the secret ledger safe in Arc 2).
   - **Resolution:** Present the pre-Chancery river charter to Magistrate Lyra or Ferryman Corvus to prove the Chancery's founding tax was forged.

2. **Hidden Mission 2: `quest_al_hidden_02_silent_architect` (*Lament of the Silent Architect*)**
   - **Events:** `evt_al_hidden2_unlock` (`ITEM_ACQUIRED`) & `evt_al_hidden2_unlock_serena` (`FLAG_SET`).
   - **Exact Trigger Conditions:** Possess `item_al_architect_tablet` (hidden spot at `loc_al_silent_library` / `loc_al_broken_arch`) **AND** EITHER `al_unwritten_truce_forged === true` (peace with the Unwritten) OR `al_serena_redeemed === true` (redeeming Serena via the Rite of Quiet).
   - **Resolution:** Meet the Silent Architect's echo at `loc_al_broken_arch` (`dlg_al_silent_architect_echo -> finish_hidden_architect`) to unlock secret lore and the Architect's Compass relic.

3. **Hidden Mission 3: `quest_al_hidden_03_clockwork_conspiracy` (*The Thirteenth Chime*)**
   - **Events:** `evt_al_hidden3_unlock` & `evt_al_hidden3_unlock_alt` (`FLAG_SET`).
   - **Exact Trigger Conditions (both required, any order):**
     - `al_thirteenth_chime_rung === true` (solving `puzzle_al_belfry_chimes` in `loc_al_clockwork_belfry`)
     - `al_belfry_vault_opened === true` (opening the hidden Clockwork Relay Vault interactive object)
   - **Resolution:** Deliver the intercepted Furnace Guild / Black-Ledger sabotage pact to Captain Voss at `loc_al_warden_barrack`.

4. **Hidden Mission 4: `quest_al_hidden_04_pale_ferry` (*Passage Beyond the Salt*)**
   - **Events:** `evt_al_hidden4_unlock_a`, `evt_al_hidden4_unlock_b`, `evt_al_hidden4_unlock_c` (`ITEM_ACQUIRED`), and `evt_al_hidden4_unlock_all` (`FLAG_SET`).
   - **Exact Trigger Conditions (any collection order):** Acquire all three Frontier Salt-Charms hidden across the outer regions (`item_al_frontier_charm_1`, `item_al_frontier_charm_2`, `item_al_frontier_charm_3`), setting `al_has_charm_1`, `al_has_charm_2`, and `al_has_charm_3`.
   - **Resolution:** Bring the harmonizing charms to `loc_al_pale_shore` to summon the Pre-Chancery Ferry and claim the Pale Far-Shore blessing.

---

## 10. Campaign-Specific Magic (8 Spells -> 25 Total in Grimoire)

Registered via `world/spells.json` and integrated directly into the Global Magic Engine:

| Spell ID | Name | Discipline | Tier | AKP | Special Mechanic / Gate |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `al_spell_cinder_writ` | Cinder Writ of Forfeiture | Evocation | 1 | 1 | **HP-Toll (`selfCostHp: 2`)**; fire burst + bleeding, bypasses cover. |
| `al_spell_ossuary_ward` | Ossuary Ward | Abjuration | 1 | 1 | Heavy Arcane Ward + AC boost against frontier horrors. |
| `al_spell_toll_siphon` | Toll of Ash Siphon | Soulcraft | 1 | 1 | Drains enemy HP (`drainFraction`) & saps Morale. |
| `al_spell_mirage_cairn` | Mirage of the Salt-Cairn | Illusion | 1 | 1 | Multi-foe accuracy debuff + self evasion boost. |
| `al_spell_lantern_shade` | Summon Lantern-Shade | Conjuration | 2 | 2 | Multi-target spectral barrage (`all_enemies`, up to 2). |
| `al_spell_mercy_shroud` | Vespers of True Quiet | Restoration | 2 | 2 | **Positive Morality Gate (`minMoralityScore: 10`)**; large heal + stamina + full cleanse. |
| `al_spell_debt_chains` | Chains of Compounded Debt | Control | 2 | 2 | **Negative Morality Gate (`maxMoralityScore: -10`)**; 2-target Entangled + Frightened + Morale break. |
| `al_spell_bell_of_unmaking` | Toll of the Last Bell | Divination | 3 | 3 | **HP-Toll (`selfCostHp: 3`)**; 3-target AoE strips Guard, lowers AC, massive resonant damage. |

---

## 11. Bestiary (16 Creatures, 5 Bosses) & Multi-Enemy Encounters (15)

- **Standard Adversaries (11):** Sluice Ash-Hound, Black-Ledger Cutthroat, Chancery Debt-Bailiff, Bailiff Marksman, Soot-Stoked Automaton, Furnace Guild Enforcer, Pale Salt-Stalker, Sunken Mire-Wraith, Shattered Glass-Harpy, Unwritten Oath-Knight, Bell-Cantor Acolyte.
- **Named / Tragic Bosses (5):**
  1. `creature_al_boss_kiln_warden` - **Kiln-Warden Krag** (`enc_al_kiln_warden_boss` - Furnace Core)
  2. `creature_al_boss_weeping_warden` - **Serena, The Weeping Warden** (`enc_al_weeping_warden_boss` - Weeping Glass Orchard; also redeemable via Positive-Exclusive quest!)
  3. `creature_al_boss_hollow_regent` - **Hollow Regent Malcor** (`enc_al_hollow_regent_boss` - Citadel of the Unwritten; also negotiable!)
  4. `creature_al_boss_echo_collector` - **The Echo Collector** (`enc_al_echo_vault_boss` - Vault of Unpaid Echoes)
  5. `creature_al_boss_high_auditor` - **High Auditor Crassus** (`enc_al_high_auditor_finale` - Sanctum of the First Scale, 3-enemy boss + escorts)
- **Encounters (15):** All 15 encounters use multi-enemy frontline/backline positioning and link to dedicated loot tables (`world/loot_tables.json`, 20 tables).

---

## 12. Crafting, Materials, Items, Puzzles & Interactive Objects

- **5 Professions (`world/professions.json`):** Foundry Smithing & Ironwork (`item_al_kit_foundry`), Bell-Casting & Brasswork (`item_al_kit_brasswork`), Oilskin & Salt-Leathercraft (`item_al_kit_leather`), Mnemonic Alchemy & Distillation (`item_al_kit_alembic`), Soul-Glass & Tally Engraving (`item_al_kit_engraver`).
- **14 Materials (`world/materials.json`):** Pale-Iron, Bell-Bronze, Black Weir-Ash Timber, Salt-Cured Hide, Shroudweave, Fulgurite Ash-Quartz, Ossuary Ivory, Condensed Aether-Ash, Tarnished Scale-Brass, Lantern Tallow-Wax, Sunken Drift-Cedar, Glass-Steppe Shard, Mire-Amber Resin, Sovereign Slag-Steel.
- **22 Concealed Crafting Templates (`world/crafting_templates.json`):** Dynamic material-driven outcomes across weapons, armor, shields, accessories, and consumables.
- **7 Field Combinations (`world/combinations.json`):** Hone cutlass, coat blades with cinder/amber/salt, enrich salve, steep cordial, blend sovereign elixir.
- **4 Inscribed Puzzles (`world/puzzles.json`):**
  - `puzzle_al_customs_scale` (Audit Archives -> answer: `scale` / `balance`)
  - `puzzle_al_belfry_chimes` (Clockwork Belfry -> answer: `quiet` / `rest` / `silence`)
  - `puzzle_al_library_tablet` (Silent Library -> answer: `oar` / `ferry`)
  - `puzzle_al_scale_sanctum_trial` (Sanctum of the First Scale -> answer: `memory` / `vow` / `truth`)
- **10 Interactive Objects (`world/interactive_objects.json`):** Covers safe inspections, kiln valves, belfry relay vault, sunken caches, memory distillers, and frontier cairns.

---

## 13. Validation & Automated Verification

- **Static + Isolated Functional Validation:** `engine.runComprehensiveCampaignValidation('campaign_ashen_ledger', { includeFunctional: true })` passes **670/670 checks (0 errors, 0 warnings)** and **6/6 isolated functional crafting checks**.
- **Dedicated Automated Suite:** `tests/ashen_ledger_tests.js` (`npm run test:ashen`, wired into `npm test`) verifies validation, 32-location strong connectivity, creative independence, 25-spell Grimoire & HP-toll/morality combat casting, 4-arc main story + 3 endings, 4 morality-exclusive quests + active-quest persistence, all 4 hidden missions, concealed crafting, combinations, puzzles, theme, and Save/Load round-trip.

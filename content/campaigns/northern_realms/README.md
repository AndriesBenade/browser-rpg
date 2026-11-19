# The Northern Realms (Large-Scale Open-World Nordic RPG Campaign)

> **Campaign ID:** `campaign_northern_realms`  
> **Setting Genre:** Nordic High Fantasy / Open-World Sandbox  
> **Engine Compatibility:** `>=1.0.0` (Runs on 100% content-agnostic core engine)

---

## 1. Overview & Narrative Premise

Four centuries after the legendary Age of Rime and Ruin, the ancestral lands of **The Northern Realms** stand fractured into proud fortified holds, deep subterranean mining delves, mist-veiled canal villages, and towering glacial peaks.

In the high seat of **Valenfrost**, Jarl Sigurd Wolf-Mantle hears ominous portents: earth tremors shake stone chimneys and blue witchfire flickers across the jagged basalt crater of **Mount Wyrmfang**. Legends etched into prehistoric barrow slates recount that **Vyr the Ancient Frost Wyrm** was never slain, but bound by High King Valen using three celestial **Star-Keys** forged of sky-iron.

As an aspiring adventurer arriving at the granite gates of Valenfrost, you are thrust into an expansive open world where you may heed the Jarl's summons, swear fealty to the shield-brothers of the **Iron Covenant**, infiltrate the sunken cisterns of the **Whispering Cabal**, unlock the runic arcana of the **Circle of Winter**, or delve into ancient draugr crypts and dwarven silver mines.

---

## 2. World Regions & Geography

The world map encompasses **25 interconnected waypoints** across five distinct geographical regions:

1. **Valenfrost Highlands (Central Seat & Capital)**:
   - `loc_nr_valenfrost_gates`: Fortified city threshold guarded by Captain Tor and the hold watch.
   - `loc_nr_valenfrost_hall`: High timber mead-hall of Jarl Sigurd, central fire-trench, and Court Skald Einar.
   - `loc_nr_valenfrost_market`: Bustling commercial square with trade caravan merchant Astrid.
   - `loc_nr_valenfrost_smithy`: The Hearth & Anvil coal smithy run by master smith Bjorn.
   - `loc_nr_valenfrost_barracks`: Martial training grounds, armory footlockers, and sparring instructor Karl.

2. **Whispering Woods & Wilderness (South-East Taiga & Barrows)**:
   - `loc_nr_pine_crossroads`: Major four-way crossroads connecting highlands, fens, and crags, featuring Skadi's wayside shrine.
   - `loc_nr_hunters_camp`: Spruce timber outpost of trapper Ulf White-Wolf.
   - `loc_nr_wolf_den_cavern`: Den of predator white wolves littering bone heaps.
   - `loc_nr_ancient_cairn`: Prehistoric standing stones sealing the burial barrow of Chieftain Skallagrim.
   - `loc_nr_barrow_depths`: Freezing underground catacombs where draugr wights guard ancestral grave goods.

3. **Mistglen Fens & Canals (Western Waterlands & Underworld)**:
   - `loc_nr_mistglen_docks`: Water-village of stilt walkways, cedar moorings, and boatman Hagan.
   - `loc_nr_drowned_lantern_tavern`: Leaning canalside drinking den kept by Mira Cold-Spring.
   - `loc_nr_cabal_cistern`: Vaulted imperial drainage cistern serving as the Whispering Cabal guildhall.
   - `loc_nr_mire_causeway`: Precarious submerged flagstone path winding through black bogs.
   - `loc_nr_bandit_redoubt`: Sunken imperial fortress holding Marauder Captain Malik.
   - `loc_nr_witch_hut`: Mound of bleached mammoth bones housing the seer Morrigan.

4. **Grimstone Crags & Deep Delve (South-Western Peaks & Dwarf Halls)**:
   - `loc_nr_grimstone_gates`: Monumental cyclopean gate carved into Mount Grimstone, guarded by Durn Silver-Shield.
   - `loc_nr_grimstone_delve`: Rich silver workings and iron shafts managed by Overseer Thrain.
   - `loc_nr_abandoned_shaft_nine`: Troll-infested collapsed tunnel containing the lost Clan Silver-Kin vault.
   - `loc_nr_blackforge`: Subterranean volcanic foundry where master smith Helga works magma-tempered plate.

5. **Frostpeak Glaciers & Mount Wyrmfang (Northern Heights)**:
   - `loc_nr_glacier_pass`: Dizzying icy ledge hanging over crevasses, buffeted by howling squalls.
   - `loc_nr_spire_frostmere`: Monolithic spire of everlasting glacial ice housing Archmage Kallan.
   - `loc_nr_frostmere_archives`: Celestial library holding First-Age manuscripts and the scholar Freya.
   - `loc_nr_wyrmfang_slopes`: Obsidian crags scored with ancient dragon claw gouges.
   - `loc_nr_wyrmfang_caldera`: The volcanic summit crater where Vyr the Frost Wyrm is bound by star-iron monoliths.

---

## 3. Factions & Affiliations

- **The Iron Covenant**: Sworn warrior fellowship dedicated to the shield-wall, martial valor, and beast-cleansing.
- **The Whispering Cabal**: Clandestine syndicate of thieves, smugglers, and fences operating out of Mistglen's cisterns.
- **The Circle of Winter**: Glacial academy of frost-weavers, star-scholars, and runic enchanters.
- **Frostpeak Hold Guard**: The sworn garrison of Valenfrost upholding clan law, caravan security, and wall defense.
- **The Silver Kin**: Proud dwarf prospectors and clan runesmiths working the deep silver lodes of Grimstone.
- **Order of Drakenseekers**: Ancient order preserving dragon lore, sky-iron armaments, and wyrm-slaying rites.
- **Drowned Mire Marauders**: Deserters and outlaws terrorizing the marsh causeways under Captain Malik.
- **The Vyr Worshippers**: Apocalyptic dragon cult seeking to unleash the Frost Wyrm upon mortal kingdoms.

---

## 4. Quests & Activities

### Main Storyline
- **`quest_nr_main_shadow_of_wyrmfang` (Shadow of Mount Wyrmfang)**: Multi-stage epic quest requiring the recovery of the three ancient Star-Keys (Alpha, Beta, Gamma) from the depths of Grimstone, Frostmere, and Skallagrim's barrow. Features dual climactic resolutions at Mount Wyrmfang (Slay Vyr in combat OR perform the scholarly Eternal Re-Binding Ritual using Freya's archive lore) and a full Jarl Sigurd death failover via Skald Einar.

### Faction Questlines
- **`quest_nr_covenant_trial_of_steel` (Trial of the Frozen Shield)**: Slay the Mountain Frost Troll in Grimstone's Shaft Nine to gain membership in the Iron Covenant.
- **`quest_nr_cabal_smugglers_ledger` (The Ledger in the Mist)**: Reclaim Valeria's stolen smuggling ledger from Captain Malik via combat, stealth infiltration, or diplomatic parley, then choose whether to return it to the Whispering Cabal or expose the ring to Captain Tor.
- **`quest_nr_circle_rime_relic` (Secrets of the Rime Spire)**: Decipher the ancient riddle of the Rime Pillar to unlock the Arcanum Vault and study celestial dragon-binding manuscripts with Librarian Freya.

### Dungeons & Side Quests
- **`quest_nr_side_barrow_curse` (The Slumber of Skallagrim)**: Unseal the Weeping Barrow Stones with the ancient runic key and banish Chieftain Skallagrim the Undying.
- **`quest_nr_side_dwarven_vault` (The Silver Kin's Legacy)**: Recover Overseer Thrain's dropped iron key in the troll tunnels, open the ancestral Clan Silver-Kin vault, and decide whether to return the clan charter intact or skim salvage silver.
- **`quest_nr_side_lost_caravan` (Caravan of the Howling Pass)**: Track Merchant Astrid's missing fur sledge with Trapper Ulf's trail sign, confront the alpha pack in Howling Timber Cavern, and choose whether to return the sealed crate honestly or fence it in Mistglen.
- **`quest_nr_side_blackforge_embers` (Embers of the Deep Forge)**: Help Master Smith Helga Anvil-Mother quell an awakened Runebound Sentinel in Grimstone Deep Mines and recover Star-Iron Ore to rekindle the volcanic crucible.

### Secret Missions
- Three genuinely hidden missions are woven into the Northern Realms, unlocked only through unusual combinations of player choices, faction standing, mercy or bloodshed, and ordered discoveries.

---

## 5. System Architecture & Capabilities

1. **Character Classes & Runic Spellcasting**:
   - `class_nr_shield_thane`, `class_nr_rime_scout`, `class_nr_skald_spellblade`, `class_nr_shadow_prowler` (all 12 features with explicit IDs and combat integration).
   - **Progression-Based Combat Magic**: Combat spell capacity scales from 1 to 5 casts per battle via `Mythology & Lore` + `Wisdom` (plus relic bonuses), while `Intelligence` unlocks tactical Spell Shaping options (*Elemental Shift*, *Lingering Weave*, *Siphoning Cast*, and *Overchannel Surge*).

2. **Concealed Material-Driven Crafting & Workshops**:
   - 3 Disciplines: **Runic Blacksmithing** (`Athletics`), **Furrier & Leatherwork** (`Survival`), **Northern Alchemy** (`Medicine`).
   - 10 Materials (including *Hearthstone Amber Resin* and *Glacial Quartz Crystal*) and 17 material-affinity forms spanning Weapons, Armour, Accessories, Consumables, and Tools.
   - Concealed crafting outcomes: players choose only the general category while primary materials shape the exact item form, revealed upon completion. Skill progression unlocks 1 to 4 supplementary catalyst slots.
   - In-field item combining: Whetstone sharpening, mire venom weapon coating, and herbal distillation.

3. **Living World & Exploration**:
   - 17 reactive NPCs with multi-node dialogue trees, unified carried/equipped possessions, and coin purses.
   - 10 northern creatures (including 2 multi-action enraging bosses) and 10 discoverable hidden spots across all 5 regions.
   - Guard & Law systems, location-enforced rest safety tiers, dynamic blizzards/fog, mercenary companion Veteran Karl, and permanent NPC death consequences.

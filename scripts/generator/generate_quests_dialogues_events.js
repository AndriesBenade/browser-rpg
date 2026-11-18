// scripts/generator/generate_quests_dialogues_events.js
// Generates quests.json, dialogues.json, events.json for The Northern Realms campaign.
// Strict compliance: NO em dashes (U+2014), all referenced stages, items, npcs, locations exist,
// rich multi-stage quests, faction questlines, branching paths, and engine event hooks.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'content/campaigns/northern_realms/world');

function writeJson(filePath, data) {
  const jsonStr = JSON.stringify(data, null, 2);
  if (jsonStr.includes('\u2014')) {
    throw new Error(`CRITICAL: Forbidden em dash detected in output for ${filePath}`);
  }
  fs.writeFileSync(filePath, jsonStr, 'utf8');
  console.log(`Wrote ${filePath} (${jsonStr.length} bytes)`);
}

// -------------------------------------------------------------
// 1. QUESTS (Main Storyline, Factions, Bounties, Dungeons, Relics)
// -------------------------------------------------------------
const quests = {
  quests: [
    // MAIN STORYLINE
    {
      id: "quest_nr_main_shadow_of_wyrmfang",
      title: "Shadow of Mount Wyrmfang",
      category: "main",
      description: "Tremors shake the northern holds and blue fire flickers atop Mount Wyrmfang. Jarl Sigurd fears the ancient Frost Wyrm Vyr stirs in its volcanic tomb.",
      autoStart: true,
      currentStage: "stage_speak_jarl",
      stages: {
        stage_speak_jarl: {
          id: "stage_speak_jarl",
          description: "Audience with Jarl Sigurd in the High Mead-Hall of Valenfrost to discuss the mountain portents.",
          locationId: "loc_nr_valenfrost_hall",
          objective: "Speak with Jarl Sigurd Wolf-Mantle."
        },
        stage_recover_keys: {
          id: "stage_recover_keys",
          description: "Recover the three ancient Star-Keys of High King Valen to secure or shatter the binding seal atop Mount Wyrmfang.",
          locationId: "loc_nr_glacier_pass",
          objective: "Gather the three Star-Keys (Alpha from Grimstone, Beta from Frostmere, Gamma from the Barrow)."
        },
        stage_confront_vyr: {
          id: "stage_confront_vyr",
          description: "Ascend to the Caldera of Vyr atop Mount Wyrmfang and resolve the fate of the Frost Wyrm.",
          locationId: "loc_nr_wyrmfang_caldera",
          objective: "Confront Vyr the Ancient Frost Wyrm."
        },
        stage_completed: {
          id: "stage_completed",
          description: "The northern holds are delivered from the draconic menace. You are hailed as the High Champion of Valenfrost.",
          locationId: "loc_nr_valenfrost_hall",
          objective: "Return to Jarl Sigurd in triumph."
        }
      },
      rewards: {
        xp: 300,
        itemId: "item_nr_relic_dragonbane"
      }
    },

    // FACTION QUESTLINE 1: THE IRON COVENANT (Warrior Fellowship)
    {
      id: "quest_nr_covenant_trial_of_steel",
      title: "Trial of the Frozen Shield",
      category: "faction",
      description: "Prove your martial worth to the Iron Covenant by putting an end to the frost troll terrorizing the deep shafts of Grimstone Mine.",
      autoStart: false,
      currentStage: "stage_slay_troll",
      stages: {
        stage_slay_troll: {
          id: "stage_slay_troll",
          description: "Slay the Mountain Frost Troll lurking in Infested Shaft Nine beneath Grimstone.",
          locationId: "loc_nr_abandoned_shaft_nine",
          objective: "Defeat the Mountain Frost Troll."
        },
        stage_report_karl: {
          id: "stage_report_karl",
          description: "Present the troll thickhide to Veteran Karl in the Valenfrost Barracks.",
          locationId: "loc_nr_valenfrost_barracks",
          objective: "Report back to Karl the Iron-Ribbed."
        },
        stage_completed: {
          id: "stage_completed",
          description: "Inducted as a sworn Shield-Brother of the Iron Covenant.",
          locationId: "loc_nr_valenfrost_barracks",
          objective: "Trial complete."
        }
      },
      rewards: {
        xp: 120,
        itemId: "item_nr_huscarl_roundshield"
      }
    },

    // FACTION QUESTLINE 2: THE WHISPERING CABAL (Thieves / Outlaws)
    {
      id: "quest_nr_cabal_smugglers_ledger",
      title: "The Ledger in the Mist",
      category: "faction",
      description: "Valeria of the Whispering Cabal needs her stolen smuggling ledger recovered from Marauder Captain Malik in the Drowned Fort.",
      autoStart: false,
      currentStage: "stage_infiltrate_redoubt",
      stages: {
        stage_infiltrate_redoubt: {
          id: "stage_infiltrate_redoubt",
          description: "Infiltrate the Drowned Fort Redoubt in Mistglen and reclaim the cipher ledger.",
          locationId: "loc_nr_bandit_redoubt",
          objective: "Retrieve the Cabal's Smuggling Ledger."
        },
        stage_return_valeria: {
          id: "stage_return_valeria",
          description: "Deliver the recovered ledger to Valeria in the Sunken Cistern Guildhall.",
          locationId: "loc_nr_cabal_cistern",
          objective: "Return to Valeria Shadow-Gilded."
        },
        stage_completed: {
          id: "stage_completed",
          description: "Welcomed into the inner circle of the Whispering Cabal with fencing privileges.",
          locationId: "loc_nr_cabal_cistern",
          objective: "Contract fulfilled."
        }
      },
      rewards: {
        xp: 100,
        itemId: "item_nr_cabal_stiletto"
      }
    },

    // FACTION QUESTLINE 3: THE CIRCLE OF WINTER (Mages of Frostmere)
    {
      id: "quest_nr_circle_rime_relic",
      title: "Secrets of the Rime Spire",
      category: "faction",
      description: "Archmage Kallan charges you with solving the riddle of the ancient Rime Pillar and cataloguing the celestial Star-Key in the archives.",
      autoStart: false,
      currentStage: "stage_solve_pillar",
      stages: {
        stage_solve_pillar: {
          id: "stage_solve_pillar",
          description: "Decipher the Rime Pillar of Frostmere to obtain the Silver Key of the Winter Spire.",
          locationId: "loc_nr_spire_frostmere",
          objective: "Solve the Rime Pillar riddle."
        },
        stage_consult_archives: {
          id: "stage_consult_archives",
          description: "Unlock the inner Arcanum Vault and study the ancient star manuscripts with Librarian Freya.",
          locationId: "loc_nr_frostmere_archives",
          objective: "Consult with Librarian Freya."
        },
        stage_completed: {
          id: "stage_completed",
          description: "Granted the title of Winter Arcanist and gifted the Star-Key of the Glacial Spire.",
          locationId: "loc_nr_spire_frostmere",
          objective: "Arcanum initiated."
        }
      },
      rewards: {
        xp: 140,
        itemId: "item_nr_frost_rune_focus"
      }
    },

    // SIDE QUEST: THE LOST BARROW OF SKALLAGRIM
    {
      id: "quest_nr_side_barrow_curse",
      title: "The Slumber of Skallagrim",
      category: "dungeon",
      description: "Draugr have been raiding outlying farms from the Weeping Barrow Stones. Break into the crypt and put Chieftain Skallagrim to rest.",
      autoStart: false,
      currentStage: "stage_unlock_crypt",
      stages: {
        stage_unlock_crypt: {
          id: "stage_unlock_crypt",
          description: "Acquire the Ancient Runic Barrow Key and unseal the crypt of Chieftain Skallagrim.",
          locationId: "loc_nr_ancient_cairn",
          objective: "Unseal the barrow crypt portal."
        },
        stage_defeat_skallagrim: {
          id: "stage_defeat_skallagrim",
          description: "Descend into the barrow depths and defeat Chieftain Skallagrim the Undying.",
          locationId: "loc_nr_barrow_depths",
          objective: "Destroy Chieftain Skallagrim."
        },
        stage_completed: {
          id: "stage_completed",
          description: "The ancestral curse is broken and the barrow dead return to peaceful slumber.",
          locationId: "loc_nr_ancient_cairn",
          objective: "Crypt cleansed."
        }
      },
      rewards: {
        xp: 150,
        itemId: "item_nr_silver_waraxe"
      }
    },

    // SIDE QUEST: THE LOST MINING VAULT
    {
      id: "quest_nr_side_dwarven_vault",
      title: "The Silver Kin's Legacy",
      category: "side",
      description: "Overseer Thrain lost the iron key to the ancestral silver vault during the troll breach in Shaft Nine. Find it and unlock the clan vault.",
      autoStart: false,
      currentStage: "stage_find_vault_key",
      stages: {
        stage_find_vault_key: {
          id: "stage_find_vault_key",
          description: "Search Infested Shaft Nine for the Overseer's dropped iron key.",
          locationId: "loc_nr_abandoned_shaft_nine",
          objective: "Find the Iron Key of Grimstone Vault."
        },
        stage_open_vault: {
          id: "stage_open_vault",
          description: "Use the key to unlock the Grimstone Deep Clan Vault.",
          locationId: "loc_nr_abandoned_shaft_nine",
          objective: "Unlock the clan vault."
        },
        stage_completed: {
          id: "stage_completed",
          description: "The ancestral vault is restored to Clan Silver-Kin.",
          locationId: "loc_nr_grimstone_delve",
          objective: "Vault recovered."
        }
      },
      rewards: {
        xp: 110,
        itemId: "item_nr_silver_crest_shield"
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. DIALOGUES (Decoupled Conversation Trees)
// -------------------------------------------------------------
const dialogues = {
  dialogues: {
    // GATE CAPTAIN TOR
    dlg_nr_gate_captain_tor: {
      id: "dlg_nr_gate_captain_tor",
      npcId: "npc_nr_gate_captain_tor",
      nodes: {
        root: {
          speaker: "Captain Tor",
          text: "Halt there, traveler. Valenfrost opens its gates only to those with an honest purpose. State your business in the hold.",
          choices: [
            {
              label: "I seek an audience with Jarl Sigurd regarding the mountain portents.",
              target: "node_jarl_audience"
            },
            {
              label: "I am a wanderer seeking trade and a warm hearth.",
              target: "node_trade_entry"
            },
            {
              label: "[Persuasion] You look like a man who knows good steel when he sees it. I have come to offer my sword.",
              check: {
                skill: "persuasion",
                attribute: "charisma",
                dc: 11,
                success: "node_persuade_success",
                failure: "node_persuade_failure"
              }
            },
            {
              label: "Farewell, Captain.",
              target: "exit"
            }
          ]
        },
        node_jarl_audience: {
          speaker: "Captain Tor",
          text: "You and half the North, friend. Earth-tremors have shaken the chimneys for a week. The Jarl holds court in the High Mead-Hall. Mind your tongue before his huscarls.",
          choices: [
            { label: "Thank you, Captain. I shall tread respectfully.", target: "exit" }
          ]
        },
        node_trade_entry: {
          speaker: "Captain Tor",
          text: "Head down to the Trade Plaza then. Merchant Astrid keeps fair scales, and Bjorn's forge is always hot. Obey the hold peace and you will find no trouble here.",
          choices: [
            { label: "Understood.", target: "exit" }
          ]
        },
        node_persuade_success: {
          speaker: "Captain Tor",
          text: "Ha! A confident stride and a sharp eye. We always have room on the ramparts for warriors of mettle. Take this smoked venison for your trouble.",
          giveItem: "item_nr_smoked_venison",
          choices: [
            { label: "Much obliged, Captain.", target: "exit" }
          ]
        },
        node_persuade_failure: {
          speaker: "Captain Tor",
          text: "Big words are cheap in the taverns. Show your worth on the road before you boast to the hold watch.",
          choices: [
            { label: "I will prove myself soon enough.", target: "exit" }
          ]
        }
      }
    },

    // JARL SIGURD
    dlg_nr_jarl_sigurd: {
      id: "dlg_nr_jarl_sigurd",
      npcId: "npc_nr_jarl_sigurd",
      nodes: {
        root: {
          speaker: "Jarl Sigurd",
          text: "Step forward to the hearthfire, traveler. What news do you bring to Valenfrost while Mount Wyrmfang trembles above us?",
          choices: [
            {
              label: "I have come to offer my blade to quell the threat of the Frost Wyrm.",
              target: "node_offer_aid"
            },
            {
              label: "What can you tell me of the ancient calamity four centuries ago?",
              target: "node_calamity_lore"
            },
            {
              label: "I brought word from the Whispering Woods. The dead walk the barrows.",
              target: "node_barrow_report"
            },
            {
              label: "I take my leave, my Lord.",
              target: "exit"
            }
          ]
        },
        node_offer_aid: {
          speaker: "Jarl Sigurd",
          text: "Then hear the oath of Valenfrost! In the First Age, High King Valen forged three celestial Star-Keys to bind the wyrm Vyr beneath Mount Wyrmfang. One rests in the Grimstone Vault, one at the Spire of Frostmere, and one was buried with Chieftain Skallagrim. Recover them, and you shall decide the fate of the North!",
          startQuest: "quest_nr_main_shadow_of_wyrmfang",
          choices: [
            { label: "I swear by Torvald to recover the Star-Keys.", target: "exit" }
          ]
        },
        node_calamity_lore: {
          speaker: "Jarl Sigurd",
          text: "Four hundred winters past, the Frost Wyrm Vyr blackened the skies with blizzard breath, shattering the ancient High Kingdom into our separate holds. If the beast awakens unchained, the age of mortals is finished.",
          choices: [
            { label: "We must prevent that awakening at all costs.", target: "root" }
          ]
        },
        node_barrow_report: {
          speaker: "Jarl Sigurd",
          text: "Aye, Chieftain Skallagrim's tomb stirs with restless dead. If you dare enter the Weeping Barrow Stones, put the ancient chieftain to rest and claim his Star-Key.",
          startQuest: "quest_nr_side_barrow_curse",
          choices: [
            { label: "I will enter the barrows and silence the dead.", target: "exit" }
          ]
        }
      }
    },

    // SKALD EINAR
    dlg_nr_skald_einar: {
      id: "dlg_nr_skald_einar",
      npcId: "npc_nr_skald_einar",
      nodes: {
        root: {
          speaker: "Skald Einar",
          text: "Greetings, wayfarer! The mead is sweet and the harp strings are tuned. Would you hear the Lay of High King Valen or perhaps the Riddle of the Frost Spire?",
          choices: [
            {
              label: "Sing for me the Lay of High King Valen.",
              target: "node_valen_lay"
            },
            {
              label: "Tell me of the riddle inscribed upon the Spire of Frostmere.",
              target: "node_spire_hint"
            },
            {
              label: "Keep your songs, Skald. Farewell.",
              target: "exit"
            }
          ]
        },
        node_valen_lay: {
          speaker: "Skald Einar",
          text: "'On Wyrmfang's crest the star-iron shone, three celestial keys of stone, to bind the beast in frozen sleep, until the bells of winter weep...' A stirring verse, no?",
          awardXP: 10,
          choices: [
            { label: "A true song of heroes.", target: "root" }
          ]
        },
        node_spire_hint: {
          speaker: "Skald Einar",
          text: "The ice mages inscribed their outer pillar with an ancient enigma of the blizzard. 'It bites without teeth, it builds up the glacier, yet withers to water when sun shows its lights.' Remember that when you face the pillar!",
          setFlags: { heard_spire_riddle_hint: true },
          choices: [
            { label: "I will keep that in mind.", target: "root" }
          ]
        }
      }
    },

    // VETERAN KARL (Warrior Companion / Iron Covenant)
    dlg_nr_veteran_karl: {
      id: "dlg_nr_veteran_karl",
      npcId: "npc_nr_veteran_karl",
      nodes: {
        root: {
          speaker: "Karl the Iron-Ribbed",
          text: "Stand upright! If you want to join the Iron Covenant, you must prove you can take a blow and crack troll skull with equal relish.",
          choices: [
            {
              label: "What must I do to prove myself to the Iron Covenant?",
              target: "node_covenant_task"
            },
            {
              label: "[Hire Companion] I could use your greataxe on my travels (35 drachmae).",
              condition: { hasItem: "item_nr_smoked_venison" },
              target: "node_hire_karl"
            },
            {
              label: "I will return when my shield is ready.",
              target: "exit"
            }
          ]
        },
        node_covenant_task: {
          speaker: "Karl the Iron-Ribbed",
          text: "Down in Grimstone Mine, Shaft Nine was overrun by a feral mountain frost troll. Slay the brute and bring back its thickhide, and you will be one of us.",
          startQuest: "quest_nr_covenant_trial_of_steel",
          choices: [
            { label: "Consider the beast slain.", target: "exit" }
          ]
        },
        node_hire_karl: {
          speaker: "Karl the Iron-Ribbed",
          text: "Agreed! Keep the mead flagon full and let us smash some draugr skulls together.",
          recruitCompanion: "npc_nr_veteran_karl",
          choices: [
            { label: "Welcome to the vanguard, Karl.", target: "exit" }
          ]
        }
      }
    },

    // VALERIA (Whispering Cabal Leader)
    dlg_nr_cabal_leader_valeria: {
      id: "dlg_nr_cabal_leader_valeria",
      npcId: "npc_nr_cabal_leader_valeria",
      nodes: {
        root: {
          speaker: "Valeria Shadow-Gilded",
          text: "Welcome to the cisterns. In Mistglen, the water is deep and the eyes are everywhere. Speak softly or do not speak at all.",
          choices: [
            {
              label: "I hear the Whispering Cabal has work for a nimble hand.",
              target: "node_cabal_work"
            },
            {
              label: "I have recovered your stolen smuggling ledger from Captain Malik.",
              condition: { hasItem: "item_nr_elena_stolen_ledger" },
              target: "node_turn_in_ledger"
            },
            {
              label: "I am merely looking around. Farewell.",
              target: "exit"
            }
          ]
        },
        node_cabal_work: {
          speaker: "Valeria Shadow-Gilded",
          text: "Marauder Malik raided our canal courier and took our cipher ledger to the Drowned Fort. Get it back, and the Cabal will reward you with cold silver and our finest stiletto.",
          startQuest: "quest_nr_cabal_smugglers_ledger",
          choices: [
            { label: "I will retrieve your ledger.", target: "exit" }
          ]
        },
        node_turn_in_ledger: {
          speaker: "Valeria Shadow-Gilded",
          text: "Splendid work! Not a drop of bog water on the parchment. Take this stiletto and forty drachmae with our gratitude.",
          consumeItem: "item_nr_elena_stolen_ledger",
          giveItem: "item_nr_cabal_stiletto",
          awardXP: 100,
          modifyReputation: { faction_nr_whispering_cabal: 25 },
          completeQuest: "quest_nr_cabal_smugglers_ledger",
          choices: [
            { label: "A pleasure doing business with the Cabal.", target: "exit" }
          ]
        }
      }
    },

    // ARCHMAGE KALLAN (Winter Circle)
    dlg_nr_archmage_kallan: {
      id: "dlg_nr_archmage_kallan",
      npcId: "npc_nr_archmage_kallan",
      nodes: {
        root: {
          speaker: "Archmage Kallan",
          text: "You stand within the Spire of Frostmere. The crystals resonate with high celestial magic. What brings you to the court of the Winter Circle?",
          choices: [
            {
              label: "I seek the Star-Key of the Glacial Spire to reinforce the wyrm's seals.",
              target: "node_ask_star_key"
            },
            {
              label: "Teach me of the runecraft used to bind elemental frost.",
              target: "node_runecraft_lore"
            },
            {
              label: "Farewell, Grand Magister.",
              target: "exit"
            }
          ]
        },
        node_ask_star_key: {
          speaker: "Archmage Kallan",
          text: "The Star-Key is preserved within our locked Arcanum. Only one who comprehends the enigma of the outer Rime Pillar may obtain the silver key to enter.",
          startQuest: "quest_nr_circle_rime_relic",
          choices: [
            { label: "I shall decipher the pillar and prove my wisdom.", target: "exit" }
          ]
        },
        node_runecraft_lore: {
          speaker: "Archmage Kallan",
          text: "True runecraft requires harmonizing meteoric sky-iron with the cold resonance of glacier water. Those who master it can carve wards that turn dragon fire into harmless snow.",
          awardXP: 15,
          choices: [
            { label: "Fascinating knowledge.", target: "root" }
          ]
        }
      }
    },

    // OVERSEER THRAIN (Grimstone Mine)
    dlg_nr_dwarf_overseer_thrain: {
      id: "dlg_nr_dwarf_overseer_thrain",
      npcId: "npc_nr_dwarf_overseer_thrain",
      nodes: {
        root: {
          speaker: "Overseer Thrain",
          text: "Curse those blue-hided trolls! Smashing up timber beams and making off with my iron vault key in Shaft Nine!",
          choices: [
            {
              label: "What vault key are you shouting about, Overseer?",
              target: "node_vault_story"
            },
            {
              label: "I found your lost iron key in Shaft Nine!",
              condition: { hasItem: "item_nr_key_grimstone_vault" },
              target: "node_return_key"
            },
            {
              label: "I will leave you to your mining.",
              target: "exit"
            }
          ]
        },
        node_vault_story: {
          speaker: "Overseer Thrain",
          text: "The ancestral vault holding Clan Silver-Kin's Star-Key and pure silver ingots! If you venture into Shaft Nine and recover my key, half the clan treasures are yours!",
          startQuest: "quest_nr_side_dwarven_vault",
          choices: [
            { label: "I will find your key and clear the shaft.", target: "exit" }
          ]
        },
        node_return_key: {
          speaker: "Overseer Thrain",
          text: "By Torvald's beard, you found it! The vault door in Shaft Nine is yours to unlock. Take this silver ingot with my deepest thanks!",
          giveItem: "mat_nr_silver_ingot",
          awardXP: 80,
          modifyReputation: { faction_nr_silver_kin: 20 },
          completeQuest: "quest_nr_side_dwarven_vault",
          choices: [
            { label: "Glad to assist the Silver Kin.", target: "exit" }
          ]
        }
      }
    },

    // DUMMY DIALOGUES FOR OTHER NAMED MERCHANTS & GUARDS
    dlg_nr_merchant_astrid: {
      id: "dlg_nr_merchant_astrid",
      npcId: "npc_nr_merchant_astrid",
      nodes: {
        root: {
          speaker: "Astrid",
          text: "Warm greetings! The cold biting out there? Inspect my wares: broadswords, rations, and reliable lockpicks.",
          choices: [{ label: "Show me your goods.", target: "exit" }]
        }
      }
    },
    dlg_nr_smith_bjorn: {
      id: "dlg_nr_smith_bjorn",
      npcId: "npc_nr_smith_bjorn",
      nodes: {
        root: {
          speaker: "Bjorn",
          text: "Need river-iron or a good mountain broadsword? You have come to the right anvil.",
          choices: [{ label: "Let me see your metalwork.", target: "exit" }]
        }
      }
    },
    dlg_nr_trapper_ulf: {
      id: "dlg_nr_trapper_ulf",
      npcId: "npc_nr_trapper_ulf",
      nodes: {
        root: {
          speaker: "Ulf White-Wolf",
          text: "The woods are full of hungry wolves this season. Need a warm wolf-pelt or an ash longbow?",
          choices: [{ label: "Let me trade for wilderness gear.", target: "exit" }]
        }
      }
    },
    dlg_nr_boatman_hagan: {
      id: "dlg_nr_boatman_hagan",
      npcId: "npc_nr_boatman_hagan",
      nodes: {
        root: {
          speaker: "Hagan",
          text: "Mind your footing on the wet pilings, friend. The bog waters run deep under Mistglen.",
          choices: [{ label: "Farewell, boatman.", target: "exit" }]
        }
      }
    },
    dlg_nr_innkeeper_mira: {
      id: "dlg_nr_innkeeper_mira",
      npcId: "npc_nr_innkeeper_mira",
      nodes: {
        root: {
          speaker: "Mira",
          text: "A stool by the stove and a mug of bitter ale will wash the fen chill out of your bones.",
          choices: [{ label: "Pour me an ale.", target: "exit" }]
        }
      }
    },
    dlg_nr_bandit_captain_malik: {
      id: "dlg_nr_bandit_captain_malik",
      npcId: "npc_nr_bandit_captain_malik",
      nodes: {
        root: {
          speaker: "Malik the Drowned",
          text: "You walked into the wrong fort, soft-skin. Hand over your coin purse or feed the marsh eels!",
          choices: [
            { label: "[Combat] Draw your blade, brigand!", target: "exit" }
          ]
        }
      }
    },
    dlg_nr_bog_witch_morrigan: {
      id: "dlg_nr_bog_witch_morrigan",
      npcId: "npc_nr_bog_witch_morrigan",
      nodes: {
        root: {
          speaker: "Morrigan",
          text: "I smelled your blood coming through the fog... Need frost lichen or viper venom, child?",
          choices: [{ label: "Show me your remedies and extracts.", target: "exit" }]
        }
      }
    },
    dlg_nr_dwarf_warden_durn: {
      id: "dlg_nr_dwarf_warden_durn",
      npcId: "npc_nr_dwarf_warden_durn",
      nodes: {
        root: {
          speaker: "Durn Silver-Shield",
          text: "Grimstone stands eternal. Keep your weapons sheathed within clan halls and we will have peace.",
          choices: [{ label: "Understood, warden.", target: "exit" }]
        }
      }
    },
    dlg_nr_blackforge_master_helga: {
      id: "dlg_nr_blackforge_master_helga",
      npcId: "npc_nr_blackforge_master_helga",
      nodes: {
        root: {
          speaker: "Helga Anvil-Mother",
          text: "You stand before the magma fires of the Blackforge. Here we forge armor that withstands dragon talons.",
          choices: [{ label: "Show me your masterwork craft.", target: "exit" }]
        }
      }
    },
    dlg_nr_librarian_freya: {
      id: "dlg_nr_librarian_freya",
      npcId: "npc_nr_librarian_freya",
      nodes: {
        root: {
          speaker: "Freya",
          text: "Quiet in the Arcanum, please. The ink on these First-Age dragon manuscripts is delicate.",
          choices: [{ label: "I shall tread softly.", target: "exit" }]
        }
      }
    }
  }
};

// -------------------------------------------------------------
// 3. EVENTS (World Engine Reactive Triggers)
// -------------------------------------------------------------
const events = {
  events: [
    {
      id: "event_nr_social_success",
      name: "Hold Influence",
      trigger: "SOCIAL_SUCCESS",
      conditions: {},
      outcomes: {
        modifyReputation: { faction_nr_frostpeak_watch: 2 },
        transcript: {
          speaker: "Reputation",
          text: "Your persuasive words spread among the hold guards and citizens.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "event_nr_hidden_spot_found",
      name: "Wilderness Discovery",
      trigger: "HIDDEN_SPOT_FOUND",
      conditions: {},
      outcomes: {
        awardXP: 10,
        transcript: {
          speaker: "Discovery",
          text: "Sharp eyes uncover a hidden cache in the northern snows.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "event_nr_item_crafted",
      name: "Runic Crafting",
      trigger: "ITEM_CRAFTED",
      conditions: {},
      outcomes: {
        awardXP: 15,
        transcript: {
          speaker: "Crafting",
          text: "You forge gear with your own hands at the northern workbench.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "event_nr_item_combined",
      name: "Kit Improvement",
      trigger: "ITEM_COMBINED",
      conditions: {},
      outcomes: {
        awardXP: 10,
        transcript: {
          speaker: "Crafting",
          text: "You enhance your weapon in the field.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "event_nr_troll_slain",
      name: "Troll Threat Cleared",
      trigger: "ENTITY_DEATH",
      conditions: { targetEntityId: "creature_nr_frost_troll" },
      outcomes: {
        updateQuest: {
          questId: "quest_nr_covenant_trial_of_steel",
          objectiveId: "stage_slay_troll",
          completed: true
        },
        transcript: {
          speaker: "Victory",
          text: "The mountain frost troll crashes down with a final dying shudder. The shafts are safe!",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "event_nr_skallagrim_slain",
      name: "Barrow Lord Banished",
      trigger: "ENTITY_DEATH",
      conditions: { targetEntityId: "creature_nr_boss_skallagrim" },
      outcomes: {
        updateQuest: {
          questId: "quest_nr_side_barrow_curse",
          objectiveId: "stage_defeat_skallagrim",
          completed: true
        },
        completeQuest: "quest_nr_side_barrow_curse",
        transcript: {
          speaker: "Ancestral Silence",
          text: "Chieftain Skallagrim crumbles to harmless ash, releasing the ancestral Star-Key Gamma into your grasp.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "event_nr_vyr_slain",
      name: "The Dragon Falls",
      trigger: "ENTITY_DEATH",
      conditions: { targetEntityId: "creature_nr_boss_vyr" },
      outcomes: {
        setFlags: { dragon_slain: true },
        updateQuest: {
          questId: "quest_nr_main_shadow_of_wyrmfang",
          objectiveId: "stage_confront_vyr",
          completed: true
        },
        completeQuest: "quest_nr_main_shadow_of_wyrmfang",
        modifyReputation: { faction_nr_frostpeak_watch: 50, faction_nr_iron_covenant: 50 },
        addJournalChronicle: {
          title: "The Slumber of Vyr",
          text: "Vyr the Ancient Frost Wyrm has fallen in the crater of Mount Wyrmfang! The northern realms are saved!"
        },
        transcript: {
          speaker: "Legendary Victory",
          text: "Vyr roars as its frozen heart shatters, collapsing upon the volcanic basalt. The Northern Realms celebrate eternal victory!",
          style: "entry-discovery"
        }
      }
    }
  ]
};

writeJson(path.join(OUT_DIR, 'quests.json'), quests);
writeJson(path.join(OUT_DIR, 'dialogues.json'), dialogues);
writeJson(path.join(OUT_DIR, 'events.json'), events);

console.log("Stage 6 complete: Quests (6), Dialogues (17 trees), Events (7).");

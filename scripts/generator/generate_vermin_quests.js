const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const WORLD_DIR = path.join(ROOT, 'content/campaigns/vermin/world');

function writeJson(filePath, data) {
  const jsonStr = JSON.stringify(data, null, 2);
  if (jsonStr.includes('\u2014')) {
    throw new Error(`CRITICAL: Forbidden em dash detected in output for ${filePath}`);
  }
  fs.writeFileSync(filePath, jsonStr, 'utf8');
  console.log(`Wrote ${filePath} (${jsonStr.length} bytes)`);
}

// ==========================================
// 1. QUESTS
// ==========================================
const quests = {
  quests: [
    {
      id: "quest_vb_find_exit",
      title: "The Search for an Exit",
      category: "main",
      summary: "Awakened in an unfamiliar room with an identity document bearing your name, explore the shifting corridors and find a way out of the repeating loop.",
      currentStage: "explore_loop",
      stages: {
        explore_loop: {
          description: "Follow the cycling doors past the projector and discover the nature of the entity blocking the corridor.",
          objectives: [
            { id: "obj_find_identity", text: "Examine your identity document in the waking room.", completed: false },
            { id: "obj_take_medicine", text: "Overcome the toxic emanation in the corridor by taking pain elixir.", completed: false }
          ]
        },
        reach_antechamber: {
          description: "Follow the long carpeted hallway past the ember cloud into the central two-door antechamber.",
          objectives: [
            { id: "obj_reach_antechamber", text: "Pass through the revealed door and locate the two-door room.", completed: false }
          ]
        },
        completed: {
          description: "You have breached the initial loop and entered the deeper antechamber.",
          objectives: [
            { id: "obj_loop_breached", text: "Initial loop breached.", completed: true }
          ]
        }
      },
      rewards: {
        experience: 100,
        drachmae: 20,
        items: ["item_vb_med_bottle_full"]
      }
    },
    {
      id: "quest_vb_the_countdown",
      title: "The Crimson Countdown",
      category: "main",
      summary: "Roman numerals freshly painted in blood on the antechamber wall are descending from IX toward zero as you explore each quadrant of the space.",
      currentStage: "tally_numerals",
      stages: {
        tally_numerals: {
          description: "Explore the dark kitchen, the wood-paneled maze, and the visceral room to advance the count.",
          objectives: [
            { id: "obj_numeral_ix", text: "Observe numeral IX after navigating the kitchen and dining hall.", completed: false },
            { id: "obj_numeral_viii", text: "Observe numeral VIII after escaping the paneled labyrinth.", completed: false },
            { id: "obj_numeral_vii", text: "Observe numeral VII after investigating the visceral room.", completed: false },
            { id: "obj_numeral_zero", text: "Reach the green armchair room as the countdown strikes zero.", completed: false }
          ]
        },
        completed: {
          description: "The countdown has reached its conclusion. The final door to judgment stands unlocked.",
          objectives: [
            { id: "obj_countdown_finished", text: "Countdown concluded.", completed: true }
          ]
        }
      },
      rewards: {
        experience: 250,
        drachmae: 50,
        items: ["item_vb_void_lantern"]
      }
    },
    {
      id: "quest_vb_the_rag",
      title: "The Shroud without a Body",
      category: "side",
      summary: "Track and neutralize the levitating coarse rag that projects nausea, blurred vision, and temporal distortion across the corridors.",
      currentStage: "hunt_rag",
      stages: {
        hunt_rag: {
          description: "Confront the hovering rag entity in the corridor and kitchen.",
          objectives: [
            { id: "obj_defeat_first_rag", text: "Strike down the rag in the initial dark corridor.", completed: false },
            { id: "obj_gather_cloth", text: "Recover a sample of the floating entity cloth.", completed: false }
          ]
        },
        completed: {
          description: "The shroud has been proven to be empty fabric, robbed of its toxic grip on your mind.",
          objectives: [
            { id: "obj_rag_neutralized", text: "Rag entity neutralized.", completed: true }
          ]
        }
      },
      rewards: {
        experience: 120,
        drachmae: 25,
        items: ["mat_vb_entity_cloth"]
      }
    },
    {
      id: "quest_vb_the_music_box",
      title: "The Fire-Ember Melody",
      category: "side",
      summary: "Investigate the swirling cloud of dust and embers at the dead end of the carpeted hallway and silence its ceaseless chime.",
      currentStage: "silence_melody",
      stages: {
        silence_melody: {
          description: "Approach the music box at the end of the long hallway and examine its mechanism.",
          objectives: [
            { id: "obj_disperse_embers", text: "Disperse the ember cloud in the long hallway.", completed: false },
            { id: "obj_claim_music_box", text: "Retrieve the rattling music box from the alcove.", completed: false }
          ]
        },
        completed: {
          description: "The music box rests in your pack, silent and motionless at last.",
          objectives: [
            { id: "obj_music_box_claimed", text: "Music box secured.", completed: true }
          ]
        }
      },
      rewards: {
        experience: 100,
        drachmae: 20,
        items: ["item_vb_music_box"]
      }
    },
    {
      id: "quest_vb_the_memories",
      title: "Records of the Clinic",
      category: "side",
      summary: "Recover patient case files, intake vouchers, and diagnostic records from the archive cabinets to piece together your institutional past.",
      currentStage: "gather_records",
      stages: {
        gather_records: {
          description: "Search the filing room and speak with the Archivist to assemble the case files.",
          objectives: [
            { id: "obj_find_case_one", text: "Retrieve Case File #001 from the filing cabinets.", completed: false },
            { id: "obj_find_contract", text: "Locate a signed Self-Admission Contract.", completed: false }
          ]
        },
        completed: {
          description: "The institutional records confirm your methodology. The clinic was your domain of absolute control.",
          objectives: [
            { id: "obj_records_assembled", text: "Clinical archive inspected.", completed: true }
          ]
        }
      },
      rewards: {
        experience: 150,
        drachmae: 30,
        items: ["item_vb_clarity_tonic"]
      }
    },
    {
      id: "quest_vb_the_father",
      title: "A Complaint Concerning Transit",
      category: "side",
      summary: "Deal with the distraught father in the clinic lobby who is desperately seeking to register a complaint regarding his missed transportation.",
      currentStage: "resolve_father",
      stages: {
        resolve_father: {
          description: "Decide whether to deceive the father into involuntary commitment or reveal the grim truth of his situation.",
          objectives: [
            { id: "obj_father_decision", text: "Confront the distressed father in the clinic lobby.", completed: false }
          ]
        },
        completed: {
          description: "The father's encounter is concluded, leaving an indelible mark upon your alignment.",
          objectives: [
            { id: "obj_father_resolved", text: "The father's fate decided.", completed: true }
          ]
        }
      },
      rewards: {
        experience: 180,
        drachmae: 40,
        items: ["item_vb_med_bottle_full"]
      }
    },
    {
      id: "quest_vb_the_dogs",
      title: "Bella and Braxton",
      category: "side",
      summary: "Revisit the childhood memory of the upstairs tiled bathroom and the message left in the porcelain tub.",
      currentStage: "inspect_tub",
      stages: {
        inspect_tub: {
          description: "Locate the clawfoot tub and recover the father's shaving blade from the mirrored cabinet.",
          objectives: [
            { id: "obj_inspect_clawfoot", text: "Examine the stains in the porcelain clawfoot bathtub.", completed: false },
            { id: "obj_retrieve_blade", text: "Retrieve the father's shaving blade from the cabinet.", completed: false }
          ]
        },
        completed: {
          description: "The memory is intact. A point had to be made so your parents would listen.",
          objectives: [
            { id: "obj_message_remembered", text: "Childhood message recalled.", completed: true }
          ]
        }
      },
      rewards: {
        experience: 160,
        drachmae: 35,
        items: ["item_vb_shaving_blade"]
      }
    },
    {
      id: "quest_vb_the_verdict",
      title: "The Final Accounting",
      category: "main",
      summary: "Face the ultimate manifestation in the Hall of the Final Verdict and claim the key to the waking room door.",
      currentStage: "face_verdict",
      stages: {
        face_verdict: {
          description: "Enter the amphitheater, take your place upon the green fabric armchair, and defeat the collective judgment.",
          objectives: [
            { id: "obj_sit_in_chair", text: "Sit upon the green armchair in the Judgment Hall.", completed: false },
            { id: "obj_defeat_verdict_form", text: "Defeat the physical manifestation of the Verdict.", completed: false }
          ]
        },
        completed: {
          description: "The Verdict has been dismantled. The final door stands open back to where you first awoke.",
          objectives: [
            { id: "obj_verdict_concluded", text: "Judgment completed.", completed: true }
          ]
        }
      },
      rewards: {
        experience: 400,
        drachmae: 100,
        items: ["item_vb_the_verdict_key"]
      }
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'quests.json'), quests);

// ==========================================
// 2. PUZZLES
// ==========================================
const puzzles = {
  puzzles: [
    {
      id: "puzzle_vb_music_box_sequence",
      locationId: "loc_vb_music_box_alcove",
      title: "The Winding Mechanism",
      prompt: "The brass lid of the music box vibrates violently. Etched upon the winding plate are four musical notes intertwined with ash embers: C, E, G, B. A tiny engraving reads: 'Name the fourth harmonic resonance that stills the flame.'",
      clueJournalIds: ["lore_vb_the_rag_history"],
      acceptedKeywords: ["b", "note b", "b natural", "seventh", "fourth"],
      successOutcome: {
        text: "You turn the winding key to B. The lid clicks shut with a resonant snap. The fire embers fade into harmless ash dust.",
        setFlags: { music_box_solved: true },
        giveItem: "mat_vb_ash_dust",
        awardXP: 40,
        addJournalChronicle: {
          title: "The Silenced Box",
          text: "Aligned the harmonic pins of the rattling music box, bringing calm to the hallway."
        }
      },
      hint: "Read the fourth note in the engraved sequence."
    },
    {
      id: "puzzle_vb_maze_logic",
      locationId: "loc_vb_maze_entry",
      title: "The Architectural Turn",
      prompt: "Carved into the cedar panel above the doorframe are directional runes: 'When facing three paths, which turn leads neither to the looping wall nor the dead end niche?'",
      clueJournalIds: ["lore_vb_the_space"],
      acceptedKeywords: ["zig-zag", "zigzag", "zig zag", "second right", "right", "second path"],
      successOutcome: {
        text: "You recall the navigation sequence: the second path to the right following the zig-zag bends! The panel shifts slightly, opening the way forward.",
        setFlags: { maze_logic_solved: true, countdown_viii_reached: true },
        awardXP: 50,
        addJournalChronicle: {
          title: "Labyrinth Geometry Decoded",
          text: "Navigated the wood-paneled maze by following the zig-zag turns."
        }
      },
      hint: "Recall the path Vermin took after reliving the memory of the clinic."
    },
    {
      id: "puzzle_vb_the_mirrors",
      locationId: "loc_vb_dining_room",
      title: "The Triad of Reflections",
      prompt: "Three silvered mirrors hang above the chairless table. The first mirror shows an empty bathroom; the second shows a reception desk; the third shows an open door. An inscription upon the frame asks: 'Which reflection belongs to the beginning?'",
      clueJournalIds: ["lore_vb_the_clinic"],
      acceptedKeywords: ["first", "bathroom", "one", "tub", "the first mirror", "first mirror"],
      successOutcome: {
        text: "You touch the glass of the first mirror. The reflection ripples like water and reveals the path connecting back to the antechamber. The numeral IX ticks down to VIII upon the distant wall.",
        setFlags: { mirrors_solved: true, countdown_viii_reached: true },
        awardXP: 45,
        addJournalChronicle: {
          title: "Reflections of the Origin",
          text: "Selected the bathroom mirror, advancing the countdown on the antechamber wall."
        }
      },
      hint: "Consider where Vermin's earliest childhood act of violence took place."
    },
    {
      id: "puzzle_vb_the_verdict_cipher",
      locationId: "loc_vb_judgment_hall",
      title: "The Tally Inscription",
      prompt: "Inscribed upon the pedestal of the green armchair are the Roman numerals IX through I. A hollow slot awaits a single word of confirmation: 'What remains when every count has fallen?'",
      clueJournalIds: ["lore_vb_the_countdown"],
      acceptedKeywords: ["zero", "verdict", "judgment", "nothing", "vermin", "vermin black", "the verdict"],
      successOutcome: {
        text: "You speak the word: 'Zero.' The golden pedestal clicks into place and the final confrontation begins.",
        setFlags: { verdict_cipher_solved: true, countdown_zero_reached: true },
        awardXP: 60,
        addJournalChronicle: {
          title: "The Zero Point",
          text: "Spoke the final numeral, unlocking the door to the ultimate verdict."
        }
      },
      hint: "What follows numeral I in a descending countdown?"
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'puzzles.json'), puzzles);

// ==========================================
// 3. EVENTS
// ==========================================
const events = {
  events: [
    {
      id: "event_vb_countdown_viii",
      name: "Countdown Reaches VIII",
      trigger: "FLAG_SET",
      conditions: { flag: "kitchen_lights_restored", expected: true },
      outcomes: {
        setFlags: { countdown_viii_reached: true },
        transcript: {
          speaker: "Architectural Shift",
          text: "A distant rumble echoes through the plaster. In the antechamber, the IX on the wall dissolves into VIII.",
          style: "entry-consequence"
        }
      }
    },
    {
      id: "event_vb_countdown_vii",
      name: "Countdown Reaches VII",
      trigger: "FLAG_SET",
      conditions: { flag: "maze_logic_solved", expected: true },
      outcomes: {
        setFlags: { countdown_vii_reached: true },
        transcript: {
          speaker: "Architectural Shift",
          text: "The wood paneling grinds shut behind you. The numeral VIII on the antechamber wall is replaced by VII.",
          style: "entry-consequence"
        }
      }
    },
    {
      id: "event_vb_countdown_vi",
      name: "Countdown Reaches VI",
      trigger: "FLAG_SET",
      conditions: { flag: "gut_lights_restored", expected: true },
      outcomes: {
        setFlags: { countdown_vi_reached: true },
        transcript: {
          speaker: "Architectural Shift",
          text: "The dripping overhead slows to a halt. The numeral on the wall shifts to VI, and the quiet corridor to the green armchair opens.",
          style: "entry-consequence"
        }
      }
    },
    {
      id: "event_vb_countdown_zero",
      name: "Countdown Reaches Zero",
      trigger: "FLAG_SET",
      conditions: { flag: "bathtub_explored", expected: true },
      outcomes: {
        setFlags: { countdown_zero_reached: true },
        transcript: {
          speaker: "The Final Toll",
          text: "All Roman numerals on the antechamber wall extinguish at once. The massive doors to the Judgment Hall grind open.",
          style: "entry-consequence"
        }
      }
    },
    {
      id: "event_vb_father_committed",
      name: "Father Committed to Archives",
      trigger: "FLAG_SET",
      conditions: { flag: "father_committed", expected: true },
      outcomes: {
        modifyReputation: { faction_vb_the_remembered: -20, faction_vb_the_self: 10 },
        transcript: {
          speaker: "Clinical Intake",
          text: "Orderlies file the father's papers into iron drawers. His cries fade behind soundproof doors.",
          style: "entry-consequence"
        }
      }
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'events.json'), events);

// ==========================================
// 4. INTERACTIVE OBJECTS
// ==========================================
const interactiveObjects = {
  interactiveObjects: [
    {
      id: "obj_vb_identity_on_floor",
      locationId: "loc_vb_waking_room",
      name: "Identity Document on Floor",
      type: "mechanism",
      locked: false,
      isPickable: false,
      description: "A folded card bearing your photograph and the printed name Vermin Black.",
      unlockOutcome: {
        giveItem: "item_vb_identity_document",
        setFlags: { identity_found: true },
        awardXP: 20,
        transcript: {
          speaker: "Identity",
          text: "You retrieve the document. The face staring back is unequivocally your own.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "obj_vb_projector",
      locationId: "loc_vb_projector_chamber",
      name: "Silent 35mm Projector",
      type: "mechanism",
      locked: false,
      isPickable: false,
      description: "A whirring projector mounted on a heavy metal tripod.",
      unlockOutcome: {
        setFlags: { projector_inspected: true },
        awardXP: 15,
        transcript: {
          speaker: "Projector",
          text: "The shutter clicks at regular intervals, projecting empty white illumination upon the far wall.",
          style: "entry-prose"
        }
      }
    },
    {
      id: "obj_vb_music_box_obj",
      locationId: "loc_vb_music_box_alcove",
      name: "Lacquered Music Box",
      type: "container",
      locked: true,
      isPickable: true,
      lockDifficulty: 10,
      description: "A brass-filigreed music box resting in the corner where the ember cloud collapsed.",
      contents: {
        items: ["item_vb_music_box", "mat_vb_ash_dust"]
      },
      unlockOutcome: {
        setFlags: { music_box_opened: true },
        awardXP: 25
      }
    },
    {
      id: "obj_vb_kitchen_door",
      locationId: "loc_vb_kitchen",
      name: "Reinforced Kitchen Cupboard",
      type: "container",
      locked: true,
      isPickable: true,
      lockDifficulty: 11,
      requiredKeyId: "item_vb_iron_key_c",
      description: "A locked metal storage cupboard built beneath the countertop.",
      contents: {
        items: ["item_vb_med_bottle_full", "item_vb_glass_vial"]
      },
      unlockOutcome: {
        setFlags: { kitchen_cupboard_opened: true },
        awardXP: 25
      }
    },
    {
      id: "obj_vb_maze_door",
      locationId: "loc_vb_maze_entry",
      name: "Paneled Labyrinth Door",
      type: "door",
      locked: true,
      isPickable: true,
      lockDifficulty: 12,
      requiredKeyId: "item_vb_iron_key_a",
      description: "A heavy cedar door blending seamlessly with the wall paneling.",
      unlockOutcome: {
        setFlags: { maze_door_unlocked: true },
        awardXP: 30
      }
    },
    {
      id: "obj_vb_filing_cabinet",
      locationId: "loc_vb_filing_room",
      name: "Iron Case File Cabinet",
      type: "container",
      locked: true,
      isPickable: true,
      lockDifficulty: 12,
      requiredKeyId: "item_vb_iron_key_b",
      description: "A locked four-drawer olive filing cabinet marked 'CONFIDENTIAL ADMISSIONS'.",
      contents: {
        items: ["item_vb_case_file_001", "item_vb_case_file_father"]
      },
      unlockOutcome: {
        setFlags: { filing_cabinet_opened: true },
        awardXP: 30
      }
    },
    {
      id: "obj_vb_bathtub",
      locationId: "loc_vb_bathtub_room",
      name: "Porcelain Clawfoot Bathtub",
      type: "obstacle",
      locked: false,
      isPickable: false,
      description: "A white porcelain bathtub stained with dark crimson rings.",
      unlockOutcome: {
        setFlags: { tub_inspected: true },
        awardXP: 25,
        transcript: {
          speaker: "Memory",
          text: "You look down into the empty tub. The memories of Bella and Braxton are clear and tidy.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "obj_vb_judgment_door",
      locationId: "loc_vb_judgment_hall",
      name: "Double Gilded Doors of the Verdict",
      type: "door",
      locked: true,
      isPickable: false,
      requiredKeyId: "item_vb_the_verdict_key",
      description: "Monumental double doors bound in cold alloy, barring the exit back to reality.",
      unlockOutcome: {
        setFlags: { judgment_door_opened: true },
        awardXP: 50,
        transcript: {
          speaker: "The Threshold",
          text: "The key turns with the sound of a closing cell. The door opens back into the empty room where you first awoke.",
          style: "entry-discovery"
        }
      }
    },
    {
      id: "obj_vb_mirror_a",
      locationId: "loc_vb_dining_room",
      name: "First Gilded Mirror",
      type: "mechanism",
      locked: false,
      isPickable: false,
      description: "A tall silvered mirror reflecting an empty white bathtub.",
      unlockOutcome: {
        setFlags: { mirror_a_examined: true },
        awardXP: 15
      }
    },
    {
      id: "obj_vb_mirror_b",
      locationId: "loc_vb_dining_room",
      name: "Second Gilded Mirror",
      type: "mechanism",
      locked: false,
      isPickable: false,
      description: "A tall silvered mirror reflecting a clinic reception desk.",
      unlockOutcome: {
        setFlags: { mirror_b_examined: true },
        awardXP: 15
      }
    },
    {
      id: "obj_vb_mirror_c",
      locationId: "loc_vb_dining_room",
      name: "Third Gilded Mirror",
      type: "mechanism",
      locked: false,
      isPickable: false,
      description: "A tall silvered mirror reflecting a closed door.",
      unlockOutcome: {
        setFlags: { mirror_c_examined: true },
        awardXP: 15
      }
    },
    {
      id: "obj_vb_the_green_chair",
      locationId: "loc_vb_green_chair_room",
      name: "The Gilded Green Armchair",
      type: "mechanism",
      locked: false,
      isPickable: false,
      description: "An armchair upholstered in green fabric with an ornate gold frame.",
      unlockOutcome: {
        setFlags: { green_chair_touched: true },
        awardXP: 25,
        transcript: {
          speaker: "The Chair",
          text: "The fabric is cool to the touch. It waits for the countdown to conclude.",
          style: "entry-prose"
        }
      }
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'interactive_objects.json'), interactiveObjects);

// ==========================================
// 5. LORE & GLOSSARY
// ==========================================
const lore = {
  loreEntries: [
    {
      id: "lore_vb_the_space",
      title: "The Architecture of the Loop",
      category: "Phenomenology",
      summary: "A shifting geometric construct that traps consciousness within recursive loops of memory and guilt.",
      text: "The rooms do not conform to Euclidean geometry. A door opened to the left leads to a room that exits into the room where the journey began. Light bulbs pop loudly, extinguishing all illumination before restoring altered layouts. It is a psychological labyrinth that reflects the inner mind of its sole occupant.",
      significance: "Explains why hallways reset and why doors disappear when turned away from."
    },
    {
      id: "lore_vb_the_countdown",
      title: "The Descending Numerals",
      category: "Phenomenology",
      summary: "Roman numerals freshly daubed in blood marking the approach to final accounting.",
      text: "Upon the central wall of the two-door antechamber, crimson numerals tick down from IX toward zero. Each numeral corresponds to an unacknowledged atrocity: the butchering of pets, the deception of vulnerable patients, the dismemberment of bodies, and the severance of familial bonds.",
      significance: "The structural driver of the campaign's progression."
    },
    {
      id: "lore_vb_the_rag_history",
      title: "The Shroud without Substance",
      category: "Entities",
      summary: "A coarse cloth suspended in mid-air that emits toxic psychic disorientation.",
      text: "The entity known simply as The Rag appears as levitating coarse fabric with nobody standing beneath it. It moves without wind and exudes an aura that causes blurred vision and a sinking feeling in the feet. It represents the hollow, faceless void behind Vermin's clinical detachment.",
      significance: "The primary recurring paranormal threat throughout the shifting corridors."
    },
    {
      id: "lore_vb_vermin_history",
      title: "The Record of Vermin Black",
      category: "Biography",
      summary: "A clinical practitioner who viewed living creatures solely as toys for amusement and dissection.",
      text: "From early childhood, Vermin Black recognized his total inability to experience empathy or affection. He viewed animals and human beings alike as mechanical playthings. His psychiatric clinic was established not to heal, but to provide a steady influx of confused, desperate individuals who could be committed, studied, and dismantled.",
      significance: "Contextualizes Vermin's inner monologue and remorseless worldview."
    },
    {
      id: "lore_vb_the_clinic",
      title: "The Intake Clinic",
      category: "Institutions",
      summary: "A private mental facility deliberately positioned next to a transit depot to trap confused travelers.",
      text: "The clinic's signage was intentionally mounted in an ambiguous fashion adjacent to a local transport service. When travelers entered seeking to file complaints about delayed drivers or missed pickups, Dr. Black would greet them personally, present a self-admission contract under the guise of an official complaint, and summon orderlies upon their signature.",
      significance: "The origin of the distressed father and clinic orderly apparitions."
    },
    {
      id: "lore_vb_the_dogs",
      title: "Bella and Braxton",
      category: "Memories",
      summary: "Two family dogs killed in an upstairs bathtub to send a message to parents.",
      text: "When his parents refused to give away the family pets, the young Vermin took his father's shaving blade and brought Bella into the upstairs bathroom. He pinned her down in the tub, slicing her throat in a deliberate curve until she ceased making noise. He repeated the procedure with Braxton, leaving both corpses in the porcelain tub as a definitive message.",
      significance: "Explains the presence of the clawfoot tub and shaving blade."
    },
    {
      id: "lore_vb_the_father_case",
      title: "The Delayed Father",
      category: "Case Files",
      summary: "A man who missed the birth of his daughter and spent twenty years in confinement.",
      text: "The father arrived at the clinic seeking a complaint form after his booked cab failed to arrive during his wife's labor. Tricked into signing away his freedom, he spent decades in the quiet wards calling for his daughter Clara, unaware that Dr. Black kept his intake form framed as a personal trophy.",
      significance: "The emotional core of the moral choice in the clinic lobby."
    },
    {
      id: "lore_vb_the_echoes",
      title: "Manifestations of the Done",
      category: "Entities",
      summary: "Entities formed from memory, guilt, and organic residue.",
      text: "The entities inhabiting the corridors are not foreign spirits; they are physical projections of Vermin's own actions. The Sprinter embodies his abrupt, panicked victims; The Drip embodies visceral clean-up methods; and The Verdict is the culmination of all nine counts.",
      significance: "Explains why every monster matches a specific journal entry."
    },
    {
      id: "lore_vb_the_verdict",
      title: "The Final Audit",
      category: "Phenomenology",
      summary: "The inevitable reckoning that awaits in the green fabric armchair.",
      text: "When the countdown reaches zero, the green armchair summons the full weight of what was done. It is not an executioner, but an auditor: it forces Vermin Black to sit in judgment of his own creation.",
      significance: "The final encounter of the campaign."
    },
    {
      id: "lore_vb_the_exit",
      title: "The First Door, Again",
      category: "Phenomenology",
      summary: "The nature of escape from a recursive purgatory.",
      text: "There is no physical exit to the outside world. To defeat the Verdict is simply to unlock the final door, which opens back into the empty room where Vermin first awoke. The cycle is complete, yet the mind that walks it has been irrevocably tallied.",
      significance: "The thematic closure of the psychological horror loop."
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'lore.json'), lore);

const glossary = {
  glossary: [
    {
      key: "the_rag",
      terms: ["The Rag", "the rag", "hanging rag", "coarse rag"],
      name: "The Rag",
      category: "Entities",
      simpleEnglish: "A floating piece of cloth that moves like a person and makes you dizzy.",
      explanation: "A paranormal entity appearing as levitating fabric without a visible body, emitting a toxic aura that blurs vision and causes footsteps to sink.",
      significance: "The first hostile entity encountered in the shifting loop."
    },
    {
      key: "the_sprinter",
      terms: ["The Sprinter", "the sprinter", "sprinter entity"],
      name: "The Sprinter",
      category: "Entities",
      simpleEnglish: "A dark human-shaped shadow that charges suddenly from doors.",
      explanation: "A high-speed humanoid apparition that darts across corridors and vanishes into unlit corners.",
      significance: "Represents the sudden panic of trapped victims."
    },
    {
      key: "the_countdown",
      terms: ["The Countdown", "Roman numerals", "numerals", "IX", "VIII", "VII"],
      name: "The Countdown",
      category: "Phenomenology",
      simpleEnglish: "Roman numerals painted in blood on the wall counting down from 9 to 0.",
      explanation: "A sequence of Roman numerals daubed in blood upon the antechamber wall that decreases as Vermin explores major rooms.",
      significance: "Measures progress toward the final judgment in the green armchair."
    },
    {
      key: "clarity",
      terms: ["Clarity", "clarity", "Virtue"],
      name: "Clarity (Virtue)",
      category: "Morality",
      simpleEnglish: "Maintaining honest, sharp perception without fleeing into delusion.",
      explanation: "The campaign virtue representing conscious awareness and acknowledgment of reality.",
      significance: "Increases through truthful decisions and methodical examination."
    },
    {
      key: "fracture",
      terms: ["Fracture", "fracture", "Hubris"],
      name: "Fracture (Hubris)",
      category: "Morality",
      simpleEnglish: "Slipping deeper into psychopathic detachment and cruel manipulation.",
      explanation: "The campaign hubris representing cynical sadism and manipulation of helpless echoes.",
      significance: "Accumulated by deceiving victims and indulging in remorseless cruelty."
    },
    {
      key: "the_space",
      terms: ["The Shifting Space", "the space", "shifting room", "loop"],
      name: "The Shifting Space",
      category: "Phenomenology",
      simpleEnglish: "The strange building where rooms move, doors disappear, and lights pop.",
      explanation: "An impossible architectural labyrinth that rearranges itself whenever lights pop or doors close.",
      significance: "The physical environment of Vermin Black's purgatory."
    },
    {
      key: "plain_killing_elixir",
      terms: ["Plain-Killing Elixir", "plain killing elixir", "medication", "elixir"],
      name: "Plain-Killing Elixir",
      category: "Items",
      simpleEnglish: "An expensive pain medicine Vermin drinks when hurt.",
      explanation: "A potent chemical analgesic Vermin routinely consumes to numb physical pain and steady blurred vision.",
      significance: "Essential consumable for navigating toxic entity corridors."
    },
    {
      key: "the_verdict",
      name: "The Final Verdict",
      terms: ["The Verdict", "the verdict", "The Final Verdict"],
      category: "Phenomenology",
      simpleEnglish: "The final accounting that waits in the green armchair.",
      explanation: "The ultimate reckoning where the collective crimes of Vermin Black manifest into physical form for accounting.",
      significance: "The climax and boss encounter of the campaign."
    }
  ]
};
writeJson(path.join(WORLD_DIR, 'glossary.json'), glossary);


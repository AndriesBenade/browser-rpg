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

const locations = {
  locations: [
    {
      id: "loc_vb_waking_room",
      name: "The Empty Waking Room",
      region: "The Shifting Loop",
      recommendedLevel: 1,
      coordinates: { x: 80, y: 100 },
      terrain: "shifting_room",
      restSafety: "settlement",
      connections: [
        {
          targetLocationId: "loc_vb_projector_chamber",
          name: "The Only Door",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "You wake upon a bare floor in an empty room with a single closed door. On the floor lies a single document. You pick it up. It is an identity document with your own photograph: Vermin Black.",
        subsequentVisit: "The room is bare, cold, and quiet. Whenever the lights pop and reality resets, you find yourself standing precisely where you first woke."
      },
      presentItems: ["item_vb_identity_document"],
      hiddenSpots: [
        {
          id: "spot_waking_baseboard",
          name: "Loose Skirting Board",
          dc: 10,
          text: "Prying back a splintered baseboard reveals a forgotten cache of medical supplies.",
          outcome: { giveItem: "item_vb_med_bottle", awardXP: 15 }
        },
        {
          id: "spot_waking_plaster",
          name: "Hollow Plaster Wall",
          dc: 12,
          text: "Tapping the wall reveals a hollow space behind the wallpaper containing fine grey ash.",
          outcome: { giveItem: "mat_vb_void_ash", awardXP: 20 }
        }
      ],
      contextActions: [
        {
          id: "act_inspect_identity_doc",
          category: "Exploration & Investigation",
          title: "Examine Identity Document",
          desc: "Inspect the government identity papers confirming your name as Vermin Black.",
          badge: "Investigation",
          type: "primary-quest-action",
          requiresNotFlag: "identity_examined",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "intelligence",
            dc: 8,
            name: "Document Verification",
            success: {
              transcript: { speaker: "Discovery", text: "Name: Vermin Black. The signature and face match without contradiction. You are yourself.", style: "entry-discovery" },
              setFlags: { identity_examined: true },
              startQuest: "quest_vb_find_exit",
              awardXP: 20
            },
            failure: {
              transcript: { speaker: "Thought", text: "The letters blur momentarily, but the photograph is unmistakably your own.", style: "entry-prose" },
              setFlags: { identity_examined: true },
              startQuest: "quest_vb_find_exit"
            }
          }
        }
      ]
    },
    {
      id: "loc_vb_projector_chamber",
      name: "The Projector Chamber",
      region: "The Shifting Loop",
      recommendedLevel: 1,
      coordinates: { x: 200, y: 100 },
      terrain: "dark_passage",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_waking_room",
          name: "The Waking Door",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_rag_corridor",
          name: "Into the Dark Corridor",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "The room is dark. An old silent film projector sits on a table in the center, whirring softly without projecting an image. On the floor beside the tripod rests a lit brass lantern.",
        subsequentVisit: "The hum of the projector motor reverberates against the bare plaster walls. Shadows stretch across the floor."
      },
      presentItems: ["item_vb_lantern"],
      hiddenSpots: [
        {
          id: "spot_projector_shelf",
          name: "Table Underside",
          dc: 11,
          text: "Taped beneath the projector stand is an empty glass laboratory vial.",
          outcome: { giveItem: "item_vb_glass_vial", awardXP: 15 }
        }
      ],
      contextActions: [
        {
          id: "act_examine_projector",
          category: "Exploration & Investigation",
          title: "Inspect Whirring Projector",
          desc: "Examine the lens and spools of the silent 35mm projector.",
          badge: "Observation",
          type: "primary-quest-action",
          requiresNotFlag: "projector_inspected",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "intelligence",
            dc: 10,
            name: "Projector Inspection",
            success: {
              transcript: { speaker: "Discovery", text: "The projector has no film loaded, yet its shutter clicks continuously at 24 frames per second.", style: "entry-discovery" },
              setFlags: { projector_inspected: true },
              awardXP: 25
            },
            failure: {
              transcript: { speaker: "Observation", text: "The shutter clicks rhythmically in the dark.", style: "entry-prose" },
              setFlags: { projector_inspected: true }
            }
          }
        }
      ]
    },
    {
      id: "loc_vb_rag_corridor",
      name: "The Corridor of the Entity",
      region: "The Shifting Loop",
      recommendedLevel: 1,
      coordinates: { x: 320, y: 100 },
      terrain: "dark_passage",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_projector_chamber",
          name: "Back to Projector Chamber",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_waking_room",
          name: "Looping Door to Start",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_first_hallway",
          name: "The Revealed Doorway",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "clinical_corridor",
          dangerRating: 2,
          requiresFlag: "medicine_taken"
        }
      ],
      narrative: {
        firstVisit: "A cold draft carries a sickly sweet, toxic emission. In the center of the passage, a coarse rag hangs suspended in mid-air as if an invisible person stood beneath it. In the corner sits a small bottle of plain-killing elixir.",
        subsequentVisit: "The air here remains heavy and chilled. The outline of a newly revealed door stands clearly against the wall."
      },
      presentItems: ["item_vb_med_bottle", "item_vb_med_bottle_full"],
      hiddenSpots: [
        {
          id: "spot_rag_corridor_vent",
          name: "Floor Air Grate",
          dc: 11,
          text: "Prying up the iron vent reveals tangled threads of entity cloth.",
          outcome: { giveItem: "mat_vb_entity_cloth", awardXP: 20 }
        }
      ],
      contextActions: [
        {
          id: "act_drink_pain_elixir",
          category: "Medical & Survival",
          title: "Drink Plain-Killing Elixir",
          desc: "Consume the expensive pain elixir to numb the toxic nausea and clear your vision.",
          badge: "Medication",
          type: "primary-quest-action",
          requiresNotFlag: "medicine_taken",
          handlerType: "item_action",
          outcome: {
            transcript: { speaker: "Medication", text: "You uncork the bottle and swallow the bitter elixir. The throbbing ache behind your temples subsides and the shifting room steadies into focus. A closed door appears ahead.", style: "entry-discovery" },
            setFlags: { medicine_taken: true },
            restoreHealth: 15,
            restoreStamina: 15,
            awardXP: 30
          }
        }
      ]
    },
    {
      id: "loc_vb_first_hallway",
      name: "The Long Carpeted Hallway",
      region: "The Shifting Loop",
      recommendedLevel: 1,
      coordinates: { x: 460, y: 100 },
      terrain: "clinical_corridor",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_rag_corridor",
          name: "Back to Rag Corridor",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_music_box_alcove",
          name: "The Far End",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "clinical_corridor",
          dangerRating: 2
        },
        {
          targetLocationId: "loc_vb_antechamber",
          name: "The Continuing Corridor",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "clinical_corridor",
          dangerRating: 2,
          requiresFlag: "hallway_explored"
        }
      ],
      narrative: {
        firstVisit: "You stand at the threshold of a long hallway covered in faded floral carpet. A loose paper rests upon the rug. A human-like entity darts across the dividing archway and vanishes into thin air.",
        subsequentVisit: "The long hallway stretches forward quietly. The carpet muffles your footsteps."
      },
      presentItems: ["item_vb_journal_pets"],
      hiddenSpots: [
        {
          id: "spot_carpet_seam",
          name: "Folded Carpet Seam",
          dc: 10,
          text: "Lifting the edge of the moldy carpet exposes a sterile bandage cloth.",
          outcome: { giveItem: "item_vb_bandage_cloth", awardXP: 15 }
        },
        {
          id: "spot_hallway_sconce",
          name: "Sconce Bracket",
          dc: 12,
          text: "Behind the rusted wall sconce rests a cluster of popped glass shards.",
          outcome: { giveItem: "mat_vb_glass_shard", awardXP: 20 }
        }
      ],
      contextActions: [
        {
          id: "act_read_pet_journal",
          category: "Exploration & Investigation",
          title: "Read Found Journal Paper",
          desc: "Read the handwritten page regarding Bella and Braxton.",
          badge: "Memory",
          type: "primary-quest-action",
          requiresNotFlag: "pet_journal_read",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "wisdom",
            dc: 8,
            name: "Diary Decryption",
            success: {
              transcript: { speaker: "Memory", text: "You recognize your own handwriting immediately. The childhood memory of butchering Bella and Braxton in the upstairs bathtub to teach your parents a lesson. Good memories.", style: "entry-discovery" },
              setFlags: { pet_journal_read: true },
              awardXP: 30
            },
            failure: {
              transcript: { speaker: "Memory", text: "The words describe the blade sliding around the neck of the barking dog. A neat message.", style: "entry-prose" },
              setFlags: { pet_journal_read: true }
            }
          }
        }
      ]
    },
    {
      id: "loc_vb_music_box_alcove",
      name: "The Music Box Alcove",
      region: "The Shifting Loop",
      recommendedLevel: 2,
      coordinates: { x: 575, y: 80 },
      terrain: "clinical_corridor",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_first_hallway",
          name: "Return Down Hallway",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "clinical_corridor",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "A dead end. Where the cloud of ash and embers collapsed, an ornate wind-up music box sits in dead silence upon the floorboards.",
        subsequentVisit: "The dead end alcove is silent. Ash dust clings to the plaster molding."
      },
      presentItems: ["item_vb_music_box"],
      hiddenSpots: [
        {
          id: "spot_alcove_ash",
          name: "Ash Heap",
          dc: 10,
          text: "Scooping up the residue where the cloud vanished yields ash dust.",
          outcome: { giveItem: "mat_vb_ash_dust", awardXP: 15 }
        }
      ]
    },
    {
      id: "loc_vb_antechamber",
      name: "The Two-Door Antechamber",
      region: "The Countdown Hub",
      recommendedLevel: 2,
      coordinates: { x: 440, y: 260 },
      terrain: "shifting_room",
      restSafety: "wild",
      connections: [
        {
          targetLocationId: "loc_vb_first_hallway",
          name: "Back to Long Hallway",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "clinical_corridor",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_kitchen",
          name: "The Left Doorway",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 2
        },
        {
          targetLocationId: "loc_vb_maze_entry",
          name: "The Right Doorway",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 2,
          requiresFlag: "countdown_viii_reached"
        },
        {
          targetLocationId: "loc_vb_gut_room",
          name: "The Blood-Stained Door",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 2,
          requiresFlag: "countdown_vii_reached"
        },
        {
          targetLocationId: "loc_vb_green_chair_room",
          name: "The Threshold of the Chair",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 3,
          requiresFlag: "countdown_vi_reached"
        }
      ],
      narrative: {
        firstVisit: "You enter a square room with two closed doors. On the central wall, freshly daubed in wet crimson fluid, is a Roman numeral: IX. Below it is written in neat script: 'Nine.'",
        subsequentVisit: "The central antechamber remains the axis of the space. The Roman numerals on the plaster wall mark your progress through the rooms."
      },
      presentNPCs: ["npc_vb_the_witness"],
      hiddenSpots: [
        {
          id: "spot_antechamber_floor",
          name: "Warped Floor Tile",
          dc: 11,
          text: "Lifting the creaking tile uncovers a small iron key stamped with the letter A.",
          outcome: { giveItem: "item_vb_iron_key_a", awardXP: 25 }
        },
        {
          id: "spot_antechamber_cornice",
          name: "Overhead Cornice",
          dc: 13,
          text: "Reaching into the shadow above the doorframe reveals a clarity crystal shard.",
          outcome: { giveItem: "mat_vb_clarity_crystal", awardXP: 30 }
        }
      ],
      contextActions: [
        {
          id: "act_inspect_roman_numeral",
          category: "Exploration & Investigation",
          title: "Examine Crimson Numeral",
          desc: "Inspect the freshly painted Roman numerals on the central wall.",
          badge: "Observation",
          type: "primary-quest-action",
          requiresNotFlag: "numeral_examined",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "intelligence",
            dc: 9,
            name: "Numeral Analysis",
            success: {
              transcript: { speaker: "Analysis", text: "The substance is human blood. Creative. The numeral represents a countdown: IX, VIII, VII...", style: "entry-discovery" },
              setFlags: { numeral_examined: true, countdown_active: true },
              startQuest: "quest_vb_the_countdown",
              awardXP: 30
            },
            failure: {
              transcript: { speaker: "Analysis", text: "Fresh blood. It smells metallic and sharp.", style: "entry-prose" },
              setFlags: { numeral_examined: true, countdown_active: true },
              startQuest: "quest_vb_the_countdown"
            }
          }
        }
      ]
    },
    {
      id: "loc_vb_kitchen",
      name: "The Empty Dark Kitchen",
      region: "The Countdown Hub",
      recommendedLevel: 2,
      coordinates: { x: 290, y: 260 },
      terrain: "shifting_room",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_antechamber",
          name: "Return to Antechamber",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_dining_room",
          name: "The Wall that Vanished",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 2,
          requiresFlag: "kitchen_lights_restored"
        }
      ],
      narrative: {
        firstVisit: "You step into a dark kitchen. A long countertop stands in the gloom. An entity sprints past the refrigerator door and vanishes into shadow. On the kitchen table lies a 35mm film reel.",
        subsequentVisit: "The kitchen is quiet. The hum of an unpowered refrigerator vibrates faintly through the tile floor."
      },
      presentItems: ["item_vb_film_reel"],
      hiddenSpots: [
        {
          id: "spot_kitchen_cupboard",
          name: "Under-Sink Cupboard",
          dc: 10,
          text: "Searching the cupboard yields a heavy iron key stamped with the letter C.",
          outcome: { giveItem: "item_vb_iron_key_c", awardXP: 25 }
        }
      ],
      contextActions: [
        {
          id: "act_investigate_kitchen_lights",
          category: "Exploration & Investigation",
          title: "Restore Kitchen Lights",
          desc: "Investigate the light switch beside the film reel table.",
          badge: "Investigation",
          type: "primary-quest-action",
          requiresNotFlag: "kitchen_lights_restored",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "intelligence",
            dc: 10,
            name: "Electrical Inspection",
            success: {
              transcript: { speaker: "Discovery", text: "The light pops loudly, casting the room into pitch black before blazing back on. A wall has vanished, revealing a dining room with three mirrors!", style: "entry-discovery" },
              setFlags: { kitchen_lights_restored: true },
              awardXP: 35
            },
            failure: {
              transcript: { speaker: "Observation", text: "The switch sparks, and after a moment of darkness, the adjoining wall dissolves into a dining room.", style: "entry-prose" },
              setFlags: { kitchen_lights_restored: true }
            }
          }
        }
      ]
    },
    {
      id: "loc_vb_dining_room",
      name: "The Chairless Dining Hall",
      region: "The Countdown Hub",
      recommendedLevel: 2,
      coordinates: { x: 160, y: 360 },
      terrain: "shifting_room",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_kitchen",
          name: "Back to Kitchen",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_antechamber",
          name: "Corner Exit Doorway",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "A long mahogany dining table covered in a green tablecloth sits in the center of the room. Curiously, there are no chairs whatsoever. Along the wall hang three large ornate mirrors.",
        subsequentVisit: "The green tablecloth hangs down to the floorboards. The three wall mirrors reflect your solitary, clinical silhouette."
      },
      hiddenSpots: [
        {
          id: "spot_dining_mirror_frame",
          name: "Behind Center Mirror",
          dc: 11,
          text: "Reaching behind the glass frame reveals an empty medicine vial.",
          outcome: { giveItem: "item_vb_glass_vial", awardXP: 15 }
        }
      ]
    },
    {
      id: "loc_vb_maze_entry",
      name: "The Wood-Paneled Ante-Room",
      region: "The Labyrinth of Panels",
      recommendedLevel: 2,
      coordinates: { x: 560, y: 260 },
      terrain: "dark_passage",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_antechamber",
          name: "Back to Two-Door Antechamber",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_maze_corridor",
          name: "The Narrow Gap Hallway",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 2
        }
      ],
      narrative: {
        firstVisit: "A small, well-lit room covered entirely in dark wooden paneling. At first glance it appears to be a dead end, until you close the entry door and notice an open gap above the ceiling continuing around a left corner.",
        subsequentVisit: "The smell of aged varnish and cedar paneling fills the small chamber."
      },
      hiddenSpots: [
        {
          id: "spot_panel_catch",
          name: "Concealed Wood Latch",
          dc: 11,
          text: "Pressing the wood knot releases a spring-loaded slot with void ash.",
          outcome: { giveItem: "mat_vb_void_ash", awardXP: 15 }
        }
      ]
    },
    {
      id: "loc_vb_maze_corridor",
      name: "The Branching Labyrinth Corridor",
      region: "The Labyrinth of Panels",
      recommendedLevel: 2,
      coordinates: { x: 630, y: 360 },
      terrain: "dark_passage",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_maze_entry",
          name: "Back to Maze Entry",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_maze_dead_end",
          name: "First Branch (Right)",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_maze_zig_zag",
          name: "Second Branch (Zig-Zag Path)",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 2
        }
      ],
      narrative: {
        firstVisit: "You stand staring down a long, branching corridor with multiple paths. The lights pop and return without alteration. One way in, one way out. You are inside a maze.",
        subsequentVisit: "The paneled corridors branch left and right with disorienting geometric precision."
      },
      hiddenSpots: [
        {
          id: "spot_corridor_wainscot",
          name: "Loose Wainscot Panel",
          dc: 12,
          text: "Prying back the panel exposes a bundle of sterile bandage cloth.",
          outcome: { giveItem: "item_vb_bandage_cloth", awardXP: 20 }
        }
      ]
    },
    {
      id: "loc_vb_maze_dead_end",
      name: "The Looping Dead End",
      region: "The Labyrinth of Panels",
      recommendedLevel: 2,
      coordinates: { x: 630, y: 185 },
      terrain: "dark_passage",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_maze_corridor",
          name: "Return to Main Branch",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "You follow the right branch into a small rectangular room. When you turn around, the hallway you entered from is gone - replaced by a solid blank wall.",
        subsequentVisit: "The small rectangular dead end sits motionless in the dim light."
      },
      hiddenSpots: [
        {
          id: "spot_dead_end_bracket",
          name: "Corner Molding",
          dc: 11,
          text: "A sharp glass shard is wedged into the corner molding.",
          outcome: { giveItem: "mat_vb_glass_shard", awardXP: 15 }
        }
      ]
    },
    {
      id: "loc_vb_maze_zig_zag",
      name: "The Zig-Zag Hallway",
      region: "The Labyrinth of Panels",
      recommendedLevel: 2,
      coordinates: { x: 590, y: 455 },
      terrain: "dark_passage",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_maze_corridor",
          name: "Back to Branching Fork",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_maze_chamber",
          name: "The Exit Corridor",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 2
        }
      ],
      narrative: {
        firstVisit: "A strange zig-zag path turns sharply through blind right-angle corners. As you navigate the angles, vivid memories of the clinic reception and deceived patients flood your mind.",
        subsequentVisit: "The zig-zag corridor turns sharply through the wood-paneled gloom."
      },
      hiddenSpots: [
        {
          id: "spot_zigzag_corner",
          name: "Blind Angle Niche",
          dc: 12,
          text: "Behind the sharp turn lies a pool of congealed void resin.",
          outcome: { giveItem: "mat_vb_void_resin", awardXP: 20 }
        }
      ]
    },
    {
      id: "loc_vb_maze_chamber",
      name: "The Labyrinth Exit Chamber",
      region: "The Labyrinth of Panels",
      recommendedLevel: 2,
      coordinates: { x: 480, y: 455 },
      terrain: "shifting_room",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_maze_zig_zag",
          name: "Back into Zig-Zag Corridor",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "dark_passage",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_antechamber",
          name: "Door Back to Antechamber",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "You emerge from the zig-zag turns into a small chamber with a single wooden door. Beyond this door, you can hear the faint hum of the two-door antechamber.",
        subsequentVisit: "The exit chamber stands quiet. The door opens cleanly back into the central room."
      },
      presentItems: ["item_vb_iron_key_a"],
      hiddenSpots: [
        {
          id: "spot_chamber_crevice",
          name: "Threshold Crevice",
          dc: 11,
          text: "Beneath the threshold plate lies a small vial of ash dust.",
          outcome: { giveItem: "mat_vb_ash_dust", awardXP: 15 }
        }
      ]
    },
    {
      id: "loc_vb_gut_room",
      name: "The Visceral Chamber",
      region: "The Macabre Reaches",
      recommendedLevel: 3,
      coordinates: { x: 440, y: 380 },
      terrain: "memory_space",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_antechamber",
          name: "Back to Antechamber",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_gut_expanded",
          name: "The Expanded Chamber",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 2,
          requiresFlag: "gut_lights_restored"
        }
      ],
      narrative: {
        firstVisit: "You step into the room and hear a wet, squishing sound beneath your sole. Blood coats the walls, visceral matter covers the floor, and dark droplets drip rhythmically from the ceiling. Someone played and did not clean up afterward.",
        subsequentVisit: "The metallic odor of drying blood clings heavily to the plaster and floorboards."
      },
      hiddenSpots: [
        {
          id: "spot_gut_floor_crack",
          name: "Under Organic Coil",
          dc: 12,
          text: "Clearing aside cold matter exposes blood-tempered iron.",
          outcome: { giveItem: "mat_vb_blood_iron", awardXP: 25 }
        }
      ],
      contextActions: [
        {
          id: "act_survey_visceral_scene",
          category: "Exploration & Investigation",
          title: "Survey Anatomical Scene",
          desc: "Methodically inspect the arrangement of severed matter and dripping fluids.",
          badge: "Investigation",
          type: "primary-quest-action",
          requiresNotFlag: "gut_scene_surveyed",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "wisdom",
            dc: 11,
            name: "Anatomical Survey",
            success: {
              transcript: { speaker: "Clinical Analysis", text: "Inefficient technique. Tying the torso and face down with intestines works far better when stuffing guts back inside. The lights pop and the room enlarges dramatically.", style: "entry-discovery" },
              setFlags: { gut_scene_surveyed: true, gut_lights_restored: true },
              awardXP: 35
            },
            failure: {
              transcript: { speaker: "Observation", text: "Untidy craftsmanship. The lights flicker and the room extends backward.", style: "entry-prose" },
              setFlags: { gut_scene_surveyed: true, gut_lights_restored: true }
            }
          }
        }
      ]
    },
    {
      id: "loc_vb_gut_expanded",
      name: "The Expanded Dissection Hall",
      region: "The Macabre Reaches",
      recommendedLevel: 3,
      coordinates: { x: 350, y: 480 },
      terrain: "memory_space",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_gut_room",
          name: "Back to Visceral Chamber",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_antechamber",
          name: "The Corner Doorway",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "The enlarged expanse of the room stretches into cold shadow. More blood-covered walls and surgical debris. In the center rests a heavy key stamped with the letter B.",
        subsequentVisit: "The vast dissection chamber stands silent. The corner door leads back to the antechamber."
      },
      presentItems: ["item_vb_iron_key_b"],
      hiddenSpots: [
        {
          id: "spot_expanded_gut_drain",
          name: "Floor Drainage Gutter",
          dc: 12,
          text: "Searching the gutter turns up an intact medication bottle.",
          outcome: { giveItem: "item_vb_med_bottle_full", awardXP: 30 }
        },
        {
          id: "spot_expanded_gut_hook",
          name: "Overhead Meat Hook",
          dc: 13,
          text: "Unfastening a rusted iron hook from the beam provides a brutal off-hand weapon.",
          outcome: { giveItem: "item_vb_iron_hook", awardXP: 25 }
        }
      ]
    },
    {
      id: "loc_vb_green_chair_room",
      name: "Chamber of the Green Armchair",
      region: "The Memory Corridors",
      recommendedLevel: 3,
      coordinates: { x: 285, y: 395 },
      terrain: "memory_space",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_antechamber",
          name: "Back to Antechamber",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_clinic_lobby",
          name: "The Institutional Door",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "clinical_corridor",
          dangerRating: 2,
          requiresFlag: "green_chair_examined"
        },
        {
          targetLocationId: "loc_vb_bathtub_room",
          name: "The White Tiled Hall",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 2,
          requiresFlag: "clinic_lobby_explored"
        },
        {
          targetLocationId: "loc_vb_mirror_hall",
          name: "The Hall of Reflections",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 2,
          requiresFlag: "bathtub_explored"
        }
      ],
      narrative: {
        firstVisit: "Just visible in the dim light ahead sits a single armchair upholstered in rich green fabric with an ornate golden wooden frame. It faces away from you toward three closed doors.",
        subsequentVisit: "The green armchair rests upon the floorboards like an empty throne awaiting an occupant."
      },
      hiddenSpots: [
        {
          id: "spot_chair_cushion",
          name: "Beneath Chair Cushion",
          dc: 11,
          text: "Reaching between the golden frame cushions reveals a clarity crystal.",
          outcome: { giveItem: "mat_vb_clarity_crystal", awardXP: 25 }
        }
      ],
      contextActions: [
        {
          id: "act_inspect_green_chair",
          category: "Exploration & Investigation",
          title: "Examine Green Armchair",
          desc: "Inspect the gilded frame and emerald upholstery of the solitary chair.",
          badge: "Observation",
          type: "primary-quest-action",
          requiresNotFlag: "green_chair_examined",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "wisdom",
            dc: 10,
            name: "Chair Inspection",
            success: {
              transcript: { speaker: "Discovery", text: "The upholstery is pristine. Carved into the golden armrest are tiny Roman numerals counting from IX to zero. The door to the clinic lobby unlocks.", style: "entry-discovery" },
              setFlags: { green_chair_examined: true },
              awardXP: 30
            },
            failure: {
              transcript: { speaker: "Observation", text: "The chair smells faintly of antiseptic and leather.", style: "entry-prose" },
              setFlags: { green_chair_examined: true }
            }
          }
        }
      ]
    },
    {
      id: "loc_vb_clinic_lobby",
      name: "The Psychiatric Clinic Lobby",
      region: "The Memory Corridors",
      recommendedLevel: 3,
      coordinates: { x: 165, y: 475 },
      terrain: "clinical_corridor",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_green_chair_room",
          name: "Back to Green Armchair",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_filing_room",
          name: "Records Archive Room",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "clinical_corridor",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "Fluorescent tubes hum overhead, illuminating an institutional reception lobby. Behind the desk sits the receptionist, while an agitated man in a rumpled suit paces nervously clutching a dispatch notice.",
        subsequentVisit: "The reception lobby hums with sterile fluorescent light. Orderlies stand silently by the frosted glass doors."
      },
      presentNPCs: ["npc_vb_the_father", "npc_vb_the_intern", "npc_vb_receptionist"],
      hiddenSpots: [
        {
          id: "spot_reception_tray",
          name: "Intake Document Tray",
          dc: 11,
          text: "Sorting through intake forms reveals an unissued Self-Admission Contract.",
          outcome: { giveItem: "item_vb_admissions_form", awardXP: 25 }
        }
      ]
    },
    {
      id: "loc_vb_filing_room",
      name: "The Records & Archive Room",
      region: "The Memory Corridors",
      recommendedLevel: 3,
      coordinates: { x: 80, y: 555 },
      terrain: "clinical_corridor",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_clinic_lobby",
          name: "Back to Clinic Lobby",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "clinical_corridor",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "Floor-to-ceiling olive-drab iron filing cabinets line the walls. Behind a desk stacked high with manila folders sits the Archivist, methodically stamping patient commitment forms.",
        subsequentVisit: "The filing room smells of dry paper, ink, and iron drawers."
      },
      presentNPCs: ["npc_vb_the_archivist"],
      presentItems: ["item_vb_case_file_001", "item_vb_case_file_father", "item_vb_admissions_form"],
      hiddenSpots: [
        {
          id: "spot_filing_cabinet_top",
          name: "Top of Cabinet 14",
          dc: 12,
          text: "Searching the dusty cabinet top reveals a forgotten full medication bottle.",
          outcome: { giveItem: "item_vb_med_bottle_full", awardXP: 25 }
        },
        {
          id: "spot_filing_drawer_false",
          name: "False Drawer Bottom",
          dc: 14,
          text: "Prying up the false metal bottom uncovers an entity ward charm.",
          outcome: { giveItem: "item_vb_entity_ward", awardXP: 35 }
        }
      ]
    },
    {
      id: "loc_vb_bathtub_room",
      name: "The Up-Stairs Tiled Bathroom",
      region: "The Memory Corridors",
      recommendedLevel: 3,
      coordinates: { x: 185, y: 575 },
      terrain: "memory_space",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_green_chair_room",
          name: "Back to Green Armchair",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 1
        }
      ],
      narrative: {
        firstVisit: "White subway tiles line the cold room. In the center sits an enameled clawfoot bathtub stained with rusty brown streaks. On the edge of the sink rests a handwritten diary and an open medicine cabinet.",
        subsequentVisit: "The porcelain bathtub stands cold and hollow under the single dangling bulb."
      },
      presentItems: ["item_vb_shaving_blade", "item_vb_journal_methodology"],
      hiddenSpots: [
        {
          id: "spot_sink_cabinet",
          name: "Medicine Cabinet",
          dc: 10,
          text: "Inside the mirrored cabinet behind the mirror lies the father's shaving blade.",
          outcome: { giveItem: "item_vb_shaving_blade", awardXP: 30 }
        }
      ],
      contextActions: [
        {
          id: "act_examine_clawfoot_tub",
          category: "Exploration & Investigation",
          title: "Inspect Clawfoot Bathtub",
          desc: "Examine the stains and drainage pipe of the childhood tub.",
          badge: "Memory",
          type: "primary-quest-action",
          requiresNotFlag: "tub_examined",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "wisdom",
            dc: 9,
            name: "Bathtub Recall",
            success: {
              transcript: { speaker: "Memory", text: "You remember pressing Bella down with your left hand while drawing the blade in a slow curve around her neck. She made a terrible noise. Braxton was quieter.", style: "entry-discovery" },
              setFlags: { tub_examined: true, bathtub_explored: true },
              startQuest: "quest_vb_the_dogs",
              awardXP: 35
            },
            failure: {
              transcript: { speaker: "Memory", text: "The rusted enamel carries the ghost of canine blood.", style: "entry-prose" },
              setFlags: { tub_examined: true, bathtub_explored: true },
              startQuest: "quest_vb_the_dogs"
            }
          }
        }
      ]
    },
    {
      id: "loc_vb_mirror_hall",
      name: "The Hall of Fractured Mirrors",
      region: "The Memory Corridors",
      recommendedLevel: 4,
      coordinates: { x: 360, y: 540 },
      terrain: "shifting_room",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_green_chair_room",
          name: "Back to Green Armchair",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_the_void",
          name: "Into the Void Abyss",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "void_space",
          dangerRating: 3
        }
      ],
      narrative: {
        firstVisit: "A gallery lined with cracked, full-length mirrors. Your reflection walks independently across several panes, holding razors and contracts while regarding you with cold curiosity.",
        subsequentVisit: "The mirror hall hums with optical dissonance. Your reflection mimics your every motion perfectly once more."
      },
      presentItems: ["item_vb_void_crystal"],
      hiddenSpots: [
        {
          id: "spot_mirror_crack",
          name: "Shattered Mirror Panes",
          dc: 12,
          text: "Prying loose a jagged pane yields a pristine void crystal shard.",
          outcome: { giveItem: "mat_vb_clarity_crystal", awardXP: 30 }
        }
      ]
    },
    {
      id: "loc_vb_the_void",
      name: "The Edge of the Void Abyss",
      region: "The Inevitable End",
      recommendedLevel: 4,
      coordinates: { x: 480, y: 540 },
      terrain: "void_space",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_mirror_hall",
          name: "Back to Mirror Hall",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1
        },
        {
          targetLocationId: "loc_vb_judgment_hall",
          name: "The Doorway to Judgment",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "memory_space",
          dangerRating: 4,
          requiresFlag: "countdown_zero_reached"
        }
      ],
      narrative: {
        firstVisit: "The corridor floor drops away into an infinite, starless abyss. At the precipice stands the translucent figure of a young woman, weeping softly into her hands.",
        subsequentVisit: "The cold wind of the void rises from the drop. Ahead stands the massive double door leading to the final judgment."
      },
      presentNPCs: ["npc_vb_the_girl"],
      presentItems: ["item_vb_the_verdict_key"],
      hiddenSpots: [
        {
          id: "spot_void_precipice",
          name: "Chasm Ledge",
          dc: 13,
          text: "Anchored to the stone ledge is a heavy void-stained trenchcoat.",
          outcome: { giveItem: "item_vb_void_coat", awardXP: 30 }
        }
      ]
    },
    {
      id: "loc_vb_judgment_hall",
      name: "The Hall of the Final Verdict",
      region: "The Inevitable End",
      recommendedLevel: 5,
      coordinates: { x: 590, y: 540 },
      terrain: "memory_space",
      restSafety: "forbidden",
      connections: [
        {
          targetLocationId: "loc_vb_the_void",
          name: "Back to Void Edge",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "void_space",
          dangerRating: 2
        },
        {
          targetLocationId: "loc_vb_waking_room",
          name: "The First Door, Again",
          distanceKm: 0.1,
          travelHours: 0.1,
          staminaCost: 1,
          terrain: "shifting_room",
          dangerRating: 1,
          requiresFlag: "verdict_given"
        }
      ],
      narrative: {
        firstVisit: "An immense, windowless amphitheater lined with empty benches. Crimson numerals burn on all four walls: IX through I, descending to zero. In the center rests the green armchair, surrounded by swirling ash.",
        subsequentVisit: "The amphitheater is silent. The entity has dissolved. At the far end of the hall, a solitary door stands open, leading back into the empty room where you first awoke."
      },
      hiddenSpots: [
        {
          id: "spot_judgment_altar",
          name: "Center Armchair Pedestal",
          dc: 12,
          text: "Beneath the gilded pedestal lies a cache of refined clarity tonics.",
          outcome: { giveItem: "item_vb_clarity_tonic", awardXP: 35 }
        }
      ],
      contextActions: [
        {
          id: "act_summon_final_verdict",
          category: "The Reckoning",
          title: "Sit upon the Green Armchair",
          desc: "Take your seat in the gilded chair and accept the final accounting.",
          badge: "Climax",
          type: "primary-quest-action",
          requiresNotFlag: "verdict_encounter_ready",
          handlerType: "skill_check",
          skillCheck: {
            skill: "investigation",
            attribute: "wisdom",
            dc: 10,
            name: "Final Reckoning",
            success: {
              transcript: { speaker: "The Verdict", text: "You sit upon the green fabric. The crimson numerals flare blinding white. The room screams as the collective weight of your deeds condenses into physical form!", style: "entry-discovery" },
              setFlags: { verdict_encounter_ready: true },
              startQuest: "quest_vb_the_verdict",
              awardXP: 50
            },
            failure: {
              transcript: { speaker: "The Verdict", text: "You sit upon the chair. The room assembles its reckoning.", style: "entry-prose" },
              setFlags: { verdict_encounter_ready: true },
              startQuest: "quest_vb_the_verdict"
            }
          }
        }
      ]
    }
  ]
};

writeJson(path.join(WORLD_DIR, 'locations.json'), locations);


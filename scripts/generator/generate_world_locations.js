// scripts/generator/generate_world_locations.js
// Generates locations.json, interactive_objects.json, puzzles.json for The Northern Realms.
// Adheres strictly to: NO em dashes (U+2014), strict coordinate pairs, bidirectional connectivity,
// valid restSafety strings, actions referencing real items and loot tables.

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
// 1. LOCATIONS (25 Locations across 5 distinct regions)
// -------------------------------------------------------------
const locations = {
  locations: [
    // REGION 1: VALENFROST HIGHLANDS (Central/Eastern Hold)
    {
      id: "loc_nr_valenfrost_gates",
      name: "Gates of Valenfrost",
      region: "Valenfrost Highlands",
      terrain: "paved_road",
      coordinates: { x: 420, y: 350 },
      recommendedLevel: 1,
      restSafety: "settlement",
      narrative: {
        overview: "Twin towering ramparts of dark granite flank the outer gate of Valenfrost. Pennants of the roaring white wolf snap in the freezing wind as huscarl guards scrutinize arriving merchant sleighs and travellers.",
        shortDescription: "The fortified threshold to the capital hold of Valenfrost."
      },
      connections: [
        { targetLocationId: "loc_nr_valenfrost_hall", name: "Hearthway Boulevard", distanceKm: 0.8, travelHours: 0.25, staminaCost: 1, dangerRating: 0 },
        { targetLocationId: "loc_nr_valenfrost_market", name: "Lower Gate Alley", distanceKm: 0.5, travelHours: 0.15, staminaCost: 1, dangerRating: 0 },
        { targetLocationId: "loc_nr_pine_crossroads", name: "Highland King's Road", distanceKm: 8.0, travelHours: 2.0, staminaCost: 5, dangerRating: 1 }
      ],
      actions: [
        {
          id: "act_nr_inspect_gate_banner",
          label: "Examine the Clan Banners",
          actionType: "examine",
          skillCheck: { skill: "mythology_lore", attribute: "intelligence", difficulty: 10 },
          successOutcome: {
            text: "You study the faded silver stitching on the heavy wool banner. It displays the lineage of High King Valen and his covenant with the Thunder-Father Torvald.",
            setFlags: { inspected_valen_banner: true }
          },
          failureOutcome: {
            text: "Heavy woolen heraldry flapping against freezing stones. A huscarl gives you a stern glance.",
            setFlags: { inspected_valen_banner: true }
          }
        }
      ],
      presentNPCs: ["npc_nr_gate_captain_tor"],
      presentItems: ["item_nr_mountain_torch"]
    },
    {
      id: "loc_nr_valenfrost_hall",
      name: "High Mead-Hall of Jarl Sigurd",
      region: "Valenfrost Highlands",
      terrain: "paved_road",
      coordinates: { x: 430, y: 330 },
      recommendedLevel: 1,
      restSafety: "sanctuary",
      narrative: {
        overview: "Massive timber roof beams carved in dragon-head motifs arch over a blazing central fire-trench. Benches of scarred oak line the hall where veteran huscarls quaff juniper mead and trade tales of troll-slaying.",
        shortDescription: "The grand timber seat of power in Valenfrost."
      },
      connections: [
        { targetLocationId: "loc_nr_valenfrost_gates", name: "Great Gate Steps", distanceKm: 0.8, travelHours: 0.25, staminaCost: 1, dangerRating: 0 },
        { targetLocationId: "loc_nr_valenfrost_barracks", name: "Armory Corridor", distanceKm: 0.4, travelHours: 0.15, staminaCost: 1, dangerRating: 0 }
      ],
      actions: [
        {
          id: "act_nr_warm_by_hearth",
          label: "Warm Hands at the Great Hearth",
          actionType: "interact",
          outcome: {
            text: "The crackling roar of dry spruce logs soothes the biting chill from your fingers. The sweet scent of burning pine resin invigorates your spirit.",
            modifyVitals: { stamina: 8, morale: 2 }
          }
        }
      ],
      presentNPCs: ["npc_nr_jarl_sigurd", "npc_nr_skald_einar"],
      presentItems: ["item_nr_spiced_mead_flagon"]
    },
    {
      id: "loc_nr_valenfrost_market",
      name: "Valenfrost Trade Plaza",
      region: "Valenfrost Highlands",
      terrain: "paved_road",
      coordinates: { x: 440, y: 360 },
      recommendedLevel: 1,
      restSafety: "settlement",
      narrative: {
        overview: "A bustling open-air stone square crowded with canvas stalls. Blacksmiths hammer glowing river-iron, furriers barter snow-fox skins, and fishmongers sell dried fjord salmon in pungent crates.",
        shortDescription: "The bustling commerce center of the northern hold."
      },
      connections: [
        { targetLocationId: "loc_nr_valenfrost_gates", name: "North Gateway", distanceKm: 0.5, travelHours: 0.15, staminaCost: 1, dangerRating: 0 },
        { targetLocationId: "loc_nr_valenfrost_smithy", name: "Anvil Way", distanceKm: 0.3, travelHours: 0.1, staminaCost: 1, dangerRating: 0 }
      ],
      actions: [
        {
          id: "act_nr_listen_town_rumours",
          label: "Listen to Caravan Gossip",
          actionType: "interact",
          skillCheck: { skill: "investigation", attribute: "intelligence", difficulty: 11 },
          successOutcome: {
            text: "Caravan guards speak in hushed whispers about blue fires seen dancing atop Mount Wyrmfang and draugr stirring in the southern barrows.",
            setFlags: { heard_wyrmfang_rumour: true }
          },
          failureOutcome: {
            text: "Merchants grumble endlessly about rising timber tolls and the bitter price of salt.",
            setFlags: { heard_wyrmfang_rumour: false }
          }
        }
      ],
      presentNPCs: ["npc_nr_merchant_ Astrid"],
      presentItems: []
    },
    {
      id: "loc_nr_valenfrost_smithy",
      name: "The Hearth & Anvil Smithy",
      region: "Valenfrost Highlands",
      terrain: "paved_road",
      coordinates: { x: 450, y: 370 },
      recommendedLevel: 1,
      restSafety: "settlement",
      narrative: {
        overview: "Thick billows of charcoal smoke pour from twin stone chimneys. Master smith Bjorn stands before a glowing coal forge, striking sparks from an iron broadsword blade with rhythmic clangs.",
        shortDescription: "The premier weaponsmith and armor workshop of Valenfrost."
      },
      connections: [
        { targetLocationId: "loc_nr_valenfrost_market", name: "Plaza Arches", distanceKm: 0.3, travelHours: 0.1, staminaCost: 1, dangerRating: 0 }
      ],
      actions: [
        {
          id: "act_nr_use_forge",
          label: "Use the Workshop Anvil",
          actionType: "interact",
          outcome: {
            text: "The coals glow bright red. You feel the radiant heat ready for tempering blades and shaping shields.",
            setFlags: { visited_forge: true }
          }
        }
      ],
      presentNPCs: ["npc_nr_smith_bjorn"],
      presentItems: ["mat_nr_bog_iron"]
    },
    {
      id: "loc_nr_valenfrost_barracks",
      name: "Huscarl Barracks & Armory",
      region: "Valenfrost Highlands",
      terrain: "paved_road",
      coordinates: { x: 410, y: 320 },
      recommendedLevel: 1,
      restSafety: "settlement",
      narrative: {
        overview: "Racks of ash spears, roundshields, and banded ringmail line the stone walls. Off-duty warriors spar with wooden wasters while sparring instructors bark commands.",
        shortDescription: "The martial quarters of the sworn hold defenders."
      },
      connections: [
        { targetLocationId: "loc_nr_valenfrost_hall", name: "Hall Entryway", distanceKm: 0.4, travelHours: 0.15, staminaCost: 1, dangerRating: 0 }
      ],
      actions: [
        {
          id: "act_nr_inspect_training_dummies",
          label: "Examine Sparring Stances",
          actionType: "examine",
          outcome: {
            text: "You observe veteran huscarls practicing their shield-overlap technique to deflect overhead axe blows.",
            awardXP: 10
          }
        }
      ],
      presentNPCs: ["npc_nr_veteran_karl"],
      presentItems: ["item_nr_mountain_whetstone"]
    },

    // REGION 2: WHISPERING WOODS & WILDERNESS (South-East Foothills)
    {
      id: "loc_nr_pine_crossroads",
      name: "Whispering Pines Crossroads",
      region: "Whispering Woods",
      terrain: "paved_road",
      coordinates: { x: 460, y: 440 },
      recommendedLevel: 1,
      restSafety: "wild",
      narrative: {
        overview: "Here the frozen road forks beneath enormous ancient pines heavy with snow. A weathered carved wooden wayside shrine to Skadi stands beside an overturned baggage cart.",
        shortDescription: "A central crossroads dividing the forest, the marshes, and the mountain pass."
      },
      connections: [
        { targetLocationId: "loc_nr_valenfrost_gates", name: "Northway to Valenfrost", distanceKm: 8.0, travelHours: 2.0, staminaCost: 5, dangerRating: 1 },
        { targetLocationId: "loc_nr_hunters_camp", name: "Forester's Trail", distanceKm: 6.0, travelHours: 1.5, staminaCost: 4, dangerRating: 1 },
        { targetLocationId: "loc_nr_mistglen_docks", name: "Southwest Marsh Causeway", distanceKm: 12.0, travelHours: 3.0, staminaCost: 7, dangerRating: 2 },
        { targetLocationId: "loc_nr_ancient_cairn", name: "Overgrown Barrow Track", distanceKm: 7.5, travelHours: 2.0, staminaCost: 6, dangerRating: 2 }
      ],
      actions: [
        {
          id: "act_nr_offer_pine_shrine",
          label: "Leave an Offering at Skadi's Shrine",
          actionType: "interact",
          conditions: [
            { type: "has_item", itemId: "item_nr_smoked_venison", quantity: 1 },
            { type: "flag", flag: "skadi_shrine_offered", expected: false }
          ],
          outcome: {
            text: "You place the smoked venison upon the frost-covered altar stone. A sudden breath of crisp winter air ruffles your cloak, carrying with it a sense of enduring vigor.",
            consumeItem: "item_nr_smoked_venison",
            modifyPiety: { deity: "skadi", amount: 2 },
            modifyVitals: { stamina: 10 },
            setFlags: { skadi_shrine_offered: true }
          }
        }
      ],
      presentNPCs: [],
      presentItems: ["mat_nr_hardened_pine"]
    },
    {
      id: "loc_nr_hunters_camp",
      name: "Ranger's Spruce Outpost",
      region: "Whispering Woods",
      terrain: "mountain_trail",
      coordinates: { x: 520, y: 480 },
      recommendedLevel: 1,
      restSafety: "settlement",
      narrative: {
        overview: "A cluster of stout log cabins tucked beneath the granite lee of a cliff. Stretched wolf hides cure on wooden frames and savory broth steams over an open fire pit.",
        shortDescription: "A secluded winter haven for forest trappers and guides."
      },
      connections: [
        { targetLocationId: "loc_nr_pine_crossroads", name: "Crossroads Path", distanceKm: 6.0, travelHours: 1.5, staminaCost: 4, dangerRating: 1 },
        { targetLocationId: "loc_nr_wolf_den_cavern", name: "Bloodied Wolf Tracks", distanceKm: 5.0, travelHours: 1.25, staminaCost: 4, dangerRating: 2 }
      ],
      actions: [
        {
          id: "act_nr_share_pot_stew",
          label: "Share the Ranger's Broth",
          actionType: "interact",
          outcome: {
            text: "You take a wooden bowl of hot marrow broth from the iron kettle. Warmth returns to your numb limbs.",
            modifyVitals: { health: 6, stamina: 6 }
          }
        }
      ],
      presentNPCs: ["npc_nr_trapper_ulf"],
      presentItems: ["item_nr_hard_tack_bread"]
    },
    {
      id: "loc_nr_wolf_den_cavern",
      name: "Howling Timber Cavern",
      region: "Whispering Woods",
      terrain: "limestone_cave",
      coordinates: { x: 570, y: 520 },
      recommendedLevel: 2,
      restSafety: "forbidden",
      narrative: {
        overview: "Gnawed deer bones and trampled snow litter the jagged mouth of this dark cavern. Low guttural growls echo from the gloom where the alpha white wolves nest.",
        shortDescription: "A dangerous predator lair hidden deep in the frozen taiga."
      },
      connections: [
        { targetLocationId: "loc_nr_hunters_camp", name: "Ranger Trail", distanceKm: 5.0, travelHours: 1.25, staminaCost: 4, dangerRating: 2 }
      ],
      actions: [
        {
          id: "act_nr_search_wolf_den",
          label: "Search the Bone Heap",
          actionType: "examine",
          skillCheck: { skill: "perception", attribute: "wisdom", difficulty: 12 },
          successOutcome: {
            text: "Beneath chewed ribcages, you find the dropped leather satchel of an unfortunate traveler.",
            giveItem: "item_nr_dwarven_lockpicks",
            awardXP: 20,
            setFlags: { searched_wolf_bones: true }
          },
          failureOutcome: {
            text: "Only sharp splintered bones and frozen mud.",
            setFlags: { searched_wolf_bones: true }
          }
        }
      ],
      presentNPCs: [],
      presentItems: ["mat_nr_wolf_pelt"]
    },
    {
      id: "loc_nr_ancient_cairn",
      name: "The Weeping Barrow Stones",
      region: "Whispering Woods",
      terrain: "rocky_scrubland",
      coordinates: { x: 490, y: 540 },
      recommendedLevel: 2,
      restSafety: "restricted",
      narrative: {
        overview: "Ringed by leaning megaliths encrusted with black lichen, a heavy slate slab seals the sunken threshold of an ancient burial cairn. A faint wailing draft sighs through the cracks.",
        shortDescription: "A haunted prehistoric tomb entrance from the First Age."
      },
      connections: [
        { targetLocationId: "loc_nr_pine_crossroads", name: "Barrow Track", distanceKm: 7.5, travelHours: 2.0, staminaCost: 6, dangerRating: 2 },
        { targetLocationId: "loc_nr_barrow_depths", name: "Descend into Barrow Crypt", distanceKm: 1.0, travelHours: 0.5, staminaCost: 3, dangerRating: 3 }
      ],
      actions: [
        {
          id: "act_nr_inspect_cairn_runes",
          label: "Read Runic Warning on Slate",
          actionType: "examine",
          skillCheck: { skill: "mythology_lore", attribute: "intelligence", difficulty: 11 },
          successOutcome: {
            text: "The archaic script reads: 'Here slumbers Skallagrim of the Black Shield. Woe unto those who wake the restless dead.'",
            setFlags: { read_barrow_warning: true }
          },
          failureOutcome: {
            text: "Weathered geometric scratches that make your scalp prickle with unease.",
            setFlags: { read_barrow_warning: false }
          }
        }
      ],
      presentNPCs: [],
      presentItems: []
    },
    {
      id: "loc_nr_barrow_depths",
      name: "Crypt of Chieftain Skallagrim",
      region: "Whispering Woods",
      terrain: "limestone_cave",
      coordinates: { x: 500, y: 570 },
      recommendedLevel: 3,
      restSafety: "forbidden",
      narrative: {
        overview: "Subterranean vaulted stone chambers chilled to freezing. Sarcophagi of dark slate line the corridor walls, their occupants holding rusted iron greataxes in cold, skeletal hands.",
        shortDescription: "The perilous inner tomb of the ancient draugr chieftain."
      },
      connections: [
        { targetLocationId: "loc_nr_ancient_cairn", name: "Ascend to Surface Cairn", distanceKm: 1.0, travelHours: 0.5, staminaCost: 3, dangerRating: 2 }
      ],
      actions: [
        {
          id: "act_nr_search_urns",
          label: "Inspect Funeral Urns",
          actionType: "examine",
          skillCheck: { skill: "investigation", attribute: "intelligence", difficulty: 13 },
          successOutcome: {
            text: "Inside a sealed bronze urn, you discover preserved grave-goods from the ancient kings.",
            giveItem: "item_nr_silver_chalice",
            awardXP: 25,
            setFlags: { searched_crypt_urns: true }
          },
          failureOutcome: {
            text: "Only gray funeral ashes and crumbling bone dust.",
            setFlags: { searched_crypt_urns: true }
          }
        }
      ],
      presentNPCs: [],
      presentItems: ["mat_nr_silver_ingot"]
    },

    // REGION 3: MISTGLEN FENS & CANALS (Western Waterlands)
    {
      id: "loc_nr_mistglen_docks",
      name: "Mistglen Stilt Docks",
      region: "Mistglen Fens",
      terrain: "swamp_marsh",
      coordinates: { x: 260, y: 460 },
      recommendedLevel: 2,
      restSafety: "settlement",
      narrative: {
        overview: "Wooden walkways built upon mossy pilings span the murky green waters of the fens. Flat-bottomed skiffs bump against cedar posts, and yellow oil lanterns glimmer weakly through perpetual mist.",
        shortDescription: "A damp water-village of fishermen, peat-cutters, and smugglers."
      },
      connections: [
        { targetLocationId: "loc_nr_pine_crossroads", name: "Causeway to Crossroads", distanceKm: 12.0, travelHours: 3.0, staminaCost: 7, dangerRating: 2 },
        { targetLocationId: "loc_nr_drowned_lantern_tavern", name: "Boardwalk to Tavern", distanceKm: 0.2, travelHours: 0.1, staminaCost: 1, dangerRating: 0 },
        { targetLocationId: "loc_nr_mire_causeway", name: "Deep Bog Track", distanceKm: 7.0, travelHours: 2.0, staminaCost: 6, dangerRating: 2 }
      ],
      actions: [
        {
          id: "act_nr_dredge_canal",
          label: "Dredge Canal Shallows",
          actionType: "interact",
          skillCheck: { skill: "athletics", attribute: "strength", difficulty: 11 },
          successOutcome: {
            text: "Your grappling hook pulls up a submerged crate dumped by smugglers.",
            giveItem: "item_nr_smoked_salmon",
            awardXP: 15,
            setFlags: { dredged_canal_crate: true }
          },
          failureOutcome: {
            text: "You dredge up only dripping riverweeds and foul-smelling peat mud.",
            setFlags: { dredged_canal_crate: false }
          }
        }
      ],
      presentNPCs: ["npc_nr_boatman_hagan"],
      presentItems: ["item_nr_smoked_salmon"]
    },
    {
      id: "loc_nr_drowned_lantern_tavern",
      name: "The Drowned Lantern Tavern",
      region: "Mistglen Fens",
      terrain: "paved_road",
      coordinates: { x: 250, y: 470 },
      recommendedLevel: 2,
      restSafety: "settlement",
      narrative: {
        overview: "A leaning two-story timber tavern smelling of fried pike, pipe tobacco, and damp wool. Shady figures in dark oilskin cloaks huddle in corner booths over copper tankards of bitter stout.",
        shortDescription: "The notorious watering hole and covert underworld haven."
      },
      connections: [
        { targetLocationId: "loc_nr_mistglen_docks", name: "Main Boardwalk", distanceKm: 0.2, travelHours: 0.1, staminaCost: 1, dangerRating: 0 },
        { targetLocationId: "loc_nr_cabal_cistern", name: "Cellar Trapdoor", distanceKm: 0.1, travelHours: 0.05, staminaCost: 1, dangerRating: 1 }
      ],
      actions: [
        {
          id: "act_nr_order_fen_ale",
          label: "Order Fen Bitter & Fried Salmon",
          actionType: "interact",
          outcome: {
            text: "A piping hot trencher of fried fish and salted greens restores your strength.",
            modifyVitals: { health: 8, stamina: 8 }
          }
        }
      ],
      presentNPCs: ["npc_nr_innkeeper_mira"],
      presentItems: []
    },
    {
      id: "loc_nr_cabal_cistern",
      name: "The Sunken Cistern Guildhall",
      region: "Mistglen Fens",
      terrain: "limestone_cave",
      coordinates: { x: 240, y: 490 },
      recommendedLevel: 2,
      restSafety: "restricted",
      narrative: {
        overview: "Beneath the tavern cellars lies a vaulted drainage cistern dating to the First Empire. Torches illuminate stolen rugs, lockbox testing stations, and the hideout of the Whispering Cabal.",
        shortDescription: "The covert subterranean headquarters of the thieves' guild."
      },
      connections: [
        { targetLocationId: "loc_nr_drowned_lantern_tavern", name: "Cellar Stairs Up", distanceKm: 0.1, travelHours: 0.05, staminaCost: 1, dangerRating: 1 }
      ],
      actions: [
        {
          id: "act_nr_inspect_cabal_maps",
          label: "Examine Smuggling Waterways Map",
          actionType: "examine",
          outcome: {
            text: "A marked map outlines hidden caches along the western coast and secret routes to the Blackforge.",
            awardXP: 15,
            setFlags: { inspected_cabal_maps: true }
          }
        }
      ],
      presentNPCs: ["npc_nr_cabal_leader_valeria"],
      presentItems: ["item_nr_cabal_stiletto"]
    },
    {
      id: "loc_nr_mire_causeway",
      name: "The Sunken Mire Causeway",
      region: "Mistglen Fens",
      terrain: "swamp_marsh",
      coordinates: { x: 210, y: 520 },
      recommendedLevel: 2,
      restSafety: "wild",
      narrative: {
        overview: "A precarious ribbon of submerged flagstones winding through black mire pools. Thick fog clings to the stagnant reeds where will-o-wisps flicker and marsh vipers nest.",
        shortDescription: "A treacherous path cutting through the heart of the bandit-infested swamp."
      },
      connections: [
        { targetLocationId: "loc_nr_mistglen_docks", name: "Eastward Boardwalk", distanceKm: 7.0, travelHours: 2.0, staminaCost: 6, dangerRating: 2 },
        { targetLocationId: "loc_nr_bandit_redoubt", name: "Marauder's Trail", distanceKm: 6.0, travelHours: 1.75, staminaCost: 5, dangerRating: 3 },
        { targetLocationId: "loc_nr_witch_hut", name: "Will-o-Wisp Fen Path", distanceKm: 8.0, travelHours: 2.5, staminaCost: 7, dangerRating: 3 }
      ],
      actions: [
        {
          id: "act_nr_harvest_mire_lichen",
          label: "Harvest Glowing Mire Lichen",
          actionType: "interact",
          skillCheck: { skill: "survival", attribute: "wisdom", difficulty: 11 },
          successOutcome: {
            text: "You harvest a handful of rare blue-glowing moss from the rotting willow stumps.",
            giveItem: "mat_nr_frost_lichen",
            awardXP: 10,
            setFlags: { harvested_mire_lichen: true }
          },
          failureOutcome: {
            text: "You slip into the muck and recover only wet, rotting bark.",
            modifyVitals: { stamina: -2 },
            setFlags: { harvested_mire_lichen: false }
          }
        }
      ],
      presentNPCs: [],
      presentItems: []
    },
    {
      id: "loc_nr_bandit_redoubt",
      name: "The Drowned Fort Redoubt",
      region: "Mistglen Fens",
      terrain: "rocky_scrubland",
      coordinates: { x: 170, y: 550 },
      recommendedLevel: 3,
      restSafety: "forbidden",
      narrative: {
        overview: "A partially sunken imperial fortress surrounded by sharpened palisade stakes. Deserters and marauders guard crude wooden hoardings with loaded light crossbows.",
        shortDescription: "The fortified stronghold of the Drowned Mire Marauders."
      },
      connections: [
        { targetLocationId: "loc_nr_mire_causeway", name: "Causeway Approach", distanceKm: 6.0, travelHours: 1.75, staminaCost: 5, dangerRating: 3 }
      ],
      actions: [
        {
          id: "act_nr_scout_palisade",
          label: "Scout Weak Point in Palisade",
          actionType: "examine",
          skillCheck: { skill: "stealth", attribute: "agility", difficulty: 12 },
          successOutcome: {
            text: "You spot a rotting section of palisade stakes where you can slip past the guard sentries unnoticed.",
            setFlags: { scouted_redoubt_weakness: true }
          },
          failureOutcome: {
            text: "A bandit lookout barks an alarm and looses a warning bolt into the mud!",
            setFlags: { scouted_redoubt_weakness: false }
          }
        }
      ],
      presentNPCs: ["npc_nr_bandit_captain_malik"],
      presentItems: ["item_nr_iron_broadsword"]
    },
    {
      id: "loc_nr_witch_hut",
      name: "Hovel of the Bog Seer",
      region: "Mistglen Fens",
      terrain: "swamp_marsh",
      coordinates: { x: 190, y: 590 },
      recommendedLevel: 2,
      restSafety: "restricted",
      narrative: {
        overview: "Perched atop a mound of bleached mammoth bones, a crooked peat-roofed hut leans against a dead willow. Bundles of drying herbs and crow skulls clatter in the marsh breeze.",
        shortDescription: "The solitary dwelling of an ancient fen herbalist."
      },
      connections: [
        { targetLocationId: "loc_nr_mire_causeway", name: "Marsh Crossing", distanceKm: 8.0, travelHours: 2.5, staminaCost: 7, dangerRating: 3 }
      ],
      actions: [
        {
          id: "act_nr_consult_herbalist",
          label: "Inspect Alchemy Vats",
          actionType: "examine",
          outcome: {
            text: "Bubbling earthen pots exhale vapor of bog mint and juniper berries, purifying the foul air.",
            awardXP: 10
          }
        }
      ],
      presentNPCs: ["npc_nr_bog_witch_morrigan"],
      presentItems: ["mat_nr_frost_lichen"]
    },

    // REGION 4: GRIMSTONE CRAGS & MINES (South-Western Mountains)
    {
      id: "loc_nr_grimstone_gates",
      name: "Grimstone Mountain Gates",
      region: "Grimstone Crags",
      terrain: "mountain_trail",
      coordinates: { x: 280, y: 280 },
      recommendedLevel: 2,
      restSafety: "settlement",
      narrative: {
        overview: "Carved directly into the sheer granite face of Mount Grimstone, cyclopean stone dwarven statues flank the arched gateway. Heavily armored dwarf wardens with bearded axes stand vigil.",
        shortDescription: "The monumental portal into the subterranean domain of the Silver Kin."
      },
      connections: [
        { targetLocationId: "loc_nr_pine_crossroads", name: "Highland Descent", distanceKm: 14.0, travelHours: 3.5, staminaCost: 8, dangerRating: 2 },
        { targetLocationId: "loc_nr_grimstone_delve", name: "Great Descent Shaft", distanceKm: 1.5, travelHours: 0.5, staminaCost: 2, dangerRating: 1 },
        { targetLocationId: "loc_nr_blackforge", name: "Magma Hall Road", distanceKm: 2.0, travelHours: 0.75, staminaCost: 3, dangerRating: 1 }
      ],
      actions: [
        {
          id: "act_nr_inspect_dwarf_gate_carvings",
          label: "Examine Ancestral Runic Carvings",
          actionType: "examine",
          skillCheck: { skill: "mythology_lore", attribute: "intelligence", difficulty: 11 },
          successOutcome: {
            text: "The relief depicts Clan Silver-Kin driving back an ancient frost dragon with blazing siege engines four centuries ago.",
            setFlags: { inspected_grimstone_runes: true }
          },
          failureOutcome: {
            text: "Chiseled dwarven runes depicting pickaxes, dragons, and great foaming ale-horns.",
            setFlags: { inspected_grimstone_runes: false }
          }
        }
      ],
      presentNPCs: ["npc_nr_dwarf_warden_durn"],
      presentItems: []
    },
    {
      id: "loc_nr_grimstone_delve",
      name: "Grimstone Deep Mines",
      region: "Grimstone Crags",
      terrain: "limestone_cave",
      coordinates: { x: 270, y: 240 },
      recommendedLevel: 3,
      restSafety: "settlement",
      narrative: {
        overview: "Deep vertical shafts reverberate with the clang of silver picks and rumble of iron mine carts. Lanterns hanging from timber beams illuminate rich glittering veins of pure silver ore.",
        shortDescription: "The bustling silver and iron workings beneath the crags."
      },
      connections: [
        { targetLocationId: "loc_nr_grimstone_gates", name: "Portal Ascent", distanceKm: 1.5, travelHours: 0.5, staminaCost: 2, dangerRating: 1 },
        { targetLocationId: "loc_nr_abandoned_shaft_nine", name: "Barricaded Tunnel Nine", distanceKm: 2.5, travelHours: 1.0, staminaCost: 4, dangerRating: 3 }
      ],
      actions: [
        {
          id: "act_nr_pan_silver_gravel",
          label: "Sort Ore at the Washing Trough",
          actionType: "interact",
          skillCheck: { skill: "athletics", attribute: "strength", difficulty: 11 },
          successOutcome: {
            text: "You sift through crushed rock gravel and recover a hefty nugget of unrefined silver ore.",
            giveItem: "mat_nr_silver_ingot",
            awardXP: 15,
            setFlags: { found_silver_nugget: true }
          },
          failureOutcome: {
            text: "Only worthless gray granite pebbles and cold water.",
            setFlags: { found_silver_nugget: false }
          }
        }
      ],
      presentNPCs: ["npc_nr_dwarf_overseer_thrain"],
      presentItems: ["mat_nr_bog_iron"]
    },
    {
      id: "loc_nr_abandoned_shaft_nine",
      name: "Infested Shaft Nine",
      region: "Grimstone Crags",
      terrain: "limestone_cave",
      coordinates: { x: 250, y: 210 },
      recommendedLevel: 4,
      restSafety: "forbidden",
      narrative: {
        overview: "Warning signs painted in dwarven red runes mark the splintered timber barricade. Deep within, the smell of sulfur and damp fur warns of subterranean frost trolls who broke into the lower lodes.",
        shortDescription: "A dark collapsed shaft overrun by feral mountain trolls."
      },
      connections: [
        { targetLocationId: "loc_nr_grimstone_delve", name: "Main Mine Gallery", distanceKm: 2.5, travelHours: 1.0, staminaCost: 4, dangerRating: 3 }
      ],
      actions: [
        {
          id: "act_nr_search_miners_corpse",
          label: "Inspect Overturned Minecart",
          actionType: "examine",
          skillCheck: { skill: "investigation", attribute: "intelligence", difficulty: 12 },
          successOutcome: {
            text: "Tucked inside an abandoned toolkit beneath the cart, you find the Overseer's lost vault key!",
            giveItem: "item_nr_key_grimstone_vault",
            awardXP: 25,
            setFlags: { found_vault_key: true }
          },
          failureOutcome: {
            text: "Shattered rock and rusted mining picks.",
            setFlags: { found_vault_key: false }
          }
        }
      ],
      presentNPCs: [],
      presentItems: ["mat_nr_silver_ingot"]
    },
    {
      id: "loc_nr_blackforge",
      name: "The Great Blackforge",
      region: "Grimstone Crags",
      terrain: "paved_road",
      coordinates: { x: 310, y: 260 },
      recommendedLevel: 2,
      restSafety: "sanctuary",
      narrative: {
        overview: "A colossal underground chamber carved around a volcanic magma channel. Waterfalls of glacial runoff quench glowing anvils where clan smiths forge armor for the high holds.",
        shortDescription: "The ancestral master smithy of the Silver Kin."
      },
      connections: [
        { targetLocationId: "loc_nr_grimstone_gates", name: "Granite Gallery", distanceKm: 2.0, travelHours: 0.75, staminaCost: 3, dangerRating: 1 }
      ],
      actions: [
        {
          id: "act_nr_quench_weapon_runes",
          label: "Quench Metal in Magma-Tempered Pool",
          actionType: "interact",
          outcome: {
            text: "You plunge your blade into the mineral-rich geothermal bath. The steel hisses, hardening its edge.",
            modifyVitals: { stamina: 5 }
          }
        }
      ],
      presentNPCs: ["npc_nr_blackforge_master_helga"],
      presentItems: ["item_nr_smithing_hammer"]
    },

    // REGION 5: FROSTPEAK GLACIERS & WYRMFANG (Northern High Peaks)
    {
      id: "loc_nr_glacier_pass",
      name: "Windcaller Glacier Pass",
      region: "Frostpeak Glaciers",
      terrain: "mountain_trail",
      coordinates: { x: 410, y: 190 },
      recommendedLevel: 3,
      restSafety: "wild",
      narrative: {
        overview: "A dizzying narrow ledge cut into azure glacial ice, suspended above bottomless crevasses. Howling blizzards snatch away breath and the distant shriek of mountain gryphons echoes through the squall.",
        shortDescription: "The treacherous mountain threshold leading to the northern peaks."
      },
      connections: [
        { targetLocationId: "loc_nr_valenfrost_gates", name: "Southway Descent to Valenfrost", distanceKm: 16.0, travelHours: 4.5, staminaCost: 11, dangerRating: 2 },
        { targetLocationId: "loc_nr_spire_frostmere", name: "Causeway of Rime", distanceKm: 8.0, travelHours: 2.5, staminaCost: 7, dangerRating: 3 },
        { targetLocationId: "loc_nr_wyrmfang_slopes", name: "Ascent of Mount Wyrmfang", distanceKm: 10.0, travelHours: 3.5, staminaCost: 10, dangerRating: 4 }
      ],
      actions: [
        {
          id: "act_nr_brace_blizzard",
          label: "Brace Against Screaming Gale",
          actionType: "interact",
          skillCheck: { skill: "survival", attribute: "endurance", difficulty: 12 },
          successOutcome: {
            text: "Wrapping your fur mantle tight, you shelter in a rock niche and find a traveler's dropped cache.",
            giveItem: "item_nr_frost_resist_potion",
            awardXP: 15,
            setFlags: { found_blizzard_cache: true }
          },
          failureOutcome: {
            text: "The icy wind chills your marrow, sapping your stamina.",
            modifyVitals: { stamina: -4 },
            setFlags: { found_blizzard_cache: false }
          }
        }
      ],
      presentNPCs: [],
      presentItems: ["mat_nr_frost_lichen"]
    },
    {
      id: "loc_nr_spire_frostmere",
      name: "The Spire of Frostmere",
      region: "Frostpeak Glaciers",
      terrain: "paved_road",
      coordinates: { x: 340, y: 140 },
      recommendedLevel: 3,
      restSafety: "sanctuary",
      narrative: {
        overview: "A monolithic tower carved from seamless glacial ice that never melts. Luminescent arcane crystals orbit its pinnacle, illuminating frost mages in silver robes consulting stellar charts.",
        shortDescription: "The sovereign sanctuary and academy of the Circle of Winter."
      },
      connections: [
        { targetLocationId: "loc_nr_glacier_pass", name: "Glacial Ice Bridge", distanceKm: 8.0, travelHours: 2.5, staminaCost: 7, dangerRating: 3 },
        { targetLocationId: "loc_nr_frostmere_archives", name: "Tower Inner Spiral", distanceKm: 0.3, travelHours: 0.1, staminaCost: 1, dangerRating: 0 }
      ],
      actions: [
        {
          id: "act_nr_meditate_ice_crystal",
          label: "Attune to the Glacial Focusing Core",
          actionType: "interact",
          skillCheck: { skill: "mythology_lore", attribute: "intelligence", difficulty: 12 },
          successOutcome: {
            text: "The crystal resonates with your spirit, sharpening your magical intellect and granting clarity.",
            modifyVitals: { stamina: 10, morale: 2 },
            awardXP: 20
          },
          failureOutcome: {
            text: "A sharp jolt of frost numbs your fingertips.",
            modifyVitals: { health: -2 }
          }
        }
      ],
      presentNPCs: ["npc_nr_archmage_kallan"],
      presentItems: ["item_nr_alembic_kit"]
    },
    {
      id: "loc_nr_frostmere_archives",
      name: "The Arcanum Vault of Frostmere",
      region: "Frostpeak Glaciers",
      terrain: "paved_road",
      coordinates: { x: 330, y: 120 },
      recommendedLevel: 3,
      restSafety: "restricted",
      narrative: {
        overview: "Towering shelves of ice hold leather-bound tomes and vellum scrolls dating to the First Age. Cold starlight pours through stained glass depicting the binding of ancient dragons.",
        shortDescription: "The vast historical and runic library of the northern mages."
      },
      connections: [
        { targetLocationId: "loc_nr_spire_frostmere", name: "Outer Sanctum Door", distanceKm: 0.3, travelHours: 0.1, staminaCost: 1, dangerRating: 0 }
      ],
      actions: [
        {
          id: "act_nr_study_dragon_tomes",
          label: "Study the Star-Key Manuscripts",
          actionType: "examine",
          outcome: {
            text: "You read the ancient formula of High King Valen: three star-keys forged of sky-iron are required to break the seals of Mount Wyrmfang.",
            awardXP: 25,
            setFlags: { learned_star_key_lore: true }
          }
        }
      ],
      presentNPCs: ["npc_nr_librarian_freya"],
      presentItems: ["item_nr_frost_rune_focus"]
    },
    {
      id: "loc_nr_wyrmfang_slopes",
      name: "Slopes of Mount Wyrmfang",
      region: "Frostpeak Glaciers",
      terrain: "mountain_trail",
      coordinates: { x: 470, y: 130 },
      recommendedLevel: 4,
      restSafety: "restricted",
      narrative: {
        overview: "Jagged obsidian ridges jut through packed ice like the teeth of a petrified behemoth. Steam vents hiss with sulfurous fumes from the caldera above, melting rime into black rivulets.",
        shortDescription: "The perilous heights approaching the volcano of the dormant wyrm."
      },
      connections: [
        { targetLocationId: "loc_nr_glacier_pass", name: "Glacier Ridge Trail", distanceKm: 10.0, travelHours: 3.5, staminaCost: 10, dangerRating: 4 },
        { targetLocationId: "loc_nr_wyrmfang_caldera", name: "Obsidian Summit Stair", distanceKm: 3.0, travelHours: 1.5, staminaCost: 6, dangerRating: 5 }
      ],
      actions: [
        {
          id: "act_nr_inspect_wyrm_scratch",
          label: "Inspect Runic Dragon-Seals",
          actionType: "examine",
          skillCheck: { skill: "mythology_lore", attribute: "intelligence", difficulty: 13 },
          successOutcome: {
            text: "The obsidian rock face is scored with deep claw gouges. Ancient warding runes still pulse faintly, containing the beast within.",
            setFlags: { inspected_caldera_seal: true }
          },
          failureOutcome: {
            text: "Black volcanic glass sharp enough to sever leather boots.",
            setFlags: { inspected_caldera_seal: false }
          }
        }
      ],
      presentNPCs: [],
      presentItems: ["mat_nr_sky_iron_ore"]
    },
    {
      id: "loc_nr_wyrmfang_caldera",
      name: "The Caldera of Vyr",
      region: "Frostpeak Glaciers",
      terrain: "rocky_scrubland",
      coordinates: { x: 490, y: 90 },
      recommendedLevel: 5,
      restSafety: "forbidden",
      narrative: {
        overview: "A colossal crater of frozen black basalt ringed by burning fumaroles. At the center lies the petrified mound of Vyr the Frost Wyrm, bound by colossal star-iron chains anchored to celestial monoliths.",
        shortDescription: "The legendary volcano summit and prison of the ancient dragon."
      },
      connections: [
        { targetLocationId: "loc_nr_wyrmfang_slopes", name: "Descent from Caldera", distanceKm: 3.0, travelHours: 1.5, staminaCost: 6, dangerRating: 5 }
      ],
      actions: [
        {
          id: "act_nr_inspect_wyrm_chains",
          label: "Inspect the Great Star-Iron Chains",
          actionType: "examine",
          outcome: {
            text: "The massive links of star-iron hum with celestial resonance. Three runic pedestals surround the central altar, awaiting the Star-Keys.",
            setFlags: { inspected_wyrm_pedestals: true }
          }
        }
      ],
      presentNPCs: [],
      presentItems: ["mat_nr_wyrm_blood_vial"]
    }
  ]
};

// -------------------------------------------------------------
// 2. INTERACTIVE OBJECTS (Chests, Doors, Shrines, Vaults)
// -------------------------------------------------------------
const interactiveObjects = {
  interactiveObjects: [
    {
      id: "obj_nr_valenfrost_armory_chest",
      locationId: "loc_nr_valenfrost_barracks",
      name: "Ironbound Garrison Footlocker",
      type: "container",
      locked: true,
      isPickable: true,
      lockDifficulty: 11,
      requiredKeyId: null,
      requiredToolId: "item_nr_dwarven_lockpicks",
      description: "A heavy oak footlocker reinforced with forged iron corner bands.",
      unlockOutcome: {
        awardXP: 15,
        transcript: "The iron tumbler clicks open smoothly under your tension tool.",
        setFlags: { unlocked_valenfrost_footlocker: true }
      },
      loot: ["item_nr_hunting_dagger", "item_nr_smoked_venison"],
      lootTableId: "lt_nr_chest_common"
    },
    {
      id: "obj_nr_grimstone_vault_door",
      locationId: "loc_nr_abandoned_shaft_nine",
      name: "Grimstone Deep Clan Vault",
      type: "door",
      locked: true,
      isPickable: false,
      lockDifficulty: 18,
      requiredKeyId: "item_nr_key_grimstone_vault",
      description: "A monumental vault door of solid stone and silver-plated dwarven bronze.",
      unlockOutcome: {
        awardXP: 30,
        transcript: "The heavy stone portal grinds inward on greased bronze bearings.",
        setFlags: { unlocked_grimstone_vault: true }
      },
      loot: ["mat_nr_silver_ingot", "item_nr_silver_crest_shield", "item_nr_star_key_alpha"],
      lootTableId: "lt_nr_chest_dwarven_vault"
    },
    {
      id: "obj_nr_barrow_crypt_portal",
      locationId: "loc_nr_ancient_cairn",
      name: "Sealed Runic Barrow Portal",
      type: "door",
      locked: true,
      isPickable: false,
      lockDifficulty: 16,
      requiredKeyId: "item_nr_key_barrow_sanctum",
      description: "A massive slab of petrified bog oak inscribed with protective burial wards.",
      unlockOutcome: {
        awardXP: 25,
        transcript: "The ancient bog-oak slab tilts inward with a shudder of dust.",
        setFlags: { unlocked_skallagrim_barrow: true }
      }
    },
    {
      id: "obj_nr_frostmere_library_gate",
      locationId: "loc_nr_spire_frostmere",
      name: "Silver Lattice Arcanum Gate",
      type: "door",
      locked: true,
      isPickable: true,
      lockDifficulty: 14,
      requiredKeyId: "item_nr_key_frostmere_library",
      requiredToolId: "item_nr_dwarven_lockpicks",
      description: "Delicate silver lattice wrought in the shape of spiraling winter snowflakes.",
      unlockOutcome: {
        awardXP: 20,
        transcript: "The silver latch glides open, admitting entry to the restricted archives.",
        setFlags: { unlocked_frostmere_archives: true }
      }
    },
    {
      id: "obj_nr_skallagrim_sarcophagus",
      locationId: "loc_nr_barrow_depths",
      name: "Chieftain Skallagrim's Sarcophagus",
      type: "container",
      locked: true,
      isPickable: true,
      lockDifficulty: 13,
      requiredKeyId: null,
      requiredToolId: "item_nr_dwarven_lockpicks",
      description: "A massive black granite tomb carved with scenes of dragon battles and Viking ship funerals.",
      unlockOutcome: {
        awardXP: 35,
        transcript: "The stone lid shifts aside with a hollow scrape, revealing ancestral treasures.",
        setFlags: { looted_skallagrim_sarcophagus: true }
      },
      loot: ["item_nr_silver_waraxe", "item_nr_star_key_gamma"],
      lootTableId: "lt_nr_boss_skallagrim"
    },
    {
      id: "obj_nr_cabal_smuggler_cache",
      locationId: "loc_nr_cabal_cistern",
      name: "Smuggler's Strongbox",
      type: "container",
      locked: true,
      isPickable: true,
      lockDifficulty: 12,
      requiredKeyId: null,
      requiredToolId: "item_nr_dwarven_lockpicks",
      description: "An iron coffer reinforced with brass nails, marked with the thieves' guild sigil.",
      unlockOutcome: {
        awardXP: 20,
        transcript: "The lock gives way, revealing secret documents and gold coins.",
        setFlags: { looted_cabal_strongbox: true }
      },
      loot: ["item_nr_elena_stolen_ledger", "item_nr_cabal_stiletto"]
    }
  ]
};

// -------------------------------------------------------------
// 3. PUZZLES (Riddles & Inscribed Mechanisms)
// -------------------------------------------------------------
const puzzles = {
  puzzles: [
    {
      id: "puzzle_nr_rime_stone",
      title: "The Rime Pillar of Frostmere",
      locationId: "loc_nr_spire_frostmere",
      prompt: "Inscribed upon the spiraling ice pillar in ancient northern runes:\n\n'I fly without wings, I bite without teeth,\nI build up the glacier, I cover the heath.\nI howl without throat on the darkest of nights,\nYet wither to water when sun shows its lights.\nWhat am I?'",
      question: "What answer satisfies the icy pillar?",
      customAnswerLabel: "Speak your word to the frost pillar:",
      clueJournalIds: ["The Rime Riddle of the Spire"],
      acceptedKeywords: [
        "blizzard",
        "the blizzard",
        "snow",
        "the snow",
        "frost",
        "the frost",
        "ice",
        "winter",
        "rime"
      ],
      knownAnswerLabel: "Answer with the scholar's riddle: \"The blizzard itself.\"",
      deductionSkill: "mythology_lore",
      deductionAttribute: "intelligence",
      deductionDc: 12,
      deductionHint: "Think of what howls across the glacier peaks.",
      deductionFailText: "The runic words remain cold and silent. The frosty air stings your cheeks.",
      wrongAnswerText: "A burst of bitter frost puffs from the stone, freezing your breath.",
      distractors: [
        "\"A mountain wolf.\"",
        "\"The north wind.\"",
        "\"A raven.\""
      ],
      successOutcome: {
        transcript: {
          speaker: "The Rime Pillar",
          text: "The blue runes flare with brilliant cold fire. An inner niche slides open in the ice, presenting the Silver Key of the Winter Spire!",
          style: "entry-discovery"
        },
        giveItem: "item_nr_key_frostmere_library",
        setFlags: { rime_pillar_solved: true },
        awardXP: 50,
        addJournalChronicle: {
          title: "The Frost Pillar Solved",
          text: "Spoke the riddle of the blizzard. The pillar granted the Silver Key to the Spire's inner arcanum."
        }
      }
    },
    {
      id: "puzzle_nr_wyrm_pedestals",
      title: "The Triad of Star-Keys",
      locationId: "loc_nr_wyrmfang_caldera",
      prompt: "Three granite altars stand before the dormant Frost Wyrm Vyr. Each pedestal is etched with a celestial glyph:\n1. The Peak of Dawn (Alpha)\n2. The Spire of Rime (Beta)\n3. The Barrow of Old (Gamma)\nWhen all three Star-Keys are fitted into their sockets, the ancestral seal of High King Valen will either solidify the binding forever or awaken the dragon for mortal combat.",
      question: "Will you place the three Star-Keys into the ancient pedestals?",
      customAnswerLabel: "Chant the words of the Star-Father:",
      clueJournalIds: ["The Dragon Binding Ritual"],
      acceptedKeywords: [
        "valen",
        "torvald",
        "sky iron",
        "bind",
        "awaken"
      ],
      knownAnswerLabel: "Invoke Torvald's name and insert the three Star-Keys.",
      deductionSkill: "mythology_lore",
      deductionAttribute: "intelligence",
      deductionDc: 14,
      deductionHint: "Recall the teachings in the Frostmere Arcanum.",
      deductionFailText: "You hesitate before the cosmic weight of the dragon pedestals.",
      wrongAnswerText: "The pedestals rumble with hollow discordance.",
      distractors: [
        "\"Let the beast sleep.\"",
        "\"Strike the stone with an axe.\""
      ],
      successOutcome: {
        transcript: {
          speaker: "Mount Wyrmfang",
          text: "The three star-keys lock into place with a thunderclap. Blazing columns of celestial light erupt into the storm clouds, shattering the Wyrm's shackles!",
          style: "entry-discovery"
        },
        setFlags: { wyrm_pedestals_activated: true, vyr_awakened: true },
        awardXP: 100,
        addJournalChronicle: {
          title: "The Dragon Unbound",
          text: "Inserted the three Star-Keys upon Mount Wyrmfang. Vyr the Frost Wyrm awakens!"
        }
      }
    }
  ]
};

writeJson(path.join(OUT_DIR, 'locations.json'), locations);
writeJson(path.join(OUT_DIR, 'interactive_objects.json'), interactiveObjects);
writeJson(path.join(OUT_DIR, 'puzzles.json'), puzzles);

console.log("Stage 4 complete: Locations (25), Interactive Objects (6), Puzzles (2).");

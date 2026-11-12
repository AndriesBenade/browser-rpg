# Lanternfall: The Brindle Ford Trials (Developer campaign)

The developer campaign (`campaign_dev_test`). It is short (an hour or two), has its own setting, and touches
every system the engine has. Play it after engine changes to see that everything still works; the automated
version of the same play-through is `tests/dev_campaign_tests.js` (part of `npm test`).

The original Developer Verification Campaign (Haven, Lycus, Lord Karas) is kept unchanged as a hidden test
fixture in `content/campaigns/fixtures/dev_legacy/` (`campaign_dev_legacy`). Only the regression tests use it.

## The story

You arrive in **Brindle Ford** to sit the Wayfarers' Guild trials. Examiner **Odile Marsh** gives you the
**Trial Ledger**: ten lines, each one a different kind of task. Meanwhile the lighthouse on **Gull Rock** has
gone dark (Lanternfall), sea fog is creeping inland, and something in the flooded bell chamber is ringing
the bell. Both quests start on day 1; the ledger works as a checklist of systems.

Map: Brindle Ford (town) · Willowmere Apiary (sanctuary) · The Old Moss (bog) · Saltreed Cove (smugglers) ·
Thornback Ridge (cliffs) · Gull Rock Lighthouse (boss) · The Sunken Chapel (hidden, opened by a riddle).

## Where each system is tested

| System | Where to try it |
| --- | --- |
| Character creation | 3 classes (shield, bow, tinker), 3 backgrounds, 3 own origins plus the shared ones; default name "Wren" |
| Combat basics, telegraphed moves | Guild sparring golem (Brindle Ford), every creature has a heavy or quick move |
| Statuses | Lurker: poisoned, entangled · Wisp: confused, frightened · Crab: weakened · Bear: bleeding · Gryphon: stunned, frightened · Keeper: stunned, weakened, entangled |
| Immunities, fearless, morale | Golem and Keeper are fearless and immune to fear; the bear and crab can lose their nerve and flee |
| Class abilities | Shield Bash and Second Wind (dice heal), Pinning Shot, Flash Powder |
| Confrontations | Location tactics (market crowd, sucking mud, sea spray, rockslide), encounter tactic (storm lamp), the campaign tactic (Guild whistle, needs the whistle flag), unavoidable ambush (gryphon), foe-initiated ambush with parley (smuggler bruiser) |
| Boss phases, repeat loot | The Drowned Keeper: two phases, unique loot once, then coins and tonics on repeat kills |
| NPC combat, yield, permanent death | Any NPC can be attacked; wounded NPCs yield |
| Consequence rules | Kill Tamsin (shop closes, errand fails, curfew is scheduled), Odile (trials fail), Garrow (lantern quest skips ahead, key drops) |
| The law | Garrow and Abel are guards; theft or assault in town brings fines, surrender or jail |
| Merchants, standing prices, buy-back, restock | Tamsin (general), Fennick (shady), Sister Bramble (herbs); negotiate and bluff in the trade window |
| Persuasion vs Deception in dialogue | Odile (practice key), Garrow (lighthouse key), Rook (riddle hint), Jory (boat): each has a Persuade and/or a Lie choice with different results; failures have cooldowns and consequences |
| Pickpocketing, hostile acts discovered later | Any NPC; a narrow success may be found out a few hours later |
| Companions | Hire Marta (25 drachmae, 3 days), rescue Pip (story companion), join Jory's crew |
| Quests | Two main quests, a timed rescue (Pip: storm warning at 8h, moves at 16h, fails at 36h, early bonus under 10h), a moral choice with three paths (Jory), a bounty, an errand that can fail, a discovery quest |
| Alternate routes | Gull Rock by rowboat (Strength heave), by Jory's boat (deal, lie or persuasion), or by the cliff stair (hidden spot + gryphon). The lighthouse door by Garrow's key (standing, persuasion, lie, or his death), the chapel's spare key, or a DC 15 lock |
| Interactive objects | Practice lockbox (key or pick), Guild strongbox (trap, alarm, infamy), rowboat (heave), smuggler crates (trap, alarm, loot table), lighthouse door, chapel reliquary |
| Hidden spots, search, critical discoveries | Every location has hidden spots (coins, items, a secret boardwalk, the cliff stair); Brindle Ford and the chapel have natural-20 finds |
| Rumours | Notice board, NPC rumours, "?" markers on the map |
| Riddle | The Bog Stone: known answer (from Rook), deduction (Investigation), typed answer, wrong answers with a retry cooldown |
| Minigames | Reed stalk (Old Moss), augury bones (Willowmere), herbal mortar (any rest), anvil strike (crafting), shield clash (combat); names and rewards come from `campaign.json` → `minigames` |
| Crafting | Tinkering, Herbalism, Leatherwork; 8 materials, 6 templates; toolkits from Tamsin and Bramble |
| Pantheon and favour | The Hive Mother (mead offering, blessing, augury rerolls) and the Tide Warden (pearl offering, relighting the lantern) |
| Rest | Sanctuary rest at Willowmere and the chapel, settlement rest in town, wild camps with campaign camp events |
| Rest rules per location | Brindle Ford: rest at the Ferry Inn, barred during the curfew · Saltreed: no rest while the smugglers are hostile · Thornback: no camp in a squall · Gull Rock: short rest only |
| NPC inspection | 👁️ next to any NPC: worn gear, carried items and purse; steal a single item or coins; what is left is what drops on death |
| Travel, pace, weather, rations | Custom "Watchful" pace label, sea fog and squall weather, three ration items |
| Progression | Fast XP table (levels at 100/250/450...), campaign level titles, two renamed feats |
| Difficulty | Four presets with campaign labels; Hard has 3 lives |
| Events | Trial Ledger lines are completed by engine events: SOCIAL_SUCCESS, HIDDEN_SPOT_FOUND, ITEM_PURCHASED, ITEM_CRAFTED, MINIGAME_COMPLETED, COMPANION_JOINED, PLAYER_RESTED; plus FLAG_SET, ITEM_ACQUIRED and ENTITY_DEATH events |
| Codex, glossary | 4 lore entries, 3 glossary terms (Lanternfall, wisp-glass, Everflame) |

## Editing

Edit the JSON files here, then run `node scripts/sync-embedded-dev-content.js` so the copy used in
`file://` mode matches. `npm test` fails until the two agree. Never use the em dash character in campaign files.

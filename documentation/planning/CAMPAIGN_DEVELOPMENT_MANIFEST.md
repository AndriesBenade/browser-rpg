# Campaign & Global Engine Development Manifest

## 1. Project Objective & Final Status
1. **Phase 1 (COMPLETED - Engine-Wide):** Overhauled the global magic system across Browser-RPG with skill-milestone-earned **Arcane Knowledge Points (AKP)**, an expanded **17-spell global spell catalogue** (preserving the 5 legacy core spells and existing combat casting capacity + spell-shaping systems), a reusable **Global Grimoire / Spellbook UI (`#spellbook-modal`)**, and campaign-extensible `spells.json` support.
2. **Phase 2 (COMPLETED - Engine-Wide):** Expanded the global morality system (`virtue`, `hubris`, `score`, `alignment`) with reusable moral prerequisites (`minMoralityScore`, `maxMoralityScore`, `minVirtue`, `minHubris`, `requiredAlignment`, `moralityBand: "positive"|"negative"`), anti-exploit one-time moral decision tracking, NPC/merchant moral reactivity, `MORALITY_CHANGED` world events, and active-mission persistence rules.
3. **Phase 3 & 4 (COMPLETED - Infrastructure & Validation):** Extended campaign loading (`modules.spells`), embedded-content syncing (95 files across 4 built-in campaigns), and `validateCampaign()` to validate spells, moral prerequisites, and main-storyline safety; verified across all existing campaigns and legacy saves with `tests/global_magic_morality_tests.js`.
4. **Phase 5 (COMPLETED - Largest Campaign in Browser-RPG):** Created **The Ashen Ledger: Frontier of the Toll** (`campaign_ashen_ledger`), a 100% original dark fantasy campaign inspired thematically by an industrialised afterlife, eternal frontier, power with steep consequences, morally complex institutions, and intelligent/tragic adversaries.

## 2. Final Content Benchmark (Existing Campaigns vs. Achieved *Ashen Ledger* Totals)

| Category | Greek Mythology | Lanternfall (Dev) | Northern Realms | Existing Max | **Ashen Ledger Achieved** |
| --- | ---: | ---: | ---: | ---: | ---: |
| Regions | 6 | 2 | 5 | 6 | **7** (+17%) |
| Locations | 19 | 7 | 25 | 25 | **32** (+28%) |
| NPCs | 14 | 10 | 17 | 17 | **24** (+41%) |
| Merchants | 5 | 3 | 7 | 7 | **9** (+29%) |
| Factions | 4 | 5 | 8 | 8 | **10** (+25%) |
| Quests (Total) | 3 | 8 | 11 | 11 | **18** (+64%) |
| Hidden Quests | 0 | 0 | 3 | 3 | **4** (+33%) |
| Morality-Exclusive Quests | 0 | 0 | 0 | 0 | **4** (2 Positive, 2 Negative) |
| Creatures | 12 | 8 | 10 | 12 | **16** (+33%) |
| Bosses | 3 | 1 | 4 | 4 | **5** (+25%) |
| Encounters | 3 | 6 | 10 | 10 | **15** (+50%) |
| Items (Total) | 66 | 46 | 57 | 66 | **95** (+44%) |
| Materials | 10 | 8 | 10 | 10 | **14** (+40%) |
| Crafting Templates | 17 | 6 | 17 | 17 | **22** (+29%) |
| Item Combinations | 4 | 5 | 3 | 5 | **7** (+40%) |
| Loot Tables | 4 | 16 | 8 | 16 | **20** (+25%) |
| Interactive Objects | 2 | 6 | 6 | 6 | **10** (+67%) |
| Puzzles | 1 | 1 | 2 | 2 | **4** (+100%) |
| World Events | 1 | 15 | 10 | 15 | **21** (+40%) |
| Dialogue Trees | 5 | 8 | 17 | 17 | **24** (+41%) |
| Hidden Discovery Spots | 1 | 4 | 10 | 10 | **14** (+40%) |
| Lore / Codex Entries | 10 | 4 | 10 | 10 | **16** (+60%) |
| Glossary Entries | 28 | 3 | 5 | 28 | **34** (+21%) |
| Global + Campaign Spells | 5 | 5 | 5 | 5 | **17 Global + 8 Campaign (25 total)** |

## 3. Architecture & Compatibility Decisions
- **Global Magic Acquisition vs. Casting Capacity vs. Spell Shaping:**
  - `player.magicProgression = { knownSpells: [], claimedMilestones: [], spentPoints: 0, totalEarnedPoints: 0 }`.
  - **Arcane Knowledge Points (AKP)** are granted strictly when reaching non-repeatable magical skill/attribute milestones (`mythology_lore`, `investigation`, `medicine`, `intelligence`, `wisdom`). Casting spells NEVER generates AKP.
  - Existing 5 legacy core spells (`aegis`, `bolt`, `nova`, `mend`, `bind`) remain 100% compatible with existing saves and tests, while **12 new global spells** + campaign-specific `spells.json` spells are acquired permanently in `#spellbook-modal`.
  - Combat Casting Capacity and Spell Shaping remain completely independent and intact.
- **Global Morality Policy:**
  - Reuses existing `player.morality` (`virtue`, `hubris`, `score = virtue - hubris`, `alignment`).
  - Shared `evaluateMoralityCondition()` supports `minMoralityScore`, `maxMoralityScore`, `minVirtue`, `minHubris`, `requiredAlignment`, and `moralityBand` (`"positive"` | `"negative"`) across quests, dialogues, actions, spells, NPCs, and world events.
  - **Post-Unlock Persistence Policy:** Once a player legitimately accepts a morality-gated quest, later moral shifts never delete or auto-fail that active quest.
  - Anti-exploit `worldState.recordedMoralDecisions` (`decisionKey`) prevents repeating choices to farm morality.

## 4. Verification & Documentation Checklist
- **Completed:** Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 (Modules 1-7).
- **Validation:** `runComprehensiveCampaignValidation('campaign_ashen_ledger', { includeFunctional: true })` -> **670/670 checks, 0 errors, 0 warnings, 6/6 isolated functional crafting checks PASSED**.
- **Automated Tests:** Full `npm test` -> **248 / 248 passed** across 8 test suites + `sync-embedded-content.js --check` (95 embedded files in sync).
- **Separate Documentation:**
  - `documentation/GLOBAL_MAGIC_SYSTEM.md`
  - `documentation/ASHEN_LEDGER_CAMPAIGN_GUIDE.md`

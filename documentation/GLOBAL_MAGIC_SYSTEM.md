# Browser-RPG Global Magic System Documentation

> **Scope:** Engine-wide subsystem in `index.html` shared by **all** built-in and custom campaigns (`campaign_greek_mythology`, `campaign_dev_test`, `campaign_northern_realms`, `campaign_ashen_ledger`, and future packs).

---

## 1. Design Principles & Three-Layer Separation

The Global Magic System strictly separates three distinct progression axes so no single stat or exploit collapses spellcasting depth:

1. **Spell Acquisition (Arcane Knowledge Points - AKP)**
   - Determines *which spells a character knows*.
   - Earned **exclusively** through non-repeatable skill and attribute milestones.
   - Casting spells repeatedly in or out of combat **never** generates AKP (prevents cast-spam farming).
   - Acquired spells are permanently recorded in `state.player.magicProgression.knownSpells`.
2. **Combat Casting Capacity (Spells Per Encounter)**
   - Determines *how many spells a character can cast during a single combat encounter*.
   - Continues to scale via existing Intelligence/Wisdom/Lore progression (`getCombatMagicCapacity()`), completely independent of how many spells the hero has learned in their Grimoire.
3. **Spell Shaping (Tactical Modifiers)**
   - Determines *how* a cast spell is shaped in combat (`standard`, `focused`, `overcharged`, `efficient`, etc.), gated by Intelligence thresholds (`getAvailableSpellShapes()`).
   - Applies uniformly to both legacy core spells, new global spells, and campaign-registered spells.

---

## 2. Arcane Knowledge Points (AKP) & Non-Repeatable Milestones

Milestones are defined centrally in `getArcaneKnowledgeMilestones()` and synchronized deterministically via `syncArcaneKnowledgePoints()`. Each milestone has a unique `id` stored in `state.player.magicProgression.claimedMilestones` so it can be claimed **at most once per character**.

### Milestone Schedule

| Milestone ID | Requirement | AKP Granted |
| :--- | :--- | :---: |
| `lore_1` | `mythology_lore >= 1` | +1 |
| `lore_2` | `mythology_lore >= 2` | +1 |
| `lore_3` | `mythology_lore >= 3` | +2 |
| `lore_4` | `mythology_lore >= 4` | +2 |
| `lore_5` | `mythology_lore >= 5` | +3 |
| `investigation_2` | `investigation >= 2` | +1 |
| `investigation_4` | `investigation >= 4` | +2 |
| `medicine_2` | `medicine >= 2` | +1 |
| `medicine_4` | `medicine >= 4` | +1 |
| `int_12` | `attributes.intelligence >= 12` | +1 |
| `int_14` | `attributes.intelligence >= 14` | +2 |
| `int_16` | `attributes.intelligence >= 16` | +2 |
| `wis_12` | `attributes.wisdom >= 12` | +1 |
| `wis_14` | `attributes.wisdom >= 14` | +2 |
| `wis_16` | `attributes.wisdom >= 16` | +2 |

- **Summary API:** `engine.getArcaneKnowledgeSummary()` returns `{ available, totalEarned, spent, nextMilestones, claimedCount, totalMilestones }`.
- **Automatic Sync:** Called on character creation, skill advancement, attribute increases, level-up, Character Sheet render, and Grimoire open.

---

## 3. Global Engine Spell Catalogue (17 Spells)

Defined in `getGlobalSpellCatalog()` (merged with any campaign-registered `world.spells`). All 17 global spells are available in every campaign.

### A. Preserved Legacy Core Spells (5)

| Spell ID | Name | Discipline | Tier | AKP Cost | Starter / Legacy Behavior |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `aegis` | Aegis Ward | Abjuration | 0 | 0 | Known by default (`starter: true`); grants Arcane Ward. |
| `bolt` | Arcane Bolt | Evocation | 0 | 0 | Known by default (`starter: true`); single-target magic strike bypassing frontline cover. |
| `nova` | Solar Nova | Evocation | 1 | 1 | Multi-target AoE blast; auto-preserved for legacy saves with arcane background. |
| `mend` | Rite of Mending | Restoration | 1 | 1 | Self-heal scaling with Wisdom; cures minor ailments. |
| `bind` | Shackles of Stasis | Control | 1 | 1 | Single-target control inflicting Entangled / slowing enemy action. |

### B. New Acquirable Global Spells (12)

| Spell ID | Name | Discipline | Tier | AKP Cost | Prerequisites | Combat Effect Summary |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `chain_spark` | Chain Spark | Evocation | 1 | 1 | Lore 1 | Multi-target (up to 2 foes, bypasses cover); lightning damage (`1d6 + INT`). |
| `cinder_lance` | Cinder Lance | Evocation | 2 | 2 | Lore 2, INT 12 | High single-target fire damage (`2d6 + INT`) + Burning/Bleeding bleed. |
| `frost_shroud` | Frost Shroud | Abjuration | 1 | 1 | Lore 1 | Self Arcane Ward + chills/weakens targeted foe's attack rolls. |
| `bastion_of_will` | Bastion of Will | Abjuration | 2 | 2 | Lore 2, WIS 12 | Heavy Arcane Ward + temporary defense/AC boost & cleanses fear. |
| `soothing_breath` | Soothing Breath | Restoration | 1 | 1 | Medicine 1 or Lore 1 | Restores Health (`1d6 + WIS`) + Stamina recovery. |
| `purifying_flame` | Purifying Flame | Restoration | 2 | 2 | Lore 2, WIS 12 | Restores Health (`2d4 + WIS`) and cures Bleeding, Poisoned, Frightened, Weakened. |
| `mire_snare` | Mire Snare | Control | 1 | 1 | Lore 1 | Multi-target (up to 2 foes); Entangled + strips enemy Guard. |
| `shatter_guard` | Shatter Guard | Control | 2 | 2 | Lore 2, INT 12 | Strips Guard, lowers enemy AC, and inflicts Vulnerable/Weakened. |
| `veil_of_phantoms` | Veil of Phantoms | Illusion | 1 | 1 | Lore 1 | Grants player Evasion/AC bonus & unsettles enemy accuracy. |
| `dread_visage` | Dread Visage | Illusion | 2 | 2 | Lore 2, CHA/INT 12 | Multi-target Frightened + Morale damage (`all_enemies`, up to 2). |
| `spectral_blade` | Spectral Blade | Conjuration | 1 | 1 | Lore 1 | Conjures force strike bypassing cover (`1d8 + INT`) + temporary attack bonus. |
| `soul_siphon` | Soul Siphon | Soulcraft | 2 | 2 | Lore 2, WIS/INT 12 | Drains enemy HP (`1d8 + WIS`) and heals caster for a fraction of damage dealt. |

*(Divination discipline is also registered in `getSpellDisciplines()` for campaign spell extensions and Grimoire filtering.)*

---

## 4. Campaign Spell Registration (`modules.spells`)

Any campaign can register custom spells without editing `index.html`:

1. Add `"spells": "content/campaigns/<campaign_id>/world/spells.json"` inside `campaign.json` under `"modules"`.
2. Create `world/spells.json` with top-level key `"spells": [ ... ]`.
3. `loadContent()` loads `modules.spells` into `engine.world.spells`, and `getGlobalSpellCatalog()` automatically appends all campaign spells tagged with `source: "campaign"`.
4. `validateCampaign()` checks every campaign spell for:
   - Unique `id` and non-empty `name`
   - Valid `discipline`
   - Non-negative `costPoints` and `staminaCost`
   - Valid `targeting` and `effect` block

### Campaign Spell JSON Schema

```json
{
  "id": "al_spell_cinder_writ",
  "name": "Cinder Writ of Forfeiture",
  "icon": "🔥",
  "discipline": "evocation",
  "tier": 1,
  "costPoints": 1,
  "staminaCost": 1,
  "minSkills": { "mythology_lore": 1 },
  "minAttributes": { "intelligence": 12 },
  "minMoralityScore": 10,
  "maxMoralityScore": -10,
  "targeting": {
    "targetType": "single",
    "maxTargets": 1,
    "range": "magic",
    "bypassFrontline": true,
    "requiresLineOfSight": false,
    "aoe": false,
    "label": "Single • Bypasses Cover"
  },
  "effect": {
    "damageDice": "1d10",
    "damageStat": "intelligence",
    "flatDamage": 2,
    "selfCostHp": 2,
    "healDice": "2d6",
    "healStat": "wisdom",
    "flatHeal": 3,
    "drainFraction": 0.5,
    "ward": 6,
    "staminaRestore": 4,
    "cureSelf": ["bleeding", "poisoned", "frightened", "weakened"],
    "stripEnemyGuard": true,
    "targetAcPenalty": 2,
    "moraleDamage": 4,
    "enemyStatus": { "id": "bleeding", "rounds": 2, "value": 2 },
    "enemyStatus2": { "id": "frightened", "rounds": 2, "value": 0 },
    "selfMods": { "ac": 2, "attack": 2, "rounds": 2 },
    "enemyMods": { "attack": -2, "rounds": 2 },
    "verb": "brands with a blazing ash-writ"
  },
  "desc": "Human-readable description shown in the Grimoire and combat tooltips."
}
```

> **Optional Morality Gates:** Spells can require positive morality (`minMoralityScore`), negative morality (`maxMoralityScore`), or specific alignment via `evaluateMoralityCondition()`. `checkSpellAcquisitionEligibility(spellId)` automatically enforces skill, attribute, prerequisite-spell, AKP, and morality checks.

---

## 5. Grimoire UI & Combat Integration

- **Character Sheet Entry Point:** Inside `#sheet-magic-block`, players see their current **Arcane Knowledge Points (AKP)**, known spell count, combat casting capacity, and an **"Open Grimoire & Learn Spells"** button (`#btn-open-spellbook`).
- **Grimoire Modal (`#spellbook-modal`):**
  - Displays available / earned / spent AKP and upcoming milestone hints.
  - Filter tabs by discipline (`All`, `Known`, `Evocation`, `Abjuration`, `Restoration`, `Control`, `Illusion`, `Conjuration`, `Divination`, `Soulcraft`, plus `Campaign`).
  - Clearly displays prerequisites, AKP cost, targeting profile, and unlock status (`Known`, `Acquire`, or locked with exact missing requirements).
- **Combat UI:** Only **known** spells appear as castable actions in combat, dynamically rendered from the player's `magicProgression.knownSpells` and fully respecting target selection, frontline/backline bypass rules, AoE `maxTargets`, and Spell Shaping modifiers.

---

## 6. Legacy Save & Cross-Campaign Compatibility

`ensureMagicProgressionState()` runs automatically during boot, character creation, and `loadGame()`:
- Legacy saves lacking `player.magicProgression` are upgraded seamlessly without data loss.
- Starter spells (`aegis`, `bolt`) are always known; existing spellcasters/high-Lore legacy characters keep access to previously unlocked core spells (`nova`, `mend`, `bind`) and receive retro-computed AKP for any skill/attribute milestones already surpassed.
- Campaign-specific spells learned in one campaign remain scoped cleanly to that campaign's saves and never break loading another campaign.

---

## 7. Adding New Spells (Developer Checklist)

1. **Engine-wide spell:** Append to the array returned by `getGlobalSpellCatalog()` in `index.html`.
2. **Campaign-specific spell:** Add to `content/campaigns/<id>/world/spells.json` and ensure `"spells"` is listed in `campaign.json -> modules`.
3. Run `npm run sync:embedded` so `file://` mode stays in sync.
4. Run `npm test` (specifically `npm run test:magic` and your campaign test suite) to verify validator checks, acquisition gating, combat execution, and save/load persistence.

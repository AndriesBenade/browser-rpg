# Browser-RPG

Offline-capable, browser-based modular tabletop RPG engine with four built-in campaigns:
* **Hellas: Mythos of the Heroic Age** (Classical Greek mythology)
* **Lanternfall: The Brindle Ford Trials** (Coastal frontier sandbox & engine showcase)
* **The Northern Realms** (Nordic open-world highland fantasy)
* **The Ashen Ledger: Frontier of the Toll** (Expansive original dark fantasy)

## Quick Start
* **Play Offline**: Open `index.html` directly in any modern browser (all built-in campaign data and drawn maps are embedded).
* **Play via Local Server**: Run `python server.py` and open `http://localhost:8000/index.html`.
* **Run Automated Tests**: `npm test` (runs all 8 test suites and verifies embedded offline content sync).
* **Sync Offline Bundle**: `npm run sync:embedded` after editing files under `content/`.
* **Build Minified Release**: `npm install` (once), then `npm run build` to produce a compressed standalone copy in `dist/`.

## Folder Organization
* `index.html` - Complete playable engine (UI, rules, combat, crafting, magic, world maps, and embedded offline campaign bundle).
* `content/` - Modular campaign manifests, worlds, items, quests, dialogues, spells, and simplified drawn `map.svg` artwork.
* `documentation/` - Architecture guides, content schema, authoring templates (`templates/`), and campaign planning notes (`planning/`).
* `schemas/` - JSON Schema definitions for campaign manifests and content packs.
* `scripts/` - Embedded content packer (`sync-embedded-content.js`), release minifier (`build-release.js`), and world generator scripts (`generator/`).
* `src/` - Standalone engine modules (`engine/EventBus.js`).
* `tests/` - Automated unit, behaviour, campaign, combat, magic, and Phase Two test suites.
* `DEVELOPER_NOTES.md` - Chronological engineering hand-off log.

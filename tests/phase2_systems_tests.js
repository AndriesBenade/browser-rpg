/**
 * Automated Test Suite: Phase Two Systems Overhaul
 * Covers:
 *  - Part 3: Experience Rebalancing, Anti-Farming Diminishing Returns & Usage-Based Skill Progression
 *  - Part 4: Modular Feat System (20+ Feats across 6 Categories) & Every-3-Levels Acquisition Frequency
 *  - Part 5: World Map Zoom, Pan, Fit/Reset/Center & Large-Map Collision-Free Label Readability
 *  - Part 6: Campaign-Specific UI Theme Customisation (Full, Partial Fallback & Sanitization)
 *  - Part 7 & 8: Story Interface Cleanup & Campaign Soundtrack YouTube Embed (Sanitization & Click-to-Load)
 *  - Part 9: Crafting Reliability Bug Fix (Multi-Stack Inventory Counting, Consumption & Stale Selection Pruning)
 *  - Part 10: Campaign Verification Overhaul (Undefined/Placeholder Scan, Isolated Functional Crafting, Pre-Start & AI Report)
 *  - Part 11: Wait & Time Advancement (Pure Clock/Schedule/Event Progression, Zero Healing/Rest, Combat Block)
 *
 * Run: node tests/phase2_systems_tests.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createSandbox, bootEngine, startCampaign } = require('./behaviour_harness');

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`[FAIL] ${name}\n       ${(err && err.message || String(err)).split('\n').join('\n       ')}`);
  }
}

const fixedRoll = (engine, val) => { engine.rollD20 = () => val; };

async function bootCampaign(id = 'campaign_northern_realms') {
  const env = createSandbox();
  const engine = await bootEngine(env);
  await startCampaign(env, engine, id);
  return { env, engine };
}

(async () => {
  console.log('=================================================================');
  console.log('RUNNING PHASE TWO SYSTEMS OVERHAUL TEST SUITE');
  console.log('=================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Part 3.1 & 3.2: Experience Rebalance & Anti-Farming Safeguards
  // ---------------------------------------------------------------------------
  await test('Part 3.1 & 3.2 Experience Overhaul: modest routine XP, 24h diminishing returns, full combat/quest XP & one-time dialogue guard', async () => {
    const { engine } = await bootCampaign('campaign_greek_mythology');
    const p = engine.state.player;
    p.xp = 0;

    // Routine social activity: 1st = 100%, 2nd = 50%, 3rd = 25%, 4th = 0% (capped within 24h)
    const r1 = engine.awardXP(8, 'Persuaded Elder', { category: 'social', activityKey: 'persuade' });
    const r2 = engine.awardXP(8, 'Persuaded Merchant', { category: 'social', activityKey: 'persuade' });
    const r3 = engine.awardXP(8, 'Persuaded Guard', { category: 'social', activityKey: 'persuade' });
    const r4 = engine.awardXP(8, 'Persuaded Herdsman', { category: 'social', activityKey: 'persuade' });

    assert.strictEqual(r1.awarded, 8, '1st routine action awards full modest XP');
    assert.strictEqual(r2.awarded, 4, '2nd routine action within 24h yields 50%');
    assert.strictEqual(r3.awarded, 2, '3rd routine action within 24h yields 25%');
    assert.strictEqual(r4.awarded, 0, '4th routine action within 24h is capped at 0 XP');
    assert.strictEqual(r4.capped, true, '4th routine call marked capped');

    // Advancing 25 hours resets the 24h rolling window cleanly
    engine.advanceTime(25, 0);
    const r5 = engine.awardXP(8, 'Persuaded Citizen', { category: 'social', activityKey: 'persuade' });
    assert.strictEqual(r5.awarded, 8, 'rolling 24h window resets after a day');

    // Combat and Quest XP remain 100% exempt from routine diminishing returns
    const c1 = engine.awardXP(60, 'Defeated Cithaeron Wolf', { category: 'combat' });
    const c2 = engine.awardXP(60, 'Defeated Shadow Hound', { category: 'combat' });
    const q1 = engine.awardXP(120, 'Quest: Sanctuary Restored', { category: 'quest' });
    assert.strictEqual(c1.awarded, 60, 'combat XP unaffected by routine cap');
    assert.strictEqual(c2.awarded, 60, 'repeated combat XP remains full value');
    assert.strictEqual(q1.awarded, 120, 'quest completion XP remains full value');

    // One-time dialogue XP cannot be farmed twice
    const d1 = engine.awardXP(10, 'Dialogue Insight', { category: 'dialogue', oneTimeKey: 'dlg_test_1' });
    const d2 = engine.awardXP(10, 'Dialogue Insight', { category: 'dialogue', oneTimeKey: 'dlg_test_1' });
    assert.strictEqual(d1.awarded, 10);
    assert.strictEqual(d2.awarded, 0);
    assert.strictEqual(d2.duplicate, true, 'one-time dialogue XP blocked on repeat');
  });

  // ---------------------------------------------------------------------------
  // 2. Part 3.3 & 3.4: Usage-Based Skill Progression & Strict Main Attribute Invariant
  // ---------------------------------------------------------------------------
  await test('Part 3.3 & 3.4 Usage-Based Skill Progression: slow gradual skill ranks, anti-spam window, NEVER changes attributes/level/feats', async () => {
    const { env, engine } = await bootCampaign('campaign_northern_realms');
    const p = engine.state.player;
    p.skills.survival = 1;
    p.level = 1;
    p.xp = 0;
    p.feats = [];
    const attrsBefore = JSON.stringify(p.attributes);

    // Trivial check (DC < 8) grants zero practice
    const triv = engine.recordSkillUse('survival', { dc: 5, success: true });
    assert.strictEqual(triv.gained, 0, 'trivial effort must not grant skill progress');

    // Meaningful uses accumulate gradually; 2h window diminishes after 3 and caps at 6 uses
    const gains = [];
    for (let i = 0; i < 7; i++) {
      gains.push(engine.recordSkillUse('survival', { dc: 12, success: true }).gained);
    }
    assert.ok(gains[0] > 0 && gains[2] > 0, 'first 3 meaningful uses grant full practice');
    assert.ok(gains[3] < gains[0], 'uses 4-6 inside 2h window suffer diminishing returns');
    assert.strictEqual(gains[6], 0, '7th use inside 2h window capped to prevent spam');

    // Over several in-game days of realistic use, survival improves from Rank 1 -> Rank 2
    let leveled = false;
    for (let day = 0; day < 8 && !leveled; day++) {
      engine.advanceTime(4, 0);
      const res = engine.recordSkillUse('survival', { dc: 14, success: true, criticalSuccess: day % 2 === 0 });
      if (res.leveled) leveled = true;
    }
    assert.strictEqual(leveled, true, 'sustained meaningful use eventually raises skill rank');
    assert.strictEqual(p.skills.survival, 2, 'survival advanced from Rank 1 to Rank 2');

    // STRICT INVARIANT: Main attributes, character level, character XP, and feats MUST NOT change!
    assert.strictEqual(JSON.stringify(p.attributes), attrsBefore, 'main attributes MUST NEVER improve through skill use');
    assert.strictEqual(p.level, 1, 'character level MUST NOT increase from skill use');
    assert.strictEqual(p.xp, 0, 'character XP MUST NOT increase from skill use');
    assert.deepStrictEqual(p.feats, [], 'feats MUST NOT be granted by skill use');

    // Verify persistence across save/load
    engine.recordSkillUse('athletics', { dc: 12, success: true });
    const athXpBefore = engine.getSkillProgress('athletics').xp;
    assert.ok(athXpBefore > 0, 'athletics accumulated practice XP');
    engine.autosave();
    const loaded = await engine.loadGameSilently(engine.state.saveSlot);
    assert.strictEqual(loaded.player.skillProgress.athletics.xp, athXpBefore, 'skillProgress persists in save data');
    assert.strictEqual(loaded.player.skills.survival, 2, 'improved skill rank persists in save data');

    // Character Sheet renders practice bar without errors
    engine.renderCharacterSheet();
    const skillsHtml = env.el('sheet-skills-list').innerHTML;
    assert.ok(skillsHtml.includes('Practice '), 'character sheet displays skill-use practice progress');
  });

  // ---------------------------------------------------------------------------
  // 3. Part 4: Feat System Overhaul (Every 3 Levels + 20+ Modular Feats Across Systems)
  // ---------------------------------------------------------------------------
  await test('Part 4 Feat System Overhaul: every 3 levels (3, 6, 9...), 20+ feats across 6 categories, prerequisites & live gameplay effects', async () => {
    const { engine } = await bootCampaign('campaign_greek_mythology');
    const p = engine.state.player;

    // Milestone frequency: Levels 3, 6, 9, 12 grant feats; Levels 2, 4, 5, 7, 8 do NOT
    assert.strictEqual(engine.isFeatMilestoneLevel(1), false);
    assert.strictEqual(engine.isFeatMilestoneLevel(2), false);
    assert.strictEqual(engine.isFeatMilestoneLevel(3), true);
    assert.strictEqual(engine.isFeatMilestoneLevel(4), false);
    assert.strictEqual(engine.isFeatMilestoneLevel(5), false);
    assert.strictEqual(engine.isFeatMilestoneLevel(6), true);
    assert.strictEqual(engine.isFeatMilestoneLevel(9), true);
    assert.strictEqual(engine.getNextFeatMilestoneLevel(2), 3);
    assert.strictEqual(engine.getNextFeatMilestoneLevel(3), 6);

    // Catalog depth: >= 20 feats spanning all 6 categories
    const defs = engine.getHeroicFeatDefinitions();
    const featList = Object.values(defs);
    assert.ok(featList.length >= 20, `expected >= 20 modular feats, got ${featList.length}`);
    const cats = new Set(featList.map(f => f.category));
    ['combat', 'magic', 'crafting', 'social', 'exploration', 'loot'].forEach(c => {
      assert.ok(cats.has(c), `feat catalog must include '${c}' category`);
    });

    // Level 1 -> Level 2 does NOT grant a feat and refuses feat selection
    p.level = 1;
    p.xp = p.xpNext;
    engine.triggerLevelUp();
    assert.strictEqual(engine.levelUpState.grantsFeat, false, 'Level 2 must not grant a feat');
    assert.strictEqual(engine.selectLevelUpFeat('hydra_bane'), false, 'cannot select feat on non-milestone Level 2');
    engine.selectLevelUpAttr('wisdom');
    engine.selectLevelUpSkill('mythology_lore');
    engine.selectLevelUpSkill('survival');
    engine.confirmLevelUp();
    assert.strictEqual(p.level, 2);
    assert.strictEqual(p.feats.length, 0, 'no feat added on Level 2');

    // Level 2 -> Level 3 GRANTS a feat! Also test prerequisite gating (mythic_forgemaster requires master_artificer & L6)
    p.xp = p.xpNext;
    engine.triggerLevelUp();
    assert.strictEqual(engine.levelUpState.grantsFeat, true, 'Level 3 grants a feat');
    assert.strictEqual(engine.checkFeatEligibility('mythic_forgemaster', 3).eligible, false, 'prerequisite & level 6 enforced');
    assert.strictEqual(engine.selectLevelUpFeat('master_artificer'), true, 'eligible Level 3 crafting feat selected');
    engine.selectLevelUpAttr('charisma');
    engine.selectLevelUpSkill('persuasion');
    engine.selectLevelUpSkill('perception');
    engine.confirmLevelUp();
    assert.strictEqual(p.level, 3);
    assert.ok(p.feats.includes('master_artificer'), 'Level 3 feat saved onto character');

    // Verify modular gameplay integration across systems:
    // A. Magic capacity & spell power (arcane_reservoir + spellweaver_focus)
    p.attributes.wisdom = 14;
    p.attributes.intelligence = 14;
    p.skills.mythology_lore = 3;
    const capBefore = engine.getCombatSpellCapacityInfo();
    p.feats.push('arcane_reservoir', 'spellweaver_focus');
    const capAfter = engine.getCombatSpellCapacityInfo();
    assert.strictEqual(capAfter.capacity, capBefore.capacity + 1, 'Arcane Reservoir adds +1 spell capacity');
    assert.strictEqual(capAfter.spellPower, capBefore.spellPower + 3, 'Arcane Reservoir + Spellweaver Focus add +3 spell power');

    // B. Social / Trade / Faction Reputation (silver_tongue + civic_diplomat)
    p.attributes.charisma = 14;
    const repBefore = engine.getFactionReputation('faction_plataea');
    p.feats.push('silver_tongue', 'civic_diplomat');
    assert.ok(engine.getFeatSkillBonus('persuasion') >= 3, 'Silver Tongue + Civic Diplomat boost Persuasion');
    engine.modifyFactionReputation('faction_plataea', 10, 'Test Envoy');
    assert.ok(engine.getFactionReputation('faction_plataea') - repBefore > 10, 'Civic Diplomat boosts positive faction reputation');

    // C. Loot feats improve odds modestly without bypassing non-boss epic/legendary caps
    p.level = 6;
    p.skills.perception = 3;
    p.feats.push('fortune_seeker', 'relic_hunter');
    assert.ok(engine.getFeatEffectSum('lootChanceMult') > 0, 'loot feats provide active lootChanceMult');
    assert.ok(engine.getFeatEffectSum('lootCoinMult') > 0, 'Fortune Seeker boosts coin spoils');
  });

  // ---------------------------------------------------------------------------
  // 4. Part 5: World Map Overhaul (Zoom, Pan, Fit/Reset/Center & Large-Map Readability)
  // ---------------------------------------------------------------------------
  await test('Part 5 World Map Overhaul: zoom/pan bounds, fit/reset/center, quest markers & collision-free label readability', async () => {
    const { env, engine } = await bootCampaign('campaign_northern_realms');
    // Discover all 25 Northern Realms locations to stress-test large-map readability!
    engine.state.worldState.discoveredLocations = engine.world.locations.map(l => l.id);
    engine.renderMap();

    const mv0 = engine.ensureMapViewState();
    assert.strictEqual(mv0.zoom, 1.0, 'map initializes at 100% zoom');

    // Zoom in & clamp maxZoom
    const zIn = engine.zoomMap(1.5);
    assert.ok(zIn > 1.0 && zIn <= mv0.maxZoom, 'zoomMap increases zoom cleanly');
    engine.zoomMap(100);
    assert.strictEqual(engine.mapView.zoom, engine.mapView.maxZoom, 'zoom clamps at maxZoom');

    // Zoom out & clamp minZoom
    engine.zoomMap(0.01);
    assert.strictEqual(engine.mapView.zoom, engine.mapView.minZoom, 'zoom clamps at minZoom');

    // Pan & Fit & Reset & Center Hero
    engine.zoomMap(2.0);
    const xBefore = engine.mapView.x;
    engine.panMap(40, 30);
    assert.notStrictEqual(engine.mapView.x, xBefore, 'panMap shifts viewport cleanly');

    engine.centerMapOnHero();
    const curLoc = engine.getLocation(engine.state.worldState.currentLocationId);
    const centerX = engine.mapView.x + engine.mapView.w / 2;
    assert.ok(Math.abs(centerX - curLoc.coordinates.x) < 120, 'centerMapOnHero centers view on hero location');

    engine.fitMapToScreen();
    assert.ok(engine.mapView.w > 0 && engine.mapView.h > 0, 'fitMapToScreen computes valid bounding box');

    engine.resetMapView();
    assert.strictEqual(engine.mapView.zoom, 1.0, 'resetMapView restores 100% zoom');

    // Label readability check: current location label always visible, zoomed-in shows >= zoomed-out labels
    engine.zoomMap(0.55);
    const visibleOut = (engine._mapLabelEntries || []).filter(e => e.labelVisible).length;
    const curEntry = (engine._mapLabelEntries || []).find(e => e.isCurrent);
    assert.ok(curEntry && curEntry.labelVisible, 'current location label is always visible even when zoomed out');

    engine.zoomMap(4.0);
    const visibleIn = (engine._mapLabelEntries || []).filter(e => e.labelVisible).length;
    assert.ok(visibleIn >= visibleOut, `zooming in reveals more or equal labels (${visibleIn} >= ${visibleOut})`);

    const zoomBadge = env.el('map-zoom-label');
    assert.ok(zoomBadge && zoomBadge.textContent.includes('%'), 'zoom badge displays live percentage');
  });

  // ---------------------------------------------------------------------------
  // 5. Part 6: Campaign-Specific UI Customisation (Full, Partial Fallback & Sanitization)
  // ---------------------------------------------------------------------------
  await test('Part 6 Campaign UI Customisation: full theme switching, partial per-property fallback & CSS injection sanitization', async () => {
    const { engine } = await bootCampaign('campaign_northern_realms');
    const nrTheme = engine.resolveCampaignTheme(engine.activeCampaign);
    assert.strictEqual(nrTheme.accent, '#5a9ec9', 'Northern Realms loads its Nordic accent color');
    assert.strictEqual(nrTheme.bgVoid, '#0a0e14', 'Northern Realms loads its Nordic void background');

    // Partial theme falls back cleanly per property
    const partial = engine.resolveCampaignTheme({ theme: { accent: '#44aa66' } });
    const defaults = engine.getDefaultUiTheme();
    assert.strictEqual(partial.accent, '#44aa66', 'partial theme applies provided accent');
    assert.strictEqual(partial.bgVoid, defaults.bgVoid, 'unspecified bgVoid falls back cleanly to default');
    assert.strictEqual(partial.textPrimary, defaults.textPrimary, 'unspecified textPrimary falls back cleanly to default');

    // Malicious CSS injection value is rejected cleanly and falls back to default
    const malicious = engine.resolveCampaignTheme({ theme: { accent: '#fff; background: url(javascript:alert(1))' } });
    assert.strictEqual(malicious.accent, defaults.accent, 'malicious CSS value sanitized back to default');

    // Switching back to Greek default restores default palette
    const greekCamp = engine.campaigns.get('campaign_greek_mythology');
    const greekTheme = engine.applyCampaignTheme(greekCamp);
    assert.strictEqual(greekTheme.accent, defaults.accent, 'switching campaigns cleanly resets theme to Greek default');
  });

  // ---------------------------------------------------------------------------
  // 6. Part 7 & 8: Story Interface Cleanup & YouTube Soundtrack Embed
  // ---------------------------------------------------------------------------
  await test('Part 7 & 8 Story Cleanup & Campaign Soundtrack Embed: zero stale console text, strict YouTube URL sanitization & lazy click-to-load', async () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.strictEqual(html.includes('console bar below'), false, 'obsolete console bar instruction must not exist in index.html');
    assert.strictEqual(html.includes('enter any custom heroic deed'), false, 'obsolete heroic deed console text must not exist in index.html');

    const { env, engine } = await bootCampaign('campaign_greek_mythology');

    // Strict YouTube video ID parser
    assert.strictEqual(engine.parseYouTubeVideoId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.strictEqual(engine.parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s'), 'dQw4w9WgXcQ');
    assert.strictEqual(engine.parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.strictEqual(engine.parseYouTubeVideoId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.strictEqual(engine.parseYouTubeVideoId('javascript:alert(1)'), null, 'blocks javascript: injection');
    assert.strictEqual(engine.parseYouTubeVideoId('<script>alert(1)</script>'), null, 'blocks script tag injection');
    assert.strictEqual(engine.parseYouTubeVideoId('https://evil.example.com/watch?v=dQw4w9WgXcQ'), null, 'blocks non-YouTube domains');

    // Unconfigured campaign hides soundtrack widget cleanly
    engine.renderStorySoundtrackWidget(true);
    const widget = env.el('side-widget-soundtrack');
    assert.strictEqual(widget.style.display, 'none', 'soundtrack panel stays hidden when campaign has no soundtrack');

    // Configured campaign shows click-to-load placeholder (NO autoplay iframe!) until user clicks Load
    engine.activeCampaign = Object.assign({}, engine.activeCampaign, {
      soundtrack: { url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Aegean Lyre Ambience', subtitle: 'Optional Soundtrack' }
    });
    engine.renderStorySoundtrackWidget(true);
    const body = env.el('side-soundtrack-body');
    assert.strictEqual(widget.style.display, 'block', 'soundtrack panel displays for valid YouTube config');
    assert.strictEqual(body.innerHTML.includes('<iframe'), false, 'iframe is NOT eagerly loaded/autoplayed before user clicks');

    // Clicking Load mounts youtube-nocookie iframe safely without autoplay=1
    engine.loadCampaignSoundtrackEmbed();
    assert.ok(body.innerHTML.includes('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'mounts safe youtube-nocookie embed');
    assert.strictEqual(body.innerHTML.includes('autoplay=1'), false, 'never forces autoplay');

    // Invalid soundtrack config hides panel gracefully
    engine.activeCampaign = Object.assign({}, engine.activeCampaign, { soundtrack: { url: 'https://evil.test/hack' } });
    engine.renderStorySoundtrackWidget(true);
    assert.strictEqual(widget.style.display, 'none', 'invalid soundtrack config fails safely by hiding panel');
  });

  // ---------------------------------------------------------------------------
  // 7. Part 9: Crafting Reliability Bug Fix (Multi-Stack Counting & Stale Selection Pruning)
  // ---------------------------------------------------------------------------
  await test('Part 9 Crafting Reliability Bug Fix: multi-stack inventory counting, split-stack mat1===mat2 crafting & consumption', async () => {
    const { engine } = await bootCampaign('campaign_northern_realms');
    const prof = engine.getCampaignProfessions()[0];
    const mats = engine.getCampaignMaterials().filter(m => engine.isMaterialForProfession(m.id, prof));
    const mat = mats[0];
    const cat = engine.getProfessionCraftingCategories(prof.id)[0] || 'weapon';

    // Simulate the exact multi-stack bug: player owns 2 of the SAME material split across TWO separate inventory entries of qty 1!
    engine.state.player.inventory = [];
    if (prof.requiredToolkitId) {
      engine.state.player.inventory.push({ itemId: prof.requiredToolkitId, quantity: 1, equipped: false });
    }
    engine.state.player.inventory.push({ itemId: mat.id, quantity: 1, equipped: false });
    engine.state.player.inventory.push({ itemId: mat.id, quantity: 1, equipped: false });

    assert.strictEqual(engine.getItemQuantity(mat.id), 2, 'getItemQuantity sums across multiple stacks accurately');
    const check = engine.validateCraftingRequirements(prof, mat.id, mat.id, []);
    assert.strictEqual(check.valid, true, 'validateCraftingRequirements recognizes total 2 across split stacks');

    // Craft using both stacks of mat (mat1 === mat2)
    fixedRoll(engine, 18);
    engine.currentCraftingProfession = prof.id;
    const res = engine.craftItem(`category:${cat}`, mat.id, mat.id, []);
    assert.strictEqual(res.success, true, 'crafting succeeds cleanly with split stacks');
    assert.strictEqual(engine.getItemQuantity(mat.id), 0, 'both split stacks consumed cleanly without negative leftovers');
    assert.ok(res.item && res.item.name && engine.getItemQuantity(res.item.id) === 1, 'crafted item added to inventory');

    // Attempting again now properly reports Insufficient materials with exact needed/have details
    const failRes = engine.craftItem(`category:${cat}`, mat.id, mat.id, []);
    assert.strictEqual(failRes.success, false);
    assert.strictEqual(failRes.reason, 'Insufficient materials');
    assert.ok(failRes.details && failRes.details.includes('Need 2, Have 0'), 'provides exact per-material needed vs have counts');
  });

  // ---------------------------------------------------------------------------
  // 8. Part 10: Campaign Verification Overhaul (Undefined Scan, Isolated Functional Crafting, Pre-Start & AI Report)
  // ---------------------------------------------------------------------------
  await test('Part 10 Campaign Verification Overhaul: catches undefined/placeholders without prose false positives, isolated crafting check, pre-start & AI report', async () => {
    const { engine } = await bootCampaign('campaign_northern_realms');

    // A. Shipped Northern Realms passes BOTH static & isolated functional crafting verification cleanly without mutating player inventory!
    const invBefore = JSON.stringify(engine.state.player.inventory);
    const nrReport = await engine.runComprehensiveCampaignValidation('campaign_northern_realms', { showModal: false, includeFunctional: true });
    assert.strictEqual(nrReport.valid, true, 'Northern Realms passes full static + functional verification');
    assert.ok(nrReport.functionalVerification && nrReport.functionalVerification.executed, 'isolated functional crafting verification executed');
    assert.strictEqual(nrReport.functionalVerification.passed, true, 'functional crafting checks passed');
    assert.strictEqual(JSON.stringify(engine.state.player.inventory), invBefore, 'functional crafting verification NEVER mutates player inventory');

    // B. AI-developer report format separates Static vs Functional sections cleanly
    const aiText = engine.formatValidationReportForAI(engine.campaigns.get('campaign_northern_realms'), nrReport);
    assert.ok(aiText.includes('## 1. Static Content & Schema Verification'), 'report includes Static section');
    assert.ok(aiText.includes('## 2. Functional Gameplay Verification (Isolated Crafting Sandbox)'), 'report includes Functional section');

    // C. Deep undefined / NaN / unresolved template detection WITHOUT false positives on normal English prose
    const GreekMythologyEngine = engine.constructor;
    const brokenRes = GreekMythologyEngine.validateCampaign(
      { id: 'camp_broken', name: 'Broken Test', startingLocationId: 'loc_a', modules: { locations: 'locs.json', items: 'items.json' } },
      {
        locations: [
          {
            id: 'loc_a',
            name: 'Valid Ridge',
            coordinates: { x: 100, y: 100 },
            connections: [],
            narrative: { overview: 'Beyond this ridge lies an undefined horizon of mist and ice.' } // NORMAL PROSE: must NOT trigger false positive!
          },
          {
            id: 'loc_b',
            name: 'undefined', // BROKEN: literal undefined!
            coordinates: { x: 200, y: 200 },
            connections: [],
            narrative: { overview: 'Welcome to {{MISSING_PLACE_NAME}}' } // BROKEN: unresolved placeholder!
          }
        ],
        items: [
          { id: 'item_nan_sword', name: 'Broken Sword', category: 'weapon', slot: 'main_hand', valueDrachmae: Number.NaN }
        ]
      }
    );
    assert.strictEqual(brokenRes.valid, false, 'broken campaign fails validation');
    const integrityMsgs = brokenRes.findings.filter(f => f.module === 'Data Integrity').map(f => f.message).join(' | ');
    assert.ok(integrityMsgs.includes("Broken literal string 'undefined'"), 'detects literal undefined string');
    assert.ok(integrityMsgs.includes('Unresolved template placeholder'), 'detects unresolved {{placeholder}}');
    assert.ok(integrityMsgs.includes('Invalid NaN numeric value'), 'detects NaN numeric values');
    assert.strictEqual(integrityMsgs.includes('undefined horizon'), false, 'must NOT false-positive on normal prose containing the word "undefined"');
    assert.ok(brokenRes.findings.every(f => f.id && f.filePath), 'every structured finding has an ID and filePath for AI diagnostics');

    // D. Pre-start verification pauses when a campaign has warnings/errors and allows user to review or continue
    engine.campaigns.set('camp_warn_test', {
      id: 'camp_warn_test',
      name: 'Warning Campaign',
      startingLocationId: 'loc_a',
      soundtrack: { url: 'https://invalid-host.example/bad' }, // triggers Soundtrack warning
      modules: {}
    });
    engine.selectedCampaignId = 'camp_warn_test';
    const launchRes = await engine.confirmCampaignSelection();
    assert.ok(launchRes && launchRes.pausedForValidation === true, 'pre-start check pauses and opens report when warnings/errors exist');
  });

  // ---------------------------------------------------------------------------
  // 9. Part 11: Wait & Time Advancement Feature
  // ---------------------------------------------------------------------------
  await test('Part 11 Wait & Time Advancement: advances clock & scheduled events with ZERO healing/rest/item loss, blocked in combat', async () => {
    const { engine } = await bootCampaign('campaign_greek_mythology');
    const p = engine.state.player;
    const w = engine.state.worldState;

    // Wound the player & drain stamina so we can verify Wait NEVER heals or restores stamina!
    p.vitals.health = 10;
    p.vitals.stamina = 5;
    const invSnapshot = JSON.stringify(p.inventory);
    const locBefore = w.currentLocationId;
    const startMin = engine.getTotalInGameMinutes();

    // Schedule a world event 3 hours from now to confirm Wait fires scheduled world events cleanly
    let eventFired = false;
    engine.scheduleEvent({
      id: 'test_wait_scheduled_evt',
      delayHours: 3,
      type: 'custom',
      payload: { setFlags: { wait_event_triggered: true } }
    });

    const waitRes = engine.executeWait(4);
    assert.strictEqual(waitRes.success, true, 'Wait 4 hours succeeds outside combat');
    assert.strictEqual(engine.getTotalInGameMinutes() - startMin, 240, 'clock advanced exactly 4 hours (240 min)');
    assert.strictEqual(p.vitals.health, 10, 'Wait MUST NOT heal Health');
    assert.strictEqual(p.vitals.stamina, 5, 'Wait MUST NOT restore Stamina');
    assert.strictEqual(JSON.stringify(p.inventory), invSnapshot, 'Wait MUST NOT consume rations or items');
    assert.strictEqual(w.currentLocationId, locBefore, 'Wait MUST NOT change location');
    eventFired = Boolean(w.flags.wait_event_triggered);
    assert.strictEqual(eventFired, true, 'Wait triggers scheduled world events on time');

    // Invalid durations rejected safely
    assert.strictEqual(engine.executeWait(0).success, false, '0 hours rejected');
    assert.strictEqual(engine.executeWait(48).success, false, '>24 hours rejected');

    // Strictly blocked during active combat
    engine.startCombat(engine.getCreature('creature_cithaeron_wolf'), { encounterId: 'enc_fissure_beast' });
    assert.ok(engine.combatSession && !engine.combatSession.ended, 'combat session is active');
    const duringCombat = engine.executeWait(2);
    assert.strictEqual(duringCombat.success, false, 'Wait blocked during active combat');
    assert.strictEqual(duringCombat.blocked, true);
  });

  // Summary
  const passed = results.filter(r => r.ok).length;
  console.log('\n=================================================================');
  console.log(`PHASE TWO SYSTEMS SUMMARY: ${passed} / ${results.length} passed`);
  console.log('=================================================================');
  if (passed !== results.length) process.exit(1);
})();

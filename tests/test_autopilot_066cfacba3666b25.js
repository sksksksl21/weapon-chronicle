const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const legacy = fs.readFileSync(path.join(__dirname, '../src/legacy/game_runtime.js'), 'utf8');
const status = fs.readFileSync(path.join(__dirname, '../src/core/status_skilldeck_v1.js'), 'utf8');
const bridge = fs.readFileSync(path.join(__dirname, '../src/core/direct_combat_runtime_v2.js'), 'utf8');
const ledger = fs.readFileSync(path.join(__dirname, '../src/core/save_ledger_v48.js'), 'utf8');
const combat = fs.readFileSync(path.join(__dirname, '../src/core/direct_combat_stats_v2.js'), 'utf8');

// Isolate inspected declarations so browser startup and unrelated assets are unnecessary.
function section(source, first, next) {
  const start = source.indexOf(first);
  const end = source.indexOf(next, start + first.length);
  assert.ok(start >= 0 && end > start, 'Inspected declaration boundaries must exist');
  return source.slice(start, end);
}

function fixture(points) {
  return {
    owner: {name: '에이라', role: '전장 수습꾼', age: 22,
      martial: points, survival: points, social: points,
      deeds: {martial: [], survival: [], social: []}},
    ownerProgress: {level: 1, combatXp: 0, lifeXp: 0, reputation: 0},
    weapon: {parts: {}, legacyTitles: [], materials: {}, dur: 80, resonance: 20},
    ownerEquipment: {}, contacts: {}, unlockedSkills: [],
    year: 3, month: 7, generation: 2, hp: 80, maxHp: 100, mind: 100, maxMind: 100,
    pastOwners: [{name: '테온', reason: 'battle', generation: 1}],
    lastSuccessionRoll: {martial: points, survival: points, social: points, armor: []},
    mainStory: {mainV47: {stage: 12, results: [{no: 9, result: 'win', path: 'A'}]}},
    branchFlags: {harborSaved: true}, endingRecords: [], worldHistory: [],
    resonanceTopics: [], storyCtx: null, activeStory: null
  };
}

function harness(points) {
  const storage = new Map();
  const box = vm.createContext({
    state: fixture(points), SAVE_KEY: 'stat-regression',
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, value)
    },
    clamp: (value, low, high) => Math.max(low, Math.min(high, value)),
    ownerGearBonuses: () => ({}), weaponMartialBonus: () => 0,
    armorSurvivalValue: () => 0, ensureV26Progression: () => {},
    PART_CATALOG: {}, OWNER_GEAR_CATALOG: {},
    n: value => Number(value) || 0, escapeHtml: value => String(value),
    blankOwnerEquipment: () => ({}), makeNewContacts: () => ({}),
    ri: low => low,
    syncOwnerVitalCaps: () => {},
    archiveCurrentOwner: reason => {
      box.state.pastOwners.push({name: box.state.owner.name, reason: reason});
    }
  });
  vm.runInContext(section(status, 'const OWNERS=[', 'const SKILLS=['), box);
  vm.runInContext(section(status, 'function profileFromRow(', 'function ensureOwner('), box);
  vm.runInContext(section(legacy, 'function mentalPerformance(', '/* retired duplicate weaponMartialBonus */'), box);
  vm.runInContext(section(legacy, 'function lifeExperienceBonus(', '/* retired duplicate armorSurvivalValue */'), box);
  vm.runInContext(section(legacy, 'function relationNetworkBonus(', 'function ownerVitalCaps('), box);
  vm.runInContext(section(legacy, 'function resetOwnerAssetsForSuccessor(', '\nfunction '), box);
  vm.runInContext(combat, box);
  vm.runInContext(section(bridge, 'function wcDirectOwnerRates(', '// The live handoff'), box);
  vm.runInContext(section(status, 'function statRows(', 'function armorBody('), box);
  vm.runInContext(ledger, box);
  return box;
}

function run(box, expression) {
  return vm.runInContext(expression, box);
}

function verifyCombat(box, expected) {
  const rates = run(box, 'wcDirectOwnerRates()');
  for (const key of ['martial', 'survival', 'social']) {
    assert.equal(rates[key], expected[key], key + ' must retain the 0..100 unit');
  }
  const result = run(box, 'WC_DIRECT_COMBAT_V2.snapshot({owner:wcDirectOwnerRates(),weapon:{minAttack:100,maxAttack:100,defense:100}})');
  assert.equal(result.minAttack, Math.round(expected.martial));
  assert.equal(result.maxAttack, Math.round(expected.martial));
  assert.equal(result.defense, Math.round(expected.survival));
  assert.equal(result.breakdown.martialRate, expected.martial / 100);
  assert.equal(result.breakdown.survivalRate, expected.survival / 100);
}

test('authored owner points survive creation, growth and death succession in combat units', () => {
  const box = harness(50);
  run(box, 'state.owner=profileFromRow(OWNERS.find(row=>row[0]==="에이라"))');
  const row = run(box, 'OWNERS.find(row=>row[0]==="에이라")');
  assert.equal(row[3], 50, 'The authored five-of-ten martial value must be restored to fifty-of-one-hundred');
  assert.equal(box.state.owner.martial, row[3]);
  verifyCombat(box, {martial: 50, survival: 90, social: 30});
  box.state.ownerProgress.level = 5;
  box.state.ownerProgress.lifeXp = 15;
  box.state.ownerProgress.reputation = 24;
  verifyCombat(box, {martial: 53, survival: 92, social: 32});
  run(box, 'resetOwnerAssetsForSuccessor(profileFromRow(OWNERS.find(row=>row[0]==="에이라")),"battle","inherited sword")');
  assert.equal(box.state.generation, 3);
  assert.equal(box.state.ownerProgress.level, 1);
  assert.equal(box.state.pastOwners.length, 2);
  box.state.mind = 100;
  verifyCombat(box, {martial: 50, survival: 90, social: 30});
});

test('status uses integer ability labels without changing precise combat inputs', () => {
  const box = harness(50);
  box.state.mind = 65;
  const before = JSON.stringify(box.state);
  const html = run(box, 'ownerBody()');
  for (const title of ['무예', '생존', '처세']) {
    assert.ok(html.includes('<b>' + title + '</b><strong>48<small>/100</small>'),
      title + ' must display the rounded integer for 50 points at 95 percent mental performance');
  }
  verifyCombat(box, {martial: 47.5, survival: 47.5, social: 47.5});
  assert.equal(JSON.stringify(box.state), before, 'Opening status must not mutate stats or saved progress');
});

test('normal and legacy-scale saves converge once and preserve progress across repeated round trips', () => {
  for (const points of [50, 5]) {
    const box = harness(points);
    const original = JSON.stringify(box.state);
    const progress = JSON.stringify(box.state.mainStory);
    const ancestry = JSON.stringify(box.state.pastOwners);
    let canonical;
    for (let cycle = 0; cycle < 4; cycle++) {
      run(box, 'state=v48PrepareLoad(JSON.stringify(state))');
      assert.equal(run(box, 'v48SaveGame()'), true);
      run(box, 'state=v48PrepareLoad(localStorage.getItem(SAVE_KEY))');
      for (const key of ['martial', 'survival', 'social']) {
        assert.equal(box.state.owner[key], 50, 'Legacy personal points must convert once; normal points must remain unchanged');
        assert.equal(box.state.lastSuccessionRoll[key], 50, 'Succession records must use the same unit as their owner');
      }
      verifyCombat(box, {martial: 50, survival: 50, social: 50});
      assert.equal(JSON.stringify(box.state.mainStory), progress);
      assert.equal(JSON.stringify(box.state.pastOwners), ancestry);
      assert.equal(box.state.generation, 2);
      assert.equal(box.state.year, 3);
      assert.equal(box.state.month, 7);
      assert.equal(box.state.branchFlags.harborSaved, true);
      const snapshot = run(box, 'v48SerializeState()');
      delete snapshot.saveMeta.savedAt;
      if (cycle === 0) canonical = JSON.stringify(snapshot);
      assert.equal(JSON.stringify(snapshot), canonical, 'Repeated saves must not apply another conversion');
    }
    assert.equal(run(box, 'localStorage.getItem(V48_BACKUP_KEY)'), original, 'Keep the original pre-migration save');
  }
});

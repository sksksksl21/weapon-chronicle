const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('equipment codex exposes undiscovered equipment without changing inventory or saves', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/legacy/game_runtime.js'), 'utf8');
  function section(start, end) {
    const first = source.indexOf(start);
    const last = source.indexOf(end, first);
    assert.ok(first >= 0 && last > first, 'Inspected source declaration must be available');
    return source.slice(first, last);
  }

  let html = '';
  let saveWrites = 0;
  const saved = { slot: 'previous durable save', checkpoint: 'mission start' };
  const state = {
    discoveredParts: ['iron_long'],
    partOrigins: { iron_long: 'starting equipment' },
    gold: 123,
    weapon: { parts: { blade: 'iron_long' }, spareParts: {} },
    ownerEquipment: {},
    ownerGearOwned: {}
  };
  const before = JSON.stringify(state);
  const savedBefore = JSON.stringify(saved);
  const context = vm.createContext({
    state,
    PART_LABELS: {
      blade: 'Blade', guard: 'Guard', tang: 'Tang', grip: 'Grip',
      wrap: 'Wrap', pommel: 'Pommel', seat: 'Seat', scabbard: 'Scabbard'
    },
    openModal: function (content) { html = content; },
    modalHead: function (title, description) { return title + description; },
    bindClose: function () {},
    rarityFrameClass: function () { return ''; },
    saveGame: function () { saveWrites += 1; },
    localStorage: {
      getItem: function (key) { return saved[key] || null; },
      setItem: function (key, value) { saveWrites += 1; saved[key] = value; },
      removeItem: function (key) { saveWrites += 1; delete saved[key]; }
    }
  });
  let runtimeError;
  try {
    vm.runInContext(section('const PART_CATALOG={', 'function partRarity('), context);
    vm.runInContext(section('function allPartIds(){', 'function inventoryTabs('), context);
    vm.runInContext('openPartCodex();', context);
  } catch (error) {
    runtimeError = String(error);
  }
  assert.equal(runtimeError, undefined, 'Actual codex entrypoint must render: ' + (runtimeError || ''));

  assert.equal(JSON.stringify(state), before, 'Browsing must preserve discovery, currency and equipment');
  assert.equal(saveWrites, 0, 'Browsing must not write saves or remove a recovery checkpoint');
  assert.equal(JSON.stringify(saved), savedBefore, 'Durable saves must remain unchanged');
  assert.ok(html.includes('단조 철 장검날'), 'The actual modal must render the discovered starter blade');
  // Necessary a1 behavior; this VM harness does not establish mobile layout or comparison coverage (a2).
  assert.ok(html.includes('넓은 청동 절단날'), 'Undiscovered equipment must remain individually accessible in the codex instead of being reduced to a hidden count');
  assert.ok(html.includes('강한 절단력과 견고함 대신 정밀·조작성을 크게 포기한다.'), 'Undiscovered equipment must expose its option tradeoffs');
});

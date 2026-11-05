const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

// Existing succession coverage cannot be inspected within the permitted sources.
// This regression covers the independently observable duplicate persistence gap.
test('save recovery preserves inputs and reproduces stats without persisting derived stats', () => {
  const ledger = fs.readFileSync(path.join(__dirname, '../src/core/save_ledger_v48.js'), 'utf8');
  const checkpoints = fs.readFileSync(path.join(__dirname, '../src/core/action_checkpoint_v482.js'), 'utf8');
  const runtime = fs.readFileSync(path.join(__dirname, '../src/legacy/game_runtime.js'), 'utf8');
  const start = runtime.indexOf('function recalcWeapon(weaponInput=null){');
  const end = runtime.indexOf('\n}', start);
  assert.ok(start >= 0 && end > start, 'Locate the actual weapon calculation');
  const storage = new Map();
  const state = {
    year: 3, month: 7, generation: 2,
    owner: { name: 'Successor', strength: 8 },
    ownerEquipment: { head: 'inherited_helm' },
    ownerProgress: { level: 4, xp: 17 },
    mainStory: { chapter: 12, flags: { rescued: true } },
    weapon: {
      parts: { blade: 'inherited_blade' },
      upgrades: { edge: 3, temper: 2, balance: 1, core: 2 },
      resonance: 20,
      spareParts: { spare_blade: 1 },
      deathMemories: [{ owner: 'Previous owner' }]
    }
  };
  const context = vm.createContext({
    state,
    SAVE_KEY: 'save',
    PART_CATALOG: { blade: { inherited_blade: { mods: {
      power: 7, precision: 4, toughness: 3, handling: 2,
      maxResonance: 70, weight: 2
    } } } },
    clamp: (value, low, high) => Math.min(high, Math.max(low, value)),
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    }
  });
  vm.runInContext(ledger, context);
  vm.runInContext(checkpoints, context);
  vm.runInContext(runtime.slice(start, end + 2), context);
  const original = JSON.stringify(state);
  context.recalcWeapon();
  const expectedPower = state.weapon.power;
  const expectedPrecision = state.weapon.precision;
  assert.equal(expectedPower, 10);
  assert.equal(expectedPrecision, 5);
  const beforeSave = JSON.stringify(state);
  const saved = context.v48SerializeState();
  assert.equal(JSON.stringify(state), beforeSave, 'Serialization must not mutate live inputs');
  assert.equal(context.v482BeginAction(), true);
  state.weapon.parts.blade = 'interrupted_change';
  state.ownerProgress.xp = 999;
  assert.equal(context.v482RecoverPendingAction(), true);
  const restored = JSON.parse(storage.get('save'));
  context.state = restored;
  context.recalcWeapon();
  assert.equal(restored.weapon.power, expectedPower);
  assert.equal(restored.weapon.precision, expectedPrecision);
  const inputs = JSON.parse(original);
  assert.equal(JSON.stringify(restored.weapon.parts), JSON.stringify(inputs.weapon.parts));
  assert.equal(JSON.stringify(restored.weapon.upgrades), JSON.stringify(inputs.weapon.upgrades));
  assert.equal(JSON.stringify(restored.ownerEquipment), JSON.stringify(inputs.ownerEquipment));
  assert.equal(JSON.stringify(restored.ownerProgress), JSON.stringify(inputs.ownerProgress));
  assert.equal(JSON.stringify(restored.mainStory), JSON.stringify(inputs.mainStory));
  assert.equal(JSON.stringify(restored.weapon.deathMemories), JSON.stringify(inputs.weapon.deathMemories));
  assert.equal(restored.generation, inputs.generation);
  assert.equal(storage.has('save.action-checkpoint-v482'), false);
  assert.equal(Object.hasOwn(saved.weapon, 'power'), false,
    'Persist equipment and growth inputs, without duplicating calculated weapon power');
});

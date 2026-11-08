'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('acquiring two rolled copies discovers one equipment type and preserves separate ownership', () => {
  const runtime = fs.readFileSync(path.join(__dirname, '../src/legacy/game_runtime.js'), 'utf8');
  const pool = fs.readFileSync(path.join(__dirname, '../src/core/equipment_pool_v1.js'), 'utf8');
  const ledger = fs.readFileSync(path.join(__dirname, '../src/core/save_ledger_v48.js'), 'utf8');
  const lines = runtime.split('\n');
  const acquisition = lines.filter(line => line.startsWith('function discoverPart(') || line.startsWith('function addSpare('));
  assert.equal(acquisition.length, 2, 'Use the existing acquisition declarations');
  const succession = lines.find(line => line.startsWith('function resetOwnerAssetsForSuccessor('));
  assert.ok(succession, 'Use the existing succession implementation');

  const parts = {};
  for (const slot of ['blade', 'guard', 'tang', 'grip', 'wrap', 'pommel', 'seat', 'scabbard']) {
    parts[slot] = { base: { name: slot, mods: { power: 5 }, shopPrice: 20 } };
  }
  const armor = {};
  for (const slot of ['helmet', 'armor', 'gloves', 'boots']) {
    armor[slot] = { name: slot, slot, mods: { defense: 5 }, price: 20 };
  }
  const context = vm.createContext({
    PART_CATALOG: parts,
    OWNER_GEAR_CATALOG: armor,
    RARITY_DEF: {},
    state: { generation: 1, weapon: { parts: {}, spareParts: {} }, discoveredParts: [] },
    archiveCurrentOwner: () => {},
    ri: () => 18,
    blankOwnerEquipment: () => ({}),
    makeNewContacts: () => ({}),
    syncOwnerVitalCaps: () => {}
  });
  vm.runInContext(pool, context);
  vm.runInContext(acquisition.join('\n') + '\n' + succession, context);
  vm.runInContext(ledger, context);
  const equipment = vm.runInContext('WC_EQUIPMENT_POOL_V1', context);
  const first = 'wc6_blade_0_rare_aaaaa';
  const second = 'wc6_blade_0_rare_bbbbb';
  const firstItem = equipment.restoreCopy(first);
  const secondItem = equipment.restoreCopy(second);
  assert.ok(firstItem);
  assert.ok(secondItem);
  assert.equal(firstItem.templateId, secondItem.templateId);
  assert.ok(JSON.stringify(firstItem.mods) !== JSON.stringify(secondItem.mods), 'Fixtures have different rolled stats');

  context.addSpare(first);
  assert.equal(context.state.weapon.spareParts[first], 1);
  assert.equal(context.state.discoveredParts.length, 1, 'First acquisition immediately discovers equipment');
  context.addSpare(second);
  assert.equal(context.state.weapon.spareParts[first], 1);
  assert.equal(context.state.weapon.spareParts[second], 1);
  assert.equal(context.state.discoveredParts.length, 1, 'Different random options must not duplicate the discovered equipment type');

  context.addSpare(first, -1);
  context.addSpare(second, -1);
  assert.equal(Object.keys(context.state.weapon.spareParts).length, 0);
  assert.equal(context.state.discoveredParts.length, 1, 'Disposing of the last copy preserves discovery');
  const saved = context.v48SerializeState();
  context.state = JSON.parse(JSON.stringify(saved));
  assert.equal(context.state.discoveredParts.length, 1, 'Discovery survives serialized state restoration');
  context.resetOwnerAssetsForSuccessor({ name: 'Successor' }, 'death', 'test');
  assert.equal(context.state.generation, 2);
  assert.equal(context.state.discoveredParts.length, 1, 'Discovery survives owner succession');
});

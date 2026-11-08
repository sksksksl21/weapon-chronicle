const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('equipment details preserve originals, expose rolled performance and normalize historical grades', () => {
  const weaponSlots = ['blade', 'guard', 'tang', 'grip', 'wrap', 'pommel', 'seat', 'scabbard'];
  const armorSlots = ['helmet', 'armor', 'gloves', 'boots'];
  const grades = ['common', 'rare', 'unique', 'legendary', 'chronicle'];
  const parts = {};
  const gear = {};
  const originals = [];
  for (const slot of weaponSlots) {
    const item = { name: slot, rarity: 'beyond', mods: { power: 12, precision: 4, toughness: 3, handling: 2 }, shopPrice: 40 };
    parts[slot] = { original: item };
    originals.push({ slot, kind: 'weapon', item, before: JSON.stringify(item) });
  }
  for (const slot of armorSlots) {
    const item = { name: slot, slot, rarity: 'beyond', mods: { defense: 8, maxHp: 10 }, price: 40 };
    gear[slot] = item;
    originals.push({ slot, kind: 'armor', item, before: JSON.stringify(item) });
  }
  const owner = { martial: 65, survival: 70, stableSurvival: 60 };
  const context = vm.createContext({
    PART_CATALOG: parts,
    OWNER_GEAR_CATALOG: gear,
    RARITY_DEF: { beyond: { rank: 5, weight: 1 } },
    wcDirectOwnerRates: () => owner
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/core/direct_combat_stats_v2.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/core/equipment_pool_v1.js'), 'utf8'), context);
  const pool = vm.runInContext('WC_EQUIPMENT_POOL_V1', context);
  const calculator = vm.runInContext('WC_DIRECT_COMBAT_V2', context);
  assert.equal(pool.TIERS.map(tier => tier.id).join(','), grades.join(','));
  assert.equal(pool.TIERS.map(tier => tier.weight).join(','), '58,26,11,4,1');

  for (const entry of originals) {
    const catalog = entry.kind === 'weapon' ? parts[entry.slot] : gear;
    const id = entry.kind === 'weapon' ? 'original' : entry.slot;
    assert.equal(catalog[id], entry.item);
    assert.equal(JSON.stringify(entry.item), entry.before);
    for (const grade of grades) {
      assert.ok(catalog['wc5_' + entry.slot + '_0_' + grade]);
    }
    const direct = calculator.migrateLegacyPart(entry.item.mods, entry.kind, entry.slot);
    const effects = calculator.itemEffects(direct, { kind: entry.kind, slot: entry.slot, owner });
    const detail = pool.formatDetail(entry.item);
    for (const description of calculator.describeItemEffects(effects)) {
      assert.ok(detail.includes(description), 'Original detail must show calculated owner-applied performance');
    }
  }
  const countsBefore = JSON.stringify(pool.expand(parts, gear, context.RARITY_DEF));
  assert.equal(JSON.stringify(pool.expand(parts, gear, context.RARITY_DEF)), countsBefore);

  const firstId = 'wc6_blade_0_legendary_aaaaa';
  const secondId = 'wc6_blade_0_legendary_bbbbb';
  const first = pool.restoreCopy(firstId);
  const second = pool.restoreCopy(secondId);
  assert.ok(first && second);
  assert.ok(first !== second);
  assert.ok(JSON.stringify(first.mods) !== JSON.stringify(second.mods), 'Same template must support independent option rolls');
  assert.equal(pool.restoreCopy(firstId), first);
  for (const item of [first, second]) {
    const direct = calculator.migrateLegacyPart(item.mods, 'weapon', 'blade');
    const actual = calculator.calculate({ owner, parts: { blade: direct } });
    const effects = calculator.itemEffects(direct, { kind: 'weapon', slot: 'blade', owner });
    assert.equal(effects.minAttack, actual.minAttack);
    assert.equal(effects.maxAttack, actual.maxAttack);
    assert.equal(effects.defense, actual.defense);
    for (const description of calculator.describeItemEffects(effects)) {
      assert.ok(pool.formatDetail(item).includes(description));
    }
  }

  for (const entry of originals) {
    assert.equal(pool.rarityClass(entry.item), 'rarity-chronicle');
    assert.ok(pool.formatDetail(entry.item).includes('wc5-grade-chronicle'),
      'Historical beyond equipment must display the chronicle grade in details, consistently with its card and the five-grade catalog');
    assert.equal(JSON.stringify(entry.item), entry.before);
  }
});

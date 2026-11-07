const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('four status tabs preserve equipment and snapshot values without legacy weapon stats', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/legacy/game_runtime.js'), 'utf8');
  const names = ['statusTabs', 'statBreakdownHtml', 'gearSummaryHtml', 'openStatus'];
  const declarations = names.map((name) => {
    const start = source.indexOf('function ' + name + '(');
    assert.ok(start >= 0, 'Existing renderer must be present: ' + name);
    const end = source.indexOf('\nfunction ', start + 1);
    assert.ok(end > start, 'Renderer declaration must have a bounded end');
    return source.slice(start, end);
  });
  // Isolate the actual UI declarations from startup and embedded assets.
  // Fixed collaborator outputs form a deliberately asymmetric display snapshot.
  const raw = {
    martial: 31, survival: 27, social: 19,
    parts: { martialBase: 20, level: 3, weapon: 8,
      survivalBase: 18, life: 4, armor: 5,
      socialBase: 10, relations: 2, reputation: 3, narrative: 4 }
  };
  const equipment = { head: 'helmet', body: 'coat', hands: 'gloves', feet: 'boots' };
  let rendered = '';
  const context = vm.createContext({
    state: {
      owner: { name: 'Snapshot owner' }, generation: 2, mind: 50, maxMind: 100,
      ownerEquipment: equipment,
      ownerProgress: { level: 5, combatXp: 12, lifeXp: 28, reputation: 36 },
      weapon: { power: 41, precision: 32, toughness: 23, handling: 14,
        maxResonance: 77, resonanceRecovery: 6 }
    },
    ensureV26Progression() {}, recalcWeapon() {},
    rawOwnerStats() { return raw; },
    effectiveOwnerStats() { return { martial: 26.35, survival: 22.95, social: 16.15 }; },
    mentalPerformance() { return { mult: 0.85, pct: 85, label: '불안' }; },
    derivedAbilities() { return { dmgMin: 13, dmgMax: 29, accuracy: 83,
      crit: 17, guard: 11, evade: 9, resist: 7 }; },
    weaponProfile() { return { name: 'Snapshot sword' }; },
    combatXpNeed() { return 230; },
    clamp(value, low, high) { return Math.max(low, Math.min(high, value)); },
    ownerGearBonuses() { return { maxHp: 12, defense: 4, evade: 2, resist: 3 }; },
    armorSurvivalValue() { return 5; },
    gearBoardHtml() {
      return '<div class="ownerGearBoard">helmet coat gloves boots</div>';
    },
    ownerGearInventoryHtml() { return '<div>Spare armor</div>'; },
    equipmentVisualHtml() { return '<div class="swordParts">Eight equipped parts</div>'; },
    fmtPct(value) { return String(Math.round(value)) + '%'; },
    modalHead() { return ''; },
    openModal(html) { rendered = html; }, bindClose() {},
    document: { querySelectorAll() { return []; } }
  });
  vm.runInContext(declarations.join('\n'), context);
  const before = JSON.stringify(context.state);
  const pages = {};
  for (const tab of ['owner', 'gear', 'weapon', 'combat']) {
    context.openStatus(tab);
    pages[tab] = rendered;
    const positions = ['owner', 'gear', 'weapon', 'combat'].map((key) =>
      rendered.indexOf('data-stab="' + key + '"'));
    assert.ok(positions[0] >= 0 && positions.every((position, i) =>
      i === 0 || position > positions[i - 1]), 'Four tab order: ' + tab);
    assert.equal(rendered.split('class="tabRow"').length - 1, 1);
    assert.ok(rendered.split('class="statusGrid"').length - 1 <= 1,
      'No duplicate stat panel: ' + tab);
    assert.equal(JSON.stringify(context.state), before, 'Viewing must preserve state');
  }
  for (const tab of ['owner', 'gear']) {
    assert.equal(pages[tab].split('class="ownerGearBoard"').length - 1, 1);
    assert.ok(pages[tab].includes('helmet coat gloves boots'));
    for (const value of ['생존 기여 +5', 'HP +12', '방어 +4', '회피 +2', '저항 +3']) {
      assert.ok(pages[tab].includes(value), tab + ': ' + value);
    }
  }
  for (const value of ['무예<b>26</b>', '생존<b>23</b>', '처세<b>16</b>',
    '<span>검 기여</span><b>+8</b>', '<span>방어구</span><b>+5</b>']) {
    assert.ok(pages.owner.includes(value), 'Owner snapshot: ' + value);
  }
  for (const value of ['공격력<b>13~29</b>', '명중<b>83%</b>', '치명<b>17%</b>',
    '방어<b>11</b>', '회피<b>9%</b>', '상태저항<b>7</b>']) {
    assert.ok(pages.combat.includes(value), 'Combat snapshot: ' + value);
  }
  assert.equal(pages.weapon.split('class="swordParts"').length - 1, 1);
  for (const label of ['위력', '정밀', '견고', '조작성']) {
    assert.equal(pages.weapon.includes('class="statusStat">' + label + '<b>'), false,
      'Weapon tab must remove legacy four-stat display: ' + label);
  }
});

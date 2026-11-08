const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('discard controls reflect the actual intervention budget without changing battle state', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/combat/story_combat.html'), 'utf8');
  function declaration(name, endMarker) {
    const start = source.indexOf('function ' + name + '(');
    assert.ok(start >= 0, name + ' must exist');
    const end = source.indexOf(endMarker, start);
    assert.ok(end > start, name + ' must have a bounded declaration');
    return source.slice(start, end);
  }
  function element() {
    return {
      children: [],
      innerHTML: '',
      className: '',
      disabled: false,
      appendChild(child) { this.children.push(child); }
    };
  }
  let cards = element();
  const context = vm.createContext({
    document: { createElement: element },
    $: () => cards,
    phase: 'pre',
    cardUses: 0,
    maxCardUses: 1,
    discardedThisTurn36: false,
    coreLockedThisTurn: false,
    selectedPre: [],
    hand: ['guard'],
    discard: [],
    discardChoice36: null,
    resonance: 40,
    hero: { hp: 50, maxHp: 100 },
    enemy: { hp: 60, maxHp: 60 },
    CARD_DB: { guard: { timing: 'pre', type: 'defense', flavor: '' } },
    canAffordResonance: () => true,
    comboWithCandidate: () => null,
    currentCombo: () => null,
    isUpgraded: () => false,
    tagsFor: () => [],
    growthText: () => '',
    displayCardName: () => 'Guard',
    displayCardEffect: () => 'Reduce damage',
    cardCost: () => 10
  });
  vm.runInContext(declaration('canDiscardBattleCard36', '\nfunction discardBattleCard36'), context);
  vm.runInContext(declaration('canUseCard', '\nfunction '), context);
  vm.runInContext(declaration('renderCards', '\nfunction canUseBattleItem'), context);

  function snapshot() {
    return vm.runInContext('JSON.stringify({hero,enemy,hand,discard,resonance,cardUses,selectedPre,discardedThisTurn36})', context);
  }
  for (const used of [0, 1]) {
    context.cardUses = used;
    cards = element();
    const before = snapshot();
    const eligible = vm.runInContext('canDiscardBattleCard36("guard")', context);
    assert.equal(eligible, used === 0, 'discard must respect the spent intervention');
    vm.runInContext('renderCards()', context);
    assert.equal(snapshot(), before, 'drawing controls must preserve combat resources and outcomes');
    const wrapper = cards.children[0];
    assert.equal(wrapper.children[0].disabled, used === 1, 'card availability must reflect the budget');
    assert.equal(wrapper.children[1].textContent, '버림 지정');
    assert.equal(wrapper.children[1].disabled, !eligible,
      'discard selection must visibly lock after the intervention is spent');
  }
});

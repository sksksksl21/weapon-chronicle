const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('live combat exposes overdrive and restores its intervention effect', () => {
  const html = fs.readFileSync(path.join(__dirname, '../src/combat/story_combat.html'), 'utf8');
  const names = ['renderOverdrive', 'toggleOverdrive', 'checkOverdriveRisk'];
  const declarations = names.map((name) => {
    const start = html.indexOf('function ' + name + '(');
    assert.ok(start >= 0, name + ' must remain available in the combat screen');
    const end = html.indexOf('\n', start);
    return html.slice(start, end < 0 ? html.length : end);
  }).join('\n');
  const nodes = {
    overdriveBtn: { hidden: false, disabled: false, textContent: 'OVERDRIVE · OFF' },
    overdriveRisk: { textContent: '' }
  };
  let rolls = 0;
  const context = vm.createContext({
    $: (id) => nodes[id],
    phase: 'pre',
    resonance: 100,
    hero: { hp: 100, maxHp: 100, weapon: { maxResonance: 100 } },
    cardUses: 0,
    maxCardUses: 1,
    selectedPre: [],
    usedThisTurn: [],
    coreLockedThisTurn: false,
    coreLockedTurns: 0,
    overdriveArmed: false,
    overdriveRolled: false,
    currentOverdriveRisk: () => 30,
    roll100: () => { rolls += 1; return 1; },
    showBanner: () => {},
    log: () => {},
    render: () => {}
  });
  vm.runInContext(declarations, context);

  // No second intervention means no overload roll or lock.
  vm.runInContext('checkOverdriveRisk();', context);
  assert.equal(rolls, 0);
  assert.equal(context.coreLockedTurns, 0);

  vm.runInContext('renderOverdrive(); toggleOverdrive();', context);
  const visible = !nodes.overdriveBtn.hidden;
  const activated = context.overdriveArmed;
  const interventionLimit = context.maxCardUses;

  // An ineligible locked core must never arm, even with full resonance.
  context.overdriveArmed = false;
  context.coreLockedThisTurn = true;
  vm.runInContext('toggleOverdrive();', context);
  assert.equal(context.overdriveArmed, false);

  // Exercise the retained risk resolver with two paid interventions.
  context.coreLockedThisTurn = false;
  context.overdriveArmed = true;
  context.cardUses = 2;
  context.resonance = 70;
  vm.runInContext('checkOverdriveRisk(); checkOverdriveRisk();', context);
  assert.equal(rolls, 1, 'automatic resolution must not repeat the overload roll');
  assert.equal(context.coreLockedTurns, 1);
  assert.equal(context.resonance, 70, 'risk resolution must not charge card resonance again');

  assert.equal(visible, true, 'the actual combat renderer must show the overdrive control');
  assert.equal(activated, true, 'a healthy unlocked core in preparation must activate overdrive');
  assert.equal(interventionLimit, 2, 'activation must restore the second memory intervention');
});

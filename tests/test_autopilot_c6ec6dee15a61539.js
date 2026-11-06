const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('attack immediately disables its screen control while resolution is pending', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/combat/story_combat.html'), 'utf8');
  function declaration(start, end) {
    const first = source.indexOf(start);
    const last = source.indexOf(end, first);
    assert.ok(first >= 0 && last > first, 'The inspected combat declarations must exist');
    return source.slice(first, last);
  }
  const nodes = {};
  function node(id) {
    if (!nodes[id]) nodes[id] = { textContent: '', style: {}, disabled: false };
    return nodes[id];
  }
  let release;
  let resolutions = 0;
  const pendingResolution = new Promise(resolve => { release = resolve; });
  const noop = () => {};
  const context = vm.createContext({
    $: node,
    hero: { name: 'Owner', hp: 80, maxHp: 100, martial: 10, survival: 10,
      weapon: { power: 10, precision: 10, handling: 10, toughness: 10, maxResonance: 100 } },
    enemy: { hp: 40, maxHp: 50 },
    LIVE_ACTOR: null,
    stage: () => ({ name: 'Enemy', pow: 10, label: 'TURN 1' }),
    deck: [], discard: [], memoriesTaken: [], selectedPre: [],
    cardUses: 0, maxCardUses: 1, resonance: 50,
    phase: 'pre', heroPlan: 'attack', heroMissPenaltyNext: 0, pending: null,
    renderCombatOdds: noop, renderOwnerAI: noop, renderOverdrive: noop,
    renderCombo: noop, renderWeakness: noop, renderEnemyOmen: noop,
    renderCards: noop, renderBattleDiscard36: noop, renderBattleItems: noop,
    commitPreCard: noop, roll100: () => 50,
    resolveHeroRoll: async () => { resolutions += 1; await pendingResolution; }
  });
  vm.runInContext(declaration('function render(){', 'function canUseCard('), context);
  vm.runInContext(declaration('async function executeTurn(){', 'async function resolveHeroRoll('), context);
  const binding = "$('execBtn').onclick=executeTurn;";
  assert.ok(source.includes(binding), 'Exercise the actual screen attack binding');
  vm.runInContext(binding, context);
  context.render();
  assert.equal(node('heroHp').textContent, '80.0 / 100.0');
  assert.equal(node('enemyHp').textContent, '40.0 / 50.0');
  assert.equal(node('execBtn').disabled, false);
  const firstAttack = node('execBtn').onclick();
  try {
    await node('execBtn').onclick();
    assert.equal(resolutions, 1, 'Repeated input must not start a second attack');
    assert.equal(context.phase, 'heroResolve');
    assert.equal(node('execBtn').disabled, true,
      'Attack must visibly disable immediately, before asynchronous resolution finishes');
    context.phase = 'enemyResolve';
    context.render();
    assert.equal(node('execBtn').disabled, true);
    await node('execBtn').onclick();
    assert.equal(resolutions, 1);
    context.phase = 'done';
    context.render();
    assert.equal(node('execBtn').disabled, true);
    await node('execBtn').onclick();
    assert.equal(resolutions, 1);
    assert.equal(context.hero.hp, 80);
    assert.equal(context.enemy.hp, 40);
  } finally {
    release();
    await firstAttack;
  }
});

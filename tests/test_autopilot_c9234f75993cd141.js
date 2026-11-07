const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const math = require('../src/core/combat_math_v1.js');

const source = fs.readFileSync(path.join(__dirname, '../src/combat/story_combat.html'), 'utf8');

function declaration(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  assert.ok(first >= 0 && last > first, 'Required live combat declarations must exist');
  return source.slice(first, last);
}

test('live snapshot controls normal and bonus damage without repeating card costs or temporary effects', async function () {
  const actor = Object.freeze({attack: 40, defense: 12, penetration: 5, attackSpeed: 200, critChance: 0});
  const context = vm.createContext({
    WC_COMBAT_MATH_V1: math,
    LIVE_ACTOR: actor,
    hero: {hp: 100, maxHp: 100, martial: 0, weapon: {weight: 1, power: 999}},
    enemy: {hp: 1000, defense: 999, unified: {defense: 15, penetration: 0}},
    stageIndex: 1,
    heroPlan: 'basic', selectedPre: ['over'],
    memoryMods: {lowHpDamage: 1},
    resonance: 50, turn: 4, cardUses: 0, maxCardUses: 1,
    hand: ['over'], usedThisTurn: [], discard: [], exhausted: [],
    CARD_DB: {over: {timing: 'pre', cost: 10, name: 'Over'}},
    mastery: 0, pending: null, phase: 'pre',
    hasWeaponBuild: function () { return false; },
    hasCombo: function () { return false; },
    isUpgraded: function () { return false; },
    clamp: function (n, lo, hi) { return Math.min(hi, Math.max(lo, n)); },
    calcHeroHit: function () { return 100; },
    calcHeroCrit: function () { return 0; },
    heroAttackAnim: async function () {},
    ri: function (lo) { return lo; },
    addDamage: function () {}, log: function () {}, render: function () {},
    announceCombo: function () {}, checkOverdriveRisk: function () {}
  });
  vm.runInContext(
    'function preHas(id){return selectedPre.includes(id);}\n' +
    'function canUseCard(id){return hand.includes(id)&&cardUses<maxCardUses;}\n' +
    'function spendResonance(id){resonance-=CARD_DB[id].cost;return true;}\n' +
    'function cardCost(id){return CARD_DB[id].cost;}\n' +
    'function cardBase(id){return id;}\n' +
    'function recordCardUse(){mastery++;}\n' +
    'function removeHand(id){hand.splice(hand.indexOf(id),1);}\n' +
    declaration('function liveDamage(', 'function calcHeroDmg(') +
    declaration('function calcHeroDmg(', 'function calcEnemyHit(') +
    declaration('function commitPreCard(', 'function grantDonationCard(') +
    declaration('function basicHeroValues(', 'async function resolveSpeedBasic('), context);

  vm.runInContext('commitPreCard();commitPreCard();', context);
  assert.equal(context.resonance, 40, 'Committed card pays once');
  assert.equal(context.cardUses, 1);
  assert.equal(context.mastery, 1);
  assert.equal(context.discard.length, 1);
  assert.equal(context.hand.length, 0);
  assert.equal(vm.runInContext('calcHeroDmg()[0]', context), 66, 'Card multiplies snapshot attack before permanent defense');

  await vm.runInContext('resolveSpeedHeroRoll(50,false,true)', context);
  assert.equal(context.enemy.hp, 972, 'Bonus basic attack excludes committed offensive card');
  assert.equal(context.resonance, 40, 'Bonus attack does not recover or spend resonance');
  assert.equal(context.turn, 4, 'Bonus attack does not independently advance the turn');
  assert.equal(context.cardUses, 1);
  assert.equal(context.mastery, 1);
  assert.equal(context.discard.length, 1);
  assert.equal(context.selectedPre[0], 'over', 'Bonus calculation restores committed card state');

  context.selectedPre = [];
  assert.equal(vm.runInContext('calcHeroDmg()[0]', context), 28, 'Expired card leaves permanent snapshot attack intact');
  assert.equal(actor.attack, 40);
  assert.equal(actor.defense, 12);
  context.hero.weapon.weight = 5;
  assert.equal(vm.runInContext('calcHeroDmg()[0]', context), 28,
    'Final snapshot attack must not receive a second legacy weapon mass bonus');
});

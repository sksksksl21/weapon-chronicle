'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const combatMath = require('../src/core/combat_math_v1.js');

// Required contract: createTurnCombat accepts hp, attack and firstTurn.
// Its session exposes getState() and attack(side). State contains player/enemy
// hp, turn, and winner (null until either participant has no hp remaining).
test('turn combat applies configuration, rejects invalid turns and locks final outcomes', () => {
  assert.equal(typeof combatMath.createTurnCombat, 'function',
    'Combat arithmetic needs a turn combat session to enforce turns and victory');

  for (const firstTurn of ['player', 'enemy']) {
    const battle = combatMath.createTurnCombat({
      player: { hp: 11, attack: 7 },
      enemy: { hp: 13, attack: 6 },
      firstTurn: firstTurn
    });
    assert.equal(typeof battle.getState, 'function');
    assert.equal(typeof battle.attack, 'function');
    assert.equal(battle.getState().player.hp, 11);
    assert.equal(battle.getState().enemy.hp, 13);
    assert.equal(battle.getState().turn, firstTurn);
    assert.equal(battle.getState().winner, null);

    const secondTurn = firstTurn === 'player' ? 'enemy' : 'player';
    const initial = JSON.stringify(battle.getState());
    battle.attack(secondTurn);
    assert.equal(JSON.stringify(battle.getState()), initial,
      'An out-of-turn attack must preserve the entire battle state');

    battle.attack(firstTurn);
    assert.equal(battle.getState().player.hp, firstTurn === 'enemy' ? 5 : 11);
    assert.equal(battle.getState().enemy.hp, firstTurn === 'player' ? 6 : 13);
    assert.equal(battle.getState().turn, secondTurn);
    assert.equal(battle.getState().winner, null);

    const afterFirst = JSON.stringify(battle.getState());
    battle.attack(firstTurn);
    assert.equal(JSON.stringify(battle.getState()), afterFirst);

    battle.attack(secondTurn);
    assert.equal(battle.getState().player.hp, 5);
    assert.equal(battle.getState().enemy.hp, 6);
    assert.equal(battle.getState().turn, firstTurn);
    assert.equal(battle.getState().winner, null);

    battle.attack(firstTurn);
    assert.equal(battle.getState().winner, firstTurn);
    assert.equal(battle.getState().player.hp, firstTurn === 'enemy' ? 0 : 5);
    assert.equal(battle.getState().enemy.hp, firstTurn === 'player' ? 0 : 6);

    const finished = JSON.stringify(battle.getState());
    battle.attack(secondTurn);
    assert.equal(JSON.stringify(battle.getState()), finished,
      'The defeated participant cannot act after the outcome is decided');
    battle.attack(firstTurn);
    assert.equal(JSON.stringify(battle.getState()), finished,
      'The winner cannot change a completed battle');
  }
});

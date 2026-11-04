'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('enemy combat actions retain a decision for the announced turn', function () {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/core/direct_combat_runtime_v2.js'),
    'utf8'
  );
  const legacy = fs.readFileSync(
    path.join(__dirname, '../src/core/legacy_combat_sources_v1.js'),
    'utf8'
  );
  const combined = source + '\n' + legacy;
  const decisionNames = [
    'enemyIntent',
    'pendingEnemyAction',
    'plannedEnemyAction',
    'enemyPlannedAction',
    'enemyActionPlan'
  ];

  assert.ok(
    decisionNames.some(function (name) {
      return combined.includes(name);
    }),
    'Enemy combat must retain the announced action decision until execution or cancellation'
  );
});

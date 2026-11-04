'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('equipment comparison provides a candidate preview entry point before acceptance verification', () => {
  const files = [
    '../src/core/direct_combat_runtime_v2.js',
    '../src/core/direct_combat_stats_v2.js',
    '../src/legacy/game_runtime.js',
    '../src/core/equipment_pool_v1.js'
  ];
  const candidates = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const declarations = source.matchAll(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g);
    for (const declaration of declarations) {
      const name = declaration[1].toLowerCase();
      const equipment = name.includes('equip') || name.includes('armor') || name.includes('part');
      if (equipment && name.includes('preview')) candidates.push(declaration[1]);
    }
  }
  assert.ok(
    candidates.length > 0,
    'Missing equipment candidate preview entry point: sword parts and HP-bonus armor need a preview snapshot before preview/cancel purity and equipped-snapshot equivalence can be verified.'
  );
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('owner stat coefficients represent percentages on a 100 point scale', () => {
  const files = [
    '../src/core/direct_combat_stats_v2.js',
    '../src/core/combat_math_v1.js',
    '../src/core/direct_combat_runtime_v2.js',
    '../src/legacy/game_runtime.js'
  ];
  let checked = 0;
  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const coefficients = source.matchAll(/\b(martial|survival|social)\s*\*\s*(0\.\d+)/g);
    for (const match of coefficients) {
      const coefficient = Number(match[2]);
      for (const stat of [0, 50, 100]) {
        const actual = vm.runInNewContext('stat * coefficient', { stat, coefficient });
        assert.equal(actual, stat / 100,
          file + ': ' + match[0] + ' must interpret ' + stat + ' as ' + stat + '%');
      }
      checked += 1;
    }
  }
  assert.ok(checked > 0, 'The percentage rule must be verified against an owner stat calculation');
});

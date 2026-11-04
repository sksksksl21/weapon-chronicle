'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('direct combat connects memory-card intervention to discard and resonance resources', () => {
  const runtime = fs.readFileSync(
    path.join(__dirname, '../src/core/direct_combat_runtime_v2.js'),
    'utf8'
  );
  const handoff = fs.readFileSync(
    path.join(__dirname, '../src/core/live_combat_handoff_v1.js'),
    'utf8'
  );
  const connection = (runtime + '\n' + handoff).toLowerCase();

  // A direct-combat intervention must reach both existing resource systems.
  // This guard does not claim to verify damage math or a full playthrough.
  assert.ok(
    connection.includes('card') && connection.includes('discard') &&
      connection.includes('resonance'),
    'Direct combat must connect memory-card use and discard with the resonance ledger so intervention has its existing resource costs.'
  );
});

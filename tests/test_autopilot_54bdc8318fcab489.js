const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('combat provides three distinct player-readable telegraph cues', () => {
  const sources = [
    fs.readFileSync(path.join(__dirname, '../src/core/legacy_combat_sources_v1.js'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '../src/legacy/game_runtime.js'), 'utf8')
  ];
  const cues = new Set();

  for (const source of sources) {
    const literals = source.match(/'[^'\r\n]*'|"[^"\r\n]*"/g) || [];
    for (const literal of literals) {
      const label = literal.slice(1, -1).trim();
      if (label.includes('전조')) {
        cues.add(label);
      }
    }
  }

  assert.ok(
    cues.size >= 3,
    'Expected three distinct visible telegraph cues for learnable enemy patterns; found ' + cues.size
  );
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('combat sources expose a unified combat module through a registry', () => {
  const sources = [
    '../src/core/combat_math_v1.js',
    '../src/core/direct_combat_stats_v2.js',
    '../src/core/status_skilldeck_v1.js',
    '../src/core/legacy_combat_sources_v1.js',
    '../src/core/direct_combat_runtime_v2.js',
    '../src/core/live_combat_handoff_v1.js'
  ];
  const browser = {};
  const context = vm.createContext({ window: browser });

  for (const source of sources) {
    const filename = path.join(__dirname, source);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  }

  const registries = Object.values(browser).filter(value =>
    value && typeof value === 'object' &&
    typeof value.register === 'function' && typeof value.get === 'function'
  );
  assert.ok(registries.length > 0, 'Combat sources must expose a module registry with register and get operations');
  const combat = registries.map(registry => registry.get('combat')).find(Boolean);
  assert.ok(combat, 'The registry must resolve the unified combat module');
  assert.equal(typeof combat.initialize, 'function', 'The registered combat module must support initialization');
});

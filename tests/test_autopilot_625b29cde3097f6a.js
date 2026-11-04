'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('combat consumers use the shared final stat snapshot producer', () => {
  const statsPath = path.join(__dirname, '../src/core/direct_combat_stats_v2.js');
  const runtimePath = path.join(__dirname, '../src/core/direct_combat_runtime_v2.js');
  const mathPath = path.join(__dirname, '../src/core/combat_math_v1.js');
  const context = { module: { exports: {} }, exports: {} };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(mathPath, 'utf8'), context);
  vm.runInContext(fs.readFileSync(statsPath, 'utf8'), context);

  const candidates = [];
  const visited = new Set();
  const inspect = (value, depth) => {
    if (!value || depth > 3 || visited.has(value)) return;
    if (typeof value !== 'object' && typeof value !== 'function') return;
    visited.add(value);
    for (const key of Object.keys(value)) {
      const member = value[key];
      if (typeof member === 'function' && key.toLowerCase().includes('snapshot')) {
        candidates.push(key);
      }
      if (typeof member === 'object') inspect(member, depth + 1);
    }
  };
  inspect(context, 0);

  assert.ok(candidates.length > 0,
    'The shared combat stats module must expose a final stat snapshot producer for all consumers.');

  const runtime = fs.readFileSync(runtimePath, 'utf8');
  assert.ok(candidates.some((name) => runtime.includes(name)),
    'Direct combat must consume the shared final stat snapshot rather than independently applying owner and equipment corrections.');
});

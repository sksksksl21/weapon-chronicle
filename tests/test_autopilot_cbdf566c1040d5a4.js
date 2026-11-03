'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('save modules expose registration hooks for a state round trip', function () {
  const sources = [
    '../src/core/save_ledger_v48.js',
    '../src/core/checkpoint_v483.js',
    '../src/core/action_checkpoint_v482.js'
  ].map(function (name) {
    return fs.readFileSync(path.join(__dirname, name), 'utf8');
  });

  // Registration is the prerequisite for saving independently owned state.
  assert.ok(
    sources.some(function (source) {
      return source.includes('registerSaveModule');
    }),
    'The save layer must expose registerSaveModule with serialize and restore hooks'
  );

  const storage = new Map();
  const context = vm.createContext({
    console: { log: function () {}, warn: function () {}, error: function () {} },
    localStorage: {
      getItem: function (key) { return storage.has(key) ? storage.get(key) : null; },
      setItem: function (key, value) { storage.set(key, String(value)); },
      removeItem: function (key) { storage.delete(key); }
    }
  });
  context.window = context;
  sources.forEach(function (source) {
    vm.runInContext(source, context);
  });

  assert.equal(typeof context.registerSaveModule, 'function');
  assert.equal(typeof context.serializeSaveModules, 'function');
  assert.equal(typeof context.restoreSaveModules, 'function');

  let state = { gold: 37, memories: ['first-owner'], mental: 100 };
  let serialized = 0;
  let restored = 0;
  context.registerSaveModule('roundTripFixture', {
    serialize: function () {
      serialized += 1;
      return JSON.parse(JSON.stringify(state));
    },
    restore: function (saved) {
      restored += 1;
      state = JSON.parse(JSON.stringify(saved));
    }
  });

  const expected = JSON.stringify(state);
  const saved = JSON.parse(JSON.stringify(context.serializeSaveModules()));
  state.gold = 0;
  state.memories.push('later-owner');
  state.mental = 1;
  context.restoreSaveModules(saved);

  assert.equal(serialized, 1, 'Saving must invoke the registered serializer once');
  assert.equal(restored, 1, 'Loading must invoke the registered restore hook once');
  assert.equal(JSON.stringify(state), expected, 'Registered module state must survive saving and loading');
});

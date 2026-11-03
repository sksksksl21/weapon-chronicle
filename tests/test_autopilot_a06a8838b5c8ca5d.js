'use strict';

// Acceptance A2: UI rendering must refresh through subscribed module events
// instead of the game logic calling render functions directly.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const runtimePath = path.join(__dirname, '..', 'src', 'legacy', 'game_runtime.js');
const source = fs.readFileSync(runtimePath, 'utf8');

function countOccurrences(text, needle) {
  let count = 0;
  let index = text.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(needle, index + needle.length);
  }
  return count;
}

test('runtime defines a UI event emitter for game logic', function () {
  assert.ok(
    source.indexOf('function emitUiEvent(') !== -1,
    'game_runtime.js should define emitUiEvent so game logic can notify the UI without calling render functions'
  );
});

test('runtime defines a UI event subscription entry point', function () {
  assert.ok(
    source.indexOf('function subscribeUiEvent(') !== -1,
    'game_runtime.js should define subscribeUiEvent so the UI module can register screen refresh handlers'
  );
});

test('UI screens subscribe to events rather than only being called directly', function () {
  const subscribeUses = countOccurrences(source, 'subscribeUiEvent(');
  const emitUses = countOccurrences(source, 'emitUiEvent(');
  assert.ok(subscribeUses >= 2, 'subscribeUiEvent should be defined and used by at least one UI screen');
  assert.ok(emitUses >= 2, 'emitUiEvent should be defined and called by at least one game logic path');
});

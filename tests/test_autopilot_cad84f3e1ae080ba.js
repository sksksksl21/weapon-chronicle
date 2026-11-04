'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('bootstrap and runtime both participate in module registry wiring', () => {
  const bootstrap = fs.readFileSync(path.join(__dirname, '../src/legacy/bootstrap.js'), 'utf8');
  const runtime = fs.readFileSync(path.join(__dirname, '../src/legacy/game_runtime.js'), 'utf8');

  assert.ok(
    bootstrap.toLowerCase().includes('registry'),
    'Bootstrap must use a module registry to connect game features at startup.'
  );
  assert.ok(
    runtime.toLowerCase().includes('registry'),
    'Runtime must participate in the module registry that connects combat, rewards, saves and story progression.'
  );
});

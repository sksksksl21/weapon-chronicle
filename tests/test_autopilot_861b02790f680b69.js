'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('direct combat exposes reproducible intervention comparison evidence', function () {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/core/direct_combat_runtime_v2.js'),
    'utf8'
  );
  const sandbox = { window: {}, module: { exports: {} }, exports: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);

  const surfaces = [sandbox, sandbox.window, sandbox.module.exports];
  const candidates = surfaces.slice();
  surfaces.forEach(function (surface) {
    Object.keys(surface).forEach(function (key) {
      const value = surface[key];
      if (value && (typeof value === 'object' || typeof value === 'function')) {
        candidates.push(value);
      }
    });
  });

  const comparison = candidates.find(function (candidate) {
    return typeof candidate.compareInterventionStrategies === 'function';
  });
  assert.ok(
    comparison,
    'Missing reproducible combat comparison entry point: compareInterventionStrategies must retain conditions, sample count, damage distribution, turns, card use, resonance changes and heavy-attack intervention rates.'
  );
});

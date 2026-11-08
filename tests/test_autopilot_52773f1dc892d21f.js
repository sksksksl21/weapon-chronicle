'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('release verification includes an explicit built-game encyclopedia integration scenario', () => {
  const packageData = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const scripts = packageData.scripts;
  const validationCommands = Object.entries(scripts)
    .filter(([name]) => name.startsWith('test:'))
    .map(([, command]) => command);

  // Acceptance requires a dedicated scenario for complete equipment lookup,
  // immediate ownership updates, and discovery retention across save/load
  // and succession. Existing gear-rarity and save compatibility commands
  // alone cannot establish that this integrated scenario was exercised.
  // Stop at the missing verification evidence before claiming a release
  // or a remote dev update is verified. This checks the declared validation
  // coverage; it does not claim to execute gameplay or attest remote commits.
  const scenarioCommands = validationCommands.filter(command =>
    command.includes('encyclopedia') || command.includes('codex_integration')
  );
  assert.ok(
    scenarioCommands.length > 0,
    'Missing declared built-game encyclopedia integration scenario: verify all weapon parts and armor, acquisition ownership, and discovery retention after save/load and succession before reporting verified dev integration.'
  );

  const buildCommand = scripts.build;
  assert.ok(
    scenarioCommands.some(command =>
      command.includes('npm run build &&') || command.includes(buildCommand + ' &&')
    ),
    'The encyclopedia integration scenario must build the actual offline game before running its assertions.'
  );
});

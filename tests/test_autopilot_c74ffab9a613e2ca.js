"use strict";
// display_matches_runtime: crit-damage resist is subtracted directly from the
// attacker's crit-damage bonus (a "%" quantity) in resolveStrike, so the
// equipment description must show both in the same unit. Showing resist as
// "%p" misstates how the applied value relates to the displayed bonus.
const test = require("node:test");
const assert = require("node:assert/strict");

const combat = require("../src/core/direct_combat_stats_v2.js");

test("crit damage resist display unit matches its runtime application", () => {
  const strike = combat.resolveStrike({
    attacker: { minAttack: 100, maxAttack: 100, hitChance: 100, critChance: 100, critDamageBonus: 50 },
    defender: { critDamageResist: 10, defense: 0 },
    hitRoll: 0, critRoll: 0, blockRoll: 100, damageRoll: 0
  });
  // Runtime: 50% bonus - 10 resist = 40% extra damage, i.e. same unit as the bonus.
  assert.equal(strike.crit, true);
  assert.equal(strike.damage, 140);

  const bonusLines = combat.describeItemEffects({ critDamageBonus: 50 });
  assert.ok(bonusLines.includes("치명타 피해 +50%"));

  const resistLines = combat.describeItemEffects({ critDamageResist: 10 });
  assert.equal(resistLines.length, 1);
  assert.equal(resistLines[0], "치명타 피해 저항 +10%");
});

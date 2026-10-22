"use strict";
const assert = require("node:assert/strict");
const engine = require("../src/core/combat_math_v1.js");
const {SWORD_SLOTS,ARMOR_SLOTS,calculateActorStats,resolveDamage,advanceSpeedGauge,speedRate}=engine;
function near(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, "expected " + expected + ", got " + actual);
}

assert.deepEqual([...SWORD_SLOTS],["blade","guard","tang","grip","wrap","pommel","seat","scabbard"]);
assert.deepEqual([...ARMOR_SLOTS],["helmet","armor","gloves","boots"]);

// Owner, base sword, all eight parts and all four owner equipment pieces
// contribute fixed points first; permanent percentages apply exactly once.
const weaponParts = Object.fromEntries(SWORD_SLOTS.map(slot => [slot,{attack:1,crit:1}]));
const armor = Object.fromEntries(ARMOR_SLOTS.map(slot => [slot,{defense:2,speed:5}]));
armor.helmet.maxHp = 10;
weaponParts.seat.maxResonance = 6;
weaponParts.seat.resonanceRecovery = 2;
const playerInput = {
  owner:{maxHp:90,attack:30,defense:10,speed:10,crit:5,penetration:2,attackPct:10},
  weapon:{attack:20,defense:5,crit:4,penetration:3,maxResonance:70,resonanceRecovery:9,attackPct:5},
  weaponParts,armor,
  buffs:{attack:2,defensePct:20,speedPct:10,penetration:1}
};
const snapshot = JSON.stringify(playerInput);
const p = calculateActorStats(playerInput);
near(p.attack,(30+20+8+2)*1.15);
near(p.defense,(10+5+4*2)*1.20);
near(p.attackSpeed,(100+10+4*5)*1.10);
assert.equal(p.maxHp,100);
assert.equal(p.maxResonance,76);
assert.equal(p.resonanceRecovery,11);
assert.equal(p.critChance,5+4+8);
assert.equal(p.penetration,2+3+1);
assert.equal(p.breakdown.flat.attack,60);
assert.equal(p.breakdown.permanentPct.attackPct,15);
assert.equal(JSON.stringify(playerInput),snapshot,"combat calculation mutated items");
console.log("PASS: 8 sword pieces and 4 armor slots; owner/weapon/additive/% separation");

// Enemy uses the same model, without invented sword/armor components.
const enemy=calculateActorStats({owner:{maxHp:120,attack:28,defense:14,crit:3,speed:20}});
assert.equal(enemy.attack,28);assert.equal(enemy.defense,14);
assert.equal(enemy.maxHp,120);assert.equal(enemy.attackSpeed,120);
assert.equal(enemy.maxResonance,0);
assert.equal(enemy.resonanceRecovery,0);
assert.equal(calculateActorStats().attackSpeed,100);
assert.throws(()=>calculateActorStats({weaponParts:{wrong_part:{attack:500}}}),RangeError);
assert.throws(()=>calculateActorStats({armor:{chest:{defense:20}}}),RangeError);
assert.equal(calculateActorStats({owner:{crit:150,penetration:-10},weapon:{maxResonance:-1}}).critChance,100);
console.log("PASS: identical enemy arithmetic, known equipment slots, missing/invalid bounds");

// Card and critical multipliers are applied BEFORE armor; temporary guard last.
const damage=resolveDamage({damage:20,critMultiplier:1.5,cardMultiplier:1.2,
  defense:15,penetration:5,temporaryDefense:6});
near(damage.preDefense,36);
near(damage.effectiveDefense,10);
near(damage.afterDefense,26);
near(damage.finalDamage,20);
assert.equal(resolveDamage({damage:1,defense:999,temporaryDefense:1}).finalDamage,0);
assert.equal(resolveDamage({damage:4,defense:999,penetration:999}).afterDefense,4);
assert.equal(resolveDamage({damage:10,defense:5,penetration:0,temporaryDefense:999}).finalDamage,0);
console.log("PASS: crit/card > fixed penetration/armor > temporary guard");

// Everyone gets their one basic action per exchange outside this pure gauge.
// The helper only schedules an extra basic attack (no card, draw or recovery).
for (const [owner,enemySpeed,firstExtra] of [
  [120,100,6],[120,90,4],[150,100,3],[300,100,2]
]) {
  let state=null,extra=[];
  for (let exchange=1;exchange<=12;exchange++){
    state=advanceSpeedGauge(state,owner,enemySpeed);
    if(state.extraBasicAttack)extra.push(exchange);
    assert.ok(state.gauge>=0 && state.gauge<1);
    assert.ok(state.rate<=.5);
  }
  assert.equal(extra[0],firstExtra,owner+" vs "+enemySpeed);
  assert.ok(extra.every((exchange,i)=>i===0 || exchange>extra[i-1]));
}
let slow=null;
for(let i=1;i<=4;i++)slow=advanceSpeedGauge(slow,90,120);
assert.equal(slow.extraBasicAttack,"enemy");
let equal=advanceSpeedGauge(slow,100,100);
assert.equal(equal.extraBasicAttack,null);
assert.equal(equal.gauge,0);
let swapped=advanceSpeedGauge({faster:"owner",gauge:.9},90,120);
near(swapped.gauge,.25);
assert.equal(swapped.extraBasicAttack,null);
near(speedRate(150,100),1/3);
near(speedRate(100,100),0);
console.log("PASS: 120:100 / 120:90 / 150:100 / 300:100 speed accumulation and side reset");

// Specialized builds remain comparable using the same source schema.
const build=(gear,extra)=>calculateActorStats({owner:{maxHp:100,attack:20,defense:10},weapon:{attack:15,maxResonance:70},armor:gear,buffs:extra});
const attackBuild=build({gloves:{attack:12}},{attackPct:10});
const speedBuild=build({boots:{speed:25}},{speedPct:15});
const defenseBuild=build({armor:{defense:14}},{defensePct:20});
const critPenBuild=build({gloves:{crit:12,penetration:9}},{});
assert.ok(attackBuild.attack>speedBuild.attack);
assert.ok(speedBuild.attackSpeed>attackBuild.attackSpeed);
assert.ok(defenseBuild.defense>speedBuild.defense);
assert.ok(critPenBuild.critChance>attackBuild.critChance);
assert.ok(critPenBuild.penetration>attackBuild.penetration);
console.log("PASS: attack/speed/defense/critical-penetration build distinction");
console.log("TOTAL unified combat math checks PASS (not yet connected to active battle UI)");

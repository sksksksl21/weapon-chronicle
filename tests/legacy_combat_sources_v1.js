"use strict";
const assert=require("node:assert/strict");
const bridge=require("../src/core/legacy_combat_sources_v1.js");
const math=require("../src/core/combat_math_v1.js");
const partCatalog={};
const parts={};
for (const slot of bridge.SWORD) {
  const item=slot+"_fixture";
  partCatalog[slot]={[item]:{mods:{power:1,precision:1,toughness:1,handling:1,maxResonance:2,resonanceRecovery:1}}};
  parts[slot]=item;
}
partCatalog.blade.blade_fixture.mods.power=8;
partCatalog.guard.guard_fixture.mods.power=-2;
partCatalog.seat.seat_fixture.mods.maxResonance=10;
partCatalog.scabbard.scabbard_fixture.mods.handling=-3;
const gearCatalog={
  helm:{slot:"helmet",mods:{maxHp:4,defense:3}},
  coat:{slot:"armor",mods:{maxHp:8,defense:7}},
  gloves:{slot:"gloves",mods:{defense:2,attack:3}},
  boots:{slot:"boots",mods:{speed:15,defense:-1}},
  invalid:{slot:"helmet",mods:{attack:999,maxHp:10}},
  veteran_helm:{slot:"helmet",mods:{attack:999,maxHp:4,survival:2}},
  survivor_helm:{slot:"helmet",mods:{survival:2}}
};
const equipped={helmet:"helm",armor:"coat",gloves:"gloves",boots:"boots"};
const weapon={parts,power:19,toughness:16,precision:13,handling:12,
  maxResonance:86,resonanceRecovery:11};
const sourceInput={ownerCombat:{attack:10,defense:4,speed:3,crit:2,maxHp:100},
  totalMaxHp:112,weapon,partCatalog,ownerEquipment:equipped,gearCatalog,
  buffs:{attackPct:15}};
const snapshot=JSON.stringify(sourceInput);
const sources=bridge.fromLegacyLoadout(sourceInput);
assert.equal(JSON.stringify(sourceInput),snapshot,"adaptation must not modify saved state");
assert.deepEqual(Object.keys(sources.weaponParts),[...bridge.SWORD]);
assert.deepEqual(Object.keys(sources.armor),[...bridge.ARMOR]);
assert.equal(sources.owner.maxHp,100);
assert.equal(sources.weapon.attack+bridge.SWORD.reduce((a,s)=>a+sources.weaponParts[s].attack,0),weapon.power);
assert.equal(sources.weapon.defense+bridge.SWORD.reduce((a,s)=>a+sources.weaponParts[s].defense,0),weapon.toughness);
assert.equal(sources.weapon.speed+bridge.SWORD.reduce((a,s)=>a+sources.weaponParts[s].speed,0),weapon.handling);
assert.equal(sources.weapon.crit+bridge.SWORD.reduce((a,s)=>a+sources.weaponParts[s].crit,0),weapon.precision);
assert.equal(sources.weapon.maxResonance+bridge.SWORD.reduce((a,s)=>a+sources.weaponParts[s].maxResonance,0),weapon.maxResonance);
const actor=math.calculateActorStats(sources);
assert.equal(actor.maxHp,112);
assert.equal(actor.maxResonance,86);
assert.equal(actor.resonanceRecovery,11);
assert.equal(actor.attack,(10+19+3)*1.15);
assert.equal(actor.defense,4+16+3+7+2-1);
assert.equal(actor.attackSpeed,100+3+12+15);
assert.equal(actor.critChance,2+13);
console.log("PASS: real legacy aggregate weapon totals decomposed/reassembled once");
console.log("PASS: eight parts, four armor slots, HP and resonance totals preserved");
const swapped={...sourceInput,ownerEquipment:{...equipped,gloves:"invalid"}};
const changed=math.calculateActorStats(bridge.fromLegacyLoadout(swapped));
assert.equal(changed.attack,(10+19)*1.15,"wrong-slot gear must not contribute");
assert.equal(changed.maxHp,112,"explicit gear-exclusive owner HP ignores invalid gear");
// If a legacy aggregate contains wrong-slot gear HP, it must not leak back.
const corruptedAggregate={...swapped,totalMaxHp:122};
const invalidHp=math.calculateActorStats(bridge.fromLegacyLoadout(corruptedAggregate));
assert.equal(invalidHp.maxHp,112);
const withoutOwnerBase={...corruptedAggregate,ownerCombat:{attack:10,defense:4,speed:3,crit:2}};
assert.throws(()=>bridge.fromLegacyLoadout(withoutOwnerBase),RangeError,
  "capped aggregate cannot safely remove wrong-slot HP without owner base");
const survivalSlot={...swapped,ownerEquipment:{...swapped.ownerEquipment,gloves:"veteran_helm"},
  totalMaxHp:124};
const survivalExplicit=math.calculateActorStats(bridge.fromLegacyLoadout(survivalSlot));
assert.equal(survivalExplicit.maxHp,112,"wrong-slot Survival*4 and fixed HP must not leak");
assert.throws(()=>bridge.fromLegacyLoadout({...survivalSlot,ownerCombat:{}}),RangeError,
  "legacy Survival*4 and [58,170] clamp make HP aggregate non-invertible");
assert.throws(()=>bridge.fromLegacyLoadout({...survivalSlot,totalMaxHp:170,ownerCombat:{}}),RangeError,
  "capped max HP must not be guessed");
const survivalOnly={...survivalSlot,ownerEquipment:{...survivalSlot.ownerEquipment,gloves:"survivor_helm"}};
assert.throws(()=>bridge.fromLegacyLoadout({...survivalOnly,ownerCombat:{}}),RangeError,
  "even wrong-slot survival alone changes clamped legacy HP");
const validWithoutBase=math.calculateActorStats(bridge.fromLegacyLoadout({
  ...sourceInput,ownerCombat:{attack:10,defense:4,speed:3,crit:2}
}));
assert.equal(validWithoutBase.maxHp,112,"normal legacy aggregate remains unchanged");
assert.equal(JSON.stringify(sourceInput),snapshot,"HP correction must not mutate input");
console.log("PASS: wrong-slot HP/Survival excluded with explicit base; ambiguous aggregate rejected");
const unknownWeapon={...weapon,parts:{...parts,blade:"old_unlisted_id"}};
const unknownSources=bridge.fromLegacyLoadout({...sourceInput,weapon:unknownWeapon});
const unknown=math.calculateActorStats(unknownSources);
assert.equal(unknown.maxResonance,86);
assert.equal(unknown.attack,actor.attack,"unknown old part id should not erase saved aggregate");
const enemy=math.calculateActorStats(bridge.enemyFromLegacy({maxHp:125,attack:13,defense:9,crit:8}));
assert.equal(enemy.maxHp,125);
assert.equal(enemy.attack,13);
assert.equal(enemy.defense,9);
assert.equal(enemy.attackSpeed,100);
console.log("PASS: old/missing part IDs, rejected mismatched gear, enemy baseline");
console.log("TOTAL legacy combat data adapter checks PASS (not yet active battle)");

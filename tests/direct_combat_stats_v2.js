"use strict";
const assert=require("node:assert/strict");
const engine=require("../src/core/direct_combat_stats_v2.js");
// Exact user-approved illustrative equipment; not gameplay balance data.
const weapon={minAttack:100,maxAttack:100,defense:80,
 hitBonus:20,speedPct:20,critBonus:20,critDamageBonus:50,penetration:10};
const base={hitChance:70,critChance:5};
function at(martial,survival){
 return engine.calculate({owner:{martial,survival,stableSurvival:survival,baseHp:100},weapon,base});
}
for(const rating of [0,25,50,60,75,100]){
 const s=at(rating,rating);
 assert.equal(s.minAttack,Math.round(rating));
 assert.equal(s.defense,Math.round(80*rating/100));
 assert.equal(s.hitChance,70+20*rating/100);
 assert.equal(s.attackSpeed,100+20*rating/100);
 assert.equal(s.critChance,5+20*rating/100);
 assert.equal(s.critMultiplier,1+50*rating/10000);
 assert.equal(s.penetration,rating/10);
}
const example=engine.calculate({owner:{martial:60,survival:50,baseHp:100,stableSurvival:50},weapon,base});
assert.deepEqual([example.minAttack,example.maxAttack,example.defense,
 example.hitChance,example.attackSpeed,example.critChance,example.critMultiplier,
 example.penetration],[60,60,40,82,112,17,1.3,6]);
const full=at(100,100);
assert.deepEqual([full.minAttack,full.defense,full.hitChance,full.attackSpeed,
 full.critChance,full.critMultiplier,full.penetration],[100,80,90,120,25,1.5,10]);
// 10% permanent attack and defense increases apply once before owner rate.
const once=engine.calculate({owner:{martial:50,survival:50,baseHp:70},weapon:{
 minAttack:100,maxAttack:140,attackPct:.1,defense:80,defensePct:.1}});
assert.deepEqual([once.minAttack,once.maxAttack,once.defense],[55,77,44]);
assert.equal(once.attackSpeed,100,"base speed must not be scaled by martial rate");
const zero=at(0,0);
assert.equal(zero.minAttack,0);
assert.equal(zero.maxAttack,0);
assert.equal(zero.critMultiplier,1);
assert.equal(zero.attackSpeed,100);
assert.equal(engine.resolveStrike({attacker:zero,defender:{},hitRoll:0,critRoll:0,
 blockRoll:99,damageRoll:1}).damage,0,"zero attack is not raised to minimum 1");
const armored=engine.calculate({owner:{martial:60,survival:60,baseHp:75,
 stableSurvival:100},weapon:{minAttack:30,maxAttack:40},
 armor:{helmet:{maxHp:12,defense:15},gloves:{minAttack:10,maxAttack:12,defense:5}}});
assert.equal(armored.maxHp,87,"stable survival controls equipment HP");
assert.equal(armored.minAttack,24,"glove offensive bonus uses martial rate");
assert.equal(armored.defense,12,"defensive glove and helmet use survival rate");
const strike=engine.resolveStrike({
 attacker:{minAttack:20,maxAttack:20,hitChance:80,critChance:30,
 critDamageBonus:50,penetration:4},
 defender:{evade:10,critChanceResist:10,critDamageResist:20,
 blockChance:40,blockAmount:3,defense:8},
 hitRoll:30,critRoll:10,blockRoll:20,damageRoll:.5
});
assert.equal(strike.hit,true);
assert.equal(strike.crit,true);
assert.equal(strike.blocked,true);
assert.equal(strike.effectiveDefense,4);
assert.equal(strike.damage,19); // 20 * 1.3 - (8-4) - 3
const miss=engine.resolveStrike({attacker:{hitChance:40,critChance:100},
 defender:{evade:30},hitRoll:50,critRoll:0,blockRoll:0});
assert.deepEqual([miss.hit,miss.crit,miss.blocked,miss.damage],
 [false,false,false,0]);
const first=engine.migrateLegacyLoadout({weapon:{parts:{blade:"iron"},
 power:25,precision:8,toughness:7,handling:5,maxResonance:30,
 resonanceRecovery:2},partCatalog:{blade:{iron:{mods:{
 power:10,precision:2,toughness:1,handling:1,maxResonance:5}}}},
 equipment:{gloves:"test"},gearCatalog:{test:{slot:"gloves",mods:{attack:5,crit:3,defense:2}}}});
assert.equal(first.weapon.minAttack+first.parts.blade.minAttack,22.5,
 "weapon total is decomposed once, not double counted");
assert.equal(first.armor.gloves.minAttack,4.5,"glove offense migration is allowed");
console.log("PASS: 0/25/50/60/75/100 ratings, example, permanent bonus once, 0 attack");
console.log("PASS: glove roles, stable HP, hit/crit/block split, fixed penetration");
console.log("PASS: legacy item conversion keeps sword parts from being double-counted");

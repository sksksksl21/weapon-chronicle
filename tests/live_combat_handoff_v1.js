"use strict";
const assert=require("node:assert/strict");
const handoff=require("../src/core/live_combat_handoff_v1.js");
const adapter=require("../src/core/legacy_combat_sources_v1.js");
const math=require("../src/core/combat_math_v1.js");

const partCatalog={},parts={};
for(const slot of adapter.SWORD){
  const id=slot+"_start";parts[slot]=id;
  partCatalog[slot]={[id]:{mods:{power:1,toughness:1,handling:1,precision:1,maxResonance:1,resonanceRecovery:1}}};
}
const gearCatalog={
  helmet_a:{slot:"helmet",mods:{defense:2,maxHp:3,survival:1}},
  gloves_a:{slot:"gloves",mods:{attack:5,survival:1}},
  wrong_helmet:{slot:"helmet",mods:{maxHp:10,survival:2,attack:500}}
};
const input={
  owner:{name:"테스트 소유자",age:24,boldness:50},
  effectiveOwner:{martial:9,survival:8,mult:1},
  rawOwner:{survival:8,parts:{weapon:1,armor:2}},
  armorSurvival:2,
  maxHp:100,
  weapon:{parts,power:20,toughness:16,handling:10,precision:14,maxResonance:70,resonanceRecovery:9},
  partCatalog,
  ownerEquipment:{helmet:"helmet_a",armor:null,gloves:"gloves_a",boots:null},
  gearCatalog
};
const frozenBefore=JSON.stringify(input);
const computed=handoff.calculate(input,adapter,math);
assert.equal(computed.maxHp,100);
assert.equal(computed.maxResonance,70);
assert.equal(computed.resonanceRecovery,9);
assert.equal(computed.attack,8*.72+20+5);
assert.equal(computed.defense,6+16+2);
assert.equal(computed.attackSpeed,110);
assert.equal(computed.critChance,2+8*.52+14);
assert.equal(computed.penetration,0);
assert.equal(JSON.stringify(input),frozenBefore,"handoff must not mutate active/save state");
console.log("PASS: live encounter actor arithmetic uses all eight sword parts and four gear slots");

// A misplaced helmet's HP, Survival, and attack bonuses must not survive
// the real capped owner HP formula or leak through to the live handoff.
const wrong={...input,
  rawOwner:{survival:9,parts:{weapon:1,armor:3}},
  effectiveOwner:{martial:9,survival:9,mult:1},
  armorSurvival:3,
  ownerEquipment:{...input.ownerEquipment,gloves:"wrong_helmet"}};
const wrongSnapshot=handoff.calculate(wrong,adapter,math);
assert.equal(wrongSnapshot.maxHp,96); // 65 + (6 baseline + 1 valid helmet Survival)*4 + 3 HP
assert.equal(wrongSnapshot.attack,8*.72+20);
assert.equal(wrongSnapshot.defense,6+16+2);
assert.equal(JSON.stringify(wrong.ownerEquipment.gloves),"wrong_helmet");
console.log("PASS: wrong-slot gear ignored without modifying saved equipment");


// The actual runtime load order installs a wrapper around launchStoryCombat.
// The new dataset is present before legacy srcdoc initialization; no side effect
// is allowed to change the original launcher, then battle exit clears it.
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const combatFrame={dataset:{}};
let messageListener;
let legacyCalls=0;
const context={
  window:{addEventListener:(type,fn)=>{if(type==="message")messageListener=fn;}},
  console,
  state:{owner:input.owner,weapon:input.weapon,maxHp:input.maxHp,ownerEquipment:input.ownerEquipment},
  PART_CATALOG:input.partCatalog,
  OWNER_GEAR_CATALOG:input.gearCatalog,
  WC_LEGACY_COMBAT_SOURCES_V1:adapter,
  WC_COMBAT_MATH_V1:math,
  effectiveOwnerStats:()=>input.effectiveOwner,
  rawOwnerStats:()=>input.rawOwner,
  armorSurvivalValue:()=>input.armorSurvival,
  $:()=>combatFrame,
  launchStoryCombat:function(enemy,label){
    legacyCalls++;
    assert.equal(enemy,"bandit");
    assert.equal(label,"첫 전투");
    assert.equal(JSON.parse(combatFrame.dataset.unifiedActorV1).attack,computed.attack);
    return "original-battle";
  }
};
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname,"../src/core/live_combat_handoff_v1.js"),"utf8"),
  context
);
assert.equal(context.launchStoryCombat("bandit","첫 전투"),"original-battle");
assert.equal(legacyCalls,1,"new handoff must not invoke legacy battle twice");
messageListener({data:{type:"wc-story-combat"}});
assert.equal(combatFrame.dataset.unifiedActorV1,undefined,"battle completion clears transient handoff");
assert.equal(JSON.stringify(input),frozenBefore,"live wrapper never mutates game/save inputs");
console.log("PASS: live launchStoryCombat wrapper attaches/transfers/clears stat snapshot once");

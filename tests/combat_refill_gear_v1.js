"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");

const source=fs.readFileSync(path.join(__dirname,"../src/combat/story_combat.html"),"utf8");
const from=source.indexOf("function openingBattleHand(){");
const to=source.indexOf("function useCard(id){",from);
assert(from>=0&&to>from,"card refill helpers must exist");
const context={
  BASE_DECK:Array.from({length:12},(_,i)=>"card"+i),
  deck:[],hand:[],discard:[],exhausted:[],
  shuffle:values=>values.slice(),log:()=>{}
};
vm.createContext(context);
vm.runInContext(source.slice(from,to),context);
vm.runInContext("openingBattleHand()",context);
assert.equal(context.hand.length,4,"initial hand is four");
assert.equal(context.deck.length,8,"remaining card pool is retained");
vm.runInContext("refillBattleHandOnce()",context);
assert.equal(context.hand.length,4,"full hand never draws");

for(let turn=2;turn<=30;turn++){
  const used=context.hand.shift();
  if(used!=="card0") context.discard.push(used);
  else context.exhausted.push(used);
  vm.runInContext("refillBattleHandOnce()",context);
  assert.equal(context.hand.length,4,"hand refills by one at new turn "+turn);
  assert(!context.hand.includes("card0"),"exhausted card must not reshuffle");
}
assert(source.includes("if(turn>1) refillBattleHandOnce();"),"refill must occur at next turn boundary");
assert.equal(source.split("refillBattleHandOnce();").length-1,1,"no duplicate reaction/bonus draws");

const adapter=require("../src/core/legacy_combat_sources_v1.js");
const gear={
  work_gloves:{slot:"gloves",mods:{defense:1}},
  climber_boots:{slot:"boots",mods:{evade:5}},
  bronze_helm:{slot:"helmet",mods:{maxHp:2}}
};
const input={ownerCombat:{maxHp:90},totalMaxHp:90,weapon:{parts:{}},
  ownerEquipment:{helmet:"bronze_helm",armor:null,gloves:"work_gloves",boots:"climber_boots"},
  gearCatalog:gear,partCatalog:{},legacyVitals:{rawSurvivalBeforeArmor:5,boldness:50,age:24}};
const adapted=adapter.fromLegacyLoadout(input);
assert.equal(adapted.armor.gloves.attack,1,"gloves affect unified attack");
assert.equal(adapted.armor.boots.speed,8,"boots affect unified speed");
assert.equal(adapted.armor.helmet.maxHp,2,"helmet HP retained");
const wrong=adapter.fromLegacyLoadout({...input,
  ownerEquipment:{...input.ownerEquipment,gloves:"climber_boots"}});
assert.equal(wrong.armor.gloves.attack,0,"wrong-slot equipment ignored");
console.log("PASS: card rotation through turn 30, exhaustion, 4 armor slots, wrong-slot rejection");

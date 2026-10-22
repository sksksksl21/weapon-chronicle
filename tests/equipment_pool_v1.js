"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const original=fs.readFileSync(path.join(root,"src/legacy/game_runtime.js"),"utf8");
const source=fs.readFileSync(path.join(root,"src/core/equipment_pool_v1.js"),"utf8");
function legacy(name){
 const start=original.indexOf("const "+name+"="),end=original.indexOf("\n};",start);
 assert(start>=0&&end>start,"Original catalog must exist: "+name);
 return vm.runInNewContext(original.slice(start,end+3)+"\n"+name);
}
const baseParts=legacy("PART_CATALOG"),baseGear=legacy("OWNER_GEAR_CATALOG"),baseRarity=legacy("RARITY_DEF");
const snapshot=JSON.stringify({baseParts,baseGear});
function boot(){
 const PART_CATALOG=structuredClone(baseParts);
 const OWNER_GEAR_CATALOG=structuredClone(baseGear);
 const RARITY_DEF=structuredClone(baseRarity);
 const sandbox={PART_CATALOG,OWNER_GEAR_CATALOG,RARITY_DEF,
   randomGearStock:()=>{throw Error("Legacy unweighted stock used");}};
 vm.createContext(sandbox);
 vm.runInContext(source,sandbox);
 return {engine:vm.runInContext("WC_EQUIPMENT_POOL_V1",sandbox),sandbox,
   parts:PART_CATALOG,gear:OWNER_GEAR_CATALOG,rarities:RARITY_DEF};
}
const {engine,sandbox,parts,gear,rarities}=boot();
const ranks=["common","rare","unique","legendary","chronicle"];
const optionCounts=[0,1,2,3,3];
assert.equal(JSON.stringify(Object.keys(parts).sort()),JSON.stringify(Array.from(engine.W_SLOTS).sort()));
let generated=0;
for(const [kind,slots] of [["weapon",engine.W_SLOTS],["armor",engine.A_SLOTS]]){
 for(const slot of slots){
   const items=kind==="weapon"?Object.entries(parts[slot]):Object.entries(gear).filter(([,item])=>item.slot===slot);
   assert(items.length>=20,slot+" >=20 entries");
   const fresh=items.filter(([id])=>id.startsWith("wc5_"+slot+"_"));
   assert.equal(fresh.length,20,slot+" exactly 20 generated variants");
   generated+=fresh.length;
   for(let i=0;i<5;i++){
     const tier=ranks[i],group=fresh.filter(([,item])=>item.rarity===tier);
     assert.equal(group.length,4,slot+" 4 variants of "+tier);
     for(const [id,item] of group){
       assert.equal(item.options.length,optionCounts[i],id+" option count");
       assert.equal(new Set(item.options.map(o=>o.key)).size,item.options.length,id+" no repeated option");
       assert.equal(!!item.uniqueEffect,tier==="unique"||tier==="chronicle",id+" unique effect");
       if(kind==="armor"){
         for(const key of ["attack","crit","penetration","attackPct","power","precision","toughness","handling"]){
           assert.equal(item.mods[key]||0,0,id+" no offensive field "+key);
         }
         if(slot!=="boots")assert.equal(item.mods.speed||0,0,id+" non-boots no speed");
       }
       assert(engine.formatDetail(item).includes(rarities[tier].name),id+" rarity detail");
     }
   }
 }
}
assert.equal(generated,240);
for(const [slot,items] of Object.entries(baseParts)){
 for(const [id,item] of Object.entries(items))assert.equal(JSON.stringify(parts[slot][id]),JSON.stringify(item),id+" original unchanged");
}
for(const [id,item] of Object.entries(baseGear))assert.equal(JSON.stringify(gear[id]),JSON.stringify(item),id+" original unchanged");
assert.equal(JSON.stringify({baseParts,baseGear}),snapshot);
const countBefore=Object.keys(gear).length;
engine.expand(parts,gear,rarities);
assert.equal(Object.keys(gear).length,countBefore,"idempotent catalog expansion");
const duplicate=boot();
assert.equal(JSON.stringify(parts),JSON.stringify(duplicate.parts),"deterministic rolled catalog");
const stock=vm.runInContext("randomGearStock()",sandbox);
assert.equal(stock.length,6);
assert.equal(new Set(stock.map(item=>item.id)).size,6);
assert(stock.every(item=>gear[item.id]&&!item.sold));
const sourceManifest=fs.readFileSync(path.join(root,"tools/build_sources.py"),"utf8");
const preview=fs.readFileSync(path.join(root,"play-dev.html"),"utf8");
assert(sourceManifest.includes("core/equipment_pool_v1.js"));
assert(preview.includes("core/equipment_pool_v1.js"));
const status=fs.readFileSync(path.join(root,"src/core/status_skilldeck_v1.js"),"utf8");
assert(status.includes("WC_EQUIPMENT_POOL_V1.formatDetail"));
assert(status.includes("rarity-"));
// Each acquisition of the same generated template is a different saved item ID.
// The ID embeds a seed; rebuilding the catalog from a save restores exact rolls.
const copies=Array.from({length:20},()=>engine.rollCopy("wc5_blade_0_chronicle"));
assert(copies.every(x=>x&&x.id.startsWith("wc6_blade_0_chronicle_")));
assert.equal(new Set(copies.map(x=>x.id)).size,20,"each weapon copy gets an independent ID");
assert(new Set(copies.map(x=>JSON.stringify(x.item.mods))).size>1,
  "same archetype/tier can roll different attribute values");
for(const {id,item} of copies.slice(0,3)){
 assert.equal(item.rarity,"chronicle");
 assert.equal(item.options.length,3);
 assert(item.uniqueEffect);
 assert.equal(item.rolledInstance,true);
 const snapshot=JSON.stringify(item);
 delete parts.blade[id];
 assert.equal(JSON.stringify(engine.restoreCopy(id)),snapshot,
   "instance can be reproduced from its own ID, without saved catalog blobs");
}
const armorCopy=engine.rollCopy("wc5_helmet_0_unique");
assert(armorCopy&&gear[armorCopy.id]);
assert.equal(armorCopy.item.options.length,2);
assert(armorCopy.item.uniqueEffect);
for(const key of ["attack","crit","penetration","attackPct"])
 assert.equal(armorCopy.item.mods[key]||0,0,"no armor offensive bonuses on rolled copies");
const saved=JSON.stringify({inventory:{[copies[0].id]:2},
  ownerEquipment:{helmet:armorCopy.id},
  weapon:{parts:{blade:copies[1].id}}});
delete parts.blade[copies[0].id];delete parts.blade[copies[1].id];
delete gear[armorCopy.id];
assert.equal(engine.restoreFromSave(saved),3,"both owned, equipped gear and sword IDs restored");
assert.equal(JSON.stringify(gear[armorCopy.id]),JSON.stringify(armorCopy.item));
const fresh=boot();
assert.equal(JSON.stringify(fresh.engine.restoreCopy(copies[0].id)),
  JSON.stringify(copies[0].item),"independent new session reconstructs original roll");
assert.equal(engine.restoreCopy("wc6_blade_9_chronicle_fake"),null,
  "invalid instance IDs are not accepted");
const framed=engine.decorateCardHTML('<button class="gearChoiceCard40 active">상점 장비</button>',armorCopy.item);
assert(framed.includes("rarity-unique"),"shop card gets the correct rarity frame class");
assert(engine.decorateCardHTML('<button class="smithChoiceBtn">부품</button>',copies[0].item)
  .includes("rarity-chronicle"),"smith item gets its correct rarity frame class");
console.log("PASS: 20 independent copies, exact reload, 2 instance slots, rarity UI classes");
console.log("PASS: 240 rolled equipment variants, 20/slot, five grades and affix counts");
console.log("PASS: armor offensive prohibition, deterministic persistent IDs, unique effects");
console.log("PASS: old catalog unchanged, mobile loader/real status UI wired");

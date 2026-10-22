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
console.log("PASS: 240 rolled equipment variants, 20/slot, five grades and affix counts");
console.log("PASS: armor offensive prohibition, deterministic persistent IDs, unique effects");
console.log("PASS: old catalog unchanged, mobile loader/real status UI wired");

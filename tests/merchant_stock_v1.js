"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.join(__dirname,"..");
const equipment=fs.readFileSync(path.join(root,"src/core/equipment_pool_v1.js"),"utf8");
const merchant=fs.readFileSync(path.join(root,"src/core/merchant_stock_v1.js"),"utf8");
const parts={},gear={};
const W=["blade","guard","tang","grip","wrap","pommel","seat","scabbard"];
const A=["helmet","armor","gloves","boots"];
for(const slot of W){
 parts[slot]={};
 for(let n=0;n<4;n++)parts[slot]["base_"+slot+"_"+n]={
  name:slot+" "+n,rarity:"common",
  mods:{power:2+n,precision:1,toughness:1,handling:2},
  cost:{gold:20+n},shopPrice:35+n
 };
}
for(const slot of A)for(let n=0;n<4;n++)gear["base_"+slot+"_"+n]={
 name:slot+" "+n,slot,rarity:"common",price:35+n,
 mods:{maxHp:2,defense:1,attack:700,penetration:90}
};
const state={marketV24:{armor:[]},smithPartStock:[]};
const rarities={common:{name:"노멀"}};
let saved=0,renderArmor=0,renderSmith=0;
const ctx={
 PART_CATALOG:parts,OWNER_GEAR_CATALOG:gear,RARITY_DEF:rarities,V32_BETA:true,
 state,console,Math,Date,SAVE_KEY:"save",
 document:{head:{appendChild(){}},createElement:()=>({}),getElementById:()=>null},
 localStorage:{getItem:()=>null},
 loadGame:()=>true,randomGearStock:()=>[],
 generateSmithPartStockV24:()=>[],marketPartPrice:id=>40,
 saveGame:()=>{saved++;return true;},
 wc43StatsForArmor:()=>"<span>기본 방어</span>",
 wc43MarketArmor:()=>{renderArmor++;},
 openSmithBuy:()=>{renderSmith++;}
};
vm.createContext(ctx);
vm.runInContext(equipment,ctx);
vm.runInContext(merchant,ctx);
const module=vm.runInContext("WC_MERCHANT_STOCK_V1",ctx);
const arm=vm.runInContext("randomGearStock()",ctx);
const smith=vm.runInContext("generateSmithPartStockV24()",ctx);
assert.equal(arm.length,8);
assert.equal(smith.length,9);
assert.deepEqual(new Set(arm.map(x=>gear[x.id].slot)),new Set(A));
assert.deepEqual(new Set(smith.map(x=>x.slot)),new Set(W));
assert.equal(new Set(arm.map(x=>x.id)).size,8);
assert.equal(new Set(smith.map(x=>x.id)).size,9);
const fullTier=["common","rare","unique","legendary","chronicle"];
assert.deepEqual([...new Set(arm.map(x=>gear[x.id].rarity))].sort(),fullTier.slice().sort());
assert.deepEqual([...new Set(smith.map(x=>parts[x.slot][x.id].rarity))].sort(),fullTier.slice().sort());
for(const row of arm){
 const item=gear[row.id];
 assert(item.rolledInstance && item.generated && item.options);
 assert.equal(item.mods.attack||0,0);
 assert.equal(item.mods.penetration||0,0);
 assert(module.validRow("armor",row));
}
for(const row of smith){
 const item=parts[row.slot][row.id];
 assert(item.rolledInstance && item.generated);
 assert(item.shopPrice>0);
 assert.equal(item.cost,null,"rolled sword copy must not be craftable repeatedly");
 assert(module.validRow("sword",row));
}
const oldArmor={id:"base_helmet_0",sold:true};
const oldSmith={id:"base_blade_0",slot:"blade",price:30,sold:true};
state.marketV24.armor=[oldArmor,{id:"base_armor_0",sold:false},
  {id:"base_gloves_0",sold:false},{id:"base_boots_0",sold:false}];
state.smithPartStock=[oldSmith,{id:"base_guard_0",slot:"guard",sold:false,price:30},
  {id:"base_tang_0",slot:"tang",sold:false,price:30}];
vm.runInContext("wc43MarketArmor();openSmithBuy()",ctx);
assert.equal(renderArmor,1);
assert.equal(renderSmith,1);
assert.strictEqual(state.marketV24.armor[0],oldArmor,"sold armor untouched");
assert.strictEqual(state.smithPartStock[0],oldSmith,"sold sword untouched");
assert(state.marketV24.armor.slice(1).every(x=>x.id.startsWith("wc6_")));
assert(state.smithPartStock.slice(1).every(x=>x.id.startsWith("wc6_")));
assert(saved>=2,"visible stock migration persisted");
const id=smith[2].id,savedCopy=JSON.stringify(parts[smith[2].slot][id]);
delete parts[smith[2].slot][id];
assert.equal(vm.runInContext("WC_EQUIPMENT_POOL_V1.restoreCopy("+JSON.stringify(id)+")",ctx) &&
  JSON.stringify(parts[smith[2].slot][id]),savedCopy);
assert(vm.runInContext("wc43StatsForArmor("+JSON.stringify(arm[2].id)+")",ctx).includes("고유 효과"));
console.log("PASS: 8 armor and 9 smith offers, all equipment slots and five grades");
console.log("PASS: new instances/frames/options, old sold rows preserved, deterministic reload");

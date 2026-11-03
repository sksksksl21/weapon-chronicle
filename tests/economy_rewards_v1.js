"use strict";
// Focused browser-module smoke: no changes to the game's legacy save schema.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

(async()=>{
 const context={console,Math,Date};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync("src/core/module_services_v1.js","utf8"),context);
 const registry=vm.runInContext("WC_GAME_MODULES_V1",context);
 registry.register("equipment",{
  TIERS:[{id:"common",weight:1}],A_SLOTS:["helmet"],W_SLOTS:["blade"],
  rollCopy:()=>null,formatDetail:()=> ""
 });
 // Real combat module publishes this topic; the test isolates its consumer.
 registry.register("combat",{});
 const state={
  marketV24:{armor:[{id:"sold-helmet",sold:true}]},
  smithPartStock:[{id:"sold-blade",slot:"blade",sold:true}]
 };
 const gear={"new-helmet":{slot:"helmet",price:20}};
 const parts={blade:{"new-blade":{shopPrice:45}}};
 let saved=0;
 Object.assign(context,{
  state,OWNER_GEAR_CATALOG:gear,PART_CATALOG:parts,
  saveGame:()=>{saved++;return true;}
 });
 vm.runInContext(fs.readFileSync("src/core/merchant_stock_v1.js","utf8"),context);
 vm.runInContext(fs.readFileSync("src/core/economy_rewards_v1.js","utf8"),context);
 assert(registry.has("merchant")&&registry.has("economy"));
 await registry.initialize();
 const economy=registry.require("economy");
 assert.equal(typeof economy.applyEquipmentReward,"function");
 registry.events.publish("combat:reward",{id:6,kind:"combat-experience",amount:70});
 assert.equal(saved,0,"XP already settled: never award it twice");
 const reward={id:6,kind:"equipment-loot",rewardId:"drop-1",
  armor:["new-helmet"],sword:[{id:"new-blade",slot:"blade"}]};
 registry.events.publish("combat:reward",reward);
 assert.equal(state.marketV24.armor.length,2);
 assert.equal(state.smithPartStock.length,2);
 assert.equal(state.smithPartStock[1].price,45);
 assert.equal(saved,1,"one atomic stock save for the explicit reward");
 assert(state.marketV24.armor[0].sold&&state.smithPartStock[0].sold,
  "historical sold offers are never replaced");
 registry.events.publish("combat:reward",reward);
 assert.equal(saved,1,"a duplicate combat reward must be idempotent");
 registry.events.publish("combat:reward",
  {id:7,kind:"equipment-loot",armor:["unknown-armor"]});
 assert.equal(saved,1,"invalid item IDs must be rejected");
 await registry.dispose();
 registry.events.publish("combat:reward",
  {id:8,kind:"equipment-loot",armor:["new-helmet"]});
 assert.equal(saved,1,"disposed module must unsubscribe");
 console.log("PASS: economy receives combat rewards, keeps stock/saves safe");
})().catch(error=>{console.error(error);throw error;});

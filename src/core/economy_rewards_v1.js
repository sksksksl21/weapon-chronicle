/* Combat-reward -> equipment/merchant stock boundary.
 * XP and gold are settled by the legacy combat system; NEVER grant either
 * twice. Only explicit validated equipment-loot payloads can update stock.
 * Reward subscriptions are installed/removed by the shared module lifecycle.
 */
const WC_ECONOMY_REWARDS_V1=(()=>{
"use strict";
function applyEquipmentReward(reward){
 if(typeof WC_GAME_MODULES_V1==="undefined")return false;
 return WC_GAME_MODULES_V1.require("merchant").applyCombatReward(reward);
}
function catalogSources({kind,slot,id}){
 return [{method:"conditional-stock-reward",source:"core/economy_rewards_v1.js:applyEquipmentReward",
  payloadKind:"equipment-loot",destination:kind==="armor"?"marketV24.armor":"smithPartStock",
  itemId:id,slot,condition:"Explicit validated payload only; no automatic equipment drop producer"}];
}
const api=Object.freeze({applyEquipmentReward,catalogSources});
if(typeof WC_GAME_MODULES_V1!=="undefined")
 WC_GAME_MODULES_V1.register({
  id:"economy",
  dependencies:["merchant","combat"],
  init(services){
   services.events.subscribe("combat:reward",applyEquipmentReward);
   return api;
  }
 });
return api;
})();
if(typeof module!=="undefined"&&module.exports)
 module.exports=WC_ECONOMY_REWARDS_V1;

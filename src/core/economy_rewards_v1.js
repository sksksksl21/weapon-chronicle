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
const api=Object.freeze({applyEquipmentReward});
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

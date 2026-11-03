/* Transitional UI-facing direct-stat runtime input, 2026-10-21 contract.
 * This is an explicit compatibility migration bridge; no old source stats are
 * read by WC_DIRECT_COMBAT_V2.calculate itself.
 * TODO: replace legacy 1..10 owner-growth scaling with audited 0..100 migration.
 */
function wcDirectOwnerRates(){
 const raw=rawOwnerStats(), eff=effectiveOwnerStats();
 const mental=Number.isFinite(Number(eff.mult))?Number(eff.mult):1;
 const armorSurvival=typeof armorSurvivalValue==="function"?Number(armorSurvivalValue()||0):0;
 const weaponMartial=Number(raw.parts?.weapon||0);
 const currentMartial=Math.max(0,Number(eff.martial||0)-weaponMartial*mental);
 const currentSurvival=Math.max(0,Number(eff.survival||0)-armorSurvival*mental);
 const safe=x=>Math.max(0,Math.min(100,Math.round(x*10)));
 // Explicit migration of v5.2 personal points, not 7 -> 7%.
 return {
  martial:safe(currentMartial),survival:safe(currentSurvival),
  social:safe(Number(eff.social||0)),
  stableSurvival:safe(Math.max(0,Number(raw.survival||0)-armorSurvival))
 };
}
function wcDirectCurrentStats(weaponOverride=null,gearOverride=null){
 const weapon=weaponOverride||state.weapon||{},gear=gearOverride||state.ownerEquipment||{};
 const items=WC_DIRECT_COMBAT_V2.migrateLegacyLoadout({
  weapon,partCatalog:PART_CATALOG,equipment:gear,gearCatalog:OWNER_GEAR_CATALOG
 });
 const rates=wcDirectOwnerRates();
 // Legacy maxHp already contains armor flat HP; undo that component exactly
 // so the direct layer can scale the equipment HP bonus once.
 const hpFromGear=WC_DIRECT_COMBAT_V2.ARMOR_SLOTS.reduce((total,slot)=>
  total+Number(items.armor[slot]?.maxHp||0),0);
 // Transitional display only: preserve the CURRENT legacy HP cap exactly.
 // The permanent 0..100 HP migration needs its own save/version audit; never
 // shrink or heal current HP just because the new status window is opened.
 const owner={...rates,baseHp:Math.max(1,Number(state.maxHp||1)-
   hpFromGear*rates.stableSurvival/100)};
 const result=WC_DIRECT_COMBAT_V2.calculate({owner,...items});
 return Object.freeze({...result,ownerRates:Object.freeze(rates),
  migration:Object.freeze({version:"legacy-v5.2-preview",audited:false})});
}
// The live handoff and status UI share the direct calculator. This compatibility
// projection must never apply owner rates or equipment modifiers a second time.
function wcCurrentUnifiedStats(weaponOverride=null,gearOverride=null){
 const result=wcDirectCurrentStats(weaponOverride,gearOverride);
 return Object.freeze({...result,
  attack:(result.minAttack+result.maxAttack)/2
 });
}

/* Combat boundary. Versioned globals above remain compatibility adapters;
 * calculators and deck state are shared by reference, never copied/rebalanced.
 * Getters preserve the manifest's load order (handoff/deck load after runtime).
 */
const WC_COMBAT_MODULE_V1=(()=>{
 "use strict";
 let services=null, cleanup=null, encounter=null, sequence=0;
 const EVENTS=Object.freeze({START:"combat:start",END:"combat:end",REWARD:"combat:reward"});
 function publish(topic,payload){
  // Observers must not interrupt legacy settlement or checkpoint commits.
  try{services?.events.publish(topic,Object.freeze(payload));}
  catch(error){if(typeof console!=="undefined")console.warn("Combat observer failed",error);}
 }
 function initialize(registry){
  if(cleanup)return api;
  services=registry|| (typeof WC_GAME_MODULES_V1!=="undefined"?WC_GAME_MODULES_V1:null);
  const undo=[];
  if(typeof window!=="undefined"&&typeof launchStoryCombat==="function"){
   const previousLaunch=launchStoryCombat;
   const launch=function(...args){
    const result=previousLaunch.apply(this,args);
    const pending=typeof state!=="undefined"?state.storyCtx?.combatPending:null;
    if(pending){
     encounter=Object.freeze({id:++sequence,enemy:pending.enemy,label:pending.label,tier:pending.tier});
     publish(EVENTS.START,{...encounter});
    }
    return result;
   };
   launchStoryCombat=launch;
   undo.push(()=>{if(launchStoryCombat===launch)launchStoryCombat=previousLaunch;});
   if(typeof gainCombatExperience==="function"){
    const previousGain=gainCombatExperience;
    const gain=function(...args){
     const before=Number(state.ownerProgress?.combatXp||0);
     const result=previousGain.apply(this,args);
     if(encounter)publish(EVENTS.REWARD,{...encounter,kind:"combat-experience",
      tier:args[0],boss:!!args[1],factor:args[2]===undefined?1:args[2],
      amount:result,previousXp:before,currentXp:Number(state.ownerProgress?.combatXp||0)});
     return result;
    };
    gainCombatExperience=gain;
    undo.push(()=>{if(gainCombatExperience===gain)gainCombatExperience=previousGain;});
   }
   // Registered after the legacy listener: resources and rewards have already
   // been applied. No settlement, save or story transition is repeated here.
   const onMessage=event=>{
    if(event?.data?.type!=="wc-story-combat"||!encounter)return;
    const frame=document.getElementById("combatFrame");
    if(event.source&&frame?.contentWindow&&event.source!==frame.contentWindow)return;
    if(state.storyCtx?.combatPending)return;
    const completed=encounter;encounter=null;
    publish(EVENTS.END,{...completed,result:event.data.result});
   };
   if(typeof window.addEventListener==="function"){
    window.addEventListener("message",onMessage);
    undo.push(()=>window.removeEventListener("message",onMessage));
   }
  }
  cleanup=()=>{undo.reverse().forEach(fn=>fn());encounter=null;services=null;cleanup=null;};
  return api;
 }
 function dispose(){if(cleanup)cleanup();}
 const api=Object.freeze({initialize,dispose,EVENTS,
  get math(){return WC_COMBAT_MATH_V1;},
  get stats(){return WC_DIRECT_COMBAT_V2;},
  get legacySources(){return WC_LEGACY_COMBAT_SOURCES_V1;},
  get handoff(){return WC_LIVE_COMBAT_HANDOFF_V1;},
  get skillDeck(){return WC_STATUS_SKILLDECK_V1;},
  ownerRates:wcDirectOwnerRates,currentStats:wcDirectCurrentStats,
  unifiedStats:wcCurrentUnifiedStats,
  launch(...args){return launchStoryCombat.apply(this,args);}
 });
 if(typeof WC_GAME_MODULES_V1!=="undefined"){
  WC_GAME_MODULES_V1.register({id:"combat",initialize,dispose});
  if(typeof window!=="undefined")window.WC_GAME_MODULES_V1=WC_GAME_MODULES_V1;
 }else if(typeof window!=="undefined"){
  // Standalone source previews have no game registry script. Expose only the
  // same registration/lookup surface; lifecycle is explicitly caller driven.
  const modules=new Map();
  window.WC_COMBAT_MODULES_V1=Object.freeze({
   register(id,value){if(modules.has(id))throw new Error("Duplicate game module: "+id);modules.set(id,value);return value;},
   get(id){return modules.get(id);}
  });
  window.WC_COMBAT_MODULES_V1.register("combat",api);
 }
 return api;
})();

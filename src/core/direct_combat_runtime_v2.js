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
 // Installed in the combat IIFE, before its event bindings and first reset.
 // Keep the existing resolver (including damage, cards and speed extras) intact.
 function installEnemyIntent(createEnemyIntent){
  const enemyIntentRuntime=createEnemyIntent();
  // Memory interventions use the frame's real hand, discard/exhaust piles and
  // resonance rules. This is a view/guard over the existing resolver, not a
  // second card system or a manual replacement for the owner's chosen plan.
  let committedTelegraph=null;
  const ledger=[];
  const snapshot=()=>Object.freeze({turn,phase,hp:hero.hp,enemyHp:enemy.hp,
   resonance,hand:Object.freeze(hand.slice()),discard:Object.freeze(discard.slice()),
   exhausted:Object.freeze(exhausted.slice())});
  const record=(kind,before,details={})=>{
   ledger.push(Object.freeze({kind,telegraph:enemyIntentRuntime.telegraph||committedTelegraph,
    ...details,before,after:snapshot()}));
  };
  const originalCanUse=canUseCard;
  canUseCard=function(id){
   if(hero.hp<=0||enemy.hp<=0)return false;
   if(phase==='pre'&&!enemyIntentRuntime.pending)return false;
   // An enemyHit card cannot react to an unrelated/stale reaction window.
   if(CARD_DB[id]?.timing==='enemyHit'&&!(pending?.enemyDamage>0))return false;
   return originalCanUse(id);
  };
  const originalSpend=spendResonance;
  spendResonance=function(id){
   const before=snapshot(),paid=originalSpend(id);
   if(paid)record('resonance-cost',before,{card:id,cost:cardCost(id)});
   return paid;
  };
  const originalUse=useCard;
  useCard=function(id){
   if(!canUseCard(id))return;
   const before=snapshot(),result=originalUse(id);
   record(CARD_DB[id].timing==='pre'?'selection':'reaction',before,{card:id});
   return result;
  };
  const originalCommit=commitPreCard;
  commitPreCard=function(){
   const before=snapshot(),cards=selectedPre.slice(),result=originalCommit();
   record('commit',before,{cards:Object.freeze(cards.filter(id=>usedThisTurn.includes(id)))});
   return result;
  };
  const originalStart=startTurn;
  startTurn=function(...args){
   const before=snapshot(),result=originalStart.apply(this,args);
   record('turn-start',before,{recovery:Math.max(0,resonance-before.resonance)});
   return result;
  };
  const originalDiscard=discardBattleCard36;
  discardBattleCard36=function(){
   const before=snapshot(),wasDiscarded=discardedThisTurn36,result=originalDiscard();
   if(!wasDiscarded&&discardedThisTurn36)record('discard',before);
   return result;
  };
  const originalEndTurn=endTurn;
  endTurn=async function(...args){
   const before=snapshot(),result=await originalEndTurn.apply(this,args);
   record('exchange-result',before);
   return result;
  };
  const originalExecute=executeTurn;
  executeTurn=function(...args){
   if(!enemyIntentRuntime.pending||phase!=='pre')return;
   return originalExecute.apply(this,args);
  };
  const options=()=>Object.freeze(hand.filter(id=>canUseCard(id)).map(id=>Object.freeze({
   id,name:displayCardName(id),timing:CARD_DB[id].timing,
   benefit:displayCardEffect(id),cost:cardCost(id),
   destination:CARD_DB[id].exhaust?'exhausted':'discard',
   tradeoff:'사용/버림 합계 턴당 1장 · 공명 소모 · 반응 카드는 해당 판정 후에만 사용',
   selected:selectedPre.includes(id),
   telegraph:enemyIntentRuntime.telegraph||committedTelegraph
  })));
  window.WC_MEMORY_INTERVENTION_V1=Object.freeze({
   get options(){return options();},get state(){return snapshot();},
   get ledger(){return Object.freeze(ledger.slice());},
   use(id){if(!canUseCard(id))return false;useCard(id);return true;}
  });
  let autoTimer=null, cancelled=false;
  const clear=()=>{cancelled=true;enemyIntentRuntime.cancel();clearTimeout(autoTimer);autoTimer=null;};
  const oldChoose=chooseEnemyIntent;
  chooseEnemyIntent=function(){
   cancelled=false;
   enemyIntentRuntime.cancel();
   committedTelegraph=null;
   return enemyIntentRuntime.decide(oldChoose(),turn).action;
  };
  const oldResolve=resolveEnemyPhase;
  resolveEnemyPhase=async function(...args){
   if(cancelled||hero.hp<=0||enemy.hp<=0||phase==='done'){clear();return;}
   const publicTelegraph=enemyIntentRuntime.telegraph;
   const planned=enemyIntentRuntime.take(turn);
   if(!planned){clear();return;}
   enemyIntent=planned.action;
   committedTelegraph=publicTelegraph;
   const before=snapshot(),result=await oldResolve.apply(this,args);
   record('enemy-result',before);
   return result;
  };
  const oldRender=render;
  render=function(...args){
   const result=oldRender.apply(this,args);
   // The normal card buttons are the intervention controls. Keep their exact
   // eligibility and show the benefit/cost mapping without adding free actions.
   const cardButtons=$('cards')?.children;
   if(cardButtons)Array.from(cardButtons).forEach((node,index)=>{
    const id=hand[index];if(!CARD_DB[id])return;
    node.title=displayCardEffect(id)+' · 공명 '+cardCost(id)+' · '+
     (CARD_DB[id].exhaust?'전투 중 소진':'버린 카드로 이동')+' · 턴당 개입 1장';
   });
   if(hero.hp<=0||enemy.hp<=0||phase==='done')clear();
   if(!enemyIntentRuntime.pending){
    for(const id of ['enemyActionIcon','enemyActionText','enemyHitPct','enemyDmgText']){
     const node=$(id);if(node)node.textContent='';
    }
   }
   clearTimeout(autoTimer);autoTimer=null;
   // Optional card windows expire through the same controls as manual play.
   // No new combat rolls, rewards or speed-gauge advances are introduced.
   const waiting=phase;
   if(!cancelled&&hero.hp>0&&enemy.hp>0&&['pre','heroReaction','enemyReaction'].includes(waiting)){
    autoTimer=setTimeout(()=>{
     autoTimer=null;
     if(phase!==waiting||hero.hp<=0||enemy.hp<=0)return;
     if(phase==='pre')executeTurn();
     else $('skipBtn').onclick();
    },options().length?8000:1200);
   }
   return result;
  };
  for(const name of ['stageVictory','runEnd','resetRun']){
   const previous=name==='stageVictory'?stageVictory:name==='runEnd'?runEnd:resetRun;
   const wrapped=function(...args){
    clear();
    if(name==='resetRun'){ledger.length=0;committedTelegraph=null;}
    return previous.apply(this,args);
   };
   if(name==='stageVictory')stageVictory=wrapped;
   else if(name==='runEnd')runEnd=wrapped;
   else resetRun=wrapped;
  }
  window.addEventListener('pagehide',clear);
  // Read-only public telegraph: AI weights and rolled damage stay private.
  window.WC_ENEMY_INTENT_V1=Object.freeze({
   get telegraph(){return enemyIntentRuntime.telegraph;},
   cancel(){clear();render();}
  });
 }
 function decorateCombatDocument(html){
  const marker="$('chronicleBtn').onclick=openChronicle;";
  if(!html.includes(marker))throw new Error('Enemy intent combat bootstrap marker missing');
  const factory=WC_LEGACY_COMBAT_SOURCES_V1.createEnemyIntent;
  return html.replace(marker,'('+installEnemyIntent.toString()+')('+factory.toString()+');\n'+marker);
 }
 function initialize(registry){
  if(cleanup)return api;
  services=registry|| (typeof WC_GAME_MODULES_V1!=="undefined"?WC_GAME_MODULES_V1:null);
  const undo=[];
  if(typeof getCombatSrcdoc==='function'){
   const previousDocument=getCombatSrcdoc;
   const documentWithIntent=function(...args){return decorateCombatDocument(previousDocument.apply(this,args));};
   getCombatSrcdoc=documentWithIntent;
   undo.push(()=>{if(getCombatSrcdoc===documentWithIntent)getCombatSrcdoc=previousDocument;});
  }
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
 const api=Object.freeze({initialize,dispose,EVENTS,decorateCombatDocument,
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

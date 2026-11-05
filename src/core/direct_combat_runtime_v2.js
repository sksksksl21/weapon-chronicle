/* Transitional UI-facing direct-stat runtime input, 2026-10-21 contract.
 * This is an explicit compatibility migration bridge; no old source stats are
 * read by WC_DIRECT_COMBAT_V2.calculate itself.
 * Owner points are percentages on the displayed 0..100 scale; no implicit x10.
 */
function wcDirectOwnerRates(equipment=null){
 const eff=effectiveOwnerStats(true,equipment), raw=eff.raw||rawOwnerStats(true,equipment||state.ownerEquipment||{});
 const mental=Number.isFinite(Number(eff.mult))?Number(eff.mult):1;
 const armorSurvival=typeof armorSurvivalValue==="function"?Number(armorSurvivalValue(equipment||state.ownerEquipment||{})||0):0;
 const weaponMartial=Number(raw.parts?.weapon||0);
 const currentMartial=Math.max(0,Number(eff.martial||0)-weaponMartial*mental);
 const currentSurvival=Math.max(0,Number(eff.survival||0)-armorSurvival*mental);
 const safe=x=>Math.max(0,Math.min(100,x));
 // Equipment identity is removed once; mental/injury modifiers remain applied once.
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
 const rates=wcDirectOwnerRates(gear);
 // Legacy maxHp already contains armor flat HP; undo that component exactly
 // so the direct layer can scale the equipment HP bonus once.
 const currentItems=gearOverride?WC_DIRECT_COMBAT_V2.migrateLegacyLoadout({
  weapon:state.weapon||{},partCatalog:PART_CATALOG,
  equipment:state.ownerEquipment||{},gearCatalog:OWNER_GEAR_CATALOG
 }):items;
 const hpFromGear=WC_DIRECT_COMBAT_V2.ARMOR_SLOTS.reduce((total,slot)=>
  total+Number(currentItems.armor[slot]?.maxHp||0),0);
 // Transitional display only: preserve the CURRENT legacy HP cap exactly.
 // The permanent 0..100 HP migration needs its own save/version audit; never
 // shrink or heal current HP just because the new status window is opened.
 const owner={...rates,baseHp:Math.max(1,Number(state.maxHp||1)-
   hpFromGear*rates.stableSurvival/100)};
 // A candidate armor loadout must use the very cap that actual equip commits.
 if(gearOverride&&typeof ownerVitalCaps==="function"){
  const cap=ownerVitalCaps(state.owner,gear,true).maxHp;
  const candidateHp=WC_DIRECT_COMBAT_V2.ARMOR_SLOTS.reduce((v,k)=>v+Number(items.armor[k]?.maxHp||0),0);
  owner.baseHp=Math.max(1,cap-candidateHp*rates.stableSurvival/100);
 }
 const result=WC_DIRECT_COMBAT_V2.snapshot({owner,...items});
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

// Pure candidate input adapter; final arithmetic remains in snapshot().
function previewEquipment({kind,slot,id}={}){
 const before=wcDirectCurrentStats();
 let weapon=null,gear=null;
 if(kind==="weapon"&&WC_DIRECT_COMBAT_V2.PART_SLOTS.includes(slot)&&PART_CATALOG[slot]?.[id]){
  weapon={...state.weapon,parts:{...state.weapon.parts,[slot]:id}};
  recalcWeapon(weapon);
 }else if(kind==="armor"&&WC_DIRECT_COMBAT_V2.ARMOR_SLOTS.includes(slot)&&OWNER_GEAR_CATALOG[id]?.slot===slot){
  gear={...state.ownerEquipment,[slot]:id};
 }else throw new TypeError("Invalid equipment candidate");
 const after=wcDirectCurrentStats(weapon,gear);
 const delta=Object.freeze(Object.fromEntries(Object.keys(before).filter(k=>typeof before[k]==="number")
  .map(k=>[k,after[k]-before[k]])));
 return Object.freeze({before,after,delta});
}
function equipmentPreviewHtml(candidate){
 const {before,after,delta}=previewEquipment(candidate);
 const labels={minAttack:"\ucd5c\uc18c\uacf5\uaca9",maxAttack:"\ucd5c\ub300\uacf5\uaca9",hitChance:"\uba85\uc911",critChance:"\uce58\uba85\ud0c0\ud655\ub960",critDamageBonus:"\uce58\uba85\ud0c0\ud53c\ud574",penetration:"\uad00\ud1b5\ub825",attackSpeed:"\uacf5\uaca9\uc18d\ub3c4",maxResonance:"\ucd5c\ub300 \uacf5\uba85",defense:"\ubc29\uc5b4\ub825",evade:"\ud68c\ud53c\uc728",blockChance:"\ub9c9\uae30\ud655\ub960",blockAmount:"\ub9c9\uae30\ud53c\ud574\uac10\uc18c",critChanceResist:"\uce58\uba85\uc800\ud56d\uc728",critDamageResist:"\uce58\uba85\ud53c\ud574\uac10\uc18c",maxHp:"\uccb4\ub825",resonanceRecovery:"\uacf5\uba85 \ud68c\ubcf5"};
 const fmt=v=>Math.round(v*1000)/1000;
 return '<div class="partDelta">'+Object.entries(labels).map(([key,label])=>
  `<span class="${delta[key]>0?'partBuff':delta[key]<0?'partDebuff':'partNeutral'}">${label} ${fmt(before[key])} &rarr; ${fmt(after[key])} (${delta[key]>0?'+':''}${fmt(delta[key])})</span>`).join('')+'</div>';
}

/* Combat boundary. Versioned globals above remain compatibility adapters;
 * calculators and deck state are shared by reference, never copied/rebalanced.
 * Getters preserve the manifest's load order (handoff/deck load after runtime).
 */
const WC_COMBAT_MODULE_V1=(()=>{
 "use strict";
 // Offline QA input: one run per {condition, seed, version, strategy}.
 // conditions must include enemy/pattern, HP, weapon and available cards. Seeds
 // identify an externally controlled random stream, not a new combat RNG here.
 // Feed real exported ledgers from both revisions; never synthesize a baseline.
 function compareInterventionStrategies({conditions=[],runs=[]}={}){
  const copy=value=>JSON.parse(JSON.stringify(value));
  const distribution=values=>{
   const sorted=values.slice().sort((a,b)=>a-b),n=sorted.length;
   return {count:n,values:sorted,min:n?sorted[0]:null,max:n?sorted[n-1]:null,
    mean:n?sorted.reduce((a,b)=>a+b,0)/n:null,
    median:n?(sorted[Math.floor((n-1)/2)]+sorted[Math.ceil((n-1)/2)])/2:null};
  };
  const ids=new Set(),keys=new Set(),missing=[];
  for(const c of conditions){
   if(!c.id||ids.has(c.id)||['enemy','pattern','hp','weapon','cards'].some(k=>c[k]===undefined))
    throw new TypeError('Unique conditions require id, enemy, pattern, hp, weapon and cards');
   ids.add(c.id);
  }
  const samples=runs.map(run=>{
   if(!ids.has(run.condition)||!['before','after'].includes(run.version)||
    !run.strategy||run.seed===undefined||!run.revision||!Array.isArray(run.ledger))
    throw new TypeError('Run requires declared condition, version, strategy, seed, revision and ledger');
   const key=JSON.stringify([run.condition,run.seed,run.version,run.strategy]);
   if(keys.has(key))throw new TypeError('Duplicate comparison sample');
   keys.add(key);
   const ledger=run.ledger,events=kind=>ledger.filter(e=>e.kind===kind);
   const damage=events('damage').map(e=>e.amount);
   if(damage.some(n=>!Number.isFinite(n)||n<0))throw new TypeError('Invalid damage evidence');
   const costs=events('resonance-cost'),heavy=events('telegraph').filter(e=>e.telegraph?.kind==='heavy');
   const defensive=new Set(['guard','endure','mainCarry','gritMemory']);
   const evasive=new Set(['feint','storyPrayer','escapeMemory']);
   const heavyChoices=heavy.map(e=>{
    const paid=costs.filter(c=>c.telegraph?.id===e.telegraph.id);
    return {id:e.telegraph.id,defense:paid.some(c=>defensive.has(c.base)),
     evasion:paid.some(c=>evasive.has(c.base)),intervened:paid.length>0};
   });
   const count=predicate=>heavyChoices.filter(predicate).length;
   const coverage=events('combat-end').length===1&&events('telemetry-start').length===1;
   if(!coverage)missing.push('Incomplete telemetry: '+key);
   return {condition:run.condition,seed:run.seed,version:run.version,strategy:run.strategy,
    revision:run.revision,complete:coverage,outcome:events('combat-end').at(-1)?.outcome||null,
    damage:distribution(damage),totalDamage:damage.reduce((a,b)=>a+b,0),
    turns:new Set(events('telegraph').map(e=>e.telegraph.turn)).size,
    cardUses:costs.length,cards:costs.map(e=>e.card),
    resonanceSpent:costs.reduce((n,e)=>n+e.cost,0),
    resonanceChange:ledger.length?ledger.at(-1).after.resonance-ledger[0].before.resonance:0,
    heavy:{seen:heavy.length,defense:count(e=>e.defense),evasion:count(e=>e.evasion),
     defensiveInterventions:count(e=>e.defense||e.evasion),
     none:count(e=>!e.intervened),aggressive:count(e=>e.intervened&&!e.defense&&!e.evasion),
     defensiveRate:heavy.length?count(e=>e.defense||e.evasion)/heavy.length:null},
    outcomes:events('intervention-result').map(e=>({effect:e.effect,text:e.text})),
    ledger:copy(ledger)};
  });
  const pairs=[];
  for(const s of samples){
   const other=samples.find(t=>t.condition===s.condition&&t.seed===s.seed&&
    t.strategy===s.strategy&&t.version!==s.version);
   if(!other)missing.push('Missing matched revision: '+JSON.stringify([s.condition,s.seed,s.strategy]));
   else if(s.version==='after')pairs.push({condition:s.condition,seed:s.seed,strategy:s.strategy,
    damageDelta:s.totalDamage-other.totalDamage,turnDelta:s.turns-other.turns,
    cardDelta:s.cardUses-other.cardUses,resonanceDelta:s.resonanceChange-other.resonanceChange});
  }
  const groups=[];
  for(const c of conditions)for(const version of ['before','after']){
   const strategies=[...new Set(samples.filter(s=>s.condition===c.id&&s.version===version).map(s=>s.strategy))];
   if(!strategies.length)missing.push('No samples: '+c.id+'/'+version);
   for(const strategy of strategies){
    const rows=samples.filter(s=>s.condition===c.id&&s.version===version&&s.strategy===strategy);
    const seen=rows.reduce((n,s)=>n+s.heavy.seen,0);
    groups.push({condition:c.id,version,strategy,sampleCount:rows.length,
     damage:distribution(rows.map(s=>s.totalDamage)),turns:distribution(rows.map(s=>s.turns)),
     cardUses:distribution(rows.map(s=>s.cardUses)),resonanceChange:distribution(rows.map(s=>s.resonanceChange)),
     heavySeen:seen,defensiveRate:seen?rows.reduce((n,s)=>n+s.heavy.defensiveInterventions,0)/seen:null});
   }
  }
  // Paired multi-objective comparison, not an arbitrary weighted balance score.
  // A repeat policy dominates only if it is never worse on any tested seed in
  // victory, incoming damage, turns, card use and resonance spent, and improves
  // at least one. Missing seeds are an evidence gap, never a win.
  const strategyComparisons=[];
  for(const c of conditions){
   const rows=samples.filter(s=>s.condition===c.id&&s.version==='after');
   const strategies=[...new Set(rows.map(s=>s.strategy))];
   if(strategies.length<2)missing.push('Insufficient strategy coverage: '+c.id);
   for(const strategy of strategies)for(const alternative of strategies.filter(s=>s!==strategy)){
    const seeds=[...new Set(rows.map(s=>s.seed))];
    let improves=false,neverWorse=true,matched=0;
    for(const seed of seeds){
     const a=rows.find(s=>s.seed===seed&&s.strategy===strategy);
     const b=rows.find(s=>s.seed===seed&&s.strategy===alternative);
     if(!a?.complete||!b?.complete){neverWorse=false;continue;}
     matched++;
     const vector=s=>[s.outcome==='victory'?0:1,s.totalDamage,s.turns,s.cardUses,s.resonanceSpent];
     const av=vector(a),bv=vector(b);
     neverWorse=neverWorse&&av.every((v,i)=>v<=bv[i]);
     improves=improves||av.some((v,i)=>v<bv[i]);
    }
    if(matched!==seeds.length)missing.push('Unmatched strategy seeds: '+c.id+'/'+strategy+'/'+alternative);
    strategyComparisons.push({condition:c.id,strategy,alternative,matchedSeeds:matched,
     dominates:matched===seeds.length&&matched>0&&neverWorse&&improves});
   }
  }
  if(!conditions.length)missing.push('No declared conditions');
  return {conditions:copy(conditions),sampleCount:samples.length,samples,groups,pairs,strategyComparisons,
   missing:[...new Set(missing)],status:'validation-pending',
   limitations:['Gross incoming damage includes damage later refunded by reactions.',
    'Strategy dominance and preservation require separate verified play evidence; metrics alone do not establish balance.'],
   integration:{code:'implemented',validation:'pending',githubDev:'not-verified'}};
 }
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
  // Observe the existing damage sink, including extra attacks. Do not sum
  // nested enemy-result/exchange-result HP deltas (they overlap and include heals).
  const originalDamage=ownerTookDamage;
  ownerTookDamage=function(amount,...args){
   record('damage',snapshot(),{amount});
   return originalDamage.call(this,amount,...args);
  };
  const originalFeedback=showInterventionResult;
  showInterventionResult=function(effect,text,...args){
   record('intervention-result',snapshot(),{effect,text});
   return originalFeedback.call(this,effect,text,...args);
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
   if(paid)record('resonance-cost',before,{card:id,base:cardBase(id),cost:cardCost(id)});
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
   const action=enemyIntentRuntime.decide(oldChoose(),turn).action;
   record('telegraph',snapshot());
   return action;
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
    if(name!=='resetRun')record('combat-end',snapshot(),{outcome:name==='stageVictory'?'victory':'defeat'});
    clear();
    if(name==='resetRun'){ledger.length=0;committedTelegraph=null;}
    const result=previous.apply(this,args);
    if(name==='resetRun')ledger.unshift(Object.freeze({kind:'telemetry-start',before:snapshot(),after:snapshot()}));
    return result;
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
 const api=Object.freeze({initialize,dispose,EVENTS,decorateCombatDocument,compareInterventionStrategies,
  get math(){return WC_COMBAT_MATH_V1;},
  get stats(){return WC_DIRECT_COMBAT_V2;},
  get legacySources(){return WC_LEGACY_COMBAT_SOURCES_V1;},
  get handoff(){return WC_LIVE_COMBAT_HANDOFF_V1;},
  get skillDeck(){return WC_STATUS_SKILLDECK_V1;},
  ownerRates:wcDirectOwnerRates,currentStats:wcDirectCurrentStats,previewEquipment,
  unifiedStats:wcCurrentUnifiedStats,
  launch(...args){return launchStoryCombat.apply(this,args);}
 });
 if(typeof window!=="undefined")window.WC_COMBAT_VALIDATION_V1=Object.freeze({compareInterventionStrategies});
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

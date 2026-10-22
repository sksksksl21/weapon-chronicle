"use strict";
// Execute the generated combat document's real functions. Only DOM rendering,
// animation delays and bootstrap are replaced; no battle arithmetic is mocked.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../combat_story.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const actor={maxHp:100,maxResonance:70,resonanceRecovery:9,attack:30,defense:10,attackSpeed:120,critChance:20,penetration:3};
function boot(snapshot=actor,extra={}){
  const nodes=new Map(),messages=[],timers=[],events=[],testRolls=[];
  const element=()=>({style:{},classList:{add(){},remove(){}},appendChild(){},remove(){},children:[],dataset:{}});
  const dataset={storyMode:'1',enemy:'bandit',hp:'90',maxHp:'100',resonance:'0',mind:'100',...extra};
  if(snapshot!==null)dataset.unifiedActorV1=JSON.stringify(snapshot);
  const math=Object.create(Math);math.random=()=>.5;
  const context={console,URLSearchParams,location:{search:''},Math:math,events,testRolls,
    document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,addEventListener(){}},
    window:{frameElement:{dataset},parent:{postMessage:m=>messages.push(m)}},
    localStorage:{getItem:()=>null,setItem(){}},setTimeout:fn=>timers.push(fn)};
  const hook=`
    render=()=>{};setScene=()=>{};renderChronicleButton=()=>{};log=message=>events.push(message);showBanner=()=>{};
    heroAttackAnim=async()=>{};enemyAttackAnim=async()=>{};
    chooseEnemyIntent=()=> 'light';chooseHeroPlan=()=> 'basic';
    globalThis.battle={resetRun,executeTurn,resolveHeroRoll,resolveEnemyPhase,calcHeroDmg,calcEnemyDmg,calcHeroCrit,liveDamage,useCard,endTurn,
      set(options){if(options.plan!==undefined)heroPlan=options.plan;if(options.intent!==undefined)enemyIntent=options.intent;
        if(options.cards!==undefined)selectedPre=options.cards;if(options.hand!==undefined)hand=options.hand;},
      get(){return {hero,enemy,turn,phase,hand,cardUses,resonance,speedGauge,live:!!LIVE_ACTOR};}};
    resetRun();`;
  const code=source.replace('const sleep=ms=>new Promise(r=>setTimeout(r,ms));','const sleep=async()=>{};')
    .replace('const roll100=()=>ri(1,100);','const roll100=()=>testRolls.length?testRolls.shift():ri(1,100);')
    .replace("if(!STORY_MODE) loadChronicle();\nrenderChronicleButton();\nresetRun();",hook);
  assert(code.includes('globalThis.battle='),'test hook must target the actual combat bootstrap');
  vm.runInNewContext(code,context,{timeout:5000});
  return {battle:context.battle,context,messages,timers,events,testRolls};
}
(async()=>{
  let {battle:b}=boot();
  assert(b.get().live);assert.equal(b.get().resonance,0);
  assert.equal(b.get().hero.maxHp,100);
  assert.equal(b.get().enemy.unified.attack,8);
  assert.equal(b.get().enemy.unified.defense,5);
  assert.equal(b.liveDamage(20,'owner',2),38,'critical before defense: 40 - (5-3)');
  assert.equal(b.liveDamage(20,'owner',2,.5),19,'temporary shield follows permanent defense');
  assert.equal(b.liveDamage(0,'owner'),1);
  assert.equal(b.liveDamage(0,'owner',1,0),0);
  assert.equal(b.calcHeroCrit(),20);
  let range=Array.from(b.calcHeroDmg());assert(range[0]>=26&&range[1]>range[0]);
  b.set({cards:['over']});
  let boosted=Array.from(b.calcHeroDmg());
  assert(boosted[0]>range[0]*2,'card multiplier before armor, not after it');
  b.set({cards:['storyGap']});assert(b.calcHeroDmg()[0]>range[0],'pierce card bypasses permanent defense');
  b.set({cards:[],plan:'defend'});assert(b.calcEnemyDmg()[0]<3,'guard reduces damage after armor');
  const hard=boot({...actor,defense:100,critChance:0}).battle;
  assert.equal(hard.calcEnemyDmg()[0],1);assert.equal(hard.calcHeroCrit(),0);
  const tier=boot(actor,{enemyAttackDelta:'4',enemyDefenseDelta:'2'}).battle;
  assert.equal(tier.get().enemy.unified.attack,12);assert.equal(tier.get().enemy.unified.defense,7);
  assert(tier.calcEnemyDmg()[0]>boot().battle.calcEnemyDmg()[0]);
  const food=boot({...actor,maxHp:112,defense:13}).battle;
  assert.equal(food.get().hero.maxHp,112);assert.equal(food.get().hero.hp,90);
  assert.equal(boot(null).battle.get().live,false,'legacy document without snapshot remains playable');
  assert.equal(boot({...actor,attack:'bad'}).battle.get().live,false,'malformed snapshot falls back');
  assert.equal(boot({...actor,maxHp:96}).battle.get().hero.maxHp,96,'invalid-slot correction is not mistaken for food HP');
  console.log('PASS: generated combat document consumes actor/enemy stats, critical/card/pierce/guard math and fallback');
  // Actual action, including pre-card payment and transition, with no card draw.
  b=boot().battle;b.set({hand:['over'],cards:['over']});
  b.get().enemy.hp=b.get().enemy.maxHp=500;
  await b.executeTurn();
  assert.equal(b.get().turn,2,'unaffordable card is skipped while the basic exchange proceeds');
  assert.equal(b.get().hand.length,1);
  b=boot(actor,{resonance:'50'}).battle;b.set({hand:['over'],cards:['over']});
  b.get().enemy.hp=b.get().enemy.maxHp=500;
  await b.executeTurn();
  assert.equal(b.get().turn,2);assert.equal(b.get().hand.length,0,'card is consumed with no refill');
  assert.equal(b.get().resonance,38,'one cost 22 and one mind-adjusted recovery 10');
  assert(b.get().enemy.hp<500,'actual attack changes enemy HP');
  const win=boot({...actor,attack:999}, {resonance:'50'});
  await win.battle.executeTurn();win.timers.forEach(fn=>fn());
  assert.equal(win.messages.filter(m=>m.result==='win').length,1,'one encounter settlement');
  console.log('PASS: real action/card cost/recovery and victory settlement execute once');
  function durableArena(ownerSpeed,enemySpeed){
    const arena=boot({...actor,attackSpeed:ownerSpeed},{resonance:'50'}),state=arena.battle.get();
    state.hero.hp=state.hero.maxHp=10000;state.enemy.hp=state.enemy.maxHp=10000;
    state.enemy.unified={...state.enemy.unified,attackSpeed:enemySpeed};
    arena.battle.set({hand:[]});return arena;
  }
  for(const [ownerSpeed,enemySpeed,exchanges] of [[120,100,6],[120,90,4],[150,100,3],[900,100,2],[100,150,3]]){
    const a=durableArena(ownerSpeed,enemySpeed);
    for(let i=0;i<exchanges;i++)await a.battle.executeTurn();
    const extra=a.events.filter(s=>s.includes('공속 추가공격'));
    assert.equal(extra.length,1,`${ownerSpeed} vs ${enemySpeed}: one extra basic attack`);
    assert.equal(a.battle.get().turn,exchanges+1);
    assert.equal(a.battle.get().hand.length,0);assert.equal(a.battle.get().resonance,70);
    a.battle.resetRun();assert.equal(a.battle.get().speedGauge,null,'new encounter resets fractional gauge');
  }
  const equal=durableArena(100,100);for(let i=0;i<8;i++)await equal.battle.executeTurn();
  assert(!equal.events.some(s=>s.includes('공속 추가공격 —')));
  // Bonus miss/hit shares the existing card window and resumes this exchange,
  // rather than granting another gauge tick, card payment, or recovery.
  const reaction=durableArena(200,100);reaction.battle.set({hand:['reroll']});
  reaction.testRolls.push(50,100,50,100,100);
  await reaction.battle.executeTurn();await reaction.battle.executeTurn();
  assert.equal(reaction.battle.get().phase,'heroReaction');
  reaction.battle.useCard('reroll');await new Promise(setImmediate);
  assert.equal(reaction.battle.get().turn,3);assert.equal(reaction.battle.get().hand.length,0);
  assert.equal(reaction.battle.get().resonance,56,'50 initial + two recoveries of 10 - one reroll cost 14');
  assert.equal(reaction.events.filter(s=>s.includes('공속 추가공격 —')).length,1);
  const defense=durableArena(100,200);defense.battle.set({hand:['endure']});
  defense.testRolls.push(50,100,50,100,1);
  await defense.battle.executeTurn();await defense.battle.executeTurn();
  assert.equal(defense.battle.get().phase,'enemyReaction');
  defense.battle.useCard('endure');await new Promise(setImmediate);
  assert.equal(defense.battle.get().turn,3);assert.equal(defense.battle.get().hand.length,0);
  assert.equal(defense.events.filter(s=>s.includes('적 공속 추가공격 —')).length,1);
  assert.equal(defense.battle.get().resonance,54,'50 initial + two recoveries of 10 - one endure cost 16');
  const bonusWin=durableArena(200,100);bonusWin.battle.get().enemy.hp=1;
  bonusWin.testRolls.push(100,100,100,100,1);
  await bonusWin.battle.executeTurn();await bonusWin.battle.executeTurn();
  bonusWin.timers.forEach(fn=>fn());
  assert.equal(bonusWin.messages.filter(m=>m.result==='win').length,1);
  assert.equal(bonusWin.battle.get().phase,'done');
  const bonusLoss=durableArena(100,200);bonusLoss.battle.get().hero.hp=1;
  bonusLoss.testRolls.push(50,100,50,100,1);
  await bonusLoss.battle.executeTurn();await bonusLoss.battle.executeTurn();
  bonusLoss.timers.forEach(fn=>fn());
  assert.equal(bonusLoss.messages.filter(m=>m.result==='lose').length,1);
  assert.equal(bonusLoss.battle.get().phase,'done');
  console.log('PASS: speed ratios, tie/cap/reset, both extra-attack reactions and single card/recovery per exchange');
})().catch(error=>{console.error(error);process.exitCode=1;});

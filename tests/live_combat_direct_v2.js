"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../combat_story.html"),"utf8");
const original=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stats={version:"direct-v2",minAttack:25,maxAttack:35,hitChance:90,critChance:20,
 critDamageBonus:50,penetration:3,attackSpeed:150,defense:10,evade:10,
 blockChance:0,blockAmount:0,critChanceResist:0,critDamageResist:0,
 maxHp:100,maxResonance:70,resonanceRecovery:9,statusResist:0};
function boot(snapshot){
 const nodes=new Map(),events=[],timers=[];
 const elem=()=>({style:{},classList:{add(){},remove(){}},children:[],dataset:{},
  appendChild(){},removeChild(){},remove(){},innerHTML:"",textContent:""});
 const context={console,URLSearchParams,location:{search:""},
  window:{frameElement:{dataset:{storyMode:"1",enemy:"bandit",hp:"90",maxHp:"100",
   resonance:"50",mind:"100",...(snapshot?{unifiedActorV1:JSON.stringify(snapshot)}:{})}},
   parent:{postMessage(){}}},
  document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,elem());return nodes.get(id)},
   createElement:elem,addEventListener(){}},
  localStorage:{getItem:()=>null,setItem(){}},setTimeout:fn=>timers.push(fn),events};
 const hook=[
  "render=()=>{};setScene=()=>{};renderChronicleButton=()=>{};",
  "log=msg=>events.push(msg);showBanner=()=>{};",
  "heroAttackAnim=async()=>{};enemyAttackAnim=async()=>{};",
  "chooseEnemyIntent=()=> 'light';chooseHeroPlan=()=> 'basic';",
  "globalThis.battle={executeTurn,calcHeroHit,calcEnemyHit,calcHeroDmg,liveDamage,",
  "get(){return {hero,enemy,turn,phase}}};resetRun();"
 ].join("\n");
 const source=original.replace("const sleep=ms=>new Promise(r=>setTimeout(r,ms));",
  "const sleep=async()=>{};").replace(
  "if(!STORY_MODE) loadChronicle();\nrenderChronicleButton();\nresetRun();",hook);
 vm.runInNewContext(source,context,{timeout:10000});
 return {battle:context.battle,events};
}
(async()=>{
 assert.throws(()=>boot(null),/Direct V2 snapshot required/);
 const a=boot(stats),b=a.battle;
 assert.equal(b.get().enemy.unified.minAttack,12);
 assert.equal(b.get().enemy.unified.maxAttack,17);
 assert.equal(b.calcHeroHit(),81);
 assert.equal(b.calcEnemyHit(),60);
 assert.equal(b.liveDamage(20,"owner",2),38);
 assert.equal(b.liveDamage(20,"owner",2,.5),19);
 assert(b.calcHeroDmg(1.5)[0]>b.calcHeroDmg()[0]);
 b.get().enemy.hp=10000;
 await b.executeTurn();
 assert(b.get().enemy.hp<10000);
 console.log("PASS: direct V2 live attack, defense, snapshot and action");
})().catch(e=>{console.error(e);process.exitCode=1;});

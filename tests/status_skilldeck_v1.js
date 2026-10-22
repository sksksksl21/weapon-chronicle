"use strict";
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const source=fs.readFileSync(path.join(__dirname,"../src/core/status_skilldeck_v1.js"),"utf8");
const state={
 owner:{name:"이름 없는 선원",role:"이타카 수병",martial:7,survival:6,social:4,age:24},
 ownerProgress:{level:2,combatXp:20,lifeXp:7,reputation:4},
 generation:1,year:1,month:1,mind:83,hp:75,maxHp:93,pastOwners:[],
 weapon:{engravings:[],parts:{blade:"iron"},dur:70,maxDur:100,resonance:30,maxResonance:70},
 ownerEquipment:{helmet:"hat",armor:null,gloves:null,boots:null}
};
let html="",saves=0;
const el={dataset:{}},eventNodes={};
const simulate=(selector,key,val)=>{
 const target={dataset:{[key]:val},onclick:null};eventNodes[selector]=[target];return target;
};
const ctx={
 state,console,window:{},
 document:{head:{appendChild(){}},createElement:()=>({}),getElementById:()=>el,querySelectorAll:selector=>eventNodes[selector]||[]},
 ensureV26Progression(){},recalcWeapon(){},syncOwnerVitalCaps(){},
 combatXpNeed:l=>55+l*35,
 rawOwnerStats:()=>({martial:7,survival:6,social:4}),
 effectiveOwnerStats:()=>({martial:7,survival:6,social:4}),
 modalHead:(a,b)=>a+" "+b,openModal:s=>{html=s;},bindClose(){},
 saveGame:()=>{saves++;return true;},
 weaponArt41:()=>"<svg></svg>",openOwnerSlot(){},
 PART_LABELS:{blade:"칼날",guard:"가드",tang:"심재",grip:"그립",wrap:"래핑",pommel:"폼멜",seat:"공명좌",scabbard:"검집"},
 PART_CATALOG:{blade:{iron:{name:"철 장검",mods:{power:5},rarity:"common"}}},
 OWNER_GEAR_CATALOG:{hat:{name:"천 모자",slot:"helmet",rarity:"common",mods:{defense:1}}},
 RARITY_DEF:{common:{name:"일반"}},
 loadGame:()=>false,resetOwnerAssetsForSuccessor(){},openStatus(){},launchStoryCombat:()=>true
};
vm.createContext(ctx);
vm.runInContext(source,ctx);
const deck=vm.runInContext("WC_STATUS_SKILLDECK_V1",ctx);
assert.equal(deck.OWNERS.length,12);
assert(deck.SKILLS.length>=20);
assert.equal(deck.STARTER.length,10);
assert(deck.ensureOwner());
assert.notEqual(state.owner.name,"이름 없는 선원");
assert(state.owner.background);
const data=deck.ensureDeck();
assert.equal(data.deck.length,10);
assert.equal(new Set(data.deck).size,10);
assert.equal(data.owned.length,10);
deck.draw("owner");
assert(html.includes("성장 경험치")&&html.includes("무예")&&html.includes("생존")&&html.includes("처세"));
deck.draw("gear");
assert(html.includes("방어구 장착 상태")&&html.includes("상세 정보"));
deck.draw("weapon");
assert.equal((html.match(/data-wc3-part=/g)||[]).length,8);
assert(html.includes("<svg>"));
deck.draw("combat");
assert.equal((html.match(/data-wc3-deckslot=/g)||[]).length,10);
assert.equal((html.match(/data-wc3-inv=/g)||[]).length,20);
assert(deck.grant("storyGap"));
assert(!deck.grant("storyGap"));
assert(!deck.grant("not_a_skill"));
assert(saves>0);
assert.equal(JSON.parse(JSON.stringify(state.skillDeckData)).deck.length,10);
// Exercise the actual modal callbacks, not only data construction.
// Selecting an earned card, tapping Equip, then choosing a position must replace exactly one card.
const inv=simulate("[data-wc3-inv]","wc3Inv","storyGap");
const equip=simulate("[data-wc3-equip]","wc3Equip","storyGap");
const slot=simulate("[data-wc3-deckslot]","wc3Deckslot","0");
deck.draw("combat");inv.onclick();equip.onclick();slot.onclick();
assert.equal(state.skillDeckData.deck[0],"storyGap");
assert.equal(state.skillDeckData.deck.length,10);
assert.equal(new Set(state.skillDeckData.deck).size,10);
const starter=simulate("[data-wc3-inv]","wc3Inv","aim1");
deck.draw("combat");starter.onclick();
simulate("[data-wc3-equip]","wc3Equip","aim1");
deck.draw("combat");eventNodes["[data-wc3-equip]"][0].onclick();
simulate("[data-wc3-deckslot]","wc3Deckslot","0");
deck.draw("combat");eventNodes["[data-wc3-deckslot]"][0].onclick();
assert.equal(state.skillDeckData.deck[0],"aim1");
const salvage=simulate("[data-wc3-salvage]","wc3Salvage","storyGap");
deck.draw("combat");salvage.onclick();
assert(!state.skillDeckData.owned.includes("storyGap"));
assert.equal(state.skillDeckData.shards,1);
assert.equal(state.skillDeckData.deck.length,10);
assert(saves>=4);
console.log("PASS: 12 owners / 21 skills / owner XP / 4 armor / 8 sword parts / 10-slot deck / 20 inventory");
console.log("PASS: select -> equip -> choose position -> replace -> dismantle -> persisted");

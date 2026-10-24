/* Weapon Chronicle equipment pool V1.
 * Original item IDs and owned-item saves remain unchanged.
 * New deterministic IDs encode archetype + tier; rolls are stable across reloads.
 * Five tiers: 0/1/2/3/3 affixes, Unique and Chronicle also gain one unique effect.
 */
const WC_EQUIPMENT_POOL_V1=(()=>{
"use strict";
const TIERS=[
 {id:"common",name:"노멀",options:0,weight:58,color:"#8b949e"},
 {id:"rare",name:"레어",options:1,weight:26,color:"#4589dc"},
 {id:"unique",name:"유니크",options:2,weight:11,color:"#ab73e3"},
 {id:"legendary",name:"레전더리",options:3,weight:4,color:"#d5a544"},
 {id:"chronicle",name:"크로니클",options:3,weight:1,color:"#e36d7c"}
];
const W_SLOTS=["blade","guard","tang","grip","wrap","pommel","seat","scabbard"];
const A_SLOTS=["helmet","armor","gloves","boots"];
const ARMOR_ALLOWED=new Set(["defense","maxHp","survival","evade","resist","block","defensePct","speed","speedPct"]);
const W_STATS=[
 ["power","공격력"],["precision","치명타 확률"],["toughness","방어력"],
 ["handling","공격속도"],["penetration","관통력"],
 ["maxResonance","최대 공명"],["resonanceRecovery","공명 회복"],
 ["attackPct","공격력 보정"],["defensePct","방어력 보정"],["speedPct","속도 보정"]
];
const A_STATS={
 helmet:[["maxHp","체력"],["defense","방어력"],["resist","저항"],["defensePct","방어 보정"]],
 armor:[["defense","방어력"],["maxHp","체력"],["resist","저항"],["defensePct","방어 보정"]],
 gloves:[["defense","방어력"],["evade","회피"],["resist","저항"],["defensePct","방어 보정"]],
 boots:[["speed","기동"],["evade","회피"],["defense","방어력"],["speedPct","기동 보정"]]
};
const UNIQUE_WEAPON=[
 {id:"core-echo",name:"공명의 잔향",desc:"검의 잔향이 한 번 더 흐른다.",key:"resonanceRecovery",value:2},
 {id:"edge-gap",name:"틈새 간파",desc:"틈을 찾아 적의 방어를 일부 관통한다.",key:"penetration",value:3},
 {id:"swift-form",name:"칼끝의 흐름",desc:"공격 동작을 간결하게 만든다.",key:"speedPct",value:5},
 {id:"critical-path",name:"치명의 궤적",desc:"약점에 칼끝을 집중한다.",key:"precision",value:3}
];
const UNIQUE_ARMOR={
 helmet:{id:"second-breath",name:"다시 일어서는 숨",desc:"최대 체력 증가",key:"maxHp",value:6},
 armor:{id:"stone-stance",name:"바위의 자세",desc:"상시 방어력 보정",key:"defensePct",value:7},
 gloves:{id:"guard-instinct",name:"막아내는 본능",desc:"상시 방어력 보정",key:"defensePct",value:5},
 boots:{id:"tide-step",name:"물결 발걸음",desc:"기동 속도 보정",key:"speedPct",value:7}
};
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function randomFrom(seed){let x=hash(seed)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function whole(rng,min,max){return min+Math.floor(rng()*(max-min+1));}
function optionsFor(slot,armor){return armor?A_STATS[slot]:W_STATS;}
function buildItem(slot,kind,baseId,base,tier,index,rollToken=""){
 const armor=kind==="armor",rand=randomFrom("WC-5|"+kind+"|"+slot+"|"+baseId+"|"+tier.id+(rollToken?"|"+rollToken:""));
 const original=base.mods||{},mods={...original};
 // Only protective/mobility data are meaningful for armor; legacy attack fields
 // must not leak into the new catalog even before adapter validation.
 if(armor){for(const key of Object.keys(mods))if(!ARMOR_ALLOWED.has(key))delete mods[key];}
 const rollKeys=armor?["defense","maxHp","evade"]:["power","precision","toughness","handling"];
 for(const key of rollKeys){
   const current=Number(mods[key]||0);
   // Quality is independent of base roll: a bad legendary can have drawbacks.
   const swing=key==="maxHp"?5:2;
   mods[key]=Math.round((current+whole(rand,-swing,swing))*10)/10;
 }
 // Item quality changes the amount of possible affixes, never the count.
 const available=optionsFor(slot,armor).slice(),options=[];
 for(let a=0;a<tier.options;a++){
   const chosen=available.splice(Math.floor(rand()*available.length),1)[0];
   const [key,label]=chosen;
   const points=1+Math.floor(tier.options*.7)+whole(rand,0,2);
   const value=key==="maxHp"?points*2:key.endsWith("Pct")?points*2:points;
   mods[key]=Math.round(((Number(mods[key])||0)+value)*10)/10;
   options.push(Object.freeze({key,name:label,value}));
 }
 let uniqueEffect=null;
 if(tier.id==="unique"||tier.id==="chronicle"){
   const rule=armor?UNIQUE_ARMOR[slot]:UNIQUE_WEAPON[index%UNIQUE_WEAPON.length];
   const multiplier=tier.id==="chronicle"?1.5:1;
   const value=Math.round(rule.value*multiplier);
   mods[rule.key]=Math.round(((Number(mods[rule.key])||0)+value)*10)/10;
   uniqueEffect=Object.freeze({id:rule.id,name:rule.name,description:rule.desc,key:rule.key,value});
 }
 const rawPrice=armor?Number(base.price||30):Number(base.shopPrice||base.cost?.gold||20);
 const price=Math.max(10,Math.round(rawPrice*[1,1.8,3,5,8][TIERS.indexOf(tier)]));
 const item={
  ...base, name:base.name+" · "+tier.name,rarity:tier.id,
  mods:Object.freeze(mods),options:Object.freeze(options),uniqueEffect,
  family:baseId,generated:true,rollSeed:hash(baseId+"|"+tier.id+"|"+slot),
  desc:base.desc||base.note||"모험 중 발견한 장비",
  note:base.note||base.desc||"장비의 무작위 품질과 특수 옵션을 확인한다.",
  price,shopPrice:price,market:true
 };
 if(!armor){
   item.material=base.material||"합금";
   item.cost={gold:price};
   // A variant does not automatically inherit storyline progression gates.
   delete item.requiresSkill;
 }
 return Object.freeze(item);
}
function expand(parts,gear,rarityDef){
 Object.assign(rarityDef,Object.fromEntries(TIERS.map((tier,i)=>[
 tier.id,{name:tier.name,rank:i+1,weight:tier.weight}
 ])));
 if(rarityDef.beyond)rarityDef.beyond={name:"크로니클",rank:5,weight:1};
 const counts={};
 for(const slot of W_SLOTS){
   const source=Object.entries(parts[slot]||{}).filter(([,it])=>!it.generated&&it.market!==false&&!it.requiresSkill);
   const family=source.length>=4?source: Object.entries(parts[slot]||{}).filter(([,it])=>!it.generated);
   if(!family.length)throw Error("Missing weapon archetype: "+slot);
   for(let i=0;i<4;i++)for(const tier of TIERS){
     const [baseId,base]=family[i%family.length];
     const id="wc5_"+slot+"_"+i+"_"+tier.id;
     if(!parts[slot][id])parts[slot][id]=buildItem(slot,"weapon",baseId,base,tier,i);
   }
   counts[slot]=Object.keys(parts[slot]).length;
 }
 for(const slot of A_SLOTS){
   const source=Object.entries(gear).filter(([,it])=>it.slot===slot&&!it.generated);
   if(!source.length)throw Error("Missing armor archetype: "+slot);
   for(let i=0;i<4;i++)for(const tier of TIERS){
     const [baseId,base]=source[i%source.length];
     const id="wc5_"+slot+"_"+i+"_"+tier.id;
     if(!gear[id])gear[id]=buildItem(slot,"armor",baseId,base,tier,i);
   }
   counts[slot]=Object.values(gear).filter(x=>x.slot===slot).length;
 }
 return counts;
}
function statLabel(key){
 for(const [k,label] of W_STATS)if(k===key)return label;
 for(const list of Object.values(A_STATS))for(const [k,label] of list)if(k===key)return label;
 return key;
}
// Smith/shop details: owner-applied final values from the shared direct calculator.
function ownerFinalDetail(item){
 if(typeof WC_DIRECT_COMBAT_V2==="undefined"||typeof wcDirectOwnerRates!=="function")return "";
 try{
  const armor=A_SLOTS.includes(item.slot),kind=armor?"armor":"weapon",slot=armor?item.slot:"blade";
  const direct=WC_DIRECT_COMBAT_V2.migrateLegacyPart(item.mods||{},kind,slot);
  const final=WC_DIRECT_COMBAT_V2.itemEffects(direct,{kind,slot,owner:wcDirectOwnerRates()});
  const text=WC_DIRECT_COMBAT_V2.describeItemEffects(final).join(" · ")||"수치 효과 없음";
  return '<p class="wc5-final"><b>현재 소유자 발휘 최종값</b> (무예 '+final.martial+'% · 생존 '+
   final.survival+'%) '+text+'</p>';
 }catch(e){console.warn("Owner final detail skipped",e);return "";}
}
function formatDetail(item,noFinal){
 if(!item)return "";
 const tier=TIERS.find(t=>t.id===item.rarity);
 const options=(item.options||[]).map(o=>o.name+" +"+o.value);
 const unique=item.uniqueEffect;
 return '<div class="wc5-quality"><b class="wc5-grade wc5-grade-'+(item.rarity||"common")+'">'+
  (tier?.name||item.rarity||"노멀")+'</b>'+
  (item.rolledInstance?'<p>개체별 무작위 옵션 · 동일 종류라도 획득할 때마다 능력치가 달라집니다.</p>':'')+
  (!item.generated?'<p>기존 원본 아이템 · 원래 능력치 유지 (신규 등급 옵션 체계는 생성형 변형에 적용)</p>':
   options.length?'<p>추가 옵션 '+options.map((v,i)=>(i+1)+". "+v).join(" · ")+'</p>':
   '<p>추가 옵션 없음 · 기본 수치에 품질 변동 적용</p>')+
  (unique?'<p class="wc5-unique">고유 효과 · '+unique.name+' — '+unique.description+
    ' ('+statLabel(unique.key)+' +'+unique.value+')</p>':'')+
  (noFinal?'':ownerFinalDetail(item))+'</div>';
}
function rarityClass(item){return "rarity-"+(TIERS.some(t=>t.id===item?.rarity)?item.rarity:(item?.rarity==="beyond"?"chronicle":"common"));}
function decorateCardHTML(html,item){
 if(typeof html!=="string")return html;
 const cls=rarityClass(item);
 return html.replace(/class="([^"]*\b(?:gearChoiceCard40|ownerGearSlot|smithChoiceBtn)\b[^"]*)"/,
   (whole,c)=>'class="'+c+' '+cls+'"');
}
function decorateModalCards(){
 const modal=typeof document!=="undefined"?document.getElementById("modal"):null;
 if(!modal||typeof modal.querySelectorAll!=="function")return;
 modal.querySelectorAll("[data-weapon-equip],[data-equip-gear],[data-owner-equip2]").forEach(el=>{
   const id=el.dataset?.weaponEquip||el.dataset?.equipGear||el.dataset?.ownerEquip2;
   const partSlot=W_SLOTS.find(slot=>PART_CATALOG[slot]?.[id]);
   const item=partSlot?PART_CATALOG[partSlot][id]:OWNER_GEAR_CATALOG[id];
   if(!item)return;
   for(const t of TIERS)el.classList.remove("rarity-"+t.id);
   el.classList.add(rarityClass(item));
 });
}
function installStyle(){
 if(typeof document==="undefined"||document.getElementById("wc5-rarity-style"))return;
 const style=document.createElement("style");style.id="wc5-rarity-style";
 style.textContent=`
 .wc5-grade{display:inline-block;padding:2px 7px;border:1px solid currentColor;border-radius:6px;font-size:11px}
 .wc5-grade-common{color:#9099a4}.wc5-grade-rare{color:#478bde}
 .wc5-grade-unique{color:#aa73e8}.wc5-grade-legendary{color:#bb8927}
 .wc5-grade-chronicle,.wc5-grade-beyond{color:#e26980}
 .wc5-quality{margin:7px 0;padding:7px;border-radius:8px;background:rgba(30,40,60,.07);font-size:10px;line-height:1.5}
 .wc5-quality p{margin:4px 0}.wc5-unique{font-weight:700;color:#b65e75}
 .wc3-equip.rarity-common,.wc3-part.rarity-common,.gearChoiceCard40.rarity-common,.ownerGearSlot.rarity-common,.smithChoiceBtn.part-rarity-common{border:2px solid #8b949e!important}
 .wc3-equip.rarity-rare,.wc3-part.rarity-rare,.gearChoiceCard40.rarity-rare,.ownerGearSlot.rarity-rare,.smithChoiceBtn.part-rarity-rare{border:2px solid #4589dc!important;box-shadow:inset 0 0 0 1px #4589dc40}
 .wc3-equip.rarity-unique,.wc3-part.rarity-unique,.gearChoiceCard40.rarity-unique,.ownerGearSlot.rarity-unique,.smithChoiceBtn.part-rarity-unique{border:2px solid #ab73e3!important;box-shadow:inset 0 0 0 1px #ab73e340}
 .wc3-equip.rarity-legendary,.wc3-part.rarity-legendary,.gearChoiceCard40.rarity-legendary,.ownerGearSlot.rarity-legendary,.smithChoiceBtn.part-rarity-legendary{border:2px solid #d5a544!important;box-shadow:inset 0 0 0 1px #d5a54444}
 .wc3-equip.rarity-chronicle,.wc3-part.rarity-chronicle,.gearChoiceCard40.rarity-chronicle,.ownerGearSlot.rarity-chronicle,.smithChoiceBtn.part-rarity-chronicle,
 .wc3-equip.rarity-beyond,.wc3-part.rarity-beyond,.gearChoiceCard40.rarity-beyond,.ownerGearSlot.rarity-beyond,.smithChoiceBtn.part-rarity-beyond{border:2px solid #e36d7c!important;box-shadow:0 0 0 1px #e36d7c88,inset 0 0 9px #e36d7c30}
 .wc3-equip.active,.wc3-part.active{outline:2px solid #3d756e;outline-offset:2px}
 `;
 document.head.appendChild(style);
}
const result=expand(PART_CATALOG,OWNER_GEAR_CATALOG,RARITY_DEF);
installStyle();
// Reconstruct independent loot copies from SELF-DESCRIBING IDs. The existing
// ID-keyed inventory and save schema stay unchanged: each acquired copy has
// its own ID and its roll is reproduced from the encoded seed after reload.
// Only the 240 validated wc5 templates can spawn a wc6 copy.
const COPY_ID=/^wc6_(blade|guard|tang|grip|wrap|pommel|seat|scabbard|helmet|armor|gloves|boots)_([0-3])_(common|rare|unique|legendary|chronicle)_([a-z0-9]{5,24})$/;
const COPY_FIND=/wc6_(?:blade|guard|tang|grip|wrap|pommel|seat|scabbard|helmet|armor|gloves|boots)_[0-3]_(?:common|rare|unique|legendary|chronicle)_[a-z0-9]{5,24}/g;
let nextCopy=0;
function restoreCopy(id){
 if(typeof id!=="string")return null;
 const m=COPY_ID.exec(id);if(!m)return null;
 const [,slot,indexText,tierKey,seed]=m,idx=Number(indexText);
 const armor=A_SLOTS.includes(slot),catalog=armor?OWNER_GEAR_CATALOG:PART_CATALOG[slot];
 if(!catalog)return null;
 if(catalog[id])return catalog[id];
 const templateId="wc5_"+slot+"_"+idx+"_"+tierKey,template=catalog[templateId];
 if(!template||!template.generated||template.rarity!==tierKey)return null;
 const family=template.family;
 const base=armor?OWNER_GEAR_CATALOG[family]:PART_CATALOG[slot]?.[family];
 const tier=TIERS.find(t=>t.id===tierKey);
 if(!base||!tier)return null;
 const rolled=buildItem(slot,armor?"armor":"weapon",family,base,tier,idx,seed);
 catalog[id]=Object.freeze({...rolled,rolledInstance:true,instanceSeed:seed,templateId,
   // Unique acquired pieces cannot be mass-crafted under the same rolled ID.
   ...(armor?{}:{cost:null}),market:false});
 return catalog[id];
}
function rollCopy(templateId){
 if(typeof templateId!=="string")return null;
 const m=/^wc5_(blade|guard|tang|grip|wrap|pommel|seat|scabbard|helmet|armor|gloves|boots)_([0-3])_(common|rare|unique|legendary|chronicle)$/.exec(templateId);
 if(!m)return null;
 const [,slot,idx,tier]=m,armor=A_SLOTS.includes(slot);
 const catalog=armor?OWNER_GEAR_CATALOG:PART_CATALOG[slot];
 if(!catalog?.[templateId])return null;
 let id;
 do{
   const seed=Date.now().toString(36)+(nextCopy++).toString(36)+Math.floor(Math.random()*1679616).toString(36).padStart(4,"0");
   id="wc6_"+slot+"_"+idx+"_"+tier+"_"+seed;
 }while(catalog[id]);
 return {id,item:restoreCopy(id)};
}
function restoreFromSave(raw){
 if(typeof raw!=="string")return 0;
 const found=new Set(raw.match(COPY_FIND)||[]);
 let restored=0;
 for(const id of found)if(restoreCopy(id))restored++;
 return restored;
}
// Both paths matter: the saved merchant stock and equipped/owned item IDs
// must be in their original catalogs BEFORE legacy load validation/rendering.
if(typeof loadGame==="function"){
 const oldLoad=loadGame;
 loadGame=function(...args){
   try{
     if(typeof localStorage!=="undefined"&&typeof SAVE_KEY==="string")
       restoreFromSave(localStorage.getItem(SAVE_KEY));
   }catch(e){console.warn("Equipment copy pre-load restore skipped",e);}
   const loaded=oldLoad.apply(this,args);
   try{restoreFromSave(JSON.stringify(state));}
   catch(e){console.warn("Equipment copy post-load restore skipped",e);}
   return loaded;
 };
}
// The legacy equipment trader sampled uniformly; preserve rarity scarcity.
if(typeof randomGearStock==="function"){
 randomGearStock=function(){
  const entries=Object.entries(OWNER_GEAR_CATALOG);
  const selected=[],used=new Set(),count=Math.min(6,entries.length);
  for(let i=0;i<count;i++){
   const weighted=entries.filter(([id,item])=>!used.has(id)&&!item.rolledInstance).map(([id,item])=>({
    id,weight:Math.max(1,RARITY_DEF[item.rarity]?.weight||1)
   }));
   const sum=weighted.reduce((a,x)=>a+x.weight,0);
   let r=Math.random()*sum,chosen=weighted[weighted.length-1];
   for(const x of weighted){r-=x.weight;if(r<0){chosen=x;break;}}
   used.add(chosen.id);
   const rolled=rollCopy(chosen.id);
   selected.push({id:rolled?.id||chosen.id,sold:false});
  }
  return selected;
 };
}
// Display rolled options when inspecting market armor and smith part choices.
if(typeof ownerGearCardHtml40==="function"){
 const original=ownerGearCardHtml40;
 ownerGearCardHtml40=function(id,...args){
  const html=original.call(this,id,...args);
  const item=OWNER_GEAR_CATALOG[id];
  return decorateCardHTML(html.replace('<div class="effectLine">',
    '<div class="effectLine">'+formatDetail(item)),item);
 };
}
if(typeof openModal==="function"){
 const oldModal=openModal;
 openModal=function(...args){
   const value=oldModal.apply(this,args);
   try{decorateModalCards();}catch(e){console.warn("Rarity card decoration skipped",e);}
   return value;
 };
}
if(typeof partDeltaHtml==="function"){
 const original=partDeltaHtml;
 partDeltaHtml=function(slot,id,...args){
  return original.call(this,slot,id,...args)+formatDetail(PART_CATALOG[slot]?.[id]);
 };
}
return Object.freeze({TIERS,W_SLOTS,A_SLOTS,expand,buildItem,formatDetail,result,randomFrom,
 rollCopy,restoreCopy,restoreFromSave,rarityClass,decorateCardHTML,decorateModalCards});
})();

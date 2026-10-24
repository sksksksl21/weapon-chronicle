/* Weapon Chronicle DEV: four focused status tabs and ten-card battle deck.
 * Additive save state. Uses the actual combat card IDs and existing sword art.
 */
const WC_STATUS_SKILLDECK_V1=(()=>{
"use strict";
const OWNERS=[
 ["아리스","이타카의 정찰병",23,9,6,4,64,48,62,"트로이 전쟁의 끝에서 홀로 돌아온 정찰병. 다른 이들의 귀향길을 찾기 위해 검을 들었다."],
 ["테온","항만 수습 호위",19,4,7,6,45,62,48,"상선 호위로 먹고살던 젊은이. 첫 항해에서 잃은 동료의 행방을 찾는다."],
 ["에이라","전장 수습꾼",22,5,9,3,52,70,42,"전장에 남겨진 사람들을 찾아다녔다. 살아남은 자의 이름을 기억한다."],
 ["도리스","어부의 딸",20,3,9,6,38,66,56,"폭풍에 실종된 아버지를 찾으며 해안의 모든 암초를 외웠다."],
 ["멜라스","떠돌이 짐꾼",27,7,6,5,57,48,61,"군용 보급로를 오래 걸었다. 누구보다 무거운 짐을 버텨 왔다."],
 ["니케","몰락한 병사의 동생",18,6,5,7,63,44,69,"형의 검을 물려받지 못했다. 대신 자기 이름으로 전설을 만들려 한다."],
 ["파온","항구 밀수꾼",25,5,6,9,46,58,55,"밀수선을 떠난 뒤 이전 동료에게 빚을 졌다. 사람을 읽는 눈이 빠르다."],
 ["칼리오","섬의 사냥꾼",26,8,7,3,67,54,71,"깊은 숲에서 짐승을 추적했다. 사람의 거짓말에는 아직 서툴다."],
 ["리오스","청동 장인의 제자",21,6,5,8,43,59,50,"대장간에서 부러진 무기를 고쳤다. 전쟁이 만든 균열을 이해하고 싶다."],
 ["세라","피난민 길잡이",24,4,8,8,39,75,53,"무너진 마을의 사람들을 안전한 길로 이끌었다. 누구도 뒤에 남겨 두지 않는다."],
 ["오르펜","폐허의 탐사자",29,7,8,4,58,68,57,"낡은 신전과 침몰선을 뒤졌다. 검에서 들려오는 목소리의 정체를 추적한다."],
 ["다미아","유랑 이야기꾼",23,4,5,10,35,55,66,"이름 모를 영웅들의 이야기를 모아 왔다. 이번에는 스스로 이야기의 주인이 된다."]
];
const SKILLS=[
 ["aim1","칼끝 유도","일반",8,"판정 전","명중 +25%"],
 ["guard","받아낸 일격","일반",10,"판정 전","적 명중 -30%"],
 ["over","상처를 먹는 검","일반",22,"판정 전","피해 ×2 · 실패 시 반동"],
 ["blood","피의 기억","일반",16,"판정 전","치명 +30%"],
 ["feint","흘려내기","일반",12,"판정 전","피해 회피 판정"],
 ["giant","거인을 벤 순간","레어",34,"판정 전","강력한 일격 · 전투당 소진"],
 ["reroll","운명을 한 번 더","일반",14,"반응","명중 실패 재굴림"],
 ["reverse","칼날 뒤집기","일반",12,"반응","판정 수치 반전"],
 ["counter","받아쳐라","일반",14,"반응","피격 시 반격"],
 ["endure","부러지지 않는다","일반",16,"반응","받는 피해 감소"],
 ["aim2","두 번째 유도","일반",8,"판정 전","명중 +25%"],
 ["last","마지막 한 자루","레어",30,"판정 전","빈사 상태 고위력"],
 ["storyGap","갑각 틈 찌르기","유니크",14,"판정 전","갑각 방어 관통"],
 ["storyLeft","남겨진 한 사람","유니크",20,"반응","빈사 상태 피해 반사"],
 ["storyPrayer","침묵의 기도","유니크",16,"판정 전","독·거미줄 대응"],
 ["mainCyclops","외눈의 빈틈","레전더리",18,"판정 전","명중·치명 강화"],
 ["mainCarry","끝까지 데리고 간다","레전더리",18,"반응","피해 감소·공명 회복"],
 ["miracle","기적의 궤적","레어",18,"판정 전","명중·치명 강화"],
 ["openingShard","열린 틈의 기억","레어",24,"판정 전","약점 공격 강화"],
 ["escapeMemory","죽음 옆을 스친 발","레어",18,"판정 전","적 명중 저하"],
 ["gritMemory","부러지지 않은 밤","레어",20,"판정 전","받는 피해 절반"]
];
const STARTER=SKILLS.slice(0,10).map(s=>s[0]);
const BY_ID=Object.fromEntries(SKILLS.map(s=>[s[0],{id:s[0],name:s[1],rarity:s[2],cost:s[3],timing:s[4],description:s[5]}]));
const STORY_UNLOCKS={
 carapace_gap:"storyGap",left_behind:"storyLeft",silent_prayer:"storyPrayer",
 cyclops_gap:"mainCyclops",carry_them:"mainCarry"
};
const ARMOR_SLOTS=[["helmet","투구","머리 보호 · 체력"],["armor","갑옷","피해 저감 · 방어"],["gloves","장갑","손 보호 · 방어"],["boots","신발","회피 보조 · 기동"]];
const PART_SLOTS=["blade","guard","tang","grip","wrap","pommel","seat","scabbard"];
let selectedSkill="",equipMode=false,selectedArmor="helmet",selectedPart="blade";
const escapeHtml=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
function profileFromRow(r){return {name:r[0],role:r[1],age:r[2],martial:r[3],survival:r[4],social:r[5],
 aggression:r[6],caution:r[7],boldness:r[8],background:r[9],portrait:"odyssey",
 deeds:{martial:[],survival:[],social:[]}};}
function pickOwner(){const prior=new Set([state.owner?.name,...(state.pastOwners||[]).map(x=>x.name)]);
 let pool=OWNERS.filter(r=>!prior.has(r[0]));if(!pool.length)pool=OWNERS;
 return profileFromRow(pool[Math.floor(Math.random()*pool.length)]);
}
function ensureOwner(){
 const o=state.owner;if(!o)return false;
 if(!o.name||o.name==="이름 없는 선원"||o.name==="소유자"){
   state.owner={...o,...pickOwner()};syncOwnerVitalCaps(false);
   state.hp=Math.min(state.maxHp,Math.max(1,n(state.hp)));
   return true;
 }
 if(!o.background){
   const r=OWNERS.find(x=>x[0]===o.name);
   o.background=r?r[9]:(o.name+"은 "+(o.role||"낯선 땅")+"에서 검을 만났다. 지난 삶의 선택이 앞으로의 여정에 영향을 남긴다.");
   return true;
 }
 return false;
}
function ensureDeck(){
 if(!state.skillDeckData||typeof state.skillDeckData!=="object")state.skillDeckData={};
 const data=state.skillDeckData;
 if(!Array.isArray(data.owned))data.owned=STARTER.slice();
 data.owned=[...new Set(data.owned.filter(id=>BY_ID[id]))].slice(0,20);
 if(!Array.isArray(data.dismantled))data.dismantled=[];
 data.dismantled=[...new Set(data.dismantled.filter(id=>BY_ID[id]&&!STARTER.includes(id)))];
 for(const id of STARTER)if(!data.owned.includes(id)&&data.owned.length<20)data.owned.push(id);
 if(!Array.isArray(data.deck))data.deck=STARTER.slice();
 let dedup=[...new Set(data.deck.filter(id=>data.owned.includes(id)&&BY_ID[id]))];
 for(const id of STARTER)if(dedup.length<10&&!dedup.includes(id))dedup.push(id);
 for(const id of data.owned)if(dedup.length<10&&!dedup.includes(id))dedup.push(id);
 data.deck=dedup.slice(0,10);
 data.shards=Math.max(0,Math.floor(n(data.shards)));
 // Existing authored discoveries are the source of earned story skill cards.
 for(const [tag,id] of Object.entries(STORY_UNLOCKS)){
   if((state.weapon?.engravings||[]).includes(tag)&&!data.dismantled.includes(id)&&!data.owned.includes(id)&&data.owned.length<20)data.owned.push(id);
 }
 return data;
}
function grant(id){
 const d=ensureDeck();if(!BY_ID[id]||d.owned.includes(id)||d.owned.length>=20)return false;
 d.owned.push(id);d.dismantled=d.dismantled.filter(x=>x!==id);saveGame();return true;
}
function labelRarity(r){return "wc3-rarity wc3-"+({"일반":"common","레어":"rare","유니크":"unique","레전더리":"legend"}[r]||"common");}
function skillText(id){
 const s=BY_ID[id];if(!s)return "스킬을 선택하세요.";
 return '<b>'+escapeHtml(s.name)+'</b> <span class="'+labelRarity(s.rarity)+'">'+s.rarity+
 '</span><p>공명 '+s.cost+' · '+s.timing+'</p><p>'+escapeHtml(s.description)+'</p>';
}
function statRows(rows){
 return '<div class="wc3-statRows">'+rows.map(([title,value])=>'<div><span>'+title+'</span><strong>'+
 escapeHtml(value)+'</strong></div>').join("")+'</div>';
}
function ownerBody(){
 const d=state.ownerProgress||{level:1,combatXp:0,lifeXp:0,reputation:0};
 const lv=Math.max(1,Math.floor(n(d.level)||1)),xp=n(d.combatXp),need=combatXpNeed(lv);
 const r=wcDirectOwnerRates(),s=wcDirectCurrentStats();
 const fmt=x=>String(Math.round(n(x)*10)/10);
 const main=[
  ["공격력",s.minAttack+" ~ "+s.maxAttack],
  ["방어력",s.defense],
  ["명중",fmt(s.hitChance)+"%"],
  ["속도",s.attackSpeed],
  ["치명타 확률",fmt(s.critChance)+"%"],
  ["치명타 피해",fmt(s.critMultiplier)+"배"]
 ];
 const detail=[
  ["최대 HP",s.maxHp],["관통",fmt(s.penetration)],
  ["치명타 확률 저항",fmt(s.critChanceResist)+"%p"],
  ["치명타 추가피해 저항",fmt(s.critDamageResist)+"%p"],
  ["상태이상 저항",fmt(s.statusResist)+"%"],
  ["회피",fmt(s.evade)+"%"],["막기 확률",fmt(s.blockChance)+"%"],
  ["막기량",fmt(s.blockAmount)],["최대 공명",fmt(s.maxResonance)],
  ["교전당 공명 회복",fmt(s.resonanceRecovery)]
 ];
 const abilities=[
  ["무예",r.martial,"공격 장비 성능 "+r.martial+"%"],
  ["생존",r.survival,"방어 장비 성능 "+r.survival+"%"],
  ["처세",r.social,"사건·교섭 능력"]
 ];
 const resources=[
  ["체력",Math.max(0,n(state.hp))+" / "+s.maxHp],
  ["정신",Math.max(0,n(state.mind))+" / 100"],
  ["공명",Math.max(0,n(state.weapon?.resonance))+" / "+n(state.weapon?.maxResonance)],
  ["검 내구",Math.max(0,n(state.weapon?.dur))+" / "+n(state.weapon?.maxDur)]
 ];
 const stats=list=>'<div class="wc3-directGrid">'+list.map(([title,value])=>
   '<div class="wc3-directStat"><small>'+title+'</small><strong>'+escapeHtml(value)+'</strong></div>').join("")+'</div>';
 return '<section class="wc3-hero"><div class="wc3-profile">'+
 '<div class="wc3-avatar">◈</div><div><h3>'+escapeHtml(state.owner.name)+'</h3><small>'+
 escapeHtml(state.owner.role||"소유자")+' · '+n(state.owner.age)+'세 · 제'+n(state.generation)+'대</small></div></div>'+
 '<p class="wc3-story">'+escapeHtml(state.owner.background||"아직 기록된 과거가 없다.")+'</p></section>'+
 '<section class="wc3-panel"><div class="wc3-sectionTitle"><h3>현재 장착</h3><small>부위를 눌러 상세 확인</small></div>'+
 '<div class="wc3-ownerEquipGrid">'+
 [["helmet","투구"],["armor","갑옷"],["gloves","장갑"],["boots","신발"]].map(([slot,label])=>{
   const id=state.ownerEquipment?.[slot],entry=OWNER_GEAR_CATALOG[id];
   return '<button data-wc3-tab="gear" class="wc3-ownerEquip rarity-'+(entry?.rarity||"common")+
    '"><b>'+label+'</b><small>'+escapeHtml(entry?.name||"미장착")+'</small></button>';
 }).join("")+
 '<button data-wc3-tab="weapon" class="wc3-ownerEquip wc3-ownerWeapon"><b>검</b><small>8파츠 상세</small></button>'+
 '</div></section>'+
 '<section class="wc3-panel"><div class="wc3-sectionTitle"><h3>소유자 기본 능력</h3><small>현재 발휘율 · 0~100</small></div>'+
 '<div class="wc3-abilityGrid">'+abilities.map(([title,v,note])=>
  '<div class="wc3-ability"><b>'+title+'</b><strong>'+v+'<small>/100</small></strong>'+
  '<div class="wc3-meter"><i style="width:'+Math.max(0,Math.min(100,v))+'%"></i></div>'+
  '<small>'+note+'</small></div>').join("")+'</div></section>'+
 '<section class="wc3-panel"><div class="wc3-sectionTitle"><h3>전투 능력치</h3><small>핵심 6개</small></div>'+
 stats(main)+
 '<details class="wc3-directDetails"><summary>방어·저항·공명 상세 펼치기</summary>'+
 stats(detail)+
 '<div class="wc3-formula"><b>장비 자체 성능 → 소유자 발휘율 → 최종값</b>'+
 '<p>장비 공격 '+fmt(s.breakdown.gearMinAttack)+' ~ '+fmt(s.breakdown.gearMaxAttack)+
 ' × 무예 '+r.martial+'% → '+s.minAttack+' ~ '+s.maxAttack+'</p>'+
 '<p>장비 방어 '+fmt(s.breakdown.gearDefense)+' × 생존 '+r.survival+'% → '+s.defense+'</p>'+
 '<p>기본 명중 '+fmt(s.breakdown.baseHitChance)+'% + 장비 명중 '+
 fmt(s.breakdown.gearHitBonus)+'%p × 무예 '+r.martial+'% → '+fmt(s.hitChance)+'%</p></div>'+
 '</details></section>'+
 '<section class="wc3-panel"><div class="wc3-sectionTitle"><h3>현재 자원</h3></div>'+stats(resources)+'</section>'+
 '<section class="wc3-panel"><div class="wc3-sectionTitle"><h3>성장 경험치</h3></div>'+
 statRows([["레벨","Lv. "+lv],["전투 경험치",xp+" / "+need],
 ["생활 경험치",n(d.lifeXp)],["개인 명성",n(d.reputation)]])+
 '<div class="wc3-xp"><i style="width:'+Math.max(0,Math.min(100,xp/need*100))+'%"></i></div></section>'+
 '<p class="wc3-migrationNote">개편 중: 개인 성장 수치는 구형 데이터에서 임시 이관한 값입니다. 전투 엔진 전체 적용 전까지 표시와 전투 결과가 다를 수 있습니다.</p>';
}
function armorBody(){
 const buttons=ARMOR_SLOTS.map(([id,title,role])=>{
  const gearId=state.ownerEquipment?.[id],item=OWNER_GEAR_CATALOG[gearId];
  return '<button class="wc3-equip'+(selectedArmor===id?' active':'')+' rarity-'+(item?.rarity||"common")+
   '" data-wc3-armor="'+id+'"><b>'+title+
   '</b><small>'+escapeHtml(item?.name||"미장착")+'</small><em>'+role+'</em>'+
   (item?'<small>'+escapeHtml(RARITY_DEF[item.rarity]?.name||"노멀")+'</small>':"")+'</button>';
 }).join("");
 const id=state.ownerEquipment?.[selectedArmor],item=OWNER_GEAR_CATALOG[id],title=ARMOR_SLOTS.find(x=>x[0]===selectedArmor)?.[1];
 const mods=item?.mods||{};
 const actual=WC_DIRECT_COMBAT_V2.migrateLegacyPart(mods,"armor",selectedArmor);
 const values=[
  ["최소 공격력",actual.minAttack],["최대 공격력",actual.maxAttack],
  ["방어력",actual.defense],["체력",actual.maxHp],
  ["명중 %p",actual.hitBonus],["치명타 %p",actual.critBonus],
  ["치명타 피해 %",actual.critDamageBonus],["관통",actual.penetration],
  ["회피 %p",actual.evade],["상태 저항 %p",actual.statusResist],
  ["막기 %p",actual.blockChance],["막기량",actual.blockAmount],
  ["공격속도 증가 %",actual.speedPct],["방어력 보정",actual.defensePct*100]
 ];
 const effects=values.filter(([,v])=>Math.abs(n(v))>0.00001).map(([label,v])=>
   label+" "+(v>0?"+":"")+Math.round(v*10)/10);
 return '<section class="wc3-panel"><h3>방어구 장착 상태</h3><div class="wc3-equipGrid">'+buttons+'</div></section>'+
 '<section class="wc3-panel"><h3>'+title+' 상세 정보</h3>'+
 '<div class="wc3-detail"><h4>'+escapeHtml(item?.name||"비어 있음")+'</h4>'+
 '<small>'+escapeHtml(item?.rarity||"미장착")+'</small><p>'+escapeHtml(item?.desc||"이 부위에 방어구를 장착할 수 있습니다.")+'</p>'+
 '<p>'+escapeHtml(effects.join(" · ")||"추가 효과 없음")+'</p>'+
 (item&&typeof WC_EQUIPMENT_POOL_V1!=="undefined"?WC_EQUIPMENT_POOL_V1.formatDetail(item):"")+'</div>'+
 '<button class="wc3-primary" data-wc3-armor-equip="'+selectedArmor+'">장비 선택 / 교체</button></section>'+
 '<p class="wc3-note">투구·갑옷·신발은 보호·기동, 장갑은 공격 보조도 가능합니다. 공격형 옵션은 무예, 방어형 옵션은 생존으로 발휘됩니다.</p>';
}
function partEffects(mods){
 const v=WC_DIRECT_COMBAT_V2.migrateLegacyPart(mods||{},"weapon");
 const fields=[["최소 공격력",v.minAttack],["최대 공격력",v.maxAttack],
  ["방어력",v.defense],["명중 %p",v.hitBonus],["치명타 확률 %p",v.critBonus],
  ["치명타 추가 피해 %",v.critDamageBonus],["관통",v.penetration],
  ["속도 증가 %",v.speedPct],["공명 최대",v.maxResonance],
  ["공명 회복",v.resonanceRecovery],["공격력 보정 %",v.attackPct*100],
  ["방어력 보정 %",v.defensePct*100]];
 return fields.filter(([,value])=>Math.abs(n(value))>0.00001)
  .map(([name,value])=>name+" "+(value>0?"+":"")+Math.round(value*10)/10)
  .join(" · ");
}
function weaponBody(){
 const buttons=PART_SLOTS.map((slot,i)=>{
  const id=state.weapon.parts?.[slot],item=PART_CATALOG[slot]?.[id];
  return '<button class="wc3-part'+(selectedPart===slot?' active':'')+' rarity-'+(item?.rarity||"common")+
   '" data-wc3-part="'+slot+'"><b>'+
   escapeHtml(PART_LABELS[slot])+'</b><small>'+escapeHtml(item?.name||"비어 있음")+'</small>'+
   (item?'<small>'+escapeHtml(RARITY_DEF[item.rarity]?.name||"노멀")+'</small>':"")+'</button>';
 });
 const selectedId=state.weapon.parts?.[selectedPart],p=PART_CATALOG[selectedPart]?.[selectedId];
 const visual=typeof weaponArt41==="function"?weaponArt41({},"wc41-smithSword"):'<div class="wc3-swordFallback">⚔</div>';
 return '<section class="wc3-panel"><h3>현재 무기 · 8파츠</h3><div class="wc3-weaponGrid">'+
  '<div class="wc3-partCol">'+buttons.slice(0,4).join("")+'</div>'+
  '<div class="wc3-sword">'+visual+'</div>'+
  '<div class="wc3-partCol">'+buttons.slice(4).join("")+'</div></div></section>'+
  '<section class="wc3-panel"><h3>'+escapeHtml(PART_LABELS[selectedPart])+' 상세 정보</h3>'+
  '<h4>'+escapeHtml(p?.name||"미장착")+' <span class="'+labelRarity(RARITY_DEF[p?.rarity]?.name||"일반")+'">'+
  escapeHtml(RARITY_DEF[p?.rarity]?.name||"일반")+'</span></h4>'+
  '<p>'+escapeHtml(p?.note||p?.passive||"파츠의 전투 기여도와 재료를 확인합니다.")+'</p>'+
  '<p>'+escapeHtml(partEffects(p?.mods)||"수치 효과 없음")+'</p>'+
  (p&&typeof WC_EQUIPMENT_POOL_V1!=="undefined"?WC_EQUIPMENT_POOL_V1.formatDetail(p):"")+
  '<small>내구 '+Math.round(n(state.weapon.dur))+' / '+Math.round(n(state.weapon.maxDur))+
  ' · 공명 '+Math.round(n(state.weapon.resonance))+' / '+Math.round(n(state.weapon.maxResonance))+'</small></section>';
}
function skillBody(){
 const d=ensureDeck(),available=d.owned,slotCells=d.deck.map((id,i)=>
  '<button class="wc3-card wc3-deckCard" data-wc3-deckslot="'+i+'"><small>덱 '+(i+1)+'</small>'+
  '<strong>'+escapeHtml(BY_ID[id]?.name||"비어 있음")+'</strong><em>'+
  escapeHtml(BY_ID[id]?.rarity||"")+'</em></button>').join("");
 const cells=Array.from({length:20},(_,i)=>{const id=available[i],s=BY_ID[id];
   return '<button class="wc3-card'+(selectedSkill===id?' active':'')+'" data-wc3-inv="'+
   (id||"")+'" '+(!id?'disabled':'')+'><small>'+String(i+1).padStart(2,"0")+'</small>'+
   '<strong>'+escapeHtml(s?.name||"빈칸")+'</strong>'+
   (s?'<em class="'+labelRarity(s.rarity)+'">'+s.rarity+'</em>':"")+'</button>';
 }).join("");
 const inDeck=d.deck.includes(selectedSkill),isStarter=STARTER.includes(selectedSkill);
 return '<section class="wc3-panel"><h3>장착 스킬덱 <small>10 / 10 · 전투 시작 시 셔플</small></h3>'+
 '<div class="wc3-deckGrid">'+slotCells+'</div>'+
 '<p class="wc3-note">'+(equipMode?"교체할 덱 위치를 위쪽에서 누르세요.":"전투 중 4장을 뽑고, 턴마다 사용한 카드 1장을 보충합니다.")+'</p></section>'+
 '<section class="wc3-panel"><h3>스킬 인벤토리 <small>'+available.length+'/20</small></h3>'+
 '<div class="wc3-inventoryGrid">'+cells+'</div></section>'+
 '<section class="wc3-panel"><h3>선택 스킬 정보</h3><div class="wc3-detail">'+skillText(selectedSkill)+'</div>'+
 (selectedSkill?'<div class="wc3-actions"><button class="wc3-primary" data-wc3-equip="'+selectedSkill+
 '">장착 · 위치 선택</button><button data-wc3-salvage="'+selectedSkill+'" '+
 (isStarter||inDeck?'disabled':'')+'>분해 (+1 조각)</button></div>':"")+
 '<p class="wc3-note">기본 10종 지급 · 전체 스킬 도감 '+SKILLS.length+'종 · 분해 조각 '+d.shards+
 ' · 스토리·탐험 보상으로 추가 획득</p></section>';
}
function css(){
 if(document.getElementById("wc3-status-style"))return;
 const el=document.createElement("style");el.id="wc3-status-style";
 el.textContent='.wc3-panel{border:1px solid #ae9772;border-radius:12px;background:#f8efdf;margin:8px 0;padding:10px}' +
 '.wc3-panel h3{margin:0 0 9px;font-size:13px}.wc3-panel h3 small{font-size:10px;color:#806c50}' +
 '.wc3-panel h4{margin:4px 0;font-size:12px}.wc3-panel p{font-size:11px;line-height:1.6}' +
 '.wc3-hero{padding:12px;background:#283b50;color:#f5e8d5;border-radius:12px}.wc3-hero small{color:#dfd2bb!important}' +
 '.wc3-hero .wc3-story{background:#354961;color:#fff}.wc3-hero h3{color:#fff}' +
 '.wc3-sectionTitle{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px}.wc3-sectionTitle h3{font-size:14px!important;margin:0}.wc3-sectionTitle small{font-size:10px}' +
 '.wc3-ownerEquipGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}' +
 '.wc3-ownerEquip{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:8px;border:1px solid #b9aa92;border-radius:7px;background:#fff8eb;font-size:11px;color:#413b33;text-align:left;min-width:0}' +
 '.wc3-ownerEquip b{font-size:11px;flex-shrink:0}.wc3-ownerEquip small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:72%}' +
 '.wc3-ownerWeapon{grid-column:1/-1;border-color:#987142;background:#f6e8d0}' +
 '.wc3-abilityGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}' +
 '.wc3-ability{border:1px solid #c7b496;border-radius:9px;background:#fff8e9;padding:9px 6px;display:flex;flex-direction:column;gap:6px;min-width:0}' +
 '.wc3-ability>b{font-size:12px}.wc3-ability>strong{font-size:23px;color:#254d56;line-height:1}.wc3-ability>strong small{font-size:10px}' +
 '.wc3-ability>small{font-size:10px;line-height:1.25;color:#695b48}.wc3-meter{height:5px;border-radius:4px;background:#d9d0bf;overflow:hidden}.wc3-meter i{display:block;height:100%;background:#54887e}' +
 '.wc3-directGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}' +
 '.wc3-directStat{display:flex;flex-direction:column;justify-content:center;padding:9px;border-radius:9px;background:#fff9ed;border:1px solid #d4c7af;gap:4px;min-width:0}' +
 '.wc3-directStat small{font-size:10px;color:#725f49}.wc3-directStat strong{font-size:17px;font-variant-numeric:tabular-nums;color:#253b4b;overflow-wrap:anywhere}' +
 '.wc3-directDetails{margin-top:10px;border-top:1px solid #ccb99e;padding-top:8px}.wc3-directDetails summary{font-size:12px;font-weight:750;color:#255b66;cursor:pointer;padding:6px}' +
 '.wc3-formula{background:#efe4d0;border-radius:9px;padding:9px;margin-top:9px;font-size:11px}.wc3-formula p{margin:5px 0}' +
 '.wc3-migrationNote{font-size:10px;line-height:1.5;color:#7b644b;margin:8px 2px}' +
 '@media(max-width:350px){.wc3-ability{padding:6px 4px}.wc3-ability>strong{font-size:19px}.wc3-directStat strong{font-size:14px}}' +
 '.wc3-profile{display:flex;align-items:center;gap:10px}.wc3-avatar{font-size:26px;border-radius:10px;background:#e4ceb0;padding:9px}' +
 '.wc3-profile h3{font-size:17px;margin:0}.wc3-profile small,.wc3-panel small{font-size:10px;color:#826e51}' +
 '.wc3-story{padding:8px;border-radius:7px;background:#eee1c9}.wc3-statRows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}' +
 '.wc3-statRows div{background:#f0e3ce;border:1px solid #cabb9f;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:4px}' +
 '.wc3-statRows span{font-size:10px}.wc3-statRows strong{font-size:13px}.wc3-xp{height:8px;border-radius:8px;background:#cebba0;margin-top:8px;overflow:hidden}' +
 '.wc3-xp i{height:100%;display:block;background:#658a68}.wc3-note{color:#7d6951;font-size:10px!important;line-height:1.6}' +
 '.wc3-equipGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.wc3-equip,.wc3-part,.wc3-card{cursor:pointer;min-width:0;border:1px solid #bca482;border-radius:8px;background:#fff9ec;padding:8px;text-align:left;color:#473b2e}' +
 '.wc3-equip{display:flex;flex-direction:column;gap:5px}.wc3-equip small,.wc3-part small{overflow-wrap:anywhere}.wc3-equip em{font-size:10px;font-style:normal}' +
 '.wc3-equip.active,.wc3-part.active,.wc3-card.active{border-color:#3d756e;box-shadow:inset 0 0 0 1px #3d756e}' +
 '.wc3-detail{border:1px solid #ceb99a;padding:9px;border-radius:8px;background:#fffbf1;font-size:11px}' +
 '.wc3-primary{background:#274d57!important;color:#fff!important;padding:9px;border-radius:7px;border:0}' +
 '.wc3-weaponGrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(78px,.85fr) minmax(0,1fr);gap:5px;align-items:stretch}' +
 '.wc3-partCol{display:grid;grid-template-rows:repeat(4,minmax(62px,1fr));gap:5px}.wc3-part{font-size:10px;padding:5px;overflow-wrap:anywhere}' +
 '.wc3-part b{display:block;margin-bottom:4px}.wc3-part small{line-height:1.3;font-size:9px}.wc3-sword{display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:8px;background:linear-gradient(#efe4d0,#d9c6a5)}' +
 '.wc3-sword svg,.wc3-sword img{max-width:100%;max-height:320px}.wc3-swordFallback{font-size:68px}' +
 '.wc3-deckGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}.wc3-inventoryGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}' +
 '.wc3-card{padding:4px;min-height:66px;display:flex;flex-direction:column;gap:3px;justify-content:space-between;overflow-wrap:anywhere}' +
 '.wc3-card small{font-size:9px}.wc3-card strong{font-size:10px;line-height:1.2}.wc3-card em{font-size:9px;font-style:normal}' +
 '.wc3-card:disabled{opacity:.45}.wc3-rarity{font-size:10px;padding:2px;border-radius:3px}' +
 '.wc3-rare{color:#3270a8}.wc3-unique{color:#8c4aaf}.wc3-legend{color:#b16c15}' +
 '.wc3-actions{display:flex;gap:7px;margin:9px 0}.wc3-actions button{padding:8px;border-radius:7px;border:1px solid #bfa47c}' +
 // Scope status colors to the shared dark modal theme.
 '.wc3-status{color:var(--wc38-ink,#eee1cf);line-height:1.5;min-width:0}' +
 '.wc3-status .tabRow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.wc3-status .tabBtn{background:#223248;color:#e7d3b0;border-color:#836b48;font-size:12px;min-height:40px;min-width:0;white-space:normal;overflow-wrap:anywhere;line-height:1.5}.wc3-status .tabBtn.active{background:#8b6a43;color:#fffaf1;border-color:#ecd5a9}' +
 '.wc3-status .wc3-panel,.wc3-status .wc3-hero{background:linear-gradient(140deg,#233040,#14202d);color:var(--wc38-ink,#eee1cf);border:1px solid #836b48}' +
 '.wc3-status h3,.wc3-status h4{color:#ecd5a9}.wc3-status .wc3-panel p{font-size:12px}' +
 '.wc3-status .wc3-panel small,.wc3-status .wc3-sectionTitle small,.wc3-status .wc3-ability>small,.wc3-status .wc3-note,.wc3-status .wc3-migrationNote,.wc3-status .wc3-statRows span,.wc3-status .wc3-equip em{color:var(--wc38-muted,#c3af90);font-size:11px;line-height:1.5}.wc3-status .wc3-note{font-size:11px!important}' +
 '.wc3-status .wc3-ability,.wc3-status .wc3-directStat,.wc3-status .wc3-statRows div,.wc3-status .wc3-detail,.wc3-status .wc3-formula,.wc3-status .wc3-story{background:#152131;color:var(--wc38-ink,#eee1cf);border-color:#796346}' +
 '.wc3-status .wc3-directStat strong,.wc3-status .wc3-ability>strong{color:#f3dfb7}.wc3-status .wc3-directDetails{border-color:#796346}.wc3-status .wc3-directDetails summary{color:#ecd5a9}' +
 '.wc3-status .wc3-avatar{background:#243a4f;color:#f3dfb7}.wc3-status .wc3-sword{background:radial-gradient(ellipse,#27374a,#0b1320)}' +
 '.wc3-status .wc3-ownerEquip,.wc3-status .wc3-equip,.wc3-status .wc3-part,.wc3-status .wc3-card,.wc3-status .wc3-actions button{background:#223248;color:#f1dfc6!important;border-color:#836b48}' +
 '.wc3-status .wc3-ownerEquip small{white-space:normal;overflow-wrap:anywhere;line-height:1.5}.wc3-status .wc3-primary{background:#8b6a43!important;color:#fffaf1!important}' +
 '.wc3-status .wc3-equip.active,.wc3-status .wc3-part.active,.wc3-status .wc3-card.active{outline:2px solid #f3ca78;outline-offset:1px;background:#314152;box-shadow:none}' +
 '.wc3-status .wc3-rare,.wc3-status .wc5-grade-rare{color:#91bff1}.wc3-status .wc3-unique,.wc3-status .wc5-grade-unique{color:#d0aff3}.wc3-status .wc3-legend,.wc3-status .wc5-grade-legendary{color:#f1ce80}' +
 '.wc3-status .wc5-quality{background:#101c2b}.wc3-status .wc5-grade-common{color:#c3cbd3}.wc3-status .wc5-grade-chronicle,.wc3-status .wc5-grade-beyond,.wc3-status .wc5-unique{color:#f2a4b4}' +
 '.wc3-status .wc3-card strong{font-size:12px;line-height:1.4}.wc3-status .wc3-card em,.wc3-status .wc3-part small{font-size:11px}.wc3-status .wc3-part b{font-size:11px;line-height:1.4}' +
 '.wc3-status .wc3-card:disabled{opacity:1;background:#152131;color:#a8b3bf!important}.wc3-status button:focus-visible{outline:2px solid #f3ca78;outline-offset:2px}' +
 '@media(max-width:430px){.wc3-status .wc3-deckGrid,.wc3-status .wc3-inventoryGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.wc3-status .wc3-sectionTitle,.wc3-status .wc3-actions{flex-wrap:wrap}}';
 document.head.appendChild(el);
}
function draw(tab){
 ensureV26Progression();recalcWeapon();ensureOwner();ensureDeck();css();tab=["owner","gear","weapon","combat"].includes(tab)?tab:"owner";
 const tabs=[["owner","소유자"],["gear","방어구"],["weapon","무기"],["combat","스킬덱"]];
 const nav='<div class="tabRow">'+tabs.map(([id,label])=>'<button class="tabBtn'+(id===tab?' active':'')+
 '" data-wc3-tab="'+id+'">'+label+'</button>').join("")+'</div>';
 const body=tab==="owner"?ownerBody():tab==="gear"?armorBody():tab==="weapon"?weaponBody():skillBody();
 openModal(modalHead("상태 정보",escapeHtml(state.owner.name)+" · 소유자와 검의 기록")+'<div class="wc3-status">'+nav+body+'</div>');
 bindClose();
 document.querySelectorAll("[data-wc3-tab]").forEach(e=>e.onclick=()=>draw(e.dataset.wc3Tab));
 document.querySelectorAll("[data-wc3-armor]").forEach(e=>e.onclick=()=>{selectedArmor=e.dataset.wc3Armor;draw("gear");});
 document.querySelectorAll("[data-wc3-armor-equip]").forEach(e=>e.onclick=()=>openOwnerSlot(e.dataset.wc3ArmorEquip));
 document.querySelectorAll("[data-wc3-part]").forEach(e=>e.onclick=()=>{selectedPart=e.dataset.wc3Part;draw("weapon");});
 document.querySelectorAll("[data-wc3-inv]").forEach(e=>e.onclick=()=>{selectedSkill=e.dataset.wc3Inv;equipMode=false;draw("combat");});
 document.querySelectorAll("[data-wc3-deckslot]").forEach(e=>e.onclick=()=>{
   const idx=Number(e.dataset.wc3Deckslot),d=ensureDeck();
   if(equipMode&&d.owned.includes(selectedSkill)){
     const previous=d.deck.indexOf(selectedSkill);
     if(previous===-1)d.deck[idx]=selectedSkill;
     else [d.deck[idx],d.deck[previous]]=[d.deck[previous],d.deck[idx]];
     equipMode=false;saveGame();
   }else{selectedSkill=d.deck[idx];equipMode=false;}
   draw("combat");
 });
 document.querySelectorAll("[data-wc3-equip]").forEach(e=>e.onclick=()=>{
   selectedSkill=e.dataset.wc3Equip;equipMode=true;draw("combat");
 });
 document.querySelectorAll("[data-wc3-salvage]").forEach(e=>e.onclick=()=>{
   const id=e.dataset.wc3Salvage,d=ensureDeck();
   if(STARTER.includes(id)||d.deck.includes(id))return;
   d.owned=d.owned.filter(x=>x!==id);d.dismantled.push(id);d.shards++;selectedSkill="";equipMode=false;
   saveGame();draw("combat");
 });
}
return Object.freeze({OWNERS,SKILLS,STARTER,ensureOwner,ensureDeck,grant,draw});
})();
if(typeof module!=="undefined"&&module.exports)module.exports=WC_STATUS_SKILLDECK_V1;
if(typeof window!=="undefined"&&typeof openStatus==="function"){
 const _wc3Load=loadGame;
 loadGame=function(...args){const result=_wc3Load.apply(this,args);
   const changed=WC_STATUS_SKILLDECK_V1.ensureOwner();
   WC_STATUS_SKILLDECK_V1.ensureDeck();
   if(changed)saveGame();
   return result;
 };
 const _wc3Succession=resetOwnerAssetsForSuccessor;
 resetOwnerAssetsForSuccessor=function(...args){const result=_wc3Succession.apply(this,args);
   WC_STATUS_SKILLDECK_V1.ensureOwner();return result;};
 openStatus=function(tab){WC_STATUS_SKILLDECK_V1.draw(tab||"owner");};
 const _wc3Combat=launchStoryCombat;
 launchStoryCombat=function(...args){
   const data=WC_STATUS_SKILLDECK_V1.ensureDeck();
   const frame=document.getElementById("combatFrame");
   if(frame)frame.dataset.skillDeck=JSON.stringify(data.deck);
   return _wc3Combat.apply(this,args);
 };
}

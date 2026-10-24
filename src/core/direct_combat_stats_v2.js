/* Weapon Chronicle: 2026-10-21 approved direct-stat combat arithmetic.
 * Independent from the legacy battle bridge. No owner attack/defense flat bonus.
 * Percentage conventions: attackPct/defensePct = decimal fractions (0.10=10%).
 * hit/crit/evade/block bonuses = percentage points (10=10%p).
 * speedPct/critDamageBonus = percentages (20=20%).
 * Legacy migration is explicitly separated below. No weight/length bonuses.
 */
const WC_DIRECT_COMBAT_V2=(()=>{
"use strict";
const PART_SLOTS=Object.freeze(["blade","guard","tang","grip","wrap","pommel","seat","scabbard"]);
const ARMOR_SLOTS=Object.freeze(["helmet","armor","gloves","boots"]);
const BASE=Object.freeze({hitChance:70,critChance:5,evade:0,statusResist:0,blockChance:0});
const n=(v,otherwise=0)=>v===null||v===undefined||v===""?otherwise:(Number.isFinite(Number(v))?Number(v):otherwise);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const sum=(arr,key)=>arr.reduce((total,item)=>total+n(item?.[key]),0);
const rounded=v=>Math.round(v*1000)/1000;
function calculate({owner={},weapon={},parts={},armor={},base=BASE}={}){
 const m=clamp(n(owner.martial),0,100)/100;
 const s=clamp(n(owner.survival),0,100)/100;
 const stable=clamp(n(owner.stableSurvival,owner.survival),0,100)/100;
 const weaponParts=PART_SLOTS.map(k=>parts[k]||{});
 const armorPieces=ARMOR_SLOTS.map(k=>armor[k]||{});
 const attackItems=[weapon,...weaponParts,armor.gloves||{}];
 const defenseItems=[weapon,...weaponParts,...armorPieces];
 // Boots are the only armor speed source (migrateLegacyPart zeroes others).
 const speedItems=[...attackItems,armor.boots||{}];
 const atkPct=sum(attackItems,"attackPct");
 const defPct=sum(defenseItems,"defensePct");
 const gearMin=sum(attackItems,"minAttack")*(1+atkPct);
 const gearMax=sum(attackItems,"maxAttack")*(1+atkPct);
 const unscaledMin=Math.max(0,Math.min(gearMin,gearMax));
 const unscaledMax=Math.max(0,Math.max(gearMin,gearMax));
 const gearDefense=Math.max(0,sum(defenseItems,"defense")*(1+defPct));
 const atkMin=Math.round(unscaledMin*m),atkMax=Math.round(unscaledMax*m);
 const pct=x=>clamp(x,0,100);
 const critExtra=Math.max(0,sum(attackItems,"critDamageBonus")*m);
 const hpBonus=sum(armorPieces,"maxHp");
 const resSources=[weapon,...weaponParts];
 const result={
  martial:Math.round(m*100),survival:Math.round(s*100),
  minAttack:atkMin,maxAttack:Math.max(atkMin,atkMax),
  hitChance:pct(n(base.hitChance,70)+sum(attackItems,"hitBonus")*m),
  critChance:pct(n(base.critChance,5)+sum(attackItems,"critBonus")*m),
  critDamageBonus:rounded(critExtra),critMultiplier:rounded(1+critExtra/100),
  penetration:rounded(Math.max(0,sum(attackItems,"penetration")*m)),
  defense:Math.round(gearDefense*s),
  maxHp:Math.max(1,Math.round(n(owner.baseHp,1)+hpBonus*stable)),
  critChanceResist:pct(sum(defenseItems,"critChanceResist")*s),
  critDamageResist:Math.max(0,rounded(sum(defenseItems,"critDamageResist")*s)),
  statusResist:pct(n(base.statusResist)+sum(defenseItems,"statusResist")*s),
  evade:pct(n(base.evade)+sum(defenseItems,"evade")*s),
  blockChance:pct(n(base.blockChance)+sum(defenseItems,"blockChance")*s),
  blockAmount:Math.max(0,rounded(sum(defenseItems,"blockAmount")*s)),
  attackSpeed:Math.max(1,rounded(100*(1+sum(speedItems,"speedPct")*m/100))),
  maxResonance:Math.max(0,rounded(sum(resSources,"maxResonance"))),
  resonanceRecovery:Math.max(0,rounded(sum(resSources,"resonanceRecovery"))),
  breakdown:Object.freeze({
   gearMinAttack:rounded(unscaledMin),gearMaxAttack:rounded(unscaledMax),
   gearDefense:rounded(gearDefense),attackPct:rounded(atkPct),
   defensePct:rounded(defPct),martialRate:m,survivalRate:s,
   baseHitChance:n(base.hitChance,70),baseCritChance:n(base.critChance,5),
   gearHitBonus:rounded(sum(attackItems,"hitBonus")),
   gearCritBonus:rounded(sum(attackItems,"critBonus")),
   gearSpeedPct:rounded(sum(speedItems,"speedPct")),
   gearHpBonus:rounded(hpBonus)
  })
 };
 return Object.freeze(result);
}
// Per-item owner-applied contribution for equipment detail views. Reuses
// calculate() so displays never diverge from combat; percentage stats use a
// neutral offset base so negative rolls are not clamped away.
const DETAIL_BASE=Object.freeze({hitChance:50,critChance:50,evade:50,statusResist:50,blockChance:50});
function itemEffects(direct={},{kind="weapon",slot="",owner={}}={}){
 const holder=kind==="armor"?{armor:{[slot]:direct}}:{parts:{[PART_SLOTS.includes(slot)?slot:"blade"]:direct}};
 const r=calculate({owner:{...owner,baseHp:0},...holder,base:DETAIL_BASE});
 const stable=clamp(n(owner.stableSurvival,owner.survival),0,100)/100;
 return Object.freeze({
  martial:r.martial,survival:r.survival,stableSurvival:Math.round(stable*100),
  minAttack:r.minAttack,maxAttack:r.maxAttack,defense:r.defense,
  maxHp:rounded(n(direct.maxHp)*stable),
  hitBonus:rounded(r.hitChance-50),critBonus:rounded(r.critChance-50),
  critDamageBonus:r.critDamageBonus,penetration:r.penetration,
  evade:rounded(r.evade-50),statusResist:rounded(r.statusResist-50),
  blockChance:rounded(r.blockChance-50),blockAmount:r.blockAmount,
  critChanceResist:r.critChanceResist,critDamageResist:r.critDamageResist,
  speedPct:rounded(r.attackSpeed-100),
  maxResonance:r.maxResonance,resonanceRecovery:r.resonanceRecovery
 });
}
const EFFECT_LABELS=Object.freeze([
 ["방어력","defense",""],["체력","maxHp",""],["명중","hitBonus","%p"],
 ["치명타 확률","critBonus","%p"],["치명타 피해","critDamageBonus","%"],["관통","penetration",""],
 ["회피","evade","%p"],["상태 저항","statusResist","%p"],["막기 확률","blockChance","%p"],
 ["막기량","blockAmount",""],["치명타 확률 저항","critChanceResist","%p"],
 ["치명타 피해 저항","critDamageResist","%p"],["공격속도","speedPct","%"],
 ["최대 공명","maxResonance",""],["공명 회복","resonanceRecovery",""]
]);
function describeItemEffects(e={}){
 const out=[];
 if(n(e.maxAttack)>0||n(e.minAttack)>0)out.push("공격력 "+n(e.minAttack)+" ~ "+n(e.maxAttack));
 for(const [label,key,unit] of EFFECT_LABELS){
  const v=Math.round(n(e[key])*10)/10;
  if(Math.abs(v)>0.00001)out.push(label+" "+(v>0?"+":"")+v+unit);
 }
 return out;
}
function resolveStrike({attacker={},defender={},hitRoll,critRoll,blockRoll,damageRoll,
  cardMultiplier=1,temporaryDefense=0}={}){
 const hit=clamp(n(attacker.hitChance)-n(defender.evade),0,100);
 const didHit=n(hitRoll,100)<hit;
 if(!didHit)return Object.freeze({hit:false,crit:false,blocked:false,damage:0});
 const critChance=clamp(n(attacker.critChance)-n(defender.critChanceResist),0,100);
 const crit=n(critRoll,100)<critChance;
 const criticalExtra=Math.max(0,n(attacker.critDamageBonus)-n(defender.critDamageResist));
 const blockChance=clamp(n(defender.blockChance),0,100);
 const blocked=n(blockRoll,100)<blockChance;
 const min=Math.max(0,n(attacker.minAttack)),max=Math.max(min,n(attacker.maxAttack));
 const base=min+(max-min)*clamp(n(damageRoll,0),0,1);
 if(base<=0)return Object.freeze({hit:true,crit,blocked,damage:0});
 const preDefense=base*Math.max(0,n(cardMultiplier,1))*(crit?1+criticalExtra/100:1);
 const effectiveDefense=Math.max(0,n(defender.defense)-Math.max(0,n(attacker.penetration)));
 const damage=Math.max(0,Math.max(1,preDefense-effectiveDefense)-
  (blocked?Math.max(0,n(defender.blockAmount)):0)-Math.max(0,n(temporaryDefense)));
 return Object.freeze({hit:true,crit,blocked,damage:Math.round(damage),effectiveDefense});
}
// Explicit old-data migration only, not the combat model.
// Legacy weapon totals already include its eight parts. Subtract once.
// Do not reuse legacy physical weight/length effects.
function migrateLegacyPart(mods={},kind="weapon",slot=""){
 const val=k=>n(mods[k]);
 const pct=k=>val(k)/100;
 const attack=kind==="armor"&&slot!=="gloves"?0:val(kind==="armor"?"attack":"power");
 const [min,max]=[attack*.9,attack*1.1].sort((a,b)=>a-b);
 const direct={
  minAttack:min,maxAttack:max,defense:val(kind==="armor"?"defense":"toughness"),
  attackPct:kind==="armor"&&slot!=="gloves"?0:pct("attackPct"),
  defensePct:pct("defensePct"),
  hitBonus:val("hitBonus"),critBonus:val(kind==="armor"?"crit":"precision"),
  critDamageBonus:val("critDamageBonus"),penetration:val("penetration"),
  speedPct:val("speedPct")+(kind==="armor"?(slot==="boots"?val("speed"):0):val("handling")),
  maxHp:val("maxHp"),evade:val("evade"),statusResist:val("resist"),
  blockChance:val("block"),blockAmount:val("blockAmount"),
  critChanceResist:val("critChanceResist"),critDamageResist:val("critDamageResist"),
  maxResonance:kind==="armor"?0:val("maxResonance"),
  resonanceRecovery:kind==="armor"?0:val("resonanceRecovery")
 };
 if(kind==="armor"&&slot!=="gloves"){
   direct.critBonus=0;direct.critDamageBonus=0;direct.penetration=0;
 }
 if(kind==="armor"&&slot!=="boots")direct.speedPct=0;
 return Object.freeze(direct);
}
function migrateLegacyLoadout({weapon={},partCatalog={},equipment={},gearCatalog={}}={}){
 const parts={},armor={};
 const total=key=>PART_SLOTS.reduce((v,slot)=>v+n(partCatalog[slot]?.[weapon.parts?.[slot]]?.mods?.[key]),0);
 for(const slot of PART_SLOTS){
  const entry=partCatalog[slot]?.[weapon.parts?.[slot]];
  parts[slot]=migrateLegacyPart(entry?.mods||{},"weapon",slot);
 }
 for(const slot of ARMOR_SLOTS){
  const entry=gearCatalog[equipment[slot]];
  armor[slot]=migrateLegacyPart(entry?.slot===slot?entry.mods:{}, "armor",slot);
 }
 // The old totals include all part modifiers; the difference is the sword
 // base and permanent progression, not a second copy of equipped parts.
 const residual=Object.freeze({
  power:n(weapon.power)-total("power"),
  precision:n(weapon.precision)-total("precision"),
  toughness:n(weapon.toughness)-total("toughness"),
  handling:n(weapon.handling)-total("handling"),
  penetration:n(weapon.penetration)-total("penetration"),
  maxResonance:n(weapon.maxResonance)-total("maxResonance"),
  resonanceRecovery:n(weapon.resonanceRecovery)-total("resonanceRecovery"),
  attackPct:n(weapon.attackPct),defensePct:n(weapon.defensePct),speedPct:n(weapon.speedPct)
 });
 return {weapon:migrateLegacyPart(residual,"weapon"),parts,armor};
}
return Object.freeze({PART_SLOTS,ARMOR_SLOTS,BASE,calculate,resolveStrike,migrateLegacyPart,migrateLegacyLoadout,
 itemEffects,describeItemEffects});
})();
if(typeof module!=="undefined"&&module.exports)module.exports=WC_DIRECT_COMBAT_V2;

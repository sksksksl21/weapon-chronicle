/* Live handoff: compose the current loadout into ONE combat arithmetic snapshot.
 * This phase only transfers calculated values to the story-combat frame.
 * Damage, AI/card windows, saves and round timing remain legacy until separately reviewed.
 */
const WC_LIVE_COMBAT_HANDOFF_V1=(()=>{
  "use strict";
  function number(n, fallback=0){const x=Number(n);return Number.isFinite(x)?x:fallback;}
  function calculate(input, adapter, math) {
    if(!input||!adapter||!math)throw new TypeError("Combat handoff requires runtime, adapter and math");
    const eff=input.effectiveOwner||{},raw=input.rawOwner||{},owner=input.owner||{};
    const gearSurvival=number(input.armorSurvival);
    const rawSurvivalBeforeArmor=Math.max(1,number(raw.survival,1)-gearSurvival);
    // Existing owner martial effectiveness remains the compatibility source
    // until all five owner attributes have an approved combat curve.
    // The blade, eight sword parts and four armor slots are NOT folded
    // into this flat owner attack again.
    // The legacy effective attributes ALREADY incorporate weapon-fit and
    // equipped Survival bonuses. Remove those effects before the sword and
    // armor are added by the unified core, or they would count twice.
    const mental=number(eff.mult,1);
    const ownerMartial=Math.max(0,number(eff.martial)-number(raw.parts?.weapon)*mental);
    const ownerSurvival=Math.max(0,number(eff.survival)-gearSurvival*mental);
    const sources=adapter.fromLegacyLoadout({
      ownerCombat:{
        attack:ownerMartial*.72,
        defense:ownerSurvival,
        speed:0,
        crit:2+ownerMartial*.52,
        penetration:0
      },
      totalMaxHp:input.maxHp,
      weapon:input.weapon,
      partCatalog:input.partCatalog,
      ownerEquipment:input.ownerEquipment,
      gearCatalog:input.gearCatalog,
      buffs:{defense:number(input.foodBuff?.defense)},
      legacyVitals:{
        rawSurvivalBeforeArmor,
        boldness:owner.boldness,
        age:owner.age
      }
    });
    const stats=math.calculateActorStats(sources);
    return Object.freeze({
      maxHp:stats.maxHp+Math.max(0,number(input.foodBuff?.combatHp)),
      maxResonance:stats.maxResonance,
      resonanceRecovery:stats.resonanceRecovery,
      attack:stats.attack,
      defense:stats.defense,
      attackSpeed:stats.attackSpeed,
      critChance:stats.critChance,
      penetration:stats.penetration
    });
  }
  return Object.freeze({calculate});
})();
if(typeof module!=="undefined"&&module.exports)module.exports=WC_LIVE_COMBAT_HANDOFF_V1;

if(typeof window!=="undefined"&&typeof launchStoryCombat==="function"){
  // Shared exact calculation: the same equipment snapshot drives the HUD and battle.
  function wcCurrentUnifiedStats(){
    return WC_LIVE_COMBAT_HANDOFF_V1.calculate({
      owner:state.owner,
      effectiveOwner:effectiveOwnerStats(),
      rawOwner:rawOwnerStats(),
      armorSurvival:armorSurvivalValue(),
      maxHp:state.maxHp,
      weapon:state.weapon,
      partCatalog:PART_CATALOG,
      ownerEquipment:state.ownerEquipment,
      gearCatalog:OWNER_GEAR_CATALOG,
      foodBuff:state.foodBuff
    },WC_LEGACY_COMBAT_SOURCES_V1,WC_COMBAT_MATH_V1);
  }
  function wcRenderUnifiedStats(){
    const aside=document.querySelector(".wc41-weaponAside");
    if(!aside||!state?.weapon)return;
    let panel=document.getElementById("wcUnifiedCombatStats");
    if(!panel){
      const style=document.createElement("style");
      style.textContent=`
      #wcUnifiedCombatStats{border:1px solid #a68a5e;border-radius:12px;background:#152334;color:#f2e0b8;padding:8px;margin-bottom:8px}
      #wcUnifiedCombatStats .wcCombatTitle{font-size:12px;font-weight:900;letter-spacing:.02em;margin-bottom:6px}
      #wcUnifiedCombatStats .wcCombatGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
      #wcUnifiedCombatStats .wcCombatGrid div{display:flex;flex-direction:column;gap:1px;border:1px solid #55677b;border-radius:8px;padding:5px;min-width:0;font-size:10px;color:#c5cdd5}
      #wcUnifiedCombatStats .wcCombatGrid b{font-size:15px;color:#ffdf99;font-variant-numeric:tabular-nums}
      #wcUnifiedCombatStats .wcCombatParts{font-size:10px;margin-top:7px;color:#c8d3dd}
      .wcLegacyStats{width:100%;font-size:10px;border:1px solid #6c7b8e;border-radius:8px;padding:5px;color:#c3cfda}
      .wcLegacyStats summary{cursor:pointer;font-weight:750}
      .wcLegacyStats .weaponStats{margin-top:6px}
      `;
      document.head.appendChild(style);
      panel=document.createElement("section");
      panel.id="wcUnifiedCombatStats";
      panel.setAttribute("aria-label","통합 전투 능력치");
      const legacy=aside.querySelector(".weaponStats");
      if(legacy){
        const details=document.createElement("details");
        details.className="wcLegacyStats";
        const summary=document.createElement("summary");
        summary.textContent="검 자체 특성 · 위력 / 정밀 / 견고 / 조작성";
        details.appendChild(summary);
        legacy.replaceWith(panel,details);
        details.appendChild(legacy);
      }else aside.prepend(panel);
    }
    const s=wcCurrentUnifiedStats();
    const fmt=v=>String(Math.round(Number(v)*10)/10);
    const grid=[
      ["공격력",s.attack],["방어력",s.defense],
      ["공격속도",s.attackSpeed],["치명타 확률",s.critChance+"%"],
      ["관통력",s.penetration],["최대 체력",s.maxHp],
      ["최대 공명",s.maxResonance],["공명 회복/T",s.resonanceRecovery]
    ];
    const partCount=Object.keys(PART_CATALOG).filter(k=>Boolean(state.weapon?.parts?.[k])).length;
    const gearCount=["helmet","armor","gloves","boots"].filter(k=>OWNER_GEAR_CATALOG[state.ownerEquipment?.[k]]?.slot===k).length;
    panel.innerHTML='<div class="wcCombatTitle">통합 전투 능력치</div>'+
      '<div class="wcCombatGrid">'+grid.map(([k,v])=>'<div><span>'+k+'</span><b>'+(
        typeof v==="number"?fmt(v):v)+'</b></div>').join('')+'</div>'+
      '<div class="wcCombatParts">검 파츠 '+partCount+'/8 · 방어구 '+gearCount+'/4 반영</div>';
    const title=document.querySelector(".top .title");
    if(title)title.textContent="Weapon Chronicle · DEV";
  }
  const wcBeforeStatRender=render;
  render=function(...args){
    const result=wcBeforeStatRender.apply(this,args);
    try{wcRenderUnifiedStats();}catch(error){console.warn("Unified stat HUD skipped:",error);}
    return result;
  };
  // Hook the existing launcher without replacing any legacy encounter rules.
  const wcLaunchCombatBeforeHandoff=launchStoryCombat;
  launchStoryCombat=function(...args){
    const frame=$("combatFrame");
    // A failed preview must never block the underlying game/combat.
    try{
      const snapshot=wcCurrentUnifiedStats();
      frame.dataset.unifiedActorV1=JSON.stringify(snapshot);
    }catch(err){
      delete frame.dataset.unifiedActorV1;
      console.warn("Unified combat handoff skipped; legacy combat retained:",err);
    }
    return wcLaunchCombatBeforeHandoff.apply(this,args);
  };
  window.addEventListener("message",event=>{
    if(event?.data?.type==="wc-story-combat"){
      const frame=$("combatFrame");
      if(frame)delete frame.dataset.unifiedActorV1;
    }
  });
}

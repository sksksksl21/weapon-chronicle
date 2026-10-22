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
  function wcCurrentUnifiedStats(weaponOverride=null,gearOverride=null){
    return WC_LIVE_COMBAT_HANDOFF_V1.calculate({
      owner:state.owner,
      effectiveOwner:effectiveOwnerStats(),
      rawOwner:rawOwnerStats(),
      armorSurvival:armorSurvivalValue(),
      maxHp:state.maxHp,
      weapon:weaponOverride||state.weapon,
      partCatalog:PART_CATALOG,
      ownerEquipment:gearOverride||state.ownerEquipment,
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


  // Unified player-facing UI: the old power/precision/toughness/handling
  // numbers remain in saves and formulas, but are not independent HUD stats.
  const wcFmt=v=>{
    const x=Number(v);
    return Number.isFinite(x)?String(Math.round(x*10)/10):"—";
  };
  const wcStatFields=[
    ["공격력","attack"],["방어력","defense"],["공격속도","attackSpeed"],
    ["치명타 확률","critChance"],["관통력","penetration"],
    ["최대 체력","maxHp"],["최대 공명","maxResonance"],["공명 회복/T","resonanceRecovery"]
  ];
  function wcStatValue(stats,key){
    return wcFmt(stats[key])+(key==="critChance"?"%":"");
  }
  function wcStatTiles(stats,compact=false){
    const fields=compact?wcStatFields.slice(0,5):wcStatFields;
    const groupOf=key=>["attack","critChance","penetration"].includes(key)?"공격 · 검":(
      ["defense","maxHp"].includes(key)?"방어 · 생존":"기동 · 공명");
    return [...new Set(fields.map(([,key])=>groupOf(key)))].map(group=>
      '<section class="wc2-statGroup"><h4>'+group+'</h4>'+
      '<div class="wc2-stats'+(compact?' wc2-compact':'')+'">'+
      fields.filter(([,key])=>groupOf(key)===group).map(([name,key])=>
      '<div class="wc2-stat"><span>'+name+'</span><b>'+
      wcStatValue(stats,key)+'</b></div>').join("")+'</div></section>').join("");
  }
  function wcSafeUnified(){
    try{return wcCurrentUnifiedStats();}catch(err){
      console.warn("Unified UI calculation unavailable:",err);
      return null;
    }
  }
  function wcStatsHeader(stats){
    return '<section class="wc2-snapshot"><div class="wc2-heading">최종 전투 능력치 <small>공격은 소유자·검 / 방어는 소유자·검 방어 특성·방어구 / 기동은 검·신발</small></div>'+
      wcStatTiles(stats)+'</section>';
  }
  function wcGearBreakdown(){
    const roles=[["helmet","투구","체력·보호"],["armor","갑옷","방어·생존"],
      ["gloves","장갑","손 보호·방어"],["boots","신발","기동·방어"]];
    const rows=roles.map(([slot,title,role])=>{
      const id=state.ownerEquipment?.[slot];
      const entry=id?OWNER_GEAR_CATALOG[id]:null;
      const valid=entry?.slot===slot;
      const v=WC_LEGACY_COMBAT_SOURCES_V1.armorContribution(slot,id,OWNER_GEAR_CATALOG);
      const effects=[["체력",v.maxHp],["방어력",v.defense],
        ["방어 보정",v.defensePct],["공격속도",v.speed],["속도 보정",v.speedPct]]
        .filter(([,n])=>Number(n)!==0)
        .map(([name,n])=>name+" "+(n>0?"+":"")+wcFmt(n)+(name.includes("보정")?"%":""));
      return '<div class="wc2-gearRow"><b>'+title+'</b><span>'+role+'</span><small>'+
        (valid?(entry.name||id):"미장착")+'</small><em>'+
        (effects.join(" · ")||"통합 능력치 직접 보너스 없음")+'</em></div>';
    });
    return '<section class="wc2-gearBox"><div class="wc2-heading">방어구 4부위 <small>공격력·치명타·관통력 보너스 없음</small></div>'+
      '<div class="wc2-gearGrid">'+rows.join("")+'</div></section>';
  }
  function wcUIStyle(){
    if(document.getElementById("wc2-ui-style"))return;
    const style=document.createElement("style");
    style.id="wc2-ui-style";
    style.textContent=[
      '.wc41-weaponAside .wcLegacyStats{display:none!important}',
      '#wcUnifiedCombatStats{padding:7px!important;margin:0!important}',
      '#wcUnifiedCombatStats .wcCombatTitle{font-size:11px!important}',
      '#wcUnifiedCombatStats .wcCombatGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:4px!important}',
      '#wcUnifiedCombatStats .wcCombatGrid div{padding:4px!important;font-size:9px!important}',
      '#wcUnifiedCombatStats .wcCombatGrid b{font-size:13px!important}',
      '#wcUnifiedCombatStats .wcCombatParts{font-size:9px!important;line-height:1.45}',
      '.wc2-snapshot{border:1px solid #a18455;border-radius:11px;background:#172538;color:#f1dbb0;padding:10px;margin:10px 0}',
      '.wc2-heading{font-weight:900;font-size:13px;margin-bottom:8px}',
      '.wc2-heading small{display:block;font-size:10px;color:#c4cbd4;font-weight:500;line-height:1.5;margin-top:3px}',
      '.wc2-statGroup{margin-top:8px}.wc2-statGroup h4{font-size:11px;color:#ecd29c;margin:0 0 5px}',
      '.wc2-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}',
      '.wc2-gearBox{padding:9px;margin:8px 0;border:1px solid #8c9cad;border-radius:10px;background:#1a2d3c;color:#eee}',
      '.wc2-gearGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}',
      '.wc2-gearRow{display:flex;flex-direction:column;gap:3px;font-size:10px;border:1px solid #516b7c;padding:7px;border-radius:7px}',
      '.wc2-gearRow b{font-size:12px;color:#ffe2aa}.wc2-gearRow span{color:#bcd0db}',
      '.wc2-gearRow small{font-size:10px}.wc2-gearRow em{font-size:10px;font-style:normal;color:#afdbcb}',
      '.wc2-stat{min-width:0;display:flex;justify-content:space-between;align-items:center;gap:6px;border:1px solid #485e72;background:#20344a;border-radius:7px;padding:7px;font-size:11px}',
      '.wc2-stat span{color:#d4d9df;min-width:0}',
      '.wc2-stat b{color:#ffe3a3;font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.wc2-delta{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px;font-size:10px;line-height:1.4}',
      '.wc2-delta span{border:1px solid #516477;border-radius:5px;padding:2px 4px;background:#17283b;color:#e7dcbe}',
      '.wc2-delta .wc2-up{color:#8cdda4}',
      '.wc2-delta .wc2-down{color:#ffae9e}',
      '.wc2-equipment-note{font-size:10px;color:#d1d6dd;margin:5px 0}',
      '@media(max-width:480px){.main .wc41-dashboard{grid-template-columns:minmax(0,1fr)!important}.main .wc41-dashboard .wc41-serviceGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(2,minmax(115px,1fr))!important;min-height:0!important}.wc2-stat{padding:5px;gap:4px;font-size:10px}.wc2-stat b{font-size:12px}}'
    ].join("\n");
    document.head.appendChild(style);
  }
  function wcImproveMain(){
    wcUIStyle();
    const s=wcSafeUnified();
    const el=document.getElementById("wcUnifiedCombatStats");
    if(!s||!el)return;
    // The original DOM ids are retained but the legacy values are no
    // longer displayed as an alternative "combat" system.
    const old=document.querySelector(".wc41-weaponAside .wcLegacyStats");
    if(old)old.hidden=true;
    const keyNames=[["공격력","attack"],["방어력","defense"],
      ["공격속도","attackSpeed"],["치명타","critChance"],
      ["관통력","penetration"],["최대 공명","maxResonance"]];
    const html='<div class="wcCombatTitle">최종 전투 능력치</div>'+
      '<div class="wcCombatGrid">'+keyNames.map(([name,key])=>
        '<div><span>'+name+'</span><b>'+wcStatValue(s,key)+'</b></div>').join("")+'</div>'+
      '<div class="wcCombatParts">공격력·치명타·관통력: 소유자와 검<br>'+
      '방어·체력: 소유자·검 방어 특성·방어구 / 기동: 검·신발<br>'+
      '체력 '+wcStatValue(s,"maxHp")+' · 공명 회복/T '+wcStatValue(s,"resonanceRecovery")+'</div>';
    if(el.innerHTML!==html)el.innerHTML=html;
    const title=document.querySelector(".top .title");
    if(title)title.textContent="Weapon Chronicle · DEV";
  }
  function wcPartContribution(slot,id){
    const entry=PART_CATALOG[slot]?.[id];
    if(!entry)return "";
    const old=PART_CATALOG[slot]?.[state.weapon?.parts?.[slot]]?.mods||{};
    const next=entry.mods||{};
    const fields=[
      ["공격력","power"],["방어력","toughness"],["공격속도","handling"],
      ["치명타","precision"],["관통력","penetration"],
      ["최대 공명","maxResonance"],["공명 회복","resonanceRecovery"]
    ];
    const bits=fields.map(([label,key])=>{
      const d=Number(next[key]||0)-Number(old[key]||0);
      if(!Number.isFinite(d)||Math.abs(d)<.0001)return "";
      return '<span class="'+(d>0?'wc2-up':'wc2-down')+'">'+
        label+' '+(d>0?'+':'')+wcFmt(d)+'</span>';
    }).filter(Boolean);
    for(const [label,key,unit] of [["길이","length","cm"],["중량","weight","kg"]]){
      const d=Number(next[key]||0)-Number(old[key]||0);
      if(Number.isFinite(d)&&Math.abs(d)>.0001)
        bits.push('<span>'+label+' '+(d>0?'+':'')+wcFmt(d)+unit+'</span>');
    }
    return '<div class="wc2-delta">'+(bits.join("")||'<span>직접 수치 변동 없음</span>')+'</div>'+
      '<div class="wc2-equipment-note">파츠 단독 기여 변화 · 장착 후 최종 수치 재계산</div>';
  }
  function wcPolishModal(){
    wcUIStyle();
    const modal=document.getElementById("modal");
    const s=wcSafeUnified();
    if(!modal||!s)return;
    const tabs=modal.querySelector("[data-stab].active");
    if(tabs){
      const tab=tabs.dataset.stab;
      const original=modal.querySelector(".statusGrid");
      if((tab==="weapon"||tab==="combat")&&original){
        const section=document.createElement("div");
        section.innerHTML=wcStatsHeader(s);
        original.replaceWith(section.firstElementChild);
        const profile=modal.querySelector(".profileBox p");
        if(profile)profile.textContent="현재 소유자·검·방어구의 통합 계산 결과. 전투 화면에도 같은 능력치를 전달합니다.";
        const formula=modal.querySelector(".formula");
        if(formula)formula.textContent="능력치는 검과 장비를 합산한 뒤 상시 비율 보정을 한 번 적용합니다. 치명타 확률·관통력은 합산합니다.";
      }else if((tab==="gear"||tab==="owner")&&!modal.querySelector(".wc2-snapshot")){
        const anchor=modal.querySelector(".profileBox");
        if(tab==="owner"&&anchor)anchor.insertAdjacentHTML("afterend",wcStatsHeader(s));
        if(tab==="gear"){
          if(anchor)anchor.insertAdjacentHTML("afterend",wcGearBreakdown());
          const intro=modal.querySelector(".profileBox p");
          if(intro)intro.textContent="투구는 체력·보호, 갑옷은 방어, 장갑은 손 보호, 신발은 기동을 담당합니다. 방어구는 공격력·치명타·관통력을 올리지 않습니다.";
        }
      }
    }
    // Legacy status/repair screens do not have their own stat formulas.
    const legacy=modal.querySelectorAll(".smithStats .smithStat,.wc41-weaponFacts > div");
    legacy.forEach(el=>{
      if(/^(위력|정밀|견고|조작성)(\s*\/\s*(위력|정밀|견고|조작성))?/.test(el.textContent.trim())){
        el.style.display="none";
      }
    });
    // Weapon equip options show the actual component delta, not relabeled
    // legacy totals pretending to be aggregate combat values.
    modal.querySelectorAll("[data-weapon-equip]").forEach(button=>{
      if(button.querySelector(".wc2-delta"))return;
      const id=button.dataset.weaponEquip;
      const slot=Object.keys(PART_CATALOG).find(k=>Boolean(PART_CATALOG[k]?.[id]));
      if(slot)button.insertAdjacentHTML("beforeend",wcPartContribution(slot,id));
    });
    if(modal.querySelector("[data-owner-slot],[data-owner-equip2],[data-equip-gear]")&&!modal.querySelector(".wc2-gearBox")){
      const head=modal.querySelector(".modalDesc,.dualTitle,.serviceCard40");
      if(head)head.insertAdjacentHTML("afterend",wcGearBreakdown());
    }
  }
  // Replace the player-facing legacy summaries, not the underlying source
  // fields that are used by the weapon catalog, old saves and combat math.
  smithStatHtml=function(){
    const s=wcSafeUnified();
    return s?wcStatsHeader(s):'<div class="wc2-equipment-note">통합 능력치를 계산할 수 없습니다.</div>';
  };
  wc41WeaponFactHtml=function(){
    const w=state.weapon,s=wcSafeUnified();
    return '<div class="wc41-weaponFacts"><div>길이 / 중량<b>'+
      wcFmt(w.length)+'cm / '+wcFmt(w.weight)+'kg</b></div>'+
      '<div>내구도<b>'+wcFmt(w.dur)+' / '+wcFmt(w.maxDur)+'</b></div>'+
      '<div>공명<b>'+wcFmt(w.resonance)+' / '+wcFmt(w.maxResonance)+'</b></div></div>'+
      (s?wcStatsHeader(s):"");
  };
  partDeltaHtml=function(slot,id){return wcPartContribution(slot,id);};
  gearSummaryHtml=function(){
    return wcGearBreakdown();
  };
  const wcOpenModalBeforeUI=openModal;
  openModal=function(content){
    const value=wcOpenModalBeforeUI.call(this,content);
    try{wcPolishModal();}catch(error){console.warn("Unified modal UI skipped:",error);}
    return value;
  };
  const wcRenderBeforeUI=render;
  render=function(...args){
    const value=wcRenderBeforeUI.apply(this,args);
    try{wcImproveMain();}catch(error){console.warn("Unified main UI skipped:",error);}
    return value;
  };
  // Render() on initial startup is called by bootstrap after this module loads.
}

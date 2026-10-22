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
    const sources=adapter.fromLegacyLoadout({
      ownerCombat:{
        attack:Math.max(0,number(eff.martial)*.72),
        defense:Math.max(0,number(eff.survival)),
        speed:0,
        crit:Math.max(0,2+number(eff.martial)*.52),
        penetration:0
      },
      totalMaxHp:input.maxHp,
      weapon:input.weapon,
      partCatalog:input.partCatalog,
      ownerEquipment:input.ownerEquipment,
      gearCatalog:input.gearCatalog,
      legacyVitals:{
        rawSurvivalBeforeArmor,
        boldness:owner.boldness,
        age:owner.age
      }
    });
    const stats=math.calculateActorStats(sources);
    return Object.freeze({
      maxHp:stats.maxHp,
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
  // Hook the existing launcher without replacing any legacy encounter rules.
  const wcLaunchCombatBeforeHandoff=launchStoryCombat;
  launchStoryCombat=function(...args){
    const frame=$("combatFrame");
    // A failed preview must never block the underlying game/combat.
    try{
      const snapshot=WC_LIVE_COMBAT_HANDOFF_V1.calculate({
        owner:state.owner,
        effectiveOwner:effectiveOwnerStats(),
        rawOwner:rawOwnerStats(),
        armorSurvival:armorSurvivalValue(),
        maxHp:state.maxHp,
        weapon:state.weapon,
        partCatalog:PART_CATALOG,
        ownerEquipment:state.ownerEquipment,
        gearCatalog:OWNER_GEAR_CATALOG
      },WC_LEGACY_COMBAT_SOURCES_V1,WC_COMBAT_MATH_V1);
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

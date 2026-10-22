/* Transitional UI-facing direct-stat runtime input, 2026-10-21 contract.
 * This is an explicit compatibility migration bridge; no old source stats are
 * read by WC_DIRECT_COMBAT_V2.calculate itself.
 * TODO: replace legacy 1..10 owner-growth scaling with audited 0..100 migration.
 */
function wcDirectOwnerRates(){
 const raw=rawOwnerStats(), eff=effectiveOwnerStats();
 const mental=Number.isFinite(Number(eff.mult))?Number(eff.mult):1;
 const armorSurvival=typeof armorSurvivalValue==="function"?Number(armorSurvivalValue()||0):0;
 const weaponMartial=Number(raw.parts?.weapon||0);
 const currentMartial=Math.max(0,Number(eff.martial||0)-weaponMartial*mental);
 const currentSurvival=Math.max(0,Number(eff.survival||0)-armorSurvival*mental);
 const safe=x=>Math.max(0,Math.min(100,Math.round(x*10)));
 // Explicit migration of v5.2 personal points, not 7 -> 7%.
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
 const rates=wcDirectOwnerRates();
 // Legacy maxHp already contains armor flat HP; undo that component exactly
 // so the direct layer can scale the equipment HP bonus once.
 const hpFromGear=WC_DIRECT_COMBAT_V2.ARMOR_SLOTS.reduce((total,slot)=>
  total+Number(items.armor[slot]?.maxHp||0),0);
 const owner={...rates,baseHp:Math.max(1,Number(state.maxHp||1)-hpFromGear)};
 const result=WC_DIRECT_COMBAT_V2.calculate({owner,...items});
 return Object.freeze({...result,ownerRates:Object.freeze(rates),
  migration:Object.freeze({version:"legacy-v5.2-preview",audited:false})});
}

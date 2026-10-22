/* Read-only bridge from Weapon Chronicle's existing part/equipment catalogs.
 * Does not convert legacy fields into new combat coefficients or edit saves.
 * Prevents double-counting pre-aggregated state.weapon values during migration.
 */
const WC_COMBAT_EQUIPMENT_BRIDGE = (() => {
  "use strict";
  const SWORD_SLOTS = Object.freeze(["blade","guard","tang","grip","wrap","pommel","seat","scabbard"]);
  const ARMOR_SLOTS = Object.freeze(["helmet","armor","gloves","boots"]);
  const PART_FIELDS = Object.freeze(["power","precision","toughness","handling","maxResonance","resonanceRecovery","weight","carryWeight","length","firstHandling"]);
  const GEAR_FIELDS = Object.freeze(["defense","evade","resist","maxHp","survival"]);
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  function assertKnownSlots(equipped, allowed, label) {
    if (!equipped || typeof equipped !== "object" || Array.isArray(equipped)) throw new TypeError(label+" must be a slot record");
    for (const slot of Object.keys(equipped)) if (!allowed.includes(slot)) throw new RangeError(label+" unexpected slot "+slot);
  }
  function extractSword(weapon, catalog) {
    if (!weapon || !catalog) throw new TypeError("missing sword or catalog");
    const equipped=weapon.parts||{};
    assertKnownSlots(equipped,SWORD_SLOTS,"sword");
    const partMods={};
    const sums=Object.fromEntries(PART_FIELDS.map(field=>[field,0]));
    for(const slot of SWORD_SLOTS) {
      const id=equipped[slot];
      if(!id) continue; // Missing fields in old saves do not invent equipment.
      const part=catalog[slot]?.[id];
      if(!part) throw new RangeError("unknown sword part "+slot+":"+id);
      const mods={};
      for(const field of PART_FIELDS) {
        mods[field]=number(part.mods?.[field]);
        sums[field]+=mods[field];
      }
      partMods[slot]=Object.freeze({id,mods:Object.freeze(mods)});
    }
    const upgrades=weapon.upgrades||{};
    const edge=number(upgrades.edge),temper=number(upgrades.temper);
    const balance=number(upgrades.balance),core=number(upgrades.core);
    // This is the existing recalcWeapon formula, read-only. It is NOT a
    // second additive bonus to state.weapon, which already contains totals.
    const weight=Math.max(.75,sums.weight-balance*.02);
    const legacyTotals=Object.freeze({
      power:sums.power+edge,
      precision:sums.precision+Math.floor(edge/2),
      toughness:sums.toughness+temper,
      handling:sums.handling+balance,
      maxResonance:sums.maxResonance+core*5,
      resonanceRecovery:sums.resonanceRecovery+Math.floor((core+1)/2),
      weight:Math.round(weight*100)/100,
      carryWeight:Math.round((weight+sums.carryWeight)*100)/100,
      length:Math.round(14+sums.length),
      firstHandling:sums.firstHandling
    });
    return Object.freeze({partMods:Object.freeze(partMods),rawPartSums:Object.freeze(sums),legacyTotals});
  }
  function extractArmor(equipped, catalog) {
    assertKnownSlots(equipped,ARMOR_SLOTS,"armor");
    if(!catalog)throw new TypeError("missing armor catalog");
    const bySlot={};
    const totals=Object.fromEntries(GEAR_FIELDS.map(field=>[field,0]));
    for(const slot of ARMOR_SLOTS) {
      const id=equipped[slot];
      if(!id) continue;
      const item=catalog[id];
      if(!item || item.slot!==slot) throw new RangeError("unknown armor or incorrect slot "+slot+":"+id);
      const mods={};
      for(const field of GEAR_FIELDS) {
        mods[field]=number(item.mods?.[field]);
        totals[field]+=mods[field];
      }
      bySlot[slot]=Object.freeze({id,mods:Object.freeze(mods)});
    }
    return Object.freeze({bySlot:Object.freeze(bySlot),totals:Object.freeze(totals)});
  }
  function compareLegacyWeapon(weapon, catalog) {
    const calculated=extractSword(weapon,catalog).legacyTotals;
    const differences={};
    for(const [key,value] of Object.entries(calculated))
      if(Math.abs(number(weapon[key])-value)>1e-6)differences[key]={expected:value,stored:weapon[key]};
    return Object.freeze({matches:Object.keys(differences).length===0,differences:Object.freeze(differences)});
  }
  return Object.freeze({SWORD_SLOTS,ARMOR_SLOTS,PART_FIELDS,GEAR_FIELDS,extractSword,extractArmor,compareLegacyWeapon});
})();
if(typeof module !== "undefined" && module.exports)module.exports=WC_COMBAT_EQUIPMENT_BRIDGE;

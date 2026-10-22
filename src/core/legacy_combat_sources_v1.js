/* Weapon Chronicle — legacy equipment -> unified combat arithmetic inputs.
 * Non-live adapter: preserves v5.2 saves and historical part IDs.
 * The caller must supply ownerCombat BASE stats (not gear-inclusive) and the
 * runtime's CURRENT totalMaxHp (which already includes equipped gear maxHp).
 */
const WC_LEGACY_COMBAT_SOURCES_V1 = (() => {
  "use strict";
  const SWORD = Object.freeze(["blade","guard","tang","grip","wrap","pommel","seat","scabbard"]);
  const ARMOR = Object.freeze(["helmet","armor","gloves","boots"]);
  const FLATS = Object.freeze(["attack","defense","speed","crit","penetration","maxResonance","resonanceRecovery"]);
  function num(value) {
    if (value === "" || value === null || value === undefined) return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  function modsOf(catalog, slot, itemId) {
    if (!itemId) return {};
    const item = catalog?.[slot]?.[itemId];
    return item?.mods && typeof item.mods === "object" ? item.mods : {};
  }
  function swordPartValues(mods) {
    return {
      attack:num(mods.power), defense:num(mods.toughness),
      speed:num(mods.handling), crit:num(mods.precision),
      penetration:num(mods.penetration),
      maxResonance:num(mods.maxResonance),
      resonanceRecovery:num(mods.resonanceRecovery),
      attackPct:num(mods.attackPct), defensePct:num(mods.defensePct), speedPct:num(mods.speedPct)
    };
  }
  function armorValues(mods) {
    return {
      attack:num(mods.attack), defense:num(mods.defense),
      speed:num(mods.speed), crit:num(mods.crit),
      penetration:num(mods.penetration), maxHp:num(mods.maxHp),
      attackPct:num(mods.attackPct), defensePct:num(mods.defensePct), speedPct:num(mods.speedPct)
    };
  }
  function fromLegacyLoadout({ownerCombat={},totalMaxHp,weapon={},partCatalog={},
    ownerEquipment={},gearCatalog={},buffs={}}={}) {
    const weaponParts = {};
    for (const slot of SWORD) {
      weaponParts[slot] = swordPartValues(modsOf(partCatalog,slot,weapon.parts?.[slot]));
    }
    const armor = {};
    for (const slot of ARMOR) {
      const entry = ownerEquipment?.[slot] && gearCatalog?.[ownerEquipment[slot]];
      // The saved equipped item must actually belong to the expected slot.
      const mods = entry?.slot === slot ? (entry.mods||{}) : {};
      armor[slot] = armorValues(mods);
    }
    // Legacy HP is clamped after Survival*4 and fixed gear maxHp are added.
    // A capped aggregate cannot be reliably inverted to remove wrong-slot gear.
    // Prefer an explicitly supplied gear-exclusive owner maximum.
    const hasOwnerBase = ownerCombat.maxHp !== undefined && ownerCombat.maxHp !== null;
    const uncertainSlot = ARMOR.find(slot=>{
      const item = gearCatalog?.[ownerEquipment?.[slot]];
      return item && item.slot !== slot &&
        (num(item.mods?.maxHp) !== 0 || num(item.mods?.survival) !== 0);
    });
    if (!hasOwnerBase && uncertainSlot) {
      throw new RangeError("Cannot normalize capped legacy HP with wrong-slot HP/Survival gear (" +
        uncertainSlot + "); supply gear-exclusive ownerCombat.maxHp");
    }
    // For valid loadouts the sum of known fixed HP bonuses is reversible:
    // subtract them from the aggregate and let the core add each valid item once.
    const knownEquippedHp = ARMOR.reduce((sum,slot)=>{
      const itemId = ownerEquipment?.[slot];
      return sum + num(itemId && gearCatalog?.[itemId]?.mods?.maxHp);
    },0);
    const baseHp = hasOwnerBase ? num(ownerCombat.maxHp) : num(totalMaxHp) - knownEquippedHp;
    const owner = {...ownerCombat, maxHp:Math.max(1,baseHp)};
    // state.weapon's values already INCLUDE every equipped component.
    // Strip mapped component contributions now, so the core adds them once.
    const totals = {
      attack:num(weapon.power), defense:num(weapon.toughness),
      speed:num(weapon.handling), crit:num(weapon.precision),
      penetration:num(weapon.penetration),
      maxResonance:num(weapon.maxResonance),
      resonanceRecovery:num(weapon.resonanceRecovery)
    };
    const base = {};
    for (const key of FLATS) {
      base[key] = totals[key] - SWORD.reduce((sum,slot)=>sum+weaponParts[slot][key],0);
    }
    // Explicit baseline permanent bonuses remain separate from part modifiers.
    for (const key of ["attackPct","defensePct","speedPct"]) base[key] = num(weapon[key]);
    return {owner, weapon:base, weaponParts, armor, buffs:{...buffs}};
  }
  function enemyFromLegacy(stage, overrides={}) {
    const enemy={...stage,...overrides};
    return {
      owner:{
        maxHp:Math.max(1,num(enemy.maxHp)),
        attack:num(enemy.attack),defense:num(enemy.defense),
        speed:num(enemy.speed),crit:num(enemy.crit),
        penetration:num(enemy.penetration)
      }
    };
  }
  return Object.freeze({SWORD,ARMOR,fromLegacyLoadout,enemyFromLegacy});
})();
if (typeof module !== "undefined" && module.exports) module.exports = WC_LEGACY_COMBAT_SOURCES_V1;

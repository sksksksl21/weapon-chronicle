/* Weapon Chronicle — legacy equipment -> unified combat arithmetic inputs.
 * Non-live adapter: preserves v5.2 saves and historical part IDs.
 * The caller must supply ownerCombat BASE stats (not gear-inclusive) and the
 * runtime's CURRENT totalMaxHp (which already includes equipped gear maxHp).
 * If saved slots may be invalid, supply legacyVitals to reproduce original HP caps.
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
    ownerEquipment={},gearCatalog={},buffs={},legacyVitals}={}) {
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
    // Legacy ownerVitalCaps: clamp(round(65 + rawSurvival*4 +
    // boldness/age modifiers + fixed equipment HP), 58, 170).
    // rawOwnerStats includes clamp(round(sum(gear.survival)), 0, 12).
    // A capped saved aggregate alone cannot be inverted after an invalid slot.
    const suspiciousHpSlot = ARMOR.find(slot=>{
      const item = gearCatalog?.[ownerEquipment?.[slot]];
      return item && item.slot !== slot &&
        (num(item.mods?.maxHp) !== 0 || num(item.mods?.survival) !== 0);
    });
    const gearHp = ARMOR.reduce((sum,slot)=>sum+armor[slot].maxHp,0);
    let baseHp;
    if (legacyVitals !== undefined && legacyVitals !== null) {
      if (!Number.isFinite(Number(legacyVitals.rawSurvivalBeforeArmor))) {
        throw new TypeError("legacyVitals.rawSurvivalBeforeArmor is required");
      }
      const validSurvival = ARMOR.reduce((sum,slot)=>{
        const itemId = ownerEquipment?.[slot];
        const item = gearCatalog?.[itemId];
        return sum + (item?.slot === slot ? num(item?.mods?.survival) : 0);
      },0);
      const armorSurvival = Math.max(0,Math.min(12,Math.round(validSurvival)));
      const rawSurvival = Math.max(1,num(legacyVitals.rawSurvivalBeforeArmor)+armorSurvival);
      const boldness = Number(legacyVitals.boldness)||50;
      const age = Math.max(16,Number(legacyVitals.age)||24);
      const uncapped = 65 + rawSurvival*4 + (boldness-50)*.08 - Math.max(0,age-34)*.45 + gearHp;
      const total = Math.max(58,Math.min(170,Math.round(uncapped)));
      // The pure core separately adds valid gear's flat HP, exactly once.
      baseHp = total - gearHp;
    } else {
      if (suspiciousHpSlot) {
        throw new RangeError("Cannot undo wrong-slot legacy Survival/HP from capped maxHp (" +
          suspiciousHpSlot + "); provide legacyVitals for exact owner HP reconstruction");
      }
      // Valid legacy aggregate is already capped and Survival-inclusive; keep
      // it unchanged regardless of ownerCombat.maxHp to preserve old saves.
      const aggregate = totalMaxHp !== undefined && totalMaxHp !== null
        ? num(totalMaxHp) : num(ownerCombat.maxHp)+gearHp;
      baseHp = aggregate - gearHp;
    }
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

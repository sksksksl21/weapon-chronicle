/* Weapon Chronicle: unified combat arithmetic, independent of UI and legacy saves.
 * Phase 1: verified pure functions. Not injected into the live HTML until
 * character/weapon/armor/enemy data adapters are validated in a separate PR.
 */
const WC_COMBAT_MATH_V1 = (() => {
  "use strict";
  const SWORD_SLOTS = Object.freeze(["blade", "guard", "tang", "grip", "wrap", "pommel", "seat", "scabbard"]);
  const ARMOR_SLOTS = Object.freeze(["helmet", "armor", "gloves", "boots"]);
  const FLAT = Object.freeze(["attack", "defense", "speed", "crit", "penetration"]);
  const PERCENT = Object.freeze(["attackPct", "defensePct", "speedPct"]);

  function number(value, fallback = 0) {
    if (value === null || value === undefined || value === "") return fallback;
    const result = Number(value);
    return Number.isFinite(result) ? result : fallback;
  }
  function checkSlots(source, allowed, name) {
    if (source === null || source === undefined) return {};
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new TypeError(name + " must be an object keyed by equipment slot");
    }
    const unknown = Object.keys(source).filter(key => !allowed.includes(key));
    if (unknown.length) throw new RangeError(name + " has unknown slot(s): " + unknown.join(", "));
    return source;
  }
  function sumKey(sources, key) {
    return sources.reduce((total, value) => total + number(value?.[key]), 0);
  }
  function components({owner = {}, weapon = {}, weaponParts = {}, armor = {}, buffs = {}} = {}) {
    const parts = checkSlots(weaponParts, SWORD_SLOTS, "weaponParts");
    const gear = checkSlots(armor, ARMOR_SLOTS, "armor");
    // The weapon argument must be the base item BEFORE equipment-part bonuses.
    // The adapter is responsible for not passing already-recalculated totals.
    const sources = [owner, weapon, buffs, ...SWORD_SLOTS.map(k => parts[k]), ...ARMOR_SLOTS.map(k => gear[k])];
    return {sources, parts, gear};
  }
  function calculateActorStats(input = {}) {
    const {sources} = components(input);
    const {owner = {}, weapon = {}} = input;
    const flat = Object.fromEntries(FLAT.map(k => [k, sumKey(sources, k)]));
    const pct = Object.fromEntries(PERCENT.map(k => [k, sumKey(sources, k)]));
    // Exactly one multiplier AFTER summing fixed additions and percentage points.
    const scaled = key => Math.max(0, flat[key] * Math.max(0, 1 + pct[key + "Pct"] / 100));
    return Object.freeze({
      maxHp: Math.max(1, number(owner.maxHp, 1) + sumKey([...(Object.values(components(input).gear))], "maxHp")),
      maxResonance: Math.max(0, number(weapon.maxResonance)),
      attack: scaled("attack"),
      defense: scaled("defense"),
      attackSpeed: Math.max(1, (100 + flat.speed) * Math.max(0, 1 + pct.speedPct / 100)),
      critChance: Math.min(100, Math.max(0, flat.crit)),
      penetration: Math.max(0, flat.penetration),
      breakdown: Object.freeze({flat: Object.freeze(flat), permanentPct: Object.freeze(pct)})
    });
  }
  function resolveDamage({damage = 0, critMultiplier = 1, cardMultiplier = 1,
    preDefenseBonus = 0, defense = 0, penetration = 0, temporaryDefense = 0} = {}) {
    const base = Math.max(0, number(damage));
    const preDefense = Math.max(0, base * Math.max(0, number(critMultiplier, 1)) *
      Math.max(0, number(cardMultiplier, 1)) + number(preDefenseBonus));
    const effectiveDefense = Math.max(0, number(defense) - Math.max(0, number(penetration)));
    const afterDefense = Math.max(1, preDefense - effectiveDefense);
    const finalDamage = Math.max(0, afterDefense - Math.max(0, number(temporaryDefense)));
    return Object.freeze({preDefense, effectiveDefense, afterDefense, finalDamage});
  }
  function speedRate(firstSpeed, secondSpeed) {
    const faster = Math.max(1, number(firstSpeed, 100), number(secondSpeed, 100));
    const slower = Math.max(1, Math.min(number(firstSpeed, 100), number(secondSpeed, 100)));
    return Math.min(0.5, (faster - slower) / faster);
  }
  function advanceSpeedGauge(previous, ownerSpeed, enemySpeed) {
    const owner = Math.max(1, number(ownerSpeed, 100));
    const enemy = Math.max(1, number(enemySpeed, 100));
    const faster = owner > enemy ? "owner" : enemy > owner ? "enemy" : null;
    if (!faster) return Object.freeze({faster: null, gauge: 0, extraBasicAttack: null, rate: 0});
    // Clear fractional progress when the faster combatant changes.
    const previousGauge = previous?.faster === faster ? Math.max(0, number(previous.gauge)) : 0;
    const rate = speedRate(owner, enemy);
    const accrued = previousGauge + rate;
    const trigger = accrued >= 1 - 1e-9;
    return Object.freeze({
      faster, rate,
      gauge: trigger ? Math.max(0, accrued - 1) : accrued,
      extraBasicAttack: trigger ? faster : null
    });
  }
  return Object.freeze({SWORD_SLOTS, ARMOR_SLOTS, calculateActorStats, resolveDamage,
    speedRate, advanceSpeedGauge});
})();
if (typeof module !== "undefined" && module.exports) module.exports = WC_COMBAT_MATH_V1;

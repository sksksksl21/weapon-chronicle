# Unified combat calculation (phase 1, non-live)

This specification implements the agreed calculations as testable pure functions in
src/core/combat_math_v1.js. **The current game UI and actual combat still use the
legacy formulas.** This PR does not claim A05 or the full battle redesign is complete.

## Inputs and ownership

- Sword has exactly 8 component slots: blade, guard, tang, grip, wrap, pommel, seat, scabbard.
- Armor has exactly 4 slots: helmet, armor, gloves, boots.
- Owner and weapon supply **base**, not already combined, values.
  weaponParts and armor provide fixed/percentage contributions independently.
  The live adapter must prevent applying the old recalculated weapon or gear bonus twice.
- Enemies use the same calculation with their own actor base and optional equipment.
- HP belongs to owner plus armor max-HP bonuses; max resonance and resonance recovery belong to the sword base plus its eight component bonuses (and explicit passive buffs).
  Live HP/current resonance, mental state, wear and item inventory are **state**,
  not reinitialized by computing a stat preview.
- Attack, defense, speed, crit, penetration are flat contributions.
  attackPct, defensePct, speedPct are permanent percentage *points*.
  Sum each dimension first, multiply **once** by 1 + total percentage/100.
  Default speed is 100. Crit is additive percentage points clamped to 0–100.
  Penetration is nonnegative and additive, not a percentage.

## One exchange

1. Each side gets one existing basic decision/action (attack, guard or evade).
2. Determine faster side from final speed.
3. Faster side gains min(0.5, (fast - slow)/fast) to its extra-basic gauge.
4. On gauge >= 1, schedule exactly one additional **basic attack** and subtract 1.
   With equal speeds the gauge is zero; switching which side is faster also resets the gauge.
5. **Do not** double-apply turn start/end events, draw cards, refresh hand, recover resonance,
   or let the extra attack create an additional card intervention.
   Existing guard, evade and card windows remain coupled to the normal exchange.

## Damage order

1. Base hit * critical multiplier * card multiplier + pre-defense fixed adjustment.
2. Effective defense = max(0, defender defense - attacker fixed penetration).
3. Armor result = max(1, adjusted hit - effective defense).
4. Final damage = max(0, armor result - temporary defense/guard).
5. Keep precise numeric values within this pure engine; choose a **single explicit**
   UI/game-state rounding boundary during live integration.

## Explicitly not yet connected

- Old owner fields are martial/survival/social. Add insight/will and the 5-stat migration,
  owner/death/succession/UI integration, and enemy stat mapping in subsequent PRs.
- Map real 8-part catalog and 4 armor items to fixed and % combat effects; re-evaluate
  equipped parts and passive effects exactly once. Existing equipment catalogs are not
  rewritten in this PR.
- Wire the new computed stats into the actual combat iframe and status panel, preserving
  existing saved actions and card/debate behavior.
- Compare build archetypes, interruptions, death/succession and old save fixtures against
  live runtime in Chromium before replacing any legacy combat formula.
- This PR only establishes deterministic calculation and test fixtures; it is not a
  gameplay change, completed balance pass or Android validation.

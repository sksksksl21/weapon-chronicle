# Legacy game data → unified combat source adapter (phase 2, non-live)

The v5.2 game stores a **recalculated** `state.weapon`. Its power, precision,
toughness, handling, max resonance and resonance recovery ALREADY contain all
eight equipped sword component modifiers (and any upgrades). Also,
`state.maxHp` ALREADY includes current equipped gear max-HP bonuses.
Feeding those totals directly to the new additive math core would double count.

`src/core/legacy_combat_sources_v1.js` creates pure calculation input
without changing the save, the original catalog, a resource balance, or battle
rules. It recognizes exactly eight sword slots and four owner gear slots. It
deducts item part contributions from the existing recalculated weapon totals,
then passes each actual part separately; the sum reconstructs the original
aggregate exactly. It similarly strips the currently equipped item HP bonuses
from an explicitly supplied `totalMaxHp` before the math core adds them back.
Unrecognized legacy part IDs retain their total value in the base weapon; gear
with a mismatched slot is ignored. Neither input nor persistent state is mutated.

### Current one-to-one source-field mapping

| v5.2 weapon/part field | Unified math field |
| --- | --- |
| `power` | `attack` |
| `toughness` | `defense` |
| `handling` | `speed` (relative to baseline 100) |
| `precision` | `crit` (point contribution) |
| `maxResonance`, `resonanceRecovery` | Exact same fields |

Existing armor `defense`, `maxHp`, and any future explicit
`attack` / `speed` / `crit` / `penetration` / percent modifiers are passed
through, subject to the equipped slot check. Current catalog values such as
`evade`, `survival`, `resist` remain **outside** this conversion; they
must not silently turn into a new combat-stat coefficient. The input
`ownerCombat` must contain *gear-exclusive* owner base combat values.
This adapter does **not** decide how martial/survival/insight/will/social
translate to them; no invented balance constants.

`enemyFromLegacy` maps the legacy enemy's base attack, defense, HP, crit,
and any explicit speed/penetration to the same math source shape.

### Validated / pending

- Pure assertions: 8+4 slot input mapping, original sword aggregate
  conservation, HP & resonance conservation, no mutation, invalid gear slot
  ignored, missing older part ID cannot erase existing aggregate, baseline
  enemy shape. See `npm run test:combat-adapter`.
- Not yet wired to `launchStoryCombat`, the combat iframe, card decisions,
  dynamic defense/evasion, per-exchange gauge or main status panel.
- Current gear catalog has no dedicated attack/speed modifiers for gloves and
  boots, respectively. Designing these values and owner five-stat growth is
  pending. Do not advertise full gear rebalancing.
- Integration acceptance requires a browser-testable single-combat handoff,
  damage and speed cases, card/resonance non-duplication, interruption/resume,
  old-save fixtures and a clean build. GitHub Actions infrastructure currently
  fails before test steps; do not mark browser suites as passed.

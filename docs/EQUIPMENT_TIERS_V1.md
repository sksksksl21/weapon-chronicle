# Weapon Chronicle — equipment tiers and rolled pools (DEV)

## Implemented scope
- Sword parts: blade, guard, tang, grip, wrap, pommel, seat, scabbard.
- Armor: helmet, armor, gloves, boots.
- Four source archetypes per slot x five tiers = **20 newly generated entries per slot** (240 new entries).
- Old identifiers and their underlying item records remain intact for existing saves and story gating; additional items are additive.
- A deterministic pseudo-random seed based on each variant ID rolls the base-stat variance. Different catalog variants have different outcomes; acquiring the same ID again retains identical stats. **Independent per-drop instance rolls are not implemented yet**, because legacy inventories count by item ID rather than retaining instance attributes.

## Rarity contract
| Key | Korean | Normal affixes | Unique effect | Stock weight |
| --- | --- | ---: | ---: | ---: |
| common | 노멀 | 0 | no | 58 |
| rare | 레어 | 1 | no | 26 |
| unique | 유니크 | 2 | yes (1) | 11 |
| legendary | 레전더리 | 3 | no | 4 |
| chronicle | 크로니클 | 3 | yes (1) | 1 |

The weights above are used for item-stock selection (not probabilities guaranteed per six-item batch). Existing legacy 'beyond' rarity remains recognized and displayed as Chronicle.

## Stats
- Generated sword parts may roll positive or negative base attack/precision/defense/handling contributions, then get the tier-specific optional affixes.
- Generated armor may roll positive or negative **defensive, HP, evasion, or mobility** adjustments only.
- Never grant armor power/attack, critical chance, penetration or attack-percent bonuses. The same prohibition is applied by the actual legacy combat adapter.
- Boots may affect combat attack-speed through movement, not damage.
- Unique and Chronicle exclusive effects have a name, description, and a real modifier that is consumed by the unified combat math: e.g. sword penetration, resonance recovery, helmet HP, chest defense %, boot speed %.
- Sword-part penetration is a separate source in the adapter when legacy weapon totals have no penetration field. An explicitly aggregated older weapon penetration value is still not counted twice.

## UI and acquisition
- Status / Armor and Weapon tabs show tier-specific outlines; clicks show item description, normal affix count and values, and exclusive effect description.
- Existing smith selection and armor vendor card templates get rarity outlines and additional rolled-property details.
- Existing armor merchant restock is weighted by rarity; existing sword-part market and smith weights use RARITY_DEF.
- Generated item IDs include slot, family index and tier, and therefore survive save/load with no new field added to stored inventories.

## Open follow-ups
- **Legacy originals** keep their old authored modifiers, so legacy items do not automatically acquire the new tier-count contract. The contract is strict for the 240 generated variants.
- Full Android browser interaction, save migration stress test, economy/balance and rarity drop frequency audits remain outstanding.
- Independent same-ID per-copy random stats would require instance-aware inventory records and an explicit migration plan, not silent mutation of the existing save format.

## Verification
- `npm run test:gear-rarity` checks all 240 generated variants, option counts, exclusive effects, weapon/armor separation, unchanged legacy data and build manifest.
- `npm run test:combat-adapter` includes missing-aggregate vs explicit-aggregate sword penetration regression.
- Direct integration evaluation passed for unique weapon penetration and armor defensive effects without modifying existing save objects.

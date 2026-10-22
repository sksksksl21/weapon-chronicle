# Weapon Chronicle — equipment tiers and rolled pools (DEV)

## Implemented scope
- Sword parts: blade, guard, tang, grip, wrap, pommel, seat, scabbard.
- Armor: helmet, armor, gloves, boots.
- Four source archetypes per slot x five tiers = **20 newly generated entries per slot** (240 new entries).
- Old identifiers and their underlying item records remain intact for existing saves and story gating; additional items are additive.
- The 240 static template IDs retain deterministic base rolls. New armor-shop acquisitions can now mint unique copy IDs with independent seeds; each copy can be rehydrated from its own ID on reload without changing the existing inventory shape.

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

## Copy-specific rolls (V1.1)
- Existing 240 `wc5` templates remain immutable; acquiring a generated **armor-shop template** now makes a new `wc6` copy with a distinct compact ID.
- ID encodes slot, family index, tier and randomly seeded copy token. It is not a new save schema: the original ID-keyed stock, inventory and equipped-item fields can store these IDs.
- On load, saved `wc6` identifiers are detected and their deterministic modifiers rebuilt **before** invoking the old load function, then checked after load. Reopening the game does not reroll an existing copy.
- `rollCopy(templateId)` and `restoreCopy(instanceId)` work for **both sword parts and armor**, so upcoming sword crafting and adventure rewards can call one shared mechanism.
- New shop stock excludes already rolled copies to prevent a recursive pool and unbounded fresh templates. Original non-`wc5` legacy equipment stays untouched.
- Shop, smith and modal item cards now receive the appropriate rarity-frame class where their existing markup exposes supported selectors.
- Copy IDs are not interchangeable with deterministic `wc5` template IDs: save/loading or transferring an individual copy must preserve its full ID.

## Open follow-ups
- **Sword crafting and combat/event rewards still need actual grant hooks** that call `rollCopy` on successful acquisition. The core API exists; only new armor-shop stock is wired automatically.
- Inventory duplicates, capacity, buy/equip/discard/refund and persistence must still be exercised against the full browser runtime on Android; this is not a certified playthrough.
- **Legacy originals** retain authored modifiers and do not automatically receive the new tier-count contract.
- Full Android browser interaction, save migration stress test, economy/balance and rarity drop frequency audits remain outstanding.
- Conditional combat triggers for named unique effects are not yet designed; current unique effects are live numeric modifiers.

## Verification
- `npm run test:gear-rarity` includes 240 generated variants, five tiers, independent copy rolls, restart recovery, defensive-only armor and item-frame classes.
- `npm run test:combat-adapter` includes missing-aggregate vs explicit-aggregate sword penetration regression.
- Direct integration evaluation passed for unique weapon penetration and armor defensive effects without modifying existing save objects.

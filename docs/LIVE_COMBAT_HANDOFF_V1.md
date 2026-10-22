# Live combat stat handoff, phase 3 (partial integration)

## What changed
- The real `launchStoryCombat` entry point now computes one stat snapshot from the current owner, recalculated sword (8 parts) and four validated gear slots.
- `WC_LEGACY_COMBAT_SOURCES_V1` decomposes aggregated weapon totals and reproduces capped owner HP. `WC_COMBAT_MATH_V1` combines base/part/gear modifiers once.
- The source only transmits the preview in `combatFrame.dataset.unifiedActorV1`. It is cleared at encounter completion. Existing card, defense/evasion, damage, encounter results and save checkpoint A remain unchanged.
- Owner martial/survival combat contributions use the existing effective attributes, with old sword-fit and armor-survival portions stripped out to prevent double counting. No new 5-stat growth curve or enemy balance is invented.

## Validation
- Direct JavaScript VM execution: source parses, fixed/percent aggregation, HP normalization, wrong-slot gear rejection, original launcher invoked once, transient frame data removed.
- Reproducible Node fixture: `npm run test:combat-handoff`.
- **Browser gameplay and full build not certified.** The account's GitHub Actions budget is exhausted and automatic CI is disabled.

## Build artifact limitation
- `index.html` is a generated ~10 MB blob; the GitHub connector rejected its direct rewrite due to transport size.
- `npm run dev` now rebuilds it from source before serving, so the local development entry point uses this handoff when run.
- The checked-in root `index.html` may remain stale until `npm run build` is executed and the output committed from a Git-capable environment. Do not treat the repository's existing root HTML as evidence of this feature.

## Next stage
1. Determine the enemy stat mapping from its actual encounter catalog and feed both actors through the same math contract.
2. Connect attack/defense/critical/penetration math to real damage while preserving base hit/evasion and card timing.
3. Integrate per-exchange speed gauge (basic attack only, no extra card/resonance recovery).
4. Browser-check one complete encounter, loss/resume, and save/owner succession after the generated bundle is current.

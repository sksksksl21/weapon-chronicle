# Live combat stat handoff, phase 3 (partial integration)

## What changed
- The real `launchStoryCombat` entry point now computes one stat snapshot from the current owner, recalculated sword (8 parts) and four validated gear slots.
- `WC_LEGACY_COMBAT_SOURCES_V1` decomposes aggregated weapon totals and reproduces capped owner HP. `WC_COMBAT_MATH_V1` combines base/part/gear modifiers once.
- The source only transmits the preview in `combatFrame.dataset.unifiedActorV1`. It is cleared at encounter completion. Existing card, defense/evasion, damage, encounter results and save checkpoint A remain unchanged.
- Owner martial/survival combat contributions use the existing effective attributes, with old sword-fit and armor-survival portions stripped out to prevent double counting. No new 5-stat growth curve or enemy balance is invented.

## Validation
- Direct JavaScript VM execution: source parses, fixed/percent aggregation, HP normalization, wrong-slot gear rejection, original launcher invoked once, transient frame data removed.
- Reproducible Node fixture: `npm run test:combat-handoff`.
- Local `python3 tools/build.py`, `node tests/live_combat_handoff_v1.js`, and `python3 tools/verify_baseline.py` passed on 2026-10-22.
- Generated index SHA256: `d67c2355c8939a1327d993256948df541a22f1b25ba82b4a36503a077a96c67f`.
- Browser gameplay is not yet certified. GitHub Actions was not invoked.

## Generated artifact
- The generated root `index.html` was rebuilt and uploaded through Git blob/tree APIs; its Git blob SHA matches the locally verified build.
- `npm run dev` also rebuilds before serving.

## Next stage
1. Determine the enemy stat mapping from its actual encounter catalog and feed both actors through the same math contract.
2. Connect attack/defense/critical/penetration math to real damage while preserving base hit/evasion and card timing.
3. Integrate per-exchange speed gauge (basic attack only, no extra card/resonance recovery).
4. Browser-check one complete encounter, loss/resume, and save/owner succession after the generated bundle is current.

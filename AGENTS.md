# Weapon Chronicle — Codex working agreement

## Project identity and hard constraints
- This is the Odyssey-based, weapon-centered monthly life simulation RPG. The sword / Legend Core and its succession history are the protagonist; do not restore Raon as a fixed hero.
- First release: offline-capable Android game, APK for testing and AAB for Google Play. Source remains a web game; APK is a generated artifact, not a separate source of truth.
- Main story: five acts, 40 chapters. Historically divergent Odyssey outcomes are allowed and must cause subsequent causal changes. Four existing world-history outcomes are baseline behavior, not final sword endings.
- Final direction: twelve Princess Maker-like sword fates including good/ordinary/bad/tragedy; the game continues in the resulting world after main-story ending unless the sword has permanently broken or been lost. Sword endings not yet implemented in v5.2.
- Character art, items, backgrounds, and cutscenes must use the same high-resolution, deliberate pixel-art style. Current embedded assets are transitional; do not claim all art is final.
- Monthly choices: contract, exploration, investigation, rest. Mental maximum is 100. Owner death permits succession; no voluntary succession.
- Combat: owner performs automatic actions, sword intervenes using one-off memory cards; retain card discards, resource costs, and readable rounded percentage display. Debate is a separate rock-paper-scissors-like duel with one-use tactical skills.
- Sword: eight configurable parts, matching actual displayed composite and derived stats; equipped parts not counted as spare inventory. Armor: four wearable slots; independent capacity categories.
- Removed owner 'resonance conversation' entry remains removed; contact visitation opens NPC selection/direct conversation. Sword combat resonance resource remains.
- Mobile UX: four top links (GOLD, MAIN, status, inventory), owner/weapon and local services, action choices opening mission candidates. Preserve previously agreed shop part filtering and phone-friendly layout.
- Save policy A: on interruption inside a mission, combat or debate, recover at the beginning of that action, never double-pay rewards. The checkpoint may be removed only once durable commit succeeds. Preserve prior save keys and migration.

## Before changing code: internal roundtable
For each task internally evaluate: game design/causality, narrative, UI/art, engineering/migration, and adversarial verification. Reject unnecessary abstraction, duplicate systems, scope creep, and changes inconsistent with the above. Surface a concise accept/partial/decline decision on material proposals; only ask the user when an important design choice is actually unresolved.

## Engineering workflow
1. Read README.md, docs/DECISIONS.md, docs/ARCHITECTURE.md, docs/ROADMAP.md, docs/SAVE_COMPAT.md and the relevant source/tests.
2. Use one Git branch per feature/fix. Change only source-of-truth files under src/ and documented tests; build index.html via `python3 tools/build.py`. Do not edit generated index.html directly unless fixing the build pipeline.
3. Legacy `src/legacy/game_runtime.js` is large and partially monolithic. Avoid a speculative rewrite. Migrate one behavior at a time with equivalence tests and observable progress.
4. Keep function/script load order unless validated otherwise. No duplicate declarations, hidden overriding, or unrelated UI theme changes.
5. Tests: `npm run build`, `npm run check`, `npm run test:smoke`; for story/history use `npm run test:story`; run narrower tests if a test is environment-blocked. Record exactly what ran and passed.
6. Validate old saves, checkpoint recovery, a mission completion, combat/debate, death/succession when those areas are touched. Never infer all-game completion from a small smoke test.
7. Preserve the baseline `legacy-v5.2` Git tag and the hash record in docs/BASELINE.md. Keep PRs small; describe modified behavior, validation, untested paths, and migrations.

## Non-goals during Codex migration
- Do not introduce a framework, TypeScript rewrite, Rust backend, cloud save, network features, monetization, or new story content during pure structural migration without a separately approved change.
- Do not duplicate the enormous bundled HTML in every source module; `index.html` is generated. Preserve final offline packaging.
- Do not promote historical auto-simulation test results to exhaustive human playthrough claims.

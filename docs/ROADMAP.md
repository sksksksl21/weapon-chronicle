# Release roadmap / quality gates

**Completed prior baseline:** v5.2 world historical divergence across 40 chapters (4 world history outcomes); act-one aftermath and main-path save/checkpoint policies implemented with targeted regression tests. Coverage is not exhaustive.

1. **Migration M0 (this repository):** v5.2 source preserves output; Git, AGENTS.md, Codespaces, deterministic build, smoke/regression tests. Release gate: no gameplay changes.
2. **Migration M1:** game data/content extracts from legacy runtime in small PRs. Each PR must preserve story IDs, item IDs, save keys, and game decisions.
3. **v5.5:** 12 sword-fate endings separate from 4 world-history endings; owner life retrospectives and end-of-main continue-play handling. Gate: every ending reproducible under explicit fixtures.
4. **v6.0:** monthly gameplay, combat and debate balance; credible win/loss/retreat and permanent break risks. Gate: adverse as well as successful paths.
5. **v7.0:** large Odyssey-compatible substory pass and consequences; gate: no dead-end mandatory clues.
6. **v8.0:** comprehensive unified pixel art and UI audit, no cutscene-cropped placeholder equipment; gate: Android screen matrix.
7. **v9.0:** Capacitor APK beta, offline use and save migration; gate: real-device Android tests.
8. **RC / v1.0:** complete path, cross-version saves, no release blocker, Play AAB publication.

Priority: a verified and maintainable game over adding unnecessary abstraction or speculative systems.

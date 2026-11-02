# Confirmed design decisions (binding)

| Field | Decision |
|---|---|
| Primary source | Web game, output Android APK testing then Google Play AAB |
| Source management | GitHub + Codespaces + Codex, Git is sole source of truth |
| Main content | 5 acts, 40 chapters; Odyssey historical outcomes may diverge |
| Player perspective | Weapon and its succession, not a permanent human lead |
| Main history endings | Four world-history outcomes in v5.2; future story consequences remain expandable |
| Sword endings | 12 Princess Maker-inspired good/neutral/bad/tragic fates — **planned, not present in v5.2** |
| Beyond ending | Continue monthly play in established world after ending; irreversible sword loss/break stops play |
| Art | Unified high-resolution polished pixel art; transparent sprites and genuine standalone item/weapon art |
| Combat/debate | Keep existing memory card interventions / card discard; separate argument duel; character placement stays fixed during effects |
| Monthly play | Contract, exploration, investigation, rest; monthly candidates; forced MAIN investigation should never deadlock |
| Owner & weapon | Death-only succession, weapon parts compose visually and mechanically, owner equipment persists by ownership rules |
| Status & inventory | Four fixed top navigation links; independent bag capacities; menu art must not break mobile layout |
| Visit | Direct contact list/conversation; no obsolete owner-resonance intermediary menu |
| Interrupt recovery | Policy A: restart current action; no duplicate settlement; checkpoint deleted only after durable save |

Do not infer new requirements from legacy accidental UI/code. When old implementation conflicts, identify and report gap before altering rules.

## 2026-11-03 — Unified dark-fantasy UI skin (dev)

- User requested a refined, consistent UI across Weapon Chronicle. Inspiration: Darkest Dungeon II's restrained gothic surfaces and Slay the Spire's readable action hierarchy; do not copy any game's UI artwork, textures, code, layout screenshots, names or protected assets.
- Preserve current high-resolution pixel-art intent and the existing dark navy/brass direction. Use one shared token-based theme for the main hub, status/equipment, inventories, merchant/service cards, story choices and cinematic view; use a matching combat-only stylesheet in the battle iframe.
- Primary styles: `src/ui/unified_theme_v8.css` and `src/ui/combat_theme_v8.css`. The offline assembler `tools/build_sources.py`, `play-dev.html` and `dev-play.html` all inject the same source CSS **last**, keeping legacy history and behavioral modules intact.
- The older generated `index.html` is not regenerated/committed by this source change; source-built `play-dev.html` is the intended first viewing path. Do not equate CSS source commits with verified mobile visual output.
- No changes to progression, combat stats/turn handling, layout structure, persistent save schema, original sprites, approved V2-managed art pipeline or `main`.
- Focused source-build checks: `python3 -m unittest discover -s tests -p test_ui_theme_v8.py`. **GitHub code written; Python check, browser mobile inspection and full QA not yet run.** This visual skin is not completion of the later comprehensive v8.0 pixel-art audit or Android device matrix.

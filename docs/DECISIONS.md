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

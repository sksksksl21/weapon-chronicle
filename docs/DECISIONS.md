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


## 2026-11-03 — 모듈 분해 및 유기적인 기능 연결 (dev)

- 기존 게임을 폐기하거나 처음부터 만들지 않는다. 게임 모듈 경계는 파일 분리만이 아니라 소유 데이터·API·연계·저장·검증을 포함한다.
- \`src/module_manifest.json\`이 실행 순서와 선행 모듈 관계의 유일한 원본이다. Python 오프라인 빌드와 두 개발판은 같은 명세를 읽는다.
- \`core/module_services_v1.js\`는 API 등록 및 요구만 한다. 게임 상태를 복제하지 않는다. 장비 공급자 1개를 상점·상태창이 공유한다.
- 레거시 게임 상태, 아이템/장비 ID, 최신 전투 스탯 결정, 스토리와 체크포인트 정책 A, main 브랜치를 유지한다.
- 다음은 소유자·장비/스탯 → 행동/보상 → 적/전투 → 스토리/NPC → 저장/모바일 순으로 기능 단위마다 점진적으로 분리한다.
- 이번 구현은 코드와 집중 테스트 정의 반영이며 Windows 빌드/Node 테스트/휴대폰 실제 플레이 PASS로 판정하지 않는다. 자세한 대상은 \`docs/MODULE_MAP.md\` 참조.

## 2026-11-08 — 세로형 전투 HUD 시각 개선 (dev, 실제 단말 미검증)

- 사용자 참고 이미지는 세로형 화면에서 적을 크게 보여주고 상단에 보스 HP, 하단에 행동 선택을 집중하는 **구도 참고 자료**이며, 이미지를 복제하거나 외부 게임 UI/리소스를 그대로 도입하지 않는다.
- 실제 전투 HTML과 전투 전용 CSS를 확인한 결과 현행 전투는 HP/공격 확률/적 AI 전조, 10장 장비 덱 중 손패, 공명, 오버드라이브, 소모품, 카드 버리기, 연대기, 턴 실행이 이미 연결됨. 독립된 4개 버튼 전투 규칙으로 갈아엎지 않는다.
- src/ui/combat_theme_v8.css: 적 이름·붉은 HP 강조 → 소유자 HP/턴 → 확대된 전장 → 2열 기억카드 선택 → 턴 실행의 순서를 명확히 했다. 적 53%(거대종 55%), 소유자 30%의 독립 고정 레인 사용.
- 기존 적 행동 확률과 AI 이유는 상단 스크롤 영역, 공명·OVERDRIVE·소모품·버리기·전투 로그는 하단 스크롤 패널에서 접근 가능. 좁고 짧은 화면 CSS 분기 추가.
- tests/test_ui_theme_v8.py에 배치 셀렉터, 기존 조작 ID 및 전투 수식 include의 정적 회귀 검사를 추가했다. 실제 터치·이미지 렌더링·승패 흐름은 미검증이다.
- 전투 계산, 장비/저장/계승, 승인 아트 manifest, main 브랜치는 수정하지 않았다. 참고 이미지 속 기마 기사/배경 이미지는 게임 아트 에셋으로 추가하지 않았다.
- 게임 dev 스타일 커밋: e688ae736bf2492a5835cce41aff0bc0cbd7ade8. 회귀 검사 커밋: 1c13da558853b786969078bd1e2d7c9741dd60e3.

---
## 2026-11-05 — V3 장비 파츠 옵션의 최종 스탯 미리보기 연결 (dev)

- 이미 존재하는 `equipmentPreviewHtml({kind:"weapon",slot,id})`를 구형 `partDeltaHtml` 및 파츠 선택 UI에 연결한다. 구형 파츠 옵션만 서로 빼던 `wcPartContribution`의 별도 계산 경로는 제거한다.
- 변경 전후 수치는 이미 구현된 `WC_COMBAT_MODULE_V1.previewEquipment` → `wcDirectCurrentStats` 경로로 계산한다. 새로운 계산 엔진이나 발휘율 계수를 만들지 않는다. 원래 장비 ID·검 8파츠·소유자 입력·저장/계승 데이터·전투 동작을 보존한다.
- 기존 함수의 진입점은 유지하며 잘못된 아이템은 기존과 같이 빈 결과를 반환한다. 미리보기를 계산할 수 없는 상황에서 구형 스탯을 최종값처럼 표시하지 않고 안내한다.
- 관련 격리 UI 위임 회귀 단정은 `tests/live_combat_handoff_v1.js`에 추가했다. GitHub 소스 변경만으로 Windows 모바일 실사용 또는 전체 V3 기능 완료를 주장하지 않는다.
- 기존 V2 자동개발 Goal/Task/Package와 실행/통합 증거는 이 외부 소스 변경으로 자동 승인하지 않는다. 이후 V2의 기존 원격 증거 조정 절차를 그대로 따른다.

---

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

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


## M1 기능별 분리 진행 (2026-11-03)

- [x] 17개 스크립트의 단일 실행 순서/선행 의존 명세
- [x] 장비 모듈 → 상점/상태창 공용 인터페이스 적용
- [ ] 실제 Python/Node 테스트 및 Windows/모바일 실사용 확인
- [ ] 소유자·능력치·무기 8부위·방어구 4부위·가방 인터페이스
- [ ] 의뢰/탐험/조사/휴식·보상/위험 정산 인터페이스
- [ ] 적 데이터/난이도·전투·스킬·카드·결과 정산 연결
- [ ] 40장 스토리·NPC·선택·후속 이벤트 데이터/판정 분리
- [ ] 저장/복구·개발 도감·모바일 화면 상태 연결

\`docs/MODULE_MAP.md\`에 기존 코드와 나머지 분리 범위를 기록한다. 기존 로드맵/완료 성과/기존 PASS는 유지한다.

## M1 장비·경제 연결 코드 (2026-11-04)

- [x] 상인 서비스와 별도 경제 모듈 등록, 모듈 라이프사이클 및 전투 보상 구독 연결 (`src/core/economy_rewards_v1.js`)
- [x] 명시적 장비 재고 보상 입력의 검증·중복 방지·기존 판매 이력 보존
- [ ] 실제 전투 종료에서 아이템 보상이 발생할 때의 생산자 연결 및 사용자 게임 실사용 검증 (현재 `combat-experience` 이벤트 외 아이템 드롭 없음)
- [ ] Windows/Node 원본 테스트, 전체 빌드, 이전 저장 호환 실제 검사
- [ ] V2 내부 기존 작업 ID의 원격 통합 증거 및 상태 정합 (GitHub 외부 구현을 완료 판정으로 대체하지 않음)

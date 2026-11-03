# Weapon Chronicle — 모듈 지도 및 단계별 분리 계약

기준: 2026-11-03 · 대상: `dev` · **진행 중** (전체 모듈화 완료 선언 금지)

## 핵심 원칙

- **모바일 우선, 저장 호환성 우선:** 수년간 누적된 `src/legacy/game_runtime.js`를 통째로 교체하지 않는다. 실제 동작을 기능 단위로 분리하고 해당 기능의 회귀 검사 후 이전 진입점을 위임한다.
- 한 기능의 상태·데이터 계산에는 **한 소유자**만 둔다. UI는 표시·명령 전송, 게임 규칙은 판정, 저장은 영속화를 책임진다.
- `main`, 기존 게임/퀘스트/아이템/스킬 ID, 120개월 진행 및 배경 기록, 소유자 사망 후 계승, 기존 SAVE_KEY와 중단 복원 정책 A는 유지한다. 이미 승인된 공격 8개/방어 6개와 상태 탭 순서 정책은 새 구조에서도 우선한다.
- 레거시 호환 함수는 **위임용 어댑터**로 남기며 기능을 새 모듈로 분리할 때 계산과 저장을 이중 적용하지 않는다. 이전 저장파일 자동 덮어쓰기·파괴적 마이그레이션을 금지한다.
- 전투 iframe은 독립 실행 문서다. 상위 화면과 데이터는 기존 `live_combat_handoff` 경유, 이벤트/메시지는 출처·정해진 유형을 확인하고 한번만 정산한다.
- 플레이 가능한 `dev`를 유지한다. 새 모듈은 빌드 목록 1곳과 관련 테스트만 수정하고, 매번 모든 검사를 재실행하지 않는다.

## 2026-11-04 / 장비·경제 모듈과 전투 보상 이벤트 연결 — GitHub dev 구현

- 기존 `equipment_pool_v1.js`의 장비 등록 서비스, `merchant_stock_v1.js`의 재고 생성·구매 화면 호환 기능은 보존. 상인을 `merchant` 서비스로 명시 등록하고 신규 `core/economy_rewards_v1.js`를 별도 `economy` 라이프사이클 모듈로 등록.
- 게임 부트스트랩은 **기존 저장 로드와 첫 화면 준비 후** `WC_GAME_MODULES_V1.initialize()`를 호출한다. 이전에는 모듈 정의만 있었고 초기화가 호출되지 않아 `combat:reward` 구독이 활성화되지 않았음.
- 경제 모듈은 `combat:reward`를 구독하되 **기존 전투 경험치(`kind=combat-experience`)는 건드리지 않는다.** 아이템이 명시된 `kind=equipment-loot` 이벤트의 `id`, `armor`, `sword`를 상인에게 전달하고, 실제 카탈로그에 존재하는 장비만 기존 `state.marketV24.armor`·`state.smithPartStock`에 중복 없이 추가한다. 기존 `sold` 이력/판매 아이템은 그대로 유지하며 재고 변경 시에만 `saveGame` 1회 호출.
- **범위 한계:** 현재 전투 모듈이 실제로 발행하는 보상은 `combat-experience` 유형이다. 신규 `equipment-loot` 이벤트는 향후 실제 전투 보상 데이터 생산자가 전달할 때만 재고에 반영한다. 사용자 승인 없이 전투 승리 때 무작위 아이템/금화를 새로 생성하거나 전투 밸런스를 바꾸지 않았다. 따라서 전체 장비 드롭 실사용 완성이라고 판정하지 않음.
- 새 테스트 `tests/economy_rewards_v1.js`는 이벤트 구독·중복 방지·저장 1회·판매 이력 보존·종료 시 구독 해제 계약을 다룬다. 실제 GitHub 소스 기반 별도 격리 JS 실행 10항목 PASS, **Node 전체 테스트/빌드/Windows 모바일 실사용은 NOT_RUN**.
- 해당 코드 변경은 V2 내부 `task_f74db38aead278da45e31794` 실행 기록과 별도 GitHub 외부 구현이다. V2의 과거 `ready` 상태를 `completed`로 강제로 변경하거나 완료 6/7로 보고하지 않는다. 원격 dev 변경 내역을 V2 추적과 정합 처리해야 한다.

---

## 현재 실제 경계 (첫 적용)

`src/module_manifest.json`은 **유일한 실행 파일 목록/선행 의존성 명세**이다. `tools/build_sources.py`, `play-dev.html`, `dev-play.html`이 이 목록을 읽고 기존 순서대로 단일 오프라인 HTML/모바일 개발판을 생성한다. 잘못된 모듈 ID, 경로, 선행 관계는 조립 전에 거부한다. 비즈니스 로직은 변경하지 않았다.

`src/core/module_services_v1.js`는 이미 존재하는 장비 시스템의 **서비스 인터페이스**를 노출한다:
- 장비 공급자 `src/core/equipment_pool_v1.js` → `WC_GAME_MODULES_V1.register("equipment", WC_EQUIPMENT_POOL_V1)`
- 상점 소비자 `src/core/merchant_stock_v1.js` → `WC_GAME_MODULES_V1.require("equipment")`
- 상태창 소비자 `src/core/status_skilldeck_v1.js` → 동일한 장비 서비스의 설명 형식 사용 (레거시 독립 검사 환경에만 이전 전역 변수 호환)
- 서비스 등록 중복/미등록은 명시적 오류. 별도 아이템 DB나 게임 상태 복제는 없음.

**이것은 장비·상점·상태창 연결의 첫 리팩터링이며, 모든 레거시 전역 변수/함수가 제거됐다는 뜻은 아니다.**

## 전체 분리 대상과 연결 경로

| 분야 | 실제 코드 또는 이전 진입점 | 목표 경계 / 연결 | 상태 |
|---|---|---|---|
| 런타임·부트 | `legacy/game_runtime.js`, `legacy/bootstrap.js` | 시작 순서·공통 상태 연결만 담당 | 레거시 호환 유지 |
| 모듈 정의·조립 | `src/module_manifest.json`, `tools/build_sources.py` | 단일 의존성 그래프 → 모든 실행판 | **이번 구현** |
| 서비스/API 연결 | `core/module_services_v1.js` | 명시적 API 등록/요청, 중복·누락 거부 | **이번 구현** |
| 소유자·계승 | 레거시 주인·사망·능력치 함수 및 `status_skilldeck_v1.js` | 소유자 데이터 → 판정 → UI / 사망 결과 → 저장 | 추가 분리 필요 |
| 무기·8부위 | `equipment_pool_v1.js`, 레거시 파츠 목록 | 아이템 정의·선택과 파츠 조립/능력치 분리 | 일부 분리 |
| 방어구·4부위 | `equipment_pool_v1.js`, 레거시 장착 | 방어구 데이터와 효과·보유 수량 단일 관리 | 일부 분리 |
| 상점·대장간 | `merchant_stock_v1.js`, 레거시 구매 함수 | 장비 API → 구매 검증 → 단일 재화 정산 → 저장 | **장비 연결 이번 구현**, 결제 분리 미완료 |
| 상태창·스킬 | `status_skilldeck_v1.js` | UI → 장비·능력치·스킬 API, 직접 데이터 복사 금지 | **장비 연결 이번 구현**, UI 본체 추가 분리 필요 |
| 전투 핵심 | `combat_math_v1.js`, `direct_combat_stats_v2.js` | 수치 계산은 단일 출처, 사용자가 확정한 최신 스탯 적용 | 일부 분리 |
| 전투 연결 | `direct_combat_runtime_v2.js`, `live_combat_handoff_v1.js` | 소유자/장비 계산 → iframe 입력 → 전투 결과 | 일부 분리, 실사용 확인 필요 |
| 전투 화면/카드 | `combat/story_combat.html` | 전투 표시·카드 사용·판정·적 AI 분리 | 추가 분리 필요 |
| 스토리/대화 | `story/main_chapters_v47.js`, `history_branch_v50.js`, `act1_history_v52.js` | 콘텐츠 DB → 분기 조건 → 결과/기록 | 일부 분리 |
| 월간 행동/의뢰/탐험/조사 | 레거시 월간 진행·미션 후보 함수 | 행동 제안 → 결과 → 보상/위험 → 다음 달 | 추가 분리 필요 |
| 적·난이도 | 레거시 적 데이터와 `combat/story_combat.html` | 적 원본 DB → 난이도 계산 → 전투 표시 | 추가 분리 필요 |
| 저장·복원 | `save_ledger_v48.js`, `action_checkpoint_v482.js`, `checkpoint_v483.js` | 단일 저장·보상 중복 방지·정책 A | 부분 구현 |
| 화면 공통 테마 | `ui/unified_theme_v8.css`, `ui/combat_theme_v8.css` | 메인/전투 공통 디자인 토큰, 원본 아트 보존 | CSS 분리 |
| 도감·개발 정보 | 현행 게임 데이터·시각 정보 | 실제 데이터만 모아 개발 현황/연결 관계 표시 | 미착수/미확인 |
| 품질/배포 | `tests/`, `tools/build.py`, GitHub `dev` | 작은 회귀 테스트 → 모바일 실행 → dev 통합 | 기반 존재, 현장 확인 별도 |

## 다음 리팩터링 순서 (기존 로드맵 보존)

1. **소유자/무기/방어구/스킬 및 상태 화면**: 단일 데이터 API, UI는 읽기 전용 모델과 명령 사용. 기존 캐릭터·파츠/방어구 ID 유지.
2. **월간 행동과 의뢰·탐험·조사**: 결과·선택·실패/성공·보상 정산을 독립시켜 스토리·전투와 연결.
3. **적 DB·난이도·전투 엔진**: 적 종류/지역/난이도를 데이터로 확장 가능하게 분리; 기존 전투 규칙과 최신 스탯 통합 우선.
4. **스토리 분기·이벤트·NPC**: 40장 및 4개 기존 역사 결과를 보존하고 새 이벤트를 추가해도 저장 기록이 호환되도록 연결.
5. **저장·복원과 UI 노출 전반**: 상태 동기화/인벤토리 단일화·이중 정산 방지, 모바일 장면별 확인.
6. **도감·데이터 추적**: 장비/적/스킬/이벤트 원본과 구현 현황을 실제 저장소 기반으로 조회.

한 번에 하나의 기능 변경만 진행하고, 완료된 모듈의 기존 검사 기록은 재사용한다. 다음 기능을 시작하기 전에 `docs/DECISIONS.md`와 기존 성공/실패 기록을 다시 확인한다.

## 이번 변경의 검증 범위

- 집중 검사 준비: `tests/test_module_manifest_v1.py`, `tests/module_services_v1.js`, `tests/merchant_stock_v1.js`, `tests/equipment_pool_v1.js`.
- 권장 명령: `python3 -m unittest discover -s tests -p test_module_manifest_v1.py`; `node tests/module_services_v1.js`; `npm run test:merchant`; `npm run test:gear-rarity`.
- 정적 JS 문법 검사 결과는 실행 회귀 검사나 실제 모바일 플레이가 아니다. **사용자 Windows 환경에서 위 Python/Node 게임 테스트 및 실제 저장/상점/전투 플레이를 완료했다고 주장하지 않는다.**

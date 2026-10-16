# v5.2 기준본 구조 감사 및 자동 회귀검사

- 대상: Issue #1, `main`의 `c11b2f171739fa242a7c6013393a8be31cdce609`.
- 실행일: 2026-10-16 (KST). 기능·UI·서사·아트·저장 키·스키마 변경 없음.
- 근거: AGENTS.md, README.md, DECISIONS / ARCHITECTURE / ROADMAP / SAVE_COMPAT / BASELINE, 실제 소스 및 테스트.

## 원탁 검토 결정

| 관점 | 판단과 결정 |
|---|---|
| 게임 기획·인과 | **수용**: v5.2 동결, 무기/계승 중심·월간 네 선택·정신 100·사망 후 계승 보존. v5.5 및 12 검 운명 구현은 **거절**. |
| 서사 | **수용**: 5막 40장, 네 세계사 결과와 이후 인과 보존. 자동 시뮬레이션을 수동 완주로 해석하지 않음. |
| UI·아트 | **수용**: 기존 UI·픽셀 아트·방문 및 상점 동작 유지. 모바일 회귀는 허브 폭 검사에 한정. |
| 엔지니어링·마이그레이션 | **수용**: 기존 빌드 CI 유지, smoke/regression/story 독립 CI 추가. 런타임 분리는 **부분 수용**: 다음 PR 계획만 제시. |
| 적대적 검증 | **수용**: 실패 주입 및 저장 경계 감사. 복구 쓰기 실패 문제는 별도 P1 수정으로 분리하고 이번에는 동작을 바꾸지 않음. |

## 파일 인벤토리와 경계

수치는 파일의 실제 UTF-8 바이트 수이며 줄 수는 개행 기준이다.

| 파일 | 바이트 / 줄 | 책임·경계 |
|---|---:|---|
| `src/legacy/game_runtime.js` | 9,608,041 / 6,199 | IIFE 시작, 공유 state, 데이터·내장 이미지·월간 행동·UI·전투·설전·구버전 호환 및 래퍼. 모듈별 독립 로딩 불가. |
| `src/legacy/html_before_script.html` | 707,298 / 846 | HTML·CSS·내장 자산 |
| `src/core/save_ledger_v48.js` | 4,842 / 87 | 저장 검증·백업·추가형 이력 원장, 옛 역사 추정 금지 |
| `src/core/action_checkpoint_v482.js` | 4,097 / 73 | 행동 시작 스냅샷, 달/계승/저장 래퍼 |
| `src/core/checkpoint_v483.js` | 3,218 / 63 | 확정 저장 증명, v482 복구/삭제 함수 대체, 초기화 보호 |
| `src/story/history_branch_v50.js` | 23,827 / 215 | 9–40장 역사 분기·네 세계사 결과 |
| `src/story/world_aftermath_v51.js` | 18,378 / 70 | 세계사 후속 퀘스트·NPC 반응 |
| `src/story/act1_history_v52.js` | 16,927 / 153 | 1–8장 역사·후속 결과와 이후 장 연결 |
| `src/legacy/bootstrap.js` | 163 / 4 | 최종 초기화·load 또는 genMonth, IIFE 종료. 반드시 마지막. |
| `src/legacy/html_after_script.html` | 21,903 / 124 | 후행 문서 마크업 |
| `index.html` | 10,408,720 | 생성되는 오프라인 배포물. 직접 수정 금지. |
| `combat_story.html` | 3,033,366 | 별도 추적 중인 HTML. 현재 build 및 위 테스트가 읽지 않는 독립 자산. 기준 index와 동일 복제본은 아님. 사용/배포 경로 확인 전 삭제 금지. |

빌드 순서는 위 JS 8개 파일의 표 순서이며 header → `<script>` → JS를 개행 결합 → footer이다. 새 번들러나 외부 자산 요청을 추가하지 않았다. runtime 안의 이미지 data URI 문자열은 약 4,683,868문자다(정규식 집계, 디코딩 크기/고유 이미지 수 아님). 큰 파일을 전부 실행 로직으로 해석하면 안 된다.

### 중복·덮어쓰기 조사

- 임시 Acorn 8.15.0 AST 감사: 결합 JS의 함수 선언 397개, 동일 어휘 스코프의 동명 함수 선언 0개. 함수/블록별 스코프를 구분했다. 파서는 작업용 디렉터리에만 설치했고 프로젝트 의존성으로 추가하지 않았다.
- 선언 중복과 별개로 이름에 대한 직접 대입 횟수: `loadGame` 11, `genMonth` 4, `completeDeathSuccession` 3, `startStory` 1, `advanceCalendar` 1, `saveGame` 1. 별칭 `_v*`로 이전 구현을 감싼 호환 계층과 v483의 명시적 대체가 존재한다. 모두 불필요한 중복이라며 삭제하면 안 된다.
- `STRUCTURE_AUDIT.md`의 371개는 과거 v4.8.1 기록으로 현재 수치가 아니다. 언급된 `DEDUPE_REPORT.json`은 현 트리에 없다. 위 검사는 의미상 중복 로직이나 동적 속성 대입까지 부재함을 증명하지 않는다.
- `tools/build.py`와 `tools/verify_baseline.py`에 같은 빌드 순서가 중복 기재된다. 현재 두 목록은 일치한다. 작은 후속 공통화 후보이나 이번 PR에서는 변경하지 않았다.

## 실행 명령·결과

환경: Linux cloud, Node v24.19.0, Python 3.12.14, Playwright 1.62.0, `/usr/bin/chromium`. Python Playwright 및 시스템 Chromium이 이미 설치되어 추가 설치 없이 실행했다. CI는 기존 기준대로 Node 22 / Python 3.11을 사용한다. 실행 환경 버전 차이는 CI 결과와 별개다.

| 명령 | 이번 실행 결과 | 관측 범위 |
|---|---|---|
| `npm run build` | PASS | 결정적 결합, index SHA 일치 |
| `npm run check` | PASS | 소스/생성물 텍스트 동등성 및 전체 JS `node --check` |
| `npm run test:smoke` | PASS | 390px 허브의 6개 메뉴, 휴식 실제 선택→2월, 체크포인트 제거, JS 오류 없음 |
| `npm run test:regression` | PASS, 13/13 | 아래 저장 경계 및 320/360/390px 허브 폭 |
| `npm run test:story` | PASS, 7파일 177/177 | 아래 파일별 결과. 첫 실패 시 스크립트는 중단하도록 유지. |

초기 sandbox 실행에서는 세 브라우저 명령 모두 Chromium 시작의 `setsockopt: Operation not permitted` / SIGTRAP로 실패했다. story는 첫 파일에서 중단했다. 실행 권한을 확장하여 같은 명령을 다시 실행한 위 결과가 최종 결과다. 게임 실패를 테스트 제외로 숨기거나 실행 플래그를 바꾸지 않았다.

| story 파일 | 통과 | 의미 |
|---|---:|---|
| `history_v50.py` | 17/17 | council/fracture 자동 장 진행, 분기 선택 UI |
| `history_edges_v50.py` | 6/6 | restored/exile 저장 재로딩, CH38 협상 전투 우회, 과거 완료 이력 보존 |
| `aftermath_v51.py` | 29/29 | 후속 퀘스트·NPC 반응·레거시 결과 비추정 |
| `aftermath_routes_v51.py` | 45/45 | 8개 분기 후속 경로와 council 이후 퀘스트 |
| `act1_history_v52.py` | 39/39 | 1막 8장 이력, 실패 대안, 이후 인과, 일부 실제 선택 클릭 |
| `act1_followups_v52.py` | 35/35 | 4개 후속 퀘스트 클릭 완료·월 확정·재시작 후 반복 금지 |
| `act1_ending_v52.py` | 6/6 | 1–8장 및 9–40장 자동 시뮬레이션 두 경로, 이후 선택이 같아도 1막에 따른 결과 차이 |

`regression.py`의 13건: 부팅 1 + 허브 폭 3 + GOLD 롤백 + 정상 월 확정 + 저장 실패 유지 + 삭제 실패 후 최신 확정본 유지 + 12월 결산 중 유지 + 차년도 확정 + 게임오버 확정 + 사망/계승/검 부품 + 손상 체크포인트 격리. 중간 HP를 1로 만들지만 복구 후 HP 자체의 assert는 없다. 전체 전투/설전 완료나 모든 보상 종류의 중복 방지 검사로 확대 해석하면 안 된다.

### 기준 무결성

- 실행 전후 `index.html`: `14afbff408f9ee68f7ae2f585a8dfe258ddffee2b309a701bf89dbfe496867f6`. docs/BASELINE.md와 일치. src 및 생성물 diff 없음.
- build 로그의 `10120349 bytes`는 현재 Python `len(html)`인 문자 수다. 실제 바이트는 10,408,720이다. 해시에는 UTF-8 인코딩이 적용되어 맞는다.
- `check`는 **동결 SHA 자체를 강제하지 않는다**. 이번에는 별도 SHA 계산으로 대조했다. 향후 의도적 변경도 허용하는 일반 재현성 검사와 고정 기준본 검사를 구분한다.
- `git tag`와 `git ls-remote --tags origin` 모두 태그 없음. AGENTS.md가 보존을 요구하는 `legacy-v5.2`는 현재 원격에도 확인되지 않았다. 이번 PR이 태그/기준 해시를 생성·이동·변경하지는 않는다. 기준 커밋 지정 후 별도 복구 필요.

## 위험과 수정 우선순위

P1은 저장 안전성/검증 공백을 먼저 해결할 항목, P2는 다음 유지보수 단계다. 미검증은 재현된 버그와 구별했다.

| 순위 | 관측/위험 | 다음 조치·수용 기준 |
|---|---|---|
| **P1, 재현됨** | `checkpoint_v483.js`의 복구 try/catch가 데이터 검증 오류와 저장 I/O 실패를 함께 처리한다. 유효한 cp를 기본 SAVE_KEY에 쓰지 못하면 `.invalid`로 옮기고 활성 cp를 지운다. 원래 기본 저장은 남지만 정책 A 복구 기회를 잃을 수 있다. | 별도 런타임 수정 PR에서 검증 실패와 일시적 I/O 실패를 구분. 복구 중 setItem 실패 시 cp 원문 유지, 재시도 성공 후에만 삭제; notice 쓰기/삭제 실패도 각각 주입. |
| **P1, 미검증** | 임무/전투/설전 전체 중단→행동 시작 복귀, 카드 소비/자원/보상 전부와 계승 실패/12월 저장 실패 조합은 기존 suite로 증명되지 않음. | 각 모드의 실제 진입·중단·재부팅, 중복 보상 없음, HP/카드/자원 비교, 12월 확정 전 재부팅 및 확정 저장 실패/cleanup 실패 조합을 fixture로 고정. |
| **P1, 미검증** | 마이그레이션 코드는 SAVE_KEY와 LEGACY_SAVE_KEYS fallback, raw 최초 백업, Set 복원, 보조 ensure 래퍼들에 의존. 테스트의 old()/legacy 설정은 주로 현재 state 합성이며 실제 버전별 저장 표본을 로드하는 검사가 아님. | 익명화한 구버전 raw 저장·손상 저장 fixture, 원문 백업 불변/키 유지/장·파트·인벤토리/이력 비추정/반복 로드 멱등성을 검사. |
| **P1, 이번 보강** | 기존 활성 `ci.yml`은 build/check/drift만 실행; 브라우저 회귀를 놓침. | 독립 matrix smoke/regression/story 추가, fail-fast false. 기존 build/drift 검사 유지. 원격 CI 통과를 PR에서 별도 확인. |
| **P2, 관측됨** | 거대 IIFE 및 순서 의존 래퍼, 두 도구의 빌드 목록 중복. | 아래 단계별 추출, 같은 이름 선언/순서 변경 금지, 첫 PR은 순수 데이터 한 묶음만. |
| **P2, 관측됨** | 기준 tag 없음, 미사용 여부 미확정 `combat_story.html` 및 과거 감사 문서 혼재. | 검증한 import 커밋을 기준으로 태그 복구 검토, HTML 용도/배포 링크 조사 후 별도 정리. |
| **P2, 정적 설정 위험** | devcontainer postCreate의 `.venv` activate는 setup.sh 프로세스 안에서만 유효. 새 터미널의 `python3`가 그 venv를 쓴다고 보장되지 않음. | 브라우저 검사는 `. .venv/bin/activate` 후 실행. 실제 새 Codespace에서 setup, 새 터미널 tests, 포트 미리보기 검증 후 최소 설정 개선. |
| **P2, 미검증** | in-memory localStorage + set_content 재부팅은 실제 origin 저장/탭 종료/OS kill/용량 부족을 모사하는 제한된 모델. | 실제 HTTP origin 저장·브라우저 재기동 및 Android WebView 실기 저장 검증. APK 이식은 명시적 전송/가져오기 필요. |

### P1 복구 쓰기 실패 재현

이번 감사의 임시 Playwright probe는 `tests/regression.py`의 동일 instrument/MEMORY를 사용했다. 새 페이지에서 앱을 로드한 뒤 다음 순서로 실행했다(게임 소스 수정 없음).

```python
page.evaluate('__wcTest.pick("rest"); __wcTest.start(); window.__throwSave=true')
assert page.evaluate('!!__wcTest.checkpoint()')
page.set_content(instrument, wait_until='load')
assert not page.evaluate('!!__wcTest.checkpoint()')
assert page.evaluate('!!localStorage.getItem(__wcTest.checkpointKey+".invalid")')
```

관측: cp `true → false`, quarantine `true`. 주입은 기본 저장 키 setItem만 실패시키고 `.invalid` 쓰기는 허용한다. 실제 기기 전체 저장 불가와 동일 조건이라고 주장하지 않는다. 기존 regression D는 **월 확정 저장 실패** 후 오류 주입을 해제하고 재부팅하므로 이 **복구 자체의 쓰기 실패**와 다르다.

## CI 최소 개선 및 개발 환경

변경 파일은 이 문서와 `.github/workflows/ci.yml`뿐이다. CI browser matrix는 requirements-dev 설치→Chromium 및 OS 의존성 설치→build→각 suite를 실행한다. suite별 20분 제한, 실패도 독립적으로 표시한다. 결과 JSON은 실패 시에도 업로드하되, 실행 전에 기존 `VALIDATION_*.json`을 runner에서 제거하여 과거 보고서가 이번 결과처럼 업로드되지 않게 한다. smoke는 JSON을 만들지 않아 로그만 남는다. 설치 실패처럼 테스트 이전에 실패하면 새 보고서는 없으며 로그가 근거다. 기존 테스트는 수정하지 않았다.

`import-v52.yml`은 main의 지정 ZIP 가져오기 용도로 별개이며 브라우저 CI를 대체하지 않는다. 그 workflow와 `docs/CI_WORKFLOW_TEMPLATE.yml`은 변경하지 않았다.

개발 서버는 `npm run dev` → `0.0.0.0:5173`, devcontainer forwardPorts 5173 그대로다. 이번 환경에서 HTTP 응답/본문 SHA를 확인했다. 실제 Codespaces UI의 포트 전달, devcontainer 신규 생성 및 Android는 실행하지 않았다.

## 단계적 추출 계획 — 구현은 다음 PR

1. **첫 후보: `MAIN_V47` 순수 장 데이터 한 선언만 추출.** `src/legacy/game_runtime.js`의 30,445바이트 `const MAIN_V47 = [...]`를 예컨대 `src/story/main_chapters_v47.js`로 옮긴다. 독립 ES module로 바꾸지 않고 같은 IIFE 어휘 범위에 둔다. 빌더가 runtime의 원래 선언 위치에서 정확히 한 번 조각을 결합하도록 한다. 파일 끝에 옮기면 초기화 시점이 바뀌므로 금지. 추출+삽입을 역으로 조합했을 때 원본 바이트가 동일해야 한다. 새 프레임워크/중복 state/별도 public 저장 키 없음.
2. **수용 기준:** index의 현재 SHA 완전 일치, 빌드·check·smoke·regression·story 전부 통과, 선언 위치/장 번호 9–40·문자열·배열 순서 불변, 1–8장과 네 역사 결과 연결 보존. 실제 구버전 저장 fixture를 확보해 전후 로드 비교; fixture 확보 전에는 구버전 전체 호환 검증 완료라고 하지 않음. 결합 도구/manifest/check 순서도 동시에 검증. PR 하나 되돌리기로 복원 가능해야 한다.
3. **이후:** 순수 상수/데이터를 같은 방식으로 하나씩 추출. 먼저 P1 저장 경계 fixture를 보강한 뒤 저장 접근자/호환 래퍼를 한 동작씩 분리. 전투/설전·장비 UI는 카드 일회 소비/비용/반올림 퍼센트/검 8파트·갑옷 4슬롯/독립 용량 검증을 확보한 후 별도 PR로 진행. UI는 320/360/390px 메뉴·모달까지 확인.

40장 수동 완주, Android QA, 모든 전투/설전 승패·후퇴, 최종 픽셀 아트, 12 검 운명 구현/검증을 수행했다고 주장하지 않는다. 이번 PR은 동결된 게임에 대한 감사 및 자동 검사의 지속 실행 체계다.

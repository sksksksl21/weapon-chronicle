# v4.8 저장 데이터 구조

저장 키: `weaponChronicleLifeHubV30` (기존 유지)

| 필드 | 자료형 | 의미 |
|---|---|---|
| `saveMeta.schemaVersion` | number | 현재 48 |
| `saveMeta.build` | string | `v4.8` |
| `saveMeta.savedAt` | ISO-8601 string | 저장 시각 |
| `worldHistory` | array | 기존 메인 완료 기록을 회차별 고유 ID로 보관 |
| `branchFlags` | object | 차후 실제 역사 개변 상태를 저장할 필드. **이번에는 비어 있음** |
| `endingRecords` | array | 차후 실제 엔딩 스냅샷 저장 필드. **이번에는 비어 있음** |

`worldHistory`의 `main:chN`은 N=1~40의 메인 챕터 완료 기록을 의미합니다. 제1장 구형 결과에는 `origin='legacy'`를 표시하고, 제2~5장 결과는 현재 저장된 `path`, `result`, `owner`, `year`, `month`를 보존합니다. 이 데이터는 **장기 인과의 기록 기반**이지 아직 역사 개변 게임 규칙이 아닙니다.

## 이전 버전 이관

1. 기존 키에서 원본 JSON 문자열을 읽습니다.
2. 같은 원본이 이미 백업되지 않았을 때 `weaponChronicleLifeHubV30.backup-before-v48`에 최초 1회 보관합니다.
3. 루트·소유자·검·부품 등 핵심 데이터 존재를 검사합니다.
4. 원래 초기화 루틴을 실행한 뒤 신규 저장 필드를 추가합니다.
5. 기존 주요 능력치·골드·소유자·검·메인 단계는 덮어쓰지 않습니다.
6. 잘못된 데이터는 자동 정상 판정하지 않으며, 손상 저장 키에 원본을 보존하고 로그를 기록합니다.

**한계:** 별도의 게임 내 백업 복원 버튼은 아직 없습니다. Android 앱 전용 저장 전환과 파일 기반 백업/복원은 추후 계획입니다.

## v4.8.3 보강

- `saveMeta.build = v4.8.3`
- 단독 체크포인트 키는 v4.8.2와 동일하게 유지해 기존 중단 이력 호환.
- 확정 여부는 기존 저장에 기록된 `year`/`month`/`generation` 또는 해당 월의 `gameOver`로 판단. 중간 진행 자동저장만으로는 확정하지 않음.
- 원본 v4.8.2 데이터 스키마 번호 48 유지; 저장된 게임 내 부품/자원 값 자동 변경 없음.

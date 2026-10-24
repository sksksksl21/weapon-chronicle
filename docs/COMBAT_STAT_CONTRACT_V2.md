# 전투 수치 입력·출력 규격 V2 및 구형 4스탯 사용처 대조 (2026-10-24)

이 문서는 **조사 및 규격 확정 문서**다. 코드·저장 키·전투 규칙은 이 문서로 바뀌지 않는다.
확정된 방향: 위력·정밀·견고·조작성 중심의 구형 표시·계산 체계를 폐기하고, 소유자 능력(무예·생존·처세)과
장비 성능 발휘율을 최종 전투 수치에 일관되게 반영한다. 자동 전투 + 카드 개입 구조는 유지한다.

대조 대상(전 범위 확인 완료): `src/core/direct_combat_stats_v2.js`, `src/core/direct_combat_runtime_v2.js`,
`src/core/combat_math_v1.js`, `src/core/legacy_combat_sources_v1.js`, `src/core/live_combat_handoff_v1.js`,
`src/legacy/game_runtime.js`(1~6216), `src/combat/story_combat.html`(1~2636).

표기: **[활성]** 현재 플레이에서 실행·표시됨 / **[대체됨]** 정의는 남아 있으나 후속 모듈이 재정의·DOM 교체로 덮음 /
**[도달 불가]** 호출 경로가 후속 재정의로 끊김. `live_combat_handoff_v1.js`는 줄 번호 없이 함수명으로 표기한다.

---

## 1. 현재 두 개의 계산 경로 (핵심 발견)

| 구분 | 경로 A: 실전 스냅샷 | 경로 B: 상태창 직접 수치 |
| --- | --- | --- |
| 진입 함수 | `wcCurrentUnifiedStats()` (live_combat_handoff_v1.js) | `wcDirectCurrentStats()` (direct_combat_runtime_v2.js:21) |
| 장비 분해 | `WC_LEGACY_COMBAT_SOURCES_V1.fromLegacyLoadout` | `WC_DIRECT_COMBAT_V2.migrateLegacyLoadout` |
| 산술 | `WC_COMBAT_MATH_V1.calculateActorStats` (가산) | `WC_DIRECT_COMBAT_V2.calculate` (발휘율 곱) |
| 소유자 반영 | 무예·생존을 **고정 점수**로 더함: 공격 `+무예×0.72`, 방어 `+생존`, 치명 `+2+무예×0.52` (무예·생존은 구형 1~14 척도) | 무예·생존을 0~1 **정규화 발휘율**(3.1절 M·S)로 장비 수치에 곱함 |
| 사용처 | `launchStoryCombat` → `combatFrame.dataset.unifiedActorV1` → story_combat.html `LIVE_ACTOR`(781-788) → 공격력·관통·방어·치명 기본값·공속·HP·공명 | 메인 HUD `wcImproveMain`, 모달 `wcPolishModal`, `smithStatHtml`, `wc41WeaponFactHtml` |
| 처세 | 미사용 | 입력만 계산(`ownerRates.social`), 출력 미반영 |

**결론: 플레이어가 상태창에서 보는 공격력·방어력·치명·속도와 실제 전투에 쓰이는 값이 서로 다른 공식에서 나온다.**
또한 경로 A 스냅샷이 있어도 전투 프레임의 명중·회피·방어 자세·반격 판정은 여전히 구형 4스탯을 직접 읽는다(2.5절).
`wcRenderUnifiedStats`(경로 A 결과 8칸)는 렌더 직후 `wcImproveMain`(경로 B)이 같은 `#wcUnifiedCombatStats`를 덮어쓰므로 화면에는 B만 남는다.

## 2. 위력·정밀·견고·조작성 사용 위치 전수 목록

### 2.1 저장/원본 데이터 (보존 대상, 변경 금지)
- `game_runtime.js:33` `state.weapon.power/precision/toughness/handling` 초기값 (세이브 키).
- `game_runtime.js:75-151` `PART_CATALOG[slot][id].mods.power/precision/toughness/handling` (8부위 부품 원본).
- `game_runtime.js:145-148` 검집 `mods.firstHandling`.
- `game_runtime.js:36` `upgrades.edge/temper/balance`.

### 2.2 게임 런타임 계산 (game_runtime.js)
| 위치 | 내용 | 상태 |
| --- | --- | --- |
| 284-301 `recalcWeapon()` | 8부위 mods + 강화 합산으로 `state.weapon` 4스탯·`firstHandling` 총합 덮어씀 (edge→위력+정밀/2, temper→견고, balance→조작성). 1906 `genMonth`, 3670·3678 개조, 3691 강화, 4114, 5752 교체 시 호출 | [활성] |
| 166-170 `previewWeaponSwap()` | 교체 미리보기 4스탯 총합 | [활성 계산 / 표시는 2.4 대체] |
| 182-189 `BUILD_RULES`/`activeBuilds()` | 4스탯 총합 임계치로 파쇄·결투·철벽형 판정 | [활성] — 4113 무예 보정, 279 `weaponProfile` 사용 |
| 4113-4120 `weaponMartialBonus()` | `fit=(조작성-9)/3.2+(정밀-10)/6+firstHandling×0.25+(빌드 있음?0.5)`, `clamp(round,-2,5)` → `rawOwnerStats().parts.weapon` → **무예에 가산** | [활성] — 4스탯이 무예를 통해 사건 판정(4054)·설전·전투 프레임 `martial`(4096)·상태창에 들어가는 간접 경로 |
| 4127-4136 `derivedAbilities()` | 명중 `44+무예×2.65+(정밀-10)×1.65+(조작성-9)×0.72…`, 피해 `무예×0.92+위력×1.02…`, 치명 `2+무예×0.36+정밀×0.63…`, 반격 `…+정밀×0.95+조작성×0.88` | [활성 계산 / 표시 대체] — 4068 `openStatus` 전투 탭에서만 사용, 해당 `.statusGrid`는 `wcPolishModal`이 교체 |
| 3451-3458 구형 `showMainStoryNode` 1-07 | `activeBuilds` 파쇄형 또는 `power>=20`이면 정면전 선택지, `handling>=12`+quickdraw면 탈출 선택지 | [도달 불가] — 3977 `showMainStoryNode=showMainStoryNodeV25`로 대체 |
| 4094-4097 `launchStoryCombat()` | dataset `weaponPower/Precision/Toughness/Handling`, `firstHandling`, `weaponWeight/Length`, `martial`(=유효 무예, 무기 적합 보정 포함), `survival`, `armorDefense/Evasion/Resist` 전달 | [활성] — handoff가 래핑해 `unifiedActorV1`만 추가 |
| 2186 전투 종료 메시지 | 위 dataset 키 삭제 | [활성] |

### 2.3 통합 계산 입력으로의 변환
- `legacy_combat_sources_v1.js:28-37` `swordPartValues`: power→attack, toughness→defense, handling→speed(고정점), precision→crit(%p 고정점). [활성: 경로 A]
- `legacy_combat_sources_v1.js:113-130`: `state.weapon` 총합에서 부품 기여를 빼 검 본체 잔여값 산출(강화분이 잔여로 남음). [활성: 경로 A]
- `live_combat_handoff_v1.js` `calculate`: `ownerMartial=유효무예−raw.parts.weapon×정신배율` (무기 적합 보정 제거 후 `×0.72`, `2+×0.52`). [활성: 경로 A]
- `direct_combat_stats_v2.js:93-120` `migrateLegacyPart`: power→min/maxAttack(×0.9/1.1), toughness→defense, precision→critBonus(%p), handling→speedPct(%). [활성: 경로 B]
- `direct_combat_stats_v2.js:121-145` `migrateLegacyLoadout`: 4스탯 잔여(강화 포함)를 검 본체로 이관. [활성: 경로 B]
- `direct_combat_runtime_v2.js:6-20` `wcDirectOwnerRates`: 무예에서 `raw.parts.weapon×정신배율`을 빼서 4스탯→무예 간접 경로를 차단. [활성: 경로 B]

### 2.4 표시
| 위치 | 내용 | 상태 |
| --- | --- | --- |
| `game_runtime.js:164` `PART_STAT_META` | 라벨 위력/정밀/견고/조작성 | [활성 데이터 / 표시 대체] |
| `game_runtime.js:171-181` 구형 `partDeltaHtml` | 부품 교체 4스탯 증감 (3676 개조, 3806 구매에서 호출) | [대체됨] — handoff `partDeltaHtml=wcPartContribution` |
| `game_runtime.js:1981` `render` | `#wpPower/#wpPrecision/#wpToughness/#wpHandling` 텍스트 갱신 | [활성 갱신 / 숨김] — handoff `wcRenderUnifiedStats`가 `.weaponStats`를 `details.wcLegacyStats`에 넣고 `wcUIStyle`이 `display:none` |
| `game_runtime.js:1952-1955` `render` | `weaponProfile().name`(빌드명)을 `#sliceBuild`에 표시 | [활성] |
| `game_runtime.js:2078` 구형 `smithStatHtml` | 대장간 4스탯 칸 | [대체됨] — handoff `smithStatHtml=wcStatsHeader` |
| `game_runtime.js:3684-3686` `openSmithEnhance` | 강화 설명 "위력 중심/견고 상승/조작성 상승" | [활성] |
| `game_runtime.js:4071` `openStatus` 소유자 탭 | 무예 구성 "검 기여"(=4스탯 기반 `weaponMartialBonus`) | [활성] — `wcPolishModal`은 이 탭에 직접 수치 헤더만 추가 |
| `game_runtime.js:4075` `openStatus` 무기 탭 | 위력/정밀/견고/조작성 `.statusGrid` | [대체됨] — `wcPolishModal`이 `.statusGrid` 교체 |
| `game_runtime.js:4077` `openStatus` 전투 탭 | `derivedAbilities` 수치와 "검의 위력·정밀·조작성" 공식 문구 | [대체됨] — `.statusGrid`·`.formula` 교체 |
| `game_runtime.js:4365` `resonanceReplyV28('sword')` | "위력·정밀·조작성" 대사 | [도달 불가] — 6040 `openOwnerResonance=openContacts` |
| `game_runtime.js:5750` 구형 `wc41WeaponFactHtml` | "위력 / 정밀", "견고 / 조작성" | [대체됨] — handoff 재정의 + `wcPolishModal` 정규식 숨김 |
| `game_runtime.js:5751` `openWeaponDetail` | `weaponProfile()` 빌드명·설명 | [활성] |
| handoff `wcPolishModal` | `.smithStats .smithStat`, `.wc41-weaponFacts > div` 중 4스탯 문구로 시작하는 요소 숨김 (문구 정규식 의존) | [활성] |
| `story_combat.html:1783-1786` `render` | 스냅샷 없을 때 `#heroPow` "전투력" = `무예×1.4+생존×0.8+위력×0.65+정밀×0.35+조작성×0.3+견고×0.25` | [활성: 스냅샷 없을 때] / 스냅샷 있으면 공·방·속·치·관 표시 |
| `story_combat.html:1261,1274,1279` 소유자 AI | 회피 사유 문구 "무기의 조작성", 회피 선호 점수 `+조작성×0.55` | [활성] |
| `story_combat.html:2612` | `buildNames()` 빌드 로그 | [활성] |

### 2.5 전투 프레임 계산 (story_combat.html)
입력: `816-827` `STORY_WEAPON`(dataset, 기본 13/11/10/9, `firstHandling` 기본 0) → `920-930` `HERO_BASE.weapon`.
`hero.martial/survival`은 dataset의 **유효** 무예·생존(무기 적합 보정·방어구 생존 포함).

| 위치 | 4스탯 사용 | 스냅샷(`LIVE_ACTOR`) 시 |
| --- | --- | --- |
| 1471 `effectiveHandling` | `조작성 + (turn===1 ? firstHandling : 0)` — **firstHandling의 유일한 사용처**(첫 턴 한정) | 그대로 사용 |
| 1472-1482 `weaponBuilds` | 파쇄 `위력≥18&&무게≥1.42`, 결투 `정밀≥17&&조작성≥15&&무게≤1.36`, 철벽 `견고≥17&&무게≥1.36`, 공명 2종 | 그대로 사용 (게임 쪽 `BUILD_RULES`와 별도 판정) |
| 1483-1502 `calcHeroHit` | `34+무예×3.2+정밀×2.0+조작×1.15+사거리−적회피×2.45−무게부담×1.8`, 강공 패널티에 조작, 파쇄 −4, 결투 +5 | **대체 안 됨(구형 그대로)** |
| 1503-1514 `calcHeroCrit` | 구형 `2+정밀×0.72+무예×0.52+조작×0.18` | `LIVE_ACTOR.critChance`로 기본값 대체, 결투 +4 등 상황 보정 유지 |
| 1525-1560 `calcHeroDmg` | 구형 `위력+무예×0.72+질량−적방어×0.42`; 강공 계수 `조작`, 결투 ×0.94, 파쇄 ×1.18, 도적 반격자세 파쇄 0.80 | 기본값 `LIVE_ACTOR.attack+질량`, 이후 계수·`liveDamage`(방어·관통·임시방어) |
| 1437 `effectiveEnemyEvasion` | 거미 후퇴 회피 결투형 +8(기본 +15) | 그대로 |
| 1562-1574 `calcEnemyHit` | 회피 `생존×0.9+조작×0.65−무게부담×0.7+방어구회피`, 철벽형(비방어) 적 명중 +6 | **대체 안 됨** |
| 1575-1605 `calcEnemyDmg` | 방어 자세 계수 `0.68−(견고×0.014+생존×0.012+조작×0.005)` → 0.38~0.62, 철벽 ×0.88; 구형은 방어구 방어 ×0.018 감산 | 방어 자세 계수는 임시방어로 전환해 유지, 방어구 방어는 `LIVE_ACTOR.defense` |
| 1972-1974 `animateCounter` | 반격률 `52+무예×1.4+정밀×0.75+조작×0.8+결투8` | 확률 그대로, 피해만 `liveDamage` |
| 2034, 2263 | 도적 반격 파쇄형 45%, 거미줄 결투형 −12 | 그대로 |
| 1675, 1692, 2557 | 순환·심층공명형(공명 수치 기반, 4스탯 아님) | 그대로 |
| 2551-2554 `resetRun` | — | `LIVE_ACTOR.maxHp/maxResonance/resonanceRecovery` 사용 |
| 2417 `endTurn` | — | `LIVE_ACTOR.attackSpeed` 공속 게이지 |

## 3. 확정 규격: 최종 전투 수치 입력·출력

기준: 2026-10-21 승인 직접 수치 계약(`WC_DIRECT_COMBAT_V2.calculate`). 경로 A의 고정 점수 방식(×0.72, ×0.52)은 이 규격으로 대체될 **과도기 호환 경로**로 분류한다.

### 3.1 입력 (0~100 원점수)과 정규화 발휘율
| 필드 | 범위/단위 | 출처(과도기) |
| --- | --- | --- |
| `owner.martial` | 0~100 정수 | `wcDirectOwnerRates`: round((유효 무예 − 검 적합 보정×정신배율)×10), 0~100 클램프 |
| `owner.survival` | 0~100 정수 | round((유효 생존 − 방어구 생존×정신배율)×10) |
| `owner.stableSurvival` | 0~100 정수 | round((원시 생존 − 방어구 생존)×10) — 정신 상태 비영향 HP용 |
| `owner.social` | 0~100 정수 | round(유효 처세×10) |
| `owner.baseHp` | ≥1 | `state.maxHp − Σ방어구 maxHp × Sₕ` (현 HP 상한 보존) |
| `weapon` | 직접 수치 | 검 본체(구형 잔여+강화), 부품 8개와 중복 금지 |
| `parts` | 8슬롯 blade~scabbard | 부품별 직접 수치 |
| `armor` | 4슬롯 helmet/armor/gloves/boots | 슬롯 불일치 장비는 `{}` |

**정규화 발휘율 (출력 공식은 반드시 이 값만 사용한다. 원점수 0~100을 직접 곱하지 않는다.)**

| 기호 | 정의 | 범위 | 코드 |
| --- | --- | --- | --- |
| M (무예 발휘율) | clamp(owner.martial, 0, 100) / 100 | 0~1 | `m` |
| S (생존 발휘율) | clamp(owner.survival, 0, 100) / 100 | 0~1 | `s` |
| Sₕ (안정 생존 발휘율) | clamp(owner.stableSurvival ?? owner.survival, 0, 100) / 100 | 0~1 | `stable` |
| C (처세 발휘율) | clamp(owner.social, 0, 100) / 100 | 0~1 | 미적용 |

예: 무예 70 → M = 0.70. 장비 공격 20 × M = 14 (×70 = 1400이 아님).

장비 묶음: **공격 장비** = 검 + 부품 8 + 장갑, **속도 장비** = 검 + 부품 8 + 장갑 + 신발, **방어 장비** = 검 + 부품 8 + 방어구 4, **공명 장비** = 검 + 부품 8.
(코드: `attackItems`, `speedItems`, `defenseItems`, `resSources`. 이관 시 장갑의 `speedPct`는 0이므로 방어구 중 실제 속도 기여는 신발뿐이다.)
단위: `attackPct/defensePct` = 소수(0.10 = 10%), `hitBonus/critBonus/evade/blockChance/statusResist/critChanceResist` = %p, `speedPct/critDamageBonus` = %.

### 3.2 출력과 발휘율 적용 (각 1회)
| 출력 | 식 (M·S·Sₕ는 0~1) | 반올림/범위 |
| --- | --- | --- |
| 공격력 min/max | Σ공격장비 min/maxAttack × (1 + ΣattackPct) × M | 각각 정수 반올림, min≤max, ≥0 |
| 방어력 | Σ방어장비 defense × (1 + ΣdefensePct) × S | 정수 반올림, ≥0 |
| 최대 HP | baseHp + Σ방어구 maxHp × Sₕ | 정수 반올림, ≥1 |
| 명중 | 70 + Σ공격장비 hitBonus × M | 0~100 |
| 치명 확률 | 5 + Σ공격장비 critBonus × M | 0~100 |
| 치명 추가 피해(%) | Σ공격장비 critDamageBonus × M | 소수 3자리, ≥0 |
| 치명 배율 | 1 + (치명 추가 피해) / 100 | 소수 3자리 |
| 관통 | Σ공격장비 penetration × M | 소수 3자리, ≥0 |
| 공격속도 | 100 × (1 + Σ속도장비 speedPct × M / 100) — 신발 포함, M 1회 | 소수 3자리, ≥1 |
| 회피 / 막기 확률 / 상태 저항 | 기본(0) + Σ방어장비 해당값 × S | 0~100 |
| 막기량 | Σ방어장비 blockAmount × S | 소수 3자리, ≥0 |
| 치명 확률 저항 | Σ방어장비 critChanceResist × S | 0~100 |
| 치명 피해 저항 | Σ방어장비 critDamageResist × S | 소수 3자리, ≥0 |
| 최대 공명 / 교전 공명 회복 | Σ공명장비, 발휘율 없음 | 소수 3자리, ≥0 |
| 처세 (C) | **현재 영향 0** | 미정(6절) |
| 표시용 `martial/survival` | round(M×100), round(S×100) | 0~100 |

표시는 소수 1자리. 방어구는 장갑 외 공격·명중·치명·관통을 주지 않고, 신발 외 속도를 주지 않는다(`migrateLegacyPart`에서 0 처리).
신발의 속도(`speedPct` + 구형 `speed`)는 공격속도 합산(속도 장비)에 포함되며 무예 발휘율 M이 적용된다. 신발의 회피·저항 등 보호 옵션은 방어 장비로서 S가 적용된다.
(2026-10-24 수정: 이전 `calculate`는 공격 장비만 합산해 이관된 신발 속도가 버려졌다. 신발 역할 표기 "속도·회피", 방어구 표시 "공속", 경로 A의 신발 속도 반영과 맞추려고 `speedItems`로 바로잡았다.)

### 3.3 피해 순서
`resolveStrike`: 명중(명중−회피) → 치명(치명−치명저항) → 기본피해(min~max) × 카드배율 × (치명 시 1+(치명추가피해−치명피해저항)/100) → max(1, 사전피해 − max(0, 방어−관통)) → −막기량(막기 성공 시) −임시방어 → max(0) → 1회 반올림.

## 4. 조사 범위
전 범위 확인 완료(위 대조 대상 전체). 검색어: `power`, `precision`, `toughness`, `handling`, `firstHandling`, `activeBuilds`, `weaponBuilds`, `hasWeaponBuild`, `weaponProfile`, `weaponMartialBonus`, `derivedAbilities`, `위력`, `정밀`, `견고`, `조작성`.
남은 불확실성: handoff 파일은 줄 번호 없이 함수명으로 표기했다. handoff가 런타임 뒤에 로드된다는 점은 검토 단계에서 빌드 명세로 확인됐다.

## 5. 불일치 목록
1. 상태창(경로 B)과 실전(경로 A)의 공격력·방어력·치명·속도 공식이 다르다.
2. 조작성: A는 고정 속도점, B는 속도 %로 단위가 다르다.
3. 정밀: A는 무예와 무관한 고정 치명점, B는 무예 발휘율이 곱해진 %p.
4. 소유자 공격: A는 장비와 무관한 `무예×0.72` 가산(B 계약의 "소유자 고정 공격 보너스 없음"과 충돌).
5. 처세는 어느 경로에서도 최종 전투 수치에 반영되지 않는다.
6. 빌드 판정이 두 곳에 있다: 게임 `BUILD_RULES/activeBuilds`(무예·빌드명)와 전투 프레임 `weaponBuilds`(실제 전투 보정). 둘 다 4스탯 임계치를 쓴다.
7. 스냅샷이 있어도 `calcHeroHit`·`calcEnemyHit`·방어 자세 계수·`animateCounter` 반격률은 구형 4스탯·무게를 직접 사용한다.
8. 이중 반영: `weaponMartialBonus`가 조작성·정밀을 무예에 넣고, 전투 프레임은 그 무예와 조작성·정밀을 명중·반격 식에서 다시 곱한다. 반면 경로 A 공격력·치명은 무기 적합 보정을 제거한 무예를 쓴다.
9. `firstHandling`은 첫 턴 `effectiveHandling`에만 쓰이며, B 규격(`migrateLegacyPart`)에는 대응 필드가 없다.
10. 방어구 회피·저항은 전투 프레임에서 `armorEvasion/armorResist`로 따로 반영되고, B 규격의 `evade/statusResist × S`와 공식이 다르다.
11. 스냅샷이 없을 때 `#heroPow` "전투력"은 4스탯 가중합이다.
12. 신발 속도: 경로 A는 고정 속도점 `mods.speed + BOOT_MOBILITY[id]`(rope_sandals 4, traveler_boots 6, iron_greaves −3, climber_boots 8)을 쓰고, 경로 B는 `speedPct + speed`를 %로 보고 M을 곱하며 `BOOT_MOBILITY`가 없다. 실전 스냅샷을 V2로 교체할 때 `BOOT_MOBILITY`의 이관 여부를 정한다.

## 6. 후속 작업 조건
- 실전 스냅샷을 V2로 교체할 때 `LIVE_ACTOR` 필수 키(maxHp, maxResonance, resonanceRecovery, attack, defense, attackSpeed, critChance, penetration)와 min/max·명중·치명배율·회피·막기 확장을 함께 검증한다.
- 전투 프레임의 `calcHeroHit`·`calcEnemyHit`·방어 자세·반격률·`weaponBuilds`는 V2 출력(명중·회피·막기)으로 옮길 대상이다. 빌드 보정(파쇄·결투·철벽)을 유지할지는 전투 엔진 단계에서 정한다.
- 세이브 키(`state.weapon.power` 등)는 유지하고, 직접 수치는 매번 이관 계산한다. 현재 HP/공명 상태는 미리보기에서 바꾸지 않는다.
- 장비·부품·강화는 이중 합산하지 않는다(구형 총합에서 부품 기여를 1회 차감). 무기 적합 보정(`raw.parts.weapon`)도 발휘율 계산 전 1회 제거한다.
- 출력 공식은 3.1절 정규화 발휘율 M·S·Sₕ만 사용한다. 원점수 0~100을 직접 곱하지 않는다.
- 처세의 전투 반영 계수는 승인된 곡선이 없으므로 임의로 만들지 않는다. 계수 확정 시 3.2절 `처세 (C)` 행만 갱신한다.
- `migration.audited:false` 상태의 0~100 이관(×10)은 세이브 감사 후 확정한다.

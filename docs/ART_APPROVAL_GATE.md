# Weapon Chronicle — V2 승인 아트 빌드 게이트

상태: `dev` 코드 연결. 독립 Windows/Android 실제 게임 실행 검증 전.

## 범위
현행 `npm run build` → `tools/build.py` 실행 시작 시 `tools/art_build_gate.py`의 `verify(ROOT)`를 **무조건 호출**한다. 이 게이트는 새 V2 관리 이미지(`assets/v2-managed`)에 한정한다. 기존 `src` 게임·`index.html`·저장 데이터·이전 텍스트/장비 그림에는 영향을 주지 않으며 게임의 과거 이미지를 새 승인이 없는 것으로 간주해 일괄 삭제하지 않는다.

## V2 관리 이미지가 없을 때
`assets/v2-managed`가 존재하지 않으면 기존 HTML 조립을 진행한다. 이미 있는 게임의 정상 빌드를 깨지 않기 위한 호환 정책이다.

## V2 관리 이미지가 존재할 때 — 무조건 차단 게이트
- `assets/v2-managed/manifest.json`과 `assets/v2-managed/assets/*` 이외의 파일이 있으면 차단한다.
- 모든 파일의 이름, 원본 SHA-256, 길이와 MIME 형식이 manifest와 일치하지 않으면 차단한다.
- `AI_DEV_STUDIO_V2_ROOT` 또는 실행 위치의 상위 V2 `workspaces` 폴더로부터 실제 운영 V2 설치와 DB를 확인한다. 못 찾으면 차단한다.
- `V2 app.art_release.ArtRelease.verify(project_id,release_id)`를 호출해 현재 사용자가 승인한 Art Bible **버전과 해시**, 에셋 원본 승인·실제 이미지·배포 묶음을 다시 검증한다.
- 게임에 복사된 manifest가 현재 V2의 검증된 원본 manifest와 다르면 차단한다. 이전 승인 기준으로 만들어진 이미지와 일부만 바꿔 끼운 이미지는 승인된 것으로 인정하지 않는다.
- 검증 실패 시 `ART_GATE_BLOCKED` 메시지와 함께 **게임 파일 생성 전에 종료**한다.

## 배포 묶음 연결
Windows V2에 `weapon-chronicle` Git dev 프로젝트를 연결하고, 해당 게임 프로젝트에서 Art Bible을 사용자 승인·잠금한다. 후보 이미지를 사용자가 승인한 뒤 V2에서 **승인된 이미지 묶음 준비 → Weapon Chronicle dev에 승인 이미지 연결**을 순서대로 실행한다.

V2는 `assets/v2-managed`가 없는 깨끗한 `dev` 체크아웃에만 원본 증거를 복사한다. 기존 파일이 있거나 수정 중인 작업이 있으면 덮어쓰지 않는다. 이 기능만으로 Git 커밋·push·실제 게임 실행을 자동으로 완료한 것은 아니다.

## 다른 빌드·게임 화면의 범위
- 기존 `play-dev.html`은 브라우저에서 소스 스크립트를 직접 조립하며 `tools/build.py`를 사용하지 않는다. **이 HTML은 V2 관리 아트가 승인됐다는 증거가 아니며 새 관리 아트는 이 프리뷰 경로로 배포하면 안 된다.**
- 현재 `tools/build.py`는 기존 HTML을 생성하며 새 아트 파일을 인라인으로 포함하거나 자동 게임 화면에 나타나게 하는 기능은 없다. 아트 에셋을 게임에서 실제 사용하는 코드 연결과 최종 사용자 승인 판단은 별도 단계다.
- GitHub Actions/Linux 같이 V2의 승인 데이터베이스에 접근할 수 없는 환경에서 관리 이미지가 존재하면 의도적으로 실패한다. 임의 `--skip-gate` 옵션은 지원하지 않는다.
- 이 검사는 AI 시각 유사도를 판정하는 모델이 아니다. 크기·경로·승인 증거·원본 해시를 강제 검증한다.

## 시험
`python3 -m unittest discover -s tests -p test_art_build_gate.py` — 관리 이미지가 없는 레거시 통과, 승인 묶음 재검증, V2 연결 없음/버전 불일치/원본 변조/추가 파일/위조 메타데이터 거부.
테스트 작성 및 GitHub `dev` 반영은 확인됐지만 Windows 실제 게임 빌드/모바일 플레이, 실사용 V2 승인 묶음 전송은 **NOT_RUN**이다.

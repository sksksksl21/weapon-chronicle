# v5.2 단일 HTML 빌드 순서

`tools/build.py`는 다음 파일을 순서대로 묶으며 개발 소스 하나를 기준으로 유지한다.

1. `src/legacy/game_runtime.js`
2. `src/core/save_ledger_v48.js`
3. `src/core/action_checkpoint_v482.js`
4. `src/core/checkpoint_v483.js`
5. `src/story/history_branch_v50.js`
6. `src/story/world_aftermath_v51.js`
7. `src/story/act1_history_v52.js` **(신규)**
8. `src/legacy/bootstrap.js`

HTML 헤더 및 CSS: `src/legacy/html_before_script.html` / footer: `src/legacy/html_after_script.html`.
배포용 `index.html`에 이미지 등 기존 리소스가 내장된다.

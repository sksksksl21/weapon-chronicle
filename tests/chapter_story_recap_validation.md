# Chapter 1 story recap validation

Decision: accept reuse of the existing chapter-1 scene ending and persisted
`sceneChapterV1.picks`; add read-only reopening after settlement. No second
history ledger, generated narrative, new story, art replacement or save migration.
Old saves without scene progress receive no recap button or fabricated choices.
The existing chapter completion/history and whole-state save/checkpoint paths
already preserve this record, so those modules need no changes.

Implemented: scene ending reads the exact committed result sentences in pick
order. After settlement, the monthly board offers “이번 장의 이야기 · 1장 다시 읽기”.
This explicitly opened view survives reload through the existing saved record;
it cannot settle again and does not interrupt normal startup.

## Executed in this workspace

- PASS: `npm run build`, `npm run check`.
- PASS: `node tests/scene_cards_v1.js`: all 24 complete routes, actual recap
  renderer with JSON-roundtripped completed records, ordered chosen sentences,
  original owner prose, no settlement/save when reading, independent returned arrays.
- PASS: `npm run test:combat-adapter`, `npm run test:combat-math`,
  `npm run test:direct-combat`, `npm run test:status`,
  `npm run test:encyclopedia:source` (3 tests).
- PASS: the Node module service test within `npm run test:modules`;
  `python -m unittest discover -s tests -p test_module_manifest_v1.py` (3 tests).
- BLOCKED: browser portion of `npm run test:scene-cards`, `npm run test:smoke`,
  `python tests/regression.py`, `python tests/save_compat_additive.py`,
  `python tests/act1_history_v52.py`: Python Playwright missing. Installation
  attempted but network access denied. Added browser assertions remain unexecuted.
- BLOCKED: `npm run test:story`: Bash cannot execute on this Windows environment.
- FAIL (also reproduced with the HEAD runtime restored temporarily):
  `npm run test:combat-handoff` (missing wcCurrentUnifiedStats),
  `npm run test:live-combat` (VM lacks clearTimeout),
  `npm run test:merchant` (require used in ES module),
  `npm run test:gear-rarity` (existing formatDetail source assertion).
  The merchant failure also stops `npm run test:modules` after its first test.

Browser checks added to `tests/scene_cards_browser_v1.py` cover exact order,
unchosen hunter result exclusion, completed-save reload/reopening on all three
hunter choices, no repeated reward, close/return and old-save button absence.
These are automated targeted checks, not an exhaustive human playthrough or
Android-device certification. Other Python regression scripts were not run.

Generated HTML was built for checks only and is excluded from the source changes;
the supervisor must rebuild before running browser checks.

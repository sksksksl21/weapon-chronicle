# Issue #3 — checkpoint recovery write failure

PR #2 was merged before branching from `74e4727`. The accepted change is limited to recovery I/O error handling and regression coverage. Gameplay/causality, narrative (five acts/40 chapters), UI/art, save keys/schema and module order remain unchanged. Runtime extraction and v5.5 development are out of scope.

`checkpoint_v483.js` now quarantines only parse/validation failures. A valid checkpoint remains byte-for-byte under its live key when recovery save/notice writes or checkpoint removal fail. All required writes precede cleanup. Notice removal remains independently retryable through the existing load wrapper. No migration is required.

## Validation (2026-10-16 KST)

- A Node VM fault probe against `origin/main` reproduced loss of the live checkpoint on SAVE_KEY write failure; the same assertion passes against the fix.
- `npm run build`, `npm run check`: PASS; generated index matches source and JavaScript syntax passes.
- `npm run test:smoke`: PASS; actual rest choice completes a month, existing menus load without page errors.
- `npm run test:regression`: 20/20 PASS. Includes the prior 13 checks plus recovery SAVE_KEY/notice/removal faults during boot, exact live payload preservation, no invalid quarantine of valid data, unchanged old save when SAVE_KEY write fails, retry to action-start snapshot, synthetic month/quest reward settlement once across repeated reloads, notice removal failure/retry, three invalid payload shapes with quarantine write/removal failure/retry.
- `npm run test:story`: seven files, 177/177 PASS, including actual followup quest completion/reload/replay protection and two 40-chapter simulations. Existing legacy-history, combat/debate story paths, death/succession, terminal save, annual confirmation and mobile hub checks remain in their suites.
- `git diff --check`: PASS. Frozen baseline hash record and tags untouched.

The tests use browser injection and in-memory localStorage fault simulation. They are not exhaustive manual playthroughs, real storage quota/OS kill tests, historical raw-save fixture certification or Android validation. Reward-marker assertions in the added regression cases are synthetic; actual quest replay protection is covered by the unchanged story suite. Remote CI is recorded separately in the PR.

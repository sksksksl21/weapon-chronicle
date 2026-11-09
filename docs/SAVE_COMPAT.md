# Save compatibility and checkpoint A

- Preserve original `SAVE_KEY` name `weaponChronicleLifeHubV30` and legacy backup behavior.
- Current checkpoint behavior: action-begin snapshot is preserved while a mission/combat/debate is in progress; after interruption, restart action from that snapshot. Do not restore an in-progress card turn.
- After confirmed month/annual recap/succession/end-state durable save, checkpoint may be discarded. A cleanup failure after a committed save must not roll back durable progression.
- Never duplicate rewards or permanent loss from an interrupted action. Never infer historic choices for completed older saves without recorded evidence.
- Change of keys or schema requires a backwards-compatibility migration test, a rollback path and explicit documentation.
- Android WebView storage origin is different from browser `content://` or served HTML origins; importing an old browser save into an APK requires **explicit** transfer/import, not assumptions.
- In this migration no migration is applied; the v5.2 state and save keys are untouched.
- Chapter-1 scene cards (`src/story/scene_cards_v1.js`, data `src/story/chapter1_scenes_v1.json`) add one optional field, `state.sceneChapterV1` (`{v:1,chapter,status:card|result|ending|done,card,picks[]}`). It is created only for a game started with no stored save; old saves never receive it and keep the monthly board. Each pick / step is kept only when `saveGame()` returns true; on failure the previous progress stays in memory and in the durable save, and the same screen offers a retry. Closing the chapter applies choice effects, the existing CH.1 reward, the v5.2 departure pivot and `completeAct1ChapterV25(1,'scene_cards')` in one save; `completeAct1ChapterV25` now returns the save result so a failed save restores the pre-close snapshot and keeps the '이번 장의 이야기' page. Reconnecting resumes from the last durable step. Tests: `node tests/scene_cards_v1.js`, `python tests/scene_cards_browser_v1.py`.

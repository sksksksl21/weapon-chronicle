# Save compatibility and checkpoint A

- Preserve original `SAVE_KEY` name `weaponChronicleLifeHubV30` and legacy backup behavior.
- Current checkpoint behavior: action-begin snapshot is preserved while a mission/combat/debate is in progress; after interruption, restart action from that snapshot. Do not restore an in-progress card turn.
- After confirmed month/annual recap/succession/end-state durable save, checkpoint may be discarded. A cleanup failure after a committed save must not roll back durable progression.
- Never duplicate rewards or permanent loss from an interrupted action. Never infer historic choices for completed older saves without recorded evidence.
- Change of keys or schema requires a backwards-compatibility migration test, a rollback path and explicit documentation.
- Android WebView storage origin is different from browser `content://` or served HTML origins; importing an old browser save into an APK requires **explicit** transfer/import, not assumptions.
- In this migration no migration is applied; the v5.2 state and save keys are untouched.

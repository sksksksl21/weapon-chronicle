# Live unified combat integration — 2026-10-22

## Active behavior
- A real story encounter consumes the validated `unifiedActorV1` snapshot from its current owner, sword's eight parts and four valid armor slots. The one-use food HP/defense bonus is included before the legacy launcher consumes that food; the preview never consumes it.
- The generated combat document includes the SAME arithmetic and adapter source used by the parent game. Build markers are expanded for both `combat_story.html` and the offline embedded document. No network loading is required.
- Enemies enter `calculateActorStats` through `enemyFromLegacy`, retaining authored HP/tier changes, accuracy/evasion and move damage ranges. A move's existing damage offset relative to catalog attack is retained; a tier attack delta now also changes damage. Absent catalog speed means baseline 100.
- Normal/heavy/critical attacks and counterattacks use fixed penetration, permanent defense, then temporary guard. Card/critical multipliers precede permanent defense. Existing guard/absorption percentages are converted to temporary shield points after permanent defense. Poison, recoil and reflected received damage remain their existing separate effects.
- Snapshot critical chance replaces the old duplicated weapon/owner critical additions. Existing situational/card bonuses remain. A `storyGap` intervention bypasses permanent defense as described by its card.
- Each completed exchange advances the faster side's fractional speed gauge once: `min(.5, (fast-slow)/fast)`. At most one extra basic attack occurs. Equal speeds give no bonus. Resetting an encounter clears the gauge.
- An extra attack uses basic attack math, never repeats a heavy attack or an offensive pre-card. The defender's guard/dodge and committed defensive card still apply. Unused reaction-card opportunity is available on an extra miss/hit; resolving it resumes the same exchange without another speed tick.
- Hand limit, use/discard limit, payment and no-refill policy remain. Extra attacks never call `startTurn`, draw cards, recover resonance or repeat status-duration updates. The next turn begins once after all reactions. Win/loss from an extra attack settles once.
- No save keys, schema, checkpoint or death/succession rules change. The gauge exists only inside the encounter. Interrupted actions continue to use checkpoint policy A rather than persist a partial combat round.
- Standalone/older callers without a valid snapshot retain their legacy combat math.

## Verification and limits
Executed locally without GitHub Actions:

```sh
python3 tools/build.py
python3 tools/verify_baseline.py
node tests/combat_math_v1.js
node tests/live_combat_handoff_v1.js
node tests/live_combat_damage_v1.js
```

The focused VM fixture executes the generated combat document's actual action, damage, card, reaction, speed and result functions. It replaces DOM rendering/animation delays and controls random rolls. It covers 120:100, 120:90, 150:100, enemy-faster, equal speed, the .5 cap, encounter reset, both extra-attack reaction windows, card/payment/recovery counts, and extra-attack win/loss settlement.

This is not browser rendering certification, a complete playthrough, or final balance approval. Chromium is unavailable in the current environment. Real-device visual/input checks, long-run build balance, five owner-attribute integration (A05) and remaining roadmap items are still open. Current owner contributions retain existing martial/survival curves; no new insight/will/social growth curve was invented.

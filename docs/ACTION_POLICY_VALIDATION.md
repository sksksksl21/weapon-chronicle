# Finite combat hands and interruption coverage

Combat receives four memory cards at battle start, with no draws, recycling or mid-battle replenishment. Use or discard shares one intervention per turn. Selecting a pre-action card reserves the slot; deselect it before discarding. Empty hands leave owner automatic combat available. Newly observed memories may enter the chronicle without adding cards to the current battle. Consumables keep their existing separate budget.

`tests/action_policy.py` runs the actual embedded combat document and actual debate UI in Chromium. Test-only accessors arrange deterministic card examples and shorten animations. Six cases check pre/reaction/discard limits, exhausted hands continuing auto-combat, actual item consumption, interruption of both encounter screens, whole-action rollback, fresh cards and resources on retry, a retried action result and a durable next-month save. This complements the existing 25 save-boundary cases. It is not a full manual playthrough or Android certification.

Original-release save fixtures, five owner stats, defeat balance, mandatory MAIN deadlines and five-loss debate remain separate follow-up work. No APK or Android wrapper is added in this batch; Android testing follows the remaining game/content/art work.

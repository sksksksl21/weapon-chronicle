# Action policy and original-release save checks

Combat receives four memory cards at battle start. There is no draw/recycle loop, no two-card overdrive, and no mid-battle card grant. Use or discard consumes the same one intervention per turn. Choosing a pre-action card reserves the slot; deselect it before discarding. Empty hands leave owner auto-combat available. Newly observed memories may enter the chronicle without replenishing this battle's hand. Consumable use retains its existing separate budget.

`tests/action_policy.py` uses the actual embedded combat document and actual debate UI. Test-only accessors arrange deterministic card examples and shorten animations. It checks pre/reaction/discard limits, exhausted hands continuing auto-combat, real item consumption, interruption of both encounter screens, whole-action rollback, a retried action result and a durable next-month save. It does not claim a full manual battle/debate or Android playthrough.

`tests/fixtures/legacy-saves/provenance.json` records ZIP, HTML and raw save SHA256 for eight original released builds: v3.0, v4.1, v4.7, v4.8, v4.8.3, v5.0, v5.1 and v5.2. These saves were emitted by each untouched release's startup auto-save in isolated Chromium storage. They are authentic release-generated saves, not historical user playthrough saves. `tests/legacy_saves.py` checks five load/save cycles per release, unchanged original backup bytes, retained owner stats, parts, resources, progression and recorded branches. Older versions outside those eight and actual user histories remain outside this fixture coverage.

All three regression scripts run in the remote regression CI job. Browser reports do not establish Android storage portability or 40-chapter human completion.

# Code map / migration boundary

Current build assembles HTML header + one ordered JavaScript block + footer. Order is meaningful: global `state`, legacy renderers and functions are defined in the legacy runtime, later modules extend behavior, `bootstrap.js` starts the game **last**. The build is intentionally simple to keep offline HTML output.

## Decomposition order (incremental)
1. Baseline v5.2 equivalence: build byte equality and smoke/regression tests.
2. Isolate immutable story data and game constants without changing generated behavior.
3. Introduce small tested state accessors and compatibility wrappers for new features.
4. Separate UI modules only with observable behavioral equivalence in 320/360/390px screens.
5. Add independent ending evaluation and aftermath modules; test each outcome with fixtures.
6. Add Android wrapper and storage/migration adapter when portable browser saves are tested.

## Anti-corruption boundary
The largest file `src/legacy/game_runtime.js` is a maintained compatibility layer, not a reason to rewrite it wholesale. New subsystems should read state through validated helpers, not clone conflicting global state. If a future migration introduces ES modules or a bundler, retain a deterministic offline output and migrate old saves explicitly.

## Tests
`tests/regression.py`: checkpoint/committed saves and owner death paths.
`tests/ui_smoke.py`: menu and monthly action smoke.
`tests/history_v50.py`, `tests/history_edges_v50.py`: historical branching.
`tests/aftermath_v51.py`, `tests/aftermath_routes_v51.py`: post-choice content.
`tests/act1_history_v52.py`, `tests/act1_followups_v52.py`, `tests/act1_ending_v52.py`: act-one consequences.

Tests built with browser HTML injection simulate certain state transitions. These should not be called complete manual playthroughs or Android certification tests.

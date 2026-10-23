Direct combat V2 active scope

Attack: 최소공격 최대공격 명중 치명타확률 치명타피해 관통력 공격속도 공명.
Defense: 방어력 회피율 막기확률 막기피해감소 치명저항율 치명피해감소.
Story battles require a versioned V2 snapshot. V1 combat code is excluded from the build manifest.
Legacy saved part IDs survive through the V2 migration mapping; legacy fields are not runtime battle formulas.
Critical and cards precede permanent defense; temporary guard and actual-hit block follow.
Speed-gauge extra attacks do not repeat resource recovery or phases.

BLOCKER: regenerate root index.html before merging. Upload of its 10MB blob failed (HTTP/2 transport).
Run python3 tools/build.py; npm run test:combat-handoff; npm run test:live-combat; npm run test:direct-combat; python3 tools/verify_baseline.py.
Browser rendering, full-play balance, and old-save replay are not yet certified.

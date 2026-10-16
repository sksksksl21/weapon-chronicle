# Weapon Chronicle — Codex baseline rules

This repository is an Android-first, Odyssey-inspired monthly sword-succession RPG. Source-of-truth is the **v5.2 web baseline**. Before implementing features, complete the ZIP import workflow and confirm `npm run build && npm run check && npm run test:smoke` pass.

## Non-negotiable decisions
- Keep the existing 5-act/40-chapter main story, eight historical divergence points and act-one consequences; do not turn history choices into cosmetic dialogue only.
- The Legend Core sword persists; mortal owners die and successors inherit the sword. Sword ownership cannot be voluntarily transferred. No hardcoded original protagonist.
- Each month offers contracts, exploration, investigation and rest. No disappearing options because of unrelated temporary conditions.
- Combat is automatic with limited memory-card intervention. Debates use evidence/rebuttal/pressure with consumable skill choices. Don't add deck-building loops.
- Combat owner stats and sword parts/equipment/inventory must retain their present mechanics. Never silently rebalance.
- Save rule **A**: interrupted event or combat restarts at the beginning of that monthly action, without duplicated rewards. Checkpoint only clears once a finalized save is confirmed.
- Historic world endings and the future Princess Maker-style twelve sword ending categories are distinct. After normal ending, monthly life and inheritance continue. Permanent sword destruction remains game over.
- Preserve old localStorage save key and migration; never replace or invalidate existing player saves casually.
- Use one coherent high-quality pixel art style eventually; avoid replacing current assets with mismatched generated graphics without approval.
- Android delivery from the web code using Capacitor in a later phase. Test on device early; final Play submission uses AAB.

## Change protocol
1. Identify the requested scope, inspect relevant code and document applicable fixed decisions.
2. Conduct a concise internal roundtable: narrative, game mechanics, UI, technical architecture, backward compatibility, test skeptic. Reject unnecessary abstraction and interface clutter.
3. Implement a minimal, reversible change. Prefer small modules and explicit data schemas. Do not rewrite the legacy runtime in one operation.
4. Run the targeted test and **existing regression suite**. Do not claim untested paths passed. Browser suites simulating chapter completions do not equal a full manual playthrough.
5. Summarize actual changed files, tested commands/results, remaining risks, and migration impact in the PR. Use branches and PRs for feature changes; avoid directly rewriting main.
6. Never place secrets, GitHub tokens or user data into code, tests, files or chat output.

## Repository structure after import
- `src/legacy/` current large runtime + existing HTML fragments; preserve exact behavior.
- `src/core/` state, save ledger, checkpoints.
- `src/story/` v5.0-v5.2 historical choices, consequences, monthly followups.
- `tools/build.py` reproduces `index.html`; expected SHA256 is in `docs/BASELINE.md`.
- `tests/`, `docs/`, `.devcontainer/`, `.github/workflows/` contain validation, design, Codespaces and CI.

## Commands
```sh
npm run build
npm run check
npm run test:smoke
npm run test:regression
npm run test:story
npm run dev
```

If import is incomplete, **stop feature work**, do not create replacement game files.

# Weapon Chronicle — Codex / GitHub Codespaces baseline (v5.2)

This repository preserves the **v5.2 playable web baseline** while establishing Git/Codex/Codespaces development. This migration does not rewrite battle, story, or save rules.

## Mobile DEV live preview (source-built)

Open **https://sksksksl21.github.io/weapon-chronicle/play-dev.html** after setting
**Settings → Pages → Deploy from a branch → dev → /(root)**. This preview fetches
all source fragments on the deployed `dev` branch and assembles the exact build
manifest in the browser (including the combat iframe), so the 10 MB generated
`index.html` does not need to be uploaded for every quick iteration. The regular
`index.html` remains the offline/release build output, and `main` is unchanged.
The preview depends on a network connection, whereas the bundled HTML can run
offline. Browser/Android manual smoke testing is still required; `play-dev.html`
is not itself proof of battle correctness. If the preview gives 404, check that
GitHub Pages is deploying `dev`, not `main`.

## DEV status / skill-deck preview (2026-10-22)

Open the [DEV preview](https://sksksksl21.github.io/weapon-chronicle/play-dev.html), then
**상태 정보**. Tabs are **소유자 · 방어구 · 무기 · 스킬덱**.

- The initial unnamed sailor is assigned a random named profile from twelve owners
  with distinct base Martial / Survival / Social attributes and short backgrounds.
  Existing named owners remain unchanged; successor story owners retain their authored identities.
- Armor slots show protection / HP / mobility and never offensive modifiers.
- Sword status displays a central assembled sword with four selectable parts on each side.
- A battle deck has exactly ten unique equipped cards, shuffled into a four-card opening
  hand; a separate 20-slot skill inventory holds unlockable cards. Click an inventory
  card → **장착** → the intended equipped slot. Non-starter, unequipped cards can be
  dismantled for one shard. Old story engravings unlock matching skill inventory cards.
- Catalog has 21 existing combat-card IDs and four rarity levels. Ten cards are granted
  initially. Future content may award skills via `WC_STATUS_SKILLDECK_V1.grant(id)`.
  This API has no automatic exploration reward assignment yet.
- Added `skillDeckData` is an additive saved field. `main` stays frozen.
  Use `npm run test:status` for the focused Node check.
- `index.html` is the old checked-in offline bundle until rebuilt and committed.
  Test this version through `play-dev.html`; remote mobile rendering has not
  been certified. Existing save data should be backed up before extensive testing.

## Quick start (Codespaces)
Open **Code → Codespaces → Create codespace on main**. The container setup installs the Python Playwright testing dependency and a browser. From the Codespaces terminal:

```bash
npm run build
npm run check
npm run dev
```

Open the forwarded **port 5173** in the browser to play. The served file is the generated root `index.html`. If the startup script reports an installation issue, run `bash scripts/setup.sh`.

## Local workflow
Requires Node.js 22+, Python 3.11+, and for browser tests Playwright Chromium (`python -m playwright install chromium`).

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
python -m playwright install chromium
npm run build
npm run check
npm run test:smoke
npm run dev
```

When tests cannot find `/usr/bin/chromium`, they automatically use Playwright's installed Chromium.

## Single source of truth
- `src/legacy/game_runtime.js`: current legacy game. Refactor gradually, with behavior tests.
- `src/core/`: save ledger/checkpoint code in fixed build order.
- `src/story/`: v5.0–5.2 historical divergence, aftermath, act-one integration.
- `src/legacy/html_before_script.html`: page structure, styles, embedded assets.
- `src/legacy/html_after_script.html`: trailing document markup.
- `src/legacy/bootstrap.js`: startup logic.
- `tools/build.py`: concatenates the above in established order to produce root `index.html` (offline-capable).
- `tests/`: inherited browser/regression tests. Some tests use simulations and do not represent complete human playthroughs.
- `docs/`: binding design decisions, migration checklist, compatibility, and future tasks.

## Commands
`npm run build`: regenerate the bundled HTML.  `npm run check`: syntax plus generated build integrity; `npm run test:smoke`: UI/menu/one monthly action; `npm run test:story`: historical branches/aftereffects/act-one tests. `npm run test:regression`: save/recovery boundary tests. `npm run dev`: local server on port 5173.

## Android plan
Keep web development and browser tests primary; add Capacitor after this repository baseline is reproducible and old save portability has a clear implementation/test plan. Android storage is **not automatically the same as browser localStorage**. Ship APK for field test, generate AAB only for Play submission.

## Baseline status
This repo is an **engineering baseline**, not a declaration that the entire game, final pixel art, 12 sword endings or Android wrapper have shipped. For frozen original SHA and checks see docs/BASELINE.md.

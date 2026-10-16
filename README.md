# Weapon Chronicle — Codex / GitHub Codespaces

Android-first Odyssey-inspired sword succession RPG. **Migration baseline: v5.2**, maintained in a private repository.

## Status

- GitHub repository initialized and Codex rules committed (`AGENTS.md`).
- One-time import workflow committed (`.github/workflows/import-v52.yml`).
- **Full playable source has not yet been imported**: upload the pinned baseline ZIP to begin.

## One-time source import from mobile or desktop

1. Download **`weapon_chronicle_codex_baseline_v52.zip`** from the ChatGPT conversation.
2. Open this repository's **Code** tab on GitHub. Choose **Add file → Upload files** (mobile browsers may need **Desktop site**).
3. Upload the ZIP **as-is to the repository root**. Filename must be exactly `weapon_chronicle_codex_baseline_v52.zip`; commit to `main`.
4. Open **Actions → Import Weapon Chronicle v5.2 baseline**. Wait for a successful run. It verifies ZIP SHA256, safely extracts source, recreates the game HTML, checks JavaScript, compares its frozen checksum, removes the ZIP from Git tracking, and commits the full project.
5. Confirm `src/`, `tests/`, `docs/`, `index.html`, `package.json` and `.devcontainer/` appear in the root.
6. In GitHub choose **Code → Codespaces → Create codespace on main** and run:

```bash
npm run build
npm run check
npm run test:smoke
npm run dev
```

Open forwarded port 5173 to play in the browser. If the Actions workflow fails, **do not** begin Codex feature work; share the failed job log.

## Development policy

`AGENTS.md` documents frozen game decisions, minimal-change code review, internal roundtable checks and regression requirements. Codex can propose branches/PRs for future work. Source-of-truth is GitHub, not ZIP attachments after import.

Historical world conclusions are distinct from future 12 sword-life endings. Interrupted actions use checkpoint **A** recovery; no duplicate rewards. Save compatibility, 40-chapter progression, inheritance and Android-first packaging remain fixed.

The importer is only a bootstrap tool. Subsequent work uses normal Git commits and pull requests.

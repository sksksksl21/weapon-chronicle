#!/usr/bin/env bash
set -euo pipefail
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium
printf '\nSetup ready. Run: npm run build && npm run check && npm run dev\n'

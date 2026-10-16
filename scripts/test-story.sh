#!/usr/bin/env bash
set -euo pipefail
for f in  tests/history_v50.py tests/history_edges_v50.py  tests/aftermath_v51.py tests/aftermath_routes_v51.py  tests/act1_history_v52.py tests/act1_followups_v52.py tests/act1_ending_v52.py; do
  echo "Running $f"
  python3 "$f"
done

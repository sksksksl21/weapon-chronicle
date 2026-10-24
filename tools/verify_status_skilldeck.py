#!/usr/bin/env python3
"""Run the status test using its own real-module dependency loader."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]

if __name__ == "__main__":
    subprocess.run(["node", "tests/status_skilldeck_v1.js"], cwd=ROOT, check=True)

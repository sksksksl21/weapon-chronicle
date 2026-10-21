#!/usr/bin/env python3
"""Validate v5.2 baseline reproducibility and aggregate JS syntax; does not modify the game."""
import hashlib, subprocess, sys, tempfile
from pathlib import Path
from build_sources import compose
root=Path(__file__).resolve().parents[1]
expected, js, combat = compose(root)
built=(root/'index.html').read_text(encoding='utf8')
assert built==expected,'Generated index.html out of date: run npm run build'
assert (root/'combat_story.html').read_bytes()==combat, 'Generated combat_story.html out of date: run npm run build'
with tempfile.TemporaryDirectory() as t:
    p=Path(t)/'built.js';p.write_text(js,encoding='utf8')
    subprocess.run(['node','--check',str(p)],check=True)
print('PASS: deterministic build, JS syntax, output SHA256='+hashlib.sha256(built.encode()).hexdigest())

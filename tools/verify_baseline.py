#!/usr/bin/env python3
"""Validate v5.2 baseline reproducibility and aggregate JS syntax; does not modify the game."""
import hashlib, subprocess, sys, tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'src'
parts=[source/'legacy'/'game_runtime.js',source/'core'/'save_ledger_v48.js',source/'core'/'action_checkpoint_v482.js',source/'core'/'checkpoint_v483.js',source/'story'/'history_branch_v50.js',source/'story'/'world_aftermath_v51.js',source/'story'/'act1_history_v52.js',source/'legacy'/'bootstrap.js']
header=(source/'legacy'/'html_before_script.html').read_text(encoding='utf8')
footer=(source/'legacy'/'html_after_script.html').read_text(encoding='utf8')
js='\n'.join(p.read_text(encoding='utf8') for p in parts)
expected=header+'<script>\n'+js+'\n</script>'+footer
built=(root/'index.html').read_text(encoding='utf8')
assert built==expected,'Generated index.html out of date: run npm run build'
with tempfile.TemporaryDirectory() as t:
    p=Path(t)/'built.js';p.write_text(js,encoding='utf8')
    subprocess.run(['node','--check',str(p)],check=True)
print('PASS: deterministic build, JS syntax, output SHA256='+hashlib.sha256(built.encode()).hexdigest())

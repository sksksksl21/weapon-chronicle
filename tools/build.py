#!/usr/bin/env python3
"""Assemble source fragments in original order. Bundle remains one offline HTML."""
from pathlib import Path
from hashlib import sha256
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'src'
parts=[source/'legacy'/'game_runtime.js',source/'core'/'save_ledger_v48.js',source/'core'/'action_checkpoint_v482.js',source/'core'/'checkpoint_v483.js',source/'story'/'history_branch_v50.js',source/'story'/'world_aftermath_v51.js',source/'story'/'act1_history_v52.js',source/'legacy'/'bootstrap.js']
header=(source/'legacy'/'html_before_script.html').read_text(encoding='utf8')
footer=(source/'legacy'/'html_after_script.html').read_text(encoding='utf8')
script='\n'.join(p.read_text(encoding='utf8') for p in parts)
html=header+'<script>\n'+script+'\n</script>'+footer
(ROOT/'index.html').write_text(html,encoding='utf8')
print('built',len(html),'bytes',sha256(html.encode()).hexdigest())

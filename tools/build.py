#!/usr/bin/env python3
"""Assemble source fragments in original order. Bundle remains one offline HTML."""
from pathlib import Path
from hashlib import sha256
from build_sources import compose
ROOT=Path(__file__).resolve().parents[1]
html, script, combat = compose(ROOT)
(ROOT/'index.html').write_text(html,encoding='utf8')
(ROOT/'combat_story.html').write_bytes(combat)
print('built',len(html),'bytes',sha256(html.encode()).hexdigest())

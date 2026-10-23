"""One ordered source manifest and exact-position legacy includes."""
from base64 import b64encode

SCRIPT_PARTS = (
    'legacy/game_runtime.js', 'core/save_ledger_v48.js',
    'core/action_checkpoint_v482.js', 'core/checkpoint_v483.js',
    'story/history_branch_v50.js', 'story/world_aftermath_v51.js',
    'story/act1_history_v52.js',
    'core/direct_combat_stats_v2.js', 'core/direct_combat_runtime_v2.js',
    'core/live_combat_handoff_v1.js', 'core/equipment_pool_v1.js',
    'core/merchant_stock_v1.js', 'core/status_skilldeck_v1.js', 'legacy/bootstrap.js',
)


def compose(root):
    source = root / 'src'
    combat_text = (source / 'combat/story_combat.html').read_text(encoding='utf8')
    for module in ('direct_combat_stats_v2',):
        marker = '/* @include:' + module + ' */'
        assert combat_text.count(marker) == 1, f'Expected one {marker}'
        combat_text = combat_text.replace(marker, (source / ('core/' + module + '.js')).read_text(encoding='utf8'))
    # The configurable ten-card deck is built from the original combat catalog.
    # Keep this source-side transform identical to play-dev.html and dev-play.html.
    old_deck = 'const BASE_DECK=["aim1","aim2","guard","over","blood","feint","giant","last","reroll","reverse","counter","endure"];'
    new_deck = ('const BASE_DECK=(()=>{const fallback=["aim1","guard","over","blood","feint","giant","reroll","reverse","counter","endure"];'
                'const raw=STORY_FRAME?.dataset?.skillDeck||STORY_PARAMS.get("skillDeck")||"";'
                'try{const cards=JSON.parse(raw);if(Array.isArray(cards)&&cards.length===10&&'
                'new Set(cards).size===10&&cards.every(id=>typeof id==="string"&&CARD_DB[id]))return cards;}catch(e){}'
                'return fallback;})();')
    assert combat_text.count(old_deck) == 1, 'Expected one base deck marker'
    combat_text = combat_text.replace(old_deck, new_deck)
    for tag, card in [('carapace_gap','storyGap'),('left_behind','storyLeft'),
                      ('silent_prayer','storyPrayer'),('cyclops_gap','mainCyclops'),
                      ('carry_them','mainCarry')]:
        line = "if(STORY_SKILLS.has('"+tag+"')) BASE_DECK.push('"+card+"');"
        assert combat_text.count(line) == 1, 'Expected one story deck expansion '+tag
        combat_text = combat_text.replace(line, '// Earned story cards enter only when equipped in the ten-slot deck.')
    combat = combat_text.encode('utf8')
    includes = {
        '/* @include:combat-document */': 'const COMBAT_DOC_B64="' + b64encode(combat).decode('ascii') + '";',
        '/* @include:main-chapters-v47 */': (source / 'story/main_chapters_v47.js').read_text(encoding='utf8').removesuffix('\n'),
    }
    scripts = [(source / p).read_text(encoding='utf8') for p in SCRIPT_PARTS]
    for marker, content in includes.items():
        assert sum(s.count(marker) for s in scripts) == 1, f'Expected one {marker}'
        scripts = [s.replace(marker, content) for s in scripts]
    js = '\n'.join(scripts)
    html = (source / 'legacy/html_before_script.html').read_text(encoding='utf8') + '<script>\n' + js + '\n</script>' + (source / 'legacy/html_after_script.html').read_text(encoding='utf8')
    return html, js, combat

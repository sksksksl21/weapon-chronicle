"""One ordered source manifest and exact-position legacy includes."""
from base64 import b64encode
import json
from pathlib import Path, PurePosixPath


def load_module_manifest(root):
    """Validate dependency order; same JSON drives offline and both previews."""
    data=json.loads((root/'src/module_manifest.json').read_text(encoding='utf8'))
    if data.get('schema')!=1 or not isinstance(data.get('modules'),list):
        raise ValueError('Unsupported game module manifest')
    entries=data['modules']
    if not entries or entries[0].get('id')!='legacy-runtime' or entries[-1].get('id')!='bootstrap':
        raise ValueError('Legacy wrapper must be first; bootstrap must be last')
    seen=set()
    paths=set()
    for item in entries:
        ident=item.get('id')
        path=item.get('path')
        depends=item.get('requires')
        if not isinstance(ident,str) or not ident or ident in seen:
            raise ValueError('Duplicate or missing game module id')
        if not isinstance(path,str) or PurePosixPath(path).is_absolute() or (
                '..' in PurePosixPath(path).parts) or not path.endswith('.js') or path in paths:
            raise ValueError('Unsafe or duplicate game module path: '+str(path))
        if not isinstance(depends,list) or len(depends)!=len(set(depends)):
            raise ValueError('Invalid module dependencies: '+ident)
        for required in depends:
            if required not in seen:
                raise ValueError('Missing or late dependency '+str(required)+' for '+ident)
        if not (root/'src'/path).is_file():
            raise ValueError('Missing module source: '+path)
        paths.add(path)
        seen.add(ident)
    # Explicit critical interface map. Keep these contracts visible as files
    # move instead of silently permitting a different provider implementation.
    boundaries={'module-services':'core/module_services_v1.js',
                'equipment':'core/equipment_pool_v1.js',
                'merchant':'core/merchant_stock_v1.js',
                'status':'core/status_skilldeck_v1.js',
                'economy':'core/economy_rewards_v1.js',
                'combat-runtime':'core/direct_combat_runtime_v2.js',
                'save-ledger':'core/save_ledger_v48.js',
                'checkpoint':'core/checkpoint_v483.js',
                'act1-history':'story/act1_history_v52.js'}
    by_id={entry['id']:entry['path'] for entry in entries}
    for ident,expected in boundaries.items():
        if by_id.get(ident)!=expected:
            raise ValueError('Missing contract module: '+ident)
    # The legacy file opens the shared IIFE and must remain first. Install the
    # registry immediately after it, before any feature can consume services.
    if len(entries)<2 or entries[1].get('id')!='module-services':
        raise ValueError('Module registry must precede feature modules after legacy wrapper')
    return tuple(item['path'] for item in entries)


SCRIPT_PARTS=load_module_manifest(Path(__file__).resolve().parents[1])


def compose(root):
    source = root / 'src'
    combat_text = (source / 'combat/story_combat.html').read_text(encoding='utf8')
    for module in ('combat_math_v1', 'legacy_combat_sources_v1'):
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
    # Combat runs inside its own iframe; give it the matching HUD palette
    # without changing actor placement, mechanics or saved state.
    combat_theme = (source / 'ui/combat_theme_v8.css').read_text(encoding='utf8')
    assert combat_text.count('</body>') == 1, 'Expected a single combat body'
    assert '</style>' not in combat_theme, 'Combat theme must be CSS only'
    combat_text = combat_text.replace('</body>',
        '<style id="wc-combat-theme-v8">\n' + combat_theme +
        '\n</style>\n</body>', 1)
    combat = combat_text.encode('utf8')
    includes = {
        '/* @include:combat-document */': 'const COMBAT_DOC_B64="' + b64encode(combat).decode('ascii') + '";',
        '/* @include:main-chapters-v47 */': (source / 'story/main_chapters_v47.js').read_text(encoding='utf8').removesuffix('\n'),
    }
    scripts = [(source / p).read_text(encoding='utf8') for p in SCRIPT_PARTS]
    # The status module no longer starts the registry while bootstrap is
    # still registering modules. Share the exact same source with the offline
    # build and both browser-based dev previews; bootstrap alone starts it.
    assert '.initialize()' not in scripts[SCRIPT_PARTS.index('core/status_skilldeck_v1.js')], (
        'Status may not initialize the game module lifecycle before bootstrap')
    for marker, content in includes.items():
        assert sum(s.count(marker) for s in scripts) == 1, f'Expected one {marker}'
        scripts = [s.replace(marker, content) for s in scripts]
    js = '\n'.join(scripts)
    # Apply one theme last, after the historical inline styles. This keeps
    # gameplay markup and original art intact and makes dev/offline builds match.
    tail = (source / 'legacy/html_after_script.html').read_text(encoding='utf8')
    theme = (source / 'ui/unified_theme_v8.css').read_text(encoding='utf8')
    assert tail.count('</body>') == 1, 'Expected a single closing body tag'
    assert '</style>' not in theme, 'Theme must be CSS only'
    tail = tail.replace('</body>', '<style id="wc-unified-theme-v8">\n'
                        + theme + '\n</style>\n</body>', 1)
    html = ((source / 'legacy/html_before_script.html').read_text(encoding='utf8')
            + '<script>\n' + js + '\n</script>' + tail)
    return html, js, combat

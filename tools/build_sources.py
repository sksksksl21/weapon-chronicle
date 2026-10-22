"""One ordered source manifest and exact-position legacy includes."""
from base64 import b64encode

SCRIPT_PARTS = (
    'legacy/game_runtime.js', 'core/save_ledger_v48.js',
    'core/action_checkpoint_v482.js', 'core/checkpoint_v483.js',
    'story/history_branch_v50.js', 'story/world_aftermath_v51.js',
    'story/act1_history_v52.js',
    'core/combat_math_v1.js', 'core/legacy_combat_sources_v1.js',
    'core/live_combat_handoff_v1.js', 'legacy/bootstrap.js',
)


def compose(root):
    source = root / 'src'
    combat = (source / 'combat/story_combat.html').read_bytes()
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

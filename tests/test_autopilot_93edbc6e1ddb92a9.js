const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('historical endings retain their records and continuation while displaying an illustration', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/story/history_branch_v50.js'), 'utf8');
  const start = source.indexOf('openV47Epilogue=function(){');
  const end = source.indexOf('const _v50Render=render;', start);
  assert.ok(start >= 0 && end > start, 'Locate the actual historical ending renderer');
  const renderSource = source.slice(start, end);
  const missingIllustrations = [];

  for (const key of ['restored', 'legacy', 'council', 'fracture', 'exile']) {
    const ending = { key, title: key, subtitle: 'Historical outcome', body: 'A remembered voyage.\n\n'.repeat(120) + 'FINAL BODY LINE' };
    const history = { pivots: { palace: 'parley' }, ending };
    const chapter = { stage: 41, complete: true, results: [{ chapter: 40, path: 'a' }] };
    const before = JSON.stringify({ history, chapter });
    let markup = '';
    let closed = 0;
    const button = {};
    const context = {
      ensureV47: () => chapter,
      v50HistoricalEnding: () => ending,
      v50EnsureHistory: () => history,
      V50_PIVOTS: { 38: { key: 'palace', title: 'Palace', effects: { parley: 'Negotiated settlement' } } },
      openModal: html => { markup = html; },
      modalHead: (title, subtitle) => '<header>' + title + subtitle + '</header>',
      bindClose: () => {},
      closeModal: () => { closed += 1; },
      $: id => id === 'v50EndClose' ? button : null
    };
    vm.runInNewContext(renderSource, context);
    context.openV47Epilogue();
    assert.ok(markup.includes(ending.body), 'The full long ending body must survive rendering');
    assert.ok(markup.includes('Palace: Negotiated settlement'), 'The chosen historical branch must remain visible');
    assert.ok(markup.includes('id="v50EndClose"'), 'Continuation must remain available after the ending');
    button.onclick();
    assert.equal(closed, 1, 'The continuation choice closes the ending');
    assert.equal(JSON.stringify({ history, chapter }), before, 'Viewing and leaving the ending must preserve the completed branch and history');
    if (!markup.includes('<img') && !markup.includes('<picture') && !markup.includes('<canvas') && !markup.includes('<svg')) {
      missingIllustrations.push(key);
    }
  }
  assert.equal(missingIllustrations.length, 0, 'Historical ending screens must render an illustration; missing: ' + missingIllustrations.join(', '));
});

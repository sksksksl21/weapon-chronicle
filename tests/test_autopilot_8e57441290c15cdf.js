const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('codex name search updates results without an unsupported search-input selection operation', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/legacy/game_runtime.js'), 'utf8');
  const start = source.indexOf('function renderEquipmentCodex(){');
  const end = source.indexOf('\nfunction inventoryTabs(', start);
  assert.ok(start >= 0 && end > start, 'The actual codex renderer must be available');

  let markup = '';
  let focused = false;
  const search = {
    value: '',
    selectionStart: null,
    focus() { focused = true; },
    setSelectionRange() {
      const error = new Error('Selection is unsupported for input type search');
      error.name = 'InvalidStateError';
      throw error;
    }
  };
  const controls = { codexSearch: search, codexSlot: {}, codexRarity: {}, codexReset: {} };
  const view = { slot: '', rarity: '', search: '', selected: '', compare: '' };
  const rows = [
    { id: 'iron', kind: 'weapon', slot: 'blade', item: { name: 'Iron Blade' } },
    { id: 'silver', kind: 'weapon', slot: 'blade', item: { name: 'Silver Blade' } }
  ];
  const context = vm.createContext({
    equipmentCodexView: view,
    codexRows: () => rows,
    codexEscape: value => String(value),
    codexSlot: value => value,
    codexRarity: () => 'common',
    codexStatus: () => ({ text: 'owned' }),
    modalHead: () => '',
    openModal: html => { markup = html; },
    bindClose: () => {},
    document: {
      getElementById: id => controls[id] || null,
      querySelectorAll: () => []
    }
  });
  vm.runInContext(source.slice(start, end), context);
  context.renderEquipmentCodex();
  assert.ok(markup.includes('data-codex-id="iron"'));
  assert.ok(markup.includes('data-codex-id="silver"'));

  search.value = 'sILVer';
  let failure = null;
  try {
    search.oninput({ target: search });
  } catch (error) {
    failure = error.name;
  }
  assert.equal(view.search, 'sILVer');
  assert.ok(markup.includes('data-codex-id="silver"'));
  assert.equal(markup.includes('data-codex-id="iron"'), false);
  assert.equal(focused, true);
  assert.equal(failure, null, 'Typing in the codex search must finish without InvalidStateError on a search input');
});

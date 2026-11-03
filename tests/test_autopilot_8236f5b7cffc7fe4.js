const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '../src/core/module_services_v1.js'), 'utf8'
);

function loadRegistry() {
  const sandbox = { module: { exports: {} }, exports: {} };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'module_services_v1.js' });
  const pending = [sandbox, sandbox.module.exports];
  const visited = new Set();
  while (pending.length) {
    const candidate = pending.shift();
    if (!candidate || typeof candidate !== 'object' || visited.has(candidate)) continue;
    visited.add(candidate);
    if (typeof candidate.register === 'function' &&
        typeof candidate.get === 'function' &&
        typeof candidate.initialize === 'function') return candidate;
    for (const key of Object.keys(candidate)) {
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
      if (descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        pending.push(descriptor.value);
      }
    }
  }
  assert.ok(false, 'Module services must expose a registry with register, get, and initialize');
}

test('module registry honors dependencies, rejects invalid graphs, and delivers events', async () => {
  const registry = loadRegistry();
  const order = [];
  const received = [];
  registry.register({
    id: 'consumer',
    dependencies: ['producer'],
    initialize(services) {
      order.push('consumer');
      services.events.subscribe('chronicle:ready', value => received.push(value));
    }
  });
  registry.register({
    id: 'producer',
    dependencies: [],
    initialize() { order.push('producer'); }
  });
  await registry.initialize();
  assert.equal(order.join(','), 'producer,consumer', 'Dependencies initialize before their consumers');
  assert.ok(registry.get('producer'), 'Registered modules can be retrieved');
  assert.ok(registry.events && typeof registry.events.publish === 'function', 'Registry exposes the shared event service');
  registry.events.publish('chronicle:ready', 'sword');
  assert.equal(received.join(','), 'sword', 'A consumer receives an event without referencing its publisher');

  for (const graph of [
    { modules: [{ id: 'orphan', dependencies: ['absent'] }], diagnostic: /missing|unknown|absent|not found|unregistered/i },
    { modules: [{ id: 'alpha', dependencies: ['beta'] }, { id: 'beta', dependencies: ['alpha'] }], diagnostic: /cycl|circular/i }
  ]) {
    const isolated = loadRegistry();
    const initialized = [];
    for (const entry of graph.modules) {
      isolated.register({
        id: entry.id,
        dependencies: entry.dependencies,
        initialize() { initialized.push(entry.id); }
      });
    }
    let failure;
    try {
      await isolated.initialize();
    } catch (error) {
      failure = error;
    }
    assert.ok(failure, 'Invalid dependency graphs must reject initialization');
    assert.ok(graph.diagnostic.test(String(failure.message)), 'Dependency rejection explains the graph error');
    assert.equal(initialized.length, 0, 'Invalid graphs are rejected before module initialization');
  }
});

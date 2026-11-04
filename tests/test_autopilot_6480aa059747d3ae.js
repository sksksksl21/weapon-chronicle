'use strict';
// Mobile enemy omen (전조) readout and decisive intervention result feedback.
// Contract for src/combat/story_combat.html:
//   - a dedicated #enemyOmen readout inside the battle scene (not the hand panel),
//     with three distinguishable omen kinds: omenStrike / omenGuard / omenCharge;
//   - the readout must not intercept card taps (pointer-events:none) and must have
//     a narrow-phone (max-width:359px) rule;
//   - a #interventionResult live region that reports only the resolved result.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'combat', 'story_combat.html'), 'utf8');

function cssBlockFor(source, selector) {
  const at = source.indexOf(selector + '{');
  if (at < 0) return '';
  const end = source.indexOf('}', at);
  return source.slice(at, end + 1);
}

test('a1: enemy omen readout exists inside the battle scene, not over the hand', function () {
  const omenAt = html.indexOf('id="enemyOmen"');
  assert.ok(omenAt >= 0, 'story_combat.html has no #enemyOmen element');
  const sceneAt = html.indexOf('class="panel sceneWrap"');
  const cardsAt = html.indexOf('class="panel cardsPanel"');
  assert.ok(sceneAt >= 0 && cardsAt > sceneAt, 'scene and cards panels must exist');
  assert.ok(omenAt > sceneAt && omenAt < cardsAt, '#enemyOmen must sit in the battle scene, not the card hand');
});

test('a1: three omen kinds are distinguishable', function () {
  const kinds = ['omenStrike', 'omenGuard', 'omenCharge'];
  for (const kind of kinds) {
    assert.ok(html.indexOf('.' + kind) >= 0, 'missing style for omen kind ' + kind);
  }
  const strike = cssBlockFor(html, '#enemyOmen.omenStrike');
  const guard = cssBlockFor(html, '#enemyOmen.omenGuard');
  const charge = cssBlockFor(html, '#enemyOmen.omenCharge');
  assert.ok(strike.length > 0 && guard.length > 0 && charge.length > 0, 'each omen kind needs its own #enemyOmen rule');
  assert.notEqual(strike.slice(strike.indexOf('{')), guard.slice(guard.indexOf('{')), 'strike and guard omens look identical');
  assert.notEqual(guard.slice(guard.indexOf('{')), charge.slice(charge.indexOf('{')), 'guard and charge omens look identical');
  assert.notEqual(strike.slice(strike.indexOf('{')), charge.slice(charge.indexOf('{')), 'strike and charge omens look identical');
});

test('a1: omen readout never blocks card input and adapts to narrow phones', function () {
  const base = cssBlockFor(html, '#enemyOmen');
  assert.ok(base.length > 0, 'missing base #enemyOmen rule');
  assert.ok(base.indexOf('pointer-events:none') >= 0, '#enemyOmen must not intercept taps');
  const narrowAt = html.lastIndexOf('@media(max-width:359px)');
  assert.ok(narrowAt >= 0, 'narrow phone media query missing');
  let mentioned = false;
  let from = 0;
  while (true) {
    const at = html.indexOf('@media(max-width:359px)', from);
    if (at < 0) break;
    const close = html.indexOf('}}', at);
    if (html.slice(at, close).indexOf('#enemyOmen') >= 0) mentioned = true;
    from = at + 1;
  }
  assert.ok(mentioned, 'no max-width:359px rule adjusts #enemyOmen');
});

test('a2: intervention result is announced in a dedicated live region', function () {
  const at = html.indexOf('id="interventionResult"');
  assert.ok(at >= 0, 'story_combat.html has no #interventionResult element');
  const tagStart = html.lastIndexOf('<', at);
  const tagEnd = html.indexOf('>', at);
  const tag = html.slice(tagStart, tagEnd + 1);
  assert.ok(tag.indexOf('aria-live="polite"') >= 0, '#interventionResult must be an aria-live region');
  const rule = cssBlockFor(html, '#interventionResult');
  assert.ok(rule.length > 0, 'missing #interventionResult rule');
  assert.ok(rule.indexOf('pointer-events:none') >= 0, '#interventionResult must not block cards or battle controls');
});

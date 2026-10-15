import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommon } from '../shared/params.js';
import { CardError } from '../shared/svg.js';

test('defaults', () => {
    const p = parseCommon({ user: 'alice' });
    assert.equal(p.user, 'alice');
    assert.equal(p.themeName, 'default');
    assert.equal(p.font, 'sans-serif');
    assert.equal(p.borderRadius, 6);
    assert.equal(p.cardWidth, 495);
    assert.equal(p.hideBorder, false);
    assert.equal(p.numberFormat, 'short');
    assert.equal(p.colors.bg, '#ffffff');
});

test('theme sets mode and colors; light is an alias of default', () => {
    const dark = parseCommon({ user: 'a', theme: 'DARK' });
    assert.equal(dark.mode, 'dark');
    assert.equal(dark.colors.bg, '#0d1117');
    assert.equal(parseCommon({ user: 'a', theme: 'light' }).colors.bg, '#ffffff');
    assert.throws(() => parseCommon({ user: 'a', theme: 'nope' }), CardError);
});

test('color overrides: 6 or 8 digits only', () => {
    assert.equal(parseCommon({ user: 'a', bg_color: 'FF00aa' }).colors.bg, '#ff00aa');
    assert.equal(parseCommon({ user: 'a', bg_color: 'ff00aa80' }).colors.bg, '#ff00aa80');
    assert.throws(() => parseCommon({ user: 'a', bg_color: 'red' }), CardError);
    assert.throws(() => parseCommon({ user: 'a', bg_color: '#fff' }), CardError);
    assert.throws(() => parseCommon({ user: 'a', title_color: 'fff' }), CardError);
});

test('font falls back to sans-serif', () => {
    assert.equal(parseCommon({ user: 'a', font: 'monospace' }).font, 'monospace');
    assert.equal(parseCommon({ user: 'a', font: 'Comic Sans' }).font, 'sans-serif');
});

test('numbers clamp, bad numbers error', () => {
    assert.equal(parseCommon({ user: 'a', border_radius: '999' }).borderRadius, 50);
    assert.equal(parseCommon({ user: 'a', border_radius: '-3' }).borderRadius, 0);
    assert.throws(() => parseCommon({ user: 'a', border_radius: 'big' }), CardError);
    const w = { def: 500, min: 400, max: 700 };
    assert.equal(parseCommon({ user: 'a', card_width: '100' }, { cardWidth: w }).cardWidth, 400);
});

test('booleans', () => {
    assert.equal(parseCommon({ user: 'a', hide_border: 'true' }).hideBorder, true);
    assert.equal(parseCommon({ user: 'a', disable_animations: '1' }).disableAnimations, true);
    assert.throws(() => parseCommon({ user: 'a', hide_border: 'yes' }), CardError);
});

test('hide keeps only values allowed for the card', () => {
    const p = parseCommon({ user: 'a', hide: 'Stars, bogus ,prs' }, { hide: ['stars', 'prs'] });
    assert.deepEqual([...p.hide].sort(), ['prs', 'stars']);
});

test('userAlias and array query values', () => {
    assert.equal(parseCommon({ username: 'bob' }, { userAlias: 'username' }).user, 'bob');
    assert.equal(parseCommon({ user: ['x', 'y'] }).user, 'x');
});
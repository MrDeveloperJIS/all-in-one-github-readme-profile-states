import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeXml, shortNumber, formatNumber, fontStack, errorCard } from '../shared/svg.js';

test('escapeXml', () => {
    assert.equal(escapeXml(`<a href="x">&'</a>`), '&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
});

test('shortNumber', () => {
    assert.equal(shortNumber(0), '0');
    assert.equal(shortNumber(999), '999');
    assert.equal(shortNumber(1000), '1k');
    assert.equal(shortNumber(1500), '1.5k');
    assert.equal(shortNumber(999999), '1M');
    assert.equal(shortNumber(2300000), '2.3M');
    assert.equal(shortNumber('x'), '0');
});

test('formatNumber long vs short', () => {
    assert.equal(formatNumber(1500, 'long'), '1500');
    assert.equal(formatNumber(1500, 'short'), '1.5k');
});

test('fontStack allowlist blocks injection', () => {
    assert.equal(fontStack('Monospace'), 'monospace');
    assert.equal(fontStack('Arial'), 'sans-serif');
    assert.equal(fontStack('x" onload="alert(1)'), 'sans-serif');
});

test('errorCard is escaped, valid-looking SVG with no external references', () => {
    const svg = errorCard('<script>alert(1)</script> & more');
    assert.ok(svg.startsWith('<svg'));
    assert.ok(!svg.includes('<script'));
    assert.ok(svg.includes('&lt;script&gt;'));
    assert.ok(!/href=|@import|url\(/i.test(svg));
});
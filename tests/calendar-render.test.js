import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommon } from '../shared/params.js';
import { buildGrid } from '../calendar-graph/dates.js';
import { renderCalendar } from '../calendar-graph/render.js';
import { CARD_WIDTH } from '../calendar-graph/options.js';

function build(query) {
    const params = parseCommon({ user: 'alice', ...query }, { cardWidth: CARD_WIDTH });
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2026-03-10T00:00:00Z');
    const counts = new Map([
        ['2024-06-01', 4],
        ['2025-12-31', 9],
        ['2026-01-02', 1],
    ]);
    const grid = buildGrid(counts, start, end);
    return renderCalendar({ ...grid, params, username: 'alice' });
}

test('animated card has a scroll animation and year switching', () => {
    const svg = build({ theme: 'dark' });
    assert.ok(svg.includes('<animateTransform'));
    assert.ok(svg.includes('<animate attributeName="opacity"'));
    assert.ok(svg.includes('#39d353')); // dark scale
});

test('disable_animations renders a static grid with no animation tags', () => {
    const svg = build({ disable_animations: 'true' });
    assert.ok(!svg.includes('<animate'));
    assert.ok(svg.includes('#216e39')); // light scale (default theme)
    assert.match(svg, /<text [^>]*>Jan 2026<\/text>/); // year change shown on the January label
});

test('no external references other than the SVG namespace', () => {
    for (const q of [{}, { disable_animations: 'true' }]) {
        const svg = build(q);
        const urls = svg.match(/https?:\/\/[^"'\s)]+/g) ?? [];
        assert.deepEqual(urls, ['http://www.w3.org/2000/svg']);
        assert.ok(!/href=|@import/i.test(svg));
    }
});

test('font param and border options apply', () => {
    const svg = build({ font: 'monospace', hide_border: 'true', border_radius: '10' });
    assert.ok(svg.includes('font-family="monospace"'));
    assert.ok(svg.includes('rx="10"'));
    assert.ok(!svg.includes('stroke-width'));
});

test('card_width sets the SVG width', () => {
    assert.ok(build({ card_width: '760' }).includes('width="760"'));
});
test('weekday labels are three characters', () => {
    const svg = build({});
    for (const day of ['Mon', 'Wed', 'Fri']) assert.ok(svg.includes(`>${day}</text>`), day);
});
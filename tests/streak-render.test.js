import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommon } from '../shared/params.js';
import { CARD_WIDTH, HIDE_VALUES, parseExcludeDays, parseStreakOptions } from '../streak-stats/options.js';
import { formatDay, renderStreak } from '../streak-stats/render.js';

const NOW = new Date('2026-03-10T12:00:00Z');
const result = {
    total: 1234,
    firstDate: '2020-05-03',
    longest: { length: 30, start: '2024-01-01', end: '2024-01-30' },
    current: { length: 5, start: '2026-03-06', end: '2026-03-10' },
};

function render(query, res = result) {
    const params = parseCommon({ user: 'ada', ...query }, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES });
    const options = parseStreakOptions(params);
    return renderStreak({ result: res, params, options, now: NOW });
}

test('renders the three labels, numbers and date ranges', () => {
    const svg = render({});
    assert.ok(svg.startsWith('<svg'));
    for (const label of ['Total Contributions', 'Current Streak', 'Longest Streak']) {
        assert.ok(svg.includes(label));
    }
    assert.ok(svg.includes('>1.2k<'));
    assert.ok(svg.includes('May 3, 2020 - Present'));
    assert.ok(svg.includes('Mar 6 - Present')); // current year omitted
    assert.ok(svg.includes('Jan 1, 2024 - Jan 30, 2024'));
});

test('formatDay omits the current year only', () => {
    assert.equal(formatDay('2026-03-03', NOW), 'Mar 3');
    assert.equal(formatDay('2024-12-01', NOW), 'Dec 1, 2024');
});

test('number_format=long, hide and card size', () => {
    const svg = render({ number_format: 'long', hide: 'total', card_width: '600', card_height: '220' });
    assert.ok(svg.includes('width="600"'));
    assert.ok(svg.includes('height="220"'));
    assert.ok(!svg.includes('Total Contributions'));
    assert.ok(svg.includes('>30<'));
});

test('hiding every stat throws a card error', () => {
    assert.throws(() => render({ hide: 'total,current,longest' }), /Nothing to show/);
});

test('disable_animations removes animation tags; animated card has them', () => {
    assert.ok(!render({ disable_animations: 'true' }).includes('<animate'));
    assert.ok(render({}).includes('<animate'));
});

test('font falls back and no external references', () => {
    const svg = render({ font: '"><script>' });
    assert.ok(svg.includes('font-family="sans-serif"'));
    assert.ok(!svg.includes('<script>'));
    const urls = svg.match(/https?:\/\/[^"'\s)]+/g) ?? [];
    assert.deepEqual(urls, ['http://www.w3.org/2000/svg']);
    assert.ok(!/href=|@import/i.test(svg));
});

test('zero current streak shows no date range for it', () => {
    const svg = render({}, { ...result, current: { length: 0, start: null, end: null } });
    assert.ok(!svg.includes('Mar 6 - Present'));
});

test('exclude_days and mode parsing', () => {
    assert.deepEqual([...parseExcludeDays('Sun,sat')].sort(), [0, 6]);
    assert.deepEqual([...parseExcludeDays('Thursday')], [4]);
    assert.throws(() => parseExcludeDays('funday'));
    const params = parseCommon({ user: 'ada', mode: 'monthly' }, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES });
    assert.throws(() => parseStreakOptions(params));
});
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yearWindows, buildGrid, getRange } from '../calendar-graph/dates.js';
import { parseStartYear, resolveStartYear } from '../shared/params.js';
import { CardError } from '../shared/svg.js';

test('yearWindows: one window per year, current year ends at now', () => {
    const now = new Date('2026-03-10T12:00:00Z');
    const w = yearWindows(2024, now);
    assert.equal(w.length, 3);
    assert.equal(w[0].from, '2024-01-01T00:00:00.000Z');
    assert.equal(w[0].to, '2024-12-31T23:59:59.000Z');
    assert.equal(w[2].from, '2026-01-01T00:00:00.000Z');
    assert.equal(w[2].to, now.toISOString());
});

test('buildGrid: Sunday-aligned, padded days are out of range', () => {
    const start = new Date('2026-01-01T00:00:00Z'); // Thursday
    const end = new Date('2026-01-10T00:00:00Z'); // Saturday
    const counts = new Map([
        ['2026-01-01', 3],
        ['2026-01-10', 5],
    ]);
    const { weeks, totalContributions, maxDailyCount } = buildGrid(counts, start, end);
    assert.equal(weeks.length, 2);
    assert.ok(weeks.every((w) => w.length === 7));
    assert.equal(weeks[0][0].date, '2025-12-28');
    assert.equal(weeks[0][0].inRange, false);
    assert.equal(weeks[0][4].date, '2026-01-01');
    assert.equal(weeks[0][4].count, 3);
    assert.equal(totalContributions, 8);
    assert.equal(maxDailyCount, 5);
});

test('getRange runs Jan 1 of startYear to the start of today (UTC)', () => {
    const r = getRange(2020, new Date('2026-05-05T18:30:00Z'));
    assert.equal(r.startDate.toISOString(), '2020-01-01T00:00:00.000Z');
    assert.equal(r.endDate.toISOString(), '2026-05-05T00:00:00.000Z');
});

test('parseStartYear and resolveStartYear', () => {
    const now = new Date('2026-10-13T00:00:00Z');
    assert.equal(parseStartYear(undefined, now), undefined);
    assert.equal(parseStartYear('2020', now), 2020);
    for (const bad of ['20', '2004', '2027', 'abcd']) {
        assert.throws(() => parseStartYear(bad, now), CardError);
    }
    assert.equal(resolveStartYear(undefined, 2018), 2018);
    assert.equal(resolveStartYear(2012, 2018), 2018); // before account creation -> clamped up
    assert.equal(resolveStartYear(2021, 2018), 2021);
});
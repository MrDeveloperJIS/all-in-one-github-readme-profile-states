import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreaks } from '../streak-stats/calculate.js';

// 2026-03-10 is a Tuesday. Sun Mar 8, Sat Mar 7, Fri Mar 6, Thu Mar 5.
const NOW = new Date('2026-03-10T12:00:00Z');
const counts = (...days) => new Map(days.map((d) => (Array.isArray(d) ? d : [d, 1])));

test('no contribution today: streak counts up to yesterday', () => {
    const r = calculateStreaks(counts('2026-03-07', '2026-03-08', '2026-03-09'), { now: NOW });
    assert.deepEqual(r.current, { length: 3, start: '2026-03-07', end: '2026-03-09' });
});

test('contribution today extends the streak', () => {
    const r = calculateStreaks(counts('2026-03-08', '2026-03-09', '2026-03-10'), { now: NOW });
    assert.equal(r.current.length, 3);
    assert.equal(r.current.end, '2026-03-10');
});

test('yesterday and today both empty: current streak is 0, longest is kept', () => {
    const r = calculateStreaks(counts('2026-03-07', '2026-03-08'), { now: NOW });
    assert.equal(r.current.length, 0);
    assert.deepEqual(r.longest, { length: 2, start: '2026-03-07', end: '2026-03-08' });
});

test('year boundary', () => {
    const r = calculateStreaks(counts('2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'), { now: NOW });
    assert.deepEqual(r.longest, { length: 4, start: '2025-12-30', end: '2026-01-02' });
    assert.equal(r.current.length, 0);
});

test('longest and current can be different runs', () => {
    const r = calculateStreaks(
        counts('2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-03-09', '2026-03-10'),
        { now: NOW }
    );
    assert.equal(r.longest.length, 5);
    assert.equal(r.current.length, 2);
});

test('total and first date', () => {
    const r = calculateStreaks(counts(['2026-01-05', 3], ['2026-02-01', 4], ['2026-03-10', 5]), { now: NOW });
    assert.equal(r.total, 12);
    assert.equal(r.firstDate, '2026-01-05');
});

test('no contributions at all', () => {
    const r = calculateStreaks(new Map(), { now: NOW });
    assert.equal(r.total, 0);
    assert.equal(r.firstDate, null);
    assert.equal(r.current.length, 0);
    assert.equal(r.longest.length, 0);
});

test('weekly mode: a week counts with one contribution, an empty past week breaks it', () => {
    // weeks start Sunday: Feb 1, (Feb 8 empty), Feb 15, Feb 22, Mar 1, Mar 8 (current, empty)
    const r = calculateStreaks(counts('2026-02-01', '2026-02-17', '2026-02-27', '2026-03-03'), {
        now: NOW,
        mode: 'weekly',
    });
    assert.deepEqual(r.current, { length: 3, start: '2026-02-15', end: '2026-03-07' });
    assert.equal(r.longest.length, 3);
});

test('weekly mode: the current week counts when it has a contribution', () => {
    const r = calculateStreaks(counts('2026-03-03', '2026-03-10'), { now: NOW, mode: 'weekly' });
    assert.equal(r.current.length, 2);
    assert.equal(r.current.end, '2026-03-10');
});

test('excluded days are skipped without breaking the streak', () => {
    const days = counts('2026-03-05', '2026-03-06', '2026-03-09'); // Thu, Fri, Mon
    const plain = calculateStreaks(days, { now: NOW });
    assert.equal(plain.current.length, 1);

    const excluded = calculateStreaks(days, { now: NOW, excludeDays: new Set([0, 6]) }); // Sun, Sat
    assert.deepEqual(excluded.current, { length: 3, start: '2026-03-05', end: '2026-03-09' });
});

test('an excluded weekday with contributions still counts', () => {
    const r = calculateStreaks(counts('2026-03-06', '2026-03-07', '2026-03-09'), {
        now: NOW,
        excludeDays: new Set([0, 6]),
    });
    assert.equal(r.current.length, 3); // Fri, Sat (counted), Mon; Sun skipped
});
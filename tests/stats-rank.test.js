import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRank } from '../readme-stats/rank.js';
import { parseCommitsYear } from '../readme-stats/options.js';

test('zero activity ranks C at the 100th percentile', () => {
    const r = calculateRank({});
    assert.equal(r.level, 'C');
    assert.equal(Math.round(r.percentile), 100);
});

test('huge activity ranks S', () => {
    const r = calculateRank({
        commits: 1e6, prs: 1e6, issues: 1e6, reviews: 1e6, stars: 1e9, followers: 1e9,
    });
    assert.equal(r.level, 'S');
});

test('include-all-commits uses a higher median (lower rank for same commits)', () => {
    const base = { commits: 500, prs: 20, issues: 10, reviews: 1, stars: 30, followers: 5 };
    assert.ok(calculateRank({ ...base, allCommits: true }).percentile > calculateRank(base).percentile);
});

test('parseCommitsYear validates', () => {
    const now = new Date(Date.UTC(2026, 9, 13));
    assert.equal(parseCommitsYear(undefined, now), undefined);
    assert.equal(parseCommitsYear('2024', now), 2024);
    assert.throws(() => parseCommitsYear('24', now));
    assert.throws(() => parseCommitsYear('2004', now));
    assert.throws(() => parseCommitsYear('2027', now));
});
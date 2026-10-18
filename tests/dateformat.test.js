import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDateFormat, formatWithParts } from '../shared/dateformat.js';

const fmt = (pattern, key = '2026-03-06') => formatWithParts(key, parseDateFormat(pattern)); // 2026-03-06 is a Friday

test('common patterns', () => {
    assert.equal(fmt('dd mm yy'), '06 03 26');
    assert.equal(fmt('dd-mmm-yyyy'), '06-Mar-2026');
    assert.equal(fmt('dd/mm/yyyy'), '06/03/2026');
    assert.equal(fmt('mm/dd/yyyy'), '03/06/2026');
    assert.equal(fmt('yyyy-mm-dd'), '2026-03-06');
    assert.equal(fmt('mmmm d, yyyy'), 'March 6, 2026');
    assert.equal(fmt('ddd, d mmm yyyy'), 'Fri, 6 Mar 2026');
    assert.equal(fmt('dddd dd mmmm'), 'Friday 06 March');
    assert.equal(fmt('d.m.yy', '2024-12-01'), '1.12.24');
});

test('case-insensitive and trimmed', () => {
    assert.equal(fmt(' DD-MMM-YYYY '), '06-Mar-2026');
});

test('empty means default', () => {
    assert.equal(parseDateFormat(undefined), undefined);
    assert.equal(parseDateFormat('  '), undefined);
});

test('rejects bad patterns', () => {
    for (const bad of ['dd mm y', 'ddddd', 'mmmmm', 'yyy', 'day', 'dd<mm', '"dd"', 'd'.repeat(31)]) {
        assert.throws(() => parseDateFormat(bad), /Invalid date_format/, bad);
    }
});
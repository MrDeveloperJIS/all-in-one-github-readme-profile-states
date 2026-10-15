import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getToken, getWhitelist, getCacheSeconds } from '../shared/env.js';

beforeEach(() => {
    delete process.env.GH_TOKEN;
    delete process.env.WHITELIST;
    delete process.env.CACHE_SECONDS;
});

test('getToken trims and returns null when missing', () => {
    assert.equal(getToken(), null);
    process.env.GH_TOKEN = '  ghp_abc  ';
    assert.equal(getToken(), 'ghp_abc');
});

test('getWhitelist: empty denies all, * allows all, list is lowercased', () => {
    assert.deepEqual(getWhitelist(), []);
    process.env.WHITELIST = 'Alice, BOB ,';
    assert.deepEqual(getWhitelist(), ['alice', 'bob']);
    process.env.WHITELIST = 'alice,*';
    assert.equal(getWhitelist(), '*');
});

test('getCacheSeconds: default, clamp, zero, invalid', () => {
    assert.equal(getCacheSeconds(), 21600);
    process.env.CACHE_SECONDS = '0';
    assert.equal(getCacheSeconds(), 0);
    process.env.CACHE_SECONDS = '999999';
    assert.equal(getCacheSeconds(), 86400);
    process.env.CACHE_SECONDS = '-5';
    assert.equal(getCacheSeconds(), 21600);
    process.env.CACHE_SECONDS = 'abc';
    assert.equal(getCacheSeconds(), 21600);
    process.env.CACHE_SECONDS = '600';
    assert.equal(getCacheSeconds(), 600);
});
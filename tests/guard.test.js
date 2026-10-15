import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkUser, isValidUsername } from '../shared/guard.js';
import { CardError } from '../shared/svg.js';

beforeEach(() => {
    delete process.env.WHITELIST;
});

test('username format', () => {
    assert.ok(isValidUsername('MrDeveloperJIS'));
    assert.ok(isValidUsername('a-b'));
    assert.ok(!isValidUsername('-ab'));
    assert.ok(!isValidUsername('ab-'));
    assert.ok(!isValidUsername('a--b'));
    assert.ok(!isValidUsername('a'.repeat(40)));
    assert.ok(!isValidUsername('bad<name>'));
});

test('whitelist is case-insensitive', () => {
    process.env.WHITELIST = 'alice';
    assert.equal(checkUser('ALICE'), 'ALICE');
    assert.throws(() => checkUser('bob'), CardError);
});

test('* allows anyone, empty denies everyone', () => {
    process.env.WHITELIST = '*';
    assert.equal(checkUser('anyone'), 'anyone');
    delete process.env.WHITELIST;
    assert.throws(() => checkUser('anyone'), /not allowed/);
});

test('missing and invalid user', () => {
    process.env.WHITELIST = '*';
    assert.throws(() => checkUser(''), /Missing/);
    assert.throws(() => checkUser('bad name'), /Invalid/);
});
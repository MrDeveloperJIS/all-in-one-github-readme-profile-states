import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cacheControl, sendSvg, sendError } from '../shared/respond.js';
import { CardError } from '../shared/svg.js';

function fakeRes() {
    const headers = {};
    return {
        statusCode: 0,
        headers,
        body: '',
        setHeader(k, v) {
            headers[k.toLowerCase()] = v;
        },
        end(b) {
            this.body = b;
        },
    };
}

test('cacheControl', () => {
    assert.equal(cacheControl(0), 'no-store');
    assert.equal(
        cacheControl(21600),
        'public, max-age=21600, s-maxage=21600, stale-while-revalidate=43200'
    );
});

test('sendSvg sets SVG content type and cache headers', () => {
    const res = fakeRes();
    sendSvg(res, '<svg/>', 100);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'image/svg+xml; charset=utf-8');
    assert.match(res.headers['cache-control'], /max-age=100/);
});

test('sendSvg with 0 seconds is no-store', () => {
    const res = fakeRes();
    sendSvg(res, '<svg/>', 0);
    assert.equal(res.headers['cache-control'], 'no-store');
});

test('sendError returns 200 SVG with a 300 s cache', () => {
    const res = fakeRes();
    sendError(res, new CardError('Nope'));
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'image/svg+xml; charset=utf-8');
    assert.match(res.headers['cache-control'], /max-age=300/);
    assert.match(res.body, /Nope/);
});

test('unknown errors never leak their message', () => {
    const res = fakeRes();
    const orig = console.error;
    console.error = () => { };
    sendError(res, new Error('secret ghp_123'));
    console.error = orig;
    assert.ok(!res.body.includes('ghp_123'));
    assert.match(res.body, /Something went wrong/);
});
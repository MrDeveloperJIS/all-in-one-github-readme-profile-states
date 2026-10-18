import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARDS, PARAMS, appliesTo, defaultOf, optionsOf, specOf } from '../builder/meta.js';
import { buildQuery, buildUrl } from '../builder/url.js';
import { renderDemo } from '../builder/preview.js';
import { parseCommon } from '../shared/params.js';

const NOW = new Date('2026-10-18T12:00:00Z');
const demo = (card, query = {}) => renderDemo(card, { user: 'ada', ...query }, NOW);
const isError = (svg) => svg.includes('<title>Error</title>');

test('every card renders a demo with default options', () => {
    for (const { id } of CARDS) {
        const svg = demo(id);
        assert.ok(svg.startsWith('<svg'), id);
        assert.ok(!isError(svg), id);
    }
});

test('demo output has no external references (nothing can be fetched)', () => {
    for (const { id } of CARDS) {
        const urls = demo(id).match(/https?:\/\/[^"'\s)]+/g) ?? [];
        assert.deepEqual(urls, ['http://www.w3.org/2000/svg'], id);
    }
});

test('the page blocks network access with a CSP and loads only local files', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /img-src data:/);
    assert.ok(!/(?:src|href)="https?:/i.test(html));
});

test('builder defaults match what the server uses', () => {
    const find = (name) => PARAMS.find((p) => p.name === name);
    const common = parseCommon({ user: 'x' }, {});
    assert.equal(defaultOf(find('border_radius'), 'stats'), common.borderRadius);
    assert.equal(defaultOf(find('theme'), 'stats'), common.themeName);
    assert.equal(defaultOf(find('font'), 'stats'), common.font);
    assert.equal(defaultOf(find('number_format'), 'stats'), common.numberFormat);
    for (const card of ['calendar', 'stats', 'streak']) {
        assert.equal(defaultOf(find('card_width'), card), specOf(find('card_width'), card).def);
    }
});

test('every select, checkbox and number value in the form is accepted by the real parsers', () => {
    for (const { id: card } of CARDS) {
        for (const p of PARAMS.filter((q) => appliesTo(q, card))) {
            if (p.type === 'select' || p.type === 'checks') {
                for (const option of optionsOf(p, card)) {
                    const svg = demo(card, { [p.name]: option });
                    assert.ok(!isError(svg), `${card} ${p.name}=${option}`);
                }
            }
            if (p.type === 'number') {
                const { min, max } = specOf(p, card);
                for (const value of [min, max]) assert.ok(!isError(demo(card, { [p.name]: String(value) })), `${card} ${p.name}=${value}`);
            }
        }
    }
});

test('bad input shows the same error card the API would', () => {
    assert.match(demo('stats', { rank_icon: 'star' }), /Invalid rank_icon/);
    assert.match(demo('streak', { date_format: 'day' }), /Invalid date_format/);
    assert.match(demo('calendar', { bg_color: 'xyz' }), /Invalid bg_color/);
});

test('options visibly change the demo', () => {
    assert.match(demo('stats', { commits_year: '2024' }), /Total Commits \(2024\)/);
    assert.match(demo('stats', { show: 'reviews' }), /PRs Reviewed/);
    assert.match(demo('streak', { date_format: 'dd-mmm-yyyy' }), /\d\d-[A-Z][a-z]{2}-\d{4}/);
    assert.notEqual(demo('streak', { mode: 'weekly' }), demo('streak'));
    assert.notEqual(demo('calendar', { start_year: '2024' }), demo('calendar'));
});

test('the demo data is the same every time', () => {
    assert.equal(demo('calendar'), demo('calendar'));
});

test('url: only non-default params, readable separators, user placeholder', () => {
    assert.equal(buildUrl('https://app.example/', 'stats', {}), 'https://app.example/api/stats?user=YOU');
    const url = buildUrl('https://app.example', 'streak', {
        user: ' ada ',
        theme: 'dark',
        font: 'sans-serif', // default, omitted
        hide: ['total', 'longest'],
        exclude_days: ['Sat', 'Sun'],
        date_format: 'dd/mm/yy',
        card_height: '195', // default, omitted
        hide_border: 'false', // off, omitted
        disable_animations: 'true',
        bg_color: '#00000000',
        custom_title: 'ignored: not a streak param',
    });
    assert.equal(
        url,
        'https://app.example/api/streak?user=ada&theme=dark&disable_animations=true&hide=total,longest&bg_color=00000000&exclude_days=Sun,Sat&date_format=dd/mm/yy'
    );
});

test('url: spaces are %20 and values are escaped', () => {
    const url = buildUrl('https://a.b', 'stats', { custom_title: 'My Stats & more', rank_icon: 'github' });
    assert.ok(url.includes('rank_icon=github'));
    assert.ok(url.includes('custom_title=My%20Stats%20%26%20more'));
});

test('url: params of other cards are dropped, hide values are limited to the card', () => {
    const pairs = buildQuery('stats', { hide: ['stars', 'total'], mode: 'weekly', speed: '100' });
    assert.deepEqual(pairs, [['user', 'YOU'], ['hide', 'stars']]);
});
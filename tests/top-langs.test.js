import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommon } from '../shared/params.js';
import { CardError } from '../shared/svg.js';
import { CARD_WIDTH, HIDE_VALUES, LAYOUTS, parseTopLangsOptions } from '../top-langs/options.js';
import { fetchTopLangs } from '../top-langs/fetch.js';
import { renderTopLangs } from '../top-langs/render.js';
import handler from '../api/top-langs.js';

const parse = (query = {}) => {
    const params = parseCommon({ user: 'ada', ...query }, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES, userAlias: 'username' });
    return { params, options: parseTopLangsOptions(params) };
};

const LANGS = [
    { name: 'JavaScript', color: '#f1e05a', size: 60, percent: 60 },
    { name: 'Python', color: '#3572a5', size: 30, percent: 30 },
    { name: 'Game Maker Language & <More>', color: '#858585', size: 10, percent: 10 },
];
const render = (query = {}, langs = LANGS) => {
    const { params, options } = parse(query);
    return renderTopLangs({ data: { name: 'Ada', login: 'ada', langs }, params, options });
};

// ---- options ----

test('options: defaults and per-layout widths', () => {
    const { options } = parse();
    assert.equal(options.layout, 'normal');
    assert.equal(options.langsCount, 5);
    assert.equal(options.sizeWeight, 1);
    assert.equal(options.countWeight, 0);
    assert.equal(options.width, 300);
    assert.equal(parse({ layout: 'compact' }).options.width, 400);
    assert.equal(parse({ layout: 'compact' }).options.langsCount, 6);
    assert.equal(parse({ layout: 'donut' }).options.width, 340);
    assert.equal(parse({ card_width: '500' }).options.width, 500);
    assert.equal(parse({ card_width: '5' }).options.width, 280); // clamped
});

test('options: hide and exclude_repo are lowercased lists', () => {
    const { options } = parse({ hide: 'HTML, CSS,,C++', exclude_repo: 'Old-Repo' });
    assert.deepEqual([...options.hideLangs], ['html', 'css', 'c++']);
    assert.deepEqual([...options.excludeRepos], ['old-repo']);
});

test('options: invalid values are rejected, out-of-range numbers are clamped', () => {
    assert.throws(() => parse({ layout: 'bars' }), CardError);
    assert.throws(() => parse({ langs_count: 'many' }), CardError);
    assert.throws(() => parse({ hide_title: 'maybe' }), CardError);
    assert.equal(parse({ langs_count: '99' }).options.langsCount, 20);
    assert.equal(parse({ langs_count: '0' }).options.langsCount, 1);
    assert.equal(parse({ size_weight: '9' }).options.sizeWeight, 5);
    assert.equal(parse({ custom_title: 'x'.repeat(100) }).options.customTitle.length, 60);
});

// ---- render ----

test('render: every layout is well-formed and escapes language names', () => {
    for (const layout of LAYOUTS) {
        for (const disable_animations of ['true', 'false']) {
            const svg = render({ layout, disable_animations });
            assert.ok(svg.startsWith('<svg'), layout);
            assert.ok(!svg.includes('<More>'), layout);
            assert.ok(svg.includes('&amp;') || svg.includes('…'), layout); // name escaped, or cut before the "&"
            assert.ok(!/[^&]&(?!amp;|lt;|gt;|quot;|apos;)/.test(svg), `${layout}: bare ampersand`);
            const m = svg.match(/width="(\d+)" height="(\d+)" viewBox="0 0 (\d+) (\d+)"/);
            assert.equal(m[1], m[3]);
            assert.equal(m[2], m[4]);
        }
    }
});

test('render: nothing external, only the SVG namespace', () => {
    for (const layout of LAYOUTS) {
        const urls = render({ layout }).match(/https?:\/\/[^"'\s)]+/g) ?? [];
        assert.deepEqual(urls, ['http://www.w3.org/2000/svg'], layout);
    }
});

test('render: title options', () => {
    assert.ok(render().includes('Most Used Languages'));
    assert.ok(render({ custom_title: 'My <b>langs' }).includes('My &lt;b&gt;langs'));
    assert.ok(!render({ hide_title: 'true' }).includes('Most Used Languages</text>'));
    const withTitle = Number(render().match(/height="(\d+)"/)[1]);
    const without = Number(render({ hide_title: 'true' }).match(/height="(\d+)"/)[1]);
    assert.equal(withTitle - without, 30);
});

test('render: hide_progress removes bars (normal) and percentages (compact)', () => {
    assert.ok(render({ hide_progress: 'true' }).split('<rect').length < render().split('<rect').length);
    assert.ok(render({ layout: 'compact' }).includes('JavaScript 60.00%'));
    assert.ok(!render({ layout: 'compact', hide_progress: 'true' }).includes('%'));
});

test('render: disable_animations drops all animate elements', () => {
    for (const layout of LAYOUTS) {
        assert.ok(render({ layout }).includes('<animate'), layout);
        assert.ok(!render({ layout, disable_animations: 'true' }).includes('<animate'), layout);
    }
});

test('render: long names are shortened so they cannot run into the numbers', () => {
    for (const layout of LAYOUTS) {
        const svg = render({ layout, card_width: '280' });
        const visible = (svg.match(/<text[^>]*>[^<]*<\/text>/g) ?? []).join('');
        assert.ok(visible.includes('…'), layout);
        assert.ok(!visible.includes('More&gt;'), layout); // the tail is cut off (the aria-label keeps the full name)
    }
    assert.ok(render({}, [{ name: 'Go', color: '#00add8', size: 1, percent: 100 }]).includes('>Go<'));
});

test('render: chart segments add up to the full circle', () => {
    for (const layout of ['donut', 'donut-vertical', 'pie']) {
        const svg = render({ layout, disable_animations: 'true' });
        const lens = [...svg.matchAll(/stroke-dasharray="([\d.]+) ([\d.]+)"/g)].map((m) => Number(m[1]));
        const circumference = Number([...svg.matchAll(/stroke-dasharray="([\d.]+) ([\d.]+)"/g)][0].slice(1).reduce((a, b) => Number(a) + Number(b)));
        assert.equal(lens.length, 3, layout);
        assert.ok(Math.abs(lens.reduce((a, b) => a + b, 0) - circumference) < 0.1, layout);
    }
});

test('render: bottom padding matches the other layouts (no big empty area)', () => {
    const svg = render({ layout: 'normal', disable_animations: 'true' });
    const height = Number(svg.match(/height="(\d+)"/)[1]);
    const lastBar = [...svg.matchAll(/translate\(25, ([\d.]+)\)/g)].map((m) => Number(m[1])).pop() + 18;
    assert.ok(height - lastBar >= 20 && height - lastBar <= 32, `gap ${height - lastBar}`);
});

// ---- fetch (GitHub is stubbed) ----

const realFetch = globalThis.fetch;
const realToken = process.env.GH_TOKEN;
const realWhitelist = process.env.WHITELIST;
let calls;

function stubGitHub(pages) {
    calls = [];
    globalThis.fetch = async (url, init) => {
        calls.push(JSON.parse(init.body).variables);
        const body = pages[calls.length - 1];
        return { ok: true, status: 200, json: async () => body };
    };
}
const repo = (name, ...langs) => ({
    name,
    languages: { edges: langs.map(([n, size, color]) => ({ size, node: { name: n, color } })) },
});
const page = (nodes, next) => ({
    data: { user: { name: 'Ada L', login: 'ada', repositories: { nodes, pageInfo: { hasNextPage: Boolean(next), endCursor: next ?? null } } } },
});

beforeEach(() => {
    process.env.GH_TOKEN = 'test-token';
    process.env.WHITELIST = '*';
});
afterEach(() => {
    globalThis.fetch = realFetch;
    if (realToken === undefined) delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN = realToken;
    if (realWhitelist === undefined) delete process.env.WHITELIST;
    else process.env.WHITELIST = realWhitelist;
});

test('fetch: sums bytes across repos, follows pagination, ranks biggest first', async () => {
    stubGitHub([
        page([repo('a', ['JavaScript', 600, '#f1e05a'], ['CSS', 100, '#663399'])], 'cur1'),
        page([repo('b', ['JavaScript', 200, '#f1e05a'], ['Python', 300, '#3572a5'])]),
    ]);
    const data = await fetchTopLangs('ada', parse().options);
    assert.deepEqual(calls.map((c) => c.after), [null, 'cur1']);
    assert.deepEqual(data.langs.map((l) => l.name), ['JavaScript', 'Python', 'CSS']);
    assert.ok(Math.abs(data.langs[0].percent - (800 / 1200) * 100) < 1e-9); // 800 of 1200 bytes
    assert.ok(Math.abs(data.langs.reduce((s, l) => s + l.percent, 0) - 100) < 1e-9);
    assert.equal(data.name, 'Ada L');
});

test('fetch: hide, exclude_repo (case-insensitive) and langs_count', async () => {
    const nodes = [
        repo('Keep', ['Go', 500, '#00add8'], ['HTML', 400, '#e34c26'], ['Rust', 100, '#dea584']),
        repo('Old-Repo', ['Perl', 9000, '#0298c3']),
    ];
    stubGitHub([page(nodes)]);
    let data = await fetchTopLangs('ada', parse({ hide: 'html', exclude_repo: 'old-repo' }).options);
    assert.deepEqual(data.langs.map((l) => l.name), ['Go', 'Rust']);

    stubGitHub([page(nodes)]);
    data = await fetchTopLangs('ada', parse({ langs_count: '1', exclude_repo: 'old-repo' }).options);
    assert.deepEqual(data.langs.map((l) => l.name), ['Go']);
    assert.equal(data.langs[0].percent, 100);
});

test('fetch: count_weight can outrank size, size_weight=0 ranks by repo count only', async () => {
    const nodes = [
        repo('a', ['Big', 100000, '#111111'], ['Small', 10, '#222222']),
        repo('b', ['Small', 10, '#222222']),
        repo('c', ['Small', 10, '#222222']),
    ];
    stubGitHub([page(nodes)]);
    let data = await fetchTopLangs('ada', parse().options);
    assert.equal(data.langs[0].name, 'Big');

    stubGitHub([page(nodes)]);
    data = await fetchTopLangs('ada', parse({ size_weight: '0', count_weight: '1' }).options);
    assert.equal(data.langs[0].name, 'Small');
});

test('fetch: bad or missing colors fall back to grey, untrusted colors never reach the SVG', async () => {
    stubGitHub([page([repo('a', ['A', 10, null], ['B', 9, '"/><script>'], ['C', 8, '#ABCDEF'])])]);
    const data = await fetchTopLangs('ada', parse().options);
    assert.deepEqual(data.langs.map((l) => l.color), ['#858585', '#858585', '#ABCDEF']);
});

test('fetch: stops after 5 pages', async () => {
    stubGitHub(Array.from({ length: 8 }, (_, i) => page([repo(`r${i}`, ['Go', 10, '#00add8'])], `c${i}`)));
    await fetchTopLangs('ada', parse().options);
    assert.equal(calls.length, 5);
});

test('fetch: no data and unknown user give card errors', async () => {
    stubGitHub([page([repo('a')])]);
    await assert.rejects(fetchTopLangs('ada', parse().options), (e) => e.code === 'no_data');
    stubGitHub([{ data: { user: null } }]);
    await assert.rejects(fetchTopLangs('ada', parse().options), (e) => e.code === 'not_found');
});

// ---- API handler ----

function fakeRes() {
    const res = { headers: {} };
    res.setHeader = (k, v) => (res.headers[k.toLowerCase()] = v);
    res.end = (body) => (res.body = body);
    return res;
}

test('api: returns an SVG, accepts the username alias, and shows errors as SVG cards', async () => {
    stubGitHub([page([repo('a', ['Go', 10, '#00add8'])])]);
    let res = fakeRes();
    await handler({ query: { username: 'ada', layout: 'pie' } }, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'], /image\/svg\+xml/);
    assert.ok(res.body.includes('Most Used Languages'));

    res = fakeRes();
    await handler({ query: { user: 'ada', layout: 'nope' } }, res);
    assert.ok(res.body.includes('Invalid layout'));

    res = fakeRes();
    await handler({ query: {} }, res);
    assert.ok(res.body.includes('Missing'));
});

// ---- builder ----

test('builder: stats/streak hide checkboxes never leak into the top-langs URL (and back)', async () => {
    const { buildQuery, buildUrl } = await import('../builder/url.js');
    const { PARAMS, appliesTo, keyOf } = await import('../builder/meta.js');

    const checks = { hide: ['stars', 'prs'], hide_langs: 'html,c++' };
    assert.deepEqual(buildQuery('stats', checks), [['user', 'YOU'], ['hide', 'stars,prs']]);
    assert.deepEqual(buildQuery('top-langs', checks), [['user', 'YOU'], ['hide', 'html,c++']]);
    assert.deepEqual(buildQuery('top-langs', { hide: ['stars'] }), [['user', 'YOU']]);
    assert.ok(buildUrl('https://a.b', 'top-langs', { hide_langs: 'c++,c#' }).endsWith('hide=c%2B%2B,c%23'));

    // within one card, no two visible params may share a form-state key
    for (const { id } of (await import('../builder/meta.js')).CARDS) {
        const keys = PARAMS.filter((p) => appliesTo(p, id)).map(keyOf);
        assert.equal(new Set(keys).size, keys.length, id);
    }
});

test('builder: top-langs params are built only from what the card understands', async () => {
    const { buildQuery } = await import('../builder/url.js');
    const pairs = buildQuery('top-langs', {
        layout: 'donut',
        langs_count: '8',
        size_weight: '0.5',
        count_weight: '0', // default, omitted
        hide_progress: 'true',
        hide_title: 'true',
        custom_title: 'Langs',
        exclude_repo: 'a,b',
        mode: 'weekly', // streak only
        show: ['stars'], // stats only
    });
    assert.deepEqual(pairs, [
        ['user', 'YOU'],
        ['hide_title', 'true'],
        ['custom_title', 'Langs'],
        ['exclude_repo', 'a,b'],
        ['layout', 'donut'],
        ['langs_count', '8'],
        ['size_weight', '0.5'],
        ['hide_progress', 'true'],
    ]);
    const { renderDemo } = await import('../builder/preview.js');
    const svg = renderDemo('top-langs', Object.fromEntries(pairs));
    assert.ok(!svg.includes('<title>Error</title>'));
    assert.equal((svg.match(/<circle r=/g) ?? []).length, 8);
});
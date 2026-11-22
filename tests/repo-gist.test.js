import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommon } from '../shared/params.js';
import { CardError } from '../shared/svg.js';
import { clip, wrapLines } from '../shared/text.js';
import { CARD_WIDTH as REPO_WIDTH, HIDE_VALUES as REPO_HIDE, parseRepoOptions } from '../repo-card/options.js';
import { fetchRepo } from '../repo-card/fetch.js';
import { renderRepo } from '../repo-card/render.js';
import { CARD_WIDTH as GIST_WIDTH, HIDE_VALUES as GIST_HIDE, parseGistOptions } from '../gist-card/options.js';
import { fetchGist, dominantLanguage } from '../gist-card/fetch.js';
import { renderGist } from '../gist-card/render.js';
import repoHandler from '../api/repo.js';
import gistHandler from '../api/gist.js';

const GIST_ID = '8f3a1c5d2b7e49a6c0d1e2f3a4b5c6d7';

const parseRepo = (query = {}) => {
    const params = parseCommon({ user: 'ada', repo: 'hello', ...query }, { cardWidth: REPO_WIDTH, hide: REPO_HIDE, userAlias: 'username' });
    return { params, options: parseRepoOptions(params) };
};
const parseGist = (query = {}) => {
    const params = parseCommon({ user: 'ada', id: GIST_ID, ...query }, { cardWidth: GIST_WIDTH, hide: GIST_HIDE, userAlias: 'username' });
    return { params, options: parseGistOptions(params) };
};

const REPO = {
    name: 'hello',
    fullName: 'ada/hello',
    description: 'A <b>tiny</b> & friendly project',
    stars: 2400,
    forks: 12,
    language: { name: 'Go', color: '#00add8' },
    archived: false,
    template: false,
    fork: false,
};
const GIST = {
    id: GIST_ID,
    owner: 'ada',
    title: 'debounce.js',
    description: 'Debounce helper',
    stars: 5,
    forks: 0,
    fileCount: 1,
    moreFiles: false,
    language: { name: 'JavaScript', color: '#f1e05a' },
};
const renderR = (query = {}, data = REPO) => {
    const { params, options } = parseRepo(query);
    return renderRepo({ data, params, options });
};
const renderG = (query = {}, data = GIST) => {
    const { params, options } = parseGist(query);
    return renderGist({ data, params, options });
};
const heightOf = (svg) => Number(svg.match(/height="(\d+)"/)[1]);
const visibleText = (svg) => (svg.match(/<text[^>]*>[^<]*<\/text>/g) ?? []).join('');

// ---- shared text helpers ----

test('text: clip adds an ellipsis only when needed', () => {
    assert.equal(clip('short', 10), 'short');
    assert.equal(clip('abcdefghij', 5), 'abcd…');
});

test('text: wrapLines wraps, splits long words and ends with an ellipsis when cut', () => {
    assert.deepEqual(wrapLines('one two three four', 9, 5), ['one two', 'three', 'four']);
    assert.deepEqual(wrapLines('x'.repeat(25), 10, 5), ['x'.repeat(10), 'x'.repeat(10), 'x'.repeat(5)]);
    assert.deepEqual(wrapLines('', 10, 2), []);
    assert.deepEqual(wrapLines('   ', 10, 2), []);
    const cut = wrapLines('aaa bbb ccc ddd eee', 7, 2);
    assert.equal(cut.length, 2);
    assert.ok(cut[1].endsWith('…'));
    for (const line of wrapLines('word '.repeat(40), 12, 3)) assert.ok(line.length <= 12);
});

// ---- repo options ----

test('repo options: defaults, required and validated repo name', () => {
    const { options } = parseRepo();
    assert.equal(options.repo, 'hello');
    assert.equal(options.showOwner, false);
    assert.equal(options.descriptionLines, 2);
    assert.equal(parseRepo().params.cardWidth, 400);
    assert.equal(parseRepo({ card_width: '10' }).params.cardWidth, 250);
    assert.throws(() => parseRepo({ repo: '' }), (e) => e instanceof CardError && e.code === 'missing_repo');
    for (const bad of ['a/b', '..', '.', 'a b', 'x'.repeat(101), '"><script>']) {
        assert.throws(() => parseRepo({ repo: bad }), (e) => e.code === 'invalid_repo', bad);
    }
    assert.equal(parseRepo({ repo: 'my.repo_name-2' }).options.repo, 'my.repo_name-2');
    assert.equal(parseRepo({ description_lines: '9' }).options.descriptionLines, 5);
    assert.throws(() => parseRepo({ show_owner: 'maybe' }), CardError);
});

test('gist options: id is required and must be hex', () => {
    assert.equal(parseGist().options.id, GIST_ID);
    assert.throws(() => parseGist({ id: '' }), (e) => e.code === 'missing_id');
    for (const bad of ['xyz', 'a/b', GIST_ID + 'g', 'a'.repeat(41)]) {
        assert.throws(() => parseGist({ id: bad }), (e) => e.code === 'invalid_id', bad);
    }
});

// ---- render ----

test('repo render: well-formed, escaped, nothing external', () => {
    const svg = renderR();
    assert.ok(svg.startsWith('<svg'));
    assert.ok(!svg.includes('<b>'));
    assert.ok(svg.includes('&lt;b&gt;tiny&lt;/b&gt;'));
    assert.ok(!/[^&]&(?!amp;|lt;|gt;|quot;|apos;)/.test(svg));
    assert.deepEqual(svg.match(/https?:\/\/[^"'\s)]+/g), ['http://www.w3.org/2000/svg']);
    const m = svg.match(/width="(\d+)" height="(\d+)" viewBox="0 0 (\d+) (\d+)"/);
    assert.equal(m[1], m[3]);
    assert.equal(m[2], m[4]);
});

test('repo render: title, owner, badges, numbers', () => {
    assert.ok(renderR().includes('>hello<'));
    assert.ok(renderR({ show_owner: 'true' }).includes('>ada/hello<'));
    assert.ok(renderR().includes('>2.4k<'));
    assert.ok(renderR({ number_format: 'long' }).includes('>2400<'));
    assert.ok(!renderR().includes('Archived'));
    assert.ok(renderR({}, { ...REPO, archived: true, template: true }).includes('>Archived<')); // archived wins
    assert.ok(renderR({}, { ...REPO, template: true }).includes('>Template<'));
    assert.ok(renderR({}, { ...REPO, fork: true }).includes('>Fork<'));
    assert.ok(!renderR({ hide: 'badge' }, { ...REPO, archived: true }).includes('Archived'));
});

test('repo render: hide values remove their parts', () => {
    assert.ok(renderR().includes('>Go<'));
    assert.ok(!renderR({ hide: 'language' }).includes('>Go<'));
    assert.ok(!renderR({ hide: 'stars' }).includes('>2.4k<'));
    assert.ok(!renderR({ hide: 'forks' }).includes('>12<'));
    assert.ok(!renderR({ hide: 'description' }).includes('tiny'));
    assert.ok(heightOf(renderR({ hide: 'description' })) < heightOf(renderR()));
    assert.ok(heightOf(renderR({ hide: 'description,language,stars,forks' })) < heightOf(renderR({ hide: 'description' })));
    assert.ok(!renderR({ hide: 'description,language,stars,forks' }).includes('font-size="12"'));
    assert.ok(!renderR({ hide: 'nonsense' }).includes('<title>Error'));
});

test('repo render: empty description, description_lines and clipping', () => {
    assert.ok(renderR({}, { ...REPO, description: '' }).includes('No description provided'));
    const long = { ...REPO, description: 'word '.repeat(80) };
    const one = renderR({ description_lines: '1' }, long);
    const four = renderR({ description_lines: '4' }, long);
    assert.ok(heightOf(four) > heightOf(one));
    assert.ok(visibleText(one).includes('…'));
    const longName = { ...REPO, name: 'n'.repeat(80), language: { name: 'L'.repeat(40), color: '#123456' } };
    assert.ok(visibleText(renderR({}, longName)).includes('…'));
});

test('repo render: footer wraps to a second row on a narrow card instead of overflowing', () => {
    const wide = renderR({ card_width: '1000' });
    const narrow = renderR({ card_width: '250' }, { ...REPO, language: { name: 'TypeScriptLongName', color: '#3178c6' }, stars: 123456, forks: 98765 });
    assert.ok(heightOf(narrow) > heightOf(wide));
});

test('repo render: disable_animations drops animate elements, colors and border options apply', () => {
    assert.ok(renderR().includes('<animate'));
    assert.ok(!renderR({ disable_animations: 'true' }).includes('<animate'));
    assert.ok(renderR({ title_color: 'ff0000' }).includes('fill="#ff0000"'));
    assert.ok(renderR({ icon_color: '00ff00' }).includes('fill="#00ff00"'));
    assert.ok(renderR({ hide_border: 'true' }).includes('stroke="none"'));
});

test('gist render: title, files, language, stars and forks', () => {
    const svg = renderG();
    assert.ok(svg.includes('>debounce.js<'));
    assert.ok(svg.includes('>1 file<'));
    assert.ok(svg.includes('>JavaScript<'));
    assert.ok(svg.includes('>5<'));
    assert.ok(renderG({ show_owner: 'true' }).includes('>ada/debounce.js<'));
    assert.ok(renderG({}, { ...GIST, fileCount: 3 }).includes('>3 files<'));
    assert.ok(renderG({}, { ...GIST, fileCount: 10, moreFiles: true }).includes('>10+ files<'));
    assert.ok(!renderG({ hide: 'files' }).includes('file<'));
    assert.ok(!renderG({ hide: 'language' }).includes('JavaScript'));
    assert.ok(renderG({}, { ...GIST, language: null }).startsWith('<svg'));
    assert.ok(renderG({}, { ...GIST, description: '' }).includes('No description provided'));
    assert.ok(!renderG({}, { ...GIST, title: '<script>' }).includes('<script>'));
});

// ---- fetch (GitHub is stubbed) ----

const realFetch = globalThis.fetch;
const realToken = process.env.GH_TOKEN;
const realWhitelist = process.env.WHITELIST;
let calls;

function stubGitHub(body) {
    calls = [];
    globalThis.fetch = async (url, init) => {
        calls.push(JSON.parse(init.body));
        return { ok: true, status: 200, json: async () => body };
    };
}

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

const repoNode = (extra = {}) => ({
    name: 'hello',
    nameWithOwner: 'ada/hello',
    description: null,
    stargazerCount: 7,
    forkCount: 2,
    isPrivate: false,
    isArchived: false,
    isTemplate: false,
    isFork: false,
    primaryLanguage: { name: 'Go', color: '#00add8' },
    ...extra,
});

test('repo fetch: maps the GitHub response and sends the right variables', async () => {
    stubGitHub({ data: { repository: repoNode({ isArchived: true }) } });
    const data = await fetchRepo('ada', parseRepo().options);
    assert.deepEqual(calls[0].variables, { login: 'ada', name: 'hello' });
    assert.equal(data.fullName, 'ada/hello');
    assert.equal(data.description, '');
    assert.equal(data.stars, 7);
    assert.equal(data.archived, true);
    assert.deepEqual(data.language, { name: 'Go', color: '#00add8' });
});

test('repo fetch: no language, bad color, private and missing repos', async () => {
    stubGitHub({ data: { repository: repoNode({ primaryLanguage: null }) } });
    assert.equal((await fetchRepo('ada', parseRepo().options)).language, null);

    stubGitHub({ data: { repository: repoNode({ primaryLanguage: { name: 'X', color: '"/><script>' } }) } });
    assert.equal((await fetchRepo('ada', parseRepo().options)).language.color, '#858585');

    stubGitHub({ data: { repository: repoNode({ isPrivate: true }) } });
    await assert.rejects(fetchRepo('ada', parseRepo().options), (e) => e.code === 'private');

    stubGitHub({ data: { repository: null } });
    await assert.rejects(fetchRepo('ada', parseRepo().options), (e) => e.code === 'not_found' && e.message === 'Repository not found.');

    stubGitHub({ data: { repository: null }, errors: [{ type: 'NOT_FOUND', path: ['repository'], message: 'Could not resolve' }] });
    await assert.rejects(fetchRepo('ada', parseRepo().options), (e) => e.message === 'Repository not found.');
});

const gistNode = (extra = {}) => ({
    name: GIST_ID,
    description: 'Debounce helper',
    isPublic: true,
    stargazerCount: 5,
    forks: { totalCount: 2 },
    files: [
        { name: 'debounce.js', size: 400, language: { name: 'JavaScript', color: '#f1e05a' } },
        { name: 'README.md', size: 100, language: { name: 'Markdown', color: '#083fa1' } },
    ],
    ...extra,
});

test('gist fetch: maps the response, title is the first file, dominant language by size', async () => {
    stubGitHub({ data: { user: { login: 'ada', gist: gistNode() } } });
    const data = await fetchGist('ada', parseGist().options);
    assert.deepEqual(calls[0].variables, { login: 'ada', id: GIST_ID });
    assert.equal(data.title, 'debounce.js');
    assert.equal(data.fileCount, 2);
    assert.equal(data.forks, 2);
    assert.equal(data.language.name, 'JavaScript');
    assert.equal(data.owner, 'ada');
});

test('gist fetch: dominantLanguage ignores files without a language', () => {
    assert.equal(dominantLanguage([{ name: 'a', size: 5, language: null }]), null);
    assert.equal(dominantLanguage([]), null);
    const top = dominantLanguage([
        { size: 10, language: { name: 'A', color: null } },
        { size: 6, language: { name: 'B', color: '#112233' } },
        { size: 6, language: { name: 'B', color: '#112233' } },
    ]);
    assert.deepEqual(top, { name: 'B', color: '#112233' });
    assert.equal(dominantLanguage([{ size: 1, language: { name: 'A', color: 'bad' } }]).color, '#858585');
});

test('gist fetch: secret gists, missing gists and unknown users', async () => {
    stubGitHub({ data: { user: { login: 'ada', gist: gistNode({ isPublic: false }) } } });
    await assert.rejects(fetchGist('ada', parseGist().options), (e) => e.code === 'private');

    stubGitHub({ data: { user: { login: 'ada', gist: null } } });
    await assert.rejects(fetchGist('ada', parseGist().options), (e) => e.message === 'Gist not found.');

    stubGitHub({ data: { user: null } });
    await assert.rejects(fetchGist('ada', parseGist().options), (e) => e.message === 'GitHub user not found.');

    stubGitHub({ data: { user: { gist: null } }, errors: [{ type: 'NOT_FOUND', path: ['user', 'gist'], message: 'x' }] });
    await assert.rejects(fetchGist('ada', parseGist().options), (e) => e.message === 'Gist not found.');

    stubGitHub({ data: { user: null }, errors: [{ type: 'NOT_FOUND', path: ['user'], message: 'x' }] });
    await assert.rejects(fetchGist('ada', parseGist().options), (e) => e.message === 'GitHub user not found.');
});

test('gist fetch: empty gist falls back to the id as the title', async () => {
    stubGitHub({ data: { user: { login: 'ada', gist: gistNode({ files: [] }) } } });
    const data = await fetchGist('ada', parseGist().options);
    assert.equal(data.title, GIST_ID);
    assert.equal(data.language, null);
    assert.equal(data.fileCount, 0);
});

// ---- API handlers ----

function fakeRes() {
    const res = { headers: {} };
    res.setHeader = (k, v) => (res.headers[k.toLowerCase()] = v);
    res.end = (body) => (res.body = body);
    return res;
}

test('api/repo: returns an SVG, accepts the username alias, and shows errors as SVG cards', async () => {
    stubGitHub({ data: { repository: repoNode({ description: 'Hi there' }) } });
    let res = fakeRes();
    await repoHandler({ query: { username: 'ada', repo: 'hello' } }, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'], /image\/svg\+xml/);
    assert.ok(res.body.includes('Hi there'));

    res = fakeRes();
    await repoHandler({ query: { user: 'ada' } }, res);
    assert.ok(res.body.includes('Missing &quot;repo&quot;'));

    res = fakeRes();
    await repoHandler({ query: { repo: 'hello' } }, res);
    assert.ok(res.body.includes('Missing &quot;user&quot;'));

    stubGitHub({ data: { repository: repoNode({ isPrivate: true }) } });
    res = fakeRes();
    await repoHandler({ query: { user: 'ada', repo: 'hello' } }, res);
    assert.ok(res.body.includes('Private repositories'));
    assert.ok(!res.body.includes('Hi there'));
});

test('api/gist: returns an SVG and shows errors as SVG cards', async () => {
    stubGitHub({ data: { user: { login: 'ada', gist: gistNode() } } });
    let res = fakeRes();
    await gistHandler({ query: { user: 'ada', id: GIST_ID } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.includes('debounce.js'));

    res = fakeRes();
    await gistHandler({ query: { user: 'ada' } }, res);
    assert.ok(res.body.includes('Missing &quot;id&quot;'));

    res = fakeRes();
    await gistHandler({ query: { user: 'ada', id: 'not-hex!' } }, res);
    assert.ok(res.body.includes('Invalid gist id'));
});

test('api: the whitelist applies to both new cards (no GitHub call for a blocked user)', async () => {
    process.env.WHITELIST = 'someone-else';
    stubGitHub({ data: {} });
    let res = fakeRes();
    await repoHandler({ query: { user: 'ada', repo: 'hello' } }, res);
    assert.ok(res.body.includes('not allowed'));
    res = fakeRes();
    await gistHandler({ query: { user: 'ada', id: GIST_ID } }, res);
    assert.ok(res.body.includes('not allowed'));
    assert.equal(calls.length, 0);
});

test('api: the token never appears in a card, even on failure', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
    const res = fakeRes();
    await repoHandler({ query: { user: 'ada', repo: 'hello' } }, res);
    assert.ok(res.body.includes('rejected the token'));
    assert.ok(!res.body.includes('test-token'));
});

// ---- builder ----

test('builder: repo and gist URLs carry a placeholder until filled in', async () => {
    const { buildUrl, buildQuery } = await import('../builder/url.js');
    assert.equal(buildUrl('https://a.b', 'repo', {}), 'https://a.b/api/repo?user=YOU&repo=YOUR-REPO');
    assert.equal(buildUrl('https://a.b', 'gist', {}), 'https://a.b/api/gist?user=YOU&id=YOUR-GIST-ID');
    assert.deepEqual(buildQuery('repo', { user: 'ada', repo: ' hello ', show_owner: 'true', hide_repo: ['stars', 'total', 'badge'], hide: ['forks'], hide_gist: ['files'] }), [
        ['user', 'ada'],
        ['repo', 'hello'],
        ['hide', 'stars,badge'],
        ['show_owner', 'true'],
    ]);
    assert.deepEqual(buildQuery('gist', { id: GIST_ID, hide_repo: ['stars'], hide_gist: ['files', 'stars'], description_lines: '3' }), [
        ['user', 'YOU'],
        ['id', GIST_ID],
        ['hide', 'files,stars'],
        ['description_lines', '3'],
    ]);
});

test('builder: the repo and gist demos render real card output and react to options', async () => {
    const { renderDemo } = await import('../builder/preview.js');
    const NOW = new Date('2026-10-18T12:00:00Z');
    const repo = renderDemo('repo', { user: 'ada', repo: 'YOUR-REPO', show_owner: 'true' }, NOW);
    assert.ok(repo.includes('>ada/hello-world<'));
    assert.ok(!repo.includes('<title>Error'));
    assert.ok(!renderDemo('repo', { repo: 'YOUR-REPO', hide: 'stars' }, NOW).includes('>2.4k<'));
    const gist = renderDemo('gist', { user: 'ada', id: 'YOUR-GIST-ID' }, NOW);
    assert.ok(gist.includes('>debounce.js<'));
    assert.ok(!gist.includes('<title>Error'));
    assert.match(renderDemo('gist', { id: 'YOUR-GIST-ID', description_lines: 'x' }, NOW), /Invalid description_lines/);
});
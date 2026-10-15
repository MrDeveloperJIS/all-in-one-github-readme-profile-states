import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommon } from '../shared/params.js';
import { CARD_WIDTH, HIDE_VALUES, parseStatsOptions } from '../readme-stats/options.js';
import { calculateRank } from '../readme-stats/rank.js';
import { renderStats } from '../readme-stats/render.js';

const stats = {
    name: 'Ada <Lovelace>',
    login: 'ada',
    stars: 1500,
    commits: 320,
    commitsLabel: 'Total Commits (last year)',
    allCommits: false,
    prs: 40,
    issues: 12,
    contribs: 7,
    reviews: 3,
    followers: 20,
};

function render(query) {
    const params = parseCommon(query, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES, userAlias: 'username' });
    const options = parseStatsOptions(params);
    return renderStats({ stats, rank: calculateRank(stats), params, options });
}

test('renders a valid-looking svg with all rows and escaped title', () => {
    const svg = render({ user: 'ada' });
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('Ada &lt;Lovelace&gt;'));
    for (const label of ['Total Stars Earned', 'Total Commits', 'Total PRs', 'Total Issues', 'Contributed to']) {
        assert.ok(svg.includes(label));
    }
    assert.ok(svg.includes('>1.5k<'));
});

test('number_format=long shows full numbers', () => {
    const svg = render({ user: 'ada', number_format: 'long' });
    assert.ok(svg.includes('>1500<'));
    assert.ok(!svg.includes('1.5k'));
});

test('hide removes the matching rows', () => {
    const svg = render({ user: 'ada', hide: 'stars,prs' });
    assert.ok(!svg.includes('Total Stars Earned'));
    assert.ok(!svg.includes('Total PRs'));
    assert.ok(svg.includes('Total Issues'));
});

test('hide_rank, hide_title and disable_animations', () => {
    const svg = render({ user: 'ada', hide_rank: 'true', hide_title: 'true', disable_animations: 'true' });
    assert.ok(!svg.includes('<circle'));
    assert.ok(!svg.includes('GitHub Stats</text>'));
    assert.ok(!svg.includes('<animate'));
});

test('custom_title is used and escaped; hostile font falls back', () => {
    const svg = render({ user: 'ada', custom_title: 'A & B', font: '"><script>' });
    assert.ok(svg.includes('A &amp; B'));
    assert.ok(svg.includes('font-family="sans-serif"'));
    assert.ok(!svg.includes('<script>'));
});

test('username alias is accepted', () => {
    const params = parseCommon(
        { username: 'ada' },
        { cardWidth: CARD_WIDTH, hide: HIDE_VALUES, userAlias: 'username' }
    );
    assert.equal(params.user, 'ada');
});

test('no external references other than the SVG namespace', () => {
    const svg = render({ user: 'ada' });
    const urls = svg.match(/https?:\/\/[^"'\s)]+/g) ?? [];
    assert.deepEqual(urls, ['http://www.w3.org/2000/svg']);
    assert.ok(!/href=|@import/i.test(svg));
});
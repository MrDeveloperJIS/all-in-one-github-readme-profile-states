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

test('rank_icon=github draws the GitHub mark instead of the rank letter', () => {
    const letter = render({ user: 'ada' });
    assert.ok(letter.includes('font-size="26"'));

    const icon = render({ user: 'ada', rank_icon: 'github' });
    assert.ok(!icon.includes('font-size="26"'));
    assert.ok(icon.includes('viewBox="0 0 16 16"><path fill="#2f80ed"'));
    assert.ok(icon.includes('rank ' + calculateRank(stats).level)); // aria-label keeps the rank

    const hyphen = render({ user: 'ada', 'rank-icon': 'GitHub' });
    assert.equal(hyphen, icon);
});

test('rank_icon rejects unknown values and is ignored with hide_rank', () => {
    assert.throws(() => render({ user: 'ada', rank_icon: 'star' }), /Invalid rank_icon/);
    const svg = render({ user: 'ada', rank_icon: 'github', hide_rank: 'true' });
    assert.ok(!svg.includes('<circle'));
});


test('rank_icon=percentile shows the top percentage', () => {
    const svg = render({ user: 'ada', rank_icon: 'percentile' });
    const top = Math.max(0.1, calculateRank(stats).percentile);
    const shown = top < 10 ? String(Number(top.toFixed(1))) : String(Math.round(top));
    assert.ok(svg.includes('>TOP</text>'));
    assert.ok(svg.includes(`>${shown}%</text>`));
    assert.ok(!svg.includes('font-size="26"'));
});

test('show=reviews adds the PRs Reviewed row; hide=reviews removes it again', () => {
    assert.ok(!render({ user: 'ada' }).includes('PRs Reviewed'));
    const on = render({ user: 'ada', show: 'reviews' });
    assert.ok(on.includes('PRs Reviewed (last year)'));
    assert.ok(on.includes('>3<')); // stats.reviews
    assert.ok(!render({ user: 'ada', show: 'reviews', hide: 'reviews' }).includes('PRs Reviewed'));
    assert.ok(!render({ user: 'ada', show: 'nonsense' }).includes('PRs Reviewed')); // unknown values ignored
});
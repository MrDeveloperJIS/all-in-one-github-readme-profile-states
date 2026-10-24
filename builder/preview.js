// Demo preview: runs the real parsing and render code on made-up data.
// Nothing here talks to GitHub or to the deployed API.
import { parseCommon, resolveStartYear } from '../shared/params.js';
import { CardError, errorCard } from '../shared/svg.js';
import { CARD_WIDTH as CALENDAR_WIDTH, parseCalendarOptions } from '../calendar-graph/options.js';
import { addDays, buildGrid, formatDate, getRange, startOfUTCDay, toUTCDate } from '../calendar-graph/dates.js';
import { renderCalendar } from '../calendar-graph/render.js';
import { CARD_WIDTH as STATS_WIDTH, HIDE_VALUES as STATS_HIDE, parseStatsOptions } from '../readme-stats/options.js';
import { calculateRank } from '../readme-stats/rank.js';
import { renderStats } from '../readme-stats/render.js';
import { CARD_WIDTH as STREAK_WIDTH, HIDE_VALUES as STREAK_HIDE, parseStreakOptions } from '../streak-stats/options.js';
import { calculateStreaks } from '../streak-stats/calculate.js';
import { renderStreak } from '../streak-stats/render.js';
import { CARD_WIDTH as LANGS_WIDTH, HIDE_VALUES as LANGS_HIDE, parseTopLangsOptions } from '../top-langs/options.js';
import { renderTopLangs } from '../top-langs/render.js';

export const DEMO_CREATED_YEAR = 2019;
const DAY_MS = 24 * 60 * 60 * 1000;

function mulberry32(seed) {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Same numbers every time: busy and quiet stretches, quieter weekends, one long run in 2023, active for the last 9 days. */
export function demoCounts(now = new Date()) {
    const rand = mulberry32(20190101);
    const counts = new Map();
    const end = startOfUTCDay(now);
    let i = 0;
    for (let d = toUTCDate(DEMO_CREATED_YEAR, 0, 1); d <= end; d = addDays(d, 1), i++) {
        const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
        const chance = (weekend ? 0.35 : 0.8) * (0.55 + 0.45 * Math.sin(i / 40));
        const roll = rand();
        const size = rand();
        const recent = (end - d) / DAY_MS < 9;
        const key = formatDate(d);
        const longRun = key >= '2023-03-02' && key <= '2023-05-15'; // gives the longest streak something to show
        if (recent || longRun || roll < chance) counts.set(key, 1 + Math.floor(size * size * 14));
    }
    return counts;
}

function demoStats(login, options) {
    let commits = 320;
    let commitsLabel = 'Total Commits (last year)';
    let allCommits = false;
    if (options.commitsYear) {
        commits = 410;
        commitsLabel = `Total Commits (${options.commitsYear})`;
    } else if (options.includeAllCommits) {
        commits = 3100;
        commitsLabel = 'Total Commits';
        allCommits = true;
    }
    return {
        name: login ? login[0].toUpperCase() + login.slice(1) : 'Octocat',
        login,
        stars: 2400,
        commits,
        commitsLabel,
        allCommits,
        prs: 86,
        issues: 41,
        contribs: 27,
        reviews: 63,
        followers: 120,
    };
}

// bytes = code size, count = number of repos using the language.
const DEMO_LANGS = [
    { name: 'JavaScript', color: '#f1e05a', bytes: 540000, count: 14 },
    { name: 'TypeScript', color: '#3178c6', bytes: 310000, count: 9 },
    { name: 'Python', color: '#3572a5', bytes: 190000, count: 7 },
    { name: 'CSS', color: '#663399', bytes: 120000, count: 12 },
    { name: 'HTML', color: '#e34c26', bytes: 90000, count: 11 },
    { name: 'Go', color: '#00add8', bytes: 70000, count: 3 },
    { name: 'Shell', color: '#89e051', bytes: 40000, count: 8 },
    { name: 'Rust', color: '#dea584', bytes: 30000, count: 2 },
    { name: 'Java', color: '#b07219', bytes: 22000, count: 2 },
    { name: 'C', color: '#555555', bytes: 15000, count: 1 },
];

/** Same ranking and percentages as fetchTopLangs(), on made-up data. */
function demoTopLangs(login, options) {
    const ranked = DEMO_LANGS.filter((l) => !options.hideLangs.has(l.name.toLowerCase()))
        .map((l) => ({
            name: l.name,
            color: l.color,
            size: Math.pow(l.bytes, options.sizeWeight) * Math.pow(l.count, options.countWeight),
        }))
        .filter((l) => l.size > 0)
        .sort((a, b) => b.size - a.size)
        .slice(0, options.langsCount);

    if (!ranked.length) throw new CardError('No language data found for this user.', 'no_data');

    const sum = ranked.reduce((s, l) => s + l.size, 0);
    return {
        name: login ? login[0].toUpperCase() + login.slice(1) : 'Octocat',
        login,
        langs: ranked.map((l) => ({ ...l, percent: (l.size / sum) * 100 })),
    };
}

/** card: 'calendar' | 'stats' | 'streak' | 'top-langs'. query: the same plain object the API would receive. Returns SVG text. */
export function renderDemo(card, query = {}, now = new Date()) {
    let params;
    try {
        if (card === 'calendar') {
            params = parseCommon(query, { cardWidth: CALENDAR_WIDTH, hide: [] });
            const options = parseCalendarOptions(params);
            const startYear = resolveStartYear(options.startYear, DEMO_CREATED_YEAR);
            const { startDate, endDate } = getRange(startYear, now);
            const grid = buildGrid(demoCounts(now), startDate, endDate);
            return renderCalendar({ ...grid, params, username: params.user || 'octocat', speed: options.speed });
        }

        if (card === 'stats') {
            params = parseCommon(query, { cardWidth: STATS_WIDTH, hide: STATS_HIDE, userAlias: 'username' });
            const options = parseStatsOptions(params);
            const stats = demoStats(params.user || 'octocat', options);
            const rank = calculateRank(stats);
            return renderStats({ stats, rank, params, options });
        }

        if (card === 'streak') {
            params = parseCommon(query, { cardWidth: STREAK_WIDTH, hide: STREAK_HIDE });
            const options = parseStreakOptions(params);
            const startYear = resolveStartYear(options.startYear, DEMO_CREATED_YEAR);
            const counts = new Map([...demoCounts(now)].filter(([key]) => key >= `${startYear}-01-01`));
            const result = calculateStreaks(counts, { now, mode: options.mode, excludeDays: options.excludeDays });
            return renderStreak({ result, params, options, now });
        }

        if (card === 'top-langs') {
            params = parseCommon(query, { cardWidth: LANGS_WIDTH, hide: LANGS_HIDE, userAlias: 'username' });
            const options = parseTopLangsOptions(params);
            const data = demoTopLangs(params.user || 'octocat', options);
            return renderTopLangs({ data, params, options });
        }

        throw new CardError('Unknown card.', 'bad_param');
    } catch (err) {
        return errorCard(err instanceof CardError ? err.message : 'Preview failed.', params);
    }
}
import { CardError } from '../shared/svg.js';
import { parseBool, parseList } from '../shared/params.js';

export const CARD_WIDTH = { def: 495, min: 450, max: 1000 };
export const HIDE_VALUES = ['stars', 'commits', 'prs', 'issues', 'contribs'];

const MAX_TITLE_LENGTH = 60;

/** commits_year: 4-digit year, 2005..current year. Undefined when absent. */
export function parseCommitsYear(value, now = new Date()) {
    if (value === undefined || value === null || String(value).trim() === '') return undefined;
    const s = String(value).trim();
    if (!/^\d{4}$/.test(s)) throw new CardError('Invalid commits_year: use a 4-digit year.', 'bad_param');
    const year = Number(s);
    const current = now.getUTCFullYear();
    if (year < 2005 || year > current) {
        throw new CardError(`Invalid commits_year: use a year from 2005 to ${current}.`, 'bad_param');
    }
    return year;
}

/** Stats-only params. `params` is the result of parseCommon(). */
export function parseStatsOptions(params) {
    const q = params.query;
    const customTitle = String(q.custom_title ?? '').trim().slice(0, MAX_TITLE_LENGTH);
    return {
        commitsYear: parseCommitsYear(q.commits_year),
        hideTitle: parseBool(q.hide_title, 'hide_title', false),
        hideRank: parseBool(q.hide_rank, 'hide_rank', false),
        customTitle: customTitle || undefined,
        includeAllCommits: parseBool(q.include_all_commits, 'include_all_commits', false),
        excludeRepos: new Set(parseList(q.exclude_repo)), // lowercased
    };
}
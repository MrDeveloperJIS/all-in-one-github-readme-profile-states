import { CardError } from '../shared/svg.js';
import { parseBool, parseNumber } from '../shared/params.js';

export const CARD_WIDTH = { def: 400, min: 250, max: 1000 };
export const HIDE_VALUES = ['description', 'language', 'stars', 'forks', 'badge'];
export const DESC_LINES = { def: 2, min: 1, max: 5 };

// GitHub allows letters, digits, '.', '_' and '-' in repository names.
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

/** Repo-card-only params. `params` is the result of parseCommon(). */
export function parseRepoOptions(params) {
    const q = params.query;
    const repo = String(q.repo ?? '').trim();
    if (!repo) throw new CardError('Missing "repo" parameter.', 'missing_repo');
    if (!REPO_RE.test(repo) || repo === '.' || repo === '..') {
        throw new CardError('Invalid repository name.', 'invalid_repo');
    }

    return {
        repo,
        showOwner: parseBool(q.show_owner, 'show_owner', false),
        descriptionLines: Math.round(parseNumber(q.description_lines, 'description_lines', DESC_LINES)),
    };
}
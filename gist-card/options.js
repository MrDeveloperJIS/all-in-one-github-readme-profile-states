import { CardError } from '../shared/svg.js';
import { parseBool, parseNumber } from '../shared/params.js';

export const CARD_WIDTH = { def: 400, min: 250, max: 1000 };
export const HIDE_VALUES = ['description', 'language', 'files', 'stars', 'forks'];
export const DESC_LINES = { def: 2, min: 1, max: 5 };

// Gist ids are hex (the 32-character id in the gist URL; very old gists use short numbers).
const GIST_ID_RE = /^[a-f0-9]{1,40}$/i;

/** Gist-card-only params. `params` is the result of parseCommon(). */
export function parseGistOptions(params) {
    const q = params.query;
    const id = String(q.id ?? '').trim();
    if (!id) throw new CardError('Missing "id" parameter (the gist id from its URL).', 'missing_id');
    if (!GIST_ID_RE.test(id)) throw new CardError('Invalid gist id: use the hex id from the gist URL.', 'invalid_id');

    return {
        id,
        showOwner: parseBool(q.show_owner, 'show_owner', false),
        descriptionLines: Math.round(parseNumber(q.description_lines, 'description_lines', DESC_LINES)),
    };
}
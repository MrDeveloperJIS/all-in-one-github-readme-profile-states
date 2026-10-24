import { CardError } from '../shared/svg.js';
import { parseBool, parseList, parseNumber } from '../shared/params.js';

export const CARD_WIDTH = { def: 300, min: 280, max: 1000 };
export const HIDE_VALUES = []; // `hide` on this card is a list of language names, parsed below
export const LAYOUTS = ['normal', 'compact', 'donut', 'donut-vertical', 'pie'];
export const LANGS_COUNT = { min: 1, max: 20 };
export const WEIGHT = { def: 1, min: 0, max: 5 };

// Used only when card_width is not given.
const DEFAULT_WIDTH = { normal: 300, compact: 400, donut: 340, 'donut-vertical': 300, pie: 340 };

const MAX_TITLE_LENGTH = 60;

/** Top-langs-only params. `params` is the result of parseCommon(). */
export function parseTopLangsOptions(params) {
    const q = params.query;

    const layout = String(q.layout ?? '').trim().toLowerCase() || 'normal';
    if (!LAYOUTS.includes(layout)) {
        throw new CardError('Invalid layout: use normal, compact, donut, donut-vertical or pie.', 'bad_param');
    }

    const widthGiven = String(q.card_width ?? '').trim() !== '';
    const customTitle = String(q.custom_title ?? '').trim().slice(0, MAX_TITLE_LENGTH);

    return {
        layout,
        width: widthGiven ? params.cardWidth : DEFAULT_WIDTH[layout],
        langsCount: Math.round(
            parseNumber(q.langs_count, 'langs_count', {
                def: layout === 'compact' ? 6 : 5,
                min: LANGS_COUNT.min,
                max: LANGS_COUNT.max,
            }),
        ),
        sizeWeight: parseNumber(q.size_weight, 'size_weight', WEIGHT),
        countWeight: parseNumber(q.count_weight, 'count_weight', { ...WEIGHT, def: 0 }),
        hideLangs: new Set(parseList(q.hide)), // lowercased language names
        excludeRepos: new Set(parseList(q.exclude_repo)), // lowercased repo names
        hideTitle: parseBool(q.hide_title, 'hide_title', false),
        hideProgress: parseBool(q.hide_progress, 'hide_progress', false),
        customTitle: customTitle || undefined,
    };
}
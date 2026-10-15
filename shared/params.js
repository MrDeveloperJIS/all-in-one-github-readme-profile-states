import { CardError, FONTS } from './svg.js';
import { resolveTheme, themeToColors } from './themes.js';

const HEX_RE = /^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

const COLOR_PARAMS = {
    bg_color: 'bg',
    border_color: 'border',
    title_color: 'title',
    text_color: 'text',
    icon_color: 'icon',
    ring_color: 'ring',
};

const first = (v) => (Array.isArray(v) ? v[0] : v);
const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

export function parseBool(value, name, def = false) {
    if (isBlank(value)) return def;
    const s = String(value).trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0') return false;
    throw new CardError(`Invalid ${name}: use true or false.`, 'bad_param');
}

/** Non-numeric -> error. Out-of-range -> clamped. */
export function parseNumber(value, name, { def, min, max }) {
    if (isBlank(value)) return def;
    const n = Number(value);
    if (!Number.isFinite(n)) throw new CardError(`Invalid ${name}: use a number.`, 'bad_param');
    return Math.min(max, Math.max(min, n));
}

/** 6 or 8 hex digits, no '#'. Returns '#rrggbb' or '#rrggbbaa'. */
export function parseHex(value, name) {
    const s = String(value).trim();
    if (!HEX_RE.test(s)) {
        throw new CardError(`Invalid ${name}: use 6 or 8 hex digits without #.`, 'bad_param');
    }
    return `#${s.toLowerCase()}`;
}

/** Comma list -> lowercased, trimmed, empty entries dropped. */
export function parseList(value) {
    if (isBlank(value)) return [];
    return String(value)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * Parses the params shared by every card.
 * opts.cardWidth  : { def, min, max }   (per card)
 * opts.hide       : allowed `hide` values for this card (unknown ones are ignored)
 * opts.userAlias  : extra query key accepted for the username (stats: "username")
 */
export function parseCommon(rawQuery = {}, opts = {}) {
    const q = Object.create(null);
    for (const [k, v] of Object.entries(rawQuery)) q[k] = first(v);

    const width = opts.cardWidth ?? { def: 495, min: 300, max: 1000 };
    const hideAllowed = opts.hide ?? [];

    const rawUser = !isBlank(q.user) ? q.user : opts.userAlias ? q[opts.userAlias] : '';
    const user = String(rawUser ?? '').trim();

    const themeName = isBlank(q.theme) ? 'default' : String(q.theme).trim().toLowerCase();
    const theme = resolveTheme(themeName);
    if (!theme) throw new CardError('Unknown theme. See the Themes list in the README.', 'bad_param');

    const colors = themeToColors(theme);
    for (const [param, key] of Object.entries(COLOR_PARAMS)) {
        if (!isBlank(q[param])) colors[key] = parseHex(q[param], param);
    }

    const fontRaw = String(q.font ?? '').trim().toLowerCase();
    const font = FONTS.includes(fontRaw) ? fontRaw : 'sans-serif';

    const numberFormat = isBlank(q.number_format) ? 'short' : String(q.number_format).trim().toLowerCase();
    if (numberFormat !== 'short' && numberFormat !== 'long') {
        throw new CardError('Invalid number_format: use short or long.', 'bad_param');
    }

    return {
        user,
        themeName,
        mode: theme.mode,
        font,
        colors,
        hideBorder: parseBool(q.hide_border, 'hide_border', false),
        borderRadius: parseNumber(q.border_radius, 'border_radius', { def: 6, min: 0, max: 50 }),
        cardWidth: parseNumber(q.card_width, 'card_width', width),
        disableAnimations: parseBool(q.disable_animations, 'disable_animations', false),
        numberFormat,
        hide: new Set(parseList(q.hide).filter((v) => hideAllowed.includes(v))),
        query: q, // card-specific params are read from here by each card's options.js
    };
}

/**
 * start_year: 4-digit year, 2005..current year. Returns undefined when absent.
 * The card then clamps it up to the account creation year (see resolveStartYear).
 */
export function parseStartYear(value, now = new Date()) {
    if (isBlank(value)) return undefined;
    const s = String(value).trim();
    if (!/^\d{4}$/.test(s)) {
        throw new CardError('Invalid start_year: use a 4-digit year.', 'bad_param');
    }
    const year = Number(s);
    const current = now.getUTCFullYear();
    if (year < 2005 || year > current) {
        throw new CardError(`Invalid start_year: use a year from 2005 to ${current}.`, 'bad_param');
    }
    return year;
}

/** Default and lower bound is the account creation year. */
export function resolveStartYear(requested, createdYear) {
    return Math.max(requested ?? createdYear, createdYear);
}
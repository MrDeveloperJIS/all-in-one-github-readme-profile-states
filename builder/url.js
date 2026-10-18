// Turns the builder's form values into a card URL. Pure, no DOM.
import { PARAMS, appliesTo, defaultOf, optionsOf } from './meta.js';

// Keep , / : readable. They are valid inside a query string.
const readable = (s) => s.replace(/%2C/gi, ',').replace(/%2F/gi, '/').replace(/%3A/gi, ':');
export const encodeValue = (value) => readable(encodeURIComponent(value));

function serialize(p, card, raw) {
    switch (p.type) {
        case 'bool':
            return raw === true || raw === 'true' ? 'true' : undefined;
        case 'select':
            return raw && raw !== defaultOf(p, card) ? String(raw) : undefined;
        case 'number': {
            const s = String(raw ?? '').trim();
            if (!s || Number(s) === defaultOf(p, card)) return undefined;
            return s;
        }
        case 'checks': {
            const picked = optionsOf(p, card).filter((o) => (raw ?? []).includes(o));
            return picked.length ? picked.join(',') : undefined;
        }
        case 'color': {
            const s = String(raw ?? '').trim().replace(/^#/, '');
            return s || undefined;
        }
        default: {
            const s = String(raw ?? '').trim();
            return s || undefined;
        }
    }
}

/** [[name, value], ...] for the params that apply to `card` and differ from their defaults. */
export function buildQuery(card, values, userFallback = 'YOU') {
    const pairs = [];
    for (const p of PARAMS) {
        if (!appliesTo(p, card)) continue;
        if (p.name === 'user') {
            pairs.push(['user', String(values.user ?? '').trim() || userFallback]);
            continue;
        }
        const value = serialize(p, card, values[p.name]);
        if (value !== undefined) pairs.push([p.name, value]);
    }
    return pairs;
}

export function buildUrl(base, card, values) {
    const query = buildQuery(card, values)
        .map(([k, v]) => `${k}=${encodeValue(v)}`)
        .join('&');
    return `${String(base).replace(/\/+$/, '')}/api/${card}?${query}`;
}
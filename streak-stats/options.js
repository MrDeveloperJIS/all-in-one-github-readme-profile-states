import { CardError } from '../shared/svg.js';
import { parseList, parseNumber, parseStartYear } from '../shared/params.js';

export const CARD_WIDTH = { def: 495, min: 300, max: 1000 };
export const CARD_HEIGHT = { def: 195, min: 150, max: 400 };
export const HIDE_VALUES = ['total', 'current', 'longest'];

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // index = Date#getUTCDay()

/** "Sun,Sat" or "sunday,saturday" -> Set of weekday numbers (0 = Sunday). */
export function parseExcludeDays(value) {
    const days = new Set();
    for (const item of parseList(value)) {
        const index = WEEKDAYS.indexOf(item.slice(0, 3));
        if (index === -1) {
            throw new CardError('Invalid exclude_days: use weekday names like Sun,Sat.', 'bad_param');
        }
        days.add(index);
    }
    return days;
}

/** Streak-only params. `params` is the result of parseCommon(). */
export function parseStreakOptions(params) {
    const q = params.query;

    const mode = String(q.mode ?? '').trim().toLowerCase() || 'daily';
    if (mode !== 'daily' && mode !== 'weekly') {
        throw new CardError('Invalid mode: use daily or weekly.', 'bad_param');
    }

    return {
        startYear: parseStartYear(q.start_year),
        mode,
        excludeDays: parseExcludeDays(q.exclude_days),
        cardHeight: parseNumber(q.card_height, 'card_height', CARD_HEIGHT),
    };
}
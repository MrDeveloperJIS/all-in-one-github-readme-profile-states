import { parseNumber, parseStartYear } from '../shared/params.js';

export const CARD_WIDTH = { def: 512, min: 200, max: 2000 };
export const SPEED = { def: 40, min: 5, max: 300 }; // px per second

/** Calendar-only params. `params` is the result of parseCommon(). */
export function parseCalendarOptions(params) {
    return {
        startYear: parseStartYear(params.query.start_year),
        speed: parseNumber(params.query.speed, 'speed', SPEED),
    };
}
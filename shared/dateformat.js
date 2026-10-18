import { CardError } from './svg.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MAX_LENGTH = 30;
const LITERALS = new Set([' ', '-', '/', '.', ',', ':', '_']);
const RUN_LENGTHS = { d: [1, 2, 3, 4], m: [1, 2, 3, 4], y: [2, 4] };

const bad = (why) => new CardError(`Invalid date_format: ${why}`, 'bad_param');

/**
 * Parses a pattern such as "dd-mmm-yyyy" into parts. Case-insensitive.
 *   d dd ddd dddd   day, 2-digit day, Mon, Monday
 *   m mm mmm mmmm   month, 2-digit month, Mar, March
 *   yy yyyy         2-digit year, 4-digit year
 * Other allowed characters (space - / . , : _) are copied as they are.
 * Returns undefined when the value is empty.
 */
export function parseDateFormat(value) {
    if (value === undefined || value === null || String(value).trim() === '') return undefined;
    const text = String(value).trim().toLowerCase();
    if (text.length > MAX_LENGTH) throw bad(`use at most ${MAX_LENGTH} characters.`);

    const parts = [];
    for (let i = 0; i < text.length; ) {
        const ch = text[i];
        if (ch === 'd' || ch === 'm' || ch === 'y') {
            let j = i;
            while (text[j] === ch) j++;
            const n = j - i;
            if (!RUN_LENGTHS[ch].includes(n)) {
                throw bad(ch === 'y' ? 'use yy or yyyy for the year.' : `use ${ch}, ${ch}${ch}, ${ch}${ch}${ch} or ${ch}${ch}${ch}${ch}.`);
            }
            parts.push({ token: ch, size: n });
            i = j;
        } else if (LITERALS.has(ch)) {
            parts.push(ch);
            i++;
        } else {
            throw bad('only d, m, y and the separators space - / . , : _ are allowed.');
        }
    }
    return parts;
}

const pad2 = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' + parsed parts -> formatted text. */
export function formatWithParts(key, parts) {
    const [year, month, day] = String(key).split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return parts
        .map((p) => {
            if (typeof p === 'string') return p;
            const { token, size } = p;
            if (token === 'd') {
                if (size === 1) return String(day);
                if (size === 2) return pad2(day);
                return size === 3 ? WEEKDAYS[weekday].slice(0, 3) : WEEKDAYS[weekday];
            }
            if (token === 'm') {
                if (size === 1) return String(month);
                if (size === 2) return pad2(month);
                return size === 3 ? MONTHS[month - 1].slice(0, 3) : MONTHS[month - 1];
            }
            return size === 2 ? pad2(year % 100) : String(year);
        })
        .join('');
}
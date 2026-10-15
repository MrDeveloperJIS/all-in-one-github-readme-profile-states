// Pure date and grid math. No network, no dependencies.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const toUTCDate = (year, month, day) => new Date(Date.UTC(year, month, day));
export const formatDate = (date) => date.toISOString().slice(0, 10); // YYYY-MM-DD
export const addDays = (date, n) => new Date(date.getTime() + n * MS_PER_DAY);
export const startOfUTCDay = (date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/** Jan 1 of startYear -> today (UTC). */
export function getRange(startYear, now = new Date()) {
    return { startDate: toUTCDate(startYear, 0, 1), endDate: startOfUTCDay(now) };
}

/**
 * One query window per calendar year (GitHub caps a window at one year).
 * Past years end at 23:59:59 on Dec 31; the current year ends "now", so the
 * last day of every window, including today, is counted in full.
 */
export function yearWindows(startYear, now = new Date()) {
    const windows = [];
    const lastYear = now.getUTCFullYear();
    for (let y = startYear; y <= lastYear; y++) {
        const from = toUTCDate(y, 0, 1);
        const to = y === lastYear ? new Date(now.getTime()) : new Date(Date.UTC(y, 11, 31, 23, 59, 59));
        windows.push({ from: from.toISOString(), to: to.toISOString() });
    }
    return windows;
}

/**
 * Sunday-aligned weekly grid covering startDate..endDate inclusive. Days that
 * only pad a partial first or last week get inRange: false, so every week has
 * exactly 7 rows.
 *
 * @param {Map<string, number>} dailyCountMap 'YYYY-MM-DD' -> count
 */
export function buildGrid(dailyCountMap, startDate, endDate) {
    const gridStart = addDays(startDate, -startDate.getUTCDay());
    const gridEnd = addDays(endDate, 6 - endDate.getUTCDay());

    const weeks = [];
    let cursor = gridStart;
    let totalContributions = 0;
    let maxDailyCount = 0;

    while (cursor.getTime() <= gridEnd.getTime()) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            const inRange = cursor.getTime() >= startDate.getTime() && cursor.getTime() <= endDate.getTime();
            const date = formatDate(cursor);
            const count = inRange ? dailyCountMap.get(date) || 0 : 0;
            if (inRange) {
                totalContributions += count;
                if (count > maxDailyCount) maxDailyCount = count;
            }
            week.push({ date, count, inRange });
            cursor = addDays(cursor, 1);
        }
        weeks.push(week);
    }

    return { weeks, totalContributions, maxDailyCount };
}
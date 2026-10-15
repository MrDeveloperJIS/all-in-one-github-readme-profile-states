// Pure streak math. No network, no dependencies. All dates are UTC 'YYYY-MM-DD'.

const DAY_MS = 24 * 60 * 60 * 1000;

const toKey = (date) => date.toISOString().slice(0, 10);
const fromKey = (key) => new Date(`${key}T00:00:00Z`);
const addDays = (date, n) => new Date(date.getTime() + n * DAY_MS);
const startOfDay = (date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const EMPTY_STREAK = () => ({ length: 0, start: null, end: null });

/** One unit per day (daily) or per Sunday-Saturday week (weekly). */
function buildUnits(counts, firstKey, today, mode, excludeDays) {
    const units = [];
    if (mode === 'weekly') {
        const first = fromKey(firstKey);
        let weekStart = addDays(first, -first.getUTCDay()); // back to Sunday
        while (weekStart <= today) {
            let active = false;
            const lastDay = addDays(weekStart, 6);
            const end = lastDay > today ? today : lastDay;
            for (let d = weekStart; d <= end; d = addDays(d, 1)) {
                if ((counts.get(toKey(d)) ?? 0) > 0) active = true;
            }
            units.push({ start: toKey(weekStart), end: toKey(end), active, skipped: false });
            weekStart = addDays(weekStart, 7);
        }
        return units;
    }

    for (let d = fromKey(firstKey); d <= today; d = addDays(d, 1)) {
        const key = toKey(d);
        units.push({
            start: key,
            end: key,
            active: (counts.get(key) ?? 0) > 0,
            skipped: excludeDays.has(d.getUTCDay()),
        });
    }
    return units;
}

/**
 * counts: Map<'YYYY-MM-DD', number>
 * options: { now, mode: 'daily'|'weekly', excludeDays: Set<0..6> }
 *
 * Rules:
 *  - The unit (day or week) that contains today never breaks a streak while it is still empty.
 *  - Daily mode: an empty excluded weekday is skipped without breaking the streak;
 *    an excluded weekday with contributions still counts.
 *  - Weekly mode: a Sun-Sat week counts if it has any contribution; exclude_days is ignored.
 *
 * Returns { total, firstDate, longest, current } where each streak is
 * { length, start, end } (length is days, or weeks in weekly mode).
 */
export function calculateStreaks(counts, { now = new Date(), mode = 'daily', excludeDays = new Set() } = {}) {
    const today = startOfDay(now);
    const todayKey = toKey(today);

    let total = 0;
    let firstDate = null;
    for (const [key, count] of counts) {
        if (key > todayKey || !(count > 0)) continue;
        total += count;
        if (firstDate === null || key < firstDate) firstDate = key;
    }

    if (firstDate === null) {
        return { total: 0, firstDate: null, longest: EMPTY_STREAK(), current: EMPTY_STREAK() };
    }

    const units = buildUnits(counts, firstDate, today, mode, excludeDays);

    let run = null;
    let longest = EMPTY_STREAK();
    for (const unit of units) {
        if (unit.active) {
            if (!run) run = { length: 0, start: unit.start, end: unit.end };
            run.length += 1;
            run.end = unit.end;
            if (run.length > longest.length) longest = { ...run };
        } else if (unit.skipped) {
            continue; // empty excluded day: neither counts nor breaks
        } else if (unit.end >= todayKey) {
            continue; // today (or this week) is still in progress
        } else {
            run = null;
        }
    }

    return { total, firstDate, longest, current: run ? { ...run } : EMPTY_STREAK() };
}
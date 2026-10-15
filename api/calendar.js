import { parseCommon, resolveStartYear } from '../shared/params.js';
import { checkUser } from '../shared/guard.js';
import { sendSvg, sendError } from '../shared/respond.js';
import { CARD_WIDTH, parseCalendarOptions } from '../calendar-graph/options.js';
import { fetchCreatedAt, fetchDailyCounts } from '../calendar-graph/fetch.js';
import { getRange, yearWindows, buildGrid } from '../calendar-graph/dates.js';
import { renderCalendar } from '../calendar-graph/render.js';

export default async function handler(req, res) {
    let params;
    try {
        // parse -> guard -> fetch -> render -> respond
        params = parseCommon(req.query, { cardWidth: CARD_WIDTH, hide: [] });
        const options = parseCalendarOptions(params);
        const user = checkUser(params.user);

        const now = new Date();
        const createdYear = new Date(await fetchCreatedAt(user)).getUTCFullYear();
        const startYear = resolveStartYear(options.startYear, createdYear);

        const { startDate, endDate } = getRange(startYear, now);
        const counts = await fetchDailyCounts(user, yearWindows(startYear, now));
        const { weeks, totalContributions, maxDailyCount } = buildGrid(counts, startDate, endDate);

        sendSvg(
            res,
            renderCalendar({ weeks, totalContributions, maxDailyCount, params, username: user, speed: options.speed })
        );
    } catch (err) {
        sendError(res, err, params);
    }
}
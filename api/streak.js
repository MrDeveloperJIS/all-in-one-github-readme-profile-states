import { parseCommon } from '../shared/params.js';
import { checkUser } from '../shared/guard.js';
import { sendSvg, sendError } from '../shared/respond.js';
import { CARD_WIDTH, HIDE_VALUES, parseStreakOptions } from '../streak-stats/options.js';
import { fetchContributionCounts } from '../streak-stats/fetch.js';
import { calculateStreaks } from '../streak-stats/calculate.js';
import { renderStreak } from '../streak-stats/render.js';

export default async function handler(req, res) {
    let params;
    try {
        // parse -> guard -> fetch -> calculate -> render -> respond
        params = parseCommon(req.query, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES });
        const options = parseStreakOptions(params);
        const user = checkUser(params.user);

        const now = new Date();
        const counts = await fetchContributionCounts(user, options.startYear, now);
        const result = calculateStreaks(counts, { now, mode: options.mode, excludeDays: options.excludeDays });

        sendSvg(res, renderStreak({ result, params, options, now }));
    } catch (err) {
        sendError(res, err, params);
    }
}
import { parseCommon } from '../shared/params.js';
import { checkUser } from '../shared/guard.js';
import { sendSvg, sendError } from '../shared/respond.js';
import { CARD_WIDTH, HIDE_VALUES, parseStatsOptions } from '../readme-stats/options.js';
import { fetchStats } from '../readme-stats/fetch.js';
import { calculateRank } from '../readme-stats/rank.js';
import { renderStats } from '../readme-stats/render.js';

export default async function handler(req, res) {
    let params;
    try {
        // parse -> guard -> fetch -> render -> respond
        params = parseCommon(req.query, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES, userAlias: 'username' });
        const options = parseStatsOptions(params);
        const user = checkUser(params.user);

        const stats = await fetchStats(user, options);
        const rank = calculateRank({
            allCommits: stats.allCommits,
            commits: stats.commits,
            prs: stats.prs,
            issues: stats.issues,
            reviews: stats.reviews,
            stars: stats.stars,
            followers: stats.followers,
        });

        sendSvg(res, renderStats({ stats, rank, params, options }));
    } catch (err) {
        sendError(res, err, params);
    }
}
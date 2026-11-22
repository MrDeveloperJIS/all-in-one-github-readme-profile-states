import { parseCommon } from '../shared/params.js';
import { checkUser } from '../shared/guard.js';
import { sendSvg, sendError } from '../shared/respond.js';
import { CARD_WIDTH, HIDE_VALUES, parseRepoOptions } from '../repo-card/options.js';
import { fetchRepo } from '../repo-card/fetch.js';
import { renderRepo } from '../repo-card/render.js';

export default async function handler(req, res) {
    let params;
    try {
        // parse -> guard -> fetch -> render -> respond
        params = parseCommon(req.query, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES, userAlias: 'username' });
        const options = parseRepoOptions(params);
        const user = checkUser(params.user);

        const data = await fetchRepo(user, options);

        sendSvg(res, renderRepo({ data, params, options }));
    } catch (err) {
        sendError(res, err, params);
    }
}
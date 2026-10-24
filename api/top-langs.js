import { parseCommon } from '../shared/params.js';
import { checkUser } from '../shared/guard.js';
import { sendSvg, sendError } from '../shared/respond.js';
import { CARD_WIDTH, HIDE_VALUES, parseTopLangsOptions } from '../top-langs/options.js';
import { fetchTopLangs } from '../top-langs/fetch.js';
import { renderTopLangs } from '../top-langs/render.js';

export default async function handler(req, res) {
    let params;
    try {
        // parse -> guard -> fetch -> render -> respond
        params = parseCommon(req.query, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES, userAlias: 'username' });
        const options = parseTopLangsOptions(params);
        const user = checkUser(params.user);

        const data = await fetchTopLangs(user, options);

        sendSvg(res, renderTopLangs({ data, params, options }));
    } catch (err) {
        sendError(res, err, params);
    }
}

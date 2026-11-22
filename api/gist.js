import { parseCommon } from '../shared/params.js';
import { checkUser } from '../shared/guard.js';
import { sendSvg, sendError } from '../shared/respond.js';
import { CARD_WIDTH, HIDE_VALUES, parseGistOptions } from '../gist-card/options.js';
import { fetchGist } from '../gist-card/fetch.js';
import { renderGist } from '../gist-card/render.js';

export default async function handler(req, res) {
    let params;
    try {
        // parse -> guard -> fetch -> render -> respond
        params = parseCommon(req.query, { cardWidth: CARD_WIDTH, hide: HIDE_VALUES, userAlias: 'username' });
        const options = parseGistOptions(params);
        const user = checkUser(params.user);

        const data = await fetchGist(user, options);

        sendSvg(res, renderGist({ data, params, options }));
    } catch (err) {
        sendError(res, err, params);
    }
}
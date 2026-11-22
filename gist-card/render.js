import { formatNumber } from '../shared/svg.js';
import { renderInfoCard } from '../shared/infocard.js';
import { charsFor, emFactor, wrapLines } from '../shared/text.js';

const MAX_LANG_CHARS = 18;

/** data: result of fetchGist(). params: parseCommon(). options: parseGistOptions(). */
export function renderGist({ data, params, options }) {
    const { hide, numberFormat } = params;
    const width = params.cardWidth;

    const title = options.showOwner ? `${data.owner}/${data.title}` : data.title;
    const description = data.description.trim() || 'No description provided';
    const lines = hide.has('description') ? [] : wrapLines(description, charsFor(width - 50, 13, emFactor(params.font)), options.descriptionLines);

    const items = [];
    if (!hide.has('language') && data.language) {
        const name = data.language.name;
        const text = name.length > MAX_LANG_CHARS ? `${name.slice(0, MAX_LANG_CHARS - 1)}…` : name;
        items.push({ dot: data.language.color, text });
    }
    if (!hide.has('files') && data.fileCount > 0) {
        items.push({ icon: 'file', text: `${data.fileCount}${data.moreFiles ? '+' : ''} ${data.fileCount === 1 ? 'file' : 'files'}` });
    }
    if (!hide.has('stars')) items.push({ icon: 'star', text: formatNumber(data.stars, numberFormat) });
    if (!hide.has('forks')) items.push({ icon: 'fork', text: formatNumber(data.forks, numberFormat) });

    return renderInfoCard({
        params,
        width,
        title,
        icon: 'file',
        badge: '',
        lines,
        items,
        label: 'GitHub gist',
    });
}
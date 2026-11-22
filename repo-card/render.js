import { formatNumber } from '../shared/svg.js';
import { renderInfoCard } from '../shared/infocard.js';
import { charsFor, emFactor, wrapLines } from '../shared/text.js';

const MAX_LANG_CHARS = 18;

function badgeFor(repo) {
    if (repo.archived) return 'Archived';
    if (repo.template) return 'Template';
    if (repo.fork) return 'Fork';
    return '';
}

/** data: result of fetchRepo(). params: parseCommon(). options: parseRepoOptions(). */
export function renderRepo({ data, params, options }) {
    const { hide, numberFormat } = params;
    const width = params.cardWidth;

    const title = options.showOwner ? data.fullName : data.name;
    const description = data.description.trim() || 'No description provided';
    const lines = hide.has('description') ? [] : wrapLines(description, charsFor(width - 50, 13, emFactor(params.font)), options.descriptionLines);

    const items = [];
    if (!hide.has('language') && data.language) {
        const name = data.language.name;
        const text = name.length > MAX_LANG_CHARS ? `${name.slice(0, MAX_LANG_CHARS - 1)}…` : name;
        items.push({ dot: data.language.color, text });
    }
    if (!hide.has('stars')) items.push({ icon: 'star', text: formatNumber(data.stars, numberFormat) });
    if (!hide.has('forks')) items.push({ icon: 'fork', text: formatNumber(data.forks, numberFormat) });

    return renderInfoCard({
        params,
        width,
        title,
        icon: 'repo',
        badge: hide.has('badge') ? '' : badgeFor(data),
        lines,
        items,
        label: 'GitHub repository',
    });
}
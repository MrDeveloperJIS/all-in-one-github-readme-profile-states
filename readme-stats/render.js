import { escapeXml, fontStack, formatNumber } from '../shared/svg.js';

const ROW_HEIGHT = 25;
const RING_RADIUS = 40;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// 16x16 icon paths.
const ICONS = {
    stars: 'M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z',
    commits: 'M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z',
    prs: 'M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z',
    issues: 'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z',
    reviews: 'M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 010 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 010-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2zM1.679 7.932a.12.12 0 000 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 000-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717zM8 10a2 2 0 11-.001-3.999A2 2 0 018 10z',
    contribs: 'M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z',
};

// GitHub mark, 16x16 (drawn inside the rank ring when rank_icon=github).
const GITHUB_MARK = 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';
const ICON_SIZE = 34;

function buildTitle(stats, options) {
    if (options.customTitle) return options.customTitle;
    const name = stats.name;
    return /s$/i.test(name) ? `${name}' GitHub Stats` : `${name}'s GitHub Stats`;
}

function statRows(stats, options) {
    const rows = [
        { key: 'stars', label: 'Total Stars Earned', value: stats.stars },
        { key: 'commits', label: stats.commitsLabel, value: stats.commits },
        { key: 'prs', label: 'Total PRs', value: stats.prs },
        { key: 'issues', label: 'Total Issues', value: stats.issues },
        { key: 'contribs', label: 'Contributed to', value: stats.contribs },
    ];
    if (options.showReviews) rows.push({ key: 'reviews', label: 'PRs Reviewed (last year)', value: stats.reviews });
    return rows;
}

export function renderStats({ stats, rank, params, options }) {
    const { colors, hide, numberFormat, disableAnimations, hideBorder, borderRadius } = params;
    const font = fontStack(params.font);
    const width = params.cardWidth;

    const rows = statRows(stats, options).filter((r) => !hide.has(r.key));
    const showRank = !options.hideRank;
    const showTitle = !options.hideTitle;

    const bodyTop = showTitle ? 55 : 20;
    const bodyHeight = Math.max(rows.length * ROW_HEIGHT, showRank ? 100 : 0);
    const height = bodyTop + bodyHeight + 20;

    const animated = !disableAnimations;
    const valueX = width - (showRank ? 150 : 30) - 25; // relative to the row group at x=25

    const title = buildTitle(stats, options);
    const titleSvg = showTitle
        ? `<text x="25" y="35" font-size="18" font-weight="700" fill="${colors.title}">${escapeXml(title)}</text>`
        : '';

    const rowsSvg = rows
        .map((r, i) => {
            const cy = bodyTop + i * ROW_HEIGHT + ROW_HEIGHT / 2;
            const fade = animated
                ? `<animate attributeName="opacity" from="0" to="1" begin="${i * 150}ms" dur="400ms" fill="freeze"/>`
                : '';
            const hidden = animated ? ' opacity="0"' : '';
            return `<g transform="translate(25, ${cy})"${hidden}>${fade}
      <svg x="0" y="-8" width="16" height="16" viewBox="0 0 16 16"><path fill="${colors.icon}" fill-rule="evenodd" d="${ICONS[r.key]}"/></svg>
      <text x="26" y="5" font-size="14" fill="${colors.text}">${escapeXml(r.label)}</text>
      <text x="${valueX}" y="5" font-size="14" font-weight="700" text-anchor="end" fill="${colors.text}">${escapeXml(formatNumber(r.value, numberFormat))}</text>
    </g>`;
        })
        .join('\n    ');

    let rankSvg = '';
    if (showRank) {
        const cx = width - 75;
        const cy = bodyTop + bodyHeight / 2;
        const progress = Math.min(100, Math.max(0, 100 - rank.percentile)) / 100;
        const finalOffset = RING_CIRCUMFERENCE * (1 - progress);
        const ringAnim = animated
            ? `<animate attributeName="stroke-dashoffset" from="${RING_CIRCUMFERENCE.toFixed(2)}" to="${finalOffset.toFixed(2)}" dur="1s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1"/>`
            : '';
        const percentLabel = () => {
            const p = Math.max(0.1, rank.percentile);
            const shown = p < 10 ? String(Number(p.toFixed(1))) : String(Math.round(p));
            return `<text x="0" y="-6" font-size="10" font-weight="600" text-anchor="middle" fill="${colors.text}">TOP</text><text x="0" y="14" font-size="20" font-weight="800" text-anchor="middle" fill="${colors.title}">${shown}%</text>`;
        };
        const rankLabel =
            options.rankIcon === 'percentile'
                ? percentLabel()
                : options.rankIcon === 'github'
                    ? `<svg x="${-ICON_SIZE / 2}" y="${-ICON_SIZE / 2}" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 16 16"><path fill="${colors.title}" fill-rule="evenodd" d="${GITHUB_MARK}"/></svg>`
                    : `<text x="0" y="9" font-size="26" font-weight="800" text-anchor="middle" fill="${colors.title}">${escapeXml(rank.level)}</text>`;
        rankSvg = `<g transform="translate(${cx}, ${cy})">
      <circle r="${RING_RADIUS}" fill="none" stroke="${colors.ring}" stroke-opacity="0.2" stroke-width="${RING_STROKE}"/>
      <circle r="${RING_RADIUS}" fill="none" stroke="${colors.ring}" stroke-width="${RING_STROKE}" stroke-linecap="round" transform="rotate(-90)" stroke-dasharray="${RING_CIRCUMFERENCE.toFixed(2)}" stroke-dashoffset="${finalOffset.toFixed(2)}">${ringAnim}</circle>
      ${rankLabel}
    </g>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}, rank ${escapeXml(rank.level)}">
  <title>${escapeXml(title)}</title>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${borderRadius}" fill="${colors.bg}" ${hideBorder ? 'stroke="none"' : `stroke="${colors.border}"`}/>
  <g font-family="${font}">
    ${titleSvg}
    ${rowsSvg}
    ${rankSvg}
  </g>
</svg>`;
}
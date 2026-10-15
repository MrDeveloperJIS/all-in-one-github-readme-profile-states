import { CardError, escapeXml, fontStack, formatNumber } from '../shared/svg.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RING_RADIUS = 40;
const RING_STROKE = 5;
const RING_GAP = 30; // px gap at the top of the ring, where the flame sits
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const FLAME = 'M8 0C8 3 4 5 4 9.5A4 4 0 0 0 12 9.5C12 7.5 11 6.5 10.2 5.6C10.2 7 9.3 7.8 8.6 7.8C9 5 8.8 2.5 8 0Z';

/** 'YYYY-MM-DD' -> 'Mon D, YYYY' (year omitted when it is the current year). */
export function formatDay(key, now = new Date()) {
    const [year, month, day] = String(key).split('-').map(Number);
    const base = `${MONTHS[month - 1]} ${day}`;
    return year === now.getUTCFullYear() ? base : `${base}, ${year}`;
}

function rangeText(start, end, now) {
    if (!start) return '';
    if (end === 'present') return `${formatDay(start, now)} - Present`;
    if (!end || end === start) return formatDay(start, now);
    return `${formatDay(start, now)} - ${formatDay(end, now)}`;
}

/** Font size that keeps `text` inside `maxWidth` (rough 0.62em per character). */
function fit(text, maxWidth, max) {
    const size = Math.min(max, maxWidth / (String(text).length * 0.62));
    return Math.round(Math.max(10, size) * 10) / 10;
}

export function renderStreak({ result, params, options, now = new Date() }) {
    const { colors, hide, numberFormat, disableAnimations, hideBorder, borderRadius } = params;
    const font = fontStack(params.font);
    const width = params.cardWidth;
    const height = options.cardHeight;
    const animated = !disableAnimations;

    const columns = [
        {
            key: 'total',
            label: 'Total Contributions',
            value: result.total,
            range: rangeText(result.firstDate, 'present', now),
        },
        {
            key: 'current',
            label: 'Current Streak',
            value: result.current.length,
            range: result.current.length > 0 ? rangeText(result.current.start, 'present', now) : '',
            ring: true,
        },
        {
            key: 'longest',
            label: 'Longest Streak',
            value: result.longest.length,
            range: rangeText(result.longest.start, result.longest.end, now),
        },
    ].filter((c) => !hide.has(c.key));

    if (!columns.length) throw new CardError('Nothing to show: every stat is hidden.', 'bad_param');

    const colW = width / columns.length;
    const cy = height / 2 - 18;
    const labelY = cy + RING_RADIUS + 28;
    const rangeY = labelY + 18;
    const labelSize = Math.min(13, Math.round((colW / 12.5) * 10) / 10);
    const rangeSize = Math.min(11, Math.round((colW / 15.5) * 10) / 10);

    const gapDeg = (RING_GAP / RING_CIRCUMFERENCE) * 360;
    const ringDash = `${(RING_CIRCUMFERENCE - RING_GAP).toFixed(2)} ${RING_GAP}`;

    const columnSvg = columns
        .map((c, i) => {
            const cx = i * colW + colW / 2;
            const text = formatNumber(c.value, numberFormat);
            const fade = animated
                ? `<animate attributeName="opacity" from="0" to="1" begin="${i * 150}ms" dur="500ms" fill="both"/>`
                : '';

            let ring = '';
            let numberSize = fit(text, colW - 24, 28);
            if (c.ring) {
                numberSize = fit(text, 62, 28);
                const ringAnim = animated
                    ? `<animate attributeName="stroke-dasharray" from="0 ${RING_CIRCUMFERENCE.toFixed(2)}" to="${ringDash}" begin="300ms" dur="900ms" fill="both"/>`
                    : '';
                ring = `<circle cx="${cx}" cy="${cy}" r="${RING_RADIUS}" fill="none" stroke="${colors.ring}" stroke-width="${RING_STROKE}" stroke-linecap="round" stroke-dasharray="${ringDash}" transform="rotate(${(-90 + gapDeg / 2).toFixed(2)} ${cx} ${cy})">${ringAnim}</circle>
      <svg x="${cx - 9}" y="${cy - RING_RADIUS - 8}" width="18" height="16" viewBox="0 0 16 14"><path fill="${colors.icon}" d="${FLAME}"/></svg>`;
            }

            return `<g>${fade}
      ${ring}
      <text x="${cx}" y="${cy + numberSize * 0.35}" font-size="${numberSize}" font-weight="700" text-anchor="middle" fill="${colors.title}">${escapeXml(text)}</text>
      <text x="${cx}" y="${labelY}" font-size="${labelSize}" font-weight="600" text-anchor="middle" fill="${colors.text}">${escapeXml(c.label)}</text>
      <text x="${cx}" y="${rangeY}" font-size="${rangeSize}" text-anchor="middle" fill="${colors.text}" fill-opacity="0.75">${escapeXml(c.range)}</text>
    </g>`;
        })
        .join('\n    ');

    const dividers = columns
        .slice(1)
        .map((_, i) => {
            const x = (i + 1) * colW;
            return `<line x1="${x}" y1="${height * 0.25}" x2="${x}" y2="${height * 0.75}" stroke="${colors.border}" stroke-width="1"/>`;
        })
        .join('\n    ');

    const summary = `Streak stats: ${result.total} contributions, current streak ${result.current.length}, longest streak ${result.longest.length}`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(summary)}">
  <title>${escapeXml(summary)}</title>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${borderRadius}" fill="${colors.bg}" ${hideBorder ? 'stroke="none"' : `stroke="${colors.border}"`}/>
  <g font-family="${font}">
    ${dividers}
    ${columnSvg}
  </g>
</svg>`;
}
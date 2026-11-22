// One layout for the repo card and the gist card: icon + title (+ badge),
// wrapped description, and a footer row of small facts (language, stars, ...).
import { escapeXml, fontStack } from './svg.js';
import { charsFor, clip, emFactor } from './text.js';

// 16x16 icon paths (GitHub Octicons).
export const ICONS = {
    repo: 'M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z',
    file: 'M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25V1.75zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25V6h-2.75A1.75 1.75 0 019 4.25V1.5H3.75zm6.75.062V4.25c0 .138.112.25.25.25h2.688a.252.252 0 00-.011-.013l-2.914-2.914a.272.272 0 00-.013-.011z',
    star: 'M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z',
    fork: 'M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z',
};

const DESC_LINE = 18;
const FOOTER_ROW = 20;
const FOOTER_SIZE = 12;
const ITEM_GAP = 18;

/** Staggered fade-in for a group. Returns the attribute and the animate element. */
function fadeIn(animated, i) {
    if (!animated) return { attr: '', anim: '' };
    return {
        attr: ' opacity="0"',
        anim: `<animate attributeName="opacity" from="0" to="1" begin="${i * 150}ms" dur="400ms" fill="freeze"/>`,
    };
}

/**
 * Puts footer items in rows, left to right, starting a new row when one would
 * run past the right edge. Returns [{ item, x, row }] and the number of rows.
 */
function layoutFooter(items, width, charW) {
    const limit = width - 25;
    const placed = [];
    let x = 25;
    let row = 0;
    for (const item of items) {
        const textX = item.icon ? 20 : 16;
        const w = textX + item.text.length * charW;
        if (x > 25 && x + w > limit) {
            row++;
            x = 25;
        }
        placed.push({ item, x, row, textX });
        x += w + ITEM_GAP;
    }
    return { placed, rows: items.length ? row + 1 : 0 };
}

/**
 * title       : string (already final text)
 * icon        : ICONS key for the title icon
 * badge       : optional short label (Archived, Template, ...)
 * lines       : description lines, already wrapped ([] = no description)
 * items       : [{ icon: ICONS key | null, dot: '#rrggbb' | null, text }]
 * params      : parseCommon() result (colors, font, border, animations)
 */
export function renderInfoCard({ params, width, title, icon, badge, lines, items, label }) {
    const { colors, disableAnimations, hideBorder, borderRadius } = params;
    const font = fontStack(params.font);
    const animated = !disableAnimations;

    const badgeText = badge ? clip(badge, 12) : '';
    const badgeW = badgeText ? Math.round(badgeText.length * 11 * emFactor(font) * 1.1 + 18) : 0;
    const titleMax = charsFor(width - 25 - 24 - 25 - (badgeW ? badgeW + 10 : 0), 16, emFactor(font) + 0.08); // bold is wider

    const t = fadeIn(animated, 0);
    const badgeSvg = badgeText
        ? `<rect x="${width - 25 - badgeW}" y="20" width="${badgeW}" height="20" rx="10" fill="none" stroke="${colors.text}" stroke-opacity="0.4"/>
      <text x="${width - 25 - badgeW / 2}" y="34" font-size="11" text-anchor="middle" fill="${colors.text}">${escapeXml(badgeText)}</text>`
        : '';
    const titleSvg = `<g${t.attr}>${t.anim}
      <g transform="translate(25, 21)"><path d="${ICONS[icon]}" fill="${colors.icon}"/></g>
      <text x="49" y="34" font-size="16" font-weight="700" fill="${colors.title}">${escapeXml(clip(title, titleMax))}</text>
      ${badgeSvg}
    </g>`;

    const d = fadeIn(animated, 1);
    const descSvg = lines.length
        ? `<g${d.attr}>${d.anim}
      ${lines.map((l, i) => `<text x="25" y="${62 + i * DESC_LINE}" font-size="13" fill="${colors.text}">${escapeXml(l)}</text>`).join('\n      ')}
    </g>`
        : '';

    const bodyBottom = lines.length ? 62 + (lines.length - 1) * DESC_LINE : 34;
    const footerTop = bodyBottom + 28; // baseline of the first footer row
    const footer = layoutFooter(items, width, FOOTER_SIZE * emFactor(font));

    const footerSvg = footer.placed
        .map(({ item, x, row, textX }, i) => {
            const y = footerTop + row * FOOTER_ROW;
            const f = fadeIn(animated, 2 + i);
            const mark = item.icon
                ? `<g transform="translate(0, -12) scale(0.875)"><path d="${ICONS[item.icon]}" fill="${colors.icon}"/></g>`
                : `<circle cx="5" cy="-4" r="5" fill="${item.dot}"/>`;
            return `<g transform="translate(${x.toFixed(1)}, ${y})"${f.attr}>${f.anim}
      ${mark}
      <text x="${textX}" y="0" font-size="12" fill="${colors.text}">${escapeXml(item.text)}</text>
    </g>`;
        })
        .join('\n    ');

    const lastBaseline = footer.rows ? footerTop + (footer.rows - 1) * FOOTER_ROW : bodyBottom;
    const height = Math.ceil(lastBaseline + 22);
    const summary = [title, ...lines].join(' ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}: ${escapeXml(summary)}">
  <title>${escapeXml(label)}</title>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${borderRadius}" fill="${colors.bg}" ${hideBorder ? 'stroke="none"' : `stroke="${colors.border}"`}/>
  <g font-family="${font}">
    ${titleSvg}
    ${descSvg}
    ${footerSvg}
  </g>
</svg>`;
}
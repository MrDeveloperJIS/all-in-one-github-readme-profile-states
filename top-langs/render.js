import { escapeXml, fontStack } from '../shared/svg.js';

const ROW = 25; // legend row height
const NORMAL_ROW = 40; // normal layout row height (name + bar)
const COMPACT_LEGEND_ROW = 20;
const CHART_R = 54; // outer radius of donut and pie
const DONUT_R = 45;
const DONUT_STROKE = 18;
const PIE_R = CHART_R / 2;
const PIE_STROKE = CHART_R;

const pct = (p, digits) => `${p.toFixed(digits)}%`;

/** How many characters fit in `px` pixels (rough estimate: 0.6em per character). */
const charsFor = (px, fontSize, factor = 0.6) => px / (fontSize * factor);

/** Cuts text to `maxChars` and adds an ellipsis. Call before escapeXml(). */
function clip(text, maxChars) {
    const s = String(text);
    const max = Math.max(1, Math.floor(maxChars));
    if (s.length <= max) return s;
    return `${s.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/** Staggered fade-in for a group. Returns the attribute and the animate element. */
function fadeIn(animated, i) {
    if (!animated) return { attr: '', anim: '' };
    return {
        attr: ' opacity="0"',
        anim: `<animate attributeName="opacity" from="0" to="1" begin="${i * 150}ms" dur="400ms" fill="freeze"/>`,
    };
}

function normalBody(langs, ctx) {
    const { width, colors, animated, options, top } = ctx;
    const barW = width - 50;
    const rowH = options.hideProgress ? ROW : NORMAL_ROW;
    const nameMax = charsFor(barW - 56, 13, 0.62); // leave room for "100.00%"

    const svg = langs
        .map((l, i) => {
            const y = top + i * rowH + 12;
            const w = (barW * l.percent) / 100;
            const f = fadeIn(animated, i);
            const grow = animated
                ? `<animate attributeName="width" from="0" to="${w.toFixed(2)}" begin="${i * 150}ms" dur="600ms" fill="freeze"/>`
                : '';
            const bar = options.hideProgress
                ? ''
                : `<rect y="10" width="${barW}" height="8" rx="4" fill="${colors.text}" fill-opacity="0.15"/>
      <rect y="10" width="${animated ? 0 : w.toFixed(2)}" height="8" rx="4" fill="${l.color}">${grow}</rect>`;
            return `<g transform="translate(25, ${y})"${f.attr}>${f.anim}
      <text x="0" y="0" font-size="13" font-weight="600" fill="${colors.text}">${escapeXml(clip(l.name, nameMax))}</text>
      <text x="${barW}" y="0" font-size="12" text-anchor="end" fill="${colors.text}">${pct(l.percent, 2)}</text>
      ${bar}
    </g>`;
        })
        .join('\n    ');

    // Bottom of the last row (its bar, or its text when bars are hidden) + 10px.
    const lastY = top + (langs.length - 1) * rowH + 12;
    const bottom = lastY + (options.hideProgress ? 4 : 18) + 10;

    return { svg, bottom };
}

function compactBody(langs, ctx) {
    const { width, colors, animated, options, top } = ctx;
    const barW = width - 50;
    const clipId = `lang-clip-${Math.round(width)}`;

    let x = 0;
    const segments = langs
        .map((l) => {
            const w = (barW * l.percent) / 100;
            const rect = `<rect x="${x.toFixed(2)}" width="${w.toFixed(2)}" height="8" fill="${l.color}"/>`;
            x += w;
            return rect;
        })
        .join('');

    const f = fadeIn(animated, 0);
    const bar = `<g transform="translate(25, ${top})"${f.attr}>${f.anim}
      <clipPath id="${clipId}"><rect width="${barW}" height="8" rx="4"/></clipPath>
      <rect width="${barW}" height="8" rx="4" fill="${colors.text}" fill-opacity="0.15"/>
      <g clip-path="url(#${clipId})">${segments}</g>
    </g>`;

    const colW = barW / 2;
    const labelMax = charsFor(colW - 16 - 6, 12); // text starts at x=16 inside the column
    const legend = langs
        .map((l, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const lf = fadeIn(animated, i + 1);
            const suffix = options.hideProgress ? '' : ` ${pct(l.percent, 2)}`;
            // Only the name is shortened, the percentage always stays visible.
            const label = `${clip(l.name, labelMax - suffix.length)}${suffix}`;
            return `<g transform="translate(${25 + col * colW}, ${top + 25 + row * COMPACT_LEGEND_ROW + 10})"${lf.attr}>${lf.anim}
      <circle cx="5" cy="-4" r="5" fill="${l.color}"/>
      <text x="16" y="0" font-size="12" fill="${colors.text}">${escapeXml(label)}</text>
    </g>`;
        })
        .join('\n    ');

    const rows = Math.ceil(langs.length / 2);
    return { svg: `${bar}\n    ${legend}`, bottom: top + 25 + rows * COMPACT_LEGEND_ROW + 5 };
}

/** Donut and pie share one drawing: stroked circles, one per language, rotated to start at the top. */
function chartSvg(langs, cx, cy, ctx) {
    const pie = ctx.options.layout === 'pie';
    const r = pie ? PIE_R : DONUT_R;
    const stroke = pie ? PIE_STROKE : DONUT_STROKE;
    const circumference = 2 * Math.PI * r;
    const f = (n) => n.toFixed(3);

    let offset = 0;
    const segments = langs
        .map((l, i) => {
            const isLast = i === langs.length - 1;
            // the last segment takes whatever is left, so the ring always closes
            const len = isLast ? circumference - offset : (circumference * l.percent) / 100;
            const final = `${f(len)} ${f(circumference - len)}`;
            const start = `0 ${f(circumference)}`;
            const anim = ctx.animated
                ? `<animate attributeName="stroke-dasharray" from="${start}" to="${final}" begin="${i * 150}ms" dur="500ms" fill="freeze"/>`
                : '';
            const el = `<circle r="${r}" fill="none" stroke="${l.color}" stroke-width="${stroke}" stroke-dasharray="${ctx.animated ? start : final}" stroke-dashoffset="${f(-offset)}">${anim}</circle>`;
            offset += len;
            return el;
        })
        .join('');

    return `<g transform="translate(${cx}, ${cy}) rotate(-90)">${segments}</g>`;
}

function legendRows(langs, x, top, w, ctx) {
    const nameMax = charsFor(w - 16 - 46, 12); // dot + gap on the left, "100.0%" on the right
    return langs
        .map((l, i) => {
            const f = fadeIn(ctx.animated, i);
            return `<g transform="translate(${x}, ${top + i * ROW + 12})"${f.attr}>${f.anim}
      <circle cx="5" cy="-4" r="5" fill="${l.color}"/>
      <text x="16" y="0" font-size="12" fill="${ctx.colors.text}">${escapeXml(clip(l.name, nameMax))}</text>
      <text x="${w}" y="0" font-size="12" text-anchor="end" fill="${ctx.colors.text}">${pct(l.percent, 1)}</text>
    </g>`;
        })
        .join('\n    ');
}

function sideChartBody(langs, ctx) {
    const { width, top } = ctx;
    const bodyH = Math.max(langs.length * ROW, 2 * CHART_R);
    const legendTop = top + (bodyH - langs.length * ROW) / 2;
    const legendW = width - 50 - 2 * CHART_R - 15;

    const chart = chartSvg(langs, width - 25 - CHART_R, top + bodyH / 2, ctx);
    const legend = legendRows(langs, 25, legendTop, legendW, ctx);
    return { svg: `${chart}\n    ${legend}`, bottom: top + bodyH + 10 };
}

function verticalChartBody(langs, ctx) {
    const { width, top } = ctx;
    const chart = chartSvg(langs, width / 2, top + CHART_R, ctx);
    const legendTop = top + 2 * CHART_R + 15;
    const legend = legendRows(langs, 25, legendTop, width - 50, ctx);
    return { svg: `${chart}\n    ${legend}`, bottom: legendTop + langs.length * ROW + 5 };
}

const BODIES = {
    normal: normalBody,
    compact: compactBody,
    donut: sideChartBody,
    pie: sideChartBody,
    'donut-vertical': verticalChartBody,
};

/** data: result of fetchTopLangs(). params: parseCommon(). options: parseTopLangsOptions(). */
export function renderTopLangs({ data, params, options }) {
    const { colors, disableAnimations, hideBorder, borderRadius } = params;
    const font = fontStack(params.font);
    const width = options.width;
    const animated = !disableAnimations;
    const showTitle = !options.hideTitle;
    const top = showTitle ? 55 : 25;

    const title = options.customTitle || 'Most Used Languages';
    const titleSvg = showTitle
        ? `<text x="25" y="35" font-size="18" font-weight="700" fill="${colors.title}">${escapeXml(title)}</text>`
        : '';

    const ctx = { width, colors, animated, options, top };
    const body = BODIES[options.layout](data.langs, ctx);
    const height = Math.ceil(body.bottom + 15);
    const names = data.langs.map((l) => l.name).join(', ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}: ${escapeXml(names)}">
  <title>${escapeXml(title)}</title>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${borderRadius}" fill="${colors.bg}" ${hideBorder ? 'stroke="none"' : `stroke="${colors.border}"`}/>
  <g font-family="${font}">
    ${titleSvg}
    ${body.svg}
  </g>
</svg>`;
}
import { resolveTheme, themeToColors } from './themes.js';

/** Message is safe to show to the public. Anything else becomes a generic error. */
export class CardError extends Error {
    constructor(message, code = 'card_error') {
        super(message);
        this.name = 'CardError';
        this.code = code;
    }
}

export const FONTS = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];

export function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/** 999 -> "999", 1500 -> "1.5k", 2300000 -> "2.3M". */
export function shortNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs < 1000) return `${sign}${Math.round(abs)}`;

    const units = ['', 'k', 'M', 'B'];
    let i = 0;
    let x = abs;
    while (i < units.length - 1 && x >= 1000) {
        x /= 1000;
        i++;
    }
    let r = Math.round(x * 10) / 10;
    if (r >= 1000 && i < units.length - 1) {
        r = Math.round((r / 1000) * 10) / 10;
        i++;
    }
    return `${sign}${r}${units[i]}`;
}

/** mode: 'short' -> 1.5k, 'long' -> 1500. */
export function formatNumber(value, mode = 'short') {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    return mode === 'long' ? String(Math.round(n)) : shortNumber(n);
}

/** Allowlisted generic family, or sans-serif. Also blocks SVG injection. */
export function fontStack(font) {
    const f = String(font ?? '').trim().toLowerCase();
    return FONTS.includes(f) ? f : 'sans-serif';
}

function wrapText(text, max) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
        if (line && (line + ' ' + word).length > max) {
            lines.push(line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
}

/** Small error card. `params` is optional (the default theme is used without it). */
export function errorCard(message, params) {
    const colors = params?.colors ?? themeToColors(resolveTheme('default'));
    const font = fontStack(params?.font);
    const radius = Number.isFinite(params?.borderRadius) ? params.borderRadius : 6;
    const hideBorder = Boolean(params?.hideBorder);

    const lines = wrapText(message, 58).slice(0, 4);
    const width = 495;
    const height = 64 + lines.length * 20;

    const text = lines
        .map((l, i) => `<text x="24" y="${64 + i * 20}" font-size="13" fill="${colors.text}">${escapeXml(l)}</text>`)
        .join('\n    ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Error: ${escapeXml(lines.join(' '))}">
  <title>Error</title>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="${colors.bg}" ${hideBorder ? 'stroke="none"' : `stroke="${colors.border}"`
        }/>
  <g font-family="${font}">
    <text x="24" y="36" font-size="16" font-weight="700" fill="${colors.title}">Error</text>
    ${text}
  </g>
</svg>`;
}
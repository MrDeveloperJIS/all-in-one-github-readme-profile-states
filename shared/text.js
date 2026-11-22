// Text helpers for cards. SVG has no text layout, so widths are estimated
// (about 0.6em per character). Call these BEFORE escapeXml().

/**
 * Average character width (in em) for a generic font family. Monospace is exact;
 * the others are a slightly generous average for English text.
 */
export const emFactor = (font) => (String(font).toLowerCase() === 'monospace' ? 0.61 : 0.54);

/** How many characters fit in `px` pixels at `fontSize`. */
export const charsFor = (px, fontSize, factor = 0.6) => Math.max(1, Math.floor(px / (fontSize * factor)));

/** Cuts text to `maxChars` and adds an ellipsis. */
export function clip(text, maxChars) {
    const s = String(text);
    const max = Math.max(1, Math.floor(maxChars));
    if (s.length <= max) return s;
    return `${s.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/**
 * Word-wraps `text` into at most `maxLines` lines of `maxChars` characters.
 * Words longer than a line (long URLs) are split. When the text does not fit,
 * the last line ends with an ellipsis. Returns [] for empty text.
 */
export function wrapLines(text, maxChars, maxLines) {
    const max = Math.max(1, Math.floor(maxChars));
    const words = String(text ?? '')
        .split(/\s+/)
        .filter(Boolean);

    const lines = [];
    let line = '';
    for (let word of words) {
        while (word.length > max) {
            // flush the current line, then cut the long word into full lines
            if (line) {
                lines.push(line);
                line = '';
            }
            lines.push(word.slice(0, max));
            word = word.slice(max);
        }
        if (!line) line = word;
        else if (line.length + 1 + word.length <= max) line += ` ${word}`;
        else {
            lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);

    if (lines.length <= maxLines) return lines;
    const kept = lines.slice(0, maxLines);
    // clip() makes room for the ellipsis when the last kept line is already full
    kept[maxLines - 1] = clip(`${kept[maxLines - 1]}…`, max);
    return kept;
}
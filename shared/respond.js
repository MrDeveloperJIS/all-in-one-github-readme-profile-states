import { getCacheSeconds } from './env.js';
import { CardError, errorCard } from './svg.js';

const ERROR_CACHE_SECONDS = 300;

export function cacheControl(seconds) {
    const n = Number(seconds);
    if (!Number.isFinite(n) || n <= 0) return 'no-store';
    return `public, max-age=${n}, s-maxage=${n}, stale-while-revalidate=${2 * n}`;
}

function write(res, svg, cache) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', cache);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(svg);
}

/** Successful card. */
export function sendSvg(res, svg, seconds = getCacheSeconds()) {
    write(res, svg, cacheControl(seconds));
}

/**
 * Failure card. Status stays 200 with a short cache so GitHub's image proxy
 * shows the message instead of a broken icon. Only CardError messages are
 * shown; anything else becomes a generic message.
 */
export function sendError(res, err, params) {
    const isCardError = err instanceof CardError;
    const message = isCardError ? err.message : 'Something went wrong while building the card.';
    if (!isCardError) console.error('Unhandled error:', err?.message);
    write(res, errorCard(message, params), cacheControl(ERROR_CACHE_SECONDS));
}
// The only three environment variables this project reads.

const DEFAULT_CACHE_SECONDS = 21600;
const MAX_CACHE_SECONDS = 86400;

/** GitHub classic PAT, or null when missing. Never print this value. */
export function getToken() {
    const raw = process.env.GH_TOKEN;
    return raw && raw.trim() ? raw.trim() : null;
}

/**
 * Allowed usernames.
 *  - '*'  -> anyone
 *  - []   -> nobody (empty or missing WHITELIST)
 *  - else -> lowercased array
 */
export function getWhitelist() {
    const raw = (process.env.WHITELIST || '').trim();
    if (!raw) return [];
    const list = raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return list.includes('*') ? '*' : list;
}

/** Integer 0..86400. Missing or invalid values fall back to 21600. */
export function getCacheSeconds() {
    const raw = process.env.CACHE_SECONDS;
    if (raw === undefined) return DEFAULT_CACHE_SECONDS;
    const trimmed = String(raw).trim();
    if (!/^\d+$/.test(trimmed)) return DEFAULT_CACHE_SECONDS;
    return Math.min(parseInt(trimmed, 10), MAX_CACHE_SECONDS);
}
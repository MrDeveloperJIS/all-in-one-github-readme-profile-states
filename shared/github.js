import { getToken } from './env.js';
import { CardError } from './svg.js';

const ENDPOINT = 'https://api.github.com/graphql';

const RATE_LIMIT_MESSAGE = 'GitHub API rate limit reached. Try again later.';

/**
 * Runs a GraphQL query. Every thrown error is a CardError with a public-safe
 * message; the token is never included in any message.
 */
export async function graphql(query, variables = {}) {
    const token = getToken();
    if (!token) throw new CardError('Server is not configured: GH_TOKEN is missing.', 'no_token');

    let res;
    try {
        res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'all-in-one-readme-profile-states',
            },
            body: JSON.stringify({ query, variables }),
        });
    } catch {
        throw new CardError('Could not reach GitHub. Try again later.', 'network');
    }

    if (res.status === 401) throw new CardError('GitHub rejected the token. Check GH_TOKEN.', 'bad_token');
    if (res.status === 403 || res.status === 429) throw new CardError(RATE_LIMIT_MESSAGE, 'rate_limit');
    if (!res.ok) throw new CardError(`GitHub returned an error (HTTP ${res.status}).`, 'http');

    let body;
    try {
        body = await res.json();
    } catch {
        throw new CardError('GitHub returned an unreadable response.', 'bad_response');
    }

    if (Array.isArray(body.errors) && body.errors.length) {
        const first = body.errors[0] || {};
        if (first.type === 'NOT_FOUND') throw new CardError('GitHub user not found.', 'not_found');
        if (first.type === 'RATE_LIMITED' || /rate limit/i.test(String(first.message))) {
            throw new CardError(RATE_LIMIT_MESSAGE, 'rate_limit');
        }
        throw new CardError('The GitHub query failed.', 'query_failed');
    }

    return body.data;
}
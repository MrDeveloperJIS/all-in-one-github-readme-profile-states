import { getWhitelist } from './env.js';
import { CardError } from './svg.js';

// GitHub rules: 1-39 chars, alphanumeric or single hyphens, no leading/trailing hyphen.
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(user) {
    return typeof user === 'string' && USERNAME_RE.test(user);
}

/** Throws a CardError unless the username is valid and whitelisted. */
export function checkUser(user) {
    if (!user) throw new CardError('Missing "user" parameter.', 'missing_user');
    if (!isValidUsername(user)) throw new CardError('Invalid GitHub username.', 'invalid_user');

    const whitelist = getWhitelist();
    if (whitelist === '*') return user;
    if (!whitelist.includes(user.toLowerCase())) {
        throw new CardError('This username is not allowed on this instance.', 'not_allowed');
    }
    return user;
}
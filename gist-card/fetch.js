import { graphql } from '../shared/github.js';
import { CardError } from '../shared/svg.js';

const FALLBACK_COLOR = '#858585';
const COLOR_RE = /^#[0-9a-f]{6}$/i;
export const FILE_LIMIT = 10; // GitHub's default for Gist.files; more files are shown as "10+"

const QUERY = `
query gistCard($login: String!, $id: String!) {
  user(login: $login) {
    login
    gist(name: $id) {
      name
      description
      isPublic
      stargazerCount
      forks { totalCount }
      files(limit: ${FILE_LIMIT}) { name size language { name color } }
    }
  }
}`;

/** The language with the most bytes across the files, or null. */
export function dominantLanguage(files) {
    const totals = new Map();
    for (const f of files) {
        const name = f?.language?.name;
        if (!name) continue;
        const entry = totals.get(name) ?? { name, color: f.language.color, bytes: 0 };
        entry.bytes += f.size ?? 0;
        totals.set(name, entry);
    }
    const top = [...totals.values()].sort((a, b) => b.bytes - a.bytes)[0];
    if (!top) return null;
    return { name: top.name, color: COLOR_RE.test(String(top.color)) ? top.color : FALLBACK_COLOR };
}

/**
 * Returns { id, owner, title, description, stars, forks, fileCount, moreFiles, language }.
 * `title` is the first file name. Secret gists are refused: the card is public.
 */
export async function fetchGist(login, options) {
    const data = await graphql(QUERY, { login, id: options.id }, {
        notFound: (path) => (path.includes('gist') ? 'Gist not found.' : 'GitHub user not found.'),
    });
    const user = data?.user;
    if (!user) throw new CardError('GitHub user not found.', 'not_found');
    const gist = user.gist;
    if (!gist) throw new CardError('Gist not found.', 'not_found');
    if (!gist.isPublic) throw new CardError('Secret gists are not shown on this card.', 'private');

    const files = (gist.files ?? []).filter(Boolean);
    return {
        id: gist.name,
        owner: user.login,
        title: files[0]?.name || gist.name,
        description: gist.description ?? '',
        stars: gist.stargazerCount ?? 0,
        forks: gist.forks?.totalCount ?? 0,
        fileCount: files.length,
        moreFiles: files.length >= FILE_LIMIT,
        language: dominantLanguage(files),
    };
}
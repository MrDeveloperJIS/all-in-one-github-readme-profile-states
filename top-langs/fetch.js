import { graphql } from '../shared/github.js';
import { CardError } from '../shared/svg.js';

const MAX_REPO_PAGES = 5; // 5 x 100 repositories
const FALLBACK_COLOR = '#858585';
const COLOR_RE = /^#[0-9a-f]{6}$/i;

const QUERY = `
query topLangs($login: String!, $after: String) {
  user(login: $login) {
    name
    login
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100, after: $after) {
      nodes {
        name
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

/**
 * options: { langsCount, sizeWeight, countWeight, hideLangs:Set, excludeRepos:Set }
 * Returns { name, login, langs: [{ name, color, size, percent }] } sorted by weight, biggest first.
 */
export async function fetchTopLangs(login, options) {
    const totals = new Map(); // language name -> { name, color, bytes, count }
    let owner = null;
    let after = null;

    for (let i = 0; i < MAX_REPO_PAGES; i++) {
        const data = await graphql(QUERY, { login, after });
        const user = data?.user;
        if (!user) throw new CardError('GitHub user not found.', 'not_found');
        owner = owner ?? user;

        const page = user.repositories;
        for (const repo of page?.nodes ?? []) {
            if (options.excludeRepos.has(String(repo.name).toLowerCase())) continue;
            for (const edge of repo.languages?.edges ?? []) {
                const name = edge?.node?.name;
                if (!name || options.hideLangs.has(name.toLowerCase())) continue;
                const entry = totals.get(name) ?? { name, color: edge.node.color, bytes: 0, count: 0 };
                entry.bytes += edge.size ?? 0;
                entry.count += 1;
                totals.set(name, entry);
            }
        }

        if (!page?.pageInfo?.hasNextPage) break;
        after = page.pageInfo.endCursor;
    }

    const ranked = [...totals.values()]
        .map((l) => ({
            name: l.name,
            color: COLOR_RE.test(String(l.color)) ? l.color : FALLBACK_COLOR,
            size: Math.pow(l.bytes, options.sizeWeight) * Math.pow(l.count, options.countWeight),
        }))
        .filter((l) => l.size > 0)
        .sort((a, b) => b.size - a.size)
        .slice(0, options.langsCount);

    if (!ranked.length) throw new CardError('No language data found for this user.', 'no_data');

    const sum = ranked.reduce((s, l) => s + l.size, 0);
    const langs = ranked.map((l) => ({ ...l, percent: (l.size / sum) * 100 }));

    return { name: owner.name || owner.login, login: owner.login, langs };
}
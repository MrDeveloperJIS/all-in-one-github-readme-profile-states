import { graphql } from '../shared/github.js';
import { CardError } from '../shared/svg.js';

const FALLBACK_COLOR = '#858585';
const COLOR_RE = /^#[0-9a-f]{6}$/i;

const QUERY = `
query repoCard($login: String!, $name: String!) {
  repository(owner: $login, name: $name) {
    name
    nameWithOwner
    description
    stargazerCount
    forkCount
    isPrivate
    isArchived
    isTemplate
    isFork
    primaryLanguage { name color }
  }
}`;

/**
 * Returns { name, fullName, description, stars, forks, language: { name, color } | null,
 *           archived, template, fork }.
 * Private repositories are refused: the card is public, so it never shows them.
 */
export async function fetchRepo(login, options) {
    const data = await graphql(QUERY, { login, name: options.repo }, { notFound: 'Repository not found.' });
    const repo = data?.repository;
    if (!repo) throw new CardError('Repository not found.', 'not_found');
    if (repo.isPrivate) throw new CardError('Private repositories are not shown on this card.', 'private');

    const lang = repo.primaryLanguage;
    return {
        name: repo.name,
        fullName: repo.nameWithOwner,
        description: repo.description ?? '',
        stars: repo.stargazerCount ?? 0,
        forks: repo.forkCount ?? 0,
        language: lang?.name ? { name: lang.name, color: COLOR_RE.test(String(lang.color)) ? lang.color : FALLBACK_COLOR } : null,
        archived: Boolean(repo.isArchived),
        template: Boolean(repo.isTemplate),
        fork: Boolean(repo.isFork),
    };
}
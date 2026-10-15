import { graphql } from '../shared/github.js';
import { CardError } from '../shared/svg.js';

const MAX_REPO_PAGES = 10; // 10 x 100 repositories

const USER_QUERY = `
query stats($login: String!, $from: DateTime, $to: DateTime) {
  user(login: $login) {
    name
    login
    commits: contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
    }
    reviews: contributionsCollection {
      totalPullRequestReviewContributions
      contributionYears
    }
    repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
      totalCount
    }
    pullRequests(first: 1) { totalCount }
    openIssues: issues(states: OPEN) { totalCount }
    closedIssues: issues(states: CLOSED) { totalCount }
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: { direction: DESC, field: STARGAZERS }) {
      nodes { name stargazers { totalCount } }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

const REPOS_QUERY = `
query repos($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: { direction: DESC, field: STARGAZERS }, after: $after) {
      nodes { name stargazers { totalCount } }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

function yearWindow(year, now) {
    const from = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    const to = end > now ? now : end;
    return { from: from.toISOString(), to: to.toISOString() };
}

/** Sum stars over paginated repos (sorted by stars desc, so we can stop at the first 0-star page end). */
async function countStars(login, firstPage, excluded) {
    let stars = 0;
    let page = firstPage;
    for (let i = 0; i < MAX_REPO_PAGES; i++) {
        const nodes = page?.nodes ?? [];
        for (const repo of nodes) {
            if (excluded.has(String(repo.name).toLowerCase())) continue;
            stars += repo.stargazers?.totalCount ?? 0;
        }
        const last = nodes[nodes.length - 1];
        const done = !page?.pageInfo?.hasNextPage || !last || (last.stargazers?.totalCount ?? 0) === 0;
        if (done) break;
        const data = await graphql(REPOS_QUERY, { login, after: page.pageInfo.endCursor });
        page = data?.user?.repositories;
    }
    return stars;
}

/** Commits across every contribution year, one aliased query. */
async function countAllCommits(login, years, now) {
    const list = years.map(Number).filter(Number.isInteger);
    if (!list.length) return 0;
    const fields = list
        .map((y) => {
            const { from, to } = yearWindow(y, now);
            return `y${y}: contributionsCollection(from: "${from}", to: "${to}") { totalCommitContributions }`;
        })
        .join('\n');
    const data = await graphql(`query allCommits($login: String!) { user(login: $login) { ${fields} } }`, { login });
    const user = data?.user ?? {};
    return list.reduce((sum, y) => sum + (user[`y${y}`]?.totalCommitContributions ?? 0), 0);
}

/**
 * options: { commitsYear?, includeAllCommits, excludeRepos:Set }
 * Returns plain numbers plus the label for the commits row.
 */
export async function fetchStats(login, options, now = new Date()) {
    const vars = { login };
    if (options.commitsYear) Object.assign(vars, yearWindow(options.commitsYear, now));

    const data = await graphql(USER_QUERY, vars);
    const user = data?.user;
    if (!user) throw new CardError('GitHub user not found.', 'not_found');

    const stars = await countStars(user.login, user.repositories, options.excludeRepos);

    let commits = user.commits?.totalCommitContributions ?? 0;
    let commitsLabel = 'Total Commits (last year)';
    let allCommits = false;
    if (options.commitsYear) {
        commitsLabel = `Total Commits (${options.commitsYear})`;
    } else if (options.includeAllCommits) {
        commits = await countAllCommits(user.login, user.reviews?.contributionYears ?? [], now);
        commitsLabel = 'Total Commits';
        allCommits = true;
    }

    return {
        name: user.name || user.login,
        login: user.login,
        stars,
        commits,
        commitsLabel,
        allCommits,
        prs: user.pullRequests?.totalCount ?? 0,
        issues: (user.openIssues?.totalCount ?? 0) + (user.closedIssues?.totalCount ?? 0),
        contribs: user.repositoriesContributedTo?.totalCount ?? 0,
        reviews: user.reviews?.totalPullRequestReviewContributions ?? 0,
        followers: user.followers?.totalCount ?? 0,
    };
}
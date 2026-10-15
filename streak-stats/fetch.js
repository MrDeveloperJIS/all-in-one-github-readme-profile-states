import { graphql } from '../shared/github.js';
import { CardError } from '../shared/svg.js';
import { resolveStartYear } from '../shared/params.js';

const YEARS_PER_QUERY = 8;

const META_QUERY = `
query meta($login: String!) {
  user(login: $login) {
    createdAt
    contributionsCollection { contributionYears }
  }
}`;

function yearWindow(year, now) {
    const from = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    const to = end > now ? now : end;
    return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Daily contribution counts from start_year (default: account creation year) to now.
 * Returns Map<'YYYY-MM-DD', number>.
 */
export async function fetchContributionCounts(login, requestedStartYear, now = new Date()) {
    const meta = await graphql(META_QUERY, { login });
    const user = meta?.user;
    if (!user) throw new CardError('GitHub user not found.', 'not_found');

    const createdYear = new Date(user.createdAt).getUTCFullYear();
    const startYear = resolveStartYear(requestedStartYear, createdYear);
    const currentYear = now.getUTCFullYear();

    const years = (user.contributionsCollection?.contributionYears ?? [])
        .map(Number)
        .filter((y) => Number.isInteger(y) && y >= startYear && y <= currentYear)
        .sort((a, b) => a - b);

    const counts = new Map();
    for (let i = 0; i < years.length; i += YEARS_PER_QUERY) {
        const chunk = years.slice(i, i + YEARS_PER_QUERY);
        const fields = chunk
            .map((y) => {
                const { from, to } = yearWindow(y, now);
                return `y${y}: contributionsCollection(from: "${from}", to: "${to}") {
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }`;
            })
            .join('\n    ');
        const data = await graphql(`query days($login: String!) { user(login: $login) { ${fields} } }`, { login });

        for (const y of chunk) {
            const weeks = data?.user?.[`y${y}`]?.contributionCalendar?.weeks ?? [];
            for (const week of weeks) {
                for (const day of week.contributionDays ?? []) {
                    counts.set(day.date, day.contributionCount);
                }
            }
        }
    }
    return counts;
}
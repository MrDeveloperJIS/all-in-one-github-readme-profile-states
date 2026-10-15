// Same math as the original stats card. Do not change the medians or weights.

const exponentialCdf = (x) => 1 - 2 ** -x;
const logNormalCdf = (x) => x / (1 + x);

const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
const LEVELS = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];

/** Returns { level, percentile }. Lower percentile = better rank. */
export function calculateRank({ allCommits = false, commits = 0, prs = 0, issues = 0, reviews = 0, stars = 0, followers = 0 }) {
    const COMMITS_MEDIAN = allCommits ? 1000 : 250;
    const COMMITS_WEIGHT = 2;
    const PRS_MEDIAN = 50;
    const PRS_WEIGHT = 3;
    const ISSUES_MEDIAN = 25;
    const ISSUES_WEIGHT = 1;
    const REVIEWS_MEDIAN = 2;
    const REVIEWS_WEIGHT = 1;
    const STARS_MEDIAN = 50;
    const STARS_WEIGHT = 4;
    const FOLLOWERS_MEDIAN = 10;
    const FOLLOWERS_WEIGHT = 1;

    const TOTAL_WEIGHT =
        COMMITS_WEIGHT + PRS_WEIGHT + ISSUES_WEIGHT + REVIEWS_WEIGHT + STARS_WEIGHT + FOLLOWERS_WEIGHT;

    const rank =
        1 -
        (COMMITS_WEIGHT * exponentialCdf(commits / COMMITS_MEDIAN) +
            PRS_WEIGHT * exponentialCdf(prs / PRS_MEDIAN) +
            ISSUES_WEIGHT * exponentialCdf(issues / ISSUES_MEDIAN) +
            REVIEWS_WEIGHT * exponentialCdf(reviews / REVIEWS_MEDIAN) +
            STARS_WEIGHT * logNormalCdf(stars / STARS_MEDIAN) +
            FOLLOWERS_WEIGHT * logNormalCdf(followers / FOLLOWERS_MEDIAN)) /
            TOTAL_WEIGHT;

    const percentile = rank * 100;
    const index = THRESHOLDS.findIndex((t) => percentile <= t);
    return { level: LEVELS[index === -1 ? LEVELS.length - 1 : index], percentile };
}
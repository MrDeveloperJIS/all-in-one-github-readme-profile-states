import { graphql } from '../shared/github.js';
import { CardError } from '../shared/svg.js';

const CREATED_AT_QUERY = `
  query($login: String!) {
    user(login: $login) { createdAt }
  }`;

const WINDOW_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays { date contributionCount }
          }
        }
      }
    }
  }`;

const notFound = () => new CardError('GitHub user not found.', 'not_found');

export async function fetchCreatedAt(login) {
    const data = await graphql(CREATED_AT_QUERY, { login });
    if (!data?.user) throw notFound();
    return data.user.createdAt;
}

async function fetchWindow(login, { from, to }) {
    const data = await graphql(WINDOW_QUERY, { login, from, to });
    if (!data?.user) throw notFound();
    const days = [];
    for (const week of data.user.contributionsCollection.contributionCalendar.weeks) {
        for (const day of week.contributionDays) {
            days.push({ date: day.date, count: day.contributionCount });
        }
    }
    return days;
}

/** Runs every window in parallel and merges them into 'YYYY-MM-DD' -> count. */
export async function fetchDailyCounts(login, windows) {
    const results = await Promise.all(windows.map((w) => fetchWindow(login, w)));
    const map = new Map();
    for (const days of results) {
        for (const { date, count } of days) {
            // max(): if a boundary week ever appears in two windows, a padded 0 can't wipe a real count.
            map.set(date, Math.max(map.get(date) ?? 0, count));
        }
    }
    return map;
}
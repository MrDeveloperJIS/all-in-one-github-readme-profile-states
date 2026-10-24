# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).

## [1.3.0] - 2026-10-23

### Added
- Top languages card (`/api/top-langs`): your most used languages from the repositories you own (forks skipped, up to 500 repos). Five layouts with `layout`: `normal`, `compact`, `donut`, `donut-vertical` and `pie`. Other params: `langs_count` (1 to 20), `hide` (language names), `exclude_repo`, `size_weight` and `count_weight` (0 to 5, to rank by code size, repo count or a mix), `hide_title`, `hide_progress` and `custom_title`. The default width depends on the layout (300 to 400); `card_width` ranges from 280 to 1000.
- URL builder: a Top languages card in the picker, with every param above and a live preview from sample data, so it still makes no network requests.
- URL builder: separate `copy.svg` and `check.svg` icon files in `builder/icons/`, used by the new copy buttons.

### Changed
- URL builder: the card picker is now a dropdown with a "Card Type" label that stays at the top while the form scrolls, so more cards fit without crowding the page.
- URL builder: the copy buttons are small icon buttons inside the corner of each URL, Markdown and HTML box. The icon turns into a check mark for a moment after copying. The text boxes no longer resize.
- URL builder: the "Page background" toggle has a label and sits above the form, and scrollbars are thin and match the light or dark theme.
- `title_color`, `hide_title`, `custom_title` and `exclude_repo` now also apply to the Top languages card in the builder.
- Top languages: long language names are shortened with an ellipsis instead of running into the percentages, and the `normal` layout no longer leaves extra empty space under the last bar.
- URL builder: `hide` has a separate value for Top languages (language names), so values from the Stats and Streak checkboxes no longer carry over into its URL. `size_weight` and `count_weight` accept decimals such as `0.5`.
- URL builder: the Stats custom title placeholder is `<Name>'s GitHub Stats` again.
- URL builder: a Top languages `card_width` of 300 is no longer dropped from the URL for the `compact`, `donut` and `pie` layouts, whose real default width differs. `custom_title` and `exclude_repo` are cleared when you switch cards.
- Stats and streak cards: fade-in and ring animations now use valid SVG timing (`fill="freeze"`, rows and columns start hidden, the streak ring starts empty).
- Stats: no extra GitHub request after the 10th page of repositories.
- README: documented the Top languages card (table, params, examples, how it works, troubleshooting) and added it to References. Four cards instead of three. Unknown themes are documented as returning an error card, and the streak `date_format` default is described correctly.

## [1.2.1] - 2026-10-18

### Added
- Builder page: `favicon.svg`, and a Content-Security-Policy that now allows images from the same origin (`img-src 'self' data:`) so the icon can load.
- Keeps the builder page out of search engines: `robots` meta tag, `X-Robots-Tag` header for every response (in `vercel.json`) and a `robots.txt` that disallows crawling.
- `npm run dev` serves the builder page locally with `npx serve`.

### Changed
- Node.js is now 24 (`engines` is `24.x`), matching the Vercel project setting.
- README: local builder instructions use npm instead of Python.

## [1.2.0] - 2026-10-18

### Added
- Stats card: `rank_icon=percentile` shows the top percentage (for example `TOP 12%`) inside the rank ring. The ring fill is unchanged.
- Stats card: `show=reviews` adds a "PRs Reviewed (last year)" row. It is off by default, so existing cards look the same. `reviews` is also accepted by `hide`, which wins over `show`.

- URL builder page at the app root (`index.html` and `builder/`). Pick a card and options, then copy the URL, Markdown or HTML. The live preview renders sample data in the browser with the real card code, makes no network requests (enforced by a Content-Security-Policy) and uses no GitHub rate limit.

### Changed
- README: documented the URL builder, `rank_icon=percentile`, `show` and the `reviews` value of `hide`, and added an example.

## [1.1.0] - 2026-10-18

### Added
- Stats card: `rank_icon` param. `rank_icon=github` draws the GitHub icon inside the rank ring instead of the rank letter (`letter` is the default, `rank-icon` is accepted too). Ignored with `hide_rank=true`.
- Streak card: `date_format` param to choose how dates are written, with tokens `d dd ddd dddd`, `m mm mmm mmmm` and `yy yyyy`, for example `dd-mmm-yyyy` or `dd mm yy`. Without it the default `Mon D, YYYY` style is unchanged. Long patterns shrink the date text to fit the column.

### Changed
- Calendar card: more padding above the year label (10px, matching the left, right and bottom padding), and weekday labels are now `Mon`, `Wed`, `Fri` instead of `M`, `W`, `F`.
- README: the Card-specific table now has a Default column, a "How to use the params" section and annotated examples replace the plain example list, and Credits became a References section linking [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) and [github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats).

## [1.0.0] - 2026-10-15

Initial release. Three SVG cards served from one Vercel project, with one token and one shared set of parameters.

### Added

**Cards**
- Calendar card (`/api/calendar`): full contribution history as a horizontally scrolling grid with a sticky year label. Years are fetched in one-year chunks, from `start_year` (default: account creation year) to the current year. Supports `speed`.
- Stats card (`/api/stats`): stars, commits, PRs, issues and contributions, plus a rank ring (S, A+, A, A-, B+, B, B-, C+, C) computed from commits, PRs, issues, reviews, stars and followers. Supports `commits_year`, `include_all_commits`, `hide_title`, `hide_rank`, `custom_title` and `exclude_repo`. `card_width` ranges from 450 to 1000.
- Streak card (`/api/streak`): total contributions, current streak and longest streak. Rewritten from PHP to JavaScript. Supports `start_year`, `mode` (`daily` or `weekly`), `exclude_days` and `card_height`. An empty today does not reset the current streak early.

**Shared parameters** (same names on every card)
- `user`, `theme`, `font`, `bg_color`, `border_color`, `title_color`, `text_color`, `icon_color`, `ring_color`, `hide_border`, `border_radius`, `card_width`, `disable_animations`, `number_format` and `hide`.
- Nine built-in themes: `default` (alias `light`), `dark`, `transparent`, `radical`, `tokyonight`, `dracula`, `gruvbox`, `onedark` and `highcontrast`. Any color parameter overrides the theme.
- Generic font stacks only (no web fonts or remote assets). Colors are plain hex, with 8 digits for alpha.
- Invalid parameter values return an error card instead of a broken image.

**Platform and safety**
- Every response is `image/svg+xml`, including errors.
- Environment configuration: `GH_TOKEN`, `WHITELIST` (case-insensitive usernames, `*` allows anyone, empty denies all) and `CACHE_SECONDS` (default 21600, max 86400, `0` disables caching).
- The token is used server-side only and never appears in a response.
- Zero runtime dependencies. Node 22 (`engines` pinned to `22.x`), ESM, built-in `fetch`.
- `vercel.json` sets `maxDuration` to 30 seconds for every `api/*.js` function, so long contribution histories do not time out on the default limit.
- `.vercelignore` keeps `tests/` out of Vercel deployments, and `.gitignore` ignores the `.private/` folder.
- Test suite on `node:test` (`npm test`) covering env, guard, params, respond, SVG helpers, calendar dates and render, stats rank and render, and streak calculation and render.
- MIT license, with credits to the three projects the cards were adapted from.

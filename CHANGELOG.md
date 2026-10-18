# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).

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
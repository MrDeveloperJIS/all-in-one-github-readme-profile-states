# all-in-one-readme-profile-states

Four SVG cards for your GitHub profile README, served from one Vercel
project with one token and one shared set of parameters.

| Card | Endpoint | Shows |
|---|---|---|
| Calendar | `/api/calendar` | Full contribution history as a scrolling grid |
| Stats | `/api/stats` | Stars, commits, PRs, issues, contributions, rank ring |
| Streak | `/api/streak` | Total contributions, current streak, longest streak |
| Top languages | `/api/top-langs` | Your most used languages, in five layouts |

Every response is an SVG, including errors.

## Quick start

1. **Create a token:** GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic). Select `read:user`. Add `repo` only if you want private repos counted on the stats and top languages cards.
2. **Deploy:** push this repo to GitHub, then Vercel → Add New → Project → import it. Framework: Other. No build command. The included `vercel.json` sets a 30 second function timeout, and `.vercelignore` keeps `tests/` out of the deployment.
3. **Set env vars** in Vercel → Project → Settings → Environment Variables, then redeploy:

| Name | Purpose | Default |
|---|---|---|
| `GH_TOKEN` | Classic personal access token | required |
| `WHITELIST` | Comma-separated usernames allowed to render. `*` allows anyone | empty = deny all |
| `CACHE_SECONDS` | CDN cache time. `0` = no cache, max `86400` | `21600` |

4. **Embed** (replace `YOUR-APP` and `YOU`):

```md
![calendar](https://YOUR-APP.vercel.app/api/calendar?user=YOU&theme=dark&font=monospace&border_radius=10)
![stats](https://YOUR-APP.vercel.app/api/stats?user=YOU&theme=dark&font=monospace&border_radius=10)
![streak](https://YOUR-APP.vercel.app/api/streak?user=YOU&theme=dark&font=monospace&border_radius=10)
![top languages](https://YOUR-APP.vercel.app/api/top-langs?user=YOU&theme=dark&font=monospace&border_radius=10)
```

Light and dark variants:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="https://YOUR-APP.vercel.app/api/stats?user=YOU&theme=dark">
  <img alt="GitHub stats"
       src="https://YOUR-APP.vercel.app/api/stats?user=YOU&theme=default">
</picture>
```

## URL builder

Open the root of your deployed app (`https://YOUR-APP.vercel.app/`) to build a card URL by clicking instead of typing. Pick a card, set the options, then copy the URL, Markdown or HTML.

The preview is drawn in your browser from made-up sample data, using the same code as the cards. It never calls GitHub or your `/api` endpoints, so using it costs no rate limit. The page also sets a Content-Security-Policy that blocks every network request. Options that change real data (like `exclude_repo`) can't show in the demo, but they are still added to the URL.

To run it locally, serve the project folder with a static server (opening `index.html` as a file doesn't work, because browsers block ES modules from `file://`):

```
npm run dev
```

then open `http://localhost:8000/`. This uses `npx serve`, so nothing is added to the project's dependencies. It serves only the builder page, not the `/api` cards.

The page is not meant to be found through search: it has `noindex, nofollow` in a meta tag, `vercel.json` sends an `X-Robots-Tag` header, and `robots.txt` disallows crawling.

## Parameters

All four cards share the same names. Invalid values return an error SVG.

| Param | Default | Notes |
|---|---|---|
| `user` | required | GitHub username (`username` also works on stats) |
| `theme` | `default` | See [Themes](#themes) |
| `font` | `sans-serif` | `sans-serif`, `serif`, `monospace`, `cursive`, `fantasy`, `system-ui`. Anything else falls back to `sans-serif` |
| `bg_color` | theme | Hex, 6 or 8 digits, no `#` (8 digits = alpha) |
| `border_color` | theme | Border and dividers |
| `title_color` | theme | Stats and top languages title, streak big numbers |
| `text_color` | theme | Labels, values, dates, language names |
| `icon_color` | theme | Stats icons, streak fire |
| `ring_color` | theme | Stats rank ring, streak ring |
| `hide_border` | `false` | `true` / `false` |
| `border_radius` | `6` | 0 to 50 |
| `card_width` | per card | Clamped per card: calendar 200 to 2000 (default 512), stats 450 to 1000 (default 495), streak 300 to 1000 (default 495), top languages 280 to 1000 (default depends on `layout`, see below). Widen it for `serif` or `monospace` |
| `disable_animations` | `false` | Static card when `true` |
| `number_format` | `short` | `short` = `1.5k`, `long` = `1500` |
| `hide` | none | Comma list, values below. On the top languages card it is a list of language names |

Colors are plain hex only (no gradients, no color names). The calendar uses GitHub's green scale, light or dark by the theme's `mode`.

**Card-specific**

| Card | Param | Default | Notes |
|---|---|---|---|
| calendar | `start_year` | account creation year | First year shown, through the current year. Can't go earlier than the account creation year |
| calendar | `speed` | `40` | Scroll speed in px per second, 5 to 300. Ignored with `disable_animations=true` |
| stats | `commits_year` | none (last 12 months) | Count commits for that single year only, 2005 to the current year |
| stats | `include_all_commits` | `false` | `true` = all-time commits instead of the last 12 months |
| stats | `hide_title` | `false` | `true` removes the title |
| stats | `hide_rank` | `false` | `true` removes the rank ring (and `rank_icon` with it) |
| stats | `rank_icon` | `letter` | What the ring shows: `letter` = the rank (S, A+, A, B+, ...), `github` = the GitHub icon, `percentile` = your top percentage, e.g. `TOP 12%`. `rank-icon` also works |
| stats | `show` | none | Turns on extra rows. `show=reviews` adds a "PRs Reviewed (last year)" row. Remove it again with `hide=reviews` |
| stats | `custom_title` | `<Name>'s GitHub Stats` | Replace the title text (URL-encode spaces, max 60 characters) |
| stats | `exclude_repo` | none | Comma list of repos to skip. Names appear in the URL |
| streak | `start_year` | account creation year | Minimum 2005 |
| streak | `mode` | `daily` | `daily` or `weekly` |
| streak | `exclude_days` | none | e.g. `Sat,Sun`. Skipped without breaking the streak |
| streak | `card_height` | `195` | 150 to 400 |
| streak | `date_format` | `Mon D, YYYY` (year hidden for the current year) | How dates are written, e.g. `dd-mmm-yyyy`. See [Date format](#date-format). A custom format always shows exactly what you write |
| top-langs | `layout` | `normal` | `normal` (name and bar per language), `compact` (one stacked bar with a two-column legend), `donut`, `donut-vertical` (chart above the legend) or `pie` |
| top-langs | `langs_count` | `5` (`6` for `compact`) | How many languages to show, 1 to 20 |
| top-langs | `hide` | none | Language names to leave out, e.g. `html,css,shell`. Not case-sensitive. If you write the URL by hand, encode `+` as `%2B` and `#` as `%23` (`c%2B%2B`, `c%23`); the URL builder does this for you |
| top-langs | `exclude_repo` | none | Comma list of repos to skip. Names appear in the URL |
| top-langs | `size_weight` | `1` | How much code size (bytes) counts toward the ranking, 0 to 5 |
| top-langs | `count_weight` | `0` | How much the number of repos using a language counts, 0 to 5 |
| top-langs | `hide_title` | `false` | `true` removes the title |
| top-langs | `hide_progress` | `false` | `true` removes the bars (`normal`) or the percentages (`compact`). Chart layouts are not affected |
| top-langs | `custom_title` | `Most Used Languages` | Replace the title text (URL-encode spaces, max 60 characters) |
| top-langs | `card_width` | by layout | 280 to 1000. When not set: `normal` 300, `compact` 400, `donut` 340, `donut-vertical` 300, `pie` 340 |

`hide` values: stats → `stars,commits,prs,issues,contribs,reviews` · streak → `total,current,longest` · top-langs → language names such as `html,css` · calendar → ignored.

### How to use the params

A card URL is the endpoint plus a query string. Start the query with `?`, join every param with `&`, and write each one as `name=value`. Order doesn't matter, and any param you leave out uses its default.

```
/api/stats?user=YOU&theme=dracula&rank_icon=github
└─────────┘ └──────────────────────────────────┘
 endpoint     ?  first param  &  next param  &  ...
```

Rules that apply to every param:

- **Lists** use commas with no spaces: `hide=stars,issues`, `exclude_days=Sat,Sun`.
- **Colors** are hex without `#`: `bg_color=0d1117`. Add two more digits for transparency: `bg_color=00000000`.
- **Spaces** in text must be encoded as `%20`: `custom_title=My%20Dev%20Stats`.
- **Booleans** are `true` or `false`: `hide_border=true`.
- **Wrong values** return an error card that says which param is wrong.

### Date format

`date_format` sets how the streak card writes dates. It only applies to the streak card, because the other two cards don't print full dates. Build a pattern from these tokens:

| Token | Meaning | Example (Fri 6 Mar 2026) |
|---|---|---|
| `d` / `dd` | Day, plain / 2 digits | `6` / `06` |
| `ddd` / `dddd` | Weekday, short / full | `Fri` / `Friday` |
| `m` / `mm` | Month number, plain / 2 digits | `3` / `03` |
| `mmm` / `mmmm` | Month name, short / full | `Mar` / `March` |
| `yy` / `yyyy` | Year, 2 / 4 digits | `26` / `2026` |

Everything else in the pattern is copied as it is, but only these separators are allowed: space, `-`, `/`, `.`, `,`, `:`, `_`. Tokens are case-insensitive (`DD-MM-YYYY` works). Any other letter returns an error card. Encode spaces as `%20`.

| `date_format` | Result | In the URL |
|---|---|---|
| `dd mm yy` | `06 03 26` | `date_format=dd%20mm%20yy` |
| `dd-mmm-yyyy` | `06-Mar-2026` | `date_format=dd-mmm-yyyy` |
| `dd/mm/yyyy` | `06/03/2026` | `date_format=dd/mm/yyyy` |
| `mm/dd/yyyy` | `03/06/2026` | `date_format=mm/dd/yyyy` |
| `yyyy-mm-dd` | `2026-03-06` | `date_format=yyyy-mm-dd` |
| `mmmm d, yyyy` | `March 6, 2026` | `date_format=mmmm%20d,%20yyyy` |
| `ddd, d mmm yyyy` | `Fri, 6 Mar 2026` | `date_format=ddd,%20d%20mmm%20yyyy` |

Ranges keep their shape: `06-Mar-2026 - Present`, `01-Dec-2024 - 05-Dec-2024`. Long patterns shrink the date text so it stays inside the card.

**Examples**

Each one below is a different mix. Copy a line, replace `YOU`, then change the values to see what happens.

| Example | What it does |
|---|---|
| `/api/calendar?user=YOU&theme=tokyonight&start_year=2022` | Calendar in the `tokyonight` theme, showing only 2022 until now |
| `/api/calendar?user=YOU&speed=100&card_width=800` | A wider calendar that scrolls faster than the default 40 |
| `/api/stats?user=YOU&theme=dracula&hide=issues&number_format=long` | Hides the issues row and prints full numbers (`1500`, not `1.5k`) |
| `/api/stats?user=YOU&theme=radical&rank_icon=github` | Shows the GitHub icon in the rank ring instead of the letter |
| `/api/stats?user=YOU&rank_icon=percentile&show=reviews` | Shows `TOP 12%` in the ring and adds the PRs Reviewed row |
| `/api/stats?user=YOU&custom_title=My%20Dev%20Stats&hide_rank=true&commits_year=2025` | Custom title, no rank ring, commits counted for 2025 only |
| `/api/stats?user=YOU&include_all_commits=true&exclude_repo=old-project,test-repo` | All-time commits, skipping two repos |
| `/api/top-langs?user=YOU&layout=compact&theme=dracula` | Compact layout: one stacked bar with a legend underneath |
| `/api/top-langs?user=YOU&layout=donut&langs_count=8&hide=html,css` | Donut chart with 8 languages, leaving out HTML and CSS |
| `/api/top-langs?user=YOU&size_weight=0.5&count_weight=0.5&exclude_repo=old-project` | Ranks by a mix of code size and repo count, and skips one repo |
| `/api/streak?user=YOU&mode=weekly&exclude_days=Sat,Sun` | Weekly streak, and weekends never break it |
| `/api/streak?user=YOU&bg_color=00000000&text_color=ffffff&ring_color=ff6e96` | Transparent background with custom text and ring colors |
| `/api/streak?user=YOU&date_format=dd-mmm-yyyy` | Dates like `06-Mar-2026` instead of `Mar 6` |
| `/api/streak?user=YOU&theme=gruvbox&hide=total&card_height=170&border_radius=20` | Hides the total, makes the card shorter, rounds the corners |

In a README, wrap any of them in Markdown image syntax:

```md
![my stats](https://YOUR-APP.vercel.app/api/stats?user=YOU&theme=radical&rank_icon=github)
```

## How the cards work

**Calendar:** every year from `start_year` to now, fetched in one-year chunks, scrolling horizontally with a sticky year label.

**Stats:** stars (repositories paginated, up to 10 pages), commits, PRs, issues and contributions, with a rank ring. The rank is computed from commits, PRs, issues, reviews, stars and followers, converted to a percentile: S (top 1%), A+ (12.5%), A (25%), A- (37.5%), B+ (50%), B (62.5%), B- (75%), C+ (87.5%), C. The ring always fills by percentile. `rank_icon` only changes what is written inside it: the letter, the GitHub icon, or the percentile itself (`TOP 12%`). The optional reviews row (`show=reviews`) counts pull request reviews from the last 12 months.

**Top languages:** reads the languages of the repositories you own (forks are skipped, up to 500 repositories, and the 10 biggest languages of each). Each language gets a score of `bytes ^ size_weight × repos ^ count_weight`, so the defaults rank purely by code size. The best `langs_count` languages are kept, and the percentages are shares of those shown languages, so they always add up to 100%. Languages without a GitHub color use grey. Private repositories are included only when the token has the `repo` scope.

**Streak:**
- *Current streak:* consecutive days ending today. If today is still empty, counting ends at yesterday, so the streak isn't reset early.
- *Longest streak:* the longest run of consecutive contribution days.
- *Weekly mode:* a Sunday to Saturday week counts if it has at least one contribution.
- *Excluded days:* in daily mode, an empty excluded weekday is skipped, so it neither adds to nor breaks a streak. A contribution on an excluded day still counts. Ignored in weekly mode.
- *Dates:* `Mon D, YYYY` by default, with the year omitted for the current year. Change the style with [`date_format`](#date-format). Ranges that are still running end with `Present`.

<details>
<summary id="themes">Themes</summary>

Use `theme=<name>`. Any color param overrides the theme. `light` is an alias of `default`. Unknown names return an error card.

| Theme | mode | bg | border | title | text | icon | ring |
|---|---|---|---|---|---|---|---|
| `default` | light | ffffff | e4e2e2 | 2f80ed | 434d58 | 4c71f2 | 2f80ed |
| `dark` | dark | 0d1117 | 30363d | 58a6ff | c9d1d9 | 58a6ff | 58a6ff |
| `transparent` | light | 00000000 | e4e2e2 | 006aff | 417e87 | 0579c3 | 006aff |
| `radical` | dark | 141321 | e4e2e2 | fe428e | a9fef7 | f8d847 | fe428e |
| `tokyonight` | dark | 1a1b27 | 2f334d | 70a5fd | 38bdae | bf91f3 | 70a5fd |
| `dracula` | dark | 282a36 | 44475a | ff6e96 | f8f8f2 | 79dafa | ff6e96 |
| `gruvbox` | dark | 282828 | 3c3836 | fabd2f | 8ec07c | fe8019 | fabd2f |
| `onedark` | dark | 282c34 | 3e4451 | e4bf7a | abb2bf | 8eb573 | e4bf7a |
| `highcontrast` | dark | 000000 | ffffff | e7f216 | ffffff | 00ffff | e7f216 |

</details>

<details>
<summary>Troubleshooting</summary>

| Symptom | Fix |
|---|---|
| "Not allowed" card | Username isn't in `WHITELIST`, or it's empty. Add it or use `*`, then redeploy |
| Token or "Bad credentials" card | `GH_TOKEN` is missing, expired, revoked, or not a classic token. Replace it and redeploy |
| "Rate limit" card | Raise `CACHE_SECONDS` so fewer requests reach GitHub |
| Env change had no effect | Env vars apply to new deployments only. Redeploy |
| Old image still showing | It's cached. Wait for `CACHE_SECONDS` or set it to `0` temporarily |
| Private contributions or repos missing | Enable "Include private contributions on my profile" in GitHub profile settings. Add the `repo` scope for private repo stats and languages |
| A language is missing from the top languages card | Forks are skipped, only your first 500 repos are read, and `hide`, `exclude_repo` and `langs_count` can drop it. GitHub only reports languages it detects |
| "No language data found" card | No owned, non-fork repo has code, or `hide` and `exclude_repo` removed everything |
| Text overflows the card | `serif` and `monospace` are wider. Increase `card_width` |
| Function timed out | Functions are limited to 30 seconds by `vercel.json`. Very long histories can still hit it. Raise `maxDuration` there, within your Vercel plan's limit |

The token is used server-side only and never appears in any response.

</details>

## Development

```
npm test
```

The builder page is plain static files (`index.html` and `builder/`), with no build step. `builder/meta.js` lists every param, and its defaults come from the same constants the cards use, so a new param needs one entry there.

Node 24 (`engines` is `24.x`), no runtime dependencies. For local runs copy `.env.example` to `.env`. A `.private/` folder is git-ignored for local notes. See [CHANGELOG.md](CHANGELOG.md) for version history.

## References

The stats, top languages and streak cards are built on two open source projects. Parameter names, the rank formula and the streak rules come from them, so many options will feel familiar if you have used the originals. The calendar card is the author's own idea, a personal project that is not published anywhere else.

| Card | Based on | Author | What was kept | What changed here |
|---|---|---|---|---|
| Stats | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats) | Anurag Hazra and contributors | Stat rows, rank formula and levels, and the params `hide`, `hide_title`, `hide_rank`, `hide_border`, `include_all_commits`, `commits_year`, `custom_title`, `exclude_repo`, `rank_icon`, `number_format` | Only the stats and top languages cards are kept. SVG only, generic fonts only, no `locale`, colors are plain hex |
| Top languages | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats) | Anurag Hazra and contributors | The five layouts (`normal`, `compact`, `donut`, `donut-vertical`, `pie`) and the params `layout`, `langs_count`, `hide`, `exclude_repo`, `size_weight`, `count_weight`, `hide_title`, `hide_progress`, `custom_title`, `card_width` | Rewritten as plain SVG with its own renderer. Percentages are shares of the shown languages, `hide` matches language names without case, and the extra card types, `stats_format` and `locale` are not included |
| Streak | [DenverCoder1/github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats) | Jonah Lawrence and contributors | Current and longest streak, `mode` (`daily` / `weekly`), `exclude_days`, `date_format`, `card_width`, `card_height` | Rewritten from PHP to JavaScript. `starting_year` is now `start_year`, colors use the shared names (`bg_color`, `ring_color`, ...), and `date_format` uses `dd mmm yyyy` style tokens instead of PHP ones |
| Calendar | Personal idea of the project author | not based on another project | Scrolling contribution grid with a sticky year label | Written from scratch for this project |

Their READMEs document options that are not included here, such as custom labels and locales on the streak card, and extra cards and themes in github-readme-stats.

Copyright notices are in [LICENSE](LICENSE).

## License

MIT
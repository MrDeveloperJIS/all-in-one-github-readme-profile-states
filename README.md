# all-in-one-readme-profile-states

Three SVG cards for your GitHub profile README, served from one Vercel
project with one token and one shared set of parameters.

| Card | Endpoint | Shows |
|---|---|---|
| Calendar | `/api/calendar` | Full contribution history as a scrolling grid |
| Stats | `/api/stats` | Stars, commits, PRs, issues, contributions, rank ring |
| Streak | `/api/streak` | Total contributions, current streak, longest streak |

Every response is an SVG, including errors.

## Quick start

1. **Create a token:** GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic). Select `read:user`. Add `repo` only if you want private repos counted on the stats card.
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

## Parameters

All three cards share the same names. Invalid values return an error SVG.

| Param | Default | Notes |
|---|---|---|
| `user` | required | GitHub username (`username` also works on stats) |
| `theme` | `default` | See [Themes](#themes) |
| `font` | `sans-serif` | `sans-serif`, `serif`, `monospace`, `cursive`, `fantasy`, `system-ui`. Anything else falls back to `sans-serif` |
| `bg_color` | theme | Hex, 6 or 8 digits, no `#` (8 digits = alpha) |
| `border_color` | theme | Border and dividers |
| `title_color` | theme | Stats title, streak big numbers |
| `text_color` | theme | Labels, values, dates |
| `icon_color` | theme | Stats icons, streak fire |
| `ring_color` | theme | Stats rank ring, streak ring |
| `hide_border` | `false` | `true` / `false` |
| `border_radius` | `6` | 0 to 50 |
| `card_width` | per card | Clamped per card: calendar 200 to 2000 (default 512), stats 450 to 1000 (default 495), streak 300 to 1000 (default 495). Widen it for `serif` or `monospace` |
| `disable_animations` | `false` | Static card when `true` |
| `number_format` | `short` | `short` = `1.5k`, `long` = `1500` |
| `hide` | none | Comma list, values below |

Colors are plain hex only (no gradients, no color names). The calendar uses GitHub's green scale, light or dark by the theme's `mode`.

**Card-specific**

| Card | Param | Notes |
|---|---|---|
| calendar | `start_year` | First year shown, through the current year. Default: account creation year |
| calendar | `speed` | Scroll speed. Ignored with `disable_animations=true` |
| stats | `commits_year` | Count commits for that single year only |
| stats | `include_all_commits` | All-time commits instead of the current year |
| stats | `hide_title`, `hide_rank` | Remove the title or the rank ring |
| stats | `custom_title` | Replace the title text (URL-encode spaces) |
| stats | `exclude_repo` | Comma list of repos to skip. Names appear in the URL |
| streak | `start_year` | Default: account creation year. Minimum 2005 |
| streak | `mode` | `daily` (default) or `weekly` |
| streak | `exclude_days` | e.g. `Sat,Sun`. Skipped without breaking the streak |
| streak | `card_height` | Clamped |

`hide` values: stats → `stars,commits,prs,issues,contribs` · streak → `total,current,longest` · calendar → ignored.

**Examples**

```
/api/calendar?user=YOU&theme=tokyonight&start_year=2022
/api/stats?user=YOU&theme=dracula&hide=issues&number_format=long
/api/streak?user=YOU&mode=weekly&exclude_days=Sat,Sun
/api/streak?user=YOU&bg_color=00000000&text_color=ffffff&ring_color=ff6e96
```

## How the cards work

**Calendar:** every year from `start_year` to now, fetched in one-year chunks, scrolling horizontally with a sticky year label.

**Stats:** stars (repositories paginated, up to 10 pages), commits, PRs, issues and contributions, with a rank ring. The rank is computed from commits, PRs, issues, reviews, stars and followers, converted to a percentile: S (top 1%), A+ (12.5%), A (25%), A- (37.5%), B+ (50%), B (62.5%), B- (75%), C+ (87.5%), C.

**Streak:**
- *Current streak:* consecutive days ending today. If today is still empty, counting ends at yesterday, so the streak isn't reset early.
- *Longest streak:* the longest run of consecutive contribution days.
- *Weekly mode:* a Sunday to Saturday week counts if it has at least one contribution.
- *Excluded days:* in daily mode, an empty excluded weekday is skipped, so it neither adds to nor breaks a streak. A contribution on an excluded day still counts. Ignored in weekly mode.
- *Dates:* `Mon D, YYYY`, year omitted for the current year, ranges that are still running end with `Present`.

<details>
<summary id="themes">Themes</summary>

Use `theme=<name>`. Any color param overrides the theme. `light` is an alias of `default`. Unknown names fall back to `default`.

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
| Private contributions or repos missing | Enable "Include private contributions on my profile" in GitHub profile settings. Add the `repo` scope for private repo stats |
| Text overflows the card | `serif` and `monospace` are wider. Increase `card_width` |
| Function timed out | Functions are limited to 30 seconds by `vercel.json`. Very long histories can still hit it. Raise `maxDuration` there, within your Vercel plan's limit |

The token is used server-side only and never appears in any response.

</details>

## Development

```
npm test
```

Node 22 (`engines` is `22.x`), no runtime dependencies. For local runs copy `.env.example` to `.env`. A `.private/` folder is git-ignored for local notes. See [CHANGELOG.md](CHANGELOG.md) for version history.

## Credits

Adapted from three MIT-licensed projects: `github-profile-calendar-graph` (MrDeveloperJIS), `github-readme-stats` (Anurag Hazra and contributors) and `github-readme-streak-stats` (Jonah Lawrence and contributors). The streak card was rewritten from PHP to JavaScript. Copyright notices are in [LICENSE](LICENSE).

## License

MIT
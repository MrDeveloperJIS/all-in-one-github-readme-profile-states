// One theme table for all three cards. Hex values have no '#'.
// 8-digit values carry alpha (RRGGBBAA).

export const THEMES = {
    default: {
        mode: 'light',
        bg_color: 'ffffff',
        border_color: 'e4e2e2',
        title_color: '2f80ed',
        text_color: '434d58',
        icon_color: '4c71f2',
        ring_color: '2f80ed',
    },
    dark: {
        mode: 'dark',
        bg_color: '0d1117',
        border_color: '30363d',
        title_color: '58a6ff',
        text_color: 'c9d1d9',
        icon_color: '58a6ff',
        ring_color: '58a6ff',
    },
    transparent: {
        mode: 'light',
        bg_color: '00000000',
        border_color: 'e4e2e2',
        title_color: '006aff',
        text_color: '417e87',
        icon_color: '0579c3',
        ring_color: '006aff',
    },
    radical: {
        mode: 'dark',
        bg_color: '141321',
        border_color: 'e4e2e2',
        title_color: 'fe428e',
        text_color: 'a9fef7',
        icon_color: 'f8d847',
        ring_color: 'fe428e',
    },
    tokyonight: {
        mode: 'dark',
        bg_color: '1a1b27',
        border_color: '2f334d',
        title_color: '70a5fd',
        text_color: '38bdae',
        icon_color: 'bf91f3',
        ring_color: '70a5fd',
    },
    dracula: {
        mode: 'dark',
        bg_color: '282a36',
        border_color: '44475a',
        title_color: 'ff6e96',
        text_color: 'f8f8f2',
        icon_color: '79dafa',
        ring_color: 'ff6e96',
    },
    gruvbox: {
        mode: 'dark',
        bg_color: '282828',
        border_color: '3c3836',
        title_color: 'fabd2f',
        text_color: '8ec07c',
        icon_color: 'fe8019',
        ring_color: 'fabd2f',
    },
    onedark: {
        mode: 'dark',
        bg_color: '282c34',
        border_color: '3e4451',
        title_color: 'e4bf7a',
        text_color: 'abb2bf',
        icon_color: '8eb573',
        ring_color: 'e4bf7a',
    },
    highcontrast: {
        mode: 'dark',
        bg_color: '000000',
        border_color: 'ffffff',
        title_color: 'e7f216',
        text_color: 'ffffff',
        icon_color: '00ffff',
        ring_color: 'e7f216',
    },
};

const ALIASES = { light: 'default' };

export const themeNames = [...Object.keys(THEMES), ...Object.keys(ALIASES)];

/** Returns the theme object or undefined. Case-insensitive. */
export function resolveTheme(name) {
    const key = String(name ?? 'default').trim().toLowerCase();
    const real = Object.hasOwn(ALIASES, key) ? ALIASES[key] : key;
    return Object.hasOwn(THEMES, real) ? THEMES[real] : undefined;
}

/** Theme -> { bg, border, title, text, icon, ring } with '#' prefixes. */
export function themeToColors(theme) {
    return {
        bg: `#${theme.bg_color}`,
        border: `#${theme.border_color}`,
        title: `#${theme.title_color}`,
        text: `#${theme.text_color}`,
        icon: `#${theme.icon_color}`,
        ring: `#${theme.ring_color}`,
    };
}
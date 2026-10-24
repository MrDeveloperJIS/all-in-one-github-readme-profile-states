// Single description of every param the builder can set. Defaults come from the
// same constants the cards use, so the builder cannot drift from the server.
import { THEMES } from '../shared/themes.js';
import { FONTS } from '../shared/svg.js';
import { CARD_WIDTH as CALENDAR_WIDTH, SPEED } from '../calendar-graph/options.js';
import { CARD_WIDTH as STATS_WIDTH, HIDE_VALUES as STATS_HIDE, SHOW_VALUES, RANK_ICONS } from '../readme-stats/options.js';
import { CARD_WIDTH as STREAK_WIDTH, CARD_HEIGHT, HIDE_VALUES as STREAK_HIDE } from '../streak-stats/options.js';
import { CARD_WIDTH as LANGS_WIDTH, LAYOUTS, LANGS_COUNT, WEIGHT } from '../top-langs/options.js';

const YEAR = new Date().getUTCFullYear();
const ALL = ['calendar', 'stats', 'streak', 'top-langs'];
const DATA = ['stats', 'streak'];
const TITLED = ['stats', 'streak', 'top-langs'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const YEAR_SPEC = { def: '', min: 2005, max: YEAR };

export const CARDS = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'stats', label: 'Stats' },
    { id: 'streak', label: 'Streak' },
    { id: 'top-langs', label: 'Top languages' },
];

export const GROUPS = [
    ['general', 'General'],
    ['colors', 'Colors'],
    ['card', 'Card options'],
];

const color = (name, label, cards) => ({ name, label, group: 'colors', type: 'color', cards, placeholder: 'from theme' });

/**
 * type: text | select | bool | number | color | checks
 * select default = first option. number default = spec.def ('' = automatic).
 * key (optional): name of the value in the form state, when it must differ from `name`.
 * step (optional, number only): input step, default 1.
 */
export const PARAMS = [
    { name: 'user', label: 'GitHub username', group: 'general', type: 'text', cards: ALL, placeholder: 'octocat' },
    { name: 'theme', label: 'Theme', group: 'general', type: 'select', cards: ALL, options: Object.keys(THEMES) },
    { name: 'font', label: 'Font', group: 'general', type: 'select', cards: ALL, options: FONTS },
    {
        name: 'card_width',
        label: 'Card width (px)',
        group: 'general',
        type: 'number',
        cards: ALL,
        byCard: {
            calendar: CALENDAR_WIDTH,
            stats: STATS_WIDTH,
            streak: STREAK_WIDTH,
            'top-langs': { ...LANGS_WIDTH, def: '' },
        },
    },
    { name: 'border_radius', label: 'Border radius', group: 'general', type: 'number', cards: ALL, spec: { def: 6, min: 0, max: 50 } },
    { name: 'hide_border', label: 'Hide border', group: 'general', type: 'bool', cards: ALL },
    { name: 'disable_animations', label: 'Disable animations', group: 'general', type: 'bool', cards: ALL },
    { name: 'number_format', label: 'Number format', group: 'general', type: 'select', cards: DATA, options: ['short', 'long'] },
    {
        name: 'hide',
        label: 'Hide',
        group: 'general',
        type: 'checks',
        cards: DATA,
        optionsByCard: { stats: STATS_HIDE, streak: STREAK_HIDE },
    },
    {
        name: 'hide',
        key: 'hide_langs', // own form value, so it never mixes with the stats/streak checkboxes above
        label: 'Hide languages',
        group: 'general',
        type: 'text',
        cards: ['top-langs'],
        placeholder: 'html,css,shell',
        note: 'Comma-separated language names, e.g. c++,c#. Special characters are encoded in the URL for you.',
    },

    color('bg_color', 'Background', ALL),
    color('border_color', 'Border', ALL),
    color('text_color', 'Text', ALL),
    color('title_color', 'Title / big numbers', TITLED),
    color('icon_color', 'Icons', DATA),
    color('ring_color', 'Ring', DATA),

    { name: 'start_year', label: 'Start year', group: 'card', type: 'number', cards: ['calendar', 'streak'], spec: YEAR_SPEC, placeholder: 'account creation year' },
    { name: 'speed', label: 'Scroll speed (px/s)', group: 'card', type: 'number', cards: ['calendar'], spec: SPEED },
    { name: 'commits_year', label: 'Commits year', group: 'card', type: 'number', cards: ['stats'], spec: YEAR_SPEC, placeholder: 'last 12 months' },
    { name: 'include_all_commits', label: 'All-time commits', group: 'card', type: 'bool', cards: ['stats'] },
    { name: 'hide_title', label: 'Hide title', group: 'card', type: 'bool', cards: ['stats', 'top-langs'] },
    { name: 'hide_rank', label: 'Hide rank ring', group: 'card', type: 'bool', cards: ['stats'] },
    { name: 'rank_icon', label: 'Rank icon', group: 'card', type: 'select', cards: ['stats'], options: RANK_ICONS },
    { name: 'custom_title', label: 'Custom title', group: 'card', type: 'text', cards: ['stats'], placeholder: "<Name>'s GitHub Stats" },
    { name: 'custom_title', label: 'Custom title', group: 'card', type: 'text', cards: ['top-langs'], placeholder: 'Most Used Languages' },
    { name: 'show', label: 'Show extra rows', group: 'card', type: 'checks', cards: ['stats'], optionsByCard: { stats: SHOW_VALUES } },
    {
        name: 'exclude_repo',
        label: 'Exclude repos',
        group: 'card',
        type: 'text',
        cards: ['stats', 'top-langs'],
        placeholder: 'repo-one,repo-two',
        note: 'Changes real data only. The demo card does not change.',
    },
    { name: 'layout', label: 'Layout', group: 'card', type: 'select', cards: ['top-langs'], options: LAYOUTS },
    { name: 'langs_count', label: 'Languages shown', group: 'card', type: 'number', cards: ['top-langs'], spec: { def: '', min: LANGS_COUNT.min, max: LANGS_COUNT.max }, placeholder: '5 (compact: 6)' },
    { name: 'size_weight', label: 'Size weight', group: 'card', type: 'number', cards: ['top-langs'], spec: WEIGHT, step: 'any' },
    { name: 'count_weight', label: 'Repo count weight', group: 'card', type: 'number', cards: ['top-langs'], spec: { ...WEIGHT, def: 0 }, step: 'any' },
    { name: 'hide_progress', label: 'Hide progress bars', group: 'card', type: 'bool', cards: ['top-langs'] },
    { name: 'mode', label: 'Mode', group: 'card', type: 'select', cards: ['streak'], options: ['daily', 'weekly'] },
    { name: 'exclude_days', label: 'Exclude days', group: 'card', type: 'checks', cards: ['streak'], optionsByCard: { streak: WEEKDAYS } },
    { name: 'card_height', label: 'Card height (px)', group: 'card', type: 'number', cards: ['streak'], spec: CARD_HEIGHT },
    {
        name: 'date_format',
        label: 'Date format',
        group: 'card',
        type: 'text',
        cards: ['streak'],
        placeholder: 'dd-mmm-yyyy',
    },
];

/** Key of the param's value in the form state. Usually the param name. */
export const keyOf = (p) => p.key ?? p.name;
export const appliesTo = (p, card) => !p.cards || p.cards.includes(card);
export const specOf = (p, card) => (p.byCard ? p.byCard[card] : p.spec);
export const optionsOf = (p, card) => (p.optionsByCard ? p.optionsByCard[card] ?? [] : p.options ?? []);

export function defaultOf(p, card) {
    if (p.type === 'number') return specOf(p, card).def;
    if (p.type === 'select') return optionsOf(p, card)[0];
    return p.type === 'bool' ? false : '';
}
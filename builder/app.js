// URL builder UI. The preview is rendered in the browser from sample data.
// The page's Content-Security-Policy blocks every network request.
import { CARDS, GROUPS, PARAMS, appliesTo, defaultOf, optionsOf, specOf } from './meta.js';
import { buildQuery, buildUrl } from './url.js';
import { renderDemo } from './preview.js';
import { formatWithParts, parseDateFormat } from '../shared/dateformat.js';

const $ = (id) => document.getElementById(id);
const HEX = /^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

const state = {
    card: 'stats',
    values: {},
    base: 'https://YOUR-APP.vercel.app',
};

function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    node.append(...[].concat(children));
    return node;
}

function setValue(name, value) {
    state.values[name] = value;
    update();
}

function dateHint(value) {
    try {
        const parts = parseDateFormat(value);
        return parts ? `Looks like: ${formatWithParts('2026-03-06', parts)}` : 'Default: Mon D, YYYY (year hidden for the current year)';
    } catch (err) {
        return err.message;
    }
}

function makeControl(p) {
    const id = `f-${p.name}`;
    const current = state.values[p.name];

    if (p.type === 'select') {
        const select = el('select', { id }, optionsOf(p, state.card).map((o) => el('option', { value: o }, o)));
        select.value = current ?? defaultOf(p, state.card);
        select.addEventListener('change', () => setValue(p.name, select.value));
        return select;
    }

    if (p.type === 'bool') {
        const box = el('input', { id, type: 'checkbox' });
        box.checked = current === 'true';
        box.addEventListener('change', () => setValue(p.name, String(box.checked)));
        return box;
    }

    if (p.type === 'number') {
        const spec = specOf(p, state.card);
        const attrs = { id, type: 'number', step: '1', placeholder: p.placeholder ?? String(spec.def) };
        if (spec.min !== undefined) attrs.min = String(spec.min);
        if (spec.max !== undefined) attrs.max = String(spec.max);
        const input = el('input', attrs);
        input.value = current ?? '';
        input.addEventListener('input', () => setValue(p.name, input.value));
        return input;
    }

    if (p.type === 'color') {
        const text = el('input', { id, type: 'text', placeholder: p.placeholder, maxlength: '9', autocomplete: 'off', spellcheck: 'false' });
        const picker = el('input', { type: 'color', 'aria-label': `${p.label} color picker`, value: '#808080' });
        const sync = () => {
            const v = text.value.trim().replace(/^#/, '');
            text.classList.toggle('invalid', v !== '' && !HEX.test(v));
            if (HEX.test(v)) picker.value = `#${v.slice(0, 6).toLowerCase()}`;
        };
        text.value = current ?? '';
        sync();
        text.addEventListener('input', () => {
            sync();
            setValue(p.name, text.value);
        });
        picker.addEventListener('input', () => {
            text.value = picker.value.slice(1);
            sync();
            setValue(p.name, text.value);
        });
        return el('span', { class: 'color-pair' }, [text, picker]);
    }

    if (p.type === 'checks') {
        const picked = new Set(current ?? []);
        const wrap = el('span', { class: 'checks' });
        for (const option of optionsOf(p, state.card)) {
            const box = el('input', { type: 'checkbox', value: option });
            box.checked = picked.has(option);
            box.addEventListener('change', () => {
                const next = new Set(state.values[p.name] ?? []);
                if (box.checked) next.add(option);
                else next.delete(option);
                setValue(p.name, [...next]);
            });
            wrap.append(el('label', { class: 'check' }, [box, ` ${option}`]));
        }
        return wrap;
    }

    const input = el('input', { id, type: 'text', autocomplete: 'off', spellcheck: 'false' });
    if (p.placeholder) input.setAttribute('placeholder', p.placeholder);
    input.value = current ?? '';
    input.addEventListener('input', () => {
        setValue(p.name, input.value);
        if (p.name === 'date_format') $('hint-date_format').textContent = dateHint(input.value);
    });
    return input;
}

function makeRow(p) {
    const labelFor = p.type === 'checks' ? undefined : `f-${p.name}`;
    const label = el('label', labelFor ? { for: labelFor } : {}, [p.label, el('code', {}, p.name)]);
    const row = el('div', { class: `row row-${p.type}` }, [label, makeControl(p)]);
    if (p.name === 'date_format') {
        row.append(el('small', { class: 'hint', id: 'hint-date_format' }, dateHint(state.values.date_format ?? '')));
    }
    if (p.note) row.append(el('small', { class: 'hint' }, p.note));
    return row;
}

function buildForm() {
    const form = $('form');
    form.replaceChildren();
    for (const [group, title] of GROUPS) {
        const params = PARAMS.filter((p) => p.group === group && appliesTo(p, state.card));
        if (!params.length) continue;
        const section = el('section', { class: 'group' }, [el('h2', {}, title)]);
        for (const p of params) section.append(makeRow(p));
        form.append(section);
    }
}

function buildTabs() {
    const tabs = $('tabs');
    tabs.replaceChildren();
    for (const card of CARDS) {
        const tab = el('button', { type: 'button', role: 'tab', 'aria-selected': String(card.id === state.card) }, card.label);
        tab.addEventListener('click', () => {
            state.card = card.id;
            buildTabs();
            buildForm();
            update();
        });
        tabs.append(tab);
    }
}

function update() {
    const card = state.card;
    const query = Object.fromEntries(buildQuery(card, state.values, 'octocat'));
    const svg = renderDemo(card, query);
    $('preview').src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    const url = buildUrl(state.base, card, state.values);
    const alt = `GitHub ${card} card`;
    $('out-url').value = url;
    $('out-md').value = `![${alt}](${url})`;
    $('out-html').value = `<img alt="${alt}" src="${url.replace(/&/g, '&amp;')}">`;
}

function wireStatic() {
    $('base').value = state.base;
    $('base').addEventListener('input', () => {
        state.base = $('base').value.trim() || 'https://YOUR-APP.vercel.app';
        update();
    });

    $('reset').addEventListener('click', () => {
        state.values = { user: state.values.user ?? '' };
        buildForm();
        update();
    });

    for (const button of document.querySelectorAll('[data-bg]')) {
        button.addEventListener('click', () => {
            $('stage').dataset.bg = button.dataset.bg;
            for (const b of document.querySelectorAll('[data-bg]')) b.setAttribute('aria-pressed', String(b === button));
        });
    }

    for (const button of document.querySelectorAll('[data-copy]')) {
        button.addEventListener('click', async () => {
            const field = $(button.dataset.copy);
            try {
                await navigator.clipboard.writeText(field.value);
            } catch {
                field.select();
                document.execCommand('copy');
            }
            const label = button.textContent;
            button.textContent = 'Copied';
            setTimeout(() => (button.textContent = label), 1500);
        });
    }
}

wireStatic();
buildTabs();
buildForm();
update();
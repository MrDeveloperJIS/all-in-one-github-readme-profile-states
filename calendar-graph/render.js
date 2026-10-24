import { escapeXml, formatNumber } from '../shared/svg.js';

const CELL = 11; // square size, px
const GAP = 3;
const PITCH = CELL + GAP;
const GUTTER = 34; // weekday label column (fits "Mon", "Wed", "Fri")
const PAD_X = 10;
const LEFT_OFFSET = PAD_X + GUTTER;
const RIGHT_PAD = PAD_X;
const TOP_PAD = 40; // room for year and month labels (10px above the year, like the left and right padding)
const BOTTOM_PAD = 10;
const MIN_DURATION_SEC = 20; // minimum time for the sweep, oldest -> today
const INITIAL_DELAY_SEC = 1;
const PAUSE_SEC = 2; // hold on "today" before restarting
const MIN_WEEKS_BETWEEN_MONTH_LABELS = 3;
const MONTH_LABEL_LOCAL_Y = 34 - TOP_PAD; // label sits at y=34 once the strip is shifted by TOP_PAD
const STICKY_YEAR_X = PAD_X;
const STICKY_YEAR_Y = 18;
const LABEL_FONT_SIZE = 11;
const LABEL_OPACITY = 0.75;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_ROW_LABELS = { 1: 'Mon', 3: 'Wed', 5: 'Fri' }; // row index (0 = Sun)

// GitHub's own contribution scale. Light or dark comes from the theme's mode.
const SQUARES = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
};

const leadDay = (week) => week.find((d) => d.inRange) || week[0];

function levelForCount(count, maxDailyCount) {
    if (count === 0) return 0;
    if (maxDailyCount <= 0) return 1;
    const ratio = count / maxDailyCount;
    if (ratio > 0.75) return 4;
    if (ratio > 0.5) return 3;
    if (ratio > 0.25) return 2;
    return 1;
}

/**
 * Month labels and squares for a list of weeks.
 * inlineYear: static mode prints "Jan 2026" at later January columns, since
 * there is no sticky year switching to show the year change.
 */
function buildStrip(weeks, { colors, maxDailyCount, inlineYear }) {
    let cells = '';
    let labels = '';
    let lastMonth = null;
    let lastLabelWeek = -Infinity;
    let labelCount = 0;

    weeks.forEach((week, weekIndex) => {
        const x = weekIndex * PITCH;
        const d = new Date(`${leadDay(week).date}T00:00:00Z`);
        const month = d.getUTCMonth();

        if (month !== lastMonth && d.getUTCDate() <= 7 && weekIndex - lastLabelWeek >= MIN_WEEKS_BETWEEN_MONTH_LABELS) {
            const text =
                inlineYear && month === 0 && labelCount > 0
                    ? `${MONTH_NAMES[month]} ${d.getUTCFullYear()}`
                    : MONTH_NAMES[month];
            labels += `<text x="${x}" y="${MONTH_LABEL_LOCAL_Y}" font-size="${LABEL_FONT_SIZE}" font-weight="600" fill="${colors.text}" fill-opacity="${LABEL_OPACITY}">${text}</text>`;
            lastMonth = month;
            lastLabelWeek = weekIndex;
            labelCount++;
        }

        week.forEach((day, dayIndex) => {
            if (!day.inRange) return; // padding cells are invisible, so skip them
            const level = levelForCount(day.count, maxDailyCount);
            cells += `<rect class="l${level}" x="${x}" y="${dayIndex * PITCH}" width="${CELL}" height="${CELL}" rx="2"/>`;
        });
    });

    return `${labels}${cells}`;
}

/** Week index where the sticky label switches to each new year (first January column). */
function computeYearSegments(weeks) {
    const segments = [];
    weeks.forEach((week, weekIndex) => {
        const d = new Date(`${leadDay(week).date}T00:00:00Z`);
        const year = d.getUTCFullYear();
        if (segments.length === 0) {
            segments.push({ year, startWeekIndex: 0 });
            return;
        }
        if (d.getUTCMonth() === 0 && year !== segments[segments.length - 1].year) {
            segments.push({ year, startWeekIndex: weekIndex });
        }
    });
    return segments;
}

function yearTextAttrs(colors) {
    return `x="${STICKY_YEAR_X}" y="${STICKY_YEAR_Y}" font-size="${LABEL_FONT_SIZE}" font-weight="700" fill="${colors.text}"`;
}

/**
 * Sticky year label: pinned to the card, switching year in sync with the
 * scroll via discrete opacity keyframes. Neighbouring segments share their
 * boundary keyTime, so exactly one year is visible at any moment.
 */
function buildAnimatedYearLabels({ weeks, colors, scrollDistance, scrollDuration, totalDuration }) {
    // A January column further right than the scroll distance never reaches the
    // left edge, so its year is never shown.
    const segments = computeYearSegments(weeks).filter(
        (s, i) => i === 0 || s.startWeekIndex * PITCH <= scrollDistance
    );
    const attrs = yearTextAttrs(colors);
    if (segments.length === 1) return `<text ${attrs}>${segments[0].year}</text>`;

    const keyTimeFor = (weekIndex) => {
        const t = scrollDuration * ((weekIndex * PITCH) / scrollDistance);
        return Math.min(Math.max(t / totalDuration, 0), 1);
    };

    return segments
        .map((segment, i) => {
            const startT = i === 0 ? 0 : keyTimeFor(segment.startWeekIndex);
            const endT = i === segments.length - 1 ? 1 : keyTimeFor(segments[i + 1].startWeekIndex);

            const keyTimes = [0];
            const values = [startT <= 0 ? '1' : '0'];
            if (startT > 0) {
                keyTimes.push(startT.toFixed(4));
                values.push('1');
            }
            if (endT < 1) {
                keyTimes.push(endT.toFixed(4));
                values.push('0');
            }
            if (Number(keyTimes[keyTimes.length - 1]) !== 1) {
                keyTimes.push('1');
                values.push(values[values.length - 1]);
            }

            return `<text ${attrs} opacity="${values[0]}">${segment.year}<animate attributeName="opacity" calcMode="discrete" begin="${INITIAL_DELAY_SEC}s" dur="${totalDuration.toFixed(1)}s" repeatCount="indefinite" keyTimes="${keyTimes.join(';')}" values="${values.join(';')}"/></text>`;
        })
        .join('');
}

/**
 * @param {object} o
 * @param {Array<Array<{date:string,count:number,inRange:boolean}>>} o.weeks
 * @param {object} o.params parseCommon() result (colors, mode, font, cardWidth, ...)
 * @param {number} o.speed scroll speed, px per second
 */
export function renderCalendar({ weeks, totalContributions, maxDailyCount, params, username = '', speed = 40 }) {
    const { colors, mode, font, borderRadius, hideBorder, disableAnimations, numberFormat, cardWidth: width } = params;
    const squares = SQUARES[mode === 'dark' ? 'dark' : 'light'];

    const height = TOP_PAD + 7 * PITCH + BOTTOM_PAD;
    const viewportWidth = Math.max(width - LEFT_OFFSET - RIGHT_PAD, 1);
    const stripWidth = Math.max(weeks.length * PITCH, 1);
    const scrollDistance = Math.max(stripWidth - viewportWidth, 0);
    const animate = !disableAnimations && scrollDistance > 0;

    // Static mode shows the most recent weeks that fit.
    let shown = weeks;
    if (!animate) {
        const visibleCols = Math.max(Math.floor((viewportWidth + GAP) / PITCH), 1);
        if (weeks.length > visibleCols) shown = weeks.slice(-visibleCols);
    }

    const strip = buildStrip(shown, { colors, maxDailyCount, inlineYear: !animate });

    const weekdayLabels = Object.entries(WEEKDAY_ROW_LABELS)
        .map(([row, label]) => {
            const y = TOP_PAD + Number(row) * PITCH + CELL;
            return `<text x="${PAD_X}" y="${y}" font-size="${LABEL_FONT_SIZE}" font-weight="600" fill="${colors.text}" fill-opacity="${LABEL_OPACITY}">${label}</text>`;
        })
        .join('');

    let yearLabel;
    let motion = '';
    if (animate) {
        const scrollDuration = Math.max(MIN_DURATION_SEC, scrollDistance / speed);
        const totalDuration = scrollDuration + PAUSE_SEC;
        const holdKeyTime = (scrollDuration / totalDuration).toFixed(4);
        const endX = LEFT_OFFSET - scrollDistance;

        yearLabel = buildAnimatedYearLabels({ weeks, colors, scrollDistance, scrollDuration, totalDuration });
        motion = `<animateTransform attributeName="transform" attributeType="XML" type="translate" calcMode="linear" begin="${INITIAL_DELAY_SEC}s" keyTimes="0;${holdKeyTime};1" values="${LEFT_OFFSET},${TOP_PAD};${endX},${TOP_PAD};${endX},${TOP_PAD}" dur="${totalDuration.toFixed(1)}s" repeatCount="indefinite"/>`;
    } else {
        const year = new Date(`${leadDay(shown[0]).date}T00:00:00Z`).getUTCFullYear();
        yearLabel = `<text ${yearTextAttrs(colors)}>${year}</text>`;
    }

    const caption = `${formatNumber(totalContributions, numberFormat)} contributions${username ? ` for ${username}` : ''}`;
    const bw = hideBorder ? 0 : 1;
    const inset = bw / 2;
    const border = bw > 0 ? ` stroke="${colors.border}" stroke-width="${bw}"` : '';
    const levelCss = squares.map((c, i) => `.l${i}{fill:${c}}`).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" font-family="${font}" role="img" aria-label="${escapeXml(caption)}" text-rendering="optimizeLegibility">
  <title>${escapeXml(caption)}</title>
  <style>${levelCss}</style>
  <rect x="${inset}" y="${inset}" width="${width - bw}" height="${height - bw}" rx="${borderRadius}" fill="${colors.bg}"${border}/>
  <clipPath id="viewport"><rect x="${LEFT_OFFSET}" y="0" width="${viewportWidth}" height="${height}"/></clipPath>
  <g>${weekdayLabels}</g>
  ${yearLabel}
  <g clip-path="url(#viewport)">
    <g transform="translate(${LEFT_OFFSET},${TOP_PAD})">
      <g shape-rendering="crispEdges">${strip}</g>
      ${motion}
    </g>
  </g>
</svg>`;
}
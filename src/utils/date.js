/**
 * Local-timezone date helpers.
 *
 * The backend stores `dateTime` as a UTC instant. The UI always works in the
 * browser's local timezone: a "date key" is a local calendar day (YYYY-MM-DD)
 * and every instant sent to the API is serialised with toISOString() (UTC, "Z").
 */

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar day of a Date as "YYYY-MM-DD". */
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local time of a Date as "HH:mm" (24h, for <input type="time">). */
export function toTimeValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "YYYY-MM-DD" -> Date at local midnight. */
export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Combines a local date key and "HH:mm" into a UTC ISO string for the API. */
export function toIsoDateTime(dateKey, time) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Calendar-day arithmetic (DST-safe because it uses local date parts). */
export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** Weeks start on Sunday, like Google Calendar's default. */
export function startOfWeek(date) {
  return addDays(startOfDay(date), -date.getDay());
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

/**
 * Visible day range for a calendar view. `end` is exclusive (local midnight of
 * the day after the last visible day). The month view always shows 6 full
 * weeks, so it includes trailing/leading days of neighbouring months.
 */
export function getViewRange(view, anchor) {
  if (view === 'day') {
    const start = startOfDay(anchor);
    return { start, end: addDays(start, 1) };
  }
  if (view === 'week') {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 7) };
  }
  const start = startOfWeek(startOfMonth(anchor));
  return { start, end: addDays(start, 42) };
}

/** List of Dates from start (inclusive) to end (exclusive). */
export function eachDay(start, end) {
  const days = [];
  for (let d = start; d < end; d = addDays(d, 1)) days.push(d);
  return days;
}

/**
 * Exact instants for an API range query. Sending ISO instants (instead of
 * date-only + a single tzOffset) keeps the range correct even when it spans a
 * daylight-saving change. The backend treats an ISO endDate as inclusive, so we
 * send 1 ms before the exclusive end.
 */
export function toApiRange(start, endExclusive) {
  return {
    startDate: start.toISOString(),
    endDate: new Date(endExclusive.getTime() - 1).toISOString(),
  };
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const longDateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const shortMonthDayFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const hourFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

export const formatTime = (value) => timeFmt.format(new Date(value));
export const formatDate = (value) => dateFmt.format(new Date(value));
export const formatLongDate = (value) => longDateFmt.format(new Date(value));
export const formatMonth = (value) => monthFmt.format(new Date(value));
export const formatShortMonthDay = (value) => shortMonthDayFmt.format(new Date(value));
export const formatWeekday = (value) => weekdayFmt.format(new Date(value));

/** Hour label for the time grid, e.g. "9 AM" in the user's locale. */
export const formatHour = (hour) => hourFmt.format(new Date(2024, 0, 1, hour));

/** Short weekday labels (Sun..Sat) in the user's locale. 2024-01-07 is a Sunday. */
export const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, i) => formatWeekday(new Date(2024, 0, 7 + i)));

/** Title shown in the calendar toolbar for the current view. */
export function formatRangeTitle(view, anchor) {
  if (view === 'month') return formatMonth(anchor);
  if (view === 'day') return formatLongDate(anchor);
  const { start, end } = getViewRange('week', anchor);
  const last = addDays(end, -1);
  if (start.getFullYear() !== last.getFullYear()) {
    return `${formatShortMonthDay(start)}, ${start.getFullYear()} – ${formatShortMonthDay(last)}, ${last.getFullYear()}`;
  }
  return `${formatShortMonthDay(start)} – ${formatShortMonthDay(last)}, ${last.getFullYear()}`;
}

/** Groups appointments by the local date key of their dateTime. */
export function groupByDateKey(appointments) {
  const map = new Map();
  for (const appt of appointments) {
    const key = toDateKey(new Date(appt.dateTime));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(appt);
  }
  return map;
}

/**
 * Date helpers.
 *
 * Pure dates (deadlines, due dates) are stored as 'YYYY-MM-DD' strings with
 * no time or timezone component. Every function here treats those strings
 * as LOCAL calendar dates — never parsed through `new Date(string)`, which
 * JavaScript interprets as UTC midnight and can silently shift a day
 * backwards depending on the viewer's timezone.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Format a Date as a local 'YYYY-MM-DD' key. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse a 'YYYY-MM-DD' key into a local Date at midnight. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, amount: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function addMonths(key: string, amount: number): string {
  const date = fromDateKey(key);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toDateKey(date);
}

export function isBefore(a: string, b: string): boolean {
  return a < b;
}

export function isAfter(a: string, b: string): boolean {
  return a > b;
}

export function daysBetween(a: string, b: string): number {
  const diff = fromDateKey(b).getTime() - fromDateKey(a).getTime();
  return Math.round(diff / DAY_MS);
}

export function isOverdue(dueDate: string | undefined, reference: string = todayKey()): boolean {
  if (!dueDate) return false;
  return dueDate < reference;
}

export function isDueToday(dueDate: string | undefined, reference: string = todayKey()): boolean {
  if (!dueDate) return false;
  return dueDate === reference;
}

export function weekdayShort(date: Date): string {
  return WEEKDAY_SHORT[date.getDay()];
}

export function weekdayLong(date: Date): string {
  return WEEKDAY_LONG[date.getDay()];
}

export function monthShort(date: Date): string {
  return MONTH_SHORT[date.getMonth()];
}

export function monthLong(date: Date): string {
  return MONTH_LONG[date.getMonth()];
}

/** "Today", "Tomorrow", "Yesterday", a weekday name within a week, or a short date. */
export function formatRelativeDate(key: string, reference: string = todayKey()): string {
  const diff = daysBetween(reference, key);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return weekdayLong(fromDateKey(key));
  if (diff < -1 && diff > -7) return `Last ${weekdayLong(fromDateKey(key))}`;
  const date = fromDateKey(key);
  const sameYear = date.getFullYear() === fromDateKey(reference).getFullYear();
  return sameYear
    ? `${monthShort(date)} ${date.getDate()}`
    : `${monthShort(date)} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatShortDate(key: string): string {
  const date = fromDateKey(key);
  return `${monthShort(date)} ${date.getDate()}`;
}

export function formatFullDate(key: string): string {
  const date = fromDateKey(key);
  return `${weekdayLong(date)}, ${monthLong(date)} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${period}`;
}

export function formatDateTimeLabel(key: string, time?: string): string {
  const dateLabel = formatRelativeDate(key);
  return time ? `${dateLabel} at ${formatTime(time)}` : dateLabel;
}

export function combineDateTime(dateKey: string, time?: string): Date {
  const date = fromDateKey(dateKey);
  if (time) {
    const [h, m] = time.split(':').map(Number);
    date.setHours(h, m, 0, 0);
  }
  return date;
}

/** Start of the week (Sunday) containing this date key. */
export function startOfWeekKey(key: string): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() - date.getDay());
  return toDateKey(date);
}

export interface CalendarDay {
  key: string;
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/** A 6-row x 7-col matrix of days for a month view, including padding days. `month` is 0-indexed. */
export function getMonthMatrix(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startDate = new Date(firstOfMonth);
  startDate.setDate(startDate.getDate() - firstOfMonth.getDay());

  const today = todayKey();
  const weeks: CalendarDay[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const key = toDateKey(cursor);
      week.push({
        key,
        date: new Date(cursor),
        inCurrentMonth: cursor.getMonth() === month,
        isToday: key === today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** The 7 days (Sun..Sat) for the week containing this date key. */
export function getWeekDays(key: string): CalendarDay[] {
  const start = fromDateKey(startOfWeekKey(key));
  const today = todayKey();
  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dayKey = toDateKey(d);
    days.push({ key: dayKey, date: d, inCurrentMonth: true, isToday: dayKey === today });
  }
  return days;
}

export function nowISO(): string {
  return new Date().toISOString();
}


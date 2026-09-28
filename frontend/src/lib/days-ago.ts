/** Philippine time is UTC+8 all year: no daylight saving to account for. */
const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const calendarDay = (time: number) => Math.floor((time + PHT_OFFSET_MS) / DAY_MS);

/**
 * How long ago something happened, in calendar days as they fall in Biliran.
 *
 * Days, not hours: the approval queue is worked once a day, and "yesterday"
 * is how a person would say it.
 */
export function daysAgo(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, calendarDay(now.getTime()) - calendarDay(new Date(iso).getTime()));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

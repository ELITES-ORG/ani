import { describe, expect, it } from 'vitest';
import { daysAgo } from './days-ago';

const NOW = new Date('2026-09-29T10:00:00+08:00');

describe('daysAgo', () => {
  it('says today for the same calendar day in the Philippines', () => {
    expect(daysAgo('2026-09-29T00:30:00+08:00', NOW)).toBe('today');
  });

  it('counts calendar days, not 24-hour periods', () => {
    // 11pm last night is yesterday, even though it is only eleven hours ago.
    expect(daysAgo('2026-09-28T23:00:00+08:00', NOW)).toBe('yesterday');
  });

  it('uses Philippine days, whatever the device clock zone', () => {
    // 20:00 UTC on the 28th is 04:00 on the 29th in Biliran: today.
    expect(daysAgo('2026-09-28T20:00:00Z', NOW)).toBe('today');
  });

  it('counts further back in days', () => {
    expect(daysAgo('2026-09-26T12:00:00+08:00', NOW)).toBe('3 days ago');
    expect(daysAgo('2026-08-30T12:00:00+08:00', NOW)).toBe('30 days ago');
  });

  it('treats a clock slightly ahead of the device as today, not the future', () => {
    expect(daysAgo('2026-09-29T10:05:00+08:00', NOW)).toBe('today');
  });
});

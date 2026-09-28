import { describe, expect, it } from 'vitest';
import { pendingQuery, reviewBody } from './admin.schema.js';

describe('reviewBody', () => {
  it('accepts an approval with no note', () => {
    expect(reviewBody.safeParse({ decision: 'approve' }).success).toBe(true);
  });

  it('accepts a rejection with a reason, trimmed', () => {
    const parsed = reviewBody.parse({ decision: 'reject', note: '  Barangay does not match  ' });
    expect(parsed).toEqual({ decision: 'reject', note: 'Barangay does not match' });
  });

  it('refuses a rejection with no reason', () => {
    // The person reads the reason and acts on it. Without one, rejection is a
    // dead end, which ADR 0020 rules out.
    expect(reviewBody.safeParse({ decision: 'reject' }).success).toBe(false);
  });

  it('refuses a rejection whose reason is only whitespace', () => {
    expect(reviewBody.safeParse({ decision: 'reject', note: '     ' }).success).toBe(false);
  });

  it('refuses an unknown decision', () => {
    expect(reviewBody.safeParse({ decision: 'suspend' }).success).toBe(false);
  });

  it('refuses a reason longer than 300 characters', () => {
    expect(reviewBody.safeParse({ decision: 'reject', note: 'x'.repeat(301) }).success).toBe(
      false,
    );
    expect(reviewBody.safeParse({ decision: 'reject', note: 'x'.repeat(300) }).success).toBe(true);
  });
});

describe('pendingQuery', () => {
  it('defaults to the first page of twenty', () => {
    expect(pendingQuery.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('caps the page size', () => {
    expect(pendingQuery.safeParse({ limit: '51' }).success).toBe(false);
  });
});

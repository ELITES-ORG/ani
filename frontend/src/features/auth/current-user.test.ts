import { describe, expect, it } from 'vitest';
import { withReviewDefaults, type CurrentUserResponse } from './current-user';

const BASE = {
  id: 'u1',
  username: 'juan',
  fullName: 'Juan Dela Cruz',
  name: { first: 'Juan', middle: null, last: 'Dela Cruz', suffix: null },
  phone: '+639171234567',
  home: null,
  isAdmin: false,
} satisfies Partial<CurrentUserResponse>;

describe('withReviewDefaults', () => {
  it('passes an API that knows about review through unchanged', () => {
    const user: CurrentUserResponse = {
      ...BASE,
      approval: { status: 'rejected', note: 'Barangay does not match' },
      vendor: { id: 'v1', farmName: 'Dela Cruz Farm', status: 'rejected', reviewNote: 'Blurry' },
    };
    expect(withReviewDefaults(user)).toEqual(user);
  });

  it('reads an API from before review as approved, because it refuses nobody', () => {
    // The deploy window: the new PWA is live, the old API is not yet replaced.
    const user: CurrentUserResponse = { ...BASE, vendor: null };
    expect(withReviewDefaults(user).approval).toEqual({ status: 'approved', note: null });
  });

  it('gives a farm from before review no reason', () => {
    const user: CurrentUserResponse = {
      ...BASE,
      vendor: { id: 'v1', farmName: 'Dela Cruz Farm', status: 'approved' },
    };
    expect(withReviewDefaults(user).vendor).toEqual({
      id: 'v1',
      farmName: 'Dela Cruz Farm',
      status: 'approved',
      reviewNote: null,
    });
  });
});

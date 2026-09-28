import { describe, expect, it } from 'vitest';
import { approvalCopy } from './approval-copy';

describe('approvalCopy', () => {
  it('tells a pending buyer their basket waits for them', () => {
    expect(approvalCopy('pending', 'order')).toEqual({
      title: 'We are checking your account',
      body: 'You can place this order once it is approved. Your basket is saved on this phone.',
    });
  });

  it('tells a pending seller what comes after approval', () => {
    expect(approvalCopy('pending', 'sell')).toEqual({
      title: 'We are checking your account',
      body: 'Once your account is approved you can register your farm.',
    });
  });

  it('says the same thing to a rejected account wherever it is blocked', () => {
    const expected = {
      title: 'Your account was not approved',
      body: 'Fix your details and send them for review again.',
    };
    expect(approvalCopy('rejected', 'order')).toEqual(expected);
    expect(approvalCopy('rejected', 'sell')).toEqual(expected);
  });
});

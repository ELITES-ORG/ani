import { describe, expect, it } from 'vitest';
import { formatPhone } from './phone';

describe('formatPhone', () => {
  it('groups a stored E.164 number the way people write it', () => {
    expect(formatPhone('+639179998888')).toBe('0917 999 8888');
    expect(formatPhone('+639171234567')).toBe('0917 123 4567');
  });

  it('shows anything unexpected exactly as stored rather than mangling it', () => {
    expect(formatPhone('+15551234567')).toBe('+15551234567');
    expect(formatPhone('')).toBe('');
    expect(formatPhone('not a number')).toBe('not a number');
  });
});

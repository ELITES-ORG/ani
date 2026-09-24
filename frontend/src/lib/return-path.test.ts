import { describe, expect, it } from 'vitest';
import { readReturnPath } from './return-path';

describe('readReturnPath', () => {
  it('returns an in-app path unchanged', () => {
    expect(readReturnPath('?next=/cart')).toBe('/cart');
  });

  it('defaults to home when next is missing', () => {
    expect(readReturnPath('')).toBe('/');
    expect(readReturnPath('?other=1')).toBe('/');
  });

  it('rejects a protocol-relative URL', () => {
    expect(readReturnPath('?next=//evil.com')).toBe('/');
  });

  it('rejects an absolute URL', () => {
    expect(readReturnPath('?next=https://evil.com')).toBe('/');
  });

  it('rejects a javascript: URL', () => {
    expect(readReturnPath('?next=javascript:alert(1)')).toBe('/');
  });
});

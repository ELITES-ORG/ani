import { describe, expect, it } from 'vitest';
import { readReturnPath } from './return-path';

/**
 * The origin these paths would resolve against in the browser. Used to assert
 * the *outcome* rather than just the return value: a path that looks in-app
 * but resolves off-site is the whole bug class this guards.
 */
const ORIGIN = 'https://ani.example';

const resolvesOffSite = (path: string): boolean => {
  try {
    return !new URL(path, ORIGIN).href.startsWith(ORIGIN + '/');
  } catch {
    return false;
  }
};

describe('readReturnPath', () => {
  it('returns an in-app path unchanged', () => {
    expect(readReturnPath('?next=/cart')).toBe('/cart');
    expect(readReturnPath('?next=/sell/register')).toBe('/sell/register');
  });

  it('keeps a query string and hash on the returned path', () => {
    expect(readReturnPath('?next=%2Forders%3Fstatus%3Dready')).toBe('/orders?status=ready');
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

  it('rejects a backslash, which the URL parser treats as a separator', () => {
    expect(readReturnPath('?next=' + encodeURIComponent('/\\evil.com'))).toBe('/');
    expect(readReturnPath('?next=' + encodeURIComponent('/\\/evil.com'))).toBe('/');
  });

  /**
   * The regression that prompted these. The URL parser strips these characters
   * before resolving, so each of the raw values below resolves to evil.com
   * despite starting with a single slash.
   */
  it.each([
    ['tab', '/\t/evil.com'],
    ['newline', '/\n//evil.com'],
    ['carriage return', '/\r//evil.com'],
  ])('rejects a path containing a %s', (_name, raw) => {
    // These three are the characters the URL spec strips before resolving, so
    // each input really does reach evil.com if it is let through.
    expect(resolvesOffSite(raw)).toBe(true);
    expect(readReturnPath('?next=' + encodeURIComponent(raw))).toBe('/');
  });

  it('rejects other control characters too, on principle', () => {
    // Null and DEL are not stripped by the URL parser, so they are not an
    // escape today. They have no business in a path either way.
    expect(readReturnPath('?next=' + encodeURIComponent('/\u0000//evil.com'))).toBe('/');
    expect(readReturnPath('?next=' + encodeURIComponent('/\u007f/x'))).toBe('/');
  });

  it('never returns something that resolves off-site', () => {
    const hostile = [
      '//evil.com',
      'https://evil.com',
      'javascript:alert(1)',
      '/\t/evil.com',
      '/\n//evil.com',
      '/\r//evil.com',
      '/\\evil.com',
      '/\\/evil.com',
      '\\\\evil.com',
    ];
    for (const raw of hostile) {
      expect(resolvesOffSite(readReturnPath('?next=' + encodeURIComponent(raw)))).toBe(false);
    }
  });
});
